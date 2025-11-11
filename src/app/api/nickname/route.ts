import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * API для работы с никнеймами пользователей
 * GET - проверка доступности никнейма или получение никнейма пользователя
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nickname = searchParams.get('nickname');
    const tgId = searchParams.get('tgId');

    // Если передан nickname - проверяем доступность
    if (nickname) {
      console.log('[NICKNAME API] Проверка доступности:', nickname);
      
      const result = await sql`
        SELECT id FROM users WHERE display_nickname = ${nickname} LIMIT 1
      `;

      const available = result.rows.length === 0;
      
      return NextResponse.json({
        success: true,
        available,
        nickname
      });
    }

    // Если передан tgId - получаем никнейм пользователя
    if (tgId) {
      console.log('[NICKNAME API] Получение никнейма для tgId:', tgId);
      
      const result = await sql`
        SELECT display_nickname FROM users WHERE id = ${parseInt(tgId)} LIMIT 1
      `;

      const nickname = result.rows[0]?.display_nickname || null;
      
      return NextResponse.json({
        success: true,
        nickname,
        tgId
      });
    }

    return NextResponse.json(
      { success: false, error: 'Missing nickname or tgId parameter' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[NICKNAME API] Ошибка:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - установка/обновление никнейма пользователя
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tgId, nickname } = body;

    console.log('[NICKNAME API] Установка никнейма:', { tgId, nickname });

    if (!tgId || !nickname) {
      return NextResponse.json(
        { success: false, error: 'Missing tgId or nickname' },
        { status: 400 }
      );
    }

    // Проверяем доступность никнейма
    const checkResult = await sql`
      SELECT id FROM users WHERE display_nickname = ${nickname} AND id != ${parseInt(tgId)} LIMIT 1
    `;

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Nickname already taken' },
        { status: 409 }
      );
    }

    // Обновляем/создаем пользователя с никнеймом
    await sql`
      INSERT INTO users (id, display_nickname, created_at, updated_at)
      VALUES (${parseInt(tgId)}, ${nickname}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET display_nickname = ${nickname}, updated_at = NOW()
    `;

    console.log('[NICKNAME API] Никнейм успешно установлен');

    return NextResponse.json({
      success: true,
      nickname,
      tgId
    });

  } catch (error: any) {
    console.error('[NICKNAME API] Ошибка при установке никнейма:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
