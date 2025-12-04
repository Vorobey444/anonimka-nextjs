import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { sql } from '@vercel/postgres';

function isLikelyToken(value: string | null | undefined): boolean {
    if (!value) return false;
    return typeof value === 'string' && value.length > 20; // 64-hex or long UUID-like tokens
}

function isDigits(value: string | null | undefined): boolean {
    if (!value) return false;
    return /^\d+$/.test(value);
}

// POST - регистрация перехода по реферальной ссылке
export async function POST(request: NextRequest) {
    try {
        const { referrer_token, new_user_token } = await request.json();

        console.log('[REFERRAL] Регистрация:', { referrer_token, new_user_token });

        if (!referrer_token || !new_user_token) {
            return NextResponse.json(
                { error: 'referrer_token и new_user_token обязательны' },
                { status: 400 }
            );
        }

        // Сам себя приглашать нельзя
        if (referrer_token === new_user_token) {
            console.log('[REFERRAL] ❌ Попытка пригласить самого себя');
            return NextResponse.json(
                { error: 'Нельзя пригласить самого себя' },
                { status: 400 }
            );
        }

        const refIsToken = isLikelyToken(referrer_token);
        const newIsToken = isLikelyToken(new_user_token);

        // Если реферер прислал токен, попробуем найти его tg_id для совместимости (не обязательно)
        let refTgId: number | null = null;
        if (refIsToken) {
            try {
                const r = await sql`SELECT tg_id FROM ads WHERE user_token = ${referrer_token} ORDER BY created_at DESC LIMIT 1`;
                refTgId = r.rows[0]?.tg_id ?? null;
                console.log('[REFERRAL] refTgId найден:', refTgId);
            } catch (err) {
                console.error('[REFERRAL] Ошибка поиска refTgId:', err);
            }
        } else if (isDigits(referrer_token)) {
            refTgId = Number(referrer_token);
        }

        // Проверим, не зарегистрирован ли уже этот реферал (по referred_id)
        let referredId: number | null = null;
        if (isDigits(new_user_token)) {
            referredId = Number(new_user_token);
        } else if (newIsToken) {
            // Попробуем найти tg_id по токену
            try {
                const r = await sql`SELECT tg_id FROM ads WHERE user_token = ${new_user_token} ORDER BY created_at DESC LIMIT 1`;
                referredId = r.rows[0]?.tg_id ?? null;
            } catch (e) {
                console.log('[REFERRAL] Не удалось найти tg_id для токена');
            }
        }

        if (referredId) {
            const existing = await sql`SELECT id FROM referrals WHERE referred_id = ${referredId} LIMIT 1`;
            if (existing.rows.length > 0) {
                console.log('[REFERRAL] ℹ️ Пользователь уже был приглашен ранее');
                return NextResponse.json(
                    { message: 'Пользователь уже был приглашен ранее' },
                    { status: 200 }
                );
            }
        }

        // Вставка: используем только referrer_token и referred_id (старая схема БД)
        await sql`
            INSERT INTO referrals (referrer_token, referred_id)
            VALUES (${referrer_token}, ${referredId})
        `;

        console.log('[REFERRAL] ✅ Реферал успешно зарегистрирован (referred_id заполнится при создании анкеты)');

        return NextResponse.json({ 
            success: true,
            message: 'Реферал зарегистрирован' 
        });

    } catch (error: any) {
        console.error('[REFERRAL] ❌ Критическая ошибка регистрации:', error);
        console.error('[REFERRAL] Stack:', error?.stack);
        console.error('[REFERRAL] Message:', error?.message);
        return NextResponse.json(
            { error: error?.message || 'Ошибка сервера' },
            { status: 500 }
        );
    }
}

