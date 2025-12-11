/**
 * ГЛАВНАЯ ТОЧКА ВХОДА (app.js)
 * 
 * ОПТИМИЗИРОВАНО: Загружает один объединённый бандл вместо 18 отдельных файлов
 * Это уменьшает время загрузки с ~2-3 секунд до ~300-500ms
 */

console.log('🚀 ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ANONIMKA =====');

// Версия для cache busting (меняйте при обновлениях)
const appVersion = '2.2.9';

/**
 * Загрузка бандла
 */
function loadBundle() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `/webapp/bundle.js?v=${appVersion}`;
        script.type = 'text/javascript';
        
        script.onload = () => {
            console.log('✅ [APP] Бандл загружен');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ [APP] Ошибка загрузки бандла, пробуем fallback...');
            reject(new Error('Failed to load bundle'));
        };
        
        document.head.appendChild(script);
    });
}

/**
 * Fallback загрузка модулей по отдельности
 */
async function loadModulesFallback() {
    console.log('🔄 [APP] Fallback: загрузка модулей по отдельности...');
    
    const modules = [
        '/webapp/modules/telegram-init.js',
        '/webapp/modules/error-logging.js',
        '/webapp/modules/ui-dialogs.js',
        '/webapp/modules/utils.js',
        '/webapp/modules/auth.js',
        '/webapp/modules/auth-modals.js',
        '/webapp/modules/location-data.js',
        '/webapp/modules/photos.js',
        '/webapp/modules/premium.js',
        '/webapp/modules/referral.js',
        '/webapp/modules/world-chat.js',
        '/webapp/modules/debug.js',
        '/webapp/modules/admin.js',
        '/webapp/modules/location.js',
        '/webapp/modules/ads.js',
        '/webapp/modules/chats.js',
        '/webapp/modules/onboarding.js',
        '/webapp/modules/menu.js'
    ];
    
    for (const moduleUrl of modules) {
        try {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = `${moduleUrl}?v=${appVersion}`;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
            console.log(`  ✅ ${moduleUrl}`);
        } catch (e) {
            console.error(`  ❌ ${moduleUrl}`);
        }
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
            
            // Проверяем, это Android устройство?
            const isAndroid = navigator.userAgent.includes('Android');
            
            if (isAndroid) {
                // В Android показываем Email авторизацию (не Telegram!)
                console.log('📱 [APP] Android устройство - показываем Email авторизацию');
                if (typeof showEmailAuthModal === 'function') {
                    showEmailAuthModal();
                }
            } else {
                // В браузере/iOS показываем Telegram авторизацию
                console.log('🌐 [APP] Браузер - показываем Telegram авторизацию');
                if (typeof showTelegramAuthModal === 'function') {
                    showTelegramAuthModal();
                }
            }
            // НЕ прерываем инициализацию - продолжаем загрузку
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
        
        // 4.1 Скрываем функции для email пользователей
        if (typeof hideEmailUserFeatures === 'function') {
            hideEmailUserFeatures();
            console.log('✅ [APP] Email user features скрыты');
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
        
        // 6.1 Завершаем отложенный реферал если есть
        if (typeof finalizePendingReferral === 'function') {
            await finalizePendingReferral();
            console.log('✅ [APP] Отложенный реферал завершён');
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
        
        // 8. Дополнительные инициализации (как в монолите)
        try {
            if (typeof updateChatBadge === 'function') {
                updateChatBadge();
                console.log('✅ [APP] Счётчик чатов обновлён');
            }
        } catch (e) {
            console.error('❌ [APP] Ошибка updateChatBadge:', e);
        }
        
        try {
            if (typeof markMessagesAsDelivered === 'function') {
                markMessagesAsDelivered();
                console.log('✅ [APP] Сообщения помечены как доставленные');
            }
        } catch (e) {
            console.error('❌ [APP] Ошибка markMessagesAsDelivered:', e);
        }
        
        try {
            if (typeof updateLogoutButtonVisibility === 'function') {
                updateLogoutButtonVisibility();
                console.log('✅ [APP] Видимость кнопки выхода обновлена');
            }
        } catch (e) {
            console.error('❌ [APP] Ошибка updateLogoutButtonVisibility:', e);
        }
        
        try {
            if (typeof loadPremiumStatus === 'function') {
                loadPremiumStatus();
                console.log('✅ [APP] Premium статус загружен');
            }
        } catch (e) {
            console.error('❌ [APP] Ошибка loadPremiumStatus:', e);
        }
        
        try {
            if (typeof loadSiteStats === 'function') {
                loadSiteStats();
                console.log('✅ [APP] Статистика сайта загружена');
            }
        } catch (e) {
            console.error('❌ [APP] Ошибка loadSiteStats:', e);
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
    const startTime = performance.now();
    
    try {
        // Пробуем загрузить бандл (один файл вместо 18)
        await loadBundle();
        
        const loadTime = Math.round(performance.now() - startTime);
        console.log(`✅ [APP] Модули загружены за ${loadTime}ms`);
        
        await initializeApplication();
        
        const totalTime = Math.round(performance.now() - startTime);
        console.log(`🎉 [APP] Приложение запущено за ${totalTime}ms`);
        
    } catch (error) {
        // Fallback - загружаем модули по отдельности
        console.warn('⚠️ [APP] Бандл не загрузился, используем fallback');
        await loadModulesFallback();
        await initializeApplication();
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

// Алиас для совместимости с backup
window.initializeApp = initializeApplication;

console.log('✅ [APP] Скрипт инициализации загружен');
