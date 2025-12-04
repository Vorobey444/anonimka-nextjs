import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - получение пользователей (уже работает через bot)
    if (req.method === 'GET') {
      const { page = 1, limit = 20, gender, city, country, premium } = req.query;
      
      let query = 'SELECT * FROM users WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (gender) {
        query += ` AND first_ad_gender = $${paramIndex++}`;
        params.push(gender);
      }

      if (city) {
        query += ` AND location->>'city' = $${paramIndex++}`;
        params.push(city);
      }

      if (country) {
        query += ` AND country = $${paramIndex++}`;
        params.push(country);
      }

      if (premium === 'true') {
        query += ` AND is_premium = true AND premium_until > NOW()`;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      const result = await pool.query(query, params);
      
      // Получаем общее количество
      const countQuery = query.split('ORDER BY')[0];
      const countResult = await pool.query(
        countQuery.replace('SELECT *', 'SELECT COUNT(*)'),
        params.slice(0, -2)
      );

      return res.status(200).json({
        success: true,
        users: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      });
    }

    // PUT - обновление данных пользователя
    if (req.method === 'PUT') {
      const { tgId, userToken, location, country, email, display_nickname, fcm_token } = req.body;

      if (!tgId && !userToken) {
        return res.status(400).json({
          success: false,
          error: 'tgId или userToken обязательны',
        });
      }

      // Формируем WHERE условие
      const whereConditions = [];
      const whereParams = [];
      let whereIndex = 1;

      if (tgId) {
        whereConditions.push(`id = $${whereIndex++}`);
        whereParams.push(tgId);
      }
      if (userToken) {
        whereConditions.push(`user_token = $${whereIndex++}`);
        whereParams.push(userToken);
      }

      const whereClause = whereConditions.join(' OR ');

      // Формируем SET часть
      const updates = [];
      const updateParams = [...whereParams];
      let updateIndex = whereIndex;

      if (location) {
        updates.push(`location = $${updateIndex++}`);
        updateParams.push(JSON.stringify(location));
      }

      if (country) {
        updates.push(`country = $${updateIndex++}`);
        updateParams.push(country);
      }

      if (email) {
        updates.push(`email = $${updateIndex++}`);
        updateParams.push(email);
      }

      if (display_nickname !== undefined) {
        updates.push(`display_nickname = $${updateIndex++}`);
        updateParams.push(display_nickname);
      }

      if (fcm_token) {
        updates.push(`fcm_token = $${updateIndex++}, fcm_updated_at = NOW()`);
        updateParams.push(fcm_token);
      }

      // Всегда обновляем last_login_at
      updates.push('last_login_at = NOW()');
      updates.push('updated_at = NOW()');

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Нет данных для обновления',
        });
      }

      const updateQuery = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE ${whereClause}
        RETURNING id, display_nickname, location, country, last_login_at
      `;

      const result = await pool.query(updateQuery, updateParams);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден',
        });
      }

      console.log('✅ User updated:', {
        id: result.rows[0].id,
        location: location ? '✓' : '-',
        country: country || result.rows[0].country,
      });

      return res.status(200).json({
        success: true,
        user: result.rows[0],
        message: 'Данные обновлены',
      });
    }

    // POST - создание нового пользователя (если нужно)
    if (req.method === 'POST') {
      const { tgId, email, auth_method = 'telegram', country = 'KZ', location, display_nickname } = req.body;

      if (!tgId && !email) {
        return res.status(400).json({
          success: false,
          error: 'tgId или email обязательны',
        });
      }

      const insertQuery = `
        INSERT INTO users (id, email, auth_method, country, location, display_nickname, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE 
        SET email = EXCLUDED.email,
            location = COALESCE(EXCLUDED.location, users.location),
            display_nickname = COALESCE(EXCLUDED.display_nickname, users.display_nickname),
            updated_at = NOW()
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        tgId || null,
        email || null,
        auth_method,
        country,
        location ? JSON.stringify(location) : null,
        display_nickname || null,
      ]);

      return res.status(201).json({
        success: true,
        user: result.rows[0],
        message: 'Пользователь создан/обновлен',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ API /users error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
