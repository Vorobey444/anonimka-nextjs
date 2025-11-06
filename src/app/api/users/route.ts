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

    // Проверяем, есть ли уже user_token для этого tg_id (берём из последнего объявления, если есть)
    const existingAd = await sql`
      SELECT user_token FROM ads WHERE tg_id = ${tgId} ORDER BY created_at DESC LIMIT 1
    `;

    let userToken = existingAd.rows[0]?.user_token;

    // Если токена нет — генерируем детерминированный токен на основе tgId и серверного секрета,
    // чтобы он был одинаковым на всех устройствах до публикации первого объявления.
    if (!userToken) {
      const crypto = require('crypto');
      const secret = process.env.USER_TOKEN_SECRET || process.env.TOKEN_SECRET;
      if (!secret) {
        console.warn('[USERS API] ВНИМАНИЕ: USER_TOKEN_SECRET не задан — используется временный dev-секрет. Задайте переменную окружения в проде.');
      }
      const hmac = crypto.createHmac('sha256', secret || 'dev-temp-secret');
      hmac.update(String(tgId));
      hmac.update(':v1'); // версия формулы на будущее
      userToken = hmac.digest('hex');
    }

    // Создаём/обновляем запись в users
    await sql`
      INSERT INTO users (id, display_nickname, created_at, updated_at)
      VALUES (${tgId}, ${nickname || null}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        -- Не перезаписываем уже существующий никнейм на сервера локальным значением
        display_nickname = CASE 
          WHEN users.display_nickname IS NULL OR users.display_nickname = '' THEN COALESCE(EXCLUDED.display_nickname, users.display_nickname)
          ELSE users.display_nickname
        END,
        updated_at = NOW()
    `;

    // Создаём запись в user_limits если её нет
    await sql`
      INSERT INTO user_limits (user_id, ads_created_today, photos_sent_today, ads_last_reset, photos_last_reset)
      VALUES (${tgId}, 0, 0, CURRENT_DATE, CURRENT_DATE)
      ON CONFLICT (user_id) DO NOTHING
    `;

    console.log('[USERS API] ✅ Пользователь инициализирован (token выдан)');

    // Возвращаем только токен, НЕ tg_id
    return NextResponse.json({
      success: true,
      message: 'Пользователь успешно инициализирован',
      userToken: userToken // Клиент получает только токен
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

// GET - получить публичные данные пользователя (например, display_nickname)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tgIdParam = searchParams.get('tgId');
    const userToken = searchParams.get('userToken');

    let displayNickname: string | null = null;

    if (tgIdParam) {
      const tgId = Number(tgIdParam);
      if (!Number.isFinite(tgId)) {
        return NextResponse.json(
          { success: false, error: 'tgId должен быть числом' },
          { status: 400 }
        );
      }

      const res = await sql`
        SELECT display_nickname FROM users WHERE id = ${tgId}
      `;
      displayNickname = res.rows[0]?.display_nickname || null;
    } else if (userToken) {
      // Ищем связанный tg_id через объявления
      const res = await sql`
        SELECT u.display_nickname
        FROM users u
        WHERE u.id IN (
          SELECT tg_id FROM ads WHERE user_token = ${userToken} AND tg_id IS NOT NULL LIMIT 1
        )
      `;
      displayNickname = res.rows[0]?.display_nickname || null;
    } else {
      return NextResponse.json(
        { success: false, error: 'Укажите tgId или userToken' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, displayNickname });
  } catch (error: any) {
    console.error('[USERS API] Ошибка при получении данных пользователя:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Ошибка получения данных пользователя' },
      { status: 500 }
    );
  }
}

// PATCH - обновление публичных данных пользователя (например, display_nickname)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, tgId, userToken, nickname } = body || {};

    if (action !== 'set-nickname') {
      return NextResponse.json(
        { success: false, error: 'Неизвестное действие' },
        { status: 400 }
      );
    }

    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Никнейм не указан' },
        { status: 400 }
      );
    }

    // Приоритетное обновление по tgId (надёжно и не требует объявлений)
    if (tgId && Number.isFinite(Number(tgId))) {
      const idNum = Number(tgId);
      const upd = await sql`
        UPDATE users
        SET display_nickname = ${nickname.trim()}, updated_at = NOW()
        WHERE id = ${idNum}
        RETURNING id
      `;
      return NextResponse.json({ success: true, updated: upd.rows.length > 0 });
    }

    // Если пришёл только userToken — попробуем найти связанный tg_id через объявления
    if (userToken && typeof userToken === 'string') {
      const res = await sql`
        SELECT tg_id
        FROM ads
        WHERE user_token = ${userToken}
        AND tg_id IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const tgFromAds = res.rows[0]?.tg_id;
      if (!tgFromAds) {
        return NextResponse.json(
          { success: false, error: 'Не удалось определить пользователя по токену. Передайте tgId.' },
          { status: 404 }
        );
      }
      const upd = await sql`
        UPDATE users
        SET display_nickname = ${nickname.trim()}, updated_at = NOW()
        WHERE id = ${tgFromAds}
        RETURNING id
      `;
      return NextResponse.json({ success: true, updated: upd.rows.length > 0 });
    }

    return NextResponse.json(
      { success: false, error: 'Укажите tgId или userToken' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[USERS API] Ошибка при обновлении данных пользователя:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Ошибка обновления данных пользователя' },
      { status: 500 }
    );
  }
}
