const { sql } = require('@vercel/postgres');

async function checkLocations() {
  console.log('Проверяем данные в колонке location...\n');
  
  const result = await sql`
    SELECT id, display_nickname, location, created_at 
    FROM users 
    ORDER BY created_at DESC 
    LIMIT 30
  `;
  
  console.log('Записи в users:');
  console.log('='.repeat(80));
  
  result.rows.forEach(r => {
    console.log(`ID: ${r.id}`);
    console.log(`  Nick: ${r.display_nickname}`);
    console.log(`  Location: ${JSON.stringify(r.location)}`);
    console.log(`  Created: ${r.created_at}`);
    console.log('-'.repeat(40));
  });
  
  // Проверяем разные форматы
  const stats = await sql`
    SELECT 
      COUNT(*) as total,
      COUNT(location) as with_location,
      COUNT(*) FILTER (WHERE location IS NULL) as null_location,
      COUNT(*) FILTER (WHERE location::text LIKE '%"country"%') as json_format,
      COUNT(*) FILTER (WHERE location::text NOT LIKE '%"country"%' AND location IS NOT NULL) as other_format
    FROM users
  `;
  
  console.log('\nСтатистика:');
  console.log(stats.rows[0]);
}

checkLocations().catch(console.error);
