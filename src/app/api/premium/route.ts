import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { generateUserToken } from '@/lib/userToken';

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
        let { userId, userToken } = params;
        
        // Унифицируем: используем userId как идентификатор (токен или ID)
        if (!userId && userToken) {
          userId = userToken;
        }
        
        if (!userId) {
          return NextResponse.json({ error: 'userId or userToken required' }, { status: 400 });
        }
        
        // Определяем, это токен или числовой ID
        const isToken = userId && typeof userId === 'string' && userId.length > 20;
        let numericUserId: number | null = null;
        
        // ПРИОРИТЕТ 1: Ищем пользователя в users по user_token (источник истины)
        if (isToken) {
          console.log('[PREMIUM API] Проверка для токена:', userId.substring(0, 16) + '...');
          
          // Сначала проверяем users (источник истины)
          const userResult = await sql`
            SELECT id, is_premium, premium_until, auto_premium_source FROM users WHERE user_token = ${userId} LIMIT 1
          `;

          const tgId = userResult.rows.length > 0 ? userResult.rows[0].id : null;

          // СЛУЧАЙ 1: Пользователь найден в users (Telegram пользователь)
          if (tgId) {
            console.log('[PREMIUM API] ✅ Найден Telegram пользователь в users:', tgId);
            
            const userIsPremium = userResult.rows[0].is_premium || false;
            const userPremiumUntil = userResult.rows[0].premium_until;
            const userPremiumSource = userResult.rows[0].auto_premium_source || null;
            const now = new Date();
            const premiumExpired = userPremiumUntil ? new Date(userPremiumUntil) <= now : false;
            
            console.log('[PREMIUM API] Premium в users:', {
              is_premium: userIsPremium,
              premium_until: userPremiumUntil,
              expired: premiumExpired
            });
            
            // Синхронизируем premium_tokens с users (users - источник истины)
            if (userIsPremium && !premiumExpired) {
              console.log('[PREMIUM API] 🔄 Синхронизируем premium_tokens ← users');
              
              await sql`
                INSERT INTO premium_tokens (user_token, is_premium, premium_until, updated_at)
                VALUES (${userId}, true, ${userPremiumUntil}, NOW())
                ON CONFLICT (user_token) DO UPDATE
                SET is_premium = true,
                    premium_until = ${userPremiumUntil},
                    updated_at = NOW()
              `;
              
              // Возвращаем PRO статус
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
                  premiumUntil: userPremiumUntil,
                  premiumSource: userPremiumSource,
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
            } else {
              // Premium истёк или не активен - очищаем premium_tokens
              console.log('[PREMIUM API] ⚠️ Premium неактивен в users, очищаем premium_tokens');
              
              await sql`
                UPDATE premium_tokens
                SET is_premium = false,
                    premium_until = NULL,
                    updated_at = NOW()
                WHERE user_token = ${userId}
              `;
            }
          }

          // СЛУЧАЙ 2: Пользователь НЕ найден в users (чистый Web-пользователь)
          if (!tgId) {
            console.log('[PREMIUM API] 🌐 Web-пользователь (без Telegram), проверяем premium_tokens');
            
            // Проверяем premium_tokens
            const prem = await sql`
              SELECT is_premium, premium_until FROM premium_tokens WHERE user_token = ${userId} LIMIT 1
            `;
            
            const isPremiumToken = prem.rows[0]?.is_premium || false;
            const premiumUntilToken = prem.rows[0]?.premium_until || null;
            const now = new Date();
            const premiumExpired = premiumUntilToken ? new Date(premiumUntilToken) <= now : false;
            const isPremiumActive = isPremiumToken && !premiumExpired;
            
            if (isPremiumActive) {
              console.log('[PREMIUM API] ✅ PRO активен в premium_tokens до:', premiumUntilToken);
              
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
                  premiumSource: null,
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
            
            console.log('[PREMIUM API] ℹ️ Web-пользователь без Premium');
            
            // Проверяем trial7h_used для веб-пользователя
            const webUserData = await sql`
              SELECT trial7h_used FROM web_user_limits WHERE user_token = ${userId} LIMIT 1
            `;
            const trial7hUsed = webUserData.rows[0]?.trial7h_used || false;
            
            // Возвращаем FREE статус (АЛМАТЫ UTC+5)
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
                trial7h_used: trial7hUsed,
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
          const token = generateUserToken(numericUserId);
          await sql`
            INSERT INTO users (id, user_token, is_premium)
            VALUES (${numericUserId}, ${token}, false)
            ON CONFLICT (id) DO NOTHING
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
            // ПРИОРИТЕТ 1: Проверяем auto_premium_source (источник истины для автоматических подписок)
            if (userData.auto_premium_source) {
              subscriptionSource = userData.auto_premium_source;
            } else {
              // ПРИОРИТЕТ 2: Проверяем Stars платежи
              const starsCheck = await sql`
                SELECT id FROM premium_transactions 
                WHERE telegram_id = ${numericUserId} 
                ORDER BY created_at DESC 
                LIMIT 1
              `;
              if (starsCheck.rows.length > 0) {
                subscriptionSource = 'stars';
              } else {
                // ПРИОРИТЕТ 3: Проверяем реферальную программу
                const referralCheck = await sql`
                  SELECT id FROM referrals 
                  WHERE referrer_id = ${numericUserId} AND reward_given = true
                  LIMIT 1
                `;
                if (referralCheck.rows.length > 0) {
                  subscriptionSource = 'referral';
                } else {
                  // ПРИОРИТЕТ 4: Проверяем триал (7 часов)
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
            premiumSource: subscriptionSource,
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
          // Ищем tg_id через users.user_token (не через ads!)
          const userLookup = await sql`
            SELECT id FROM users WHERE user_token = ${userId} LIMIT 1
          `;
          if (userLookup.rows.length > 0) {
            numericUserId = Number(userLookup.rows[0].id);
          }
        } else {
          numericUserId = Number(userId);
        }
        
        // Проверяем premium статус: users → premium_tokens
        if (isToken) {
          // Сначала проверяем users (источник истины)
          if (numericUserId && numericUserId > 0) {
            const user = await sql`SELECT is_premium, premium_until FROM users WHERE id = ${numericUserId}`;
            if (user.rows.length > 0) {
              const userPremium = user.rows[0].is_premium || false;
              const userPremiumUntil = user.rows[0].premium_until;
              const now = new Date();
              const premiumExpired = userPremiumUntil ? new Date(userPremiumUntil) <= now : false;
              isPremium = userPremium && !premiumExpired;
            }
          } else {
            // Web пользователь - проверяем premium_tokens
            const premiumTokenResult = await sql`
              SELECT is_premium, premium_until FROM premium_tokens WHERE user_token = ${userId} LIMIT 1
            `;
            if (premiumTokenResult.rows.length > 0) {
              const tokenPremium = premiumTokenResult.rows[0].is_premium || false;
              const tokenPremiumUntil = premiumTokenResult.rows[0].premium_until;
              const now = new Date();
              const premiumExpired = tokenPremiumUntil ? new Date(tokenPremiumUntil) <= now : false;
              isPremium = tokenPremium && !premiumExpired;
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
        let numericUserId: number | null = null;
        
        if (isToken) {
          // Ищем через users.user_token
          const userLookup = await sql`
            SELECT id FROM users WHERE user_token = ${userId} LIMIT 1
          `;
          if (userLookup.rows.length > 0) {
            numericUserId = Number(userLookup.rows[0].id);
          }
        } else {
          numericUserId = Number(userId);
        }
        
        // Получаем текущую дату по Алматы (UTC+5)
        const nowUTC = new Date();
        const almatyDate = new Date(nowUTC.getTime() + (5 * 60 * 60 * 1000));
        const currentAlmatyDate = almatyDate.toISOString().split('T')[0];
        
        if (numericUserId !== null && numericUserId > 0) {
          // Telegram пользователь → user_limits
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
        } else if (isToken) {
          // Web пользователь → web_user_limits
          await sql`
            INSERT INTO web_user_limits (user_token, photos_sent_today, photos_last_reset)
            VALUES (${userId}, 1, ${currentAlmatyDate}::date)
            ON CONFLICT (user_token) DO UPDATE
            SET photos_sent_today = CASE
                WHEN web_user_limits.photos_last_reset::text < ${currentAlmatyDate} THEN 1
                ELSE web_user_limits.photos_sent_today + 1
              END,
              photos_last_reset = ${currentAlmatyDate}::date,
              updated_at = NOW()
          `;
        }
        
        return NextResponse.json({ data: { success: true }, error: null });
      }

      // Активировать Premium (для теста)
      case 'toggle-premium': {
        const { userId } = params;
        
        // Определяем, это токен или числовой ID
        const isToken = userId && typeof userId === 'string' && userId.length > 20;
        let numericUserId: number | null = null;
        let isWebUser = false;
        
        if (isToken) {
          // Сначала проверяем users (Telegram пользователи)
          const userLookup = await sql`
            SELECT id FROM users WHERE user_token = ${userId} LIMIT 1
          `;
          if (userLookup.rows.length > 0) {
            numericUserId = Number(userLookup.rows[0].id);
          } else {
            // Проверяем web_user_limits (email пользователи)
            const webUserCheck = await sql`
              SELECT user_token FROM web_user_limits WHERE user_token = ${userId} LIMIT 1
            `;
            if (webUserCheck.rows.length > 0) {
              isWebUser = true;
            } else {
              return NextResponse.json({ data: { success: false }, error: { message: 'User not found' } }, { status: 404 });
            }
          }
        } else {
          numericUserId = Number(userId);
        }
        
        // Для веб-пользователей работаем с premium_tokens
        if (isWebUser) {
          const trialFlag = params?.trial7h === true || params?.trial7h === 'true';
          
          // Проверяем, не использован ли уже триал в web_user_limits
          const webUserData = await sql`
            SELECT trial7h_used FROM web_user_limits WHERE user_token = ${userId} LIMIT 1
          `;
          
          const trial7hUsed = webUserData.rows[0]?.trial7h_used || false;
          
          if (trialFlag && trial7hUsed) {
            return NextResponse.json({
              error: { message: 'Триал уже был использован' }
            }, { status: 400 });
          }
          
          const durationMs = trialFlag ? (7 * 60 * 60 * 1000) : (30 * 24 * 60 * 60 * 1000);
          const premiumUntil = new Date(Date.now() + durationMs).toISOString();
          
          // Добавляем или обновляем premium_tokens
          await sql`
            INSERT INTO premium_tokens (user_token, is_premium, premium_until, updated_at)
            VALUES (${userId}, true, ${premiumUntil}, NOW())
            ON CONFLICT (user_token) DO UPDATE
            SET is_premium = true,
                premium_until = ${premiumUntil},
                updated_at = NOW()
          `;
          
          // Отмечаем что триал использован в web_user_limits
          if (trialFlag) {
            await sql`
              UPDATE web_user_limits
              SET trial7h_used = true
              WHERE user_token = ${userId}
            `;
          }
          
          return NextResponse.json({
            data: {
              isPremium: true,
              premiumUntil,
              trial: trialFlag,
              trial7h_used: trialFlag ? true : trial7hUsed
            },
            error: null
          });
        }
        
        // Для Telegram пользователей - старая логика
        const user = await sql`SELECT is_premium, trial7h_used, auto_premium_source FROM users WHERE id = ${numericUserId}`;
        const currentStatus = user.rows[0]?.is_premium || false;
        const trial7hUsed = user.rows[0]?.trial7h_used || false;
        const autoPremiumSource = user.rows[0]?.auto_premium_source || null;
        
        // Добавляем поддержку короткого троллинг-триала (7 часов), если передан флаг trial7h
        const trialFlag = params?.trial7h === true || params?.trial7h === 'true';
        let premiumUntil: string | null = null;
        
        // ЗАЩИТА: Если у пользователя female_bonus, запрещаем trial (чтобы не перезаписать вечный Premium)
        if (trialFlag && autoPremiumSource === 'female_bonus') {
          return NextResponse.json({
            error: { message: 'У вас уже есть постоянный бонус Premium ⭐' }
          }, { status: 400 });
        }
        
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

      // Активация бонуса PRO для девушек
      case 'activate-female-bonus': {
        const { userId } = params;
        
        if (!userId || typeof userId !== 'number') {
          return NextResponse.json(
            { data: null, error: { message: 'Invalid userId' } },
            { status: 400 }
          );
        }
        
        console.log('[PREMIUM API] 🎀 Активация бонуса для девушки, userId:', userId);
        
        try {
          // Проверяем, что у пользователя first_ad_gender = "Девушка"
          const userCheck = await sql`
            SELECT first_ad_gender, auto_premium_source, is_premium
            FROM users
            WHERE id = ${userId}
            LIMIT 1
          `;
          
          if (userCheck.rows.length === 0) {
            return NextResponse.json(
              { data: null, error: { message: 'User not found' } },
              { status: 404 }
            );
          }
          
          const user = userCheck.rows[0];
          
          // Можно активировать только если первая анкета — девушка
          if (user.first_ad_gender !== 'Девушка') {
            return NextResponse.json(
              { 
                data: null, 
                error: { message: 'Bonus only available for female users' } 
              },
              { status: 403 }
            );
          }
          
          // Активируем бонус PRO на 1 год
          const premiumUntil = new Date();
          premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
          
          await sql`
            UPDATE users
            SET is_premium = TRUE,
                premium_until = ${premiumUntil.toISOString()},
                auto_premium_source = 'female_bonus',
                updated_at = NOW()
            WHERE id = ${userId}
          `;
          
          // Синхронизируем с premium_tokens (получаем user_token)
          const tokenResult = await sql`
            SELECT user_token FROM users WHERE id = ${userId} LIMIT 1
          `;
          
          if (tokenResult.rows.length > 0 && tokenResult.rows[0].user_token) {
            const userToken = tokenResult.rows[0].user_token;
            await sql`
              INSERT INTO premium_tokens (user_token, is_premium, premium_until, updated_at)
              VALUES (${userToken}, TRUE, ${premiumUntil.toISOString()}, NOW())
              ON CONFLICT (user_token) DO UPDATE
              SET is_premium = TRUE, premium_until = ${premiumUntil.toISOString()}, updated_at = NOW()
            `;
          }
          
          console.log('[PREMIUM API] ✅ Бонус PRO для девушки активирован до:', premiumUntil.toISOString());
          
          return NextResponse.json({
            data: {
              success: true,
              message: 'Female bonus activated successfully',
              isPremium: true,
              premiumUntil: premiumUntil.toISOString(),
              premiumSource: 'female_bonus'
            },
            error: null
          });
          
        } catch (bonusError: any) {
          console.error('[PREMIUM API] Ошибка активации бонуса:', bonusError);
          return NextResponse.json(
            { data: null, error: { message: bonusError.message } },
            { status: 500 }
          );
        }
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
