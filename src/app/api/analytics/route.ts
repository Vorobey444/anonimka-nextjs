import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { generateUserToken } from '@/lib/userToken';

// Проверка и создание таблиц если их нет
async function ensureTablesExist() {
  try {
    // Проверяем существование таблицы page_visits
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'page_visits'
      );
    `;
    
    if (!tableCheck.rows[0].exists) {
      // Создаем таблицы
      await sql`
        CREATE TABLE IF NOT EXISTS page_visits (
          id SERIAL PRIMARY KEY,
          user_id BIGINT,
          page VARCHAR(100) NOT NULL,
          user_agent TEXT,
          ip_address VARCHAR(45),
          country VARCHAR(100),
          city VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `;
      
      await sql`
        CREATE TABLE IF NOT EXISTS site_stats (
          id SERIAL PRIMARY KEY,
          metric_name VARCHAR(50) UNIQUE NOT NULL,
          metric_value INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `;
      
      await sql`
        INSERT INTO site_stats (metric_name, metric_value) VALUES 
          ('total_visits', 0),
          ('unique_users', 0),
          ('online_now', 0)
        ON CONFLICT (metric_name) DO NOTHING;
      `;
      
      console.log('✅ Analytics tables created');
    }
  } catch (error) {
    console.error('Error ensuring tables:', error);
  }
}

// POST - Записать визит
export async function POST(request: NextRequest) {
  try {
    await ensureTablesExist();
    
    const body = await request.json();
    const { userId, userToken, page, country, city } = body;

    // Получаем данные из заголовков
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'Unknown';

    // Определяем идентификатор: userId (Telegram) или userToken (веб)
    const identifier = userId || userToken || null;

    // Если есть userId, проверяем/создаем пользователя в БД
    if (userId && userId !== 'anonymous') {
      try {
        const token = generateUserToken(userId);
        await sql`
          INSERT INTO users (id, user_token, created_at, updated_at)
          VALUES (${userId}, ${token}, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE
          SET user_token = COALESCE(users.user_token, ${token}),
              updated_at = NOW()
        `;
      } catch (userError) {
        console.log('User already exists or error creating:', userError);
      }
    }

    // Записываем визит с user_id и user_token
    await sql`
      INSERT INTO page_visits (user_id, user_token, page, user_agent, ip_address, country, city)
      VALUES (${userId || null}, ${userToken || null}, ${page}, ${userAgent}, ${ip}, ${country || null}, ${city || null})
    `;
    
    // Обновляем счетчик
    await sql`
      UPDATE site_stats 
      SET metric_value = metric_value + 1,
          updated_at = NOW()
      WHERE metric_name = 'total_visits'
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording visit:', error);
    return NextResponse.json({ error: 'Failed to record visit' }, { status: 500 });
  }
}

// GET - Получить статистику
export async function GET(request: NextRequest) {
  try {
    await ensureTablesExist();
    
    const { searchParams } = request.nextUrl;
    const metric = searchParams.get('metric');

    if (metric === 'all') {
      // Получаем все метрики
      const stats = await sql`
        SELECT metric_name, metric_value, updated_at
        FROM site_stats
      `;

      // Дополнительная аналитика
      // Общее количество зарегистрированных пользователей
      const totalUniqueUsers = await sql`
        SELECT COUNT(*) as count
        FROM users
        WHERE id IS NOT NULL
      `;

      // Пользователи активные за последние 24 часа
      // Считаем по last_login_at (обновляется при каждом входе в приложение)
      const uniqueLast24h = await sql`
        SELECT COUNT(*) as count
        FROM users
        WHERE last_login_at >= NOW() - INTERVAL '24 hours'
      `;

      // Общее количество анкет
      const totalAds = await sql`
        SELECT COUNT(*) as count
        FROM ads
      `;

      // Количество пользователей, заблокировавших бота
      const blockedUsers = await sql`
        SELECT COUNT(*) as count
        FROM users
        WHERE is_bot_blocked = true
      `;

      return NextResponse.json({
        stats: stats.rows,
        total_unique_users: parseInt(totalUniqueUsers.rows[0]?.count || 0),
        unique_last_24h: parseInt(uniqueLast24h.rows[0]?.count || 0),
        blocked_users: parseInt(blockedUsers.rows[0]?.count || 0),
        total_ads: parseInt(totalAds.rows[0]?.count || 0)
      });
    } else {
      // Получаем конкретную метрику
      const result = await sql`
        SELECT metric_value
        FROM site_stats
        WHERE metric_name = ${metric || 'total_visits'}
      `;

      return NextResponse.json({
        metric: metric || 'total_visits',
        value: result.rows[0]?.metric_value || 0
      });
    }
  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