// PUT - выдача награды за реферала (вызывается когда новый пользователь создал анкету)
export async function PUT(request: NextRequest) {
    try {
        const { new_user_token } = await request.json();

        console.log('[REFERRAL REWARD] Запрос награды для:', new_user_token);

        if (!new_user_token) {
            return NextResponse.json(
                { error: 'new_user_token обязателен' },
                { status: 400 }
            );
        }

        // Определяем возможный tg_id для этого токена (если Telegram-пользователь)
        const tokenLookup = await sql`
            SELECT tg_id FROM ads WHERE user_token = ${new_user_token} ORDER BY created_at DESC LIMIT 1
        `;
        const tgId: number | null = tokenLookup.rows[0]?.tg_id ?? null;

        // Находим реферала по referred_id (старая схема БД)
        const referralResult = await sql`
            SELECT id, referrer_token, reward_granted, referred_id
            FROM referrals 
            WHERE ${tgId !== null} AND referred_id = ${tgId}
            ORDER BY created_at DESC
            LIMIT 1
        `;

        if (referralResult.rows.length === 0) {
            console.log('[REFERRAL REWARD] ℹ️ Реферал не найден - пользователь пришел не по реферальной ссылке');
            return NextResponse.json(
                { message: 'Реферал не найден' },
                { status: 404 }
            );
        }

        const referral = referralResult.rows[0] as { id: number; referrer_token: string; reward_granted: boolean; referred_id: number };

        // referred_id уже заполнен при создании
        console.log('[REFERRAL REWARD] ✅ Найден referral:', referral.id);

        // ЗАЩИТА: награда за этого конкретного реферала уже выдана (используем reward_granted из старой схемы)
        if (referral.reward_granted) {
            console.log('[REFERRAL REWARD] ℹ️ Награда за этого реферала уже была выдана ранее');
            return NextResponse.json(
                { message: 'Награда уже была выдана' },
                { status: 200 }
            );
        }

        // АКЦИЯ: PRO выдаётся ОДИН РАЗ, только если у реферера никогда не было PRO
        const now = new Date();
        const baseExpiry = new Date(now);
        baseExpiry.setDate(baseExpiry.getDate() + 30);

        // Работаем только с referrer_token (старая схема)
        const existing = await sql`SELECT user_token, premium_until FROM premium_tokens WHERE user_token = ${referral.referrer_token} LIMIT 1`;
        
        if (existing.rows.length > 0) {
            // Запись есть — реферер уже получал PRO ранее
            console.log('[REFERRAL REWARD] ⚠️ Реферер уже получал PRO — акция действует один раз');
            await sql`UPDATE referrals SET reward_granted = TRUE WHERE id = ${referral.id}`;
            return NextResponse.json(
                { message: 'Акция доступна только для новых пользователей без PRO' },
                { status: 200 }
            );
        }

            // Реферер никогда не имел PRO — выдаём первый раз
        await sql`
            INSERT INTO premium_tokens (user_token, is_premium, premium_until)
            VALUES (${referral.referrer_token}, TRUE, ${baseExpiry.toISOString()})
        `;
        console.log('[REFERRAL REWARD] ✅ PRO выдан до:', baseExpiry.toISOString());

        // Отмечаем, что награда выдана (используем reward_granted)
        await sql`
            UPDATE referrals 
            SET reward_granted = TRUE
            WHERE id = ${referral.id}
        `;

        return NextResponse.json({ 
            success: true,
            message: 'PRO подписка выдана',
            expiresAt: baseExpiry.toISOString()
        });

    } catch (error) {
        console.error('[REFERRAL REWARD] ❌ Критическая ошибка при выдаче награды:', error);
        return NextResponse.json(
            { error: 'Ошибка сервера' },
            { status: 500 }
        );
    }
}

// GET - получить статистику рефералов
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const userId = searchParams.get('userId'); // Может быть token или numeric tg_id

        if (!userId) {
            return NextResponse.json(
                { error: 'userId обязателен' },
                { status: 400 }
            );
        }

        const byToken = isLikelyToken(userId);
        const tgId = !byToken && isDigits(userId) ? Number(userId) : null;

        // Получаем приглашенных: учитываем оба канала (token и numeric)
        const referrals = await sql`
            WITH base AS (
                SELECT 
                    r.id,
                    r.created_at,
                    r.reward_given,
                    r.reward_given_at,
                    r.referred_token,
                    r.referred_id
                FROM referrals r
                WHERE (${byToken} = TRUE AND r.referrer_token = ${byToken ? userId : null})
                   OR (${tgId !== null} = TRUE AND r.referrer_id = ${tgId})
            )
            SELECT 
                b.id,
                b.created_at,
                b.reward_given,
                b.reward_given_at,
                COALESCE(a1.display_nickname, a2.display_nickname) AS nickname,
                b.referred_token,
                b.referred_id
            FROM base b
            LEFT JOIN ads a1 ON a1.user_token = b.referred_token
            LEFT JOIN ads a2 ON a2.tg_id = b.referred_id
            ORDER BY b.created_at DESC
        `;

        const rows = referrals.rows as any[];
        const total = rows.length;
        const rewarded = rows.filter(r => r.reward_given).length;

        return NextResponse.json({
            total,
            rewarded,
            pending: total - rewarded,
            referrals: rows
        });

    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        return NextResponse.json(
            { error: 'Ошибка сервера' },
            { status: 500 }
        );
    }
}
