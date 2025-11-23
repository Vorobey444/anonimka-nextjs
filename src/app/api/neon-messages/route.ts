import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ENV } from '@/lib/env';

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
          SELECT 
            m.id,
            m.chat_id,
            m.sender_token,
            m.message,
            m.sender_nickname,
            m.photo_url,
            m.telegram_file_id,
            m.read,
            m.delivered,
            m.reply_to_message_id,
            m.created_at,
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
        const { chatId, senderId, messageText, senderNickname, skipNotification, photoUrl, telegramFileId, replyToMessageId } = params;
        
        // Проверяем лимит фото (если отправляется фото)
        if (photoUrl || telegramFileId) {
          // senderId может быть токеном, получаем числовой tg_id
          const isToken = senderId && typeof senderId === 'string' && senderId.length > 20;
          let numericUserId: number | null = null;
          let isPremium = false;
          let photosToday = 0;
          
          if (isToken) {
            const senderInfo = await sql`
              SELECT tg_id FROM ads WHERE user_token = ${senderId} ORDER BY created_at DESC LIMIT 1
            `;
            if (senderInfo.rows.length > 0 && senderInfo.rows[0].tg_id) {
              numericUserId = Number(senderInfo.rows[0].tg_id);
            }
          } else {
            numericUserId = Number(senderId);
          }
          
          // Проверяем Premium: users (источник истины) → premium_tokens
          if (isToken && senderId) {
            // Сначала проверяем users (если есть tg_id)
            if (numericUserId && numericUserId > 0) {
              const user = await sql`SELECT is_premium, premium_until FROM users WHERE id = ${numericUserId}`;
              if (user.rows.length > 0) {
                const userPremium = user.rows[0].is_premium || false;
                const userPremiumUntil = user.rows[0].premium_until;
                const now = new Date();
                const premiumExpired = userPremiumUntil ? new Date(userPremiumUntil) <= now : false;
                isPremium = userPremium && !premiumExpired;
                console.log('[MESSAGES API] PRO из users:', { isPremium, expired: premiumExpired });
              }
            } else {
              // Web пользователь - проверяем premium_tokens
              const premiumTokenResult = await sql`
                SELECT is_premium, premium_until FROM premium_tokens WHERE user_token = ${senderId} LIMIT 1
              `;
              if (premiumTokenResult.rows.length > 0) {
                const tokenPremium = premiumTokenResult.rows[0].is_premium || false;
                const tokenPremiumUntil = premiumTokenResult.rows[0].premium_until;
                const now = new Date();
                const premiumExpired = tokenPremiumUntil ? new Date(tokenPremiumUntil) <= now : false;
                isPremium = tokenPremium && !premiumExpired;
                console.log('[MESSAGES API] PRO из premium_tokens (Web):', { isPremium, expired: premiumExpired });
              }
            }
          } else if (numericUserId && numericUserId > 0) {
            const user = await sql`SELECT is_premium, premium_until FROM users WHERE id = ${numericUserId}`;
            if (user.rows.length > 0) {
              const userPremium = user.rows[0].is_premium || false;
              const userPremiumUntil = user.rows[0].premium_until;
              const now = new Date();
              const premiumExpired = userPremiumUntil ? new Date(userPremiumUntil) <= now : false;
              isPremium = userPremium && !premiumExpired;
            }
          }
          
          // Получаем счетчик фото в зависимости от типа пользователя
          if (numericUserId && numericUserId > 0) {
            // Telegram пользователь - проверяем user_limits
            const limitsResult = await sql`SELECT photos_sent_today FROM user_limits WHERE user_id = ${numericUserId}`;
            photosToday = limitsResult.rows[0]?.photos_sent_today || 0;
          } else if (isToken && senderId) {
            // Веб-пользователь - проверяем web_user_limits
            const webLimitsResult = await sql`SELECT photos_sent_today FROM web_user_limits WHERE user_token = ${senderId}`;
            photosToday = webLimitsResult.rows[0]?.photos_sent_today || 0;
            console.log('[MESSAGES API] Веб-пользователь, фото сегодня:', photosToday);
          }
          
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
        
        // Проверяем что чат принят и не заблокирован (учитываем blocked_by_token если есть)
        const schemaCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'private_chats'`;
        const hasBlockedByToken = schemaCols.rows.some((r: any) => r.column_name === 'blocked_by_token');
        const chatCheck = hasBlockedByToken
          ? await sql`SELECT * FROM private_chats WHERE id = ${chatId} AND accepted = true AND blocked_by IS NULL AND blocked_by_token IS NULL`
          : await sql`SELECT * FROM private_chats WHERE id = ${chatId} AND accepted = true AND blocked_by IS NULL`;
        
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
        
        console.log('[MESSAGES] Получатель сообщения:', {
          receiverToken: receiverToken?.substring(0, 10) + '...',
          receiverId,
          hasReceiverTgId: !!receiverId
        });
        
        // Используем переданный nickname или дефолтный
        const nickname = senderNickname || 'Анонимный';
        
        // Сохраняем сообщение с nickname и фото (используем sender_token и receiver_token)
        const result = await sql`
          INSERT INTO messages (
            chat_id, sender_token, message, sender_nickname, 
            photo_url, telegram_file_id, reply_to_message_id, created_at
          )
          VALUES (
            ${chatId}, ${senderId}, ${messageText || ''}, ${nickname},
            ${photoUrl || null}, ${telegramFileId || null}, ${replyToMessageId || null}, NOW()
          )
          RETURNING *
        `;
        
        // Увеличиваем счётчик фото (если отправлено фото)
        if (photoUrl || telegramFileId) {
            // Получаем числовой ID для лимитов (senderId может быть токеном)
            const isToken = senderId && typeof senderId === 'string' && senderId.length > 20;
            let numericUserId: number | null = null;
          
            if (isToken) {
              const senderInfo = await sql`
                SELECT tg_id FROM ads WHERE user_token = ${senderId} ORDER BY created_at DESC LIMIT 1
              `;
              if (senderInfo.rows.length > 0 && senderInfo.rows[0].tg_id) {
                numericUserId = Number(senderInfo.rows[0].tg_id);
              }
            } else {
              numericUserId = Number(senderId);
            }
          
            // Обновляем счетчик в зависимости от типа пользователя (АЛМАТЫ UTC+5)
            const nowUTC = new Date();
            const almatyDate = new Date(nowUTC.getTime() + (5 * 60 * 60 * 1000));
            const currentAlmatyDate = almatyDate.toISOString().split('T')[0];
            
            if (numericUserId && numericUserId > 0) {
              // Telegram пользователь - обновляем user_limits
              await sql`
                INSERT INTO user_limits (user_id, photos_sent_today, photos_last_reset)
                VALUES (${numericUserId}, 1, ${currentAlmatyDate}::date)
                ON CONFLICT (user_id) DO UPDATE
                SET photos_sent_today = CASE
                    WHEN user_limits.photos_last_reset::text < ${currentAlmatyDate} THEN 1
                    ELSE user_limits.photos_sent_today + 1
                  END,
                  photos_last_reset = ${currentAlmatyDate}::date,
                  updated_at = NOW()
              `;
            } else if (isToken && senderId) {
              // Веб-пользователь без tg_id - обновляем web_user_limits
              await sql`
                INSERT INTO web_user_limits (user_token, photos_sent_today, photos_last_reset)
                VALUES (${senderId}, 1, ${currentAlmatyDate}::date)
                ON CONFLICT (user_token) DO UPDATE
                SET photos_sent_today = CASE
                    WHEN web_user_limits.photos_last_reset::text < ${currentAlmatyDate} THEN 1
                    ELSE web_user_limits.photos_sent_today + 1
                  END,
                  photos_last_reset = ${currentAlmatyDate}::date,
                  updated_at = NOW()
              `;
              console.log('[MESSAGES API] Счетчик фото обновлен для веб-пользователя:', senderId?.substring(0, 16) + '...');
            }
        }
        
        // Обновляем время последнего сообщения в чате
        await sql`
          UPDATE private_chats 
          SET last_message_at = NOW()
          WHERE id = ${chatId}
        `;
        
        // Отправляем уведомление в Telegram (если не skipNotification и есть tg_id)
        console.log('[MESSAGES] Проверка условий уведомления:', {
          skipNotification,
          hasReceiverId: !!receiverId,
          shouldSendNotification: !skipNotification && !!receiverId
        });
        
        if (!skipNotification && receiverId) {
          const botToken = ENV.TELEGRAM_BOT_TOKEN;
          
          // ВРЕМЕННО ОТКЛЮЧЕНА проверка активности - отправляем уведомления всегда
          // TODO: Вернуть проверку активности когда будет работать /api/user-activity
          const receiverIsActive = false; // Всегда считаем неактивным
          
          console.log('[MESSAGES] Проверка активности ОТКЛЮЧЕНА - отправляем уведомление');
          
          // Отправляем уведомление
          if (true) { // Всегда отправляем
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
        // Определяем какие сообщения читать: где sender_token != userId
        await sql`
          UPDATE messages 
          SET read = true, delivered = true
          WHERE chat_id = ${chatId} 
            AND sender_token != ${userId}
            AND read = false
        `;
        return NextResponse.json({ data: { success: true }, error: null });
      }

      // Пометить сообщения как доставленные (но не прочитанные)
      case 'mark-delivered': {
        const { userId } = params;
        // Помечаем доставленными все сообщения где я получатель (sender != я)
        await sql`
          UPDATE messages m
          SET delivered = true 
          FROM private_chats pc
          WHERE m.chat_id = pc.id
            AND m.sender_token != ${userId}
            AND (pc.user_token_1 = ${userId} OR pc.user_token_2 = ${userId})
            AND m.delivered = false
        `;
        return NextResponse.json({ data: { success: true }, error: null });
      }

      // Получить количество непрочитанных сообщений
      case 'unread-count': {
        const { chatId, userId } = params;
        // Считаем сообщения где sender != userId
        const result = await sql`
          SELECT COUNT(*) as count 
          FROM messages 
          WHERE chat_id = ${chatId} 
            AND sender_token != ${userId}
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
        
        console.log('[TOTAL-UNREAD] userId:', userId);
        
        // Считаем сообщения в чатах где я участник, но не отправитель сообщения
        const schemaCols2 = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'private_chats'`;
        const hasBlockedByToken2 = schemaCols2.rows.some((r: any) => r.column_name === 'blocked_by_token');
        // Считаем непрочитанные независимо от блокировки (чтобы пользователь видел историю), можно позже добавить флаг для скрытия
        const result = hasBlockedByToken2
          ? await sql`SELECT COUNT(*) as count FROM messages m JOIN private_chats pc ON m.chat_id = pc.id WHERE m.sender_token != ${userId} AND (pc.user_token_1 = ${userId} OR pc.user_token_2 = ${userId}) AND m.read = false AND pc.accepted = true`
          : await sql`SELECT COUNT(*) as count FROM messages m JOIN private_chats pc ON m.chat_id = pc.id WHERE m.sender_token != ${userId} AND (pc.user_token_1 = ${userId} OR pc.user_token_2 = ${userId}) AND m.read = false AND pc.accepted = true`;
        
        const count = parseInt(result.rows[0].count);
        console.log('[TOTAL-UNREAD] Result:', count);
        
        return NextResponse.json({ 
          data: { count }, 
          error: null 
        });
      }

      // Удалить сообщение (только свое)
      case 'delete-message': {
        const { messageId, userToken } = body;
        
        console.log('[DELETE-MESSAGE] messageId:', messageId, 'userToken:', userToken?.substring(0, 16) + '...');
        
        // Проверяем что сообщение существует и принадлежит пользователю
        const checkResult = await sql`
          SELECT id, sender_token, chat_id 
          FROM messages 
          WHERE id = ${messageId} AND sender_token = ${userToken}
        `;
        
        if (checkResult.rows.length === 0) {
          return NextResponse.json(
            { data: null, error: 'Сообщение не найдено или вы не можете его удалить' },
            { status: 403 }
          );
        }
        
        // Удаляем сообщение
        await sql`
          DELETE FROM messages 
          WHERE id = ${messageId} AND sender_token = ${userToken}
        `;
        
        console.log('[DELETE-MESSAGE] Сообщение удалено:', messageId);
        
        return NextResponse.json({ 
          data: { success: true }, 
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
