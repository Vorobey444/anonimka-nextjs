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

    // Определяем, это первая установка никнейма или попытка изменить
    // Если nickname_changed_at === NULL, значит это первая установка (разрешено всем)
    const isFirstTimeChange = !existingUser?.nickname_changed_at;
    
    console.log('[NICKNAME API] Проверка:', {
      userId,
      existingNickname: existingUser?.display_nickname,
      isFirstTimeChange,
      isPremium,
      nickname_changed_at: existingUser?.nickname_changed_at
    });

    // Проверяем право на смену никнейма (только если это НЕ первая установка)
    if (!isFirstTimeChange) {
      if (!isPremium) {
        // FREE пользователи не могут менять никнейм
        console.log('[NICKNAME API] ❌ FREE пользователь пытается изменить никнейм');
        return NextResponse.json(
          { 
            success: false, 
            error: 'FREE users cannot change nickname. Upgrade to PRO to change nickname once per day.',
            code: 'NICKNAME_LOCKED_FREE'
          },
          { status: 403 }
        );
      }

      // PRO пользователи могут менять раз в 24 часа
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

    // Проверяем доступность никнейма
    const checkResult = await sql`
      SELECT id FROM users WHERE display_nickname = ${nickname} AND id != ${userId} LIMIT 1
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
      isFirstTime: isFirstTimeChange,
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
