import { NextRequest, NextResponse } from "next/server";
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET - получение объявлений
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const id = searchParams.get('id');

    console.log("[ADS API] Получение объявлений:", { city, country, id });

    // Формируем SQL запрос с фильтрами
    let result;
    
    if (id) {
      // Получение конкретной анкеты по ID
      result = await sql`
        SELECT id, gender, target, goal, age_from, age_to, my_age, 
               body_type, text, nickname, country, region, city, 
               is_pinned, pinned_until, created_at, user_token
        FROM ads
        WHERE id = ${parseInt(id)}
        LIMIT 1
      `;
    } else if (city && country) {
      result = await sql`
        SELECT id, gender, target, goal, age_from, age_to, my_age, 
               body_type, text, nickname, country, region, city, 
               is_pinned, pinned_until, created_at, user_token
        FROM ads
        WHERE city = ${city} AND country = ${country}
        ORDER BY 
          CASE WHEN is_pinned = true AND (pinned_until IS NULL OR pinned_until > NOW()) THEN 0 ELSE 1 END,
          created_at DESC
      `;
    } else if (city) {
      result = await sql`
        SELECT id, gender, target, goal, age_from, age_to, my_age, 
               body_type, text, nickname, country, region, city, 
               is_pinned, pinned_until, created_at, user_token
        FROM ads
        WHERE city = ${city}
        ORDER BY 
          CASE WHEN is_pinned = true AND (pinned_until IS NULL OR pinned_until > NOW()) THEN 0 ELSE 1 END,
          created_at DESC
      `;
    } else if (country) {
      result = await sql`
        SELECT id, gender, target, goal, age_from, age_to, my_age, 
               body_type, text, nickname, country, region, city, 
               is_pinned, pinned_until, created_at, user_token
        FROM ads
        WHERE country = ${country}
        ORDER BY 
          CASE WHEN is_pinned = true AND (pinned_until IS NULL OR pinned_until > NOW()) THEN 0 ELSE 1 END,
          created_at DESC
      `;
    } else {
      result = await sql`
        SELECT id, gender, target, goal, age_from, age_to, my_age, 
               body_type, text, nickname, country, region, city, 
               is_pinned, pinned_until, created_at, user_token
        FROM ads
        ORDER BY 
          CASE WHEN is_pinned = true AND (pinned_until IS NULL OR pinned_until > NOW()) THEN 0 ELSE 1 END,
          created_at DESC
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
        await sql`
          INSERT INTO users (id, display_nickname, created_at, updated_at)
          VALUES (${userId}, ${nickname || null}, NOW(), NOW())
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
      
      const limitsResult = await sql`
        SELECT ads_created_today, ads_last_reset FROM user_limits WHERE user_id = ${userId}
      `;
      
      const isPremium = userResult.rows[0]?.is_premium || false;
      const adsToday = limitsResult.rows[0]?.ads_created_today || 0;
      const maxAds = isPremium ? 3 : 1;
      
      // Проверяем лимит
      if (adsToday >= maxAds) {
        console.log("[ADS API] Лимит превышен: ads_today=" + adsToday + ", max=" + maxAds);
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
    }

    // Ограничение на количество объявлений для веб-пользователей (без tgId)
    if (numericTgId === null) {
      const countRes = await sql`
        SELECT COUNT(*)::int AS c
        FROM ads
        WHERE user_token = ${finalUserToken}
          AND DATE(created_at) = CURRENT_DATE
      `;
      const used = countRes.rows[0]?.c ?? 0;
      const maxAds = 1; // FREE для веб-пользователей
      if (used >= maxAds) {
        return NextResponse.json(
          {
            success: false,
            limit: true,
            error: 'Лимит объявлений на сегодня исчерпан (1/1). Вернитесь завтра или оформите PRO в Telegram-версии.'
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
        body_type, text, nickname, country, region, city, tg_id, user_token, created_at
      )
      VALUES (
        ${gender}, ${target}, ${goal}, 
        ${parseOptionalInt(ageFrom)}, 
        ${parseOptionalInt(ageTo)}, 
        ${parseOptionalInt(myAge)},
        ${bodyType || null}, ${text}, ${nickname || 'Аноним'},
        ${country || 'Россия'}, ${region || ''}, ${city}, 
        ${numericTgId}, ${finalUserToken}, NOW()
      )
      RETURNING id, nickname, user_token, created_at, city, country, region, gender, target, goal, age_from, age_to, my_age, body_type, text
    `;

    const newAd = result.rows[0];
    
    // Увеличиваем счётчик объявлений (только для валидного userId)
    if (numericTgId !== null) {
      const userId = numericTgId;
      await sql`
        INSERT INTO user_limits (user_id, ads_created_today, ads_last_reset)
        VALUES (${userId}, 1, CURRENT_DATE)
        ON CONFLICT (user_id) DO UPDATE
        SET ads_created_today = CASE
            WHEN user_limits.ads_last_reset < CURRENT_DATE THEN 1
            ELSE user_limits.ads_created_today + 1
          END,
          ads_last_reset = CURRENT_DATE,
          updated_at = NOW()
      `;
    }
    
    console.log("[ADS API] Объявление создано, ID:", newAd.id);
    
    return NextResponse.json({
      success: true,
      message: "Объявление успешно опубликовано!",
      ad: newAd // user_token и nickname (для клиента, tg_id скрыт)
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
    const { id, tgId } = body;

    console.log("[ADS API] Запрос на удаление объявления ID:", id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID объявления не указан" },
        { status: 400 }
      );
    }

    if (!tgId) {
      return NextResponse.json(
        { success: false, error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    // Проверяем, что объявление принадлежит пользователю
    const checkResult = await sql`
      SELECT tg_id FROM ads WHERE id = ${id}
    `;

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Объявление не найдено" },
        { status: 404 }
      );
    }

    // Сравниваем с приведением к числу
    const adOwnerId = Number(checkResult.rows[0].tg_id);
    const requesterId = Number(tgId);
    
    if (adOwnerId !== requesterId) {
      console.log("[ADS API] Отказано: пользователь не владелец объявления");
      return NextResponse.json(
        { success: false, error: "Вы можете удалять только свои объявления" },
        { status: 403 }
      );
    }

    // Удаляем из Neon PostgreSQL
    await sql`DELETE FROM ads WHERE id = ${id}`;

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
          SET nickname = ${nickname}
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
          SET nickname = ${nickname}
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

    if (!tgId) {
      return NextResponse.json(
        { success: false, error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    // Проверяем, что объявление принадлежит пользователю
    const checkResult = await sql`
      SELECT tg_id FROM ads WHERE id = ${id}
    `;

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Объявление не найдено" },
        { status: 404 }
      );
    }

    // Сравниваем с приведением к числу
    const adOwnerId = Number(checkResult.rows[0].tg_id);
    const requesterId = Number(tgId);
    
    if (adOwnerId !== requesterId) {
      console.log("[ADS API] Отказано: пользователь не владелец объявления");
      return NextResponse.json(
        { success: false, error: "Вы можете обновлять только свои объявления" },
        { status: 403 }
      );
    }

    // Проверка лимита закрепления (если включаем закрепление)
    if (is_pinned) {
      const userId = Number(tgId);
      
      // Получаем статус Premium из обеих таблиц
      const userResult = await sql`
        SELECT is_premium FROM users WHERE id = ${userId}
      `;
      
      // ПРИОРИТЕТ: проверяем premium_tokens по user_token
      const adTokenResult = await sql`
        SELECT user_token FROM ads WHERE id = ${id} LIMIT 1
      `;
      const userToken = adTokenResult.rows[0]?.user_token;
      
      let isPremium = userResult.rows[0]?.is_premium || false;
      
      // Если есть токен, проверяем premium_tokens (приоритет над users.is_premium)
      if (userToken) {
        const premiumTokenResult = await sql`
          SELECT is_premium FROM premium_tokens WHERE user_token = ${userToken} LIMIT 1
        `;
        if (premiumTokenResult.rows.length > 0) {
          isPremium = premiumTokenResult.rows[0].is_premium || false;
          console.log('[ADS API] PRO проверен через premium_tokens:', isPremium);
        }
      }
      
      const limitsResult = await sql`
        SELECT pin_uses_today, pin_last_reset, last_pin_time FROM user_limits WHERE user_id = ${userId}
      `;
      
      const pinUsesToday = limitsResult.rows[0]?.pin_uses_today || 0;
      const lastPinTime = limitsResult.rows[0]?.last_pin_time;
      
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
      
      // Увеличиваем счётчик закрепления
      await sql`
        INSERT INTO user_limits (user_id, pin_uses_today, pin_last_reset, last_pin_time)
        VALUES (${userId}, 1, CURRENT_DATE, NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET pin_uses_today = CASE
            WHEN user_limits.pin_last_reset < CURRENT_DATE THEN 1
            ELSE user_limits.pin_uses_today + 1
          END,
          pin_last_reset = CURRENT_DATE,
          last_pin_time = NOW(),
          updated_at = NOW()
      `;
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
