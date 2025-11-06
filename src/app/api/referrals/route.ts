import { NextRequest, NextResponse } from 'next/server';
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
            const r = await sql`SELECT tg_id FROM ads WHERE user_token = ${referrer_token} ORDER BY created_at DESC LIMIT 1`;
            refTgId = r.rows[0]?.tg_id ?? null;
        } else if (isDigits(referrer_token)) {
            refTgId = Number(referrer_token);
        }

        // Проверим, не зарегистрирован ли уже этот реферал
        const existing = await sql`
            SELECT id FROM referrals 
            WHERE (referred_token = ${newIsToken ? new_user_token : null} AND ${newIsToken} = TRUE)
               OR (referred_id = ${!newIsToken && isDigits(new_user_token) ? Number(new_user_token) : null} AND ${!newIsToken} = TRUE)
            LIMIT 1
        `;
        if (existing.rows.length > 0) {
            console.log('[REFERRAL] ℹ️ Пользователь уже был приглашен ранее');
            return NextResponse.json(
                { message: 'Пользователь уже был приглашен ранее' },
                { status: 200 }
            );
        }

        // Вставка с учётом доступных идентификаторов
        await sql`
            INSERT INTO referrals (referrer_id, referred_id, referrer_token, referred_token)
            VALUES (
                ${refTgId},
                ${!newIsToken && isDigits(new_user_token) ? Number(new_user_token) : null},
                ${refIsToken ? referrer_token : null},
                ${newIsToken ? new_user_token : null}
            )
        `;

        console.log('[REFERRAL] ✅ Реферал успешно зарегистрирован');

        return NextResponse.json({ 
            success: true,
            message: 'Реферал зарегистрирован' 
        });

    } catch (error) {
        console.error('Ошибка регистрации реферала:', error);
        return NextResponse.json(
            { error: 'Ошибка сервера' },
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

        // Находим реферала: по referred_token (веб) или по referred_id (telegram)
        const referralResult = await sql`
            SELECT id, referrer_id, referrer_token, reward_given 
            FROM referrals 
            WHERE (referred_token = ${new_user_token})
               OR (${tgId !== null} AND referred_id = ${tgId})
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

        const referral = referralResult.rows[0] as { id: number; referrer_id: number | null; referrer_token: string | null; reward_given: boolean };

        // ЗАЩИТА: награда за этого конкретного реферала уже выдана — дубли не допускаются
        if (referral.reward_given) {
            console.log('[REFERRAL REWARD] ℹ️ Награда за этого реферала уже была выдана ранее');
            return NextResponse.json(
                { message: 'Награда уже была выдана' },
                { status: 200 }
            );
        }

        // Механика: каждый успешный реферал продлевает PRO реферера на +30 дней
        // (но один реферал не может дать награду дважды — контролируется reward_given)
        const now = new Date();
        const baseExpiry = new Date(now);
        baseExpiry.setDate(baseExpiry.getDate() + 30);
        let newExpiresAt = baseExpiry;

        // Если есть токен реферера — выдаём/продлеваем PRO по токену (premium_tokens)
        if (referral.referrer_token) {
            const existing = await sql`SELECT premium_until FROM premium_tokens WHERE user_token = ${referral.referrer_token} LIMIT 1`;
            if (existing.rows.length > 0 && existing.rows[0].premium_until) {
                const currentExpiry = new Date(existing.rows[0].premium_until);
                // Если подписка ещё активна — стекируем +30 дней от текущей даты окончания
                if (currentExpiry > now) {
                    newExpiresAt = new Date(currentExpiry);
                    newExpiresAt.setDate(newExpiresAt.getDate() + 30);
                }
                await sql`
                    UPDATE premium_tokens
                    SET is_premium = TRUE,
                        premium_until = ${newExpiresAt.toISOString()},
                        updated_at = NOW()
                    WHERE user_token = ${referral.referrer_token}
                `;
            } else {
                await sql`
                    INSERT INTO premium_tokens (user_token, is_premium, premium_until)
                    VALUES (${referral.referrer_token}, TRUE, ${newExpiresAt.toISOString()})
                    ON CONFLICT (user_token) DO UPDATE SET
                      is_premium = EXCLUDED.is_premium,
                      premium_until = EXCLUDED.premium_until,
                      updated_at = NOW()
                `;
            }
            console.log('[REFERRAL REWARD] ✅ PRO (token) выдан/продлён до:', newExpiresAt.toISOString());
        } else if (referral.referrer_id) {
            // Иначе есть только numeric (Telegram) — выдаём/продлеваем через таблицу users
            const u = await sql`SELECT premium_until FROM users WHERE id = ${referral.referrer_id} LIMIT 1`;
            if (u.rows.length > 0 && u.rows[0].premium_until) {
                const currentExpiry = new Date(u.rows[0].premium_until);
                // Если подписка ещё активна — стекируем +30 дней от текущей даты окончания
                if (currentExpiry > now) {
                    newExpiresAt = new Date(currentExpiry);
                    newExpiresAt.setDate(newExpiresAt.getDate() + 30);
                }
            }
            await sql`
                UPDATE users
                SET is_premium = TRUE,
                    premium_until = ${newExpiresAt.toISOString()},
                    updated_at = NOW()
                WHERE id = ${referral.referrer_id}
            `;
            console.log('[REFERRAL REWARD] ✅ PRO (tg_id) выдан/продлён до:', newExpiresAt.toISOString());
        } else {
            console.warn('[REFERRAL REWARD] ⚠️ Не найден валидный идентификатор реферера');
            return NextResponse.json({ message: 'Реферер не найден' }, { status: 404 });
        }

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
            expiresAt: newExpiresAt.toISOString()
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
        const { searchParams } = new URL(request.url);
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
                COALESCE(a1.nickname, a2.nickname) AS nickname,
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
