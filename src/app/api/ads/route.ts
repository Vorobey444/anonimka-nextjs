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
    let query = sql`
      SELECT * FROM ads
      WHERE 1=1
    `;

    if (city) {
      query = sql`
        SELECT * FROM ads
        WHERE city = ${city}
      `;
      
      if (country) {
        query = sql`
          SELECT * FROM ads
          WHERE city = ${city} AND country = ${country}
        `;
      }
    } else if (country) {
      query = sql`
        SELECT * FROM ads
        WHERE country = ${country}
      `;
    } else {
      query = sql`SELECT * FROM ads`;
    }

    // Добавляем сортировку: закрепленные первыми, потом по дате
    const result = await sql`
      SELECT * FROM ads
      ${city ? sql`WHERE city = ${city}` : sql``}
      ${city && country ? sql`AND country = ${country}` : !city && country ? sql`WHERE country = ${country}` : sql``}
      ORDER BY 
        CASE WHEN is_pinned = true AND (pinned_until IS NULL OR pinned_until > NOW()) THEN 0 ELSE 1 END,
        created_at DESC
    `;
    
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
