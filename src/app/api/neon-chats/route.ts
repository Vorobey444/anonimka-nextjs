import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'check-existing': {
        const { user1_token, user2_token, adId } = params;
        const result = await sql`
          SELECT id, accepted, blocked_by 
          FROM private_chats 
          WHERE user_token_1 = ${user1_token} AND user_token_2 = ${user2_token} AND ad_id = ${adId}
          LIMIT 1
        `;
        return NextResponse.json({ data: result.rows[0] || null, error: null });
      }

      case 'create': {
        const { user1_token, user2_token, adId, message } = params;
        const result = await sql`
          INSERT INTO private_chats (user_token_1, user_token_2, ad_id, message, accepted)
          VALUES (${user1_token}, ${user2_token}, ${adId}, ${message || ''}, false)
          RETURNING *
        `;
        return NextResponse.json({ data: result.rows[0], error: null });
      }

      case 'get-pending': {
        const { user_token, userId } = params as any;
        // Поддержка обоих форматов для обратной совместимости
        const userIdentifier = userId ?? user_token;
        if (!userIdentifier) {
          return NextResponse.json(
            { error: { message: 'userId/user_token не указан' } },
            { status: 400 }
          );
        }
        const result = await sql`
          SELECT pc.*,
            (SELECT sender_nickname FROM messages WHERE chat_id = pc.id ORDER BY created_at DESC LIMIT 1) as sender_nickname,
            (SELECT message FROM messages WHERE chat_id = pc.id ORDER BY created_at DESC LIMIT 1) as last_message_text,
            -- токен оппонента (создателя запроса) теперь уже в user_token_1
            pc.user_token_1 as opponent_token
          FROM private_chats pc
          WHERE user_token_2 = ${userIdentifier}
            AND accepted = false
          ORDER BY pc.created_at DESC
        `;
        return NextResponse.json({ data: result.rows, error: null });
      }

      case 'get-active': {
        const { userId } = params;
        if (!userId) {
          return NextResponse.json(
            { error: { message: 'userId не указан' } },
            { status: 400 }
          );
        }
        
        console.log('[GET-ACTIVE] userId:', userId);
        
        // ДИАГНОСТИКА - проверяем сообщения в чате #3 ПЕРЕД основным запросом
        const diagnosticMessages = await sql`
          SELECT id, chat_id, sender_token, message, read, delivered, created_at
          FROM messages
          WHERE chat_id = 3
          ORDER BY created_at DESC
          LIMIT 10
        `;
        console.log('[GET-ACTIVE DIAGNOSTIC] All messages in chat #3:', diagnosticMessages.rows.map(m => ({
          id: m.id,
          sender: m.sender_token?.substring(0, 10),
          read: m.read,
          delivered: m.delivered,
          msg: m.message?.substring(0, 20),
          time: m.created_at
        })));
        
        // Проверяем: какие сообщения должны считаться непрочитанными
        const shouldBeUnread = await sql`
          SELECT COUNT(*) as count
          FROM messages
          WHERE chat_id = 3
            AND sender_token != ${userId}
            AND read = false
        `;
        console.log('[GET-ACTIVE DIAGNOSTIC] Messages that should be unread for userId', userId.substring(0, 10), ':', shouldBeUnread.rows[0].count);
        
        const result = await sql`
          SELECT pc.*,
            (SELECT message FROM messages WHERE chat_id = pc.id ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM messages WHERE chat_id = pc.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
            (SELECT COUNT(*) FROM messages WHERE chat_id = pc.id AND sender_token != ${userId} AND read = false) as unread_count,
            CASE WHEN ${userId} = pc.user_token_1 THEN 'user1' ELSE 'user2' END as my_role,
            CASE 
              WHEN ${userId} = pc.user_token_1 THEN pc.user_token_2
              ELSE pc.user_token_1
            END as opponent_token
          FROM private_chats pc
          WHERE (user_token_1 = ${userId} OR user_token_2 = ${userId})
            AND accepted = true
            AND blocked_by IS NULL
          ORDER BY pc.created_at DESC
        `;
        
        console.log('[GET-ACTIVE] Found chats:', result.rows.length);
        
        // Для каждого чата проверяем детали непрочитанных
        for (const chat of result.rows) {
          const debugMessages = await sql`
            SELECT id, sender_token, message, read, created_at
            FROM messages 
            WHERE chat_id = ${chat.id}
            ORDER BY created_at DESC
            LIMIT 3
          `;
          console.log(`[GET-ACTIVE] Chat ${chat.id}: unread=${chat.unread_count}, messages:`, 
            debugMessages.rows.map(m => ({
              id: m.id,
              sender: m.sender_token?.substring(0, 10),
              read: m.read,
              msg: m.message?.substring(0, 20)
            }))
          );
        }
        
        return NextResponse.json({ data: result.rows, error: null });
      }

      case 'accept': {
        const { chatId, userId } = params;
        
        // Сначала получаем информацию о чате и первоначальное сообщение
        const chatInfo = await sql`
          SELECT * FROM private_chats 
          WHERE id = ${chatId} AND user_token_2 = ${userId}
        `;
        
        if (chatInfo.rows.length === 0) {
          return NextResponse.json(
            { error: { message: 'Чат не найден' } },
            { status: 404 }
          );
        }
        
        const chat = chatInfo.rows[0];
        
        // Если есть первоначальное сообщение, сохраняем его в таблицу messages
        if (chat.message && chat.message.trim()) {
          await sql`
            INSERT INTO messages (chat_id, sender_token, message, created_at)
            VALUES (${chatId}, ${chat.user_token_1}, ${chat.message}, ${chat.created_at})
          `;
        }
        
        // Обновляем статус чата на принятый
        const result = await sql`
          UPDATE private_chats 
          SET accepted = true 
          WHERE id = ${chatId} AND user_token_2 = ${userId}
          RETURNING *
        `;
        
        return NextResponse.json({ data: result.rows[0], error: null });
      }

      case 'reject': {
        const { chatId, userId } = params;
        const result = await sql`
          DELETE FROM private_chats 
          WHERE id = ${chatId} AND user_token_2 = ${userId}
          RETURNING *
        `;
        return NextResponse.json({ data: result.rows[0], error: null });
      }

      case 'count-requests': {
        const { userId } = params;
        const result = await sql`
          SELECT COUNT(*) as count 
          FROM private_chats 
          WHERE user_token_2 = ${userId} 
            AND accepted = false 
            AND blocked_by IS NULL
        `;
        return NextResponse.json({ data: { count: parseInt(result.rows[0].count) }, error: null });
      }

      case 'get-ad-from-chat': {
        const { adId } = params;
        const result = await sql`
          SELECT a.* FROM private_chats pc
          JOIN ads a ON a.id = pc.ad_id
          WHERE pc.ad_id = ${adId}
          LIMIT 1
        `;
        return NextResponse.json({ data: result.rows[0] || null, error: null });
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
            AND (user_token_1 = ${userId} OR user_token_2 = ${userId})
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

      case 'get-ad-from-chat': {
        const { adId } = params;
        
        if (!adId) {
          return NextResponse.json(
            { error: { message: 'adId не указан' } },
            { status: 400 }
          );
        }
        
        // Получаем информацию об анкете из таблицы чатов
        // Это позволяет показывать анкету даже если она удалена из таблицы ads
        const result = await sql`
          SELECT 
            pc.ad_id,
            ads.gender,
            ads.target,
            ads.goal,
            ads.age_from,
            ads.age_to,
            ads.my_age,
            ads.body_type,
            ads.text,
            ads.city,
            ads.country
          FROM private_chats pc
          LEFT JOIN ads ON ads.id = pc.ad_id
          WHERE pc.ad_id = ${adId}
          LIMIT 1
        `;
        
        if (result.rows.length === 0) {
          return NextResponse.json(
            { error: { message: 'Информация об анкете не найдена' } },
            { status: 404 }
          );
        }
        
        // Возвращаем данные анкеты (из ads если она существует, иначе NULL)
        const adData = result.rows[0];
        
        if (!adData.gender) {
          // Если ads уже удалена, информации об анкете нет
          return NextResponse.json(
            { error: { message: 'Анкета была удалена и информация о ней недоступна' } },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ data: adData, error: null });
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
