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
            SELECT location->>'country' as country, COUNT(*) as count 
            FROM users 
            WHERE location IS NOT NULL 
            GROUP BY location->>'country'
            ORDER BY count DESC
        `;
        
        console.log('📊 Статистика ДО исправления:');
        beforeStats.forEach(row => {
            console.log(`   ${row.country}: ${row.count} записей`);
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
                    SET location = jsonb_set(location, '{country}', ${JSON.stringify(update.new)}, false)
                    WHERE location->>'country' = ${oldCode}
                `;
                
                const updatedCount = result.count || 0;
                if (updatedCount > 0) {
                    console.log(`   ✅ Обновлено ${updatedCount} записей (${oldCode} → ${update.new})`);
                    totalUpdated += updatedCount;
                }
            }
        }

        console.log(`\n✅ Всего обновлено в users: ${totalUpdated} записей\n`);

        // ===================================================
        // ОБНОВЛЕНИЕ ТАБЛИЦЫ ADS
        // ===================================================
        console.log('🔧 Начинаем исправление кодов стран в таблице ads...\n');

        // Добавляем "Россия" в список для ads (default значение)
        const adsUpdates = [
            { old: ['kazakhstan', 'Kazakhstan'], new: 'KZ', name: 'Казахстан' },
            { old: ['russia', 'Russia', 'Россия'], new: 'RU', name: 'Россия' },
            { old: ['kyrgyzstan', 'Kyrgyzstan'], new: 'KG', name: 'Кыргызстан' },
            { old: ['uzbekistan', 'Uzbekistan'], new: 'UZ', name: 'Узбекистан' },
            { old: ['tajikistan', 'Tajikistan'], new: 'TJ', name: 'Таджикистан' },
            { old: ['turkmenistan', 'Turkmenistan'], new: 'TM', name: 'Туркменистан' },
            { old: ['belarus', 'Belarus'], new: 'BY', name: 'Беларусь' }
        ];

        let adsUpdated = 0;

        for (const update of adsUpdates) {
            console.log(`🔄 Обновляю ads ${update.name} → ${update.new}...`);
            
            for (const oldCode of update.old) {
                const result = await sql`
                    UPDATE ads 
                    SET country = ${update.new} 
                    WHERE country = ${oldCode}
                `;
                
                const updatedCount = result.count || 0;
                if (updatedCount > 0) {
                    console.log(`   ✅ Обновлено ${updatedCount} анкет (${oldCode} → ${update.new})`);
                    adsUpdated += updatedCount;
                }
            }
        }

        console.log(`\n✅ Всего обновлено в ads: ${adsUpdated} записей\n`);

        // Подсчитываем записи ПОСЛЕ исправления
        const afterStats = await sql`
            SELECT location->>'country' as country, COUNT(*) as count 
            FROM users 
            WHERE location IS NOT NULL 
            GROUP BY location->>'country'
            ORDER BY count DESC
        `;
        
        console.log('📊 Статистика ПОСЛЕ исправления (users):');
        afterStats.forEach(row => {
            console.log(`   ${row.country}: ${row.count} записей`);
        });
        console.log('');

        // Статистика для ads
        const adsStats = await sql`
            SELECT country, COUNT(*) as count 
            FROM ads 
            WHERE country IS NOT NULL 
            GROUP BY country
            ORDER BY count DESC
        `;
        
        console.log('📊 Статистика ПОСЛЕ исправления (ads):');
        adsStats.forEach(row => { в users:');
            invalidCodes.forEach(row => {
                console.log(`   - ${row.country}`);
            });
        } else {
            console.log('✅ Все коды стран в users приведены к стандарту ISO!');
        }

        // Проверяем оставшиеся нестандартные коды в ads
        const invalidAdsСodes = await sql`
            SELECT DISTINCT country
            FROM ads 
            WHERE country IS NOT NULL 
              AND country NOT IN ('KZ', 'RU', 'KG', 'UZ', 'TJ', 'TM', 'BY')
            ORDER BY country
        `;

        if (invalidAdsСodes.length > 0) {
            console.log('⚠️ Обнаружены нестандартные коды стран в ads:');
            invalidAdsСodes.forEach(row => {
                console.log(`   - ${row.country}`);
            });
        } else {
            console.log('✅ Все коды стран в adsтные коды в users
        const invalidCodes = await sql`
            SELECT DISTINCT location->>'country' as country
            FROM users 
            WHERE location IS NOT NULL 
              AND location->>'country' NOT IN ('KZ', 'RU', 'KG', 'UZ', 'TJ', 'TM', 'BY')
            ORDER BY country
        `;

        if (invalidCodes.length > 0) {
            console.log('⚠️ Обнаружены нестандартные коды стран:');
            invalidCodes.forEach(row => {
                console.log(`   - ${row.country}`);
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
