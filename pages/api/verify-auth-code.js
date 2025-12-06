/**
 * API для проверки кода авторизации
 * POST /api/verify-auth-code
 * Body: { code }
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Code is required' 
      });
    }

    // Проверяем формат кода (4 цифры)
    if (!/^\d{4}$/.test(code)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid code format' 
      });
    }

    // Ищем код в базе данных
    const results = await sql`
      SELECT telegram_id, user_data, expires_at, created_at
      FROM auth_codes
      WHERE code = ${code}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Неверный код. Проверьте и попробуйте снова.' 
      });
    }

    const authCode = results[0];

    // Проверяем не истек ли код
    const expiresAt = new Date(authCode.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      // Удаляем истекший код
      await sql`DELETE FROM auth_codes WHERE code = ${code}`;
      
      return res.status(410).json({ 
        success: false, 
        error: 'Код истек. Получите новый код в Telegram боте.' 
      });
    }

    // Парсим данные пользователя
    let userData;
    try {
      userData = typeof authCode.user_data === 'string' 
        ? JSON.parse(authCode.user_data) 
        : authCode.user_data;
    } catch (e) {
      console.error('Error parsing user_data:', e);
      return res.status(500).json({ 
        success: false, 
        error: 'Invalid user data format' 
      });
    }

    // Генерируем детерминированный user_token по telegram_id (как в остальных API)
    const secret = process.env.USER_TOKEN_SECRET || process.env.TOKEN_SECRET || 'dev-temp-secret';
    let userToken;
    try {
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(String(authCode.telegram_id));
      hmac.update(':v1');
      userToken = hmac.digest('hex');
    } catch (e) {
      console.error('Error generating user_token:', e);
      return res.status(500).json({
        success: false,
        error: 'Ошибка генерации токена'
      });
    }

    // Удаляем использованный код
    await sql`DELETE FROM auth_codes WHERE code = ${code}`;

    console.log(`✅ Код ${code} успешно проверен для пользователя ${authCode.telegram_id}`);

    return res.status(200).json({ 
      success: true,
      user: {
        id: authCode.telegram_id,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        username: userData.username || '',
        photo_url: userData.photo_url || '',
        user_token: userToken
      }
    });

  } catch (error) {
    console.error('❌ Error verifying auth code:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера. Попробуйте еще раз.',
      details: error.message 
    });
  }
}
