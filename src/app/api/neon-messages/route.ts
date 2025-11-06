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
            pc.user_token_1, 
            pc.user_token_2,
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
        const { chatId, senderId, messageText, senderNickname, skipNotification, photoUrl, telegramFileId } = params;
        
        // Проверяем лимит фото (если отправляется фото)
        if (photoUrl || telegramFileId) {
          // senderId может быть токеном, получаем числовой tg_id
          const isToken = senderId && typeof senderId === 'string' && senderId.length > 20;
          let numericUserId: number;
          
          if (isToken) {
            const senderInfo = await sql`
              SELECT tg_id FROM ads WHERE user_token = ${senderId} ORDER BY created_at DESC LIMIT 1
            `;
            if (senderInfo.rows.length === 0) {
              return NextResponse.json({ 
                data: null, 
                error: { message: 'Sender not found' } 
              }, { status: 404 });
            }
            numericUserId = Number(senderInfo.rows[0].tg_id);
          } else {
            numericUserId = Number(senderId);
          }
          
          const userResult = await sql`SELECT is_premium FROM users WHERE id = ${numericUserId}`;
          const limitsResult = await sql`SELECT photos_sent_today FROM user_limits WHERE user_id = ${numericUserId}`;
          
          const isPremium = userResult.rows[0]?.is_premium || false;
          const photosToday = limitsResult.rows[0]?.photos_sent_today || 0;
          const maxPhotos = isPremium ? 999999 : 5;
          
          if (photosToday >= maxPhotos) {
            return NextResponse.json({ 
              data: null, 
              error: { 
                message: isPremium 
                  ? 'Технический лимит превышен' 
                  : 'Вы уже отправили 5 фото сегодня. Оформите PRO для безлимита!',
                limit: true,
                isPremium
              } 
            }, { status: 429 });
          }
        }
        
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
        
        // Определяем получателя (токен)
        const receiverToken = chat.user_token_1 == senderId ? chat.user_token_2 : chat.user_token_1;
        
        // Получаем tg_id получателя для уведомлений (из таблицы ads по токену)
        const receiverInfo = await sql`
          SELECT tg_id FROM ads WHERE user_token = ${receiverToken} ORDER BY created_at DESC LIMIT 1
        `;
        const receiverId = receiverInfo.rows[0]?.tg_id || null;
        
        // Используем переданный nickname или дефолтный
        const nickname = senderNickname || 'Анонимный';
        
        // Сохраняем сообщение с nickname и фото (используем sender_token вместо sender_id)
        const result = await sql`
          INSERT INTO messages (
            chat_id, sender_token, receiver_id, message, sender_nickname, 
            photo_url, telegram_file_id, created_at
          )
          VALUES (
            ${chatId}, ${senderId}, ${receiverToken}, ${messageText || ''}, ${nickname},
            ${photoUrl || null}, ${telegramFileId || null}, NOW()
          )
          RETURNING *
        `;
        
        // Увеличиваем счётчик фото (если отправлено фото)
        if (photoUrl || telegramFileId) {
            // Получаем числовой ID для лимитов (senderId может быть токеном)
            const isToken = senderId && typeof senderId === 'string' && senderId.length > 20;
            let numericUserId: number;
          
            if (isToken) {
              const senderInfo = await sql`
                SELECT tg_id FROM ads WHERE user_token = ${senderId} ORDER BY created_at DESC LIMIT 1
              `;
              numericUserId = senderInfo.rows.length > 0 ? Number(senderInfo.rows[0].tg_id) : 0;
            } else {
              numericUserId = Number(senderId);
            }
          
            if (numericUserId > 0) {
              await sql`
                INSERT INTO user_limits (user_id, photos_sent_today, photos_last_reset)
                VALUES (${numericUserId}, 1, CURRENT_DATE)
                ON CONFLICT (user_id) DO UPDATE
                SET photos_sent_today = CASE
                    WHEN user_limits.photos_last_reset < CURRENT_DATE THEN 1
                    ELSE user_limits.photos_sent_today + 1
                  END,
                  photos_last_reset = CURRENT_DATE,
                  updated_at = NOW()
              `;
            }
        }
        
        // Обновляем время последнего сообщения в чате
        await sql`
          UPDATE private_chats 
          SET last_message_at = NOW()
          WHERE id = ${chatId}
        `;
        
        // Отправляем уведомление в Telegram (если не skipNotification и есть tg_id)
        if (!skipNotification && receiverId) {
          const botToken = process.env.TELEGRAM_BOT_TOKEN;
          
          // Проверяем активность получателя
          let receiverIsActive = false;
          try {
            const activityCheck = await fetch(`${request.nextUrl.origin}/api/user-activity`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'is-active',
                params: { userId: receiverId, chatId }
              })
            });
            const activityResult = await activityCheck.json();
            receiverIsActive = activityResult.data?.active || false;
            console.log('[MESSAGES] Активность получателя:', { chatId, active: receiverIsActive });
          } catch (error) {
            console.error('[MESSAGES] Ошибка проверки активности:', error);
            // Если ошибка - отправляем уведомление на всякий случай
          }
          
          // Отправляем уведомление только если получатель НЕ активен в этом чате
          if (!receiverIsActive) {
            console.log('[MESSAGES] Попытка отправить уведомление:', {
              hasToken: !!botToken,
              skipNotification,
              senderNickname
            });
            
            if (botToken) {
              try {
                // Формируем текст уведомления с nickname
                const notificationFrom = senderNickname ? `от ${senderNickname}` : '';
                const notificationText = `💬 Новое сообщение ${notificationFrom}!\n\n📝 "${messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText}"\n\n🔗 Объявление #${chat.ad_id}`;
                
                const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: receiverId,
                    text: notificationText,
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
                
                const telegramResult = await response.json();
                console.log('[MESSAGES] Ответ Telegram API:', telegramResult);
                
                if (!telegramResult.ok) {
                  console.error('[MESSAGES] Telegram API ошибка:', telegramResult);
                }
              } catch (error) {
                console.error('[MESSAGES] Ошибка отправки уведомления:', error);
                // Не прерываем выполнение, уведомление не критично
              }
            } else {
              console.warn('[MESSAGES] TELEGRAM_BOT_TOKEN не установлен!');
            }
          } else {
            console.log('[MESSAGES] Уведомление пропущено - получатель активен в чате');
          }
        } else {
          console.log('[MESSAGES] Уведомление пропущено (skipNotification=true или нет receiverId)');
        }
        
        return NextResponse.json({ data: result.rows[0], error: null });
      }

      // Пометить сообщения как прочитанные
      case 'mark-read': {
        const { chatId, userId } = params;
        await sql`
          UPDATE messages 
          SET read = true, delivered = true
          WHERE chat_id = ${chatId} 
            AND receiver_id = ${userId}
            AND read = false
        `;
        return NextResponse.json({ data: { success: true }, error: null });
      }

      // Пометить сообщения как доставленные (но не прочитанные)
      case 'mark-delivered': {
        const { userId } = params;
        await sql`
          UPDATE messages 
          SET delivered = true 
          WHERE receiver_id = ${userId}
            AND delivered = false
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
        
        // receiver_id теперь хранит user_token (строка), а не числовой ID
        // userId может быть как токеном, так и числовым ID (для обратной совместимости)
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
