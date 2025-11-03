import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      // Получить все сообщения чата
      case 'get-messages': {
        const { chatId } = params;
        const result = await sql`
          SELECT m.*, 
            pc.user1, 
            pc.user2,
            pc.ad_id
          FROM messages m
          JOIN private_chats pc ON m.chat_id = pc.id
          WHERE m.chat_id = ${chatId}
          ORDER BY m.created_at ASC
        `;
        return NextResponse.json({ data: result.rows, error: null });
      }

      // Отправить сообщение
      case 'send-message': {
        const { chatId, senderId, messageText, skipNotification } = params;
        
        // Проверяем что чат принят и не заблокирован
        const chatCheck = await sql`
          SELECT * FROM private_chats 
          WHERE id = ${chatId} 
            AND accepted = true 
            AND blocked_by IS NULL
        `;
        
        if (chatCheck.rows.length === 0) {
          return NextResponse.json({ 
            data: null, 
            error: { message: 'Chat not found or not accepted' } 
          }, { status: 403 });
        }
        
        const chat = chatCheck.rows[0];
        
        // Определяем получателя
        const receiverId = chat.user1 == senderId ? chat.user2 : chat.user1;
        
        // Сохраняем сообщение
        const result = await sql`
          INSERT INTO messages (chat_id, sender_id, receiver_id, message, created_at)
          VALUES (${chatId}, ${senderId}, ${receiverId}, ${messageText}, NOW())
          RETURNING *
        `;
        
        // Обновляем время последнего сообщения в чате
        await sql`
          UPDATE private_chats 
          SET last_message_at = NOW()
          WHERE id = ${chatId}
        `;
        
        // Отправляем уведомление в Telegram (если не skipNotification)
        if (!skipNotification) {
          const botToken = process.env.TELEGRAM_BOT_TOKEN;
          console.log('🔔 Попытка отправить уведомление:', {
            receiverId,
            hasToken: !!botToken,
            skipNotification
          });
          
          if (botToken) {
            try {
              const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: receiverId,
                  text: `💬 Новое сообщение в чате!\n\n📝 "${messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText}"\n\n🔗 Объявление #${chat.ad_id}`,
                  parse_mode: 'HTML',
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: '💬 Открыть чат',
                          web_app: {
                            url: `https://anonimka.kz/webapp`
                          }
                        }
                      ]
                    ]
                  }
                })
              });
              
              const result = await response.json();
              console.log('📤 Ответ Telegram API:', result);
              
              if (!result.ok) {
                console.error('❌ Telegram API ошибка:', result);
              }
            } catch (error) {
              console.error('❌ Ошибка отправки уведомления:', error);
              // Не прерываем выполнение, уведомление не критично
            }
          } else {
            console.warn('⚠️ TELEGRAM_BOT_TOKEN не установлен в переменных окружения!');
          }
        } else {
          console.log('🔕 Уведомление пропущено (skipNotification=true)');
        }
        
        return NextResponse.json({ data: result.rows[0], error: null });
      }

      // Пометить сообщения как прочитанные
      case 'mark-read': {
        const { chatId, userId } = params;
        await sql`
          UPDATE messages 
          SET read = true 
          WHERE chat_id = ${chatId} 
            AND receiver_id = ${userId}
            AND read = false
        `;
        return NextResponse.json({ data: { success: true }, error: null });
      }

      // Получить количество непрочитанных сообщений
      case 'unread-count': {
        const { chatId, userId } = params;
        const result = await sql`
          SELECT COUNT(*) as count 
          FROM messages 
          WHERE chat_id = ${chatId} 
            AND receiver_id = ${userId}
            AND read = false
        `;
        return NextResponse.json({ 
          data: { count: parseInt(result.rows[0].count) }, 
          error: null 
        });
      }

      // Получить общее количество непрочитанных сообщений пользователя
      case 'total-unread': {
        const { userId } = params;
        const result = await sql`
          SELECT COUNT(*) as count 
          FROM messages m
          JOIN private_chats pc ON m.chat_id = pc.id
          WHERE m.receiver_id = ${userId}
            AND m.read = false
            AND pc.accepted = true
            AND pc.blocked_by IS NULL
        `;
        return NextResponse.json({ 
          data: { count: parseInt(result.rows[0].count) }, 
          error: null 
        });
      }

      default:
        return NextResponse.json(
          { data: null, error: { message: 'Unknown action' } },
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
