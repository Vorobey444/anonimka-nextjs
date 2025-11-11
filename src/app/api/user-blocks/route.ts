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
    blockedNickname?: string;
}) {
    const { blockerToken, blockedToken, blockedNickname } = params;

    // Проверяем, не заблокирован ли уже
    const existingBlock = await sql`
        SELECT id FROM user_blocks 
        WHERE blocker_token = ${blockerToken} AND blocked_token = ${blockedToken}
    `;

    if (existingBlock.rows.length > 0) {
        return NextResponse.json({ 
            success: true, 
            message: 'Пользователь уже заблокирован' 
        });
    }

    // Если никнейм не передан, пытаемся получить его из ads
    let nickname = blockedNickname;
    if (!nickname) {
        const nicknameResult = await sql`
            SELECT nickname FROM ads 
            WHERE user_token = ${blockedToken} 
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        if (nicknameResult.rows.length > 0) {
            nickname = nicknameResult.rows[0].nickname;
        }
    }

    // Добавляем блокировку с никнеймом
    await sql`
        INSERT INTO user_blocks (blocker_token, blocked_token, blocked_nickname, created_at)
        VALUES (${blockerToken}, ${blockedToken}, ${nickname || 'Неизвестный'}, NOW())
    `;

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

    await sql`
        DELETE FROM user_blocks 
        WHERE blocker_token = ${blockerToken} AND blocked_token = ${blockedToken}
    `;

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

    try {
        // Пробуем с полем blocked_nickname
        const result = await sql`
            SELECT blocked_token, blocked_nickname, created_at
            FROM user_blocks 
            WHERE blocker_token = ${userToken}
            ORDER BY created_at DESC
        `;

        return NextResponse.json({ 
            success: true, 
            data: result.rows 
        });
    } catch (error: any) {
        // Если поле blocked_nickname не существует, делаем запрос без него
        console.log('Fallback: blocked_nickname поле не найдено, используем базовый запрос');
        
        const result = await sql`
            SELECT blocked_token, created_at
            FROM user_blocks 
            WHERE blocker_token = ${userToken}
            ORDER BY created_at DESC
        `;

        // Добавляем никнейм из ads для каждого заблокированного
        const enrichedData = await Promise.all(
            result.rows.map(async (block: any) => {
                try {
                    const nicknameResult = await sql`
                        SELECT nickname 
                        FROM ads 
                        WHERE user_token = ${block.blocked_token}
                        ORDER BY created_at DESC
                        LIMIT 1
                    `;
                    return {
                        ...block,
                        blocked_nickname: nicknameResult.rows[0]?.nickname || 'Неизвестный'
                    };
                } catch {
                    return {
                        ...block,
                        blocked_nickname: 'Неизвестный'
                    };
                }
            })
        );

        return NextResponse.json({ 
            success: true, 
            data: enrichedData 
        });
    }
}

// Проверить, заблокирован ли пользователь
async function isBlocked(params: {
    blockerToken: string;
    blockedToken: string;
}) {
    const { blockerToken, blockedToken } = params;

    const result = await sql`
        SELECT id FROM user_blocks 
        WHERE blocker_token = ${blockerToken} AND blocked_token = ${blockedToken}
    `;

    return NextResponse.json({ 
        success: true, 
        isBlocked: result.rows.length > 0 
    });
}
