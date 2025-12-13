import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// Маппинг полных названий стран на ISO коды
const COUNTRY_MAPPING: Record<string, string> = {
  'kazakhstan': 'KZ',
  'казахстан': 'KZ',
  'russia': 'RU',
  'россия': 'RU',
  'ukraine': 'UA',
  'украина': 'UA',
  'belarus': 'BY',
  'беларусь': 'BY',
  'uzbekistan': 'UZ',
  'узбекистан': 'UZ',
  'kyrgyzstan': 'KG',
  'кыргызстан': 'KG',
  'tajikistan': 'TJ',
  'таджикистан': 'TJ',
  'turkmenistan': 'TM',
  'туркменистан': 'TM',
  'azerbaijan': 'AZ',
  'азербайджан': 'AZ',
  'armenia': 'AM',
  'армения': 'AM',
  'georgia': 'GE',
  'грузия': 'GE',
  'moldova': 'MD',
  'молдова': 'MD'
};

/**
 * API для сохранения локации пользователя
 */
export async function POST(request: NextRequest) {
  try {
    let { userToken, country, region, city } = await request.json();
    
    // Конвертируем полное название страны в ISO код
    if (country && country.length > 2) {
      const countryLower = country.toLowerCase();
      country = COUNTRY_MAPPING[countryLower] || country.substring(0, 2).toUpperCase();
    }

    if (!userToken) {
      return NextResponse.json(
        { success: false, error: 'userToken обязателен' },
        { status: 400 }
      );
    }

    if (!country || !city) {
      return NextResponse.json(
        { success: false, error: 'Страна и город обязательны' },
        { status: 400 }
      );
    }

    console.log('[Location] Сохранение локации:', { userToken, country, region, city });

    // Формируем JSON объект для location
    const locationData = JSON.stringify({
      country,
      region: region || null,
      city
    });

    // Обновляем локацию пользователя в БД
    await sql`
      UPDATE users 
      SET 
        location = ${locationData}::jsonb,
        updated_at = NOW()
      WHERE user_token = ${userToken}
    `;

    console.log('[Location] ✅ Локация сохранена');

    return NextResponse.json({
      success: true,
      message: 'Локация сохранена'
    });

  } catch (error: any) {
    console.error('[Location] ❌ Ошибка:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
