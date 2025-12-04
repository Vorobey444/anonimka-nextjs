import { NextRequest, NextResponse } from "next/server";
import { sql } from '@vercel/postgres';
import { generateUserToken } from '@/lib/userToken';

export const dynamic = 'force-dynamic';

// GET - получение объявлений
export async function GET(req: NextRequest) {
  try {
    // Автоматически открепляем истекшие анкеты
    const unpinResult = await sql`
      UPDATE ads 
      SET is_pinned = false 
      WHERE is_pinned = true 
        AND pinned_until IS NOT NULL 
        AND pinned_until < NOW()
    `;
    if (unpinResult.rowCount && unpinResult.rowCount > 0) {
      console.log(`[ADS API] 📌 Автоматически откреплено ${unpinResult.rowCount} истекших анкет`);
    }
    
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const id = searchParams.get('id');
    
    console.log("[ADS API] Получение объявлений:", { city, country, id });

    // Формируем SQL запрос с фильтрами
    let result;    if (id) {
      // Получение конкретной анкеты по ID
      result = await sql`
        SELECT 
          ads.id, ads.gender, ads.target, ads.goal, ads.age_from, ads.age_to, ads.my_age, 
          ads.body_type, ads.orientation, ads.text, ads.display_nickname, ads.country, ads.region, ads.city, 
          ads.is_pinned, ads.pinned_until, ads.created_at, ads.user_token, ads.tg_id as user_id,
          COALESCE(users.is_premium, FALSE) as is_premium,
          users.premium_until
        FROM ads
        LEFT JOIN users ON (ads.tg_id = users.id OR ads.user_token = users.user_token)
        WHERE ads.id = ${parseInt(id)}
        LIMIT 1
      `;
    } else if (city && country) {
      result = await sql`
        SELECT 
          ads.id, ads.gender, ads.target, ads.goal, ads.age_from, ads.age_to, ads.my_age, 
          ads.body_type, ads.orientation, ads.text, ads.display_nickname, ads.country, ads.region, ads.city, 
          ads.is_pinned, ads.pinned_until, ads.created_at, ads.user_token, ads.tg_id as user_id,
          COALESCE(users.is_premium, FALSE) as is_premium,
          users.premium_until
        FROM ads
        LEFT JOIN users ON (ads.tg_id = users.id OR ads.user_token = users.user_token)
        WHERE ads.city = ${city} AND ads.country = ${country}
        ORDER BY 
          CASE WHEN ads.is_pinned = true AND (ads.pinned_until IS NULL OR ads.pinned_until > NOW()) THEN 0 ELSE 1 END,
          ads.created_at DESC
      `;
    } else if (city) {
      result = await sql`
        SELECT 
          ads.id, ads.gender, ads.target, ads.goal, ads.age_from, ads.age_to, ads.my_age, 
          ads.body_type, ads.orientation, ads.text, ads.display_nickname, ads.country, ads.region, ads.city, 
          ads.is_pinned, ads.pinned_until, ads.created_at, ads.user_token, ads.tg_id as user_id,
          COALESCE(users.is_premium, FALSE) as is_premium,
          users.premium_until
        FROM ads
        LEFT JOIN users ON (ads.tg_id = users.id OR ads.user_token = users.user_token)
        WHERE ads.city = ${city}
        ORDER BY 
          CASE WHEN ads.is_pinned = true AND (ads.pinned_until IS NULL OR ads.pinned_until > NOW()) THEN 0 ELSE 1 END,
          ads.created_at DESC
      `;
    } else if (country) {
      result = await sql`
        SELECT 
          ads.id, ads.gender, ads.target, ads.goal, ads.age_from, ads.age_to, ads.my_age, 
          ads.body_type, ads.orientation, ads.text, ads.display_nickname, ads.country, ads.region, ads.city, 
          ads.is_pinned, ads.pinned_until, ads.created_at, ads.user_token, ads.tg_id as user_id,
          COALESCE(users.is_premium, FALSE) as is_premium,
          users.premium_until
        FROM ads
        LEFT JOIN users ON (ads.tg_id = users.id OR ads.user_token = users.user_token)
        WHERE ads.country = ${country}
        ORDER BY 
          CASE WHEN ads.is_pinned = true AND (ads.pinned_until IS NULL OR ads.pinned_until > NOW()) THEN 0 ELSE 1 END,
          ads.created_at DESC
      `;
    } else {
      result = await sql`
        SELECT 
          ads.id, ads.gender, ads.target, ads.goal, ads.age_from, ads.age_to, ads.my_age, 
          ads.body_type, ads.orientation, ads.text, ads.display_nickname, ads.country, ads.region, ads.city, 
          ads.is_pinned, ads.pinned_until, ads.created_at, ads.user_token, ads.tg_id as user_id,
          COALESCE(users.is_premium, FALSE) as is_premium,
          users.premium_until
        FROM ads
        LEFT JOIN users ON (ads.tg_id = users.id OR ads.user_token = users.user_token)
        ORDER BY 
          CASE WHEN ads.is_pinned = true AND (ads.pinned_until IS NULL OR ads.pinned_until > NOW()) THEN 0 ELSE 1 END,
          ads.created_at DESC
      `;
    }
    
    const ads = result.rows;
    
    console.log("[ADS API] Получено объявлений:", ads.length);
    
    return NextResponse.json({
      success: true,
      ads
    });

  } catch (error: any) {
    console.error("[ADS API] Ошибка при получении объявлений:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Ошибка при загрузке объявлений"
      },
      { status: 500 }
    );
  }
}

