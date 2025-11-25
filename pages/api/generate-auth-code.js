/**
 * API для генерации кода авторизации для Android приложения
 * POST /api/generate-auth-code
 * Body: { code, telegram_id, user_data }
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
    const { code, telegram_id, user_data } = req.body;

    if (!code || !telegram_id || !user_data) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: code, telegram_id, user_data' 
      });
    }

    // Проверяем формат кода (4 цифры)
    if (!/^\d{4}$/.test(code)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Code must be 4 digits' 
      });
    }

    // Сохраняем код в базу данных (срок действия 5 минут)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

    await sql`
      INSERT INTO auth_codes (code, telegram_id, user_data, expires_at, created_at)
      VALUES (${code}, ${telegram_id}, ${JSON.stringify(user_data)}, ${expiresAt.toISOString()}, NOW())
      ON CONFLICT (code) 
      DO UPDATE SET 
        telegram_id = ${telegram_id},
        user_data = ${JSON.stringify(user_data)},
        expires_at = ${expiresAt.toISOString()},
        created_at = NOW()
    `;

    console.log(`✅ Код ${code} сохранен для пользователя ${telegram_id}`);

    return res.status(200).json({ 
      success: true,
      message: 'Auth code generated successfully',
      expires_in: 300 // 5 минут в секундах
    });

  } catch (error) {
    console.error('❌ Error generating auth code:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
