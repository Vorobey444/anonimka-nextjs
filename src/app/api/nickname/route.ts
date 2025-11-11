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
      
      // Проверяем регистронезависимо (LOWER)
      const result = await sql`
        SELECT id FROM users WHERE LOWER(display_nickname) = LOWER(${nickname}) LIMIT 1
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
 * Правила:
 * - FREE: никнейм можно установить ТОЛЬКО ОДИН РАЗ при регистрации
 * - PRO: никнейм можно менять раз в 24 часа
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

    const userId = parseInt(tgId);

    // Валидация никнейма
    // 1. Проверка на пробелы
    if (nickname.includes(' ')) {
      return NextResponse.json(
        { success: false, error: 'Nickname cannot contain spaces', code: 'INVALID_NICKNAME' },
        { status: 400 }
      );
    }

    // 2. Разрешаем только латиницу, русский язык, цифры, подчеркивание и дефис
    const validPattern = /^[a-zA-Zа-яА-ЯёЁ0-9_-]+$/;
    if (!validPattern.test(nickname)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nickname can only contain letters (English/Russian), numbers, underscore and dash', 
          code: 'INVALID_NICKNAME' 
        },
        { status: 400 }
      );
    }

    // Получаем информацию о пользователе
    const userResult = await sql`
      SELECT 
        display_nickname, 
        is_premium, 
        premium_until,
        nickname_changed_at
      FROM users 
      WHERE id = ${userId} 
      LIMIT 1
    `;

    const existingUser = userResult.rows[0];
    
    // Проверяем PRO статус
    let isPremium = existingUser?.is_premium || false;
    
    // Автоматически отключаем PRO если срок истек
    if (isPremium && existingUser?.premium_until) {
      const now = new Date();
      const until = new Date(existingUser.premium_until);
      if (now > until) {
        isPremium = false;
      }
    }

    // Определяем количество смен никнейма
    // nickname_changed_at === NULL → 0 смен (первая установка/изменение)
    // nickname_changed_at !== NULL → уже была хотя бы 1 смена
    const hasChangedBefore = !!existingUser?.nickname_changed_at;
    
    console.log('[NICKNAME API] Проверка:', {
      userId,
      existingNickname: existingUser?.display_nickname,
      hasChangedBefore,
      isPremium,
      nickname_changed_at: existingUser?.nickname_changed_at
    });

    // Логика ограничений:
    // FREE: 1 смена разрешена (подарок для исправления ошибки при регистрации)
    // PRO: неограниченные смены, но не чаще 1 раза в 24 часа
    
    if (hasChangedBefore) {
      if (!isPremium) {
        // FREE пользователи уже использовали свою 1 бесплатную смену
        console.log('[NICKNAME API] ❌ FREE пользователь уже использовал бесплатную смену');
        return NextResponse.json(
          { 
            success: false, 
            error: 'FREE users can change nickname only ONCE. Upgrade to PRO to change nickname unlimited times (once per 24h).',
            code: 'NICKNAME_LOCKED_FREE'
          },
          { status: 403 }
        );
      }

      // PRO пользователи могут менять неограниченно, но раз в 24 часа
      const lastChange = new Date(existingUser.nickname_changed_at);
      const now = new Date();
      const hoursSinceLastChange = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastChange < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceLastChange);
        console.log('[NICKNAME API] ⏳ PRO пользователь должен подождать:', hoursRemaining, 'часов');
        return NextResponse.json(
          { 
            success: false, 
            error: `PRO users can change nickname once per 24 hours. Try again in ${hoursRemaining} hours.`,
            code: 'NICKNAME_COOLDOWN',
            hoursRemaining
          },
          { status: 429 }
        );
      }
    }

    // Проверяем доступность никнейма (регистронезависимо)
    const checkResult = await sql`
      SELECT id FROM users WHERE LOWER(display_nickname) = LOWER(${nickname}) AND id != ${userId} LIMIT 1
    `;

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Nickname already taken', code: 'NICKNAME_TAKEN' },
        { status: 409 }
      );
    }

    // Обновляем/создаем пользователя с никнеймом
    await sql`
      INSERT INTO users (id, display_nickname, nickname_changed_at, created_at, updated_at)
      VALUES (${userId}, ${nickname}, NOW(), NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET 
        display_nickname = ${nickname}, 
        nickname_changed_at = NOW(),
        updated_at = NOW()
    `;

    console.log('[NICKNAME API] Никнейм успешно установлен');

    return NextResponse.json({
      success: true,
      nickname,
      tgId,
      isFirstChange: !hasChangedBefore,
      isPremium
    });

  } catch (error: any) {
    console.error('[NICKNAME API] Ошибка при установке никнейма:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
