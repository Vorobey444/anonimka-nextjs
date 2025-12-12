import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { sendPushNotification } from '@/utils/fcm';

export const dynamic = 'force-dynamic';

/**
 * API для отправки уведомлений в Telegram о новых запросах на чат
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiverTgId, senderTgId, adId, messageText, receiverToken } = body;

    console.log('[SEND-NOTIFICATION] Получен запрос:', { receiverTgId, senderTgId, adId, messageText, receiverToken });

    // Получаем токен бота
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('[SEND-NOTIFICATION] TELEGRAM_BOT_TOKEN не настроен');
      return NextResponse.json(
        { error: 'Bot token not configured' },
        { status: 500 }
      );
    }

    // Определяем получателя (поддерживаем оба формата: tg_id и token)
    let recipientTgId = receiverTgId;

    // Если передан токен вместо tg_id, получаем tg_id из базы
    if (!recipientTgId && receiverToken) {
      console.log('[SEND-NOTIFICATION] Получаем tg_id по токену:', receiverToken);
      
      try {
        // Сначала проверяем таблицу users (для Email-авторизации)
        const userResult = await sql`
          SELECT id 
          FROM users 
          WHERE user_token = ${receiverToken} AND id IS NOT NULL
          LIMIT 1
        `;

        if (userResult.rows.length > 0 && userResult.rows[0].id) {
          recipientTgId = userResult.rows[0].id;
          console.log('[SEND-NOTIFICATION] Найден Telegram ID в users:', recipientTgId);
        } else {
          // Если в users не нашли, проверяем таблицу ads (для старых пользователей)
          const adResult = await sql`
            SELECT tg_id 
            FROM ads 
            WHERE user_token = ${receiverToken} AND tg_id IS NOT NULL
            LIMIT 1
          `;

          if (adResult.rows.length > 0 && adResult.rows[0].tg_id) {
            recipientTgId = adResult.rows[0].tg_id;
            console.log('[SEND-NOTIFICATION] Найден tg_id в ads:', recipientTgId);
          } else {
            // Нет tg_id - проверяем FCM токен для Push-уведомления (Email-пользователи)
            console.log('[SEND-NOTIFICATION] tg_id не найден, проверяем FCM токен для Push');
            
            const fcmResult = await sql`
              SELECT fcm_token FROM users WHERE user_token = ${receiverToken} LIMIT 1
            `;
            
            if (fcmResult.rows.length > 0 && fcmResult.rows[0].fcm_token) {
              const fcmToken = fcmResult.rows[0].fcm_token;
              console.log('[SEND-NOTIFICATION] Найден FCM токен, отправляем Push');
              
              // Отправляем Push-уведомление
              const pushTitle = '💬 Новый запрос на чат';
              const pushBody = messageText.length > 100 
                ? messageText.substring(0, 100) + '...' 
                : messageText;
              
              const pushSent = await sendPushNotification(fcmToken, {
                title: pushTitle,
                body: pushBody,
                chatId: adId || 'unknown',
                senderNickname: 'Аноним'
              });
              
              if (pushSent) {
                console.log('[SEND-NOTIFICATION] ✅ Push-уведомление отправлено');
                return NextResponse.json({
                  success: true,
                  message: 'Push notification sent successfully',
                  notificationType: 'push'
                });
              } else {
                console.warn('[SEND-NOTIFICATION] ⚠️ Не удалось отправить Push-уведомление');
              }
            }
            
            console.warn('[SEND-NOTIFICATION] Нет ни tg_id, ни fcm_token - уведомление не отправлено');
            return NextResponse.json(
              { 
                success: false, 
                error: 'No notification method available',
                details: 'Пользователь не привязал Telegram и не настроил Push-уведомления.'
              },
              { status: 200 } // 200 чтобы не блокировать создание чата
            );
          }
        }
      } catch (dbError) {
        console.error('[SEND-NOTIFICATION] Ошибка запроса к БД:', dbError);
      }
    }

    // Если не удалось получить tg_id получателя
    if (!recipientTgId) {
      console.warn('[SEND-NOTIFICATION] Не удалось определить Telegram ID получателя');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Recipient Telegram ID not found',
          details: 'Автор анкеты не привязал Telegram аккаунт. Уведомление не отправлено.'
        },
        { status: 200 } // 200 чтобы не блокировать создание чата
      );
    }

    // Получаем информацию об объявлении для красивого уведомления
    let adInfo = null;
    if (adId) {
      try {
        const adResult = await sql`
          SELECT gender, target, goal, age_from, age_to, city, country
          FROM ads 
          WHERE id = ${adId} 
          LIMIT 1
        `;
        if (adResult.rows.length > 0) {
          adInfo = adResult.rows[0];
        }
      } catch (err) {
        console.warn('[SEND-NOTIFICATION] Не удалось загрузить информацию об анкете:', err);
      }
    }

    // Формируем текст уведомления
    let notificationText = '💌 <b>Новое сообщение по вашей анкете!</b>\n\n';
    
    if (adInfo) {
      const genderEmoji = adInfo.gender === 'male' ? '👨' : adInfo.gender === 'female' ? '👩' : '👤';
      const targetEmoji = adInfo.target === 'male' ? '👨' : adInfo.target === 'female' ? '👩' : '👥';
      const location = adInfo.city && adInfo.country ? `${adInfo.city}, ${adInfo.country}` : (adInfo.city || adInfo.country || 'Не указано');
      
      notificationText += `${genderEmoji} Анкета: ${adInfo.gender === 'male' ? 'Парень' : adInfo.gender === 'female' ? 'Девушка' : 'Пользователь'}\n`;
      notificationText += `${targetEmoji} Ищет: ${adInfo.target === 'male' ? 'Парня' : adInfo.target === 'female' ? 'Девушку' : 'Любого'}\n`;
      
      if (adInfo.goal) {
        // goal может быть строкой или массивом
        const goalArray = Array.isArray(adInfo.goal) ? adInfo.goal : [adInfo.goal];
        const goalTexts = goalArray.map((g: string) => {
          switch(g) {
            case 'friendship': return 'Дружба';
            case 'relationship': return 'Отношения';
            case 'dating': return 'Свидания';
            case 'flirting': return 'Флирт';
            case 'chat': return 'Общение';
            default: return g;
          }
        });
        notificationText += `🎯 Цель: ${goalTexts.join(', ')}\n`;
      }
      
      if (adInfo.age_from || adInfo.age_to) {
        notificationText += `📅 Возраст: ${adInfo.age_from || '?'}-${adInfo.age_to || '?'}\n`;
      }
      
      notificationText += `📍 Город: ${location}\n`;
    } else {
      notificationText += `📋 Анкета #${adId}\n`;
    }

    notificationText += `\n💬 Сообщение:\n"${messageText}"\n\n`;
    notificationText += `👉 Откройте чаты, чтобы принять или отклонить запрос`;

    // Формируем клавиатуру
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '💬 Мои чаты',
            web_app: {
              url: `${process.env.VERCEL_API_URL || 'https://anonimka.online'}/webapp#my-chats`
            }
          }
        ],
        [
          {
            text: '📱 Открыть приложение',
            web_app: {
              url: `${process.env.VERCEL_API_URL || 'https://anonimka.online'}/webapp`
            }
          }
        ]
      ]
    };

    // Отправляем уведомление в Telegram
    console.log('[SEND-NOTIFICATION] Отправка уведомления пользователю:', recipientTgId);
    
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: recipientTgId,
        text: notificationText,
        parse_mode: 'HTML',
        reply_markup: keyboard
      })
    });

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      // Обрабатываем разные типы ошибок
      const errorCode = telegramResult.error_code;
      const errorDesc = telegramResult.description;
      
      // 403 - бот заблокирован пользователем (обычная ситуация)
      if (errorCode === 403) {
        console.log(`[SEND-NOTIFICATION] Пользователь ${recipientTgId} заблокировал бота - пропускаем уведомление`);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Bot blocked by user',
            details: 'Пользователь заблокировал бота. Уведомление не отправлено.'
          },
          { status: 200 }
        );
      }
      
      // 400 - неверный chat_id или другие параметры
      if (errorCode === 400) {
        console.warn(`[SEND-NOTIFICATION] Некорректные параметры для ${recipientTgId}:`, errorDesc);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid parameters',
            details: errorDesc
          },
          { status: 200 }
        );
      }
      
      // Остальные ошибки логируем как критичные
      console.error('[SEND-NOTIFICATION] Telegram API ошибка:', telegramResult);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send Telegram notification',
          details: errorDesc
        },
        { status: 200 }
      );
    }

    console.log('[SEND-NOTIFICATION] Telegram уведомление успешно отправлено:', telegramResult.result.message_id);

    return NextResponse.json({
      success: true,
      message: 'Telegram notification sent successfully',
      notificationType: 'telegram',
      telegramMessageId: telegramResult.result.message_id
    });

  } catch (error: any) {
    console.error('[SEND-NOTIFICATION] Ошибка:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 200 } // 200 чтобы не блокировать создание чата даже при ошибке уведомления
    );
  }
}
