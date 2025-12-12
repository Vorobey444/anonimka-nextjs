import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * API для сохранения локации пользователя
 */
export async function POST(request: NextRequest) {
  try {
    const { userToken, country, region, city } = await request.json();

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

    // Обновляем локацию пользователя в БД
    await sql`
      UPDATE users 
      SET 
        country = ${country},
        region = ${region || ''},
        city = ${city},
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
