import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * API для автоматической очистки старых анкет
 * Удаляет анкеты старше 30 дней
 */
export async function POST(request: NextRequest) {
    try {
        console.log('[CLEANUP] Начало очистки старых анкет...');

        // Удаляем анкеты старше 30 дней
        const deleteResult = await sql`
            DELETE FROM ads
            WHERE created_at < NOW() - INTERVAL '30 days'
            RETURNING id, created_at
        `;

        const deletedCount = deleteResult.rowCount || 0;
        const deletedIds = deleteResult.rows.map((row: any) => row.id);

        console.log(`[CLEANUP] Удалено анкет: ${deletedCount}`);
        if (deletedIds.length > 0) {
            console.log(`[CLEANUP] ID удаленных анкет: ${deletedIds.join(', ')}`);
        }

        // Также очищаем связанные чаты для удаленных анкет
        // Пропускаем удаление чатов, т.к. они удаляются автоматически через CASCADE
        console.log('[CLEANUP] Связанные чаты будут удалены автоматически через CASCADE');

        return NextResponse.json({
            success: true,
            deletedAds: deletedCount,
            message: `Удалено ${deletedCount} анкет старше 30 дней (чаты удалены через CASCADE)`
        });

    } catch (error: any) {
        console.error('[CLEANUP] Ошибка при очистке:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error?.message || 'Internal server error' 
            },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint - выполняет очистку (для Vercel Cron)
 * Vercel Crons делают GET запросы, поэтому удаление здесь
 */
export async function GET(request: NextRequest) {
    try {
        console.log('[CLEANUP] Начало очистки старых анкет (GET/Cron)...');

        // Удаляем анкеты старше 30 дней
        const deleteResult = await sql`
            DELETE FROM ads
            WHERE created_at < NOW() - INTERVAL '30 days'
            RETURNING id, created_at
        `;

        const deletedCount = deleteResult.rowCount || 0;
        const deletedIds = deleteResult.rows.map((row: any) => row.id);

        console.log(`[CLEANUP] Удалено анкет: ${deletedCount}`);
        if (deletedIds.length > 0) {
            console.log(`[CLEANUP] ID удаленных анкет: ${deletedIds.join(', ')}`);
        }

        return NextResponse.json({
            success: true,
            deletedAds: deletedCount,
            message: `Удалено ${deletedCount} анкет старше 30 дней`
        });

    } catch (error: any) {
        console.error('[CLEANUP] Ошибка при очистке:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error?.message || 'Internal server error' 
            },
            { status: 500 }
        );
    }
}
