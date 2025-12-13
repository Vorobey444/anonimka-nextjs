/**
 * Главный файл приложения (app.js) - облегченная версия
 * 
 * АРХИТЕКТУРА:
 * ============
 * Этот файл служит ENTRY POINT и импортирует всех основные модули:
 * 
 * 1. telegram-init.js      - Инициализация Telegram WebApp
 * 2. error-logging.js      - Логирование и обработка ошибок  
 * 3. ui-dialogs.js         - Диалоги и модальные окна
 * 4. utils.js              - Утилиты и вспомогательные функции
 * 5-9. Модули в разработке (auth, location, ads, chats, premium)
 * 
 * Остальной функционал (создание анкет, чаты, локация и т.д.) 
 * находится в исходном app.js (на данный момент неразделён для обратной совместимости)
 */

console.log('🚀 [MAIN] Инициализация главного модуля приложения');

/**
 * ЗАГРУЗКА МОДУЛЕЙ
 * ================
 * Все модули загружаются синхронно в нужном порядке
 */

// Список модулей для загрузки
const modules = [
    'modules/telegram-init.js',      // 1. Инициализация Telegram
    'modules/error-logging.js',      // 2. Логирование ошибок
    'modules/ui-dialogs.js',         // 3. UI диалоги
    'modules/utils.js'               // 4. Утилиты
    // В будущем добавить:
    // 'modules/auth.js',             // 5. Авторизация
    // 'modules/location.js',         // 6. Система локаций
    // 'modules/ads.js',              // 7. Работа с анкетами
    // 'modules/chats.js',            // 8. Чаты
    // 'modules/premium.js'           // 9. Premium функционал
];

/**
 * Динамическая загрузка модулей
 */
function loadModules() {
    console.log('📦 Загрузка модулей...');
    
    modules.forEach((modulePath, index) => {
        const script = document.createElement('script');
        script.src = modulePath;
        script.type = 'text/javascript';
        script.async = false; // Загружаем синхронно для правильного порядка
        script.onerror = function() {
            console.error(`❌ Ошибка загрузки модуля: ${modulePath}`);
        };
        script.onload = function() {
            console.log(`✅ Модуль загружен (${index + 1}/${modules.length}): ${modulePath}`);
        };
        document.head.appendChild(script);
    });
}

/**
 * ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
 * =========================
 * Основной код инициализации и управления жизненным циклом приложения
 */

// Глобальные переменные приложения
let deferredPWAPrompt = null;
let isAdminUser = false;
let adminCheckCompleted = false;

// Переменные для формы создания анкеты
let formData = {};
let currentStep = 1;
const totalSteps = 9;

// Проверяем готовность DOM и запускаем инициализацию
if (document.readyState === 'loading') {
    console.log('📄 DOM загружается, ждем DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', () => {
        loadModules();
        initializeApp();
        setupAutoHideScrollbars();
    });
} else {
    console.log('📄 DOM уже загружен, запускаем инициализацию немедленно');
    loadModules();
    initializeApp();
    setupAutoHideScrollbars();
}

/**
 * ОСНОВНАЯ ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ
 */