// POST - создание объявления
export async function POST(req: NextRequest) {
  try {
    console.log("[ADS API] Создание объявления");
    
    const body = await req.json();
    
    const { 
      gender, 
      target, 
      goal, 
      ageFrom, 
      ageTo, 
      myAge, 
      body: bodyType,
      orientation,
      text,
      nickname,
      country,
      region,
      city,
      tgId,
      user_token
    } = body;

    // Helpers to safely coerce values coming from the client
    const parseOptionalInt = (v: any): number | null => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : null;
      if (typeof v === 'string') {
        const s = v.trim();
        if (s === '' || s.toLowerCase() === 'nan') return null;
        if (/^\d+$/.test(s)) return parseInt(s, 10);
        return null;
      }
      return null;
    };

    // Helper for tgId
    const resolveTgId = (val: any): number | null => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'number') return Number.isFinite(val) ? Math.trunc(val) : null;
      if (typeof val === 'string') {
        const s = val.trim();
        if (s === '' || s.toLowerCase() === 'nan') return null;
        if (/^\d+$/.test(s)) return parseInt(s, 10);
        return null;
      }
      return null;
    };

    const numericTgId = resolveTgId(tgId);
    console.log('[ADS API] tgId incoming:', tgId, '-> numericTgId:', numericTgId);

    // Генерируем user_token если не передан
    // Если есть numericTgId — используем детерминированный HMAC, чтобы токен был одинаковым на всех устройствах
    let finalUserToken = user_token;
    if (!finalUserToken) {
      const crypto = require('crypto');
      if (numericTgId !== null) {
        const secret = process.env.USER_TOKEN_SECRET || process.env.TOKEN_SECRET || 'dev-temp-secret';
        const h = crypto.createHmac('sha256', secret);
        h.update(String(numericTgId));
        h.update(':v1');
        finalUserToken = h.digest('hex');
      } else {
        // Веб-пользователь без tgId — криптографически случайный токен (32 байта = 64 hex символа)
        finalUserToken = crypto.randomBytes(32).toString('hex');
      }
    }
    
    // Безопасное логирование (без чувствительных данных)
    console.log("[ADS API] Создание объявления:", {
      gender,
      target,
      goal,
      city,
      textLength: text?.length,
      hasToken: !!finalUserToken
    });
    
    // Валидация
    if (!gender || !target || !goal || !text || !city) {
      console.log("[ADS API] Ошибка: отсутствуют обязательные поля");
      return NextResponse.json(
        { success: false, error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    // Проверка лимита объявлений (только если есть валидный numericTgId)
    if (numericTgId !== null) {
      const userId = numericTgId;
      
      // Получаем статус Premium и лимиты (пользователь должен быть уже инициализирован через /api/users)
      const userResult = await sql`
        SELECT is_premium FROM users WHERE id = ${userId}
      `;
      
      // Если пользователя нет в БД (не прошёл инициализацию) — создаём запись
      if (userResult.rows.length === 0) {
        console.warn('[ADS API] Пользователь не найден, создаём запись (fallback)');
        const token = generateUserToken(userId);
        await sql`
          INSERT INTO users (id, user_token, display_nickname, created_at, updated_at)
          VALUES (${userId}, ${token}, ${nickname || null}, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
        `;
        await sql`
          INSERT INTO user_limits (user_id)
          VALUES (${userId})
          ON CONFLICT (user_id) DO NOTHING
        `;
      } else if (nickname) {
        // Обновляем никнейм если передан (но только если пользователь уже есть)
        await sql`
          UPDATE users
          SET display_nickname = ${nickname}, updated_at = NOW()
          WHERE id = ${userId}
        `;
      }
      
      // Получаем лимиты и автоматически сбрасываем если новый день (используем PostgreSQL timezone)
      const limitsResult = await sql`
        WITH current_almaty_date AS (
          SELECT (NOW() AT TIME ZONE 'Asia/Almaty')::date as today
        )
        UPDATE user_limits
        SET 
          ads_created_today = CASE 
            WHEN ads_last_reset < (SELECT today FROM current_almaty_date) THEN 0 
            ELSE ads_created_today 
          END,
          ads_last_reset = CASE 
            WHEN ads_last_reset < (SELECT today FROM current_almaty_date) THEN (SELECT today FROM current_almaty_date)
            ELSE ads_last_reset 
          END,
          updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING ads_created_today, ads_last_reset
      `;
      
      console.log('[ADS API] Лимиты после проверки даты:', limitsResult.rows[0]);
      
      let isPremium = false;
      
      // Проверяем Premium: users (источник истины) → premium_tokens (синхронизация)
      if (finalUserToken && numericTgId !== null) {
        // Telegram пользователь: проверяем users, синхронизируем в premium_tokens
        const userPremium = userResult.rows[0]?.is_premium || false;
        const userPremiumUntil = userResult.rows[0]?.premium_until;
        const now = new Date();
        const premiumExpired = userPremiumUntil ? new Date(userPremiumUntil) <= now : false;
        
        isPremium = userPremium && !premiumExpired;
        console.log('[ADS API] PRO из users:', { isPremium, premium_until: userPremiumUntil, expired: premiumExpired });
        
        // Синхронизируем premium_tokens
        if (isPremium) {
          await sql`
            INSERT INTO premium_tokens (user_token, is_premium, premium_until, updated_at)
            VALUES (${finalUserToken}, true, ${userPremiumUntil}, NOW())
            ON CONFLICT (user_token) DO UPDATE
            SET is_premium = true, premium_until = ${userPremiumUntil}, updated_at = NOW()
          `;
        }
      } else if (finalUserToken) {
        // Web пользователь: проверяем только premium_tokens
        const premiumTokenResult = await sql`
          SELECT is_premium, premium_until FROM premium_tokens WHERE user_token = ${finalUserToken} LIMIT 1
        `;
        if (premiumTokenResult.rows.length > 0) {
          const tokenPremium = premiumTokenResult.rows[0].is_premium || false;
          const tokenPremiumUntil = premiumTokenResult.rows[0].premium_until;
          const now = new Date();
          const premiumExpired = tokenPremiumUntil ? new Date(tokenPremiumUntil) <= now : false;
          
          isPremium = tokenPremium && !premiumExpired;
          console.log('[ADS API] PRO из premium_tokens (Web):', { isPremium, expired: premiumExpired });
        }
      }
      
      const adsToday = limitsResult.rows[0]?.ads_created_today || 0;
      const lastReset = limitsResult.rows[0]?.ads_last_reset;
      const maxAds = isPremium ? 3 : 1;
      
      console.log('[ADS API] Проверка лимита:', { userId, adsToday, maxAds, isPremium, lastReset });
      
      // Проверяем лимит
      if (adsToday >= maxAds) {
        console.log("[ADS API] ❌ Лимит превышен: ads_today=" + adsToday + ", max=" + maxAds);
        return NextResponse.json(
          { 
            success: false, 
            error: isPremium 
              ? "Вы уже создали 3 объявления сегодня (лимит PRO)" 
              : "Вы уже создали объявление сегодня. Оформите PRO для 3 объявлений в день!",
            limit: true,
            isPremium
          },
          { status: 429 }
        );
      }
      
      console.log('[ADS API] ✅ Лимит в порядке, создаём анкету:', { adsToday, maxAds });
    }

    // Если nickname не передан - берем из таблицы users
    let finalNickname = nickname;
    if (!finalNickname && numericTgId !== null) {
      const userResult = await sql`
        SELECT display_nickname FROM users WHERE id = ${numericTgId} LIMIT 1
      `;
      if (userResult.rows.length > 0 && userResult.rows[0].display_nickname) {
        finalNickname = userResult.rows[0].display_nickname;
        console.log('[ADS API] Nickname взят из users:', finalNickname);
      } else {
        // Если в users тоже нет - генерируем уникальный
        finalNickname = `Аноним${numericTgId % 10000}`;
        console.log('[ADS API] Сгенерирован уникальный nickname:', finalNickname);
      }
    } else if (!finalNickname) {
      // Для web-пользователей без tgId
      finalNickname = `Гость${Math.floor(Math.random() * 10000)}`;
      console.log('[ADS API] Сгенерирован nickname для веб-пользователя:', finalNickname);
    }

    // Ограничение на количество объявлений для веб-пользователей (без tgId) - АЛМАТЫ UTC+5
    if (numericTgId === null && finalUserToken) {
      // Проверяем Premium для Web-пользователя
      let isPremiumWeb = false;
      const premiumCheckWeb = await sql`
        SELECT is_premium, premium_until FROM premium_tokens WHERE user_token = ${finalUserToken} LIMIT 1
      `;
      if (premiumCheckWeb.rows.length > 0) {
        const webPremium = premiumCheckWeb.rows[0].is_premium || false;
        const webPremiumUntil = premiumCheckWeb.rows[0].premium_until;
        const now = new Date();
        const premiumExpired = webPremiumUntil ? new Date(webPremiumUntil) <= now : false;
        isPremiumWeb = webPremium && !premiumExpired;
      }
      
      // Получаем/создаем лимиты
      const nowUTC = new Date();
      const almatyDate = new Date(nowUTC.getTime() + (5 * 60 * 60 * 1000));
      const currentAlmatyDate = almatyDate.toISOString().split('T')[0];
      
      await sql`
        INSERT INTO web_user_limits (user_token, ads_created_today, ads_last_reset)
        VALUES (${finalUserToken}, 0, ${currentAlmatyDate}::date)
        ON CONFLICT (user_token) DO NOTHING
      `;
      
      let webLimitsResult = await sql`
        SELECT ads_created_today, ads_last_reset FROM web_user_limits WHERE user_token = ${finalUserToken}
      `;
      
      // Сброс если новый день
      const lastResetDate = webLimitsResult.rows[0]?.ads_last_reset ? 
        new Date(webLimitsResult.rows[0].ads_last_reset).toISOString().split('T')[0] : null;
      
      if (lastResetDate !== currentAlmatyDate) {
        console.log('[ADS API] Сброс счетчика объявлений для Web (новый день):', { lastResetDate, currentAlmatyDate });
        await sql`
          UPDATE web_user_limits
          SET ads_created_today = 0,
              ads_last_reset = ${currentAlmatyDate}::date,
              updated_at = NOW()
          WHERE user_token = ${finalUserToken}
        `;
        webLimitsResult = await sql`
          SELECT ads_created_today FROM web_user_limits WHERE user_token = ${finalUserToken}
        `;
      }
      
      const used = webLimitsResult.rows[0]?.ads_created_today || 0;
      const maxAds = isPremiumWeb ? 3 : 1;
      
      if (used >= maxAds) {
        return NextResponse.json(
          {
            success: false,
            limit: true,
            isPremium: isPremiumWeb,
            error: isPremiumWeb 
              ? 'Вы уже создали 3 объявления сегодня (лимит PRO)'
              : 'Лимит объявлений на сегодня исчерпан (1/1). Вернитесь завтра или оформите PRO в Telegram-версии.'
          },
          { status: 429 }
        );
      }
    }

    // Вставляем в Neon PostgreSQL
    // tg_id уже приведён к числу или NULL
    
    const result = await sql`
      INSERT INTO ads (
        gender, target, goal, age_from, age_to, my_age, 
        body_type, orientation, text, display_nickname, country, region, city, tg_id, user_token, created_at
      )
      VALUES (
        ${gender}, ${target}, ${goal}, 
        ${parseOptionalInt(ageFrom)}, 
        ${parseOptionalInt(ageTo)}, 
        ${parseOptionalInt(myAge)},
        ${bodyType || null}, ${orientation || null}, ${text}, ${finalNickname},
        ${country || 'Россия'}, ${region || ''}, ${city}, 
        ${numericTgId}, ${finalUserToken}, CURRENT_TIMESTAMP
      )
      RETURNING id, display_nickname, user_token, created_at, city, country, region, gender, target, goal, age_from, age_to, my_age, body_type, orientation, text
    `;

    const newAd = result.rows[0];
    
    // Увеличиваем счётчик объявлений (используем PostgreSQL timezone Asia/Almaty)
    if (numericTgId !== null) {
      // Telegram пользователь → user_limits
      const userId = numericTgId;
      await sql`
        INSERT INTO user_limits (user_id, ads_created_today, ads_last_reset)
        VALUES (${userId}, 1, (NOW() AT TIME ZONE 'Asia/Almaty')::date)
        ON CONFLICT (user_id) DO UPDATE
        SET ads_created_today = user_limits.ads_created_today + 1,
            updated_at = NOW()
      `;
      console.log('[ADS API] Счётчик увеличен для user_id:', userId);
    } else if (finalUserToken) {
      // Web пользователь → web_user_limits
      await sql`
        INSERT INTO web_user_limits (user_token, ads_created_today, ads_last_reset)
        VALUES (${finalUserToken}, 1, (NOW() AT TIME ZONE 'Asia/Almaty')::date)
        ON CONFLICT (user_token) DO UPDATE
        SET ads_created_today = web_user_limits.ads_created_today + 1,
            updated_at = NOW()
      `;
      console.log('[ADS API] Счётчик увеличен для user_token');
    }
    
    console.log("[ADS API] Объявление создано, ID:", newAd.id);
    
    // 🎀 Проверяем бонус для девушек (только для Telegram пользователей)
    if (numericTgId !== null) {
      try {
        // Проверяем, первая ли это анкета пользователя
        const userCheck = await sql`
          SELECT first_ad_gender, auto_premium_source, is_premium, premium_until
          FROM users
          WHERE id = ${numericTgId}
          LIMIT 1
        `;

        if (userCheck.rows.length > 0) {
          const user = userCheck.rows[0];
          const currentGender = gender; // "Девушка", "Мужчина", "Пара"
          
          // Если first_ad_gender еще не установлен — это первая анкета
          if (!user.first_ad_gender) {
            console.log('[ADS API] 🎀 Первая анкета пользователя, пол:', currentGender);
            
            // Сохраняем пол первой анкеты (навсегда)
            await sql`
              UPDATE users
              SET first_ad_gender = ${currentGender},
                  updated_at = NOW()
              WHERE id = ${numericTgId}
            `;
            
            // Если первая анкета — "Девушка", выдаем бонус PRO на 1 год
            if (currentGender === 'Девушка') {
              console.log('[ADS API] 🎀 Активируем бонус PRO для девушки на 1 год');
              
              const premiumUntil = new Date();
              premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
              
              await sql`
                UPDATE users
                SET is_premium = TRUE,
                    premium_until = ${premiumUntil.toISOString()},
                    auto_premium_source = 'female_bonus',
                    updated_at = NOW()
                WHERE id = ${numericTgId}
              `;
              
              // Синхронизируем с premium_tokens
              await sql`
                INSERT INTO premium_tokens (user_token, is_premium, premium_until, updated_at)
                VALUES (${finalUserToken}, TRUE, ${premiumUntil.toISOString()}, NOW())
                ON CONFLICT (user_token) DO UPDATE
                SET is_premium = TRUE, premium_until = ${premiumUntil.toISOString()}, updated_at = NOW()
              `;
              
              console.log('[ADS API] ✅ Бонус PRO для девушки активирован до', premiumUntil.toISOString());
            }
          } else {
            // Не первая анкета — проверяем, нужно ли отменить бонус
            console.log('[ADS API] Не первая анкета. first_ad_gender:', user.first_ad_gender, ', текущий:', currentGender);
            
            // Если у пользователя был female_bonus и он создает анкету "Мужчина"
            if (user.auto_premium_source === 'female_bonus' && currentGender === 'Мужчина') {
              console.log('[ADS API] 🚫 Девушка создала мужскую анкету — отменяем бонус PRO');
              
              // Проверяем, есть ли платная подписка (защита от потери)
              const hasPaidSubscription = user.premium_until !== null;
              
              if (hasPaidSubscription) {
                console.log('[ADS API] ⚠️ Обнаружена платная подписка — сохраняем PRO, но убираем источник бонуса');
                // Убираем только источник бонуса, PRO остается (платная подписка)
                await sql`
                  UPDATE users
                  SET auto_premium_source = NULL,
                      updated_at = NOW()
                  WHERE id = ${numericTgId}
                `;
              } else {
                console.log('[ADS API] 💔 Платной подписки нет — полностью отменяем PRO');
                // Отменяем PRO полностью
                await sql`
                  UPDATE users
                  SET is_premium = FALSE,
                      premium_until = NULL,
                      auto_premium_source = NULL,
                      updated_at = NOW()
                  WHERE id = ${numericTgId}
                `;
                
                // Синхронизируем с premium_tokens
                await sql`
                  UPDATE premium_tokens
                  SET is_premium = FALSE, premium_until = NULL, updated_at = NOW()
                  WHERE user_token = ${finalUserToken}
                `;
                
                console.log('[ADS API] ❌ Бонус PRO отменен');
              }
            }
          }
        }
      } catch (bonusError) {
        console.error('[ADS API] Ошибка при проверке бонуса для девушек:', bonusError);
        // Не прерываем создание анкеты если бонус не сработал
      }
    } else if (finalUserToken) {
      // 🎀 Бонус для девушек для EMAIL пользователей
      try {
        console.log('[ADS API] 🎀 Проверяем female_bonus для email пользователя');
        
        const userCheck = await sql`
          SELECT first_ad_gender, auto_premium_source, is_premium, premium_until
          FROM users
          WHERE user_token = ${finalUserToken}
          LIMIT 1
        `;

        if (userCheck.rows.length > 0) {
          const user = userCheck.rows[0];
          const currentGender = gender;
          
          // Если first_ad_gender еще не установлен — это первая анкета
          if (!user.first_ad_gender) {
            console.log('[ADS API] 🎀 Первая анкета email пользователя, пол:', currentGender);
            
            await sql`
              UPDATE users
              SET first_ad_gender = ${currentGender},
                  updated_at = NOW()
              WHERE user_token = ${finalUserToken}
            `;
            
            if (currentGender === 'Девушка') {
              console.log('[ADS API] 🎀 Активируем бонус PRO для девушки (email) на 1 год');
              
              const premiumUntil = new Date();
              premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
              
              await sql`
                UPDATE users
                SET is_premium = TRUE,
                    premium_until = ${premiumUntil.toISOString()},
                    auto_premium_source = 'female_bonus',
                    updated_at = NOW()
                WHERE user_token = ${finalUserToken}
              `;
              
              await sql`
                INSERT INTO premium_tokens (user_token, is_premium, premium_until, updated_at)
                VALUES (${finalUserToken}, TRUE, ${premiumUntil.toISOString()}, NOW())
                ON CONFLICT (user_token) DO UPDATE
                SET is_premium = TRUE, premium_until = ${premiumUntil.toISOString()}, updated_at = NOW()
              `;
              
              console.log('[ADS API] ✅ Бонус PRO для девушки (email) активирован до', premiumUntil.toISOString());
            }
          } else if (user.auto_premium_source === 'female_bonus' && currentGender === 'Мужчина') {
            console.log('[ADS API] 🚫 Email девушка создала мужскую анкету — отменяем бонус PRO');
            
            const hasPaidSubscription = user.premium_until !== null;
            
            if (!hasPaidSubscription) {
              await sql`
                UPDATE users
                SET is_premium = FALSE,
                    premium_until = NULL,
                    auto_premium_source = NULL,
                    updated_at = NOW()
                WHERE user_token = ${finalUserToken}
              `;
              
              await sql`
                UPDATE premium_tokens
                SET is_premium = FALSE, premium_until = NULL, updated_at = NOW()
                WHERE user_token = ${finalUserToken}
              `;
              
              console.log('[ADS API] ❌ Бонус PRO отменен (email)');
            }
          }
        }
      } catch (bonusError) {
        console.error('[ADS API] Ошибка при проверке бонуса для email девушек:', bonusError);
      }
    }
    
    // Проверяем реферальную программу — выдаём награду если пользователь пришёл по реферальной ссылке
    if (finalUserToken) {
      try {
        console.log('[ADS API] Проверка рефералки для user_token:', finalUserToken);
        
        // Находим реферала по referred_token (используем РЕАЛЬНУЮ схему БД)
        const referralResult = await sql`
          SELECT id, referrer_token, reward_given
          FROM referrals 
          WHERE referred_token = ${finalUserToken}
          ORDER BY created_at DESC
          LIMIT 1
        `;

        if (referralResult.rows.length === 0) {
          console.log('[ADS API] Реферал не найден - пользователь пришел не по реферальной ссылке');
        } else {
          const referral = referralResult.rows[0];

          // Проверяем, не была ли уже выдана награда
          if (referral.reward_given) {
            console.log('[ADS API] Награда за этого реферала уже была выдана ранее');
          } else {
            // Выдаем награду реферу
            const now = new Date();
            const baseExpiry = new Date(now);
            baseExpiry.setDate(baseExpiry.getDate() + 30);

            // Проверяем, не имел ли реферер PRO ранее (акция один раз)
            const existing = await sql`SELECT user_token FROM premium_tokens WHERE user_token = ${referral.referrer_token} LIMIT 1`;
            
            if (existing.rows.length > 0) {
              console.log('[ADS API] Реферер уже получал PRO — акция действует один раз');
              await sql`UPDATE referrals SET reward_given = TRUE, reward_given_at = NOW() WHERE id = ${referral.id}`;
            } else {
              // Выдаем PRO впервые
              await sql`
                INSERT INTO premium_tokens (user_token, is_premium, premium_until)
                VALUES (${referral.referrer_token}, TRUE, ${baseExpiry.toISOString()})
              `;
              await sql`UPDATE referrals SET reward_given = TRUE, reward_given_at = NOW() WHERE id = ${referral.id}`;
              console.log('[ADS API] ✅ PRO выдан рефереру до:', baseExpiry.toISOString());
            }
          }
        }
      } catch (refError) {
        console.error('[ADS API] Ошибка при проверке рефералки:', refError);
        // Не прерываем создание анкеты если рефералка не сработала
      }
    }
    
    // Проверяем, нужно ли показать модальное окно о бонусе для девушек
    let showFemaleBonusModal = false;
    let femaleBonusLost = false;
    
    if (numericTgId !== null) {
      // Telegram пользователи
      try {
        const bonusCheck = await sql`
          SELECT first_ad_gender, auto_premium_source
          FROM users
          WHERE id = ${numericTgId}
          LIMIT 1
        `;
        
        if (bonusCheck.rows.length > 0) {
          const bonusData = bonusCheck.rows[0];
          
          // Показываем модалку если это первая анкета девушки с бонусом
          if (bonusData.first_ad_gender === 'Девушка' && bonusData.auto_premium_source === 'female_bonus') {
            // Проверяем, что это была первая анкета (count = 1 после создания)
            const adsCount = await sql`
              SELECT COUNT(*)::int as count FROM ads WHERE tg_id = ${numericTgId}
            `;
            const totalAds = adsCount.rows[0]?.count || 0;
            console.log('[ADS API] 🎀 Проверка модалки: count =', totalAds, ', bonus =', bonusData.auto_premium_source);
            
            if (totalAds === 1) {
              showFemaleBonusModal = true;
              console.log('[ADS API] 🎀 Показываем модалку бонуса для девушки');
            }
          }
          
          // Уведомление об утрате бонуса (если был бонус, но сейчас нет)
          if (bonusData.first_ad_gender === 'Девушка' && !bonusData.auto_premium_source && gender === 'Мужчина') {
            femaleBonusLost = true;
            console.log('[ADS API] 💔 Показываем уведомление об утрате бонуса');
          }
        }
      } catch (modalError) {
        console.error('[ADS API] Ошибка при проверке модального окна бонуса:', modalError);
      }
    } else if (finalUserToken) {
      // Email пользователи
      try {
        const bonusCheck = await sql`
          SELECT first_ad_gender, auto_premium_source
          FROM users
          WHERE user_token = ${finalUserToken}
          LIMIT 1
        `;
        
        if (bonusCheck.rows.length > 0) {
          const bonusData = bonusCheck.rows[0];
          
          if (bonusData.first_ad_gender === 'Девушка' && bonusData.auto_premium_source === 'female_bonus') {
            const adsCount = await sql`
              SELECT COUNT(*)::int as count FROM ads WHERE user_token = ${finalUserToken}
            `;
            const totalAds = adsCount.rows[0]?.count || 0;
            console.log('[ADS API] 🎀 Проверка модалки (email): count =', totalAds, ', bonus =', bonusData.auto_premium_source);
            
            if (totalAds === 1) {
              showFemaleBonusModal = true;
              console.log('[ADS API] 🎀 Показываем модалку бонуса для email девушки');
            }
          }
          
          if (bonusData.first_ad_gender === 'Девушка' && !bonusData.auto_premium_source && gender === 'Мужчина') {
            femaleBonusLost = true;
            console.log('[ADS API] 💔 Показываем уведомление об утрате бонуса (email)');
          }
        }
      } catch (modalError) {
        console.error('[ADS API] Ошибка при проверке модального окна бонуса (email):', modalError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Объявление успешно опубликовано!",
      ad: newAd, // user_token и nickname (для клиента, tg_id скрыт)
      showFemaleBonusModal,
      femaleBonusLost
    });

  } catch (error: any) {
    console.error("[ADS API] Ошибка при создании объявления:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Ошибка при создании объявления"
      },
      { status: 500 }
    );
  }
}

// OPTIONS для CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// DELETE - удаление объявления
export async function DELETE(req: NextRequest) {
  try {
    // Читаем данные из тела запроса вместо URL параметров (для обхода AdBlock)
    const body = await req.json();
    const { id, tgId, userToken } = body;

    console.log("[ADS API] Запрос на удаление объявления ID:", id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID объявления не указан" },
        { status: 400 }
      );
    }

    if (!tgId && !userToken) {
      return NextResponse.json(
        { success: false, error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    // Проверяем, что объявление принадлежит пользователю
    const checkResult = await sql`
      SELECT tg_id, user_token, created_at FROM ads WHERE id = ${id}
    `;

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Объявление не найдено" },
        { status: 404 }
      );
    }

    const ad = checkResult.rows[0];
    let isOwner = false;

    // Проверяем владение: по tgId (Telegram) или по userToken (email)
    if (tgId && ad.tg_id) {
      isOwner = Number(ad.tg_id) === Number(tgId);
    } else if (userToken && ad.user_token) {
      isOwner = ad.user_token === userToken;
    }
    
    if (!isOwner) {
      console.log("[ADS API] Отказано: пользователь не владелец объявления");
      return NextResponse.json(
        { success: false, error: "Вы можете удалять только свои объявления" },
        { status: 403 }
      );
    }

    // Удаляем из Neon PostgreSQL
    await sql`DELETE FROM ads WHERE id = ${id}`;

    // Если объявление было создано сегодня (по времени Алматы UTC+5), уменьшаем счётчик объявлений за день
    try {
      const createdAt: any = ad.created_at;
      if (createdAt) {
        // Определяем текущую дату и дату создания в часовом поясе Алматы (UTC+5)
        const nowUTC = new Date();
        const almatyNow = new Date(nowUTC.getTime() + (5 * 60 * 60 * 1000));
        const currentAlmatyDate = almatyNow.toISOString().split('T')[0];

        const createdUTC = new Date(createdAt);
        const createdAlmaty = new Date(createdUTC.getTime() + (5 * 60 * 60 * 1000));
        const createdAlmatyDate = createdAlmaty.toISOString().split('T')[0];

        if (createdAlmatyDate === currentAlmatyDate) {
          // Для Telegram пользователей - user_limits
          if (tgId && ad.tg_id) {
            await sql`
              UPDATE user_limits
              SET ads_created_today = GREATEST(0, COALESCE(ads_created_today, 0) - 1),
                  updated_at = NOW()
              WHERE user_id = ${Number(tgId)}
            `;
            console.log('[ADS API] Декремент счётчика для Telegram user:', tgId);
          } 
          // Для email пользователей - web_user_limits
          else if (userToken && ad.user_token) {
            await sql`
              UPDATE web_user_limits
              SET ads_created_today = GREATEST(0, COALESCE(ads_created_today, 0) - 1),
                  updated_at = NOW()
              WHERE user_token = ${userToken}
            `;
            console.log('[ADS API] Декремент счётчика для email user');
          }
        }
      }
    } catch (decErr) {
      console.warn('[ADS API] Не удалось декрементировать счётчик объявлений:', decErr);
    }

    console.log("[ADS API] Объявление успешно удалено:", id);
    
    return NextResponse.json({
      success: true,
      message: "Объявление удалено"
    });

  } catch (error: any) {
    console.error("[ADS API] Ошибка при удалении объявления:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Ошибка при удалении объявления"
      },
      { status: 500 }
    );
  }
}

