import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// POST - инициализация пользователя при входе в приложение
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tgId, nickname } = body;

    console.log('[USERS API] Инициализация пользователя:', { tgId, hasNickname: !!nickname });

    // Проверяем tgId (должен быть числом)
    if (!tgId || typeof tgId !== 'number') {
      return NextResponse.json(
        { success: false, error: 'tgId обязателен и должен быть числом' },
        { status: 400 }
      );
    }

    // Создаём/обновляем запись в users
    await sql`
      INSERT INTO users (id, display_nickname, created_at, updated_at)
      VALUES (${tgId}, ${nickname || null}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        display_nickname = COALESCE(EXCLUDED.display_nickname, users.display_nickname),
        updated_at = NOW()
    `;

    // Создаём запись в user_limits если её нет
    await sql`
      INSERT INTO user_limits (user_id, ads_created_today, photos_sent_today, ads_last_reset, photos_last_reset)
      VALUES (${tgId}, 0, 0, CURRENT_DATE, CURRENT_DATE)
      ON CONFLICT (user_id) DO NOTHING
    `;

    console.log('[USERS API] ✅ Пользователь инициализирован:', tgId);

    return NextResponse.json({
      success: true,
      message: 'Пользователь успешно инициализирован',
      userId: tgId
    });

  } catch (error: any) {
    console.error('[USERS API] Ошибка инициализации пользователя:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Ошибка инициализации пользователя'
      },
      { status: 500 }
    );
  }
}
