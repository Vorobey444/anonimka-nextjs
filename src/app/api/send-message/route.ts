import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
  const { adId, sender_token, receiver_token, messageText, photoUrl, senderName } = await request.json();

    // Валидация: должен быть либо текст, либо фото
    if (!adId || !sender_token || !receiver_token || (!messageText && !photoUrl)) {
      return NextResponse.json(
        { error: 'Missing required fields. Need either messageText or photoUrl' },
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

    // Проверяем, существует ли уже чат по этому объявлению
  console.log(`🔍 Проверяем существующий чат: ad_id=${adId}, sender=${sender_token}, receiver=${receiver_token}`);
    
    const checkChatResponse = await fetch(
  `${supabaseUrl}/rest/v1/private_chats?ad_id=eq.${adId}&or=(and(user_token.eq.${sender_token},user_token.eq.${receiver_token}),and(user_token.eq.${receiver_token},user_token.eq.${sender_token}))`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    const existingChats = await checkChatResponse.json();
    console.log('🔍 Найдено существующих чатов:', existingChats?.length || 0, existingChats);
    
    if (existingChats && existingChats.length > 0) {
      console.log('⚠️ Chat already exists for this ad:', existingChats[0]);
      return NextResponse.json(
        { error: 'Вы уже отправили запрос на это объявление. Дождитесь принятия или отклонения запроса.' },
        { status: 400 }
      );
    }

    // Создаем запись в таблице private_chats (статус: pending)
    const createChatResponse = await fetch(`${supabaseUrl}/rest/v1/private_chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        ad_id: adId,
        user_token: sender_token,
        user_token_2: receiver_token,
        accepted: false,
        initial_message: messageText,
        blocked_by: null
      })
    });

    if (!createChatResponse.ok) {
      const error = await createChatResponse.text();
      console.error('Error creating chat in Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to create chat request' },
        { status: 500 }
      );
    }

    const createdChat = await createChatResponse.json();
    console.log('Chat request created:', createdChat);

    // Сохраняем сообщение в базу данных
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
        sender_token: sender_token,
        receiver_token: receiver_token,
        message_text: messageText || null,
        photo_url: photoUrl || null,
        message_type: photoUrl ? 'photo' : 'text',
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

    // Получаем nickname отправителя из базы
    let senderNickname = senderName || 'Пользователь';
    
    const nicknameResponse = await fetch(
      `${supabaseUrl}/rest/v1/ads?user_token=eq.${sender_token}&select=nickname&limit=1`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    
    if (nicknameResponse.ok) {
      const nicknameData = await nicknameResponse.json();
      if (nicknameData && nicknameData.length > 0 && nicknameData[0].nickname) {
        senderNickname = nicknameData[0].nickname;
        console.log('Using nickname from database:', senderNickname);
      }
    }

    // Формируем текст уведомления
    const notificationText = photoUrl 
      ? `
🔔 <b>Новый запрос на чат по вашему объявлению!</b>

От: ${senderNickname}

📷 <i>Фотография</i>
${messageText ? `\n💬 <i>"${messageText}"</i>` : ''}

Откройте приложение чтобы принять или отклонить запрос.
    `.trim()
      : `
🔔 <b>Новый запрос на чат по вашему объявлению!</b>

От: ${senderNickname}

💬 <i>"${messageText}"</i>

Откройте приложение чтобы принять или отклонить запрос.
    `.trim();

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
