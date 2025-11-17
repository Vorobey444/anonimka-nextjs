import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * API для автоматической очистки старых анкет
 * Удаляет анкеты старше 7 дней
 */
export async function POST(request: NextRequest) {
    try {
        console.log('[CLEANUP] Начало очистки старых анкет...');

        // Удаляем анкеты старше 7 дней
        const deleteResult = await sql`
            DELETE FROM ads
            WHERE created_at < NOW() - INTERVAL '7 days'
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
            message: `Удалено ${deletedCount} анкет старше 7 дней (чаты удалены через CASCADE)`
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
 * GET endpoint для ручного запуска или проверки статистики
 */
export async function GET(request: NextRequest) {
    try {
        // Получаем количество анкет старше 7 дней
        const result = await sql`
            SELECT COUNT(*) as count
            FROM ads
            WHERE created_at < NOW() - INTERVAL '7 days'
        `;

        const oldAdsCount = parseInt(result.rows[0]?.count || '0');

        return NextResponse.json({
            success: true,
            oldAdsCount,
            message: `Найдено ${oldAdsCount} анкет старше 7 дней, готовых к удалению`
        });

    } catch (error: any) {
        console.error('[CLEANUP] Ошибка при проверке:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error?.message || 'Internal server error' 
            },
            { status: 500 }
        );
    }
}
