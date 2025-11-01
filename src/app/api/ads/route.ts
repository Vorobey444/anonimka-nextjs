import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';

// GET - получение объявлений
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const country = searchParams.get('country');

    console.log("[ADS API] Получение объявлений:", { city, country });

    // Проверяем наличие Supabase переменных
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error("[ADS API] Supabase переменные не настроены");
      return NextResponse.json(
        { success: false, error: "База данных не настроена" },
        { status: 500 }
      );
    }

    // Формируем URL для запроса к Supabase REST API
    let supabaseQuery = `${SUPABASE_URL}/rest/v1/ads?select=*&order=created_at.desc`;
    
    if (city) {
      supabaseQuery += `&city=eq.${encodeURIComponent(city)}`;
    }
    if (country) {
      supabaseQuery += `&country=eq.${encodeURIComponent(country)}`;
    }

    const response = await fetch(supabaseQuery, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.statusText}`);
    }

    const ads = await response.json();
    
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

    // Проверяем наличие Supabase переменных
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error("[ADS API] Supabase переменные не настроены");
      return NextResponse.json(
        { success: false, error: "База данных не настроена" },
        { status: 500 }
      );
    }

    // Подготавливаем данные для вставки
    const adData = {
      gender,
      target,
      goal,
      age_from: parseInt(ageFrom) || null,
      age_to: parseInt(ageTo) || null,
      my_age: parseInt(myAge) || null,
      body_type: bodyType,
      text,
      country: country || 'Россия',
      region: region || '',
      city,
      tg_id: tgId || 'anonymous',
      created_at: new Date().toISOString()
    };

    console.log("[ADS API] Сохраняем в Supabase:", adData);

    // Отправляем в Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ads`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(adData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log("[ADS API] Объявление создано:", result);
    
    return NextResponse.json({
      success: true,
      message: "Объявление успешно опубликовано!",
      ad: result[0]
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const tgId = searchParams.get('tgId');

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

    // Проверяем наличие Supabase переменных
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error("[ADS API] Supabase переменные не настроены");
      return NextResponse.json(
        { success: false, error: "База данных не настроена" },
        { status: 500 }
      );
    }

    // Сначала проверяем, что объявление принадлежит пользователю
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/ads?id=eq.${id}&select=tg_id`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    if (!checkResponse.ok) {
      throw new Error(`Supabase error: ${checkResponse.statusText}`);
    }

    const ads = await checkResponse.json();
    
    if (!ads || ads.length === 0) {
      return NextResponse.json(
        { success: false, error: "Объявление не найдено" },
        { status: 404 }
      );
    }

    if (ads[0].tg_id !== tgId) {
      console.log("[ADS API] Попытка удалить чужое объявление:", { adOwner: ads[0].tg_id, requester: tgId });
      return NextResponse.json(
        { success: false, error: "Вы можете удалять только свои объявления" },
        { status: 403 }
      );
    }

    // Удаляем из Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ads?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.statusText}`);
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

    // Проверяем наличие Supabase переменных
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error("[ADS API] Supabase переменные не настроены");
      return NextResponse.json(
        { success: false, error: "База данных не настроена" },
        { status: 500 }
      );
    }

    // Сначала проверяем, что объявление принадлежит пользователю
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/ads?id=eq.${id}&select=tg_id`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    if (!checkResponse.ok) {
      throw new Error(`Supabase error: ${checkResponse.statusText}`);
    }

    const ads = await checkResponse.json();
    
    if (!ads || ads.length === 0) {
      return NextResponse.json(
        { success: false, error: "Объявление не найдено" },
        { status: 404 }
      );
    }

    if (ads[0].tg_id !== tgId) {
      console.log("[ADS API] Попытка обновить чужое объявление:", { adOwner: ads[0].tg_id, requester: tgId });
      return NextResponse.json(
        { success: false, error: "Вы можете обновлять только свои объявления" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
    if (pinned_until !== undefined) updateData.pinned_until = pinned_until;

    console.log("[ADS API] Обновляем объявление:", updateData);

    // Обновляем в Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ads?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log("[ADS API] Объявление успешно обновлено:", result);
    
    return NextResponse.json({
      success: true,
      message: "Объявление обновлено",
      ad: result[0]
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
