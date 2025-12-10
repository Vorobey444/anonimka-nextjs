/**
 * ГЛАВНАЯ ТОЧКА ВХОДА (app.js)
 * 
 * Этот файл импортирует все модули в правильном порядке
 * и инициализирует приложение
 */

console.log('🚀 ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ANONIMKA =====');

/**
 * ===== ПОСЛЕДОВАТЕЛЬНЫЙ ИМПОРТ МОДУЛЕЙ =====
 * 
 * Порядок КРИТИЧЕСКИ ВАЖЕН:
 * 1. Telegram - должен быть первым для функции tg
 * 2. Логирование ошибок - для перехвата ошибок во всех модулях
 * 3. UI диалоги - для модальных окон
 * 4. Утилиты - базовые функции форматирования
 * 5. Аутентификация - получение токена и ID пользователя
 * 6. Данные локаций - словарь стран/регионов/городов
 * 7. Локации - функции работы с геолокацией
 * 8. Объявления - создание и просмотр объявлений
 * 9. Чаты - система сообщений
 * 10. Премиум - управление подпиской
 * 11. Рефералка - реферальная программа
 * 12. Онбординг - первоначальная настройка профиля
 * 13. Меню - навигация по приложению
 */

// Список модулей для импорта в правильном порядке
const modules = [
    'modules/telegram-init.js',        // 1. Инициализация Telegram WebApp
    'modules/error-logging.js',         // 2. Логирование ошибок
    'modules/ui-dialogs.js',            // 3. Диалоги и уведомления
    'modules/utils.js',                 // 4. Вспомогательные функции
    'modules/auth.js',                  // 5. Аутентификация
    'modules/auth-modals.js',           // 6. Модальные окна авторизации
    'modules/location-data.js',         // 7. Данные локаций
    'modules/location.js',              // 8. Работа с локациями
    'modules/ads.js',                   // 9. Объявления
    'modules/chats.js',                 // 10. Чаты
    'modules/world-chat.js',            // 11. Мировой чат
    'modules/photos.js',                // 12. Управление фотографиями
    'modules/premium.js',               // 13. Премиум функции
    'modules/referral.js',              // 14. Рефералка
    'modules/onboarding.js',            // 15. Онбординг
    'modules/menu.js'                   // 16. Навигация
];

/**
 * Асинхронная загрузка модулей
 */
async function loadModules() {
    console.log('📦 [APP] Начинаем загрузку модулей...');
    
    for (const moduleUrl of modules) {
        try {
            console.log(`📥 [APP] Загружаем ${moduleUrl}...`);
            
            // Создаём <script> тег для синхронной загрузки
            const script = document.createElement('script');
            script.src = moduleUrl;
            script.type = 'text/javascript';
            
            // Ждём загрузки модуля
            await new Promise((resolve, reject) => {
                script.onload = () => {
                    console.log(`✅ [APP] Загружен ${moduleUrl}`);
                    resolve();
                };
                script.onerror = () => {
                    console.error(`❌ [APP] Ошибка загрузки модуля: ${moduleUrl}`);
                    reject(new Error(`Failed to load module: ${moduleUrl}`));
                };
                
                document.head.appendChild(script);
            });
            
        } catch (error) {
            console.error(`❌ [APP] Критическая ошибка при загрузке модулей:`, error);
            
            // Логируем ошибку если функция доступна
            if (typeof logErrorToServer === 'function') {
                logErrorToServer('Module Loading Error', error);
            }
            
            // Показываем сообщение пользователю
            if (typeof tg !== 'undefined' && tg?.showAlert) {
                tg.showAlert('Ошибка загрузки приложения. Пожалуйста, обновите страницу.');
            } else {
                alert('Ошибка загрузки приложения. Пожалуйста, обновите страницу.');
            }
            
            return false;
        }
    }
    
    console.log('✅ [APP] Все модули успешно загружены!');
    return true;
}

/**
 * Основная инициализация приложения
 */
async function initializeApplication() {
    try {
        console.log('⚙️ [APP] Инициализация приложения...');
        
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
        
        if (!isAuthorized) {
            console.warn('⚠️ [APP] Пользователь не авторизирован');
            
            // Показываем модальное окно авторизации вместо остановки
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
            // Не прерываем выполнение - позволяем пользователю авторизоваться
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
                // Если онбординг не нужен, инициализируем меню
                if (typeof initializeMenuModule === 'function') {
                    initializeMenuModule();
                    console.log('✅ [APP] Меню инициализировано');
                }
            }
        } else {
            // Fallback: если онбординга нет, инициализируем меню
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
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 [APP] DOMContentLoaded');
    
    try {
        // Загружаем все модули
        const modulesLoaded = await loadModules();
        
        if (modulesLoaded) {
            // Инициализируем приложение
            await initializeApplication();
        }
        
    } catch (error) {
        console.error('❌ [APP] Критическая ошибка при запуске:', error);
        
        if (typeof logErrorToServer === 'function') {
            logErrorToServer('Critical Startup Error', error);
        }
    }
});

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

