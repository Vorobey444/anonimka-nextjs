import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { migration } = await request.json();
    
    if (!migration) {
      return NextResponse.json({ error: 'Migration name required' }, { status: 400 });
    }

    // Безопасность: только разрешенные миграции
    const allowedMigrations = [
      '001_anonymize_private_chats',
      '002_anonymize_messages',
      '003_verify_user_blocks',
      'rollback_001_private_chats',
      'rollback_002_messages'
    ];

    if (!allowedMigrations.includes(migration)) {
      return NextResponse.json({ error: 'Invalid migration name' }, { status: 400 });
    }

    // Читаем файл миграции
    const migrationPath = path.join(process.cwd(), 'migrations', `${migration}.sql`);
    
    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json({ error: 'Migration file not found' }, { status: 404 });
    }

    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    console.log(`🚀 Executing migration: ${migration}`);
    
    // Выполняем миграцию
    const result = await sql.query(sqlContent);
    
    console.log(`✅ Migration ${migration} completed successfully`);

    return NextResponse.json({
      success: true,
      migration,
      message: `Migration ${migration} executed successfully`,
      result
    });

  } catch (error: any) {
    console.error('❌ Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}

// GET для получения списка миграций
export async function GET() {
  try {
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    
    return NextResponse.json({
      migrations: files.map(f => f.replace('.sql', '')),
      count: files.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
