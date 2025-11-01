import { NextRequest, NextResponse } from 'next/server';

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

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return NextResponse.json(
        { error: 'Bot token not configured' },
        { status: 500 }
      );
    }

    // Создаем уникальный ID чата
    const chatId = `${Math.min(senderTgId, receiverTgId)}_${Math.max(senderTgId, receiverTgId)}_${adId}`;

    // Проверяем, существует ли уже такой чат
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/chats?chat_id=eq.${chatId}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    const existingChats = await checkResponse.json();
    
    if (!Array.isArray(existingChats)) {
      console.error('Unexpected response format from Supabase:', existingChats);
      return NextResponse.json(
        { error: 'Database query error' },
        { status: 500 }
      );
    }

    let chatData;

    if (existingChats.length === 0) {
      // Чат не существует - создаем новый
      const createResponse = await fetch(`${supabaseUrl}/rest/v1/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          chat_id: chatId,
          user1_tg_id: Math.min(senderTgId, receiverTgId),
          user2_tg_id: Math.max(senderTgId, receiverTgId),
          ad_id: adId,
          is_active: true
        })
      });

      if (!createResponse.ok) {
        const error = await createResponse.text();
        console.error('Error creating chat in Supabase:', error);
        return NextResponse.json(
          { error: 'Failed to create chat' },
          { status: 500 }
        );
      }

      const createdChats = await createResponse.json();
      chatData = Array.isArray(createdChats) ? createdChats[0] : createdChats;
      console.log('New chat created:', chatData);
    } else {
      // Чат уже существует
      chatData = existingChats[0];
      console.log('Chat already exists:', chatData);
    }

    // Получаем информацию об объявлении
    const adResponse = await fetch(
      `${supabaseUrl}/rest/v1/ads?id=eq.${adId}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    const ads = await adResponse.json();
    const adTitle = Array.isArray(ads) && ads.length > 0 ? ads[0].title : 'Объявление';

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

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    let query = `${supabaseUrl}/rest/v1/chats?`;
    
    if (chatId) {
      query += `chat_id=eq.${chatId}`;
    } else if (tgId) {
      query += `or=(user1_tg_id.eq.${tgId},user2_tg_id.eq.${tgId})&is_active=eq.true`;
    }

    const response = await fetch(query, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error fetching chat:', error);
      return NextResponse.json(
        { error: 'Failed to fetch chat' },
        { status: 500 }
      );
    }

    const chats = await response.json();

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
