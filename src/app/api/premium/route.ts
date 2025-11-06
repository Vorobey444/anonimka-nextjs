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
        let numericUserId: number;
        
        if (isToken) {
          // Получаем tg_id из ads по user_token
          const adResult = await sql`
            SELECT tg_id FROM ads WHERE user_token = ${userId} LIMIT 1
          `;
          
          if (adResult.rows.length === 0) {
            // Пользователь еще не создал ни одной анкеты
            return NextResponse.json({
              data: {
                isPremium: false,
                premiumUntil: null,
                country: 'KZ',
                limits: {
                  photos: { used: 0, max: LIMITS.FREE.photos_per_day, remaining: LIMITS.FREE.photos_per_day },
                  ads: { used: 0, max: LIMITS.FREE.ads_per_day, remaining: LIMITS.FREE.ads_per_day },
                  pin: { used: 0, max: LIMITS.FREE.pin_per_3days, canUse: true }
                }
              },
              error: null
            });
          }
          
          numericUserId = Number(adResult.rows[0].tg_id);
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
          `;
          limits = await sql`SELECT * FROM user_limits WHERE user_id = ${numericUserId}`;
        }
        
        const userData = user.rows[0];
        const limitsData = limits.rows[0];
        const isPremium = userData.is_premium || false;
        
        return NextResponse.json({
          data: {
            isPremium,
            premiumUntil: userData.premium_until,
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
        let numericUserId: number;
        
        if (isToken) {
          const adResult = await sql`
            SELECT tg_id FROM ads WHERE user_token = ${userId} LIMIT 1
          `;
          if (adResult.rows.length === 0) {
            return NextResponse.json({ data: { canSend: true }, error: null });
          }
          numericUserId = Number(adResult.rows[0].tg_id);
        } else {
          numericUserId = Number(userId);
        }
        
        const user = await sql`SELECT is_premium FROM users WHERE id = ${numericUserId}`;
        const limits = await sql`SELECT * FROM user_limits WHERE user_id = ${numericUserId}`;
        
        if (user.rows.length === 0 || limits.rows.length === 0) {
          return NextResponse.json({ data: { canSend: true }, error: null });
        }
        
        const isPremium = user.rows[0].is_premium;
        const photosToday = limits.rows[0].photos_sent_today || 0;
        
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
        
        const user = await sql`SELECT is_premium FROM users WHERE id = ${numericUserId}`;
        const currentStatus = user.rows[0]?.is_premium || false;
        
        const premiumUntil = !currentStatus ? 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : // +30 дней
          null;
        
        await sql`
          UPDATE users
          SET is_premium = ${!currentStatus},
              premium_until = ${premiumUntil},
              updated_at = NOW()
          WHERE id = ${numericUserId}
        `;
        
        return NextResponse.json({
          data: {
            isPremium: !currentStatus,
            premiumUntil
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
