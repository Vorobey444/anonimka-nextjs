import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// Определение страны по городу
function getCountryFromCity(city: string | null | undefined): string {
  if (!city) return 'KZ';
  
  const cityLower = city.toLowerCase();
  
  // Города Казахстана
  const kzCities = ['алматы', 'астана', 'нур-султан', 'шымкент', 'караганда', 'актобе', 'тараз', 'павлодар', 'усть-каменогорск', 'семей', 'атырау', 'костанай', 'кызылорда', 'уральск', 'петропавловск', 'актау', 'темиртау', 'туркестан', 'кокшетау', 'талдыкорган', 'экибастуз', 'рудный'];
  
  // Города России
  const ruCities = ['москва', 'санкт-петербург', 'петербург', 'новосибирск', 'екатеринбург', 'казань', 'нижний новгород', 'челябинск', 'самара', 'омск', 'ростов-на-дону', 'уфа', 'красноярск', 'воронеж', 'пермь', 'волгоград'];
  
  if (kzCities.some(kzCity => cityLower.includes(kzCity))) return 'KZ';
  if (ruCities.some(ruCity => cityLower.includes(ruCity))) return 'RU';
  
  // По умолчанию - Казахстан (т.к. приложение для КЗ)
  return 'KZ';
}

// POST - инициализация пользователя при входе в приложение
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tgId, nickname, city } = body;

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
        console.error('[USERS API] КРИТИЧЕСКАЯ ОШИБКА: USER_TOKEN_SECRET не задан в переменных окружения!');
        return NextResponse.json(
          { success: false, error: 'Ошибка конфигурации сервера' },
          { status: 500 }
        );
      }
      
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(String(tgId));
      hmac.update(':v1'); // версия формулы на будущее
      userToken = hmac.digest('hex');
    }

    // Определяем страну из города
    const country = getCountryFromCity(city);

    // Проверяем не забанен ли пользователь
    const banCheck = await sql`
      SELECT is_banned, ban_reason FROM users WHERE id = ${tgId}
    `;
    
    if (banCheck.rows.length > 0 && banCheck.rows[0].is_banned) {
      const banReason = banCheck.rows[0].ban_reason || 'Нарушение правил сервиса';
      return NextResponse.json({
        success: false,
        error: 'banned',
        message: `Ваш аккаунт заблокирован. Причина: ${banReason}`,
        banReason: banReason
      }, { status: 403 });
    }

    // Создаём/обновляем запись в users (ВСЕГДА обновляем user_token для синхронизации Premium)
    await sql`
      INSERT INTO users (id, display_nickname, country, user_token, created_at, updated_at)
      VALUES (${tgId}, ${nickname || null}, ${country}, ${userToken}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        -- Не перезаписываем уже существующий никнейм на сервера локальным значением
        display_nickname = CASE 
          WHEN users.display_nickname IS NULL OR users.display_nickname = '' THEN COALESCE(EXCLUDED.display_nickname, users.display_nickname)
          ELSE users.display_nickname
        END,
        country = COALESCE(EXCLUDED.country, users.country),
        user_token = ${userToken},
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

// GET - получить публичные данные пользователя (например, display_nickname) или проверить админа
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const tgIdParam = searchParams.get('tgId');
    const userIdParam = searchParams.get('user_id');
    const userToken = searchParams.get('userToken');

    // Проверка статуса админа
    if (action === 'check-admin') {
      const userId = userIdParam || tgIdParam;
      if (!userId) {
        return NextResponse.json({ is_admin: false });
      }

      const userIdNum = Number(userId);
      if (!Number.isFinite(userIdNum)) {
        return NextResponse.json({ is_admin: false });
      }

      const result = await sql`
        SELECT is_admin FROM users WHERE id = ${userIdNum}
      `;

      return NextResponse.json({ 
        is_admin: result.rows[0]?.is_admin === true 
      });
    }

    // Получить всех пользователей (только для проверки заблокированных)
    if (action === 'get-all') {
      const result = await sql`
        SELECT id FROM users WHERE id IS NOT NULL ORDER BY id
      `;

      return NextResponse.json({
        success: true,
        users: result.rows,
        count: result.rows.length
      });
    }

    // Получить только заблокированных пользователей
    if (action === 'get-blocked') {
      const result = await sql`
        SELECT id, bot_blocked_at FROM users 
        WHERE is_bot_blocked = true 
        ORDER BY bot_blocked_at DESC
      `;

      return NextResponse.json({
        success: true,
        users: result.rows,
        count: result.rows.length
      });
    }

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
      // Сначала ищем напрямую в users по user_token (для email пользователей)
      const directRes = await sql`
        SELECT display_nickname FROM users WHERE user_token = ${userToken} LIMIT 1
      `;
      
      if (directRes.rows.length > 0) {
        displayNickname = directRes.rows[0]?.display_nickname || null;
      } else {
        // Fallback: ищем через объявления (для Telegram пользователей)
        const adsRes = await sql`
          SELECT u.display_nickname
          FROM users u
          WHERE u.id IN (
            SELECT tg_id FROM ads WHERE user_token = ${userToken} AND tg_id IS NOT NULL LIMIT 1
          )
        `;
        displayNickname = adsRes.rows[0]?.display_nickname || null;
      }
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
    console.log('[USERS API] PATCH set-nickname request', {
      hasTgId: Boolean(tgId),
      hasUserToken: Boolean(userToken),
      hasNickname: Boolean(nickname)
    });

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
      
      // Проверяем Premium и лимит смены никнейма
      const userCheck = await sql`
        SELECT is_premium, premium_until, nickname_changed_at, display_nickname
        FROM users 
        WHERE id = ${idNum}
      `;
      
      if (userCheck.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Пользователь не найден' },
          { status: 404 }
        );
      }
      
      const user = userCheck.rows[0];
      const now = new Date();
      const userPremium = user.is_premium || false;
      const premiumUntil = user.premium_until;
      const premiumExpired = premiumUntil ? new Date(premiumUntil) <= now : false;
      const isPremium = userPremium && !premiumExpired;
      const lastChanged = user.nickname_changed_at;
      const currentNickname = user.display_nickname;
      
      console.log('[USERS API] Проверка лимита смены никнейма:', { 
        isPremium, 
        lastChanged, 
        currentNickname 
      });
      
      // FREE: никнейм можно установить только один раз
      if (!isPremium) {
        if (currentNickname && currentNickname.trim() !== '') {
          return NextResponse.json(
            { 
              success: false, 
              error: 'FREE пользователи могут установить никнейм только один раз. Оформите PRO для смены никнейма!',
              limit: true,
              isPremium: false
            },
            { status: 429 }
          );
        }
      } else {
        // PRO: можно менять раз в 24 часа
        if (lastChanged) {
          const hoursSinceChange = (now.getTime() - new Date(lastChanged).getTime()) / (1000 * 60 * 60);
          if (hoursSinceChange < 24) {
            const hoursLeft = Math.ceil(24 - hoursSinceChange);
            return NextResponse.json(
              { 
                success: false, 
                error: `Смена никнейма доступна через ${hoursLeft}ч. PRO пользователи могут менять никнейм раз в 24 часа.`,
                limit: true,
                isPremium: true,
                hoursLeft
              },
              { status: 429 }
            );
          }
        }
      }
      
      // Обновляем никнейм и время последней смены
      const upd = await sql`
        UPDATE users
        SET display_nickname = ${nickname.trim()}, 
            nickname_changed_at = NOW(),
            updated_at = NOW()
        WHERE id = ${idNum}
        RETURNING id
      `;
      console.log('[USERS API] set-nickname by tgId updated:', upd.rows.length);
      return NextResponse.json({ success: true, updated: upd.rows.length > 0 });
    }

    // Если пришёл только userToken — попробуем найти связанный tg_id через users.user_token
    if (userToken && typeof userToken === 'string') {
      const res = await sql`
        SELECT id
        FROM users
        WHERE user_token = ${userToken}
        LIMIT 1
      `;
      const tgFromUsers = res.rows[0]?.id;
      if (!tgFromUsers) {
        console.warn('[USERS API] set-nickname: no tg_id found by userToken');
        return NextResponse.json(
          { success: false, error: 'Не удалось определить пользователя по токену. Передайте tgId.' },
          { status: 404 }
        );
      }
      
      // Проверяем Premium и лимит смены никнейма
      const userCheck = await sql`
        SELECT is_premium, premium_until, nickname_changed_at, display_nickname
        FROM users 
        WHERE id = ${tgFromUsers}
      `;
      
      const user = userCheck.rows[0];
      const now = new Date();
      const userPremium = user.is_premium || false;
      const premiumUntil = user.premium_until;
      const premiumExpired = premiumUntil ? new Date(premiumUntil) <= now : false;
      const isPremium = userPremium && !premiumExpired;
      const lastChanged = user.nickname_changed_at;
      const currentNickname = user.display_nickname;
      
      // FREE: никнейм можно установить только один раз
      if (!isPremium) {
        if (currentNickname && currentNickname.trim() !== '') {
          return NextResponse.json(
            { 
              success: false, 
              error: 'FREE пользователи могут установить никнейм только один раз. Оформите PRO для смены никнейма!',
              limit: true,
              isPremium: false
            },
            { status: 429 }
          );
        }
      } else {
        // PRO: можно менять раз в 24 часа
        if (lastChanged) {
          const hoursSinceChange = (now.getTime() - new Date(lastChanged).getTime()) / (1000 * 60 * 60);
          if (hoursSinceChange < 24) {
            const hoursLeft = Math.ceil(24 - hoursSinceChange);
            return NextResponse.json(
              { 
                success: false, 
                error: `Смена никнейма доступна через ${hoursLeft}ч. PRO пользователи могут менять никнейм раз в 24 часа.`,
                limit: true,
                isPremium: true,
                hoursLeft
              },
              { status: 429 }
            );
          }
        }
      }
      
      const upd = await sql`
        UPDATE users
        SET display_nickname = ${nickname.trim()}, 
            nickname_changed_at = NOW(),
            updated_at = NOW()
        WHERE id = ${tgFromUsers}
        RETURNING id
      `;
      console.log('[USERS API] set-nickname by token updated:', upd.rows.length);
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
