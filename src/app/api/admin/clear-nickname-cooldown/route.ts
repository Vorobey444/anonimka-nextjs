import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * ADMIN ONLY: Очистить nickname_changed_at для пользователя
 * Использование: GET /api/admin/clear-nickname-cooldown?nickname=Admin
 */
export async function GET(request: NextRequest) {
  try {
    const nickname = request.nextUrl.searchParams.get('nickname');
    
    if (!nickname) {
      return NextResponse.json(
        { success: false, error: 'Missing nickname parameter' },
        { status: 400 }
      );
    }

    console.log('[ADMIN] Ищем пользователя с никнеймом:', nickname);
    
    const findResult = await sql`
      SELECT id, display_nickname, nickname_changed_at 
      FROM users 
      WHERE LOWER(display_nickname) = LOWER(${nickname}) 
      LIMIT 1
    `;

    if (findResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = findResult.rows[0];
    const userId = user.id;

    console.log('[ADMIN] Найден пользователь:', user);
    console.log('[ADMIN] Очищаем nickname_changed_at для userId:', userId);

    // Очищаем nickname_changed_at чтобы убрать блокировку
    const updateResult = await sql`
      UPDATE users 
      SET nickname_changed_at = NULL 
      WHERE id = ${userId} 
      RETURNING id, display_nickname, nickname_changed_at
    `;

    console.log('[ADMIN] ✅ Блокировка очищена!');

    return NextResponse.json({
      success: true,
      message: 'Cooldown cleared successfully',
      user: updateResult.rows[0]
    });

  } catch (error: any) {
    console.error('[ADMIN] Ошибка:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