// PATCH - обновление объявления (закрепление или массовое обновление никнейма)
export async function PATCH(req: NextRequest) {
  try {
    console.log("[ADS API] Обновление объявления");
    
    const body = await req.json();
  const { id, tgId, is_pinned, pinned_until, action, nickname, userToken } = body;

  console.log("[ADS API] Данные для обновления:", { id, tgId, is_pinned, pinned_until, action, nickname, hasUserToken: Boolean(userToken) });

    // Обработка массового обновления никнейма
    if (action === 'update-all-nicknames') {
      if (!nickname) {
        return NextResponse.json(
          { success: false, error: "Никнейм не указан" },
          { status: 400 }
        );
      }

      // Поддерживаем два способа идентификации: через tgId или через userToken.
      // Для обратной совместимости: если в tgId пришла 64-символьная hex-строка — считаем это токеном.
      const isHex64 = (val: any) => typeof val === 'string' && /^[0-9a-f]{64}$/i.test(val);

      let updated;
      if (userToken || isHex64(tgId)) {
        const token = userToken || tgId; // tgId на самом деле содержит токен (исторически с фронта)
        updated = await sql`
          UPDATE ads
          SET display_nickname = ${nickname}
          WHERE user_token = ${token}
          RETURNING id
        `;
        console.log("[ADS API] Никнейм обновлен по user_token, кол-во:", updated.rows.length);

        // Также обновляем display_nickname в таблице users для связанного tg_id (если есть такие объявления)
        await sql`
          UPDATE users
          SET display_nickname = ${nickname}, updated_at = NOW()
          WHERE id IN (
            SELECT tg_id FROM ads WHERE user_token = ${token} AND tg_id IS NOT NULL LIMIT 1
          )
        `;
      } else if (tgId) {
        updated = await sql`
          UPDATE ads 
          SET display_nickname = ${nickname}
          WHERE tg_id = ${tgId}
          RETURNING id
        `;
        console.log("[ADS API] Никнейм обновлен по tg_id, кол-во:", updated.rows.length);

        await sql`
          UPDATE users
          SET display_nickname = ${nickname}, updated_at = NOW()
          WHERE id = ${tgId}
        `;
      } else {
        return NextResponse.json(
          { success: false, error: "Требуется авторизация" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Никнейм обновлен в ${updated.rows.length} анкет(е/ах)`,
        count: updated.rows.length
      });
    }

    // Обычное обновление (закрепление)
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID объявления не указан" },
        { status: 400 }
      );
    }

    // Проверяем идентификацию: user_token (email) или tgId (Telegram)
    const finalUserToken = body.user_token;
    if (!tgId && !finalUserToken) {
      return NextResponse.json(
        { success: false, error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    // Проверяем, что объявление принадлежит пользователю
    const checkResult = await sql`
      SELECT tg_id, user_token FROM ads WHERE id = ${id}
    `;

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Объявление не найдено" },
        { status: 404 }
      );
    }

    const adData = checkResult.rows[0];
    let isOwner = false;

    // Проверка владения: по user_token (приоритет для email) или по tg_id
    if (finalUserToken && adData.user_token === finalUserToken) {
      isOwner = true;
      console.log("[ADS API] Владение подтверждено по user_token (email)");
    } else if (tgId && Number(adData.tg_id) === Number(tgId)) {
      isOwner = true;
      console.log("[ADS API] Владение подтверждено по tg_id (Telegram)");
    }
    
    if (!isOwner) {
      console.log("[ADS API] Отказано: пользователь не владелец объявления");
      return NextResponse.json(
        { success: false, error: "Вы можете обновлять только свои объявления" },
        { status: 403 }
      );
    }

    // Проверка лимита закрепления (если включаем закрепление)
    if (is_pinned) {
      const userId = tgId ? Number(tgId) : null;
      
      // Получаем user_token из ads для проверки Premium
      const adTokenResult = await sql`
        SELECT user_token FROM ads WHERE id = ${id} LIMIT 1
      `;
      const userToken = adTokenResult.rows[0]?.user_token || finalUserToken;
      
      // Получаем статус Premium (только для Telegram пользователей)
      let userResult = null;
      if (userId) {
        userResult = await sql`
          SELECT is_premium FROM users WHERE id = ${userId}
        `;
      }
      
      let isPremium = false;
      
      // Проверяем Premium: для email - из users по user_token, для Telegram - из users по id
      if (userId !== null && userResult && userResult.rows.length > 0) {
        // Telegram пользователь
        const userPremium = userResult.rows[0].is_premium || false;
        const userPremiumUntil = userResult.rows[0].premium_until;
        const now = new Date();
        const premiumExpired = userPremiumUntil ? new Date(userPremiumUntil) <= now : false;
        
        isPremium = userPremium && !premiumExpired;
        console.log('[ADS API PIN] PRO из users (Telegram):', { isPremium, expired: premiumExpired });
      } else if (userToken) {
        // Email пользователь - проверяем по user_token в таблице users
        const emailUserResult = await sql`
          SELECT is_premium, premium_until FROM users WHERE user_token = ${userToken} LIMIT 1
        `;
        if (emailUserResult.rows.length > 0) {
          const userPremium = emailUserResult.rows[0].is_premium || false;
          const userPremiumUntil = emailUserResult.rows[0].premium_until;
          const now = new Date();
          const premiumExpired = userPremiumUntil ? new Date(userPremiumUntil) <= now : false;
          
          isPremium = userPremium && !premiumExpired;
          console.log('[ADS API PIN] PRO из users (Email):', { isPremium, expired: premiumExpired });
        }
      }
      
      let pinUsesToday = 0;
      let lastPinTime = null;
      
      // Получаем лимиты в зависимости от типа пользователя
      if (userId !== null) {
        // Telegram пользователь - используем user_limits
        const limitsResult = await sql`
          SELECT pin_uses_today, pin_last_reset, last_pin_time FROM user_limits WHERE user_id = ${userId}
        `;
        pinUsesToday = limitsResult.rows[0]?.pin_uses_today || 0;
        lastPinTime = limitsResult.rows[0]?.last_pin_time;
      } else if (userToken) {
        // Email пользователь - используем web_user_limits
        const webLimitsResult = await sql`
          SELECT pin_uses_today, pin_last_reset, last_pin_time FROM web_user_limits WHERE user_token = ${userToken}
        `;
        pinUsesToday = webLimitsResult.rows[0]?.pin_uses_today || 0;
        lastPinTime = webLimitsResult.rows[0]?.last_pin_time;
      }
      
      // Проверяем лимит
      if (isPremium) {
        // PRO: 3 раза в день
        if (pinUsesToday >= 3) {
          return NextResponse.json(
            { 
              success: false, 
              error: "Вы уже использовали 3 закрепления сегодня (лимит PRO)",
              limit: true
            },
            { status: 429 }
          );
        }
      } else {
        // FREE: 1 раз в 3 дня
        if (lastPinTime) {
          const lastPin = new Date(lastPinTime);
          const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
          
          if (lastPin > threeDaysAgo) {
            const nextAvailable = new Date(lastPin.getTime() + 3 * 24 * 60 * 60 * 1000);
            const hoursLeft = Math.ceil((nextAvailable.getTime() - Date.now()) / (1000 * 60 * 60));
            
            return NextResponse.json(
              { 
                success: false, 
                error: `Закрепление доступно через ${hoursLeft}ч. Оформите PRO для 3 закреплений в день!`,
                limit: true,
                isPremium: false
              },
              { status: 429 }
            );
          }
        }
      }
      
      // Увеличиваем счётчик закрепления (АЛМАТЫ UTC+5)
      const nowUTC = new Date();
      const almatyDate = new Date(nowUTC.getTime() + (5 * 60 * 60 * 1000));
      const currentAlmatyDate = almatyDate.toISOString().split('T')[0];
      
      if (userId !== null) {
        // Telegram пользователь - обновляем user_limits
        await sql`
          INSERT INTO user_limits (user_id, pin_uses_today, pin_last_reset, last_pin_time)
          VALUES (${userId}, 1, ${currentAlmatyDate}::date, NOW())
          ON CONFLICT (user_id) DO UPDATE
          SET pin_uses_today = CASE
              WHEN user_limits.pin_last_reset::text < ${currentAlmatyDate} THEN 1
              ELSE user_limits.pin_uses_today + 1
            END,
            pin_last_reset = ${currentAlmatyDate}::date,
            last_pin_time = NOW(),
            updated_at = NOW()
        `;
      } else if (userToken) {
        // Email пользователь - обновляем web_user_limits
        await sql`
          INSERT INTO web_user_limits (user_token, pin_uses_today, pin_last_reset, last_pin_time)
          VALUES (${userToken}, 1, ${currentAlmatyDate}::date, NOW())
          ON CONFLICT (user_token) DO UPDATE
          SET pin_uses_today = CASE
              WHEN web_user_limits.pin_last_reset::text < ${currentAlmatyDate} THEN 1
              ELSE web_user_limits.pin_uses_today + 1
            END,
            pin_last_reset = ${currentAlmatyDate}::date,
            last_pin_time = NOW(),
            updated_at = NOW()
        `;
      }
    }

    // Обновляем в Neon PostgreSQL
    const result = await sql`
      UPDATE ads 
      SET 
        is_pinned = ${is_pinned !== undefined ? is_pinned : false},
        pinned_until = ${pinned_until || null}
      WHERE id = ${id}
      RETURNING *
    `;
    
    console.log("[ADS API] Объявление успешно обновлено:", result.rows[0]);
    
    return NextResponse.json({
      success: true,
      message: "Объявление обновлено",
      ad: result.rows[0]
    });

  } catch (error: any) {
    console.error("[ADS API] Ошибка при обновлении объявления:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Ошибка при обновлении объявления"
      },
      { status: 500 }
    );
  }
}
