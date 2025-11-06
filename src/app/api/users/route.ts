import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// POST - инициализация пользователя при входе в приложение
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tgId, nickname } = body;

    console.log('[USERS API] Инициализация пользователя (анонимно)');

    // Проверяем tgId (должен быть числом)
    if (!tgId || typeof tgId !== 'number') {
      return NextResponse.json(
        { success: false, error: 'tgId обязателен и должен быть числом' },
        { status: 400 }
      );
    }

    // Проверяем, есть ли уже user в БД с токеном
    const existingUser = await sql`
      SELECT user_token FROM users WHERE id = ${tgId} LIMIT 1
    `;

    let userToken = existingUser.rows[0]?.user_token;

    // Если токена нет - генерируем новый (первый вход)
    if (!userToken) {
      const crypto = require('crypto');
      userToken = crypto.randomBytes(32).toString('hex');
      console.log('[USERS API] 🆕 Генерируем новый токен для нового пользователя');
    } else {
      console.log('[USERS API] 🔄 Возвращаем существующий токен (кросс-девайс)');
    }

    // Создаём/обновляем запись в users (сохраняем токен в users.user_token)
    await sql`
      INSERT INTO users (id, user_token, display_nickname, created_at, updated_at)
      VALUES (${tgId}, ${userToken}, ${nickname || null}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        display_nickname = COALESCE(EXCLUDED.display_nickname, users.display_nickname),
        user_token = COALESCE(users.user_token, EXCLUDED.user_token),
        updated_at = NOW()
    `;

    // Создаём запись в user_limits если её нет
    await sql`
      INSERT INTO user_limits (user_id, ads_created_today, photos_sent_today, ads_last_reset, photos_last_reset)
      VALUES (${tgId}, 0, 0, CURRENT_DATE, CURRENT_DATE)
      ON CONFLICT (user_id) DO NOTHING
    `;

    console.log('[USERS API] ✅ Пользователь инициализирован (token синхронизирован)');

    // Возвращаем токен (тот же на всех устройствах для одного tg_id)
    return NextResponse.json({
      success: true,
      message: 'Пользователь успешно инициализирован',
      userToken: userToken // Один токен для всех устройств пользователя
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
