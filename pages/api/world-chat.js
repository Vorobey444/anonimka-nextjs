/**
 * API для мир-чата (общего чата для всех пользователей)
 * Поддерживает два формата:
 * 1. Новый (для ботов): GET ?type=world, POST {user_token, nickname, message}
 * 2. Старый (для фронтенда): POST {action, params}
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Новый формат для ботов - простой GET запрос
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      const type = req.query.type || 'world';

      const messages = await sql`
        SELECT 
          id,
          user_token as "userToken",
          nickname,
          message,
          type,
          is_bot as "isBot",
          is_premium as "isPremium",
          created_at as "createdAt"
        FROM world_chat_messages
        WHERE type = ${type}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      return res.status(200).json({
        success: true,
        messages: messages.reverse(),
        total: messages.length
      });
    }

    if (req.method === 'POST') {
      const body = req.body;
      
      // Проверяем какой формат используется
      if (body.action) {
        // СТАРЫЙ формат (для фронтенда) - с action/params
        return await handleLegacyFormat(body, res);
      } else {
        // НОВЫЙ формат (для ботов) - прямые поля
        return await handleNewFormat(body, res);
      }
    }

    return res.status(405).json({
      success: false,
      error: 'Метод не поддерживается'
    });

  } catch (error) {
    console.error('❌ Ошибка в world-chat API:', error);
    return res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
}

// НОВЫЙ формат (для ботов)
async function handleNewFormat(body, res) {
  const { user_token, nickname, message, type = 'world', is_bot = false } = body;

  if (!user_token || !nickname || !message) {
    return res.status(400).json({
      success: false,
      error: 'user_token, nickname и message обязательны'
    });
  }

  // Бот сам добавляет префикс, не дублируем его
  const finalMessage = message;

  if (finalMessage.length > 50) {
    return res.status(400).json({
      success: false,
      error: 'Сообщение слишком длинное (макс. 50 символов)'
    });
  }

  const result = await sql`
    INSERT INTO world_chat_messages (user_token, nickname, message, type, is_bot)
    VALUES (${user_token}, ${nickname}, ${finalMessage}, ${type}, ${is_bot})
    RETURNING 
      id,
      user_token as "userToken",
      nickname,
      message,
      type,
      is_bot as "isBot",
      created_at as "createdAt"
  `;

  return res.status(200).json({
    success: true,
    message: result[0]
  });
}

// СТАРЫЙ формат (для фронтенда) - поддержка action/params
async function handleLegacyFormat(body, res) {
  const { action, params } = body;

  switch (action) {
    case 'get-messages':
      return await getMessages(params, res);
    case 'send-message':
      return await sendMessage(params, res);
    case 'get-last-message':
      return await getLastMessage(res);
    default:
      return res.status(400).json({
        success: false,
        error: 'Unknown action'
      });
  }
}

// Получить сообщения с фильтрацией по вкладкам
async function getMessages(params, res) {
  const { tab, userToken, userCity } = params;
  
  let query;
  let queryParams = [];

  if (tab === 'world') {
    // Вкладка "Мир" - мировые @ + городские & текущего города + свои ЛС
    const result = await sql`
      SELECT id, user_token, nickname, message, type, target_user_token, target_nickname, 
             location_city, is_premium, is_bot, created_at
      FROM world_chat_messages
      WHERE (
        type = 'world'
        OR (type = 'city' AND location_city = ${userCity})
        OR (type = 'private' AND (target_user_token = ${userToken} OR user_token = ${userToken}))
      )
      AND user_token NOT IN (
        SELECT blocked_token FROM user_blocks WHERE blocker_token = ${userToken}
      )
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    return res.status(200).json({
      success: true,
      data: result.reverse()
    });
  } else if (tab === 'city') {
    // Вкладка "Город" - городские + ЛС
    const result = await sql`
      SELECT id, user_token, nickname, message, type, target_user_token, target_nickname,
             location_city, is_premium, is_bot, created_at
      FROM world_chat_messages
      WHERE (
        (type = 'city' AND location_city = ${userCity})
        OR (type = 'private' AND (target_user_token = ${userToken} OR user_token = ${userToken}))
      )
      AND user_token NOT IN (
        SELECT blocked_token FROM user_blocks WHERE blocker_token = ${userToken}
      )
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    return res.status(200).json({
      success: true,
      data: result.reverse()
    });
  } else if (tab === 'private') {
    // Вкладка "ЛС" - только личные сообщения
    const result = await sql`
      SELECT id, user_token, nickname, message, type, target_user_token, target_nickname,
             location_city, is_premium, is_bot, created_at
      FROM world_chat_messages
      WHERE type = 'private' AND (target_user_token = ${userToken} OR user_token = ${userToken})
      AND user_token NOT IN (
        SELECT blocked_token FROM user_blocks WHERE blocker_token = ${userToken}
      )
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    return res.status(200).json({
      success: true,
      data: result.reverse()
    });
  }
}

// Отправить сообщение (старый формат)
async function sendMessage(params, res) {
  const { userToken, nickname, message, isPremium, city } = params;

  if (!message || message.length > 50) {
    return res.status(400).json({
      success: false,
      error: 'Сообщение должно быть от 1 до 50 символов'
    });
  }

  // Определяем тип по префиксу
  let type = 'world';
  let cleanMessage = message;
  let targetUserToken = null;
  let targetNickname = null;
  let locationCity = null;

  if (message.startsWith('@')) {
    type = 'world';
    cleanMessage = message.slice(1).trim();
  } else if (message.startsWith('&')) {
    type = 'city';
    cleanMessage = message.slice(1).trim();
    locationCity = city || null;
  } else if (message.startsWith('/')) {
    type = 'private';
    const match = message.match(/^\/(\S+)\s+(.+)$/);
    if (!match) {
      return res.status(400).json({
        success: false,
        error: 'Формат личного сообщения: /никнейм текст'
      });
    }
    
    targetNickname = match[1];
    cleanMessage = match[2];

    const targetUserResult = await sql`
      SELECT DISTINCT user_token FROM ads WHERE nickname = ${targetNickname} LIMIT 1
    `;

    if (targetUserResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Пользователь ${targetNickname} не найден`
      });
    }

    targetUserToken = targetUserResult[0].user_token;
  }

  // Проверка таймаута (только для world и city)
  if (type === 'world' || type === 'city') {
    const lastMessageResult = await sql`
      SELECT created_at FROM world_chat_messages 
      WHERE user_token = ${userToken} AND type IN ('world', 'city')
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    if (lastMessageResult.length > 0) {
      const lastMessageTime = new Date(lastMessageResult[0].created_at);
      const now = new Date();
      const diffSeconds = (now.getTime() - lastMessageTime.getTime()) / 1000;

      if (diffSeconds < 30) {
        const remainingTime = Math.ceil(30 - diffSeconds);
        return res.status(429).json({
          success: false,
          error: `Попробуйте через ${remainingTime} сек`
        });
      }
    }
  }

  // Вставляем сообщение
  const insertResult = await sql`
    INSERT INTO world_chat_messages 
    (user_token, nickname, message, type, target_user_token, target_nickname, location_city, is_premium)
    VALUES (${userToken}, ${nickname}, ${cleanMessage}, ${type}, ${targetUserToken}, ${targetNickname}, ${locationCity}, ${isPremium})
    RETURNING *
  `;

  return res.status(200).json({ 
    success: true, 
    data: insertResult[0] 
  });
}

// Получить последнее сообщение для превью
async function getLastMessage(res) {
  const result = await sql`
    SELECT nickname, message, created_at
    FROM world_chat_messages
    WHERE type = 'world'
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (result.length === 0) {
    return res.status(200).json({ 
      success: true, 
      data: { nickname: 'Мир чат', message: 'Начните мировое общение с @!', created_at: new Date() } 
    });
  }

  return res.status(200).json({ 
    success: true, 
    data: result[0] 
  });
}
