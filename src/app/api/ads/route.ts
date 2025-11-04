import { NextRequest, NextResponse } from "next/server";
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET - получение объявлений
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const country = searchParams.get('country');

    console.log("[ADS API] Получение объявлений:", { city, country });

    // Формируем SQL запрос с фильтрами
    let result;
    
    if (city && country) {
      result = await sql`
        SELECT * FROM ads
        WHERE city = ${city} AND country = ${country}
        ORDER BY 
          CASE WHEN is_pinned = true AND (pinned_until IS NULL OR pinned_until > NOW()) THEN 0 ELSE 1 END,
          created_at DESC
      `;
    } else if (city) {
      result = await sql`
        SELECT * FROM ads
        WHERE city = ${city}
        ORDER BY 
          CASE WHEN is_pinned = true AND (pinned_until IS NULL OR pinned_until > NOW()) THEN 0 ELSE 1 END,
          created_at DESC
      `;
    } else if (country) {
      result = await sql`
        SELECT * FROM ads
        WHERE country = ${country}
        ORDER BY 
          CASE WHEN is_pinned = true AND (pinned_until IS NULL OR pinned_until > NOW()) THEN 0 ELSE 1 END,
          created_at DESC
      `;
    } else {
      result = await sql`
        SELECT * FROM ads
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
      country,
      region,
      city,
      tgId 
    } = body;
    
    console.log("[ADS API] Данные объявления:", {
      gender,
      target,
      goal,
      city,
      textLength: text?.length
    });
    
    // Валидация
    if (!gender || !target || !goal || !text || !city) {
      console.log("[ADS API] Ошибка: отсутствуют обязательные поля");
      return NextResponse.json(
        { success: false, error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    // Проверка лимита объявлений
    if (tgId && tgId !== 'anonymous') {
      const userId = Number(tgId);
      
      // Создаём пользователя если его нет
      await sql`
        INSERT INTO users (id, created_at, updated_at)
        VALUES (${userId}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `;
      
      // Получаем статус Premium и лимиты
      const userResult = await sql`
        SELECT is_premium FROM users WHERE id = ${userId}
      `;
      
      const limitsResult = await sql`
        SELECT ads_created_today, ads_last_reset FROM user_limits WHERE user_id = ${userId}
      `;
      
      const isPremium = userResult.rows[0]?.is_premium || false;
      const adsToday = limitsResult.rows[0]?.ads_created_today || 0;
      const maxAds = isPremium ? 3 : 1;
      
      // Проверяем лимит
      if (adsToday >= maxAds) {
        console.log("[ADS API] Превышен лимит объявлений:", { adsToday, maxAds, isPremium });
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

    // Вставляем в Neon PostgreSQL
    const result = await sql`
      INSERT INTO ads (
        gender, target, goal, age_from, age_to, my_age, 
        body_type, text, country, region, city, tg_id, created_at
      )
      VALUES (
        ${gender}, ${target}, ${goal}, 
        ${ageFrom ? parseInt(ageFrom) : null}, 
        ${ageTo ? parseInt(ageTo) : null}, 
        ${myAge ? parseInt(myAge) : null},
        ${bodyType || null}, ${text}, 
        ${country || 'Россия'}, ${region || ''}, ${city}, 
        ${tgId || 'anonymous'}, NOW()
      )
      RETURNING *
    `;

    const newAd = result.rows[0];
    
    // Увеличиваем счётчик объявлений
    if (tgId && tgId !== 'anonymous') {
      const userId = Number(tgId);
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
    
    console.log("[ADS API] Объявление создано:", newAd);
    
    return NextResponse.json({
      success: true,
      message: "Объявление успешно опубликовано!",
      ad: newAd
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

    console.log("[ADS API] Удаление объявления:", { id, tgId });

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
      console.log("[ADS API] Попытка удалить чужое объявление:", { 
        adOwner: checkResult.rows[0].tg_id, 
        requester: tgId
      });
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

// PATCH - обновление объявления (закрепление)
export async function PATCH(req: NextRequest) {
  try {
    console.log("[ADS API] Обновление объявления");
    
    const body = await req.json();
    const { id, tgId, is_pinned, pinned_until } = body;

    console.log("[ADS API] Данные для обновления:", { id, tgId, is_pinned, pinned_until });

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
      console.log("[ADS API] Попытка обновить чужое объявление:", { 
        adOwner: checkResult.rows[0].tg_id, 
        requester: tgId
      });
      return NextResponse.json(
        { success: false, error: "Вы можете обновлять только свои объявления" },
        { status: 403 }
      );
    }

    // Проверка лимита закрепления (если включаем закрепление)
    if (is_pinned) {
      const userId = Number(tgId);
      
      // Получаем статус Premium и лимиты
      const userResult = await sql`
        SELECT is_premium FROM users WHERE id = ${userId}
      `;
      
      const limitsResult = await sql`
        SELECT pin_uses_today, pin_last_reset, last_pin_time FROM user_limits WHERE user_id = ${userId}
      `;
      
      const isPremium = userResult.rows[0]?.is_premium || false;
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
