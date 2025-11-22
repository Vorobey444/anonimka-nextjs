import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * API для отметки пользователей, заблокировавших бота
 * POST /api/users/mark-blocked
 * Body: { user_id: number, blocked: boolean }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, blocked } = body;

        if (!user_id) {
            return NextResponse.json(
                { success: false, error: 'Missing user_id' },
                { status: 400 }
            );
        }

        // Обновляем статус блокировки
        await sql`
            UPDATE users
            SET is_bot_blocked = ${blocked},
                bot_blocked_at = CASE WHEN ${blocked} = true THEN NOW() ELSE NULL END,
                updated_at = NOW()
            WHERE id = ${user_id}
        `;

        console.log(`[BOT BLOCKED] Пользователь ${user_id} ${blocked ? 'заблокировал' : 'разблокировал'} бота`);

        return NextResponse.json({
            success: true,
            message: `User ${user_id} ${blocked ? 'blocked' : 'unblocked'} bot`
        });

    } catch (error: any) {
        console.error('[API] Ошибка отметки блокировки:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error?.message || 'Internal server error'
            },
            { status: 500 }
        );
    }
}