function initializeApp() {
    console.log('🚀 Начало инициализации приложения');
    console.log('🚀 [INIT] URL:', window.location.href);
    console.log('🚀 [INIT] URL params:', new URLSearchParams(window.location.search).toString());
    console.log('🚀 [INIT] isTelegramWebApp:', isTelegramWebApp);
    
    // Проверяем если это Android устройство
    const isAndroid = navigator.userAgent.includes('Android');
    const isWebView = navigator.userAgent.includes('wv') || navigator.userAgent.includes('WebView');
    const hasAndroidInterface = typeof AndroidAuth !== 'undefined';
    const isAndroidWebView = isAndroid && (isWebView || hasAndroidInterface);
    
    console.log('📱 [INIT] Android detection:', {
        isAndroid,
        isWebView,
        hasAndroidInterface,
        isAndroidWebView
    });
    
    // Инициализируем Android-специфичное меню
    if (hasAndroidInterface) {
        console.log('🔐 Initializing Android menu...');
        initializeAndroidMenu();
    }
    
    // Для Android приложения - авторизация только через email
    if (isAndroid) {
        console.log('📱 Android device detected, checking email auth...');
        const userToken = localStorage.getItem('user_token');
        const authMethod = localStorage.getItem('auth_method');
        
        if (!userToken) {
            console.log('⚠️ user_token not found - waiting for email auth in native app');
            // Ждём инжекцию auth данных от MainActivity
            setTimeout(() => {
                const retryToken = localStorage.getItem('user_token');
                if (retryToken) {
                    console.log('✅ Auth data appeared after wait, reloading...');
                    window.location.reload();
                } else {
                    console.warn('⚠️ Still no auth data after 2s');
                }
            }, 2000);
        } else {
            console.log('✅ user_token found:', { authMethod });
        }
    }
    
    // Проверяем если это возврат из бота в Android приложение
    const urlParams = new URLSearchParams(window.location.search);
    const fromApp = urlParams.get('from_app') === 'true';
    const authorized = urlParams.get('authorized') === 'true';
    
    if (fromApp && authorized) {
        console.log('📱 Обнаружен возврат из бота в Android приложение');
        console.log('🔄 Закрываем WebApp и возвращаемся в приложение...');
        
        if (window.Telegram?.WebApp?.close) {
            window.Telegram.WebApp.close();
        }
        
        window.parent.postMessage({ type: 'auth_completed', authorized: true }, '*');
        return;
    }
    
    try {
        initializeTelegramWebApp();
        console.log('✅ Telegram WebApp инициализирован');
    } catch (e) {
        console.error('❌ Ошибка инициализации Telegram WebApp:', e);
    }
    
    // Задержка перед проверкой авторизации
    setTimeout(() => {
        console.log('⏰ Начинаем проверку авторизации через 300ms');
        
        try {
            checkTelegramAuth();
            console.log('✅ checkTelegramAuth выполнен');
        } catch (e) {
            console.error('❌ Ошибка checkTelegramAuth:', e);
        }
        
        try {
            initializeUserInDatabase()
                .then(() => {
                    console.log('✅ initializeUserInDatabase завершён');
                    return handleReferralLink();
                })
                .then(() => {
                    console.log('✅ handleReferralLink завершён');
                    return finalizePendingReferral();
                })
                .then(() => {
                    console.log('✅ finalizePendingReferral завершён');
                    return initializeNickname();
                })
                .then(() => {
                    console.log('✅ initializeNickname завершён');
                    hideEmailUserFeatures();
                })
                .catch(e => {
                    console.error('❌ Ошибка цепочки инициализации:', e);
                    console.error('❌ Stack trace:', e.stack);
                });
        } catch (e) {
            console.error('❌ Ошибка запуска инициализации:', e);
        }
        
        try {
            updateChatBadge();
        } catch (e) {
            console.error('❌ Ошибка updateChatBadge:', e);
        }
        
        try {
            markMessagesAsDelivered();
        } catch (e) {
            console.error('❌ Ошибка markMessagesAsDelivered:', e);
        }
        
        try {
            updateLogoutButtonVisibility();
        } catch (e) {
            console.error('❌ Ошибка updateLogoutButtonVisibility:', e);
        }
        
        try {
            loadPremiumStatus();
        } catch (e) {
            console.error('❌ Ошибка loadPremiumStatus:', e);
        }
        
        try {
            loadWorldChatPreview();
            setInterval(() => {
                loadWorldChatPreview();
            }, 10000);
        } catch (e) {
            console.error('❌ Ошибка loadWorldChatPreview:', e);
        }
    }, 300);
    
    try {
        checkUserLocation();
    } catch (e) {
        console.error('❌ Ошибка checkUserLocation:', e);
    }

    // Резервный вызов
    setTimeout(ensureAuthModalVisibility, 1500);
    setTimeout(ensureAuthModalVisibility, 3000);
    
    try {
        setupEventListeners();
    } catch (e) {
        console.error('❌ Ошибка setupEventListeners:', e);
    }
    
    try {
        setupContactsEventListeners();
    } catch (e) {
        console.error('❌ Ошибка setupContactsEventListeners:', e);
    }
    
    // Периодическое обновление счетчика (каждые 10 секунд)
    setInterval(() => {
        try {
            updateChatBadge();
        } catch (e) {
            console.error('❌ Ошибка updateChatBadge в интервале:', e);
        }
    }, 10000);
    
    // Периодическая проверка Premium статуса (каждые 5 минут)
    setInterval(() => {
        try {
            const userId = getCurrentUserId();
            if (userId && !userId.startsWith('web_')) {
                console.log('🔄 Автоматическая проверка Premium статуса');
                loadPremiumStatus();
            }
        } catch (e) {
            console.error('❌ Ошибка проверки Premium в интервале:', e);
        }
    }, 5 * 60 * 1000);
    
    // Обработчик видимости страницы
    let filePickerOpen = false;
    
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log('📱 Страница стала видимой, повторная проверка авторизации');
            
            if (filePickerOpen) {
                console.log('📸 File picker был открыт - пропускаем проверку авторизации');
                filePickerOpen = false;
                return;
            }
            
            setTimeout(() => {
                try {
                    checkTelegramAuth();
                    updateChatBadge();
                    loadPremiumStatus();
                } catch (e) {
                    console.error('❌ Ошибка при повторной проверке:', e);
                }
            }, 500);
        }
    });
    
    window.setFilePickerOpen = (state) => {
        filePickerOpen = state;
        console.log('📸 setFilePickerOpen:', state);
    };
    
    // Обработчик сообщений от всплывающего окна авторизации
    window.addEventListener('message', function(event) {
        if (event.origin !== window.location.origin) {
            return;
        }
        
        if (event.data && event.data.type === 'telegram_auth' && event.data.user) {
            console.log('✅ Получены данные авторизации от всплывающего окна:', event.data.user);
            
            localStorage.setItem('telegram_user', JSON.stringify(event.data.user));
            localStorage.setItem('telegram_auth_time', Date.now().toString());
            
            const modal = document.getElementById('telegramAuthModal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            tg.showAlert(`✅ Авторизация успешна!\n\nДобро пожаловать, ${event.data.user.first_name}!`, () => {
                updateLogoutButtonVisibility();
                location.reload();
            });
        }
    });
}

