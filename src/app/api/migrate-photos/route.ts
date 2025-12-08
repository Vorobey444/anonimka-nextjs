import { NextRequest, NextResponse } from "next/server";
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * Миграция для добавления колонки photo_urls в таблицу ads
 * POST /api/migrate-photos
 * 
 * Это временный endpoint для применения миграции
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[MIGRATE] Начинаем миграцию photo_urls...');
    
    // Выполняем миграцию
    const result = await sql`
      ALTER TABLE ads ADD COLUMN IF NOT EXISTS photo_urls TEXT[];
    `;
    
    console.log('[MIGRATE] ✅ Миграция выполнена успешно');
    
    // Проверяем, что колонка существует
    const checkResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ads' AND column_name = 'photo_urls';
    `;
    
    const columnExists = checkResult.rows.length > 0;
    
    return NextResponse.json({
      success: true,
      message: 'Миграция выполнена успешно',
      columnExists: columnExists,
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('[MIGRATE] ❌ Ошибка миграции:', error);
    
    return NextResponse.json({
      success: false,
      error: error?.message || 'Неизвестная ошибка',
      details: error?.detail || null
    }, { status: 500 });
  }
}

/**
 * GET для проверки наличия колонки
 */
export async function GET(req: NextRequest) {
  try {
    const checkResult = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'ads' AND column_name = 'photo_urls';
    `;
    
    const columnExists = checkResult.rows.length > 0;
    const columnInfo = columnExists ? checkResult.rows[0] : null;
    
    return NextResponse.json({
      success: true,
      columnExists: columnExists,
      columnInfo: columnInfo,
      message: columnExists ? 'Колонка photo_urls существует' : 'Колонка photo_urls не найдена'
    });
    
  } catch (error: any) {
    console.error('[MIGRATE] ❌ Ошибка проверки:', error);
    
    return NextResponse.json({
      success: false,
      error: error?.message || 'Ошибка при проверке таблицы'
    }, { status: 500 });
  }
}
