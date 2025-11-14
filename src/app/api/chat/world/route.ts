import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

// POST - Сохранить сообщение в общий чат
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, userId, userToken, message, photoUrl } = body;

    if (!nickname || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Сохраняем сообщение
    const result = await sql`
      INSERT INTO world_chat_messages (nickname, user_id, user_token, message, photo_url)
      VALUES (${nickname}, ${userId || null}, ${userToken || null}, ${message}, ${photoUrl || null})
      RETURNING id, created_at
    `;

    return NextResponse.json({ 
      success: true,
      messageId: result.rows[0].id,
      timestamp: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Error saving chat message:', error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}

// GET - Получить историю чата (последние N сообщений или для конкретного пользователя)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId');
    const userToken = searchParams.get('userToken');
    const lastMessageId = searchParams.get('lastMessageId');

    let messages;

    if (userId || userToken) {
      // Получаем сообщения конкретного пользователя (для модерации)
      if (userId) {
        messages = await sql`
          SELECT * FROM world_chat_messages
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT ${limit}
        `;
      } else {
        messages = await sql`
          SELECT * FROM world_chat_messages
          WHERE user_token = ${userToken}
          ORDER BY created_at DESC
          LIMIT ${limit}
        `;
      }
    } else if (lastMessageId) {
      // Получаем сообщения после определенного ID (для подгрузки истории)
      messages = await sql`
        SELECT * FROM world_chat_messages
        WHERE id < ${parseInt(lastMessageId)}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else {
      // Получаем последние сообщения
      messages = await sql`
        SELECT * FROM world_chat_messages
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    return NextResponse.json({ 
      messages: messages.rows.reverse() // Возвращаем в хронологическом порядке
    });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
  }
}

// Получить последние N сообщений между двумя пользователями для жалобы
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
