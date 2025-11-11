import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, params } = body;

        switch (action) {
            case 'get-messages':
                return await getMessages(params);
            case 'send-message':
                return await sendMessage(params);
            case 'get-last-message':
                return await getLastMessage();
            default:
                return NextResponse.json(
                    { error: 'Unknown action' },
                    { status: 400 }
                );
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('World chat error:', errorMessage);
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// Получить сообщения с фильтрацией
async function getMessages(params: {
    tab: 'world' | 'city' | 'private';
    userToken: string;
    userCity?: string;
}) {
    const { tab, userToken, userCity } = params;
    
    let query = '';
    let queryParams: any[] = [];

    if (tab === 'world') {
        // Вкладка "Мир" - только публичные сообщения типа 'world', исключая заблокированных и личные (private)
        query = `
            SELECT id, user_token, nickname, message, type, target_user_token, target_nickname, location_city, is_premium, created_at
            FROM world_chat_messages
            WHERE type = 'world'
            AND user_token NOT IN (
                SELECT blocked_token FROM user_blocks WHERE blocker_token = $1
            )
            ORDER BY created_at DESC
            LIMIT 50
        `;
        queryParams = [userToken];
    } else if (tab === 'city') {
        // Вкладка "Город" - сообщения с городом пользователя + личные сообщения для него, исключая заблокированных
        query = `
            SELECT id, user_token, nickname, message, type, target_user_token, target_nickname, location_city, is_premium, created_at
            FROM world_chat_messages
            WHERE (
                (type = 'city' AND location_city = $1)
                OR (type = 'private' AND (target_user_token = $2 OR user_token = $2))
            )
            AND user_token NOT IN (
                SELECT blocked_token FROM user_blocks WHERE blocker_token = $2
            )
            ORDER BY created_at DESC
            LIMIT 50
        `;
        queryParams = [userCity, userToken];
    } else if (tab === 'private') {
        // Вкладка "ЛС" - только личные сообщения для текущего пользователя, исключая заблокированных
        query = `
            SELECT id, user_token, nickname, message, type, target_user_token, target_nickname, location_city, is_premium, created_at
            FROM world_chat_messages
            WHERE type = 'private' AND (target_user_token = $1 OR user_token = $1)
            AND user_token NOT IN (
                SELECT blocked_token FROM user_blocks WHERE blocker_token = $1
            )
            ORDER BY created_at DESC
            LIMIT 50
        `;
        queryParams = [userToken];
    }

    const result = await sql.query(query, queryParams);
    
    // Реверсируем для отображения снизу вверх (новые внизу)
    const messages = result.rows.reverse();

    return NextResponse.json({ success: true, data: messages });
}

// Отправить сообщение
async function sendMessage(params: {
    userToken: string;
    nickname: string;
    message: string;
    isPremium: boolean;
    city?: string;
}) {
    const { userToken, nickname, message, isPremium, city } = params;

    // Проверка длины сообщения
    if (!message || message.length > 50) {
        return NextResponse.json(
            { error: 'Сообщение должно быть от 1 до 50 символов' },
            { status: 400 }
        );
    }

    // Определяем тип сообщения по префиксу (сначала, чтобы знать нужен ли таймаут)
    let type: 'world' | 'city' | 'private' = 'world';
    let cleanMessage = message;
    let targetUserToken: string | null = null;
    let targetNickname: string | null = null;
    let locationCity: string | null = null;

    if (message.startsWith('@')) {
        type = 'world';
        cleanMessage = message.slice(1).trim();
    } else if (message.startsWith('&')) {
        type = 'city';
        cleanMessage = message.slice(1).trim();
        locationCity = city || null;
    } else if (message.startsWith('/')) {
        type = 'private';
        // Извлекаем ник получателя
        const match = message.match(/^\/(\S+)\s+(.+)$/);
        if (!match) {
            return NextResponse.json(
                { error: 'Формат личного сообщения: /никнейм текст' },
                { status: 400 }
            );
        }
        
        targetNickname = match[1];
        cleanMessage = match[2];

        // Находим user_token по никнейму через ads (так как users может не иметь display_nickname)
        const targetUserResult = await sql.query(
            `SELECT DISTINCT user_token FROM ads WHERE nickname = $1 LIMIT 1`,
            [targetNickname]
        );

        if (targetUserResult.rows.length === 0) {
            return NextResponse.json(
                { error: `Пользователь ${targetNickname} не найден` },
                { status: 404 }
            );
        }

        targetUserToken = targetUserResult.rows[0].user_token;
        
        // Проверяем, не заблокированы ли мы получателем
        const blockCheckResult = await sql.query(
            `SELECT id FROM user_blocks 
             WHERE blocker_token = $1 AND blocked_token = $2`,
            [targetUserToken, userToken]
        );
        
        if (blockCheckResult.rows.length > 0) {
            return NextResponse.json(
                { error: 'Вы не можете отправить сообщение этому пользователю' },
                { status: 403 }
            );
        }
    }

    // Проверка таймаута 30 секунд (только для world и city, не для private)
    if (type === 'world' || type === 'city') {
        const lastMessageResult = await sql.query(
            `SELECT created_at FROM world_chat_messages 
             WHERE user_token = $1 AND type IN ('world', 'city')
             ORDER BY created_at DESC 
             LIMIT 1`,
            [userToken]
        );

        if (lastMessageResult.rows.length > 0) {
            const lastMessageTime = new Date(lastMessageResult.rows[0].created_at);
            const now = new Date();
            const diffSeconds = (now.getTime() - lastMessageTime.getTime()) / 1000;

            if (diffSeconds < 30) {
                const remainingTime = Math.ceil(30 - diffSeconds);
                return NextResponse.json(
                    { error: `Попробуйте через ${remainingTime} сек` },
                    { status: 429 }
                );
            }
        }
    }

    // Вставляем сообщение
    const insertResult = await sql.query(
        `INSERT INTO world_chat_messages 
         (user_token, nickname, message, type, target_user_token, target_nickname, location_city, is_premium)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [userToken, nickname, cleanMessage, type, targetUserToken, targetNickname, locationCity, isPremium]
    );

    return NextResponse.json({ 
        success: true, 
        data: insertResult.rows[0] 
    });
}

// Получить последнее сообщение для превью
async function getLastMessage() {
    const result = await sql.query(
        `SELECT nickname, message, created_at
         FROM world_chat_messages
         ORDER BY created_at DESC
         LIMIT 1`
    );

    if (result.rows.length === 0) {
        return NextResponse.json({ 
            success: true, 
            data: { nickname: 'Мир чат', message: 'Начните общение!', created_at: new Date() } 
        });
    }

    return NextResponse.json({ 
        success: true, 
        data: result.rows[0] 
    });
}
