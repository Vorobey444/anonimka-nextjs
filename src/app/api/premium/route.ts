import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// Лимиты для FREE и PRO
const LIMITS = {
  FREE: {
    photos_per_day: 5,
    ads_per_day: 1,
    pin_per_3days: 1,
    pin_duration_hours: 1
  },
  PRO: {
    photos_per_day: 999999, // Безлимит
    ads_per_day: 3,
    pin_per_day: 3,
    pin_duration_hours: 1 // 3 раза в день по 1 часу
  }
};

// Цены по странам
const PRICES = {
  KZ: { amount: 499, currency: '₸', name: 'тенге' },
  RU: { amount: 99, currency: '₽', name: 'рублей' },
  default: { amount: 2, currency: '$', name: 'USD' }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      // Получить статус пользователя и лимиты
      case 'get-user-status': {
        const { userId } = params;
        
        // Определяем, это токен или числовой ID
        const isToken = userId && typeof userId === 'string' && userId.length > 20;
        let numericUserId: number | null = null;
        
        // ПРИОРИТЕТ 1: Проверяем premium_tokens для пользователей с токеном
        if (isToken) {
          console.log('[PREMIUM API] Проверка premium_tokens для токена:', userId.substring(0, 16) + '...');
          const prem = await sql`
            SELECT is_premium, premium_until FROM premium_tokens WHERE user_token = ${userId} LIMIT 1
          `;
          console.log('[PREMIUM API] Результат premium_tokens:', prem.rows);
          const isPremiumToken = prem.rows[0]?.is_premium || false;
          const premiumUntilToken = prem.rows[0]?.premium_until || null;

          console.log('[PREMIUM API] isPremiumToken:', isPremiumToken, 'premiumUntil:', premiumUntilToken);

          // Если есть PRO по токену, используем его независимо от наличия tg_id
          if (isPremiumToken) {
            console.log('[PREMIUM API] ✅ PRO найден в premium_tokens, возвращаем PRO статус');
            // Считаем объявления по токену за сегодня (АЛМАТЫ UTC+5)
            const nowUTC = new Date();
            const almatyDate = new Date(nowUTC.getTime() + (5 * 60 * 60 * 1000));
            const currentAlmatyDate = almatyDate.toISOString().split('T')[0];
            
            const countRes = await sql`
              SELECT COUNT(*)::int AS c
              FROM ads
              WHERE user_token = ${userId}
                AND (created_at AT TIME ZONE 'Asia/Almaty')::date = ${currentAlmatyDate}::date
            `;
            const used = countRes.rows[0]?.c ?? 0;

            return NextResponse.json({
              data: {
                isPremium: true,
                premiumUntil: premiumUntilToken,
                country: 'KZ',
                limits: {
                  photos: {
                    used: 0,
                    max: LIMITS.PRO.photos_per_day,
                    remaining: 999999
                  },
                  ads: {
                    used,
                    max: LIMITS.PRO.ads_per_day,
                    remaining: Math.max(0, LIMITS.PRO.ads_per_day - used)
                  },
                  pin: {
                    used: 0,
                    max: LIMITS.PRO.pin_per_day,
                    canUse: true
                  }
                }
              },
              error: null
            });
          }

          // Получаем tg_id для проверки в users (если нет PRO по токену)
          const adResult = await sql`
            SELECT tg_id FROM ads WHERE user_token = ${userId} ORDER BY created_at DESC LIMIT 1
          `;

          const tgId = adResult.rows[0]?.tg_id as number | null | undefined;

          if (!tgId) {
            // Веб-пользователь без PRO и без tg_id (АЛМАТЫ UTC+5)
            const nowUTC = new Date();
            const almatyDate = new Date(nowUTC.getTime() + (5 * 60 * 60 * 1000));
            const currentAlmatyDate = almatyDate.toISOString().split('T')[0];
            
            const countRes = await sql`
              SELECT COUNT(*)::int AS c
              FROM ads
              WHERE user_token = ${userId}
                AND (created_at AT TIME ZONE 'Asia/Almaty')::date = ${currentAlmatyDate}::date
            `;
            const used = countRes.rows[0]?.c ?? 0;

            return NextResponse.json({
              data: {
                isPremium: false,
                premiumUntil: null,
                country: 'KZ',
                limits: {
                  photos: {
                    used: 0,
                    max: LIMITS.FREE.photos_per_day,
                    remaining: LIMITS.FREE.photos_per_day
                  },
                  ads: {
                    used,
                    max: LIMITS.FREE.ads_per_day,
                    remaining: Math.max(0, LIMITS.FREE.ads_per_day - used)
                  },
                  pin: {
                    used: 0,
                    max: LIMITS.FREE.pin_per_3days,
                    canUse: true
                  }
                }
              },
              error: null
            });
          }

          numericUserId = Number(tgId);
        } else {
          numericUserId = Number(userId);
        }
        
        // Получаем или создаём пользователя
        let user = await sql`
          SELECT * FROM users WHERE id = ${numericUserId}
        `;
        
        if (user.rows.length === 0) {
          // Создаём нового пользователя
          await sql`
            INSERT INTO users (id, is_premium)
            VALUES (${numericUserId}, false)
          `;
          user = await sql`SELECT * FROM users WHERE id = ${numericUserId}`;
        }
        
        // Получаем или создаём лимиты
        let limits = await sql`
          SELECT * FROM user_limits WHERE user_id = ${numericUserId}
        `;
        
        if (limits.rows.length === 0) {
          await sql`
            INSERT INTO user_limits (user_id)
            VALUES (${numericUserId})
            ON CONFLICT (user_id) DO NOTHING
          `;
          limits = await sql`SELECT * FROM user_limits WHERE user_id = ${numericUserId}`;
        }
        
        const userData = user.rows[0];
        let limitsData = limits.rows[0];
        let isPremium = userData.is_premium || false;
        let subscriptionSource: string | null = null;
        
          // Автоотключение PRO, если premium_until истекло
        if (isPremium && userData.premium_until) {
          const now = new Date();
          const until = new Date(userData.premium_until);
          if (now > until) {
            // Сбросить PRO
            await sql`
              UPDATE users SET is_premium = false, premium_until = NULL WHERE id = ${numericUserId}
            `;
            isPremium = false;
          } else {
            // Определяем источник подписки только если она активна
            // 1. Проверяем Stars платежи
            const starsCheck = await sql`
              SELECT id FROM premium_transactions 
              WHERE telegram_id = ${numericUserId} 
              ORDER BY created_at DESC 
              LIMIT 1
            `;
            if (starsCheck.rows.length > 0) {
              subscriptionSource = 'stars';
            } else {
              // 2. Проверяем реферальную программу
              const referralCheck = await sql`
                SELECT id FROM referrals 
                WHERE referrer_id = ${numericUserId} AND reward_given = true
                LIMIT 1
              `;
              if (referralCheck.rows.length > 0) {
                subscriptionSource = 'referral';
              } else {
                // 3. Проверяем триал (7 часов)
                if (userData.trial7h_used) {
                  const premiumDuration = until.getTime() - now.getTime();
                  const hours = premiumDuration / (1000 * 60 * 60);
                  if (hours <= 7) {
                    subscriptionSource = 'trial';
                  }
                }
              }
            }
          }
        }
        
        // Проверяем и сбрасываем счетчики если новый день (АЛМАТЫ UTC+5)
        const nowUTC = new Date();
        const almatyDate = new Date(nowUTC.getTime() + (5 * 60 * 60 * 1000)); // +5 часов
        const currentDate = almatyDate.toISOString().split('T')[0];
        
        const lastAdsResetDate = limitsData.ads_last_reset ? new Date(limitsData.ads_last_reset).toISOString().split('T')[0] : null;
        const lastPhotosResetDate = limitsData.photos_last_reset ? new Date(limitsData.photos_last_reset).toISOString().split('T')[0] : null;
        
        // Сбрасываем счетчик объявлений если новый день
        if (lastAdsResetDate !== currentDate) {
          console.log('[PREMIUM API] Сброс счетчика объявлений (новый день по Алматы UTC+5):', { userId: numericUserId, lastAdsResetDate, currentDate });
          await sql`
            UPDATE user_limits
            SET ads_created_today = 0,
                ads_last_reset = ${currentDate}::date,
                updated_at = NOW()
            WHERE user_id = ${numericUserId}
          `;
        }
        
        // Сбрасываем счетчик фото если новый день
        if (lastPhotosResetDate !== currentDate) {
          console.log('[PREMIUM API] Сброс счетчика фото (новый день по Алматы UTC+5):', { userId: numericUserId, lastPhotosResetDate, currentDate });
          await sql`
            UPDATE user_limits
            SET photos_sent_today = 0,
                photos_last_reset = ${currentDate}::date,
                updated_at = NOW()
            WHERE user_id = ${numericUserId}
          `;
        }
        
        // Перезагружаем актуальные данные если были изменения
        if (lastAdsResetDate !== currentDate || lastPhotosResetDate !== currentDate) {
          limits = await sql`SELECT * FROM user_limits WHERE user_id = ${numericUserId}`;
          limitsData = limits.rows[0];
        }
        
        return NextResponse.json({
          data: {
            isPremium,
            premiumUntil: userData.premium_until,
            subscriptionSource,
            trial7h_used: userData.trial7h_used || false,
            country: userData.country || 'KZ',
            limits: {
              photos: {
                used: limitsData.photos_sent_today || 0,
                max: isPremium ? LIMITS.PRO.photos_per_day : LIMITS.FREE.photos_per_day,
                remaining: isPremium ? 999999 : Math.max(0, LIMITS.FREE.photos_per_day - (limitsData.photos_sent_today || 0))
              },
              ads: {
                used: limitsData.ads_created_today || 0,
                max: isPremium ? LIMITS.PRO.ads_per_day : LIMITS.FREE.ads_per_day,
                remaining: Math.max(0, (isPremium ? LIMITS.PRO.ads_per_day : LIMITS.FREE.ads_per_day) - (limitsData.ads_created_today || 0))
              },
              pin: {
                used: limitsData.pin_uses_today || 0,
                max: isPremium ? LIMITS.PRO.pin_per_day : LIMITS.FREE.pin_per_3days,
                canUse: isPremium ? 
                  (limitsData.pin_uses_today || 0) < LIMITS.PRO.pin_per_day :
                  checkPinAvailability(limitsData.last_pin_time)
              }
            }
          },
          error: null
        });
      }

      // Проверить можно ли отправить фото
      case 'check-photo-limit': {
        const { userId } = params;
        
        // Определяем, это токен или числовой ID
        const isToken = userId && typeof userId === 'string' && userId.length > 20;
        let numericUserId: number | null = null;
        let isPremium = false;
        let photosToday = 0;
        
        if (isToken) {
          const adResult = await sql`
            SELECT tg_id FROM ads WHERE user_token = ${userId} LIMIT 1
          `;
          if (adResult.rows.length > 0 && adResult.rows[0].tg_id) {
            numericUserId = Number(adResult.rows[0].tg_id);
          }
        } else {
          numericUserId = Number(userId);
        }
        
        // Проверяем premium статус
        if (isToken) {
          const premiumTokenResult = await sql`
            SELECT is_premium FROM premium_tokens WHERE user_token = ${userId} LIMIT 1
          `;
          if (premiumTokenResult.rows.length > 0) {
            isPremium = premiumTokenResult.rows[0].is_premium || false;
          }
        } else if (numericUserId && numericUserId > 0) {
          const user = await sql`SELECT is_premium FROM users WHERE id = ${numericUserId}`;
          isPremium = user.rows[0]?.is_premium || false;
        }
        
        // Получаем счетчик фото
        if (numericUserId && numericUserId > 0) {
          // Telegram пользователь
          const limits = await sql`SELECT photos_sent_today FROM user_limits WHERE user_id = ${numericUserId}`;
          photosToday = limits.rows[0]?.photos_sent_today || 0;
        } else if (isToken) {
          // Веб-пользователь
          const webLimits = await sql`SELECT photos_sent_today FROM web_user_limits WHERE user_token = ${userId}`;
          photosToday = webLimits.rows[0]?.photos_sent_today || 0;
        }
        
        const canSend = isPremium || photosToday < LIMITS.FREE.photos_per_day;
        
        return NextResponse.json({
          data: {
            canSend,
            remaining: isPremium ? 999999 : Math.max(0, LIMITS.FREE.photos_per_day - photosToday),
            isPremium
          },
          error: null
        });
      }

      // Увеличить счётчик фото
      case 'increment-photo-count': {
        const { userId } = params;
        
        // Определяем, это токен или числовой ID
        const isToken = userId && typeof userId === 'string' && userId.length > 20;
        let numericUserId: number;
        
        if (isToken) {
          const adResult = await sql`
            SELECT tg_id FROM ads WHERE user_token = ${userId} LIMIT 1
          `;
          if (adResult.rows.length === 0) {
            return NextResponse.json({ data: { success: false }, error: { message: 'User not found' } }, { status: 404 });
          }
          numericUserId = Number(adResult.rows[0].tg_id);
        } else {
          numericUserId = Number(userId);
        }
        
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
        
        return NextResponse.json({ data: { success: true }, error: null });
      }

      // Активировать Premium (для теста)
      case 'toggle-premium': {
        const { userId } = params;
        
        // Определяем, это токен или числовой ID
        const isToken = userId && typeof userId === 'string' && userId.length > 20;
        let numericUserId: number;
        
        if (isToken) {
          const adResult = await sql`
            SELECT tg_id FROM ads WHERE user_token = ${userId} LIMIT 1
          `;
          if (adResult.rows.length === 0) {
            return NextResponse.json({ data: { success: false }, error: { message: 'User not found' } }, { status: 404 });
          }
          numericUserId = Number(adResult.rows[0].tg_id);
        } else {
          numericUserId = Number(userId);
        }
        
        const user = await sql`SELECT is_premium, trial7h_used FROM users WHERE id = ${numericUserId}`;
        const currentStatus = user.rows[0]?.is_premium || false;
        const trial7hUsed = user.rows[0]?.trial7h_used || false;
        
        // Добавляем поддержку короткого троллинг-триала (7 часов), если передан флаг trial7h
        const trialFlag = params?.trial7h === true || params?.trial7h === 'true';
        let premiumUntil: string | null = null;
        
        // Если пользователь хочет активировать триал, проверяем, не использовал ли он его уже
        if (trialFlag && trial7hUsed) {
          return NextResponse.json({
            error: { message: 'Триал уже был использован' }
          }, { status: 400 });
        }
        
        if (!currentStatus) {
          const durationMs = trialFlag ? (7 * 60 * 60 * 1000) : (30 * 24 * 60 * 60 * 1000); // 7 часов или 30 дней
          premiumUntil = new Date(Date.now() + durationMs).toISOString();
        }
        
        // Если активируем триал, отмечаем что он использован
        if (trialFlag && !currentStatus) {
          await sql`
            UPDATE users
            SET is_premium = true,
                premium_until = ${premiumUntil},
                trial7h_used = true,
                updated_at = NOW()
            WHERE id = ${numericUserId}
          `;
        } else {
          await sql`
            UPDATE users
            SET is_premium = ${!currentStatus},
                premium_until = ${premiumUntil},
                updated_at = NOW()
            WHERE id = ${numericUserId}
          `;
        }
        
        return NextResponse.json({
          data: {
            isPremium: !currentStatus,
            premiumUntil,
            trial: trialFlag,
            trial7h_used: trialFlag ? true : trial7hUsed
          },
          error: null
        });
      }

      // Получить цены для страны
      case 'get-pricing': {
        const { country } = params;
        const pricing = PRICES[country as keyof typeof PRICES] || PRICES.default;
        
        return NextResponse.json({
          data: {
            free: {
              name: 'FREE',
              price: 0,
              features: [
                '1 активное объявление в день',
                '5 фото в день',
                'Закрепление в TOP: 1 час раз в 3 дня',
                'Базовые функции'
              ]
            },
            pro: {
              name: 'PRO',
              price: pricing.amount,
              currency: pricing.currency,
              period: 'месяц',
              features: [
                'До 3 активных объявлений в день',
                'Безлимит фото',
                'Закрепление в TOP: 3 раза в день по 24 часа',
                'Значок PRO в запросах',
                'Приоритетная поддержка'
              ]
            }
          },
          error: null
        });
      }

      default:
        return NextResponse.json(
          { error: { message: 'Unknown action' } },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Premium API error:', error);
    return NextResponse.json(
      { data: null, error: { message: error.message } },
      { status: 500 }
    );
  }
}

// Проверка доступности закрепления (для FREE: раз в 3 дня)
function checkPinAvailability(lastPinTime: string | null): boolean {
  if (!lastPinTime) return true;
  
  const lastPin = new Date(lastPinTime);
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  
  return lastPin < threeDaysAgo;
}
