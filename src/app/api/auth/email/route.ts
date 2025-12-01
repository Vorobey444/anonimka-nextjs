import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Генерация user_token для email пользователей
function generateUserToken(email: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  return crypto
    .createHash('sha256')
    .update(`${email}_${timestamp}_${random}`)
    .digest('hex');
}

// Генерация 6-значного кода подтверждения
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Отправка email через nodemailer
async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    
    // Конфигурация из переменных окружения
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: smtpPort,
      secure: smtpPort === 465, // true для порта 465 (Яндекс), false для 587 (Gmail)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"Anonimka" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Код подтверждения Anonimka',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E91E63;">🔐 Код подтверждения</h2>
          <p>Ваш код для входа в приложение Anonimka:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center; font-size: 32px; font-weight: bold; color: #E91E63; letter-spacing: 5px;">
            ${code}
          </div>
          <p style="color: #666; margin-top: 20px;">Код действителен 10 минут.</p>
          <p style="color: #999; font-size: 12px;">Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
        </div>
      `
    });

    console.log('[EMAIL] ✅ Код отправлен на:', email);
    return true;
  } catch (error) {
    console.error('[EMAIL] ❌ Ошибка отправки:', error);
    return false;
  }
}

// POST /api/auth/email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, code } = body;

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Неверный формат email' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'send-code': {
        console.log('[EMAIL AUTH] 📧 Отправка кода на:', email);

        // Генерируем код
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

        // Проверяем, существует ли пользователь
        const existingUser = await sql`
          SELECT id FROM users WHERE email = ${email} LIMIT 1
        `;

        // Генерируем userToken заранее
        const userToken = generateUserToken(email);

        // Создаём таблицу если её нет (для совместимости)
        await sql`
          CREATE TABLE IF NOT EXISTS verification_codes (
            email VARCHAR(255) PRIMARY KEY,
            code VARCHAR(6) NOT NULL,
            user_token VARCHAR(255),
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `;

        // Сохраняем код и userToken в таблицу verification_codes
        await sql`
          INSERT INTO verification_codes (email, code, user_token, expires_at, created_at)
          VALUES (${email}, ${verificationCode}, ${userToken}, ${expiresAt.toISOString()}, NOW())
          ON CONFLICT (email) 
          DO UPDATE SET 
            code = ${verificationCode},
            user_token = ${userToken},
            expires_at = ${expiresAt.toISOString()},
            created_at = NOW()
        `;

        // Отправляем email
        const emailSent = await sendVerificationEmail(email, verificationCode);

        if (!emailSent) {
          return NextResponse.json(
            { error: 'Ошибка отправки email. Попробуйте позже.' },
            { status: 500 }
          );
        }

        console.log('[EMAIL AUTH] ✅ Код отправлен:', email);

        return NextResponse.json({
          success: true,
          message: 'Код отправлен на ваш email',
          isNewUser: existingUser.rows.length === 0
        });
      }

      case 'verify-code': {
        console.log('[EMAIL AUTH] 🔐 Проверка кода для:', email);

        if (!code || code.length !== 6) {
          return NextResponse.json(
            { error: 'Неверный формат кода' },
            { status: 400 }
          );
        }

        // Проверяем код и получаем сохраненный userToken
        const verificationResult = await sql`
          SELECT code, user_token, expires_at 
          FROM verification_codes 
          WHERE email = ${email}
          LIMIT 1
        `;

        if (verificationResult.rows.length === 0) {
          return NextResponse.json(
            { error: 'Код не найден. Запросите новый код.' },
            { status: 404 }
          );
        }

        const { code: savedCode, user_token: savedUserToken, expires_at } = verificationResult.rows[0];

        // Проверяем срок действия
        if (new Date() > new Date(expires_at)) {
          return NextResponse.json(
            { error: 'Код истек. Запросите новый код.' },
            { status: 410 }
          );
        }

        // Проверяем совпадение кода
        if (code !== savedCode) {
          return NextResponse.json(
            { error: 'Неверный код' },
            { status: 401 }
          );
        }

        // Код верный - ищем или создаём пользователя
        let user = await sql`
          SELECT id, user_token, email, is_premium, premium_until, auto_premium_source
          FROM users 
          WHERE email = ${email}
          LIMIT 1
        `;

        let userId: number;
        let userToken: string;
        let isNewUser = false;

        if (user.rows.length === 0) {
          // Создаём нового пользователя с сохраненным userToken
          userToken = savedUserToken || generateUserToken(email); // Используем сохраненный или генерируем новый (fallback)
          
          // Генерируем уникальный ID для email пользователей (диапазон 10^13+)
          // Пробуем использовать функцию generate_email_user_id(), если нет - генерируем сами
          let emailUserId: number;
          
          try {
            const idResult = await sql`SELECT generate_email_user_id() as id`;
            emailUserId = idResult.rows[0].id;
            console.log('[EMAIL AUTH] ✅ Использована функция generate_email_user_id(), ID:', emailUserId);
          } catch (error: any) {
            // Функция не существует - генерируем ID вручную
            emailUserId = 10000000000000 + Math.floor(Math.random() * 1000000000000);
            console.warn('[EMAIL AUTH] ⚠️ Функция generate_email_user_id() не найдена:', error.message);
            console.log('[EMAIL AUTH] ✅ Сгенерирован ID вручную:', emailUserId);
          }
          
          console.log('[EMAIL AUTH] 📝 Создаем пользователя:', { email, userToken: userToken.substring(0, 16) + '...', id: emailUserId });
          
          try {
            const newUser = await sql`
              INSERT INTO users (
                id,
                user_token,
                email,
                email_verified,
                auth_method,
                is_premium,
                created_from,
                created_at,
                last_login_at
              )
              VALUES (
                ${emailUserId},
                ${userToken},
                ${email},
                true,
                'email',
                false,
                'web',
                NOW(),
                NOW()
              )
              RETURNING id, user_token, email, is_premium
            `;

            userId = newUser.rows[0].id;
            isNewUser = true;

            // Создаём запись в user_limits
            await sql`
              INSERT INTO user_limits (user_id)
              VALUES (${userId})
              ON CONFLICT (user_id) DO NOTHING
            `;

            console.log('[EMAIL AUTH] ✅ Новый email пользователь создан. ID:', userId, 'userToken:', userToken.substring(0, 16) + '...', 'email:', email);
          } catch (insertError: any) {
            console.error('[EMAIL AUTH] ❌ Ошибка создания пользователя:', insertError);
            console.error('[EMAIL AUTH] ❌ Детали ошибки:', { code: insertError.code, message: insertError.message, detail: insertError.detail });
            throw new Error(`Failed to create user: ${insertError.message}`);
          }
        } else {
          // Обновляем существующего пользователя
          userId = user.rows[0].id;
          userToken = user.rows[0].user_token;

          console.log('[EMAIL AUTH] 📧 Существующий пользователь найден. ID:', userId, 'userToken:', userToken ? userToken.substring(0, 16) + '...' : 'NULL', 'email:', email);

          await sql`
            UPDATE users 
            SET email_verified = true,
                last_login_at = NOW()
            WHERE id = ${userId}
          `;

          console.log('[EMAIL AUTH] ✅ Пользователь обновлен:', userId);
        }

        // Удаляем использованный код
        await sql`
          DELETE FROM verification_codes WHERE email = ${email}
        `;

        // Получаем полную информацию о пользователе
        const userInfo = await sql`
          SELECT id, email, user_token, is_premium, premium_until, auto_premium_source, display_nickname
          FROM users 
          WHERE id = ${userId}
          LIMIT 1
        `;

        return NextResponse.json({
          success: true,
          isNewUser,
          user: {
            id: userInfo.rows[0].id,
            email: userInfo.rows[0].email,
            userToken: userInfo.rows[0].user_token,
            isPremium: userInfo.rows[0].is_premium || false,
            premiumUntil: userInfo.rows[0].premium_until,
            premiumSource: userInfo.rows[0].auto_premium_source,
            displayNickname: userInfo.rows[0].display_nickname,
            authMethod: 'email'
          }
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
