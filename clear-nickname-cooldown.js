require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

(async () => {
  try {
    console.log('🔍 Ищем пользователя Admin...');
    console.log('📌 POSTGRES_URL:', process.env.POSTGRES_URL ? '✓ найдена' : '✗ не найдена');
    
    // Сначала найдем пользователя Admin
    const findResult = await sql`SELECT id, display_nickname, nickname_changed_at FROM users WHERE LOWER(display_nickname) = LOWER('Admin') LIMIT 1`;
    
    if (findResult.rows.length > 0) {
      const user = findResult.rows[0];
      console.log('✅ Найден пользователь:', user);
      
      const userId = user.id;
      
      // Очищаем nickname_changed_at чтобы убрать блокировку
      const updateResult = await sql`UPDATE users SET nickname_changed_at = NULL WHERE id = ${userId} RETURNING id, display_nickname, nickname_changed_at`;
      
      console.log('✅ Блокировка очищена!');
      console.log('   Результат:', updateResult.rows[0]);
    } else {
      console.log('❌ Пользователь Admin не найден');
    }
  } catch (e) {
    console.error('❌ Ошибка:', e.message);
    process.exit(1);
  }
  
  process.exit(0);
})();
