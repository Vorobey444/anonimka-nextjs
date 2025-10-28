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
      userId 
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
      user_id: userId || 'anonymous',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
