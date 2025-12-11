/**
 * ГЛАВНАЯ ТОЧКА ВХОДА (app.js)
 * 
 * Оптимизированная загрузка модулей:
 * - Критичные модули загружаются последовательно
 * - Независимые модули загружаются параллельно
 * - Зависимые модули загружаются после параллельных
 */

console.log('🚀 ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ANONIMKA =====');

/**
 * ===== МОДУЛИ ПРИЛОЖЕНИЯ =====
 */

// Критичные модули - загружаются ПОСЛЕДОВАТЕЛЬНО (зависят друг от друга)
const criticalModules = [
    '/webapp/modules/telegram-init.js',    // 1. Инициализация Telegram WebApp (нужен tg)
    '/webapp/modules/error-logging.js',     // 2. Логирование ошибок
    '/webapp/modules/ui-dialogs.js',        // 3. Диалоги и уведомления
    '/webapp/modules/utils.js',             // 4. Вспомогательные функции
    '/webapp/modules/auth.js',              // 5. Аутентификация (нужны utils)
];

// Независимые модули - загружаются ПАРАЛЛЕЛЬНО (6 модулей одновременно)
const parallelModules = [
    '/webapp/modules/auth-modals.js',       // Модальные окна авторизации
    '/webapp/modules/location-data.js',     // Данные локаций
    '/webapp/modules/photos.js',            // Управление фотографиями
    '/webapp/modules/premium.js',           // Премиум функции
    '/webapp/modules/referral.js',          // Рефералка
    '/webapp/modules/world-chat.js',        // Мировой чат
];

// Модули с зависимостями - загружаются ПОСЛЕ параллельных
const dependentModules = [
    '/webapp/modules/location.js',          // Зависит от location-data
    '/webapp/modules/ads.js',               // Зависит от location, photos
    '/webapp/modules/chats.js',             // Зависит от auth
    '/webapp/modules/onboarding.js',        // Зависит от auth
    '/webapp/modules/menu.js'               // Зависит от всех (загружается последним)
];

// Версия для cache busting
const moduleVersion = '2.0.2';

/**
 * Загрузить один модуль
 */
