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

        // Обновляем статус согласия в таблице ads (основная таблица пользователей)
        await sql`
            UPDATE ads 
            SET agreed_to_terms = ${agreed},
                agreed_at = NOW()
            WHERE user_token = ${userToken}
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

        const result = await sql`
            SELECT agreed_to_terms, agreed_at 
            FROM ads 
            WHERE user_token = ${userToken}
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
