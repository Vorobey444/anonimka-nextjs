import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/all-ids
 * Возвращает список всех telegram ID пользователей для broadcast рассылки
 * Только уникальные ID из таблицы users
 */
export async function GET() {
  try {
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
