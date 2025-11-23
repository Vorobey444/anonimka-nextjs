import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// ID администратора (только он может получить список всех пользователей)
const ADMIN_TG_ID = 884253640;

/**
 * GET /api/users/all-ids
 * Возвращает список всех telegram ID пользователей для broadcast рассылки
 * Только уникальные ID из таблицы users
 * ТОЛЬКО ДЛЯ АДМИНИСТРАТОРА
 */
export async function GET(request: NextRequest) {
  try {
    // Проверяем admin_id из заголовков или query параметров
    const adminId = request.nextUrl.searchParams.get('admin_id');
    
    if (!adminId || parseInt(adminId) !== ADMIN_TG_ID) {
      return NextResponse.json(
        { error: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }
    
    // Получаем все уникальные telegram ID из таблицы users
    const result = await sql`
      SELECT DISTINCT id 
      FROM users 
      WHERE id IS NOT NULL
      ORDER BY id
    `;
    
    const user_ids = result.rows.map(row => row.id);
    
    return NextResponse.json({
      user_ids,
      count: user_ids.length
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching all user IDs:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
