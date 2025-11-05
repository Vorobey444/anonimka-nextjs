import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'check-existing': {
        const { user1, user2, adId } = params;
        const result = await sql`
          SELECT id, accepted, blocked_by 
          FROM private_chats 
          WHERE user1 = ${user1} AND user2 = ${user2} AND ad_id = ${adId}
          LIMIT 1
        `;
        return NextResponse.json({ data: result.rows[0] || null, error: null });
      }

      case 'create': {
        const { user1, user2, adId, message } = params;
        const result = await sql`
          INSERT INTO private_chats (user1, user2, ad_id, message, accepted)
          VALUES (${user1}, ${user2}, ${adId}, ${message || ''}, false)
          RETURNING *
        `;
        return NextResponse.json({ data: result.rows[0], error: null });
      }

      case 'get-pending': {
        const { userId } = params;
        const result = await sql`
          SELECT 
            pc.*,
            u.is_premium as sender_is_premium,
            (
              SELECT sender_nickname
              FROM messages
              WHERE chat_id = pc.id
              ORDER BY created_at DESC
              LIMIT 1
            ) as sender_nickname,
            (
              SELECT message
              FROM messages
              WHERE chat_id = pc.id
              ORDER BY created_at DESC
              LIMIT 1
            ) as last_message_text
          FROM private_chats pc
          LEFT JOIN users u ON (
            CASE 
              WHEN pc.user1 = ${userId} THEN pc.user2 = u.id
              ELSE pc.user1 = u.id
            END
          )
          WHERE user2 = ${userId} 
            AND accepted = false 
            AND blocked_by IS NULL
          ORDER BY created_at DESC
        `;
        return NextResponse.json({ data: result.rows, error: null });
      }

      case 'get-active': {
        const { userId } = params;
        const result = await sql`
          SELECT 
            pc.*,
            (
              SELECT message 
              FROM messages 
              WHERE chat_id = pc.id 
              ORDER BY created_at DESC 
              LIMIT 1
            ) as last_message,
            (
              SELECT created_at 
              FROM messages 
              WHERE chat_id = pc.id 
              ORDER BY created_at DESC 
              LIMIT 1
            ) as last_message_time,
            (
              SELECT COUNT(*) 
              FROM messages 
              WHERE chat_id = pc.id 
                AND recipient_id = ${userId}
                AND delivered = false
            )::int as unread_count
          FROM private_chats pc
          WHERE (user1 = ${userId} OR user2 = ${userId})
            AND accepted = true 
            AND blocked_by IS NULL
          ORDER BY last_message_time DESC NULLS LAST, pc.created_at DESC
        `;
        return NextResponse.json({ data: result.rows, error: null });
      }

      case 'accept': {
        const { chatId, userId } = params;
        const result = await sql`
          UPDATE private_chats 
          SET accepted = true 
          WHERE id = ${chatId} AND user2 = ${userId}
          RETURNING *
        `;
        return NextResponse.json({ data: result.rows[0], error: null });
      }

      case 'reject': {
        const { chatId, userId } = params;
        const result = await sql`
          DELETE FROM private_chats 
          WHERE id = ${chatId} AND user2 = ${userId}
          RETURNING *
        `;
        return NextResponse.json({ data: result.rows[0], error: null });
      }

      case 'count-requests': {
        const { userId } = params;
        const result = await sql`
          SELECT COUNT(*) as count 
          FROM private_chats 
          WHERE user2 = ${userId} 
            AND accepted = false 
            AND blocked_by IS NULL
        `;
        return NextResponse.json({ data: { count: parseInt(result.rows[0].count) }, error: null });
      }

      case 'delete-chat': {
        const { chatId, userId } = params;
        
        if (!chatId || !userId) {
          return NextResponse.json(
            { error: { message: 'Параметры не указаны' } },
            { status: 400 }
          );
        }
        
        // Проверяем, что пользователь является участником чата
        const chatCheck = await sql`
          SELECT id FROM private_chats
          WHERE id = ${chatId}
            AND (user1 = ${userId} OR user2 = ${userId})
        `;
        
        if (chatCheck.rows.length === 0) {
          return NextResponse.json(
            { error: { message: 'Чат не найден или доступ запрещен' } },
            { status: 404 }
          );
        }
        
        // Удаляем все сообщения чата
        await sql`
          DELETE FROM messages WHERE chat_id = ${chatId}
        `;
        
        // Удаляем сам чат
        const result = await sql`
          DELETE FROM private_chats WHERE id = ${chatId}
          RETURNING *
        `;
        
        console.log('[NEON-CHATS] Чат удален:', chatId);
        return NextResponse.json({ data: result.rows[0], error: null });
      }

      default:
        return NextResponse.json(
          { error: { message: 'Unknown action' } },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Neon DB error:', error);
    return NextResponse.json(
      { data: null, error: { message: error.message } },
      { status: 500 }
    );
  }
}
