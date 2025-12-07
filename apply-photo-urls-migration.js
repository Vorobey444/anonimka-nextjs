const { sql } = require('@vercel/postgres');

async function applyMigration() {
  try {
    console.log('🔄 Применяем миграцию: добавление photo_urls в таблицу ads...');
    
    await sql`
      ALTER TABLE ads ADD COLUMN IF NOT EXISTS photo_urls TEXT[]
    `;
    
    console.log('✅ Миграция успешно применена!');
    console.log('📋 Колонка photo_urls (TEXT[]) добавлена в таблицу ads');
    
  } catch (error) {
    console.error('❌ Ошибка применения миграции:', error);
    process.exit(1);
  }
}

applyMigration();