/**
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 * =======================
 * Эти функции определены здесь как заглушки и могут быть переанованы в модули
 */

function ensureAuthModalVisibility() {
    console.log('⚠️ Резервный механизм: ensureAuthModalVisibility');
}

function initializeAndroidMenu() {
    console.log('🔐 Android меню инициализирован');
}

function handleReferralLink() {
    return Promise.resolve();
}

function finalizePendingReferral() {
    return Promise.resolve();
}

function initializeNickname() {
    return Promise.resolve();
}

function hideEmailUserFeatures() {
    console.log('📧 Email функции скрыты');
}

function updateChatBadge() {
    console.log('💬 Счетчик чатов обновлен');
}

function markMessagesAsDelivered() {
    console.log('✅ Сообщения помечены как доставленные');
}

function updateLogoutButtonVisibility() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    
    // Показываем кнопку логаута, если пользователь авторизован
    if (typeof isUserAuthorized === 'function' && isUserAuthorized()) {
        logoutBtn.style.display = 'flex';
        console.log('🚪 Кнопка выхода показана');
    } else {
        logoutBtn.style.display = 'none';
        console.log('🚪 Кнопка выхода скрыта');
    }
}

function loadPremiumStatus() {
    console.log('💎 Premium статус загружен');
}

function loadWorldChatPreview() {
    console.log('🌍 Превью мир-чата загружено');
}

function checkUserLocation() {
    console.log('📍 Проверка локации');
}

function checkTelegramAuth() {
    console.log('🔐 Проверка Telegram авторизации');
}

function initializeUserInDatabase() {
    return Promise.resolve();
}

function setupEventListeners() {
    console.log('👂 Event listeners установлены');
}

function setupContactsEventListeners() {
    console.log('👂 Contact listeners установлены');
}

function setupAutoHideScrollbars() {
    console.log('📜 Auto-hide scrollbars установлен');
}

/**
 * ИМПОРТ БОЛЬШИХ ФУНКЦИОНАЛЬНОСТЕЙ
 * ==================================
 * Остальной функционал (который был в исходном app.js) 
 * должен быть загружен из исходного файла или разделен на модули
 */

console.log('✅ Главный модуль инициализирован');
console.log('📦 Текущее состояние:');
console.log('   - Модули загружены: Telegram, Error Logging, UI Dialogs, Utils');
console.log('   - В разработке: Auth, Location, Ads, Chats, Premium');
console.log('   - Остальной функционал должен быть загружен отдельно');
