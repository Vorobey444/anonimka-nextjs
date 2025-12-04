import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * API для пакетной отметки пользователей, заблокировавших бота
 * POST /api/users/mark-blocked-batch
 * Body: { user_ids: number[], blocked: boolean }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_ids, blocked } = body;

        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Missing or invalid user_ids array' },
                { status: 400 }
            );
        }

        // Ограничиваем размер пакета для безопасности
        if (user_ids.length > 1000) {
            return NextResponse.json(
                { success: false, error: 'Too many users in batch (max 1000)' },
                { status: 400 }
            );
        }

        // Пакетное обновление статуса блокировки
        // Используем параметризованный запрос с правильной типизацией для массива
        const placeholders = user_ids.map((_, i) => `$${i + 1}`).join(',');
        const query = `
            UPDATE users
            SET is_bot_blocked = $${user_ids.length + 1},
                bot_blocked_at = CASE WHEN $${user_ids.length + 1} = true THEN NOW() ELSE NULL END,
                updated_at = NOW()
            WHERE id IN (${placeholders})
        `;
        
        await sql.query(query, [...user_ids, blocked]);

        console.log(`[BOT BLOCKED BATCH] ${user_ids.length} пользователей ${blocked ? 'заблокировали' : 'разблокировали'} бота`);

        return NextResponse.json({
            success: true,
            message: `${user_ids.length} users ${blocked ? 'blocked' : 'unblocked'} bot`,
            count: user_ids.length
        });

    } catch (error: any) {
        console.error('[API] Ошибка пакетной отметки блокировки:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error?.message || 'Internal server error'
            },
            { status: 500 }
        );
    }
}
