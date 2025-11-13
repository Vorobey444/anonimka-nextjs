import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

// POST - Записать визит
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, page, country, city } = body;

    // Получаем данные из заголовков
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'Unknown';

    // Записываем визит
    await sql`
      INSERT INTO page_visits (user_id, page, user_agent, ip_address, country, city)
      VALUES (${userId || null}, ${page}, ${userAgent}, ${ip}, ${country || null}, ${city || null})
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
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');

    if (metric === 'all') {
      // Получаем все метрики
      const stats = await sql`
        SELECT metric_name, metric_value, updated_at
        FROM site_stats
      `;

      // Дополнительная аналитика
      const todayVisits = await sql`
        SELECT COUNT(*) as count
        FROM page_visits
        WHERE created_at >= CURRENT_DATE
      `;

      const uniqueToday = await sql`
        SELECT COUNT(DISTINCT user_id) as count
        FROM page_visits
        WHERE created_at >= CURRENT_DATE AND user_id IS NOT NULL
      `;

      const last24h = await sql`
        SELECT COUNT(*) as count
        FROM page_visits
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `;

      return NextResponse.json({
        stats: stats.rows,
        today_visits: todayVisits.rows[0].count,
        unique_today: uniqueToday.rows[0].count,
        last_24h: last24h.rows[0].count
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
