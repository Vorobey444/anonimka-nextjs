import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

// POST: Сохранить согласие пользователя с условиями
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userToken, agreed } = body;

        if (!userToken) {
            return NextResponse.json(
                { success: false, error: 'userToken обязателен' },
                { status: 400 }
            );
        }

        // Получаем tg_id по user_token из таблицы ads
        const adResult = await sql`
            SELECT tg_id FROM ads WHERE user_token = ${userToken} LIMIT 1
        `;

        if (adResult.rows.length === 0 || !adResult.rows[0].tg_id) {
            // Если нет tg_id, не можем сохранить согласие (только для Telegram пользователей)
            console.warn('[ONBOARDING] Пользователь без tg_id, согласие не сохраняется');
            return NextResponse.json({
                success: true,
                message: 'Согласие принято (пользователь без tg_id)'
            });
        }

        const userId = Number(adResult.rows[0].tg_id);

        // Обновляем согласие в таблице users
        await sql`
            INSERT INTO users (id, agreed_to_terms, agreed_at, updated_at)
            VALUES (${userId}, ${agreed}, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE
            SET agreed_to_terms = ${agreed},
                agreed_at = CASE WHEN ${agreed} = true THEN NOW() ELSE users.agreed_at END,
                updated_at = NOW()
        `;

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Ошибка сохранения согласия:', error);
        return NextResponse.json(
            { success: false, error: 'Ошибка сохранения согласия' },
            { status: 500 }
        );
    }
}

// GET: Проверить статус согласия
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userToken = searchParams.get('userToken');

        if (!userToken) {
            return NextResponse.json(
                { success: false, error: 'userToken обязателен' },
                { status: 400 }
            );
        }

        // Получаем tg_id по user_token
        const adResult = await sql`
            SELECT tg_id FROM ads WHERE user_token = ${userToken} LIMIT 1
        `;

        if (adResult.rows.length === 0 || !adResult.rows[0].tg_id) {
            // Веб-пользователь без tg_id
            return NextResponse.json({
                success: true,
                agreed: false
            });
        }

        const userId = Number(adResult.rows[0].tg_id);

        // Проверяем согласие в таблице users
        const result = await sql`
            SELECT agreed_to_terms, agreed_at 
            FROM users 
            WHERE id = ${userId}
            LIMIT 1
        `;

        if (result.rows.length === 0) {
            return NextResponse.json({
                success: true,
                agreed: false
            });
        }

        return NextResponse.json({
            success: true,
            agreed: result.rows[0].agreed_to_terms || false,
            agreedAt: result.rows[0].agreed_at
        });
    } catch (error) {
        console.error('Ошибка проверки согласия:', error);
        return NextResponse.json(
            { success: false, error: 'Ошибка проверки согласия' },
            { status: 500 }
        );
    }
}
