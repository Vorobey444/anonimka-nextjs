import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * API для авторизации через Google Sign-In
 * Принимает idToken от Firebase Authentication и email пользователя
 */
export async function POST(request: NextRequest) {
  try {
    const { email, displayName, idToken } = await request.json();

    if (!email || !idToken) {
      return NextResponse.json(
        { success: false, error: 'Email и idToken обязательны' },
        { status: 400 }
      );
    }

    console.log('[Google Auth] Запрос на авторизацию:', { email, displayName: displayName || 'не указан' });

    // Создаем user_token из email (стабильный хеш для Google пользователей)
    const userToken = createHash('sha256')
      .update(`google:${email.toLowerCase()}`)
      .digest('hex');

    // Проверяем существует ли пользователь
    const existingUser = await sql`
      SELECT * FROM users WHERE user_token = ${userToken} LIMIT 1
    `;

    let isNewUser = false;
    let userData;

    if (existingUser.rows.length === 0) {
      // Создаём нового пользователя
      isNewUser = true;
      
      // Генерируем никнейм из email или displayName
      const nickname = displayName || email.split('@')[0];
      
      const result = await sql`
        INSERT INTO users (
          user_token, 
          email, 
          display_nickname, 
          auth_method,
          created_at,
          updated_at
        )
        VALUES (
          ${userToken},
          ${email.toLowerCase()},
          ${nickname},
          'google',
          NOW(),
          NOW()
        )
        RETURNING *
      `;
      
      userData = result.rows[0];
      console.log('[Google Auth] ✅ Новый пользователь создан:', email);
    } else {
      // Пользователь уже существует
      userData = existingUser.rows[0];
      
      // Обновляем last_login_at и email если изменился
      await sql`
        UPDATE users 
        SET 
          updated_at = NOW(),
          email = ${email.toLowerCase()}
        WHERE user_token = ${userToken}
      `;
      
      console.log('[Google Auth] ✅ Существующий пользователь вошел:', email);
    }

    return NextResponse.json({
      success: true,
      isNewUser,
      user: {
        userToken: userData.user_token,
        email: userData.email || email.toLowerCase(),
        displayNickname: userData.display_nickname,
        isPremium: userData.is_premium || false,
        id: userData.id || null
      }
    });

  } catch (error: any) {
    console.error('[Google Auth] ❌ Ошибка:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