function loadModule(moduleUrl) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${moduleUrl}?v=${moduleVersion}.${Date.now()}`;
        script.type = 'text/javascript';
        
        script.onload = () => {
            console.log(`✅ [APP] Загружен ${moduleUrl}`);
            resolve(moduleUrl);
        };
        script.onerror = () => {
            console.error(`❌ [APP] Ошибка загрузки: ${moduleUrl}`);
            reject(new Error(`Failed to load: ${moduleUrl}`));
        };
        
        document.head.appendChild(script);
    });
}

/**
 * Асинхронная загрузка модулей (оптимизированная)
 */
async function loadModules() {
    console.log('📦 [APP] Начинаем загрузку модулей...');
    const startTime = performance.now();
    
    try {
        // 1. Критичные модули - последовательно (5 модулей)
        console.log('📥 [APP] Загрузка критичных модулей...');
        for (const moduleUrl of criticalModules) {
            await loadModule(moduleUrl);
        }
        
        // 2. Независимые модули - параллельно (6 модулей одновременно!)
        console.log('📥 [APP] Параллельная загрузка независимых модулей...');
        await Promise.all(parallelModules.map(loadModule));
        
        // 3. Зависимые модули - последовательно (5 модулей)
        console.log('📥 [APP] Загрузка зависимых модулей...');
        for (const moduleUrl of dependentModules) {
            await loadModule(moduleUrl);
        }
        
        const loadTime = Math.round(performance.now() - startTime);
        console.log(`✅ [APP] Все модули загружены за ${loadTime}ms!`);
        return true;
        
    } catch (error) {
        console.error(`❌ [APP] Критическая ошибка при загрузке модулей:`, error);
        
        if (typeof logErrorToServer === 'function') {
            logErrorToServer('Module Loading Error', error);
        }
        
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('Ошибка загрузки приложения. Пожалуйста, обновите страницу.');
        } else {
            alert('Ошибка загрузки приложения. Пожалуйста, обновите страницу.');
        }
        
        return false;
    }
}

/**
 * Основная инициализация приложения
 */
async function initializeApplication() {
    try {
        console.log('⚙️ [APP] Инициализация приложения...');
        
        // Проверяем параметры URL
        const urlParams = new URLSearchParams(window.location.search);
        const authParam = urlParams.get('auth');
        console.log('🔗 [APP] URL параметр auth:', authParam);
        
        // 1. Инициализируем Telegram WebApp
        if (typeof initializeTelegramWebApp === 'function') {
            initializeTelegramWebApp();
            console.log('✅ [APP] Telegram WebApp инициализирован');
        }
        
        // 2. Проверяем авторизацию
        let isAuthorized = false;
        if (typeof checkTelegramAuth === 'function') {
            isAuthorized = await checkTelegramAuth();
        }
        
        // Если пришли с параметром auth=telegram, показываем модалку авторизации
        if (authParam === 'telegram') {
            console.log('📱 [APP] Параметр auth=telegram - показываем модальное окно');
            if (typeof showTelegramAuthModal === 'function') {
                showTelegramAuthModal();
            }
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }
        
        // Если пришли с параметром auth=email
        if (authParam === 'email') {
            console.log('📧 [APP] Параметр auth=email - показываем модальное окно');
            if (typeof showEmailAuthModal === 'function') {
                showEmailAuthModal();
            }
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }
        
        if (!isAuthorized) {
            console.warn('⚠️ [APP] Пользователь не авторизирован');
            
            if (typeof showTelegramAuthModal === 'function') {
                console.log('📱 [APP] Показываем окно авторизации...');
                showTelegramAuthModal();
            } else if (typeof showEmailAuthModal === 'function') {
                console.log('📧 [APP] Показываем окно email авторизации...');
                showEmailAuthModal();
            } else {
                console.error('❌ [APP] Функции авторизации не найдены!');
                if (typeof tg !== 'undefined' && tg?.showAlert) {
                    tg.showAlert('Пожалуйста, откройте приложение из Telegram или обновите страницу');
                }
            }
        }
        
        // 3. Инициализируем пользователя в БД (если авторизован)
        if (isAuthorized && typeof initializeUserInDatabase === 'function') {
            await initializeUserInDatabase();
            console.log('✅ [APP] Пользователь инициализирован в БД');
        }
        
        // 4. Инициализируем никнейм
        if (typeof initializeNickname === 'function') {
            await initializeNickname();
            console.log('✅ [APP] Никнейм инициализирован');
        }
        
        // 5. Проверяем местоположение
        if (typeof checkUserLocation === 'function') {
            await checkUserLocation();
            console.log('✅ [APP] Местоположение проверено');
        }
        
        // 6. Обрабатываем реферальную ссылку
        if (typeof handleReferralLink === 'function') {
            await handleReferralLink();
            console.log('✅ [APP] Реферальная ссылка обработана');
        }
        
        // 7. Проверяем, нужен ли онбординг
        if (typeof checkOnboarding === 'function') {
            const needsOnboarding = checkOnboarding();
            
            if (!needsOnboarding) {
                if (typeof initializeMenuModule === 'function') {
                    initializeMenuModule();
                    console.log('✅ [APP] Меню инициализировано');
                }
            }
        } else {
            if (typeof initializeMenuModule === 'function') {
                initializeMenuModule();
                console.log('✅ [APP] Меню инициализировано (fallback)');
            }
        }
        
        console.log('✅ [APP] ===== ПРИЛОЖЕНИЕ ГОТОВО =====');
        
    } catch (error) {
        console.error('❌ [APP] Ошибка инициализации приложения:', error);
        
        if (typeof logErrorToServer === 'function') {
            logErrorToServer('App Initialization Error', error);
        }
        
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('Ошибка при инициализации приложения');
        }
    }
}

/**
 * Точка входа при загрузке DOM
 */
async function startApplication() {
    console.log('📄 [APP] Запуск приложения...');
    
    try {
        const modulesLoaded = await loadModules();
        
        if (modulesLoaded) {
            await initializeApplication();
        }
        
    } catch (error) {
        console.error('❌ [APP] Критическая ошибка при запуске:', error);
        
        if (typeof logErrorToServer === 'function') {
            logErrorToServer('Critical Startup Error', error);
        }
    }
}

// Проверяем статус DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApplication);
} else {
    startApplication();
}

/**
 * Глобальный обработчик ошибок
 */
window.addEventListener('error', (event) => {
    console.error('❌ [APP] Необработанная ошибка:', event.error);
    
    if (typeof logErrorToServer === 'function') {
        logErrorToServer('Uncaught Error', event.error);
    }
});

/**
 * Глобальный обработчик unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ [APP] Необработанный Promise rejection:', event.reason);
    
    if (typeof logErrorToServer === 'function') {
        logErrorToServer('Unhandled Promise Rejection', event.reason);
    }
});

console.log('✅ [APP] Скрипт инициализации загружен');

