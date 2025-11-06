import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

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
        
        // Проверяем что пользователь не приглашает сам себя
        if (referrer_token === new_user_token) {
            console.log('[REFERRAL] ❌ Попытка пригласить самого себя');
            return NextResponse.json(
                { error: 'Нельзя пригласить самого себя' },
                { status: 400 }
            );
        }
        
        // Проверяем не был ли этот пользователь уже приглашен
        const existingReferral = await sql`
            SELECT id FROM referrals WHERE user_token = ${new_user_token}
        `;
        
        if (existingReferral.rows.length > 0) {
            console.log('[REFERRAL] ℹ️ Пользователь уже был приглашен ранее');
            return NextResponse.json(
                { message: 'Пользователь уже был приглашен ранее' },
                { status: 200 }
            );
        }
        
        // Создаем запись о реферале
        await sql`
            INSERT INTO referrals (referrer_id, referred_id, user_token)
            VALUES (${referrer_token}, ${new_user_token}, ${new_user_token})
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
        
        // Находим реферала
        const referralResult = await sql`
            SELECT referrer_id, reward_given 
            FROM referrals 
            WHERE user_token = ${new_user_token}
            LIMIT 1
        `;
        
        if (referralResult.rows.length === 0) {
            console.log('[REFERRAL REWARD] ℹ️ Реферал не найден - пользователь пришел не по реферальной ссылке');
            return NextResponse.json(
                { message: 'Реферал не найден' },
                { status: 404 }
            );
        }
        
        const referral = referralResult.rows[0];
        
        if (referral.reward_given) {
            console.log('[REFERRAL REWARD] ℹ️ Награда уже была выдана ранее');
            return NextResponse.json(
                { message: 'Награда уже была выдана' },
                { status: 200 }
            );
        }
        
        console.log('[REFERRAL REWARD] 🎁 Выдаем PRO реферу:', referral.referrer_id);
        
        const referrer_token = referral.referrer_id;
        
        // Выдаем 30 дней PRO приглашающему
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        
        // Обновляем или создаем PRO подписку
        const existingPro = await sql`
            SELECT premium_until FROM ads WHERE user_token = ${String(referrer_token)} LIMIT 1
        `;
        
        let newExpiresAt = expiresAt;
        
        if (existingPro.rows.length > 0 && existingPro.rows[0].premium_until) {
            const currentExpiry = new Date(existingPro.rows[0].premium_until);
            const now = new Date();
            
            // Если подписка еще активна - продлеваем на 30 дней от текущей даты окончания
            if (currentExpiry > now) {
                newExpiresAt = new Date(currentExpiry);
                newExpiresAt.setDate(newExpiresAt.getDate() + 30);
            }
        }
        
        // Обновляем PRO статус
        const updateResult = await sql`
            UPDATE ads 
            SET premium_until = ${newExpiresAt.toISOString()}
            WHERE user_token = ${String(referrer_token)}
            RETURNING id
        `;
        
        console.log('[REFERRAL REWARD] ✅ PRO обновлен, затронуто строк:', updateResult.rowCount);
        
        // Отмечаем что награда выдана
        await sql`
            UPDATE referrals 
            SET reward_given = TRUE,
                reward_given_at = NOW()
            WHERE user_token = ${new_user_token}
        `;
        
        console.log('[REFERRAL REWARD] 🎉 Награда успешно выдана до:', newExpiresAt.toISOString());
        
        return NextResponse.json({ 
            success: true,
            message: 'PRO подписка выдана',
            referrer_token,
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
        const userId = searchParams.get('userId');
        
        if (!userId) {
            return NextResponse.json(
                { error: 'userId обязателен' },
                { status: 400 }
            );
        }
        
        // Получаем всех приглашенных пользователей
        const referrals = await sql`
            SELECT 
                r.referred_id,
                r.created_at,
                r.reward_given,
                r.reward_given_at,
                a.nickname
            FROM referrals r
            LEFT JOIN ads a ON a.tg_id = CAST(r.referred_id AS TEXT)
            WHERE r.referrer_id = ${userId}
            ORDER BY r.created_at DESC
        `;
        
        const total = referrals.rows.length;
        const rewarded = referrals.rows.filter((r: any) => r.reward_given).length;
        
        return NextResponse.json({
            total,
            rewarded,
            pending: total - rewarded,
            referrals: referrals.rows
        });
        
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        return NextResponse.json(
            { error: 'Ошибка сервера' },
            { status: 500 }
        );
    }
}
