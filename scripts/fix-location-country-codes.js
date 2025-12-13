/**
 * Скрипт для исправления кодов стран в БД
 * Меняет полные названия стран на ISO коды (KZ, RU, etc.)
 * 
 * Использование:
 * node scripts/fix-location-country-codes.js
 */

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function fixLocationCountryCodes() {
    const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
        console.error('❌ POSTGRES_URL не установлен!');
        console.error('Используйте: POSTGRES_URL=your_connection_string node scripts/fix-location-country-codes.js');
        process.exit(1);
    }

    const sql = neon(databaseUrl);
    
    console.log('🔧 Начинаем исправление кодов стран в таблице users...\n');

    try {
        // Подсчитываем записи ДО исправления
        const beforeStats = await sql`
            SELECT location_country, COUNT(*) as count 
            FROM users 
            WHERE location_country IS NOT NULL 
            GROUP BY location_country 
            ORDER BY count DESC
        `;
        
        console.log('📊 Статистика ДО исправления:');
        beforeStats.forEach(row => {
            console.log(`   ${row.location_country}: ${row.count} записей`);
        });
        console.log('');

        // Исправляем коды стран
        const updates = [
            { old: ['kazakhstan', 'Kazakhstan'], new: 'KZ', name: 'Казахстан' },
            { old: ['russia', 'Russia'], new: 'RU', name: 'Россия' },
            { old: ['kyrgyzstan', 'Kyrgyzstan'], new: 'KG', name: 'Кыргызстан' },
            { old: ['uzbekistan', 'Uzbekistan'], new: 'UZ', name: 'Узбекистан' },
            { old: ['tajikistan', 'Tajikistan'], new: 'TJ', name: 'Таджикистан' },
            { old: ['turkmenistan', 'Turkmenistan'], new: 'TM', name: 'Туркменистан' },
            { old: ['belarus', 'Belarus'], new: 'BY', name: 'Беларусь' }
        ];

        let totalUpdated = 0;

        for (const update of updates) {
            console.log(`🔄 Обновляю ${update.name} → ${update.new}...`);
            
            for (const oldCode of update.old) {
                const result = await sql`
                    UPDATE users 
                    SET location_country = ${update.new} 
                    WHERE location_country = ${oldCode}
                `;
                
                const updatedCount = result.count || 0;
                if (updatedCount > 0) {
                    console.log(`   ✅ Обновлено ${updatedCount} записей (${oldCode} → ${update.new})`);
                    totalUpdated += updatedCount;
                }
            }
        }

        console.log(`\n✅ Всего обновлено: ${totalUpdated} записей\n`);

        // Подсчитываем записи ПОСЛЕ исправления
        const afterStats = await sql`
            SELECT location_country, COUNT(*) as count 
            FROM users 
            WHERE location_country IS NOT NULL 
            GROUP BY location_country 
            ORDER BY count DESC
        `;
        
        console.log('📊 Статистика ПОСЛЕ исправления:');
        afterStats.forEach(row => {
            console.log(`   ${row.location_country}: ${row.count} записей`);
        });
        console.log('');

        // Проверяем оставшиеся нестандартные коды
        const invalidCodes = await sql`
            SELECT DISTINCT location_country 
            FROM users 
            WHERE location_country IS NOT NULL 
              AND location_country NOT IN ('KZ', 'RU', 'KG', 'UZ', 'TJ', 'TM', 'BY')
            ORDER BY location_country
        `;

        if (invalidCodes.length > 0) {
            console.log('⚠️ Обнаружены нестандартные коды стран:');
            invalidCodes.forEach(row => {
                console.log(`   - ${row.location_country}`);
            });
        } else {
            console.log('✅ Все коды стран приведены к стандарту ISO!');
        }

        console.log('\n🎉 Миграция завершена успешно!');

    } catch (error) {
        console.error('❌ Ошибка при выполнении миграции:', error);
        process.exit(1);
    }
}

// Запускаем миграцию
fixLocationCountryCodes();
