import { NextRequest, NextResponse } from 'next/server';

// Хранилище токенов авторизации (в продакшене использовать Redis)
// token -> { user_data, timestamp }
const authTokens = new Map<string, { user: any; timestamp: number }>();

// Очистка старых токенов (старше 5 минут)
setInterval(() => {
    const now = Date.now();
    authTokens.forEach((data, token) => {
        if (now - data.timestamp > 5 * 60 * 1000) {
            authTokens.delete(token);
        }
    });
}, 60000); // Каждую минуту

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, user } = body;

        if (!token || !user) {
            return NextResponse.json(
                { error: 'Token and user are required' },
                { status: 400 }
            );
        }

        // Сохраняем данные пользователя для этого токена
        authTokens.set(token, {
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username,
                photo_url: user.photo_url
            },
            timestamp: Date.now()
        });

        console.log(`[AUTH API] Сохранены данные для токена ${token}:`, user);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[AUTH API] Ошибка при сохранении данных:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        const authData = authTokens.get(token);

        if (!authData) {
            return NextResponse.json(
                { authorized: false },
                { status: 200 }
            );
        }

        // Удаляем токен после использования (одноразовый)
        authTokens.delete(token);

        console.log(`[AUTH API] Токен ${token} использован, данные отправлены`);

        return NextResponse.json({
            authorized: true,
            user: authData.user
        });
    } catch (error) {
        console.error('[AUTH API] Ошибка при получении данных:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
