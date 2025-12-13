import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * API для проверки и миграции данных location
 * GET - получить статистику и примеры
 * POST - выполнить миграцию
 */
export async function GET(request: NextRequest) {
  try {
    // Статистика
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(location) as with_location,
        COUNT(*) FILTER (WHERE location IS NULL) as null_location
      FROM users
    `;

    // Примеры текущих локаций
    const examples = await sql`
      SELECT id, display_nickname, location, created_at 
      FROM users 
      WHERE location IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 20
    `;

    // Пользователи без локации
    const noLocation = await sql`
      SELECT id, display_nickname, created_at 
      FROM users 
      WHERE location IS NULL
      ORDER BY created_at DESC 
      LIMIT 20
    `;

    return NextResponse.json({
      success: true,
      stats: stats.rows[0],
      examples: examples.rows,
      noLocation: noLocation.rows
    });

  } catch (error: any) {
    console.error('[Location Check] Ошибка:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - миграция данных location к новому формату
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'set_default_for_null') {
      // Устанавливаем дефолтную локацию для пользователей без локации
      const result = await sql`
        UPDATE users 
        SET location = '{"country": "KZ", "city": "Алматы", "region": null}'::jsonb
        WHERE location IS NULL
        RETURNING id, display_nickname
      `;

      return NextResponse.json({
        success: true,
        message: `Обновлено ${result.rowCount} записей`,
        updated: result.rows
      });
    }

    if (action === 'fix_format') {
      // Исправляем записи с неправильным форматом (если есть)
      // Например, если location было строкой "Алматы" вместо JSON
      const result = await sql`
        UPDATE users 
        SET location = jsonb_build_object(
          'country', 'KZ',
          'city', COALESCE(location->>'city', location::text, 'Алматы'),
          'region', location->>'region'
        )
        WHERE location IS NOT NULL 
          AND (
            location->>'country' IS NULL 
            OR jsonb_typeof(location) != 'object'
          )
        RETURNING id, display_nickname, location
      `;

      return NextResponse.json({
        success: true,
        message: `Исправлено ${result.rowCount} записей`,
        fixed: result.rows
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action. Use: set_default_for_null or fix_format' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Location Migration] Ошибка:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
