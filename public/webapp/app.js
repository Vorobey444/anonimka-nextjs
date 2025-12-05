// ============= ANDROID AUTH CHECKER =============
// Для Android WebView: агрессивная проверка auth data
(function() {
    const isAndroid = navigator.userAgent.includes('Android');
    if (!isAndroid) return;
    
    console.log('📱 [EARLY] Android detected, starting auth data monitor...');
    
    let checkCount = 0;
    const maxChecks = 30; // 30 проверок * 100ms = 3 секунды
    
    const authMonitor = setInterval(() => {
        checkCount++;
        
        const userToken = localStorage.getItem('user_token');
        const hasAndroidInterface = typeof AndroidAuth !== 'undefined';
        
        if (userToken) {
            console.log('✅ [EARLY] Auth data found in localStorage:', {
                userToken: userToken.substring(0, 16) + '...',
                authMethod: localStorage.getItem('auth_method'),
                hasInterface: hasAndroidInterface
            });
            clearInterval(authMonitor);
        } else if (checkCount >= maxChecks) {
            console.warn('⚠️ [EARLY] No auth data after 3 seconds, stopping monitor');
            console.warn('   hasAndroidInterface:', hasAndroidInterface);
            console.warn('   localStorage keys:', Object.keys(localStorage));
            clearInterval(authMonitor);
        }
    }, 100);
})();

// Инициализация Telegram Web App с безопасными fallback методами
let tg = window.Telegram?.WebApp || {
    expand: () => {},
    setHeaderColor: () => {},
    setBackgroundColor: () => {},
    MainButton: {
        setText: () => {},
        onClick: () => {},
        show: () => {},
        hide: () => {}
    },
    BackButton: {
        onClick: () => {},
        show: () => {},
        hide: () => {}
    },
    initDataUnsafe: {
        user: null
    },
    ready: () => {},
    close: () => {},
    showAlert: (message) => alert(message)
};

// Глобальная переменная для PWA установки
let deferredPWAPrompt = null;

// Переменные для статистики админа
let isAdminUser = false;
let adminCheckCompleted = false;

// ============= СИСТЕМА ЛОГИРОВАНИЯ ОШИБОК =============
// Отправка ошибки на сервер
const errorLogCache = new Map(); // Кеш с временными метками
const ERROR_CACHE_TTL = 30000; // 30 секунд
const ENABLE_ERROR_DEBUG = false; // Отладка системы логирования

// ВАЖНО: Скрываем модальные окна авторизации в самом начале (до любых других скриптов)
(function hideAuthModalsImmediately() {
    if (document.readyState === 'loading') {
        // DOM еще не загружен, ждем
        document.addEventListener('DOMContentLoaded', function() {
            const telegramModal = document.getElementById('telegramAuthModal');
            const emailModal = document.getElementById('emailAuthModal');
            if (telegramModal) telegramModal.style.display = 'none';
            if (emailModal) emailModal.style.display = 'none';
        });
    } else {
        // DOM уже загружен
        const telegramModal = document.getElementById('telegramAuthModal');
        const emailModal = document.getElementById('emailAuthModal');
        if (telegramModal) telegramModal.style.display = 'none';
        if (emailModal) emailModal.style.display = 'none';
    }
})();

// История действий пользователя (последние 10 действий)
const userActionHistory = [];
const MAX_ACTION_HISTORY = 10;

// Функция для логирования действий пользователя
window.logUserAction = function(action, details = {}) {
    const timestamp = new Date().toISOString();
    userActionHistory.push({ action, details, timestamp });
    if (userActionHistory.length > MAX_ACTION_HISTORY) {
        userActionHistory.shift(); // Удаляем самое старое действие
    }
};

async function logErrorToServer(error, type = 'error') {
    try {
        // Создаем более точный ключ кеша
        const errorMessage = error.message || String(error);
        const errorStack = error.stack || '';
        // Берем только первую строку stack trace (место возникновения ошибки)
        const stackFirstLine = errorStack.split('\n')[1]?.trim() || '';
        const errorKey = `${type}:${errorMessage}:${stackFirstLine}`;
        
        if (ENABLE_ERROR_DEBUG) {
            console.log('[ERROR LOG] Обработка ошибки:', errorMessage);
            console.log('[ERROR LOG] Ключ кеша:', errorKey);
        }
        
        // Проверяем кеш с учетом времени
        const now = Date.now();
        const cachedTime = errorLogCache.get(errorKey);
        
        if (cachedTime && (now - cachedTime) < ERROR_CACHE_TTL) {
            if (ENABLE_ERROR_DEBUG) {
                const remainingTime = Math.ceil((ERROR_CACHE_TTL - (now - cachedTime)) / 1000);
                console.log(`[ERROR LOG] Ошибка в кеше, осталось ${remainingTime} сек до повторной отправки`);
            }
            return;
        }
        
        // Обновляем кеш
        errorLogCache.set(errorKey, now);
        
        // Очищаем старые записи из кеша (оптимизация памяти)
        if (errorLogCache.size > 50) {
            const keysToDelete = [];
            for (const [key, time] of errorLogCache.entries()) {
                if (now - time > ERROR_CACHE_TTL) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => errorLogCache.delete(key));
        }
        
        // Определяем критичность ошибки
        const isCritical = errorMessage.includes('not defined') || 
                          errorMessage.includes('is not a function') ||
                          errorMessage.includes('Cannot read') ||
                          type === 'unhandledRejection';
        
        const errorData = {
            message: errorMessage,
            stack: errorStack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            userId: tg.initDataUnsafe?.user?.id || localStorage.getItem('user_id'),
            username: tg.initDataUnsafe?.user?.username,
            timestamp: new Date().toISOString(),
            type: type,
            critical: isCritical,
            // Состояние приложения
            appState: {
                isAuthorized: !!localStorage.getItem('user_token') || !!localStorage.getItem('telegram_user'),
                hasNickname: !!localStorage.getItem('user_nickname'),
                currentPage: window.location.pathname,
                screenSize: `${window.innerWidth}x${window.innerHeight}`,
                online: navigator.onLine
            },
            // Последние действия пользователя
            recentActions: userActionHistory.slice(-5) // Последние 5 действий
        };
        
        if (ENABLE_ERROR_DEBUG) {
            console.log('[ERROR LOG] Отправка на сервер...');
        }
        
        // Отправляем асинхронно, не блокируем UI
        fetch('/api/log-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorData)
        })
        .then(response => {
            if (ENABLE_ERROR_DEBUG) {
                console.log('[ERROR LOG] Ответ сервера:', response.status);
            }
            return response.json();
        })
        .then(data => {
            if (ENABLE_ERROR_DEBUG) {
                console.log('[ERROR LOG] Результат:', data);
                if (data.telegramSent === false && data.telegramError) {
                    console.error('[ERROR LOG] ❌ Ошибка отправки в Telegram:', data.telegramError);
                } else if (data.telegramSent === true) {
                    console.log('[ERROR LOG] ✅ Уведомление отправлено в Telegram');
                }
            }
        })
        .catch(err => console.error('[ERROR LOG] Не удалось отправить лог:', err));
        
    } catch (logError) {
        console.error('[ERROR LOG] Ошибка при логировании:', logError);
    }
}

// Глобальный обработчик ошибок JavaScript
window.addEventListener('error', (event) => {
    console.error('❌ Перехвачена ошибка:', event.error);
    logErrorToServer(event.error || { message: event.message, stack: '' }, 'error');
});

// Обработчик необработанных Promise rejection
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Необработанное отклонение Promise:', event.reason);
    const error = event.reason instanceof Error 
        ? event.reason 
        : { message: String(event.reason), stack: '' };
    logErrorToServer(error, 'unhandledRejection');
});

// Функция для ручного логирования ошибок
window.logError = function(message, error) {
    console.error(message, error);
    logErrorToServer(error || { message, stack: '' }, 'manual');
};

// Утилита: безопасное выполнение async функций с автологированием
window.safeAsync = async function(actionName, asyncFn) {
    window.logUserAction(actionName, { started: true });
    try {
        const result = await asyncFn();
        window.logUserAction(actionName, { completed: true });
        return result;
    } catch (error) {
        console.error(`❌ Ошибка в ${actionName}:`, error);
        window.logUserAction(actionName, { error: error.message });
        logErrorToServer(error, 'async_error');
        throw error; // Пробрасываем дальше
    }
};

// Утилиты для управления системой логирования
window.clearErrorCache = function() {
    errorLogCache.clear();
    console.log('[ERROR LOG] ✅ Кеш очищен');
};

window.getErrorCacheInfo = function() {
    console.log('[ERROR LOG] Размер кеша:', errorLogCache.size);
    const now = Date.now();
    console.log('[ERROR LOG] Записи в кеше:');
    for (const [key, time] of errorLogCache.entries()) {
        const age = Math.ceil((now - time) / 1000);
        console.log(`  - ${key.substring(0, 60)}... (${age} сек назад)`);
    }
};

window.getActionHistory = function() {
    console.log('[ACTION LOG] История действий пользователя:');
    userActionHistory.forEach((action, i) => {
        console.log(`${i + 1}. [${action.timestamp}] ${action.action}`, action.details);
    });
};

console.log('✅ Система логирования ошибок инициализирована');
console.log('💡 Доступные команды: window.logError(), window.logUserAction(), window.safeAsync(), window.clearErrorCache(), window.getErrorCacheInfo(), window.getActionHistory()');

// Слушаем событие установки PWA (для браузерной версии)
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📥 PWA готово к установке');
    e.preventDefault();
    deferredPWAPrompt = e;
});

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator && !window.Telegram?.WebApp) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✅ Service Worker зарегистрирован:', reg.scope))
            .catch(err => console.error('❌ Ошибка регистрации Service Worker:', err));
    });
}

// ============= БЕЗОПАСНОСТЬ: СКРЫТИЕ ЧУВСТВИТЕЛЬНЫХ ДАННЫХ В ЛОГАХ =============
// Функция для хеширования чувствительных данных в логах
function hashSensitiveData(data) {
    if (!data) return '***';
    const str = String(data);
    // Показываем только первые 3 и последние 3 символа
    if (str.length <= 6) return '***';
    return str.substring(0, 3) + '***' + str.substring(str.length - 3);
}

// Безопасный console.log для разработки (в продакшене можно отключить)
const ENABLE_DEBUG_LOGS = false; // Установи false в продакшене!

function safeLog(...args) {
    if (!ENABLE_DEBUG_LOGS) return;
    
    // Заменяем чувствительные данные на хешированные
    const safeArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
            const safeCopy = { ...arg };
            // Скрываем чувствительные поля
            if (safeCopy.userId) safeCopy.userId = hashSensitiveData(safeCopy.userId);
            if (safeCopy.tg_id) safeCopy.tg_id = hashSensitiveData(safeCopy.tg_id);
            if (safeCopy.tgId) safeCopy.tgId = hashSensitiveData(safeCopy.tgId);
            if (safeCopy.chatId) safeCopy.chatId = hashSensitiveData(safeCopy.chatId);
            if (safeCopy.referrerId) safeCopy.referrerId = hashSensitiveData(safeCopy.referrerId);
            if (safeCopy.currentUserId) safeCopy.currentUserId = hashSensitiveData(safeCopy.currentUserId);
            return safeCopy;
        }
        return arg;
    });
    console.log(...safeArgs);
}

// Безопасная обертка для showAlert с fallback на модальное окно
// Сохраняем оригинальные методы ПЕРЕД использованием
const originalAlert = window.alert;
const originalConfirm = window.confirm;
const originalPrompt = window.prompt;
const originalShowAlert = tg.showAlert ? tg.showAlert.bind(tg) : null;
const originalShowPopup = tg.showPopup ? tg.showPopup.bind(tg) : null;

// Функция для показа кастомного alert
function showCustomAlert(message, callback) {
    const modal = document.getElementById('customAlertModal');
    const messageEl = document.getElementById('customAlertMessage');
    const btn = document.getElementById('customAlertBtn');
    
    if (modal && messageEl && btn) {
        messageEl.textContent = message;
        modal.style.display = 'flex';
        
        // Удаляем предыдущие обработчики
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Добавляем новый обработчик
        newBtn.onclick = function() {
            modal.style.display = 'none';
            if (callback) setTimeout(callback, 0);
        };
    } else {
        // Используем оригинальный alert вместо переопределённого
        originalAlert.call(window, message);
        if (callback) setTimeout(callback, 0);
    }
}

// Безопасная обертка для showPopup с fallback на showAlert
tg.showPopup = function(params, callback) {
    // Проверяем версию и наличие метода
    const version = parseFloat(tg.version || '6.0');
    const isRealTelegram = !!(
        window.Telegram?.WebApp?.platform && 
        window.Telegram.WebApp.platform !== 'unknown' &&
        window.Telegram.WebApp.initData
    );
    
    if (isRealTelegram && version >= 6.2 && originalShowPopup) {
        try {
            originalShowPopup(params, callback);
            return;
        } catch (e) {
            console.warn('showPopup failed:', e.message);
        }
    }
    
    // Fallback: используем кастомный alert
    const message = params.message || params.title || 'Уведомление';
    showCustomAlert(message, callback);
};

// Переопределяем tg.showAlert для использования модального окна в браузере
tg.showAlert = function(message, callback) {
    const isRealTelegram = !!(
        window.Telegram?.WebApp?.platform && 
        window.Telegram.WebApp.platform !== 'unknown' &&
        window.Telegram.WebApp.initData
    );
    
    if (isRealTelegram && originalShowAlert) {
        try {
            originalShowAlert(message, callback);
            return;
        } catch (e) {
            console.warn('showAlert failed:', e.message);
        }
    }
    
    // В браузере используем кастомное модальное окно
    showCustomAlert(message, callback);
};

// Функция для показа кастомного confirm
function showCustomConfirm(message, callback) {
    const modal = document.getElementById('customConfirmModal');
    const messageEl = document.getElementById('customConfirmMessage');
    const yesBtn = document.getElementById('customConfirmYes');
    const noBtn = document.getElementById('customConfirmNo');
    
    if (modal && messageEl && yesBtn && noBtn) {
        messageEl.textContent = message;
        modal.style.display = 'flex';
        
        // Сохраняем callback для использования при клике на overlay
        modal.setAttribute('data-confirm-callback', 'pending');
        modal._confirmCallback = callback;
        
        // Удаляем предыдущие обработчики
        const newYesBtn = yesBtn.cloneNode(true);
        const newNoBtn = noBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
        noBtn.parentNode.replaceChild(newNoBtn, noBtn);
        
        // Добавляем новые обработчики
        newYesBtn.onclick = function() {
            modal.style.display = 'none';
            modal.removeAttribute('data-confirm-callback');
            if (callback) setTimeout(() => callback(true), 0);
        };
        
        newNoBtn.onclick = function() {
            modal.style.display = 'none';
            modal.removeAttribute('data-confirm-callback');
            if (callback) setTimeout(() => callback(false), 0);
        };
    } else {
        const result = confirm(message);
        if (callback) setTimeout(() => callback(result), 0);
    }
}

// Функция для показа кастомного prompt
function showCustomPrompt(message, callback) {
    const modal = document.getElementById('customPromptModal');
    const messageEl = document.getElementById('customPromptMessage');
    const input = document.getElementById('customPromptInput');
    const okBtn = document.getElementById('customPromptOk');
    const cancelBtn = document.getElementById('customPromptCancel');
    
    if (modal && messageEl && input && okBtn && cancelBtn) {
        messageEl.textContent = message;
        input.value = '';
        modal.style.display = 'flex';
        setTimeout(() => input.focus(), 100);
        
        // Удаляем предыдущие обработчики
        const newOkBtn = okBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // Добавляем новые обработчики
        newOkBtn.onclick = function() {
            const value = input.value;
            modal.style.display = 'none';
            if (callback) setTimeout(() => callback(value), 0);
        };
        
        newCancelBtn.onclick = function() {
            modal.style.display = 'none';
            if (callback) setTimeout(() => callback(null), 0);
        };
        
        // Enter для отправки
        input.onkeydown = function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                newOkBtn.click();
            }
        };
    } else {
        const result = prompt(message);
        if (callback) setTimeout(() => callback(result), 0);
    }
}

// Переопределяем tg.showConfirm
tg.showConfirm = function(message, callback) {
    const isRealTelegram = !!(
        window.Telegram?.WebApp?.platform && 
        window.Telegram.WebApp.platform !== 'unknown' &&
        window.Telegram.WebApp.initData
    );
    
    if (isRealTelegram && window.Telegram?.WebApp?.showConfirm) {
        try {
            window.Telegram.WebApp.showConfirm(message, callback);
            return;
        } catch (e) {
            console.warn('[CONFIRM] showConfirm failed:', e.message);
        }
    }
    
    // В браузере используем кастомное модальное окно
    showCustomConfirm(message, callback);
};

// Переопределяем глобальные alert, confirm, prompt для браузера
if (typeof window !== 'undefined') {
    window.alert = function(message) {
        const isRealTelegram = !!(
            window.Telegram?.WebApp?.platform && 
            window.Telegram.WebApp.platform !== 'unknown' &&
            window.Telegram.WebApp.initData
        );
        
        if (isRealTelegram) {
            return originalAlert.call(window, message);
        }
        
        showCustomAlert(message);
    };
    
    window.confirm = function(message) {
        const isRealTelegram = !!(
            window.Telegram?.WebApp?.platform && 
            window.Telegram.WebApp.platform !== 'unknown' &&
            window.Telegram.WebApp.initData
        );
        
        if (isRealTelegram) {
            return originalConfirm.call(window, message);
        }
        
        // Синхронный вызов для браузера (fallback на старый confirm)
        return originalConfirm.call(window, message);
    };
    
    window.prompt = function(message, defaultValue) {
        const isRealTelegram = !!(
            window.Telegram?.WebApp?.platform && 
            window.Telegram.WebApp.platform !== 'unknown' &&
            window.Telegram.WebApp.initData
        );
        
        if (isRealTelegram) {
            return originalPrompt.call(window, message, defaultValue);
        }
        
        // Синхронный вызов для браузера (fallback на старый prompt)
        return originalPrompt.call(window, message, defaultValue);
    };
}

// Helper: безопасная проверка поддержки CloudStorage с учетом версии WebApp
function supportsCloudStorage() {
    try {
        if (!tg || !tg.CloudStorage) return false;
        if (typeof tg.isVersionAtLeast === 'function') {
            return tg.isVersionAtLeast('6.9');
        }
        const v = parseFloat(tg.version || '0');
        return v >= 6.9;
    } catch (e) {
        return false;
    }
}

// Проверка, запущено ли приложение в Telegram
// Проверяем не только наличие объекта Telegram.WebApp, но и что есть платформа или initData
const isTelegramWebApp = !!(
    window.Telegram?.WebApp && 
    typeof window.Telegram.WebApp === 'object' &&
    typeof window.Telegram.WebApp.ready === 'function'
);
console.log('🔍 Проверка Telegram WebApp:');
console.log('  - window.Telegram:', !!window.Telegram);
console.log('  - window.Telegram.WebApp:', !!window.Telegram?.WebApp);
console.log('  - platform:', window.Telegram?.WebApp?.platform);
console.log('  - initData:', window.Telegram?.WebApp?.initData);
console.log('  - initDataUnsafe:', window.Telegram?.WebApp?.initDataUnsafe);
console.log('  - isTelegramWebApp:', isTelegramWebApp);

if (isTelegramWebApp) {
    console.log('✅ Запущено в Telegram WebApp, расширяем окно');
    tg.expand();
    tg.ready();
    
    // Блокировка вертикальных свайпов для предотвращения скриншотов
    tg.disableVerticalSwipes();
    console.log('🔒 Вертикальные свайпы отключены');
    
    // Запускаем проверку обновления лимитов в полночь
    startMidnightLimitCheck();
} else {
    console.log('⚠️ НЕ запущено в Telegram WebApp');
}

// Проверка поддержки emoji флагов
function checkEmojiFlagSupport() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 20;
    canvas.height = 20;
    ctx.fillText('🇷🇺', 0, 15);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    // Проверяем, есть ли цветные пиксели (флаг отрисовался)
    for (let i = 0; i < imageData.length; i += 4) {
        if (imageData[i] !== 0 || imageData[i + 1] !== 0 || imageData[i + 2] !== 0) {
            return true;
        }
    }
    return false;
}

// Применяем класс если флаги поддерживаются
if (checkEmojiFlagSupport()) {
    document.body.classList.add('emoji-flags-supported');
}

// Инициализация пользователя в БД (вызывается после проверки авторизации)
async function initializeUserInDatabase() {
    try {
        // Проверяем Telegram WebApp user
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        
        // Или проверяем сохранённую авторизацию через Login Widget
        const savedUser = localStorage.getItem('telegram_user');
        let userId = null;
        
        if (tgUser && tgUser.id) {
            userId = tgUser.id;
            console.log('🔑 Используем Telegram WebApp user (анонимно)');
        } else if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                if (userData?.id) {
                    userId = userData.id;
                    console.log('🔑 Используем сохранённый Login Widget user (анонимно)');
                }
            } catch (e) {
                console.warn('⚠️ Ошибка парсинга сохранённого пользователя:', e);
            }
        }
        
        if (userId) {
            // Не отправляем локальный никнейм на инициализации, чтобы не перезаписать серверный
            const nickname = null;
            console.log('📤 Инициализируем пользователя в БД (анонимно)');
            
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tgId: userId,
                    nickname: nickname
                })
            });
            
            const result = await response.json();
            if (result.success && result.userToken) {
                // Сохраняем токен в localStorage (вместо tg_id)
                localStorage.setItem('user_token', result.userToken);
                
                // Обновляем last_login_at для статистики активных пользователей
                try {
                    await fetch('/api/users', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tgId: userId })
                    });
                    console.log('✅ last_login_at обновлён');
                } catch (e) {
                    console.warn('⚠️ Не удалось обновить last_login_at:', e);
                }
                console.log('✅ Пользователь инициализирован, токен получен');
                
                // Всегда подтягиваем никнейм из БД и синхронизируем локально (сервер — источник истины)
                try {
                    const resp2 = await fetch(`/api/users?tgId=${userId}`);
                    const data2 = await resp2.json();
                    if (data2?.success && data2.displayNickname) {
                        // ВСЕГДА синхронизируем никнейм из БД
                        localStorage.setItem('userNickname', data2.displayNickname);
                        localStorage.setItem('user_nickname', data2.displayNickname);
                        console.log('🔄 Никнейм синхронизирован из БД:', data2.displayNickname);
                        // Обновим UI, если открыта страница редактирования
                        const currentNicknameDisplay = document.getElementById('currentNicknameDisplay');
                        if (currentNicknameDisplay) currentNicknameDisplay.textContent = data2.displayNickname;
                        const nicknameInputPage = document.getElementById('nicknameInputPage');
                        if (nicknameInputPage) nicknameInputPage.value = data2.displayNickname;
                    } else {
                        console.log('ℹ️ Никнейм не найден в БД');
                    }
                } catch (e) {
                    console.warn('Не удалось подтянуть никнейм из БД:', e);
                }
            } else {
                console.warn('⚠️ Ошибка инициализации пользователя:', result.error);
            }
        } else {
            console.log('ℹ️ Telegram ID не найден, пропускаем инициализацию users (веб-пользователь)');
        }
    } catch (error) {
        console.error('❌ Ошибка инициализации пользователя:', error);
    }
}

// Debug панель для отладки (показываем первые 5 секунд)
// Debug панель
let debugPanelVisible = false;
let debugPanel = null;

function toggleDebugPanel() {
    if (debugPanelVisible) {
        hideDebugPanel();
    } else {
        showDebugPanel();
    }
}

function showDebugPanel() {
    if (debugPanel && debugPanel.parentNode) {
        debugPanel.style.display = 'block';
        debugPanelVisible = true;
        return;
    }
    
    debugPanel = document.createElement('div');
    debugPanel.id = 'debugPanel';
    debugPanel.style.cssText = `
        position: fixed;
        bottom: 70px;
        right: 10px;
        width: 90%;
        max-width: 400px;
        background: rgba(0,0,0,0.95);
        color: #00ff00;
        padding: 15px;
        font-family: monospace;
        font-size: 11px;
        z-index: 100000;
        max-height: 400px;
        overflow-y: auto;
        border: 2px solid #00ff00;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
    `;
    
    updateDebugInfo();
    document.body.appendChild(debugPanel);
    debugPanelVisible = true;
}

function hideDebugPanel() {
    if (debugPanel) {
        debugPanel.style.display = 'none';
    }
    debugPanelVisible = false;
}

function updateDebugInfo() {
    if (!debugPanel) return;
    
    const currentUserId = getCurrentUserId();
    const userLocation = localStorage.getItem('userLocation');
    const parsedLocation = userLocation ? JSON.parse(userLocation) : null;
    
    const info = {
        '🔐 АВТОРИЗАЦИЯ': '━━━━━━━━━━━━━━━━',
        'isTelegramWebApp': isTelegramWebApp,
        'window.Telegram': !!window.Telegram,
        'tg exists': !!tg,
        'platform': tg?.platform || '❌ НЕТ',
        'initData length': tg?.initData?.length || 0,
        'user.id (initData)': tg?.initDataUnsafe?.user?.id || '❌ НЕТ',
        'getCurrentUserId()': currentUserId,
        'isAuthorized': !currentUserId.startsWith('web_') ? '✅ ДА' : '❌ НЕТ (веб ID)',
        
        '👤 ПРОФИЛЬ': '━━━━━━━━━━━━━━━━',
        'first_name': tg?.initDataUnsafe?.user?.first_name || '❌',
        'username': tg?.initDataUnsafe?.user?.username || '❌',
        'is_premium': tg?.initDataUnsafe?.user?.is_premium ? '⭐ ДА' : '❌',
        'nickname': document.getElementById('nicknameInput')?.value || localStorage.getItem('user_nickname') || '❌ НЕТ',
        
        '📍 ЛОКАЦИЯ': '━━━━━━━━━━━━━━━━',
        'country': parsedLocation?.country || '❌ НЕТ',
        'region': parsedLocation?.region || '❌ НЕТ',
        'city': parsedLocation?.city || '❌ НЕТ',
        'location saved': userLocation ? '✅ ЕСТЬ' : '❌ НЕТ',
        
        '💾 STORAGE': '━━━━━━━━━━━━━━━━',
        'localStorage user': localStorage.getItem('telegram_user') ? '✅ ЕСТЬ' : '❌ НЕТ',
        'localStorage nickname': localStorage.getItem('user_nickname') || '❌ НЕТ',
        'CloudStorage available': tg.CloudStorage ? '✅ ДА' : '❌ НЕТ',
        
        '🖥️ СОСТОЯНИЕ': '━━━━━━━━━━━━━━━━',
        'currentScreen': document.querySelector('.screen.active')?.id || 'unknown',
        'currentStep': currentStep + '/' + totalSteps,
        'window.currentAds': window.currentAds?.length || 0,
        
        '🔑 ДЕТАЛИ initDataUnsafe': '━━━━━━━━━━━━━━━━',
        'Full initDataUnsafe': JSON.stringify(tg?.initDataUnsafe || {}, null, 2)
    };
    
    debugPanel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #00ff00; padding-bottom: 10px;">
            <b style="color: #00ff00; font-size: 14px;">� DEBUG PANEL</b>
            <button onclick="updateDebugInfo()" style="background: #00ff00; color: #000; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 10px; font-weight: bold;">🔄 Обновить</button>
        </div>
        ${Object.entries(info).map(([k, v]) => {
            const isSection = v === '━━━━━━━━━━━━━━━━';
            if (isSection) {
                return `<div style="margin: 15px 0 8px 0; padding-top: 8px; border-top: 1px solid #00ff00;"><b style="color:#00ff00; font-size: 12px;">${k}</b></div>`;
            }
            const valueColor = v.toString().includes('✅') ? '#0f0' : v.toString().includes('❌') ? '#f80' : v.toString().includes('⭐') ? '#ff0' : '#fff';
            return `<div style="margin-bottom: 5px; padding-left: 8px;"><span style="color:#00aaff; font-size: 10px;">${k}:</span> <span style="color: ${valueColor}; font-size: 11px;">${v}</span></div>`;
        }).join('')}
    `;
}

// Создаем кнопку Debug
function createDebugButton() {
    const debugBtn = document.createElement('button');
    debugBtn.id = 'debugButton';
    debugBtn.innerHTML = '🐛';
    debugBtn.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #00ff00, #00aa00);
        border: 2px solid #00ff00;
        color: #000;
        font-size: 24px;
        cursor: pointer;
        z-index: 99999;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.6);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    debugBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 0 30px rgba(0, 255, 0, 0.8)';
    });
    
    debugBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.6)';
    });
    
    debugBtn.onclick = toggleDebugPanel;
    
    document.body.appendChild(debugBtn);
    console.log('✅ Debug кнопка создана');
}

// Утилита для генерации числового ID из строки
String.prototype.hashCode = function() {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
        const char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

// Данные формы
let formData = {};
let currentStep = 1;
const totalSteps = 8; // Шаги: пол, кого ищете, цель, возраст партнёра, ваш возраст, телосложение, ориентация, текст

// Инициализация приложения
// Функция инициализации, которая вызывается когда DOM готов
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
    
    // Для Android приложения - авторизация только через email (не показываем Telegram модалку)
    if (isAndroid) {
        console.log('📱 Android device detected, checking email auth...');
        const userToken = localStorage.getItem('user_token');
        const authMethod = localStorage.getItem('auth_method');
        
        if (!userToken) {
            console.log('⚠️ user_token not found - waiting for email auth in native app');
            // Ждём инжекцию auth данных от MainActivity
            // НЕ останавливаем инициализацию полностью - даём время на инжекцию
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
        
        // Закрываем WebApp - Android приложение перехватит это
        if (window.Telegram?.WebApp?.close) {
            window.Telegram.WebApp.close();
        }
        
        // Также отправляем postMessage для старых версий
        window.parent.postMessage({ type: 'auth_completed', authorized: true }, '*');
        
        return; // Останавливаем дальнейшую инициализацию
    }
    
    try {
        initializeTelegramWebApp();
        console.log('✅ Telegram WebApp инициализирован');
    } catch (e) {
        console.error('❌ Ошибка инициализации Telegram WebApp:', e);
    }
    
    // Debug кнопка отключена в продакшене
    // createDebugButton();
    
    // Задержка перед проверкой авторизации, чтобы Telegram успел передать initDataUnsafe
    setTimeout(() => {
        console.log('⏰ Начинаем проверку авторизации через 300ms');
        
        try {
            checkTelegramAuth(); // Проверка авторизации
            console.log('✅ checkTelegramAuth выполнен');
        } catch (e) {
            console.error('❌ Ошибка checkTelegramAuth:', e);
        }
        
        try {
            // ВАЖНО: сначала инициализируем пользователя чтобы создать user_token
            initializeUserInDatabase()
                .then(() => {
                    console.log('✅ initializeUserInDatabase завершён');
                    // Теперь обрабатываем реферальную ссылку (user_token уже будет доступен)
                    return handleReferralLink();
                })
                .then(() => {
                    console.log('✅ handleReferralLink завершён');
                    // Если реферал был сохранён как pending, попробуем завершить
                    return finalizePendingReferral();
                })
                .then(() => {
                    console.log('✅ finalizePendingReferral завершён');
                    console.log('🔄 Начинаем вызов initializeNickname...');
                    // После полной инициализации проверяем никнейм
                    return initializeNickname();
                })
                .then(() => {
                    console.log('✅ initializeNickname завершён');
                    // Скрываем функции для email пользователей
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
            updateChatBadge(); // Первое обновление счетчика
        } catch (e) {
            console.error('❌ Ошибка updateChatBadge:', e);
        }
        
        try {
            markMessagesAsDelivered(); // Помечаем сообщения как доставленные
        } catch (e) {
            console.error('❌ Ошибка markMessagesAsDelivered:', e);
        }
        
        try {
            updateLogoutButtonVisibility(); // Обновление кнопки выхода
        } catch (e) {
            console.error('❌ Ошибка updateLogoutButtonVisibility:', e);
        }
        
        try {
            // Принудительно сбрасываем локальный кэш тарифов перед первой загрузкой, чтобы сразу увидеть обновления
            const cachedKeyPrefix = 'premium_status_';
            const userTokenForPurge = localStorage.getItem('user_token');
            if (userTokenForPurge) {
                try {
                    localStorage.removeItem(`${cachedKeyPrefix}${userTokenForPurge}`);
                    localStorage.removeItem(`premium_version_${userTokenForPurge}`);
                    console.log('🧹 Сброшен локальный кэш тарифов перед начальной загрузкой');
                } catch (clearErr) {
                    console.warn('⚠️ Не удалось очистить кэш тарифов:', clearErr);
                }
            }
            loadPremiumStatus(); // Загружаем Premium статус при старте (после очистки)
        } catch (e) {
            console.error('❌ Ошибка loadPremiumStatus:', e);
        }
        
        try {
            loadWorldChatPreview(); // Загружаем превью последнего сообщения для кнопки
            // Обновляем превью каждые 10 секунд
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
    
    // Периодическое обновление счетчика новых запросов (каждые 10 секунд)
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
    }, 5 * 60 * 1000); // 5 минут
    
    // Добавляем обработчик видимости страницы
    // Если пользователь вернулся после сканирования QR
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log('📱 Страница стала видимой, повторная проверка авторизации');
            // Проверяем авторизацию еще раз
            setTimeout(() => {
                try {
                    checkTelegramAuth();
                    updateChatBadge(); // Обновляем счетчик при возврате
                    loadPremiumStatus(); // Обновляем Premium статус
                } catch (e) {
                    console.error('❌ Ошибка при повторной проверке:', e);
                }
            }, 500);
        }
    });
    
    // Обработчик сообщений от всплывающего окна авторизации
    window.addEventListener('message', function(event) {
        // Проверяем источник сообщения
        if (event.origin !== window.location.origin) {
            return;
        }
        
        // Обработка успешной авторизации через Login Widget
        if (event.data && event.data.type === 'telegram_auth' && event.data.user) {
            console.log('✅ Получены данные авторизации от всплывающего окна:', event.data.user);
            
            // Сохраняем данные
            localStorage.setItem('telegram_user', JSON.stringify(event.data.user));
            localStorage.setItem('telegram_auth_time', Date.now().toString());
            
            // Закрываем модальное окно
            const modal = document.getElementById('telegramAuthModal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Показываем уведомление
            tg.showAlert(`✅ Авторизация успешна!\n\nДобро пожаловать, ${event.data.user.first_name}!`, () => {
                // Обновляем кнопку выхода
                updateLogoutButtonVisibility();
                
                // Перезагружаем страницу
                location.reload();
            });
        }
    });
}

// ============= АВТОСКРЫТИЕ СКРОЛЛБАРОВ =============
function setupAutoHideScrollbars() {
    const scrollTimeouts = new WeakMap();
    
    function attachScrollHandler(element) {
        // Проверяем что элемент может скроллиться
        if (element.scrollHeight <= element.clientHeight) return;
        
        element.addEventListener('scroll', function() {
            // Добавляем класс при скролле
            this.classList.add('scrolling');
            
            // Очищаем предыдущий таймаут
            const existingTimeout = scrollTimeouts.get(this);
            if (existingTimeout) clearTimeout(existingTimeout);
            
            // Убираем класс через 2 секунды после остановки скролла
            const newTimeout = setTimeout(() => {
                this.classList.remove('scrolling');
            }, 2000);
            
            scrollTimeouts.set(this, newTimeout);
        }, { passive: true });
    }
    
    // Функция для проверки нужен ли скролл
    function checkScrollNeed(element) {
        // Исключаем карточки анкет и модальные окна с анкетами
        if (element.classList.contains('ad-card') || 
            element.closest('.ad-card') ||
            element.classList.contains('modal-ad-card')) {
            return;
        }
        
        if (element.scrollHeight > element.clientHeight) {
            element.style.overflowY = 'auto';
        } else {
            element.style.overflowY = 'visible';
        }
    }
    
    // Добавляем обработчики на все скроллируемые элементы (исключая карточки анкет)
    const scrollableElements = document.querySelectorAll('.screen, .modal-body:not(.ad-card), .messages-list, .chat-messages');
    scrollableElements.forEach(element => {
        if (!element.classList.contains('ad-card') && !element.closest('.ad-card')) {
            attachScrollHandler(element);
            checkScrollNeed(element);
        }
    });
    
    // Наблюдаем за новыми элементами и изменением размеров
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && 
                    !node.classList.contains('ad-card') && 
                    !node.closest('.ad-card')) {
                    attachScrollHandler(node);
                    checkScrollNeed(node);
                    node.querySelectorAll('.screen, .modal-body:not(.ad-card), .messages-list, .chat-messages').forEach(el => {
                        if (!el.classList.contains('ad-card') && !el.closest('.ad-card')) {
                            attachScrollHandler(el);
                            checkScrollNeed(el);
                        }
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Пересчитываем при изменении размера окна
    window.addEventListener('resize', () => {
        scrollableElements.forEach(checkScrollNeed);
    });
}

// Проверяем если пришли из Telegram после авторизации
function checkAndHandleAuthReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const isAuthorized = urlParams.get('authorized') === 'true';
    const isFromApp = urlParams.get('from_app') === 'true';
    const userId = urlParams.get('user_id');
    
    if (isAuthorized && userId) {
        console.log('✅ Возврат после авторизации, user_id:', userId);
        
        // Закрываем модальное окно авторизации
        const authModal = document.getElementById('telegramAuthModal');
        if (authModal) {
            authModal.style.display = 'none';
            console.log('✅ Модальное окно авторизации закрыто');
        }
        
        // Если это из Android приложения
        if (isFromApp && window.Telegram?.WebApp) {
            console.log('📱 Закрываем Telegram WebApp для возврата в Android');
            
            // Показываем уведомление перед закрытием
            setTimeout(() => {
                window.Telegram.WebApp.close();
            }, 500);
        }
        
        // Очищаем URL от параметров авторизации
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Перезагружаем данные пользователя
        setTimeout(() => {
            window.location.reload();
        }, isFromApp ? 1000 : 500);
    }
}

// Проверяем готовность DOM и запускаем инициализацию
if (document.readyState === 'loading') {
    console.log('📄 DOM загружается, ждем DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', () => {
        checkAndHandleAuthReturn();
        initializeApp();
        setupAutoHideScrollbars();
    });
} else {
    console.log('📄 DOM уже загружен, запускаем инициализацию немедленно');
    checkAndHandleAuthReturn();
    initializeApp();
    setupAutoHideScrollbars();
}

// Функция для отслеживания визита
async function trackPageVisit(page = 'home') {
    try {
        const userId = tg?.initDataUnsafe?.user?.id || localStorage.getItem('user_id');
        const userToken = localStorage.getItem('user_token');
        const userLocation = getUserLocation();
        
        await fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId ? parseInt(userId) : null,
                userToken: userToken || null,
                page: page,
                country: userLocation?.country || null,
                city: userLocation?.city || null
            })
        });
    } catch (error) {
        console.error('Ошибка отслеживания визита:', error);
    }
}

// Функция для загрузки статистики (переменные объявлены в начале файла)
async function loadSiteStats() {
    try {
        // Проверяем is_admin только один раз при первой загрузке
        if (!adminCheckCompleted) {
            // Получаем userId так же как в initializeUserInDatabase
            let userId = tg?.initDataUnsafe?.user?.id;
            if (!userId) {
                const savedUser = localStorage.getItem('telegram_user');
                if (savedUser) {
                    try {
                        const userData = JSON.parse(savedUser);
                        userId = userData?.id;
                    } catch (e) {
                        console.warn('[ADMIN STATS] Ошибка парсинга telegram_user:', e);
                    }
                }
            }
            
            // Проверяем по user_token если нет Telegram ID (для email-пользователей из Android)
            const userToken = localStorage.getItem('user_token');
            console.log('[ADMIN STATS] Проверка админа для user_id:', userId, 'user_token:', userToken ? 'есть' : 'нет');
            
            if (userId) {
                try {
                    const userStatusResponse = await fetch(`/api/users?action=check-admin&user_id=${userId}`);
                    const userStatusData = await userStatusResponse.json();
                    console.log('[ADMIN STATS] Ответ API (по user_id):', userStatusData);
                    isAdminUser = userStatusData.is_admin === true;
                    console.log('[ADMIN STATS] isAdminUser:', isAdminUser);
                } catch (err) {
                    console.error('[ADMIN STATS] Ошибка проверки статуса админа:', err);
                }
            } else if (userToken) {
                // Проверяем по user_token для email-пользователей
                try {
                    const userStatusResponse = await fetch(`/api/users?action=check-admin&userToken=${userToken}`);
                    const userStatusData = await userStatusResponse.json();
                    console.log('[ADMIN STATS] Ответ API (по userToken):', userStatusData);
                    isAdminUser = userStatusData.is_admin === true;
                    console.log('[ADMIN STATS] isAdminUser:', isAdminUser);
                } catch (err) {
                    console.error('[ADMIN STATS] Ошибка проверки статуса админа по токену:', err);
                }
            } else {
                console.warn('[ADMIN STATS] Ни userId, ни userToken не найдены');
            }
            
            adminCheckCompleted = true;
            
            // Скрываем/показываем блок статистики
            const adminStatsEl = document.getElementById('adminStats');
            console.log('[ADMIN STATS] Элемент adminStats найден:', !!adminStatsEl);
            if (adminStatsEl) {
                adminStatsEl.style.display = isAdminUser ? 'flex' : 'none';
                console.log('[ADMIN STATS] Установлен display:', adminStatsEl.style.display);
            }

            const adminMenuItem = document.getElementById('adminMenuItem');
            if (adminMenuItem) {
                adminMenuItem.style.display = isAdminUser ? 'flex' : 'none';
            }
        }
        
        // Загружаем данные только для админа
        if (!isAdminUser) return;
        
        const response = await fetch('/api/analytics?metric=all');
        const data = await response.json();
        
        console.log('[STATS] API Response:', data);
        
        // Обновляем счетчики на странице если они есть
        const totalVisitsEl = document.getElementById('totalVisits');
        const onlineNowEl = document.getElementById('onlineNow');
        const totalAdsEl = document.getElementById('totalAds');
        const blockedUsersEl = document.getElementById('blockedUsersCount');
        
        console.log('[STATS] Found elements:', {
            totalVisitsEl: !!totalVisitsEl,
            onlineNowEl: !!onlineNowEl,
            totalAdsEl: !!totalAdsEl,
            blockedUsersEl: !!blockedUsersEl
        });
        
        // 👥 - Общее количество уникальных пользователей за все время
        if (totalVisitsEl && data.total_unique_users !== undefined) {
            const formatted = formatNumber(data.total_unique_users);
            totalVisitsEl.textContent = formatted;
            console.log('[STATS] Updated totalVisits:', data.total_unique_users, '->', formatted);
        } else {
            console.warn('[STATS] Cannot update totalVisits:', { el: !!totalVisitsEl, value: data.total_unique_users });
        }
        
        // 🔥 - Уникальные пользователи за последние 24 часа
        if (onlineNowEl && data.unique_last_24h !== undefined) {
            const formatted = formatNumber(data.unique_last_24h);
            onlineNowEl.textContent = formatted;
            console.log('[STATS] Updated onlineNow:', data.unique_last_24h, '->', formatted);
        } else {
            console.warn('[STATS] Cannot update onlineNow:', { el: !!onlineNowEl, value: data.unique_last_24h });
        }
        
        // 📢 - Общее количество анкет
        if (totalAdsEl && data.total_ads !== undefined) {
            const formatted = formatNumber(data.total_ads);
            totalAdsEl.textContent = formatted;
            console.log('[STATS] Updated totalAds:', data.total_ads, '->', formatted);
        } else {
            console.warn('[STATS] Cannot update totalAds:', { el: !!totalAdsEl, value: data.total_ads });
        }
        
        // 🚫 - Заблокировали бота
        if (blockedUsersEl && data.blocked_users !== undefined) {
            const formatted = formatNumber(data.blocked_users);
            blockedUsersEl.textContent = formatted;
            console.log('[STATS] Updated blockedUsers:', data.blocked_users, '->', formatted);
        } else {
            console.warn('[STATS] Cannot update blockedUsers:', { el: !!blockedUsersEl, value: data.blocked_users });
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Запускаем автоматическое обновление статистики каждые 10 секунд для админа
function startStatsAutoUpdate() {
    // Первая загрузка сразу
    loadSiteStats();
    
    // Обновляем каждые 10 секунд
    setInterval(() => {
        if (isAdminUser) {
            loadSiteStats();
        }
    }, 10000);
}

// Форматирование чисел (1234 -> 1.2K)
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function initializeTelegramWebApp() {
    console.log('🚀 [INIT] initializeTelegramWebApp started');
    console.log('🚀 [INIT] Telegram WebApp data:', {
        platform: tg?.platform,
        version: tg?.version,
        initData: !!tg?.initData,
        initDataUnsafe: tg?.initDataUnsafe,
        start_param: tg?.initDataUnsafe?.start_param,
        user: tg?.initDataUnsafe?.user
    });
    
    // Отслеживаем визит при загрузке
    trackPageVisit('home');
    
    // Запускаем автоматическое обновление статистики
    startStatsAutoUpdate();
    
    // Настройка темы
    tg.setHeaderColor('#0a0a0f');
    tg.setBackgroundColor('#0a0a0f');
    
    // Настройка главной кнопки
    tg.MainButton.setText('Главное меню');
    tg.MainButton.onClick(() => showMainMenu());
    
    // Настройка кнопки назад
    tg.BackButton.onClick(() => handleBackButton());
    
    // Перехват физической кнопки назад на Android через popstate
    window.addEventListener('popstate', (event) => {
        event.preventDefault();
        handleBackButton();
        // Возвращаем состояние чтобы не было двойного срабатывания
        window.history.pushState(null, '', window.location.href);
    });
    
    // Добавляем начальное состояние в историю
    window.history.pushState(null, '', window.location.href);
    
    // Показываем предупреждение если не в Telegram
    if (!isTelegramWebApp) {
        console.warn('⚠️ Приложение запущено вне Telegram WebApp. Некоторые функции недоступны.');
        
        // Показываем уведомление через 2 секунды
        setTimeout(() => {
            const warning = document.createElement('div');
            warning.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 153, 0, 0.95);
                color: #000;
                padding: 15px 25px;
                border-radius: 10px;
                z-index: 10000;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(255, 153, 0, 0.3);
                max-width: 90%;
                text-align: center;
            `;
            warning.innerHTML = '⚠️ Для полного функционала откройте через Telegram бота<br><small>Функция приватных чатов будет ограничена</small>';
            document.body.appendChild(warning);
            
            // Удаляем через 7 секунд
            setTimeout(() => warning.remove(), 7000);
        }, 2000);
    }
    
    console.log('Telegram Web App initialized');
}

// Проверка авторизации через Telegram
function checkTelegramAuth() {
    console.log('🔐 Проверка авторизации...');
    console.log('  📊 Детальная диагностика:');
    console.log('    - isTelegramWebApp:', isTelegramWebApp);
    console.log('    - tg:', tg);
    console.log('    - tg.initDataUnsafe:', tg.initDataUnsafe);
    console.log('    - tg.initDataUnsafe?.user:', tg.initDataUnsafe?.user);
    console.log('    - tg.initDataUnsafe?.user?.id:', tg.initDataUnsafe?.user?.id);
    
    // Проверяем если это Android устройство - используем email авторизацию
    const isAndroid = navigator.userAgent.includes('Android');
    const isWebView = navigator.userAgent.includes('wv') || navigator.userAgent.includes('WebView');
    const hasAndroidInterface = typeof AndroidAuth !== 'undefined';
    const isAndroidWebView = isAndroid && (isWebView || hasAndroidInterface);
    
    console.log('📱 [AUTH CHECK] Android detection:', {
        isAndroid,
        isWebView,
        hasAndroidInterface,
        isAndroidWebView
    });
    
    if (isAndroid) {
        console.log('📱 Android device - email auth only (no Telegram modal)');
        // Проверяем сохранённый user_token для email авторизации
        const userToken = localStorage.getItem('user_token');
        const authMethod = localStorage.getItem('auth_method');
        
        if (userToken) {
            console.log('✅ user_token found, user authenticated via email');
            console.log('   Auth method:', authMethod);
            return true; // Пользователь уже авторизован
        }
        
        console.log('⚠️ user_token not found - waiting for native app auth...');
        return false; // Требуется авторизация в EmailAuthActivity
    }
    
    // Если запущено через Telegram WebApp, авторизация автоматическая
    if (isTelegramWebApp && tg.initDataUnsafe?.user?.id) {
        const userData = {
            id: tg.initDataUnsafe.user.id,
            first_name: tg.initDataUnsafe.user.first_name,
            last_name: tg.initDataUnsafe.user.last_name,
            username: tg.initDataUnsafe.user.username,
            photo_url: tg.initDataUnsafe.user.photo_url
        };
        
        console.log('✅ Данные пользователя получены');
        
        // Проверяем, была ли уже авторизация
        const savedUser = localStorage.getItem('telegram_user');
        const isNewAuth = !savedUser || JSON.stringify(userData) !== savedUser;
        
        // Сохраняем в localStorage
        localStorage.setItem('telegram_user', JSON.stringify(userData));
        localStorage.setItem('telegram_auth_time', Date.now().toString());
        localStorage.setItem('user_id', userData.id.toString());
        console.log('✅ Авторизован через Telegram WebApp, user_id:', userData.id);
        

        
        // Закрываем все модальные окна авторизации
        const modal = document.getElementById('telegramAuthModal');
        const emailModal = document.getElementById('emailAuthModal');
        
        if (modal) {
            modal.style.display = 'none';
            console.log('✅ Модальное окно Telegram авторизации закрыто');
        }
        
        if (emailModal) {
            emailModal.style.display = 'none';
            console.log('✅ Модальное окно Email авторизации закрыто');
        }
        
        // Если это новая авторизация (вернулись из бота), показываем уведомление
        if (isNewAuth) {
            // Даем время модальному окну закрыться
            setTimeout(() => {
                tg.showAlert(`✅ Добро пожаловать, ${userData.first_name}!\n\nТеперь вы можете пользоваться всеми функциями приложения.`);
            }, 300);
        }
        
        return true;
    }
    
    console.log('⚠️ Telegram авторизация недоступна');
    console.log('  - Причина: isTelegramWebApp=' + isTelegramWebApp + ', user=' + (tg.initDataUnsafe?.user ? 'present' : 'null'));
    
    // Проверяем email авторизацию (приоритетнее)
    const userToken = localStorage.getItem('user_token');
    const authMethod = localStorage.getItem('auth_method');
    
    if (userToken && authMethod === 'email') {
        console.log('✅ Найдена email авторизация, user_token:', userToken.substring(0, 16) + '...');
        
        // Закрываем модальное окно если оно было открыто
        const telegramModal = document.getElementById('telegramAuthModal');
        if (telegramModal) {
            telegramModal.style.display = 'none';
            console.log('✅ Модальное окно Telegram авторизации закрыто (есть email auth)');
        }
        
        const emailModal = document.getElementById('emailAuthModal');
        if (emailModal) {
            emailModal.style.display = 'none';
            console.log('✅ Модальное окно Email авторизации закрыто');
        }
        
        return true;
    }
    
    // Проверяем сохранённые данные Telegram из предыдущей сессии
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            console.log('✅ Найдена сохранённая Telegram авторизация');
            // Проверяем, не истекла ли авторизация (опционально)
            const authTime = localStorage.getItem('telegram_auth_time');
            const now = Date.now();
            // Авторизация действительна 30 дней
            if (authTime && (now - parseInt(authTime)) < 30 * 24 * 60 * 60 * 1000) {
                console.log('✅ Telegram авторизация действительна');
                
                // Восстанавливаем user_id если его нет
                if (!localStorage.getItem('user_id') && userData.id) {
                    localStorage.setItem('user_id', userData.id.toString());
                    console.log('✅ Восстановлен user_id:', userData.id);
                }
                
                // Закрываем все модальные окна авторизации
                const modal = document.getElementById('telegramAuthModal');
                const emailModal = document.getElementById('emailAuthModal');
                
                if (modal) {
                    modal.style.display = 'none';
                    console.log('✅ Модальное окно Telegram авторизации закрыто (сохранённая сессия)');
                }
                
                if (emailModal) {
                    emailModal.style.display = 'none';
                    console.log('✅ Модальное окно Email авторизации закрыто (сохранённая сессия)');
                }
                
                return true;
            } else {
                console.log('⚠️ Telegram авторизация истекла');
            }
        } catch (e) {
            console.error('Ошибка парсинга данных пользователя:', e);
            localStorage.removeItem('telegram_user');
        }
    }
    
    // Если нет авторизации
    // Для Android НЕ показываем модальное окно (авторизация в native app)
    if (isAndroid) {
        console.log('📱 Android: waiting for email auth in native app, NOT showing Telegram modal');
        return false;
    }
    
    // Для браузера - показываем модальное окно авторизации
    console.log('❌ Пользователь не авторизован, показываем модальное окно');
    
    // Проверяем параметр auth в URL (из главной страницы)
    const urlParams = new URLSearchParams(window.location.search);
    const authType = urlParams.get('auth');
    
    // Задержка для уверенности что DOM загружен
    setTimeout(() => {
        if (authType === 'email') {
            console.log('📧 Показываем форму email авторизации');
            showEmailAuthModal();
        } else if (isTelegramWebApp && tg.initDataUnsafe?.user?.id) {
            // Если это Telegram WebApp с авторизованным пользователем - сразу показываем главное меню БЕЗ модального окна
            console.log('✈️ Telegram WebApp с авторизацией - показываем главное меню сразу');
            showMainMenu();
        } else {
            // По умолчанию - Telegram
            console.log('✈️ Показываем форму Telegram авторизации');
            showTelegramAuthModal();
            
            // Дополнительная проверка через 1 секунду ТОЛЬКО для Telegram
            setTimeout(() => {
                const modal = document.getElementById('telegramAuthModal');
                if (modal) {
                    const computedStyle = window.getComputedStyle(modal);
                    console.log('🔍 Проверка видимости модального окна:');
                    console.log('  - display:', computedStyle.display);
                    console.log('  - visibility:', computedStyle.visibility);
                    console.log('  - opacity:', computedStyle.opacity);
                    console.log('  - zIndex:', computedStyle.zIndex);
                    
                    // Если модальное окно скрыто - принудительно показываем
                    if (computedStyle.display === 'none') {
                        console.warn('⚠️ Модальное окно скрыто! Принудительно показываем...');
                        modal.style.display = 'flex';
                    }
                } else {
                    console.error('❌ Модальное окно не найдено в DOM!');
                }
            }, 1000);
        }
    }, 100);
    
    return false;
}

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С НИКНЕЙМОМ =====

// Инициализация никнейма при загрузке приложения
async function initializeNickname() {
    console.log('🎭 Инициализация никнейма...');
    
    // Проверяем сохранённый никнейм в localStorage
    const savedNickname = localStorage.getItem('user_nickname') || localStorage.getItem('userNickname');
    console.log('🔍 [DEBUG] savedNickname:', savedNickname);
    
    // Проверяем реальный никнейм в БД через API
    const tgId = tg?.initDataUnsafe?.user?.id;
    const userToken = localStorage.getItem('user_token');
    console.log('🔍 [DEBUG] tgId:', tgId, 'userToken:', userToken ? 'есть' : 'нет');
    let realNickname = null;
    
    // Если есть tgId или userToken - проверяем никнейм в БД
    if (tgId || userToken) {
        try {
            let url = '/api/users?';
            if (tgId) {
                url += `tgId=${tgId}`;
                console.log('🔍 [DEBUG] Ищем по tgId:', tgId);
            } else if (userToken) {
                url += `userToken=${userToken}`;
                console.log('🔍 [DEBUG] Ищем по userToken:', userToken.substring(0, 16) + '...');
            }
            
            console.log('🔍 [DEBUG] Полный URL запроса:', url);
            const response = await fetch(url);
            console.log('🔍 [DEBUG] Response status:', response.status);
            
            // Если пользователь не найден в БД - очищаем localStorage и редирект
            if (response.status === 404) {
                console.error('❌ Пользователь не найден в БД, очищаем localStorage');
                localStorage.clear();
                alert('Ваша сессия устарела. Пожалуйста, авторизуйтесь заново.');
                window.location.href = '/';
                return;
            }
            
            const result = await response.json();
            console.log('🔍 [DEBUG] Полный ответ API:', JSON.stringify(result));
            
            if (result.success && result.displayNickname) {
                realNickname = result.displayNickname;
                // Синхронизируем с localStorage
                localStorage.setItem('user_nickname', realNickname);
                console.log('✅ Загружен никнейм из БД:', realNickname);
            } else {
                console.warn('⚠️ [DEBUG] API не вернул никнейм. success:', result.success, 'displayNickname:', result.displayNickname);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки никнейма из БД:', error);
        }
    } else {
        console.warn('⚠️ [DEBUG] Нет ни tgId, ни userToken для проверки никнейма');
    }
    
    // Если никнейма нет ни в БД, ни в localStorage - показываем модальное окно
    console.log('🔍 [DEBUG] Проверка условия: realNickname=', realNickname, 'savedNickname=', savedNickname);
    if (!realNickname && (!savedNickname || savedNickname === 'Аноним')) {
        console.log('⚠️ Никнейм не установлен - показываем обязательное модальное окно');
        showRequiredNicknameModal();
    } else {
        console.log('✅ Никнейм уже установлен:', realNickname || savedNickname);
    }
}

// Показать обязательное модальное окно выбора никнейма
async function showRequiredNicknameModal() {
    const modal = document.getElementById('requiredNicknameModal');
    const input = document.getElementById('requiredNicknameInput');
    const errorDiv = document.getElementById('nicknameError');
    const termsSection = document.getElementById('termsAgreementSection');
    
    // Проверяем, нужно ли показывать согласие с правилами
    const userToken = localStorage.getItem('user_token');
    const tgId = tg?.initDataUnsafe?.user?.id;
    
    let needsTermsAgreement = false;
    
    // Если нет ни userToken, ни tgId - не делаем запрос (пользователь еще не инициализирован)
    if (userToken || tgId) {
        try {
            // Проверяем через API, согласился ли пользователь с правилами
            const params = new URLSearchParams();
            if (userToken) params.append('userToken', userToken);
            if (tgId) params.append('tgId', tgId);
            
            const response = await fetch(`/api/onboarding?${params.toString()}`, {
                method: 'GET'
            });
            
            const result = await response.json();
            needsTermsAgreement = !result.agreed; // Если ещё не согласился - показываем
            
            console.log('📋 Проверка согласия с правилами:', needsTermsAgreement ? 'Нужно показать' : 'Уже принято');
        } catch (error) {
            console.error('Ошибка проверки согласия:', error);
            needsTermsAgreement = true; // На всякий случай показываем
        }
    } else {
        console.log('⚠️ userToken и tgId не найдены, пропускаем проверку согласия');
        needsTermsAgreement = true; // Для новых пользователей показываем
    }
    
    if (modal) {
        modal.style.display = 'flex';
        errorDiv.style.display = 'none';
        
        // Показываем/скрываем секцию с галочкой правил
        if (termsSection) {
            termsSection.style.display = needsTermsAgreement ? 'block' : 'none';
        }
        
        // Фокус на input после анимации
        setTimeout(() => {
            if (input) input.focus();
        }, 300);
        
        // Блокируем закрытие модалки (нельзя закрыть пока не выберет никнейм)
        modal.onclick = (e) => {
            // Не даём закрыть по клику на overlay
            e.stopPropagation();
        };
    }
}

// Сохранить никнейм из обязательного модального окна
async function saveRequiredNickname() {
    window.logUserAction('saveNickname', { step: 'started' });
    
    const input = document.getElementById('requiredNicknameInput');
    const errorDiv = document.getElementById('nicknameError');
    const errorText = errorDiv.querySelector('p');
    const termsSection = document.getElementById('termsAgreementSection');
    const termsCheckbox = document.getElementById('termsCheckbox');
    
    let nickname = input.value.trim();
    
    if (!nickname) {
        errorDiv.style.display = 'block';
        errorText.textContent = '❌ Никнейм не может быть пустым';
        return;
    }
    
    if (nickname === 'Аноним') {
        errorDiv.style.display = 'block';
        errorText.textContent = '❌ Выберите уникальный никнейм (не "Аноним")';
        return;
    }
    
    // Проверяем галочку правил, если секция видима
    if (termsSection && termsSection.style.display !== 'none') {
        if (!termsCheckbox.checked) {
            errorDiv.style.display = 'block';
            errorText.textContent = '❌ Необходимо принять правила использования';
            return;
        }
    }
    
    // Получаем tgId
    let tgId = null;
    if (isTelegramWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        tgId = Number(window.Telegram.WebApp.initDataUnsafe.user.id);
    } else {
        const savedUserJson = localStorage.getItem('telegram_user');
        if (savedUserJson) {
            try {
                const u = JSON.parse(savedUserJson);
                if (u?.id) tgId = Number(u.id);
            } catch (e) {}
        }
    }
    
    if (!tgId) {
        // Для Android WebView требуется авторизация
        // Проверяем более надёжно: Android в UserAgent или наличие специфичных признаков
        const userAgent = navigator.userAgent;
        const isAndroid = userAgent.includes('Android');
        const isWebView = userAgent.includes('wv') || userAgent.includes('WebView');
        const hasAndroidInterface = typeof AndroidAuth !== 'undefined';
        const isAndroidWebView = isAndroid && (isWebView || hasAndroidInterface);
        
        console.log('[AUTH CHECK] isAndroid:', isAndroid, 'isWebView:', isWebView, 'hasAndroidInterface:', hasAndroidInterface);
        
        if (isAndroidWebView) {
            // Проверяем user_token (универсальный идентификатор)
            let userToken = localStorage.getItem('user_token');
            
            // Если нет в localStorage, пробуем получить из Android interface
            if (!userToken && typeof AndroidAuth !== 'undefined' && AndroidAuth.getUserToken) {
                try {
                    userToken = AndroidAuth.getUserToken();
                    if (userToken) {
                        localStorage.setItem('user_token', userToken);
                        localStorage.setItem('auth_method', 'email');
                        console.log('✅ Got user_token from AndroidAuth interface');
                    }
                } catch (e) {
                    console.warn('⚠️ Cannot get user_token from AndroidAuth:', e);
                }
            }
            
            if (!userToken) {
                // Даём время на инжекцию из onPageFinished
                console.log('⏳ Waiting for auth data injection...');
                setTimeout(() => {
                    const retryToken = localStorage.getItem('user_token');
                    if (!retryToken) {
                        errorDiv.style.display = 'block';
                        errorText.textContent = '❌ Требуется авторизация';
                        console.log('⚠️ Android WebView: user_token не найден после ожидания');
                    } else {
                        console.log('✅ Auth data loaded after wait, reloading...');
                        window.location.reload();
                    }
                }, 1000); // Увеличил до 1 секунды
                return;
            }
            
            // Используем user_token для работы приложения
            console.log('📱 Android WebView авторизован. user_token:', userToken.substring(0, 16) + '...');
            
            // Для совместимости устанавливаем временный tgId (API использует user_token)
            tgId = 99999999; // Фиктивный ID, API будет использовать user_token
        } else if (isAndroid) {
            // Это Android - возможно наше приложение, но интерфейс еще не зарегистрирован
            console.log('⏳ Android detected, checking for user_token...');
            
            // Сначала проверяем localStorage
            const existingToken = localStorage.getItem('user_token');
            if (existingToken) {
                console.log('✅ Found existing user_token in localStorage');
                tgId = 99999999; // Используем фиктивный ID
            } else {
                // Если нет токена - ждём дольше и проверяем снова
                console.log('⏳ No token yet, waiting for MainActivity injection...');
                setTimeout(() => {
                    const retryToken = localStorage.getItem('user_token');
                    if (retryToken) {
                        console.log('✅ Auth data found after wait, reloading...');
                        window.location.reload();
                    } else {
                        // Всё еще нет токена - показываем инструкцию для Android
                        errorDiv.style.display = 'block';
                        errorText.textContent = '❌ Пожалуйста, авторизуйтесь через email в приложении';
                        console.error('❌ Android device but no user_token found');
                    }
                }, 2000); // Увеличено до 2 секунд
                return;
            }
        } else {
            // Проверяем email авторизацию
            const userToken = localStorage.getItem('user_token');
            if (userToken) {
                console.log('✅ Email user detected, using userToken only');
                tgId = null; // Для email пользователей tgId не нужен
            } else {
                // Нет ни Telegram, ни email авторизации
                errorDiv.style.display = 'block';
                errorText.textContent = '❌ Не удалось получить ваш Telegram ID';
                return;
            }
        }
    }
    
    try {
        // Вызываем API для сохранения никнейма
        const userToken = localStorage.getItem('user_token');
        const payload = { nickname: nickname };
        
        // Для email пользователей отправляем только userToken
        if (userToken && !tgId) {
            payload.userToken = userToken;
            console.log('📧 Email user: sending userToken only');
        } else if (tgId) {
            // Для Telegram пользователей отправляем tgId
            payload.tgId = tgId;
            if (userToken) {
                payload.userToken = userToken; // Android может иметь оба
            }
            console.log('✈️ Telegram user: sending tgId');
        }
        
        const response = await fetch('/api/nickname', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (!result.success) {
            let errorMessage = result.error || 'Неизвестная ошибка';
            
            if (result.code === 'NICKNAME_TAKEN') {
                errorMessage = '❌ Этот никнейм уже занят. Выберите другой.';
            } else if (result.code === 'INVALID_NICKNAME') {
                errorMessage = '❌ Никнейм может содержать только буквы (рус/eng), цифры, _ и -';
            } else if (result.error === 'USER_NOT_FOUND' || result.needReauth) {
                // Пользователь не найден в БД - нужна повторная авторизация
                errorMessage = '❌ Ошибка авторизации. Пожалуйста, войдите заново.';
                errorDiv.style.display = 'block';
                errorText.textContent = errorMessage;
                
                // Показываем диалог и предлагаем выйти
                if (tg && tg.showConfirm) {
                    tg.showConfirm('Произошла ошибка при регистрации. Необходимо выйти из аккаунта и войти заново. Выйти сейчас?', (confirmed) => {
                        if (confirmed) {
                            handleLogout();
                        }
                    });
                } else if (confirm('Произошла ошибка при регистрации. Необходимо выйти из аккаунта и войти заново. Выйти сейчас?')) {
                    handleLogout();
                }
                return;
            }
            
            errorDiv.style.display = 'block';
            errorText.textContent = errorMessage;
            return;
        }
        
        // Успешно сохранено
        localStorage.setItem('user_nickname', nickname);
        localStorage.setItem('userNickname', nickname);
        console.log('✅ Никнейм успешно сохранён:', nickname);
        
        // Если нужно было принять правила - сохраняем согласие
        const termsSection = document.getElementById('termsAgreementSection');
        if (termsSection && termsSection.style.display !== 'none') {
            try {
                const userToken = localStorage.getItem('user_token');
                const response = await fetch('/api/onboarding', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userToken: userToken,
                        tgId: tgId,
                        agreed: true
                    })
                });
                const termsResult = await response.json();
                console.log('✅ Согласие с правилами сохранено:', termsResult);
            } catch (termsError) {
                console.error('⚠️ Ошибка при сохранении согласия:', termsError);
                // Не критично, продолжаем
            }
        }
        
        // Закрываем модальное окно
        const modal = document.getElementById('requiredNicknameModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Показываем уведомление
        if (isTelegramWebApp) {
            tg.showAlert('✅ Никнейм успешно установлен!');
        } else {
            alert('✅ Никнейм успешно установлен!');
        }
        
    } catch (error) {
        console.error('❌ Ошибка при сохранении никнейма:', error);
        errorDiv.style.display = 'block';
        errorText.textContent = '❌ Ошибка сервера. Попробуйте ещё раз.';
    }
}

// ===== СТРАНИЦА РЕДАКТИРОВАНИЯ НИКНЕЙМА =====

// Показать страницу редактирования никнейма (из гамбургер-меню)
function showNicknameEditorScreen() {
    closeHamburgerMenu();
    showScreen('nicknameEditScreen');
    
    // Обновляем отображение текущего никнейма (проверяем оба варианта ключа)
    const currentNicknameDisplay = document.getElementById('currentNicknameDisplay');
    const nicknameInputPage = document.getElementById('nicknameInputPage');
    const savedNickname = localStorage.getItem('userNickname') || localStorage.getItem('user_nickname') || 'Аноним';
    
    console.log('📝 Показываем редактор никнейма, текущий никнейм:', savedNickname);
    
    if (currentNicknameDisplay) {
        currentNicknameDisplay.textContent = savedNickname;
    }
    
    if (nicknameInputPage) {
        nicknameInputPage.value = savedNickname;
        setTimeout(() => nicknameInputPage.focus(), 300);
    }
    
    // Показываем подсказку для пользователей с автоматическим никнеймом "Аноним*"
    const anonymousUserHint = document.getElementById('anonymousUserHint');
    if (anonymousUserHint) {
        const isAnonymousNickname = savedNickname.startsWith('Аноним');
        anonymousUserHint.style.display = isAnonymousNickname ? 'block' : 'none';
        if (isAnonymousNickname) {
            console.log('🎁 Показываем подсказку о бесплатной смене для "Аноним" пользователя');
        }
    }
    
    // Обновляем текст кнопки использования имени из Telegram
    updateTelegramNameButton();
}

// Обновить текст кнопки с именем из Telegram
function updateTelegramNameButton() {
    let telegramName = 'Аноним';
    
    if (isTelegramWebApp && tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        telegramName = user.first_name || user.username || 'Аноним';
    } else {
        const savedUser = localStorage.getItem('telegram_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                telegramName = user.first_name || user.username || 'Аноним';
            } catch (e) {
                console.error('Ошибка парсинга данных пользователя:', e);
            }
        }
    }
    
}

// Сохранить никнейм со страницы редактирования
async function saveNicknamePage() {
    const nicknameInputPage = document.getElementById('nicknameInputPage');
    
    if (nicknameInputPage) {
        let nickname = nicknameInputPage.value.trim();
        
        if (!nickname) {
            if (isTelegramWebApp) {
                tg.showAlert('❌ Никнейм не может быть пустым');
            } else {
                alert('❌ Никнейм не может быть пустым');
            }
            return;
        }
        
        // Получаем tgId или используем фиктивный для email пользователей
        let tgIdAuth = null;
        const userToken = localStorage.getItem('user_token');
        const authMethod = localStorage.getItem('auth_method');
        const isAndroid = navigator.userAgent.includes('Android');
        
        // Проверяем email/Android авторизацию
        if (authMethod === 'email' || (isAndroid && userToken)) {
            tgIdAuth = 99999999; // Фиктивный ID для email пользователей
            console.log('📱 Email/Android user, using fake tgId');
        } else if (isTelegramWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
            tgIdAuth = Number(window.Telegram.WebApp.initDataUnsafe.user.id);
        } else {
            const savedUserJson = localStorage.getItem('telegram_user');
            if (savedUserJson) {
                try {
                    const u = JSON.parse(savedUserJson);
                    if (u?.id) tgIdAuth = Number(u.id);
                } catch (e) {}
            }
        }

        if (!tgIdAuth) {
            if (isTelegramWebApp) {
                tg.showAlert('❌ Не удалось получить данные авторизации');
            } else {
                alert('❌ Не удалось получить данные авторизации');
            }
            return;
        }

        try {
            // Используем новый /api/nickname endpoint с проверкой ограничений
            // userToken уже получен выше
            const payload = { 
                tgId: tgIdAuth, 
                nickname: nickname 
            };
            
            // Добавляем userToken если есть (для email пользователей)
            if (userToken) {
                payload.userToken = userToken;
            }
            
            const response = await fetch('/api/nickname', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!result.success) {
                // Обрабатываем различные ошибки
                let errorMessage = result.error || 'Неизвестная ошибка';
                
                if (result.code === 'NICKNAME_LOCKED_FREE') {
                    errorMessage = '🔒 Вы уже использовали бесплатную смену никнейма.\n\n💎 Обновитесь до PRO чтобы менять никнейм неограниченно (раз в сутки)!';
                } else if (result.code === 'NICKNAME_COOLDOWN') {
                    const hours = result.hoursRemaining || 24;
                    errorMessage = `⏳ PRO пользователи могут менять никнейм раз в 24 часа.\n\nПопробуйте через ${hours} ч.`;
                } else if (result.code === 'NICKNAME_TAKEN') {
                    errorMessage = '❌ Этот никнейм уже занят. Выберите другой.';
                } else if (result.code === 'INVALID_NICKNAME') {
                    errorMessage = '❌ Никнейм может содержать только буквы (рус/eng), цифры, _ и -\n\nПробелы запрещены!';
                }

                if (isTelegramWebApp) {
                    tg.showAlert(errorMessage);
                } else {
                    alert(errorMessage);
                }
                return;
            }

            // Успешно сохранено - обновляем localStorage
            localStorage.setItem('user_nickname', nickname);
            localStorage.setItem('userNickname', nickname);
            console.log('✅ Никнейм сохранён:', nickname);

            // Обновляем nickname во всех анкетах пользователя
            const userId = getCurrentUserId();
            // userToken уже объявлен выше

            if (userId || userToken || tgIdAuth) {
                try {
                    const payload = {
                        action: 'update-all-nicknames',
                        nickname: nickname
                    };
                    if (userToken && userToken !== 'null' && userToken !== 'undefined') {
                        payload.userToken = userToken;
                    }
                    if (typeof tgIdAuth === 'number' && Number.isFinite(tgIdAuth)) {
                        payload.tgId = tgIdAuth;
                    } else if (userId && !isNaN(Number(userId))) {
                        payload.tgId = Number(userId);
                    }

                    const adsResponse = await fetch('/api/ads', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const adsResult = await adsResponse.json();
                    if (adsResult.success) {
                        console.log('✅ Никнейм обновлен в анкетах:', adsResult.count);
                    }
                } catch (error) {
                    console.error('Ошибка обновления никнейма в анкетах:', error);
                }
            }
            
            // Показываем уведомление и возвращаемся на главную
            if (isTelegramWebApp) {
                tg.showPopup({
                    title: '✅ Сохранено',
                    message: `Ваш ${result.isFirstTime ? '' : 'новый '}псевдоним: "${nickname}"`,
                    buttons: [{ type: 'ok' }]
                });
            }
            
            // Возвращаемся на главную страницу
            setTimeout(() => {
                showMainMenu();
            }, 300);
        } catch (error) {
            console.error('Ошибка сохранения никнейма:', error);
            if (isTelegramWebApp) {
                tg.showAlert('❌ Ошибка сохранения никнейма');
            } else {
                alert('❌ Ошибка сохранения никнейма');
            }
        }
    }
}

// Закрыть гамбургер-меню и вернуться на главную
function closeHamburgerAndGoHome() {
    closeHamburgerMenu();
    showMainMenu();
}

// УСТАРЕВШИЕ ФУНКЦИИ (удалим позже)
// Показать редактор никнейма (старая версия - не используется)
function showNicknameEditor() {
    // Теперь открываем страницу редактирования вместо inline редактора
    showNicknameEditorScreen();
}

// Сохранить никнейм (старая версия - не используется)
function saveNickname() {
    saveNicknamePage();
}

// Отменить редактирование никнейма (старая версия - не используется)
function cancelNicknameEdit() {
    showMainMenu();
}

// Использовать имя из Telegram на главной странице (старая версия - не используется)
function useDefaultNicknameMain() {
    useDefaultNicknamePage();
}

// СТАРАЯ функция для формы (оставляем для совместимости, если где-то используется)
function useDefaultNickname() {
    let telegramName = 'Аноним';
    
    if (isTelegramWebApp && tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        telegramName = user.first_name || user.username || 'Аноним';
    } else {
        const savedUser = localStorage.getItem('telegram_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                telegramName = user.first_name || user.username || 'Аноним';
            } catch (e) {
                console.error('Ошибка парсинга данных пользователя:', e);
            }
        }
    }
    
    const nicknameInput = document.getElementById('nicknameInput');
    if (nicknameInput) {
        nicknameInput.value = telegramName;
        localStorage.setItem('user_nickname', telegramName);
        
        // Показываем уведомление
        if (isTelegramWebApp) {
            tg.showPopup({
                title: '✅ Установлено',
                message: `Ваш псевдоним: "${telegramName}"`,
                buttons: [{ type: 'ok' }]
            });
        }
    }
}

// ============= ONBOARDING СИСТЕМА =============

let nicknameCheckTimeout = null;

// Показать onboarding экран
function showOnboardingScreen() {
    showScreen('onboardingScreen');
    
    const nicknameInput = document.getElementById('onboardingNicknameInput');
    const continueBtn = document.getElementById('onboardingContinue');
    const agreeCheckbox = document.getElementById('agreeTerms');
    
    // Очищаем поле никнейма при первом открытии (показываем placeholder)
    if (nicknameInput) {
        nicknameInput.value = '';
    }
    
    // Обработчик ввода никнейма
    if (nicknameInput) {
        nicknameInput.addEventListener('input', function() {
            const nickname = this.value.trim();
            clearTimeout(nicknameCheckTimeout);
            
            if (nickname.length < 1) {
                showNicknameStatus('', '');
                updateContinueButton();
                return;
            }
            
            showNicknameStatus('checking', '⏳ Проверяем...');
            
            nicknameCheckTimeout = setTimeout(() => {
                checkNicknameAvailability(nickname);
            }, 500);
        });
    }
    
    // Обработчик чекбокса
    if (agreeCheckbox) {
        agreeCheckbox.addEventListener('change', updateContinueButton);
    }
    
    updateContinueButton();
}

// Проверка доступности никнейма
async function checkNicknameAvailability(nickname) {
    try {
        const response = await fetch(`/api/nickname?nickname=${encodeURIComponent(nickname)}`);
        const data = await response.json();
        
        if (data.available) {
            showNicknameStatus('available', '✅ Доступен');
        } else {
            showNicknameStatus('taken', '❌ Уже занят');
        }
        
        updateContinueButton();
    } catch (error) {
        console.error('Ошибка проверки никнейма:', error);
        showNicknameStatus('', '');
    }
}

// Показать статус никнейма
function showNicknameStatus(type, message) {
    const statusEl = document.getElementById('nicknameStatus');
    if (!statusEl) return;
    
    statusEl.className = 'nickname-status';
    if (type) {
        statusEl.classList.add(type);
        statusEl.textContent = message;
    } else {
        statusEl.textContent = '';
    }
}

// Обновить состояние кнопки "Продолжить"
function updateContinueButton() {
    const nicknameInput = document.getElementById('onboardingNicknameInput');
    const agreeCheckbox = document.getElementById('agreeTerms');
    const continueBtn = document.getElementById('onboardingContinue');
    const statusEl = document.getElementById('nicknameStatus');
    
    if (!continueBtn) return;
    
    const nickname = nicknameInput?.value.trim() || '';
    const agreed = agreeCheckbox?.checked || false;
    const nicknameAvailable = statusEl?.classList.contains('available');
    
    const canContinue = nickname.length >= 1 && nicknameAvailable && agreed;
    
    continueBtn.disabled = !canContinue;
    continueBtn.textContent = canContinue ? '🚀 Продолжить' : '⏳ Сохраняем...';
}

// Завершить onboarding
async function completeOnboarding() {
    const nicknameInput = document.getElementById('onboardingNicknameInput');
    const agreeCheckbox = document.getElementById('agreeTerms');
    const continueBtn = document.getElementById('onboardingContinue');
    
    const nickname = nicknameInput?.value.trim();
    const agreed = agreeCheckbox?.checked;
    
    if (!nickname || nickname.length < 1) {
        tg.showAlert('Введите никнейм (минимум 1 символ)');
        return;
    }

    // Проверка на пробелы
    if (nickname.includes(' ')) {
        tg.showAlert('❌ Никнейм не может содержать пробелы');
        return;
    }

    // Проверка на допустимые символы (латиница, кириллица, цифры, _, -)
    const validPattern = /^[a-zA-Zа-яА-ЯёЁ0-9_-]+$/;
    if (!validPattern.test(nickname)) {
        tg.showAlert('❌ Никнейм может содержать только буквы (рус/eng), цифры, _ и -');
        return;
    }
    
    if (!agreed) {
        tg.showAlert('Необходимо согласиться с условиями');
        return;
    }
    
    // Блокируем кнопку
    const originalText = continueBtn.textContent;
    continueBtn.disabled = true;
    continueBtn.textContent = '⏳ Сохраняем...';
    
    try {
        // Получаем tgId или используем фиктивный для email пользователей
        let tgId = null;
        const userToken = localStorage.getItem('user_token');
        const authMethod = localStorage.getItem('auth_method');
        
        // Проверяем Android/email авторизацию
        const isAndroid = navigator.userAgent.includes('Android');
        
        if (authMethod === 'email' || (isAndroid && userToken)) {
            // Для email пользователей tgId не нужен, используем только userToken
            tgId = null;
            console.log('📱 Email/Android user, will use userToken only');
        } else if (isTelegramWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
            tgId = window.Telegram.WebApp.initDataUnsafe.user.id;
        } else {
            const savedUserJson = localStorage.getItem('telegram_user');
            if (savedUserJson) {
                try {
                    const u = JSON.parse(savedUserJson);
                    if (u?.id) tgId = u.id;
                } catch (e) {
                    console.error('Ошибка парсинга telegram_user:', e);
                }
            }
        }

        if (!tgId && !userToken) {
            throw new Error('Не удалось получить данные авторизации');
        }

        // 1. Сохраняем никнейм
        const payload = {
            nickname: nickname
        };
        
        // Для email пользователей используем только userToken
        if (authMethod === 'email' && userToken) {
            payload.userToken = userToken;
            console.log('📧 Email user, sending userToken for nickname');
        } else if (tgId && tgId !== 99999999) {
            // Для Telegram пользователей используем tgId
            payload.tgId = tgId;
            if (userToken) {
                payload.userToken = userToken;
            }
            console.log('✈️ Telegram user, sending tgId for nickname');
        } else {
            throw new Error('Не удалось определить метод авторизации');
        }
        
        console.log('💾 Отправка никнейма:', { ...payload, userToken: payload.userToken ? payload.userToken.substring(0, 16) + '...' : undefined });
        
        const nicknameResponse = await fetch('/api/nickname', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const nicknameData = await nicknameResponse.json();
        if (!nicknameData.success) {
            throw new Error(nicknameData.error || 'Ошибка сохранения никнейма');
        }
        
        console.log('✅ Никнейм сохранен:', nicknameData);
        
        // 2. Сохраняем согласие с условиями
        // userToken уже получен выше
        const tgIdForAgreement = tg?.initDataUnsafe?.user?.id || tgId;
        
        // Если есть userToken или tgId - сохраняем согласие
        if (userToken || tgIdForAgreement) {
            const payload = {
                agreed: true
            };
            
            if (userToken) {
                payload.userToken = userToken;
            }
            if (tgIdForAgreement) {
                payload.tgId = tgIdForAgreement;
            }
            
            const agreeResponse = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const agreeData = await agreeResponse.json();
            if (agreeData.success) {
                // Сохраняем userToken, если сервер вернул новый
                if (agreeData.userToken && !userToken) {
                    localStorage.setItem('user_token', agreeData.userToken);
                    console.log('✅ Получен user_token при сохранении согласия');
                }
            } else {
                console.warn('Ошибка сохранения согласия:', agreeData.error);
            }
        } else {
            console.warn('Нет user_token и tg_id, согласие сохранено только локально');
        }
        
        // 3. Сохраняем локально
        localStorage.setItem('userNickname', nickname);
        localStorage.setItem('user_nickname', nickname);
        localStorage.setItem('onboardingCompleted', 'true');
        
        console.log('✅ Onboarding завершён:', nickname);
        
        // 4. Проверяем наличие сохраненной локации
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            // Локация уже есть - сразу в главное меню
            console.log('📍 Локация уже сохранена, переходим в главное меню');
            displayUserLocation();
            updateFormLocationDisplay();
            showMainMenu();
        } else {
            // Локации нет - показываем экран автоопределения
            console.log('📍 Локация не найдена, запускаем автоопределение');
            showAutoLocationDetection();
        }
        
    } catch (error) {
        console.error('Ошибка завершения onboarding:', error);
        
        // Если ошибка "User not found" - предлагаем переавторизоваться
        if (error.message && error.message.includes('User not found')) {
            if (confirm('❌ Ошибка: пользователь не найден в базе данных.\n\nВозможно, произошла ошибка при регистрации.\n\nНажмите ОК чтобы выйти и войти заново.')) {
                // Очищаем данные авторизации
                localStorage.removeItem('user_token');
                localStorage.removeItem('auth_method');
                localStorage.removeItem('user_email');
                localStorage.removeItem('user_id');
                localStorage.removeItem('userNickname');
                localStorage.removeItem('user_nickname');
                localStorage.removeItem('onboardingCompleted');
                
                // Перезагружаем страницу для повторной авторизации
                location.reload();
            }
        } else {
            tg.showAlert('Ошибка: ' + error.message);
        }
        
        continueBtn.textContent = originalText;
        continueBtn.disabled = false;
    }
}

// Модальные окна правил/политики
function showRulesModal() {
    document.getElementById('rulesModal').style.display = 'flex';
}

function closeRulesModal() {
    document.getElementById('rulesModal').style.display = 'none';
}

function showPrivacyModal() {
    document.getElementById('privacyModal').style.display = 'flex';
}

function closePrivacyModal() {
    document.getElementById('privacyModal').style.display = 'none';
}

// Показать FAQ Мир чата
function showWorldChatFAQ() {
    const modal = document.getElementById('worldChatFAQModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Закрыть FAQ Мир чата
function closeWorldChatFAQ() {
    const modal = document.getElementById('worldChatFAQModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Показать модальное окно авторизации
function showTelegramAuthModal() {
    console.log('📱 Показываем модальное окно авторизации');
    
    const modal = document.getElementById('telegramAuthModal');
    if (!modal) {
        console.error('❌ Модальное окно авторизации не найдено!');
        
        // Создаем временное уведомление если модалка не найдена
        tg.showAlert('⚠️ Ошибка: Модальное окно авторизации не найдено в DOM!\n\nПопробуйте перезагрузить страницу.');
        return;
    }
    
    console.log('✅ Модальное окно найдено:', modal);
    
    // Блокируем весь интерфейс (делаем модальное окно обязательным)
    modal.style.display = 'flex';
    modal.style.zIndex = '99999';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    console.log('✅ Стили модального окна применены. display:', modal.style.display);
    
    // Принудительно делаем видимым
    modal.classList.remove('hidden');
    modal.removeAttribute('hidden');
    
    // Блокируем закрытие по клику вне модального окна
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.onclick = (e) => {
            e.stopPropagation();
            tg.showAlert('⚠️ Для продолжения необходимо авторизоваться через Telegram');
        };
    }
    
    // Блокируем кнопку закрытия
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.preventDefault();
            tg.showAlert('⚠️ Для продолжения необходимо авторизоваться через Telegram');
            return false;
        };
    }
    
    // Генерируем уникальный auth token для этой сессии
    const authToken = 'auth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('telegram_auth_token', authToken);
    
    console.log('🔑 Auth token сгенерирован:', authToken);
    
    // Генерируем QR-код
    generateTelegramQR(authToken);
    
    // ВСЕГДА показываем кнопку Deep Link (работает и в WebView и в браузере)
    console.log('🌐 Настраиваем кнопку Deep Link для авторизации');
    const loginWidgetContainer = document.getElementById('loginWidgetContainer');
    const loginWidgetDivider = document.getElementById('loginWidgetDivider');
    const deepLinkButton = document.getElementById('telegramDeepLink');
    
    // Устанавливаем Deep Link для открытия бота
    const botUsername = 'anonimka_kz_bot';
    
    // Определяем находимся ли мы в Android приложении
    const isAndroidApp = navigator.userAgent.includes('wv') || 
                       navigator.userAgent.includes('Android') ||
                       window.location.protocol === 'file:';
    
    console.log('🔍 Debug auth:', {
        userAgent: navigator.userAgent,
        protocol: window.location.protocol,
        isAndroidApp: isAndroidApp,
        authToken: authToken
    });
    
    // Если в Android приложении - добавляем параметр для возврата
    const startParam = isAndroidApp ? `${authToken}_app` : authToken;
    const telegramDeepLink = `https://t.me/${botUsername}?start=${startParam}`;
    
    console.log('🔗 Deep link:', telegramDeepLink);
    
    if (deepLinkButton) {
        deepLinkButton.href = telegramDeepLink;
        console.log('✅ Deep link установлен на кнопку');
    }
    
    if (loginWidgetContainer) {
        loginWidgetContainer.style.display = 'block';
    }
    if (loginWidgetDivider) {
        loginWidgetDivider.style.display = 'flex';
    }
    
    // Проверяем авторизацию каждые 2 секунды через API сервера
    const checkInterval = setInterval(async () => {
        try {
            // Проверяем на сервере, не авторизовался ли пользователь через QR на телефоне
            const response = await fetch(`/api/auth?token=${authToken}`);
            const data = await response.json();
            
            if (data.authorized && data.user) {
                console.log('✅ Авторизация через QR получена с сервера:', data.user);
                
                // Сохраняем данные пользователя
                localStorage.setItem('telegram_user', JSON.stringify(data.user));
                localStorage.setItem('telegram_auth_time', Date.now().toString());
                localStorage.removeItem('telegram_auth_token');
                
                // Закрываем модальное окно
                clearInterval(checkInterval);
                modal.style.display = 'none';
                
                // Показываем уведомление
                tg.showAlert(`✅ Авторизация успешна!\n\nДобро пожаловать, ${data.user.first_name}!\n\nТеперь вы можете пользоваться сайтом как с компьютера, так и с телефона.`);
                
                // Перезагружаем страницу через 1 секунду
                setTimeout(() => location.reload(), 1000);
                return;
            }
            
            // Также проверяем localStorage (на случай авторизации через Login Widget)
            const savedUser = localStorage.getItem('telegram_user');
            const authTime = localStorage.getItem('telegram_auth_time');
            
            if (savedUser && authTime) {
                const userData = JSON.parse(savedUser);
                const timeDiff = Date.now() - parseInt(authTime);
                
                // Если авторизация произошла менее 10 секунд назад
                if (timeDiff < 10000) {
                    console.log('✅ Обнаружена авторизация через Login Widget');
                    
                    // Закрываем модальное окно
                    clearInterval(checkInterval);
                    modal.style.display = 'none';
                    localStorage.removeItem('telegram_auth_token');
                    
                    // Показываем уведомление
                    tg.showAlert(`✅ Авторизация успешна!\n\nДобро пожаловать, ${userData.first_name}!`);
                    
                    // Перезагружаем страницу
                    setTimeout(() => location.reload(), 1000);
                }
            }
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
        }
    }, 2000);
    
    // Останавливаем проверку через 10 минут
    setTimeout(() => {
        clearInterval(checkInterval);
        console.log('⏰ Timeout: проверка авторизации остановлена');
    }, 600000);
}

// Генерация QR-кода для Telegram авторизации
function generateTelegramQR(authToken) {
    const qrcodeContainer = document.getElementById('qrcode');
    const qrLoading = document.getElementById('qrLoading');
    
    if (!qrcodeContainer) return;
    
    // Очищаем контейнер
    qrcodeContainer.innerHTML = '';
    
    // Показываем загрузку с собакой
    if (qrLoading) {
        qrLoading.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Генерируем QR-код...</p>
        `;
        qrLoading.classList.remove('hidden');
    }
    
    // Создаем deep link для Telegram бота
    // Формат: https://t.me/bot_username?start=auth_token
    const botUsername = 'anonimka_kz_bot'; // @anonimka_kz_bot
    const telegramDeepLink = `https://t.me/${botUsername}?start=${authToken}`;
    
    console.log('Генерация QR-кода для:', telegramDeepLink);
    
    // Генерируем QR-код через небольшую задержку для плавности
    setTimeout(() => {
        try {
            new QRCode(qrcodeContainer, {
                text: telegramDeepLink,
                width: 240,
                height: 240,
                colorDark: "#8338ec",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // Скрываем загрузку
            if (qrLoading) {
                qrLoading.classList.add('hidden');
            }
            
            console.log('QR-код успешно сгенерирован');
        } catch (error) {
            console.error('Ошибка генерации QR-кода:', error);
            if (qrLoading) {
                qrLoading.innerHTML = '<p style="color: #ff0066;">❌ Ошибка генерации QR-кода</p>';
            }
        }
    }, 100);
}

// Закрыть модальное окно (только если пользователь авторизован)
function closeTelegramAuthModal() {
    const savedUser = localStorage.getItem('telegram_user');
    if (!savedUser) {
        tg.showAlert('Для продолжения использования сайта необходимо авторизоваться через Telegram');
        return;
    }
    
    const modal = document.getElementById('telegramAuthModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Инициализация Telegram Login Widget
function initTelegramLoginWidget() {
    const container = document.getElementById('telegramLoginWidget');
    if (!container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Имя бота для Telegram Login Widget
    const botUsername = 'anonimka_kz_bot'; // @anonimka_kz_bot
    
    // Создаём iframe для Telegram Login Widget
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', window.location.origin + '/webapp/auth.html');
    script.setAttribute('data-request-access', 'write');
    
    container.appendChild(script);
    
    console.log('Telegram Login Widget инициализирован для бота:', botUsername);
}

// Callback после успешной авторизации через Telegram Login Widget
window.onTelegramAuth = function(user) {
    console.log('✅ Успешная авторизация через Telegram Login Widget:', user);
    
    // Сохраняем данные пользователя
    localStorage.setItem('telegram_user', JSON.stringify(user));
    localStorage.setItem('telegram_auth_time', Date.now().toString());
    
    // Закрываем модальное окно
    const modal = document.getElementById('telegramAuthModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('✅ Модальное окно авторизации закрыто');
    }
    
    // Показываем уведомление
    tg.showAlert(`✅ Вы успешно авторизованы!\n\nДобро пожаловать, ${user.first_name}!\n\nТеперь вы можете создавать анкеты и получать уведомления.`);
    
    // Обновляем кнопку выхода
    updateLogoutButtonVisibility();
    
    // Перезагружаем страницу для применения авторизации
    location.reload();
};

// Показать модальное окно авторизации через Email
function showEmailAuthModal() {
    console.log('📧 Показываем модальное окно email авторизации');
    
    // Создаем модальное окно динамически
    let modal = document.getElementById('emailAuthModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'emailAuthModal';
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 99999;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: linear-gradient(135deg, #1a1a2e 0%, #2a2a3e 100%);
                border-radius: 30px;
                padding: 3rem;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(255, 0, 110, 0.4);
                border: 3px solid #ff006e;
                position: relative;
            ">
                <h2 style="
                    color: #ff006e;
                    text-align: center;
                    margin-bottom: 1.5rem;
                    font-size: 2rem;
                    text-shadow: 0 0 20px rgba(255, 0, 110, 0.6);
                ">📧 Вход через Email</h2>
                
                <p style="
                    color: rgba(255, 255, 255, 0.8);
                    text-align: center;
                    margin-bottom: 2rem;
                    font-size: 1rem;
                ">Введите вашу почту для авторизации</p>
                
                <div style="margin-bottom: 1.5rem;">
                    <input 
                        type="email" 
                        id="emailAuthInput" 
                        placeholder="your@email.com"
                        style="
                            width: 100%;
                            padding: 1rem;
                            border: 2px solid #ff006e;
                            border-radius: 15px;
                            background: rgba(26, 26, 46, 0.8);
                            color: #fff;
                            font-size: 1.1rem;
                            text-align: center;
                            outline: none;
                            transition: all 0.3s ease;
                        "
                    />
                </div>
                
                <div id="emailAuthCodeSection" style="display: none; margin-bottom: 1.5rem;">
                    <p style="
                        color: rgba(255, 255, 255, 0.8);
                        text-align: center;
                        margin-bottom: 1rem;
                        font-size: 0.95rem;
                    ">Введите код из письма:</p>
                    <input 
                        type="text" 
                        id="emailAuthCode" 
                        placeholder="••••••"
                        maxlength="6"
                        style="
                            width: 100%;
                            padding: 1rem;
                            border: 2px solid #00ff88;
                            border-radius: 15px;
                            background: rgba(26, 26, 46, 0.8);
                            color: #fff;
                            font-size: 1.5rem;
                            text-align: center;
                            letter-spacing: 0.5rem;
                            outline: none;
                        "
                    />
                </div>
                
                <div id="emailAuthMessage" style="
                    text-align: center;
                    margin-bottom: 1.5rem;
                    min-height: 1.5rem;
                    color: #00ff88;
                    font-size: 0.9rem;
                "></div>
                
                <button 
                    id="emailAuthButton" 
                    class="neon-button primary"
                    style="
                        width: 100%;
                        padding: 1rem;
                        border: 2px solid #ff006e;
                        border-radius: 15px;
                        background: rgba(255, 0, 110, 0.2);
                        color: #ff006e;
                        font-size: 1.2rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        margin-bottom: 1rem;
                    "
                >
                    Отправить код
                </button>
                
                <div style="text-align: center;">
                    <button 
                        onclick="switchToTelegramAuth()"
                        style="
                            background: none;
                            border: none;
                            color: #00d4ff;
                            text-decoration: underline;
                            cursor: pointer;
                            font-size: 1rem;
                        "
                    >
                        ✈️ Войти через Telegram
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчики событий
        const emailInput = modal.querySelector('#emailAuthInput');
        const codeInput = modal.querySelector('#emailAuthCode');
        const button = modal.querySelector('#emailAuthButton');
        const messageDiv = modal.querySelector('#emailAuthMessage');
        const codeSection = modal.querySelector('#emailAuthCodeSection');
        
        let emailSent = false;
        
        button.onclick = async () => {
            if (!emailSent) {
                // Отправка кода
                const email = emailInput.value.trim().toLowerCase();
                
                if (!email || !email.includes('@')) {
                    messageDiv.style.color = '#ff006e';
                    messageDiv.textContent = '❌ Введите корректный email';
                    return;
                }
                
                button.disabled = true;
                button.textContent = 'Отправка...';
                messageDiv.textContent = '⏳ Отправляем код...';
                
                try {
                    const response = await fetch('/api/auth/email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'send-code',
                            email 
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        emailSent = true;
                        messageDiv.style.color = '#00ff88';
                        messageDiv.textContent = '✅ Код отправлен на ' + email;
                        codeSection.style.display = 'block';
                        button.textContent = 'Войти';
                        emailInput.disabled = true;
                        codeInput.focus();
                    } else {
                        throw new Error(data.error || 'Ошибка отправки кода');
                    }
                } catch (error) {
                    messageDiv.style.color = '#ff006e';
                    messageDiv.textContent = '❌ ' + error.message;
                    button.textContent = 'Отправить код';
                } finally {
                    button.disabled = false;
                }
            } else {
                // Проверка кода
                const code = codeInput.value.trim();
                
                if (!code || code.length !== 6) {
                    messageDiv.style.color = '#ff006e';
                    messageDiv.textContent = '❌ Введите 6-значный код';
                    return;
                }
                
                button.disabled = true;
                button.textContent = 'Проверка...';
                messageDiv.textContent = '⏳ Проверяем код...';
                
                try {
                    const response = await fetch('/api/auth/email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'verify-code',
                            email: emailInput.value.trim().toLowerCase(),
                            code 
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success && data.user?.userToken) {
                        localStorage.setItem('user_token', data.user.userToken);
                        localStorage.setItem('auth_method', 'email');
                        localStorage.setItem('user_email', emailInput.value.trim().toLowerCase());
                        if (data.user.id) {
                            localStorage.setItem('user_id', data.user.id.toString());
                        }
                        
                        messageDiv.style.color = '#00ff88';
                        messageDiv.textContent = '✅ Авторизация успешна!';
                        
                        setTimeout(() => {
                            modal.style.display = 'none';
                            location.reload();
                        }, 1500);
                    } else {
                        throw new Error(data.error || 'Неверный код');
                    }
                } catch (error) {
                    messageDiv.style.color = '#ff006e';
                    messageDiv.textContent = '❌ ' + error.message;
                    button.textContent = 'Войти';
                    button.disabled = false;
                }
            }
        };
        
        // Enter для отправки
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') button.click();
        });
        
        codeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') button.click();
        });
    }
    
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.querySelector('#emailAuthInput')?.focus();
    }, 100);
}

// Переключиться на Telegram авторизацию
function switchToTelegramAuth() {
    const emailModal = document.getElementById('emailAuthModal');
    if (emailModal) {
        emailModal.style.display = 'none';
    }
    showTelegramAuthModal();
}

// Переключиться на Email авторизацию
function switchToEmailAuth() {
    const telegramModal = document.getElementById('telegramAuthModal');
    if (telegramModal) {
        telegramModal.style.display = 'none';
    }
    showEmailAuthModal();
}

// ...existing code...

function showReferralModal() {
    const modal = document.getElementById('referralModal');
    const referralLinkEl = document.getElementById('referralLink');
    modal.style.display = 'flex';
    // Получаем user_token текущего пользователя
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
        referralLinkEl.textContent = 'Авторизуйтесь для получения реферальной ссылки';
        return;
    }
    // Генерируем реферальную ссылку
    const botUsername = 'anonimka_kz_bot';
    // Используем startapp, чтобы параметр попал в WebApp как start_param
    const referralLink = `https://t.me/${botUsername}?startapp=ref_${userToken}`;
    referralLinkEl.textContent = referralLink;
    window.currentReferralLink = referralLink;
}

// Получить текущий ID пользователя для серверных лимитов (предпочтительно Telegram ID)
function getCurrentUserId() {
    // 1) Telegram WebApp user
    if (isTelegramWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        return String(window.Telegram.WebApp.initDataUnsafe.user.id);
    }
    // 2) Telegram Login Widget сохранённый пользователь
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            if (userData?.id) {
                return String(userData.id);
            }
        } catch (e) {
            console.error('Ошибка получения ID пользователя:', e);
        }
    }
    // 3) Для чисто веб-пользователей (без Telegram) возвращаем null — сервер будет работать по user_token
    return null;
}

// Получить nickname текущего пользователя
function getUserNickname() {
    // Сначала пытаемся получить никнейм из localStorage (оба возможных ключа)
    const savedNickname1 = localStorage.getItem('userNickname');
    const savedNickname2 = localStorage.getItem('user_nickname');
    const savedNickname = savedNickname1 || savedNickname2;
    if (savedNickname && savedNickname !== 'null' && savedNickname !== 'undefined') {
        return savedNickname;
    }
    // Если никнейм не установлен, возвращаем "Аноним"
    return 'Аноним';
}

// Получить локацию пользователя
function getUserLocation() {
    const locationStr = localStorage.getItem('userLocation');
    console.log('📍 localStorage.userLocation:', locationStr);
    if (locationStr) {
        try {
            const parsed = JSON.parse(locationStr);
            console.log('📍 Parsed location:', parsed);
            return parsed;
        } catch (e) {
            console.error('Ошибка парсинга userLocation:', e);
            return null;
        }
    }
    console.log('⚠️ userLocation не найден в localStorage');
    return null;
}

// Получить данные пользователя по ID (для отображения ников собеседников)
function getUserData(userId) {
    // Кешируем данные пользователей в памяти
    if (!window.userDataCache) {
        window.userDataCache = {};
    }
    
    // Возвращаем из кеша если есть
    if (window.userDataCache[userId]) {
        return window.userDataCache[userId];
    }
    
    // Пока возвращаем заглушку
    return {
        id: userId,
        nickname: 'Собеседник'
    };
}

// Функция выхода из аккаунта
function handleLogout() {
    const isAndroid = navigator.userAgent.includes('Android');
    const authMethod = localStorage.getItem('auth_method');
    
    let confirmText = 'Вы уверены, что хотите выйти из аккаунта?';
    if (isAndroid || authMethod === 'email') {
        confirmText += '\n\nВам потребуется заново авторизоваться через email.';
    } else {
        confirmText += '\n\nВам потребуется заново авторизоваться через Telegram.';
    }
    
    if (!confirm(confirmText)) {
        return;
    }
    
    console.log('🚪 Выход из аккаунта...');
    
    // Очищаем все данные авторизации
    localStorage.removeItem('telegram_user');
    localStorage.removeItem('telegram_auth_time');
    localStorage.removeItem('telegram_auth_token');
    localStorage.removeItem('user_nickname');
    localStorage.removeItem('userNickname');
    localStorage.removeItem('user_token');
    localStorage.removeItem('auth_method');
    localStorage.removeItem('user_email');
    localStorage.removeItem('auth_time');
    localStorage.removeItem('user_id');
    localStorage.removeItem('is_premium');
    
    // Закрываем гамбургер меню
    closeHamburgerMenu();
    
    // Для Android - перезагружаем (MainActivity проверит отсутствие user_token)
    if (isAndroid) {
        console.log('📱 Android: reloading to trigger native email auth...');
        window.location.reload();
    } else {
        // Для браузера - показываем модальное окно авторизации
        setTimeout(() => {
            showTelegramAuthModal();
            console.log('✅ Выход выполнен, показано модальное окно авторизации');
        }, 300);
    }
}

// Обновить отображение кнопки выхода (показывать только для браузерной авторизации)
function updateLogoutButtonVisibility() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    
    // Проверяем реальную Telegram авторизацию (через WebApp или Login Widget)
    const hasRealTelegramAuth = !!(
        window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    );
    
    // Показываем кнопку только для Login Widget (браузерная авторизация)
    if (!hasRealTelegramAuth) {
        const savedUser = localStorage.getItem('telegram_user');
        if (savedUser) {
            logoutBtn.style.display = 'flex';
        } else {
            logoutBtn.style.display = 'none';
        }
    } else {
        // В Telegram WebApp кнопка выхода не нужна (встроенная авторизация)
        logoutBtn.style.display = 'none';
    }
}

function setupEventListeners() {
    // Кнопки выбора города
    document.querySelectorAll('.city-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.classList.contains('filter')) {
                handleCityFilter(this.dataset.city);
            } else {
                selectCity(this.dataset.city);
            }
        });
    });

    // Кнопки выбора пола
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', () => selectGender(btn.dataset.gender));
    });

    // Кнопки выбора цели поиска
    document.querySelectorAll('.target-btn').forEach(btn => {
        btn.addEventListener('click', () => selectTarget(btn.dataset.target));
    });

    // Кнопки выбора цели знакомства
    document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.addEventListener('click', () => selectGoal(btn.dataset.goal));
    });

    // Кнопки выбора телосложения
    document.querySelectorAll('.body-btn').forEach(btn => {
        btn.addEventListener('click', () => selectBody(btn.dataset.body));
    });

    // Кнопки выбора ориентации инициализируются в showStep(7)

    // Кастомный город
    document.getElementById('customCity').addEventListener('input', function() {
        if (this.value.trim()) {
            clearCitySelection();
            formData.city = this.value.trim();
        }
    });
}

// Навигация между экранами
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(screenId);
    if (!targetScreen) {
        console.error('Screen not found:', screenId);
        return;
    }
    targetScreen.classList.add('active');
    
    // Управление видимостью переключателя тарифов
    const premiumToggle = document.getElementById('premiumToggle');
    if (premiumToggle) {
        if (screenId === 'mainMenu') {
            premiumToggle.style.display = 'flex';
        } else {
            premiumToggle.style.display = 'none';
        }
    }
    
    // Обновляем кнопки Telegram
    updateTelegramButtons(screenId);
}

function updateTelegramButtons(screenId) {
    switch(screenId) {
        case 'mainMenu':
            tg.BackButton.hide();
            tg.MainButton.hide();
            break;
        case 'createAd':
        case 'browseAds':
        case 'adDetails':
        case 'chatScreen':
        case 'chatsScreen':
        case 'worldChatScreen':
        case 'locationSetup':
        case 'locationChoice':
        case 'autoLocationDetection':
        case 'referralScreen':
            tg.BackButton.show();
            tg.MainButton.hide();
            break;
        default:
            // Для всех остальных экранов показываем кнопку назад
            tg.BackButton.show();
            tg.MainButton.hide();
            break;
    }
}

function handleBackButton() {
    const activeScreen = document.querySelector('.screen.active')?.id;
    
    switch(activeScreen) {
        case 'createAd':
            showMainMenu();
            break;
        case 'browseAds':
            showMainMenu();
            break;
        case 'adDetails':
            showBrowseAds();
            break;
        case 'chatScreen':
            // Закрываем приватный чат и возвращаемся в меню чатов
            showScreen('chatsScreen');
            break;
        case 'chatsScreen':
            showMainMenu();
            break;
        case 'worldChatScreen':
            showMainMenu();
            break;
        case 'locationSetup':
        case 'locationChoice':
        case 'autoLocationDetection':
            showMainMenu();
            break;
        case 'referralScreen':
            showMainMenu();
            break;
        default:
            showMainMenu();
    }
}

function showMainMenu() {
    // Убедимся что модальные окна авторизации скрыты
    const telegramModal = document.getElementById('telegramAuthModal');
    const emailModal = document.getElementById('emailAuthModal');
    if (telegramModal) telegramModal.style.display = 'none';
    if (emailModal) emailModal.style.display = 'none';
    
    // КРИТИЧНО: Проверяем никнейм перед показом главного меню
    const nickname = localStorage.getItem('userNickname');
    if (!nickname || nickname.trim() === '') {
        console.warn('⚠️ Попытка открыть главное меню без никнейма - блокируем');
        showOnboardingScreen();
        return;
    }
    
    showScreen('mainMenu');
    resetForm();
    updateChatBadge(); // Обновляем счетчик запросов
    loadPremiumStatus(); // Принудительно обновляем статус и лимиты с сервера
    
    // Скрываем/показываем функции в зависимости от типа пользователя
    hideEmailUserFeatures();
}

function showCreateAd() {
    // КРИТИЧНО: Проверяем никнейм перед созданием объявления
    const nickname = localStorage.getItem('userNickname');
    if (!nickname || nickname.trim() === '') {
        console.warn('⚠️ Попытка создать объявление без никнейма - блокируем');
        tg.showAlert('Сначала выберите никнейм');
        showOnboardingScreen();
        return;
    }
    
    if (!currentUserLocation) {
        tg.showAlert('Сначала выберите ваш город');
        showLocationSetup();
        return;
    }
    
    // Проверка лимита анкет - КРИНЖОВЫЕ СООБЩЕНИЯ
    if (userPremiumStatus.limits && userPremiumStatus.limits.ads) {
        const adsLimit = userPremiumStatus.limits.ads;
        if (adsLimit.remaining === 0) {
            if (userPremiumStatus.isPremium) {
                // Кринжовые сообщения для PRO пользователей
                const proMessages = [
                    '🔥 Стоп, БРО! 3 анкеты на сегодня уже созданы!\n\nДаже у PRO есть лимиты 😎\n\nВозвращайся завтра и жги дальше! 💪',
                    '⏸️ Воу-воу, полегче!\n\nТы уже создал максимум анкет на сегодня (3/3)\n\nОтдохни и приходи завтра! 🌙',
                    '🎯 Легенда, ты использовал все 3 анкеты!\n\nПРО-лимит исчерпан на сегодня 😅\n\nНовые анкеты доступны завтра! ⏰'
                ];
                const randomProMsg = proMessages[Math.floor(Math.random() * proMessages.length)];
                tg.showAlert(randomProMsg);
            } else {
                // Кринжовые сообщения для FREE пользователей с провокацией
                const freeMessages = [
                    '🛑 Стоп! Лимит FREE исчерпан (1/1)!\n\n😏 Хотите 3 анкеты в день? Тогда...',
                    '⛔ Уже создал анкету сегодня!\n\n🤔 Желаешь больше? Есть способ...',
                    '🚫 Дневной лимит закончился!\n\n💡 Но можно получить больше...'
                ];
                const randomFreeMsg = freeMessages[Math.floor(Math.random() * freeMessages.length)];
                
                tg.showConfirm(
                    randomFreeMsg,
                    (confirmed) => {
                        if (confirmed) {
                            // Показываем провокационное сообщение перед открытием модалки
                            const provokeMessages = [
                                '😎 Оу! Заинтересовало?\n\nПригласите друга и получите PRO БЕСПЛАТНО! 🎁',
                                '🎉 Правильный выбор!\n\nPRO ждёт Вас через реферальную программу! 🔥',
                                '💪 Вот это я понимаю - амбиции!\n\nРеферальная ссылка уже готова для Вас! ⚡'
                            ];
                            const randomProvoke = provokeMessages[Math.floor(Math.random() * provokeMessages.length)];
                            tg.showAlert(randomProvoke, () => showPremiumModal());
                        }
                    }
                );
            }
            return;
        }
    }
    
    showScreen('createAd');
    currentStep = 1;
    showStep(1);
    
    // Автоматически заполняем локацию из настроек пользователя
    formData.country = currentUserLocation.country;
    formData.region = currentUserLocation.region;
    formData.city = currentUserLocation.city;
    
    // Отображаем локацию в форме
    updateFormLocationDisplay();
}

// Обновить отображение локации в форме
function updateFormLocationDisplay() {
    if (currentUserLocation) {
        // Избегаем дублирования если регион = город
        const locationPart = currentUserLocation.region === currentUserLocation.city 
            ? currentUserLocation.city 
            : `${currentUserLocation.region}, ${currentUserLocation.city}`;
        const locationText = `${locationData[currentUserLocation.country].flag} ${locationPart}`;
        const formLocationDisplay = document.getElementById('formLocationDisplay');
        if (formLocationDisplay) {
            formLocationDisplay.textContent = locationText;
        }
    }
}

function showBrowseAds() {
    showScreen('browseAds');
    
    // Отображаем текущую локацию
    const browseLocationDisplay = document.getElementById('browseLocationDisplay');
    if (currentUserLocation && browseLocationDisplay) {
        // Избегаем дублирования если регион = город
        const locationPart = currentUserLocation.region === currentUserLocation.city 
            ? currentUserLocation.city 
            : `${currentUserLocation.region}, ${currentUserLocation.city}`;
        const locationText = `${locationData[currentUserLocation.country].flag} ${locationPart}`;
        browseLocationDisplay.textContent = locationText;
    } else if (browseLocationDisplay) {
        browseLocationDisplay.textContent = 'Локация не установлена';
    }
    
    // Загружаем анкеты по локации пользователя
    setTimeout(() => {
        if (currentUserLocation) {
            console.log('Загружаем анкеты по локации:', currentUserLocation);
            loadAdsByLocation(currentUserLocation.country, currentUserLocation.region, currentUserLocation.city);
        } else {
            console.log('Локация не установлена, показываем все анкеты');
            loadAds();
        }
    }, 100);
}

// Показать мои анкеты
// Показать мои анкеты
function showMyAds() {
    showScreen('myAds');
    loadMyAds();
}

// Загрузить мои анкеты
async function loadMyAds() {
    const myAdsList = document.getElementById('myAdsList');
    if (!myAdsList) {
        console.error('❌ Элемент myAdsList не найден!');
        return;
    }
    
    myAdsList.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Загрузка ваших анкет...</p>
    `;
    
    try {
        const userId = getCurrentUserId(); // предпочтительно tgId
        const userToken = localStorage.getItem('user_token');
        safeLog('📋 Загрузка анкет для пользователя:', userId || '(нет tgId)', ' token:', Boolean(userToken));

        if (!userId && !userToken) {
            myAdsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">🔐</div>
                    <h3>Требуется авторизация</h3>
                    <p>Авторизуйтесь через Telegram чтобы видеть свои анкеты</p>
                    <button class="neon-button primary" onclick="showTelegramAuthModal()">
                        Авторизоваться
                    </button>
                </div>
            `;
            return;
        }
        
        const ads = await getAllAds();
        console.log('📋 Всего анкет:', ads.length);

        // Фильтруем по user_token (безопасно и кросс-девайс); если по какой-то причине токена нет — пробуем по tg_id
        let myAds = [];
        if (userToken) {
            myAds = ads.filter(ad => ad.user_token === userToken);
        } else if (userId) {
            // На случай, если бэкенд начнёт возвращать tg_id в будущем; сейчас tg_id не приходит, поэтому результат может быть пуст
            myAds = ads.filter(ad => String(ad.tg_id) === String(userId));
        }
        console.log('📋 Мои анкеты:', myAds.length);
        
        if (myAds.length === 0) {
            myAdsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">📭</div>
                    <h3>У вас пока нет анкет</h3>
                    <p>Создайте первую анкету и оно появится здесь</p>
                    <button class="neon-button primary" onclick="showCreateAd()">
                        ✏️ Создать анкету
                    </button>
                </div>
            `;
            return;
        }
        
        // Отображаем анкеты с кнопками действий
        myAdsList.innerHTML = myAds.map((ad, index) => {
            const isPinned = ad.is_pinned && (!ad.pinned_until || new Date(ad.pinned_until) > new Date());
            const ageFrom = ad.age_from || ad.ageFrom || '?';
            const ageTo = ad.age_to || ad.ageTo || '?';
            
            const nickname = ad.display_nickname || 'Аноним';
            
            // Маппинг телосложения на читаемые значения
            const bodyLabels = {
                // Английские варианты (старые)
                slim: 'Худощавое',
                athletic: 'Спортивное',
                average: 'Среднее',
                curvy: 'Полное',
                // Русские варианты (новые)
                'Стройное': 'Стройное',
                'Обычное': 'Обычное',
                'Плотное': 'Плотное',
                'Спортивное': 'Спортивное',
                'Другое': 'Другое'
            };
            const bodyType = ad.body_type ? (bodyLabels[ad.body_type] || ad.body_type) : 'не указано';
            
            const authorGender = formatGender(ad.gender);
            // Проверяем и на русском, и на английском
            const genderLower = ad.gender?.toLowerCase();
            let authorIcon = '♀️';
            if (genderLower === 'male' || genderLower === 'мужчина') {
                authorIcon = '♂️';
            } else if (genderLower === 'пара') {
                authorIcon = '👫';
            }
            const targetText = formatTarget(ad.target);
            // Проверяем на английском и русском, поддержка "Пары"
            let targetIcon = '👤';
            const targetLower = ad.target?.toLowerCase();
            if (targetLower === 'male' || targetLower === 'мужчину') {
                targetIcon = '♂️';
            } else if (targetLower === 'female' || targetLower === 'женщину' || targetLower === 'девушку') {
                targetIcon = '♀️';
            } else if (targetLower === 'couple' || targetLower === 'пару') {
                targetIcon = '♂️♀️'; // Два смайла для пары
            }
            
            return `
            <div class="ad-card" data-ad-id="${ad.id}">
                ${isPinned ? '<span class="pinned-badge">📌 Закреплено</span>' : ''}
                <div class="ad-header">
                    <h3>${authorIcon} ${authorGender}, ${ad.my_age || '?'} лет</h3>
                    <div class="created-at"><span class="icon">⏰</span> <span class="label">Создано:</span> <span class="value">${formatCreatedAt(ad.created_at)}</span></div>
                </div>
                <div class="ad-info">
                    <div class="ad-field">
                        <span class="icon">💪</span>
                        <span><strong>Телосложение:</strong> ${bodyType}</span>
                    </div>
                    ${ad.orientation ? `<div class="ad-field">
                        <span class="icon">💗</span>
                        <span><strong>Ориентация:</strong> ${formatOrientation(ad.orientation)}</span>
                    </div>` : ''}
                    <div class="ad-field">
                        <span class="icon">🎯</span>
                        <span class="label">Цель:</span>
                        <span class="value">${formatGoals(ad.goal)}</span>
                    </div>
                    <div class="ad-field">
                        <span class="icon">${targetIcon}</span>
                        <span><strong>Ищу:</strong> ${targetText}, ${ageFrom}-${ageTo} лет</span>
                    </div>
                    <div class="ad-field">
                        <span class="icon">📍</span>
                        <span>${locationData[ad.country]?.flag || '🌍'} ${ad.region === ad.city ? ad.city : `${ad.region}, ${ad.city}`}</span>
                    </div>
                    ${ad.text ? `<div class="ad-field full-width">
                        <span class="icon">💬</span>
                        <span><strong>О себе:</strong> ${ad.text}</span>
                    </div>` : ''}
                </div>
                <div class="ad-actions">
                    <button class="delete-ad-btn" onclick="deleteMyAd(${ad.id})">
                        🗑️ Удалить
                    </button>
                    <button class="pin-ad-btn" onclick="pinMyAd(${ad.id}, ${!isPinned})">
                        ${isPinned ? '✖️ Открепить' : '📌 Закрепить (1ч)'}
                    </button>
                </div>
            </div>
        `;
        }).join('');
        
        console.log('✅ Мои анкеты отображены');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки моих анкет:', error);
        myAdsList.innerHTML = `
            <div class="no-ads">
                <div class="neon-icon">⚠️</div>
                <h3>Ошибка загрузки</h3>
                <p>${error.message || 'Неизвестная ошибка'}</p>
                <button class="neon-button primary" onclick="loadMyAds()">
                    🔄 Попробовать снова
                </button>
            </div>
        `;
    }
}

// Управление шагами формы
function showStep(step) {
    console.log(`📍 Показываем шаг ${step} из ${totalSteps}`);
    
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    const stepElement = document.getElementById(`step${step}`);
    
    if (!stepElement) {
        console.error(`❌ Элемент step${step} не найден!`);
        return;
    }
    
    stepElement.classList.add('active');
    console.log(`✅ Шаг ${step} активен`, stepElement);
    
    // Показываем/скрываем контейнер textarea
    const textareaContainer = document.getElementById('textareaContainer');
    if (textareaContainer) {
        if (step === 8) {
            textareaContainer.style.display = 'block';
            console.log('✅ Показали контейнер textarea');
            
            // ЯДЕРНАЯ ОПЦИЯ: Удаляем старый textarea и создаём новый с нуля
            let textarea = document.getElementById('adText');
            if (textarea) {
                textarea.remove();
                console.log('🗑️ Удалили старый textarea');
            }
            
            // Создаём textarea динамически
            textarea = document.createElement('textarea');
            textarea.id = 'adText';
            textarea.placeholder = 'Расскажите о себе и что ищете...';
            textarea.rows = 6;
            
            // Применяем стили напрямую
            Object.assign(textarea.style, {
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                width: '100%',
                maxWidth: '500px',
                padding: '15px',
                background: 'rgba(26, 26, 46, 0.8)',
                border: '2px solid #ff00ff',
                borderRadius: '15px',
                color: '#e0e0ff',
                fontSize: '16px',
                resize: 'vertical',
                minHeight: '120px',
                height: 'auto',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                boxSizing: 'border-box',
                position: 'relative',
                zIndex: '9999',
                margin: '0 auto'
            });
            
            // Вставляем в контейнер и добавляем счетчик символов
            textarea.maxLength = 500;
            textarea.addEventListener('input', updateCharacterCount);
            textareaContainer.innerHTML = '';
            textareaContainer.appendChild(textarea);
            
            // Добавляем счетчик символов
            const counter = document.createElement('div');
            counter.id = 'charCounter';
            counter.style.marginTop = '8px';
            counter.style.textAlign = 'right';
            counter.style.fontSize = '12px';
            counter.style.color = 'var(--text-gray)';
            counter.textContent = '0/500';
            textareaContainer.appendChild(counter);
            
            // Инициализируем отображение счетчика
            setTimeout(() => updateCharacterCount(), 0);
            
            // Проверяем через небольшую задержку
            setTimeout(() => {
                const check = document.getElementById('adText');
                console.log('🔍 ДИНАМИЧЕСКИ созданный textarea:', {
                    exists: !!check,
                    display: check?.style.display,
                    visibility: check?.style.visibility,
                    computedDisplay: check ? window.getComputedStyle(check).display : 'n/a',
                    computedVisibility: check ? window.getComputedStyle(check).visibility : 'n/a',
                    offsetHeight: check?.offsetHeight,
                    offsetWidth: check?.offsetWidth,
                    clientHeight: check?.clientHeight,
                    clientWidth: check?.clientWidth
                });
            }, 100);
        } else {
            textareaContainer.style.display = 'none';
        }
    }
    
    // Инициализируем кнопки ориентации для шага 7
    if (step === 7) {
        console.log('🎯 Инициализируем кнопки ориентации');
        const orientationBtns = document.querySelectorAll('#step7 [data-orientation]');
        console.log('Найдено кнопок ориентации:', orientationBtns.length);
        orientationBtns.forEach((btn, index) => {
            // Удаляем старые обработчики (если есть)
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Добавляем новый обработчик
            newBtn.addEventListener('click', function() {
                const orientation = this.dataset.orientation;
                console.log(`🔥 Прямой клик по кнопке ${index + 1}:`, orientation);
                selectOrientation(orientation);
            });
        });
    }
    
    // Обновляем кнопки навигации
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    prevBtn.style.display = step > 1 ? 'block' : 'none';
    nextBtn.style.display = step < totalSteps ? 'block' : 'none';
    submitBtn.style.display = step === totalSteps ? 'block' : 'none';
    
    console.log('🔘 Кнопки:', {
        prev: prevBtn.style.display,
        next: nextBtn.style.display,
        submit: submitBtn.style.display
    });
}

function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
        }
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

// Обработчик кнопки "Назад" в форме создания анкеты
function handleCreateAdBack() {
    if (currentStep > 1) {
        // Если не на первом шаге - возвращаемся на шаг назад
        previousStep();
    } else {
        // Если на первом шаге - возвращаемся в главное меню
        showMainMenu();
    }
}

// Функции для контроля возраста
function increaseAge(inputId) {
    const input = document.getElementById(inputId);
    let currentValue = parseInt(input.value);
    const maxValue = parseInt(input.max) || 100;
    
    // Если поле пустое, устанавливаем начальное значение
    if (isNaN(currentValue) || !input.value) {
        input.value = 18;
        validateAgeRange();
        return;
    }
    
    if (currentValue < maxValue) {
        input.value = currentValue + 1;
        validateAgeRange();
    }
}

function decreaseAge(inputId) {
    const input = document.getElementById(inputId);
    let currentValue = parseInt(input.value);
    const minValue = parseInt(input.min) || 18;
    
    // Если поле пустое, устанавливаем начальное значение
    if (isNaN(currentValue) || !input.value) {
        input.value = 18;
        validateAgeRange();
        return;
    }
    
    if (currentValue > minValue) {
        input.value = currentValue - 1;
        validateAgeRange();
    }
}

function validateAgeRange() {
    const ageFrom = document.getElementById('ageFrom');
    const ageTo = document.getElementById('ageTo');
    
    if (ageFrom && ageTo) {
        let fromValue = parseInt(ageFrom.value);
        let toValue = parseInt(ageTo.value);
        
        // Только проверяем и корректируем если значение введено полностью
        // Не мешаем пользователю вводить
        if (ageFrom.value && !isNaN(fromValue)) {
            // Проверяем минимальный возраст 18
            if (fromValue < 18) {
                ageFrom.value = 18;
                fromValue = 18;
            }
            // Проверяем максимальный возраст 99
            if (fromValue > 99) {
                ageFrom.value = 99;
                fromValue = 99;
            }
        }
        
        if (ageTo.value && !isNaN(toValue)) {
            // Проверяем минимальный возраст 18
            if (toValue < 18) {
                ageTo.value = 18;
                toValue = 18;
            }
            // Проверяем максимальный возраст 99
            if (toValue > 99) {
                ageTo.value = 99;
                toValue = 99;
            }
        }
        
        // Если оба поля заполнены и "от" больше "до", корректируем "до"
        if (ageFrom.value && ageTo.value && !isNaN(fromValue) && !isNaN(toValue)) {
            if (fromValue > toValue) {
                ageTo.value = fromValue;
            }
        }
    }
}

// Обновление счетчика символов для текста анкеты
function updateCharacterCount() {
    const textarea = document.getElementById('adText');
    const counter = document.getElementById('charCounter');
    
    if (textarea && counter) {
        const currentLength = textarea.value.length;
        const maxLength = textarea.getAttribute('maxlength') || 500;
        counter.textContent = `${currentLength}/${maxLength}`;
        
        // Меняем цвет если приближаемся к лимиту
        if (currentLength >= maxLength) {
            counter.style.color = 'var(--neon-pink)';
        } else if (currentLength >= maxLength * 0.9) {
            counter.style.color = 'var(--neon-orange)';
        } else {
            counter.style.color = 'var(--text-gray)';
        }
    }
}

// Валидация возраста с сообщением об ошибке
function validateAgeRangeWithMessage() {
    const ageFrom = document.getElementById('ageFrom');
    const ageTo = document.getElementById('ageTo');
    
    const fromValue = parseInt(ageFrom.value);
    const toValue = parseInt(ageTo.value);
    
    // Проверяем что значения введены
    if (!fromValue || isNaN(fromValue) || !toValue || isNaN(toValue)) {
        tg.showAlert('❌ Пожалуйста, укажите возраст партнера');
        return false;
    }
    
    // Проверяем диапазон
    if (fromValue < 18 || fromValue > 99 || toValue < 18 || toValue > 99) {
        tg.showAlert('❌ Пожалуйста, исправьте опечатку.\n\nВозраст должен быть от 18 до 99 лет.');
        return false;
    }
    
    // Проверяем что "от" не больше "до"
    if (fromValue > toValue) {
        tg.showAlert('❌ Возраст "От" не может быть больше "До"');
        return false;
    }
    
    return true;
}

function validateCurrentStep() {
    console.log(`🔍 Валидация шага ${currentStep}`, formData);
    
    switch(currentStep) {
        case 1: // Пол
            const hasGender = !!formData.gender;
            console.log(`Шаг 1 (Пол): ${hasGender ? '✅' : '❌'}`, formData.gender);
            return hasGender;
        case 2: // Кого ищет
            const hasTarget = !!formData.target;
            console.log(`Шаг 2 (Кого ищет): ${hasTarget ? '✅' : '❌'}`, formData.target);
            return hasTarget;
        case 3: // Цель
            const hasGoals = formData.goals && formData.goals.length > 0;
            console.log(`Шаг 3 (Цель): ${hasGoals ? '✅' : '❌'}`, formData.goals);
            if (!hasGoals) {
                tg.showAlert('Выберите хотя бы одну цель общения');
                return false;
            }
            // Обновляем formData.goal для обратной совместимости
            formData.goal = formData.goals.join(', ');
            return true;
        case 4: // Возраст партнера
            const ageFrom = document.getElementById('ageFrom').value;
            const ageTo = document.getElementById('ageTo').value;
            
            // Проверяем, что поля заполнены
            if (!ageFrom || !ageTo) {
                tg.showAlert('❌ Пожалуйста, укажите возраст партнера.\n\nИспользуйте кнопки + и - или введите возраст вручную.');
                return false;
            }
            
            const ageFromNum = parseInt(ageFrom);
            const ageToNum = parseInt(ageTo);
            
            // Проверяем диапазон 18-99
            if (ageFromNum < 18 || ageFromNum > 99 || ageToNum < 18 || ageToNum > 99) {
                tg.showAlert('❌ Пожалуйста, исправьте опечатку.\n\nВозраст должен быть от 18 до 99 лет.');
                return false;
            }
            
            // Проверяем, что "от" не больше "до"
            if (ageFromNum > ageToNum) {
                tg.showAlert('❌ Возраст "от" не может быть больше возраста "до"');
                return false;
            }
            
            formData.ageFrom = ageFrom;
            formData.ageTo = ageTo;
            console.log(`Шаг 4 (Возраст партнера): ✅ ${ageFrom}-${ageTo}`);
            return true;
        case 5: // Мой возраст
            const myAge = document.getElementById('myAge').value;
            const myAgeNum = parseInt(myAge);
            if (!myAge || isNaN(myAgeNum)) {
                tg.showAlert('❌ Пожалуйста, укажите ваш возраст');
                return false;
            }
            if (myAgeNum < 18 || myAgeNum > 99) {
                tg.showAlert('❌ Пожалуйста, исправьте опечатку.\n\nВозраст должен быть от 18 до 99 лет.');
                return false;
            }
            formData.myAge = myAge;
            console.log(`Шаг 5 (Мой возраст): ✅ ${myAge}`);
            return true;
        case 6: // Телосложение
            const hasBody = !!formData.body;
            console.log(`Шаг 6 (Телосложение): ${hasBody ? '✅' : '❌'}`, formData.body);
            return hasBody;
        case 7: // Ориентация
            const hasOrientation = !!formData.orientation;
            console.log(`Шаг 7 (Ориентация): ${hasOrientation ? '✅' : '❌'}`, formData.orientation);
            return hasOrientation;
        case 8: // Текст анкеты
            const adText = document.getElementById('adText')?.value.trim();
            const adTextArea = document.getElementById('adText');
            console.log(`Шаг 8 (Текст): textarea элемент:`, adTextArea);
            console.log(`Шаг 8 (Текст): значение:`, adText);
            if (adText && adText.length >= 10) {
                formData.text = adText;
                console.log(`Шаг 8 (Текст): ✅ ${adText.length} символов`);
                // Убираем красную границу если была
                if (adTextArea) {
                    adTextArea.style.borderColor = '';
                }
                return true;
            }
            console.log(`Шаг 8 (Текст): ❌ слишком короткий текст`);
            
            // Визуальная обратная связь
            if (adTextArea) {
                adTextArea.style.borderColor = '#ff0066';
                adTextArea.focus();
            }
            
            // Показываем сообщение пользователю
            const errorMessage = `Пожалуйста, введите текст анкеты\n\nМинимум 10 символов${adText ? `\nСейчас: ${adText.length} симв.` : ''}`;
            
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert(errorMessage);
            } else {
                alert(errorMessage);
            }
            
            return false;
    }
    return false;
}

// Обработчики выбора (старые функции удалены - используется новая система локации)

function selectGender(gender) {
    document.querySelectorAll('.gender-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`[data-gender="${gender}"]`).classList.add('selected');
    formData.gender = gender;
}

function selectTarget(target) {
    document.querySelectorAll('.target-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`[data-target="${target}"]`).classList.add('selected');
    formData.target = target;
}

function selectGoal(goal) {
    const btn = document.querySelector(`[data-goal="${goal}"]`);
    
    // Переключаем выбор (toggle)
    if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        // Удаляем из массива
        formData.goals = (formData.goals || []).filter(g => g !== goal);
    } else {
        btn.classList.add('selected');
        // Добавляем в массив
        formData.goals = formData.goals || [];
        formData.goals.push(goal);
    }
    
    // Сохраняем все цели через запятую для отправки
    formData.goal = (formData.goals || []).join(', ');
    
    console.log('Выбранные цели:', formData.goals, '| goal string:', formData.goal);
}

function selectBody(body) {
    document.querySelectorAll('[data-body]').forEach(btn => btn.classList.remove('selected'));
    const selectedBtn = document.querySelector(`[data-body="${body}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
        formData.body = body;
    }
}

function selectOrientation(orientation) {
    console.log('selectOrientation вызвана с:', orientation);
    document.querySelectorAll('[data-orientation]').forEach(btn => btn.classList.remove('selected'));
    const selectedBtn = document.querySelector(`[data-orientation="${orientation}"]`);
    console.log('Найдена кнопка:', selectedBtn);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
        formData.orientation = orientation;
        console.log('✅ Ориентация сохранена:', orientation, 'formData:', formData);
    } else {
        console.error('❌ Кнопка не найдена для ориентации:', orientation);
    }
}

// Отправка анкеты
async function submitAd() {
    // validateCurrentStep() сам показывает специфичные ошибки
    if (!validateCurrentStep()) {
        return;
    }

    try {
        // Получаем текст анкеты
        const adTextElement = document.getElementById('adText');
        const adText = adTextElement ? adTextElement.value.trim() : '';
        
        if (!adText) {
            tg.showAlert('Пожалуйста, введите текст анкеты');
            return;
        }
        
        // Получаем никнейм из localStorage (установлен на главной странице)
        const nickname = localStorage.getItem('user_nickname') || 'Аноним';
        
        console.log('📝 Никнейм из localStorage:', nickname);

        // Подготавливаем данные для отправки в Supabase
        const adData = {
            gender: formData.gender,
            target: formData.target,
            goal: formData.goal,
            ageFrom: formData.ageFrom,
            ageTo: formData.ageTo,
            myAge: formData.myAge,
            body: formData.body,
            orientation: formData.orientation, // Добавляем ориентацию
            text: adText,
            nickname: nickname, // Добавляем никнейм
            country: formData.country || 'Россия',
            region: formData.region || '',
            city: formData.city,
            // Используем новую функцию для получения ID
            tgId: getCurrentUserId()
        };

        safeLog('Отправка анкеты в Supabase');
        safeLog('Никнейм:', nickname);


        // Показываем индикатор загрузки
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Публикуем...';
        }

        // Отправляем в API через POST запрос
        const response = await fetch('/api/ads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...adData,
                user_token: localStorage.getItem('user_token') || null
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка при создании анкеты');
        }

        const result = await response.json();
        
        // Сохраняем user_token в localStorage
        if (result && result.ad && result.ad.user_token) {
            localStorage.setItem('user_token', result.ad.user_token);
        }
        
        // Обновляем статус Premium (лимиты изменились + возможна награда от рефералки)
        await loadPremiumStatus();
        
        console.log('[CREATE AD] Анкета создана, проверяем реферальную награду...');
        console.log('[CREATE AD] localStorage перед processReferralReward:', {
            referrer_token: localStorage.getItem('referrer_token'),
            referral_processed: localStorage.getItem('referral_processed'),
            referral_reward_processed: localStorage.getItem('referral_reward_processed'),
            user_token: localStorage.getItem('user_token')
        });
        
        // Обрабатываем реферальную награду (если пользователь пришел по реферальной ссылке)
        try {
            await processReferralReward();
            // После обработки рефералки снова обновляем статус - возможно выдан PRO
            await loadPremiumStatus();
        } catch (refError) {
            console.error('Ошибка обработки реферальной награды:', refError);
            // Не прерываем выполнение, анкета уже создана
        }
        
        // 🎀 Проверяем, нужно ли показать бонус для девушек
        if (result.showFemaleBonusModal) {
            console.log('[CREATE AD] 🎀 Показываем модалку бонуса для девушек');
            tg.showAlert(
                '🎀 БОНУС ДЛЯ ДЕВУШЕК!\n\n' +
                'Поздравляем! Ты получила статус PRO НАВСЕГДА! 💝\n\n' +
                '✨ Безлимит фото\n' +
                '✨ До 3 анкет в день\n' +
                '✨ Закрепление в TOP\n' +
                '✨ Значок PRO\n\n' +
                '⚠️ Важно: если создашь мужскую анкету, бонус будет потерян навсегда!',
                async () => {
                    // После закрытия модалки обновляем статус и показываем успех
                    await loadPremiumStatus();
                    showAdCreatedSuccess();
                }
            );
            return; // Прерываем стандартный flow
        }
        
        // 💔 Проверяем, потерян ли бонус
        if (result.femaleBonusLost) {
            console.log('[CREATE AD] 💔 Бонус для девушек потерян');
            tg.showAlert(
                '⚠️ БОНУС УТРАЧЕН\n\n' +
                'Вы создали мужскую анкету и потеряли бонус PRO для девушек.\n\n' +
                'Ваша анкета опубликована, но статус PRO больше недоступен.\n\n' +
                'Вы можете купить PRO в любое время через меню.',
                async () => {
                    await loadPremiumStatus();
                    showAdCreatedSuccess();
                }
            );
            return; // Прерываем стандартный flow
        }

        // Обычный успех (без бонуса)
        showAdCreatedSuccess();

        // Вынесли показ успеха в отдельную функцию для переиспользования
        function showAdCreatedSuccess() {
            const successMessages = [
                '✅ Анкета успешно опубликована!\n\nТеперь ждите новых знакомых 😎',
                '🔥 Го-го-го! Анкета в эфире!\n\nПриготовьтесь к сообщениям 💬',
                '🎉 БУМ! Анкета запущена!\n\nСейчас начнётся движуха 🚀',
                '⚡️ Готово! Вы в деле!\n\nЖдите лайки и сообщения 💌',
                '🎯 Анкета размещена успешно!\n\nВремя находить крутых людей 🌟'
            ];
            const randomSuccess = successMessages[Math.floor(Math.random() * successMessages.length)];
            tg.showAlert(randomSuccess, async () => {
                // Очищаем форму
                formData = {};
                currentStep = 1;
                // Финальное обновление статуса перед показом главного меню
                await loadPremiumStatus();
                updateAdLimitBadge(); // Обновляем счётчик анкет
                showScreen('mainMenu');
            });
        }

    } catch (error) {
        console.error('Ошибка создания анкеты:', error);
        
        // Проверяем ошибку лимита
        if (error.message && error.message.includes('создали 3 объявления сегодня')) {
            // PRO пользователь исчерпал дневной лимит - НЕ предлагаем купить PRO
            tg.showAlert('⏰ Вы создали все 3 анкеты сегодня (лимит PRO)\n\nСледующая анкета будет доступна завтра!');
        } else if (error.message && error.message.includes('лимит')) {
            // FREE пользователь или другие лимиты - предлагаем PRO
            if (error.message.includes('PRO') || error.message.includes('Оформите')) {
                tg.showConfirm(
                    error.message + '\n\nПодключить PRO сейчас?',
                    (confirmed) => {
                        if (confirmed) showPremiumModal();
                    }
                );
            } else {
                tg.showAlert('❌ ' + error.message);
            }
        } else {
            tg.showAlert('❌ Ошибка при публикации анкеты: ' + error.message);
        }
    } finally {
        // Восстанавливаем кнопку
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Опубликовать';
        }
    }
}

// Загрузка и отображение анкет
async function loadAds(filters = {}) {
    try {
        console.log('🔄 Загрузка анкет с фильтрами:', filters);
        // По умолчанию включаем компактный режим, если не задано ранее
        if (window.localStorage.getItem('ads_compact') === null) {
            window.localStorage.setItem('ads_compact', '1');
        }
        
        // Показываем индикатор загрузки
        const adsList = document.getElementById('adsList');
        if (adsList) {
            const compact = window.localStorage.getItem('ads_compact') === '1';
            adsList.classList.toggle('compact', compact);
            adsList.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Загружаем анкеты${compact ? ' (компактно)' : ''}...</p>
            `;
        }

        // Запрашиваем анкеты через Neon API
        const response = await fetch('/api/ads', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        const ads = result.ads || [];
        
        console.log('✅ Получено анкет:', ads.length);
        console.log('📋 первую анкету:', ads[0]);
        
        // Отображаем анкеты
        displayAds(ads, filters.city);

    } catch (error) {
        console.error('❌ Ошибка загрузки анкет:', error);
        const adsList = document.getElementById('adsList');
        if (adsList) {
            const compact = window.localStorage.getItem('ads_compact') === '1';
            adsList.classList.toggle('compact', compact);
            adsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">⚠️</div>
                    <h3>Ошибка загрузки</h3>
                    <p>${error.message}</p>
                    <button class="neon-button" onclick="loadAds()">🔄 Повторить</button>
                </div>
            `;
        }
    }
}

// Вспомогательная функция для получения всех анкет
async function getAllAds() {
    const response = await fetch('/api/ads', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    const ads = result.ads || [];
    
    // Сортируем: сначала закрепленные (и еще не истекшие), потом обычные по дате
    const now = new Date();
    return ads.sort((a, b) => {
        const aPinned = a.is_pinned && (!a.pinned_until || new Date(a.pinned_until) > now);
        const bPinned = b.is_pinned && (!b.pinned_until || new Date(b.pinned_until) > now);
        
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        // Если оба закреплены или оба не закреплены, сортируем по дате
        return new Date(b.created_at) - new Date(a.created_at);
    });
}

// Функция нормализации названий городов
function normalizeCity(cityName) {
    if (!cityName) return null;
    const normalized = cityName.trim();
    
    // Маппинг старых и новых названий
    const cityAliases = {
        'Алма-Ата': 'Алматы',
        'Алма-ата': 'Алматы',
        'алма-ата': 'Алматы',
        'Almaty': 'Алматы',
        'Ленинград': 'Санкт-Петербург',
        'Leningrad': 'Санкт-Петербург',
        'Свердловск': 'Екатеринбург'
    };
    
    return cityAliases[normalized] || normalized;
}

function displayAds(ads, city = null) {
    const adsList = document.getElementById('adsList');
    
    if (!ads || ads.length === 0) {
        adsList.innerHTML = `
            <div class="no-ads">
                <div class="neon-icon">😔</div>
                <h3>Пока нет анкет</h3>
                <p>Будьте первым, кто разместит анкету!</p>
            </div>
        `;
        return;
    }

    // Нормализуем название города для фильтрации
    const normalizedFilterCity = normalizeCity(city);
    
    // Фильтруем по городу если задан
    let filteredAds = normalizedFilterCity ? ads.filter(ad => {
        const normalizedAdCity = normalizeCity(ad.city);
        return normalizedAdCity === normalizedFilterCity;
    }) : ads;
    
    // Применяем фильтры
    filteredAds = filteredAds.filter(ad => {
        // Фильтр по полу
        if (adsFilters.gender !== 'all') {
            const genderLower = ad.gender?.toLowerCase();
            if (adsFilters.gender === 'male' && genderLower !== 'male' && genderLower !== 'мужчина') {
                return false;
            }
            if (adsFilters.gender === 'female' && genderLower !== 'female' && genderLower !== 'девушка') {
                return false;
            }
            if (adsFilters.gender === 'couple' && genderLower !== 'пара') {
                return false;
            }
        }
        
        // Фильтр по цели поиска
        if (adsFilters.target !== 'all') {
            const targetLower = ad.target?.toLowerCase();
            if (adsFilters.target === 'male' && targetLower !== 'male' && targetLower !== 'мужчину') {
                return false;
            }
            if (adsFilters.target === 'female' && targetLower !== 'female' && targetLower !== 'женщину' && targetLower !== 'девушку') {
                return false;
            }
            if (adsFilters.target === 'couple' && targetLower !== 'couple' && targetLower !== 'пару' && targetLower !== 'пара') {
                return false;
            }
        }
        
        // Фильтр по ориентации
        if (adsFilters.orientation !== 'all') {
            const orientationLower = ad.orientation?.toLowerCase();
            // Точное совпадение по data-orientation значениям из формы
            if (orientationLower !== adsFilters.orientation) {
                return false;
            }
        }
        
        // Фильтр по возрасту
        const age = parseInt(ad.my_age || ad.myAge);
        if (!isNaN(age)) {
            if (age < adsFilters.ageFrom || age > adsFilters.ageTo) {
                return false;
            }
        }
        
        return true;
    });
    
    // Если после фильтрации ничего не осталось
    if (filteredAds.length === 0) {
        adsList.innerHTML = `
            <div class="no-ads">
                <div class="neon-icon">🔍</div>
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить фильтры</p>
                <button class="neon-button" onclick="resetFilters()">Сбросить фильтры</button>
            </div>
        `;
        return;
    }
    
    // Сортируем: закрепленные вверху
    const now = new Date();
    filteredAds = filteredAds.sort((a, b) => {
        const aPinned = a.is_pinned && (!a.pinned_until || new Date(a.pinned_until) > now);
        const bPinned = b.is_pinned && (!b.pinned_until || new Date(b.pinned_until) > now);
        
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        return new Date(b.created_at) - new Date(a.created_at);
    });

    const compact = window.localStorage.getItem('ads_compact') === '1';
    if (compact) {
        adsList.classList.add('compact');
    } else {
        adsList.classList.remove('compact');
    }

    adsList.innerHTML = filteredAds.map((ad, index) => {
        // Supabase возвращает поля с подчёркиваниями (age_from, my_age и т.д.)
        const myAge = ad.my_age || ad.myAge || '?';
        const ageFrom = ad.age_from || ad.ageFrom || '?';
        const ageTo = ad.age_to || ad.ageTo || '?';
        const nickname = ad.display_nickname || 'Аноним';
        const isPinned = ad.is_pinned && (!ad.pinned_until || new Date(ad.pinned_until) > now);
        
        // Маппинг телосложения на читаемые значения
        const bodyLabels = {
            slim: 'Худощавое',
            athletic: 'Спортивное',
            average: 'Среднее',
            curvy: 'Полное',
            'Стройное': 'Стройное',
            'Обычное': 'Обычное',
            'Плотное': 'Плотное',
            'Спортивное': 'Спортивное',
            'Другое': 'Другое'
        };
        const bodyType = ad.body_type ? (bodyLabels[ad.body_type] || ad.body_type) : null;
        
        // Проверяем PRO статус
        const isPremium = ad.is_premium && (!ad.premium_until || new Date(ad.premium_until) > now);
        const premiumClass = isPremium ? 'premium-ad' : '';
        const premiumBadge = isPremium ? ' <span class="pro-badge">⭐</span>' : '';
        
        return `
        <div class="ad-card ${compact ? 'compact' : ''} ${premiumClass}" onclick="showAdDetails(${index})">
            ${isPinned ? '<span class="pinned-badge">📌 Закреплено</span>' : ''}
            <div class="ad-header">
                <h3>👤 ${nickname}${premiumBadge}</h3>
                <div class="created-at"><span class="icon">⏰</span> <span class="label">Создано:</span> <span class="value">${formatCreatedAt(ad.created_at)}</span></div>
            </div>
            <div class="ad-info">
                ${compact ? `
                <div class="ad-field"><span class="icon">🏙</span>${ad.city}</div>
                <div class="ad-field"><span class="icon">👤</span>${formatGender(ad.gender)}</div>
                <div class="ad-field"><span class="icon">🔍</span>${formatTarget(ad.target)}</div>
                <div class="ad-field"><span class="icon">🎯</span>${formatGoals(ad.goal)}</div>
                <div class="ad-field"><span class="icon">🎂</span>${myAge}л</div>
                <div class="ad-field"><span class="icon">📅</span>${ageFrom}-${ageTo}</div>
                ${bodyType ? `<div class="ad-field"><span class="icon">💪</span>${bodyType}</div>` : ''}
                ${ad.orientation ? `<div class="ad-field"><span class="icon">💗</span>${formatOrientation(ad.orientation)}</div>` : ''}
                ` : `
                <div class="ad-field">
                    <span class="icon">🏙</span>
                    <span class="label">Город:</span>
                    <span class="value">${ad.city}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">👤</span>
                    <span class="label">Пол:</span>
                    <span class="value">${formatGender(ad.gender)}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">🔍</span>
                    <span class="label">Ищет:</span>
                    <span class="value">${formatTarget(ad.target)}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">🎯</span>
                    <span class="label">Цель:</span>
                    <span class="value">${formatGoals(ad.goal)}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">🎂</span>
                    <span class="label">Мой возраст:</span>
                    <span class="value">${myAge} лет</span>
                </div>
                <div class="ad-field">
                    <span class="icon">📅</span>
                    <span class="label">Возраст партнера:</span>
                    <span class="value">${ageFrom} - ${ageTo} лет</span>
                </div>
                ${bodyType ? `
                <div class="ad-field">
                    <span class="icon">💪</span>
                    <span class="label">Телосложение:</span>
                    <span class="value">${bodyType}</span>
                </div>
                ` : ''}
                ${ad.orientation ? `
                <div class="ad-field">
                    <span class="icon">💗</span>
                    <span class="label">Ориентация:</span>
                    <span class="value">${formatOrientation(ad.orientation)}</span>
                </div>
                ` : ''}
                `}
            </div>
            <div class="ad-text">"${compact ? ad.text.substring(0, 70) : ad.text.substring(0, 100)}${ad.text.length > (compact ? 70 : 100) ? '...' : ''}"</div>
        </div>
    `;
    }).join('');
    
    // Сохраняем анкеты для showAdDetails
    window.currentAds = filteredAds;
}

function handleCityFilter(city) {
    // Сброс выбора
    document.querySelectorAll('.city-btn.filter').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Выбор нового города
    document.querySelector(`[data-city="${city}"].filter`).classList.add('selected');

    // Запрос анкет по городу
    tg.sendData(JSON.stringify({
        action: 'getAdsByCity',
        city: city
    }));
}

function showAdDetails(index) {
    const ad = window.currentAds?.[index];
    
    if (!ad) {
        tg.showAlert('Анкета не найдена');
        return;
    }
    
    const adContent = document.getElementById('adContent');
    if (!adContent) return;
    
    // Сохраняем индекс для кнопки "Написать автору"
    window.currentAdIndex = index;
    
    const myAge = ad.my_age || ad.myAge || '?';
    const ageFrom = ad.age_from || ad.ageFrom || '?';
    const ageTo = ad.age_to || ad.ageTo || '?';
    
    // Маппинг телосложения на читаемые значения
    const bodyLabels = {
        // Английские варианты (старые)
        slim: 'Худощавое',
        athletic: 'Спортивное',
        average: 'Среднее',
        curvy: 'Полное',
        // Русские варианты (новые)
        'Стройное': 'Стройное',
        'Обычное': 'Обычное',
        'Плотное': 'Плотное',
        'Спортивное': 'Спортивное',
        'Другое': 'Другое'
    };
    const bodyType = ad.body_type ? (bodyLabels[ad.body_type] || ad.body_type) : '?';
    const nickname = ad.display_nickname || 'Аноним';
    
    adContent.innerHTML = `
        <div class="ad-details-card">
            <div class="ad-details-header">
                <div class="ad-location">
                    <span class="location-icon">📍</span>
                    <span class="location-text">${ad.city}</span>
                </div>
                <div class="ad-date-badge">${new Date(ad.created_at).toLocaleDateString('ru-RU')}</div>
            </div>
            
            <div class="ad-author-info">
                <div class="author-avatar">👤</div>
                <div class="author-details">
                    <div class="author-name">${nickname}</div>
                    <div class="author-params">${ad.gender}, ${myAge} лет, ${bodyType}</div>
                </div>
            </div>
            
            <div class="ad-search-info">
                <div class="search-title">🔍 Ищет:</div>
                <div class="search-params">
                    <div class="param-item">
                        <span class="param-icon">👥</span>
                        <span>${formatTarget(ad.target)}, ${ageFrom}-${ageTo} лет</span>
                    </div>
                    <div class="param-item">
                        <span class="param-icon">🎯</span>
                        <span>${formatGoals(ad.goal)}</span>
                    </div>
                    ${ad.orientation ? `
                    <div class="param-item">
                        <span class="param-icon">💗</span>
                        <span>${formatOrientation(ad.orientation)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            ${ad.text ? `
            <div class="ad-description-box">
                <div class="description-title">💬 О себе:</div>
                <div class="description-text">${ad.text}</div>
            </div>
            ` : ''}
        </div>
    `;
    
    // Обновляем кнопку "Написать автору"
    const contactBtn = document.querySelector('#adDetails button.neon-button');
    if (contactBtn) {
        contactBtn.onclick = () => contactAuthor(index);
    }
    
    showScreen('adDetails');
}

// Переключение компактного режима списка анкет
function toggleAdsCompact() {
    const current = window.localStorage.getItem('ads_compact') === '1';
    window.localStorage.setItem('ads_compact', current ? '0' : '1');
    // Перезагружаем список с текущими фильтрами (используя уже отфильтрованные данные из памяти если есть)
    if (typeof loadAndRenderAds === 'function') {
        loadAndRenderAds();
    } else {
        // Фоллбек: пробуем перезагрузить по городу активному
        refreshAds();
    }
}

// Написать автору анкеты
async function contactAuthor(adIndex) {
    const ad = window.currentAds?.[adIndex];
    
    if (!ad) {
        tg.showAlert('Анкета не найдена');
        return;
    }
    
    // Проверяем авторизацию и получаем токен текущего пользователя
    const currentUserToken = localStorage.getItem('user_token');
    if (!currentUserToken || currentUserToken === 'null' || currentUserToken === 'undefined') {
        tg.showAlert('⚠️ Сначала создайте анкету или авторизуйтесь');
        return;
    }

    // Получаем токен автора объявления (user_token из ads)
    const authorToken = ad.user_token;
    if (!authorToken) {
        tg.showAlert('⚠️ Не удалось определить автора анкеты');
        return;
    }
    
    // Проверяем, не пытается ли пользователь написать самому себе
    if (currentUserToken === authorToken) {
        tg.showAlert('Вы не можете отправить сообщение на свою анкету');
        return;
    }
    
    // Проверяем, не заблокированы ли мы автором
    try {
        const blockCheckResponse = await fetch('/api/user-blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'is-blocked',
                params: {
                    blockerToken: authorToken,
                    blockedToken: currentUserToken
                }
            })
        });
        
        const blockCheckData = await blockCheckResponse.json();
        
        if (blockCheckData.success && blockCheckData.isBlocked) {
            tg.showAlert('Вы не можете создать чат с этим пользователем');
            return;
        }
    } catch (error) {
        console.error('Ошибка проверки блокировки:', error);
        // Продолжаем, если проверка не удалась
    }
    
    // Запрашиваем текст сообщения через кастомное модальное окно
    showCustomPrompt('Введите сообщение автору анкеты:', async (message) => {
        if (!message || message.trim() === '') {
            return;
        }
        
        try {
            await sendContactMessage(ad, authorToken, currentUserToken, message);
        } catch (error) {
            console.error('Error sending message:', error);
            tg.showAlert('❌ Ошибка при отправке сообщения: ' + error.message);
        }
    });
}

// Вспомогательная функция для отправки сообщения
async function sendContactMessage(ad, authorToken, currentUserToken, message) {
    try {
        // Проверяем, существует ли уже чат (используем токены)
        const checkResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'check-existing',
                params: { user1_token: currentUserToken, user2_token: authorToken, adId: ad.id }
            })
        });

        const checkResult = await checkResponse.json();

        if (checkResult.error) {
            console.error('Error checking existing chat:', checkResult.error);
            tg.showAlert('❌ Ошибка при проверке чата. Попробуйте позже.');
            return;
        }

        const existingChat = checkResult.data;

        if (existingChat) {
            if (existingChat.blocked_by) {
                tg.showAlert('❌ Чат заблокирован');
                return;
            }
            if (existingChat.accepted) {
                tg.showAlert('✅ Чат уже существует! Откройте раздел "Мои чаты"');
                return;
            } else {
                tg.showAlert('✅ Запрос уже отправлен! Ожидайте ответа от автора.');
                return;
            }
        }

        // Создаем новый запрос на чат (используем токены)
        const createResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create',
                params: { 
                    user1_token: currentUserToken, 
                    user2_token: authorToken, 
                    adId: ad.id,
                    message: message.trim()
                }
            })
        });

        const createResult = await createResponse.json();

        if (createResult.error) {
            console.error('Error creating chat request:', createResult.error);
            
            // Специальная обработка для лимита запросов
            if (createResult.error.message === 'LIMIT_REACHED') {
                tg.showConfirm(
                    '⚠️ Анкета перегружена запросами\n\n' +
                    'Эта анкета уже получила максимум запросов, на которые автор еще не ответил.\n\n' +
                    'Хотите получить PRO и написать автору в любом случае?',
                    (confirmed) => {
                        if (confirmed) {
                            showPremiumModal();
                        }
                    }
                );
            } else {
                tg.showAlert('❌ Ошибка при создании запроса на чат: ' + createResult.error.message);
            }
            return;
        }

        if (createResult.data) {
            // Отправляем уведомление в Telegram через бота
            try {
                await fetch('/api/send-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        receiverToken: authorToken, // Токен автора анкеты
                        receiverTgId: ad.tg_id, // Fallback на tg_id если есть
                        adId: ad.id,
                        messageText: message.trim()
                    })
                });
            } catch (notifyError) {
                console.warn('Notification failed:', notifyError);
                // Не прерываем выполнение, чат уже создан
            }

            tg.showAlert('✅ Запрос на чат отправлен!\n\nАвтор анкеты получит уведомление и сможет принять ваш запрос.');
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        tg.showAlert('❌ Ошибка при отправке сообщения. Попробуйте позже.');
    }
}

// Удалить мою анкету
async function deleteMyAd(adId) {
    tg.showConfirm('Вы уверены, что хотите удалить эту анкету?', async (confirmed) => {
        if (!confirmed) return;
        await performDeleteAd(adId);
    });
}

async function performDeleteAd(adId) {
    try {
        // Определяем текущего пользователя (предпочтительно Telegram ID)
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');

        if ((!userId || userId.startsWith('web_')) && !userToken) {
            tg.showAlert('❌ Требуется авторизация через Telegram');
            return;
        }

        // Отправляем запрос на сервер для удаления
        const response = await fetch('/api/ads', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: adId,
                tgId: (userId && !userId.startsWith('web_')) ? userId : undefined,
                userToken: userToken || undefined
            })
        });

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error.message || result.error || 'Ошибка сервера');
        }

        // API возвращает success=true если запись удалена
        const deleted = result.success === true || result.deleted === true;

        if (deleted) {
            const deleteMessages = [
                '🗑️ Анкета удалена успешно!\n\nНе переживай, можно создать новую 💪',
                '👋 Прощай, анкета!\n\nНе грусти, находи новых друзей 🌟',
                '💨 Пуф! И анкеты больше нет!\n\nГотов к новым экспериментам? 😎',
                '🔥 Анкета сгорела дотла!\n\nМесто для новой свободно 🎯'
            ];
            const randomDelete = deleteMessages[Math.floor(Math.random() * deleteMessages.length)];
            tg.showAlert(randomDelete);
            // Перезагружаем список
            loadMyAds();
            // Обновляем лимиты (used/remaining) после удаления
            await loadPremiumStatus();
        } else {
            tg.showAlert('❌ Не удалось удалить анкету\n\nПопробуй ещё раз, БРО 🤷');
        }
    } catch (error) {
        console.error('Error deleting ad:', error);
        tg.showAlert('❌ Ошибка при удалении анкеты');
    }
}

// Закрепить/открепить мою анкету
async function pinMyAd(adId, shouldPin) {
    try {
        // Если закрепляем - проверяем лимит
        if (shouldPin) {
            // Проверяем лимит закрепления
            if (userPremiumStatus.limits && userPremiumStatus.limits.pin) {
                const pinLimit = userPremiumStatus.limits.pin;
                if (!pinLimit.canUse) {
                    if (userPremiumStatus.isPremium) {
                        tg.showAlert('Вы уже использовали 3 закрепления сегодня (лимит PRO). Попробуйте завтра!');
                    } else {
                        tg.showConfirm(
                            'Закрепление доступно раз в 3 дня для FREE.\nОформите PRO для 3 закреплений в день по 1 часу!',
                            (confirmed) => {
                                if (confirmed) showPremiumModal();
                            }
                        );
                    }
                    return;
                }
            }
        }
        
        // Отправляем запрос на сервер
        let userToken = localStorage.getItem('user_token');
        let userId = null;
        
        // Определяем тип пользователя
        if (!userToken || userToken === 'null' || userToken === 'undefined') {
            userId = getCurrentUserId();
            if (!userId || userId.startsWith('web_')) {
                tg.showAlert('❌ Требуется авторизация через Telegram');
                return;
            }
            userToken = null; // Telegram пользователь
        }
        
        // Рассчитываем время закрепления (1 час)
        const pinnedUntil = shouldPin ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null;
        
        const requestBody = {
            id: adId,
            is_pinned: shouldPin,
            pinned_until: pinnedUntil
        };
        
        // Добавляем идентификатор в зависимости от типа пользователя
        if (userToken) {
            requestBody.user_token = userToken;
        } else {
            requestBody.tgId = userId;
        }
        
        const response = await fetch('/api/ads', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error || 'Ошибка сервера');
        }
        
        const pinned = result.success;
        
        if (pinned) {
            if (shouldPin) {
                // Обновляем статус Premium (лимиты изменились)
                await loadPremiumStatus();
                
                tg.showAlert('✅ Функция успешно оплачена и включена!\n\nВаша анкета будет закреплена поверх других на 1 час.');
            } else {
                tg.showAlert('✅ Анкета откреплена');
            }
            // Перезагружаем список
            loadMyAds();
        } else {
            tg.showAlert('❌ Не удалось изменить статус закрепления');
        }
    } catch (error) {
        console.error('Error pinning ad:', error);
        
        // Проверяем ошибку лимита
        if (error.message && error.message.includes('Закрепление доступно через')) {
            // FREE пользователь - можно раз в 3 дня
            const match = error.message.match(/через (\d+)ч/);
            const hours = match ? match[1] : '72';
            
            const message = `⏰ Следующее закрепление доступно через ${hours} часов\n\n💎 С PRO подпиской:\n• 3 закрепления в день\n• По 1 часу каждое\n• Значок PRO в анкетах\n\nПодключить PRO?`;
            
            tg.showConfirm(
                message,
                (confirmed) => {
                    if (confirmed) showPremiumModal();
                }
            );
        } else if (error.message && error.message.includes('использовали 3 закрепления сегодня')) {
            // PRO пользователь исчерпал дневной лимит - НЕ предлагаем купить PRO
            tg.showAlert('⏰ Вы использовали все 3 закрепления сегодня (лимит PRO)\n\nСледующее закрепление будет доступно завтра!');
        } else if (error.message && error.message.includes('лимит')) {
            // Другие лимиты - предлагаем PRO
            if (error.message.includes('PRO') || error.message.includes('Оформите')) {
                tg.showConfirm(
                    error.message + '\n\nПодключить PRO сейчас?',
                    (confirmed) => {
                        if (confirmed) showPremiumModal();
                    }
                );
            } else {
                tg.showAlert('❌ ' + error.message);
            }
        } else {
            tg.showAlert('❌ Ошибка при изменении статуса закрепления');
        }
    }
}

// Автоопределение локации - вызываем async версию
function autoDetectLocation() {
    console.log('autoDetectLocation вызвана - запускаем автоопределение');
    autoDetectLocationAsync();
}

// Сброс формы
function resetForm() {
    formData = {};
    currentStep = 1;
    
    // Сброс всех выборов
    document.querySelectorAll('.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Очистка полей
    document.getElementById('customCity').value = '';
    document.getElementById('ageFrom').value = '';
    document.getElementById('ageTo').value = '';
    document.getElementById('myAge').value = '';
    document.getElementById('adText').value = '';
    
    showStep(1);
}

// Функция загрузки Email Service
async function loadEmailService() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = './email-service.js';
        script.onload = () => {
            console.log('✅ Email Service загружен');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ Ошибка загрузки Email Service');
            reject(new Error('Failed to load Email Service'));
        };
        document.head.appendChild(script);
    });
}

// Обработка данных от бота
if (tg && typeof tg.onEvent === 'function') {
    tg.onEvent('web_app_data_received', function(data) {
        try {
            const response = JSON.parse(data);
            
            switch(response.action) {
                case 'adsLoaded':
                    displayAds(response.ads);
                    break;
                case 'cityAdsLoaded':
                    displayAds(response.ads, response.city);
                    break;
                case 'adCreated':
                    tg.showAlert('Анкета создана!');
                    showMainMenu();
                    break;
                default:
                    console.log('Unknown response:', response);
            }
        } catch (error) {
            console.error('Error parsing bot data:', error);
        }
    });
} else {
    console.log('Telegram WebApp API not available (crawler/bot detected)');
}

// Данные локаций
const locationData = {
    russia: {
        name: 'Россия',
        flag: '🇷🇺',
        regions: {
            'Москва': ['Москва', 'Балашиха', 'Подольск', 'Химки', 'Королёв', 'Мытищи', 'Люберцы', 'Красногорск', 'Электросталь', 'Коломна', 'Одинцово'],
            'Санкт-Петербург': ['Санкт-Петербург'],
            'Севастополь': ['Севастополь'],
            
            // Области
            'Ленинградская область': ['Гатчина', 'Выборг', 'Сосновый Бор', 'Тихвин', 'Кириши', 'Волхов'],
            'Новосибирская область': ['Новосибирск', 'Бердск', 'Искитим', 'Куйбышев', 'Обь'],
            'Свердловская область': ['Екатеринбург', 'Нижний Тагил', 'Каменск-Уральский', 'Первоуральск', 'Серов'],
            'Ростовская область': ['Ростов-на-Дону', 'Таганрог', 'Шахты', 'Новочеркасск', 'Волгодонск'],
            'Челябинская область': ['Челябинск', 'Магнитогорск', 'Златоуст', 'Миасс', 'Копейск'],
            'Нижегородская область': ['Нижний Новгород', 'Дзержинск', 'Арзамас', 'Саров', 'Бор'],
            'Самарская область': ['Самара', 'Тольятти', 'Сызрань', 'Новокуйбышевск', 'Чапаевск'],
            'Омская область': ['Омск', 'Тара', 'Калачинск', 'Исилькуль'],
            'Воронежская область': ['Воронеж', 'Борисоглебск', 'Россошь', 'Лиски'],
            'Волгоградская область': ['Волгоград', 'Волжский', 'Камышин', 'Михайловка'],
            'Пермский край': ['Пермь', 'Березники', 'Соликамск', 'Чайковский', 'Кунгур'],
            'Саратовская область': ['Саратов', 'Энгельс', 'Балаково', 'Вольск'],
            'Тюменская область': ['Тюмень', 'Тобольск', 'Ишим', 'Ялуторовск'],
            'Кемеровская область': ['Кемерово', 'Новокузнецк', 'Прокопьевск', 'Междуреченск'],
            'Томская область': ['Томск', 'Северск', 'Стрежевой', 'Асино'],
            'Тульская область': ['Тула', 'Новомосковск', 'Алексин', 'Узловая'],
            'Ярославская область': ['Ярославль', 'Рыбинск', 'Переславль-Залесский', 'Тутаев'],
            'Иркутская область': ['Иркутск', 'Братск', 'Ангарск', 'Усть-Илимск'],
            'Владимирская область': ['Владимир', 'Ковров', 'Муром', 'Александров'],
            'Ивановская область': ['Иваново', 'Кинешма', 'Шуя', 'Вичуга'],
            'Тверская область': ['Тверь', 'Ржев', 'Вышний Волочек', 'Кимры'],
            'Оренбургская область': ['Оренбург', 'Орск', 'Новотроицк', 'Бузулук'],
            'Белгородская область': ['Белгород', 'Старый Оскол', 'Губкин', 'Алексеевка'],
            'Рязанская область': ['Рязань', 'Касимов', 'Скопин', 'Сасово'],
            'Липецкая область': ['Липецк', 'Елец', 'Грязи', 'Данков'],
            'Пензенская область': ['Пенза', 'Кузнецк', 'Заречный', 'Сурск'],
            'Астраханская область': ['Астрахань', 'Ахтубинск', 'Камызяк', 'Знаменск'],
            'Калужская область': ['Калуга', 'Обнинск', 'Людиново', 'Киров'],
            'Курская область': ['Курск', 'Железногорск', 'Курчатов', 'Льгов'],
            'Кировская область': ['Киров', 'Кирово-Чепецк', 'Вятские Поляны', 'Слободской'],
            'Костромская область': ['Кострома', 'Буй', 'Нерехта', 'Волгореченск'],
            'Брянская область': ['Брянск', 'Клинцы', 'Новозыбков', 'Дятьково'],
            'Смоленская область': ['Смоленск', 'Вязьма', 'Рославль', 'Сафоново'],
            'Орловская область': ['Орёл', 'Ливны', 'Мценск', 'Болхов'],
            'Тамбовская область': ['Тамбов', 'Мичуринск', 'Рассказово', 'Моршанск'],
            'Ульяновская область': ['Ульяновск', 'Димитровград', 'Инза', 'Новоульяновск'],
            'Курганская область': ['Курган', 'Шадринск', 'Петухово', 'Далматово'],
            'Вологодская область': ['Вологда', 'Череповец', 'Сокол', 'Великий Устюг'],
            'Архангельская область': ['Архангельск', 'Северодвинск', 'Котлас', 'Новодвинск'],
            'Мурманская область': ['Мурманск', 'Апатиты', 'Мончегорск', 'Кандалакша'],
            'Новгородская область': ['Великий Новгород', 'Боровичи', 'Старая Русса', 'Валдай'],
            'Псковская область': ['Псков', 'Великие Луки', 'Остров', 'Печоры'],
            'Амурская область': ['Благовещенск', 'Белогорск', 'Свободный', 'Тында', 'Зея'],
            'Сахалинская область': ['Южно-Сахалинск', 'Корсаков', 'Холмск', 'Оха'],
            'Магаданская область': ['Магадан', 'Сусуман', 'Ола'],
            'Калининградская область': ['Калининград', 'Советск', 'Черняховск', 'Балтийск'],
            
            // Края
            'Краснодарский край': ['Краснодар', 'Сочи', 'Новороссийск', 'Армавир', 'Геленджик', 'Анапа'],
            'Красноярский край': ['Красноярск', 'Норильск', 'Ачинск', 'Канск', 'Минусинск'],
            'Приморский край': ['Владивосток', 'Находка', 'Уссурийск', 'Артём', 'Дальнегорск'],
            'Ставропольский край': ['Ставрополь', 'Пятигорск', 'Кисловодск', 'Невинномысск', 'Ессентуки'],
            'Хабаровский край': ['Хабаровск', 'Комсомольск-на-Амуре', 'Амурск', 'Советская Гавань'],
            'Алтайский край': ['Барнаул', 'Бийск', 'Рубцовск', 'Новоалтайск'],
            'Забайкальский край': ['Чита', 'Краснокаменск', 'Борзя', 'Петровск-Забайкальский'],
            'Камчатский край': ['Петропавловск-Камчатский', 'Елизово', 'Вилючинск'],
            
            // Республики
            'Татарстан': ['Казань', 'Набережные Челны', 'Нижнекамск', 'Альметьевск', 'Зеленодольск'],
            'Башкортостан': ['Уфа', 'Стерлитамак', 'Салават', 'Нефтекамск', 'Октябрьский'],
            'Дагестан': ['Махачкала', 'Хасавюрт', 'Дербент', 'Каспийск', 'Буйнакск'],
            'Якутия': ['Якутск', 'Нерюнгри', 'Мирный', 'Ленск'],
            'Бурятия': ['Улан-Удэ', 'Северобайкальск', 'Гусиноозерск'],
            'Чувашия': ['Чебоксары', 'Новочебоксарск', 'Канаш', 'Алатырь'],
            'Удмуртия': ['Ижевск', 'Сарапул', 'Воткинск', 'Глазов'],
            'Мордовия': ['Саранск', 'Рузаевка', 'Ковылкино', 'Темников'],
            'Марий Эл': ['Йошкар-Ола', 'Волжск', 'Козьмодемьянск'],
            'Коми': ['Сыктывкар', 'Ухта', 'Воркута', 'Печора'],
            'Карелия': ['Петрозаводск', 'Кондопога', 'Костомукша', 'Сегежа'],
            'Алтай': ['Горно-Алтайск', 'Кош-Агач', 'Майма'],
            'Хакасия': ['Абакан', 'Черногорск', 'Саяногорск', 'Абаза'],
            'Тыва': ['Кызыл', 'Ак-Довурак', 'Шагонар'],
            'Кабардино-Балкария': ['Нальчик', 'Прохладный', 'Баксан', 'Майский'],
            'Карачаево-Черкесия': ['Черкесск', 'Карачаевск', 'Усть-Джегута'],
            'Северная Осетия': ['Владикавказ', 'Беслан', 'Ардон', 'Моздок'],
            'Чечня': ['Грозный', 'Аргун', 'Гудермес', 'Шали'],
            'Ингушетия': ['Магас', 'Назрань', 'Карабулак', 'Малгобек'],
            'Адыгея': ['Майкоп', 'Адыгейск'],
            'Калмыкия': ['Элиста', 'Городовиковск', 'Лагань'],
            
            // Автономные округа
            'Ханты-Мансийский АО': ['Ханты-Мансийск', 'Сургут', 'Нижневартовск', 'Нефтеюганск'],
            'Ямало-Ненецкий АО': ['Салехард', 'Новый Уренгой', 'Ноябрьск', 'Надым'],
            'Ненецкий АО': ['Нарьян-Мар'],
            'Чукотский АО': ['Анадырь', 'Билибино', 'Певек'],
            'Еврейская АО': ['Биробиджан', 'Облучье']
        }
    },
    kazakhstan: {
        name: 'Казахстан',
        flag: '🇰🇿',
        regions: {
            'Алматинская область': ['Алматы', 'Талдыкорган', 'Капчагай', 'Текели', 'Жаркент'],
            'Акмолинская область': ['Астана', 'Кокшетау', 'Степногорск'],
            'Шымкент': ['Шымкент'],
            'Актюбинская область': ['Актобе', 'Хромтау', 'Алга', 'Темир'],
            'Атырауская область': ['Атырау', 'Кульсары', 'Жылыой'],
            'Западно-Казахстанская область': ['Уральск', 'Аксай', 'Казталовка'],
            'Карагандинская область': ['Караганда', 'Темиртау', 'Жезказган', 'Балхаш'],
            'Костанайская область': ['Костанай', 'Рудный', 'Житикара', 'Лисаковск'],
            'Мангистауская область': ['Актау', 'Жанаозен', 'Бейнеу'],
            'Павлодарская область': ['Павлодар', 'Экибастуз', 'Аксу'],
            'Северо-Казахстанская область': ['Петропавловск', 'Булаево', 'Тайынша'],
            'Восточно-Казахстанская область': ['Усть-Каменогорск', 'Семей', 'Риддер', 'Зыряновск'],
            'Жамбылская область': ['Тараз', 'Жанатас', 'Каратау', 'Шу'],
            'Кызылординская область': ['Кызылорда', 'Байконур', 'Арал']
        }
    },
    belarus: {
        name: 'Беларусь',
        flag: '🇧🇾',
        regions: {
            'Минская область': ['Минск', 'Жодино', 'Борисов', 'Солигорск', 'Слуцк', 'Молодечно', 'Дзержинск'],
            'Гомельская область': ['Гомель', 'Мозырь', 'Речица', 'Жлобин', 'Светлогорск', 'Калинковичи'],
            'Могилёвская область': ['Могилёв', 'Бобруйск', 'Горки', 'Осиповичи', 'Кричев'],
            'Витебская область': ['Витебск', 'Орша', 'Новополоцк', 'Полоцк', 'Глубокое'],
            'Гродненская область': ['Гродно', 'Лида', 'Слоним', 'Волковыск', 'Новогрудок'],
            'Брестская область': ['Брест', 'Барановичи', 'Пинск', 'Кобрин', 'Берёза']
        }
    },
    ukraine: {
        name: 'Украина',
        flag: '🇺🇦',
        regions: {
            'Киев': ['Киев'],
            'Киевская область': ['Белая Церковь', 'Бровары', 'Буча', 'Ирпень', 'Вышгород'],
            'Харьковская область': ['Харьков', 'Изюм', 'Купянск', 'Лозовая', 'Первомайский'],
            'Одесская область': ['Одесса', 'Черноморск', 'Измаил', 'Белгород-Днестровский'],
            'Днепропетровская область': ['Днепр', 'Кривой Рог', 'Каменское', 'Никополь', 'Павлоград'],
            'Донецкая область': ['Мариуполь', 'Краматорск', 'Славянск', 'Покровск'],
            'Запорожская область': ['Запорожье', 'Мелитополь', 'Бердянск', 'Энергодар'],
            'Львовская область': ['Львов', 'Дрогобыч', 'Червоноград', 'Стрый', 'Борислав'],
            'Полтавская область': ['Полтава', 'Кременчуг', 'Миргород', 'Лубны'],
            'Винницкая область': ['Винница', 'Хмельник', 'Жмеринка', 'Могилёв-Подольский'],
            'Черниговская область': ['Чернигов', 'Нежин', 'Прилуки', 'Новгород-Северский'],
            'Черкасская область': ['Черкассы', 'Умань', 'Смела', 'Золотоноша'],
            'Херсонская область': ['Херсон', 'Каховка', 'Новая Каховка', 'Скадовск'],
            'Николаевская область': ['Николаев', 'Первомайск', 'Вознесенск', 'Южноукраинск'],
            'Житомирская область': ['Житомир', 'Бердичев', 'Коростень', 'Новоград-Волынский'],
            'Сумская область': ['Сумы', 'Конотоп', 'Шостка', 'Ромны'],
            'Хмельницкая область': ['Хмельницкий', 'Каменец-Подольский', 'Шепетовка', 'Славута'],
            'Ровненская область': ['Ровно', 'Дубно', 'Вараш', 'Костополь'],
            'Ивано-Франковская область': ['Ивано-Франковск', 'Коломыя', 'Калуш', 'Надворная'],
            'Тернопольская область': ['Тернополь', 'Чортков', 'Кременец', 'Бережаны'],
            'Волынская область': ['Луцк', 'Ковель', 'Нововолынск', 'Владимир-Волынский'],
            'Закарпатская область': ['Ужгород', 'Мукачево', 'Хуст', 'Берегово'],
            'Черновицкая область': ['Черновцы', 'Хотин', 'Новоднестровск'],
            'Кировоградская область': ['Кропивницкий', 'Александрия', 'Светловодск']
        }
    },
    kyrgyzstan: {
        name: 'Кыргызстан',
        flag: '🇰🇬',
        regions: {
            'Бишкек': ['Бишкек'],
            'Ош': ['Ош'],
            'Чуйская область': ['Токмок', 'Кара-Балта', 'Кант', 'Сокулук'],
            'Ошская область': ['Узген', 'Кара-Суу', 'Ноокат'],
            'Джалал-Абадская область': ['Джалал-Абад', 'Кара-Куль', 'Майлуу-Суу', 'Таш-Кумыр'],
            'Иссык-Кульская область': ['Каракол', 'Балыкчы', 'Чолпон-Ата'],
            'Нарынская область': ['Нарын', 'Ат-Баши'],
            'Таласская область': ['Талас', 'Кара-Буура'],
            'Баткенская область': ['Баткен', 'Кызыл-Кыя', 'Сулюкта']
        }
    },
    tajikistan: {
        name: 'Таджикистан',
        flag: '🇹🇯',
        regions: {
            'Душанбе': ['Душанбе'],
            'Согдийская область': ['Худжанд', 'Бустон', 'Истаравшан', 'Исфара', 'Канибадам'],
            'Хатлонская область': ['Куляб', 'Курган-Тюбе', 'Нурек', 'Турсунзаде'],
            'РРП': ['Вахдат', 'Гиссар', 'Рогун', 'Рашт'],
            'ГБАО': ['Хорог', 'Мургаб', 'Ишкашим']
        }
    },
    uzbekistan: {
        name: 'Узбекистан',
        flag: '🇺🇿',
        regions: {
            'Ташкент': ['Ташкент'],
            'Ташкентская область': ['Алмалык', 'Ангрен', 'Чирчик', 'Бекабад'],
            'Самаркандская область': ['Самарканд', 'Каттакурган', 'Ургут', 'Джума'],
            'Бухарская область': ['Бухара', 'Каган', 'Галляарал'],
            'Наманганская область': ['Наманган', 'Чуст', 'Учкурган', 'Хаккулабад'],
            'Андижанская область': ['Андижан', 'Асака', 'Маргилан', 'Шахрихан'],
            'Ферганская область': ['Фергана', 'Коканд', 'Кувасай', 'Маргелан'],
            'Кашкадарьинская область': ['Карши', 'Шахрисабз', 'Мубарек', 'Китаб'],
            'Сурхандарьинская область': ['Термез', 'Денау', 'Шерабад'],
            'Сырдарьинская область': ['Гулистан', 'Янгиер', 'Ширин'],
            'Джизакская область': ['Джизак', 'Зарбдор', 'Дустлик'],
            'Навоийская область': ['Навои', 'Зарафшан', 'Учкудук'],
            'Хорезмская область': ['Ургенч', 'Хива', 'Шават'],
            'Каракалпакстан': ['Нукус', 'Турткуль', 'Кунград', 'Муйнак']
        }
    },
    armenia: {
        name: 'Армения',
        flag: '🇦🇲',
        regions: {
            'Ереван': ['Ереван'],
            'Арагацотнская область': ['Аштарак', 'Апаран', 'Талин'],
            'Араратская область': ['Арташат', 'Масис', 'Веди'],
            'Армавирская область': ['Армавир', 'Эчмиадзин', 'Вагаршапат'],
            'Гегаркуникская область': ['Гавар', 'Севан', 'Варденис'],
            'Котайкская область': ['Абовян', 'Чаренцаван', 'Разан'],
            'Лорийская область': ['Ванадзор', 'Алаверди', 'Степанаван'],
            'Сюникская область': ['Капан', 'Горис', 'Мегри'],
            'Тавушская область': ['Иджеван', 'Дилижан', 'Берд'],
            'Вайоцдзорская область': ['Ехегнадзор', 'Вайк', 'Джермук'],
            'Ширакская область': ['Гюмри', 'Артик', 'Маралик']
        }
    },
    azerbaijan: {
        name: 'Азербайджан',
        flag: '🇦🇿',
        regions: {
            'Баку': ['Баку'],
            'Гянджа': ['Гянджа'],
            'Сумгайыт': ['Сумгайыт'],
            'Абшеронский район': ['Хырдалан', 'Маштага', 'Нардаран'],
            'Агдамский район': ['Агдам'],
            'Агджабединский район': ['Агджабеди'],
            'Агстафинский район': ['Агстафа'],
            'Барда': ['Барда'],
            'Гёйчай': ['Гёйчай'],
            'Ленкорань': ['Ленкорань'],
            'Мингечаур': ['Мингечаур'],
            'Нахчыван': ['Нахчыван'],
            'Шеки': ['Шеки'],
            'Ширван': ['Ширван'],
            'Загатала': ['Загатала']
        }
    },
    moldova: {
        name: 'Молдова',
        flag: '🇲🇩',
        regions: {
            'Кишинёв': ['Кишинёв'],
            'Бельцы': ['Бельцы'],
            'Тирасполь': ['Тирасполь'],
            'Бендеры': ['Бендеры'],
            'Рыбница': ['Рыбница'],
            'Кагул': ['Кагул'],
            'Унгены': ['Унгены'],
            'Сороки': ['Сороки'],
            'Оргеев': ['Оргеев'],
            'Страшены': ['Страшены'],
            'Единцы': ['Единцы'],
            'Комрат': ['Комрат']
        }
    },
    georgia: {
        name: 'Грузия',
        flag: '🇬🇪',
        regions: {
            'Тбилиси': ['Тбилиси'],
            'Кутаиси': ['Кутаиси'],
            'Батуми': ['Батуми'],
            'Рустави': ['Рустави'],
            'Гори': ['Гори'],
            'Зугдиди': ['Зугдиди'],
            'Поти': ['Поти'],
            'Кобулети': ['Кобулети'],
            'Хашури': ['Хашури'],
            'Самтредиа': ['Самтредиа'],
            'Сенаки': ['Сенаки'],
            'Телави': ['Телави'],
            'Мцхета': ['Мцхета'],
            'Ахалцихе': ['Ахалцихе'],
            'Ткибули': ['Ткибули']
        }
    }
};

// Переменные для системы локации
let selectedCountry = null;
let selectedRegion = null;
let selectedCity = null;

// Переменные для настройки локации
let setupSelectedCountry = null;
let setupSelectedRegion = null;
let setupSelectedCity = null;

// Сохраненная локация пользователя (глобальная переменная для UI)
let currentUserLocation = null;

// Переменные для фильтра в просмотре анкет
let filterSelectedCountry = null;
let filterSelectedRegion = null;
let filterSelectedCity = null;

// Проверка сохраненной локации пользователя
async function checkUserLocation() {
    console.log('checkUserLocation вызвана');
    
    // Проверяем наличие никнейма - если есть, значит пользователь уже прошёл онбординг
    const hasNickname = localStorage.getItem('user_nickname') || localStorage.getItem('userNickname');
    
    try {
        // Приоритет 1: Загружаем локацию из БД
        const tgId = tg?.initDataUnsafe?.user?.id;
        const userToken = localStorage.getItem('user_token');
        
        if (tgId || userToken) {
            console.log('📍 Загружаем локацию из БД...');
            
            let url = '/api/users?';
            if (tgId) {
                url += `tgId=${tgId}`;
            } else if (userToken) {
                url += `userToken=${userToken}`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success && data.location) {
                currentUserLocation = data.location;
                // Синхронизируем с localStorage
                localStorage.setItem('userLocation', JSON.stringify(currentUserLocation));
                console.log('✅ Локация загружена из БД:', currentUserLocation);
                displayUserLocation();
                await checkOnboardingStatus();
                return;
            } else {
                console.log('📍 Локация не найдена в БД');
            }
        }
        
        // Приоритет 2: Проверяем localStorage (если БД недоступна)
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            currentUserLocation = JSON.parse(savedLocation);
            console.log('✅ Локация загружена из localStorage:', currentUserLocation);
            displayUserLocation();
            await checkOnboardingStatus();
            return;
        }
        
        // Приоритет 3: Telegram Cloud Storage (для старых пользователей)
        if (supportsCloudStorage()) {
            tg.CloudStorage.getItem('userLocation', async function(err, value) {
                if (!err && value) {
                    currentUserLocation = JSON.parse(value);
                    console.log('✅ Локация загружена из Cloud Storage:', currentUserLocation);
                    displayUserLocation();
                    await checkOnboardingStatus();
                } else {
                    handleNoLocation(hasNickname);
                }
            });
        } else {
            handleNoLocation(hasNickname);
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки локации:', error);
        handleNoLocation(hasNickname);
    }
}

// Обработка отсутствия локации
function handleNoLocation(hasNickname) {
    console.log('📍 Сохраненной локации нет');
    if (hasNickname) {
        console.log('Никнейм есть, но локация потерялась - запускаем автоопределение');
        showAutoLocationDetection();
    } else {
        console.log('Ждём установки никнейма, автоопределение будет после');
        checkOnboardingStatus();
    }
}

// Проверяем статус онбординга пользователя
async function checkOnboardingStatus() {
    console.log('checkOnboardingStatus вызвана');
    try {
        // Проверяем, не открыто ли уже модальное окно никнейма
        const nicknameModal = document.getElementById('requiredNicknameModal');
        if (nicknameModal && nicknameModal.style.display === 'flex') {
            console.log('⚠️ Модальное окно никнейма уже открыто, пропускаем checkOnboardingStatus');
            return;
        }
        
        // Сначала проверяем локальное хранилище
        const localNickname = localStorage.getItem('userNickname');
        if (localNickname && localNickname.trim() !== '') {
            console.log('✅ Никнейм найден в localStorage:', localNickname);
            showMainMenu();
            return;
        }
        
        // Получаем tgId или userToken пользователя
        let tgId = null;
        let userToken = localStorage.getItem('user_token');
        const authMethod = localStorage.getItem('auth_method');
        
        console.log('checkOnboardingStatus - authMethod:', authMethod, 'userToken:', userToken ? 'есть' : 'нет');
        
        if (isTelegramWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
            tgId = window.Telegram.WebApp.initDataUnsafe.user.id;
        } else {
            try {
                const savedUser = localStorage.getItem('telegram_user');
                if (savedUser) {
                    const user = JSON.parse(savedUser);
                    tgId = user.id;
                }
            } catch (e) {
                console.error('Ошибка парсинга telegram_user:', e);
            }
        }
        
        console.log('checkOnboardingStatus - tgId:', tgId, 'userToken:', userToken ? userToken.substring(0, 16) + '...' : 'null');
        
        if (!tgId && !userToken) {
            // Если нет ни tgId, ни userToken - возможно данные еще не загрузились
            // Для Android ждём инжекцию данных
            const isAndroid = navigator.userAgent.includes('Android');
            if (isAndroid) {
                console.log('⏳ Android: ждём инжекцию auth данных...');
                setTimeout(() => {
                    const retryToken = localStorage.getItem('user_token');
                    if (retryToken) {
                        console.log('✅ Auth данные появились, повторяем проверку');
                        checkOnboardingStatus();
                    } else {
                        console.log('❌ Нет auth данных после ожидания, показываем онбординг');
                        showOnboardingScreen();
                    }
                }, 1500);
                return;
            }
            
            console.log('❌ Нет ни tgId ни userToken, показываем онбординг');
            showOnboardingScreen();
            return;
        }
        
        // Проверяем, есть ли у пользователя никнейм в БД
        let url = '/api/users?';
        if (tgId) {
            url += `tgId=${tgId}`;
        } else if (userToken) {
            url += `userToken=${userToken}`;
        }
        
        console.log('checkOnboardingStatus - запрос к:', url);
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Статус никнейма из БД:', data);
        
        // Проверяем displayNickname (для /api/users) или nickname (для /api/nickname)
        const nickname = data.displayNickname || data.nickname;
        
        if (nickname && nickname.trim() !== '') {
            // Сохраняем никнейм локально
            localStorage.setItem('userNickname', nickname);
            localStorage.setItem('user_nickname', nickname);
            console.log('✅ Пользователь прошёл онбординг, никнейм:', nickname);
            showMainMenu();
        } else {
            // Показываем экран онбординга (БЛОКИРУЕМ доступ)
            console.log('⚠️ У пользователя нет никнейма, БЛОКИРУЕМ доступ');
            showOnboardingScreen();
        }
    } catch (error) {
        console.error('❌ Ошибка при проверке статуса онбординга:', error);
        // В случае ошибки показываем онбординг для безопасности
        showOnboardingScreen();
    }
}

// Определение локации по GPS
async function detectLocationByGPS() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.log('❌ GPS недоступен в этом браузере');
            resolve(null);
            return;
        }
        
        console.log('🛰️ Запрашиваем GPS координаты...');
        
        // Увеличиваем таймаут до 15 секунд для первого определения GPS
        const timeoutId = setTimeout(() => {
            console.log('⏱️ GPS таймаут (15 секунд)');
            resolve(null);
        }, 15000);
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                clearTimeout(timeoutId);
                const { latitude, longitude } = position.coords;
                console.log(`📍 GPS координаты получены: ${latitude}, ${longitude}`);
                
                try {
                    // Обратное геокодирование через Nominatim API
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru`,
                        {
                            headers: {
                                'User-Agent': 'Anonimka-App/1.0'
                            }
                        }
                    );
                    const data = await response.json();
                    console.log('🗺️ Геокодирование ответ:', data);
                    
                    if (data && data.address) {
                        const locationData = {
                            country_code: data.address.country_code?.toUpperCase(),
                            country_name: data.address.country,
                            region: data.address.state || data.address.region,
                            city: data.address.city || data.address.town || data.address.village,
                            source: 'gps'
                        };
                        console.log('✅ GPS локация определена:', locationData);
                        resolve(locationData);
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    console.error('❌ Ошибка геокодирования GPS:', error);
                    resolve(null);
                }
            },
            (error) => {
                clearTimeout(timeoutId);
                console.log(`❌ GPS ошибка: ${error.message}`);
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000, // Увеличиваем до 15 секунд
                maximumAge: 300000 // Кешируем на 5 минут
            }
        );
    });
}

// Определение локации по IP
async function detectLocationByIP() {
    const detectionText = document.querySelector('.detection-text');
    console.log('detectLocationByIP вызвана');
    console.log('detectionText элемент найден:', !!detectionText);
    
    if (!detectionText) {
        console.error('Элемент .detection-text не найден!');
        showPopularLocations();
        return;
    }
    
    try {
        console.log('Начинаем определение локации...');
        
        // Обновляем текст анимации с красивыми фразами
        detectionText.textContent = 'Сканируем цифровой след';
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Сначала пробуем GPS (если доступен)
        detectionText.textContent = 'Проверяем GPS';
        let locationData = await detectLocationByGPS();
        
        if (locationData) {
            console.log('✅ Используем GPS локацию:', locationData);
        } else {
            // Если GPS не сработал, используем IP
            console.log('⚠️ GPS недоступен, используем IP определение');
            
            detectionText.textContent = 'Анализируем сетевые маршруты';
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Пробуем несколько вариантов API
            detectionText.textContent = 'Определяем геолокацию';
        }
        
        // Только если GPS не сработал - используем IP определение
        if (!locationData) {
            // Вариант 1: ipinfo.io (часто работает без CORS)
            try {
                console.log('🌐 Пробуем ipinfo.io...');
                const response1 = await fetch('https://ipinfo.io/json');
                const data1 = await response1.json();
                console.log('📍 Ответ от ipinfo.io:', data1);
                
                if (data1 && data1.country) {
                    locationData = {
                        country_code: data1.country,
                        country_name: data1.country,
                        region: data1.region,
                        city: data1.city,
                        source: 'ipinfo.io'
                    };
                    console.log('✅ Данные получены от ipinfo.io:', locationData);
                }
            } catch (e) {
                console.log('❌ ipinfo.io недоступен:', e);
            }
            
            // Вариант 2: ip-api.com (более точное определение города)
            if (!locationData) {
                try {
                    console.log('🌐 Пробуем ip-api.com...');
                    const response2 = await fetch('http://ip-api.com/json/?fields=status,country,countryCode,region,regionName,city,timezone');
                    const data2 = await response2.json();
                    console.log('📍 Ответ от ip-api.com:', data2);
                    
                    if (data2 && data2.status === 'success') {
                        locationData = {
                            country_code: data2.countryCode,
                            country_name: data2.country,
                            region: data2.regionName,
                            city: data2.city,
                            source: 'ip-api.com'
                        };
                        console.log('✅ Данные получены от ip-api.com:', locationData);
                    }
                } catch (e) {
                    console.log('❌ ip-api.com недоступен:', e);
                }
            }
            
            // Вариант 3: Определение по часовому поясу (резервный вариант)
            if (!locationData) {
                try {
                    console.log('🌐 Используем часовой пояс как резервный вариант...');
                    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    console.log('⏰ Часовой пояс:', timezone);
                    
                    locationData = guessLocationByTimezone(timezone);
                    if (locationData) {
                        locationData.source = 'timezone';
                        console.log('✅ Данные получены по часовому поясу:', locationData);
                    }
                } catch (e) {
                    console.log('❌ Определение по часовому поясу не сработало:', e);
                }
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Данные геолокации:', locationData);
        
        if (locationData && locationData.country_code) {
            detectionText.textContent = 'Сопоставляем с базой данных';
            await new Promise(resolve => setTimeout(resolve, 600));
            
            detectionText.textContent = 'Почти готово';
            await new Promise(resolve => setTimeout(resolve, 400));
            
            const detectedLocation = processIPLocation(locationData);
            if (detectedLocation) {
                showDetectedLocationResult(detectedLocation);
                return;
            }
        }
        
        // Если все варианты не сработали - показываем популярные варианты
        showPopularLocations();
        
    } catch (error) {
        console.error('Ошибка определения локации по IP:', error);
        showPopularLocations();
    }
}

// Автоматическое определение локации (async версия)
async function autoDetectLocationAsync() {
    try {
        console.log('🌍 Автоопределение локации...');
        
        let locationData = null;
        
        // Пробуем ipinfo.io
        try {
            const response = await fetch('https://ipinfo.io/json');
            const data = await response.json();
            if (data && data.country) {
                locationData = {
                    country_code: data.country,
                    country_name: data.country,
                    region: data.region,
                    city: data.city,
                    source: 'ipinfo.io'
                };
                console.log('✅ Локация получена от ipinfo.io:', locationData);
            }
        } catch (e) {
            console.log('⚠️ ipinfo.io недоступен');
        }
        
        // Если не сработало, пробуем ip-api.com
        if (!locationData) {
            try {
                const response = await fetch('http://ip-api.com/json/?fields=status,country,countryCode,region,regionName,city');
                const data = await response.json();
                if (data && data.status === 'success') {
                    locationData = {
                        country_code: data.countryCode,
                        country_name: data.country,
                        region: data.regionName,
                        city: data.city,
                        source: 'ip-api.com'
                    };
                    console.log('✅ Локация получена от ip-api.com:', locationData);
                }
            } catch (e) {
                console.log('⚠️ ip-api.com недоступен');
            }
        }
        
        // Если не сработало, определяем по часовому поясу
        if (!locationData) {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            locationData = guessLocationByTimezone(timezone);
            if (locationData) {
                locationData.source = 'timezone';
                console.log('✅ Локация определена по часовому поясу:', locationData);
            }
        }
        
        // Показываем экран подтверждения если удалось определить
        if (locationData && locationData.country_code) {
            const detectedLocation = processIPLocation(locationData);
            if (detectedLocation) {
                // Устанавливаем выбранную локацию
                setupSelectedCountry = detectedLocation.country;
                setupSelectedRegion = detectedLocation.region;
                setupSelectedCity = detectedLocation.city;
                
                // Показываем экран подтверждения
                showSetupSelectedLocation();
                console.log('✅ Локация определена, показан экран подтверждения:', detectedLocation);
            }
        } else {
            console.log('⚠️ Не удалось автоматически определить локацию');
            tg.showAlert('Не удалось определить ваше местоположение. Пожалуйста, выберите локацию вручную.');
        }
    } catch (error) {
        console.error('❌ Ошибка автоопределения локации:', error);
        tg.showAlert('Ошибка при определении местоположения. Пожалуйста, выберите локацию вручную.');
    }
}

// Определение локации по часовому поясу
function guessLocationByTimezone(timezone) {
    console.log('Определяем по часовому поясу:', timezone);
    
    // Популярные города России и Казахстана
    const timezoneMap = {
        'Europe/Moscow': { country_code: 'RU', country_name: 'Россия', region: 'Москва', city: 'Москва' },
        'Europe/Samara': { country_code: 'RU', country_name: 'Россия', region: 'Самарская область', city: 'Самара' },
        'Asia/Yekaterinburg': { country_code: 'RU', country_name: 'Россия', region: 'Свердловская область', city: 'Екатеринбург' },
        'Asia/Novosibirsk': { country_code: 'RU', country_name: 'Россия', region: 'Новосибирская область', city: 'Новосибирск' },
        'Asia/Krasnoyarsk': { country_code: 'RU', country_name: 'Россия', region: 'Красноярский край', city: 'Красноярск' },
        'Asia/Irkutsk': { country_code: 'RU', country_name: 'Россия', region: 'Иркутская область', city: 'Иркутск' },
        'Asia/Vladivostok': { country_code: 'RU', country_name: 'Россия', region: 'Приморский край', city: 'Владивосток' },
        'Asia/Almaty': { country_code: 'KZ', country_name: 'Казахстан', region: 'Алматинская область', city: 'Алматы' },
        'Asia/Qyzylorda': { country_code: 'KZ', country_name: 'Казахстан', region: 'Кызылординская область', city: 'Кызылорда' },
        'Asia/Aqtobe': { country_code: 'KZ', country_name: 'Казахстан', region: 'Актюбинская область', city: 'Актобе' }
    };
    
    return timezoneMap[timezone] || null;
}

// Показать популярные локации для выбора
function showPopularLocations() {
    const animationDiv = document.querySelector('.detection-animation');
    const resultDiv = document.querySelector('.detection-result');
    
    // Проверяем существование элементов
    if (!animationDiv || !resultDiv) {
        console.error('Location elements not found');
        return;
    }
    
    // Скрываем анимацию
    animationDiv.style.display = 'none';
    
    // Показываем популярные варианты
    resultDiv.innerHTML = `
        <div class="popular-locations">
            <div class="info-icon">🌍</div>
            <h3>Выберите ваш регион</h3>
            <p>Не удалось автоматически определить местоположение.<br>Выберите один из популярных вариантов:</p>
            
            <div class="popular-options">
                <button class="location-option russia" onclick="selectPopularLocation('russia', 'Москва', 'Москва')">
                    <span class="flag">🇷🇺</span>
                    <div class="location-details">
                        <strong>Россия</strong>
                        <span>Москва</span>
                    </div>
                </button>
                
                <button class="location-option russia" onclick="selectPopularLocation('russia', 'Санкт-Петербург', 'Санкт-Петербург')">
                    <span class="flag">🇷🇺</span>
                    <div class="location-details">
                        <strong>Россия</strong>
                        <span>Санкт-Петербург</span>
                    </div>
                </button>
                
                <button class="location-option kazakhstan" onclick="selectPopularLocation('kazakhstan', 'Алматинская область', 'Алматы')">
                    <span class="flag">🇰🇿</span>
                    <div class="location-details">
                        <strong>Казахстан</strong>
                        <span>Алматы</span>
                    </div>
                </button>
                
                <button class="location-option kazakhstan" onclick="selectPopularLocation('kazakhstan', 'Акмолинская область', 'Астана')">
                    <span class="flag">🇰🇿</span>
                    <div class="location-details">
                        <strong>Казахстан</strong>
                        <span>Астана</span>
                    </div>
                </button>
            </div>
            
            <div class="manual-choice">
                <button class="manual-btn" onclick="showManualLocationSetup()">
                    🎯 Выбрать другую локацию
                </button>
            </div>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

// Выбор популярной локации
function selectPopularLocation(country, region, city) {
    console.log('Выбрана популярная локация:', {country, region, city});
    confirmDetectedLocation(country, region, city);
}

// Обработка данных IP геолокации
function processIPLocation(data) {
    const countryCode = (data.country_code || data.country || '').toLowerCase();
    let regionName = data.region;
    let cityName = data.city;
    
    // Нормализация названий РЕГИОНОВ (английские → русские)
    const regionNormalization = {
        // Россия - области
        'Moscow Oblast': 'Московская область',
        'Leningrad Oblast': 'Ленинградская область',
        'Novosibirsk Oblast': 'Новосибирская область',
        'Sverdlovsk Oblast': 'Свердловская область',
        'Rostov Oblast': 'Ростовская область',
        'Chelyabinsk Oblast': 'Челябинская область',
        'Nizhny Novgorod Oblast': 'Нижегородская область',
        'Samara Oblast': 'Самарская область',
        'Omsk Oblast': 'Омская область',
        'Voronezh Oblast': 'Воронежская область',
        'Volgograd Oblast': 'Волгоградская область',
        'Perm Krai': 'Пермский край',
        'Saratov Oblast': 'Саратовская область',
        'Tyumen Oblast': 'Тюменская область',
        'Kemerovo Oblast': 'Кемеровская область',
        'Tomsk Oblast': 'Томская область',
        'Tula Oblast': 'Тульская область',
        'Yaroslavl Oblast': 'Ярославская область',
        'Irkutsk Oblast': 'Иркутская область',
        'Vladimir Oblast': 'Владимирская область',
        'Ivanovo Oblast': 'Ивановская область',
        'Tver Oblast': 'Тверская область',
        'Orenburg Oblast': 'Оренбургская область',
        'Belgorod Oblast': 'Белгородская область',
        'Ryazan Oblast': 'Рязанская область',
        'Lipetsk Oblast': 'Липецкая область',
        'Penza Oblast': 'Пензенская область',
        'Astrakhan Oblast': 'Астраханская область',
        'Kaluga Oblast': 'Калужская область',
        'Kursk Oblast': 'Курская область',
        'Kirov Oblast': 'Кировская область',
        'Kostroma Oblast': 'Костромская область',
        'Bryansk Oblast': 'Брянская область',
        'Smolensk Oblast': 'Смоленская область',
        'Oryol Oblast': 'Орловская область',
        'Tambov Oblast': 'Тамбовская область',
        'Ulyanovsk Oblast': 'Ульяновская область',
        'Kurgan Oblast': 'Курганская область',
        'Vologda Oblast': 'Вологодская область',
        'Arkhangelsk Oblast': 'Архангельская область',
        'Murmansk Oblast': 'Мурманская область',
        'Novgorod Oblast': 'Новгородская область',
        'Pskov Oblast': 'Псковская область',
        'Amur Oblast': 'Амурская область',
        'Sakhalin Oblast': 'Сахалинская область',
        'Magadan Oblast': 'Магаданская область',
        'Kaliningrad Oblast': 'Калининградская область',
        
        // Россия - края
        'Krasnodar Krai': 'Краснодарский край',
        'Krasnoyarsk Krai': 'Красноярский край',
        'Primorsky Krai': 'Приморский край',
        'Stavropol Krai': 'Ставропольский край',
        'Khabarovsk Krai': 'Хабаровский край',
        'Altai Krai': 'Алтайский край',
        'Zabaykalsky Krai': 'Забайкальский край',
        'Kamchatka Krai': 'Камчатский край',
        
        // Россия - республики
        'Tatarstan': 'Татарстан',
        'Bashkortostan': 'Башкортостан',
        'Dagestan': 'Дагестан',
        'Sakha': 'Якутия',
        'Buryatia': 'Бурятия',
        'Chuvashia': 'Чувашия',
        'Udmurtia': 'Удмуртия',
        'Mordovia': 'Мордовия',
        'Mari El': 'Марий Эл',
        'Komi': 'Коми',
        'Karelia': 'Карелия',
        'Altai Republic': 'Алтай',
        'Khakassia': 'Хакасия',
        'Tyva': 'Тыва',
        'Kabardino-Balkaria': 'Кабардино-Балкария',
        
        // Казахстан - области
        'Almaty Region': 'Алматинская область',
        'Astana': 'Нур-Султан',
        'Shymkent': 'Шымкент',
        'Karaganda Region': 'Карагандинская область',
        'Aktobe Region': 'Актюбинская область',
        'East Kazakhstan Region': 'Восточно-Казахстанская область',
        'Pavlodar Region': 'Павлодарская область',
        'North Kazakhstan Region': 'Северо-Казахстанская область',
        'West Kazakhstan Region': 'Западно-Казахстанская область',
        'Atyrau Region': 'Атырауская область',
        'Mangystau Region': 'Мангистауская область',
        'Kostanay Region': 'Костанайская область',
        'Kyzylorda Region': 'Кызылординская область',
        'Zhambyl Region': 'Жамбылская область',
        'Turkistan Region': 'Туркестанская область',
        'Akmola Region': 'Акмолинская область'
    };
    
    // Нормализуем регион если он в английском формате
    if (regionName && regionNormalization[regionName]) {
        console.log(`🔄 Нормализация региона: "${regionName}" → "${regionNormalization[regionName]}"`);
        regionName = regionNormalization[regionName];
    }
    
    // Нормализация названий городов (приводим к единому формату)
    // Охватываем английские названия, старые названия, разные транслитерации
    const cityNormalization = {
        // Казахстан
        'Alma-Ata': 'Алматы',
        'Almaty': 'Алматы',
        'Алма-Ата': 'Алматы',
        'Astana': 'Астана',
        'Nur-Sultan': 'Астана',
        'Nursultan': 'Астана',
        'Нур-Султан': 'Астана',
        'Akmola': 'Астана',
        'Акмола': 'Астана',
        'Shymkent': 'Шымкент',
        'Chimkent': 'Шымкент',
        'Чимкент': 'Шымкент',
        'Karaganda': 'Караганда',
        'Qaraghandy': 'Караганда',
        'Aktobe': 'Актобе',
        'Aqtobe': 'Актобе',
        'Aktau': 'Актау',
        'Aqtau': 'Актау',
        'Atyrau': 'Атырау',
        'Pavlodar': 'Павлодар',
        'Semey': 'Семей',
        'Semipalatinsk': 'Семей',
        'Семипалатинск': 'Семей',
        'Ust-Kamenogorsk': 'Усть-Каменогорск',
        'Oskemen': 'Усть-Каменогорск',
        'Petropavl': 'Петропавловск',
        'Petropavlovsk': 'Петропавловск',
        'Kostanay': 'Костанай',
        'Qostanay': 'Костанай',
        'Kyzylorda': 'Кызылорда',
        'Qyzylorda': 'Кызылорда',
        'Uralsk': 'Уральск',
        'Oral': 'Уральск',
        'Taraz': 'Тараз',
        'Zhambyl': 'Тараз',
        'Жамбыл': 'Тараз',
        'Taldykorgan': 'Талдыкорган',
        'Turkestan': 'Туркестан',
        
        // Россия
        'Moscow': 'Москва',
        'Moskva': 'Москва',
        'Sankt-Peterburg': 'Санкт-Петербург',
        'Saint Petersburg': 'Санкт-Петербург',
        'St. Petersburg': 'Санкт-Петербург',
        'Petersburg': 'Санкт-Петербург',
        'Piter': 'Санкт-Петербург',
        'Leningrad': 'Санкт-Петербург',
        'Ленинград': 'Санкт-Петербург',
        'Yekaterinburg': 'Екатеринбург',
        'Ekaterinburg': 'Екатеринбург',
        'Sverdlovsk': 'Екатеринбург',
        'Свердловск': 'Екатеринбург',
        'Novosibirsk': 'Новосибирск',
        'Nizhniy Novgorod': 'Нижний Новгород',
        'Nizhny Novgorod': 'Нижний Новгород',
        'Gorky': 'Нижний Новгород',
        'Горький': 'Нижний Новгород',
        'Kazan': 'Казань',
        'Samara': 'Самара',
        'Kuybyshev': 'Самара',
        'Куйбышев': 'Самара',
        'Chelyabinsk': 'Челябинск',
        'Omsk': 'Омск',
        'Rostov-on-Don': 'Ростов-на-Дону',
        'Rostov': 'Ростов-на-Дону',
        'Ufa': 'Уфа',
        'Krasnoyarsk': 'Красноярск',
        'Voronezh': 'Воронеж',
        'Perm': 'Пермь',
        'Molotov': 'Пермь',
        'Молотов': 'Пермь',
        'Volgograd': 'Волгоград',
        'Stalingrad': 'Волгоград',
        'Сталинград': 'Волгоград',
        'Krasnodar': 'Краснодар',
        'Saratov': 'Саратов',
        'Tyumen': 'Тюмень',
        'Tolyatti': 'Тольятти',
        'Togliatti': 'Тольятти',
        'Stavropol': 'Ставрополь',
        'Pyatigorsk': 'Пятигорск',
        'Kislovodsk': 'Кисловодск',
        'Nevinnomyssk': 'Невинномысск',
        'Essentuki': 'Ессентуки',
        'Yessentuki': 'Ессентуки',
        'Izhevsk': 'Ижевск',
        'Ulyanovsk': 'Ульяновск',
        'Simbirsk': 'Ульяновск',
        'Симбирск': 'Ульяновск',
        'Barnaul': 'Барнаул',
        'Vladivostok': 'Владивосток',
        'Irkutsk': 'Иркутск',
        'Khabarovsk': 'Хабаровск',
        'Yaroslavl': 'Ярославль',
        'Makhachkala': 'Махачкала',
        'Tomsk': 'Томск',
        'Orenburg': 'Оренбург',
        'Kemerovo': 'Кемерово',
        'Novokuznetsk': 'Новокузнецк',
        'Ryazan': 'Рязань',
        'Astrakhan': 'Астрахань',
        'Naberezhnye Chelny': 'Набережные Челны',
        'Penza': 'Пенза',
        'Kirov': 'Киров',
        'Vyatka': 'Киров',
        'Вятка': 'Киров',
        'Lipetsk': 'Липецк',
        'Kaliningrad': 'Калининград',
        'Koenigsberg': 'Калининград',
        'Кёнигсберг': 'Калининград',
        'Tula': 'Тула',
        'Kursk': 'Курск',
        'Sochi': 'Сочи',
        'Ulan-Ude': 'Улан-Удэ',
        'Tver': 'Тверь',
        'Kalinin': 'Тверь',
        'Калинин': 'Тверь',
        'Magnitogorsk': 'Магнитогорск',
        'Ivanovo': 'Иваново',
        'Bryansk': 'Брянск',
        'Belgorod': 'Белгород',
        'Surgut': 'Сургут',
        'Vladikavkaz': 'Владикавказ',
        'Ordzhonikidze': 'Владикавказ',
        'Орджоникидзе': 'Владикавказ',
        'Chita': 'Чита',
        'Nizhny Tagil': 'Нижний Тагил',
        'Arkhangelsk': 'Архангельск',
        'Murmansk': 'Мурманск',
        'Yakutsk': 'Якутск',
        'Blagoveshchensk': 'Благовещенск',
        'Belogorsk': 'Белогорск',
        'Svobodny': 'Свободный',
        
        // Краснодарский край
        'Novorossiysk': 'Новороссийск',
        'Novorossiisk': 'Новороссийск',
        'Armavir': 'Армавир',
        'Gelendzhik': 'Геленджик',
        'Anapa': 'Анапа',
        
        // Красноярский край
        'Norilsk': 'Норильск',
        'Achinsk': 'Ачинск',
        'Kansk': 'Канск',
        'Minusinsk': 'Минусинск',
        
        // Приморский край
        'Nakhodka': 'Находка',
        'Ussuriysk': 'Уссурийск',
        'Artem': 'Артём',
        'Artyom': 'Артём',
        'Dalnegorsk': 'Дальнегорск',
        
        // Хабаровский край
        'Komsomolsk-on-Amur': 'Комсомольск-на-Амуре',
        'Komsomolsk-na-Amure': 'Комсомольск-на-Амуре',
        'Amursk': 'Амурск',
        'Sovetskaya Gavan': 'Советская Гавань',
        
        // Алтайский край
        'Biysk': 'Бийск',
        'Rubtsovsk': 'Рубцовск',
        'Novoaltaysk': 'Новоалтайск',
        
        // Забайкальский край
        'Krasnokamensk': 'Краснокаменск',
        'Borzya': 'Борзя',
        'Petrovsk-Zabaykalsky': 'Петровск-Забайкальский',
        
        // Камчатский край
        'Petropavlovsk-Kamchatsky': 'Петропавловск-Камчатский',
        'Elizovo': 'Елизово',
        'Vilyuchinsk': 'Вилючинск',
        
        // Татарстан
        'Nizhnekamsk': 'Нижнекамск',
        'Almetyevsk': 'Альметьевск',
        'Zelenodolsk': 'Зеленодольск',
        
        // Башкортостан
        'Sterlitamak': 'Стерлитамак',
        'Salavat': 'Салават',
        'Neftekamsk': 'Нефтекамск',
        'Oktyabrsky': 'Октябрьский',
        
        // Дагестан
        'Khasavyurt': 'Хасавюрт',
        'Derbent': 'Дербент',
        'Kaspiysk': 'Каспийск',
        'Buynaksk': 'Буйнакск',
        
        // Якутия
        'Neryungri': 'Нерюнгри',
        'Mirny': 'Мирный',
        'Lensk': 'Ленск',
        
        // Бурятия
        'Severobaykalsk': 'Северобайкальск',
        'Gusinoozersk': 'Гусиноозерск',
        
        // Чувашия
        'Cheboksary': 'Чебоксары',
        'Novocheboksarsk': 'Новочебоксарск',
        'Kanash': 'Канаш',
        'Alatyr': 'Алатырь',
        
        // Удмуртия
        'Sarapul': 'Сарапул',
        'Votkinsk': 'Воткинск',
        'Glazov': 'Глазов',
        
        // Мордовия
        'Saransk': 'Саранск',
        'Ruzayevka': 'Рузаевка',
        'Kovylkino': 'Ковылкино',
        'Temnikov': 'Темников',
        
        // Марий Эл
        'Yoshkar-Ola': 'Йошкар-Ола',
        'Volzhsk': 'Волжск',
        'Kozmodemyansk': 'Козьмодемьянск',
        
        // Коми
        'Syktyvkar': 'Сыктывкар',
        'Ukhta': 'Ухта',
        'Vorkuta': 'Воркута',
        'Pechora': 'Печора',
        
        // Карелия
        'Petrozavodsk': 'Петрозаводск',
        'Kondopoga': 'Кондопога',
        'Kostomuksha': 'Костомукша',
        'Segezha': 'Сегежа',
        
        // Алтай (республика)
        'Gorno-Altaysk': 'Горно-Алтайск',
        'Kosh-Agach': 'Кош-Агач',
        'Mayma': 'Майма',
        
        // Хакасия
        'Abakan': 'Абакан',
        'Chernogorsk': 'Черногорск',
        'Sayanogorsk': 'Саяногорск',
        'Abaza': 'Абаза',
        
        // Тыва
        'Kyzyl': 'Кызыл',
        'Ak-Dovurak': 'Ак-Довурак',
        'Shagonar': 'Шагонар',
        
        // Кабардино-Балкария
        'Nalchik': 'Нальчик',
        'Prokhladny': 'Прохладный',
        'Baksan': 'Баксан',
        'Maysky': 'Майский',
        
        // Карачаево-Черкесия
        'Cherkessk': 'Черкесск',
        'Karachayevsk': 'Карачаевск',
        'Ust-Dzheguta': 'Усть-Джегута',
        
        // Северная Осетия
        'Beslan': 'Беслан',
        'Ardon': 'Ардон',
        'Mozdok': 'Моздок',
        
        // Чечня
        'Grozny': 'Грозный',
        'Argun': 'Аргун',
        'Gudermes': 'Гудермес',
        'Shali': 'Шали',
        
        // Ингушетия
        'Magas': 'Магас',
        'Nazran': 'Назрань',
        'Karabulak': 'Карабулак',
        'Malgobek': 'Малгобек'
    };
    
    // Нормализуем название города если оно в английском формате
    if (cityName && cityNormalization[cityName]) {
        console.log(`🔄 Нормализация города: "${cityName}" → "${cityNormalization[cityName]}"`);
        cityName = cityNormalization[cityName];
    }
    
    console.log('Обработка локации:', {countryCode, regionName, cityName});
    
    // Проверяем поддерживаемые страны
    let mappedCountry = null;
    if (countryCode === 'ru' || countryCode === 'russia') {
        mappedCountry = 'russia';
    } else if (countryCode === 'kz' || countryCode === 'kazakhstan') {
        mappedCountry = 'kazakhstan';
    }
    
    if (!mappedCountry) {
        console.log('Страна не поддерживается:', countryCode);
        return null;
    }
    
    // Пытаемся найти регион и город в наших данных
    const countryData = locationData[mappedCountry];
    let foundRegion = null;
    let foundCity = null;
    
    // Поиск региона
    if (regionName) {
        console.log('🔍 Ищем регион:', regionName);
        
        // Сначала пробуем точное совпадение
        for (const region in countryData.regions) {
            if (region.toLowerCase() === regionName.toLowerCase()) {
                foundRegion = region;
                console.log('✅ Найден регион (точное совпадение):', foundRegion);
                break;
            }
        }
        
        // Если не нашли точное, пробуем fuzzy search
        if (!foundRegion) {
            for (const region in countryData.regions) {
                if (region.toLowerCase().includes(regionName.toLowerCase()) || 
                    regionName.toLowerCase().includes(region.toLowerCase())) {
                    foundRegion = region;
                    console.log('✅ Найден регион (частичное совпадение):', foundRegion);
                    break;
                }
            }
        }
        
        if (!foundRegion) {
            console.log('❌ Регион не найден в базе:', regionName);
        }
    }
    
    // Поиск города
    if (cityName && foundRegion) {
        console.log('🔍 Ищем город:', cityName, 'в регионе:', foundRegion);
        const cities = countryData.regions[foundRegion];
        
        // Сначала точное совпадение
        foundCity = cities.find(city => city.toLowerCase() === cityName.toLowerCase());
        
        // Потом fuzzy search
        if (!foundCity) {
            foundCity = cities.find(city => 
                city.toLowerCase().includes(cityName.toLowerCase()) ||
                cityName.toLowerCase().includes(city.toLowerCase())
            );
        }
        
        if (foundCity) {
            console.log('✅ Найден город в регионе:', foundCity);
        } else {
            console.log('❌ Город не найден в регионе:', foundRegion);
        }
    }
    
    // Если город не найден в определенном регионе, ищем по всем регионам
    if (cityName && !foundCity) {
        console.log('🔍 Ищем город по всем регионам:', cityName);
        for (const region in countryData.regions) {
            const cities = countryData.regions[region];
            
            // Сначала точное совпадение
            let city = cities.find(city => city.toLowerCase() === cityName.toLowerCase());
            
            // Потом fuzzy search
            if (!city) {
                city = cities.find(city => 
                    city.toLowerCase().includes(cityName.toLowerCase()) ||
                    cityName.toLowerCase().includes(city.toLowerCase())
                );
            }
            
            if (city) {
                foundRegion = region;
                foundCity = city;
                console.log('✅ Найден город в другом регионе:', city, '→', region);
                break;
            }
        }
    }
    
    // Возвращаем найденную локацию или базовую для страны
    const result = {
        country: mappedCountry,
        region: foundRegion || Object.keys(countryData.regions)[0],
        city: foundCity || countryData.regions[foundRegion || Object.keys(countryData.regions)[0]][0],
        detected: {
            country: data.country_name,
            region: regionName,
            city: cityName
        }
    };
    
    console.log('📍 Итоговая локация:', result);
    if (!foundRegion || !foundCity) {
        console.warn('⚠️ Использованы значения по умолчанию!', {foundRegion, foundCity});
    }
    
    return result;
}

// Показать результат определения локации
function showDetectedLocationResult(detectedLocation) {
    const animationDiv = document.querySelector('.detection-animation');
    const resultDiv = document.querySelector('.detection-result');
    const countryFlag = locationData[detectedLocation.country].flag;
    
    // Скрываем анимацию
    animationDiv.style.display = 'none';
    
    // Формируем текст локации (избегаем дублирования если регион = город)
    const locationText = detectedLocation.region === detectedLocation.city 
        ? detectedLocation.city 
        : `${detectedLocation.region}, ${detectedLocation.city}`;
    
    // Показываем результат с предупреждением о точности
    const sourceText = detectedLocation.source || 'IP-адрес';
    resultDiv.innerHTML = `
        <div class="detected-location">
            <div class="success-icon">✨</div>
            <h3>Проверьте определённое местоположение</h3>
            <div class="location-info">
                <span class="location-flag">${countryFlag}</span>
                <span class="location-text">${locationText}</span>
            </div>
            <p class="detection-note">⚠️ Автоопределение может быть неточным</p>
            <p class="detection-source">Источник: ${detectedLocation.detected.country}${detectedLocation.detected.region ? ', ' + detectedLocation.detected.region : ''}${detectedLocation.detected.city ? ', ' + detectedLocation.detected.city : ''}</p>
            <div class="location-actions">
                <button class="confirm-btn" onclick="confirmDetectedLocation('${detectedLocation.country}', '${detectedLocation.region}', '${detectedLocation.city}')">
                    ✅ Да, всё верно
                </button>
                <button class="manual-btn" onclick="showManualLocationSetup()">
                    🎯 Нет, выбрать вручную
                </button>
            </div>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

// Показать ошибку определения IP
function showIPDetectionError() {
    const animationDiv = document.querySelector('.detection-animation');
    const resultDiv = document.querySelector('.detection-result');
    
    // Скрываем анимацию
    animationDiv.style.display = 'none';
    
    // Показываем ошибку
    resultDiv.innerHTML = `
        <div class="detection-error">
            <div class="error-icon">😔</div>
            <h3>Не удалось определить местоположение</h3>
            <p>Возможно, ваша страна не поддерживается или есть проблемы с подключением к интернету</p>
            <div class="location-actions">
                <button class="manual-btn" onclick="showManualLocationSetup()">
                    🎯 Выбрать вручную
                </button>
            </div>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

// Подтвердить определенную локацию
async function confirmDetectedLocation(country, region, city) {
    console.log('Подтверждение автоматической локации:', {country, region, city});
    saveUserLocation(country, region, city);
    displayUserLocation();
    updateFormLocationDisplay();
    await checkOnboardingStatus();
}

// Сбросить сохраненную локацию и запустить автоопределение
function resetAndDetectLocation() {
    console.log('Сброс локации и запуск автоопределения');
    
    // Очищаем сохраненные данные
    try {
        if (tg.CloudStorage) {
            tg.CloudStorage.removeItem('userLocation', function(err) {
                if (err) {
                    console.error('Ошибка удаления из CloudStorage:', err);
                } else {
                    console.log('Локация удалена из CloudStorage');
                }
            });
        }
        localStorage.removeItem('userLocation');
        console.log('Локация удалена из localStorage');
    } catch (error) {
        console.error('Ошибка очистки данных:', error);
    }
    
    // Сбрасываем переменную
    userLocation = null;
    
    // Запускаем автоопределение
    showAutoLocationDetection();
}

// Отображение текущей локации пользователя
function displayUserLocation() {
    if (currentUserLocation) {
        // Избегаем дублирования если регион = город (например, Москва Москва)
        const locationPart = currentUserLocation.region === currentUserLocation.city 
            ? currentUserLocation.city 
            : `${currentUserLocation.region}, ${currentUserLocation.city}`;
        const locationText = `${locationData[currentUserLocation.country].flag} ${locationPart}`;
        const locationDisplay = document.getElementById('userLocationDisplay');
        if (locationDisplay) {
            locationDisplay.textContent = locationText;
        }
        console.log('Текущая локация пользователя:', locationText);
    }
}

// Алиас для обратной совместимости
const updateUserLocationDisplay = displayUserLocation;

// Делаем локацию кликабельной для быстрой смены города
document.addEventListener('DOMContentLoaded', function() {
    const locationContainer = document.querySelector('.user-location');
    if (locationContainer) {
        locationContainer.style.cursor = 'pointer';
        locationContainer.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Клик по локации - открываем смену локации');
            // Открываем экран смены локации
            showScreen('locationSetup');
        });
    }
});

// Сохранение локации пользователя
async function saveUserLocation(country, region, city) {
    currentUserLocation = {
        country: country,
        region: region,
        city: city,
        timestamp: Date.now()
    };
    
    // Update individual localStorage items for city filtering
    localStorage.setItem('userCountry', country || '');
    localStorage.setItem('userRegion', region || '');
    localStorage.setItem('userCity', city || '');
    localStorage.setItem('userLocation', JSON.stringify(currentUserLocation));
    
    // Сохраняем локацию в БД (приоритет)
    try {
        const tgId = tg?.initDataUnsafe?.user?.id;
        const userToken = localStorage.getItem('user_token');
        
        if (tgId || userToken) {
            console.log('📍 Сохраняем локацию в БД:', { country, region, city });
            
            const payload = {
                location: { country, region, city }
            };
            
            if (tgId) {
                payload.tgId = tgId;
            }
            if (userToken) {
                payload.userToken = userToken;
            }
            
            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('✅ Локация сохранена в БД');
            } else {
                console.warn('⚠️ Ошибка сохранения локации в БД:', result.error);
            }
        }
    } catch (error) {
        console.error('❌ Ошибка сохранения локации в БД:', error);
    }
    
    // Fallback: сохраняем в Cloud Storage для Telegram
    try {
        if (supportsCloudStorage()) {
            tg.CloudStorage.setItem('userLocation', JSON.stringify(currentUserLocation), function(err) {
                if (!err) {
                    console.log('📦 Локация дублирована в Telegram Cloud Storage');
                } else {
                    console.error('Ошибка сохранения в Cloud Storage:', err);
                }
            });
        }
    } catch (error) {
        console.error('Ошибка сохранения в Cloud Storage:', error);
    }
}

// Показать экран автоматического определения локации
function showAutoLocationDetection() {
    console.log('Показываем экран автоматического определения локации');
    showScreen('autoLocationDetection');
    // Запускаем определение через небольшую задержку для показа анимации
    setTimeout(() => {
        console.log('Запускаем определение локации по IP');
        detectLocationByIP();
    }, 1000);
}

// Показать экран выбора способа определения локации
function showLocationChoiceScreen() {
    console.log('Показываем экран выбора способа определения локации');
    closeHamburgerMenu(); // Закрываем бургер-меню
    showScreen('locationChoice');
}

// Показать экран ручной настройки локации
function showManualLocationSetup() {
    showScreen('locationSetup');
    resetSetupLocation();
    
    // Показываем кнопку "Назад" всегда (пользователь может вернуться к главному меню)
    const locationBackBtn = document.getElementById('locationBackBtn');
    if (locationBackBtn) {
        locationBackBtn.style.display = 'block';
    }
}

// Показать экран настройки локации (старая функция для совместимости)
function showLocationSetup() {
    showManualLocationSetup();
}

// Сохранить локацию и перейти к главному меню
async function saveLocationAndContinue() {
    if (setupSelectedCountry && setupSelectedRegion && setupSelectedCity) {
        saveUserLocation(setupSelectedCountry, setupSelectedRegion, setupSelectedCity);
        displayUserLocation();
        updateFormLocationDisplay();
        await checkOnboardingStatus();
    } else {
        tg.showAlert('Пожалуйста, выберите страну, регион и город');
    }
}

// Инициализация системы локации
function initLocationSelector() {
    // Обработчики для кнопок стран (форма создания)
    document.querySelectorAll('.form-country:not(.filter-country)').forEach(btn => {
        btn.addEventListener('click', function() {
            selectCountry(this.dataset.country);
        });
    });
    
    // Обработчики для кнопок стран (фильтр просмотра)
    document.querySelectorAll('.filter-country').forEach(btn => {
        btn.addEventListener('click', function() {
            selectFilterCountry(this.dataset.country);
        });
    });
    
    // Обработчики для экрана настройки локации
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.addEventListener('click', function() {
            selectSetupCountry(this.dataset.country);
        });
    });

    // Обработчики для полей ввода регионов и городов (форма создания)
    const regionInput = document.querySelector('.form-region-input:not(.filter-region-input)');
    const cityInput = document.querySelector('.form-city-input:not(.filter-city-input)');
    
    if (regionInput) {
        regionInput.addEventListener('input', function() {
            handleRegionInput(this.value);
        });
        
        regionInput.addEventListener('keyup', function() {
            handleRegionInput(this.value);
        });
        
        regionInput.addEventListener('focus', function() {
            showAllRegions();
        });
        
        regionInput.addEventListener('click', function() {
            showAllRegions();
        });
    }
    
    if (cityInput) {
        cityInput.addEventListener('input', function() {
            handleCityInput(this.value);
        });
        
        cityInput.addEventListener('keyup', function() {
            handleCityInput(this.value);
        });
        
        cityInput.addEventListener('focus', function() {
            if (selectedRegion) {
                showAllCities();
            }
        });
        
        cityInput.addEventListener('click', function() {
            if (selectedRegion) {
                showAllCities();
            }
        });
    }
    
    // Обработчики для полей ввода фильтра
    const filterRegionInput = document.querySelector('.filter-region-input');
    const filterCityInput = document.querySelector('.filter-city-input');
    
    if (filterRegionInput) {
        filterRegionInput.addEventListener('input', function() {
            handleFilterRegionInput(this.value);
        });
        
        filterRegionInput.addEventListener('keyup', function() {
            handleFilterRegionInput(this.value);
        });
        
        filterRegionInput.addEventListener('focus', function() {
            showAllFilterRegions();
        });
        
        filterRegionInput.addEventListener('click', function() {
            showAllFilterRegions();
        });
    }
    
    if (filterCityInput) {
        filterCityInput.addEventListener('input', function() {
            handleFilterCityInput(this.value);
        });
        
        filterCityInput.addEventListener('keyup', function() {
            handleFilterCityInput(this.value);
        });
        
        filterCityInput.addEventListener('focus', function() {
            if (filterSelectedRegion) {
                showAllFilterCities();
            }
        });
        
        filterCityInput.addEventListener('click', function() {
            if (filterSelectedRegion) {
                showAllFilterCities();
            }
        });
    }
    
    // Обработчики для полей настройки локации
    const setupCityInput = document.querySelector('.setup-city-input');
    
    console.log('Настройка обработчиков для настройки локации');
    console.log('setupCityInput найден:', !!setupCityInput);
    
    if (setupCityInput) {
        setupCityInput.addEventListener('input', function() {
            console.log('input событие на город в настройке:', this.value);
            handleSetupCityInput(this.value);
        });
        
        setupCityInput.addEventListener('keyup', function() {
            console.log('keyup событие на город в настройке:', this.value);
            handleSetupCityInput(this.value);
        });
        
        setupCityInput.addEventListener('focus', function() {
            console.log('focus событие на город в настройке');
            if (setupSelectedRegion) {
                // Задержка чтобы избежать конфликта с hideAllSuggestions
                setTimeout(() => {
                    showAllSetupCities();
                }, 50);
            } else {
                console.log('Регион не выбран, не показываем города');
            }
        });
        
        setupCityInput.addEventListener('click', function(e) {
            console.log('click событие на город в настройке');
            e.stopPropagation(); // Останавливаем всплытие события
            if (setupSelectedRegion) {
                setTimeout(() => {
                    showAllSetupCities();
                }, 50);
            }
        });
        
        setupCityInput.addEventListener('mousedown', function(e) {
            console.log('mousedown событие на город в настройке');
            e.stopPropagation(); // Останавливаем всплытие события
        });
    }
    
    // Кнопка сброса локации (форма)
    const resetBtn = document.querySelector('.reset-form-location:not(.reset-filter-location)');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetLocationSelection);
    }
    
    // Кнопка сброса локации (фильтр)
    const resetFilterBtn = document.querySelector('.reset-filter-location');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetFilterLocationSelection);
    }
    
    // Кнопка сброса настройки локации
    const resetSetupBtn = document.querySelector('.reset-setup-location');
    if (resetSetupBtn) {
        resetSetupBtn.addEventListener('click', resetSetupLocation);
    }

    // Скрытие списков при клике вне их
    document.addEventListener('click', function(e) {
        // Не скрываем если клик по полю ввода или списку предложений
        if (!e.target.closest('.search-container') && !e.target.classList.contains('setup-region-input') && !e.target.classList.contains('setup-city-input')) {
            hideAllSuggestions();
        }
    });
}

// Выбор страны
function selectCountry(countryCode) {
    selectedCountry = countryCode;
    selectedRegion = null;
    selectedCity = null;
    
    // Обновляем кнопки
    document.querySelectorAll('.form-country').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-country="${countryCode}"]`).classList.add('active');
    
    // Показываем выбор региона с анимацией
    const regionSection = document.querySelector('.form-region-selection');
    regionSection.style.display = 'block';
    setTimeout(() => {
        regionSection.style.opacity = '1';
    }, 50);
    
    // Скрываем остальные секции
    document.querySelector('.form-city-selection').style.display = 'none';
    document.querySelector('.form-selected-location').style.display = 'none';
    
    // Очищаем поля
    document.querySelector('.form-region-input').value = '';
    document.querySelector('.form-city-input').value = '';
    
    console.log('Выбрана страна:', locationData[countryCode].name);
}

// Обработка ввода региона
function handleRegionInput(value) {
    if (!selectedCountry) return;
    
    // Если поле пустое, скрываем предложения
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const regions = Object.keys(locationData[selectedCountry].regions);
    const filtered = regions.filter(region => 
        region.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showRegionSuggestions(filtered);
}

// Показать все регионы
function showAllRegions() {
    if (!selectedCountry) return;
    
    const regions = Object.keys(locationData[selectedCountry].regions);
    showRegionSuggestions(regions);
}

// Показать предложения регионов
function showRegionSuggestions(regions) {
    const suggestionsContainer = document.querySelector('.form-region-suggestions');
    
    if (regions.length === 0) {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.classList.remove('active');
        return;
    }
    
    suggestionsContainer.innerHTML = regions.map(region => `
        <div class="suggestion-item" onclick="selectRegion('${region}')">
            ${region}
        </div>
    `).join('');
    
    suggestionsContainer.style.display = 'block';
    suggestionsContainer.classList.add('active');
}

// Выбор региона
function selectRegion(regionName) {
    selectedRegion = regionName;
    selectedCity = null;
    
    document.querySelector('.form-region-input').value = regionName;
    hideAllSuggestions();
    
    // Показываем выбор города с анимацией
    const citySection = document.querySelector('.form-city-selection');
    citySection.style.display = 'block';
    setTimeout(() => {
        citySection.style.opacity = '1';
    }, 50);
    
    // Очищаем поле города
    document.querySelector('.form-city-input').value = '';
    document.querySelector('.form-city-input').focus();
    
    console.log('Выбран регион:', regionName);
}

// Обработка ввода города
function handleCityInput(value) {
    if (!selectedCountry || !selectedRegion) return;
    
    // Если поле пустое, скрываем предложения
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const cities = locationData[selectedCountry].regions[selectedRegion];
    const filtered = cities.filter(city => 
        city.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showCitySuggestions(filtered);
}

// Показать все города
function showAllCities() {
    if (!selectedCountry || !selectedRegion) return;
    
    const cities = locationData[selectedCountry].regions[selectedRegion];
    showCitySuggestions(cities);
}

// Показать предложения городов
function showCitySuggestions(cities) {
    const suggestionsContainer = document.querySelector('.form-city-suggestions');
    
    if (cities.length === 0) {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.classList.remove('active');
        return;
    }
    
    suggestionsContainer.innerHTML = cities.map(city => `
        <div class="suggestion-item" onclick="selectCity('${city}')">
            ${city}
        </div>
    `).join('');
    
    suggestionsContainer.style.display = 'block';
    suggestionsContainer.classList.add('active');
}

// Выбор города
function selectCity(cityName) {
    selectedCity = cityName;
    
    document.querySelector('.form-city-input').value = cityName;
    hideAllSuggestions();
    
    // Обновляем данные формы
    formData.country = selectedCountry;
    formData.region = selectedRegion;
    formData.city = cityName;
    
    // Показываем выбранную локацию
    showSelectedLocation();
    
    console.log('Выбран город:', cityName);
    console.log('Полная локация:', `${locationData[selectedCountry].name}, ${selectedRegion}, ${cityName}`);
}

// Показать выбранную локацию
function showSelectedLocation() {
    const selectedLocationDiv = document.querySelector('.form-selected-location');
    const locationText = document.querySelector('.form-location-text');
    
    const fullLocation = `${locationData[selectedCountry].flag} ${selectedRegion}, ${selectedCity}`;
    locationText.textContent = fullLocation;
    
    // Скрываем секции выбора
    document.querySelector('.form-region-selection').style.display = 'none';
    document.querySelector('.form-city-selection').style.display = 'none';
    
    // Показываем выбранную локацию с анимацией
    selectedLocationDiv.style.display = 'block';
    setTimeout(() => {
        selectedLocationDiv.style.opacity = '1';
    }, 50);
}

// Сброс выбора локации
function resetLocationSelection() {
    selectedCountry = null;
    selectedRegion = null;
    selectedCity = null;
    
    // Очищаем данные формы
    delete formData.country;
    delete formData.region;
    delete formData.city;
    
    // Сбрасываем кнопки стран
    document.querySelectorAll('.form-country').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Очищаем поля ввода (с проверкой существования)
    const regionInput = document.querySelector('.form-region-input');
    const cityInput = document.querySelector('.form-city-input');
    if (regionInput) regionInput.value = '';
    if (cityInput) cityInput.value = '';
    
    // Скрываем все секции кроме выбора страны (с проверкой существования)
    const regionSection = document.querySelector('.form-region-selection');
    const citySection = document.querySelector('.form-city-selection');
    const selectedSection = document.querySelector('.form-selected-location');
    if (regionSection) regionSection.style.display = 'none';
    if (citySection) citySection.style.display = 'none';
    if (selectedSection) selectedSection.style.display = 'none';
    
    hideAllSuggestions();
    
    console.log('Выбор локации сброшен');
}

// Скрыть все списки предложений
function hideAllSuggestions() {
    document.querySelectorAll('.suggestions-list').forEach(list => {
        list.classList.remove('active');
        list.style.display = 'none';
        list.innerHTML = '';
    });
}

// Скрыть все списки кроме указанного
function hideOtherSuggestions(keepClass) {
    document.querySelectorAll('.suggestions-list').forEach(list => {
        if (!list.classList.contains(keepClass)) {
            list.classList.remove('active');
            list.style.display = 'none';
            list.innerHTML = '';
        }
    });
}

// Обновляем обработчики событий
function setupEventListeners() {
    // Инициализируем систему локации
    initLocationSelector();
    
    // Кнопки выбора пола
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', () => selectGender(btn.dataset.gender));
    });

    // Кнопки выбора цели поиска
    document.querySelectorAll('.target-btn').forEach(btn => {
        btn.addEventListener('click', () => selectTarget(btn.dataset.target));
    });

    // Кнопки выбора цели знакомства
    document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.addEventListener('click', () => selectGoal(btn.dataset.goal));
    });

    // Кнопки выбора телосложения
    document.querySelectorAll('.body-btn').forEach(btn => {
        btn.addEventListener('click', () => selectBody(btn.dataset.body));
    });

    // Фильтры в просмотре анкет
    document.querySelectorAll('.city-btn.filter').forEach(btn => {
        btn.addEventListener('click', function() {
            handleCityFilter(this.dataset.city);
        });
    });
}

// Обновляем сброс формы
function resetForm() {
    formData = {};
    currentStep = 1;
    
    // Сброс системы локации
    resetLocationSelection();
    
    // Сброс всех выборов
    document.querySelectorAll('.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Очистка полей
    document.getElementById('ageFrom').value = '';
    document.getElementById('ageTo').value = '';
    document.getElementById('myAge').value = '';
    document.getElementById('adText').value = '';
    
    showStep(1);
}

// === ФУНКЦИИ ДЛЯ ФИЛЬТРА В ПРОСМОТРЕ анкет ===

// Выбор страны для фильтра
function selectFilterCountry(countryCode) {
    filterSelectedCountry = countryCode;
    filterSelectedRegion = null;
    filterSelectedCity = null;
    
    // Обновляем кнопки
    document.querySelectorAll('.filter-country').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-country="${countryCode}"].filter-country`).classList.add('active');
    
    // Показываем выбор региона с анимацией
    const regionSection = document.querySelector('.filter-region-selection');
    regionSection.style.display = 'block';
    setTimeout(() => {
        regionSection.style.opacity = '1';
    }, 50);
    
    // Скрываем остальные секции
    document.querySelector('.filter-city-selection').style.display = 'none';
    document.querySelector('.filter-selected-location').style.display = 'none';
    
    // Очищаем поля
    document.querySelector('.filter-region-input').value = '';
    document.querySelector('.filter-city-input').value = '';
    
    console.log('Выбрана страна для фильтра:', locationData[countryCode].name);
}

// Обработка ввода региона для фильтра
function handleFilterRegionInput(value) {
    if (!filterSelectedCountry) return;
    
    // Если поле пустое, скрываем предложения
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const regions = Object.keys(locationData[filterSelectedCountry].regions);
    const filtered = regions.filter(region => 
        region.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showFilterRegionSuggestions(filtered);
}

// Показать все регионы для фильтра
function showAllFilterRegions() {
    if (!filterSelectedCountry) return;
    
    const regions = Object.keys(locationData[filterSelectedCountry].regions);
    showFilterRegionSuggestions(regions);
}

// Показать предложения регионов для фильтра
function showFilterRegionSuggestions(regions) {
    const suggestionsContainer = document.querySelector('.filter-region-suggestions');
    
    if (regions.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    suggestionsContainer.innerHTML = regions.map(region => `
        <div class="suggestion-item" onclick="selectFilterRegion('${region}')">
            ${region}
        </div>
    `).join('');
    
    suggestionsContainer.classList.add('active');
}

// Выбор региона для фильтра
function selectFilterRegion(regionName) {
    filterSelectedRegion = regionName;
    filterSelectedCity = null;
    
    document.querySelector('.filter-region-input').value = regionName;
    hideAllSuggestions();
    
    // Показываем выбор города с анимацией
    const citySection = document.querySelector('.filter-city-selection');
    citySection.style.display = 'block';
    setTimeout(() => {
        citySection.style.opacity = '1';
    }, 50);
    
    // Очищаем поле города
    document.querySelector('.filter-city-input').value = '';
    document.querySelector('.filter-city-input').focus();
    
    console.log('Выбран регион для фильтра:', regionName);
}

// Обработка ввода города для фильтра
function handleFilterCityInput(value) {
    if (!filterSelectedCountry || !filterSelectedRegion) return;
    
    // Если поле пустое, скрываем предложения
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const cities = locationData[filterSelectedCountry].regions[filterSelectedRegion];
    const filtered = cities.filter(city => 
        city.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showFilterCitySuggestions(filtered);
}

// Показать все города для фильтра
function showAllFilterCities() {
    if (!filterSelectedCountry || !filterSelectedRegion) return;
    
    const cities = locationData[filterSelectedCountry].regions[filterSelectedRegion];
    showFilterCitySuggestions(cities);
}

// Показать предложения городов для фильтра
function showFilterCitySuggestions(cities) {
    const suggestionsContainer = document.querySelector('.filter-city-suggestions');
    
    if (cities.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    suggestionsContainer.innerHTML = cities.map(city => `
        <div class="suggestion-item" onclick="selectFilterCity('${city}')">
            ${city}
        </div>
    `).join('');
    
    suggestionsContainer.classList.add('active');
}

// Выбор города для фильтра
function selectFilterCity(cityName) {
    filterSelectedCity = cityName;
    
    document.querySelector('.filter-city-input').value = cityName;
    hideAllSuggestions();
    
    // Показываем выбранную локацию
    showFilterSelectedLocation();
    
    // Загружаем анкеты по выбранной локации
    loadAdsByLocation(filterSelectedCountry, filterSelectedRegion, cityName);
    
    console.log('Выбран город для фильтра:', cityName);
    console.log('Полная локация фильтра:', `${locationData[filterSelectedCountry].name}, ${filterSelectedRegion}, ${cityName}`);
}

// Показать выбранную локацию для фильтра
function showFilterSelectedLocation() {
    const selectedLocationDiv = document.querySelector('.filter-selected-location');
    const locationText = document.querySelector('.filter-location-text');
    
    const fullLocation = `${locationData[filterSelectedCountry].flag} ${filterSelectedRegion}, ${filterSelectedCity}`;
    locationText.textContent = fullLocation;
    
    // Скрываем секции выбора
    document.querySelector('.filter-region-selection').style.display = 'none';
    document.querySelector('.filter-city-selection').style.display = 'none';
    
    // Показываем выбранную локацию с анимацией
    selectedLocationDiv.style.display = 'block';
    setTimeout(() => {
        selectedLocationDiv.style.opacity = '1';
    }, 50);
}

// Установка UI фильтра на основе локации пользователя
function setFilterLocationUI() {
    if (!userLocation) {
        console.log('setFilterLocationUI: локация пользователя не установлена');
        return;
    }
    
    console.log('setFilterLocationUI: устанавливаем UI для локации', userLocation);
    
    // Устанавливаем активную кнопку страны
    const countryButtons = document.querySelectorAll('.filter-country');
    console.log('Найдено кнопок стран для фильтра:', countryButtons.length);
    
    countryButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.country === userLocation.country) {
            btn.classList.add('active');
            console.log('Активирована кнопка страны:', btn.dataset.country);
        }
    });
    
    // Заполняем поля ввода
    const regionInput = document.querySelector('.filter-region-input');
    const cityInput = document.querySelector('.filter-city-input');
    
    console.log('regionInput найден:', !!regionInput);
    console.log('cityInput найден:', !!cityInput);
    
    if (regionInput) regionInput.value = userLocation.region;
    if (cityInput) cityInput.value = userLocation.city;
    
    // Показываем все секции как заполненные
    const regionSection = document.querySelector('.filter-region-selection');
    const citySection = document.querySelector('.filter-city-selection');
    const selectedLocationDiv = document.querySelector('.filter-selected-location');
    const locationText = document.querySelector('.filter-location-text');
    
    console.log('Секции найдены:', {
        regionSection: !!regionSection,
        citySection: !!citySection,
        selectedLocationDiv: !!selectedLocationDiv,
        locationText: !!locationText
    });
    
    if (regionSection) {
        regionSection.style.display = 'block';
        regionSection.style.opacity = '1';
    }
    
    if (citySection) {
        citySection.style.display = 'block';
        citySection.style.opacity = '1';
    }
    
    if (selectedLocationDiv && locationText) {
        const fullLocation = `${locationData[userLocation.country].flag} ${userLocation.region}, ${userLocation.city}`;
        locationText.textContent = fullLocation;
        selectedLocationDiv.style.display = 'block';
        selectedLocationDiv.style.opacity = '1';
        console.log('Установлен текст локации:', fullLocation);
    }
    
    console.log('UI фильтра установлен на локацию пользователя:', userLocation);
}

// Сброс выбора локации для фильтра
function resetFilterLocationSelection() {
    filterSelectedCountry = null;
    filterSelectedRegion = null;
    filterSelectedCity = null;
    
    // Сбрасываем кнопки стран
    document.querySelectorAll('.filter-country').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Очищаем поля ввода
    document.querySelector('.filter-region-input').value = '';
    document.querySelector('.filter-city-input').value = '';
    
    // Скрываем все секции кроме выбора страны
    document.querySelector('.filter-region-selection').style.display = 'none';
    document.querySelector('.filter-city-selection').style.display = 'none';
    document.querySelector('.filter-selected-location').style.display = 'none';
    
    hideAllSuggestions();
    
    // Загружаем все анкеты
    loadAds();
    
    console.log('Выбор локации фильтра сброшен');
}

// Загрузка анкет по локации
function loadAdsByLocation(country, region, city) {
    try {
        console.log('🌍 Запрос анкет по локации:', {country, region, city});
        
        // Формируем фильтры для загрузки
        const filters = {};
        if (country) filters.country = country;
        if (city) filters.city = city;
        
        console.log('🔍 Итоговые фильтры для API:', filters);
        
        // Загружаем через наш API
        loadAds(filters);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки анкет по локации:', error);
    }
}

// === ФУНКЦИИ ДЛЯ НАСТРОЙКИ ЛОКАЦИИ ===

// Выбор страны в настройке
function selectSetupCountry(countryCode) {
    setupSelectedCountry = countryCode;
    setupSelectedRegion = null;
    setupSelectedCity = null;
    
    // Обновляем кнопки
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-country="${countryCode}"].setup-country`).classList.add('active');
    
    // Пропускаем выбор региона, сразу показываем города
    // Собираем все города из всех регионов страны
    const allCities = [];
    const regions = locationData[countryCode].regions;
    Object.keys(regions).forEach(regionName => {
        allCities.push(...regions[regionName]);
    });
    
    // Показываем выбор города с анимацией
    const citySection = document.querySelector('.setup-city-selection');
    if (citySection) {
        citySection.style.display = 'block';
        setTimeout(() => {
            citySection.style.opacity = '1';
        }, 50);
    }
    
    // Скрываем остальные секции
    const selectedLocation = document.querySelector('.setup-selected-location');
    if (selectedLocation) {
        selectedLocation.style.display = 'none';
    }
    
    // Очищаем поле города
    document.querySelector('.setup-city-input').value = '';
    
    // Сохраняем список всех городов для фильтрации
    window.setupAllCities = allCities;
    
    console.log('Выбрана страна для настройки:', locationData[countryCode].name);
    console.log('Доступно городов:', allCities.length);
    
    // Показываем все доступные города
    setTimeout(() => {
        showAllSetupCities();
    }, 100);
}

// Обработка ввода региона в настройке
function handleSetupRegionInput(value) {
    if (!setupSelectedCountry) return;
    
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const regions = Object.keys(locationData[setupSelectedCountry].regions);
    const filtered = regions.filter(region => 
        region.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showSetupRegionSuggestions(filtered);
}

// Показать все регионы в настройке
function showAllSetupRegions() {
    if (!setupSelectedCountry) return;
    
    const regions = Object.keys(locationData[setupSelectedCountry].regions);
    showSetupRegionSuggestions(regions);
}

// Показать предложения регионов в настройке
function showSetupRegionSuggestions(regions) {
    const suggestionsContainer = document.querySelector('.setup-region-suggestions');
    
    if (regions.length === 0) {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.classList.remove('active');
        return;
    }
    
    suggestionsContainer.innerHTML = regions.map(region => `
        <div class="suggestion-item" onclick="selectSetupRegion('${region}')">
            ${region}
        </div>
    `).join('');
    
    suggestionsContainer.style.display = 'block';
    suggestionsContainer.classList.add('active');
}

// Выбор региона в настройке
function selectSetupRegion(regionName) {
    setupSelectedRegion = regionName;
    setupSelectedCity = null;
    
    document.querySelector('.setup-region-input').value = regionName;
    hideAllSuggestions();
    
    // Показываем выбор города с анимацией
    const citySection = document.querySelector('.setup-city-selection');
    citySection.style.display = 'block';
    setTimeout(() => {
        citySection.style.opacity = '1';
    }, 50);
    
    // Очищаем поле города
    const cityInput = document.querySelector('.setup-city-input');
    cityInput.value = '';
    
    console.log('Выбран регион в настройке:', regionName);
    console.log('Доступные города:', locationData[setupSelectedCountry].regions[regionName]);
    
    // Показываем все доступные города для выбранного региона
    setTimeout(() => {
        showAllSetupCities();
    }, 100);
}

// Обработка ввода города в настройке
function handleSetupCityInput(value) {
    console.log('handleSetupCityInput вызвана со значением:', value);
    console.log('setupSelectedCountry:', setupSelectedCountry);
    
    if (!setupSelectedCountry) {
        console.log('Страна не выбрана, выходим');
        return;
    }
    
    if (!value.trim()) {
        console.log('Пустое значение, скрываем предложения');
        hideAllSuggestions();
        return;
    }
    
    const cities = window.setupAllCities || [];
    console.log('Доступные города:', cities.length);
    
    const filtered = cities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
    );
    console.log('Отфильтрованные города:', filtered.length);
    
    showSetupCitySuggestions(filtered);
}

// Показать все города в настройке
function showAllSetupCities() {
    console.log('showAllSetupCities вызвана');
    console.log('setupSelectedCountry:', setupSelectedCountry);
    
    if (!setupSelectedCountry) {
        console.log('Страна не выбрана, не показываем города');
        return;
    }
    
    const cities = window.setupAllCities || [];
    console.log('Всего городов:', cities.length);
    
    // Принудительно скрываем другие списки перед показом нового
    hideOtherSuggestions('setup-city-suggestions');
    showSetupCitySuggestions(cities);
}

// Показать предложения городов в настройке
function showSetupCitySuggestions(cities) {
    const suggestionsContainer = document.querySelector('.setup-city-suggestions');
    
    console.log('showSetupCitySuggestions вызвана с городами:', cities);
    console.log('Контейнер найден:', suggestionsContainer);
    
    if (!suggestionsContainer) {
        console.error('Контейнер для предложений городов не найден!');
        return;
    }
    
    if (cities.length === 0) {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.classList.remove('active');
        return;
    }
    
    // Очищаем и заполняем контент
    suggestionsContainer.innerHTML = cities.map(city => `
        <div class="suggestion-item" onclick="selectSetupCity('${city}')">
            ${city}
        </div>
    `).join('');
    
    // Принудительно показываем
    suggestionsContainer.style.display = 'block';
    suggestionsContainer.classList.add('active');
    
    // Дополнительная проверка что элемент видим
    setTimeout(() => {
        const computedStyle = window.getComputedStyle(suggestionsContainer);
        console.log('Стиль display после показа:', computedStyle.display);
        console.log('Класс active есть:', suggestionsContainer.classList.contains('active'));
    }, 10);
    console.log('Список городов отображен, HTML:', suggestionsContainer.innerHTML);
}

// Выбор города в настройке
function selectSetupCity(cityName) {
    setupSelectedCity = cityName;
    
    // Находим в каком регионе этот город
    const regions = locationData[setupSelectedCountry].regions;
    for (const regionName in regions) {
        if (regions[regionName].includes(cityName)) {
            setupSelectedRegion = regionName;
            break;
        }
    }
    
    document.querySelector('.setup-city-input').value = cityName;
    hideAllSuggestions();
    
    // Показываем выбранную локацию
    showSetupSelectedLocation();
    
    console.log('Выбран город в настройке:', cityName, 'Регион:', setupSelectedRegion);
}

// Показать выбранную локацию в настройке
function showSetupSelectedLocation() {
    const selectedLocationDiv = document.querySelector('.setup-selected-location');
    const locationText = document.querySelector('.setup-location-text');
    
    const fullLocation = `${locationData[setupSelectedCountry].flag} ${setupSelectedCity}`;
    locationText.textContent = fullLocation;
    
    // Скрываем секции выбора
    const citySelection = document.querySelector('.setup-city-selection');
    if (citySelection) {
        citySelection.style.display = 'none';
    }
    
    // Показываем выбранную локацию с анимацией
    selectedLocationDiv.style.display = 'block';
    setTimeout(() => {
        selectedLocationDiv.style.opacity = '1';
    }, 50);
}

// Сброс настройки локации
function resetSetupLocation() {
    setupSelectedCountry = null;
    setupSelectedRegion = null;
    setupSelectedCity = null;
    
    // Сбрасываем кнопки стран
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Очищаем поля ввода (с проверкой на существование)
    const cityInput = document.querySelector('.setup-city-input');
    
    if (cityInput) cityInput.value = '';
    
    // Скрываем все секции кроме выбора страны (с проверкой на существование)
    const citySelection = document.querySelector('.setup-city-selection');
    const selectedLocation = document.querySelector('.setup-selected-location');
    
    if (citySelection) citySelection.style.display = 'none';
    if (selectedLocation) selectedLocation.style.display = 'none';
    
    hideAllSuggestions();
    
    console.log('Настройка локации сброшена');
}

// Отладочные функции
window.debugApp = {
    formData: () => console.log(formData),
    currentStep: () => console.log(currentStep),
    tg: () => console.log(tg),
    locationData: () => console.log(locationData),
    selectedLocation: () => console.log({selectedCountry, selectedRegion, selectedCity}),
    filterLocation: () => console.log({filterSelectedCountry, filterSelectedRegion, filterSelectedCity}),
    setupLocation: () => console.log({setupSelectedCountry, setupSelectedRegion, setupSelectedCity}),
    userLocation: () => console.log(userLocation),
    checkStorage: () => {
        const localData = localStorage.getItem('userLocation');
        console.log('localStorage userLocation:', localData);
        if (tg.CloudStorage) {
            tg.CloudStorage.getItem('userLocation', (err, value) => {
                console.log('CloudStorage userLocation:', {err, value});
            });
        }
    },
    clearUserLocation: () => {
        if (tg.CloudStorage) {
            tg.CloudStorage.removeItem('userLocation');
        }
        localStorage.removeItem('userLocation');
        currentUserLocation = null;
        showAutoLocationDetection();
    },
    forceAutoDetection: () => {
        showAutoLocationDetection();
    }
};

// =============== ГАМБУРГЕР МЕНЮ ===============

function toggleHamburgerMenu() {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    overlay.classList.toggle('active');
}

function closeHamburgerMenu() {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    overlay.classList.remove('active');
}

// Закрытие меню при клике вне меню
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    const menu = overlay?.querySelector('.hamburger-menu');
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    
    if (overlay && menu) {
        // Слушаем клики по всему документу
        document.addEventListener('click', (e) => {
            // Если меню открыто и клик НЕ внутри меню и НЕ на кнопке открытия
            if (overlay.classList.contains('active') && 
                !menu.contains(e.target) && 
                !hamburgerBtn?.contains(e.target)) {
                closeHamburgerMenu();
            }
        });
    }
});

// Функции навигации по меню
function goToHome() {
    closeHamburgerMenu();
    showMainMenu();
    updateActiveMenuItem('home');
}

function showContacts() {
    closeHamburgerMenu();
    showScreen('contacts');
    updateActiveMenuItem('contacts');
}

// Флаг для отслеживания инициализации обработчиков формы
let emailFormHandlersInitialized = false;

function showEmailForm() {
    showScreen('emailForm');
    // Очищаем форму при открытии
    document.getElementById('senderEmail').value = '';
    document.getElementById('emailSubject').value = 'Обращение через anonimka.online';
    document.getElementById('emailMessage').value = '';
    document.getElementById('emailStatus').style.display = 'none';
    
    // Показываем подсказку
    showEmailStatus('loading', '💡 Заполните форму ниже. Письмо будет отправлено через защищённый сервер anonimka.online');
    
    // Инициализируем обработчики только один раз
    if (!emailFormHandlersInitialized) {
        setTimeout(() => {
            setupEmailFormHandlers();
        }, 100);
    }
}

// Отдельная функция для настройки обработчиков формы (вызывается только один раз)
function setupEmailFormHandlers() {
    const contactForm = document.getElementById('contactForm');
    
    console.log('setupEmailFormHandlers вызвана');
    console.log('contactForm найдена:', !!contactForm);
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleEmailSubmit);
        console.log('Обработчик submit добавлен к форме');
        emailFormHandlersInitialized = true;
    }
}

function showRules() {
    closeHamburgerMenu();
    showScreen('rules');
    updateActiveMenuItem('rules');
}

function showPrivacy() {
    closeHamburgerMenu();
    showScreen('privacy');
    updateActiveMenuItem('privacy');
}

function showAbout() {
    closeHamburgerMenu();
    showScreen('about');
    updateActiveMenuItem('about');
}

function updateActiveMenuItem(activeId) {
    // Убираем активный класс со всех элементов
    document.querySelectorAll('.hamburger-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Добавляем активный класс к нужному элементу
    const activeItem = document.querySelector(`.hamburger-item[onclick*="${activeId}"], .hamburger-item[onclick="goToHome()"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Функции для контактов
function openEmailComposer() {
    console.log('openEmailComposer вызвана');
    const recipient = 'aleksey@vorobey444.ru';
    const subject = encodeURIComponent('Обращение через anonimka.online');
    const body = encodeURIComponent(`Здравствуйте!\n\nПишу вам через анонимную доску анкет anonimka.online\n\n[Опишите вашу проблему или вопрос]\n\nС уважением,\n[Ваше имя]`);
    const mailtoLink = `mailto:${recipient}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
}

function openTelegramChat() {
    console.log('openTelegramChat вызвана');
    
    const telegramUrl = 'https://t.me/Vorobey_444';
    
    // Пробуем открыть через Telegram Web App API
    if (tg && tg.openTelegramLink) {
        console.log('Используем tg.openTelegramLink');
        tg.openTelegramLink(telegramUrl);
    } else if (tg && tg.openLink) {
        console.log('Используем tg.openLink');
        tg.openLink(telegramUrl);
    } else {
        console.log('Используем window.open как fallback');
        // Fallback - обычная ссылка
        window.open(telegramUrl, '_blank');
    }
}

// Настройка обработчиков событий для контактов
function setupContactsEventListeners() {
    console.log('Настройка обработчиков контактов');
    
    // НЕ добавляем обработчики формы здесь - они добавляются в setupEmailFormHandlers
    // который вызывается из showEmailForm()
    
    // Добавляем обработчики событий для Telegram контакта
    const telegramContact = document.querySelector('.contact-item[onclick*="openTelegramChat"]');
    
    if (telegramContact) {
        console.log('Найден элемент telegram контакта, добавляем обработчик');
        telegramContact.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Клик по telegram контакту');
            openTelegramChat();
        });
    }
}

// Обработчик отправки письма - ГЛОБАЛЬНАЯ ФУНКЦИЯ
window.handleEmailSubmit = async function(event) {
    if (event) event.preventDefault();
    console.log('🚀 handleEmailSubmit вызвана - РАБОТАЕТ!');
    
    const senderEmail = document.getElementById('senderEmail');
    const subject = document.getElementById('emailSubject');
    const message = document.getElementById('emailMessage');
    const sendBtn = document.getElementById('sendEmailBtn');
    
    console.log('Элементы формы:', {
        senderEmail: !!senderEmail,
        subject: !!subject, 
        message: !!message,
        sendBtn: !!sendBtn
    });
    
    if (!senderEmail || !subject || !message) {
        console.error('❌ Не найдены элементы формы!');
        tg.showAlert('Ошибка: элементы формы не найдены');
        return;
    }
    
    const emailValue = senderEmail.value.trim();
    const subjectValue = subject.value.trim();
    const messageValue = message.value.trim();
    
    console.log('Значения полей:', { emailValue, subjectValue, messageValue });
    
    // Валидация
    if (!emailValue || !messageValue) {
        console.log('❌ Валидация не прошла: пустые поля');
        showEmailStatus('error', '❌ Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    if (messageValue.length < 3) {
        console.log('❌ Валидация не прошла: короткое сообщение');
        showEmailStatus('error', '❌ Сообщение должно содержать минимум 3 символа');
        return;
    }
    
    console.log('✅ Валидация прошла успешно');
    
    // Подготавливаем данные письма заранее (нужно и для fallback в catch)
    const emailData = {
        senderEmail: (senderEmail?.value || '').trim(),
        subject: (subject?.value || 'Обращение через anonimka.online').trim() || 'Обращение через anonimka.online',
        message: (message?.value || '').trim()
    };

    // Показываем загрузку с собакой
    const statusContainer = document.getElementById('email-status');
    if (statusContainer) {
        statusContainer.innerHTML = `
            <div class="loading-spinner"></div>
            <p>📤 Отправляем письмо...</p>
        `;
        statusContainer.className = 'status loading';
    }
    if (sendBtn) sendBtn.disabled = true;
    
    try {
        // Обновим данные из проверенных полей (для надёжности)
        emailData.senderEmail = emailValue;
        emailData.subject = subjectValue || emailData.subject;
        emailData.message = messageValue;

        console.log('📧 Пытаемся отправить через бэкенд...');
        
        // Сначала пытаемся отправить через бэкенд
        const result = await sendEmailToBackend(emailData);
        
        // Если бэкенд сработал успешно
        if (result && result.success) {
            console.log('✅ Письмо отправлено через бэкенд!');
            showEmailStatus('success', '✅ Письмо успешно отправлено!');
            
            // Очищаем форму
            document.getElementById('senderEmail').value = '';
            document.getElementById('emailSubject').value = 'Обращение через anonimka.online';
            document.getElementById('emailMessage').value = '';
            
            return; // Выходим из функции, не переходя к mailto
        }
        
        // Если бэкенд не сработал, fallback не нужен для localhost
        // (ошибка будет обработана в catch блоке)
        
    } catch (error) {
        console.error('❌ Ошибка при отправке через бэкенд:', error);
        
        // Fallback: открываем mailto
        console.log('📧 Переходим к mailto fallback...');
        
        const subject_encoded = encodeURIComponent(`[anonimka.online] ${emailData.subject}`);
        const body_encoded = encodeURIComponent(`От: ${emailData.senderEmail}
Сообщение с сайта anonimka.online

${emailData.message}

---
Пожалуйста, отвечайте на адрес: ${emailData.senderEmail}
Время отправки: ${new Date().toLocaleString('ru-RU')}`);

        const mailtoLink = `mailto:aleksey@vorobey444.ru?subject=${subject_encoded}&body=${body_encoded}`;
        
        console.log('📧 Mailto ссылка создана:', mailtoLink);
        
        // Открываем почтовый клиент
        window.open(mailtoLink, '_blank');
        
        showEmailStatus('success', '✅ Почтовый клиент открыт! Если письмо не открылось, данные для ручной отправки ниже:');
        
        // Показываем данные для ручной отправки
        setTimeout(() => {
            showManualEmailOption(emailData);
        }, 2000);
    } finally {
        if (sendBtn) sendBtn.disabled = false;
    }
};
// Показать опцию ручной отправки
function showManualEmailOption(emailData) {
    const statusDiv = document.getElementById('emailStatus');
    statusDiv.className = 'email-status error';
    statusDiv.innerHTML = `
        📋 <strong>Данные для ручной отправки:</strong>
        <br><br>
        <strong>На:</strong> aleksey@vorobey444.ru<br>
        <strong>От:</strong> ${emailData.senderEmail}<br>
        <strong>Тема:</strong> ${emailData.subject}<br>
        <strong>Сообщение:</strong><br>
        ${emailData.message.replace(/\n/g, '<br>')}
        <br><br>
        <button class="neon-button secondary" onclick="copyEmailData('${emailData.senderEmail}', '${emailData.subject.replace(/'/g, "\\'")}', '${emailData.message.replace(/'/g, "\\'")}')">
            📋 Копировать данные
        </button>
        <button class="neon-button primary" onclick="openManualMailto('${emailData.senderEmail}', '${emailData.subject.replace(/'/g, "\\'")}', '${emailData.message.replace(/'/g, "\\'")}')">
            📧 Открыть почту
        </button>
    `;
}

// Копировать данные письма
function copyEmailData(senderEmail, subject, message) {
    const emailText = `На: aleksey@vorobey444.ru
От: ${senderEmail}
Тема: ${subject}

${message}`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(emailText).then(() => {
            showEmailStatus('success', '✅ Данные письма скопированы в буфер обмена');
        });
    } else {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = emailText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showEmailStatus('success', '✅ Данные письма скопированы в буфер обмена');
    }
}

// Открыть почтовый клиент вручную
function openManualMailto(senderEmail, subject, message) {
    const mailtoData = {
        senderEmail,
        subject,
        message
    };
    
    sendEmailViaMailto(mailtoData).then(result => {
        if (result.success) {
            showEmailStatus('success', result.message);
        } else {
            showEmailStatus('error', result.error);
        }
    });
}

// Глобальные функции для использования в onclick
window.copyEmailData = copyEmailData;
window.openManualMailto = openManualMailto;

// Показать статус отправки
function showEmailStatus(type, message) {
    const statusDiv = document.getElementById('emailStatus');
    statusDiv.className = `email-status ${type}`;
    
    if (type === 'loading') {
        statusDiv.innerHTML = `<div class="loading-spinner"></div>${message}`;
    } else {
        statusDiv.innerHTML = message;
    }
    
    statusDiv.style.display = 'block';
    
    // Автоматически скрываем сообщение через 5 секунд (кроме ошибок)
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

// Отправка письма на бэкенд
async function sendEmailToBackend(emailData) {
    try {
        // Определяем URL бэкенда
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        console.log('Текущий хост:', window.location.hostname);
        console.log('Это localhost?', isLocalhost);
        
        // Для локального тестирования используем Yandex Email сервер
        if (isLocalhost) {
            const backendUrl = 'http://localhost:5000/send-email';
            console.log('📧 Отправляем через Yandex SMTP сервер:', backendUrl);
            console.log('📨 Данные письма:', emailData);
            
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });
            
            if (!response.ok) {
                console.error('❌ Ошибка HTTP:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Детали ошибки:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Успешная отправка через Yandex:', result);
            return result;
        }
        
        // Для продакшена используем простую отправку как в whish.online
        console.log('📧 Продакшен: отправляем как в whish.online - просто и надёжно...');
        
        // Загружаем простую функцию email
        if (typeof window.sendEmailWhishStyle === 'undefined') {
            console.log('Загружаем Email Service...');
            await loadEmailService();
        }

        // Используем простую функцию отправки
        return window.sendEmailWhishStyle(emailData);
    } catch (error) {
        console.log('Бэкенд недоступен, используем альтернативный способ');
        console.error('Ошибка при отправке на бэкенд:', error);
        
        // Если бэкенд недоступен, используем Telegram Bot API
        return await sendEmailViaTelegram(emailData);
    }
}

// Альтернативная отправка через Telegram бота или mailto
async function sendEmailViaTelegram(emailData) {
    try {
        // Сначала пробуем через Telegram Web App
        if (tg && tg.sendData) {
            console.log('Отправляем через Telegram Web App');
            tg.sendData(JSON.stringify({
                action: 'sendEmail',
                data: {
                    senderEmail: emailData.senderEmail,
                    subject: emailData.subject,
                    message: emailData.message
                }
            }));
            
            return {
                success: true,
                message: 'Сообщение отправлено через Telegram бота'
            };
        } else {
            console.log('Telegram Web App недоступен, используем mailto');
            // Используем стандартный mailto как последний вариант
            return sendEmailViaMailto(emailData);
        }
    } catch (error) {
        console.error('Ошибка Telegram отправки:', error);
        return sendEmailViaMailto(emailData);
    }
}

// Отправка через стандартный mailto
async function sendEmailViaMailto(emailData) {
    try {
        const subject = encodeURIComponent(`[anonimka.online] ${emailData.subject}`);
        const body = encodeURIComponent(`От: ${emailData.senderEmail}
Сообщение с сайта anonimka.online

${emailData.message}

---
Пожалуйста, отвечайте на адрес: ${emailData.senderEmail}
Время отправки: ${new Date().toLocaleString('ru-RU')}`);

        const mailtoLink = `mailto:aleksey@vorobey444.ru?subject=${subject}&body=${body}`;
        
        // Открываем почтовый клиент
        window.open(mailtoLink, '_blank');
        
        return {
            success: true,
            message: 'Открыт почтовый клиент для отправки. Если письмо не открылось автоматически, скопируйте данные и отправьте вручную.'
        };
    } catch (error) {
        console.error('Ошибка mailto:', error);
        return {
            success: false,
            error: 'Не удалось открыть почтовый клиент. Отправьте письмо вручную на aleksey@vorobey444.ru'
        };
    }
}

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С ЧАТАМИ =====

let currentChatId = null;
let currentAdId = null;
let chatPollingInterval = null;
let myChatsPollingInterval = null;

// Показать список чатов
async function showMyChats() {
    // КРИТИЧНО: Проверяем никнейм перед показом чатов
    const nickname = localStorage.getItem('userNickname');
    if (!nickname || nickname.trim() === '') {
        console.warn('⚠️ Попытка открыть чаты без никнейма - блокируем');
        tg.showAlert('Сначала выберите никнейм');
        showOnboardingScreen();
        return;
    }
    
    showScreen('myChats');
    await loadMyChats();
    
    // Запускаем автообновление списка чатов каждые 5 секунд
    if (myChatsPollingInterval) {
        clearInterval(myChatsPollingInterval);
    }
    
    myChatsPollingInterval = setInterval(async () => {
        // Проверяем что пользователь все еще на экране "Мои чаты"
        const myChatsScreen = document.getElementById('myChats');
        if (myChatsScreen && myChatsScreen.classList.contains('active')) {
            console.log('🔄 Автообновление списка чатов...');
            await loadMyChats();
            await updateChatBadge(); // Обновляем счетчик на кнопке
        } else {
            // Если ушел с экрана - останавливаем обновление
            console.log('⏸️ Остановка автообновления (ушли с экрана чатов)');
            clearInterval(myChatsPollingInterval);
            myChatsPollingInterval = null;
        }
    }, 5000); // Каждые 5 секунд
}

// Переключение вкладок
function switchChatTab(tab) {
    // Переключаем активную кнопку
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.tab-btn').classList.add('active');
    
    // Переключаем контент
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'active') {
        document.getElementById('activeChatsTab').classList.add('active');
    } else if (tab === 'requests') {
        document.getElementById('requestsTab').classList.add('active');
    }
}

// Загрузить список чатов пользователя
async function loadMyChats() {
    const activeChats = document.getElementById('activeChats');
    const chatRequests = document.getElementById('chatRequests');
    
    try {
        // Получаем user_token (основной идентификатор в новой системе)
        let userId = localStorage.getItem('user_token');
        
        // Fallback на Telegram ID если токена нет (для старых пользователей)
        if (!userId || userId === 'null' || userId === 'undefined') {
            userId = tg.initDataUnsafe?.user?.id;
            
            if (!userId) {
                const savedUser = localStorage.getItem('telegram_user');
                if (savedUser) {
                    const userData = JSON.parse(savedUser);
                    userId = userData.id;
                    safeLog('✅ User ID получен из localStorage (fallback)');
                }
            } else {
                safeLog('✅ User ID получен из Telegram (fallback)');
            }
        } else {
            safeLog('✅ User token получен из localStorage');
        }
        
        if (!userId) {
            console.error('❌ User token/ID не найден');
            const errorHTML = `
                <div class="empty-chats">
                    <div class="neon-icon">🔒</div>
                    <h3>Необходима авторизация</h3>
                    <p>Для доступа к чатам создайте анкету или авторизуйтесь</p>
                </div>
            `;
            activeChats.innerHTML = errorHTML;
            chatRequests.innerHTML = errorHTML;
            return;
        }

        safeLog('📡 Загружаем чаты для пользователя:', userId.substring(0, 10) + '...');

        // Получаем принятые чаты через Neon API
        const acceptedResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-active',
                params: { userId }
            })
        });
        const acceptedResult = await acceptedResponse.json();
        
        // Получаем входящие запросы через Neon API
        const pendingResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-pending',
                params: { user_token: userId }
            })
        });
        const pendingResult = await pendingResponse.json();

        if (acceptedResult.error || pendingResult.error) {
            const error = acceptedResult.error || pendingResult.error;
            console.warn('⚠️ Ошибка загрузки чатов:', error.message);
            const errorHTML = `
                <div class="empty-chats">
                    <div class="neon-icon">⚠️</div>
                    <h3>Чаты недоступны</h3>
                    <p>Ошибка подключения к базе данных</p>
                </div>
            `;
            activeChats.innerHTML = errorHTML;
            chatRequests.innerHTML = errorHTML;
            return;
        }

        let acceptedChats = acceptedResult.data || [];
        let pendingRequests = pendingResult.data || [];

        // Сортировка активных чатов: самые свежие сверху
        const parseTs = (ts) => {
            if (!ts) return 0;
            try { return new Date(ts).getTime() || 0; } catch { return 0; }
        };
        acceptedChats = acceptedChats.sort((a, b) => {
            const tb = parseTs(b.last_message_time || b.updated_at || b.created_at);
            const ta = parseTs(a.last_message_time || a.updated_at || a.created_at);
            return tb - ta;
        });
        // Входящие запросы уже отсортированы на бэкенде (PRO сначала, потом по дате)

        console.log('📊 Принятые чаты:', acceptedChats.length);
        console.log('📊 Входящие запросы:', pendingRequests.length);

        // Обновляем счетчики
        document.getElementById('activeChatsCount').textContent = acceptedChats.length;
        document.getElementById('requestsCount').textContent = pendingRequests.length;

        // Отображаем открытые чаты
        if (acceptedChats.length === 0) {
            activeChats.innerHTML = `
                <div class="empty-chats">
                    <div class="neon-icon">💬</div>
                    <h3>Нет открытых чатов</h3>
                    <p>Принятые чаты появятся здесь</p>
                </div>
            `;
        } else {
            activeChats.innerHTML = acceptedChats.map(chat => {
                const lastMessageTime = chat.last_message_time ? formatChatTime(chat.last_message_time) : (chat.updated_at ? formatChatTime(chat.updated_at) : '');
                const lastMessage = chat.last_message || 'Нажмите для открытия чата';
                const lastMessagePreview = lastMessage.length > 50 ? lastMessage.substring(0, 50) + '...' : lastMessage;
                const unreadCount = parseInt(chat.unread_count) || 0;
                const unreadBadge = unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : '';
                
                // Проверяем блокировку
                let blockStatus = '';
                const hasBlockedBy = !!chat.blocked_by;
                const hasBlockedByToken = !!chat.blocked_by_token;
                if (hasBlockedBy || hasBlockedByToken) {
                    const isBlockedByMe = (hasBlockedBy && String(chat.blocked_by) == String(userId))
                        || (hasBlockedByToken && String(chat.blocked_by_token) === String(userId));
                    if (isBlockedByMe) {
                        blockStatus = '<span style="color: var(--neon-orange); font-size: 0.8rem;">🚫 (Чат заблокирован вами) – кнопка "Разблокировать" доступна внутри</span>';
                    } else {
                        blockStatus = '<span style="color: var(--neon-pink); font-size: 0.8rem;">🚫 (Вы заблокированы) – история доступна, отправка запрещена</span>';
                    }
                }
                
                return `
                    <div class="chat-card" onclick="openChat('${chat.id}')">
                        <div class="chat-card-header">
                            <span class="chat-ad-id" onclick="event.stopPropagation(); showAdModal('${chat.ad_id}');">💬 Чат #${chat.id || 'N/A'}</span>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                ${unreadBadge}
                                <span class="chat-time">${lastMessageTime}</span>
                            </div>
                        </div>
                        <div class="chat-preview">
                            ${blockStatus || lastMessagePreview}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Отображаем запросы на чаты
        if (pendingRequests.length === 0) {
            chatRequests.innerHTML = `
                <div class="empty-chats">
                    <div class="neon-icon">📨</div>
                    <h3>Нет новых запросов</h3>
                    <p>Запросы на чаты от других пользователей появятся здесь</p>
                </div>
            `;
        } else {
            chatRequests.innerHTML = pendingRequests.map(chat => {
                const requestTime = chat.created_at ? formatChatTime(chat.created_at) : '';
                // Определяем, кто отправитель (не текущий пользователь)
                const isUser1 = chat.user1 === userId;
                const senderId = isUser1 ? chat.user2 : chat.user1;
                
                // Используем sender_nickname из последнего сообщения или fallback
                const senderName = chat.sender_nickname || 'Собеседник';
                
                // Используем last_message_text из запроса или дефолтное сообщение
                let messageText = chat.last_message_text || chat.message || 'Хочет начать диалог';
                
                // Обрезаем сообщение до 80 символов
                if (messageText.length > 80) {
                    messageText = messageText.substring(0, 77) + '...';
                }
                
                // Проверяем PRO статус отправителя
                const isPremium = chat.sender_is_premium && 
                                 (!chat.sender_premium_until || new Date(chat.sender_premium_until) > new Date());
                const proBadge = isPremium ? '<span class="pro-badge">⭐</span>' : '';
                
                return `
                    <div class="chat-request-card ${isPremium ? 'pro-request' : ''}">
                        <div class="request-header">
                            <span class="request-ad-id">📨 Чат #${chat.id || 'N/A'} ${proBadge}</span>
                            <span class="request-time">${requestTime}</span>
                        </div>
                        <div class="request-message">
                            <strong>${escapeHtml(senderName)}</strong><br>
                            "${escapeHtml(messageText)}"
                        </div>
                        <div class="request-actions">
                            <button class="request-btn request-btn-accept" onclick="acceptChatRequest('${chat.id}')">
                                ✅ Создать приватный чат
                            </button>
                            <button class="request-btn request-btn-reject" onclick="rejectChatRequest('${chat.id}')">
                                ❌ Отклонить
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

    } catch (error) {
        console.error('❌ Критическая ошибка в loadMyChats:', error);
        console.error('Stack trace:', error.stack);
        const errorHTML = `
            <div class="empty-chats">
                <div class="neon-icon">⚠️</div>
                <h3>Ошибка</h3>
                <p>Не удалось загрузить чаты</p>
                <p style="font-size: 12px; color: #888;">${error.message}</p>
            </div>
        `;
        activeChats.innerHTML = errorHTML;
        chatRequests.innerHTML = errorHTML;
    }
}

// Принять запрос на чат
async function acceptChatRequest(chatId) {
    try {
        console.log('✅ Принимаем запрос на чат:', chatId);
        
        // Получаем user_token (основной идентификатор)
        let userId = localStorage.getItem('user_token');
        
        // Fallback на Telegram ID если токена нет
        if (!userId || userId === 'null' || userId === 'undefined') {
            userId = getCurrentUserId();
        }
        
        // Используем Neon API
        const response = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'accept',
                params: { chatId, userId }
            })
        });
        const result = await response.json();

        if (result.error) {
            console.warn('⚠️ Ошибка:', result.error.message);
            tg.showAlert('Ошибка при принятии запроса');
            return;
        }

        const chatCreatedMessages = [
            '✅ Чат создан! Вперёд общаться! 💬',
            '🎉 Го в чат! Новое общение началось 🚀',
            '💫 Чат открыт! Время знакомиться 😎',
            '🔥 Поехали! Чат активирован! ⚡️'
        ];
        const randomChatMsg = chatCreatedMessages[Math.floor(Math.random() * chatCreatedMessages.length)];
        tg.showAlert(randomChatMsg);
        await loadMyChats(); // Перезагружаем список
        updateChatBadge(); // Обновляем счетчик
        
    } catch (error) {
        console.error('Критическая ошибка acceptChatRequest:', error);
        tg.showAlert('Произошла ошибка');
    }
}

// Отклонить запрос на чат
async function rejectChatRequest(chatId) {
    try {
        console.log('❌ Отклоняем запрос на чат:', chatId);
        
        // Получаем user_token (основной идентификатор)
        let userId = localStorage.getItem('user_token');
        
        // Fallback на Telegram ID если токена нет
        if (!userId || userId === 'null' || userId === 'undefined') {
            userId = getCurrentUserId();
        }
        
        // Используем Neon API
        const response = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'reject',
                params: { chatId, userId }
            })
        });
        const result = await response.json();

        if (result.error) {
            console.warn('⚠️ Ошибка:', result.error.message);
            tg.showAlert('Ошибка при отклонении запроса');
            return;
        }

        tg.showAlert('Запрос отклонён');
        await loadMyChats(); // Перезагружаем список
        updateChatBadge(); // Обновляем счетчик
        
    } catch (error) {
        console.error('Критическая ошибка rejectChatRequest:', error);
        tg.showAlert('Произошла ошибка');
    }
}

// Обновить счетчик новых запросов и непрочитанных сообщений на кнопке "Мои чаты"
async function updateChatBadge() {
    try {
        // Получаем user_token (основной идентификатор)
        let userId = localStorage.getItem('user_token');
        
        // Fallback на Telegram ID если токена нет
        if (!userId || userId === 'null' || userId === 'undefined') {
            userId = getCurrentUserId();
        }
        
        if (!userId || userId.startsWith('web_')) {
            return; // Не показываем счетчик для неавторизованных
        }

        // Получаем количество запросов
        const requestsResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'count-requests',
                params: { userId }
            })
        });
        const requestsResult = await requestsResponse.json();
        
        // Получаем количество непрочитанных сообщений
        const unreadResponse = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'total-unread',
                params: { userId }
            })
        });
        const unreadResult = await unreadResponse.json();
        
        const badge = document.getElementById('chatBadge');
        
        if (requestsResult.error || unreadResult.error) {
            // Тихо скрываем счетчик если есть ошибка
            console.warn('⚠️ Ошибка обновления счетчика чатов');
            if (badge) badge.style.display = 'none';
            return;
        }
        
        const requestsCount = requestsResult.data?.count || 0;
        const unreadCount = unreadResult.data?.count || 0;
        const totalCount = requestsCount + unreadCount;
        
        if (badge) {
            if (totalCount > 0) {
                badge.textContent = totalCount;
                badge.style.display = 'inline-block';
                console.log(`📊 Счётчик чатов: ${requestsCount} запросов + ${unreadCount} непрочитанных = ${totalCount}`);
            } else {
                badge.style.display = 'none';
            }
        }
        
    } catch (error) {
        // Тихо обрабатываем ошибку без вывода в консоль
        const badge = document.getElementById('chatBadge');
        if (badge) badge.style.display = 'none';
    }
}

// Открыть чат
async function openChat(chatId) {
    console.log('💬 Открываем чат:', chatId);
    
    currentChatId = chatId;
    showScreen('chatView');
    
    // Очищаем поле ввода при переключении чата
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value = '';
    }
    
    // Загружаем информацию о чате через Neon API
    try {
        // Получаем user_token (основной идентификатор)
        let userId = localStorage.getItem('user_token');
        
        // Fallback на Telegram ID если токена нет
        if (!userId || userId === 'null' || userId === 'undefined') {
            userId = getCurrentUserId();
        }
        
        // Отмечаем пользователя как активного в этом чате
        await markUserActive(userId, chatId);
        
        const response = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-active',
                params: { userId }
            })
        });
        const result = await response.json();
        
        if (result.error || !result.data) {
            tg.showAlert('Ошибка загрузки чата');
            showMyChats();
            return;
        }
        
        // Находим нужный чат
        const chat = result.data.find(c => c.id == chatId);
        
        if (!chat) {
            tg.showAlert('Чат не найден');
            showMyChats();
            return;
        }
        
        // Проверяем статус чата
        if (chat.accepted === false) {
            tg.showAlert('⚠️ Собеседник ещё не принял запрос на чат. Дождитесь принятия.');
            showMyChats();
            return;
        }

        // Обновляем заголовок
        document.getElementById('chatTitle').innerHTML = '<span style="line-height: 1.2;">Anonimka.KZ<br><span style="font-size: 0.8em;">Анонимное общение</span></span>';
        const chatAdIdElement = document.getElementById('chatAdId');
        chatAdIdElement.innerHTML = `Чат #${chat.id || 'N/A'} - <span class="view-ad-link" onclick="showAdModal(${chat.ad_id})">Смотреть анкету</span>`;
        
        // Сохраняем ad_id для использования в других функциях
        currentAdId = chat.ad_id;

        // Загружаем сообщения
        await loadChatMessages(chatId);
        
        // Применяем сохраненный размер шрифта
        applyChatFontSize();
        
        // Проверяем статус блокировки
        await checkBlockStatus(chatId);
        
        // Принудительно скроллим вниз после загрузки
        const scrollContainer = document.querySelector('.chat-messages-container');
        setTimeout(() => {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            console.log('🔽 Принудительный скролл после открытия чата');
        }, 200);
        
        // Помечаем сообщения как прочитанные
        await markMessagesAsRead(chatId);
        
        // Запускаем периодическое обновление сообщений
        startChatPolling(chatId, userId);
        
    } catch (error) {
        console.error('Ошибка открытия чата:', error);
        tg.showAlert('Ошибка загрузки чата');
        showMyChats();
    }
}

// Загрузить сообщения чата
async function loadChatMessages(chatId, silent = false) {
    const messagesContainer = document.getElementById('chatMessages');
    const scrollContainer = document.querySelector('.chat-messages-container');
    
    // Показываем загрузку только при первом открытии
    if (!silent) {
        messagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray); padding: 20px;">Загрузка сообщений...</p>';
    }
    
    try {
        // Получаем сообщения через Neon API
        const response = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-messages',
                params: { chatId }
            })
        });
        const result = await response.json();

        if (result.error) {
            console.error('Ошибка загрузки сообщений:', result.error);
            if (!silent) {
                messagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray);">Ошибка загрузки сообщений</p>';
            }
            return;
        }

        const messages = result.data || [];

        if (messages.length === 0) {
            messagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray);">Нет сообщений. Начните диалог!</p>';
            return;
        }

        // Получаем user_token для сравнения (основной идентификатор)
        let myUserId = localStorage.getItem('user_token');
        
        // Fallback на Telegram ID если токена нет
        if (!myUserId || myUserId === 'null' || myUserId === 'undefined') {
            myUserId = getCurrentUserId();
        }
        
        // Проверяем, нужно ли обновлять (есть ли новые сообщения)
        const currentMessagesCount = messagesContainer.querySelectorAll('.message').length;
        if (silent && currentMessagesCount === messages.length) {
            // Нет новых сообщений, не обновляем
            return;
        }
        
        // Сохраняем позицию скролла только для silent режима
        const wasAtBottom = silent ? 
            (scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 50) : 
            true; // При первой загрузке всегда скроллим вниз
        
        // Сохраняем никнейм оппонента из первого его сообщения
        const firstOpponentMessage = messages.find(msg => msg.sender_token != myUserId);
        if (firstOpponentMessage && firstOpponentMessage.sender_nickname) {
            window.currentOpponentNickname = firstOpponentMessage.sender_nickname;
        }
        
        messagesContainer.innerHTML = messages.map(msg => {
            // Сравниваем sender_token с моим токеном/ID
            const isMine = msg.sender_token == myUserId;
            const messageClass = isMine ? 'sent' : 'received';
            const time = formatMessageTime(msg.created_at);
            
            // Индикатор ответа (если это ответ на другое сообщение)
            let replyIndicatorHtml = '';
            if (msg.reply_to_message_id) {
                // Находим оригинальное сообщение для отображения превью
                const originalMsg = messages.find(m => m.id == msg.reply_to_message_id);
                const replyToNickname = originalMsg?.sender_nickname || 'Собеседник';
                const replyToText = originalMsg?.message || '📸 Фото';
                const replyPreviewText = replyToText.length > 30 ? replyToText.substring(0, 30) + '...' : replyToText;
                
                replyIndicatorHtml = `
                    <div class="message-reply-indicator" onclick="scrollToMessage(${msg.reply_to_message_id})">
                        <div class="reply-indicator-line"></div>
                        <div class="reply-indicator-content">
                            <div class="reply-indicator-nickname">${escapeHtml(replyToNickname)}</div>
                            <div class="reply-indicator-text">${escapeHtml(replyPreviewText)}</div>
                        </div>
                    </div>
                `;
            }
            
            // Ник для входящих сообщений из базы данных
            let nicknameHtml = '';
            if (!isMine) {
                // Используем sender_nickname из сообщения или fallback
                const nickname = msg.sender_nickname || 'Собеседник';
                nicknameHtml = `<div class="message-nickname">${escapeHtml(nickname)}</div>`;
            }
            
            // Фото или видео если есть
            let photoHtml = '';
            if (msg.photo_url) {
                // Определяем тип файла по расширению
                const isVideo = msg.photo_url.includes('.mp4') || msg.photo_url.includes('.mov') || msg.photo_url.includes('video');
                
                if (isVideo) {
                    photoHtml = `<video src="${escapeHtml(msg.photo_url)}" class="message-photo" controls playsinline controlslist="nodownload" disablePictureInPicture></video>`;
                } else {
                    // Защищенное фото через DIV с background-image (нельзя скачать)
                    const photoId = `photo-${msg.id || Date.now()}`;
                    photoHtml = `<div id="${photoId}" class="message-photo-secure" style="background-image: url('${escapeHtml(msg.photo_url)}');" data-photo-url="${escapeHtml(msg.photo_url)}"></div>`;
                    
                    // Добавляем обработчик клика после рендеринга
                    setTimeout(() => {
                        const photoEl = document.getElementById(photoId);
                        if (photoEl) {
                            photoEl.addEventListener('click', () => {
                                showPhotoModal(photoEl.dataset.photoUrl);
                            });
                        }
                    }, 50);
                }
            }
            
            // Текст сообщения (если есть)
            let messageTextHtml = '';
            if (msg.message) {
                messageTextHtml = `<div class="message-text">${escapeHtml(msg.message)}</div>`;
            }
            
            // Статусы доставки (только для отправленных сообщений)
            let statusIcon = '';
            if (isMine) {
                if (msg.read) {
                    // Прочитано - 2 неоновые галочки
                    statusIcon = '<span class="message-status read">✓✓</span>';
                } else if (msg.delivered) {
                    // Доставлено - 2 серые галочки
                    statusIcon = '<span class="message-status delivered">✓✓</span>';
                } else {
                    // Отправлено - 1 серая галочка
                    statusIcon = '<span class="message-status sent">✓</span>';
                }
            }
            
            const nickname = msg.sender_nickname || 'Собеседник';
            
            // Реакции на сообщение
            let reactionHtml = '';
            if (msg.reactions && msg.reactions.length > 0) {
                const topReaction = msg.reactions[0];
                reactionHtml = `
                    <div class="message-reaction" data-message-id="${msg.id}">
                        <span class="message-reaction-emoji">${topReaction.emoji}</span>
                        ${topReaction.count > 1 ? `<span class="message-reaction-count">${topReaction.count}</span>` : ''}
                    </div>
                `;
            }
            
            return `
                <div class="message ${messageClass}" 
                     data-message-id="${msg.id}" 
                     data-nickname="${escapeHtml(nickname)}"
                     data-is-mine="${isMine}">
                    ${replyIndicatorHtml}
                    ${nicknameHtml}
                    ${photoHtml}
                    ${messageTextHtml}
                    <div class="message-time">${time} ${statusIcon}</div>
                    ${reactionHtml}
                </div>
            `;
        }).join('');

        // Добавляем обработчики реакций на сообщения
        setupMessageReactions();
        
        // Прокручиваем вниз если это первая загрузка или были внизу
        if (!silent || wasAtBottom) {
            // Сначала пробуем немедленно
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            
            // Затем с небольшой задержкой для гарантии (браузер может не успеть отрендерить)
            setTimeout(() => {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
                console.log('📜 Скролл выполнен:', {
                    scrollTop: scrollContainer.scrollTop,
                    scrollHeight: scrollContainer.scrollHeight,
                    clientHeight: scrollContainer.clientHeight
                });
            }, 100);
            
            // И ещё раз с бОльшей задержкой на случай медленного рендеринга
            setTimeout(() => {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }, 300);
        }
        
        // Добавляем свайп-обработчики к сообщениям
        setupMessageSwipeHandlers();

    } catch (error) {
        console.error('Ошибка:', error);
        if (!silent) {
            messagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray);">Ошибка загрузки</p>';
        }
    }
}

// Настройка свайпа для ответа на сообщения
function setupMessageSwipeHandlers() {
    const messages = document.querySelectorAll('.message');
    
    messages.forEach(msg => {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let isDragging = false;
        let hasMoved = false;
        
        const handleStart = (e) => {
            startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            currentX = startX;
            isDragging = true;
            hasMoved = false;
            msg.style.transition = 'none';
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            
            currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
            const diffX = currentX - startX;
            const diffY = Math.abs(currentY - startY);
            
            // Отмечаем что было движение (более 5px)
            if (Math.abs(diffX) > 5 || diffY > 5) {
                hasMoved = true;
            }
            
            const isMine = msg.getAttribute('data-is-mine') === 'true';
            
            // Свайп влево (для всех) - ответить
            if (diffX < 0 && diffX > -150) {
                msg.style.transform = `translateX(${diffX}px)`;
            }
            // Свайп вправо (только свои) - удалить
            else if (diffX > 0 && diffX < 150 && isMine) {
                msg.style.transform = `translateX(${diffX}px)`;
            }
        };
        
        const handleEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            
            const diff = currentX - startX;
            msg.style.transition = 'transform 0.2s ease';
            msg.style.transform = '';
            
            const isMine = msg.getAttribute('data-is-mine') === 'true';
            
            // Свайп влево (-100px) И было движение - показываем ответ
            if (diff < -100 && hasMoved) {
                const messageId = msg.getAttribute('data-message-id');
                const nickname = msg.getAttribute('data-nickname');
                const messageText = msg.querySelector('.message-text')?.textContent || '';
                
                if (messageId && nickname) {
                    // Вибрация
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
                    }
                    replyToMsg(messageId, nickname, messageText);
                }
            }
            // Свайп вправо (100px) И своё сообщение И было движение - удалить
            else if (diff > 100 && isMine && hasMoved) {
                const messageId = msg.getAttribute('data-message-id');
                if (messageId) {
                    // Вибрация
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
                    }
                    showDeleteMessageMenu(null, parseInt(messageId));
                }
            }
            
            // Сбрасываем флаг
            hasMoved = false;
        };
        
        // Touch events
        msg.addEventListener('touchstart', handleStart, { passive: true });
        msg.addEventListener('touchmove', handleMove, { passive: true });
        msg.addEventListener('touchend', handleEnd, { passive: true });
        
        // Mouse events для десктопа
        msg.addEventListener('mousedown', handleStart);
        msg.addEventListener('mousemove', handleMove);
        msg.addEventListener('mouseup', handleEnd);
        msg.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                msg.style.transition = 'transform 0.2s ease';
                msg.style.transform = '';
            }
        });
    });
}

// Обработка реакций на сообщения
function setupMessageReactions() {
    const messages = document.querySelectorAll('.message');
    
    messages.forEach(msg => {
        const isMine = msg.getAttribute('data-is-mine') === 'true';
        
        let clickTimeout = null;
        let clickCount = 0;
        let longPressTimer = null;
        let longPressStarted = false;
        
        // Удаляем старые обработчики если есть
        msg.removeEventListener('click', msg._reactionClickHandler);
        msg.removeEventListener('touchstart', msg._reactionTouchStart);
        msg.removeEventListener('touchend', msg._reactionTouchEnd);
        msg.removeEventListener('touchmove', msg._reactionTouchMove);
        
        // Обработчик двойного клика
        const handleClick = (e) => {
            // Игнорируем клики на фото, видео, кнопки и реакции
            if (e.target.closest('.message-photo, .message-photo-secure, video, button, .message-reply-indicator, .message-reaction')) {
                return;
            }
            
            // Не разрешаем ставить реакции на свои сообщения
            if (isMine) {
                return;
            }
            
            // Если было долгое нажатие, игнорируем клик
            if (longPressStarted) {
                longPressStarted = false;
                return;
            }
            
            clickCount++;
            
            if (clickCount === 1) {
                // Первый клик - ждем второй
                clickTimeout = setTimeout(() => {
                    // Одинарный клик - ничего не делаем (свайп для ответа)
                    clickCount = 0;
                }, 300);
            } else if (clickCount === 2) {
                // Двойной клик - ставим сердечко
                clearTimeout(clickTimeout);
                clickCount = 0;
                addReaction(msg, '❤️');
            }
        };
        
        // Долгое нажатие - показываем меню реакций
        const handleTouchStart = (e) => {
            if (e.target.closest('.message-photo, .message-photo-secure, video, button, .message-reply-indicator, .message-reaction')) {
                return;
            }
            
            // Не разрешаем ставить реакции на свои сообщения
            if (isMine) {
                return;
            }
            
            longPressTimer = setTimeout(() => {
                longPressStarted = true;
                showReactionPicker(msg, e.touches[0]);
            }, 500);
        };
        
        const handleTouchEnd = () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            setTimeout(() => {
                longPressStarted = false;
            }, 100);
        };
        
        const handleTouchMove = () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        };
        
        msg._reactionClickHandler = handleClick;
        msg._reactionTouchStart = handleTouchStart;
        msg._reactionTouchEnd = handleTouchEnd;
        msg._reactionTouchMove = handleTouchMove;
        
        msg.addEventListener('click', handleClick);
        msg.addEventListener('touchstart', handleTouchStart, { passive: true });
        msg.addEventListener('touchend', handleTouchEnd);
        msg.addEventListener('touchmove', handleTouchMove);
    });
    
    // Добавляем обработчики удаления для всех существующих реакций
    document.querySelectorAll('.message-reaction').forEach(reactionEl => {
        // Удаляем старый обработчик если есть
        if (reactionEl._removeHandler) {
            reactionEl.removeEventListener('click', reactionEl._removeHandler);
        }
        
        const removeHandler = async (e) => {
            e.stopPropagation();
            const messageId = reactionEl.getAttribute('data-message-id');
            const emojiEl = reactionEl.querySelector('.message-reaction-emoji');
            if (!emojiEl) return;
            
            const emoji = emojiEl.textContent;
            
            try {
                const response = await fetch('/api/reactions', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Token': window.userToken
                    },
                    body: JSON.stringify({
                        message_id: parseInt(messageId),
                        emoji: emoji
                    })
                });
                
                if (response.ok) {
                    reactionEl.remove();
                }
            } catch (error) {
                console.error('Ошибка удаления реакции:', error);
            }
        };
        
        reactionEl._removeHandler = removeHandler;
        reactionEl.addEventListener('click', removeHandler);
    });
}

// Показать меню выбора реакций
function showReactionPicker(messageElement, event) {
    // Закрываем предыдущее меню если есть
    closeReactionPicker();
    
    const reactions = ['❤️', '👍', '😂', '🔥', '👎', '😠'];
    
    const picker = document.createElement('div');
    picker.className = 'reaction-picker';
    picker.id = 'reactionPicker';
    
    reactions.forEach(emoji => {
        const option = document.createElement('div');
        option.className = 'reaction-option';
        option.textContent = emoji;
        option.onclick = () => {
            addReaction(messageElement, emoji);
            closeReactionPicker();
        };
        picker.appendChild(option);
    });
    
    document.body.appendChild(picker);
    
    // Предотвращаем закрытие при скролле внутри меню
    picker.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    }, { passive: true });
    
    picker.addEventListener('touchmove', (e) => {
        e.stopPropagation();
    }, { passive: true });
    
    // Позиционируем меню
    const rect = messageElement.getBoundingClientRect();
    const pickerRect = picker.getBoundingClientRect();
    
    // Размещаем над сообщением по центру
    let left = rect.left + rect.width / 2 - pickerRect.width / 2;
    let top = rect.top - pickerRect.height - 10;
    
    // Проверяем, не выходит ли за края экрана
    if (left < 10) left = 10;
    if (left + pickerRect.width > window.innerWidth - 10) {
        left = window.innerWidth - pickerRect.width - 10;
    }
    if (top < 10) {
        // Если не влезает сверху, показываем снизу
        top = rect.bottom + 10;
    }
    
    picker.style.left = left + 'px';
    picker.style.top = top + 'px';
    
    // Закрываем при клике вне меню
    setTimeout(() => {
        document.addEventListener('click', closeReactionPickerOnClickOutside);
    }, 100);
}

// Закрыть меню реакций
function closeReactionPicker() {
    const picker = document.getElementById('reactionPicker');
    if (picker) {
        picker.remove();
        document.removeEventListener('click', closeReactionPickerOnClickOutside);
    }
}

function closeReactionPickerOnClickOutside(e) {
    const picker = document.getElementById('reactionPicker');
    if (picker && !picker.contains(e.target)) {
        closeReactionPicker();
    }
}

// Добавить реакцию на сообщение
async function addReaction(messageElement, emoji) {
    const messageId = messageElement.dataset.messageId;
    
    if (!messageId) {
        console.error('Message ID not found');
        return;
    }
    
    try {
        // Показываем реакцию сразу для отзывчивости
        showReactionOnMessage(messageElement, emoji);
        
        // Отправляем на сервер
        const userToken = localStorage.getItem('user_token');
        const response = await fetch('/api/reactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message_id: messageId,
                emoji: emoji,
                user_token: userToken
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to add reaction');
        }
        
        const data = await response.json();
        console.log('✅ Реакция добавлена:', data);
        
    } catch (error) {
        console.error('❌ Ошибка добавления реакции:', error);
        // Убираем реакцию при ошибке
        removeReactionFromMessage(messageElement);
    }
}

// Показать реакцию на сообщении
function showReactionOnMessage(messageElement, emoji, count = 1) {
    // Удаляем старую реакцию если есть
    const existingReaction = messageElement.querySelector('.message-reaction');
    if (existingReaction) {
        existingReaction.remove();
    }
    
    const messageId = messageElement.getAttribute('data-message-id');
    const reaction = document.createElement('div');
    reaction.className = 'message-reaction';
    reaction.setAttribute('data-message-id', messageId);
    reaction.innerHTML = `
        <span class="message-reaction-emoji">${emoji}</span>
        ${count > 1 ? `<span class="message-reaction-count">${count}</span>` : ''}
    `;
    
    // Клик на реакцию - удаляем её
    const removeHandler = async (e) => {
        e.stopPropagation();
        
        try {
            const response = await fetch('/api/reactions', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Token': window.userToken
                },
                body: JSON.stringify({
                    message_id: parseInt(messageId),
                    emoji: emoji
                })
            });
            
            if (response.ok) {
                reaction.remove();
            }
        } catch (error) {
            console.error('Ошибка удаления реакции:', error);
        }
    };
    
    reaction._removeHandler = removeHandler;
    reaction.addEventListener('click', removeHandler);
    
    messageElement.appendChild(reaction);
}

// Убрать реакцию с сообщения
function removeReactionFromMessage(messageElement) {
    const reaction = messageElement.querySelector('.message-reaction');
    if (reaction) {
        reaction.remove();
    }
}

// Отправить сообщение
// Глобальная переменная для выбранного фото
let selectedPhoto = null;

// Обработка выбора фото
// Показать меню выбора источника фото
function showPhotoSourceMenu() {
    if (!window.Telegram || !window.Telegram.WebApp) {
        // Если не в Telegram WebApp, просто открываем выбор файла
        document.getElementById('photoInput').click();
        return;
    }
    
    const tg = window.Telegram.WebApp;
    
    // Создаем меню с выбором
    const menu = document.createElement('div');
    menu.className = 'photo-source-menu';
    menu.innerHTML = `
        <div class="photo-source-overlay" onclick="closePhotoSourceMenu()"></div>
        <div class="photo-source-content">
            <h3 style="margin-top: 0; color: var(--neon-cyan);">📷 Выберите источник</h3>
            <button class="source-btn" onclick="openCamera()">
                <span style="font-size: 24px;">📸</span>
                <span>Сделать фото</span>
            </button>
            <button class="source-btn" onclick="openGallery()">
                <span style="font-size: 24px;">🖼️</span>
                <span>Выбрать из галереи</span>
            </button>
            <button class="source-btn cancel" onclick="closePhotoSourceMenu()">
                <span>❌</span>
                <span>Отмена</span>
            </button>
        </div>
    `;
    document.body.appendChild(menu);
}

// Закрыть меню выбора источника
function closePhotoSourceMenu() {
    const menu = document.querySelector('.photo-source-menu');
    if (menu) menu.remove();
}

// Открыть камеру
async function openCamera() {
    closePhotoSourceMenu();
    
    // Проверяем поддержку getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback на обычный input с capture
        const cameraInput = document.getElementById('cameraInput');
        cameraInput.value = '';
        cameraInput.click();
        return;
    }
    
    try {
        // Создаем модальное окно с камерой
        const cameraModal = document.createElement('div');
        cameraModal.id = 'cameraModal';
        cameraModal.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.95);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            ">
                <video id="cameraPreview" autoplay playsinline style="
                    max-width: 100%;
                    max-height: 70vh;
                    border-radius: 12px;
                    box-shadow: 0 0 30px rgba(0, 217, 255, 0.5);
                "></video>
                <div style="
                    display: flex;
                    gap: 15px;
                    margin-top: 20px;
                ">
                    <button onclick="switchCamera()" style="
                        background: rgba(131, 56, 236, 0.2);
                        border: 2px solid var(--neon-purple);
                        border-radius: 50%;
                        width: 70px;
                        height: 70px;
                        font-size: 32px;
                        cursor: pointer;
                        box-shadow: 0 0 20px rgba(131, 56, 236, 0.4);
                    ">🔄</button>
                    <button onclick="capturePhoto()" style="
                        background: rgba(0, 217, 255, 0.2);
                        border: 2px solid var(--neon-cyan);
                        border-radius: 50%;
                        width: 70px;
                        height: 70px;
                        font-size: 32px;
                        cursor: pointer;
                        box-shadow: 0 0 20px rgba(0, 217, 255, 0.4);
                    ">📸</button>
                    <button onclick="closeCameraModal()" style="
                        background: rgba(255, 0, 110, 0.2);
                        border: 2px solid var(--neon-pink);
                        border-radius: 50%;
                        width: 70px;
                        height: 70px;
                        font-size: 32px;
                        cursor: pointer;
                        box-shadow: 0 0 20px rgba(255, 0, 110, 0.4);
                    ">❌</button>
                </div>
                <canvas id="cameraCanvas" style="display: none;"></canvas>
            </div>
        `;
        document.body.appendChild(cameraModal);
        
        // Изначально задняя камера
        window.currentFacingMode = 'environment';
        
        // Запускаем камеру
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: window.currentFacingMode
            } 
        });
        
        const video = document.getElementById('cameraPreview');
        video.srcObject = stream;
        window.currentCameraStream = stream;
        
    } catch (error) {
        console.error('Ошибка доступа к камере:', error);
        tg.showAlert('Не удалось получить доступ к камере. Попробуйте выбрать фото из галереи.');
        // Fallback на input
        const cameraInput = document.getElementById('cameraInput');
        cameraInput.value = '';
        cameraInput.click();
    }
}

// Сделать снимок
function capturePhoto() {
    const video = document.getElementById('cameraPreview');
    const canvas = document.getElementById('cameraCanvas');
    
    // Устанавливаем размер canvas равный видео
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Рисуем кадр с видео на canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Конвертируем canvas в blob
    canvas.toBlob((blob) => {
        // Создаем File из blob
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        
        // Закрываем камеру
        closeCameraModal();
        
        // Обрабатываем как обычное фото
        selectedPhoto = file;
        
        // Показываем превью
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('photoPreview');
            const img = document.getElementById('photoPreviewImage');
            img.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
        
    }, 'image/jpeg', 0.9);
}

// Закрыть модальное окно камеры
function closeCameraModal() {
    // Останавливаем поток камеры
    if (window.currentCameraStream) {
        window.currentCameraStream.getTracks().forEach(track => track.stop());
        window.currentCameraStream = null;
    }
    
    // Удаляем модальное окно
    const modal = document.getElementById('cameraModal');
    if (modal) modal.remove();
}

// Переключить камеру (селфи/задняя)
async function switchCamera() {
    try {
        // Останавливаем текущий поток
        if (window.currentCameraStream) {
            window.currentCameraStream.getTracks().forEach(track => track.stop());
        }
        
        // Переключаем режим
        window.currentFacingMode = window.currentFacingMode === 'user' ? 'environment' : 'user';
        
        // Запускаем камеру с новым режимом
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: window.currentFacingMode
            } 
        });
        
        const video = document.getElementById('cameraPreview');
        video.srcObject = stream;
        window.currentCameraStream = stream;
        
        console.log('📷 Камера переключена:', window.currentFacingMode === 'user' ? 'Селфи' : 'Задняя');
        
    } catch (error) {
        console.error('Ошибка переключения камеры:', error);
        tg.showAlert('Не удалось переключить камеру');
    }
}

// Открыть галерею
function openGallery() {
    closePhotoSourceMenu();
    const galleryInput = document.getElementById('photoInput');
    // Очищаем предыдущее значение
    galleryInput.value = '';
    // Используем обычный input без capture
    galleryInput.click();
}

function handlePhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('📷 Выбран файл:', {
        name: file.name,
        type: file.type,
        size: file.size
    });
    
    // Проверка размера (макс 20 МБ)
    if (file.size > 20 * 1024 * 1024) {
        tg.showAlert('Файл слишком большой! Максимум 20 МБ');
        event.target.value = '';
        return;
    }
    
    // Проверка что файл не пустой (Stories имеют size = 0)
    if (file.size === 0) {
        tg.showAlert('❌ Stories и временные файлы не поддерживаются!\n\nСохраните фото в галерею и выберите его оттуда.');
        event.target.value = '';
        return;
    }
    
    // Принимаем изображения, видео и HEIC (Live Photos, анимации)
    const isMedia = file.type.startsWith('image/') || 
                    file.type.startsWith('video/') ||
                    file.name.toLowerCase().endsWith('.heic') || 
                    file.name.toLowerCase().endsWith('.heif');
    
    if (!isMedia) {
        tg.showAlert('Можно прикрепить только фото или видео!');
        event.target.value = '';
        return;
    }
    
    selectedPhoto = file;
    
    // Показываем превью
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('photoPreview');
        const img = document.getElementById('photoPreviewImage');
        
        // Для видео показываем иконку, для фото - превью
        if (file.type.startsWith('video/')) {
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="50">🎥</text></svg>';
        } else {
            img.src = e.target.result;
        }
        
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Удалить выбранное фото
function removePhoto() {
    selectedPhoto = null;
    document.getElementById('photoInput').value = '';
    document.getElementById('photoPreview').style.display = 'none';
}

// Показать фото в модальном окне
function showPhotoModal(photoUrl) {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('photoModalImage');
    
    // Загружаем изображение для определения реальных размеров
    const tempImg = new Image();
    tempImg.onload = function() {
        const aspectRatio = tempImg.width / tempImg.height;
        
        // Вычисляем размеры с учетом соотношения сторон
        const maxWidth = window.innerWidth * 0.9;
        const maxHeight = window.innerHeight * 0.9;
        
        let width, height;
        if (maxWidth / maxHeight > aspectRatio) {
            // Ограничиваем по высоте
            height = maxHeight;
            width = height * aspectRatio;
        } else {
            // Ограничиваем по ширине
            width = maxWidth;
            height = width / aspectRatio;
        }
        
        modalImage.style.width = `${width}px`;
        modalImage.style.height = `${height}px`;
    };
    tempImg.src = photoUrl;
    
    // Используем DIV с background-image вместо IMG (защита от long-press)
    modalImage.style.backgroundImage = `url('${photoUrl}')`;
    
    // Дополнительная защита
    modalImage.oncontextmenu = () => false;
    modalImage.style.userSelect = 'none';
    modalImage.style.webkitUserSelect = 'none';
    modalImage.style.mozUserSelect = 'none';
    modalImage.style.webkitTouchCallout = 'none';
    
    modal.classList.add('active');
    modal.style.display = 'flex';
    
    // Запрет контекстного меню на модальном окне
    modal.oncontextmenu = () => false;
}

// Закрыть модальное окно фото
function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('photoModalImage');
    
    modal.classList.remove('active');
    modal.style.display = 'none';
    modalImage.style.backgroundImage = '';
    modal.oncontextmenu = null;
}

// Загрузить фото в Telegram и получить file_id
async function uploadPhotoToTelegram(file, userId) {
    try {
        // Сжимаем изображение если оно слишком большое (макс 4MB для Vercel)
        let fileToUpload = file;
        if (file.type.startsWith('image/') && file.size > 4 * 1024 * 1024) {
            console.log('🗜️ Файл больше 4MB, сжимаем...');
            fileToUpload = await compressImage(file, 4);
        }
        
        const formData = new FormData();
        formData.append('photo', fileToUpload);
        formData.append('userId', userId);
        
        console.log('📤 Отправка файла:', {
            name: fileToUpload.name,
            type: fileToUpload.type,
            size: fileToUpload.size,
            originalSize: file.size
        });
        
        const response = await fetch('/api/upload-photo', {
            method: 'POST',
            body: formData
        });
        
        console.log('📨 Response status:', response.status);
        
        // Проверяем что ответ валидный JSON
        const contentType = response.headers.get('content-type');
        console.log('📨 Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Не JSON ответ от upload-photo:', text.substring(0, 500));
            throw new Error('Ошибка загрузки. Попробуйте другое фото.');
        }
        
        const result = await response.json();
        console.log('📨 Upload result:', result);
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
        return result.data;
    } catch (error) {
        console.error('Ошибка загрузки фото:', error);
        throw error;
    }
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const messageText = input.value.trim();

    // Проверяем что есть либо текст либо фото
    if (!messageText && !selectedPhoto) return;
    
    if (!currentChatId) return;
    
    // Блокируем кнопку отправки чтобы избежать дубликатов
    if (sendButton.disabled) return;

    // Получаем user_token (основной идентификатор)
    let userId = localStorage.getItem('user_token');
    
    // Fallback на Telegram ID если токена нет
    if (!userId || userId === 'null' || userId === 'undefined') {
        userId = getCurrentUserId();
    }
    
    if (!userId || userId.startsWith('web_')) {
        tg.showAlert('Ошибка: необходима авторизация');
        return;
    }

    try {
        // Блокируем UI
        sendButton.disabled = true;
        sendButton.style.opacity = '0.5';
        input.disabled = true;
        
        let photoData = null;
        
        // Загружаем фото если выбрано
        if (selectedPhoto) {
            // Проверяем лимит
            const limitsCheck = await fetch('/api/premium', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'check-photo-limit',
                    params: { userId }
                })
            });
            const limitsResult = await limitsCheck.json();
            
            if (limitsResult.data && !limitsResult.data.canSend) {
                const isPremium = limitsResult.data.isPremium;
                if (isPremium) {
                    tg.showAlert('Технический лимит превышен');
                } else {
                    tg.showConfirm(
                        `У вас осталось ${limitsResult.data.remaining} фото сегодня.\nОформите PRO для безлимита!`,
                        (confirmed) => {
                            if (confirmed) showPremiumModal();
                        }
                    );
                }
                return;
            }
            
            // Показываем индикатор загрузки
            input.disabled = true;
            input.placeholder = '📤 Загрузка фото...';
            
            // Загружаем фото
            photoData = await uploadPhotoToTelegram(selectedPhoto, userId);
            
            console.log('✅ Фото загружено:', photoData);
        }
        
        // Получаем nickname отправителя
        const senderNickname = getUserNickname();
        
        // Отправляем сообщение через Neon API
        const response = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'send-message',
                params: { 
                    chatId: currentChatId, 
                    senderId: userId,
                    messageText: messageText || '📸 Фото',
                    senderNickname,
                    skipNotification: false, // Всегда отправляем уведомления
                    photoUrl: photoData?.photo_url || null,
                    telegramFileId: photoData?.file_id || null,
                    replyToMessageId: replyToMessage ? replyToMessage.id : null
                }
            })
        });
        
        // Проверяем что ответ валидный JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Не JSON ответ:', text.substring(0, 200));
            throw new Error('Сервер вернул ошибку. Попробуйте ещё раз.');
        }
        
        const result = await response.json();

        if (result.error) {
            console.error('Ошибка отправки:', result.error);
            
            // Проверяем если чат не найден или не принят
            if (result.error.message === 'Chat not accepted yet') {
                tg.showAlert('⚠️ Собеседник ещё не принял запрос на чат. Дождитесь принятия.');
                showMyChats();
                return;
            }
            if (result.error.message === 'Chat is blocked') {
                tg.showAlert('⚠️ Чат заблокирован. Отправка сообщений невозможна.');
                showMyChats();
                return;
            }
            if (result.error.message === 'Chat not found or not accepted') {
                tg.showAlert('⚠️ Чат не найден или недоступен. Попробуйте позже.');
                console.log('Chat error details:', result.error.details);
                showMyChats();
                return;
            }
            
            // Проверяем ошибку лимита
            if (result.error.limit) {
                if (result.error.isPremium === false) {
                    tg.showConfirm(
                        result.error.message,
                        (confirmed) => {
                            if (confirmed) showPremiumModal();
                        }
                    );
                } else {
                    tg.showAlert(result.error.message);
                }
            } else {
                tg.showAlert('Ошибка отправки сообщения');
            }
            return;
        }

        // Обновляем статус Premium (лимиты изменились)
        if (photoData) {
            await loadPremiumStatus();
        }

        // Очищаем поле ввода и фото
        input.value = '';
        removePhoto();
        
        // Скрываем превью ответа
        cancelReply();

        // Перезагружаем сообщения
        await loadChatMessages(currentChatId);

    } catch (error) {
        console.error('Ошибка:', error);
        tg.showAlert('Ошибка отправки сообщения: ' + error.message);
    } finally {
        // Восстанавливаем UI
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.style.opacity = '1';
        }
        input.disabled = false;
        input.placeholder = 'Введите сообщение...';
    }
}

// Пометить сообщения как прочитанные
async function markMessagesAsRead(chatId) {
    try {
        // Получаем user_token (основной идентификатор)
        let userId = localStorage.getItem('user_token');
        
        // Fallback на Telegram ID если токена нет
        if (!userId || userId === 'null' || userId === 'undefined') {
            userId = getCurrentUserId();
        }
        
        const response = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'mark-read',
                params: { chatId, userId }
            })
        });
        const result = await response.json();
        
        if (result.error) {
            console.warn('⚠️ Ошибка пометки сообщений как прочитанных:', result.error);
        } else {
            // Обновляем счётчик непрочитанных после успешной пометки
            console.log('✅ Сообщения помечены как прочитанные, обновляем счётчик');
            if (typeof updateChatBadge === 'function') {
                updateChatBadge();
            }
        }
    } catch (error) {
        console.error('Ошибка markMessagesAsRead:', error);
    }
}

// Пометить сообщения как доставленные (при открытии приложения)
async function markMessagesAsDelivered() {
    try {
        const userId = getCurrentUserId();
        if (!userId || userId.startsWith('web_')) {
            return; // Не помечаем для неавторизованных
        }
        
        const response = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'mark-delivered',
                params: { userId }
            })
        });
        const result = await response.json();
        
        if (result.error) {
            console.warn('⚠️ Ошибка пометки сообщений как доставленных:', result.error);
        } else {
            console.log('✅ Сообщения помечены как доставленные');
        }
    } catch (error) {
        console.error('Ошибка markMessagesAsDelivered:', error);
    }
}

// ==================== ОТВЕТ НА СООБЩЕНИЕ ====================

let replyToMessage = null;

// Ответить на сообщение
function replyToMsg(messageId, nickname, messageText) {
    replyToMessage = { id: messageId, nickname, text: messageText };
    
    // Показываем превью
    const replyPreview = document.getElementById('replyPreview');
    const replyToNickname = document.getElementById('replyToNickname');
    const replyToText = document.getElementById('replyToText');
    
    replyToNickname.textContent = nickname;
    replyToText.textContent = messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText;
    
    replyPreview.style.display = 'flex';
    
    // Фокусируем поле ввода
    document.getElementById('messageInput').focus();
}

// Отменить ответ
function cancelReply() {
    replyToMessage = null;
    document.getElementById('replyPreview').style.display = 'none';
}

// Скролл к сообщению и подсветка
function scrollToMessage(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageEl) return;
    
    // Скроллим к сообщению
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Добавляем класс для подсветки
    messageEl.classList.add('highlight');
    
    // Убираем подсветку через 1 секунду
    setTimeout(() => {
        messageEl.classList.remove('highlight');
    }, 1000);
}

// ==================== РАЗМЕР ШРИФТА ====================

function toggleChatFontSize() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) return;
    
    // Получаем текущий размер из localStorage или дефолтный 'medium'
    let currentSize = localStorage.getItem('chatFontSize') || 'medium';
    
    // Переключаем на следующий размер
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    const nextSize = sizes[nextIndex];
    
    // Удаляем старые классы и добавляем новый
    messagesContainer.classList.remove('font-small', 'font-medium', 'font-large');
    messagesContainer.classList.add(`font-${nextSize}`);
    
    // Сохраняем в localStorage
    localStorage.setItem('chatFontSize', nextSize);
    
    // Обновляем текст кнопки
    const btn = document.getElementById('chatFontSizeBtn');
    if (btn) {
        if (nextSize === 'small') {
            btn.style.fontSize = '14px';
        } else if (nextSize === 'medium') {
            btn.style.fontSize = '18px';
        } else {
            btn.style.fontSize = '22px';
        }
    }
    
    console.log('📏 Размер шрифта чата:', nextSize);
}

// Применить сохраненный размер шрифта при загрузке чата
function applyChatFontSize() {
    const savedSize = localStorage.getItem('chatFontSize') || 'medium';
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        messagesContainer.classList.remove('font-small', 'font-medium', 'font-large');
        messagesContainer.classList.add(`font-${savedSize}`);
    }
    
    // Обновляем кнопку
    const btn = document.getElementById('chatFontSizeBtn');
    if (btn) {
        if (savedSize === 'small') {
            btn.style.fontSize = '14px';
        } else if (savedSize === 'medium') {
            btn.style.fontSize = '18px';
        } else {
            btn.style.fontSize = '22px';
        }
    }
}

// Запустить автообновление чата
function startChatPolling(chatId, userId) {
    // Останавливаем предыдущий интервал
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
    }

    // Если userId не передан, пытаемся получить его
    if (!userId) {
        userId = localStorage.getItem('user_token');
        if (!userId || userId === 'null' || userId === 'undefined') {
            userId = getCurrentUserId();
        }
    }

    // Обновляем каждые 3 секунды в silent режиме (без мигания)
    chatPollingInterval = setInterval(async () => {
        if (currentChatId === chatId) {
            await loadChatMessages(chatId, true); // true = silent режим
            // Обновляем активность пользователя только если userId валиден
            if (userId && chatId) {
                await markUserActive(userId, chatId);
            }
        } else {
            // Отмечаем как неактивного при выходе из чата
            if (userId) {
                await markUserInactive(userId);
            }
            clearInterval(chatPollingInterval);
        }
    }, 3000);
}

// Форматирование времени для списка чатов
function formatChatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} д назад`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// Форматирование времени для сообщений
function formatMessageTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// Форматирование даты создания анкеты (день.месяц.год, часы:минуты)
function formatCreatedAt(dateString) {
    if (!dateString) return '—';
    
    // БД хранит timestamp в UTC (с timezone info)
    // JavaScript автоматически конвертирует в часовой пояс пользователя
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    
    const datePart = d.toLocaleDateString('ru-RU'); 
    const timePart = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${datePart}, ${timePart}`;
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Форматирование пола для отображения
function formatGender(gender) {
    const genderMap = {
        'male': 'Мужчина',
        'female': 'Девушка',
        'мужчина': 'Мужчина',
        'девушка': 'Девушка',
        'пара': 'Пара'
    };
    return genderMap[gender?.toLowerCase()] || gender || 'Не указан';
}

// Форматирование цели поиска
function formatTarget(target) {
    const targetMap = {
        'male': 'Мужчину',
        'female': 'Девушку',
        'any': 'Не важно',
        'мужчину': 'Мужчину',
        'девушку': 'Девушку',
        'женщину': 'Девушку'
    };
    return targetMap[target?.toLowerCase()] || target || 'Не важно';
}

// Форматирование целей общения (может быть несколько через запятую)
function formatGoals(goals) {
    if (!goals) return 'Не указано';
    
    const goalMap = {
        'friendship': 'Дружба',
        'relationship': 'Отношения',
        'chat': 'Общение',
        'other': 'Другое',
        'дружба': 'Дружба',
        'отношения': 'Отношения',
        'общение': 'Общение',
        'другое': 'Другое'
    };
    
    // Если это массив
    if (Array.isArray(goals)) {
        return goals.map(g => goalMap[g?.toLowerCase()] || g).join(', ');
    }
    
    // Если это строка с запятыми
    if (typeof goals === 'string' && goals.includes(',')) {
        return goals.split(',').map(g => {
            g = g.trim();
            return goalMap[g?.toLowerCase()] || g;
        }).join(', ');
    }
    
    // Одна цель
    return goalMap[goals?.toLowerCase()] || goals;
}

function formatOrientation(orientation) {
    if (!orientation) return 'Не указано';
    
    const orientationMap = {
        'hetero': 'Гетеро',
        'gay': 'Гей / Лесбиянка',
        'bi': 'Би',
        'pan': 'Пансексуал',
        'ace': 'Асексуал',
        'demi': 'Демисексуал',
        'queer': 'Квир',
        'grey': 'Грейсексуал',
        'sever': 'Север'
    };
    
    return orientationMap[orientation?.toLowerCase()] || orientation;
}

// Обработчик нажатия Enter в поле ввода
document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});

// ============= ОТСЛЕЖИВАНИЕ АКТИВНОСТИ ПОЛЬЗОВАТЕЛЕЙ =============

// Отметить пользователя как активного в чате
async function markUserActive(userId, chatId) {
    try {
        await fetch('/api/user-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'mark-active',
                params: { userId, chatId }
            })
        });
        safeLog('👤 Активность отмечена');
    } catch (error) {
        console.error('Ошибка отметки активности:', error);
    }
}

// Отметить пользователя как неактивного
async function markUserInactive(userId) {
    try {
        await fetch('/api/user-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'mark-inactive',
                params: { userId }
            })
        });
        safeLog('👋 Пользователь неактивен');
    } catch (error) {
        console.error('Ошибка отметки неактивности:', error);
    }
}

// При закрытии приложения отмечаем пользователя как неактивного
window.addEventListener('beforeunload', () => {
    const userId = getCurrentUserId();
    if (userId) {
        // Используем sendBeacon для гарантированной отправки при закрытии
        navigator.sendBeacon('/api/user-activity', JSON.stringify({
            action: 'mark-inactive',
            params: { userId }
        }));
    }
});

// ============= МОДАЛЬНОЕ ОКНО ДЛЯ ПРОСМОТРА анкеты =============

// Показать анкету в модальном окне
async function showAdModal(adId) {
    const modal = document.getElementById('adModal');
    const modalBody = document.getElementById('adModalBody');
    
    if (!adId || adId === 'N/A') {
        modalBody.innerHTML = `
            <div class="empty-state">
                <div class="neon-icon">⚠️</div>
                <h3>Анкета не найдена</h3>
                <p>ID анкеты недоступен</p>
            </div>
        `;
        modal.style.display = 'flex';
        return;
    }
    
    // Показать модалку с загрузкой
    modal.style.display = 'flex';
    modalBody.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Загрузка анкеты...</p>
    `;
    
    try {
        // Сначала пытаемся получить анкету из таблицы ads
        const response = await fetch(`/api/ads?id=${adId}`);
        const result = await response.json();
        
        let ad = null;
        
        if (result.success && result.ads && result.ads.length > 0) {
            ad = result.ads[0];
        } else {
            // Если анкета удалена, пытаемся получить информацию из чата
            const chatResponse = await fetch('/api/neon-chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get-ad-from-chat',
                    params: { adId: parseInt(adId) }
                })
            });
            const chatResult = await chatResponse.json();
            
            if (chatResult.data) {
                ad = chatResult.data;
            }
        }
        
        if (!ad) {
            throw new Error('Анкета не найдена. Возможно, она была удалена автором.');
        }
        
        // Используем helper функции для форматирования
        const genderFormatted = formatGender(ad.gender);
        const targetFormatted = formatTarget(ad.target);
        const goalsFormatted = formatGoals(ad.goal);
        
        const bodyLabels = {
            // Английские варианты (старые)
            slim: 'Худощавое',
            athletic: 'Спортивное',
            average: 'Среднее',
            curvy: 'Полное',
            // Русские варианты (новые)
            'Стройное': 'Стройное',
            'Обычное': 'Обычное',
            'Плотное': 'Плотное',
            'Спортивное': 'Спортивное',
            'Другое': 'Другое'
        };
        
        const genderLower = ad.gender?.toLowerCase();
        let genderIcon = '♀️';
        if (genderLower === 'male' || genderLower === 'мужчина') {
            genderIcon = '♂️';
        } else if (genderLower === 'пара') {
            genderIcon = '👫';
        }
        
        // Маппинг ориентации на читаемые лейблы с эмодзи
        const orientationLabels = {
            'hetero': '💏 Гетеро',
            'gay': '🔥 Гей/Лесбиянка',
            'bi': '😈 Би',
            'pan': '⚡ Пансексуал',
            'ace': '😅 Асексуал',
            'demi': '💫 Демисексуал',
            'queer': '🌪 Квир',
            'grey': '📶 Грейсексуал',
            'sever': '🎤 Север'
        };
        const orientationDisplay = ad.orientation ? orientationLabels[ad.orientation] || ad.orientation : null;
        
        // Отображаем анкету
        modalBody.innerHTML = `
            <div class="ad-detail-view" style="padding: 12px; max-width: 380px; font-size: 13px;">
                <h3 style="margin-top: 0; margin-bottom: 10px; color: var(--neon-cyan); font-size: 16px;">${genderIcon} ${genderFormatted}, ${ad.my_age || '?'} лет</h3>
                <div style="margin-bottom: 10px; line-height: 1.6;">
                    <div style="margin-bottom: 4px;">💪 <strong>Телосложение:</strong> ${bodyLabels[ad.body_type] || 'Не указано'}</div>
                    ${orientationDisplay ? `<div style="margin-bottom: 4px;">💗 <strong>Ориентация:</strong> ${orientationDisplay}</div>` : ''}
                    <div style="margin-bottom: 4px;">🎯 <strong>Цель:</strong> ${goalsFormatted}</div>
                    <div style="margin-bottom: 4px;">🔍 <strong>Ищу:</strong> ${targetFormatted}, ${ad.age_from || '18'}-${ad.age_to || '99'} лет</div>
                    <div style="margin-bottom: 4px;">📍 <strong>Город:</strong> ${ad.city || 'Не указан'}</div>
                </div>
                <div style="background: rgba(0,255,255,0.05); padding: 8px; border-radius: 6px; border-left: 3px solid var(--neon-cyan);">
                    <strong style="font-size: 12px;">💬 О себе:</strong>
                    <p style="margin: 4px 0 0 0; white-space: pre-wrap; font-size: 12px;">${escapeHtml(ad.text)}</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Ошибка загрузки анкеты:', error);
        modalBody.innerHTML = `
            <div class="empty-state">
                <div class="neon-icon">⚠️</div>
                <h3>Ошибка загрузки</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Закрыть модальное окно
function closeAdModal() {
    const modal = document.getElementById('adModal');
    modal.style.display = 'none';
}

// Закрытие модалки по клику вне её
window.addEventListener('click', (event) => {
    const modal = document.getElementById('adModal');
    if (event.target === modal) {
        closeAdModal();
    }
    
    const premiumModal = document.getElementById('premiumModal');
    if (event.target === premiumModal) {
        closePremiumModal();
    }
});

// ============= PREMIUM СИСТЕМА =============

// Глобальная переменная для хранения статуса Premium
let userPremiumStatus = {
    isPremium: false,
    country: 'KZ',
    limits: null
};

// Загрузить статус Premium при запуске приложения
async function loadPremiumStatus() {
    try {
        // Для get-user-status используем tgId или userToken
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        // Проверяем что есть хоть какая-то авторизация
        if (!userId && !userToken) {
            console.log('⚠️ Пользователь не авторизован, Premium статус недоступен');
            return;
        }
        
        // Для email пользователей используем userToken
        if (userToken && !userId) {
            safeLog('💎 Загружаем Premium статус для email пользователя');
        } else {
            safeLog('💎 Загружаем Premium статус для:', userId);
        }
        
        // Анти-кэш: добавляем уникальный параметр запроса
        const antiCache = Date.now();
        const response = await fetch(`/api/premium?ts=${antiCache}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            body: JSON.stringify({
                action: 'get-user-status',
                params: userId ? { userId } : { userToken }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            console.error('Ошибка загрузки Premium статуса:', result.error);
            return;
        }
        
        userPremiumStatus = result.data;
        // Принудительно пересчитываем лимиты, если структура изменилась
        if (!userPremiumStatus.limits || typeof userPremiumStatus.limits.ads !== 'object') {
            console.warn('⚠️ Структура limits изменилась или отсутствует, задаю безопасный дефолт');
            userPremiumStatus.limits = { ads: { used: 0, max: 1, remaining: 1 } };
        }
        
        console.log('✅ Premium статус загружен с сервера:', {
            isPremium: userPremiumStatus.isPremium,
            premiumUntil: userPremiumStatus.premiumUntil,
            premiumSource: userPremiumStatus.premiumSource,
            limits: userPremiumStatus.limits
        });
        
        // Сохраняем в localStorage для следующей загрузки
    // Сбрасываем локальный кэш если версия тарифов изменилась
    const serverVersion = userPremiumStatus.version || antiCache;
    localStorage.setItem(`premium_status_${userId}`, JSON.stringify(userPremiumStatus));
    localStorage.setItem(`premium_version_${userId}`, serverVersion);
        
        updatePremiumUI();
        updateAdLimitBadge();
        
    } catch (error) {
        console.error('Ошибка loadPremiumStatus:', error);
    }
}

// Обновить индикатор лимита анкет
function updateAdLimitBadge() {
    const badge = document.getElementById('adLimitBadge');
    console.log('🔍 updateAdLimitBadge START:', { 
        hasBadge: !!badge, 
        hasStatus: !!userPremiumStatus,
        hasLimits: !!userPremiumStatus?.limits,
        fullLimits: userPremiumStatus?.limits 
    });
    
    if (!badge || !userPremiumStatus.limits) {
        console.warn('⚠️ updateAdLimitBadge ABORT: badge или limits отсутствуют');
        return;
    }
    
    const adsLimit = userPremiumStatus.limits.ads;
    console.log('🔍 adsLimit object:', adsLimit);
    
    const used = adsLimit?.used || 0;
    const max = adsLimit?.max || 1;
    const remaining = adsLimit?.remaining || 0;
    
    console.log('📊 updateAdLimitBadge:', { used, max, remaining });
    
    if (remaining === 0) {
        // Лимит исчерпан - показываем таймер
        const timeUntilReset = getTimeUntilMidnight();
        badge.innerHTML = `${used}/${max} 🚫<br><span style="font-size: 0.7em;">⏰ ${timeUntilReset}</span>`;
        badge.className = 'limit-badge danger';
        badge.style.display = 'block';
        
        // Обновляем таймер каждую минуту
        if (!window.limitTimerInterval) {
            window.limitTimerInterval = setInterval(() => {
                const timeLeft = getTimeUntilMidnight();
                if (badge.style.display !== 'none' && remaining === 0) {
                    badge.innerHTML = `${used}/${max} 🚫<br><span style="font-size: 0.7em;">⏰ ${timeLeft}</span>`;
                }
            }, 60000); // Обновляем каждую минуту
        }
    } else if (remaining === 1 && !userPremiumStatus.isPremium) {
        // Осталось 1 (для FREE это последнее)
        badge.textContent = `${used}/${max}`;
        badge.className = 'limit-badge warning';
        badge.style.display = 'block';
    } else {
        // Всегда показываем счётчик прогресса
        badge.textContent = `${used}/${max}`;
        badge.className = 'limit-badge';
        badge.style.display = 'block';
    }

    // Добавляем всплывающую подсказку с деталями лимита
    badge.title = `Использовано: ${used} / ${max}. Осталось: ${remaining}`;
}

// Функция для расчета времени до полуночи (обновления лимитов) - АЛМАТЫ UTC+5
function getTimeUntilMidnight() {
    // Получаем текущее время в UTC
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    
    // Конвертируем в Алматы время (UTC+5)
    const almatyHours = (utcHours + 5) % 24;
    
    // Считаем время до полуночи Алматы
    const hoursUntilMidnight = (24 - almatyHours - 1);
    const minutesUntilMidnight = (60 - utcMinutes);
    
    // Корректируем если минуты = 60
    const hours = minutesUntilMidnight === 60 ? hoursUntilMidnight + 1 : hoursUntilMidnight;
    const minutes = minutesUntilMidnight === 60 ? 0 : minutesUntilMidnight;
    
    if (hours > 0) {
        return `${hours}ч ${minutes}м`;
    } else {
        return `${minutes}м`;
    }
}

// Запуск проверки обновления лимитов в полночь АЛМАТЫ (UTC+5)
function startMidnightLimitCheck() {
    console.log('⏰ Запущена проверка обновления лимитов в полночь (Алматы UTC+5)');
    
    let lastNotificationDate = null; // Флаг для предотвращения дублирования уведомлений
    
    // Проверяем каждую минуту, не наступила ли полночь Алматы
    setInterval(() => {
        const now = new Date();
        const utcHours = now.getUTCHours();
        const utcMinutes = now.getUTCMinutes();
        
        // Конвертируем в Алматы время (UTC+5)
        const almatyHours = (utcHours + 5) % 24;
        
        // Получаем текущую дату по Алматы для проверки
        const almatyDate = new Date(now.getTime() + (5 * 60 * 60 * 1000));
        const currentAlmatyDate = almatyDate.toISOString().split('T')[0];
        
        // Если сейчас 00:00 или 00:01 по Алматы - обновляем лимиты
        if (almatyHours === 0 && utcMinutes <= 1) {
            // Проверяем, не показывали ли мы уже уведомление сегодня
            if (lastNotificationDate === currentAlmatyDate) {
                console.log('⏭️ Уведомление уже показано сегодня, пропускаем...');
                return;
            }
            
            console.log('🌙 Полночь в Алматы! Обновляем лимиты...');
            lastNotificationDate = currentAlmatyDate; // Отмечаем что показали уведомление
            
            // Проверяем лимиты с сервера
            if (typeof loadPremiumStatus === 'function') {
                loadPremiumStatus().then(() => {
                    console.log('✅ Лимиты обновлены после полуночи (Алматы)');
                    updateAdLimitBadge();
                    
                    // Показываем уведомление пользователю с кринжем
                    if (tg && tg.showAlert) {
                        const midnightMessages = [
                            '🎉 Полночь! Лимиты обновлены!\n\nМожете создавать новые анкеты! 🔥',
                            '⏰ Новый день = новые анкеты!\n\nДавай, покоряй сердца! 💘',
                            '🌙 Полночь настала! Счётчики сброшены!\n\nВперёд к новым знакомым! 🚀',
                            '✨ Магия полуночи сработала!\n\nЛимиты обнулены, GO CREATE! 💪'
                        ];
                        const randomMidnight = midnightMessages[Math.floor(Math.random() * midnightMessages.length)];
                        tg.showAlert(randomMidnight);
                    }
                }).catch(err => {
                    console.error('❌ Ошибка обновления лимитов после полуночи:', err);
                });
            }
        }
    }, 60000); // Проверяем каждую минуту
}

// Ручное обновление лимитов (для тестирования и debug)
async function manualRefreshLimits() {
    console.log('🔄 Ручное обновление лимитов...');
    
    try {
        await loadPremiumStatus();
        updateAdLimitBadge();
        
        if (tg && tg.showAlert) {
            tg.showAlert('✅ Лимиты обновлены с сервера!');
        }
        
        console.log('✅ Лимиты успешно обновлены');
    } catch (error) {
        console.error('❌ Ошибка обновления лимитов:', error);
        if (tg && tg.showAlert) {
            tg.showAlert('❌ Ошибка обновления лимитов');
        }
    }
}

// Обновить UI переключателя Premium
function updatePremiumUI() {
    const freeBtn = document.getElementById('freeBtn');
    const proBtn = document.getElementById('proBtn');
    const premiumInfo = document.getElementById('premiumInfo');
    const referralBtn = document.querySelector('.referral-button');
    
    if (!freeBtn || !proBtn) return;
    
    // Убираем активные классы
    freeBtn.classList.remove('active', 'free');
    proBtn.classList.remove('active', 'pro');
    // Переключатель вверху всегда кликабельный: открывает модалку тарифов
    freeBtn.disabled = false;
    proBtn.disabled = false;
    if (!userPremiumStatus.isPremium) {
        proBtn.classList.add('locked');
        proBtn.title = 'PRO доступен через приглашение друга';
    } else {
        proBtn.classList.remove('locked');
        proBtn.title = '';
    }
    
    if (userPremiumStatus.isPremium) {
        // PRO активен
        proBtn.classList.add('active', 'pro');
        
        // Скрываем информацию о подписке под переключателем (показывается только в модальном окне)
        if (premiumInfo) {
            premiumInfo.style.display = 'none';
        }
        
        // Показываем дату окончания PRO в title
        if (userPremiumStatus.premiumUntil) {
            const expiryDate = new Date(userPremiumStatus.premiumUntil);
            const formattedDate = expiryDate.toLocaleDateString('ru-RU', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            });
            proBtn.title = `PRO до ${formattedDate}`;
        }
        
        // Скрываем реферальную кнопку для PRO пользователей
        if (referralBtn) {
            referralBtn.style.display = 'none';
        }
    } else {
        // FREE активен
        freeBtn.classList.add('active', 'free');
        
        // Скрываем информацию о подписке
        if (premiumInfo) {
            premiumInfo.style.display = 'none';
        }
        
        // Показываем реферальную кнопку только для Telegram пользователей
        if (referralBtn) {
            const emailUser = isEmailUser();
            referralBtn.style.display = emailUser ? 'none' : 'block';
        }
    }
}

// Показать модальное окно тарифов
async function showPremiumModal() {
    const modal = document.getElementById('premiumModal');
    modal.style.display = 'flex';
    
    // ПРИНУДИТЕЛЬНО обновляем статус премиум с сервера (очищаем кэш)
    console.log('🔄 Принудительное обновление Premium статуса...');
    const userId = localStorage.getItem('user_token') || localStorage.getItem('user_id');
    if (userId) {
        try {
            localStorage.removeItem(`premium_status_${userId}`);
            localStorage.removeItem(`premium_version_${userId}`);
            await loadPremiumStatus();
            console.log('✅ Premium статус обновлен');
        } catch (err) {
            console.error('❌ Ошибка обновления статуса:', err);
        }
    }
    
    // Определяем валюту по локации пользователя
    const userLocation = getUserLocation();
    console.log('🌍 getUserLocation():', userLocation);
    
    let currency = '₸'; // По умолчанию тенге (Казахстан)
    let proPrice = 499;
    
    // Если Россия - рубли
    if (userLocation && userLocation.country) {
        console.log('Страна пользователя:', userLocation.country);
        
        // Проверяем разные варианты: ключ 'russia' или название 'Россия'
        const countryLower = userLocation.country.toLowerCase();
        if (countryLower === 'russia' || countryLower.includes('россия') || countryLower.includes('russian')) {
            currency = '₽';
            proPrice = 99;
            console.log('✅ Установлена валюта: рубли (99₽)');
        } else {
            console.log('✅ Установлена валюта: тенге (499₸)');
        }
    } else {
        console.log('⚠️ Локация не определена, используем тенге по умолчанию');
    }
    
    console.log('💰 Итоговая валюта:', currency, 'Цена:', proPrice);
    
    // Удалены старые элементы proPriceAmount/proPriceCurrency - их нет в HTML
    // Цены теперь только в Stars, отображаются в подмодальном окне
    
    // Обновляем кнопки в зависимости от текущего статуса
    updatePremiumModalButtons();
    
    // Показываем информацию о текущей подписке
    updateCurrentSubscriptionInfo();
    
    // Устанавливаем активную кнопку валюты
    const currencyToSet = (currency === '₽') ? 'rub' : 'kzt';
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.currency === currencyToSet) {
            btn.classList.add('active');
        }
    });
}

// Функция switchCurrency удалена - валюта определяется автоматически по геолокации

// Закрыть модальное окно тарифов
function closePremiumModal() {
    const modal = document.getElementById('premiumModal');
    modal.style.display = 'none';
}

// Проверка типа пользователя (Email или Telegram)
function isEmailUser() {
    const userToken = localStorage.getItem('user_token');
    const userId = localStorage.getItem('user_id');
    const userEmail = localStorage.getItem('user_email');
    
    // Email user: есть email в localStorage ИЛИ (есть длинный userToken и нет числового user_id)
    if (userEmail) {
        console.log('📧 Email user detected by user_email:', userEmail);
        return true;
    }
    
    // Проверяем что userToken длинный (64 hex chars) и нет корректного Telegram ID
    const isLongToken = userToken && userToken.length > 20;
    const noTelegramId = !userId || userId.length > 15; // Telegram ID короткие (до 10-12 цифр)
    
    const result = isLongToken && noTelegramId;
    console.log('📧 Email user check:', {userToken: userToken?.substring(0, 16), userId, isLongToken, noTelegramId, result});
    return result;
}

// Скрыть функции недоступные для email пользователей
function hideEmailUserFeatures() {
    const emailUser = isEmailUser();
    
    if (emailUser) {
        console.log('📧 Email user detected - hiding Stars/Referral features');
        
        // Скрываем кнопку реферала на главной странице
        const referralMainBtn = document.getElementById('referralMainButton');
        if (referralMainBtn) {
            referralMainBtn.style.display = 'none';
            console.log('✅ Скрыли кнопку реферала на главной');
        }
    } else {
        console.log('📱 Telegram user detected - showing Referral button');
        
        // Показываем кнопку реферала для Telegram пользователей
        const referralMainBtn = document.getElementById('referralMainButton');
        if (referralMainBtn) {
            referralMainBtn.style.display = 'block';
            console.log('✅ Показали кнопку реферала на главной');
        }
    }
}

// Обновить кнопки в модальном окне
function updatePremiumModalButtons() {
    const freeBtn = document.querySelector('.pricing-card:not(.featured) .pricing-btn');
    const dollarBtn = document.getElementById('dollarPaymentBtn');
    const buyBtn = document.getElementById('buyPremiumBtn');
    const referralBtn = document.getElementById('referralBtn');
    const trialBtn = document.getElementById('trialBtn');
    const referralInfo = document.getElementById('referralInfo');
    
    console.log('🔍 updatePremiumModalButtons:', userPremiumStatus);
    
    // Проверяем метод авторизации - email пользователи не видят Stars и Referral
    const emailUser = isEmailUser();
    console.log('📧 isEmailUser():', emailUser);
    console.log('🔑 user_token:', localStorage.getItem('user_token'));
    console.log('🆔 user_id:', localStorage.getItem('user_id'));
    
    if (userPremiumStatus.isPremium) {
        // Пользователь PRO - показываем что он активен
        if (freeBtn) {
            freeBtn.textContent = '✅ У вас PRO подписка';
            freeBtn.disabled = true;
            freeBtn.classList.add('active');
            freeBtn.classList.remove('disabled');
        }
        
        // Скрываем все кнопки покупки/триала
        if (dollarBtn) dollarBtn.style.display = 'none';
        if (buyBtn) buyBtn.style.display = 'none';
        if (referralBtn) referralBtn.style.display = 'none';
        if (trialBtn) trialBtn.style.display = 'none';
        if (referralInfo) referralInfo.style.display = 'none';
    } else {
        // Пользователь FREE - показываем кнопки покупки
        if (freeBtn) {
            freeBtn.textContent = 'Текущий план (FREE)';
            freeBtn.disabled = true;
            freeBtn.classList.add('active');
        }
        
        // Кнопка $1 показывается ВСЕМ пользователям (Email и Telegram)
        if (dollarBtn) {
            dollarBtn.style.display = 'block';
            console.log('💵 Показываем кнопку $1');
        }
        
        // Для email пользователей скрываем Stars и Referral
        if (emailUser) {
            console.log('📧 Email пользователь - скрываем Stars и Referral');
            if (buyBtn) {
                buyBtn.style.display = 'none';
                console.log('❌ Скрыли Stars');
            }
            if (referralBtn) {
                referralBtn.style.display = 'none';
                console.log('❌ Скрыли Referral');
            }
            if (referralInfo) {
                referralInfo.style.display = 'none';
                console.log('❌ Скрыли Referral Info');
            }
        } else {
            console.log('📱 Telegram пользователь - показываем все кнопки');
            // Telegram пользователи видят все кнопки
            if (buyBtn) {
                buyBtn.style.display = 'block';
                console.log('✅ Показали Stars');
            }
            if (referralBtn) {
                referralBtn.style.display = 'block';
                console.log('✅ Показали Referral');
            }
            if (referralInfo) {
                referralInfo.style.display = 'block';
                console.log('✅ Показали Referral Info');
            }
        }
        
        // Trial показываем только если не использован
        const trial7hUsed = userPremiumStatus.trial7h_used || false;
        if (trialBtn) {
            trialBtn.style.display = trial7hUsed ? 'none' : 'block';
        }
    }
}

// Обновить информацию о текущей подписке
function updateCurrentSubscriptionInfo() {
    const infoBlock = document.getElementById('currentSubscriptionInfo');
    const detailsDiv = document.getElementById('subscriptionDetails');
    const buyBtn = document.getElementById('buyPremiumBtn');
    const referralBtn = document.getElementById('referralBtn');
    const trialBtn = document.getElementById('trialBtn');
    
    if (!infoBlock || !detailsDiv) return;
    
    if (userPremiumStatus.isPremium) {
        // Определяем тип подписки
        const premiumSource = userPremiumStatus.premiumSource || userPremiumStatus.subscriptionSource || '';
        let subscriptionType = '⭐ PRO подписка';
        
        console.log('🔍 updateCurrentSubscriptionInfo DEBUG:', {
            premiumSource,
            premiumUntil: userPremiumStatus.premiumUntil,
            isPremium: userPremiumStatus.isPremium,
            fullStatus: userPremiumStatus
        });
        
        if (premiumSource === 'female_bonus') {
            subscriptionType = '💝 Бонус для девушек';
        } else if (premiumSource === 'trial') {
            subscriptionType = '🎁 Пробный период';
        } else if (premiumSource === 'referral') {
            subscriptionType = '🎉 Реферальная программа';
        } else if (premiumSource === 'paid' || premiumSource === 'stars') {
            subscriptionType = '⭐ Оплачено через Stars';
        }
        
        // Для всех подписок с датой
        if (userPremiumStatus.premiumUntil) {
            // Для временных подписок
            const until = new Date(userPremiumStatus.premiumUntil);
            const formattedDate = until.toLocaleDateString('ru-RU', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Вычисляем оставшееся время
            const diff = until.getTime() - Date.now();
            let timeLeftText = '';
            if (diff > 0) {
                const days = Math.floor(diff / (1000*60*60*24));
                const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
                
                if (days > 0) {
                    timeLeftText = `Осталось: ${days} дн. ${hours} ч.`;
                } else {
                    const mins = Math.floor((diff % (1000*60*60)) / (1000*60));
                    timeLeftText = `Осталось: ${hours} ч. ${mins} м.`;
                }
            }
            
            detailsDiv.innerHTML = `
                <div style="margin-bottom: 3px;">${subscriptionType}</div>
                <div style="margin-bottom: 3px;">📅 Активен до: ${formattedDate}</div>
                <div style="color: var(--neon-pink);">${timeLeftText}</div>
            `;
        } else {
            // Если нет даты - просто показываем тип
            detailsDiv.innerHTML = `
                <div style="margin-bottom: 3px;">${subscriptionType}</div>
                <div style="color: var(--neon-pink);">Активна</div>
            `;
        }
        
        infoBlock.style.display = 'block';
        
        // Скрываем все кнопки покупки/триала когда подписка активна
        if (buyBtn) buyBtn.style.display = 'none';
        if (referralBtn) referralBtn.style.display = 'none';
        if (trialBtn) trialBtn.style.display = 'none';
    } else {
        infoBlock.style.display = 'none';
        
        // Показываем кнопки когда подписки нет
        const emailUser = isEmailUser();
        if (!emailUser) {
            // Для Telegram пользователей показываем Stars и Referral
            if (buyBtn) buyBtn.style.display = 'block';
            if (referralBtn) referralBtn.style.display = 'block';
        } else {
            // Для Email пользователей скрываем Stars и Referral
            if (buyBtn) buyBtn.style.display = 'none';
            if (referralBtn) referralBtn.style.display = 'none';
        }
        // Trial показываем всем, если не использован
        if (trialBtn) {
            trialBtn.style.display = (userPremiumStatus.trial7h_used ? 'none' : 'block');
        }
    }
}

// Выбор тарифа FREE (для теста - переключение обратно)
async function selectPlan(plan) {
    if (plan === 'free' && userPremiumStatus.isPremium) {
        tg.showAlert('Переход на FREE недоступен: FREE включается автоматически когда заканчивается PRO');
    }
}

// Активировать Premium (для теста - переключение)
async function activatePremium() {
    try {
        // Блокируем прямую активацию: только реферал - КРИНЖОВЫЙ ДИАЛОГ
        if (!userPremiumStatus.isPremium) {
            // Первое предупреждение - провокация
            tg.showConfirm(
                '� ТЫ действительно хочешь PRO, БРО?',
                (confirmed) => {
                    if (confirmed) {
                        // Кринжовая отмазка
                        const messages = [
                            '😂 Ну тогда пригласите друга!\n\n📲 Ваша реферальная ссылка ждёт в разделе "Реферальная программа"',
                            '🤣 Ахаха! Думали будет кнопка "Купить"?\n\nНЕТ! Только через друга! 💪\n\nРеферальная ссылка уже готова для Вас 👆',
                            '😏 Хитрый план не прокатил!\n\nPRO = приглашение друга, вот и вся магия ✨\n\nБерите ссылку и зовите друзей! 🔥',
                            '🎭 Сюрприз! Халявы нет!\n\nНо есть БЕСПЛАТНЫЙ PRO через реферала!\n\nДруг создаёт анкету → Вы получаете PRO 🎁',
                            '💡 А Вы шустрый! Но не прокатит 😎\n\nPRO дают за друзей, а не за кнопки!\n\nВперёд приглашать! 🚀',
                            '🎪 Добро пожаловать в реферальный цирк!\n\nБилет = 1 друг = 1 месяц PRO 🎟️\n\nЛови ссылку и вперёд! 🤡',
                            '🧠 200 IQ ход! Но мы Вас раскусили 🕵️\n\nЗахотели халяву? Приведите друзей!\n\nТак работают легенды 💪',
                            '⚡️ PLOT TWIST!\n\nДенег не надо, друзей надо! 🤝\n\nРеферальная программа — Ваш ключ к PRO! 🗝️'
                        ];
                        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
                        
                        // Проверяем, использовал ли уже 7-часовой триал
                        const trial7hUsed = userPremiumStatus.trial7h_used || false;
                        
                        if (!trial7hUsed) {
                            // Предлагаем 7 часов PRO (только один раз)
                            tg.showAlert(randomMsg + '\n\n🎃 Но могу дать Вам троллинг-TRIAL: 7 часов PRO. Хотите?', () => {
                                tg.showConfirm('🔥 Врубить 7 часов PRO сейчас? Потом всё исчезнет как карета в 00:00!', (trialConfirm) => {
                                    if (trialConfirm) {
                                        activatePremiumTrial7h();
                                    } else {
                                        showReferralModal();
                                    }
                                });
                            });
                        } else {
                            // Триал уже использован - только реферал
                            const usedTrialMessages = [
                                '😏 Вы уже использовали триал, помните?\n\nТеперь только реферал работает!',
                                '🤷‍♂️ 7 часов уже было, больше не дам!\n\nХотите PRO? Зовите друга!',
                                '🎭 Второй раз фокус не сработает!\n\nРеферальная программа — Ваш единственный путь!',
                                '😎 Триал был разовой акцией!\n\nТеперь только друзья дают PRO!'
                            ];
                            const randomUsedMsg = usedTrialMessages[Math.floor(Math.random() * usedTrialMessages.length)];
                            tg.showAlert(randomMsg + '\n\n' + randomUsedMsg, () => {
                                showReferralModal();
                            });
                        }
                    } else {
                        // Если отказался - кринжовая подначка
                        const rejectMessages = [
                            '😢 Эх, а я уже обрадовался...\n\nНу ладно, FREE тоже норм! 💪',
                            '🤷‍♂️ Передумал? Бывает!\n\nБесплатная версия тоже огонь 🔥',
                            '😅 Понял, не сегодня!\n\nКогда будешь готов - мы тут 👍',
                            '🙃 Испугался ответственности?\n\nДруг не кусается, обещаем! 😄',
                            '💭 Раздумал стать легендой?\n\nНу ок, FREE версия тоже топ! 🎯',
                            '🤔 Философски подошёл к вопросу...\n\nУважаю! Возвращайся когда созреешь 🧘',
                            '😎 Независимый выбор!\n\nFREE воины тоже достойны уважения 🛡️'
                        ];
                        const randomReject = rejectMessages[Math.floor(Math.random() * rejectMessages.length)];
                        tg.showAlert(randomReject);
                    }
                }
            );
            return;
        }
        const userId = getCurrentUserId();
        if (!userId || userId.startsWith('web_')) {
            tg.showAlert('Необходима авторизация через Telegram');
            return;
        }
        
        console.log('🔄 Активация/деактивация Premium, текущий статус:', userPremiumStatus.isPremium);
        
        // Проверяем текущий статус
        if (userPremiumStatus.isPremium) {
            // Уже на PRO - понижаем до FREE сразу
            console.log('⬇️ Понижение до FREE...');
            
            const response = await fetch('/api/premium', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle-premium',
                    params: { userId }
                })
            });
            
            const result = await response.json();
            
            console.log('📥 Ответ сервера (понижение):', result);
            
            if (result.error) {
                throw new Error(result.error.message);
            }
            
            // Обновляем локальный статус
            userPremiumStatus.isPremium = false;
            userPremiumStatus.premiumUntil = null;
            
            // Перезагружаем лимиты с сервера
            await loadPremiumStatus();
            
            tg.showAlert('Вы вернулись на FREE тариф');
            
            setTimeout(() => closePremiumModal(), 1000);
            return;
        }
        
        // Показываем загрузку
        const btn = document.getElementById('activatePremiumBtn');
        const originalText = btn.textContent;
        btn.textContent = '⏳ Обработка...';
        btn.disabled = true;
        
        console.log('⬆️ Повышение до PRO...');
        
        // Переключаем статус (для теста)
        const response = await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'toggle-premium',
                params: { userId }
            })
        });
        
        const result = await response.json();
        
        console.log('📥 Ответ сервера (повышение):', result);
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
        // Перезагружаем полный статус с сервера
        await loadPremiumStatus();
        
        // Показываем уведомление
        if (userPremiumStatus.isPremium) {
            tg.showAlert('🎉 Поздравляем! PRO активирован на 30 дней!\n\nТеперь доступны:\n✅ Безлимит фото\n✅ До 3 анкет в день\n✅ Закрепление 3 раза в день');
        } else {
            tg.showAlert('Вы вернулись на FREE тариф\n\nДоступны базовые функции');
        }
        
        // Закрываем модалку через 1 секунду
        setTimeout(() => {
            closePremiumModal();
        }, 1000);
        
    } catch (error) {
        console.error('Ошибка активации Premium:', error);
        tg.showAlert('Ошибка: ' + error.message);
        
        // Возвращаем кнопку
        const btn = document.getElementById('activatePremiumBtn');
        if (btn) {
            btn.textContent = 'Оформить PRO';
            btn.disabled = false;
        }
    }
}

// Показ предложения триала (отдельная кнопка)
// Заглушка для оплаты долларом
function showDollarPaymentComingSoon() {
    const message = '💵 Оплата за 1$ скоро будет доступна!\n\n' +
                   '🔜 Мы подключаем платежную систему\n' +
                   '💳 Принимаем карты всех стран\n' +
                   '🌍 Быстрая оплата без комиссий\n\n' +
                   '⏰ Следите за обновлениями!';
    
    if (tg && tg.showAlert) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
}

function showTrialOffer() {
    if (userPremiumStatus.isPremium) {
        if (tg && tg.showAlert) tg.showAlert('Уже активен PRO, триал недоступен.');
        return;
    }
    const pitch = '🎃 Могу дать Вам 7 часов PRO.' +
                  '\n📢 До 3 анкет' +
                  '\n📸 Безлимит фото' +
                  '\n📌 3 закрепления' +
                  '\n\nВключить сейчас?';
    if (tg && tg.showConfirm) {
        tg.showConfirm(pitch, (ok) => {
            if (ok) activatePremiumTrial7h();
        });
    } else {
        if (confirm(pitch.replace(/\n/g,'\n'))) activatePremiumTrial7h();
    }
}

// Активировать 7-часовой TRIAL (клиент вызывает toggle-premium с флагом)
async function activatePremiumTrial7h() {
    try {
        // Для Telegram пользователей используем userId, для email - user_token
        let userId = getCurrentUserId();
        
        // Если нет Telegram ID, используем user_token (email пользователи)
        if (!userId) {
            userId = localStorage.getItem('user_token');
        }
        
        if (!userId) {
            tg.showAlert('Требуется авторизация');
            return;
        }
        const btn = document.getElementById('activatePremiumBtn');
        if (btn) { btn.textContent = '⏳ Триал...'; btn.disabled = true; }
        const response = await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle-premium', params: { userId, trial7h: true } })
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error.message);
        
        // Обновляем статус и отмечаем что триал использован
        await loadPremiumStatus();
        userPremiumStatus.trial7h_used = true;
        
        const until = new Date(result.data.premiumUntil);
        const hh = until.getHours().toString().padStart(2,'0');
        const mm = until.getMinutes().toString().padStart(2,'0');
        tg.showAlert('🎉 7 ЧАСОВ PRO активированы! До: ' + hh + ':' + mm + '\n\nПосле этого вернёшься в FREE. Чтобы получить месяц — пригласи друга!');
        setTimeout(() => closePremiumModal(), 1200);
        // Локальный таймер обратного отсчёта (опционально можно в UI)
        window.proTrialEndsAt = until.getTime();
    } catch (e) {
        console.error('Ошибка trial7h:', e);
        tg.showAlert('Ошибка триала: ' + e.message);
        const btn = document.getElementById('activatePremiumBtn');
        if (btn) { btn.textContent = 'Оформить PRO'; btn.disabled = false; }
    }
}

// Проверка истечения 7-часового trial (каждые 60 сек)
setInterval(() => {
    if (window.proTrialEndsAt && userPremiumStatus.isPremium) {
        const now = Date.now();
        if (now >= window.proTrialEndsAt) {
            // Авто-откат через toggle-premium (выключаем PRO)
            const userId = getCurrentUserId();
            fetch('/api/premium', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle-premium', params: { userId } })
            }).then(r => r.json()).then(async (res) => {
                await loadPremiumStatus();
                if (tg && tg.showAlert) {
                    tg.showAlert('🎃 Триал закончился! PRO превратился в тыкву. Пригласи друга для месяца PRO.');
                }
                window.proTrialEndsAt = null;
            }).catch(err => console.error('Auto trial revert error:', err));
        }
    }
}, 60000);

// Проверить лимит фото перед отправкой
async function checkPhotoLimit() {
    try {
        const userId = getCurrentUserId();
        if (!userId || userId.startsWith('web_')) {
            return { canSend: false, reason: 'Необходима авторизация' };
        }
        
        const response = await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'check-photo-limit',
                params: { userId }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            return { canSend: false, reason: result.error.message };
        }
        
        if (!result.data.canSend) {
            const remaining = result.data.remaining || 0;
            return {
                canSend: false,
                reason: `Достигнут лимит фото на сегодня!\n\nFREE: 5 фото в день\nОсталось: ${remaining}\n\nОформите PRO для безлимита фото!`
            };
        }
        
        return { canSend: true };
    } catch (error) {
        console.error('Ошибка проверки лимита фото:', error);
        return { canSend: true }; // В случае ошибки разрешаем
    }
}

// Увеличить счётчик фото после успешной отправки
async function incrementPhotoCount() {
    try {
        const userId = getCurrentUserId();
        if (!userId || userId.startsWith('web_')) return;
        
        await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'increment-photo-count',
                params: { userId }
            })
        });
        
        // Обновляем статус
        await loadPremiumStatus();
    } catch (error) {
        console.error('Ошибка увеличения счётчика фото:', error);
    }
}

// Вызываем загрузку Premium статуса при инициализации
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем статус с задержкой, чтобы userId успел инициализироваться
    setTimeout(() => {
        loadPremiumStatus();
    }, 1000);
});

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С МЕНЮ ЧАТА (БЛОКИРОВКА/УДАЛЕНИЕ) =====

let currentOpponentId = null;
let isUserBlocked = false;

// Переключить видимость меню чата
function toggleChatMenu() {
    const menu = document.getElementById('chatMenu');
    if (menu.style.display === 'none' || !menu.style.display) {
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
    }
}

// Скрыть меню при клике вне его
document.addEventListener('click', function(e) {
    const menu = document.getElementById('chatMenu');
    const menuBtn = document.querySelector('.chat-menu-btn');
    if (menu && menuBtn && !menu.contains(e.target) && !menuBtn.contains(e.target)) {
        menu.style.display = 'none';
    }
});

// Проверить статус блокировки для чата
async function checkBlockStatus(chatId) {
    try {
        console.log('🔍 [checkBlockStatus] Начало проверки блокировки для chatId:', chatId);
        // Используем user_token если доступен; fallback на Telegram ID
        let userId = localStorage.getItem('user_token');
        if (!userId || userId === 'null' || userId === 'undefined') {
            userId = getCurrentUserId();
        }
        console.log('[checkBlockStatus] Используем идентификатор для get-active:', (userId || 'null').substring(0,16)+'...', 'isToken=', typeof userId === 'string' && userId.length > 30);
        
        // Получаем информацию о чате
        const chatResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-active',
                params: { userId }
            })
        });
        
        const chatResult = await chatResponse.json();
        const returnedIds = (chatResult.data || []).map(c => c.id);
        console.log('📋 [checkBlockStatus] Получено чатов:', chatResult.data?.length, 'ids=', returnedIds.join(','));
    let chat = chatResult.data?.find(c => c.id == chatId);
        
        if (!chat) {
            console.warn('⚠️ [checkBlockStatus] Чат не найден в get-active. Выполняем прямой запрос по chatId для диагностики.');
            try {
                const directResp = await fetch('/api/neon-chats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'check-existing', params: { user1_token: 'diag', user2_token: 'diag', adId: -1 }} ) // placeholder
                });
            } catch(e) {}
            // Дополнительная диагностика: запрос всех чатов без accepted фильтра (временная, если будет отдельный endpoint)
            return;
        }
        
        console.log('💬 [checkBlockStatus] Чат найден:', {
            id: chat.id,
            user_token_1: chat.user_token_1?.substring(0, 16) + '...',
            user_token_2: chat.user_token_2?.substring(0, 16) + '...',
            opponent_token: chat.opponent_token?.substring(0, 16) + '...'
        });
        
        // Определяем ID собеседника
    // В ответе get-active присутствуют user_token_1, user_token_2 и opponent_token
    const isUser1 = String(chat.user_token_1) === String(userId);
    currentOpponentId = isUser1 ? chat.user_token_2 : chat.user_token_1;
    // Сохраняем токен собеседника (источник истины)
    window.currentOpponentToken = chat.opponent_token || currentOpponentId || null;
    if (!window.currentOpponentToken && currentOpponentId) {
        // Если токен отсутствует, но есть числовой ID — формируем surrogate
        window.currentOpponentToken = `tg_${currentOpponentId}`;
    }
    // Сохраняем никнейм собеседника для блокировки
    window.currentOpponentNickname = chat.sender_nickname || null;
        
        console.log('👤 [checkBlockStatus] Определен собеседник:', {
            isUser1,
            currentOpponentId: currentOpponentId?.substring(0, 16) + '...',
            opponentToken: window.currentOpponentToken?.substring(0, 16) + '...'
        });
        
        // Проверяем блокировку
        const userToken = localStorage.getItem('user_token') || userId;
        console.log('🔐 [checkBlockStatus] Проверяем блокировку между:', {
            user1_token: userToken?.substring(0, 16) + '...',
            user2_token: (window.currentOpponentToken || currentOpponentId)?.substring(0, 16) + '...'
        });
        
        const blockResponse = await fetch('/api/blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'check-block-status',
                params: { user1_token: userToken, user2_token: window.currentOpponentToken || currentOpponentId }
            })
        });
        
        const blockResult = await blockResponse.json();
        console.log('🚫 [checkBlockStatus] Результат проверки блокировки:', blockResult);
        
        if (blockResult.data && blockResult.data.isBlocked) {
            isUserBlocked = blockResult.data.blockedByCurrentUser;
            const blockedByOther = blockResult.data.blockedByOther;
            
            console.log('⚠️ [checkBlockStatus] Блокировка обнаружена:', {
                blockedByMe: isUserBlocked,
                blockedByOther
            });
            
            // Обновляем текст кнопки
            const blockMenuText = document.getElementById('blockMenuText');
            if (blockMenuText) {
                blockMenuText.textContent = isUserBlocked ? '✅ Разблокировать собеседника' : '🚫 Заблокировать собеседника';
            }
            
            // Показываем предупреждение: приоритет у "я заблокировал"
            if (isUserBlocked) {
                showBlockWarning(true, 'self');
            } else if (blockedByOther) {
                showBlockWarning(true, 'other');
            } else {
                showBlockWarning(false);
            }
        } else {
            console.log('✅ [checkBlockStatus] Блокировок не обнаружено');
            isUserBlocked = false;
            showBlockWarning(false);
            const blockMenuText = document.getElementById('blockMenuText');
            if (blockMenuText) {
                blockMenuText.textContent = '🚫 Заблокировать собеседника';
            }
        }
        
    } catch (error) {
        console.error('❌ [checkBlockStatus] Ошибка проверки блокировки:', error);
    }
}

// Показать/скрыть предупреждение о блокировке
function showBlockWarning(show, type = 'other') {
    const warning = document.getElementById('blockWarning');
    const messageInput = document.getElementById('messageInput');
    const photoInput = document.getElementById('photoInput');
    const sendBtn = document.querySelector('.send-button');
    const attachBtn = document.querySelector('.attach-photo-button');
    
    if (show) {
        // Текст в зависимости от того, кто заблокировал
        if (type === 'self') {
            warning.textContent = '🚫 Вы заблокировали этого собеседника';
        } else {
            warning.textContent = '⚠️ Собеседник внес вас в черный список';
        }
        warning.style.display = 'block';
        messageInput.disabled = true;
        messageInput.placeholder = 'Сообщения заблокированы';
        if (sendBtn) sendBtn.disabled = true;
        if (attachBtn) attachBtn.disabled = true;
    } else {
        warning.style.display = 'none';
        messageInput.disabled = false;
        messageInput.placeholder = 'Введите сообщение...';
        if (sendBtn) sendBtn.disabled = false;
        if (attachBtn) attachBtn.disabled = false;
    }
}

// Обновить UI блокировки
function updateBlockUI() {
    // Если isUserBlocked = true, значит МЫ заблокировали (self), иначе нас заблокировали (other)
    showBlockWarning(isUserBlocked, isUserBlocked ? 'self' : 'other');
}

// Заблокировать/разблокировать пользователя
async function toggleBlockUser() {
    console.log('🚫 [toggleBlockUser] Начало блокировки/разблокировки');
    const menu = document.getElementById('chatMenu');
    menu.style.display = 'none';
    
    console.log('🔍 [toggleBlockUser] Проверяем идентификаторы:', {
        currentOpponentId: currentOpponentId?.substring(0, 16) + '...',
        currentOpponentToken: window.currentOpponentToken?.substring(0, 16) + '...',
        currentChatId
    });
    
    // Если идентификаторы не установлены, пытаемся получить их из чата
    if (!currentOpponentId && !window.currentOpponentToken) {
        console.log('⚠️ [toggleBlockUser] Идентификаторы не найдены, пытаемся получить из чата...');
        
        if (!currentChatId) {
            console.error('❌ [toggleBlockUser] Нет ни идентификаторов, ни ID чата!');
            tg.showAlert('Ошибка: ID собеседника не найден');
            return;
        }
        
        try {
            // Получаем user_token (основной идентификатор)
            let userId = localStorage.getItem('user_token');
            
            // Fallback на Telegram ID если токена нет
            if (!userId || userId === 'null' || userId === 'undefined') {
                userId = getCurrentUserId();
            }
            
            console.log('🔄 [toggleBlockUser] Запрашиваем информацию о чате:', currentChatId);
            
            const response = await fetch('/api/neon-chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get-active',
                    params: { userId }
                })
            });
            const result = await response.json();
            
            if (result.error || !result.data) {
                console.error('❌ [toggleBlockUser] Ошибка получения чатов:', result.error);
                tg.showAlert('Ошибка загрузки информации о чате');
                return;
            }
            
            // Находим нужный чат
            const chat = result.data.find(c => c.id == currentChatId);
            
            if (!chat) {
                console.error('❌ [toggleBlockUser] Чат не найден в списке активных');
                tg.showAlert('Чат не найден');
                return;
            }
            
            console.log('📋 [toggleBlockUser] Найден чат:', {
                id: chat.id,
                user_token_1: chat.user_token_1?.substring(0, 16) + '...',
                user_token_2: chat.user_token_2?.substring(0, 16) + '...',
                opponent_token: chat.opponent_token?.substring(0, 16) + '...'
            });
            
            // Устанавливаем opponent_token из чата
            if (chat.opponent_token) {
                window.currentOpponentToken = chat.opponent_token;
                currentOpponentId = chat.opponent_token;
                console.log('✅ [toggleBlockUser] Идентификатор оппонента восстановлен из чата');
            } else {
                console.error('❌ [toggleBlockUser] opponent_token отсутствует в данных чата');
                tg.showAlert('Ошибка: не удалось определить собеседника');
                return;
            }
            
        } catch (error) {
            console.error('❌ [toggleBlockUser] Ошибка при получении информации о чате:', error);
            tg.showAlert('Ошибка загрузки информации о чате');
            return;
        }
    }
    
    const userId = getCurrentUserId();
    const action = isUserBlocked ? 'unblock-user' : 'block-user';
    const confirmText = isUserBlocked 
        ? 'Разблокировать собеседника?' 
        : 'Заблокировать собеседника? Он не сможет отправлять вам сообщения.';

    // Определяем, инициатор ли текущий пользователь блокировки (если нет — предлагаем только "Разблокировать меня"?)
    // Здесь isUserBlocked обозначает "я заблокировал". Если меня заблокировали, isUserBlocked = false, но chat блокирован.
    // Для ясности: добавим fallback кнопку "Попросить разблокировать" когда заблокировал другой.
    if (!isUserBlocked && window.currentOpponentToken && showBlockWarning && document.getElementById('blockWarning')?.style.display === 'block') {
        tg.showAlert('Вы заблокированы собеседником. Вы можете только читать историю.');
    }
    
    console.log('📝 [toggleBlockUser] Подготовка к действию:', {
        action,
        isCurrentlyBlocked: isUserBlocked,
        userId: userId?.substring(0, 16) + '...'
    });
    
    tg.showConfirm(confirmText, async (confirmed) => {
        if (!confirmed) {
            console.log('⏹️ [toggleBlockUser] Пользователь отменил действие');
            return;
        }
        
        try {
            const blockerToken = localStorage.getItem('user_token') || userId;
            const targetToken = window.currentOpponentToken || currentOpponentId;
            
            console.log('📤 [toggleBlockUser] Отправляем запрос блокировки:', {
                action,
                blocker_token: blockerToken?.substring(0, 16) + '...',
                blocked_token: targetToken?.substring(0, 16) + '...',
                chat_id: currentChatId
            });
            
            const response = await fetch('/api/blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action,
                    params: { 
                        blocker_token: blockerToken, 
                        blocked_token: targetToken,
                        blocked_nickname: window.currentOpponentNickname || null,
                        chat_id: currentChatId || null
                    }
                })
            });
            
            const result = await response.json();
            console.log('📥 [toggleBlockUser] Ответ сервера:', result);
            
            if (result.error) {
                console.error('❌ [toggleBlockUser] Ошибка от сервера:', result.error.message);
                tg.showAlert('Ошибка: ' + result.error.message);
                return;
            }
            
            // Обновляем статус
            isUserBlocked = !isUserBlocked;
            console.log('✅ [toggleBlockUser] Статус блокировки изменен:', { isUserBlocked });
            
            const blockMenuText = document.getElementById('blockMenuText');
            if (blockMenuText) {
                blockMenuText.textContent = isUserBlocked ? '✅ Разблокировать собеседника' : '🚫 Заблокировать собеседника';
            }
            
            // Обновляем UI в зависимости от статуса блокировки
            updateBlockUI();
            
            tg.showAlert(isUserBlocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован');

            // После разблокировки перезагружаем статус чата, чтобы обновить opponent_token и блок-статус
            if (!isUserBlocked && currentChatId) {
                setTimeout(() => {
                    checkBlockStatus(currentChatId);
                }, 500);
            }
            
        } catch (error) {
            console.error('❌ [toggleBlockUser] Ошибка при выполнении блокировки:', error);
            tg.showAlert('Ошибка при выполнении действия');
        }
    });
}

// Подтвердить удаление чата
function confirmDeleteChat() {
    const menu = document.getElementById('chatMenu');
    menu.style.display = 'none';
    
    tg.showConfirm(
        '⚠️ Чат будет удален у обеих сторон.\n\nВсе сообщения будут потеряны.\n\nПродолжить?',
        async (confirmed) => {
            if (confirmed) {
                await deleteChat();
            }
        }
    );
}

// Удалить чат для обеих сторон
async function deleteChat() {
    if (!currentChatId) {
        tg.showAlert('Ошибка: ID чата не найден');
        return;
    }
    
    try {
        // Используем user_token вместо telegram ID для проверки доступа
        const userToken = localStorage.getItem('user_token');
        
        if (!userToken) {
            tg.showAlert('Ошибка: токен пользователя не найден');
            return;
        }
        
        console.log('🗑️ [deleteChat] Удаляем чат:', { 
            chatId: currentChatId, 
            userId: userToken.substring(0, 16) + '...' 
        });
        
        const response = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete-chat',
                params: { chatId: currentChatId, userId: userToken }
            })
        });
        
        console.log('🗑️ [deleteChat] Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('🗑️ [deleteChat] Ошибка HTTP:', response.status, errorText);
            tg.showAlert(`Ошибка HTTP ${response.status}: ${errorText}`);
            return;
        }
        
        const result = await response.json();
        
        if (result.error) {
            tg.showAlert('Ошибка: ' + result.error.message);
            return;
        }
        
        tg.showAlert('✅ Чат удален', () => {
            showMyChats();
        });
        
    } catch (error) {
        console.error('Ошибка удаления чата:', error);
        tg.showAlert('Ошибка при удалении чата');
    }
}

// ============= ФИЛЬТРЫ АНКЕТ =============

// Состояние фильтров
let adsFilters = {
    gender: 'all',
    target: 'all',
    orientation: 'all',
    ageFrom: 18,
    ageTo: 99
};

// Открыть/закрыть панель фильтров
function toggleFilters() {
    const panel = document.getElementById('filtersPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        // Инициализируем активные кнопки
        updateFilterButtons();
    } else {
        panel.style.display = 'none';
    }
}

// Установить фильтр
function setFilter(type, value) {
    adsFilters[type] = value;
    updateFilterButtons();
}

// Обновить активные кнопки фильтров
function updateFilterButtons() {
    // Обновляем кнопки пола
    document.querySelectorAll('[data-filter-type="gender"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === adsFilters.gender);
    });
    
    // Обновляем кнопки цели
    document.querySelectorAll('[data-filter-type="target"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === adsFilters.target);
    });
    
    // Обновляем кнопки ориентации
    document.querySelectorAll('[data-filter-type="orientation"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === adsFilters.orientation);
    });
}

// Применить фильтры
function applyFilters() {
    // Получаем значения возраста
    const ageFromInput = document.getElementById('ageFrom');
    const ageToInput = document.getElementById('ageTo');
    
    if (ageFromInput && ageToInput) {
        adsFilters.ageFrom = parseInt(ageFromInput.value) || 18;
        adsFilters.ageTo = parseInt(ageToInput.value) || 99;
    }
    
    // Считаем активные фильтры
    let activeCount = 0;
    if (adsFilters.gender !== 'all') activeCount++;
    if (adsFilters.target !== 'all') activeCount++;
    if (adsFilters.orientation !== 'all') activeCount++;
    if (adsFilters.ageFrom !== 18 || adsFilters.ageTo !== 99) activeCount++;
    
    // Обновляем badge
    const badge = document.getElementById('filterBadge');
    if (badge) {
        badge.textContent = activeCount > 0 ? activeCount : '';
        badge.style.display = activeCount > 0 ? 'inline' : 'none';
    }
    
    // Закрываем панель
    document.getElementById('filtersPanel').style.display = 'none';
    
    // Перезагружаем анкеты с фильтрами
    showBrowseAds();
}

// Сбросить фильтры
function resetFilters() {
    adsFilters = {
        gender: 'all',
        target: 'all',
        orientation: 'all',
        ageFrom: 18,
        ageTo: 99
    };
    
    // Сбрасываем поля ввода
    const ageFromInput = document.getElementById('ageFrom');
    const ageToInput = document.getElementById('ageTo');
    if (ageFromInput) ageFromInput.value = 18;
    if (ageToInput) ageToInput.value = 99;
    
    // Обновляем UI
    updateFilterButtons();
    
    const badge = document.getElementById('filterBadge');
    if (badge) {
        badge.textContent = '';
        badge.style.display = 'none';
    }
    
    // Закрываем панель и перезагружаем
    document.getElementById('filtersPanel').style.display = 'none';
    showBrowseAds();
}

// ============= РЕФЕРАЛЬНАЯ СИСТЕМА =============

// Обработка реферальной ссылки при запуске
async function handleReferralLink() {
    try {
        // Проверяем есть ли start_param в Telegram WebApp
        let startParam = tg?.initDataUnsafe?.start_param;
        
        console.log('[REFERRAL DEBUG] start_param из Telegram:', startParam);
        console.log('[REFERRAL DEBUG] Полный initDataUnsafe:', JSON.stringify(tg?.initDataUnsafe, null, 2));
        
        // Если нет в Telegram, проверяем URL параметр (для перехода через бота)
        if (!startParam) {
            const urlParams = new URLSearchParams(window.location.search);
            const refParam = urlParams.get('ref');
            if (refParam) {
                // Сохраняем реферальный токен В ЛОКАЛЬНОМ ХРАНИЛИЩЕ до редиректа
                console.log('[REFERRAL] Обнаружен web-переход с ?ref=, сохраняем в localStorage');
                localStorage.setItem('pending_referral', refParam);
                localStorage.setItem('pending_referral_timestamp', Date.now().toString());
                
                // АВТОМАТИЧЕСКИЙ РЕДИРЕКТ В TELEGRAM!
                console.log('[REFERRAL] Редиректим в Telegram с ref_' + refParam);
                const botUsername = 'anonimka_kz_bot'; // Замените на имя вашего бота
                const telegramLink = `https://t.me/${botUsername}?startapp=ref_${refParam}`;
                
                // Показываем сообщение и редиректим
                document.body.innerHTML = `
                    <div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
                        padding: 20px;
                        text-align: center;
                    ">
                        <div style="
                            background: rgba(0, 217, 255, 0.1);
                            border: 2px solid var(--neon-cyan);
                            border-radius: 20px;
                            padding: 30px;
                            max-width: 400px;
                            box-shadow: 0 0 30px rgba(0, 217, 255, 0.3);
                        ">
                            <div style="font-size: 64px; margin-bottom: 20px;">✈️</div>
                            <h2 style="color: var(--neon-cyan); margin-bottom: 15px;">Переход в Telegram</h2>
                            <p style="color: var(--text-gray); margin-bottom: 25px;">
                                Вас пригласили в Anonimka!<br>
                                Открываем приложение в Telegram...
                            </p>
                            <a href="${telegramLink}" style="
                                display: inline-block;
                                background: rgba(0, 217, 255, 0.2);
                                border: 2px solid var(--neon-cyan);
                                border-radius: 12px;
                                padding: 15px 30px;
                                color: var(--text-light);
                                text-decoration: none;
                                font-weight: 600;
                                box-shadow: 0 0 20px rgba(0, 217, 255, 0.4);
                            ">
                                🚀 Открыть в Telegram
                            </a>
                        </div>
                    </div>
                `;
                
                // Автоматический редирект через 1 секунду
                setTimeout(() => {
                    window.location.href = telegramLink;
                }, 1000);
                
                return; // Останавливаем дальнейшую обработку
            }
            console.log('[REFERRAL DEBUG] URL параметр ?ref= не найден');
        } else {
            console.log('[REFERRAL DEBUG] Используем start_param из Telegram WebApp');
            startParam = startParam; // Уже есть из Telegram
        }
        
        // Если start_param нет, проверяем сохранённый реферал из localStorage
        if (!startParam || !startParam.startsWith('ref_')) {
            const savedReferral = localStorage.getItem('pending_referral');
            const savedTimestamp = localStorage.getItem('pending_referral_timestamp');
            
            // Проверяем что сохранённый реферал не старше 10 минут
            if (savedReferral && savedTimestamp) {
                const age = Date.now() - parseInt(savedTimestamp);
                if (age < 10 * 60 * 1000) { // 10 минут
                    console.log('[REFERRAL DEBUG] Используем сохранённый реферал из localStorage');
                    startParam = 'ref_' + savedReferral;
                    // Очищаем сохранённые данные
                    localStorage.removeItem('pending_referral_timestamp');
                } else {
                    console.log('[REFERRAL DEBUG] Сохранённый реферал устарел (>10 мин), игнорируем');
                    localStorage.removeItem('pending_referral');
                    localStorage.removeItem('pending_referral_timestamp');
                }
            }
        }
        
        if (!startParam || !startParam.startsWith('ref_')) {
            console.log('ℹ️ Реферальный параметр не найден');
            return;
        }
        
        const referrerId = startParam.replace('ref_', '');
        console.log('[REFERRAL DEBUG] referrerId извлечён:', referrerId);
        
        const currentUserId = getCurrentUserId();
        const currentUserToken = localStorage.getItem('user_token');
        
        console.log('[REFERRAL DEBUG] currentUserId:', currentUserId, 'user_token:', currentUserToken);
        
        // Если токена нет ИЛИ это веб-юзер без авторизации, сохраняем на потом
        if (!currentUserToken && (!currentUserId || currentUserId.startsWith('web_'))) {
            console.log('⚠️ Токен не создан, реферал будет обработан после инициализации');
            // Сохраняем реферала для последующей обработки
            localStorage.setItem('pending_referral', referrerId);
            return;
        }
        
        console.log('📨 Обработка реферальной ссылки сейчас');
        
        // Определяем идентификатор нового пользователя: токен (предпочтительно) или tgId
        const newIdentifier = currentUserToken || currentUserId;
        
        console.log('[REFERRAL DEBUG] Отправка POST /api/referrals:', {
            referrer_token: referrerId,
            new_user_token: newIdentifier
        });
        
        // Отправляем на сервер (поддерживается токен или numeric tgId)
        const response = await fetch('/api/referrals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                referrer_token: referrerId,
                new_user_token: newIdentifier
            })
        });
        
        const data = await response.json();
        
        console.log('[REFERRAL DEBUG] Ответ от сервера:', response.status, data);
        
        if (response.ok && data.success) {
            console.log('✅ Реферал зарегистрирован');
            // Сохраняем что реферал обработан
            localStorage.setItem('referral_processed', 'true');
            localStorage.setItem('referrer_token', referrerId);
            console.log('[REFERRAL DEBUG] Сохранено в localStorage:', {
                referral_processed: localStorage.getItem('referral_processed'),
                referrer_token: localStorage.getItem('referrer_token')
            });
        } else {
            console.log('ℹ️ Реферал не зарегистрирован:', data.message || data.error);
        }
        
    } catch (error) {
        console.error('❌ Ошибка обработки реферальной ссылки:', error);
    }
}

// Функция вызывается после создания анкеты для выдачи награды
async function processReferralReward() {
    try {
        console.log('[REWARD DEBUG] Начало processReferralReward');
        
        // ЗАЩИТА: награда выдаётся строго один раз (даже если запрос упал)
        const alreadyProcessed = localStorage.getItem('referral_reward_processed');
        if (alreadyProcessed === 'true') {
            console.log('ℹ️ Реферальная награда уже была обработана ранее');
            return;
        }

        const referrerToken = localStorage.getItem('referrer_token');
        const referralProcessed = localStorage.getItem('referral_processed');
        
        console.log('[REWARD DEBUG] referrer_token:', referrerToken, 'referral_processed:', referralProcessed);
        
        if (!referrerToken) {
            console.log('[REWARD DEBUG] Нет referrer_token — пользователь пришел не по реферальной ссылке');
            return; // Пользователь пришел не по реферальной ссылке
        }
        
        const currentUserToken = localStorage.getItem('user_token');
        
        console.log('[REWARD DEBUG] current user_token:', currentUserToken);
        console.log('🎁 Запрос на выдачу PRO для реферера');
        
        const payload = { new_user_token: currentUserToken };
        console.log('[REWARD DEBUG] Отправка PUT /api/referrals:', payload);
        
        const response = await fetch('/api/referrals', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        console.log('[REWARD DEBUG] Ответ от сервера:', response.status, data);
        
        if (response.ok) {
            if (data.success) {
                console.log(`✅ PRO подписка выдана до ${data.expiresAt}`);
            } else {
                console.log('ℹ️ Награда уже была выдана ранее (сервер)');
            }
            // Отмечаем что попытка выдачи завершена (успешно или уже была)
            localStorage.setItem('referral_reward_processed', 'true');
            localStorage.removeItem('referrer_token');
            localStorage.removeItem('pending_referral');
        } else {
            console.warn('⚠️ Сервер вернул ошибку при выдаче награды:', data.message || data.error);
            // Не ставим флаг processed — retry при следующей попытке (если сеть упала)
        }
        
    } catch (error) {
        console.error('❌ Ошибка выдачи награды за реферала:', error);
        // Не ставим флаг processed — retry при следующей попытке
    }
}

function showReferralModal() {
    const modal = document.getElementById('referralModal');
    const referralLinkEl = document.getElementById('referralLink');
    modal.style.display = 'flex';

    // Для рефералок используем токен пользователя (универсально: веб и Telegram)
    const userToken = localStorage.getItem('user_token');

    if (!userToken || userToken === 'null' || userToken === 'undefined') {
        referralLinkEl.textContent = 'Сначала создайте анкету — после публикации мы дадим вам реферальную ссылку';
        return;
    }

    // Прямая веб-ссылка (работает всегда, из любого места)
    const webLink = `https://anonimka.kz/webapp?ref=${userToken}`;
    
    // Показываем только веб-ссылку (самый надёжный и универсальный вариант)
    referralLinkEl.innerHTML = `
        <span style="font-size: 12px; word-break: break-all; color: var(--text-gray);">${webLink}</span>
    `;
    
    // Для копирования используем веб-ссылку
    window.currentReferralLink = webLink;
}

function closeReferralModal() {
    const modal = document.getElementById('referralModal');
    modal.style.display = 'none';
}

async function copyReferralLink() {
    const link = window.currentReferralLink;
    
    if (!link) {
        tg.showAlert('Ссылка не готова');
        return;
    }
    
    // Рандомные тексты для реферальной ссылки
    const referralTexts = [
        "Хотите кому-то понравиться, но без неловких взглядов?\nЗдесь никому не нужно быть \"красивым\".\nТолько честным. Анонимно.\n\n",
        "Один клик — и Вы в мире, где никто не знает, кто Вы, но все хотят узнать.\nЗайдите. Напишите. Проверьте, кто ответит.\n\n",
        "Тут не спрашивают, откуда Вы и сколько Вам лет.\nТолько одно важно — что Вы скажете первым.\n\n",
        "Зайдите, если хотите почувствовать хоть что-то настоящее.\nИногда даже одно сообщение может поменять день.\nИли ночь.\n\n",
        "Вы ведь всё равно проверите, кто там пишет.\nПросто сделайте это сразу.\nРегистрация в один клик.\n\n",
        "Никаких подписок, никаких лиц.\nТолько Вы и чужое сообщение, которое почему-то задело.\n\n",
        "Место, где неловкость — валюта, а молчание — способ флирта.\nПрисоединяйтесь, если готовы к кринжу… и кому-то новому.\n\n",
        "Зайдите просто из любопытства.\nВсе с этого начинают.\nА потом остаются.\n\n"
    ];
    
    // Выбираем рандомный текст
    const randomText = referralTexts[Math.floor(Math.random() * referralTexts.length)];
    const textToCopy = randomText + link;
    
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(textToCopy);
            tg.showAlert('✅ Ссылка с текстом скопирована!');
        } else {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                tg.showAlert('✅ Ссылка с текстом скопирована!');
            } catch (err) {
                tg.showAlert('Не удалось скопировать. Скопируйте вручную.');
            }
            
            document.body.removeChild(textArea);
        }
    } catch (error) {
        console.error('Ошибка копирования:', error);
        tg.showAlert('Ошибка при копировании');
    }
}

function shareReferralLink() {
    const link = window.currentReferralLink;
    
    if (!link) {
        tg.showAlert('Ссылка не готова');
        return;
    }
    
    // Рандомные тексты для реферальной ссылки (те же что и в copyReferralLink)
    const referralTexts = [
        "Хотите кому-то понравиться, но без неловких взглядов?\nЗдесь никому не нужно быть \"красивым\".\nТолько честным. Анонимно.",
        "Один клик — и Вы в мире, где никто не знает, кто Вы, но все хотят узнать.\nЗайдите. Напишите. Проверьте, кто ответит.",
        "Тут не спрашивают, откуда Вы и сколько Вам лет.\nТолько одно важно — что Вы скажете первым.",
        "Зайдите, если хотите почувствовать хоть что-то настоящее.\nИногда даже одно сообщение может поменять день.\nИли ночь.",
        "Вы ведь всё равно проверите, кто там пишет.\nПросто сделайте это сразу.\nРегистрация в один клик.",
        "Никаких подписок, никаких лиц.\nТолько Вы и чужое сообщение, которое почему-то задело.",
        "Место, где неловкость — валюта, а молчание — способ флирта.\nПрисоединяйтесь, если готовы к кринжу… и кому-то новому.",
        "Зайдите просто из любопытства.\nВсе с этого начинают.\nА потом остаются."
    ];
    
    // Выбираем рандомный текст
    const randomText = referralTexts[Math.floor(Math.random() * referralTexts.length)];
    const shareText = randomText + "\n\n" + link;
    
    // Проверяем доступность Telegram WebApp API
    if (isTelegramWebApp && tg.openTelegramLink) {
        // Открываем диалог выбора чата для отправки
        // Используем только text параметр, чтобы текст и ссылка шли вместе
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(randomText)}`);
    } else if (navigator.share) {
        // Используем Web Share API
        navigator.share({
            title: 'Пригласи друга в Anonimka.kz',
            text: shareText
        }).catch(err => {
            console.log('Отмена шаринга:', err);
        });
    } else {
        // Fallback - копируем текст
        copyReferralLink();
    }
}

// Закрытие реферального модального окна по клику вне его
window.addEventListener('click', (event) => {
    const referralModal = document.getElementById('referralModal');
    if (event.target === referralModal) {
        closeReferralModal();
    }
    
    const customConfirmModal = document.getElementById('customConfirmModal');
    if (event.target === customConfirmModal && customConfirmModal.hasAttribute('data-confirm-callback')) {
        // Закрываем модалку и вызываем callback с false (отмена)
        customConfirmModal.style.display = 'none';
        customConfirmModal.removeAttribute('data-confirm-callback');
        const callback = customConfirmModal._confirmCallback;
        if (callback) setTimeout(() => callback(false), 0);
    }
});

// Попытка завершить регистрацию отложенного реферала (когда появился user_token/tgId)
async function finalizePendingReferral() {
    try {
        const pending = localStorage.getItem('pending_referral');
        console.log('[FINALIZE DEBUG] pending_referral:', pending);
        if (!pending) return;
        
        const token = localStorage.getItem('user_token');
        let tgId = null;
        if (isTelegramWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
            tgId = String(window.Telegram.WebApp.initDataUnsafe.user.id);
        } else {
            try {
                const u = JSON.parse(localStorage.getItem('telegram_user') || 'null');
                if (u?.id) tgId = String(u.id);
            } catch {}
        }
        const newId = token || tgId;
        
        console.log('[FINALIZE DEBUG] token:', token, 'tgId:', tgId, 'newId:', newId);
        
        if (!newId) {
            console.log('[FINALIZE DEBUG] Идентификатор ещё не готов, попробуем позже');
            return; // ещё нет идентификатора — попробуем позже
        }
        
        console.log('[FINALIZE DEBUG] Отправка POST /api/referrals:', {
            referrer_token: pending,
            new_user_token: newId
        });
        
        const resp = await fetch('/api/referrals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referrer_token: pending, new_user_token: newId })
        });
        const data = await resp.json();
        
        console.log('[FINALIZE DEBUG] Ответ от сервера:', resp.status, data);
        
        if (resp.ok && data?.success) {
            localStorage.setItem('referral_processed', 'true');
            localStorage.setItem('referrer_token', pending);
            localStorage.removeItem('pending_referral');
            console.log('✅ Отложенный реферал зарегистрирован');
        } else {
            console.warn('⚠️ Не удалось зарегистрировать отложенный реферал:', data?.error || data?.message);
        }
    } catch (e) {
        console.warn('Ошибка finalizePendingReferral:', e);
    }
}

// ============= УПРАВЛЕНИЕ ЗАБЛОКИРОВАННЫМИ =============

async function showBlockedUsers() {
    closeHamburgerMenu();
    const container = document.getElementById('blockedUsersContainer');
    showScreen('blockedUsers');
    
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Загрузка...</p>
        </div>
    `;
    
    try {
        // Получаем идентификатор пользователя (userToken для email, userId для Telegram)
        let userToken = localStorage.getItem('user_token');
        
        // Fallback на Telegram ID если токена нет
        if (!userToken || userToken === 'null' || userToken === 'undefined') {
            const userId = getCurrentUserId();
            if (!userId || userId.startsWith('web_')) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="neon-icon">🔒</div>
                        <h3>Требуется авторизация</h3>
                        <p>Для просмотра заблокированных пользуйтесь Telegram</p>
                    </div>
                `;
                return;
            }
            userToken = userId;
        }
        
        const response = await fetch('/api/user-blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-blocked-users',
                params: { userToken: userToken }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="neon-icon">⚠️</div>
                    <h3>Ошибка</h3>
                    <p>${result.error}</p>
                </div>
            `;
            return;
        }
        
        const blockedUsers = result.data || [];
        
        if (blockedUsers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="neon-icon">✅</div>
                    <h3>Список пуст</h3>
                    <p>У вас нет заблокированных пользователей</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = blockedUsers.map(user => `
            <div class="blocked-user-card">
                <div class="blocked-user-info">
                    <span class="blocked-user-icon">👤</span>
                    <div class="blocked-user-details">
                        <div class="blocked-user-name">${escapeHtml(user.blocked_nickname || 'Неизвестный')}</div>
                        <div class="blocked-user-date">Заблокирован ${formatChatTime(user.created_at)}</div>
                    </div>
                </div>
                <button class="unblock-btn" onclick="unblockUserFromList('${user.blocked_token}')" title="Разблокировать">
                    ×
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Ошибка загрузки заблокированных:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="neon-icon">⚠️</div>
                <h3>Ошибка</h3>
                <p>Не удалось загрузить список</p>
            </div>
        `;
    }
}

async function unblockUserFromList(blockedId) {
    const userToken = localStorage.getItem('user_token');
    
    tg.showConfirm('Разблокировать пользователя?', async (confirmed) => {
        if (!confirmed) return;
        
        try {
            const response = await fetch('/api/user-blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'unblock-user',
                    params: { blockerToken: userToken, blockedToken: blockedId }
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                tg.showAlert('Ошибка: ' + result.error);
                return;
            }
            
            tg.showAlert('✅ Пользователь разблокирован');
            // Перезагружаем список
            showBlockedUsers();
            
        } catch (error) {
            console.error('Ошибка разблокировки:', error);
            tg.showAlert('Ошибка при разблокировке');
        }
    });
}

// ==================== WORLD CHAT ====================

let currentWorldChatTab = 'world';
let worldChatAutoRefreshInterval = null;
let worldChatLastMessageTime = null;
let worldChatLoadingController = null; // Для отмены предыдущих запросов

// Показать экран Мир чата
async function showWorldChat() {
    console.log('🌍 Открытие Мир чата');
    showScreen('worldChatScreen');
    
    // Применяем сохраненный размер шрифта
    const savedSize = localStorage.getItem('worldChatFontSize') || 'medium';
    const messagesContainer = document.querySelector('.world-chat-messages');
    if (messagesContainer) {
        messagesContainer.classList.remove('font-small', 'font-medium', 'font-large');
        messagesContainer.classList.add(`font-${savedSize}`);
    }
    
    // Обновляем кнопку размера шрифта
    const btn = document.getElementById('fontSizeBtn');
    if (btn) {
        if (savedSize === 'small') {
            btn.style.fontSize = '12px';
        } else if (savedSize === 'medium') {
            btn.style.fontSize = '14px';
        } else {
            btn.style.fontSize = '17px';
        }
    }
    
    // Загружаем сообщения
    await loadWorldChatMessages();
    
    // Прокручиваем вниз после первой загрузки
    setTimeout(() => {
        const container = document.getElementById('worldChatMessages');
        const scrollContainer = container?.parentElement;
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, 100);
    
    // Обновляем счетчик символов
    updateWorldChatCharCount();
    
    // Запускаем автообновление каждые 3 секунды
    if (worldChatAutoRefreshInterval) {
        clearInterval(worldChatAutoRefreshInterval);
    }
    worldChatAutoRefreshInterval = setInterval(() => {
        loadWorldChatMessages(true); // silent reload
    }, 3000);
}

// Переключение размера шрифта
function toggleFontSize() {
    const messagesContainer = document.querySelector('.world-chat-messages');
    if (!messagesContainer) return;
    
    // Получаем текущий размер из localStorage или дефолтный 'medium'
    let currentSize = localStorage.getItem('worldChatFontSize') || 'medium';
    
    // Переключаем на следующий размер
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    const nextSize = sizes[nextIndex];
    
    // Удаляем старые классы и добавляем новый
    messagesContainer.classList.remove('font-small', 'font-medium', 'font-large');
    messagesContainer.classList.add(`font-${nextSize}`);
    
    // Сохраняем в localStorage
    localStorage.setItem('worldChatFontSize', nextSize);
    
    // Обновляем текст кнопки
    const btn = document.getElementById('fontSizeBtn');
    if (btn) {
        if (nextSize === 'small') {
            btn.textContent = 'A';
            btn.style.fontSize = '12px';
        } else if (nextSize === 'medium') {
            btn.textContent = 'A';
            btn.style.fontSize = '14px';
        } else {
            btn.textContent = 'A';
            btn.style.fontSize = '17px';
        }
    }
    
    console.log('📏 Размер шрифта:', nextSize);
}

// Переключение вкладок
async function switchWorldChatTab(tab) {
    console.log('🔄 Переключение на вкладку:', tab);
    
    // Отменяем предыдущий запрос если есть
    if (worldChatLoadingController) {
        worldChatLoadingController.abort();
    }
    
    currentWorldChatTab = tab;
    
    // Сбрасываем кеш ID сообщений при переключении вкладок
    lastWorldChatMessageIds = [];
    
    // Обновляем активную кнопку
    document.querySelectorAll('.world-chat-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${tab}Tab`).classList.add('active');
    
    // Обновляем префикс и очищаем поле при переключении на Мир или Город
    const prefixElement = document.getElementById('worldChatPrefix');
    const input = document.getElementById('worldChatInput');
    
    if (tab === 'world') {
        prefixElement.textContent = '@';
        prefixElement.style.color = '#FFD700';
        // Очищаем поле если там был никнейм для личного сообщения
        if (input.value.trim()) {
            input.value = '';
        }
    } else if (tab === 'city') {
        prefixElement.textContent = '&';
        prefixElement.style.color = '#00D9FF';
        // Очищаем поле если там был никнейм для личного сообщения
        if (input.value.trim()) {
            input.value = '';
        }
    } else if (tab === 'private') {
        prefixElement.textContent = '/';
        prefixElement.style.color = '#FF006E';
    }
    
    // Очищаем контейнер перед загрузкой новых сообщений
    const messagesContainer = document.querySelector('.world-chat-messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="loading-placeholder">
                <div class="neon-icon pulse">💬</div>
                <p>Загрузка сообщений...</p>
            </div>
        `;
    }
    
    // Загружаем сообщения для этой вкладки
    await loadWorldChatMessages();
}

// Загрузить сообщения
async function loadWorldChatMessages(silent = false) {
    try {
        // Создаем новый AbortController для этого запроса
        worldChatLoadingController = new AbortController();
        const requestTab = currentWorldChatTab; // Сохраняем текущую вкладку
        
        const userToken = localStorage.getItem('user_token');
        const userCity = localStorage.getItem('userCity') || 'Алматы';
        
        const response = await fetch('/api/world-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-messages',
                params: {
                    tab: requestTab,
                    userToken: userToken,
                    userCity: userCity
                }
            }),
            signal: worldChatLoadingController.signal
        });
        
        const data = await response.json();
        
        // Проверяем что вкладка не изменилась пока грузились данные
        if (requestTab !== currentWorldChatTab) {
            console.log(`⏭️ Пропускаем рендер для ${requestTab}, текущая вкладка: ${currentWorldChatTab}`);
            return;
        }
        
        if (data.success) {
            if (!silent) {
                console.log(`✅ Загружено ${data.data.length} сообщений для вкладки ${requestTab}`);
            }
            renderWorldChatMessages(data.data);
        } else {
            console.error('❌ Ошибка загрузки сообщений:', data.error);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('⏹️ Запрос отменен (переключение вкладки)');
        } else {
            console.error('Ошибка загрузки сообщений:', error);
        }
    }
}

// Кэш последних ID сообщений для предотвращения моргания
let lastWorldChatMessageIds = [];

// Функция цензуры матерных слов
function censorMessage(text) {
    if (!text) return text;
    
    // Список матерных слов и их вариаций
    const badWords = [
        // Основные маты
        'блять', 'бля', 'блядь', 'блят', 'бляд',
        'хуй', 'хуя', 'хуе', 'хую', 'хуи', 'хер',
        'пизда', 'пизд', 'пиздец', 'пизде', 'пизду',
        'ебать', 'ебал', 'ебан', 'еба', 'ебу', 'ебёт', 'ебёшь', 'ебля',
        'сука', 'суки', 'суку', 'сук',
        'гандон', 'гандоны', 'гондон',
        'мудак', 'мудила', 'мудаки', 'мудло',
        'долбоеб', 'долбоёб', 'дибил', 'дебил',
        'уебок', 'уёбок', 'ублюдок', 'ублюдки',
        'говно', 'говна', 'гавно',
        'жопа', 'жопы', 'жопу', 'жоп',
        'шлюха', 'шлюхи', 'шлюху',
        'петух', 'петухи', 'пидор', 'пидр', 'педик',
        'чмо', 'чмошник',
        // Латиница
        'fuck', 'shit', 'bitch', 'ass', 'dick', 'cock', 'pussy',
        // Вариации с заменой букв
        'б л я', 'б л я т ь', 'х у й', 'п и з д а',
        'сцука', 'сучка', 'сучки',
        // Казахские маты
        'қарақшы', 'жесір', 'көтек'
    ];
    
    let censored = text;
    
    // Заменяем каждое матерное слово на звездочки
    badWords.forEach(word => {
        // Создаем регулярное выражение для поиска слова (игнорируем регистр)
        const regex = new RegExp(word.split('').map(char => {
            // Экранируем спецсимволы
            const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Добавляем возможные вариации с пробелами/точками между буквами
            return escaped + '[\\s\\.\\-_]*';
        }).join(''), 'gi');
        
        censored = censored.replace(regex, (match) => {
            return '*'.repeat(Math.max(4, match.length));
        });
        
        // Также простая замена без вариаций
        const simpleRegex = new RegExp(`\\b${word}\\b`, 'gi');
        censored = censored.replace(simpleRegex, '****');
    });
    
    return censored;
}

// Отрисовка сообщений
function renderWorldChatMessages(messages) {
    const container = document.getElementById('worldChatMessages');
    
    if (!container) {
        console.error('❌ Container worldChatMessages не найден');
        return;
    }
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="loading-placeholder">
                <div class="neon-icon">💬</div>
                <p>Пока нет сообщений</p>
                <p style="font-size: 12px; color: var(--text-gray);">Будьте первым!</p>
            </div>
        `;
        lastWorldChatMessageIds = [];
        return;
    }
    
    // Проверяем, изменились ли сообщения
    const currentIds = messages.map(m => m.id);
    const idsChanged = JSON.stringify(currentIds) !== JSON.stringify(lastWorldChatMessageIds);
    
    // Если сообщения не изменились, не перерисовываем
    if (!idsChanged) {
        return;
    }
    
    // Находим новые сообщения
    const newMessageIds = currentIds.filter(id => !lastWorldChatMessageIds.includes(id));
    const hasNewMessages = newMessageIds.length > 0;
    
    lastWorldChatMessageIds = currentIds;
    
    // Проверяем, есть ли placeholder загрузки (первая загрузка)
    const hasLoadingPlaceholder = container.querySelector('.loading-placeholder');
    
    // Если есть новые сообщения И в контейнере уже есть реальные сообщения (не placeholder)
    if (hasNewMessages && container.children.length > 0 && !hasLoadingPlaceholder) {
        const newMessages = messages.filter(m => newMessageIds.includes(m.id));
        newMessages.forEach(msg => {
            const messageHtml = createWorldChatMessageHtml(msg);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = messageHtml;
            const messageElement = tempDiv.firstElementChild;
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(10px)';
            container.appendChild(messageElement);
            
            // Плавное появление
            requestAnimationFrame(() => {
                messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            });
        });
    } else {
        // Первая загрузка или есть placeholder - перерисовываем все
        container.innerHTML = messages.map(msg => createWorldChatMessageHtml(msg)).join('');
    }
    
    // ВСЕГДА прокручиваем вниз к новым сообщениям
    requestAnimationFrame(() => {
        const scrollContainer = container.parentElement;
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    });
    
    // Добавляем обработчики long press для никнеймов
    setupLongPressHandlers();
}

// Создать HTML для одного сообщения (вынесено в отдельную функцию)
function createWorldChatMessageHtml(msg) {
        const isPremium = msg.is_premium || msg.isPremium || false;
        const nicknameClass = `${msg.type}-type${isPremium ? ' premium' : ''}`;
        const proБадge = isPremium ? '<span class="world-chat-pro-badge">⭐</span>' : '';
        const time = formatMessageTime(msg.created_at || msg.createdAt);
        
        // Для личных сообщений показываем "кому"
        let targetInfo = '';
        if (msg.type === 'private' && (msg.target_nickname || msg.targetNickname)) {
            targetInfo = ` → ${msg.target_nickname || msg.targetNickname}`;
        }
        
        // Проверяем, это свой никнейм или чужой
        const currentUserToken = localStorage.getItem('user_token');
        const userToken = msg.user_token || msg.userToken;
        const isOwnMessage = userToken === currentUserToken;
        
        // Для своих личных сообщений при клике подставляем собеседника, а не себя
        let clickableNickname = msg.nickname;
        if (isOwnMessage && msg.type === 'private' && (msg.target_nickname || msg.targetNickname)) {
            clickableNickname = msg.target_nickname || msg.targetNickname;
        }
        
        // Применяем цензуру к сообщению
        let censoredMessage = censorMessage(msg.message);
        
        // Убираем префиксы @ & / из начала сообщения для отображения
        if (censoredMessage.startsWith('@') || censoredMessage.startsWith('&') || censoredMessage.startsWith('/')) {
            censoredMessage = censoredMessage.substring(1).trim();
        }
        
        return `
            <div class="world-chat-message ${msg.type}-type">
                <div class="world-chat-header">
                    <div class="world-chat-nickname ${nicknameClass}" 
                         data-nickname="${escapeHtml(msg.nickname)}"
                         data-user-token="${userToken}"
                         data-is-own="${isOwnMessage}"
                         onclick="clickWorldChatNickname('${escapeHtml(clickableNickname)}')"
                         oncontextmenu="return showWorldChatContextMenu(event, '${escapeHtml(msg.nickname)}', '${userToken}', ${isOwnMessage})">
                        ${escapeHtml(msg.nickname)}${proБадge}${targetInfo}
                    </div>
                    <div class="world-chat-time">${time}</div>
                </div>
                <div class="world-chat-text">${escapeHtml(censoredMessage)}</div>
            </div>
        `;
}

// Настройка long press для мобильных устройств
function setupLongPressHandlers() {
    const nicknames = document.querySelectorAll('.world-chat-nickname');
    
    nicknames.forEach(nickname => {
        let pressTimer;
        
        // Touch events для мобильных
        nickname.addEventListener('touchstart', function(e) {
            const nick = this.getAttribute('data-nickname');
            const token = this.getAttribute('data-user-token');
            const isOwn = this.getAttribute('data-is-own') === 'true';
            
            pressTimer = setTimeout(() => {
                // Вибрация при долгом нажатии (если поддерживается)
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                showWorldChatContextMenu(e, nick, token, isOwn);
            }, 500); // 500ms для long press
        });
        
        nickname.addEventListener('touchend', function() {
            clearTimeout(pressTimer);
        });
        
        nickname.addEventListener('touchmove', function() {
            clearTimeout(pressTimer);
        });
    });
}

// Клик на никнейм - добавить в инпут для личного сообщения
function clickWorldChatNickname(nickname) {
    const input = document.getElementById('worldChatInput');
    const prefix = document.getElementById('worldChatPrefix');
    
    // НЕ переключаемся на вкладку ЛС, остаемся где есть
    // Просто меняем префикс на / для личного сообщения
    input.value = `${nickname} `;
    prefix.textContent = '/';
    prefix.style.color = '#FF006E';
    input.focus();
}

// Отправить сообщение
async function sendWorldChatMessage() {
    const input = document.getElementById('worldChatInput');
    const prefix = document.getElementById('worldChatPrefix').textContent;
    let message = input.value.trim();
    
    if (!message) {
        return;
    }
    
    // Добавляем префикс
    message = prefix + message;
    
    // Проверяем длину (120 символов без префикса)
    if (message.length - 1 > 120) {
        tg.showAlert('Максимум 120 символов');
        return;
    }
    
    try {
        const userToken = localStorage.getItem('user_token');
        const nickname = localStorage.getItem('userNickname') || 'Аноним';
        const isPremium = userPremiumStatus.isPremium || false;
        const city = localStorage.getItem('userCity') || 'Алматы';
        
        const response = await fetch('/api/world-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'send-message',
                params: {
                    userToken: userToken,
                    nickname: nickname,
                    message: message,
                    isPremium: isPremium,
                    city: city
                }
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Сообщение отправлено');
            input.value = '';
            updateWorldChatCharCount();
            
            // Автопереключение после отправки ЛС
            if (prefix === '/') {
                // Если были на вкладке Мир - переключаемся обратно на @ (Мир)
                if (currentWorldChatTab === 'world') {
                    console.log('🔄 Автоматическое переключение на общий чат Мир (@)');
                    await switchWorldChatTab('world');
                }
                // Если были на вкладке Город - переключаемся обратно на & (Город)
                else if (currentWorldChatTab === 'city') {
                    console.log('🔄 Автоматическое переключение на общий чат Город (&)');
                    await switchWorldChatTab('city');
                }
                // Если на вкладке ЛС - просто обновляем
                else {
                    await loadWorldChatMessages();
                }
            } else {
                // Обычное обновление сообщений для @ и &
                await loadWorldChatMessages();
            }
        } else {
            console.error('❌ Ошибка отправки:', data.error);
            
            // Если это таймаут - показываем сообщение от сервера (там правильное время)
            if (response.status === 429) {
                tg.showAlert(data.error || 'Подождите немного перед отправкой');
            } else {
                tg.showAlert(data.error || 'Ошибка отправки сообщения');
            }
        }
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        tg.showAlert('Ошибка отправки сообщения');
    }
}

// Обновление счетчика символов
function updateWorldChatCharCount() {
    const input = document.getElementById('worldChatInput');
    const counter = document.getElementById('worldChatCharCount');
    
    if (input && counter) {
        // Обновляем счетчик сразу
        const length = input.value.length;
        counter.textContent = length;
        
        if (length > 45) {
            counter.style.color = '#FF006E';
        } else {
            counter.style.color = 'var(--text-gray)';
        }
        
        // И добавляем listener для дальнейших изменений
        input.addEventListener('input', () => {
            const length = input.value.length;
            counter.textContent = length;
            
            if (length > 45) {
                counter.style.color = '#FF006E';
            } else {
                counter.style.color = 'var(--text-gray)';
            }
        });
    }
}

// Загрузить превью последнего сообщения для кнопки
async function loadWorldChatPreview() {
    try {
        const response = await fetch('/api/world-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-last-message'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const preview = document.getElementById('worldChatPreview');
            const msg = data.data;
            // Убираем @ из сообщения
            const cleanMessage = msg.message.replace(/^[@&\/]\s*/, '');
            preview.textContent = `${msg.nickname}: ${cleanMessage}`;
        }
    } catch (error) {
        console.error('Ошибка загрузки превью:', error);
    }
}

// Контекстное меню (ПКМ + долгое нажатие)
function showWorldChatContextMenu(event, nickname, userToken, isOwnMessage = false) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Контекстное меню для', nickname, 'isOwn:', isOwnMessage);
    
    // Создаём модальное окно с опциями
    const modal = document.createElement('div');
    modal.className = 'world-chat-context-menu';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(20, 20, 30, 0.98);
        border: 2px solid var(--neon-cyan);
        border-radius: 16px;
        padding: 20px;
        z-index: 10000;
        min-width: 280px;
        animation: fadeIn 0.2s ease;
    `;
    
    // Если это свой никнейм - показываем специальное окно
    if (isOwnMessage) {
        modal.innerHTML = `
            <div style="margin-bottom: 15px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: var(--neon-cyan); margin-bottom: 5px;">
                    ${escapeHtml(nickname)}
                </div>
                <div style="font-size: 12px; color: var(--text-gray);">
                    Это Вы
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="closeWorldChatContextMenu()" style="
                    padding: 12px;
                    background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    Закрыть
                </button>
            </div>
        `;
    } else {
        // Обычное меню для других пользователей
        modal.innerHTML = `
            <div style="margin-bottom: 15px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: var(--neon-cyan); margin-bottom: 5px;">
                    ${escapeHtml(nickname)}
                </div>
                <div style="font-size: 12px; color: var(--text-gray);">
                    Выберите действие
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="worldChatPrivateMessage('${escapeHtml(nickname)}', '${userToken}')" style="
                    padding: 12px;
                    background: linear-gradient(135deg, #FF006E, #C4005A);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    💌 Приват чат
                </button>
                <button onclick="worldChatBlockUser('${escapeHtml(nickname)}', '${userToken}')" style="
                    padding: 12px;
                    background: linear-gradient(135deg, #555, #333);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    🚫 В ЧС
                </button>
                <button onclick="worldChatReportUser('${escapeHtml(nickname)}', '${userToken}')" style="
                    padding: 12px;
                    background: linear-gradient(135deg, #FF4444, #CC0000);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    ⚠️ Пожаловаться
                </button>
                <button onclick="closeWorldChatContextMenu()" style="
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    color: var(--text-light);
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    Отмена
                </button>
            </div>
        `;
    }
    
    // Overlay для закрытия при клике вне меню
    const overlay = document.createElement('div');
    overlay.className = 'world-chat-context-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
    `;
    overlay.onclick = closeWorldChatContextMenu;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    return false;
}

// Закрыть контекстное меню
function closeWorldChatContextMenu() {
    const menu = document.querySelector('.world-chat-context-menu');
    const overlay = document.querySelector('.world-chat-context-overlay');
    if (menu) menu.remove();
    if (overlay) overlay.remove();
}

// Меню для удаления сообщения
function showDeleteMessageMenu(event, messageId) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('Меню удаления для сообщения:', messageId);
    
    // Создаём модальное окно
    const modal = document.createElement('div');
    modal.className = 'delete-message-modal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(20, 20, 30, 0.98);
        border: 2px solid var(--neon-red);
        border-radius: 16px;
        padding: 20px;
        z-index: 10000;
        min-width: 280px;
        animation: fadeIn 0.2s ease;
    `;
    
    modal.innerHTML = `
        <div style="margin-bottom: 15px; text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: var(--neon-red); margin-bottom: 5px;">
                Удалить сообщение?
            </div>
            <div style="font-size: 12px; color: var(--text-gray);">
                Сообщение будет удалено у обоих пользователей
            </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button onclick="deleteMessage(${messageId})" style="
                padding: 12px;
                background: linear-gradient(135deg, #ff4444, #cc0000);
                border: none;
                border-radius: 10px;
                color: white;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            ">
                🗑️ Удалить сообщение
            </button>
            <button onclick="closeDeleteMessageMenu()" style="
                padding: 12px;
                background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
                border: none;
                border-radius: 10px;
                color: white;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            ">
                Отмена
            </button>
        </div>
    `;
    
    // Оверлей
    const overlay = document.createElement('div');
    overlay.className = 'delete-message-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        animation: fadeIn 0.2s ease;
    `;
    overlay.onclick = closeDeleteMessageMenu;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    return false;
}

// Закрыть меню удаления
function closeDeleteMessageMenu() {
    const menu = document.querySelector('.delete-message-modal');
    const overlay = document.querySelector('.delete-message-overlay');
    if (menu) menu.remove();
    if (overlay) overlay.remove();
}

// Удалить сообщение
async function deleteMessage(messageId) {
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            tg.showAlert('⚠️ Ошибка авторизации');
            return;
        }
        
        console.log('Удаление сообщения:', messageId);
        
        const response = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete-message',
                messageId: messageId,
                userToken: userToken
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            tg.showAlert('❌ ' + data.error);
            return;
        }
        
        console.log('Сообщение удалено');
        closeDeleteMessageMenu();
        
        // Перезагружаем сообщения
        const currentChatId = window.currentChatId;
        if (currentChatId) {
            await loadChatMessages(currentChatId);
        }
        
        tg.showAlert('✅ Сообщение удалено');
        
    } catch (error) {
        console.error('Ошибка удаления:', error);
        tg.showAlert('❌ Ошибка при удалении сообщения');
    }
}

// Настройка long press для сообщений
function setupMessageLongPress() {
    const messages = document.querySelectorAll('.message[data-is-mine="true"]');
    
    messages.forEach(msg => {
        let pressTimer = null;
        let touchMoved = false;
        
        const startLongPress = (e) => {
            touchMoved = false;
            const messageId = msg.getAttribute('data-message-id');
            
            pressTimer = setTimeout(() => {
                if (!touchMoved && messageId) {
                    // Вибрация для тактильной обратной связи
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
                    }
                    showDeleteMessageMenu(e, messageId);
                }
            }, 500);
        };
        
        const cancelLongPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };
        
        const handleTouchMove = () => {
            touchMoved = true;
            cancelLongPress();
        };
        
        // Touch events для мобильных
        msg.addEventListener('touchstart', startLongPress, { passive: true });
        msg.addEventListener('touchend', cancelLongPress, { passive: true });
        msg.addEventListener('touchmove', handleTouchMove, { passive: true });
        
        // Mouse events для десктопа (дополнительно к oncontextmenu)
        msg.addEventListener('mousedown', startLongPress);
        msg.addEventListener('mouseup', cancelLongPress);
        msg.addEventListener('mouseleave', cancelLongPress);
    });
}

// Приват чат через контекстное меню
async function worldChatPrivateMessage(nickname, userToken) {
    closeWorldChatContextMenu();
    
    // Получаем токен текущего пользователя
    const currentUserToken = localStorage.getItem('user_token');
    if (!currentUserToken || currentUserToken === 'null' || currentUserToken === 'undefined') {
        tg.showAlert('⚠️ Сначала создайте анкету или авторизуйтесь');
        return;
    }
    
    // Проверяем, не пытается ли пользователь написать самому себе
    if (currentUserToken === userToken) {
        tg.showAlert('Вы не можете отправить сообщение самому себе');
        return;
    }
    
    // Проверяем, не заблокированы ли мы этим пользователем
    try {
        const blockCheckResponse = await fetch('/api/user-blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'is-blocked',
                params: {
                    blockerToken: userToken,
                    blockedToken: currentUserToken
                }
            })
        });
        
        const blockCheckData = await blockCheckResponse.json();
        
        if (blockCheckData.success && blockCheckData.isBlocked) {
            tg.showAlert('Вы не можете создать чат с этим пользователем');
            return;
        }
    } catch (error) {
        console.error('Ошибка проверки блокировки:', error);
    }
    
    // Показываем модальное окно для ввода сообщения
    showCustomPrompt(`Введите сообщение для ${nickname}:`, async (message) => {
        if (!message || message.trim() === '') {
            return;
        }
        
        try {
            // Создаём приватный чат через Мир чат
            await createWorldChatPrivateChat(nickname, userToken, currentUserToken, message);
        } catch (error) {
            console.error('Ошибка создания чата:', error);
            tg.showAlert('❌ Ошибка при создании чата: ' + error.message);
        }
    });
}

// Создать приватный чат из Мир чата
async function createWorldChatPrivateChat(nickname, targetUserToken, senderUserToken, message) {
    try {
        console.log('Создание приватного чата с', nickname);
        
        // Проверяем, существует ли уже чат между этими пользователями
        const checkResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'check-existing-by-tokens',
                params: {
                    user1_token: senderUserToken,
                    user2_token: targetUserToken
                }
            })
        });
        
        const checkData = await checkResponse.json();
        
        if (checkData.data) {
            // Чат уже существует
            console.log('Чат уже существует:', checkData.data);
            
            // Отправляем сообщение в существующий чат через send-message
            const sendResponse = await fetch('/api/neon-messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send-message',
                    params: {
                        chatId: checkData.data.id,
                        senderId: senderUserToken,
                        messageText: message,
                        senderNickname: localStorage.getItem('userNickname') || 'Аноним',
                        skipNotification: false
                    }
                })
            });
            
            const sendData = await sendResponse.json();
            
            if (sendData.error) {
                throw new Error(sendData.error.message || 'Ошибка отправки сообщения');
            }
            
            tg.showAlert(`✅ Сообщение отправлено ${nickname}!\n\nПроверьте раздел "Мои чаты"`);
        } else {
            // Создаём новый чат (без ad_id, так как это из Мир чата)
            const createResponse = await fetch('/api/neon-chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create-direct',
                    params: {
                        user1_token: senderUserToken,
                        user2_token: targetUserToken,
                        message: message,
                        senderNickname: localStorage.getItem('userNickname') || 'Аноним',
                        senderToken: senderUserToken // Указываем явно кто отправитель
                    }
                })
            });
            
            const createData = await createResponse.json();
            
            if (createData.error) {
                throw new Error(createData.error.message || 'Ошибка создания чата');
            }
            
            console.log('Чат успешно создан:', createData.data);
            tg.showAlert(`✅ Приватный чат с ${nickname} создан!\n\nПроверьте раздел "Мои чаты"`);
        }
        
        // Обновляем бейдж чатов
        await updateChatBadge();
        
    } catch (error) {
        console.error('Ошибка при создании приватного чата:', error);
        throw error;
    }
}

// Добавить в ЧС
async function worldChatBlockUser(nickname, blockedUserToken) {
    closeWorldChatContextMenu();
    
    const confirmed = confirm(`Добавить ${nickname} в черный список?\n\nВы не будете видеть сообщения этого пользователя в чате.`);
    if (!confirmed) return;
    
    try {
        const currentUserToken = localStorage.getItem('user_token');
        
        const response = await fetch('/api/user-blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'block-user',
                params: {
                    blockerToken: currentUserToken,
                    blockedToken: blockedUserToken,
                    blockedNickname: nickname // Передаем никнейм
                }
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            tg.showAlert(`${nickname} добавлен в ЧС`);
            // Обновляем сообщения, чтобы скрыть заблокированного
            await loadWorldChatMessages();
        } else {
            tg.showAlert(data.error || 'Ошибка при блокировке');
        }
    } catch (error) {
        console.error('Ошибка блокировки:', error);
        tg.showAlert('Ошибка при блокировке пользователя');
    }
}

// Пожаловаться на пользователя
async function worldChatReportUser(nickname, userToken) {
    closeWorldChatContextMenu();
    
    const reason = prompt(`Причина жалобы на ${nickname}:`);
    if (!reason) return;
    
    try {
        const currentUserToken = localStorage.getItem('user_token');
        
        // TODO: Реализовать API для жалоб
        // Пока просто показываем уведомление
        tg.showAlert(`Жалоба на ${nickname} отправлена (функция в разработке)`);
        
        console.log('Жалоба на пользователя:', nickname, userToken, reason);
    } catch (error) {
        console.error('Ошибка отправки жалобы:', error);
        tg.showAlert('Ошибка при отправке жалобы');
    }
}

// Остановить автообновление при выходе
window.addEventListener('beforeunload', () => {
    if (worldChatAutoRefreshInterval) {
        clearInterval(worldChatAutoRefreshInterval);
    }
});

// ============= СИСТЕМА ЖАЛОБ =============

let currentReportData = {
    reportedUserId: null,
    reportedNickname: null,
    reportType: 'profile',
    relatedAdId: null,
    reason: null
};

// Открыть модальное окно жалобы (из анкеты)
function reportAd() {
    const ad = window.currentAds?.[window.currentAdIndex];
    if (!ad) {
        tg.showAlert('Анкета не найдена');
        return;
    }
    
    // Получаем ID пользователя из user_token
    const reportedUserId = ad.user_id || null;
    if (!reportedUserId) {
        tg.showAlert('Не удалось определить автора анкеты');
        return;
    }
    
    currentReportData = {
        reportedUserId: reportedUserId,
        reportedNickname: ad.display_nickname || 'Аноним',
        reportType: 'ad',
        relatedAdId: ad.id,
        reason: null
    };
    
    document.getElementById('reportModal').style.display = 'flex';
}

// Пожаловаться на пользователя из Мир чата
async function reportUserFromWorldChat(nickname, userToken) {
    closeWorldChatContextMenu();
    
    try {
        // Получаем user_id через user_token из API
        const response = await fetch(`/api/users/by-token?token=${userToken}`);
        const data = await response.json();
        
        if (!data.success || !data.userId) {
            tg.showAlert('Не удалось определить пользователя');
            return;
        }
        
        currentReportData = {
            reportedUserId: data.userId,
            reportedNickname: nickname,
            reportType: 'message',
            relatedAdId: null,
            reason: null
        };
        
        document.getElementById('reportModal').style.display = 'flex';
    } catch (error) {
        console.error('Ошибка получения user_id:', error);
        tg.showAlert('Не удалось определить пользователя');
    }
}

// Закрыть модальное окно жалобы
function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
    document.getElementById('reportDetailsSection').style.display = 'none';
    document.getElementById('reportDescription').value = '';
    document.querySelectorAll('.report-reason-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    currentReportData.reason = null;
}

// Выбрать причину жалобы
function selectReportReason(reason) {
    currentReportData.reason = reason;
    
    // Визуально выделяем выбранную кнопку
    document.querySelectorAll('.report-reason-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.closest('.report-reason-btn').classList.add('selected');
    
    // Показываем секцию с дополнительной информацией
    document.getElementById('reportDetailsSection').style.display = 'block';
}

// Отправить жалобу
async function submitReport() {
    if (!currentReportData.reason) {
        tg.showAlert('Выберите причину жалобы');
        return;
    }
    
    // Получаем ID текущего пользователя
    const currentUserId = tg?.initDataUnsafe?.user?.id || localStorage.getItem('user_id');
    
    // Проверяем что все необходимые данные есть
    if (!currentUserId || !currentReportData.reportedUserId) {
        console.error('Недостаточно данных для жалобы:', {
            currentUserId,
            reportedUserId: currentReportData.reportedUserId,
            currentReportData
        });
        tg.showAlert('Ошибка: не удалось определить пользователей');
        return;
    }
    
    const description = document.getElementById('reportDescription').value.trim();
    
    const reportPayload = {
        reporterId: parseInt(currentUserId),
        reportedUserId: parseInt(currentReportData.reportedUserId),
        reportType: currentReportData.reportType,
        reason: currentReportData.reason,
        description: description || null,
        relatedAdId: currentReportData.relatedAdId || null,
        relatedMessageId: null
    };
    
    console.log('Отправка жалобы:', reportPayload);
    
    try {
        const response = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportPayload)
        });
        
        const data = await response.json();
        
        if (data.success) {
            tg.showAlert('✅ Жалоба отправлена. Администрация рассмотрит её в ближайшее время.');
            closeReportModal();
        } else {
            tg.showAlert(data.error || 'Ошибка при отправке жалобы');
        }
    } catch (error) {
        console.error('Ошибка отправки жалобы:', error);
        tg.showAlert('Ошибка при отправке жалобы');
    }
}

// Заменяем старую функцию worldChatReportUser
window.worldChatReportUser = reportUserFromWorldChat;

// ============= ПОКУПКА PRO ЧЕРЕЗ TELEGRAM STARS =============

/**
 * Покупка PRO подписки через Telegram Stars
 * Перенаправляет пользователя в бота для оплаты
 */
// Глобальная переменная для хранения текущего выбранного срока
let selectedPremiumMonths = 1;
let selectedPremiumPrice = { stars: 50, discount: 0, kzt: 499, rub: 100 };

// Открыть подмодальное окно выбора срока подписки
function showStarsPurchaseModal() {
    const modal = document.getElementById('starsPurchaseModal');
    if (modal) {
        modal.style.display = 'flex';
        // Сбрасываем slider на 1 месяц при открытии
        const slider = document.getElementById('premiumSlider');
        if (slider) {
            slider.value = 1;
            updatePremiumPricing(1);
        }
    }
}

// Закрыть подмодальное окно выбора срока
function closeStarsPurchaseModal() {
    const modal = document.getElementById('starsPurchaseModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Обновление ценовой информации при движении slider
async function updatePremiumPricing(months) {
    selectedPremiumMonths = parseInt(months);
    
    try {
        // Запрашиваем цену с API
        const response = await fetch(`/api/premium/calculate?months=${months}`);
        const data = await response.json();
        
        if (data.error) {
            console.error('Ошибка расчёта цены:', data.error);
            return;
        }
        
        selectedPremiumPrice = {
            stars: data.stars,
            discount: data.discount,
            kzt: data.kzt_equivalent,
            rub: data.rub_equivalent
        };
        
        // Обновляем интерфейс
        const durationLabel = document.getElementById('premiumDurationLabel');
        const priceLabel = document.getElementById('premiumPrice');
        const priceRubLabel = document.getElementById('premiumPriceRub');
        const discountLabel = document.getElementById('premiumDiscount');
        
        // Склонение слова "месяц"
        const monthWord = months === 1 ? 'месяц' : (months >= 2 && months <= 4) ? 'месяца' : 'месяцев';
        
        if (durationLabel) {
            durationLabel.textContent = `${months} ${monthWord}`;
        }
        
        if (priceLabel) {
            priceLabel.textContent = `${data.stars} ⭐`;
        }
        
        if (priceRubLabel) {
            priceRubLabel.textContent = ``; // Убрали тенге/рубли, пока только Stars
        }
        
        if (discountLabel) {
            if (data.discount > 0) {
                discountLabel.textContent = `🔥 Скидка ${data.discount}%`;
                discountLabel.style.display = 'block';
            } else {
                discountLabel.textContent = '';
                discountLabel.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('Ошибка обновления цены:', error);
    }
}

// Покупка PRO с выбранным сроком
async function buyPremiumWithDuration() {
    try {
        // Проверяем авторизацию
        if (!isTelegramWebApp) {
            tg.showAlert('💳 Покупка доступна только в Telegram!\n\nОткройте приложение через @anonimka_kz_bot');
            return;
        }
        
        const userId = getCurrentUserId();
        if (!userId || userId.startsWith('web_')) {
            tg.showAlert('Необходима авторизация через Telegram');
            return;
        }
        
        // Закрываем подмодальное окно Stars и основное модальное окно Premium
        closeStarsPurchaseModal();
        closePremiumModal();
        
        // Формируем текст подтверждения
        const monthWord = selectedPremiumMonths === 1 ? 'месяц' : 
                         (selectedPremiumMonths >= 2 && selectedPremiumMonths <= 4) ? 'месяца' : 'месяцев';
        
        let confirmText = `💳 Покупка PRO подписки\n\n` +
                         `⏱️ Срок: ${selectedPremiumMonths} ${monthWord}\n` +
                         `💰 Стоимость: ${selectedPremiumPrice.stars} Stars`;
        
        if (selectedPremiumPrice.discount > 0) {
            confirmText += `\n🔥 Скидка: ${selectedPremiumPrice.discount}%`;
        }
        
        confirmText += '\n\n✨ Что входит:\n' +
                      '• 3 анкеты/день\n' +
                      '• Безлимит фото\n' +
                      '• Закрепление 3×1ч/день\n' +
                      '• Значок PRO\n\n' +
                      'Открыть бота для оплаты?';
        
        // Показываем информацию о покупке
        tg.showConfirm(confirmText, (confirmed) => {
            if (confirmed) {
                // Открываем бота с параметром количества месяцев
                const startParam = `buy_premium_${selectedPremiumMonths}m`;
                console.log('Открываем бота для оплаты с параметром:', startParam);
                
                // Закрываем WebApp и открываем чат с ботом
                try {
                    // Сначала закрываем WebApp
                    tg.close();
                    
                    // Открываем чат с ботом через switchInlineQuery или openTelegramLink
                    const botUrl = `https://t.me/anonimka_kz_bot?start=${startParam}`;
                    if (tg.openTelegramLink) {
                        tg.openTelegramLink(botUrl);
                    } else if (window.Telegram?.WebApp?.openTelegramLink) {
                        window.Telegram.WebApp.openTelegramLink(botUrl);
                    } else {
                        window.open(botUrl, '_blank');
                    }
                } catch (error) {
                    console.error('Ошибка открытия бота:', error);
                    // Если не получилось закрыть, просто открываем ссылку
                    const botUrl = `https://t.me/anonimka_kz_bot?start=${startParam}`;
                    window.location.href = botUrl;
                }
            }
        });
    } catch (error) {
        console.error('Ошибка покупки PRO:', error);
        tg.showAlert('Ошибка при переходе к оплате. Попробуйте позже.');
    }
}

// Старая функция buyPremiumViaTelegram() для обратной совместимости
async function buyPremiumViaTelegram() {
    // Перенаправляем на новую функцию
    await buyPremiumWithDuration();
}

// ============= TELEGRAM: СОЗДАТЬ ЯРЛЫК НА РАБОЧИЙ СТОЛ =============
function promptInstallApp() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isTelegramWebApp = window.Telegram?.WebApp?.platform !== 'unknown';
    
    // 1. Для браузерной версии (Desktop/Mobile) используем PWA
    if (!isTelegramWebApp && deferredPWAPrompt) {
        deferredPWAPrompt.prompt();
        deferredPWAPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('✅ PWA установлено');
            } else {
                console.log('❌ Установка PWA отменена');
            }
            deferredPWAPrompt = null;
        });
        return;
    }
    
    // 2. Для браузера без поддержки PWA - показываем инструкцию
    if (!isTelegramWebApp && !deferredPWAPrompt) {
        if (isIOS) {
            tg.showAlert(
                '📲 Установка на iPhone (Safari):\n\n' +
                '1️⃣ Нажмите кнопку "Поделиться" (квадрат со стрелкой)\n\n' +
                '2️⃣ Прокрутите вниз и выберите "На экран Домой"\n\n' +
                '3️⃣ Нажмите "Добавить"\n\n' +
                '✨ Готово! Иконка появится на рабочем столе'
            );
        } else {
            tg.showAlert(
                '📲 Установка в браузере:\n\n' +
                '1. Откройте меню браузера (⋮ или ⚙️)\n' +
                '2. Выберите "Установить приложение" или "Добавить на главный экран"\n' +
                '3. Подтвердите установку\n\n' +
                '💡 Также можно использовать значок установки в адресной строке'
            );
        }
        return;
    }
    
    // 3. Для Telegram WebApp используем встроенную функцию (только Android)
    if (window.Telegram?.WebApp?.addToHomeScreen && !isIOS) {
        try {
            window.Telegram.WebApp.addToHomeScreen();
            console.log('Telegram добавление на рабочий стол вызвано');
        } catch (error) {
            console.error('Ошибка создания ярлыка:', error);
            tg.showAlert('❌ Не удалось создать ярлык. Попробуйте через меню Telegram (⋮).');
        }
    } else {
        // 4. Для iOS в Telegram - показываем инструкцию
        if (isIOS) {
            tg.showAlert(
                '📲 Установка на iPhone:\n\n' +
                '1️⃣ Нажмите ⋮ (три точки) в ПРАВОМ ВЕРХНЕМ углу\n\n' +
                '2️⃣ Выберите "Создать ярлык" или "Add to Home Screen"\n\n' +
                '3️⃣ Нажмите "Добавить"\n\n' +
                '✨ Готово! Иконка появится на рабочем столе'
            );
        } else {
            // 5. Android в Telegram без поддержки API
            tg.showAlert(
                '📲 Создание ярлыка:\n\n' +
                '1. Откройте меню Telegram (⋮ в правом верхнем углу)\n' +
                '2. Выберите "Создать ярлык"\n' +
                '3. Подтвердите добавление на рабочий стол'
            );
        }
    }
}

// ============= АВТОРИЗАЦИЯ ЧЕРЕЗ КОД ДЛЯ ANDROID =============
function showTelegramLinkNotification() {
    // Проверяем если это Android WebView
    const isAndroidWebView = navigator.userAgent.includes('wv') || 
                            (navigator.userAgent.includes('Android') && window.AndroidInterface);
    
    if (!isAndroidWebView) return;
    
    // Проверяем есть ли уже авторизация
    const hasTelegramId = localStorage.getItem('telegram_user');
    if (hasTelegramId) return;
    
    // Показываем модальное окно с инструкцией
    console.log('📱 Показываем модальное окно авторизации для Android');
    showAndroidAuthModal();
}

// Функция удалена - приветственный экран больше не используется

function showAndroidAuthModal() {
    // Проверяем не показывали ли уже
    if (document.getElementById('androidAuthModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'androidAuthModal';
    modal.innerHTML = `
        <style>
            #androidAuthModal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .android-auth-content {
                background: #1a1a2e;
                border-radius: 24px;
                padding: 32px 24px;
                max-width: 400px;
                width: 90%;
                color: white;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                animation: slideUp 0.3s ease-out;
            }
            
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .android-auth-icon {
                font-size: 64px;
                text-align: center;
                margin-bottom: 16px;
            }
            
            .android-auth-title {
                font-size: 24px;
                font-weight: 700;
                text-align: center;
                margin-bottom: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            .android-auth-description {
                text-align: center;
                color: #a0aec0;
                font-size: 15px;
                line-height: 1.6;
                margin-bottom: 24px;
            }
            
            .android-auth-steps {
                background: rgba(255,255,255,0.05);
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 24px;
            }
            
            .android-auth-step {
                display: flex;
                align-items: start;
                gap: 12px;
                margin-bottom: 16px;
            }
            
            .android-auth-step:last-child {
                margin-bottom: 0;
            }
            
            .android-auth-step-number {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                flex-shrink: 0;
            }
            
            .android-auth-step-text {
                flex: 1;
                padding-top: 4px;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .android-auth-code-input {
                width: 100%;
                background: rgba(255,255,255,0.1);
                border: 2px solid rgba(255,255,255,0.2);
                border-radius: 12px;
                padding: 16px;
                color: white;
                font-size: 24px;
                text-align: center;
                letter-spacing: 8px;
                font-weight: 700;
                margin-bottom: 16px;
                transition: all 0.3s;
            }
            
            .android-auth-code-input:focus {
                outline: none;
                border-color: #667eea;
                background: rgba(102, 126, 234, 0.1);
            }
            
            .android-auth-buttons {
                display: flex;
                gap: 12px;
            }
            
            .android-auth-button {
                flex: 1;
                padding: 16px;
                border-radius: 12px;
                border: none;
                font-weight: 600;
                font-size: 15px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .android-auth-button-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .android-auth-button-primary:active {
                transform: scale(0.98);
            }
            
            .android-auth-button-secondary {
                background: rgba(255,255,255,0.1);
                color: white;
            }
            
            .android-auth-error {
                background: rgba(255,59,48,0.2);
                border: 1px solid rgba(255,59,48,0.4);
                border-radius: 12px;
                padding: 12px;
                margin-bottom: 16px;
                color: #ff3b30;
                font-size: 14px;
                text-align: center;
                display: none;
            }
        </style>
        
        <div class="android-auth-content">
            <div class="android-auth-icon">🔐</div>
            <div class="android-auth-title">Авторизация через Telegram</div>
            <div class="android-auth-description">
                Anonimka работает на базе Telegram. Вы можете использовать приложение через бота или это приложение, 
                но для авторизации нужен Telegram аккаунт.
            </div>
            
            <div class="android-auth-steps">
                <div class="android-auth-step">
                    <div class="android-auth-step-number">1</div>
                    <div class="android-auth-step-text">Нажмите кнопку "Открыть бота" ниже</div>
                </div>
                <div class="android-auth-step">
                    <div class="android-auth-step-number">2</div>
                    <div class="android-auth-step-text">В Telegram боте нажмите /start</div>
                </div>
                <div class="android-auth-step">
                    <div class="android-auth-step-number">3</div>
                    <div class="android-auth-step-text">Бот пришлет вам 4-значный код</div>
                </div>
                <div class="android-auth-step">
                    <div class="android-auth-step-number">4</div>
                    <div class="android-auth-step-text">Введите код в поле ниже</div>
                </div>
            </div>
            
            <div class="android-auth-error" id="androidAuthError"></div>
            
            <input 
                type="text" 
                class="android-auth-code-input" 
                id="androidAuthCodeInput"
                placeholder="0000"
                maxlength="4"
                inputmode="numeric"
                pattern="[0-9]*"
            />
            
            <div class="android-auth-buttons">
                <button class="android-auth-button android-auth-button-secondary" onclick="closeAndroidAuthModal()">
                    Позже
                </button>
                <button class="android-auth-button android-auth-button-primary" onclick="openTelegramBot()">
                    Открыть бота
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчик ввода кода
    const input = document.getElementById('androidAuthCodeInput');
    input.addEventListener('input', function(e) {
        // Только цифры
        this.value = this.value.replace(/[^0-9]/g, '');
        
        // Автоматическая проверка при вводе 4 цифр
        if (this.value.length === 4) {
            verifyAndroidAuthCode(this.value);
        }
    });
}

function closeAndroidAuthModal() {
    const modal = document.getElementById('androidAuthModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s';
        setTimeout(() => modal.remove(), 300);
    }
}

function openTelegramBot() {
    const button = document.querySelector('.android-auth-button-primary');
    const originalText = button ? button.textContent : '';
    
    try {
        // Блокируем кнопку и показываем состояние загрузки
        if (button) {
            button.disabled = true;
            button.textContent = 'Открываем Telegram...';
            button.style.opacity = '0.6';
        }
        
        // Проверяем подключение к интернету
        if (!navigator.onLine) {
            throw new Error('Нет подключения к интернету');
        }
        
        // Открываем бота с параметром для генерации кода авторизации
        const telegramWindow = window.open('https://t.me/anonimka_kz_bot?start=app_auth', '_blank');
        
        if (!telegramWindow || telegramWindow.closed || typeof telegramWindow.closed === 'undefined') {
            throw new Error('Не удалось открыть Telegram. Проверьте, что у вас установлено приложение Telegram.');
        }
        
        // Автоматически закрываем окно через 2 секунды (достаточно для открытия Telegram)
        setTimeout(() => {
            if (telegramWindow && !telegramWindow.closed) {
                try {
                    telegramWindow.close();
                } catch (e) {
                    // Игнорируем ошибки при закрытии
                }
            }
        }, 2000);
        
        // Разблокируем кнопку через 3 секунды (после закрытия окна)
        setTimeout(() => {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
                button.style.opacity = '1';
            }
        }, 3000);
        
        // Фокусируем на поле ввода кода
        setTimeout(() => {
            const input = document.getElementById('androidAuthCodeInput');
            if (input) {
                input.focus();
            }
        }, 2500);
        
    } catch (error) {
        console.error('❌ Ошибка открытия Telegram:', error);
        
        // Показываем ошибку пользователю
        const errorDiv = document.getElementById('androidAuthError');
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.style.background = 'rgba(255, 59, 48, 0.2)';
            errorDiv.style.borderColor = 'rgba(255, 59, 48, 0.4)';
            errorDiv.style.color = '#ff3b30';
            errorDiv.textContent = error.message;
            
            // Скрываем ошибку через 5 секунд
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
        
        // Разблокируем кнопку немедленно при ошибке
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
            button.style.opacity = '1';
        }
    }
}

async function verifyAndroidAuthCode(code) {
    console.log('🔐 Проверка кода авторизации:', code);
    
    const errorDiv = document.getElementById('androidAuthError');
    const input = document.getElementById('androidAuthCodeInput');
    
    try {
        const response = await fetch('/api/verify-auth-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Сохраняем данные пользователя
            const userData = result.user;
            localStorage.setItem('telegram_user', JSON.stringify(userData));
            localStorage.setItem('telegram_auth_time', Date.now().toString());
            localStorage.setItem('user_id', userData.id.toString());
            
            // Удаляем временный Android ID
            localStorage.removeItem('android_device_id');
            
            // Показываем успех
            errorDiv.style.display = 'block';
            errorDiv.style.background = 'rgba(52, 199, 89, 0.2)';
            errorDiv.style.borderColor = 'rgba(52, 199, 89, 0.4)';
            errorDiv.style.color = '#34c759';
            errorDiv.textContent = '✅ Успешно! Перезагружаем...';
            
            // Закрываем модалку и перезагружаем
            setTimeout(() => {
                closeAndroidAuthModal();
                location.reload();
            }, 1500);
        } else {
            // Показываем ошибку
            errorDiv.style.display = 'block';
            errorDiv.textContent = result.error || '❌ Неверный код';
            input.value = '';
            input.focus();
        }
    } catch (error) {
        console.error('Ошибка проверки кода:', error);
        errorDiv.style.display = 'block';
        errorDiv.textContent = '❌ Ошибка сети. Попробуйте еще раз';
        input.value = '';
        input.focus();
    }
}

// ============= АДМИН-ПАНЕЛЬ =============
function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(btn => {
        const isActive = btn.getAttribute('data-tab') === tab;
        btn.classList.toggle('active', isActive);
    });
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.toggle('active', section.id.toLowerCase().includes(tab));
    });

    // Загружаем данные под выбранную вкладку
    if (tab === 'overview') {
        loadAdminOverview();
    } else if (tab === 'ads') {
        loadAdminAds();
    } else if (tab === 'chats') {
        loadAdminChats();
    } else if (tab === 'users') {
        loadAdminUsers();
    }
}

async function fetchAdminData(action, params = {}) {
    const adminToken = localStorage.getItem('user_token');
    if (!adminToken) {
        throw new Error('Не найден user_token для запроса администратора');
    }

    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params, adminToken })
    });

    const data = await response.json();
    if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Ошибка админ-запроса');
    }
    return data;
}

function showAdminPanel() {
    if (!isAdminUser) {
        tg.showAlert ? tg.showAlert('Требуются права администратора') : alert('Требуются права администратора');
        return;
    }

    closeHamburgerMenu();
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'block';
    }
    showScreen('adminPanel');
    switchAdminTab('overview');
}

function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('ru-RU', { hour12: false });
}

async function loadAdminOverview() {
    const grid = document.getElementById('adminOverviewGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const res = await fetchAdminData('get-overview');
        const stats = res.data || {};
        const cards = [
            { label: 'Пользователи', value: stats.users },
            { label: 'Анкеты', value: stats.ads },
            { label: 'Приватные чаты', value: stats.chats },
            { label: 'В бане', value: stats.bannedUsers },
            { label: 'Заблокированные анкеты', value: stats.blockedAds }
        ];
        grid.innerHTML = cards.map(card => `
            <div class="admin-card">
                <div class="label">${card.label}</div>
                <div class="value">${card.value ?? 0}</div>
            </div>
        `).join('');
    } catch (err) {
        console.error('[ADMIN] Ошибка загрузки обзора:', err);
        grid.innerHTML = `<div class="admin-empty">Ошибка: ${err.message}</div>`;
    }
}

async function loadAdminAds() {
    const list = document.getElementById('adminAdsList');
    if (!list) return;
    list.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const res = await fetchAdminData('get-ads');
        const ads = res.data || [];
        if (ads.length === 0) {
            list.innerHTML = '<div class="admin-empty">Анкет нет</div>';
            return;
        }
        list.innerHTML = ads.map(ad => {
            const status = ad.is_blocked ? `<span class="admin-pill warn">Блок до ${formatDateTime(ad.blocked_until) || '—'}</span>` : '<span class="admin-pill ok">Активно</span>';
            const reason = ad.blocked_reason ? `<div class="admin-hint">Причина: ${ad.blocked_reason}</div>` : '';
            return `
                <div class="admin-row">
                    <div class="meta">
                        <strong>#${ad.id} • ${ad.city || 'Город?'} ${ad.country ? '(' + ad.country + ')' : ''}</strong>
                        <span>Ник: ${ad.display_nickname || '—'}</span>
                        <span>Токен: ${ad.user_token ? ad.user_token.substring(0, 12) + '…' : '—'}</span>
                        <span>Создано: ${formatDateTime(ad.created_at)}</span>
                        ${status}
                        ${reason}
                    </div>
                    <div class="actions">
                        ${ad.is_blocked ? 
                            `<button class="neon-button" onclick="unblockAdFromAdmin(${ad.id})">Разблокировать</button>` :
                            `<button class="neon-button primary" onclick="blockAdFromAdmin(${ad.id})">Заблокировать</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('[ADMIN] Ошибка загрузки анкет:', err);
        list.innerHTML = `<div class="admin-empty">Ошибка: ${err.message}</div>`;
    }
}

async function loadAdminChats() {
    const list = document.getElementById('adminChatsList');
    if (!list) return;
    list.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const res = await fetchAdminData('get-chats');
        const chats = res.data || [];
        if (chats.length === 0) {
            list.innerHTML = '<div class="admin-empty">Чатов нет</div>';
            return;
        }
        list.innerHTML = chats.map(chat => {
            const blockPill = chat.blocked_by_token ? `<span class="admin-pill warn">Заблокирован</span>` : '';
            return `
                <div class="admin-row">
                    <div class="meta">
                        <strong>Чат #${chat.id} • Ad ${chat.ad_id || '—'}</strong>
                        <span>U1: ${chat.user_token_1 ? chat.user_token_1.substring(0, 12) + '…' : '—'} (${chat.user1_nickname || '—'})</span>
                        <span>U2: ${chat.user_token_2 ? chat.user_token_2.substring(0, 12) + '…' : '—'} (${chat.user2_nickname || '—'})</span>
                        <span>Создан: ${formatDateTime(chat.created_at)}</span>
                        <span>Последнее: ${formatDateTime(chat.last_message_at)}</span>
                        ${blockPill}
                        <span class="admin-hint">${chat.last_message ? 'Последнее сообщение: ' + chat.last_message : 'Сообщений нет'}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('[ADMIN] Ошибка загрузки чатов:', err);
        list.innerHTML = `<div class="admin-empty">Ошибка: ${err.message}</div>`;
    }
}

async function loadAdminUsers() {
    const list = document.getElementById('adminUsersList');
    const searchInput = document.getElementById('adminUserSearch');
    if (!list) return;
    list.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const search = searchInput ? searchInput.value.trim() : '';
        const res = await fetchAdminData('get-users', { search });
        const users = res.data || [];
        if (users.length === 0) {
            list.innerHTML = '<div class="admin-empty">Пользователи не найдены</div>';
            return;
        }
        list.innerHTML = users.map(user => {
            const status = user.is_banned ? `<span class="admin-pill warn">Бан ${user.banned_until ? formatDateTime(user.banned_until) : 'бессрочно'}</span>` : '<span class="admin-pill ok">Активен</span>';
            return `
                <div class="admin-row">
                    <div class="meta">
                        <strong>${user.display_nickname || 'Без никнейма'}</strong>
                        <span>TG: ${user.id || '—'} | Token: ${user.user_token ? user.user_token.substring(0, 12) + '…' : '—'}</span>
                        <span>Email: ${user.email || '—'}</span>
                        <span>Создан: ${formatDateTime(user.created_at)}</span>
                        ${status}
                        ${user.ban_reason ? `<span class="admin-hint">${user.ban_reason}</span>` : ''}
                    </div>
                    <div class="actions">
                        ${user.is_banned ?
                            `<button class="neon-button" onclick="unbanUserFromAdmin('${user.user_token}')">Снять бан</button>` :
                            `<button class="neon-button primary" onclick="banUserFromAdmin('${user.user_token}')">Забанить</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('[ADMIN] Ошибка загрузки пользователей:', err);
        list.innerHTML = `<div class="admin-empty">Ошибка: ${err.message}</div>`;
    }
}

async function banUserFromAdmin(userToken) {
    const reason = prompt('Причина блокировки?', 'Нарушение правил');
    if (reason === null) return;
    const hoursInput = prompt('Длительность бана в часах (пусто = бессрочно)');
    const durationHours = hoursInput && hoursInput.trim() !== '' ? Number(hoursInput) : null;
    try {
        await fetchAdminData('ban-user', { userToken, reason, durationHours });
        loadAdminUsers();
    } catch (err) {
        tg.showAlert ? tg.showAlert(err.message) : alert(err.message);
    }
}

async function unbanUserFromAdmin(userToken) {
    if (!confirm('Снять бан с пользователя?')) return;
    try {
        await fetchAdminData('unban-user', { userToken });
        loadAdminUsers();
    } catch (err) {
        tg.showAlert ? tg.showAlert(err.message) : alert(err.message);
    }
}

async function blockAdFromAdmin(adId) {
    const reason = prompt('Причина блокировки анкеты?', 'Модерация');
    if (reason === null) return;
    const hoursInput = prompt('Длительность блокировки (часов, пусто = бессрочно)');
    const durationHours = hoursInput && hoursInput.trim() !== '' ? Number(hoursInput) : null;
    try {
        await fetchAdminData('block-ad', { adId, reason, durationHours });
        loadAdminAds();
    } catch (err) {
        tg.showAlert ? tg.showAlert(err.message) : alert(err.message);
    }
}

async function unblockAdFromAdmin(adId) {
    if (!confirm('Разблокировать анкету?')) return;
    try {
        await fetchAdminData('unblock-ad', { adId });
        loadAdminAds();
    } catch (err) {
        tg.showAlert ? tg.showAlert(err.message) : alert(err.message);
    }
}

async function sendAdminNotification() {
    const tokenInput = document.getElementById('adminNotifyToken');
    const titleInput = document.getElementById('adminNotifyTitle');
    const msgInput = document.getElementById('adminNotifyMessage');
    const statusEl = document.getElementById('adminNotifyStatus');
    if (!tokenInput || !titleInput || !msgInput || !statusEl) return;
    statusEl.textContent = 'Отправляем...';
    try {
        const res = await fetchAdminData('notify-user', {
            userToken: tokenInput.value.trim(),
            title: titleInput.value.trim() || 'Уведомление',
            message: msgInput.value.trim()
        });
        statusEl.textContent = `Готово. Telegram: ${res.data?.telegramSent ? 'да' : 'нет'}, Push: ${res.data?.pushSent ? 'да' : 'нет'}`;
    } catch (err) {
        statusEl.textContent = `Ошибка: ${err.message}`;
    }
}

// ============= ПАРТНЕРСКАЯ ПРОГРАММА =============
function showAffiliateInfo() {
    // Скрываем все экраны
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    
    // Показываем экран партнерской программы
    const affiliateScreen = document.getElementById('affiliateInfo');
    if (affiliateScreen) {
        affiliateScreen.classList.add('active');
    }
    
    // Закрываем гамбургер меню
    const hamburgerOverlay = document.getElementById('hamburgerMenuOverlay');
    if (hamburgerOverlay) {
        hamburgerOverlay.classList.remove('active');
    }
}

function openAffiliateProgram() {
    // Открываем профиль бота где есть кнопка "Партнёрская программа"
    const botUsername = 'anonimka_kz_bot';
    const botProfileUrl = `https://t.me/${botUsername}`;
    
    // Используем Telegram WebApp API если доступен
    if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(botProfileUrl);
    } else {
        window.open(botProfileUrl, '_blank');
    }
}

// ============================================
// Android Specific Functions
// ============================================

/**
 * Проверяет является ли это Android приложение
 */
function isAndroidApp() {
    return typeof AndroidAuth !== 'undefined' && AndroidAuth.isAndroid && AndroidAuth.isAndroid();
}

/**
 * Инициализирует Android-специфичные элементы меню
 */
function initializeAndroidMenu() {
    if (!isAndroidApp()) {
        console.log('Not Android app, hiding Android-specific menu items');
        // Скрываем Android элементы и показываем обычные
        document.querySelectorAll('.android-only').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.non-android-only').forEach(el => el.style.display = 'flex');
        return;
    }
    
    console.log('✅ Android app detected, showing Android menu items');
    
    // Показываем Android элементы и скрываем обычные
    document.querySelectorAll('.android-only').forEach(el => el.style.display = 'flex');
    document.querySelectorAll('.non-android-only').forEach(el => el.style.display = 'none');
}






// Инициализируем Android меню при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeAndroidMenu();
});

// Также инициализируем при открытии меню
const originalShowMenu = window.showHamburgerMenu;
window.showHamburgerMenu = function() {
    if (originalShowMenu) {
        originalShowMenu();
    }
    // Обновляем Android меню при каждом открытии
    if (isAndroidApp()) {
        initializeAndroidMenu();
    }
};
