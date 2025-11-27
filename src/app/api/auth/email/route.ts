import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Генерация user_token для email пользователей
function generateUserToken(email: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  return crypto
    .createHash('sha256')
    .update(`${email}_${timestamp}_${random}`)
    .digest('hex');
}

// POST /api/auth/email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, nickname } = body;

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Неверный формат email' },
        { status: 400 }
      );
    }

    // Валидация пароля (минимум 6 символов)
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'register': {
        console.log('[EMAIL AUTH] 📝 Регистрация нового пользователя:', email);

        // Проверяем, существует ли уже пользователь с таким email
        const existingUser = await sql`
          SELECT id FROM users WHERE email = ${email} LIMIT 1
        `;

        if (existingUser.rows.length > 0) {
          return NextResponse.json(
            { error: 'Пользователь с таким email уже существует' },
            { status: 409 }
          );
        }

        // Валидация никнейма
        if (!nickname || nickname.length < 2 || nickname.length > 20) {
          return NextResponse.json(
            { error: 'Никнейм должен содержать от 2 до 20 символов' },
            { status: 400 }
          );
        }

        // Хешируем пароль
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Генерируем user_token
        const userToken = generateUserToken(email);

        // Создаём пользователя
        const newUser = await sql`
          INSERT INTO users (
            user_token,
            email,
            email_verified,
            password_hash,
            auth_method,
            is_premium,
            created_from,
            created_at,
            last_login_at
          )
          VALUES (
            ${userToken},
            ${email},
            false,
            ${passwordHash},
            'email',
            false,
            'android',
            NOW(),
            NOW()
          )
          RETURNING id, user_token, email, is_premium, created_at
        `;

        const userId = newUser.rows[0].id;

        // Создаём запись в user_limits
        await sql`
          INSERT INTO user_limits (user_id)
          VALUES (${userId})
          ON CONFLICT (user_id) DO NOTHING
        `;

        console.log('[EMAIL AUTH] ✅ Пользователь зарегистрирован:', userId);

        return NextResponse.json({
          success: true,
          user: {
            id: userId,
            email: email,
            userToken: userToken,
            nickname: nickname,
            isPremium: false,
            authMethod: 'email'
          }
        });
      }

      case 'login': {
        console.log('[EMAIL AUTH] 🔐 Вход пользователя:', email);

        // Ищем пользователя по email
        const userResult = await sql`
          SELECT 
            id, 
            user_token, 
            email, 
            password_hash, 
            is_premium,
            premium_until,
            auto_premium_source,
            auth_method
          FROM users 
          WHERE email = ${email}
          LIMIT 1
        `;

        if (userResult.rows.length === 0) {
          return NextResponse.json(
            { error: 'Неверный email или пароль' },
            { status: 401 }
          );
        }

        const user = userResult.rows[0];

        // Проверяем метод авторизации
        if (user.auth_method !== 'email') {
          return NextResponse.json(
            { error: 'Этот аккаунт использует другой метод входа' },
            { status: 403 }
          );
        }

        // Проверяем пароль
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: 'Неверный email или пароль' },
            { status: 401 }
          );
        }

        // Обновляем last_login_at
        await sql`
          UPDATE users 
          SET last_login_at = NOW()
          WHERE id = ${user.id}
        `;

        console.log('[EMAIL AUTH] ✅ Вход успешен:', user.id);

        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            userToken: user.user_token,
            isPremium: user.is_premium || false,
            premiumUntil: user.premium_until,
            premiumSource: user.auto_premium_source,
            authMethod: 'email'
          }
        });
      }

      case 'check-email': {
        // Проверка существования email (для валидации на клиенте)
        const existingUser = await sql`
          SELECT id FROM users WHERE email = ${email} LIMIT 1
        `;

        return NextResponse.json({
          exists: existingUser.rows.length > 0
        });
      }

      default:
        return NextResponse.json(
          { error: 'Неизвестное действие' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[EMAIL AUTH] ❌ Ошибка:', error);
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// GET /api/auth/email - проверка авторизации по токену
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userToken = searchParams.get('token');

    if (!userToken) {
      return NextResponse.json(
        { error: 'Токен не предоставлен' },
        { status: 400 }
      );
    }

    // Ищем пользователя по токену
    const userResult = await sql`
      SELECT 
        id, 
        email, 
        user_token,
        is_premium,
        premium_until,
        auto_premium_source,
        auth_method,
        last_login_at
      FROM users 
      WHERE user_token = ${userToken}
      LIMIT 1
    `;

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        userToken: user.user_token,
        isPremium: user.is_premium || false,
        premiumUntil: user.premium_until,
        premiumSource: user.auto_premium_source,
        authMethod: user.auth_method,
        lastLogin: user.last_login_at
      }
    });
  } catch (error: any) {
    console.error('[EMAIL AUTH] ❌ Ошибка проверки токена:', error);
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
