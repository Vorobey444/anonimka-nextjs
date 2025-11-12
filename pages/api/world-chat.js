/**
 * API для мир-чата (общего чата для всех пользователей)
 * Позволяет отправлять и получать сообщения в общем чате
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

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
      // Получить сообщения из мир-чата
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      const type = req.query.type || 'world'; // Фильтр по типу (world/city/private)

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
        messages: messages.reverse(), // Возвращаем в хронологическом порядке
        total: messages.length
      });
    }

    if (req.method === 'POST') {
      // Отправить сообщение в мир-чат
      const { user_token, nickname, message, type = 'world', is_bot = false } = req.body;

      if (!user_token || !nickname || !message) {
        return res.status(400).json({
          success: false,
          error: 'user_token, nickname и message обязательны'
        });
      }

      // Проверка длины сообщения (ваша схема требует макс 50)
      if (message.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Сообщение слишком длинное (макс. 50 символов)'
        });
      }

      // Сохраняем сообщение
      const result = await sql`
        INSERT INTO world_chat_messages (user_token, nickname, message, type, is_bot)
        VALUES (${user_token}, ${nickname}, ${message}, ${type}, ${is_bot})
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
