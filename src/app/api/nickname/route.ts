import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { generateUserToken } from '@/lib/userToken';

export const dynamic = 'force-dynamic';

/**
 * API для работы с никнеймами пользователей
 * GET - проверка доступности никнейма или получение никнейма пользователя
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
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
    const { tgId, nickname, userToken } = body;

    console.log('[NICKNAME API] Установка никнейма:', { tgId, nickname, userToken: userToken?.substring(0, 16) + '...' });

    if ((!tgId && !userToken) || !nickname) {
      return NextResponse.json(
        { success: false, error: 'Missing (tgId or userToken) and nickname' },
        { status: 400 }
      );
    }

    let userId: number | null = null;
    let userTokenValue: string | null = userToken || null;
    
    // Если передан userToken - ищем пользователя по нему
    if (userToken) {
      console.log('[NICKNAME API] Поиск пользователя по userToken');
      const result = await sql`
        SELECT id, user_token FROM users WHERE user_token = ${userToken} LIMIT 1
      `;
      
      if (result.rows.length > 0) {
        userId = result.rows[0].id;
        console.log('[NICKNAME API] Найден пользователь по userToken, id:', userId);
      } else {
        return NextResponse.json(
          { success: false, error: 'User not found by userToken' },
          { status: 404 }
        );
      }
    } else {
      userId = parseInt(tgId);
    }

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
    
    // Проверяем PRO статус из users
    let isPremium = existingUser?.is_premium || false;
    let premiumUntil = existingUser?.premium_until || null;
    
    // Дополнительно проверяем premium_tokens (для веб-пользователей)
    // Ищем user_token через ads таблицу
    const tokenResult = await sql`
      SELECT user_token FROM ads WHERE tg_id = ${userId} ORDER BY created_at DESC LIMIT 1
    `;
    
    if (tokenResult.rows.length > 0) {
      const userToken = tokenResult.rows[0].user_token;
      const premiumTokenResult = await sql`
        SELECT is_premium, premium_until FROM premium_tokens WHERE user_token = ${userToken} LIMIT 1
      `;
      
      if (premiumTokenResult.rows.length > 0) {
        const tokenPremium = premiumTokenResult.rows[0];
        // Приоритет premium_tokens над users
        if (tokenPremium.is_premium) {
          isPremium = true;
          premiumUntil = tokenPremium.premium_until;
        }
      }
    }
    
    // Автоматически отключаем PRO если срок истек
    if (isPremium && premiumUntil) {
      const now = new Date();
      const until = new Date(premiumUntil);
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
    
    // СПЕЦИАЛЬНОЕ ПРАВИЛО: Пользователям с никнеймом "Аноним*" даем 1 бесплатную смену
    const isAnonymousNickname = existingUser?.display_nickname?.startsWith('Аноним');
    
    if (hasChangedBefore && !isAnonymousNickname) {
      if (!isPremium) {
        // FREE пользователи уже использовали свою 1 бесплатную смену
        console.log('[NICKNAME API] ❌ FREE пользователь уже использовал бесплатную смену');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Вы уже использовали бесплатную смену никнейма. Оформите PRO для неограниченных смен (раз в 24 часа).',
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
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID not found' },
        { status: 404 }
      );
    }
    
    const token = generateUserToken(userId);
    await sql`
      INSERT INTO users (id, user_token, display_nickname, nickname_changed_at, created_at, updated_at)
      VALUES (${userId}, ${token}, ${nickname}, NOW(), NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET 
        user_token = COALESCE(users.user_token, ${token}),
        display_nickname = ${nickname}, 
        nickname_changed_at = NOW(),
        updated_at = NOW()
    `;

    // Обновляем никнейм во всех объявлениях пользователя
    await sql`
      UPDATE ads 
      SET nickname = ${nickname}
      WHERE tg_id = ${userId}
    `;

    // Обновляем никнейм в user_blocks (если кто-то заблокировал этого пользователя)
    // Получаем user_token из ads для обновления user_blocks
    const userTokenResult = await sql`
      SELECT user_token FROM ads WHERE tg_id = ${userId} LIMIT 1
    `;
    
    if (userTokenResult.rows.length > 0) {
      const userToken = userTokenResult.rows[0].user_token;
      await sql`
        UPDATE user_blocks
        SET blocked_nickname = ${nickname}
        WHERE blocked_token = ${userToken}
      `;
    }

    console.log('[NICKNAME API] Никнейм успешно установлен и обновлён во всех связанных таблицах');

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
