// Скрипт для выполнения миграций на Neon
// Запуск: node migrations/execute_migrations.js

const fs = require('fs');
const path = require('path');
const { sql } = require('@vercel/postgres');

async function executeMigration(filePath) {
  console.log(`\n📝 Executing migration: ${path.basename(filePath)}`);
  
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Выполняем SQL
    await sql.query(sqlContent);
    
    console.log(`✅ Successfully executed: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error in ${path.basename(filePath)}:`);
    console.error(error.message);
    return false;
  }
}

async function runMigrations() {
  console.log('🚀 Starting database anonymization migrations...\n');
  
  const migrations = [
    'migrations/001_anonymize_private_chats.sql',
    'migrations/002_anonymize_messages.sql',
    'migrations/003_verify_user_blocks.sql'
  ];
  
  for (const migration of migrations) {
    const fullPath = path.join(process.cwd(), migration);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Migration file not found: ${migration}`);
      process.exit(1);
    }
    
    const success = await executeMigration(fullPath);
    
    if (!success) {
      console.error(`\n⚠️  Migration failed! Run rollback if needed.`);
      process.exit(1);
    }
    
    // Небольшая пауза между миграциями
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✨ All migrations completed successfully!');
  console.log('📋 Next steps:');
  console.log('1. Update API code to use new column names');
  console.log('2. Test all functionality');
  console.log('3. Drop old columns after verification');
}

runMigrations().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
