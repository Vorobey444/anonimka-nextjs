import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * API для получения списка пользователей без анкет
 * Используется ботом для отправки напоминаний
 */
export async function GET(request: NextRequest) {
    try {
        // Получаем пользователей без анкет, зарегистрированных менее 7 дней назад
        const result = await sql`
            SELECT 
                u.id, 
                u.created_at, 
                u.country,
                u.first_reminder_sent,
                u.second_reminder_sent,
                u.third_reminder_sent,
                u.reminder_message_variant
            FROM users u
            LEFT JOIN ads a ON u.id = a.tg_id
            WHERE a.id IS NULL
              AND u.created_at > NOW() - INTERVAL '7 days'
              AND u.id IS NOT NULL
            ORDER BY u.created_at ASC
        `;

        return NextResponse.json({
            success: true,
            users: result.rows,
            count: result.rows.length
        });

    } catch (error: any) {
        console.error('[API] Ошибка получения пользователей без анкет:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error?.message || 'Internal server error',
                users: []
            },
            { status: 500 }
        );
    }
}
