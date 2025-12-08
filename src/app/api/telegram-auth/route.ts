import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Временное хранилище для auth_token (в продакшене использовать Redis или БД)
const authSessions = new Map<string, any>();

// Функция для проверки и удаления истекших сессий
function cleanupExpiredSessions() {
  const now = Date.now();
  const expirationTime = 5 * 60 * 1000; // 5 минут
  
  authSessions.forEach((userData, token) => {
    if (now - userData.timestamp > expirationTime) {
      authSessions.delete(token);
      console.log(`Auth session expired for token: ${token}`);
    }
  });
}

// POST: Сохранить данные авторизации от бота
export async function POST(request: NextRequest) {
  try {
    // Очищаем истекшие сессии перед обработкой
    cleanupExpiredSessions();
    
    const { auth_token, user_data } = await request.json();

    if (!auth_token || !user_data) {
      return NextResponse.json(
        { error: 'Missing auth_token or user_data' },
        { status: 400 }
      );
    }

    // Сохраняем данные пользователя с привязкой к токену
    authSessions.set(auth_token, {
      ...user_data,
      timestamp: Date.now()
    });

    console.log(`Auth session created for token: ${auth_token}`, user_data);

    return NextResponse.json({
      success: true,
      message: 'Authorization data saved'
    });

  } catch (error) {
    console.error('Error in POST telegram-auth:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Проверить статус авторизации по токену
export async function GET(request: NextRequest) {
  try {
    // Очищаем истекшие сессии перед проверкой
    cleanupExpiredSessions();
    
    const { searchParams } = request.nextUrl;
    const auth_token = searchParams.get('auth_token');

    if (!auth_token) {
      return NextResponse.json(
        { error: 'Missing auth_token parameter' },
        { status: 400 }
      );
    }

    // Проверяем наличие данных
    const userData = authSessions.get(auth_token);

    if (!userData) {
      return NextResponse.json({
        authorized: false,
        message: 'Authorization pending or expired'
      });
    }

    // Удаляем токен после успешного получения (одноразовый)
    authSessions.delete(auth_token);

    return NextResponse.json({
      authorized: true,
      user_data: userData
    });

  } catch (error) {
    console.error('Error in GET telegram-auth:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
