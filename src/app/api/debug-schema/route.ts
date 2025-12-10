import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Получаем список всех таблиц
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    // Получаем структуру всех таблиц
    const allSchemas: Record<string, any> = {};
    
    for (const table of tables.rows) {
      const tableName = table.table_name;
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;
      allSchemas[tableName] = columns.rows;
    }

    // Также получаем количество записей в основных таблицах
    const counts: Record<string, number> = {};
    try {
      const usersCount = await sql`SELECT COUNT(*) as count FROM users`;
      counts.users = parseInt(usersCount.rows[0]?.count || '0');
    } catch (e) { counts.users = -1; }
    
    try {
      const adsCount = await sql`SELECT COUNT(*) as count FROM ads`;
      counts.ads = parseInt(adsCount.rows[0]?.count || '0');
    } catch (e) { counts.ads = -1; }
    
    try {
      const chatsCount = await sql`SELECT COUNT(*) as count FROM private_chats`;
      counts.private_chats = parseInt(chatsCount.rows[0]?.count || '0');
    } catch (e) { counts.private_chats = -1; }

    return NextResponse.json({
      tables: tables.rows.map(t => t.table_name),
      schemas: allSchemas,
      counts
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
