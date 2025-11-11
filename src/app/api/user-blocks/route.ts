import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, params } = body;

        switch (action) {
            case 'block-user':
                return await blockUser(params);
            case 'unblock-user':
                return await unblockUser(params);
            case 'get-blocked-users':
                return await getBlockedUsers(params);
            case 'is-blocked':
                return await isBlocked(params);
            default:
                return NextResponse.json(
                    { error: 'Unknown action' },
                    { status: 400 }
                );
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('User blocks error:', errorMessage);
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// Заблокировать пользователя
async function blockUser(params: {
    blockerToken: string;
    blockedToken: string;
}) {
    const { blockerToken, blockedToken } = params;

    // Проверяем, не заблокирован ли уже
    const existingBlock = await sql.query(
        `SELECT id FROM user_blocks 
         WHERE blocker_token = $1 AND blocked_token = $2`,
        [blockerToken, blockedToken]
    );

    if (existingBlock.rows.length > 0) {
        return NextResponse.json({ 
            success: true, 
            message: 'Пользователь уже заблокирован' 
        });
    }

    // Добавляем блокировку
    await sql.query(
        `INSERT INTO user_blocks (blocker_token, blocked_token, created_at)
         VALUES ($1, $2, NOW())`,
        [blockerToken, blockedToken]
    );

    return NextResponse.json({ 
        success: true, 
        message: 'Пользователь заблокирован' 
    });
}

// Разблокировать пользователя
async function unblockUser(params: {
    blockerToken: string;
    blockedToken: string;
}) {
    const { blockerToken, blockedToken } = params;

    await sql.query(
        `DELETE FROM user_blocks 
         WHERE blocker_token = $1 AND blocked_token = $2`,
        [blockerToken, blockedToken]
    );

    return NextResponse.json({ 
        success: true, 
        message: 'Пользователь разблокирован' 
    });
}

// Получить список заблокированных пользователей
async function getBlockedUsers(params: {
    userToken: string;
}) {
    const { userToken } = params;

    const result = await sql.query(
        `SELECT blocked_token, created_at
         FROM user_blocks 
         WHERE blocker_token = $1
         ORDER BY created_at DESC`,
        [userToken]
    );

    return NextResponse.json({ 
        success: true, 
        data: result.rows 
    });
}

// Проверить, заблокирован ли пользователь
async function isBlocked(params: {
    blockerToken: string;
    blockedToken: string;
}) {
    const { blockerToken, blockedToken } = params;

    const result = await sql.query(
        `SELECT id FROM user_blocks 
         WHERE blocker_token = $1 AND blocked_token = $2`,
        [blockerToken, blockedToken]
    );

    return NextResponse.json({ 
        success: true, 
        isBlocked: result.rows.length > 0 
    });
}
