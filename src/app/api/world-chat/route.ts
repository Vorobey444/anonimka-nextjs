import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

const getSql = () => neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;
    
    console.log('World chat API request:', { action, params });
    
    if (!params) {
      return NextResponse.json(
        { success: false, error: 'Missing params' },
        { status: 400 }
      );
    }
    
    if (action === 'get-messages') {
      // Получение сообщений из БД
      const { tab, userToken, userCity } = params;
      
      if (!tab) {
        return NextResponse.json(
          { success: false, error: 'Missing tab parameter' },
          { status: 400 }
        );
      }
      
      const sql = getSql();
      
      let messages;
      
      if (tab === 'world') {
        // Мировой чат - все сообщения типа 'world'
        messages = await sql`
          SELECT id, user_token, display_nickname as nickname, message, type, 
                 location_city, is_premium, created_at
          FROM world_chat_messages
          WHERE type = 'world'
          ORDER BY created_at DESC
          LIMIT 100
        `;
      } else if (tab === 'city') {
        // Городской чат - сообщения типа 'city' из этого города
        messages = await sql`
          SELECT id, user_token, display_nickname as nickname, message, type, 
                 location_city, is_premium, created_at
          FROM world_chat_messages
          WHERE type = 'city' 
            AND location_city = ${userCity}
          ORDER BY created_at DESC
          LIMIT 100
        `;
      } else if (tab === 'private') {
        // Личные сообщения - где пользователь отправитель или получатель
        messages = await sql`
          SELECT id, user_token, display_nickname as nickname, message, type, 
                 target_user_token, target_display_nickname as target_nickname,
                 location_city, is_premium, created_at
          FROM world_chat_messages
          WHERE type = 'private'
            AND (user_token = ${userToken} OR target_user_token = ${userToken})
          ORDER BY created_at DESC
          LIMIT 100
        `;
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid tab' },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: messages.reverse() // От старых к новым
      });
      
    } else if (action === 'send-message') {
      // Отправка сообщения
      const { tab, message, userToken, nickname, userCity, isPremium, targetUserToken, targetNickname } = params;
      const sql = getSql();
      
      // Вставка сообщения в БД
      const result = await sql`
        INSERT INTO world_chat_messages 
          (user_token, display_nickname, message, type, target_user_token, target_display_nickname, 
           location_city, is_premium, created_at)
        VALUES 
          (${userToken}, ${nickname}, ${message}, ${tab}, 
           ${targetUserToken || null}, ${targetNickname || null}, 
           ${userCity}, ${isPremium || false}, NOW())
        RETURNING id, created_at
      `;
      
      return NextResponse.json({
        success: true,
        message: 'Message sent',
        messageId: result[0].id
      });
      
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('World chat API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
