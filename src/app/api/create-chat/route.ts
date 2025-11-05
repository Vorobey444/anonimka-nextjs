import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { adId, senderTgId, receiverTgId } = await request.json();

    // Валидация
    if (!adId || !senderTgId || !receiverTgId) {
      return NextResponse.json(
        { error: 'Missing required fields: adId, senderTgId, receiverTgId' },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: 'Bot token not configured' },
        { status: 500 }
      );
    }
    // Создаем уникальный ID чата
    const chatId = `${Math.min(senderTgId, receiverTgId)}_${Math.max(senderTgId, receiverTgId)}_${adId}`;
    // Проверяем, существует ли уже такой чат
    const { rows: existingChats } = await sql`SELECT * FROM chats WHERE chat_id = ${chatId};`;
    let chatData;
    if (existingChats.length === 0) {
      // Чат не существует - создаем новый
      const { rows: createdChats } = await sql`INSERT INTO chats (chat_id, user1_tg_id, user2_tg_id, ad_id, is_active) VALUES (${chatId}, ${Math.min(senderTgId, receiverTgId)}, ${Math.max(senderTgId, receiverTgId)}, ${adId}, true) RETURNING *;`;
      chatData = createdChats[0];
    } else {
      // Чат уже существует
      chatData = existingChats[0];
    }
    // Получаем информацию об объявлении
    const { rows: ads } = await sql`SELECT title FROM ads WHERE id = ${adId} LIMIT 1;`;
    const adTitle = ads.length > 0 ? ads[0].title : 'Объявление';

    // Отправляем уведомления обоим участникам чата
    const sendNotificationToUser = async (userId: number, isInitiator: boolean) => {
      const message = isInitiator
        ? `✅ <b>Приватный чат создан!</b>\n\nПо объявлению: <i>${adTitle}</i>\n\nТеперь вы можете отправлять сообщения через бота. Просто напишите текст, и собеседник получит его.`
        : `🔔 <b>С вами хотят связаться!</b>\n\nПо объявлению: <i>${adTitle}</i>\n\nПриватный чат создан. Вы можете отвечать на сообщения через бота.`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '💬 Открыть чат',
              callback_data: `open_chat_${chatId}`
            }
          ],
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

      return fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: userId,
          text: message,
          parse_mode: 'HTML',
          reply_markup: keyboard
        })
      });
    };

    // Отправляем уведомления
    const [senderNotification, receiverNotification] = await Promise.allSettled([
      sendNotificationToUser(senderTgId, true),
      sendNotificationToUser(receiverTgId, false)
    ]);

    const notifications = {
      sender: senderNotification.status === 'fulfilled' ? 'sent' : 'failed',
      receiver: receiverNotification.status === 'fulfilled' ? 'sent' : 'failed'
    };

    console.log('Notifications sent:', notifications);

    return NextResponse.json({
      success: true,
      message: 'Chat created successfully',
      data: {
        chat: chatData,
        notifications
      }
    });

  } catch (error) {
    console.error('Error in create-chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint для получения информации о чате
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chat_id');
    const tgId = searchParams.get('tg_id');

    if (!chatId && !tgId) {
      return NextResponse.json(
        { error: 'Either chat_id or tg_id parameter required' },
        { status: 400 }
      );
    }

    let chats;
    if (chatId) {
      const result = await sql`SELECT * FROM chats WHERE chat_id = ${chatId};`;
      chats = result.rows;
    } else if (tgId) {
      const result = await sql`SELECT * FROM chats WHERE (user1_tg_id = ${tgId} OR user2_tg_id = ${tgId}) AND is_active = true;`;
      chats = result.rows;
    }
    return NextResponse.json({
      success: true,
      data: chats
    });

  } catch (error) {
    console.error('Error in GET create-chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
