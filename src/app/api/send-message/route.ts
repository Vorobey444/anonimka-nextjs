import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { adId, sender_token, receiver_token, messageText, photoUrl, senderName } = await request.json();

    // Валидация: должен быть либо текст, либо фото
    if (!adId || !sender_token || !receiver_token || (!messageText && !photoUrl)) {
      return NextResponse.json(
        { error: 'Не указаны обязательные поля. Нужно либо messageText, либо photoUrl.' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли уже чат по этому объявлению
    const { rows: existingChats } = await sql`
      SELECT * FROM private_chats
      WHERE ad_id = ${adId}
        AND (
          (user_token = ${sender_token} AND user_token_2 = ${receiver_token})
          OR (user_token = ${receiver_token} AND user_token_2 = ${sender_token})
        )
    `;
    if (existingChats.length > 0) {
      return NextResponse.json(
        { error: 'Вы уже отправили запрос на это объявление. Дождитесь принятия или отклонения.' },
        { status: 400 }
      );
    }

    // Создаём запись в private_chats
    const { rows: createdChatRows } = await sql`
      INSERT INTO private_chats (ad_id, user_token, user_token_2, accepted, initial_message, blocked_by)
      VALUES (${adId}, ${sender_token}, ${receiver_token}, false, ${messageText}, NULL)
      RETURNING *;
    `;
    const createdChat = createdChatRows[0];

    // Сохраняем сообщение
    const { rows: savedMessageRows } = await sql`
      INSERT INTO messages (ad_id, sender_token, receiver_token, message_text, photo_url, message_type, is_read)
      VALUES (${adId}, ${sender_token}, ${receiver_token}, ${messageText || null}, ${photoUrl || null}, ${photoUrl ? 'photo' : 'text'}, false)
      RETURNING *;
    `;
    const savedMessage = savedMessageRows[0];

    // Получаем nickname отправителя
    let senderNickname = senderName || 'Пользователь';
    const { rows: nicknameRows } = await sql`
      SELECT nickname FROM ads WHERE user_token = ${sender_token} LIMIT 1;
    `;
    if (nicknameRows.length > 0 && nicknameRows[0].nickname) {
      senderNickname = nicknameRows[0].nickname;
    }

    // Формируем текст уведомления
    const notificationText = photoUrl
      ? `🔔 <b>Новый запрос на чат по вашему объявлению!</b>\n\nОт: ${senderNickname}\n\n📷 <i>Фотография</i>${messageText ? `\n💬 <i>\"${messageText}\"</i>` : ''}\n\nОткройте приложение чтобы принять или отклонить запрос.`
      : `🔔 <b>Новый запрос на чат по вашему объявлению!</b>\n\nОт: ${senderNickname}\n\n💬 <i>\"${messageText}\"</i>\n\nОткройте приложение чтобы принять или отклонить запрос.`;

    // Inline клавиатура - ТОЛЬКО кнопка открытия приложения
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '📱 Открыть приложение',
            web_app: {
              url: `https://anonimka.online/webapp`
            }
          }
        ]
      ]
    };

    // Отправляем уведомление через Telegram Bot API
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({
        success: true,
        message: 'Сообщение сохранено, но уведомление не отправлено (нет bot token)',
        data: savedMessage
      });
    }
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: receiver_token,
        text: notificationText,
        parse_mode: 'HTML',
        reply_markup: keyboard
      })
    });
    const telegramResult = await telegramResponse.json();
    if (!telegramResult.ok) {
      return NextResponse.json({
        success: true,
        message: 'Сообщение сохранено, но уведомление не отправлено',
        data: savedMessage,
        telegramError: telegramResult
      });
    }
    return NextResponse.json({
      success: true,
      message: 'Сообщение отправлено и уведомление доставлено',
      data: savedMessage
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint для получения сообщений пользователя через Neon/Postgres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userToken = searchParams.get('user_token');

    if (!userToken) {
      return NextResponse.json(
        { error: 'user_token parameter required' },
        { status: 400 }
      );
    }

    // Получаем сообщения где пользователь - получатель или отправитель
    const { rows: messages } = await sql`
      SELECT * FROM messages
      WHERE sender_token = ${userToken} OR receiver_token = ${userToken}
      ORDER BY created_at DESC;
    `;

    return NextResponse.json({
      success: true,
      data: messages
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
