import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { adId, senderTgId, receiverTgId, messageText, senderName } = await request.json();

    // Валидация
    if (!adId || !senderTgId || !receiverTgId || !messageText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Сохраняем сообщение в Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    // Сохраняем в базу данных
    const saveResponse = await fetch(`${supabaseUrl}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        ad_id: adId,
        sender_tg_id: senderTgId,
        receiver_tg_id: receiverTgId,
        message_text: messageText,
        is_read: false
      })
    });

    if (!saveResponse.ok) {
      const error = await saveResponse.text();
      console.error('Error saving message to Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    const savedMessage = await saveResponse.json();
    console.log('Message saved to database:', savedMessage);

    // Отправляем уведомление в Telegram бот
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.warn('TELEGRAM_BOT_TOKEN not configured, skipping notification');
      return NextResponse.json({
        success: true,
        message: 'Message saved but notification not sent (bot token missing)',
        data: savedMessage
      });
    }

    // Формируем текст уведомления
    const notificationText = `
🔔 <b>Новое сообщение на ваше объявление!</b>

От: ${senderName || 'Пользователь'}

💬 <i>"${messageText}"</i>

Нажмите кнопку ниже, чтобы ответить и начать приватный чат.
    `.trim();

    // Inline клавиатура с кнопкой "Создать чат"
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '💬 Создать приватный чат',
            callback_data: `create_chat_${adId}_${senderTgId}`
          }
        ],
        [
          {
            text: '📋 Просмотреть объявление',
            callback_data: `view_ad_${adId}`
          }
        ]
      ]
    };

    // Отправляем уведомление через Telegram Bot API
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: receiverTgId,
        text: notificationText,
        parse_mode: 'HTML',
        reply_markup: keyboard
      })
    });

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      console.error('Error sending Telegram notification:', telegramResult);
      return NextResponse.json({
        success: true,
        message: 'Message saved but notification failed',
        data: savedMessage,
        telegramError: telegramResult
      });
    }

    console.log('Telegram notification sent successfully');

    return NextResponse.json({
      success: true,
      message: 'Message sent and notification delivered',
      data: savedMessage
    });

  } catch (error) {
    console.error('Error in send-message API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint для получения сообщений пользователя
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tgId = searchParams.get('tg_id');

    if (!tgId) {
      return NextResponse.json(
        { error: 'tg_id parameter required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    // Получаем сообщения где пользователь - получатель или отправитель
    const response = await fetch(
      `${supabaseUrl}/rest/v1/messages?or=(sender_tg_id.eq.${tgId},receiver_tg_id.eq.${tgId})&order=created_at.desc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    const messages = await response.json();

    return NextResponse.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('Error in GET send-message API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
