import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * API для отметки отправленных напоминаний
 * POST /api/users/mark-reminder
 * Body: { user_id: number, reminder_type: 'first' | 'second' }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, reminder_type } = body;

        if (!user_id || !reminder_type) {
            return NextResponse.json(
                { success: false, error: 'Missing user_id or reminder_type' },
                { status: 400 }
            );
        }

        if (reminder_type !== 'first' && reminder_type !== 'second') {
            return NextResponse.json(
                { success: false, error: 'Invalid reminder_type. Must be "first" or "second"' },
                { status: 400 }
            );
        }

        // Обновляем timestamp в зависимости от типа напоминания
        if (reminder_type === 'first') {
            // При первом напоминании также сохраняем вариант сообщения
            const message_variant = Math.floor(Math.random() * 4); // 0-3
            
            await sql`
                UPDATE users
                SET first_reminder_sent = NOW(),
                    reminder_message_variant = ${message_variant}
                WHERE id = ${user_id}
            `;
        } else {
            await sql`
                UPDATE users
                SET second_reminder_sent = NOW()
                WHERE id = ${user_id}
            `;
        }

        return NextResponse.json({
            success: true,
            message: `${reminder_type} reminder marked as sent for user ${user_id}`
        });

    } catch (error: any) {
        console.error('[API] Ошибка отметки напоминания:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error?.message || 'Internal server error'
            },
            { status: 500 }
        );
    }
}
