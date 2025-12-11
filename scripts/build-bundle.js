/**
 * Скрипт сборки модулей в единый бандл
 * Запуск: node scripts/build-bundle.js
 */

const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, '../public/webapp/modules');
const OUTPUT_FILE = path.join(__dirname, '../public/webapp/bundle.js');

// Порядок загрузки модулей (важен!)
const moduleOrder = [
    // 1. Критичные (последовательно)
    'telegram-init.js',
    'error-logging.js',
    'ui-dialogs.js',
    'utils.js',
    'auth.js',
    
    // 2. Независимые (можно параллельно, но в бандле порядок не важен)
    'auth-modals.js',
    'location-data.js',
    'photos.js',
    'premium.js',
    'referral.js',
    'world-chat.js',
    'debug.js',
    'admin.js',
    
    // 3. Зависимые (после независимых)
    'location.js',
    'ads.js',
    'chats.js',
    'onboarding.js',
    'menu.js'
];

function buildBundle() {
    console.log('🔨 Начинаем сборку бандла...');
    const startTime = Date.now();
    
    let bundleContent = `/**
 * ANONIMKA BUNDLE
 * Автоматически сгенерирован: ${new Date().toISOString()}
 * Модулей: ${moduleOrder.length}
 */
console.log('📦 [BUNDLE] Загрузка объединённого бандла...');

`;
    
    let totalSize = 0;
    let loadedModules = 0;
    
    for (const moduleName of moduleOrder) {
        const modulePath = path.join(MODULES_DIR, moduleName);
        
        if (!fs.existsSync(modulePath)) {
            console.warn(`⚠️ Модуль не найден: ${moduleName}`);
            continue;
        }
        
        const content = fs.readFileSync(modulePath, 'utf8');
        const size = Buffer.byteLength(content, 'utf8');
        totalSize += size;
        loadedModules++;
        
        bundleContent += `\n// ========== ${moduleName} (${(size/1024).toFixed(1)} KB) ==========\n`;
        bundleContent += `(function() {\n`;
        bundleContent += `try {\n`;
        bundleContent += content;
        bundleContent += `\n} catch(e) { console.error('❌ Ошибка в модуле ${moduleName}:', e); }\n`;
        bundleContent += `})();\n`;
        
        console.log(`  ✅ ${moduleName} (${(size/1024).toFixed(1)} KB)`);
    }
    
    bundleContent += `\nconsole.log('✅ [BUNDLE] Все ${loadedModules} модулей загружены!');\n`;
    
    // Записываем бандл
    fs.writeFileSync(OUTPUT_FILE, bundleContent, 'utf8');
    
    const bundleSize = Buffer.byteLength(bundleContent, 'utf8');
    const buildTime = Date.now() - startTime;
    
    console.log('\n📊 Результат:');
    console.log(`  • Модулей: ${loadedModules}`);
    console.log(`  • Размер: ${(bundleSize/1024).toFixed(1)} KB`);
    console.log(`  • Время: ${buildTime}ms`);
    console.log(`  • Файл: ${OUTPUT_FILE}`);
    console.log('\n✅ Бандл успешно создан!');
}

buildBundle();
