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

        // Проверим, не зарегистрирован ли уже этот реферал
        const existing = await sql`SELECT id FROM referrals WHERE referrer_token = ${referrer_token} LIMIT 1`;
        if (existing.rows.length > 0) {
            console.log('[REFERRAL] ℹ️ Этот реферер уже регистрировал приглашения');
        }

        // Вставка: используем только то что есть в схеме (referred_token и referrer_token)
        await sql`
            INSERT INTO referrals (referrer_token, referred_token)
            VALUES (${referrer_token}, ${newIsToken ? new_user_token : null})
        `;
        console.log('[REFERRAL] ✅ Реферал успешно зарегистрирован');

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

        // Находим реферала по referred_token (используем реальную схему БД)
        const referralResult = await sql`
            SELECT id, referrer_token, reward_given
            FROM referrals 
            WHERE referred_token = ${new_user_token}
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

        const referral = referralResult.rows[0] as { id: number; referrer_token: string; reward_given: boolean };

        console.log('[REFERRAL REWARD] ✅ Найден referral:', referral.id);

        // ЗАЩИТА: награда за этого конкретного реферала уже выдана
        if (referral.reward_given) {
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

        // Работаем с referrer_token
        const existing = await sql`SELECT user_token, premium_until FROM premium_tokens WHERE user_token = ${referral.referrer_token} LIMIT 1`;
        
        if (existing.rows.length > 0) {
            // Запись есть — реферер уже получал PRO ранее
            console.log('[REFERRAL REWARD] ⚠️ Реферер уже получал PRO — акция действует один раз');
            await sql`UPDATE referrals SET reward_given = TRUE, reward_given_at = NOW() WHERE id = ${referral.id}`;
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

        // Отмечаем, что награда выдана
        await sql`
            UPDATE referrals 
            SET reward_given = TRUE,
                reward_given_at = NOW()
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

        // Получаем приглашенных по referrer_token (используем реальную схему БД)
        const referrals = await sql`
            SELECT 
                r.id,
                r.created_at,
                r.reward_given,
                r.reward_given_at,
                r.referred_token,
                COALESCE(a1.display_nickname, u1.display_nickname) AS nickname
            FROM referrals r
            LEFT JOIN ads a1 ON a1.user_token = r.referred_token
            LEFT JOIN users u1 ON u1.user_token = r.referred_token
            WHERE r.referrer_token = ${userId}
            ORDER BY r.created_at DESC
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
