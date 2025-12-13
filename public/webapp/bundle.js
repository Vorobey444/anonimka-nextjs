/**
 * ANONIMKA BUNDLE
 * Автоматически сгенерирован: 2025-12-13T17:17:39.733Z
 * Модулей: 18
 */
console.log('📦 [BUNDLE] Загрузка объединённого бандла...');


// ========== telegram-init.js (10.5 KB) ==========
(function() {
try {
/**
 * Модуль инициализации Telegram WebApp
 * Управляет интеграцией с Telegram и настройками приложения
 */

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

// Проверка, запущено ли приложение в Telegram
const isTelegramWebApp = !!(
    window.Telegram?.WebApp && 
    typeof window.Telegram.WebApp === 'object' &&
    typeof window.Telegram.WebApp.ready === 'function'
);

// Экспортируем tg и isTelegramWebApp глобально
window.tg = tg;
window.isTelegramWebApp = isTelegramWebApp;

// Проверка поддержки emoji флагов
function checkEmojiFlagSupport() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 20;
    canvas.height = 20;
    ctx.fillText('🇷🇺', 0, 15);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
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

/**
 * Инициализация Telegram WebApp
 */
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

/**
 * Helper: безопасная проверка поддержки CloudStorage с учетом версии WebApp
 */
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

/**
 * Логирование данных об открытии страницы
 */
function trackPageVisit(page = 'home') {
    // Реализация в отдельном модуле аналитики
    console.log('📊 Page visit tracked:', page);
}

/**
 * Запуск автоматического обновления статистики
 */
function startStatsAutoUpdate() {
    // Функция будет переопределена в menu.js
    // Здесь делаем отложенный вызов чтобы дождаться загрузки menu.js и инициализации
    setTimeout(() => {
        if (typeof window.loadSiteStats === 'function') {
            window.loadSiteStats();
            console.log('📊 Stats auto-update started (deferred)');
        } else {
            console.warn('📊 loadSiteStats not available yet');
        }
    }, 500);
}

/**
 * Настройка автоскрытия скроллбаров
 */
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

// Экспорт функций для onclick
window.initializeTelegramWebApp = initializeTelegramWebApp;
window.supportsCloudStorage = supportsCloudStorage;
window.trackPageVisit = trackPageVisit;
window.startStatsAutoUpdate = startStatsAutoUpdate;
window.setupAutoHideScrollbars = setupAutoHideScrollbars;

console.log('🔍 Проверка Telegram WebApp:');
console.log('  - window.Telegram:', !!window.Telegram);
console.log('  - window.Telegram.WebApp:', !!window.Telegram?.WebApp);
console.log('  - platform:', window.Telegram?.WebApp?.platform);
console.log('  - initData:', window.Telegram?.WebApp?.initData);
console.log('  - initDataUnsafe:', window.Telegram?.WebApp?.initDataUnsafe);
console.log('  - isTelegramWebApp:', isTelegramWebApp);

} catch(e) { console.error('❌ Ошибка в модуле telegram-init.js:', e); }
})();

// ========== error-logging.js (7.4 KB) ==========
(function() {
try {
/**
 * Модуль логирования и обработки ошибок
 * Перехватывает, логирует и отправляет ошибки на сервер
 */

const errorLogCache = new Map();
const ERROR_CACHE_TTL = 30000; // 30 секунд
const ENABLE_ERROR_DEBUG = false;

const userActionHistory = [];
const MAX_ACTION_HISTORY = 10;

/**
 * Логирование действий пользователя
 */
window.logUserAction = function(action, details = {}) {
    const timestamp = new Date().toISOString();
    userActionHistory.push({ action, details, timestamp });
    if (userActionHistory.length > MAX_ACTION_HISTORY) {
        userActionHistory.shift();
    }
};

/**
 * Отправка ошибки на сервер
 */
async function logErrorToServer(error, type = 'error') {
    try {
        const errorMessage = error.message || String(error);
        const errorStack = error.stack || '';
        const stackFirstLine = errorStack.split('\n')[1]?.trim() || '';
        const errorKey = `${type}:${errorMessage}:${stackFirstLine}`;
        
        if (ENABLE_ERROR_DEBUG) {
            console.log('[ERROR LOG] Обработка ошибки:', errorMessage);
            console.log('[ERROR LOG] Ключ кеша:', errorKey);
        }
        
        const now = Date.now();
        const cachedTime = errorLogCache.get(errorKey);
        
        if (cachedTime && (now - cachedTime) < ERROR_CACHE_TTL) {
            if (ENABLE_ERROR_DEBUG) {
                const remainingTime = Math.ceil((ERROR_CACHE_TTL - (now - cachedTime)) / 1000);
                console.log(`[ERROR LOG] Ошибка в кеше, осталось ${remainingTime} сек до повторной отправки`);
            }
            return;
        }
        
        errorLogCache.set(errorKey, now);
        
        if (errorLogCache.size > 50) {
            const keysToDelete = [];
            for (const [key, time] of errorLogCache.entries()) {
                if (now - time > ERROR_CACHE_TTL) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => errorLogCache.delete(key));
        }
        
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
            appState: {
                isAuthorized: !!localStorage.getItem('user_token') || !!localStorage.getItem('telegram_user'),
                hasNickname: !!localStorage.getItem('user_nickname'),
                currentPage: window.location.pathname,
                screenSize: `${window.innerWidth}x${window.innerHeight}`,
                online: navigator.onLine
            },
            recentActions: userActionHistory.slice(-5)
        };
        
        if (ENABLE_ERROR_DEBUG) {
            console.log('[ERROR LOG] Отправка на сервер...');
        }
        
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

/**
 * Функция для ручного логирования ошибок
 */
window.logError = function(message, error) {
    console.error(message, error);
    logErrorToServer(error || { message, stack: '' }, 'manual');
};

/**
 * Утилита: безопасное выполнение async функций с автологированием
 */
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
        throw error;
    }
};

/**
 * Утилиты для управления системой логирования
 */
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

} catch(e) { console.error('❌ Ошибка в модуле error-logging.js:', e); }
})();

// ========== ui-dialogs.js (8.0 KB) ==========
(function() {
try {
/**
 * Модуль UI диалогов и модальных окон
 * Управляет всеми диалогами и alerts в приложении
 */

// Сохраняем оригинальные методы ПЕРЕД использованием
const originalAlert = window.alert;
const originalConfirm = window.confirm;
const originalPrompt = window.prompt;
const originalShowAlert = tg.showAlert ? tg.showAlert.bind(tg) : null;
const originalShowPopup = tg.showPopup ? tg.showPopup.bind(tg) : null;

/**
 * Функция для показа кастомного alert
 */
function showCustomAlert(message, callback) {
    const modal = document.getElementById('customAlertModal');
    const messageEl = document.getElementById('customAlertMessage');
    const btn = document.getElementById('customAlertBtn');
    
    if (modal && messageEl && btn) {
        messageEl.textContent = message;
        modal.style.display = 'flex';
        
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.onclick = function() {
            modal.style.display = 'none';
            if (callback) setTimeout(callback, 0);
        };
    } else {
        originalAlert.call(window, message);
        if (callback) setTimeout(callback, 0);
    }
}

/**
 * Безопасная обертка для showPopup
 */
tg.showPopup = function(params, callback) {
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
    
    const message = params.message || params.title || 'Уведомление';
    showCustomAlert(message, callback);
};

/**
 * Переопределяем tg.showAlert
 */
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
    
    showCustomAlert(message, callback);
};

/**
 * Функция для показа кастомного confirm
 */
function showCustomConfirm(message, callback) {
    const modal = document.getElementById('customConfirmModal');
    const messageEl = document.getElementById('customConfirmMessage');
    const yesBtn = document.getElementById('customConfirmYes');
    const noBtn = document.getElementById('customConfirmNo');
    
    if (modal && messageEl && yesBtn && noBtn) {
        messageEl.textContent = message;
        modal.style.display = 'flex';
        
        modal.setAttribute('data-confirm-callback', 'pending');
        modal._confirmCallback = callback;
        
        const newYesBtn = yesBtn.cloneNode(true);
        const newNoBtn = noBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
        noBtn.parentNode.replaceChild(newNoBtn, noBtn);
        
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

/**
 * Функция для показа кастомного prompt
 */
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
        
        const newOkBtn = okBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newOkBtn.onclick = function() {
            const value = input.value;
            modal.style.display = 'none';
            if (callback) setTimeout(() => callback(value), 0);
        };
        
        newCancelBtn.onclick = function() {
            modal.style.display = 'none';
            if (callback) setTimeout(() => callback(null), 0);
        };
        
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

/**
 * Переопределяем tg.showConfirm
 */
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
    
    showCustomConfirm(message, callback);
};

/**
 * Переопределяем глобальные alert, confirm, prompt
 */
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
        
        return originalPrompt.call(window, message, defaultValue);
    };
}

// Экспорт функций для onclick
window.showCustomAlert = showCustomAlert;
window.showCustomConfirm = showCustomConfirm;
window.showCustomPrompt = showCustomPrompt;

console.log('✅ Модуль UI диалогов инициализирован');

} catch(e) { console.error('❌ Ошибка в модуле ui-dialogs.js:', e); }
})();

// ========== utils.js (37.4 KB) ==========
(function() {
try {
/**
 * Модуль утилит и вспомогательных функций
 */

// ============ КРИТИЧЕСКИЕ ОБЁРТКИ ДЛЯ tg.showAlert / tg.showConfirm ============
// Сохраняем оригинальные методы ПЕРЕД переопределением
const originalAlert = window.alert;
const originalConfirm = window.confirm;
const originalPrompt = window.prompt;

// Проверяем наличие tg и сохраняем оригинальные методы
const tgExists = typeof window !== 'undefined' && window.Telegram?.WebApp;
const originalShowAlert = tgExists && window.Telegram.WebApp.showAlert ? 
    window.Telegram.WebApp.showAlert.bind(window.Telegram.WebApp) : null;
const originalShowPopup = tgExists && window.Telegram.WebApp.showPopup ? 
    window.Telegram.WebApp.showPopup.bind(window.Telegram.WebApp) : null;
const originalShowConfirm = tgExists && window.Telegram.WebApp.showConfirm ? 
    window.Telegram.WebApp.showConfirm.bind(window.Telegram.WebApp) : null;

/**
 * Проверка - запущено ли приложение в реальном Telegram
 */
function isRealTelegramEnv() {
    return !!(
        window.Telegram?.WebApp?.platform && 
        window.Telegram.WebApp.platform !== 'unknown' &&
        window.Telegram.WebApp.initData
    );
}

/**
 * Показать кастомный alert (модальное окно)
 */
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

/**
 * Показать кастомный confirm (модальное окно)
 */
function showCustomConfirm(message, callback) {
    const modal = document.getElementById('customConfirmModal');
    const messageEl = document.getElementById('customConfirmMessage');
    const yesBtn = document.getElementById('customConfirmYes');
    const noBtn = document.getElementById('customConfirmNo');
    
    if (modal && messageEl && yesBtn && noBtn) {
        messageEl.textContent = message;
        modal.style.display = 'flex';
        
        // Сохраняем callback
        modal._confirmCallback = callback;
        
        // Удаляем предыдущие обработчики
        const newYesBtn = yesBtn.cloneNode(true);
        const newNoBtn = noBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
        noBtn.parentNode.replaceChild(newNoBtn, noBtn);
        
        // Добавляем новые обработчики
        newYesBtn.onclick = function() {
            modal.style.display = 'none';
            if (callback) setTimeout(() => callback(true), 0);
        };
        
        newNoBtn.onclick = function() {
            modal.style.display = 'none';
            if (callback) setTimeout(() => callback(false), 0);
        };
    } else {
        const result = confirm(message);
        if (callback) setTimeout(() => callback(result), 0);
    }
}

/**
 * Показать кастомный prompt (модальное окно)
 */
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

// ============ ПЕРЕОПРЕДЕЛЕНИЕ tg МЕТОДОВ ============
// Расширяем объект tg если он существует, или создаём заглушку
if (typeof window !== 'undefined') {
    // Если tg не существует (не Telegram), создаём заглушку
    if (typeof window.tg === 'undefined' && typeof tg === 'undefined') {
        window.tg = window.Telegram?.WebApp || {
            expand: () => {},
            setHeaderColor: () => {},
            setBackgroundColor: () => {},
            MainButton: { setText: () => {}, onClick: () => {}, show: () => {}, hide: () => {} },
            BackButton: { onClick: () => {}, show: () => {}, hide: () => {} },
            initDataUnsafe: { user: null },
            ready: () => {},
            close: () => {},
            showAlert: showCustomAlert,
            showConfirm: showCustomConfirm,
            showPopup: function(params, callback) {
                const message = params.message || params.title || 'Уведомление';
                showCustomAlert(message, callback);
            }
        };
    }
    
    // Используем window.tg для переопределения методов
    const tgRef = window.tg || tg;
    
    // Переопределяем tg.showAlert
    if (tgRef) {
        tgRef.showAlert = function(message, callback) {
            if (isRealTelegramEnv() && originalShowAlert) {
                try {
                    originalShowAlert(message, callback);
                    return;
                } catch (e) {
                    console.warn('showAlert failed:', e.message);
                }
            }
            showCustomAlert(message, callback);
        };
        
        // Переопределяем tg.showConfirm
        tgRef.showConfirm = function(message, callback) {
            if (isRealTelegramEnv() && originalShowConfirm) {
                try {
                    originalShowConfirm(message, callback);
                    return;
                } catch (e) {
                    console.warn('showConfirm failed:', e.message);
                }
            }
            showCustomConfirm(message, callback);
        };
        
        // Переопределяем tg.showPopup
        tgRef.showPopup = function(params, callback) {
            const version = parseFloat(tgRef.version || '6.0');
            if (isRealTelegramEnv() && version >= 6.2 && originalShowPopup) {
                try {
                    originalShowPopup(params, callback);
                    return;
                } catch (e) {
                    console.warn('showPopup failed:', e.message);
                }
            }
            const message = params.message || params.title || 'Уведомление';
            showCustomAlert(message, callback);
        };
        
        // Убеждаемся что window.tg указывает на наш объект
        window.tg = tgRef;
    }
}

console.log('🛠️ [UTILS] Обёртки tg.showAlert/showConfirm инициализированы');

// ============ БАЗОВЫЕ УТИЛИТЫ ============

/**
 * Функция для хеширования чувствительных данных в логах
 */
function hashSensitiveData(data) {
    if (!data) return '***';
    const str = String(data);
    if (str.length <= 6) return '***';
    return str.substring(0, 3) + '***' + str.substring(str.length - 3);
}

/**
 * Безопасный console.log для разработки
 */
const ENABLE_DEBUG_LOGS = false; // Установи false в продакшене!

function safeLog(...args) {
    if (!ENABLE_DEBUG_LOGS) return;
    
    const safeArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
            const safeCopy = { ...arg };
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

/**
 * Получить текущий ID пользователя
 */
function getCurrentUserId() {
    // Проверяем Telegram WebApp
    const isTgWebApp = typeof window !== 'undefined' && 
                       window.Telegram?.WebApp?.platform !== 'unknown' && 
                       !!window.Telegram?.WebApp?.initData;
    
    if (isTgWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        return String(window.Telegram.WebApp.initDataUnsafe.user.id);
    }
    
    // Проверяем user_token (для email авторизации и Android)
    const userToken = localStorage.getItem('user_token');
    if (userToken && userToken !== 'null' && userToken !== 'undefined') {
        return userToken;
    }
    
    // Проверяем сохранённого Telegram пользователя
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
    
    // Проверяем user_id
    const userId = localStorage.getItem('user_id');
    if (userId && userId !== 'null' && userId !== 'undefined') {
        return userId;
    }
    
    return null;
}

/**
 * Получить nickname текущего пользователя
 */
function getUserNickname() {
    const savedNickname1 = localStorage.getItem('userNickname');
    const savedNickname2 = localStorage.getItem('user_nickname');
    const savedNickname = savedNickname1 || savedNickname2;
    if (savedNickname && savedNickname !== 'null' && savedNickname !== 'undefined') {
        return savedNickname;
    }
    return 'Аноним';
}

/**
 * Получить локацию пользователя
 */
function getUserLocation() {
    const locationStr = localStorage.getItem('userLocation');
    console.log('📍 localStorage.userLocation:', locationStr);
    if (locationStr === 'null' || locationStr === 'undefined') {
        console.warn('⚠️ userLocation содержит строку null/undefined, очищаем');
        localStorage.removeItem('userLocation');
        return null;
    }
    if (locationStr) {
        try {
            const parsed = JSON.parse(locationStr);
            console.log('📍 Parsed location:', parsed);
            if (!parsed || typeof parsed !== 'object') return null;
            const normalized = {
                country: parsed.country || null,
                region: parsed.region || null,
                city: parsed.city || null,
                timestamp: parsed.timestamp || Date.now()
            };
            return normalized;
        } catch (e) {
            console.error('Ошибка парсинга userLocation:', e);
            localStorage.removeItem('userLocation');
            return null;
        }
    }
    console.log('⚠️ userLocation не найден в localStorage');
    return null;
}

/**
 * Форматирование чисел (1234 -> 1.2K)
 */
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

/**
 * Форматирование времени для списка чатов
 */
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

/**
 * Форматирование времени для сообщений
 */
function formatMessageTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Экранирование HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Форматирование даты создания
 */
function formatCreatedAt(createdAt) {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} д назад`;
    
    return date.toLocaleDateString('ru-RU');
}

/**
 * Форматирование пола
 */
function formatGender(gender) {
    const genderMap = {
        'male': 'Мужчина',
        'мужчина': 'Мужчина',
        'female': 'Женщина',
        'девушка': 'Женщина',
        'женщина': 'Женщина',
        'пара': 'Пара'
    };
    
    const genderLower = (gender || '').toLowerCase();
    return genderMap[genderLower] || 'Не указан';
}

/**
 * Форматирование цели поиска
 */
function formatTarget(target) {
    const targetMap = {
        'male': 'Мужчину',
        'мужчину': 'Мужчину',
        'female': 'Женщину',
        'женщину': 'Женщину',
        'девушку': 'Женщину',
        'couple': 'Пару',
        'пару': 'Пару',
        'пара': 'Пару'
    };
    
    const targetLower = (target || '').toLowerCase();
    return targetMap[targetLower] || 'Партнера';
}

/**
 * Форматирование целей
 */
function formatGoals(goals) {
    if (!goals) return 'не указано';
    if (Array.isArray(goals)) {
        return goals.map(g => formatSingleGoal(g)).join(', ');
    }
    // Если это строка со значениями разделенными запятой
    const goalsArray = String(goals).split(',').map(g => g.trim());
    return goalsArray.map(g => formatSingleGoal(g)).join(', ');
}

function formatSingleGoal(goal) {
    const goalMap = {
        'dating': 'Знакомство',
        'знакомство': 'Знакомство',
        'friendship': 'Дружба',
        'дружба': 'Дружба',
        'communication': 'Общение',
        'общение': 'Общение',
        'relationship': 'Отношения',
        'отношения': 'Отношения',
        'fun': 'Веселье',
        'веселье': 'Веселье',
        'intimate': 'Интимное',
        'интимное': 'Интимное'
    };
    
    const goalLower = String(goal || '').trim().toLowerCase();
    return goalMap[goalLower] || goal;
}

/**
 * Форматирование ориентации
 */
function formatOrientation(orientation) {
    const orientationMap = {
        'heterosexual': 'Гетеросексуальная',
        'гетеросексуальная': 'Гетеросексуальная',
        'homosexual': 'Гомосексуальная',
        'гомосексуальная': 'Гомосексуальная',
        'bisexual': 'Бисексуальная',
        'бисексуальная': 'Бисексуальная',
        'asexual': 'Асексуальная',
        'асексуальная': 'Асексуальная'
    };
    
    const orientationLower = (orientation || '').toLowerCase();
    return orientationMap[orientationLower] || orientation || 'не указана';
}

/**
 * Утилита для генерации числового ID из строки
 */
String.prototype.hashCode = function() {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
        const char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

/**
 * Конвертация HEIC в JPEG на клиенте через Canvas
 */
async function convertHeicToJpeg(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            try {
                // Создаём canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Конвертируем в JPEG Blob
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);
                    
                    if (!blob) {
                        reject(new Error('Не удалось конвертировать изображение'));
                        return;
                    }
                    
                    // Создаём новый File объект
                    const newFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    
                    resolve(newFile);
                }, 'image/jpeg', 0.85);
            } catch (err) {
                URL.revokeObjectURL(url);
                reject(err);
            }
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Не удалось загрузить изображение для конвертации'));
        };
        
        img.src = url;
    });
}

/**
 * Загрузка фото в Telegram и получение file_id
 */
async function uploadPhotoToTelegram(file, userId) {
    try {
        let fileToUpload = file;
        
        // HEIC нужно конвертировать на клиенте, т.к. некоторые файлы проблемные
        const isHeic = file.type === 'image/heic' || 
                       file.type === 'image/heif' || 
                       (file.type === 'application/octet-stream' && file.name.toLowerCase().endsWith('.heic')) ||
                       file.name.toLowerCase().endsWith('.heic') ||
                       file.name.toLowerCase().endsWith('.heif');
        
        if (isHeic) {
            console.log('🔄 HEIC обнаружен, конвертируем в JPEG на клиенте...');
            try {
                fileToUpload = await convertHeicToJpeg(file);
                console.log('✅ HEIC → JPEG:', fileToUpload.size, 'bytes');
            } catch (heicError) {
                console.error('❌ Ошибка конвертации HEIC на клиенте:', heicError);
                // Продолжаем отправку на сервер - там есть fallback
                console.log('🔄 Отправляем HEIC на сервер для конвертации...');
            }
        }
        
        const formData = new FormData();
        formData.append('photo', fileToUpload);
        formData.append('userId', userId);
        
        console.log('📤 Отправка файла:', {
            name: fileToUpload.name,
            type: fileToUpload.type,
            size: fileToUpload.size,
            wasHeic: isHeic
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
            throw new Error('Ошибка загрузки. Попробуйте другое фото или уменьшите размер.');
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

/**
 * Загрузить Email Service
 */
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

/**
 * Отправка письма на бэкенд
 */
async function sendEmailToBackend(emailData) {
    try {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        console.log('Текущий хост:', window.location.hostname);
        console.log('Это localhost?', isLocalhost);
        
        // Для локального тестирования используем Yandex Email сервер
        if (isLocalhost) {
            const backendUrl = 'http://localhost:5000/send-email';
            console.log('📧 Отправляем через Yandex SMTP сервер:', backendUrl);
            
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
        
        // Для продакшена используем простую отправку
        console.log('📧 Продакшен: отправляем...');
        
        if (typeof window.sendEmailWhishStyle === 'undefined') {
            console.log('Загружаем Email Service...');
            await loadEmailService();
        }

        return window.sendEmailWhishStyle(emailData);
    } catch (error) {
        console.log('Бэкенд недоступен, используем альтернативный способ');
        console.error('Ошибка при отправке на бэкенд:', error);
        
        return await sendEmailViaTelegram(emailData);
    }
}

/**
 * Альтернативная отправка через Telegram бота или mailto
 */
async function sendEmailViaTelegram(emailData) {
    try {
        if (typeof tg !== 'undefined' && tg && tg.sendData) {
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
            return sendEmailViaMailto(emailData);
        }
    } catch (error) {
        console.error('Ошибка Telegram отправки:', error);
        return sendEmailViaMailto(emailData);
    }
}

/**
 * Отправка через стандартный mailto
 */
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
        
        window.open(mailtoLink, '_blank');
        
        return {
            success: true,
            message: 'Открыт почтовый клиент для отправки.'
        };
    } catch (error) {
        console.error('Ошибка mailto:', error);
        return {
            success: false,
            error: 'Не удалось открыть почтовый клиент.'
        };
    }
}

/**
 * Открыть email composer для связи с поддержкой
 */
function openEmailComposer() {
    console.log('openEmailComposer вызвана');
    const recipient = 'aleksey@vorobey444.ru';
    const subject = encodeURIComponent('Обращение через anonimka.online');
    const body = encodeURIComponent(`Здравствуйте!\n\nПишу вам через анонимную доску анкет anonimka.online\n\n[Опишите вашу проблему или вопрос]\n\nС уважением,\n[Ваше имя]`);
    const mailtoLink = `mailto:${recipient}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
}

/**
 * Открыть Telegram чат с поддержкой
 */
function openSupportTelegramChat() {
    console.log('openSupportTelegramChat вызвана');
    
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

// Экспорт функций для onclick
window.hashSensitiveData = hashSensitiveData;
window.safeLog = safeLog;
window.getCurrentUserId = getCurrentUserId;
window.getUserNickname = getUserNickname;
window.getUserLocation = getUserLocation;
window.formatNumber = formatNumber;
window.formatChatTime = formatChatTime;
window.formatMessageTime = formatMessageTime;
window.escapeHtml = escapeHtml;
window.formatCreatedAt = formatCreatedAt;
window.formatGender = formatGender;
window.formatTarget = formatTarget;
window.formatGoals = formatGoals;
window.formatSingleGoal = formatSingleGoal;
window.formatOrientation = formatOrientation;
window.convertHeicToJpeg = convertHeicToJpeg;
window.uploadPhotoToTelegram = uploadPhotoToTelegram;
window.loadEmailService = loadEmailService;
window.sendEmailToBackend = sendEmailToBackend;
window.sendEmailViaTelegram = sendEmailViaTelegram;
window.sendEmailViaMailto = sendEmailViaMailto;
window.openEmailComposer = openEmailComposer;
window.openSupportTelegramChat = openSupportTelegramChat;

/**
 * Функция для расчета времени до полуночи (обновления лимитов) - АЛМАТЫ UTC+5
 */
function getTimeUntilMidnight() {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    
    // Конвертируем в Алматы время (UTC+5)
    const almatyHours = (utcHours + 5) % 24;
    
    // Считаем время до полуночи Алматы
    const hoursUntilMidnight = (24 - almatyHours - 1);
    const minutesUntilMidnight = (60 - utcMinutes);
    
    const hours = minutesUntilMidnight === 60 ? hoursUntilMidnight + 1 : hoursUntilMidnight;
    const minutes = minutesUntilMidnight === 60 ? 0 : minutesUntilMidnight;
    
    if (hours > 0) {
        return `${hours}ч ${minutes}м`;
    } else {
        return `${minutes}м`;
    }
}

/**
 * Возвращает правильную форму слова в зависимости от числа
 * @param {number} number - число
 * @param {string} one - форма для 1 (анкета)
 * @param {string} few - форма для 2-4 (анкеты)
 * @param {string} many - форма для 5+ (анкет)
 */
function getPluralForm(number, one, few, many) {
    const mod10 = number % 10;
    const mod100 = number % 100;
    
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}

/**
 * Копировать данные письма в буфер обмена
 */
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

/**
 * Открыть почтовый клиент вручную
 */
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

/**
 * Показать статус отправки email
 */
function showEmailStatus(type, message) {
    const statusDiv = document.getElementById('emailStatus');
    if (!statusDiv) return;
    
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

window.getTimeUntilMidnight = getTimeUntilMidnight;
window.getPluralForm = getPluralForm;
window.copyEmailData = copyEmailData;
window.openManualMailto = openManualMailto;
window.showEmailStatus = showEmailStatus;

// Настройка обработчика формы email
let emailFormHandlersInitialized = false;

function setupEmailFormHandlers() {
    const contactForm = document.getElementById('contactForm');
    
    console.log('setupEmailFormHandlers вызвана');
    console.log('contactForm найдена:', !!contactForm);
    
    if (contactForm) {
        contactForm.addEventListener('submit', window.handleEmailSubmit);
        console.log('Обработчик submit добавлен к форме');
        emailFormHandlersInitialized = true;
    }
}

// Настройка обработчиков событий для контактов
function setupContactsEventListeners() {
    console.log('Настройка обработчиков контактов');
    
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

// Показать опцию ручной отправки email
function showManualEmailOption(emailData) {
    const statusDiv = document.getElementById('emailStatus');
    if (!statusDiv) return;
    
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

window.setupEmailFormHandlers = setupEmailFormHandlers;
window.setupContactsEventListeners = setupContactsEventListeners;
window.showManualEmailOption = showManualEmailOption;

console.log('✅ Модуль утилит инициализирован');

} catch(e) { console.error('❌ Ошибка в модуле utils.js:', e); }
})();

// ========== auth.js (36.2 KB) ==========
(function() {
try {
/**
 * Модуль авторизации и управления пользователем (auth.js)
 * 
 * Функции:
 * - Проверка Telegram авторизации
 * - Инициализация пользователя в базе данных
 * - Управление никнеймом пользователя
 * - Вспомогательные функции авторизации
 */

console.log('🔐 [AUTH] Инициализация модуля авторизации');

/**
 * ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
 */
// currentUserLocation определена в location.js
let currentUserNickname = null;

/**
 * ОСНОВНЫЕ ФУНКЦИИ АВТОРИЗАЦИИ
 */

/**
 * Получить ID текущего пользователя
 * Возвращает user_token (предпочтительно) или Telegram ID
 */
function getCurrentUserId() {
    // Первый приоритет: user_token (для всех пользователей)
    const userToken = localStorage.getItem('user_token');
    if (userToken && userToken !== 'null' && userToken !== 'undefined') {
        return userToken;
    }
    
    // Второй приоритет: Telegram ID (для Telegram пользователей)
    const tgId = tg?.initDataUnsafe?.user?.id;
    if (tgId) {
        return String(tgId);
    }
    
    // Третий приоритет: сохранённый user_id (fallback для старых браузеров)
    const userId = localStorage.getItem('user_id');
    if (userId && userId !== 'null' && userId !== 'undefined') {
        return userId;
    }
    
    // Если ничего нет - возвращаем web_ идентификатор для неавторизованных
    return 'web_' + (Math.random().toString(36).substring(2, 11));
}

/**
 * Проверка авторизации через Telegram
 * Логика из монолита - автоматическая авторизация в Telegram, email для Android
 */
function checkTelegramAuth() {
    console.log('🔐 Проверка авторизации...');
    console.log('  📊 Детальная диагностика:');
    console.log('    - tg:', typeof tg !== 'undefined' ? tg : 'undefined');
    console.log('    - tg?.initDataUnsafe?.user:', typeof tg !== 'undefined' ? tg?.initDataUnsafe?.user : 'undefined');
    
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
        
        if (userToken && userToken !== 'null' && userToken !== 'undefined') {
            console.log('✅ user_token found, user authenticated via email');
            console.log('   Auth method:', authMethod);
            return true; // Пользователь уже авторизован
        }
        
        console.log('⚠️ user_token not found - waiting for native app auth...');
        return false; // Требуется авторизация в EmailAuthActivity
    }
    
    // Если запущено через Telegram WebApp, авторизация автоматическая
    const isTelegramWebApp = typeof tg !== 'undefined' && tg && tg.initDataUnsafe?.user?.id;
    
    if (isTelegramWebApp) {
        const userData = {
            id: tg.initDataUnsafe.user.id,
            first_name: tg.initDataUnsafe.user.first_name,
            last_name: tg.initDataUnsafe.user.last_name,
            username: tg.initDataUnsafe.user.username,
            photo_url: tg.initDataUnsafe.user.photo_url
        };
        
        console.log('✅ Данные пользователя получены из Telegram');
        
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
        
        return true;
    }
    
    // Проверяем email авторизацию (приоритетнее для web)
    const userToken = localStorage.getItem('user_token');
    const authMethod = localStorage.getItem('auth_method');
    
    if (userToken && userToken !== 'null' && userToken !== 'undefined' && authMethod === 'email') {
        console.log('✅ Найдена email авторизация, user_token:', userToken.substring(0, 16) + '...');
        
        // Закрываем модальные окна
        const telegramModal = document.getElementById('telegramAuthModal');
        if (telegramModal) {
            telegramModal.style.display = 'none';
        }
        const emailModal = document.getElementById('emailAuthModal');
        if (emailModal) {
            emailModal.style.display = 'none';
        }
        
        return true;
    }
    
    // Проверяем сохранённые данные Telegram из предыдущей сессии
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            console.log('✅ Найдена сохранённая Telegram авторизация');
            
            // Проверяем, не истекла ли авторизация (30 дней)
            const authTime = localStorage.getItem('telegram_auth_time');
            const now = Date.now();
            if (authTime && (now - parseInt(authTime)) < 30 * 24 * 60 * 60 * 1000) {
                console.log('✅ Telegram авторизация действительна');
                
                // Восстанавливаем user_id если его нет
                if (!localStorage.getItem('user_id') && userData.id) {
                    localStorage.setItem('user_id', userData.id.toString());
                    console.log('✅ Восстановлен user_id:', userData.id);
                }
                
                // Закрываем модальные окна
                const modal = document.getElementById('telegramAuthModal');
                const emailModal = document.getElementById('emailAuthModal');
                if (modal) modal.style.display = 'none';
                if (emailModal) emailModal.style.display = 'none';
                
                return true;
            } else {
                console.log('⚠️ Telegram авторизация истекла');
            }
        } catch (e) {
            console.error('Ошибка парсинга данных пользователя:', e);
            localStorage.removeItem('telegram_user');
        }
    }
    
    // Проверяем обычный user_token без auth_method
    if (userToken && userToken !== 'null' && userToken !== 'undefined') {
        console.log('✅ Пользователь авторизован по токену');
        return true;
    }
    
    console.log('⚠️ Авторизация не найдена');
    return false;
}

/**
 * Инициализация пользователя в базе данных
 */
async function initializeUserInDatabase() {
    try {
        console.log('🔄 [AUTH] Инициализация пользователя в БД');
        
        // Проверяем Telegram WebApp user
        const tgUser = typeof tg !== 'undefined' ? tg?.initDataUnsafe?.user : window.Telegram?.WebApp?.initDataUnsafe?.user;
        
        // Или проверяем сохранённую авторизацию через Login Widget
        const savedUser = localStorage.getItem('telegram_user');
        let userId = null;
        
        if (tgUser && tgUser.id) {
            userId = tgUser.id;
            console.log('🔑 [AUTH] Используем Telegram WebApp user:', userId);
        } else if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                if (userData?.id) {
                    userId = userData.id;
                    console.log('🔑 [AUTH] Используем сохранённый Login Widget user:', userId);
                }
            } catch (e) {
                console.warn('⚠️ [AUTH] Ошибка парсинга сохранённого пользователя:', e);
            }
        }
        
        if (userId) {
            console.log('📤 [AUTH] Инициализируем пользователя в БД...');
            
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tgId: userId,
                    nickname: null // Не отправляем локальный никнейм, чтобы не перезаписать серверный
                })
            });
            
            const result = await response.json();
            if (result.success && result.userToken) {
                // Сохраняем токен в localStorage
                localStorage.setItem('user_token', result.userToken);
                console.log('✅ [AUTH] Пользователь инициализирован, токен получен');
                
                // Обновляем last_login_at для статистики активных пользователей
                try {
                    await fetch('/api/users', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tgId: userId })
                    });
                    console.log('✅ [AUTH] last_login_at обновлён');
                } catch (e) {
                    console.warn('⚠️ [AUTH] Не удалось обновить last_login_at:', e);
                }
                
                // Синхронизируем никнейм из БД (сервер — источник истины)
                try {
                    const resp2 = await fetch(`/api/users?tgId=${userId}`);
                    const data2 = await resp2.json();
                    if (data2?.success && data2.displayNickname) {
                        localStorage.setItem('userNickname', data2.displayNickname);
                        localStorage.setItem('user_nickname', data2.displayNickname);
                        console.log('🔄 [AUTH] Никнейм синхронизирован из БД:', data2.displayNickname);
                        
                        // Обновим UI если нужно
                        const currentNicknameDisplay = document.getElementById('currentNicknameDisplay');
                        if (currentNicknameDisplay) currentNicknameDisplay.textContent = data2.displayNickname;
                        const nicknameInputPage = document.getElementById('nicknameInputPage');
                        if (nicknameInputPage) nicknameInputPage.value = data2.displayNickname;
                    } else {
                        console.log('ℹ️ [AUTH] Никнейм не найден в БД');
                    }
                } catch (e) {
                    console.warn('⚠️ [AUTH] Не удалось подтянуть никнейм из БД:', e);
                }
            } else {
                console.warn('⚠️ [AUTH] Ошибка инициализации пользователя:', result.error);
            }
        } else {
            // Для веб-пользователей проверяем user_token
            const userToken = localStorage.getItem('user_token');
            if (userToken && userToken !== 'null' && userToken !== 'undefined') {
                console.log('✅ [AUTH] Веб-пользователь с токеном:', userToken.substring(0, 16) + '...');
                
                // Отправляем heartbeat
                try {
                    await fetch('/api/user-init', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'heartbeat',
                            params: { user_token: userToken }
                        })
                    });
                    console.log('💓 [AUTH] Heartbeat отправлен');
                } catch (e) {
                    console.warn('⚠️ [AUTH] Ошибка heartbeat:', e.message);
                }
            } else {
                console.log('ℹ️ [AUTH] Telegram ID не найден, пропускаем инициализацию (веб-пользователь)');
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ [AUTH] Критическая ошибка инициализации пользователя:', error);
        return false;
    }
}

/**
 * Инициализация никнейма пользователя
 */
async function initializeNickname() {
    try {
        console.log('👤 [AUTH] Инициализация никнейма');
        
        // Проверяем сохранённый никнейм в localStorage
        const savedNickname = localStorage.getItem('user_nickname') || localStorage.getItem('userNickname');
        console.log('🔍 [AUTH] savedNickname:', savedNickname);
        
        // Проверяем реальный никнейм в БД через API
        const tgId = typeof tg !== 'undefined' && tg?.initDataUnsafe?.user?.id ? tg.initDataUnsafe.user.id : null;
        const userToken = localStorage.getItem('user_token');
        console.log('🔍 [AUTH] tgId:', tgId, 'userToken:', userToken ? 'есть' : 'нет');
        let realNickname = null;
        
        // Если есть tgId или userToken - проверяем никнейм в БД
        if (tgId || userToken) {
            try {
                let url = '/api/users?';
                if (tgId) {
                    url += `tgId=${tgId}`;
                    console.log('🔍 [AUTH] Ищем по tgId:', tgId);
                } else if (userToken) {
                    url += `userToken=${userToken}`;
                    console.log('🔍 [AUTH] Ищем по userToken:', userToken.substring(0, 16) + '...');
                }
                
                console.log('🔍 [AUTH] Запрос никнейма:', url);
                const response = await fetch(url);
                console.log('🔍 [AUTH] Response status:', response.status);
                
                // Если пользователь не найден в БД - очищаем localStorage и редирект
                if (response.status === 404) {
                    console.error('❌ [AUTH] Пользователь не найден в БД, очищаем localStorage');
                    localStorage.clear();
                    alert('Ваша сессия устарела. Пожалуйста, авторизуйтесь заново.');
                    window.location.href = '/';
                    return false;
                }
                
                const result = await response.json();
                console.log('🔍 [AUTH] Ответ API:', JSON.stringify(result));
                
                if (result.success && result.displayNickname) {
                    realNickname = result.displayNickname;
                    // Синхронизируем с localStorage
                    localStorage.setItem('user_nickname', realNickname);
                    localStorage.setItem('userNickname', realNickname);
                    currentUserNickname = realNickname;
                    console.log('✅ [AUTH] Никнейм загружен из БД:', realNickname);
                } else {
                    console.warn('⚠️ [AUTH] API не вернул никнейм');
                }
            } catch (error) {
                console.error('❌ [AUTH] Ошибка загрузки никнейма из БД:', error);
            }
        } else {
            console.warn('⚠️ [AUTH] Нет ни tgId, ни userToken для проверки никнейма');
            return false;
        }
        
        // Если никнейма нет ни в БД, ни в localStorage - показываем модальное окно
        console.log('🔍 [AUTH] Проверка: realNickname=', realNickname, 'savedNickname=', savedNickname);
        if (!realNickname && (!savedNickname || savedNickname === 'Аноним')) {
            console.log('⚠️ [AUTH] Никнейм не установлен - показываем модальное окно');
            await showRequiredNicknameModal();
        } else {
            console.log('✅ [AUTH] Никнейм уже установлен:', realNickname || savedNickname);
            currentUserNickname = realNickname || savedNickname;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ [AUTH] Ошибка инициализации никнейма:', error);
        return false;
    }
}

/**
 * Показать модальное окно для выбора обязательного никнейма
 */
async function showRequiredNicknameModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('requiredNicknameModal');
        const input = document.getElementById('requiredNicknameInput');
        const btn = document.getElementById('requiredNicknameBtn');
        const terms = document.getElementById('termsCheckbox');
        const statusEl = document.getElementById('requiredNicknameStatus');
        
        if (!modal || !input || !btn) {
            console.error('❌ [AUTH] Элементы модального окна не найдены');
            resolve(false);
            return;
        }
        
        // Показываем модальное окно
        modal.style.display = 'flex';
        setTimeout(() => input.focus(), 100);
        
        // Делаем кнопку неактивной по умолчанию
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        
        let checkTimeout = null;
        let lastNickname = '';
        let isNicknameAvailable = false;
        
        // Функция проверки готовности к сохранению
        const updateButtonState = () => {
            const nickname = input.value.trim();
            const isChecked = terms ? terms.checked : true;
            const isValid = nickname.length >= 1 && isNicknameAvailable;
            
            if (isValid && isChecked) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            } else {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            }
        };
        
        // Проверка доступности никнейма
        const checkNicknameAvailability = async (nickname) => {
            if (!nickname || nickname.length === 0) {
                if (statusEl) statusEl.textContent = '';
                isNicknameAvailable = false;
                updateButtonState();
                return;
            }
            
            if (statusEl) statusEl.textContent = '🔍 Проверка...';
            isNicknameAvailable = false;
            updateButtonState();
            
            try {
                const response = await fetch(`/api/nickname?nickname=${encodeURIComponent(nickname)}`);
                const result = await response.json();
                
                if (statusEl) {
                    if (result.available) {
                        statusEl.textContent = '✅ Никнейм доступен';
                        statusEl.className = 'nickname-status available';
                        isNicknameAvailable = true;
                    } else {
                        statusEl.textContent = '❌ Никнейм занят';
                        statusEl.className = 'nickname-status taken';
                        isNicknameAvailable = false;
                    }
                }
                updateButtonState();
            } catch (error) {
                console.error('Ошибка проверки никнейма:', error);
                if (statusEl) statusEl.textContent = '';
                isNicknameAvailable = false;
                updateButtonState();
            }
        };
        
        // Проверка при вводе (с debounce)
        input.addEventListener('input', () => {
            const nickname = input.value.trim();
            if (checkTimeout) clearTimeout(checkTimeout);
            
            if (nickname !== lastNickname) {
                lastNickname = nickname;
                checkTimeout = setTimeout(() => checkNicknameAvailability(nickname), 500);
            }
        });
        
        // Обновляем состояние кнопки при изменении чекбокса
        if (terms) {
            terms.addEventListener('change', updateButtonState);
        }
        
        // Обработчик кнопки
        const handleConfirm = async () => {
            const nickname = input.value.trim();
            
            // Валидация - не пустой
            if (!nickname || nickname.length === 0) {
                tg.showAlert('Введите никнейм');
                return;
            }
            
            if (nickname.length > 20) {
                tg.showAlert('Никнейм не должен превышать 20 символов');
                return;
            }
            
            // Проверяем согласие с условиями
            if (terms && !terms.checked) {
                tg.showAlert('Пожалуйста, согласитесь с условиями использования');
                return;
            }
            
            // Проверяем доступность перед сохранением
            if (!isNicknameAvailable) {
                tg.showAlert('Этот никнейм уже занят или недоступен. Выберите другой.');
                return;
            }
            
            // Сохраняем никнейм
            await saveRequiredNickname(nickname);
            modal.style.display = 'none';
            resolve(true);
        };
        
        // Удаляем старый обработчик и добавляем новый
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.onclick = handleConfirm;
        
        // Также разрешаем подтверждение через Enter
        input.onkeypress = (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                handleConfirm();
            }
        };
    });
}

/**
 * Сохранить никнейм пользователя
 */
async function saveRequiredNickname(nickname) {
    try {
        const userToken = localStorage.getItem('user_token');
        
        // Сохраняем локально
        localStorage.setItem('userNickname', nickname);
        currentUserNickname = nickname;
        
        console.log('✅ [AUTH] Никнейм сохранён:', nickname);
        
        // Отправляем на сервер для синхронизации
        if (userToken) {
            try {
                const response = await fetch('/api/user-init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'update-nickname',
                        params: { 
                            user_token: userToken,
                            nickname: nickname
                        }
                    })
                });
                
                const result = await response.json();
                if (result.error) {
                    console.warn('⚠️ [AUTH] Ошибка синхронизации никнейма:', result.error);
                } else {
                    console.log('✅ [AUTH] Никнейм синхронизирован с сервером');
                }
            } catch (error) {
                console.warn('⚠️ [AUTH] Ошибка отправки никнейма на сервер:', error);
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ [AUTH] Ошибка сохранения никнейма:', error);
        return false;
    }
}

/**
 * Получить никнейм текущего пользователя
 */
function getUserNickname() {
    // Сначала проверяем память
    if (currentUserNickname) {
        return currentUserNickname;
    }
    
    // Затем проверяем localStorage
    const saved = localStorage.getItem('userNickname');
    if (saved && saved.trim() !== '') {
        currentUserNickname = saved;
        return saved;
    }
    
    // Fallback наUsername из Telegram
    const tgUsername = tg?.initDataUnsafe?.user?.username;
    if (tgUsername) {
        return '@' + tgUsername;
    }
    
    // Если ничего нет
    return 'Аноним';
}

/**
 * Выход из системы / очистка авторизации
 */
function logout() {
    console.log('🚪 [AUTH] Выход из системы');
    
    // Очищаем localStorage
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('userNickname');
    localStorage.removeItem('user_email');
    localStorage.removeItem('telegram_user');
    localStorage.removeItem('auth_method');
    
    // Очищаем глобальные переменные
    currentUserNickname = null;
    
    // Перезагружаем страницу
    window.location.reload();
}

/**
 * Проверка авторизации
 */
function isUserAuthorized() {
    const userToken = localStorage.getItem('user_token');
    const tgUser = localStorage.getItem('telegram_user');
    
    return (userToken && userToken !== 'null') || !!tgUser;
}

/**
 * Получить информацию о текущем пользователе
 */
function getCurrentUserInfo() {
    return {
        id: getCurrentUserId(),
        token: localStorage.getItem('user_token'),
        nickname: getUserNickname(),
        authorized: isUserAuthorized(),
        email: localStorage.getItem('user_email'),
        telegram_id: tg?.initDataUnsafe?.user?.id
    };
}

/**
 * Обработка выхода из аккаунта
 */
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
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('onboarding_step');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_tg_id');
    localStorage.removeItem('last_fetch_time');
    localStorage.removeItem('chat_messages');
    
    // Очищаем все ключи связанные с опросами
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('poll_voted_')) {
            localStorage.removeItem(key);
        }
    });
    
    // Закрываем гамбургер меню
    if (typeof closeHamburgerMenu === 'function') {
        closeHamburgerMenu();
    }
    
    // Для Android - перезагружаем (MainActivity проверит отсутствие user_token)
    if (isAndroid) {
        console.log('📱 Android: reloading to trigger native auth flow...');
        window.location.reload();
    } else {
        // Для браузера - показываем нужное модальное окно авторизации
        setTimeout(() => {
            if (authMethod === 'email' || localStorage.getItem('user_email')) {
                if (typeof showEmailAuthModal === 'function') {
                    showEmailAuthModal();
                }
            } else {
                if (typeof showTelegramAuthModal === 'function') {
                    showTelegramAuthModal();
                }
            }
            console.log('✅ Выход выполнен, показано модальное окно авторизации');
        }, 300);
    }
}

/**
 * Алиас для logout
 */
function logout() {
    handleLogout();
}

/**
 * Обновить отображение кнопки выхода
 */
function updateLogoutButtonVisibility() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    
    // Проверяем реальную Telegram авторизацию (через WebApp)
    const hasRealTelegramAuth = !!(window.Telegram?.WebApp?.initDataUnsafe?.user?.id);
    const authMethod = localStorage.getItem('auth_method');
    const hasEmailAuth = authMethod === 'email' || !!localStorage.getItem('user_email');
    const hasLoginWidget = !!localStorage.getItem('telegram_user');
    const hasUserToken = !!localStorage.getItem('user_token');
    const isAndroid = navigator.userAgent.includes('Android');

    // Показываем кнопку для браузерной авторизации (email или login widget)
    if ((isAndroid && hasEmailAuth) || (!hasRealTelegramAuth && (hasEmailAuth || hasLoginWidget || hasUserToken))) {
        logoutBtn.style.display = 'flex';
    } else {
        // В Telegram WebApp кнопка выхода не нужна (встроенная авторизация)
        logoutBtn.style.display = 'none';
    }
}

/**
 * Сохранить никнейм со страницы настроек
 */
async function saveNicknamePage() {
    const nicknameInputPage = document.getElementById('nicknameInputPage');
    
    if (!nicknameInputPage) return;
    
    let nickname = nicknameInputPage.value.trim();
    
    if (!nickname) {
        tg.showAlert('❌ Никнейм не может быть пустым');
        return;
    }
    
    let tgIdAuth = null;
    const userToken = localStorage.getItem('user_token');
    const authMethod = localStorage.getItem('auth_method');
    const isAndroid = navigator.userAgent.includes('Android');
    const isTelegramWebApp = window.Telegram?.WebApp?.platform !== 'unknown' && !!window.Telegram?.WebApp?.initData;
    
    if (authMethod === 'email' || (isAndroid && userToken)) {
        tgIdAuth = 99999999;
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
        tg.showAlert('❌ Не удалось получить данные авторизации');
        return;
    }

    try {
        const payload = { tgId: tgIdAuth, nickname: nickname };
        if (userToken) payload.userToken = userToken;
        
        const response = await fetch('/api/nickname', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!result.success) {
            tg.showAlert(result.error || 'Ошибка сохранения никнейма');
            return;
        }
        
        localStorage.setItem('user_nickname', nickname);
        localStorage.setItem('userNickname', nickname);
        
        const header = document.getElementById('nicknameHeader');
        if (header) header.textContent = nickname;
        
        tg.showAlert('✅ Никнейм сохранён!');
        
    } catch (error) {
        console.error('Ошибка сохранения никнейма:', error);
        tg.showAlert('Ошибка: ' + error.message);
    }
}

// Экспорт функций для onclick
window.getCurrentUserId = getCurrentUserId;
window.checkTelegramAuth = checkTelegramAuth;
window.initializeUserInDatabase = initializeUserInDatabase;
window.initializeNickname = initializeNickname;
window.showRequiredNicknameModal = showRequiredNicknameModal;
window.saveRequiredNickname = saveRequiredNickname;
window.getUserNickname = getUserNickname;
window.logout = logout;
window.isUserAuthorized = isUserAuthorized;
window.getCurrentUserInfo = getCurrentUserInfo;
window.handleLogout = handleLogout;
window.updateLogoutButtonVisibility = updateLogoutButtonVisibility;
window.saveNicknamePage = saveNicknamePage;

console.log('✅ [AUTH] Модуль авторизации инициализирован');

} catch(e) { console.error('❌ Ошибка в модуле auth.js:', e); }
})();

// ========== auth-modals.js (53.5 KB) ==========
(function() {
try {
// ================================================
// AUTH MODALS MODULE - Модальные окна авторизации
// Telegram и Email аутентификация
// ================================================

console.log('📦 Загружен модуль: auth-modals.js');

/**
 * Скрыть модальные окна авторизации немедленно (IIFE)
 */
(function hideAuthModalsImmediately() {
    const userToken = localStorage.getItem('user_token');
    
    // Если токен есть - скрываем модалки (пользователь авторизован)
    if (userToken) {
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
    }
    // Если токена нет - НЕ скрываем модалки, они должны показаться
})();

/**
 * Резервный механизм: если авторизация не показалась, принудительно показать модалку
 */
function ensureAuthModalVisibility() {
    const userToken = localStorage.getItem('user_token');
    if (userToken) return;
    
    const modal = document.getElementById('telegramAuthModal');
    if (!modal) return;

    const computedStyle = window.getComputedStyle(modal);
    if (computedStyle.display === 'none') {
        console.warn('⚠️ Fallback: принудительно показываем модальное окно авторизации');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.zIndex = '99999';
        modal.classList.remove('hidden');
        modal.removeAttribute('hidden');

        const loginWidgetContainer = document.getElementById('loginWidgetContainer');
        if (loginWidgetContainer) loginWidgetContainer.style.display = 'block';
        const loginWidgetDivider = document.getElementById('loginWidgetDivider');
        if (loginWidgetDivider) loginWidgetDivider.style.display = 'flex';

        // Гарантируем отображение основного контента модалки
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.display = 'flex';
            modalContent.style.opacity = '1';
            modalContent.style.visibility = 'visible';
        }
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) modalBody.style.display = 'block';
    }
}

/**
 * Проверка и обработка возврата после авторизации
 */
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

// Показать модальное окно авторизации через Telegram
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
    // Используем tg://resolve чтобы открывать приложение Telegram сразу (минуя веб-превью)
    const telegramDeepLink = `tg://resolve?domain=${botUsername}&start=${startParam}`;
    
    console.log('🔗 Deep link:', telegramDeepLink);
    
    if (deepLinkButton) {
        deepLinkButton.href = telegramDeepLink;
        // Добавляем обработчик клика для принудительного открытия
        deepLinkButton.onclick = function(e) {
            e.preventDefault();
            const isTgWebApp = window.Telegram?.WebApp?.platform !== 'unknown' && !!window.Telegram?.WebApp?.initData;
            console.log('🔗 Открываем Telegram:', telegramDeepLink, 'isTelegramWebApp:', isTgWebApp);

            // Внутри Telegram WebApp используем родной метод
            try {
                if (isTgWebApp && window.Telegram?.WebApp?.openTelegramLink) {
                    window.Telegram.WebApp.openTelegramLink(telegramDeepLink);
                    return false;
                }
            } catch (err) {
                console.error('❌ Ошибка openTelegramLink:', err);
            }

            // Если это Android-приложение (WebView), открываем напрямую
            if (isAndroidApp) {
                window.location.href = telegramDeepLink;
                return false;
            }
            
            // Браузерный fallback: принудительный переход (без popup)
            window.location.href = telegramDeepLink;
            return false;
        };
        console.log('✅ Deep link установлен на кнопку с обработчиком клика');
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
    const botUsername = 'anonimka_kz_bot';
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
    const botUsername = 'anonimka_kz_bot';
    
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
    if (typeof updateLogoutButtonVisibility === 'function') {
        updateLogoutButtonVisibility();
    }
    
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

// Показать модальное окно реферальной ссылки
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
function getCurrentUserIdLocal() {
    // 1) Telegram WebApp user
    const isTgWebApp = window.Telegram?.WebApp?.platform !== 'unknown' && !!window.Telegram?.WebApp?.initData;
    if (isTgWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
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
    // 3) user_token
    const userToken = localStorage.getItem('user_token');
    if (userToken && userToken !== 'null') {
        return userToken;
    }
    // 4) Для чисто веб-пользователей (без Telegram) возвращаем null
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
    if (locationStr === 'null' || locationStr === 'undefined') {
        console.warn('⚠️ userLocation содержит строку null/undefined, очищаем');
        localStorage.removeItem('userLocation');
        return null;
    }
    if (locationStr) {
        try {
            const parsed = JSON.parse(locationStr);
            console.log('📍 Parsed location:', parsed);
            if (!parsed || typeof parsed !== 'object') return null;
            
            let city = parsed.city || null;
            let region = parsed.region || null;
            
            // Автокоррекция известных ошибок IP-определения
            // Если город = "Акмола" или другие неправильные названия, пробуем определить по timezone
            const invalidCities = ['Акмола', 'Akmola', 'Akmola Region'];
            if (city && invalidCities.includes(city)) {
                console.warn('⚠️ Обнаружен некорректный город:', city, '- пробуем timezone...');
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                console.log('📍 Timezone:', timezone);
                
                // Timezone карта для автокоррекции
                const tzCorrections = {
                    'Asia/Almaty': { city: 'Алматы', region: 'Алматинская область' },
                    'Asia/Qyzylorda': { city: 'Кызылорда', region: 'Кызылординская область' },
                    'Asia/Aqtobe': { city: 'Актобе', region: 'Актюбинская область' },
                    'Asia/Oral': { city: 'Уральск', region: 'Западно-Казахстанская область' }
                };
                
                if (tzCorrections[timezone]) {
                    city = tzCorrections[timezone].city;
                    region = tzCorrections[timezone].region;
                    console.log('✅ Локация исправлена по timezone:', { city, region });
                    
                    // Сохраняем исправленную локацию
                    const corrected = { ...parsed, city, region, timestamp: Date.now() };
                    localStorage.setItem('userLocation', JSON.stringify(corrected));
                }
            }
            
            const normalized = {
                country: parsed.country || null,
                region: region,
                city: city,
                timestamp: parsed.timestamp || Date.now()
            };
            return normalized;
        } catch (e) {
            console.error('Ошибка парсинга userLocation:', e);
            localStorage.removeItem('userLocation');
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
    return window.userDataCache[userId] || null;
}

// Загрузить данные пользователя асинхронно
async function loadUserData(userId) {
    if (!userId) return null;
    
    // Проверяем кеш
    if (window.userDataCache && window.userDataCache[userId]) {
        return window.userDataCache[userId];
    }
    
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) return null;
        
        const userData = await response.json();
        
        // Сохраняем в кеш
        if (!window.userDataCache) {
            window.userDataCache = {};
        }
        window.userDataCache[userId] = userData;
        
        return userData;
    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
        return null;
    }
}

/**
 * Показать форму обратной связи по email
 */
function showEmailForm() {
    showScreen('emailForm');
    const senderEmail = document.getElementById('senderEmail');
    const emailSubject = document.getElementById('emailSubject');
    const emailMessage = document.getElementById('emailMessage');
    const emailStatus = document.getElementById('emailStatus');
    
    if (senderEmail) senderEmail.value = '';
    if (emailSubject) emailSubject.value = 'Обращение через anonimka.online';
    if (emailMessage) emailMessage.value = '';
    if (emailStatus) emailStatus.style.display = 'none';
}

/**
 * Отправить email через форму
 */
async function handleEmailSubmit(event) {
    if (event) event.preventDefault();
    
    const senderEmail = document.getElementById('senderEmail')?.value?.trim();
    const emailSubject = document.getElementById('emailSubject')?.value?.trim();
    const emailMessage = document.getElementById('emailMessage')?.value?.trim();
    
    if (!senderEmail || !emailMessage) {
        tg.showAlert('Заполните все обязательные поля');
        return;
    }
    
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: senderEmail,
                subject: emailSubject || 'Обращение через anonimka.online',
                message: emailMessage
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            tg.showAlert('✅ Письмо отправлено!');
            if (document.getElementById('emailMessage')) {
                document.getElementById('emailMessage').value = '';
            }
        } else {
            tg.showAlert('Ошибка: ' + (data.error || 'Не удалось отправить'));
        }
    } catch (error) {
        console.error('Ошибка отправки email:', error);
        tg.showAlert('Ошибка при отправке письма');
    }
}

/**
 * Показать модальное окно авторизации для Android
 */
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
            
            .android-auth-content {
                background: #1a1a2e;
                border-radius: 24px;
                padding: 32px 24px;
                max-width: 400px;
                width: 90%;
                color: white;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            }
            
            .android-auth-icon { font-size: 64px; text-align: center; margin-bottom: 16px; }
            
            .android-auth-title {
                font-size: 24px;
                font-weight: 700;
                text-align: center;
                margin-bottom: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            .android-auth-description { text-align: center; color: #a0aec0; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
            
            .android-auth-steps { background: rgba(255,255,255,0.05); border-radius: 16px; padding: 20px; margin-bottom: 24px; }
            
            .android-auth-step { display: flex; align-items: start; gap: 12px; margin-bottom: 16px; }
            .android-auth-step:last-child { margin-bottom: 0; }
            
            .android-auth-step-number {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                width: 28px; height: 28px;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-weight: 700; flex-shrink: 0;
            }
            
            .android-auth-step-text { flex: 1; padding-top: 4px; font-size: 14px; line-height: 1.5; }
            
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
            }
            
            .android-auth-buttons { display: flex; gap: 12px; }
            
            .android-auth-button {
                flex: 1; padding: 16px; border-radius: 12px; border: none;
                font-weight: 600; font-size: 15px; cursor: pointer;
            }
            
            .android-auth-button-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
            .android-auth-button-secondary { background: rgba(255,255,255,0.1); color: white; }
            
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
                Anonimka работает на базе Telegram. Для авторизации нужен Telegram аккаунт.
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
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length === 4) {
            verifyAndroidAuthCode(this.value);
        }
    });
}

/**
 * Закрыть модальное окно Android авторизации
 */
function closeAndroidAuthModal() {
    const modal = document.getElementById('androidAuthModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s';
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Открыть Telegram бота для авторизации
 */
function openTelegramBot() {
    const button = document.querySelector('.android-auth-button-primary');
    const originalText = button ? button.textContent : '';
    
    try {
        if (button) {
            button.disabled = true;
            button.textContent = 'Открываем Telegram...';
            button.style.opacity = '0.6';
        }
        
        if (!navigator.onLine) {
            throw new Error('Нет подключения к интернету');
        }
        
        const telegramWindow = window.open('https://t.me/anonimka_kz_bot?start=app_auth', '_blank');
        
        if (!telegramWindow || telegramWindow.closed || typeof telegramWindow.closed === 'undefined') {
            throw new Error('Не удалось открыть Telegram.');
        }
        
        setTimeout(() => {
            if (telegramWindow && !telegramWindow.closed) {
                try { telegramWindow.close(); } catch (e) {}
            }
        }, 2000);
        
        setTimeout(() => {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
                button.style.opacity = '1';
            }
        }, 3000);
        
        setTimeout(() => {
            const input = document.getElementById('androidAuthCodeInput');
            if (input) input.focus();
        }, 2500);
        
    } catch (error) {
        console.error('❌ Ошибка открытия Telegram:', error);
        
        const errorDiv = document.getElementById('androidAuthError');
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = error.message;
            setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
        }
        
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
            button.style.opacity = '1';
        }
    }
}

/**
 * Проверить код авторизации Android
 */
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
            const userData = result.user;
            localStorage.setItem('telegram_user', JSON.stringify(userData));
            localStorage.setItem('telegram_auth_time', Date.now().toString());
            localStorage.setItem('user_id', userData.id.toString());
            
            if (userData.user_token) {
                localStorage.setItem('user_token', userData.user_token);
                localStorage.setItem('auth_method', 'email');
            }
            
            localStorage.removeItem('android_device_id');
            
            errorDiv.style.display = 'block';
            errorDiv.style.background = 'rgba(52, 199, 89, 0.2)';
            errorDiv.style.borderColor = 'rgba(52, 199, 89, 0.4)';
            errorDiv.style.color = '#34c759';
            errorDiv.textContent = '✅ Успешно! Перезагружаем...';
            
            setTimeout(() => {
                closeAndroidAuthModal();
                location.reload();
            }, 1500);
        } else {
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

// Экспорт функций для onclick
window.showTelegramAuthModal = showTelegramAuthModal;
window.closeTelegramAuthModal = closeTelegramAuthModal;
window.generateTelegramQR = generateTelegramQR;
window.initTelegramLoginWidget = initTelegramLoginWidget;
window.showEmailAuthModal = showEmailAuthModal;
window.switchToTelegramAuth = switchToTelegramAuth;
window.switchToEmailAuth = switchToEmailAuth;
window.showReferralModal = showReferralModal;
window.getCurrentUserId = getCurrentUserId;
window.getUserNickname = getUserNickname;
window.getUserLocation = getUserLocation;
window.getUserData = getUserData;
window.loadUserData = loadUserData;
window.showEmailForm = showEmailForm;
window.handleEmailSubmit = handleEmailSubmit;
window.ensureAuthModalVisibility = ensureAuthModalVisibility;
window.checkAndHandleAuthReturn = checkAndHandleAuthReturn;
window.showAndroidAuthModal = showAndroidAuthModal;
window.closeAndroidAuthModal = closeAndroidAuthModal;
window.openTelegramBot = openTelegramBot;
window.verifyAndroidAuthCode = verifyAndroidAuthCode;

// Показать уведомление о привязке Telegram для Android WebView
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

window.showTelegramLinkNotification = showTelegramLinkNotification;

console.log('✅ Модуль auth-modals.js инициализирован');

} catch(e) { console.error('❌ Ошибка в модуле auth-modals.js:', e); }
})();

// ========== location-data.js (13.4 KB) ==========
(function() {
try {
/**
 * Данные локаций (location-data.js)
 * 
 * Содержит большую структуру данных со странами, регионами и городами
 * для выбора локации в приложении
 */

console.log('🗺️ [LOCATION-DATA] Загрузка данных локаций');

/**
 * ПОЛНАЯ БАЗА ДАННЫХ ЛОКАЦИЙ
 * Структура: { countryCode: { name, flag, regions: { regionName: [cities...] } } }
 */

const locationData = {
    // =============== КАЗАХСТАН ===============
    'KZ': {
        name: 'Казахстан',
        flag: '🇰🇿',
        regions: {
            'Акмолинская область': [
                'Акмола', 'Аршалы', 'Бурабай', 'Ерейментау', 'Ерсай', 'Жаркаинск', 
                'Зеленый Бор', 'Зеленовка', 'Зеленый Сад', 'Кокшетау', 'Макинск', 
                'Степногорск', 'Щучинск', 'Ботай', 'Есиль'
            ],
            'Актюбинская область': [
                'Актау', 'Актобе', 'Алтынсай', 'Байтерек', 'Бузачи', 'Домбай', 
                'Жанатас', 'Иргиз', 'Кандыагаш', 'Мартук', 'Сарань', 'Темир', 
                'Темирбулак', 'Уил', 'Шалкар'
            ],
            'Алматинская область': [
                'Абай', 'Алматы', 'Алтынсай', 'Амангельды', 'Арысь', 'Ассы', 
                'Байсерке', 'Балхаш', 'Батыс Казахстан', 'Батыс Сагын', 'Бесшокы', 
                'Бозой', 'Булакты', 'Капчагай', 'Кербулак', 'Кокшетау', 'Коксерек',
                'Кульджа', 'Кызылорда', 'Лепсинск', 'Матай', 'Нарынкол', 'Осакаров',
                'Отеген-Батыр', 'Панфилов', 'Сарыозек', 'Сарыбулак', 'Сарышаган',
                'Сатпаев', 'Сеульбе', 'Талдыкорган', 'Текели', 'Турген', 'Узынағаш',
                'Уштобе', 'Усть-Каменогорск', 'Филипповка', 'Хантау', 'Частозёрье'
            ],
            'Жамбылская область': [
                'Айтеке-Би', 'Аксуат', 'Баршалы', 'Жамбайский р-н', 'Жанаарка', 
                'Жанатурмыс', 'Жараспай', 'Жыргалан', 'Зеленый Сад', 'Икон', 
                'Каратау', 'Кейбулак', 'Кленовое', 'Майкаин', 'Мерке', 'Сарысай',
                'Сарышаган', 'Сатпаев', 'Таласский р-н', 'Талдыкорган', 'Тараз',
                'Токажан', 'Узынағаш', 'Улытау', 'Чаганак', 'Чу'
            ],
            'Западно-Казахстанская область': [
                'Атырау', 'Актау', 'Баутино', 'Бейнеу', 'Жетыбай', 'Индерборский р-н',
                'Казахолово', 'Каспийск', 'Кульсай', 'Мазанов', 'Махамбет', 
                'Озен', 'Оралск', 'Орда', 'Отпан-Батыс', 'Сарай', 'Сузак', 'Темир',
                'Улкен Булак', 'Уральск', 'Учсай', 'Хорезм'
            ],
            'Костанайская область': [
                'Аркалык', 'Аулиеколь', 'Боровое', 'Джангельдинский р-н', 'Дружба',
                'Затобольск', 'Звенигород', 'Зеленый Мыс', 'Зеленый Сад', 'Зеленый Холм',
                'Костанай', 'Кулундинский р-н', 'Кургалжино', 'Куш-Мурун', 'Лебяжье',
                'Макинский р-н', 'Малый Улкен', 'Мендикаринский р-н', 'Мертёнское',
                'Озерное', 'Песчаное', 'Рузаевка', 'Свободное', 'Сосновка', 'Студенческое',
                'Сузун', 'Тарановское', 'Торгай', 'Троицк', 'Улкен-Узень', 'Фрунзе'
            ],
            'Кызылординская область': [
                'Аккудук', 'Акмешит', 'Аулиеата', 'Байсерке', 'Бейнеу', 'Болашак',
                'Достык', 'Жалпак', 'Жаркесы', 'Жосалы', 'Казалинск', 'Казахдарья',
                'Кармакши', 'Кибрай', 'Кулжабай', 'Кунград', 'Кызылорда', 'Мактаарал',
                'Махамбет', 'Мойынак', 'Нарын', 'Озерное', 'Саби', 'Сарыбулак',
                'Сарысай', 'Созак', 'Теречта', 'Узень', 'Улькендi', 'Унга', 'Усть-Камчатский'
            ],
            'Мангистауская область': [
                'Актау', 'Актанаш', 'Аткамбай', 'Атырау', 'Батыс-Мангыстау', 'Баутино',
                'Бейнеу', 'Бузачи', 'Жангожин', 'Жетыбай', 'Жиланшик', 'Жынамалы',
                'Каспий', 'Каспийск', 'Казахдарья', 'Каракулак', 'Каршек', 'Кендерли',
                'Керпеш', 'Манатбай', 'Манау', 'Мастобе', 'Морской', 'Мынбулак',
                'Озен', 'Остем', 'Сарыколь', 'Сарыпе', 'Сарышаган', 'Сау-Сай',
                'Сау-Булак', 'Сефи-Сай', 'Сейшел', 'Теме-Булак', 'Туздыбастау',
                'Уквык', 'Устюрт', 'Уш-Арал', 'Уш-Кошкар'
            ],
            'Павлодарская область': [
                'Актогай', 'Баянды', 'Бассоли', 'Безопасное', 'Бешенов', 'Боровое',
                'Валиханово', 'Веб', 'Виноградское', 'Даулет', 'Дворецкое', 'Держаномос',
                'Друсселинский р-н', 'Екатерин', 'Екатериновка', 'Ермак', 'Ершово',
                'Жариковский р-н', 'Жарык', 'Жезказган', 'Жетигарам', 'Жидели', 'Жилахово',
                'Жуан', 'Журавли', 'Завьялово', 'Затобольск', 'Зауралье', 'Зеленогорск',
                'Зелёный Яр', 'Железнодорожное', 'Иртышское', 'Канай', 'Казанцево', 'Казачье',
                'Каркаралы', 'Карлаш', 'Карышкасы', 'Каршеково', 'Каршунская', 'Каска',
                'Кайксанский р-н', 'Келлеропай', 'Кендарай', 'Кендерлык', 'Кендырь',
                'Кинельский р-н', 'Кизиловка', 'Кокшай', 'Кокшетау', 'Кокчетав', 'Коксай',
                'Кулан', 'Куланбулак', 'Кулпак', 'Кулунды', 'Куса', 'Кушни'
            ],
            'Северо-Казахстанская область': [
                'Акмарал', 'Акшанский р-н', 'Аккайын', 'Акмарал', 'Акмешит', 'Акмол',
                'Актау', 'Актөре', 'Аксай', 'Аксер', 'Акша', 'Алабай', 'Аленовка',
                'Алеуткино', 'Алкибай', 'Альбертофельд', 'Амакулово', 'Амурская', 'Анасай',
                'Аногино', 'Андреевка', 'Аньково', 'Апай', 'Апаново', 'Апарпай',
                'Апасовка', 'Апатофельд', 'Апатофельд', 'Апатофельд-2', 'Апатофельд-3',
                'Апатофельд-Булак', 'Апатофельд-Жыл', 'Апекс', 'Апелово', 'Апербай'
            ],
            'Туркестанская область': [
                'Арысь', 'Ай-Булак', 'Ак-Жар', 'Ак-Мечеть', 'Аксай', 'Актау',
                'Актюбе', 'Алтынсай', 'Амангельды', 'Андреевка', 'Аральск', 'Арта',
                'Артобе', 'Аса', 'Ассы', 'Ауза', 'Ауэ', 'Бай-Булак', 'Байджан',
                'Байзак', 'Байсерке', 'Балыкшы', 'Баянбай', 'Баянсай', 'Белые Холмы',
                'Беркит', 'Бесоба', 'Бескопа', 'Бесшокы', 'Благодарное', 'Богомольное',
                'Большой Чегет', 'Бораганское', 'Борский', 'Боровое', 'Ботакара',
                'Ботай', 'Братский', 'Бузачи', 'Бузылган', 'Быков', 'Василье',
                'Вертегорское', 'Верхний', 'Волчанск', 'Восток', 'Гавриловка',
                'Геройское', 'Герс', 'Герс-Булак', 'Герс-Узень', 'Гертап', 'Гулай',
                'Гусак', 'Густар', 'Даулет', 'Дауринское', 'Дейнов', 'Джабын',
                'Джалпак', 'Джандар', 'Джанбай', 'Джангалов', 'Джангельды', 'Джансай',
                'Джантемир', 'Джарык', 'Джасай', 'Джасатай', 'Джасауыр', 'Джасылкус',
                'Джасымовка', 'Джатай', 'Джатаул', 'Джатколь', 'Джауд', 'Джаузак'
            ]
        }
    },
    
    // =============== РОССИЯ ===============
    'RU': {
        name: 'Россия',
        flag: '🇷🇺',
        regions: {
            'Москва': ['Москва'],
            'Санкт-Петербург': ['Санкт-Петербург'],
            'Московская область': ['Балашиха', 'Подольск', 'Одинцово', 'Люберцы', 'Химки', 'Щелково'],
            'Свердловская область': ['Екатеринбург', 'Нижний Тагил', 'Каменск-Уральский', 'Туринск'],
            'Новосибирская область': ['Новосибирск', 'Бердск', 'Искитим', 'Мариинск'],
            'Краснодарский край': ['Краснодар', 'Сочи', 'Новороссийск', 'Туапсе'],
            'Республика Татарстан': ['Казань', 'Набережные Челны', 'Альметьевск', 'Елабуга'],
            'Ленинградская область': ['Санкт-Петербург', 'Гатчина', 'Выборг', 'Всеволожск']
        }
    },

    // =============== США ===============
    'US': {
        name: 'США',
        flag: '🇺🇸',
        regions: {
            'Калифорния': ['Лос-Анджелес', 'Сан-Франциско', 'Сан-Диего', 'Сакраменто'],
            'Нью-Йорк': ['Нью-Йорк', 'Буффало', 'Рочестер', 'Сиракузы'],
            'Техас': ['Хьюстон', 'Даллас', 'Сан-Антонио', 'Остин'],
            'Флорида': ['Майами', 'Тампа', 'Орландо', 'Джексонвилл']
        }
    },

    // =============== ТУРЦИЯ ===============
    'TR': {
        name: 'Турция',
        flag: '🇹🇷',
        regions: {
            'Стамбул': ['Стамбул'],
            'Анкара': ['Анкара'],
            'Измир': ['Измир'],
            'Анталья': ['Анталья', 'Белек', 'Кемер', 'Сиде'],
            'Бодрум': ['Бодрум', 'Мармарис', 'Икизджелер']
        }
    },

    // =============== ОБЪЕДИНЕННЫЕ АРАБСКИЕ ЭМИРАТЫ ===============
    'AE': {
        name: 'ОАЭ',
        flag: '🇦🇪',
        regions: {
            'Дубай': ['Дубай', 'Марина', 'Дейра', 'Бур-Дубай'],
            'Абу-Даби': ['Абу-Даби', 'Баб Аль Дафра'],
            'Шарджа': ['Шарджа', 'Аль-Касба', 'Аль-Корайс']
        }
    },

    // =============== КИПР ===============
    'CY': {
        name: 'Кипр',
        flag: '🇨🇾',
        regions: {
            'Никосия': ['Никосия'],
            'Лимассол': ['Лимассол'],
            'Ларнака': ['Ларнака'],
            'Пафос': ['Пафос']
        }
    }
};

// Экспортируем данные как глобальную переменную
window.locationData = locationData;

console.log('✅ [LOCATION-DATA] База данных локаций загружена');
console.log('📊 [LOCATION-DATA] Всего стран:', Object.keys(locationData).length);

} catch(e) { console.error('❌ Ошибка в модуле location-data.js:', e); }
})();

// ========== photos.js (58.5 KB) ==========
(function() {
try {
/**
 * Модуль работы с фото (photos.js)
 * 
 * Функции:
 * - Управление галереей "Мои фото"
 * - Добавление фото к анкете
 * - Редактирование, удаление, изменение порядка фото
 */

console.log('📸 [PHOTOS] Инициализация модуля фото');

/**
 * Получить URL фото (защищённый или обычный)
 */
function getPhotoUrl(photoUrlOrFileId, size = null) {
    // Если уже защищённый URL - возвращаем как есть
    if (photoUrlOrFileId && photoUrlOrFileId.includes('/api/secure-photo')) {
        return photoUrlOrFileId;
    }
    
    // Если это file_id от Telegram - преобразуем в защищённый URL
    if (photoUrlOrFileId && photoUrlOrFileId.startsWith('Ag')) {
        const secureUrl = `/api/secure-photo?fileId=${encodeURIComponent(photoUrlOrFileId)}`;
        return secureUrl;
    }
    
    // Иначе возвращаем как есть (может быть уже готовый URL)
    return photoUrlOrFileId;
}

/**
 * Сжатие изображения
 */
async function compressImage(file, maxSizeMB = 4) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Ограничиваем размер до 1280px по большей стороне
                const maxDimension = 1280;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Конвертируем в JPEG с качеством 0.85
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);
                    
                    if (!blob) {
                        reject(new Error('Не удалось сжать изображение'));
                        return;
                    }
                    
                    const newFile = new File([blob], file.name.replace(/\.(heic|heif|png|webp)$/i, '.jpg'), {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    
                    console.log(`✅ Изображение сжато: ${file.size} → ${blob.size} bytes`);
                    resolve(newFile);
                }, 'image/jpeg', 0.85);
            } catch (err) {
                URL.revokeObjectURL(url);
                reject(err);
            }
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Не удалось загрузить изображение для сжатия'));
        };
        
        img.src = url;
    });
}

/**
 * Показать страницу "Мои фото"
 */
function showMyPhotos() {
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
        tg.showAlert('❌ Требуется авторизация');
        return;
    }
    
    const url = window.location.origin + '/my-photo?userToken=' + userToken;
    window.location.href = url;
    
    if (typeof closeHamburgerMenu === 'function') {
        closeHamburgerMenu();
    } else if (typeof closeBurgerMenu === 'function') {
        closeBurgerMenu();
    }
}

/**
 * Загрузить фото пользователя
 */
async function loadMyPhotos() {
    console.log('📸 loadMyPhotos() начало работы');
    const gallery = document.getElementById('photosGallery');
    const limitText = document.getElementById('photosLimitText');
    
    const userToken = localStorage.getItem('user_token');
    
    if (!userToken) {
        if (gallery) {
            gallery.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #888;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🔐</div>
                    <p>Требуется авторизация</p>
                </div>`;
        }
        return;
    }
    
    try {
        if (gallery) {
            gallery.innerHTML = `<p style="color: #888; text-align: center; padding: 20px;">⏳ Загрузка...</p>`;
        }
        
        const resp = await fetch(`/api/user-photos?userToken=${userToken}`);
        
        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }
        
        const result = await resp.json();
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
        const photos = result.data || [];
        const isPremium = typeof userPremiumStatus !== 'undefined' ? userPremiumStatus.isPremium : false;
        const limit = isPremium ? 3 : 1;
        const active = photos.filter((p) => p.is_active).length;
        
        if (limitText) {
            limitText.innerHTML = `Активных: <strong>${active}/${limit}</strong>`;
        }
        
        if (!gallery) return;
        
        if (photos.length === 0) {
            gallery.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 5rem; margin-bottom: 20px; opacity: 0.5;">📸</div>
                    <h3 style="color: #e0e0e0; margin: 0 0 15px 0;">Нет фото</h3>
                    <p style="color: #888; margin: 0;">Нажмите "Добавить фото"</p>
                </div>
            `;
            return;
        }
        
        let gridHTML = `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">`;
        
        photos.forEach((photo, idx) => {
            const isActive = photo.is_active;
            const opacity = isActive ? '1' : '0.5';
            const isFirst = idx === 0;
            const isLast = idx === photos.length - 1;
            
            gridHTML += `
                <div style="border-radius: 12px; overflow: hidden; background: rgba(26, 26, 46, 0.6); border: 2px solid ${isActive ? 'rgba(0, 217, 255, 0.3)' : 'rgba(255, 59, 48, 0.3)'}; opacity: ${opacity};">
                    <div onclick="window.open('${photo.photo_url}', '_blank')" style="width: 100%; height: 150px; background-image: url('${photo.photo_url}'); background-size: cover; background-position: center; cursor: pointer; position: relative;">
                        ${!isActive ? '<div style="position: absolute; top: 0; right: 0; background: rgba(255, 59, 48, 0.9); color: white; padding: 4px 8px; font-size: 0.7rem; border-radius: 0 0 0 8px;">❌ Отключено</div>' : ''}
                    </div>
                    <div style="padding: 10px; font-size: 0.85rem;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <div style="color: #888; font-size: 0.75rem;">Позиция: <strong>${photo.position}</strong></div>
                            <div style="display: flex; gap: 4px;">
                                ${!isFirst ? `<button onclick="movePhotoUp(${photo.id}); event.stopPropagation();" style="padding: 4px 8px; background: rgba(0, 217, 255, 0.2); border: 1px solid rgba(0, 217, 255, 0.5); color: #00d9ff; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">↑</button>` : ''}
                                ${!isLast ? `<button onclick="movePhotoDown(${photo.id}); event.stopPropagation();" style="padding: 4px 8px; background: rgba(0, 217, 255, 0.2); border: 1px solid rgba(0, 217, 255, 0.5); color: #00d9ff; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">↓</button>` : ''}
                            </div>
                        </div>
                        ${photo.caption ? `<div style="color: #e0e0e0; margin-bottom: 10px; font-size: 0.8rem; max-height: 30px; overflow: hidden;">${photo.caption}</div>` : ''}
                        <div style="display: flex; gap: 4px; margin-top: 6px;">
                            <button onclick="editPhotoCaption(${photo.id}, '${(photo.caption || '').replace(/'/g, "\\'")}'); event.stopPropagation();" style="flex: 1; padding: 5px 2px; background: rgba(131, 56, 236, 0.2); border: 1px solid rgba(131, 56, 236, 0.5); color: #8338ec; border-radius: 4px; font-size: 0.65rem; cursor: pointer;">✏️</button>
                            <button onclick="togglePhotoActive(${photo.id}, ${!isActive}); event.stopPropagation();" style="flex: 1; padding: 5px 2px; background: ${isActive ? 'rgba(0, 217, 255, 0.2)' : 'rgba(255, 59, 48, 0.2)'}; border: 1px solid ${isActive ? 'rgba(0, 217, 255, 0.5)' : 'rgba(255, 59, 48, 0.5)'}; color: ${isActive ? '#00d9ff' : '#ff3b30'}; border-radius: 4px; font-size: 0.65rem; cursor: pointer;">${isActive ? '👁️' : '🚫'}</button>
                            <button onclick="deletePhoto(${photo.id}); event.stopPropagation();" style="flex: 1; padding: 5px 2px; background: rgba(255, 59, 48, 0.2); border: 1px solid rgba(255, 59, 48, 0.5); color: #ff3b30; border-radius: 4px; font-size: 0.65rem; cursor: pointer;">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        gridHTML += `</div>`;
        gallery.innerHTML = gridHTML;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки фото:', error);
        if (gallery) {
            gallery.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #ff3b30;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">⚠️</div>
                    <p style="margin-bottom: 15px;">${error.message}</p>
                    <button onclick="loadMyPhotos()" class="neon-button">🔄 Повторить</button>
                </div>
            `;
        }
    }
}

/**
 * Редактировать подпись к фото
 */
async function editPhotoCaption(photoId, oldCaption) {
    const userToken = localStorage.getItem('user_token');
    const newCaption = prompt('Введите подпись к фото:', oldCaption || '');
    
    if (newCaption === null) return;
    
    try {
        const resp = await fetch('/api/user-photos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userToken,
                updates: [{ id: photoId, caption: newCaption || null }]
            })
        });
        
        const result = await resp.json();
        if (result.error) throw new Error(result.error.message);
        await loadMyPhotos();
    } catch (error) {
        tg.showAlert('❌ Ошибка: ' + error.message);
    }
}

/**
 * Переключить видимость фото
 */
async function togglePhotoActive(photoId, newState) {
    const userToken = localStorage.getItem('user_token');
    
    try {
        const resp = await fetch('/api/user-photos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userToken,
                updates: [{ id: photoId, is_active: newState }]
            })
        });
        
        const result = await resp.json();
        if (result.error) throw new Error(result.error.message);
        await loadMyPhotos();
    } catch (error) {
        tg.showAlert('❌ Ошибка: ' + error.message);
    }
}

/**
 * Удалить фото
 */
async function deletePhoto(photoId) {
    if (!confirm('Удалить фото?')) return;
    
    const userToken = localStorage.getItem('user_token');
    
    try {
        const resp = await fetch(`/api/user-photos?id=${photoId}&userToken=${userToken}`, {
            method: 'DELETE'
        });
        
        const result = await resp.json();
        if (result.error) throw new Error(result.error.message);
        await loadMyPhotos();
    } catch (error) {
        tg.showAlert('❌ Ошибка: ' + error.message);
    }
}

/**
 * Переместить фото вверх
 */
async function movePhotoUp(photoId) {
    const userToken = localStorage.getItem('user_token');
    try {
        const resp = await fetch(`/api/user-photos?userToken=${userToken}`);
        const result = await resp.json();
        if (result.error) throw new Error(result.error.message);
        
        const photos = result.data || [];
        const idx = photos.findIndex(p => p.id === photoId);
        if (idx <= 0) return;
        
        const newOrder = photos.map(p => p.id);
        [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
        
        const patchResp = await fetch('/api/user-photos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userToken, order: newOrder })
        });
        
        const patchResult = await patchResp.json();
        if (patchResult.error) throw new Error(patchResult.error.message);
        await loadMyPhotos();
    } catch (error) {
        tg.showAlert('❌ Ошибка: ' + error.message);
    }
}

/**
 * Переместить фото вниз
 */
async function movePhotoDown(photoId) {
    const userToken = localStorage.getItem('user_token');
    try {
        const resp = await fetch(`/api/user-photos?userToken=${userToken}`);
        const result = await resp.json();
        if (result.error) throw new Error(result.error.message);
        
        const photos = result.data || [];
        const idx = photos.findIndex(p => p.id === photoId);
        if (idx < 0 || idx >= photos.length - 1) return;
        
        const newOrder = photos.map(p => p.id);
        [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
        
        const patchResp = await fetch('/api/user-photos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userToken, order: newOrder })
        });
        
        const patchResult = await patchResp.json();
        if (patchResult.error) throw new Error(patchResult.error.message);
        await loadMyPhotos();
    } catch (error) {
        tg.showAlert('❌ Ошибка: ' + error.message);
    }
}

/**
 * Поменять местами позиции двух фото (drag & drop)
 */
async function swapPhotoPositions(photoId1, photoId2) {
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) return;
        
        console.log(`🔄 Меняем местами фото ${photoId1} и ${photoId2}`);
        
        const response = await fetch('/api/user-photos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userToken, 
                photoId1: parseInt(photoId1),
                photoId2: parseInt(photoId2),
                action: 'swap'
            })
        });
        
        if (response.ok) {
            console.log('✅ Позиции фото обменены');
            // Обновляем галерею через небольшую задержку
            setTimeout(() => {
                loadMyPhotos();
            }, 500);
        } else {
            throw new Error('Ошибка обмена позиций');
        }
    } catch (error) {
        console.error('❌ Ошибка обмена позиций:', error);
        tg.showAlert('Ошибка при изменении порядка');
    }
}

/**
 * Добавить фото при создании анкеты (шаг 9)
 */
async function addAdPhoto() {
    console.log('📸 [addAdPhoto] Начало загрузки фото для анкеты');
    
    // Проверяем количество уже загруженных фото
    const currentPhotos = document.querySelectorAll('#step9PhotoGrid .step9-photo-item');
    if (currentPhotos.length >= 3) {
        tg.showAlert('❌ Максимум 3 фото. Удалите одно фото, чтобы загрузить новое.');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        console.log('📸 [addAdPhoto] Выбран файл:', file.name);
        
        try {
            const addBtn = document.getElementById('addAdPhotoBtn');
            if (addBtn) {
                addBtn.disabled = true;
                addBtn.innerHTML = '<span>⏳ Загрузка...</span>';
            }
            
            let fileToUpload = file;
            
            // Сжимаем если больше 4MB
            if (file.size > 4 * 1024 * 1024 && typeof compressImage === 'function') {
                console.log('🗜️ Сжимаем файл...');
                fileToUpload = await compressImage(file, 4);
            }
            
            const userId = localStorage.getItem('user_token');
            if (!userId) {
                throw new Error('Требуется авторизация');
            }
            
            const photoData = await uploadPhotoToTelegram(fileToUpload, userId);
            
            console.log('📸 [addAdPhoto] photoData received:', photoData);
            
            // Сохраняем в formData
            if (typeof formData !== 'undefined') {
                formData.adPhotoFileId = photoData.file_id;
                formData.adPhotoUrl = photoData.photo_url;
            }
            
            // Показываем превью
            const preview = document.getElementById('adPhotoPreview');
            const img = document.getElementById('adPhotoImage');
            const btn = document.getElementById('addAdPhotoBtn');
            
            console.log('📸 [addAdPhoto] photoData:', photoData);
            
            // Сохраняем фото в БД user_photos
            const userToken = localStorage.getItem('user_token');
            await fetch('/api/user-photos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userToken,
                    fileId: photoData.file_id,
                    photoUrl: photoData.photo_url
                })
            });
            
            // Перезагружаем галерею
            loadMyPhotosForStep9();
            
            tg.showAlert('✅ Фото добавлено!');
            
        } catch (error) {
            console.error('❌ Ошибка загрузки фото:', error);
            tg.showAlert('❌ ' + (error.message || 'Ошибка загрузки'));
        } finally {
            const addBtn = document.getElementById('addAdPhotoBtn');
            if (addBtn) {
                addBtn.disabled = false;
                addBtn.innerHTML = '<span>📷 Выбрать фото</span>';
            }
        }
    };
    
    input.click();
}

/**
 * Удалить фото из анкеты
 */
function removeAdPhoto() {
    if (typeof formData !== 'undefined') {
        delete formData.adPhotoFileId;
        delete formData.adPhotoUrl;
    }
    
    const preview = document.getElementById('adPhotoPreview');
    const btn = document.getElementById('addAdPhotoBtn');
    
    if (preview) preview.style.display = 'none';
    if (btn) btn.style.display = 'block';
    
    console.log('🗑️ Фото удалено из анкеты');
}

/**
 * Загрузить существующие фото на шаге 9
 */
async function loadMyPhotosForStep9() {
    try {
        console.log('📸 [loadMyPhotosForStep9] Загрузка фото...');
        const userToken = localStorage.getItem('user_token');
        if (!userToken) return;
        
        const resp = await fetch(`/api/user-photos?userToken=${userToken}`);
        const result = await resp.json();
        
        const container = document.getElementById('step9PhotoGallery');
        if (!container) {
            console.error('❌ step9PhotoGallery контейнер не найден');
            return;
        }
        
        if (result.error || !result.data || result.data.length === 0) {
            console.log('ℹ️ Нет фото в галерее');
            container.innerHTML = `
                <div style="text-align: center; padding: 15px; color: var(--text-gray);">
                    <p style="margin: 0;">📷 У вас пока нет фото</p>
                    <p style="margin: 8px 0 0 0; font-size: 13px;">Загрузите фото ниже</p>
                </div>
            `;
            container.style.display = 'block';
            return;
        }
        
        const photos = result.data;
        console.log(`✅ Загружено ${photos.length} фото`);
        
        // Сохраняем порядок фото глобально
        window.step9PhotoOrder = photos.map(p => p.id);
        
        container.innerHTML = '';
        container.style.display = 'block';
        
        // Проверяем Premium статус (с учётом даты истечения)
        let isPremium = false;
        if (typeof userPremiumStatus !== 'undefined' && userPremiumStatus?.isPremium) {
            // Проверяем, не истёк ли премиум
            if (userPremiumStatus.premiumUntil) {
                isPremium = new Date(userPremiumStatus.premiumUntil) > new Date();
            } else {
                // Если premiumUntil не задан - считаем бессрочным
                isPremium = true;
            }
        }
        console.log('📸 [loadMyPhotosForStep9] isPremium:', isPremium);
        
        // Инфо блок с лимитами
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = `
            background: rgba(0, 255, 255, 0.1);
            border: 1px solid rgba(0, 255, 255, 0.3);
            border-radius: 8px;
            padding: 10px 12px;
            margin-bottom: 12px;
            font-size: 11px;
            text-align: center;
        `;
        infoDiv.innerHTML = `
            <div style="color: var(--neon-cyan); margin-bottom: 6px;">📷 Можно загрузить до 3 фото</div>
            <div style="color: ${isPremium ? 'var(--neon-green)' : 'var(--text-gray)'}; font-size: 10px;">
                ${isPremium 
                    ? '✨ PRO: все 3 фото будут видны в анкете' 
                    : '🔒 FREE: только 1 фото будет активно. Получите PRO для всех 3!'
                }
            </div>
        `;
        container.appendChild(infoDiv);
        
        // Горизонтальная сетка фото (3 в ряд)
        const gridDiv = document.createElement('div');
        gridDiv.id = 'step9PhotoGrid';
        gridDiv.style.cssText = `
            display: flex !important;
            flex-direction: row !important;
            gap: 8px;
            justify-content: center;
            flex-wrap: nowrap !important;
            overflow-x: auto;
            padding: 4px 0;
            align-items: flex-start;
        `;
        
        photos.slice(0, 3).forEach((photo, index) => {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'step9-photo-item';
            photoDiv.dataset.photoId = photo.id;
            photoDiv.draggable = true;
            const isSelected = typeof formData !== 'undefined' && formData?.selectedPhotoId === photo.id;
            photoDiv.style.cssText = `
                position: relative;
                border: 2px solid ${isSelected ? 'var(--neon-pink)' : 'rgba(0, 255, 255, 0.5)'};
                border-radius: 8px;
                overflow: hidden;
                width: 90px !important;
                height: 90px !important;
                min-width: 90px !important;
                max-width: 90px !important;
                flex-shrink: 0;
                cursor: grab;
                transition: transform 0.2s, border-color 0.2s;
                background: #1a1a2e;
                display: inline-block !important;
            `;
            
            // Drag events
            photoDiv.addEventListener('dragstart', handlePhotoDragStart);
            photoDiv.addEventListener('dragend', handlePhotoDragEnd);
            photoDiv.addEventListener('dragover', handlePhotoDragOver);
            photoDiv.addEventListener('drop', handlePhotoDrop);
            photoDiv.addEventListener('dragenter', handlePhotoDragEnter);
            photoDiv.addEventListener('dragleave', handlePhotoDragLeave);
            
            // Touch events для мобильных
            photoDiv.addEventListener('touchstart', handlePhotoTouchStart, { passive: false });
            photoDiv.addEventListener('touchmove', handlePhotoTouchMove, { passive: false });
            photoDiv.addEventListener('touchend', handlePhotoTouchEnd);
            
            // Клик для выбора
            photoDiv.onclick = (e) => {
                if (!window.isDragging) {
                    selectStep9Photo(photo.id, photo.photo_url, photo.file_id);
                }
            };
            
            const img = document.createElement('img');
            img.src = photo.photo_url;
            img.alt = `Фото ${index + 1}`;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; pointer-events: none;';
            img.draggable = false;
            photoDiv.appendChild(img);
            
            // Для FREE аккаунтов затемняем 2-3 фото
            if (!isPremium && index > 0) {
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                `;
                overlay.innerHTML = `
                    <div style="color: #888; font-size: 10px; text-align: center;">
                        <div style="font-size: 16px;">🔒</div>
                        <div>Скрыто</div>
                    </div>
                `;
                photoDiv.appendChild(overlay);
            }
            
            // Номер фото
            const numBadge = document.createElement('div');
            numBadge.style.cssText = `
                position: absolute;
                top: 4px;
                left: 4px;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            `;
            numBadge.textContent = index + 1;
            photoDiv.appendChild(numBadge);
            
            // Кнопка удаления
            const delBtn = document.createElement('button');
            delBtn.innerHTML = '✕';
            delBtn.style.cssText = `
                position: absolute;
                top: 4px;
                right: 4px;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: rgba(255, 50, 50, 0.9);
                color: white;
                border: none;
                cursor: pointer;
                font-size: 11px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                line-height: 1;
            `;
            delBtn.onclick = async (e) => {
                e.stopPropagation();
                e.preventDefault();
                tg.showConfirm('Удалить это фото?', async (confirmed) => {
                    if (confirmed) {
                        await deleteStep9Photo(photo.id);
                    }
                });
            };
            photoDiv.appendChild(delBtn);
            
            gridDiv.appendChild(photoDiv);
        });
        
        container.appendChild(gridDiv);
        
    } catch (error) {
        console.error('Ошибка загрузки фото для шага 9:', error);
    }
}

// ===== DRAG AND DROP HANDLERS =====
let draggedElement = null;
let draggedPhotoId = null;

function handlePhotoDragStart(e) {
    window.isDragging = true;
    draggedElement = this;
    draggedPhotoId = this.dataset.photoId;
    this.style.opacity = '0.5';
    this.style.cursor = 'grabbing';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedPhotoId);
}

function handlePhotoDragEnd(e) {
    window.isDragging = false;
    this.style.opacity = '1';
    this.style.cursor = 'grab';
    document.querySelectorAll('.step9-photo-item').forEach(item => {
        item.style.transform = '';
        item.classList.remove('drag-over');
    });
    draggedElement = null;
}

function handlePhotoDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handlePhotoDragEnter(e) {
    e.preventDefault();
    if (this !== draggedElement) {
        this.style.transform = 'scale(1.05)';
        this.classList.add('drag-over');
    }
}

function handlePhotoDragLeave(e) {
    this.style.transform = '';
    this.classList.remove('drag-over');
}

function handlePhotoDrop(e) {
    e.preventDefault();
    if (this !== draggedElement && draggedElement) {
        const grid = this.parentNode;
        const items = Array.from(grid.children);
        const fromIndex = items.indexOf(draggedElement);
        const toIndex = items.indexOf(this);
        
        if (fromIndex < toIndex) {
            grid.insertBefore(draggedElement, this.nextSibling);
        } else {
            grid.insertBefore(draggedElement, this);
        }
        
        // Обновляем номера
        updatePhotoNumbers();
        // Сохраняем новый порядок
        savePhotoOrder();
    }
    this.style.transform = '';
    this.classList.remove('drag-over');
}

// ===== TOUCH HANDLERS FOR MOBILE =====
let touchStartY = 0;
let touchStartX = 0;
let touchElement = null;
let touchTimeout = null;

function handlePhotoTouchStart(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchElement = this;
    
    // Долгое нажатие для начала перетаскивания
    touchTimeout = setTimeout(() => {
        window.isDragging = true;
        this.style.opacity = '0.7';
        this.style.transform = 'scale(1.1)';
        this.style.zIndex = '100';
        navigator.vibrate && navigator.vibrate(50);
    }, 300);
}

function handlePhotoTouchMove(e) {
    if (!window.isDragging) {
        clearTimeout(touchTimeout);
        return;
    }
    e.preventDefault();
    
    const touch = e.touches[0];
    const grid = document.getElementById('step9PhotoGrid');
    if (!grid) return;
    
    const items = Array.from(grid.querySelectorAll('.step9-photo-item'));
    
    // Находим элемент под пальцем
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    const photoUnder = elementUnder?.closest('.step9-photo-item');
    
    items.forEach(item => {
        if (item === photoUnder && item !== touchElement) {
            item.style.transform = 'scale(0.95)';
        } else if (item !== touchElement) {
            item.style.transform = '';
        }
    });
}

function handlePhotoTouchEnd(e) {
    clearTimeout(touchTimeout);
    
    if (window.isDragging && touchElement) {
        const touch = e.changedTouches[0];
        const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
        const photoUnder = elementUnder?.closest('.step9-photo-item');
        
        if (photoUnder && photoUnder !== touchElement) {
            const grid = photoUnder.parentNode;
            const items = Array.from(grid.children);
            const fromIndex = items.indexOf(touchElement);
            const toIndex = items.indexOf(photoUnder);
            
            if (fromIndex < toIndex) {
                grid.insertBefore(touchElement, photoUnder.nextSibling);
            } else {
                grid.insertBefore(touchElement, photoUnder);
            }
            
            updatePhotoNumbers();
            savePhotoOrder();
        }
        
        touchElement.style.opacity = '1';
        touchElement.style.transform = '';
        touchElement.style.zIndex = '';
    }
    
    window.isDragging = false;
    touchElement = null;
    
    document.querySelectorAll('.step9-photo-item').forEach(item => {
        item.style.transform = '';
    });
}

function updatePhotoNumbers() {
    const grid = document.getElementById('step9PhotoGrid');
    if (!grid) return;
    
    const isPremium = typeof userPremiumStatus !== 'undefined' && userPremiumStatus?.isPremium;
    const items = grid.querySelectorAll('.step9-photo-item');
    
    items.forEach((item, index) => {
        // Обновляем номер
        const numBadge = item.querySelector('div[style*="border-radius: 50%"]:not(button)');
        if (numBadge && numBadge.style.background.includes('rgba(0, 0, 0')) {
            numBadge.textContent = index + 1;
        }
        
        // Обновляем оверлей "Скрыто" - удаляем старый и добавляем новый если нужно
        const existingOverlay = item.querySelector('div[style*="background: rgba(0, 0, 0, 0.7)"]');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Для FREE аккаунтов затемняем 2-3 фото (index > 0)
        if (!isPremium && index > 0) {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                pointer-events: none;
            `;
            overlay.innerHTML = `
                <div style="color: #888; font-size: 10px; text-align: center;">
                    <div style="font-size: 16px;">🔒</div>
                    <div>Скрыто</div>
                </div>
            `;
            item.appendChild(overlay);
        }
    });
}

function savePhotoOrder() {
    const grid = document.getElementById('step9PhotoGrid');
    if (!grid) return;
    
    const items = grid.querySelectorAll('.step9-photo-item');
    const newOrder = Array.from(items).map(item => item.dataset.photoId);
    window.step9PhotoOrder = newOrder;
    
    console.log('📸 Новый порядок фото:', newOrder);
    // TODO: Сохранить порядок на сервере если нужно
}

/**
 * Выбрать фото на шаге 9
 */
function selectStep9Photo(photoId, photoUrl, fileId) {
    if (typeof formData !== 'undefined') {
        formData.selectedPhotoId = photoId;
        formData.adPhotoUrl = photoUrl;
        formData.adPhotoFileId = fileId;
    }
    
    // Обновляем UI - отмечаем выбранное фото
    document.querySelectorAll('.step9-photo-item').forEach(item => {
        item.style.borderColor = 'var(--neon-cyan)';
    });
    
    if (event && event.currentTarget) {
        event.currentTarget.style.borderColor = 'var(--neon-pink)';
    }
    
    console.log('📸 Выбрано фото:', photoId);
    tg.showAlert('✅ Фото выбрано для анкеты!');
}

/**
 * Удалить фото на шаге 9 (удаляет из галереи и всех анкет)
 */
async function deleteStep9Photo(photoId) {
    let errorMessage = '';
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            errorMessage = 'User token not found';
            throw new Error(errorMessage);
        }
        
        console.log('🗑️ Удаляем фото ID:', photoId);
        
        const response = await fetch('/api/user-photos', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userToken, photoId })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            errorMessage = `HTTP ${response.status}: ${errorData.error || response.statusText}`;
            throw new Error(errorMessage);
        }
        
        console.log('✅ Фото удалено');
        
        // Удаляем элемент фото из DOM
        const photoElement = document.querySelector(`[data-photo-id="${photoId}"]`);
        if (photoElement) {
            photoElement.remove();
        }
        
        // Обновляем номера и оверлеи
        updatePhotoNumbers();
        
        // Проверяем, остались ли фото
        const gridDiv = document.getElementById('step9PhotoGrid');
        if (gridDiv && gridDiv.children.length === 0) {
            const galleryContainer = document.getElementById('step9PhotoGallery');
            if (galleryContainer) {
                galleryContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        <p style="margin: 0;">📷 У вас пока нет фото в галерее</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px;">Добавьте фото ниже</p>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        const errorDetails = {
            photoId,
            message: error.message || String(error),
            stack: error.stack || '',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
        
        console.error('❌ Photo deletion error:', errorDetails);
        
        // Отправляем ошибку на сервер для логирования
        try {
            await fetch('/api/log-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE_PHOTO_STEP9',
                    error: errorDetails.message,
                    stack: errorDetails.stack,
                    photoId: photoId,
                    userAgent: errorDetails.userAgent,
                    timestamp: errorDetails.timestamp
                })
            }).catch(err => console.log('⚠️ Could not send error to server:', err.message));
        } catch (logErr) {
            console.log('⚠️ Error logging failed:', logErr);
        }
        
        // Показываем alert с информацией об ошибке
        const fullError = `❌ Ошибка удаления фото:\n\nID: ${photoId}\n${errorDetails.message}`;
        if (typeof tg !== 'undefined' && tg.showAlert) {
            tg.showAlert(fullError);
        } else {
            alert(fullError);
        }
    }
}

/**
 * ===== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ =====
 */

/**
 * Показать меню выбора источника фото
 */
function showPhotoSourceMenu() {
    if (!window.Telegram || !window.Telegram.WebApp) {
        document.getElementById('photoInput').click();
        return;
    }
    
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

/**
 * Закрыть меню выбора источника фото
 */
function closePhotoSourceMenu() {
    const menu = document.querySelector('.photo-source-menu');
    if (menu) menu.remove();
}

/**
 * Открыть галерею для выбора фото
 */
function openGallery() {
    closePhotoSourceMenu();
    const galleryInput = document.getElementById('photoInput');
    if (galleryInput) {
        galleryInput.value = '';
        galleryInput.click();
    }
}

/**
 * Обработчик выбора фото из галереи
 */
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
        
        if (!preview || !img) return;
        
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

/**
 * Удалить выбранное фото
 */
function removePhoto() {
    selectedPhoto = null;
    const input = document.getElementById('photoInput');
    const preview = document.getElementById('photoPreview');
    if (input) input.value = '';
    if (preview) preview.style.display = 'none';
}

/**
 * Показать модальное окно с фото
 */
function showPhotoModal(photoUrl) {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('photoModalImage');
    
    if (!modal || !modalImage) return;
    
    modalImage.style.backgroundImage = `url('${photoUrl}')`;
    modalImage.oncontextmenu = () => false;
    modal.classList.add('active');
    modal.style.display = 'flex';
    modal.oncontextmenu = () => false;
}

/**
 * Закрыть модальное окно с фото
 */
function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('photoModalImage');
    
    if (!modal) return;
    
    modal.classList.remove('active');
    modal.style.display = 'none';
    if (modalImage) modalImage.style.backgroundImage = '';
    modal.oncontextmenu = null;
}

/**
 * Добавить фото из галереи устройства
 */
async function addPhotoFromGallery() {
    const userToken = localStorage.getItem('user_token');
    const userId = getCurrentUserId();
    
    if (!userToken) {
        tg.showAlert('Требуется авторизация');
        return;
    }
    
    // Проверяем количество уже загруженных фото
    const currentPhotos = document.querySelectorAll('#photosGallery .photo-item');
    if (currentPhotos.length >= 3) {
        tg.showAlert('❌ Максимум 3 фото. Удалите одно фото, чтобы загрузить новое.');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        try {
            const gallery = document.getElementById('photosGallery');
            if (gallery) gallery.innerHTML = '<div class="loading-spinner"></div><p>Загрузка фото...</p>';
            
            const photoData = await uploadPhotoToTelegram(file, userId);
            
            const resp = await fetch('/api/user-photos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userToken,
                    tgId: userId,
                    fileId: photoData.file_id,
                    photoUrl: photoData.photo_url,
                    caption: null
                })
            });
            
            const result = await resp.json();
            if (result.error) throw new Error(result.error.message);
            
            await loadMyPhotos();
            
            if (result.overLimit) {
                tg.showAlert(`⚠️ Достигнут лимит: ${result.limit} фото.

Лишние фото деактивированы.`);
            }
        } catch (error) {
            console.error('❌ Error adding photo:', error);
            tg.showAlert('❌ Ошибка: ' + error.message);
            await loadMyPhotos();
        }
    };
    
    document.body.appendChild(input);
    input.click();
    setTimeout(() => input.remove(), 1000);
}

/**
 * Сделать снимок с камеры
 */
function capturePhoto() {
    const video = document.getElementById('cameraPreview');
    const canvas = document.getElementById('cameraCanvas');
    
    if (!video || !canvas) {
        console.error('❌ [PHOTOS] Элементы камеры не найдены');
        return;
    }
    
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
        window.selectedPhoto = file;
        
        // Показываем превью
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('photoPreview');
            const img = document.getElementById('photoPreviewImage');
            if (img) img.src = e.target.result;
            if (preview) preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
        
    }, 'image/jpeg', 0.9);
}

/**
 * Закрыть модальное окно камеры
 */
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

/**
 * Переключить камеру (селфи/задняя)
 */
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
        if (video) {
            video.srcObject = stream;
            window.currentCameraStream = stream;
        }
        
        console.log('📷 [PHOTOS] Камера переключена:', window.currentFacingMode === 'user' ? 'Селфи' : 'Задняя');
        
    } catch (error) {
        console.error('❌ [PHOTOS] Ошибка переключения камеры:', error);
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('Не удалось переключить камеру');
        }
    }
}

// Экспорт функций в глобальную область
window.showMyPhotos = showMyPhotos;
window.loadMyPhotos = loadMyPhotos;
window.addAdPhoto = addAdPhoto;
window.removeAdPhoto = removeAdPhoto;
window.deletePhoto = deletePhoto;
window.editPhotoCaption = editPhotoCaption;
window.togglePhotoActive = togglePhotoActive;
window.movePhotoUp = movePhotoUp;
window.movePhotoDown = movePhotoDown;
window.loadMyPhotosForStep9 = loadMyPhotosForStep9;
window.selectStep9Photo = selectStep9Photo;
window.deleteStep9Photo = deleteStep9Photo;
window.updatePhotoNumbers = updatePhotoNumbers;
window.savePhotoOrder = savePhotoOrder;
window.showPhotoSourceMenu = showPhotoSourceMenu;
window.closePhotoSourceMenu = closePhotoSourceMenu;
window.openGallery = openGallery;
window.handlePhotoSelect = handlePhotoSelect;
window.removePhoto = removePhoto;
window.showPhotoModal = showPhotoModal;
window.closePhotoModal = closePhotoModal;
window.addPhotoFromGallery = addPhotoFromGallery;
window.getPhotoUrl = getPhotoUrl;
window.compressImage = compressImage;
window.capturePhoto = capturePhoto;
window.closeCameraModal = closeCameraModal;
window.switchCamera = switchCamera;
window.swapPhotoPositions = swapPhotoPositions;
window.openCamera = openCamera;
window.deletePhotoFromStep9 = deletePhotoFromStep9;

/**
 * Открыть камеру для съёмки
 */
async function openCamera() {
    if (typeof closePhotoSourceMenu === 'function') closePhotoSourceMenu();
    
    // Проверяем поддержку getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback на обычный input с capture
        const cameraInput = document.getElementById('cameraInput');
        if (cameraInput) {
            cameraInput.value = '';
            cameraInput.click();
        }
        return;
    }
    
    try {
        // Создаем модальное окно с камерой
        const cameraModal = document.createElement('div');
        cameraModal.id = 'cameraModal';
        cameraModal.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.95); z-index: 10000;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
            ">
                <video id="cameraPreview" autoplay playsinline style="
                    max-width: 100%; max-height: 70vh; border-radius: 12px;
                "></video>
                <div style="display: flex; gap: 15px; margin-top: 20px;">
                    <button onclick="switchCamera()" style="
                        background: rgba(131, 56, 236, 0.2); border: 2px solid var(--neon-purple);
                        border-radius: 50%; width: 70px; height: 70px; font-size: 32px; cursor: pointer;
                    ">🔄</button>
                    <button onclick="capturePhoto()" style="
                        background: rgba(0, 217, 255, 0.2); border: 2px solid var(--neon-cyan);
                        border-radius: 50%; width: 70px; height: 70px; font-size: 32px; cursor: pointer;
                    ">📸</button>
                    <button onclick="closeCameraModal()" style="
                        background: rgba(255, 0, 102, 0.2); border: 2px solid var(--neon-pink);
                        border-radius: 50%; width: 70px; height: 70px; font-size: 32px; cursor: pointer;
                    ">❌</button>
                </div>
            </div>
        `;
        document.body.appendChild(cameraModal);
        
        // Запускаем камеру
        window.currentFacingMode = 'environment';
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: window.currentFacingMode }
        });
        
        const video = document.getElementById('cameraPreview');
        if (video) {
            video.srcObject = stream;
            window.currentCameraStream = stream;
        }
        
    } catch (error) {
        console.error('❌ [PHOTOS] Ошибка открытия камеры:', error);
        // Fallback на input
        const cameraInput = document.getElementById('cameraInput');
        if (cameraInput) {
            cameraInput.value = '';
            cameraInput.click();
        }
    }
}

/**
 * Удалить фото на шаге 9 (удаляет из галереи и всех анкет)
 */
async function deletePhotoFromStep9(photoId) {
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            throw new Error('User token not found');
        }
        
        console.log('🗑️ Удаляем фото ID:', photoId);
        
        const response = await fetch('/api/user-photos', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userToken, photoId })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        console.log('✅ Фото удалено');
        
        // Удаляем элемент из DOM
        const photoElement = document.querySelector(`[data-photo-id="${photoId}"]`);
        if (photoElement && photoElement.parentElement) {
            photoElement.parentElement.remove();
        }
        
        // Проверяем, остались ли фото
        const gridDiv = document.getElementById('step9PhotoGrid');
        if (gridDiv && gridDiv.children.length === 0) {
            const galleryContainer = document.getElementById('step9PhotoGallery');
            if (galleryContainer) {
                galleryContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        <p>📷 У вас пока нет фото в галерее</p>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('❌ Ошибка удаления фото:', error);
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('Ошибка при удалении фото');
        }
    }
}

console.log('✅ [PHOTOS] Модуль фото инициализирован');

} catch(e) { console.error('❌ Ошибка в модуле photos.js:', e); }
})();

// ========== premium.js (34.9 KB) ==========
(function() {
try {
/**
 * Модуль Premium функционала (premium.js)
 * 
 * Функции:
 * - Загрузка и управление Premium статусом
 * - Показ и управление тарифами
 * - Проверка лимитов и ограничений
 * - Триал и реферальные награды
 */

console.log('💎 [PREMIUM] Инициализация модуля Premium');

/**
 * ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
 */

let userPremiumStatus = {
    isPremium: false,
    country: 'KZ',
    limits: null
};

/**
 * ===== ОСНОВНЫЕ ФУНКЦИИ =====
 */

/**
 * Загрузить Premium статус пользователя
 */
async function loadPremiumStatus() {
    try {
        console.log('💎 [PREMIUM] Загрузка Premium статуса');
        
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        if (!userId && !userToken) {
            console.log('⚠️ [PREMIUM] Пользователь не авторизован');
            return;
        }
        
        const response = await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-user-status',
                params: userId ? { userId } : { userToken }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            console.error('❌ [PREMIUM] Ошибка загрузки статуса:', result.error);
            return;
        }
        
        userPremiumStatus = result.data;
        
        console.log('✅ [PREMIUM] Статус загружен:', {
            isPremium: userPremiumStatus.isPremium,
            premiumUntil: userPremiumStatus.premiumUntil
        });
        
        updatePremiumUI();
        updateAdLimitBadge();
        
    } catch (error) {
        console.error('❌ [PREMIUM] Ошибка loadPremiumStatus:', error);
    }
}

/**
 * Показать модальное окно тарифов
 */
async function showPremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (!modal) {
        console.error('❌ [PREMIUM] Модальное окно не найдено');
        return;
    }
    
    modal.style.display = 'flex';
    
    // Обновляем статус
    await loadPremiumStatus();
    updatePremiumModalButtons();
    updateCurrentSubscriptionInfo();
}

/**
 * Закрыть модальное окно тарифов
 */
function closePremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Обновить UI переключателя Premium
 */
function updatePremiumUI() {
    const freeBtn = document.getElementById('freeBtn');
    const proBtn = document.getElementById('proBtn');
    
    if (!freeBtn || !proBtn) return;
    
    // Сбрасываем классы
    freeBtn.classList.remove('active', 'free');
    proBtn.classList.remove('active', 'pro');
    
    if (userPremiumStatus.isPremium) {
        proBtn.classList.add('active', 'pro');
        if (userPremiumStatus.premiumUntil) {
            const date = new Date(userPremiumStatus.premiumUntil);
            const formatted = date.toLocaleDateString('ru-RU');
            proBtn.title = `PRO до ${formatted}`;
        }
    } else {
        freeBtn.classList.add('active', 'free');
    }
}

/**
 * Обновить счётчик лимита анкет
 */
function updateAdLimitBadge() {
    const badge = document.getElementById('adLimitBadge');
    
    if (!badge || !userPremiumStatus.limits) return;
    
    const adsLimit = userPremiumStatus.limits.ads;
    const used = adsLimit?.used || 0;
    const max = adsLimit?.max || 1;
    const remaining = adsLimit?.remaining || 0;
    
    if (remaining === 0) {
        badge.innerHTML = `${used}/${max} 🚫<br><span style="font-size: 0.7em;">Лимит исчерпан</span>`;
        badge.className = 'limit-badge danger';
        badge.style.display = 'block';
    } else {
        badge.textContent = `${used}/${max}`;
        badge.className = 'limit-badge';
        badge.style.display = 'block';
    }
    
    badge.title = `Использовано: ${used} / ${max}. Осталось: ${remaining}`;
}

/**
 * Обновить кнопки в модальном окне
 */
function updatePremiumModalButtons() {
    const buyBtn = document.getElementById('buyPremiumBtn');
    const referralBtn = document.getElementById('referralBtn');
    const trialBtn = document.getElementById('trialBtn');
    const dollarBtn = document.getElementById('dollarPaymentBtn');
    const freeBtn = document.querySelector('.pricing-card:not(.featured) .pricing-btn');
    
    if (!userPremiumStatus.isPremium) {
        // Пользователь FREE - показываем кнопки покупки
        if (freeBtn) {
            freeBtn.textContent = 'Текущий план (FREE)';
            freeBtn.disabled = true;
        }
        
        // Проверяем если это email пользователь
        const emailUser = isEmailUser();
        
        if (emailUser) {
            // Email пользователи не видят Stars и Referral
            if (buyBtn) buyBtn.style.display = 'none';
            if (referralBtn) referralBtn.style.display = 'none';
            if (dollarBtn) dollarBtn.style.display = 'block';
        } else {
            // Telegram пользователи видят все
            if (buyBtn) buyBtn.style.display = 'block';
            if (referralBtn) referralBtn.style.display = 'block';
            if (dollarBtn) dollarBtn.style.display = 'block';
        }
        
        // Trial показываем только если не использован
        if (trialBtn) {
            trialBtn.style.display = (userPremiumStatus.trial7h_used ? 'none' : 'block');
        }
    } else {
        // Пользователь PRO - скрываем все кнопки покупки
        if (freeBtn) {
            freeBtn.textContent = '✅ У вас PRO подписка';
            freeBtn.disabled = true;
        }
        if (buyBtn) buyBtn.style.display = 'none';
        if (referralBtn) referralBtn.style.display = 'none';
        if (trialBtn) trialBtn.style.display = 'none';
        if (dollarBtn) dollarBtn.style.display = 'none';
    }
}

/**
 * Обновить информацию о текущей подписке
 */
function updateCurrentSubscriptionInfo() {
    const infoBlock = document.getElementById('currentSubscriptionInfo');
    const detailsDiv = document.getElementById('subscriptionDetails');
    
    if (!infoBlock || !detailsDiv) return;
    
    if (userPremiumStatus.isPremium) {
        const premiumSource = userPremiumStatus.premiumSource || 'paid';
        let subscriptionType = '⭐ PRO подписка';
        
        if (premiumSource === 'female_bonus') {
            subscriptionType = '💝 Бонус для девушек';
        } else if (premiumSource === 'trial') {
            subscriptionType = '🎁 Пробный период';
        } else if (premiumSource === 'referral') {
            subscriptionType = '🎉 Реферальная программа';
        }
        
        let details = subscriptionType;
        
        if (userPremiumStatus.premiumUntil) {
            const until = new Date(userPremiumStatus.premiumUntil);
            const formatted = until.toLocaleDateString('ru-RU', { 
                day: '2-digit', 
                month: '2-digit', 
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Вычисляем оставшееся время
            const diff = until.getTime() - Date.now();
            if (diff > 0) {
                const days = Math.floor(diff / (1000*60*60*24));
                const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
                details += `<br>📅 До: ${formatted}<br>⏱️ Осталось: ${days}д ${hours}ч`;
            }
        }
        
        detailsDiv.innerHTML = details;
        infoBlock.style.display = 'block';
    } else {
        infoBlock.style.display = 'none';
    }
}

/**
 * ===== ТРИАЛ И НАГРАДЫ =====
 */

/**
 * Активировать 7-часовой триал
 */
async function activatePremiumTrial7h() {
    try {
        console.log('🎁 [PREMIUM] Активация 7h триала');
        
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        if (!userId && !userToken) {
            tg.showAlert('Требуется авторизация');
            return;
        }
        
        const response = await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'toggle-premium',
                params: { 
                    userId: userToken || userId,
                    trial7h: true
                }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            tg.showAlert('Ошибка активации триала');
            return;
        }
        
        await loadPremiumStatus();
        userPremiumStatus.trial7h_used = true;
        
        const until = new Date(result.data.premiumUntil);
        const timeStr = until.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        tg.showAlert(`🎉 7 часов PRO активированы!\n\nДо: ${timeStr}\n\nПосле этого вернёшься в FREE. Пригласи друга для месяца PRO!`, () => {
            closePremiumModal();
        });
        
    } catch (error) {
        console.error('❌ [PREMIUM] Ошибка активации триала:', error);
    }
}

/**
 * ===== ФУНКЦИИ ЛИМИТОВ =====
 */

/**
 * Проверить лимит фото
 */
async function checkPhotoLimit() {
    try {
        const userId = getCurrentUserId();
        if (!userId) return { canSend: false };
        
        const response = await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'check-photo-limit',
                params: { userId }
            })
        });
        
        const result = await response.json();
        
        if (result.data?.canSend === false) {
            return {
                canSend: false,
                reason: `Лимит фото исчерпан!\n\nFREE: 5 фото\nПро: безлимит\n\nОформите PRO для безлимита!`
            };
        }
        
        return { canSend: true };
        
    } catch (error) {
        console.error('❌ [PREMIUM] Ошибка проверки лимита фото:', error);
        return { canSend: true };
    }
}

/**
 * Увеличить счётчик фото после успешной отправки
 */
async function incrementPhotoCount() {
    try {
        const userId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;
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
        console.error('❌ [PREMIUM] Ошибка увеличения счётчика фото:', error);
    }
}

/**
 * Проверить является ли пользователь email пользователем
 */
function isEmailUser() {
    const userToken = localStorage.getItem('user_token');
    const userId = localStorage.getItem('user_id');
    const userEmail = localStorage.getItem('user_email');
    
    // Если есть email в localStorage
    if (userEmail) return true;
    
    // Если длинный токен и нет короткого ID
    if (userToken && userToken.length > 20 && (!userId || userId.length > 15)) {
        return true;
    }
    
    return false;
}

/**
 * ===== ПОКУПКА И ОПЛАТА =====
 */

// Глобальные переменные для покупки
let selectedPremiumMonths = 1;
let selectedPremiumPrice = { stars: 0, discount: 0 };

/**
 * Показать модальное окно покупки Stars
 */
function showStarsPurchaseModal() {
    const modal = document.getElementById('starsPurchaseModal');
    if (modal) {
        modal.style.display = 'flex';
        const slider = document.getElementById('premiumSlider');
        if (slider) {
            slider.value = 1;
            updatePremiumPricing(1);
        }
    }
}

/**
 * Закрыть модальное окно покупки Stars
 */
function closeStarsPurchaseModal() {
    const modal = document.getElementById('starsPurchaseModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Обновить цену при движении слайдера
 */
async function updatePremiumPricing(months) {
    selectedPremiumMonths = parseInt(months);
    
    try {
        const response = await fetch(`/api/premium/calculate?months=${months}`);
        const data = await response.json();
        
        if (data.error) {
            console.error('Ошибка расчёта цены:', data.error);
            return;
        }
        
        selectedPremiumPrice = {
            stars: data.stars,
            discount: data.discount
        };
        
        const durationLabel = document.getElementById('premiumDurationLabel');
        const priceLabel = document.getElementById('premiumPrice');
        const discountLabel = document.getElementById('premiumDiscount');
        
        const monthWord = months == 1 ? 'месяц' : (months >= 2 && months <= 4) ? 'месяца' : 'месяцев';
        
        if (durationLabel) durationLabel.textContent = `${months} ${monthWord}`;
        if (priceLabel) priceLabel.textContent = `${data.stars} ⭐`;
        
        if (discountLabel) {
            if (data.discount > 0) {
                discountLabel.textContent = `🔥 Скидка ${data.discount}%`;
                discountLabel.style.display = 'block';
            } else {
                discountLabel.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Ошибка обновления цены:', error);
    }
}

/**
 * Покупка PRO с выбранным сроком
 */
async function buyPremiumWithDuration() {
    try {
        const isTelegramWebApp = window.Telegram?.WebApp?.platform !== 'unknown' && !!window.Telegram?.WebApp?.initData;
        
        if (!isTelegramWebApp) {
            tg.showAlert('💳 Покупка доступна только в Telegram!\n\nОткройте приложение через @anonimka_kz_bot');
            return;
        }
        
        const userId = getCurrentUserId();
        if (!userId || userId.startsWith('web_')) {
            tg.showAlert('Необходима авторизация через Telegram');
            return;
        }
        
        closeStarsPurchaseModal();
        closePremiumModal();
        
        const monthWord = selectedPremiumMonths === 1 ? 'месяц' : 
                         (selectedPremiumMonths >= 2 && selectedPremiumMonths <= 4) ? 'месяца' : 'месяцев';
        
        let confirmText = `💳 Покупка PRO подписки\n\n` +
                         `⏱️ Срок: ${selectedPremiumMonths} ${monthWord}\n` +
                         `💰 Стоимость: ${selectedPremiumPrice.stars} Stars`;
        
        if (selectedPremiumPrice.discount > 0) {
            confirmText += `\n🔥 Скидка: ${selectedPremiumPrice.discount}%`;
        }
        
        confirmText += '\n\n✨ Что входит:\n• 3 анкеты/день\n• Безлимит фото\n• Закрепление 3×1ч/день\n• Значок PRO\n\nОткрыть бота для оплаты?';
        
        tg.showConfirm(confirmText, (confirmed) => {
            if (confirmed) {
                const startParam = `buy_premium_${selectedPremiumMonths}m`;
                try {
                    tg.close();
                    const botUrl = `https://t.me/anonimka_kz_bot?start=${startParam}`;
                    if (tg.openTelegramLink) {
                        tg.openTelegramLink(botUrl);
                    } else {
                        window.open(botUrl, '_blank');
                    }
                } catch (error) {
                    window.location.href = `https://t.me/anonimka_kz_bot?start=${startParam}`;
                }
            }
        });
    } catch (error) {
        console.error('Ошибка покупки PRO:', error);
        tg.showAlert('Ошибка при переходе к оплате. Попробуйте позже.');
    }
}

/**
 * Выбрать тарифный план
 */
async function selectPlan(plan) {
    if (plan === 'free' && userPremiumStatus.isPremium) {
        tg.showAlert('Переход на FREE недоступен: FREE включается автоматически когда заканчивается PRO');
    }
}

/**
 * Активировать Premium (с кринжовыми диалогами)
 */
async function activatePremium() {
    try {
        // Блокируем прямую активацию: только реферал - КРИНЖОВЫЙ ДИАЛОГ
        if (!userPremiumStatus.isPremium) {
            // Первое предупреждение - провокация
            tg.showConfirm(
                '🤔 ТЫ действительно хочешь PRO, БРО?',
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
                                        if (typeof showReferralModal === 'function') showReferralModal();
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
                                if (typeof showReferralModal === 'function') showReferralModal();
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
        
        const userId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;
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
        const originalText = btn ? btn.textContent : '';
        if (btn) {
            btn.textContent = '⏳ Обработка...';
            btn.disabled = true;
        }
        
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

/**
 * Покупка Premium через Telegram (перенаправляет на buyPremiumWithDuration)
 */
async function buyPremiumViaTelegram() {
    // Перенаправляем на новую функцию
    await buyPremiumWithDuration();
}

/**
 * Показать заглушку для оплаты долларом
 */
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

/**
 * Показать предложение триала
 */
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

// Экспортируем функции в глобальную область для вызова из HTML onclick
window.showPremiumModal = showPremiumModal;
window.closePremiumModal = closePremiumModal;
window.loadPremiumStatus = loadPremiumStatus;
window.updatePremiumUI = updatePremiumUI;
window.updateAdLimitBadge = updateAdLimitBadge;
window.updatePremiumModalButtons = updatePremiumModalButtons;
window.updateCurrentSubscriptionInfo = updateCurrentSubscriptionInfo;
window.activatePremiumTrial7h = activatePremiumTrial7h;
window.checkPhotoLimit = checkPhotoLimit;
window.incrementPhotoCount = incrementPhotoCount;
window.isEmailUser = isEmailUser;
window.showStarsPurchaseModal = showStarsPurchaseModal;
window.closeStarsPurchaseModal = closeStarsPurchaseModal;
window.updatePremiumPricing = updatePremiumPricing;
window.buyPremiumWithDuration = buyPremiumWithDuration;
window.selectPlan = selectPlan;
window.showDollarPaymentComingSoon = showDollarPaymentComingSoon;
window.showTrialOffer = showTrialOffer;
window.activatePremium = activatePremium;
window.buyPremiumViaTelegram = buyPremiumViaTelegram;
window.startMidnightLimitCheck = startMidnightLimitCheck;
window.manualRefreshLimits = manualRefreshLimits;

/**
 * Запуск проверки обновления лимитов в полночь АЛМАТЫ (UTC+5)
 */
function startMidnightLimitCheck() {
    console.log('⏰ Запущена проверка обновления лимитов в полночь (Алматы UTC+5)');
    
    let lastNotificationDate = null;
    
    setInterval(() => {
        const now = new Date();
        const utcHours = now.getUTCHours();
        const utcMinutes = now.getUTCMinutes();
        
        // Конвертируем в Алматы время (UTC+5)
        const almatyHours = (utcHours + 5) % 24;
        
        const almatyDate = new Date(now.getTime() + (5 * 60 * 60 * 1000));
        const currentAlmatyDate = almatyDate.toISOString().split('T')[0];
        
        // Если 00:00-00:01 по Алматы - обновляем лимиты
        if (almatyHours === 0 && utcMinutes <= 1) {
            if (lastNotificationDate === currentAlmatyDate) return;
            
            console.log('🌙 Полночь в Алматы! Обновляем лимиты...');
            lastNotificationDate = currentAlmatyDate;
            
            if (typeof loadPremiumStatus === 'function') {
                loadPremiumStatus().then(() => {
                    console.log('✅ Лимиты обновлены после полуночи');
                    if (typeof updateAdLimitBadge === 'function') updateAdLimitBadge();
                    
                    if (typeof tg !== 'undefined' && tg?.showAlert) {
                        tg.showAlert('🎉 Полночь! Лимиты обновлены!');
                    }
                }).catch(err => {
                    console.error('❌ Ошибка обновления лимитов:', err);
                });
            }
        }
    }, 60000); // каждую минуту
}

/**
 * Ручное обновление лимитов
 */
async function manualRefreshLimits() {
    console.log('🔄 Ручное обновление лимитов...');
    
    try {
        await loadPremiumStatus();
        if (typeof updateAdLimitBadge === 'function') updateAdLimitBadge();
        
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('✅ Лимиты обновлены!');
        }
    } catch (error) {
        console.error('❌ Ошибка обновления:', error);
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('❌ Ошибка обновления лимитов');
        }
    }
}

/**
 * Скрыть функции недоступные для email пользователей или PRO пользователей
 */
function hideEmailUserFeatures() {
    const emailUser = typeof isEmailUser === 'function' ? isEmailUser() : false;
    const isPro = userPremiumStatus?.isPremium || false;
    
    // Скрываем кнопку реферала на главной странице для email пользователей или PRO
    const referralMainBtn = document.getElementById('referralMainButton');
    
    if (isPro) {
        console.log('💎 PRO user detected - hiding referral button (already has PRO)');
        if (referralMainBtn) {
            referralMainBtn.style.display = 'none';
        }
    } else if (emailUser) {
        console.log('📧 Email user detected - hiding Stars/Referral features');
        if (referralMainBtn) {
            referralMainBtn.style.display = 'none';
        }
    } else {
        console.log('📱 Telegram FREE user detected - showing Referral button');
        if (referralMainBtn) {
            referralMainBtn.style.display = 'block';
        }
    }
}

window.hideEmailUserFeatures = hideEmailUserFeatures;

console.log('✅ [PREMIUM] Модуль Premium инициализирован');

} catch(e) { console.error('❌ Ошибка в модуле premium.js:', e); }
})();

// ========== referral.js (12.8 KB) ==========
(function() {
try {
/**
 * Модуль реферальной программы (referral.js)
 * 
 * Функции:
 * - Обработка реферальных ссылок
 * - Выдача награды за рефералов
 * - Управление реферальными данными
 * - UI для рефералки
 */

console.log('🎁 [REFERRAL] Инициализация модуля реферальной программы');

/**
 * ===== ОБРАБОТКА РЕФЕРАЛЬНОЙ ССЫЛКИ =====
 */

/**
 * Обработать реферальную ссылку при запуске
 */
async function handleReferralLink() {
    try {
        console.log('🔗 [REFERRAL] Проверка реферальной ссылки');
        
        // Проверяем start_param из Telegram WebApp
        let startParam = typeof tg !== 'undefined' && tg?.initDataUnsafe?.start_param ? tg.initDataUnsafe.start_param : null;
        
        if (!startParam) {
            // Проверяем URL параметр ?ref=
            const urlParams = new URLSearchParams(window.location.search);
            const refParam = urlParams.get('ref');
            
            if (refParam) {
                console.log('📲 [REFERRAL] Найден web-переход ?ref=', refParam);
                localStorage.setItem('pending_referral', refParam);
                localStorage.setItem('pending_referral_timestamp', Date.now().toString());
                
                // Автоматический редирект в Telegram
                const botUsername = 'anonimka_kz_bot';
                const telegramLink = `https://t.me/${botUsername}?startapp=ref_${refParam}`;
                
                // Показываем сообщение и редиректим
                if (typeof tg !== 'undefined' && tg?.showAlert) {
                    tg.showAlert('Переход в Telegram...', () => {
                        window.location.href = telegramLink;
                    });
                } else {
                    window.location.href = telegramLink;
                }
                return;
            }
        } else if (startParam.startsWith('ref_')) {
            console.log('🎁 [REFERRAL] Обнаружена реферальная ссылка из Telegram');
        }
        
        if (!startParam || !startParam.startsWith('ref_')) {
            console.log('ℹ️ [REFERRAL] Реферальный параметр не найден');
            return;
        }
        
        // Извлекаем ID реферера
        const referrerId = startParam.replace('ref_', '');
        console.log('🔍 [REFERRAL] ID реферера:', referrerId.substring(0, 16) + '...');
        
        // Получаем текущего пользователя
        const userToken = localStorage.getItem('user_token');
        const userId = getCurrentUserId();
        
        // Если токена нет, сохраняем реферера на потом
        if (!userToken || userToken === 'null') {
            console.log('⏳ [REFERRAL] Токен не создан, сохраняем реферера для последующей обработки');
            localStorage.setItem('pending_referral', referrerId);
            return;
        }
        
        // Регистрируем реферала
        console.log('📝 [REFERRAL] Регистрация реферала');
        
        const response = await fetch('/api/referrals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                referrer_token: referrerId,
                new_user_token: userToken
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ [REFERRAL] Реферал зарегистрирован');
            localStorage.setItem('referral_processed', 'true');
            localStorage.setItem('referrer_token', referrerId);
        } else {
            console.log('ℹ️ [REFERRAL] Реферал не зарегистрирован:', data.message);
        }
        
    } catch (error) {
        console.error('❌ [REFERRAL] Ошибка обработки реферальной ссылки:', error);
    }
}

/**
 * Завершить реферальный процесс после создания анкеты
 */
async function finalizePendingReferral() {
    try {
        console.log('🏁 [REFERRAL] Завершение ожидающего реферала');
        
        const referrerId = localStorage.getItem('pending_referral');
        const userToken = localStorage.getItem('user_token');
        
        if (!referrerId || !userToken) {
            console.log('ℹ️ [REFERRAL] Нечего завершать');
            return;
        }
        
        // Регистрируем реферала
        const response = await fetch('/api/referrals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                referrer_token: referrerId,
                new_user_token: userToken
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ [REFERRAL] Реферал завершен');
            localStorage.setItem('referral_processed', 'true');
            localStorage.setItem('referrer_token', referrerId);
            localStorage.removeItem('pending_referral');
        }
        
    } catch (error) {
        console.error('❌ [REFERRAL] Ошибка завершения реферала:', error);
    }
}

/**
 * Обработать награду реферера за новую анкету
 */
async function processReferralReward() {
    try {
        console.log('🎁 [REFERRAL] Проверка реферальной награды');
        
        // Защита: награда выдаётся один раз
        if (localStorage.getItem('referral_reward_processed') === 'true') {
            console.log('ℹ️ [REFERRAL] Награда уже была выдана');
            return;
        }
        
        const referrerToken = localStorage.getItem('referrer_token');
        const userToken = localStorage.getItem('user_token');
        
        if (!referrerToken) {
            console.log('ℹ️ [REFERRAL] Нет реферера - пользователь пришел органично');
            return;
        }
        
        // Защита от самореферала
        if (referrerToken === userToken) {
            console.log('❌ [REFERRAL] Попытка самореферала - игнорируем');
            localStorage.setItem('referral_reward_processed', 'true');
            localStorage.removeItem('referrer_token');
            return;
        }
        
        console.log('🎉 [REFERRAL] Выдача PRO реферу');
        
        // Выдаём награду реферу
        const response = await fetch('/api/referrals', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                new_user_token: referrerToken
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ [REFERRAL] PRO выдан реферу до:', data.expiresAt);
            localStorage.setItem('referral_reward_processed', 'true');
            localStorage.removeItem('referrer_token');
        } else {
            console.log('ℹ️ [REFERRAL] Награда уже была выдана ранее');
            localStorage.setItem('referral_reward_processed', 'true');
        }
        
    } catch (error) {
        console.error('❌ [REFERRAL] Ошибка выдачи награды:', error);
    }
}

/**
 * ===== UI ФУНКЦИИ =====
 */

/**
 * Показать модальное окно реферальной программы
 */
function showReferralModal() {
    const modal = document.getElementById('referralModal');
    if (!modal) return;
    
    const referralLinkEl = document.getElementById('referralLink');
    const userToken = localStorage.getItem('user_token');
    
    modal.style.display = 'flex';
    
    if (!userToken || userToken === 'null') {
        if (referralLinkEl) {
            referralLinkEl.textContent = 'Сначала создайте анкету — мы дадим вам реферальную ссылку';
        }
        return;
    }
    
    // Формируем веб-ссылку
    const webLink = `https://anonimka.online/webapp?ref=${userToken}`;
    
    if (referralLinkEl) {
        referralLinkEl.innerHTML = `
            <span style="word-break: break-all; font-size: 12px; color: var(--text-gray);">${webLink}</span>
        `;
    }
    
    window.currentReferralLink = webLink;
}

/**
 * Закрыть модальное окно рефералки
 */
function closeReferralModal() {
    const modal = document.getElementById('referralModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Скопировать реферальную ссылку
 */
async function copyReferralLink() {
    const link = window.currentReferralLink;
    
    if (!link) {
        tg.showAlert('Ссылка не готова');
        return;
    }
    
    // Тексты для реферальной ссылки
    const referralTexts = [
        "Хотите кому-то понравиться, но без неловких взглядов?\nЗдесь никому не нужно быть красивым.\nТолько честным. Анонимно.\n\n",
        "Один клик — и Вы в мире, где никто не знает, кто Вы.\nЗайдите. Напишите. Проверьте, кто ответит.\n\n",
        "Никаких подписок, никаких лиц.\nТолько Вы и чужое сообщение, которое задело.\n\n",
        "Зайдите просто из любопытства.\nВсе с этого начинают.\nА потом остаются.\n\n"
    ];
    
    const randomText = referralTexts[Math.floor(Math.random() * referralTexts.length)];
    const textToCopy = randomText + link;
    
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(textToCopy);
            tg.showAlert('✅ Ссылка с текстом скопирована!');
        } else {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            tg.showAlert('✅ Ссылка с текстом скопирована!');
        }
    } catch (error) {
        console.error('❌ [REFERRAL] Ошибка копирования:', error);
        tg.showAlert('Ошибка при копировании');
    }
}

/**
 * Поделиться реферальной ссылкой
 */
function shareReferralLink() {
    const link = window.currentReferralLink;
    
    if (!link) {
        tg.showAlert('Ссылка не готова');
        return;
    }
    
    // Пытаемся использовать Web Share API
    if (navigator.share) {
        navigator.share({
            title: 'Anonimka - Анонимные знакомства',
            text: 'Присоединяйтесь к анонимной доске знакомств!',
            url: link
        }).catch(err => console.log('Share отменён:', err));
    } else {
        // Fallback: копируем и показываем сообщение
        navigator.clipboard.writeText(link);
        tg.showAlert('✅ Ссылка скопирована!\n\nПоделитесь ей с друзьями в любом мессенджере.');
    }
}

// Экспорт функций для onclick
window.handleReferralLink = handleReferralLink;
window.finalizePendingReferral = finalizePendingReferral;
window.processReferralReward = processReferralReward;
window.showReferralModal = showReferralModal;
window.closeReferralModal = closeReferralModal;
window.copyReferralLink = copyReferralLink;
window.shareReferralLink = shareReferralLink;

console.log('✅ [REFERRAL] Модуль реферальной программы инициализирован');

} catch(e) { console.error('❌ Ошибка в модуле referral.js:', e); }
})();

// ========== world-chat.js (31.6 KB) ==========
(function() {
try {
/**
 * Модуль Мир чата (world-chat.js)
 * 
 * Функции:
 * - Глобальный чат всех пользователей
 * - Городской чат
 * - Личные сообщения через мир чат
 * - Блокировка пользователей
 */

console.log('🌍 [WORLD-CHAT] Инициализация модуля мирового чата');

// Глобальные переменные
let currentWorldChatTab = 'world';
let worldChatAutoRefreshInterval = null;
let worldChatLoadingController = null;
let lastWorldChatMessageIds = [];

/**
 * Показать экран Мир чата
 */
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

/**
 * Переключение размера шрифта
 */
function toggleFontSize() {
    const messagesContainer = document.querySelector('.world-chat-messages');
    if (!messagesContainer) return;
    
    let currentSize = localStorage.getItem('worldChatFontSize') || 'medium';
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    const nextSize = sizes[nextIndex];
    
    messagesContainer.classList.remove('font-small', 'font-medium', 'font-large');
    messagesContainer.classList.add(`font-${nextSize}`);
    
    localStorage.setItem('worldChatFontSize', nextSize);
    
    const btn = document.getElementById('fontSizeBtn');
    if (btn) {
        btn.style.fontSize = nextSize === 'small' ? '12px' : nextSize === 'medium' ? '14px' : '17px';
    }
    
    console.log('📏 Размер шрифта:', nextSize);
}

/**
 * Переключение вкладок
 */
async function switchWorldChatTab(tab) {
    console.log('🔄 Переключение на вкладку:', tab);
    
    if (worldChatLoadingController) {
        worldChatLoadingController.abort();
    }
    
    currentWorldChatTab = tab;
    lastWorldChatMessageIds = [];
    
    document.querySelectorAll('.world-chat-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${tab}Tab`)?.classList.add('active');
    
    const prefixElement = document.getElementById('worldChatPrefix');
    const input = document.getElementById('worldChatInput');
    
    if (tab === 'world') {
        prefixElement.textContent = '@';
        prefixElement.style.color = '#FFD700';
        if (input.value.trim()) input.value = '';
    } else if (tab === 'city') {
        prefixElement.textContent = '&';
        prefixElement.style.color = '#00D9FF';
        if (input.value.trim()) input.value = '';
    } else if (tab === 'private') {
        prefixElement.textContent = '/';
        prefixElement.style.color = '#FF006E';
    }
    
    const messagesContainer = document.querySelector('.world-chat-messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="loading-placeholder">
                <div class="neon-icon pulse">💬</div>
                <p>Загрузка сообщений...</p>
            </div>
        `;
    }
    
    await loadWorldChatMessages();
}

/**
 * Загрузить сообщения
 */
async function loadWorldChatMessages(silent = false) {
    try {
        worldChatLoadingController = new AbortController();
        const requestTab = currentWorldChatTab;
        
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
        
        if (requestTab !== currentWorldChatTab) {
            console.log(`⏭️ Пропускаем рендер для ${requestTab}`);
            return;
        }
        
        if (data.success) {
            if (!silent) {
                console.log(`✅ Загружено ${data.data.length} сообщений`);
            }
            renderWorldChatMessages(data.data);
        } else {
            console.error('❌ Ошибка загрузки сообщений:', data.error);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('⏹️ Запрос отменен');
        } else {
            console.error('Ошибка загрузки сообщений:', error);
        }
    }
}

/**
 * Функция цензуры матерных слов
 */
function censorMessage(text) {
    if (!text) return text;
    
    const badWords = [
        'блять', 'бля', 'блядь', 'блят', 'бляд',
        'хуй', 'хуя', 'хуе', 'хую', 'хуи', 'хер',
        'пизда', 'пизд', 'пиздец', 'пизде', 'пизду',
        'ебать', 'ебал', 'ебан', 'еба', 'ебу', 'ебёт',
        'сука', 'суки', 'суку', 'сук',
        'гандон', 'гондон', 'мудак', 'мудила',
        'долбоеб', 'дебил', 'уебок', 'ублюдок',
        'говно', 'говна', 'гавно',
        'шлюха', 'шлюхи', 'пидор', 'педик',
        'fuck', 'shit', 'bitch', 'dick', 'pussy'
    ];
    
    let censored = text;
    
    badWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        censored = censored.replace(regex, '****');
    });
    
    return censored;
}

/**
 * Escape HTML для предотвращения XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Форматирование времени сообщения
 */
function formatMessageTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'сейчас';
    if (diffMins < 60) return `${diffMins} мин`;
    
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
}

/**
 * Отрисовка сообщений
 */
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
    
    const currentIds = messages.map(m => m.id);
    const idsChanged = JSON.stringify(currentIds) !== JSON.stringify(lastWorldChatMessageIds);
    
    if (!idsChanged) return;
    
    const newMessageIds = currentIds.filter(id => !lastWorldChatMessageIds.includes(id));
    const hasNewMessages = newMessageIds.length > 0;
    
    lastWorldChatMessageIds = currentIds;
    
    const hasLoadingPlaceholder = container.querySelector('.loading-placeholder');
    
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
            
            requestAnimationFrame(() => {
                messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            });
        });
    } else {
        container.innerHTML = messages.map(msg => createWorldChatMessageHtml(msg)).join('');
    }
    
    requestAnimationFrame(() => {
        const scrollContainer = container.parentElement;
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    });
    
    setupLongPressHandlers();
}

/**
 * Создать HTML для одного сообщения
 */
function createWorldChatMessageHtml(msg) {
    const isPremium = msg.is_premium || msg.isPremium || false;
    const nicknameClass = `${msg.type}-type${isPremium ? ' premium' : ''}`;
    const proБадge = isPremium ? '<span class="world-chat-pro-badge">⭐</span>' : '';
    const time = formatMessageTime(msg.created_at || msg.createdAt);
    
    let targetInfo = '';
    if (msg.type === 'private' && (msg.target_nickname || msg.targetNickname)) {
        targetInfo = ` → ${msg.target_nickname || msg.targetNickname}`;
    }
    
    const currentUserToken = localStorage.getItem('user_token');
    const userToken = msg.user_token || msg.userToken;
    const isOwnMessage = userToken === currentUserToken;
    
    let clickableNickname = msg.nickname;
    if (isOwnMessage && msg.type === 'private' && (msg.target_nickname || msg.targetNickname)) {
        clickableNickname = msg.target_nickname || msg.targetNickname;
    }
    
    let censoredMessage = censorMessage(msg.message);
    
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

/**
 * Настройка long press для мобильных устройств
 */
function setupLongPressHandlers() {
    const nicknames = document.querySelectorAll('.world-chat-nickname');
    
    nicknames.forEach(nickname => {
        let pressTimer;
        
        nickname.addEventListener('touchstart', function(e) {
            const nick = this.getAttribute('data-nickname');
            const token = this.getAttribute('data-user-token');
            const isOwn = this.getAttribute('data-is-own') === 'true';
            
            pressTimer = setTimeout(() => {
                if (navigator.vibrate) navigator.vibrate(50);
                showWorldChatContextMenu(e, nick, token, isOwn);
            }, 500);
        });
        
        nickname.addEventListener('touchend', function() {
            clearTimeout(pressTimer);
        });
        
        nickname.addEventListener('touchmove', function() {
            clearTimeout(pressTimer);
        });
    });
}

/**
 * Клик на никнейм - добавить в инпут для личного сообщения
 */
function clickWorldChatNickname(nickname) {
    const input = document.getElementById('worldChatInput');
    const prefix = document.getElementById('worldChatPrefix');
    
    input.value = `${nickname} `;
    prefix.textContent = '/';
    prefix.style.color = '#FF006E';
    input.focus();
}

/**
 * Отправить сообщение
 */
async function sendWorldChatMessage() {
    const input = document.getElementById('worldChatInput');
    const prefix = document.getElementById('worldChatPrefix').textContent;
    let message = input.value.trim();
    
    if (!message) return;
    
    message = prefix + message;
    
    if (message.length - 1 > 120) {
        tg.showAlert('Максимум 120 символов');
        return;
    }
    
    try {
        const userToken = localStorage.getItem('user_token');
        const nickname = localStorage.getItem('userNickname') || 'Аноним';
        const isPremium = typeof userPremiumStatus !== 'undefined' ? userPremiumStatus.isPremium : false;
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
            
            if (prefix === '/') {
                if (currentWorldChatTab === 'world') {
                    await switchWorldChatTab('world');
                } else if (currentWorldChatTab === 'city') {
                    await switchWorldChatTab('city');
                } else {
                    await loadWorldChatMessages();
                }
            } else {
                await loadWorldChatMessages();
            }
        } else {
            console.error('❌ Ошибка отправки:', data.error);
            tg.showAlert(data.error || 'Ошибка отправки сообщения');
        }
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        tg.showAlert('Ошибка отправки сообщения');
    }
}

/**
 * Обновление счетчика символов
 */
function updateWorldChatCharCount() {
    const input = document.getElementById('worldChatInput');
    const counter = document.getElementById('worldChatCharCount');
    
    if (input && counter) {
        const length = input.value.length;
        counter.textContent = length;
        counter.style.color = length > 45 ? '#FF006E' : 'var(--text-gray)';
        
        input.removeEventListener('input', handleWorldChatInput);
        input.addEventListener('input', handleWorldChatInput);
    }
}

function handleWorldChatInput() {
    const input = document.getElementById('worldChatInput');
    const counter = document.getElementById('worldChatCharCount');
    if (input && counter) {
        const length = input.value.length;
        counter.textContent = length;
        counter.style.color = length > 45 ? '#FF006E' : 'var(--text-gray)';
    }
}

/**
 * Загрузить превью последнего сообщения для кнопки
 */
async function loadWorldChatPreview() {
    try {
        const response = await fetch('/api/world-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get-last-message' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const preview = document.getElementById('worldChatPreview');
            const msg = data.data;
            const cleanMessage = msg.message.replace(/^[@&\/]\s*/, '');
            if (preview) preview.textContent = `${msg.nickname}: ${cleanMessage}`;
        }
    } catch (error) {
        console.error('Ошибка загрузки превью:', error);
    }
}

/**
 * Контекстное меню
 */
function showWorldChatContextMenu(event, nickname, userToken, isOwnMessage = false) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Контекстное меню для', nickname, 'isOwn:', isOwnMessage);
    
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
    
    if (isOwnMessage) {
        modal.innerHTML = `
            <div style="margin-bottom: 15px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: var(--neon-cyan);">${escapeHtml(nickname)}</div>
                <div style="font-size: 12px; color: var(--text-gray);">Это Вы</div>
            </div>
            <button onclick="closeWorldChatContextMenu()" style="
                width: 100%; padding: 12px;
                background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
                border: none; border-radius: 10px; color: white; font-size: 14px; cursor: pointer;
            ">Закрыть</button>
        `;
    } else {
        modal.innerHTML = `
            <div style="margin-bottom: 15px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: var(--neon-cyan);">${escapeHtml(nickname)}</div>
                <div style="font-size: 12px; color: var(--text-gray);">Выберите действие</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="worldChatPrivateMessage('${escapeHtml(nickname)}', '${userToken}')" style="
                    padding: 12px; background: linear-gradient(135deg, #FF006E, #C4005A);
                    border: none; border-radius: 10px; color: white; font-size: 14px; cursor: pointer;
                ">💌 Приват чат</button>
                <button onclick="worldChatBlockUser('${escapeHtml(nickname)}', '${userToken}')" style="
                    padding: 12px; background: linear-gradient(135deg, #555, #333);
                    border: none; border-radius: 10px; color: white; font-size: 14px; cursor: pointer;
                ">🚫 В ЧС</button>
                <button onclick="worldChatReportUser('${escapeHtml(nickname)}', '${userToken}')" style="
                    padding: 12px; background: linear-gradient(135deg, #FF4444, #CC0000);
                    border: none; border-radius: 10px; color: white; font-size: 14px; cursor: pointer;
                ">⚠️ Пожаловаться</button>
                <button onclick="closeWorldChatContextMenu()" style="
                    padding: 12px; background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 10px;
                    color: var(--text-light); font-size: 14px; cursor: pointer;
                ">Отмена</button>
            </div>
        `;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'world-chat-context-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.7); z-index: 9999;
    `;
    overlay.onclick = closeWorldChatContextMenu;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    return false;
}

/**
 * Закрыть контекстное меню
 */
function closeWorldChatContextMenu() {
    const menu = document.querySelector('.world-chat-context-menu');
    const overlay = document.querySelector('.world-chat-context-overlay');
    if (menu) menu.remove();
    if (overlay) overlay.remove();
}

/**
 * Приват чат через контекстное меню
 */
async function worldChatPrivateMessage(nickname, userToken) {
    closeWorldChatContextMenu();
    
    const currentUserToken = localStorage.getItem('user_token');
    if (!currentUserToken) {
        tg.showAlert('⚠️ Сначала авторизуйтесь');
        return;
    }
    
    if (currentUserToken === userToken) {
        tg.showAlert('Вы не можете отправить сообщение самому себе');
        return;
    }
    
    try {
        const blockCheckResponse = await fetch('/api/user-blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'is-blocked',
                params: { blockerToken: userToken, blockedToken: currentUserToken }
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
    
    showCustomPrompt(`Введите сообщение для ${nickname}:`, async (message) => {
        if (!message || message.trim() === '') return;
        
        try {
            await createWorldChatPrivateChat(nickname, userToken, currentUserToken, message);
        } catch (error) {
            console.error('Ошибка создания чата:', error);
            tg.showAlert('❌ Ошибка при создании чата');
        }
    });
}

/**
 * Создать приватный чат из Мир чата
 */
async function createWorldChatPrivateChat(nickname, targetUserToken, senderUserToken, message) {
    try {
        const checkResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'check-existing-by-tokens',
                params: { user1_token: senderUserToken, user2_token: targetUserToken }
            })
        });
        
        const checkData = await checkResponse.json();
        
        if (checkData.data) {
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
            if (sendData.error) throw new Error(sendData.error.message);
            
            tg.showAlert(`✅ Сообщение отправлено ${nickname}!`);
        } else {
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
                        senderToken: senderUserToken
                    }
                })
            });
            
            const createData = await createResponse.json();
            if (createData.error) throw new Error(createData.error.message);
            
            tg.showAlert(`✅ Приватный чат с ${nickname} создан!`);
        }
        
        if (typeof updateChatBadge === 'function') {
            await updateChatBadge();
        }
    } catch (error) {
        console.error('Ошибка при создании приватного чата:', error);
        throw error;
    }
}

/**
 * Добавить в ЧС
 */
async function worldChatBlockUser(nickname, blockedUserToken) {
    closeWorldChatContextMenu();
    
    const confirmed = confirm(`Добавить ${nickname} в черный список?`);
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
                    blockedNickname: nickname
                }
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            tg.showAlert(`${nickname} добавлен в ЧС`);
            await loadWorldChatMessages();
        } else {
            tg.showAlert(data.error || 'Ошибка при блокировке');
        }
    } catch (error) {
        console.error('Ошибка блокировки:', error);
        tg.showAlert('Ошибка при блокировке пользователя');
    }
}

/**
 * Пожаловаться на пользователя
 */
async function worldChatReportUser(nickname, userToken) {
    closeWorldChatContextMenu();
    
    const reason = prompt(`Причина жалобы на ${nickname}:`);
    if (!reason) return;
    
    tg.showAlert(`Жалоба на ${nickname} отправлена`);
    console.log('Жалоба на пользователя:', nickname, userToken, reason);
}

/**
 * Показать FAQ
 */
function showWorldChatFAQ() {
    const faqModal = document.getElementById('worldChatFAQ');
    if (faqModal) faqModal.style.display = 'flex';
}

function closeWorldChatFAQ() {
    const faqModal = document.getElementById('worldChatFAQ');
    if (faqModal) faqModal.style.display = 'none';
}

// Остановить автообновление при выходе
window.addEventListener('beforeunload', () => {
    if (worldChatAutoRefreshInterval) {
        clearInterval(worldChatAutoRefreshInterval);
    }
});

// Экспорт функций для onclick
window.showWorldChat = showWorldChat;
window.toggleFontSize = toggleFontSize;
window.switchWorldChatTab = switchWorldChatTab;
window.loadWorldChatMessages = loadWorldChatMessages;
window.sendWorldChatMessage = sendWorldChatMessage;
window.updateWorldChatCharCount = updateWorldChatCharCount;
window.handleWorldChatInput = handleWorldChatInput;
window.loadWorldChatPreview = loadWorldChatPreview;
window.showWorldChatContextMenu = showWorldChatContextMenu;
window.closeWorldChatContextMenu = closeWorldChatContextMenu;
window.worldChatPrivateMessage = worldChatPrivateMessage;
window.worldChatBlockUser = worldChatBlockUser;
window.worldChatReportUser = worldChatReportUser;
window.showWorldChatFAQ = showWorldChatFAQ;
window.closeWorldChatFAQ = closeWorldChatFAQ;
window.clickWorldChatNickname = clickWorldChatNickname;

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
        
        if (typeof window.currentReportData !== 'undefined') {
            window.currentReportData = {
                reportedUserId: data.userId,
                reportedNickname: nickname,
                reportType: 'message',
                relatedAdId: null,
                reason: null
            };
        }
        
        const reportModal = document.getElementById('reportModal');
        if (reportModal) {
            reportModal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Ошибка получения user_id:', error);
        tg.showAlert('Не удалось определить пользователя');
    }
}

window.reportUserFromWorldChat = reportUserFromWorldChat;

console.log('✅ [WORLD-CHAT] Модуль мирового чата инициализирован');

} catch(e) { console.error('❌ Ошибка в модуле world-chat.js:', e); }
})();

// ========== debug.js (7.1 KB) ==========
(function() {
try {
// ============================================================================
// DEBUG MODULE - Панель отладки
// ============================================================================

let debugPanel = null;
let debugPanelVisible = false;

// Переключение панели отладки
function toggleDebugPanel() {
    if (debugPanelVisible) {
        hideDebugPanel();
    } else {
        showDebugPanel();
    }
}

// Показать панель отладки
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

// Скрыть панель отладки
function hideDebugPanel() {
    if (debugPanel) {
        debugPanel.style.display = 'none';
    }
    debugPanelVisible = false;
}

// Обновить информацию в панели отладки
function updateDebugInfo() {
    if (!debugPanel) return;
    
    const tg = window.Telegram?.WebApp;
    const currentUserId = window.getCurrentUserId ? window.getCurrentUserId() : 'N/A';
    const userLocation = localStorage.getItem('userLocation');
    const parsedLocation = userLocation ? JSON.parse(userLocation) : null;
    const isTelegramWebApp = window.isTelegramWebApp || false;
    const currentStep = window.currentStep || 1;
    const totalSteps = window.totalSteps || 9;
    
    const info = {
        '🔐 АВТОРИЗАЦИЯ': '━━━━━━━━━━━━━━━━',
        'isTelegramWebApp': isTelegramWebApp,
        'window.Telegram': !!window.Telegram,
        'tg exists': !!tg,
        'platform': tg?.platform || '❌ НЕТ',
        'initData length': tg?.initData?.length || 0,
        'user.id (initData)': tg?.initDataUnsafe?.user?.id || '❌ НЕТ',
        'getCurrentUserId()': currentUserId,
        'isAuthorized': !currentUserId.toString().startsWith('web_') ? '✅ ДА' : '❌ НЕТ (веб ID)',
        
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
        'CloudStorage available': tg?.CloudStorage ? '✅ ДА' : '❌ НЕТ',
        
        '🖥️ СОСТОЯНИЕ': '━━━━━━━━━━━━━━━━',
        'currentScreen': document.querySelector('.screen.active')?.id || 'unknown',
        'currentStep': currentStep + '/' + totalSteps,
        'window.currentAds': window.currentAds?.length || 0,
        
        '🔑 ДЕТАЛИ initDataUnsafe': '━━━━━━━━━━━━━━━━',
        'Full initDataUnsafe': JSON.stringify(tg?.initDataUnsafe || {}, null, 2)
    };
    
    debugPanel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #00ff00; padding-bottom: 10px;">
            <b style="color: #00ff00; font-size: 14px;">🐛 DEBUG PANEL</b>
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

// Экспорт функций
window.toggleDebugPanel = toggleDebugPanel;
window.showDebugPanel = showDebugPanel;
window.hideDebugPanel = hideDebugPanel;
window.updateDebugInfo = updateDebugInfo;
window.createDebugButton = createDebugButton;

console.log('✅ [DEBUG] Модуль отладки инициализирован');

} catch(e) { console.error('❌ Ошибка в модуле debug.js:', e); }
})();

// ========== admin.js (15.1 KB) ==========
(function() {
try {
// ============================================================================
// ADMIN MODULE - Админ-панель
// ============================================================================

let isAdminUser = false;

// Форматирование даты и времени
function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('ru-RU', { hour12: false });
}

// Переключение вкладок админ-панели
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

// Запрос к админ API
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

// Показать админ-панель
function showAdminPanel() {
    console.log('[ADMIN PANEL] showAdminPanel вызвана');
    
    if (!isAdminUser) {
        console.warn('[ADMIN PANEL] Доступ запрещен: isAdminUser = false');
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('Требуются права администратора');
        } else {
            alert('Требуются права администратора');
        }
        return;
    }

    console.log('[ADMIN PANEL] Доступ разрешен, открываем панель');
    
    if (typeof closeHamburgerMenu === 'function') {
        closeHamburgerMenu();
    }
    
    const panel = document.getElementById('adminPanel');
    if (panel) {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            if (s.id !== 'adminPanel') {
                s.style.display = 'none';
            }
        });
        panel.style.display = 'block';
        panel.classList.add('active');
    }
    
    if (typeof showScreen === 'function') {
        showScreen('adminPanel');
    }
    
    switchAdminTab('overview');
}

// Загрузка обзора админки
async function loadAdminOverview() {
    console.log('[ADMIN PANEL] loadAdminOverview начата');
    const grid = document.getElementById('adminOverviewGrid');
    if (!grid) {
        console.error('[ADMIN PANEL] adminOverviewGrid не найден!');
        return;
    }
    
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
        console.error('[ADMIN PANEL] Ошибка загрузки обзора:', err);
        grid.innerHTML = `<div class="admin-empty">Ошибка: ${err.message}</div>`;
    }
}

// Загрузка списка анкет
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

// Загрузка списка чатов
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

// Загрузка списка пользователей
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

// Забанить пользователя
async function banUserFromAdmin(userToken) {
    const reason = prompt('Причина блокировки?', 'Нарушение правил');
    if (reason === null) return;
    const hoursInput = prompt('Длительность бана в часах (пусто = бессрочно)');
    const durationHours = hoursInput && hoursInput.trim() !== '' ? Number(hoursInput) : null;
    
    try {
        await fetchAdminData('ban-user', { userToken, reason, durationHours });
        loadAdminUsers();
    } catch (err) {
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert(err.message);
        } else {
            alert(err.message);
        }
    }
}

// Снять бан с пользователя
async function unbanUserFromAdmin(userToken) {
    if (!confirm('Снять бан с пользователя?')) return;
    
    try {
        await fetchAdminData('unban-user', { userToken });
        loadAdminUsers();
    } catch (err) {
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert(err.message);
        } else {
            alert(err.message);
        }
    }
}

// Заблокировать анкету
async function blockAdFromAdmin(adId) {
    const reason = prompt('Причина блокировки анкеты?', 'Модерация');
    if (reason === null) return;
    const hoursInput = prompt('Длительность блокировки (часов, пусто = бессрочно)');
    const durationHours = hoursInput && hoursInput.trim() !== '' ? Number(hoursInput) : null;
    
    try {
        await fetchAdminData('block-ad', { adId, reason, durationHours });
        loadAdminAds();
    } catch (err) {
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert(err.message);
        } else {
            alert(err.message);
        }
    }
}

// Разблокировать анкету
async function unblockAdFromAdmin(adId) {
    if (!confirm('Разблокировать анкету?')) return;
    
    try {
        await fetchAdminData('unblock-ad', { adId });
        loadAdminAds();
    } catch (err) {
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert(err.message);
        } else {
            alert(err.message);
        }
    }
}

// Отправить уведомление пользователю
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

// Установить статус администратора
function setAdminStatus(status) {
    isAdminUser = status;
    console.log('[ADMIN] isAdminUser установлен:', isAdminUser);
}

// Экспорт функций
window.isAdminUser = isAdminUser;
window.setAdminStatus = setAdminStatus;
window.switchAdminTab = switchAdminTab;
window.fetchAdminData = fetchAdminData;
window.showAdminPanel = showAdminPanel;
window.loadAdminOverview = loadAdminOverview;
window.loadAdminAds = loadAdminAds;
window.loadAdminChats = loadAdminChats;
window.loadAdminUsers = loadAdminUsers;
window.banUserFromAdmin = banUserFromAdmin;
window.unbanUserFromAdmin = unbanUserFromAdmin;
window.blockAdFromAdmin = blockAdFromAdmin;
window.unblockAdFromAdmin = unblockAdFromAdmin;
window.sendAdminNotification = sendAdminNotification;

console.log('✅ [ADMIN] Модуль админ-панели инициализирован');

} catch(e) { console.error('❌ Ошибка в модуле admin.js:', e); }
})();

// ========== location.js (96.7 KB) ==========
(function() {
try {
/**
 * Модуль локации пользователя (location.js)
 * 
 * Функции:
 * - Автоматическое определение локации (GPS, IP, часовой пояс)
 * - Выбор локации пользователем
 * - Сохранение и загрузка локации
 * - UI для работы с локацией
 */

console.log('📍 [LOCATION] Инициализация модуля локации');

/**
 * ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ ВЫБОРА ЛОКАЦИИ
 */

// Текущая локация пользователя
let currentUserLocation = null;

// Переменные для основной формы создания анкеты
let selectedCountry = null;
let selectedRegion = null;
let selectedCity = null;

// Переменные для фильтра в поиске анкет
let filterSelectedCountry = null;
let filterSelectedRegion = null;
let filterSelectedCity = null;

// Переменные для настройки локации в профиле
let setupSelectedCountry = null;
let setupSelectedRegion = null;
let setupSelectedCity = null;

/**
 * ОСНОВНЫЕ ФУНКЦИИ ЛОКАЦИИ
 */

/**
 * Получить локацию текущего пользователя
 */
function getUserLocation() {
    // Сначала проверяем память
    if (currentUserLocation) {
        return currentUserLocation;
    }
    
    // Затем проверяем localStorage
    const saved = localStorage.getItem('userLocation');
    if (saved) {
        try {
            const location = JSON.parse(saved);
            currentUserLocation = location;
            return location;
        } catch (e) {
            console.warn('⚠️ [LOCATION] Ошибка парсинга сохранённой локации:', e);
        }
    }
    
    // Если ничего не нашли
    return null;
}

/**
 * Сохранить локацию пользователя
 */
async function saveUserLocation(country, region, city) {
    try {
        console.log('📍 [LOCATION] Сохранение локации:', { country, region, city });
        
        // Формируем объект локации
        currentUserLocation = { country, region, city };
        
        // Сохраняем в localStorage
        localStorage.setItem('userLocation', JSON.stringify(currentUserLocation));
        
        // Пытаемся сохранить на сервер через Telegram CloudStorage
        if (tg?.CloudStorage) {
            try {
                await new Promise((resolve, reject) => {
                    tg.CloudStorage.setItem('userLocation', JSON.stringify(currentUserLocation), (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                console.log('✅ [LOCATION] Локация сохранена в CloudStorage');
            } catch (e) {
                console.warn('⚠️ [LOCATION] CloudStorage недоступен, только localStorage:', e);
            }
        }
        
        // Сохраняем локацию в базу данных
        const userToken = localStorage.getItem('user_token');
        if (userToken) {
            try {
                const response = await fetch('/api/users/location', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userToken,
                        country,
                        region: region || null,
                        city
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    console.log('✅ [LOCATION] Локация сохранена в БД');
                } else {
                    console.warn('⚠️ [LOCATION] Ошибка сохранения в БД:', result.error);
                }
            } catch (dbError) {
                console.warn('⚠️ [LOCATION] Не удалось сохранить в БД:', dbError);
            }
        }
        
        console.log('✅ [LOCATION] Локация сохранена');
        return true;
        
    } catch (error) {
        console.error('❌ [LOCATION] Ошибка сохранения локации:', error);
        return false;
    }
}

/**
 * Определение локации по GPS (приоритетный метод для мобильных устройств)
 */
async function detectLocationByGPS() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.log('❌ GPS недоступен в этом браузере');
            resolve(null);
            return;
        }
        
        console.log('🛰️ Запрашиваем GPS координаты...');
        
        // Таймаут 15 секунд для первого определения GPS
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
                timeout: 15000, // 15 секунд
                maximumAge: 300000 // Кешируем на 5 минут
            }
        );
    });
}

/**
 * Автоматическое определение локации пользователя
 */
function autoDetectLocation() {
    console.log('autoDetectLocation вызвана - запускаем автоопределение');
    autoDetectLocationAsync();
}

/**
 * Автоматическое определение локации (async версия)
 * Порядок: GPS → IP → Timezone
 */
async function autoDetectLocationAsync() {
    try {
        console.log('🌍 Автоопределение локации...');
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log('🕐 Timezone пользователя:', timezone);
        
        let locationResult = null;
        
        // ШАГ 1: Пробуем GPS (приоритетно для мобильных устройств)
        console.log('📍 Шаг 1: Проверяем GPS...');
        const detectionText = document.querySelector('.detection-text');
        if (detectionText) {
            detectionText.textContent = 'Проверяем GPS';
        }
        
        locationResult = await detectLocationByGPS();
        
        if (locationResult) {
            console.log('✅ GPS определил локацию:', locationResult);
        } else {
            console.log('⚠️ GPS недоступен, переходим к IP определению');
        }
        
        // ШАГ 2: Если GPS не сработал - пробуем IP API
        if (!locationResult) {
            console.log('📍 Шаг 2: Определяем по IP...');
            if (detectionText) {
                detectionText.textContent = 'Анализируем сетевые маршруты';
            }
            
            // Пробуем ipinfo.io
            try {
                const response = await fetch('https://ipinfo.io/json');
                const data = await response.json();
                console.log('📡 ipinfo.io RAW ответ:', data);
                if (data && data.country) {
                    locationResult = {
                        country_code: data.country,
                        country_name: data.country,
                        region: data.region,
                        city: data.city,
                        source: 'ipinfo.io'
                    };
                    console.log('✅ Локация получена от ipinfo.io:', locationResult);
                }
            } catch (e) {
                console.log('⚠️ ipinfo.io недоступен:', e.message);
            }
            
            // Если не сработало, пробуем ip-api.com
            if (!locationResult) {
                try {
                    const response = await fetch('http://ip-api.com/json/?fields=status,country,countryCode,region,regionName,city');
                    const data = await response.json();
                    console.log('📡 ip-api.com RAW ответ:', data);
                    if (data && data.status === 'success') {
                        locationResult = {
                            country_code: data.countryCode,
                            country_name: data.country,
                            region: data.regionName,
                            city: data.city,
                            source: 'ip-api.com'
                        };
                        console.log('✅ Локация получена от ip-api.com:', locationResult);
                    }
                } catch (e) {
                    console.log('⚠️ ip-api.com недоступен:', e.message);
                }
            }
        }
        
        // ШАГ 3: Если IP тоже не сработал - используем timezone
        if (!locationResult) {
            console.log('📍 Шаг 3: Определяем по часовому поясу...');
            if (detectionText) {
                detectionText.textContent = 'Определяем по часовому поясу';
            }
            
            const tzLocation = guessLocationByTimezone(timezone);
            if (tzLocation) {
                locationResult = tzLocation;
                locationResult.source = 'timezone';
                console.log('✅ Локация определена по timezone:', locationResult);
            }
        }
        
        // ШАГ 4: Обрабатываем результат
        if (locationResult && locationResult.country_code) {
            if (detectionText) {
                detectionText.textContent = 'Сопоставляем с базой данных';
            }
            
            let detectedLocation = processIPLocation(locationResult);
            
            // Если город из IP не найден в базе, используем timezone для Казахстана
            if (detectedLocation && locationResult.source !== 'gps' && locationResult.source !== 'timezone') {
                const kzTimezones = ['Asia/Almaty', 'Asia/Qyzylorda', 'Asia/Aqtobe', 'Asia/Oral', 'Asia/Atyrau'];
                if (kzTimezones.includes(timezone) && locationResult.country_code === 'KZ') {
                    // IP вернул KZ но город возможно неверный - проверяем по timezone
                    const tzLocation = guessLocationByTimezone(timezone);
                    if (tzLocation) {
                        console.log('⚠️ Для KZ используем timezone вместо IP:', tzLocation);
                        detectedLocation = processIPLocation(tzLocation);
                    }
                }
            }
            
            if (detectedLocation) {
                setupSelectedCountry = detectedLocation.country;
                setupSelectedRegion = detectedLocation.region;
                setupSelectedCity = detectedLocation.city;
                showDetectedLocationResult(detectedLocation);
                console.log('✅ Локация определена (источник:', locationResult.source, '):', detectedLocation);
            }
        } else {
            console.log('⚠️ Не удалось автоматически определить локацию');
            showPopularLocations();
        }
    } catch (error) {
        console.error('❌ Ошибка автоопределения локации:', error);
        showPopularLocations();
    }
}

/**
 * Определение локации по часовому поясу
 */
function guessLocationByTimezone(timezone) {
    console.log('Определяем по часовому поясу:', timezone);
    
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
        'Asia/Aqtobe': { country_code: 'KZ', country_name: 'Казахстан', region: 'Актюбинская область', city: 'Актобе' },
        'Asia/Oral': { country_code: 'KZ', country_name: 'Казахстан', region: 'Западно-Казахстанская область', city: 'Уральск' },
        'Europe/Minsk': { country_code: 'BY', country_name: 'Беларусь', region: 'Минск', city: 'Минск' },
        'Europe/Kiev': { country_code: 'UA', country_name: 'Украина', region: 'Киев', city: 'Киев' },
        'Europe/Kyiv': { country_code: 'UA', country_name: 'Украина', region: 'Киев', city: 'Киев' },
        'Asia/Bishkek': { country_code: 'KG', country_name: 'Кыргызстан', region: 'Бишкек', city: 'Бишкек' },
        'Asia/Dushanbe': { country_code: 'TJ', country_name: 'Таджикистан', region: 'Душанбе', city: 'Душанбе' },
        'Asia/Tashkent': { country_code: 'UZ', country_name: 'Узбекистан', region: 'Ташкент', city: 'Ташкент' },
        'Asia/Yerevan': { country_code: 'AM', country_name: 'Армения', region: 'Ереван', city: 'Ереван' },
        'Asia/Baku': { country_code: 'AZ', country_name: 'Азербайджан', region: 'Баку', city: 'Баку' },
        'Europe/Chisinau': { country_code: 'MD', country_name: 'Молдова', region: 'Кишинёв', city: 'Кишинёв' },
        'Asia/Tbilisi': { country_code: 'GE', country_name: 'Грузия', region: 'Тбилиси', city: 'Тбилиси' }
    };
    
    return timezoneMap[timezone] || null;
}

/**
 * Обработка данных IP геолокации
 * С полной нормализацией английских названий в русские
 */
function processIPLocation(data) {
    const countryCode = (data.country_code || data.country || '').toUpperCase();
    let regionName = data.region;
    let cityName = data.city;
    
    console.log('🔄 [LOCATION] processIPLocation:', { countryCode, regionName, cityName });
    
    // ============ НОРМАЛИЗАЦИЯ РЕГИОНОВ (английские → русские) ============
    const regionNormalization = {
        // Россия - области
        'Moscow Oblast': 'Московская область',
        'Moscow': 'Москва',
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
        'Krasnodar Krai': 'Краснодарский край',
        'Krasnoyarsk Krai': 'Красноярский край',
        'Primorsky Krai': 'Приморский край',
        'Stavropol Krai': 'Ставропольский край',
        'Tatarstan': 'Татарстан',
        'Bashkortostan': 'Башкортостан',
        'Dagestan': 'Дагестан',
        // Казахстан - области
        'Almaty': 'Алматинская область',
        'Almaty Region': 'Алматинская область',
        'Astana': 'Астана',
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
    
    // ============ НОРМАЛИЗАЦИЯ ГОРОДОВ (английские → русские) ============
    const cityNormalization = {
        // Казахстан
        'Alma-Ata': 'Алматы',
        'Almaty': 'Алматы',
        'Алма-Ата': 'Алматы',
        'Astana': 'Астана',
        'Nur-Sultan': 'Астана',
        'Nursultan': 'Астана',
        'Нур-Султан': 'Астана',
        'Akmola': 'Кокшетау',
        'Акмола': 'Кокшетау',
        'Akmola Region': 'Кокшетау',
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
        'Kokshetau': 'Кокшетау',
        'Kokschetau': 'Кокшетау',
        
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
        'Volgograd': 'Волгоград',
        'Stalingrad': 'Волгоград',
        'Сталинград': 'Волгоград',
        'Krasnodar': 'Краснодар',
        'Saratov': 'Саратов',
        'Tyumen': 'Тюмень',
        'Tolyatti': 'Тольятти',
        'Togliatti': 'Тольятти',
        'Stavropol': 'Ставрополь',
        'Sochi': 'Сочи',
        'Vladivostok': 'Владивосток',
        'Irkutsk': 'Иркутск',
        'Khabarovsk': 'Хабаровск',
        'Yaroslavl': 'Ярославль',
        'Barnaul': 'Барнаул',
        'Kaliningrad': 'Калининград',
        'Orenburg': 'Оренбург',
        'Kemerovo': 'Кемерово',
        'Tomsk': 'Томск',
        'Tula': 'Тула',
        'Kursk': 'Курск',
        'Ryazan': 'Рязань',
        'Penza': 'Пенза',
        'Lipetsk': 'Липецк',
        'Astrakhan': 'Астрахань',
        'Kirov': 'Киров',
        'Cheboksary': 'Чебоксары',
        'Izhevsk': 'Ижевск',
        'Ulyanovsk': 'Ульяновск',
        'Bryansk': 'Брянск',
        'Ivanovo': 'Иваново',
        'Tver': 'Тверь',
        'Belgorod': 'Белгород',
        'Vladimir': 'Владимир',
        'Murmansk': 'Мурманск',
        'Arkhangelsk': 'Архангельск',
        'Yakutsk': 'Якутск',
        'Grozny': 'Грозный',
        'Makhachkala': 'Махачкала',
        'Nalchik': 'Нальчик',
        'Petrozavodsk': 'Петрозаводск',
        'Syktyvkar': 'Сыктывкар',
        'Saransk': 'Саранск',
        'Yoshkar-Ola': 'Йошкар-Ола'
    };
    
    // Нормализуем регион если он в английском формате
    if (regionName && regionNormalization[regionName]) {
        console.log(`🔄 Нормализация региона: "${regionName}" → "${regionNormalization[regionName]}"`);
        regionName = regionNormalization[regionName];
    }
    
    // Нормализуем город если он в английском формате
    if (cityName && cityNormalization[cityName]) {
        console.log(`🔄 Нормализация города: "${cityName}" → "${cityNormalization[cityName]}"`);
        cityName = cityNormalization[cityName];
    }
    
    // Проверяем есть ли страна в данных (ключи в locationData - это коды стран: KZ, RU, BY и т.д.)
    if (!locationData[countryCode]) {
        console.log('❌ [LOCATION] Страна не поддерживается:', countryCode);
        return null;
    }
    
    const countryData = locationData[countryCode];
    
    // Ищем регион и город
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
    
    // Поиск города в найденном регионе
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
            let city = cities.find(c => c.toLowerCase() === cityName.toLowerCase());
            
            // Потом fuzzy search
            if (!city) {
                city = cities.find(c => 
                    c.toLowerCase().includes(cityName.toLowerCase()) ||
                    cityName.toLowerCase().includes(c.toLowerCase())
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
        country: countryCode,
        region: foundRegion || Object.keys(countryData.regions)[0],
        city: foundCity || countryData.regions[foundRegion || Object.keys(countryData.regions)[0]][0],
        detected: {
            country: data.country_name,
            region: data.region,
            city: data.city
        }
    };
    
    console.log('📍 Итоговая локация:', result);
    if (!foundRegion || !foundCity) {
        console.warn('⚠️ Использованы значения по умолчанию!', { foundRegion, foundCity });
    }
    
    return result;
}

/**
 * Показать результат определения локации
 */
function showDetectedLocationResult(detectedLocation) {
    console.log('📍 [LOCATION] showDetectedLocationResult вызвана:', detectedLocation);
    
    // Проверяем какой экран активен
    const autoDetectionScreen = document.getElementById('autoLocationDetection');
    const isAutoDetectionActive = autoDetectionScreen && autoDetectionScreen.classList.contains('active');
    
    if (isAutoDetectionActive) {
        // Показываем результат на экране автоопределения
        const detectionAnimation = autoDetectionScreen.querySelector('.detection-animation');
        const detectionResult = autoDetectionScreen.querySelector('.detection-result');
        
        if (detectionAnimation) detectionAnimation.style.display = 'none';
        
        if (detectionResult && locationData[detectedLocation.country]) {
            const countryData = locationData[detectedLocation.country];
            const flag = countryData.flag;
            
            const locationText = detectedLocation.region === detectedLocation.city 
                ? detectedLocation.city 
                : `${detectedLocation.region}, ${detectedLocation.city}`;
            
            detectionResult.innerHTML = `
                <div class="detected-location" style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">✨</div>
                    <h3 style="color: var(--neon-cyan); margin-bottom: 15px; font-size: 1.3rem;">Мы определили вашу локацию</h3>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px;">
                        <span style="font-size: 2rem;">${flag}</span>
                        <span style="font-size: 1.2rem; color: #fff;">${locationText}</span>
                    </div>
                    <p style="color: var(--text-gray); font-size: 0.85rem; margin-bottom: 25px;">⚠️ Если неверно, выберите вручную ниже</p>
                    <div style="display: flex; flex-direction: column; gap: 12px; max-width: 300px; margin: 0 auto;">
                        <button class="neon-button primary" onclick="confirmDetectedLocation('${detectedLocation.country}', '${detectedLocation.region.replace(/'/g, "\\'")}', '${detectedLocation.city.replace(/'/g, "\\'")}')">
                            ✅ Да, всё верно
                        </button>
                        <button class="neon-button secondary" onclick="showManualLocationSetup()">
                            🎯 Выбрать вручную
                        </button>
                    </div>
                </div>
            `;
            detectionResult.style.display = 'block';
        }
        return;
    }
    
    // Fallback - показываем на экране locationSetup
    const selectedDiv = document.querySelector('.setup-selected-location');
    const citySelection = document.querySelector('.setup-city-selection');
    
    if (!selectedDiv || !locationData[detectedLocation.country]) return;
    
    const countryData = locationData[detectedLocation.country];
    const flag = countryData.flag;
    
    // Скрываем выбор города
    if (citySelection) citySelection.style.display = 'none';
    
    // Формируем текст локации
    const locationText = detectedLocation.region === detectedLocation.city 
        ? detectedLocation.city 
        : `${detectedLocation.region}, ${detectedLocation.city}`;
    
    selectedDiv.innerHTML = `
        <div class="detected-location" style="text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 10px;">✨</div>
            <h3 style="color: var(--neon-cyan); margin-bottom: 15px;">Мы определили вашу локацию</h3>
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px;">
                <span style="font-size: 1.5rem;">${flag}</span>
                <span style="font-size: 1.1rem; color: #fff;">${locationText}</span>
            </div>
            <p style="color: var(--text-gray); font-size: 0.85rem; margin-bottom: 20px;">⚠️ Если неверно, выберите вручную ниже</p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="neon-button primary" onclick="confirmDetectedLocation('${detectedLocation.country}', '${detectedLocation.region.replace(/'/g, "\\'")}', '${detectedLocation.city.replace(/'/g, "\\'")}')">
                    ✅ Да, всё верно
                </button>
                <button class="neon-button secondary" onclick="showManualLocationSetup()">
                    🎯 Выбрать вручную
                </button>
            </div>
        </div>
    `;
    
    selectedDiv.style.display = 'block';
}

/**
 * Показать популярные локации при неудаче автоопределения
 */
function showPopularLocations() {
    console.log('📍 [LOCATION] showPopularLocations вызвана');
    
    const popularHTML = `
        <div class="popular-locations" style="text-align: center;">
            <div style="font-size: 2.5rem; margin-bottom: 15px;">😕</div>
            <h3 style="color: var(--neon-cyan); margin-bottom: 15px; font-size: 1.2rem;">Выберите ваш город</h3>
            <p style="color: var(--text-gray); font-size: 0.85rem; margin-bottom: 20px;">Не удалось определить автоматически</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; max-width: 300px; margin-left: auto; margin-right: auto;">
                <button class="neon-button secondary" onclick="selectPopularLocation('RU', 'Москва', 'Москва')" style="font-size: 0.9rem;">
                    🇷🇺 Москва
                </button>
                <button class="neon-button secondary" onclick="selectPopularLocation('RU', 'Санкт-Петербург', 'Санкт-Петербург')" style="font-size: 0.9rem;">
                    🇷🇺 СПб
                </button>
                <button class="neon-button secondary" onclick="selectPopularLocation('KZ', 'Алматинская область', 'Алматы')" style="font-size: 0.9rem;">
                    🇰🇿 Алматы
                </button>
                <button class="neon-button secondary" onclick="selectPopularLocation('KZ', 'Астана', 'Астана')" style="font-size: 0.9rem;">
                    🇰🇿 Астана
                </button>
            </div>
            
            <button class="neon-button primary" onclick="showManualLocationSetup()" style="width: 100%; max-width: 300px;">
                🎯 Выбрать другой город
            </button>
        </div>
    `;
    
    // Проверяем какой экран активен
    const autoDetectionScreen = document.getElementById('autoLocationDetection');
    const isAutoDetectionActive = autoDetectionScreen && autoDetectionScreen.classList.contains('active');
    
    if (isAutoDetectionActive) {
        const detectionAnimation = autoDetectionScreen.querySelector('.detection-animation');
        const detectionResult = autoDetectionScreen.querySelector('.detection-result');
        
        if (detectionAnimation) detectionAnimation.style.display = 'none';
        if (detectionResult) {
            detectionResult.innerHTML = popularHTML;
            detectionResult.style.display = 'block';
        }
        return;
    }
    
    // Fallback - показываем на экране locationSetup
    const selectedDiv = document.querySelector('.setup-selected-location');
    const citySelection = document.querySelector('.setup-city-selection');
    
    if (!selectedDiv) return;
    
    if (citySelection) citySelection.style.display = 'none';
    selectedDiv.innerHTML = popularHTML;
    selectedDiv.style.display = 'block';
}

/**
 * Выбор популярной локации
 */
function selectPopularLocation(country, region, city) {
    console.log('Выбрана популярная локация:', {country, region, city});
    confirmDetectedLocation(country, region, city);
}

/**
 * Подтвердить определённую локацию
 */
async function confirmDetectedLocation(country, region, city) {
    console.log('📍 Подтверждение локации:', { country, region, city });
    
    setupSelectedCountry = country;
    setupSelectedRegion = region;
    setupSelectedCity = city;
    
    await saveUserLocation(country, region, city);
    updateLocationDisplay();
    
    if (typeof showMainMenu === 'function') {
        showMainMenu();
    }
}

/**
 * Показать ручной выбор локации (сбросить выбор в UI)
 */
function resetManualLocationUI() {
    const selectedDiv = document.querySelector('.setup-selected-location');
    if (selectedDiv) selectedDiv.style.display = 'none';
    
    // Сбрасываем выбор
    setupSelectedCountry = null;
    setupSelectedRegion = null;
    setupSelectedCity = null;
    
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.classList.remove('active');
    });
    
    console.log('📍 Сброшен ручной выбор локации');
}

/**
 * Обработка отсутствия локации
 */
function handleNoLocation(hasNickname) {
    console.log('📍 Сохраненной локации нет');
    if (hasNickname) {
        console.log('Никнейм есть, но локация потерялась - запускаем автоопределение');
        showAutoLocationDetection();
    } else {
        console.log('Ждём установки никнейма, автоопределение будет после');
        if (typeof checkOnboardingStatus === 'function') {
            checkOnboardingStatus();
        }
    }
}

/**
 * Определение локации по IP
 */
async function detectLocationByIP() {
    const detectionText = document.querySelector('.detection-text');
    console.log('detectLocationByIP вызвана');
    
    if (!detectionText) {
        console.error('Элемент .detection-text не найден!');
        showPopularLocations();
        return;
    }
    
    try {
        console.log('Начинаем определение локации...');
        
        detectionText.textContent = 'Сканируем цифровой след';
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Сначала пробуем GPS
        detectionText.textContent = 'Проверяем GPS';
        let locationData = await detectLocationByGPS();
        
        if (locationData) {
            console.log('✅ Используем GPS локацию:', locationData);
        } else {
            console.log('⚠️ GPS недоступен, используем IP определение');
            
            detectionText.textContent = 'Анализируем сетевые маршруты';
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            detectionText.textContent = 'Определяем геолокацию';
        }
        
        // Если GPS не сработал - используем IP
        if (!locationData) {
            // ipinfo.io
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
                }
            } catch (e) {
                console.log('❌ ipinfo.io недоступен:', e);
            }
            
            // ip-api.com
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
                    }
                } catch (e) {
                    console.log('❌ ip-api.com недоступен:', e);
                }
            }
            
            // Fallback: часовой пояс
            if (!locationData) {
                try {
                    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    console.log('⏰ Часовой пояс:', timezone);
                    
                    locationData = guessLocationByTimezone(timezone);
                    if (locationData) {
                        locationData.source = 'timezone';
                    }
                } catch (e) {
                    console.log('❌ Определение по часовому поясу не сработало:', e);
                }
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
        
        showPopularLocations();
        
    } catch (error) {
        console.error('Ошибка определения локации по IP:', error);
        showPopularLocations();
    }
}

/**
 * Отобразить текущую локацию пользователя
 */
function displayUserLocation() {
    const location = getUserLocation();
    if (location && location.city) {
        console.log('📍 Текущая локация:', location.country, location.region, location.city);
        updateLocationDisplay();
    } else {
        console.log('📍 Локация не установлена');
    }
}

/**
 * Сбросить и переопределить локацию
 */
function resetAndDetectLocation() {
    console.log('🔄 Сброс и переопределение локации...');
    
    // Сбрасываем сохраненную локацию
    localStorage.removeItem('user_location');
    
    if (typeof currentUserLocation !== 'undefined') {
        currentUserLocation = null;
    }
    
    // Запускаем автоопределение
    autoDetectLocation();
}

/**
 * Показать UI автоопределения локации и запустить определение
 */
function showAutoLocationDetection() {
    console.log('📍 [LOCATION] Запуск автоопределения локации...');
    
    // Скрываем все экраны
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    // Показываем экран автоопределения
    const autoScreen = document.getElementById('autoLocationDetection');
    if (autoScreen) {
        autoScreen.classList.add('active');
        autoScreen.style.display = 'flex';
        
        // Сбрасываем UI
        const detectionText = autoScreen.querySelector('.detection-text');
        const detectionResult = autoScreen.querySelector('.detection-result');
        const detectionAnimation = autoScreen.querySelector('.detection-animation');
        
        if (detectionText) detectionText.textContent = 'Анализируем ваш IP-адрес...';
        if (detectionResult) detectionResult.style.display = 'none';
        if (detectionAnimation) detectionAnimation.style.display = 'block';
    }
    
    // Закрываем бургер-меню если открыто
    if (typeof closeBurgerMenu === 'function') {
        closeBurgerMenu();
    }
    
    // Запускаем автоопределение
    setTimeout(() => {
        autoDetectLocationAsync();
    }, 500);
}

function closeAutoLocationDetection() {
    const modal = document.getElementById('autoLocationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Проверить и установить локацию при загрузке
 */
async function checkUserLocation() {
    try {
        console.log('🔍 [LOCATION] Проверка локации пользователя');
        
        const userLocation = getUserLocation();
        
        if (userLocation && userLocation.country && userLocation.city) {
            console.log('✅ [LOCATION] Локация уже установлена:', userLocation);
            return true;
        }
        
        // Если локации нет, пытаемся определить автоматически
        console.log('⚠️ [LOCATION] Локация не найдена, автоопределение...');
        
        const detected = await autoDetectLocation();
        
        if (detected) {
            console.log('✅ [LOCATION] Локация автоопределена');
        } else {
            console.log('⚠️ [LOCATION] Не удалось автоопределить локацию, показываем окно выбора');
            showAutoLocationDetection();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ [LOCATION] Ошибка проверки локации:', error);
        return false;
    }
}

/**
 * ===== ФУНКЦИИ ВЫБОРА ЛОКАЦИИ =====
 */

/**
 * Выбор страны (основная форма создания анкеты)
 */
function selectCountry(countryCode) {
    selectedCountry = countryCode;
    selectedRegion = null;
    selectedCity = null;
    
    // Обновляем активные кнопки стран
    document.querySelectorAll('.country-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-country="${countryCode}"]`)?.classList.add('active');
    
    // Показываем выбор региона
    const regionSection = document.querySelector('.region-selection');
    if (regionSection) {
        regionSection.style.display = 'block';
        setTimeout(() => {
            regionSection.style.opacity = '1';
        }, 50);
    }
    
    console.log('📍 [LOCATION] Выбрана страна:', countryCode);
}

/**
 * Обработка ввода региона
 */
function handleRegionInput(value) {
    if (!selectedCountry || !locationData) return;
    
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const regions = Object.keys(locationData[selectedCountry]?.regions || {});
    const filtered = regions.filter(region => 
        region.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showRegionSuggestions(filtered);
}

/**
 * Показать все регионы
 */
function showAllRegions() {
    if (!selectedCountry || !locationData) return;
    
    const regions = Object.keys(locationData[selectedCountry]?.regions || {});
    showRegionSuggestions(regions);
}

/**
 * Показать предложения регионов
 */
function showRegionSuggestions(regions) {
    const container = document.querySelector('.region-suggestions');
    if (!container) return;
    
    if (regions.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.innerHTML = regions.map(region => `
        <div class="suggestion-item" onclick="selectRegion('${region}')">
            ${region}
        </div>
    `).join('');
    
    container.classList.add('active');
}

/**
 * Выбор региона
 */
function selectRegion(regionName) {
    selectedRegion = regionName;
    selectedCity = null;
    
    document.querySelector('.region-input')?.value !== undefined && 
        (document.querySelector('.region-input').value = regionName);
    
    hideAllSuggestions();
    
    // Показываем выбор города
    const citySection = document.querySelector('.city-selection');
    if (citySection) {
        citySection.style.display = 'block';
        setTimeout(() => {
            citySection.style.opacity = '1';
        }, 50);
    }
    
    console.log('📍 [LOCATION] Выбран регион:', regionName);
}

/**
 * Обработка ввода города
 */
function handleCityInput(value) {
    if (!selectedCountry || !selectedRegion || !locationData) return;
    
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const cities = locationData[selectedCountry]?.regions?.[selectedRegion] || [];
    const filtered = cities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
    );
    
    showCitySuggestions(filtered);
}

/**
 * Показать все города
 */
function showAllCities() {
    if (!selectedCountry || !selectedRegion || !locationData) return;
    
    const cities = locationData[selectedCountry]?.regions?.[selectedRegion] || [];
    showCitySuggestions(cities);
}

/**
 * Показать предложения городов
 */
function showCitySuggestions(cities) {
    const container = document.querySelector('.city-suggestions');
    if (!container) return;
    
    if (cities.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.innerHTML = cities.map(city => `
        <div class="suggestion-item" onclick="selectCity('${city}')">
            ${city}
        </div>
    `).join('');
    
    container.classList.add('active');
}

/**
 * Выбор города
 */
function selectCity(cityName) {
    selectedCity = cityName;
    
    document.querySelector('.city-input')?.value !== undefined && 
        (document.querySelector('.city-input').value = cityName);
    
    hideAllSuggestions();
    
    // Показываем выбранную локацию
    showSelectedLocation();
    
    console.log('📍 [LOCATION] Выбран город:', cityName, 'Полная локация:', {
        country: selectedCountry,
        region: selectedRegion,
        city: selectedCity
    });
}

/**
 * Показать выбранную локацию
 */
function showSelectedLocation() {
    const selectedDiv = document.querySelector('.selected-location');
    const locText = document.querySelector('.location-text');
    
    if (selectedDiv && locText && selectedCountry && selectedCity && locationData) {
        const countryFlag = locationData[selectedCountry]?.flag || '🌍';
        const fullLocation = `${countryFlag} ${selectedRegion || ''}, ${selectedCity}`;
        locText.textContent = fullLocation;
        
        selectedDiv.style.display = 'block';
        setTimeout(() => {
            selectedDiv.style.opacity = '1';
        }, 50);
    }
}

/**
 * Сброс выбора локации
 */
function resetLocationSelection() {
    selectedCountry = null;
    selectedRegion = null;
    selectedCity = null;
    
    // Сбрасываем UI
    document.querySelectorAll('.country-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.region-input, .city-input').forEach(input => {
        input.value = '';
    });
    
    document.querySelectorAll('.region-selection, .city-selection, .selected-location')
        .forEach(el => el.style.display = 'none');
    
    hideAllSuggestions();
    
    console.log('📍 [LOCATION] Выбор локации сброшен');
}

/**
 * Скрыть все подсказки
 */
function hideAllSuggestions() {
    document.querySelectorAll('.region-suggestions, .city-suggestions, .filter-region-suggestions, .filter-city-suggestions, .setup-region-suggestions, .setup-city-suggestions')
        .forEach(el => {
            el.style.display = 'none';
            el.classList.remove('active');
        });
}

/**
 * Скрыть другие списки подсказок
 */
function hideOtherSuggestions(currentContainerId) {
    document.querySelectorAll('.region-suggestions, .city-suggestions, .filter-region-suggestions, .filter-city-suggestions, .setup-region-suggestions, .setup-city-suggestions')
        .forEach(el => {
            if (el.className !== currentContainerId) {
                el.style.display = 'none';
                el.classList.remove('active');
            }
        });
}

/**
 * Показать экран выбора локации (ручной или авто)
 */
function showLocationChoiceScreen() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    const locationChoiceScreen = document.getElementById('locationChoice');
    if (locationChoiceScreen) {
        locationChoiceScreen.classList.add('active');
        locationChoiceScreen.style.display = 'flex';
    }
    
    // Закрываем бургер-меню если открыто
    if (typeof closeBurgerMenu === 'function') {
        closeBurgerMenu();
    }
}

/**
 * Показать настройку локации (ручной ввод)
 */
function showManualLocationSetup() {
    showScreen('locationSetup');
    resetSetupLocation();
    
    // Показываем кнопку "Назад" всегда
    const locationBackBtn = document.getElementById('locationBackBtn');
    if (locationBackBtn) {
        locationBackBtn.style.display = 'block';
    }
}

/**
 * ===== ФУНКЦИИ ДЛЯ ФИЛЬТРА ПО ЛОКАЦИИ =====
 */

/**
 * Выбор страны для фильтра
 */
function selectFilterCountry(countryCode) {
    filterSelectedCountry = countryCode;
    filterSelectedRegion = null;
    filterSelectedCity = null;
    
    // Обновляем кнопки
    document.querySelectorAll('.filter-country').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-country="${countryCode}"].filter-country`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Показываем выбор региона с анимацией
    const regionSection = document.querySelector('.filter-region-selection');
    if (regionSection) {
        regionSection.style.display = 'block';
        setTimeout(() => { regionSection.style.opacity = '1'; }, 50);
    }
    
    // Скрываем остальные секции
    const citySection = document.querySelector('.filter-city-selection');
    const selectedLocation = document.querySelector('.filter-selected-location');
    if (citySection) citySection.style.display = 'none';
    if (selectedLocation) selectedLocation.style.display = 'none';
    
    // Очищаем поля
    const regionInput = document.querySelector('.filter-region-input');
    const cityInput = document.querySelector('.filter-city-input');
    if (regionInput) regionInput.value = '';
    if (cityInput) cityInput.value = '';
    
    console.log('📍 [LOCATION] Выбрана страна для фильтра:', locationData[countryCode]?.name);
}

/**
 * Обработка ввода региона для фильтра
 */
function handleFilterRegionInput(value) {
    if (!filterSelectedCountry) return;
    
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    if (locationData && locationData[filterSelectedCountry]) {
        const regions = Object.keys(locationData[filterSelectedCountry].regions);
        const filtered = regions.filter(region => 
            region.toLowerCase().startsWith(value.toLowerCase())
        );
        showFilterRegionSuggestions(filtered);
    }
}

/**
 * Показать все регионы для фильтра
 */
function showAllFilterRegions() {
    if (!filterSelectedCountry || !locationData || !locationData[filterSelectedCountry]) return;
    
    const regions = Object.keys(locationData[filterSelectedCountry].regions);
    showFilterRegionSuggestions(regions);
}

/**
 * Показать предложения регионов для фильтра
 */
function showFilterRegionSuggestions(regions) {
    const suggestionsContainer = document.querySelector('.filter-region-suggestions');
    if (!suggestionsContainer) return;
    
    if (regions.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    suggestionsContainer.innerHTML = regions.map(region => `
        <div class="suggestion-item" onclick="selectFilterRegion('${region.replace(/'/g, "\\'")}')">
            ${region}
        </div>
    `).join('');
    
    suggestionsContainer.classList.add('active');
    suggestionsContainer.style.display = 'block';
}

/**
 * Выбор региона для фильтра
 */
function selectFilterRegion(regionName) {
    filterSelectedRegion = regionName;
    filterSelectedCity = null;
    
    const regionInput = document.querySelector('.filter-region-input');
    if (regionInput) regionInput.value = regionName;
    hideAllSuggestions();
    
    // Показываем выбор города с анимацией
    const citySection = document.querySelector('.filter-city-selection');
    if (citySection) {
        citySection.style.display = 'block';
        setTimeout(() => { citySection.style.opacity = '1'; }, 50);
    }
    
    // Очищаем поле города
    const cityInput = document.querySelector('.filter-city-input');
    if (cityInput) {
        cityInput.value = '';
        cityInput.focus();
    }
    
    console.log('📍 [LOCATION] Выбран регион для фильтра:', regionName);
}

/**
 * Обработка ввода города для фильтра
 */
function handleFilterCityInput(value) {
    if (!filterSelectedCountry || !filterSelectedRegion) return;
    
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    if (locationData && locationData[filterSelectedCountry]) {
        const cities = locationData[filterSelectedCountry].regions[filterSelectedRegion] || [];
        const filtered = cities.filter(city => 
            city.toLowerCase().startsWith(value.toLowerCase())
        );
        showFilterCitySuggestions(filtered);
    }
}

/**
 * Показать все города для фильтра
 */
function showAllFilterCities() {
    if (!filterSelectedCountry || !filterSelectedRegion || !locationData) return;
    
    const cities = locationData[filterSelectedCountry]?.regions[filterSelectedRegion] || [];
    showFilterCitySuggestions(cities);
}

/**
 * Показать предложения городов для фильтра
 */
function showFilterCitySuggestions(cities) {
    const suggestionsContainer = document.querySelector('.filter-city-suggestions');
    if (!suggestionsContainer) return;
    
    if (cities.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    suggestionsContainer.innerHTML = cities.map(city => `
        <div class="suggestion-item" onclick="selectFilterCity('${city.replace(/'/g, "\\'")}')">
            ${city}
        </div>
    `).join('');
    
    suggestionsContainer.classList.add('active');
    suggestionsContainer.style.display = 'block';
}

/**
 * Выбор города для фильтра
 */
function selectFilterCity(cityName) {
    filterSelectedCity = cityName;
    
    const cityInput = document.querySelector('.filter-city-input');
    if (cityInput) cityInput.value = cityName;
    hideAllSuggestions();
    
    // Показываем выбранную локацию
    showFilterSelectedLocation();
    
    // Загружаем анкеты по выбранной локации
    if (typeof loadAdsByLocation === 'function') {
        loadAdsByLocation(filterSelectedCountry, filterSelectedRegion, cityName);
    }
    
    console.log('📍 [LOCATION] Выбран город для фильтра:', cityName);
}

/**
 * Показать выбранную локацию для фильтра
 */
function showFilterSelectedLocation() {
    const selectedLocationDiv = document.querySelector('.filter-selected-location');
    const locationText = document.querySelector('.filter-location-text');
    
    if (selectedLocationDiv && locationText && locationData && filterSelectedCountry) {
        const fullLocation = `${locationData[filterSelectedCountry].flag} ${filterSelectedRegion || ''}, ${filterSelectedCity || ''}`;
        locationText.textContent = fullLocation;
        
        // Скрываем секции выбора
        const regionSection = document.querySelector('.filter-region-selection');
        const citySection = document.querySelector('.filter-city-selection');
        if (regionSection) regionSection.style.display = 'none';
        if (citySection) citySection.style.display = 'none';
        
        // Показываем выбранную локацию с анимацией
        selectedLocationDiv.style.display = 'block';
        setTimeout(() => { selectedLocationDiv.style.opacity = '1'; }, 50);
    }
}

/**
 * Установка UI фильтра на основе локации пользователя
 */
function setFilterLocationUI() {
    // Получаем локацию через функцию (не через глобальную переменную)
    const userLocation = getUserLocation();
    
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
    const locationTextEl = document.querySelector('.filter-location-text');
    
    console.log('Секции найдены:', {
        regionSection: !!regionSection,
        citySection: !!citySection,
        selectedLocationDiv: !!selectedLocationDiv,
        locationText: !!locationTextEl
    });
    
    if (regionSection) {
        regionSection.style.display = 'block';
        regionSection.style.opacity = '1';
    }
    
    if (citySection) {
        citySection.style.display = 'block';
        citySection.style.opacity = '1';
    }
    
    if (selectedLocationDiv && locationTextEl && locationData) {
        const fullLocation = `${locationData[userLocation.country].flag} ${userLocation.region}, ${userLocation.city}`;
        locationTextEl.textContent = fullLocation;
        selectedLocationDiv.style.display = 'block';
        selectedLocationDiv.style.opacity = '1';
        console.log('Установлен текст локации:', fullLocation);
    }
    
    console.log('UI фильтра установлен на локацию пользователя:', userLocation);
}

/**
 * Сброс выбора локации для фильтра
 */
function resetFilterLocationSelection() {
    filterSelectedCountry = null;
    filterSelectedRegion = null;
    filterSelectedCity = null;
    
    // Сбрасываем кнопки стран
    document.querySelectorAll('.filter-country').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Очищаем поля ввода
    const regionInput = document.querySelector('.filter-region-input');
    const cityInput = document.querySelector('.filter-city-input');
    if (regionInput) regionInput.value = '';
    if (cityInput) cityInput.value = '';
    
    // Скрываем все секции кроме выбора страны
    const regionSection = document.querySelector('.filter-region-selection');
    const citySection = document.querySelector('.filter-city-selection');
    const selectedLocation = document.querySelector('.filter-selected-location');
    
    if (regionSection) regionSection.style.display = 'none';
    if (citySection) citySection.style.display = 'none';
    if (selectedLocation) selectedLocation.style.display = 'none';
    
    hideAllSuggestions();
    
    // Загружаем все анкеты
    if (typeof loadAds === 'function') {
        loadAds();
    }
    
    console.log('📍 [LOCATION] Выбор локации фильтра сброшен');
}

/**
 * Показать настройку локации (общий экран)
 */
function showLocationSetup() {
    showLocationChoiceScreen();
}

/**
 * Сохранить локацию и продолжить
 */
function saveLocationAndContinue() {
    if (!selectedCountry || !selectedCity) {
        if (typeof tg !== 'undefined' && tg.showAlert) {
            tg.showAlert('Пожалуйста, выберите страну и город');
        } else {
            alert('Пожалуйста, выберите страну и город');
        }
        return;
    }
    
    // Сохраняем локацию
    const locationData = {
        country: selectedCountry,
        region: selectedRegion || '',
        city: selectedCity,
        timestamp: Date.now()
    };
    
    localStorage.setItem('userLocation', JSON.stringify(locationData));
    console.log('📍 [LOCATION] Локация сохранена:', locationData);
    
    // Переходим на главный экран
    if (typeof showMainMenu === 'function') {
        showMainMenu();
    }
}

/**
 * ===== ФУНКЦИИ ДЛЯ НАСТРОЙКИ ЛОКАЦИИ (SETUP) =====
 */

/**
 * Выбор страны в настройке
 */
function selectSetupCountry(countryCode) {
    // Маппинг названий стран на коды ISO
    const countryCodeMap = {
        'russia': 'RU',
        'kazakhstan': 'KZ',
        'belarus': 'BY',
        'ukraine': 'UA',
        'kyrgyzstan': 'KG',
        'tajikistan': 'TJ',
        'uzbekistan': 'UZ',
        'armenia': 'AM',
        'azerbaijan': 'AZ',
        'moldova': 'MD',
        'georgia': 'GE',
        // Верхний регистр - оставляем как есть
        'RU': 'RU',
        'KZ': 'KZ',
        'BY': 'BY',
        'UA': 'UA',
        'KG': 'KG',
        'TJ': 'TJ',
        'UZ': 'UZ',
        'AM': 'AM',
        'AZ': 'AZ',
        'MD': 'MD',
        'GE': 'GE'
    };
    
    const isoCode = countryCodeMap[countryCode] || countryCode.toUpperCase();
    console.log('📍 [LOCATION] Выбрана страна:', countryCode, '→', isoCode);
    
    setupSelectedCountry = isoCode;
    setupSelectedRegion = null;
    setupSelectedCity = null;
    
    // Обновляем кнопки
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-country="${countryCode}"].setup-country`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Пропускаем выбор региона, сразу показываем города
    // Собираем все города из всех регионов страны
    const allCities = [];
    if (locationData && locationData[isoCode] && locationData[isoCode].regions) {
        const regions = locationData[isoCode].regions;
        Object.keys(regions).forEach(regionName => {
            allCities.push(...regions[regionName]);
        });
    }
    
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
    const cityInput = document.querySelector('.setup-city-input');
    if (cityInput) cityInput.value = '';
    
    // Сохраняем список всех городов для фильтрации
    window.setupAllCities = allCities;
    
    console.log('📍 [LOCATION] Доступно городов:', allCities.length);
    
    // Инициализируем обработчики для поля ввода города
    initSetupCityInputHandlers();
    
    // Фокус на поле ввода города
    const cityInput2 = document.querySelector('.setup-city-input');
    if (cityInput2) {
        setTimeout(() => cityInput2.focus(), 150);
    }
    
    // Показываем все доступные города
    setTimeout(() => {
        showAllSetupCities();
    }, 100);
}

/**
 * Сброс настройки локации
 */
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
    const citySection = document.querySelector('.setup-city-selection');
    const selectedLocation = document.querySelector('.setup-selected-location');
    
    if (citySection) citySection.style.display = 'none';
    if (selectedLocation) selectedLocation.style.display = 'none';
    
    hideAllSuggestions();
    
    console.log('📍 [LOCATION] Настройка локации сброшена');
}

/**
 * Обработка ввода города в настройке
 */
function handleSetupCityInput(value) {
    console.log('📍 [LOCATION] handleSetupCityInput вызвана:', value);
    console.log('📍 [LOCATION] setupSelectedCountry:', setupSelectedCountry);
    
    if (!setupSelectedCountry) {
        console.log('📍 [LOCATION] Страна не выбрана, выходим');
        return;
    }
    
    if (!value.trim()) {
        console.log('📍 [LOCATION] Пустое значение, скрываем предложения');
        hideAllSuggestions();
        return;
    }
    
    // Получаем все города для выбранной страны
    const allCities = getAllCitiesForCountry(setupSelectedCountry);
    console.log('📍 [LOCATION] Всего городов:', allCities.length);
    
    const filtered = allCities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
    );
    console.log('📍 [LOCATION] Отфильтрованных:', filtered.length);
    
    showSetupCitySuggestions(filtered);
}

/**
 * Показать все города для настройки
 */
function showAllSetupCities() {
    console.log('📍 [LOCATION] showAllSetupCities вызвана');
    console.log('📍 [LOCATION] setupSelectedCountry:', setupSelectedCountry);
    
    if (!setupSelectedCountry) {
        console.log('📍 [LOCATION] Страна не выбрана, не показываем города');
        return;
    }
    
    const cities = getAllCitiesForCountry(setupSelectedCountry);
    console.log('📍 [LOCATION] Всего городов:', cities.length);
    
    showSetupCitySuggestions(cities.slice(0, 50)); // Показываем первые 50
}

/**
 * Получить все города для страны
 */
function getAllCitiesForCountry(countryCode) {
    if (!locationData || !locationData[countryCode]) {
        console.warn('📍 [LOCATION] Данные для страны не найдены:', countryCode);
        return [];
    }
    
    const regions = locationData[countryCode].regions;
    let allCities = [];
    
    for (const regionName in regions) {
        allCities = allCities.concat(regions[regionName]);
    }
    
    return allCities;
}

/**
 * Показать предложения городов в настройке
 */
function showSetupCitySuggestions(cities) {
    const container = document.querySelector('.setup-city-suggestions');
    
    console.log('📍 [LOCATION] showSetupCitySuggestions:', cities.length, 'городов');
    console.log('📍 [LOCATION] Контейнер найден:', !!container);
    
    if (!container) {
        console.error('📍 [LOCATION] Контейнер .setup-city-suggestions не найден!');
        return;
    }
    
    if (cities.length === 0) {
        container.style.display = 'none';
        container.classList.remove('active');
        return;
    }
    
    container.innerHTML = cities.map(city => `
        <div class="suggestion-item" onclick="selectSetupCity('${city.replace(/'/g, "\\'")}')">
            ${city}
        </div>
    `).join('');
    
    container.style.display = 'block';
    container.classList.add('active');
    
    console.log('📍 [LOCATION] Список городов отображен');
}

/**
 * Выбор города в настройке
 */
function selectSetupCity(cityName) {
    console.log('📍 [LOCATION] selectSetupCity:', cityName);
    
    setupSelectedCity = cityName;
    
    // Находим регион для этого города
    if (locationData && locationData[setupSelectedCountry]) {
        const regions = locationData[setupSelectedCountry].regions;
        for (const regionName in regions) {
            if (regions[regionName].includes(cityName)) {
                setupSelectedRegion = regionName;
                break;
            }
        }
    }
    
    // Устанавливаем значение в поле ввода
    const cityInput = document.querySelector('.setup-city-input');
    if (cityInput) {
        cityInput.value = cityName;
    }
    
    hideAllSuggestions();
    
    // Показываем выбранную локацию и кнопку сохранения
    showSetupSelectedLocation();
    
    console.log('📍 [LOCATION] Выбран город:', cityName, 'Регион:', setupSelectedRegion);
}

/**
 * Показать выбранную локацию в настройке
 */
function showSetupSelectedLocation() {
    const selectedDiv = document.querySelector('.setup-selected-location');
    
    if (selectedDiv && setupSelectedCountry && setupSelectedCity && locationData) {
        const countryData = locationData[setupSelectedCountry];
        const flag = countryData?.flag || '🌍';
        const countryName = countryData?.name || setupSelectedCountry;
        
        selectedDiv.innerHTML = `
            <div class="selected-location-info">
                <span class="location-flag">${flag}</span>
                <span class="location-text">${countryName}, ${setupSelectedRegion || ''}, ${setupSelectedCity}</span>
            </div>
            <button class="neon-button primary" onclick="saveSetupLocation()">
                ✓ Сохранить
            </button>
        `;
        selectedDiv.style.display = 'block';
    }
}

/**
 * Сохранить локацию из настройки
 */
async function saveSetupLocation() {
    if (!setupSelectedCountry || !setupSelectedCity) {
        if (typeof tg !== 'undefined' && tg.showAlert) {
            tg.showAlert('Пожалуйста, выберите страну и город');
        } else {
            alert('Пожалуйста, выберите страну и город');
        }
        return;
    }
    
    console.log('📍 [LOCATION] Сохранение локации из настройки:', {
        country: setupSelectedCountry,
        region: setupSelectedRegion,
        city: setupSelectedCity
    });
    
    await saveUserLocation(setupSelectedCountry, setupSelectedRegion || '', setupSelectedCity);
    
    // Обновляем отображение локации в шапке
    updateLocationDisplay();
    
    // Переходим на главный экран
    if (typeof showMainMenu === 'function') {
        showMainMenu();
    }
}

/**
 * Обновить отображение локации в UI
 */
function updateLocationDisplay() {
    const locationDisplay = document.getElementById('userLocationDisplay');
    
    // Если currentUserLocation не установлен, пробуем загрузить из localStorage
    if (!currentUserLocation) {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            try {
                currentUserLocation = JSON.parse(savedLocation);
                console.log('📍 [LOCATION] Загружена локация из localStorage:', currentUserLocation);
            } catch (e) {
                console.warn('⚠️ [LOCATION] Ошибка парсинга localStorage');
            }
        }
    }
    
    console.log('📍 [LOCATION] updateLocationDisplay:', { 
        hasDisplay: !!locationDisplay, 
        currentUserLocation 
    });
    
    if (locationDisplay && currentUserLocation) {
        // Страна может быть в разных форматах: 'KZ', 'kazakhstan', 'Казахстан'
        let countryCode = currentUserLocation.country;
        
        // Пробуем найти данные страны
        let countryData = locationData?.[countryCode];
        
        // Если не нашли, пробуем по верхнему регистру
        if (!countryData && countryCode) {
            countryData = locationData?.[countryCode.toUpperCase()];
        }
        
        // Если всё ещё не нашли, ищем по названию
        if (!countryData && countryCode) {
            const lowerCountry = countryCode.toLowerCase();
            if (lowerCountry === 'kazakhstan' || lowerCountry === 'казахстан') {
                countryData = locationData?.['KZ'];
            } else if (lowerCountry === 'russia' || lowerCountry === 'россия') {
                countryData = locationData?.['RU'];
            }
        }
        
        const flag = countryData?.flag || '📍';
        const city = currentUserLocation.city || 'Не указан';
        locationDisplay.textContent = `${flag} ${city}`;
        
        console.log('✅ [LOCATION] Отображение обновлено:', `${flag} ${city}`);
    } else if (locationDisplay) {
        // Если локация не определена, показываем placeholder
        locationDisplay.textContent = '📍 Укажите город';
    }
}

/**
 * Инициализация обработчиков для поля ввода города
 */
function initSetupCityInputHandlers() {
    const setupCityInput = document.querySelector('.setup-city-input');
    
    console.log('📍 [LOCATION] Инициализация обработчиков для setup-city-input');
    console.log('📍 [LOCATION] setupCityInput найден:', !!setupCityInput);
    
    if (setupCityInput) {
        setupCityInput.addEventListener('input', function() {
            console.log('📍 [LOCATION] input событие:', this.value);
            handleSetupCityInput(this.value);
        });
        
        setupCityInput.addEventListener('keyup', function() {
            handleSetupCityInput(this.value);
        });
        
        setupCityInput.addEventListener('focus', function() {
            console.log('📍 [LOCATION] focus событие на город');
            if (setupSelectedCountry) {
                setTimeout(() => showAllSetupCities(), 50);
            }
        });
        
        setupCityInput.addEventListener('click', function(e) {
            e.stopPropagation();
            if (setupSelectedCountry) {
                setTimeout(() => showAllSetupCities(), 50);
            }
        });
        
        console.log('✅ [LOCATION] Обработчики для setup-city-input установлены');
    }
}

// Инициализация обработчиков кликов для кнопок стран
function initLocationHandlers() {
    console.log('📍 [LOCATION] Инициализация обработчиков кнопок стран');
    
    // Обработчики для кнопок выбора страны (setup-country)
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.addEventListener('click', function() {
            const country = this.dataset.country;
            console.log('📍 [LOCATION] Клик по стране:', country);
            
            // Вызываем полную функцию выбора страны
            selectSetupCountry(country);
        });
    });
    
    // Обработчики для кнопок в форме создания анкеты
    document.querySelectorAll('.form-country').forEach(btn => {
        btn.addEventListener('click', function() {
            const country = this.dataset.country;
            console.log('📍 [LOCATION] Клик по стране (форма):', country);
            
            document.querySelectorAll('.form-country').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            selectedCountry = country;
            
            const regionSection = document.querySelector('.region-selection');
            if (regionSection) {
                regionSection.style.display = 'block';
            }
            
            if (typeof loadRegionsForCountry === 'function') {
                loadRegionsForCountry(country, 'form');
            }
        });
    });
    
    // Обработчики для кнопок в фильтре
    document.querySelectorAll('.filter-country').forEach(btn => {
        btn.addEventListener('click', function() {
            const country = this.dataset.country;
            console.log('📍 [LOCATION] Клик по стране (фильтр):', country);
            
            document.querySelectorAll('.filter-country').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            filterSelectedCountry = country;
            
            const regionSection = document.querySelector('.filter-region-selection');
            if (regionSection) {
                regionSection.style.display = 'block';
            }
            
            if (typeof loadRegionsForCountry === 'function') {
                loadRegionsForCountry(country, 'filter');
            }
        });
    });
    
    // Скрытие списков при клике вне них
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container') && 
            !e.target.classList.contains('setup-city-input') &&
            !e.target.classList.contains('suggestion-item')) {
            hideAllSuggestions();
        }
    });
    
    // Инициализируем обработчики для поля города
    initSetupCityInputHandlers();
    
    console.log('✅ [LOCATION] Обработчики кнопок стран инициализированы');
}

// Запускаем инициализацию при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLocationHandlers);
} else {
    initLocationHandlers();
}

// Экспортируем функции в глобальную область
window.initLocationHandlers = initLocationHandlers;
window.selectCountry = selectCountry;
window.selectRegion = selectRegion;
window.selectCity = selectCity;
window.saveUserLocation = saveUserLocation;
window.getUserLocation = getUserLocation;
window.showLocationSetup = showLocationSetup;
window.showLocationChoiceScreen = showLocationChoiceScreen;
window.saveLocationAndContinue = saveLocationAndContinue;
window.handleSetupCityInput = handleSetupCityInput;
window.showSetupCitySuggestions = showSetupCitySuggestions;
window.selectSetupCity = selectSetupCity;
window.showAllSetupCities = showAllSetupCities;
window.selectSetupCountry = selectSetupCountry;
window.resetSetupLocation = resetSetupLocation;
window.saveSetupLocation = saveSetupLocation;
window.autoDetectLocation = autoDetectLocation;
window.autoDetectLocationAsync = autoDetectLocationAsync;
window.guessLocationByTimezone = guessLocationByTimezone;
window.processIPLocation = processIPLocation;
window.showDetectedLocationResult = showDetectedLocationResult;
window.showPopularLocations = showPopularLocations;
window.selectPopularLocation = selectPopularLocation;
window.confirmDetectedLocation = confirmDetectedLocation;
window.updateLocationDisplay = updateLocationDisplay;
window.currentUserLocation = currentUserLocation; // Экспорт для onboarding.js
window.showAutoLocationDetection = showAutoLocationDetection;
window.showManualLocationSetup = showManualLocationSetup;
window.resetFilterLocationSelection = resetFilterLocationSelection;
window.selectFilterCountry = selectFilterCountry;
window.handleFilterRegionInput = handleFilterRegionInput;
window.showAllFilterRegions = showAllFilterRegions;
window.showFilterRegionSuggestions = showFilterRegionSuggestions;
window.selectFilterRegion = selectFilterRegion;
window.handleFilterCityInput = handleFilterCityInput;
window.showAllFilterCities = showAllFilterCities;
window.showFilterCitySuggestions = showFilterCitySuggestions;
window.selectFilterCity = selectFilterCity;
window.showFilterSelectedLocation = showFilterSelectedLocation;
window.setFilterLocationUI = setFilterLocationUI;
window.handleNoLocation = handleNoLocation;
window.detectLocationByGPS = detectLocationByGPS;
window.detectLocationByIP = detectLocationByIP;
window.displayUserLocation = displayUserLocation;
window.resetAndDetectLocation = resetAndDetectLocation;
window.handleSetupRegionInput = handleSetupRegionInput;
window.showAllSetupRegions = showAllSetupRegions;
window.showSetupRegionSuggestions = showSetupRegionSuggestions;
window.selectSetupRegion = selectSetupRegion;
window.showIPDetectionError = showIPDetectionError;

/**
 * Обработка ввода региона в настройке
 */
function handleSetupRegionInput(value) {
    if (!setupSelectedCountry) return;
    
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const regions = Object.keys(locationData[setupSelectedCountry]?.regions || {});
    const filtered = regions.filter(region => 
        region.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showSetupRegionSuggestions(filtered);
}

/**
 * Показать все регионы в настройке
 */
function showAllSetupRegions() {
    if (!setupSelectedCountry) return;
    const regions = Object.keys(locationData[setupSelectedCountry]?.regions || {});
    showSetupRegionSuggestions(regions);
}

/**
 * Показать предложения регионов в настройке
 */
function showSetupRegionSuggestions(regions) {
    const suggestionsContainer = document.querySelector('.setup-region-suggestions');
    if (!suggestionsContainer) return;
    
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

/**
 * Выбор региона в настройке
 */
function selectSetupRegion(regionName) {
    setupSelectedRegion = regionName;
    setupSelectedCity = null;
    
    const regionInput = document.querySelector('.setup-region-input');
    if (regionInput) regionInput.value = regionName;
    hideAllSuggestions();
    
    // Показываем выбор города
    const citySection = document.querySelector('.setup-city-selection');
    if (citySection) {
        citySection.style.display = 'block';
        setTimeout(() => citySection.style.opacity = '1', 50);
    }
    
    // Очищаем поле города
    const cityInput = document.querySelector('.setup-city-input');
    if (cityInput) cityInput.value = '';
    
    console.log('Выбран регион:', regionName);
    setTimeout(() => showAllSetupCities(), 100);
}

/**
 * Показать ошибку определения IP
 */
function showIPDetectionError() {
    const selectedDiv = document.querySelector('.setup-selected-location');
    if (selectedDiv) {
        selectedDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 2rem; margin-bottom: 10px;">😕</div>
                <h3 style="color: var(--neon-pink);">Не удалось определить локацию</h3>
                <p style="color: var(--text-gray);">Пожалуйста, выберите страну вручную выше</p>
            </div>
        `;
        selectedDiv.style.display = 'block';
    }
}

// Алиас для совместимости с app.js.backup
function initLocationSelector() {
    initLocationHandlers();
}

window.initLocationSelector = initLocationSelector;

// Инициализация при загрузке модуля
(function initLocationOnLoad() {
    // Загружаем сохранённую локацию из localStorage
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
        try {
            currentUserLocation = JSON.parse(savedLocation);
            console.log('📍 [LOCATION] Загружена сохранённая локация:', currentUserLocation);
        } catch (e) {
            console.warn('⚠️ [LOCATION] Ошибка загрузки сохранённой локации');
        }
    }
    
    // Обновляем отображение после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateLocationDisplay);
    } else {
        setTimeout(updateLocationDisplay, 100);
    }
})();

console.log('✅ [LOCATION] Модуль локации инициализирован');

} catch(e) { console.error('❌ Ошибка в модуле location.js:', e); }
})();

// ========== ads.js (107.6 KB) ==========
(function() {
try {
/**
 * Модуль работы с анкетами (ads.js)
 * 
 * Функции:
 * - Создание и публикация анкет
 * - Просмотр и фильтрация анкет
 * - Управление собственными анкетами
 * - Логика страниц с анкетами
 */

console.log('📋 [ADS] Инициализация модуля анкет');

/**
 * ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
 */

// Состояние формы создания анкеты
let formData = {};
let currentStep = 1;
const totalSteps = 9;

// Данные для просмотра анкет
let currentAdsPage = 1;
let currentAds = [];
let totalAdsCount = 0;
let adsFilters = {
    gender: 'all',
    target: 'all',
    orientation: 'all',
    ageFrom: 18,
    ageTo: 99
};

/**
 * ===== УТИЛИТЫ ДЛЯ АНКЕТ =====
 */

/**
 * Нормализация названия города
 */
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

/**
 * Форматирование пола для отображения
 */
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

/**
 * Форматирование цели поиска
 */
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

/**
 * Форматирование целей общения (может быть несколько через запятую)
 */
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

/**
 * Форматирование ориентации
 */
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

/**
 * Обновить отображение локации в форме
 */
function updateFormLocationDisplay() {
    const currentUserLocation = typeof getUserLocation === 'function' ? getUserLocation() : null;
    if (currentUserLocation) {
        // Избегаем дублирования если регион = город
        const locationPart = currentUserLocation.region === currentUserLocation.city 
            ? currentUserLocation.city 
            : `${currentUserLocation.region}, ${currentUserLocation.city}`;
        
        // Получаем флаг
        let flag = '📍';
        if (typeof locationData !== 'undefined' && locationData[currentUserLocation.country]) {
            flag = locationData[currentUserLocation.country].flag;
        }
        
        const locationText = `${flag} ${locationPart}`;
        const formLocationDisplay = document.getElementById('formLocationDisplay');
        if (formLocationDisplay) {
            formLocationDisplay.textContent = locationText;
        }
    }
}

/**
 * Обработка фильтра по городу
 */
function handleCityFilter(city) {
    // Сброс выбора
    document.querySelectorAll('.city-btn.filter').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Выбор нового города
    const cityBtn = document.querySelector(`[data-city="${city}"].filter`);
    if (cityBtn) {
        cityBtn.classList.add('selected');
    }

    // Загружаем анкеты по городу
    if (typeof loadAdsByLocation === 'function') {
        const currentUserLocation = typeof getUserLocation === 'function' ? getUserLocation() : null;
        if (currentUserLocation) {
            loadAdsByLocation(currentUserLocation.country, currentUserLocation.region, city);
        }
    }
}

/**
 * Загрузить анкеты по локации (страна, регион, город)
 */
function loadAdsByLocation(country, region, city) {
    try {
        console.log('🌍 Запрос анкет по локации:', {country, region, city});
        
        // Формируем фильтры для загрузки
        const filters = {};
        if (country) filters.country = country;
        if (city) filters.city = city;
        
        console.log('🔍 Итоговые фильтры для API:', filters);
        
        // Загружаем через наш API
        if (typeof loadAds === 'function') {
            loadAds(filters);
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки анкет по локации:', error);
    }
}

/**
 * Загрузить еще анкеты (пагинация)
 */
function loadMoreAds() {
    if (window.loadingAds || !window.hasMoreAds) return;
    
    console.log('🔘 Кнопка "Загрузить еще" нажата');
    window.currentAdsPage++;
    if (typeof loadAds === 'function') {
        loadAds(window.currentFilters || {}, true);
    }
}

/**
 * Настройка infinite scroll
 */
function setupInfiniteScroll() {
    let scrollTimeout;
    const handleScroll = () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            const documentHeight = Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight
            );
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            const scrolledToBottom = (windowHeight + scrollTop) >= documentHeight - 300;
            
            if (scrolledToBottom && window.hasMoreAds && !window.loadingAds) {
                console.log('📜 Auto-scroll: загружаем следующую страницу');
                window.currentAdsPage++;
                if (typeof loadAds === 'function') {
                    loadAds(window.currentFilters || {}, true);
                }
            }
        }, 150);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
}

// Инициализируем infinite scroll при загрузке
if (typeof window !== 'undefined') {
    setupInfiniteScroll();
}

/**
 * ===== СОЗДАНИЕ И РЕДАКТИРОВАНИЕ АНКЕТ =====
 */

/**
 * Показать форму создания анкеты
 */
function showCreateAd() {
    console.log('📝 [ADS] Открытие формы создания анкеты');
    
    // Проверяем авторизацию
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
        tg.showAlert('Требуется авторизация');
        return;
    }
    
    // Проверяем никнейм
    const nickname = localStorage.getItem('userNickname');
    if (!nickname || nickname.trim() === '') {
        tg.showAlert('Сначала выберите никнейм');
        return;
    }
    
    // Проверяем локацию
    const currentUserLocation = typeof getUserLocation === 'function' ? getUserLocation() : null;
    if (!currentUserLocation || !currentUserLocation.city) {
        tg.showAlert('Сначала выберите ваш город');
        if (typeof showLocationSetup === 'function') {
            showLocationSetup();
        }
        return;
    }
    
    // Сбрасываем форму
    formData = {};
    currentStep = 1;
    
    // Автоматически заполняем локацию из настроек пользователя
    formData.country = currentUserLocation.country;
    formData.region = currentUserLocation.region;
    formData.city = currentUserLocation.city;
    
    // Показываем первый шаг
    showScreen('createAd');
    updateFormStep(1);
    
    // Отображаем локацию в форме
    updateFormLocationDisplay();
    
    // Инициализируем обработчики формы
    initFormHandlers();
}

/**
 * Инициализация обработчиков для кнопок выбора в форме
 */
function initFormHandlers() {
    // Кнопки выбора пола
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.onclick = () => selectGender(btn.dataset.gender);
    });

    // Кнопки выбора цели поиска
    document.querySelectorAll('.target-btn').forEach(btn => {
        btn.onclick = () => selectTarget(btn.dataset.target);
    });

    // Кнопки выбора цели знакомства
    document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.onclick = () => selectGoal(btn.dataset.goal);
    });

    // Кнопки выбора телосложения
    document.querySelectorAll('.body-btn').forEach(btn => {
        btn.onclick = () => selectBody(btn.dataset.body);
    });

    // Кнопки выбора ориентации
    document.querySelectorAll('[data-orientation]').forEach(btn => {
        btn.onclick = () => selectOrientation(btn.dataset.orientation);
    });
    
    // Обработчик синхронизации возраста "От" и "До"
    const ageFromInput = document.getElementById('ageFrom');
    if (ageFromInput) {
        ageFromInput.addEventListener('input', () => syncAgeFromTo('ageFrom'));
        ageFromInput.addEventListener('change', () => syncAgeFromTo('ageFrom'));
    }
    
    console.log('✅ [ADS] Обработчики формы инициализированы');
}

/**
 * Выбор пола
 */
function selectGender(gender) {
    document.querySelectorAll('.gender-btn').forEach(btn => btn.classList.remove('selected'));
    const selected = document.querySelector(`[data-gender="${gender}"]`);
    if (selected) selected.classList.add('selected');
    formData.gender = gender;
    console.log('👤 [ADS] Выбран пол:', gender);
}

/**
 * Выбор цели поиска (кого ищет)
 */
function selectTarget(target) {
    document.querySelectorAll('.target-btn').forEach(btn => btn.classList.remove('selected'));
    const selected = document.querySelector(`[data-target="${target}"]`);
    if (selected) selected.classList.add('selected');
    formData.target = target;
    console.log('🔍 [ADS] Выбрана цель:', target);
}

/**
 * Выбор цели знакомства (множественный выбор)
 */
function selectGoal(goal) {
    const btn = document.querySelector(`[data-goal="${goal}"]`);
    if (!btn) return;
    
    // Переключаем выбор (toggle)
    if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        formData.goals = (formData.goals || []).filter(g => g !== goal);
    } else {
        btn.classList.add('selected');
        formData.goals = formData.goals || [];
        formData.goals.push(goal);
    }
    
    formData.goal = (formData.goals || []).join(', ');
    console.log('🎯 [ADS] Выбранные цели:', formData.goals);
}

/**
 * Выбор телосложения
 */
function selectBody(body) {
    document.querySelectorAll('[data-body]').forEach(btn => btn.classList.remove('selected'));
    const selected = document.querySelector(`[data-body="${body}"]`);
    if (selected) {
        selected.classList.add('selected');
        formData.body = body;
        console.log('💪 [ADS] Выбрано телосложение:', body);
    }
}

/**
 * Выбор ориентации
 */
function selectOrientation(orientation) {
    document.querySelectorAll('[data-orientation]').forEach(btn => btn.classList.remove('selected'));
    const selected = document.querySelector(`[data-orientation="${orientation}"]`);
    if (selected) {
        selected.classList.add('selected');
        formData.orientation = orientation;
        console.log('🌈 [ADS] Выбрана ориентация:', orientation);
    }
}

/**
 * Обновить шаг формы создания анкеты
 */
function updateFormStep(step) {
    console.log(`📝 [ADS] Переход на шаг ${step}/${totalSteps}`);
    
    currentStep = step;
    
    // Скрываем все шаги (убираем класс active)
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    
    // Показываем текущий шаг (добавляем класс active)
    const currentStepEl = document.getElementById(`step${step}`);
    if (currentStepEl) currentStepEl.classList.add('active');
    
    // Шаг 8 - создаём textarea динамически
    const textareaContainer = document.getElementById('textareaContainer');
    if (textareaContainer) {
        if (step === 8) {
            textareaContainer.style.display = 'block';
            
            // Удаляем старый textarea если есть
            let textarea = document.getElementById('adText');
            if (textarea) textarea.remove();
            
            // Создаём textarea динамически
            textarea = document.createElement('textarea');
            textarea.id = 'adText';
            textarea.placeholder = 'Расскажите о себе и что ищете...';
            textarea.rows = 6;
            textarea.maxLength = 500;
            
            // Применяем стили
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
                margin: '0 auto'
            });
            
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
        } else {
            textareaContainer.style.display = 'none';
        }
    }
    
    // Шаг 9 - загружаем галерею фото пользователя (сначала обновляем Premium статус)
    if (step === 9) {
        // Обновляем статус Premium перед показом фото
        if (typeof loadPremiumStatus === 'function') {
            loadPremiumStatus().then(() => {
                if (typeof loadMyPhotosForStep9 === 'function') {
                    loadMyPhotosForStep9();
                }
            }).catch(() => {
                // В случае ошибки всё равно загружаем фото
                if (typeof loadMyPhotosForStep9 === 'function') {
                    loadMyPhotosForStep9();
                }
            });
        } else if (typeof loadMyPhotosForStep9 === 'function') {
            loadMyPhotosForStep9();
        }
    }
    
    // Обновляем кнопки навигации
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (prevBtn) prevBtn.style.display = step > 1 ? 'block' : 'none';
    if (nextBtn) nextBtn.style.display = step < totalSteps ? 'block' : 'none';
    if (submitBtn) submitBtn.style.display = step === totalSteps ? 'block' : 'none';
    
    // Обновляем прогресс
    const progressBar = document.querySelector('.form-progress');
    if (progressBar) {
        const progress = (step / totalSteps) * 100;
        progressBar.style.width = progress + '%';
    }
    
    // Обновляем текст прогресса
    const progressText = document.querySelector('.form-step-info');
    if (progressText) {
        progressText.textContent = `Шаг ${step}/${totalSteps}`;
    }
}

/**
 * Обновление счетчика символов для текста анкеты
 */
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

/**
 * Показать определённый шаг формы (из backup)
 */
function showStep(step) {
    console.log(`📍 Показываем шаг ${step} из ${totalSteps}`);
    
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    const stepElement = document.getElementById(`step${step}`);
    
    if (!stepElement) {
        console.error(`❌ Элемент step${step} не найден!`);
        return;
    }
    
    stepElement.classList.add('active');
    currentStep = step;
    
    // Показываем/скрываем контейнер textarea на шаге 8
    const textareaContainer = document.getElementById('textareaContainer');
    if (textareaContainer) {
        if (step === 8) {
            textareaContainer.style.display = 'block';
        } else {
            textareaContainer.style.display = 'none';
        }
    }
    
    // Инициализируем кнопки ориентации для шага 7
    if (step === 7) {
        const orientationBtns = document.querySelectorAll('#step7 [data-orientation]');
        orientationBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function() {
                selectOrientation(this.dataset.orientation);
            });
        });
    }
    
    // Загружаем существующие фото на шаге 9 (сначала обновляем Premium статус)
    if (step === 9) {
        if (typeof loadPremiumStatus === 'function') {
            loadPremiumStatus().then(() => {
                if (typeof loadMyPhotosForStep9 === 'function') {
                    loadMyPhotosForStep9();
                }
            }).catch(() => {
                if (typeof loadMyPhotosForStep9 === 'function') {
                    loadMyPhotosForStep9();
                }
            });
        } else if (typeof loadMyPhotosForStep9 === 'function') {
            loadMyPhotosForStep9();
        }
    }
    
    // Обновляем кнопки навигации
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (prevBtn) prevBtn.style.display = step > 1 ? 'block' : 'none';
    if (nextBtn) nextBtn.style.display = step < totalSteps ? 'block' : 'none';
    if (submitBtn) submitBtn.style.display = step === totalSteps ? 'block' : 'none';
}

/**
 * Сброс формы создания анкеты
 */
function resetForm() {
    formData = {};
    currentStep = 1;
    
    // Сброс всех выборов
    document.querySelectorAll('.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Очистка полей
    const customCity = document.getElementById('customCity');
    const ageFrom = document.getElementById('ageFrom');
    const ageTo = document.getElementById('ageTo');
    const myAge = document.getElementById('myAge');
    const adText = document.getElementById('adText');
    
    if (customCity) customCity.value = '';
    if (ageFrom) ageFrom.value = '';
    if (ageTo) ageTo.value = '';
    if (myAge) myAge.value = '';
    if (adText) adText.value = '';
    
    showStep(1);
}

/**
 * Валидация текущего шага формы
 */
function validateCurrentStep() {
    console.log(`🔍 Валидация шага ${currentStep}`, formData);
    
    switch(currentStep) {
        case 1: // Пол
            if (!formData.gender) {
                tg.showAlert('Выберите ваш пол');
                return false;
            }
            return true;
        case 2: // Кого ищет
            if (!formData.target) {
                tg.showAlert('Выберите кого ищете');
                return false;
            }
            return true;
        case 3: // Цель
            if (!formData.goals || formData.goals.length === 0) {
                tg.showAlert('Выберите хотя бы одну цель общения');
                return false;
            }
            formData.goal = formData.goals.join(', ');
            return true;
        case 4: // Возраст партнера
            const ageFrom = document.getElementById('ageFrom')?.value;
            const ageTo = document.getElementById('ageTo')?.value;
            
            if (!ageFrom || !ageTo) {
                tg.showAlert('Укажите возраст партнера');
                return false;
            }
            
            const ageFromNum = parseInt(ageFrom);
            const ageToNum = parseInt(ageTo);
            
            if (ageFromNum < 18 || ageToNum > 99) {
                tg.showAlert('Возраст должен быть от 18 до 99 лет');
                return false;
            }
            
            if (ageFromNum > ageToNum) {
                tg.showAlert('Возраст "от" не может быть больше возраста "до"');
                return false;
            }
            
            formData.ageFrom = ageFrom;
            formData.ageTo = ageTo;
            return true;
        case 5: // Мой возраст
            const myAge = document.getElementById('myAge')?.value;
            const myAgeNum = parseInt(myAge);
            if (!myAge || isNaN(myAgeNum) || myAgeNum < 18 || myAgeNum > 99) {
                tg.showAlert('Укажите ваш возраст (18-99)');
                return false;
            }
            formData.myAge = myAge;
            return true;
        case 6: // Телосложение
            if (!formData.body) {
                tg.showAlert('Выберите телосложение');
                return false;
            }
            return true;
        case 7: // Ориентация
            if (!formData.orientation) {
                tg.showAlert('Выберите ориентацию');
                return false;
            }
            return true;
        case 8: // Текст анкеты
            const adText = document.getElementById('adText')?.value?.trim();
            if (!adText || adText.length < 10) {
                tg.showAlert(`Введите текст анкеты (минимум 10 символов)${adText ? `\\nСейчас: ${adText.length}` : ''}`);
                return false;
            }
            formData.text = adText;
            return true;
        case 9: // Фото (опционально)
            return true;
    }
    return false;
}

/**
 * Закрепить/открепить анкету
 */
async function pinMyAd(adId, shouldPin) {
    try {
        // Если закрепляем - проверяем лимит
        if (shouldPin && typeof userPremiumStatus !== 'undefined') {
            if (userPremiumStatus.limits && userPremiumStatus.limits.pin) {
                const pinLimit = userPremiumStatus.limits.pin;
                if (!pinLimit.canUse) {
                    if (userPremiumStatus.isPremium) {
                        tg.showAlert('Вы уже использовали 3 закрепления сегодня');
                    } else {
                        tg.showConfirm(
                            'Закрепление доступно раз в 3 дня для FREE.\\nОформите PRO для 3 закреплений в день!',
                            (confirmed) => {
                                if (confirmed && typeof showPremiumModal === 'function') showPremiumModal();
                            }
                        );
                    }
                    return;
                }
            }
        }
        
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            tg.showAlert('Требуется авторизация');
            return;
        }
        
        const pinnedUntil = shouldPin ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null;
        
        const response = await fetch('/api/ads', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: adId,
                user_token: userToken,
                is_pinned: shouldPin,
                pinned_until: pinnedUntil
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        if (result.success) {
            if (shouldPin) {
                if (typeof loadPremiumStatus === 'function') await loadPremiumStatus();
                tg.showAlert('✅ Анкета закреплена на 1 час!');
            } else {
                tg.showAlert('✅ Анкета откреплена');
            }
            if (typeof loadMyAds === 'function') loadMyAds();
        }
    } catch (error) {
        console.error('Ошибка закрепления:', error);
        tg.showAlert('❌ Ошибка: ' + (error.message || 'Не удалось изменить закрепление'));
    }
}

/**
 * Перейти к следующему шагу формы
 */
function nextFormStep() {
    if (validateCurrentStep() && currentStep < totalSteps) {
        updateFormStep(currentStep + 1);
        window.scrollTo(0, 0);
    }
}

/**
 * Вернуться на предыдущий шаг
 */
function prevFormStep() {
    if (currentStep > 1) {
        updateFormStep(currentStep - 1);
        window.scrollTo(0, 0);
    }
}

/**
 * Обработка кнопки "Назад" в форме создания анкеты
 */
function handleCreateAdBack() {
    if (currentStep > 1) {
        prevFormStep();
    } else {
        // На первом шаге - спрашиваем подтверждение
        if (window.confirm && window.confirm('Вы уверены? Все введённые данные будут потеряны.')) {
            showMainMenu();
        }
    }
}

/**
 * Следующий шаг (алиас для HTML)
 */
function nextStep() {
    nextFormStep();
}

/**
 * Предыдущий шаг (алиас для HTML)
 */
function previousStep() {
    prevFormStep();
}

/**
 * Отправить анкету на сервер
 */
async function submitAd() {
    try {
        console.log('📤 [ADS] Отправка анкеты на сервер');
        
        // Проверяем авторизацию
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            tg.showAlert('Требуется авторизация');
            return;
        }
        
        // Получаем локацию пользователя
        const userLocation = typeof getUserLocation === 'function' ? getUserLocation() : null;
        
        // Собираем данные из formData и DOM (используем имена как ожидает сервер)
        const adData = {
            user_token: userToken,
            nickname: localStorage.getItem('userNickname'),
            gender: formData.gender || document.querySelector('input[name="gender"]:checked')?.value,
            myAge: formData.myAge || document.querySelector('input[name="my_age"]')?.value,
            body: formData.body || document.querySelector('input[name="body_type"]:checked')?.value,
            orientation: formData.orientation || document.querySelector('input[name="orientation"]:checked')?.value,
            goal: formData.goal || formData.goals?.join(', ') || '',
            target: formData.target || document.querySelector('input[name="target"]:checked')?.value,
            ageFrom: formData.ageFrom || document.querySelector('input[name="age_from"]')?.value,
            ageTo: formData.ageTo || document.querySelector('input[name="age_to"]')?.value,
            country: formData.country || userLocation?.country || '',
            region: formData.region || userLocation?.region || '',
            city: formData.city || userLocation?.city || '',
            text: formData.text || document.getElementById('adText')?.value || '',
            photoUrl: formData.adPhotoUrl || null,
            photoFileId: formData.adPhotoFileId || null,
            created_at: new Date().toISOString()
        };
        
        console.log('📋 [ADS] Данные анкеты:', adData);
        
        // Валидация
        if (!adData.gender || !adData.myAge || !adData.city) {
            console.error('❌ Не хватает данных:', { gender: adData.gender, myAge: adData.myAge, city: adData.city });
            tg.showAlert('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        if (!adData.text || adData.text.length < 10) {
            tg.showAlert('Описание должно содержать минимум 10 символов');
            return;
        }
        
        // Показываем загрузку
        const submitBtn = document.querySelector('.submit-ad-btn');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.textContent = '⏳ Публикация...';
            submitBtn.disabled = true;
        }
        
        // Отправляем на сервер
        const response = await fetch('/api/ads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adData)
        });
        
        const result = await response.json();
        
        if (result.error) {
            tg.showAlert('Ошибка: ' + (result.error.message || 'Не удалось опубликовать анкету'));
            return;
        }
        
        console.log('✅ [ADS] Анкета опубликована:', result.ad);
        
        // Синхронизируем user_token если сервер вернул другой
        if (result.ad && result.ad.user_token) {
            const currentToken = localStorage.getItem('user_token');
            if (currentToken !== result.ad.user_token) {
                console.log('🔄 [ADS] Обновляем user_token в localStorage');
                localStorage.setItem('user_token', result.ad.user_token);
            }
        }
        
        // Выполняем реферальную награду если нужно
        if (typeof processReferralReward === 'function') {
            processReferralReward();
        }
        
        // Обновляем Premium статус
        if (typeof loadPremiumStatus === 'function') {
            loadPremiumStatus();
        }
        
        // Проверяем бонус для девушек
        if (result.showFemaleBonusModal) {
            // Показываем уведомление о бонусе PRO для девушки
            tg.showAlert('🎉 Поздравляем!\n\n✨ Вам начислен бонус PRO на 1 год!\n\n👩 Это подарок для девушек при создании первой анкеты.\n\n⚠️ Важно: если вы создадите анкету с полом "Мужчина", бонус будет отменён.', () => {
                showMainMenu();
            });
        } else if (result.femaleBonusLost) {
            // Показываем уведомление об утрате бонуса
            tg.showAlert('⚠️ Анкета опубликована\n\n💔 Ваш бонус PRO для девушек был отменён, так как вы создали мужскую анкету.', () => {
                showMainMenu();
            });
        } else {
            tg.showAlert('🎉 Анкета опубликована!\n\nТеперь её смогут видеть другие пользователи', () => {
                showMainMenu();
            });
        }
        
    } catch (error) {
        console.error('❌ [ADS] Ошибка отправки анкеты:', error);
        tg.showAlert('Ошибка при публикации анкеты');
    } finally {
        const submitBtn = document.querySelector('.submit-ad-btn');
        if (submitBtn) {
            submitBtn.textContent = originalText || 'Опубликовать';
            submitBtn.disabled = false;
        }
    }
}

/**
 * ===== ПРОСМОТР И ФИЛЬТРАЦИЯ АНКЕТ =====
 */

// Флаг для предотвращения повторной загрузки
let isLoadingAds = false;

/**
 * Показать раздел просмотра анкет
 */
function showBrowseAds() {
    console.log('🔍 [ADS] Открытие просмотра анкет');
    
    showScreen('browseAds');
    
    // Отображаем текущую локацию
    const browseLocationDisplay = document.getElementById('browseLocationDisplay');
    const userLoc = typeof getUserLocation === 'function' ? getUserLocation() : null;
    
    if (userLoc && browseLocationDisplay) {
        // Избегаем дублирования если регион = город
        const locationPart = userLoc.region === userLoc.city 
            ? userLoc.city 
            : `${userLoc.region}, ${userLoc.city}`;
        const locationText = locationData ? `${locationData[userLoc.country]?.flag || ''} ${locationPart}` : locationPart;
        browseLocationDisplay.textContent = locationText;
    } else if (browseLocationDisplay) {
        browseLocationDisplay.textContent = 'Локация не установлена';
    }
    
    // Загружаем анкеты по локации пользователя
    setTimeout(() => {
        if (userLoc) {
            console.log('📍 [ADS] Загружаем анкеты по локации:', userLoc);
            loadAdsByLocation(userLoc.country, userLoc.region, userLoc.city);
        } else {
            console.log('📍 [ADS] Локация не установлена, показываем все анкеты');
            loadAds();
        }
        
        // Устанавливаем UI фильтра на базе локации пользователя
        if (typeof setFilterLocationUI === 'function') {
            setFilterLocationUI();
        }
    }, 100);
}

// Глобальные переменные для пагинации
window.loadingAds = false;
window.allLoadedAds = [];
window.currentFilters = {};
window.totalAds = 0;
window.hasMoreAds = true;
window.currentAdsPage = 1;

/**
 * Загрузить анкеты с фильтрами
 */
async function loadAds(filters = {}, append = false) {
    // Предотвращаем множественные одновременные запросы
    if (window.loadingAds) {
        console.log('⚠️ [ADS] Запрос уже выполняется, пропускаем');
        return;
    }
    
    if (!append) {
        window.currentAdsPage = 1;
        window.allLoadedAds = [];
        window.hasMoreAds = true;
        window.currentFilters = filters;
    }
    
    window.loadingAds = true;
    
    try {
        console.log('📥 [ADS] Загрузка анкет:', { page: window.currentAdsPage, filters, append });
        
        // DEBUG: показываем версию при первой загрузке
        if (!window._adsVersionShown && !append) {
            window._adsVersionShown = true;
            console.log('🔔 ADS MODULE VERSION: 2.2.12-debug');
        }
        
        // По умолчанию включаем компактный режим
        if (window.localStorage.getItem('ads_compact') === null) {
            window.localStorage.setItem('ads_compact', '1');
        }
        
        const adsList = document.getElementById('adsList');
        if (adsList && !append) {
            const compact = window.localStorage.getItem('ads_compact') === '1';
            adsList.classList.toggle('compact', compact);
            adsList.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Загружаем анкеты${compact ? ' (компактно)' : ''}...</p>
            `;
        }
        
        // Объединяем фильтры
        const finalFilters = { ...adsFilters, ...filters };
        
        // Формируем параметры запроса - 20 анкет за раз
        const params = new URLSearchParams({
            page: window.currentAdsPage.toString(),
            limit: '20',
            _t: Date.now().toString() // Обход кэша
        });
        
        // Если есть фильтр по стране/городу, добавляем
        if (finalFilters.country) {
            params.append('country', finalFilters.country);
        }
        if (finalFilters.city) {
            params.append('city', finalFilters.city);
        }
        
        const apiUrl = `/api/ads?${params.toString()}`;
        console.log('🌐 API запрос:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        const ads = result.ads || [];
        const pagination = result.pagination;
        
        console.log('✅ Получено анкет:', ads.length, 'Пагинация:', pagination);
        
        if (append) {
            window.allLoadedAds.push(...ads);
        } else {
            window.allLoadedAds = ads;
        }
        
        // Сохраняем общее количество анкет
        if (pagination && pagination.total) {
            window.totalAds = pagination.total;
        }
        
        // Если пагинации нет, считаем что это все анкеты
        window.hasMoreAds = pagination ? (pagination.hasMore || false) : false;
        
        console.log('🔢 Состояние:', { 
            totalLoaded: window.allLoadedAds.length, 
            hasMore: window.hasMoreAds,
            currentPage: window.currentAdsPage
        });
        
    } catch (error) {
        console.error('❌ [ADS] Ошибка при загрузке анкет:', error);
        const adsList = document.getElementById('adsList');
        if (adsList && !append) {
            adsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">⚠️</div>
                    <h3>Ошибка загрузки</h3>
                    <p>${error.message}</p>
                    <button class="neon-button" onclick="loadAds()">🔄 Повторить</button>
                </div>
            `;
        }
    } finally {
        window.loadingAds = false;
        
        // Отображаем анкеты ПОСЛЕ сброса loadingAds
        const cityFilter = filters.city || (window.currentFilters && window.currentFilters.city);
        displayAds(window.allLoadedAds, cityFilter);
    }
}

/**
 * Отобразить анкеты в UI
 */
function displayAds(ads, city = null) {
    const adsList = document.getElementById('adsList');
    if (!adsList) return;
    
    console.log('📊 [ADS] displayAds вызвана с', ads.length, 'анкетами');
    
    // DEBUG: показать первую анкету алертом для проверки кэша
    if (ads.length > 0 && !window._debugFirstAdShown) {
        window._debugFirstAdShown = true;
        const firstAd = ads[0];
        const debugMsg = `DEBUG v2.2.12\nПервая анкета: ${firstAd.display_nickname}\nСоздана: ${firstAd.created_at}\nГород: ${firstAd.city}`;
        console.log('🔔 ' + debugMsg);
        // Раскомментируй для визуального алерта:
        // alert(debugMsg);
    }
    
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
    const normalizedFilterCity = typeof normalizeCity === 'function' ? normalizeCity(city) : city;
    
    // Фильтруем по городу если задан
    let filteredAds = normalizedFilterCity ? ads.filter(ad => {
        const normalizedAdCity = typeof normalizeCity === 'function' ? normalizeCity(ad.city) : ad.city;
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

    let adsHTML = filteredAds.map((ad, index) => {
        const myAge = ad.my_age || ad.myAge || '?';
        const ageFrom = ad.age_from || ad.ageFrom || '?';
        const ageTo = ad.age_to || ad.ageTo || '?';
        const nickname = ad.display_nickname || 'Аноним';
        const isPinned = ad.is_pinned && (!ad.pinned_until || new Date(ad.pinned_until) > now);
        
        // Маппинг телосложения
        const bodyLabels = {
            slim: 'Худощавое', athletic: 'Спортивное', average: 'Среднее', curvy: 'Полное',
            'Стройное': 'Стройное', 'Обычное': 'Обычное', 'Плотное': 'Плотное', 'Спортивное': 'Спортивное', 'Другое': 'Другое'
        };
        const bodyType = ad.body_type ? (bodyLabels[ad.body_type] || ad.body_type) : null;
        
        // PRO статус
        const isPremium = ad.is_premium && (!ad.premium_until || new Date(ad.premium_until) > now);
        const premiumClass = isPremium ? 'premium-ad' : '';
        const premiumBadge = isPremium ? ' <span class="pro-badge">⭐</span>' : '';
        
        // Функция получения URL фото
        const photoUrl = (url) => typeof getPhotoUrl === 'function' ? getPhotoUrl(url, 'small') : url;
        
        return `
        <div class="ad-card ${compact ? 'compact' : ''} ${premiumClass}" onclick="showAdDetails(${index})">
            ${isPinned ? '<span class="pinned-badge">📌 Закреплено</span>' : ''}
            ${ad.photo_urls && ad.photo_urls.length > 0 ? `
            <div class="ad-photo-thumbnails" style="display: flex; gap: 6px; margin-bottom: 12px; justify-content: center;">
                ${ad.photo_urls.slice(0, 3).map((pUrl, photoIdx) => `
                    <div style="width: 80px; height: 80px; overflow: hidden; border-radius: 8px; background: linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(46, 46, 66, 0.6) 100%); position: relative; flex-shrink: 0;">
                        <img 
                            src="${photoUrl(pUrl)}" 
                            alt="Фото ${photoIdx + 1}" 
                            loading="lazy"
                            style="width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.3s ease;"
                            onload="this.style.opacity='1'"
                            onerror="this.style.opacity='0.3'; this.alt='❌'">
                    </div>
                `).join('')}
            </div>
            ` : ''}
            <div class="ad-header">
                <h3>👤 ${nickname}${premiumBadge}</h3>
                <div class="created-at"><span class="icon">⏰</span> <span class="value">${formatCreatedAt(ad.created_at)}</span></div>
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
            <div class="ad-text">"${compact ? ad.text.substring(0, 120) : ad.text.substring(0, 100)}${ad.text.length > (compact ? 120 : 100) ? '...' : ''}"</div>
        </div>
    `;
    }).join('');
    
    // Добавляем кнопку загрузки
    if (window.loadingAds) {
        adsHTML += `
            <div id="loadingMore" style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <div class="loading-spinner"></div>
                <p style="margin-top: 10px;">Загружаем еще анкеты...</p>
            </div>
        `;
    } else if (window.hasMoreAds) {
        adsHTML += `
            <div id="loadingMore" style="text-align: center; padding: 20px;">
                <button class="neon-button" onclick="loadMoreAds()" style="width: auto; padding: 12px 24px;">
                    📜 Загрузить еще (${window.allLoadedAds?.length || 0} из ${window.totalAds || '?'})
                </button>
            </div>
        `;
    } else if (!window.hasMoreAds && window.allLoadedAds?.length > 0) {
        adsHTML += `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary); opacity: 0.5;">
                <p style="margin: 0;">✅ Все анкеты загружены (${window.allLoadedAds.length})</p>
            </div>
        `;
    }
    
    adsList.innerHTML = adsHTML;
    
    // Сохраняем анкеты для showAdDetails
    window.currentAds = filteredAds;
}

/**
 * Показать модальное окно с полной информацией об анкете
 */
async function showAdModal(adId) {
    if (!adId || adId === 'N/A') {
        tg.showAlert('Анкета не найдена');
        return;
    }
    
    const modal = document.getElementById('adModal');
    const modalBody = document.getElementById('adModalBody');
    
    if (!modal || !modalBody) {
        console.error('❌ [ADS] Модальное окно не найдено');
        return;
    }
    
    // Показываем модалку с загрузкой
    modal.style.display = 'flex';
    modalBody.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Загрузка...</p>
    `;
    
    try {
        // Загружаем данные анкеты
        const response = await fetch(`/api/ads?id=${adId}`);
        const result = await response.json();
        
        const ad = result.ads?.[0];
        if (!ad) {
            throw new Error('Анкета не найдена');
        }
        
        // Форматируем данные
        const genderFormatted = formatGender(ad.gender);
        const targetFormatted = formatTarget(ad.target);
        const goalsFormatted = formatGoals(ad.goal);
        
        // Отображаем информацию
        modalBody.innerHTML = `
            <div class="ad-detail" style="max-width: 400px;">
                <h2>${genderFormatted}, ${ad.my_age} лет</h2>
                <div class="ad-info">
                    <div><strong>Телосложение:</strong> ${ad.body_type}</div>
                    <div><strong>Ищу:</strong> ${targetFormatted}</div>
                    <div><strong>Цель:</strong> ${goalsFormatted}</div>
                    <div><strong>Город:</strong> ${ad.city}</div>
                </div>
                <div class="ad-description">
                    <p>${ad.text}</p>
                </div>
                <button class="neon-button" onclick="contactAuthor(${ad.id}, '${ad.user_token}')">
                    💬 Написать сообщение
                </button>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ [ADS] Ошибка загрузки анкеты:', error);
        modalBody.innerHTML = `
            <div class="error-state">
                <h3>Ошибка</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

/**
 * Закрыть модальное окно анкеты
 */
function closeAdModal() {
    const modal = document.getElementById('adModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Показать детали анкеты (из списка)
 */
function showAdDetails(index) {
    console.log('🔍 [ADS] showAdDetails вызвана с index:', index);
    console.log('🔍 [ADS] window.currentAds:', window.currentAds?.length, 'анкет');
    
    const ad = window.currentAds?.[index];
    
    if (!ad) {
        console.error('❌ [ADS] Анкета не найдена по индексу:', index);
        tg.showAlert('Анкета не найдена');
        return;
    }
    
    console.log('✅ [ADS] Анкета найдена:', ad.id, ad.display_nickname);
    
    const adContent = document.getElementById('adContent');
    if (!adContent) {
        console.error('❌ [ADS] Элемент adContent не найден!');
        return;
    }
    
    window.currentAdIndex = index;
    window.currentPhotoIndex = 0;
    window.currentAdPhotos = ad.photo_urls || [];
    
    const myAge = ad.my_age || ad.myAge || '?';
    const ageFrom = ad.age_from || ad.ageFrom || '?';
    const ageTo = ad.age_to || ad.ageTo || '?';
    
    const bodyLabels = {
        slim: 'Худощавое', athletic: 'Спортивное', average: 'Среднее', curvy: 'Полное',
        'Стройное': 'Стройное', 'Обычное': 'Обычное', 'Плотное': 'Плотное', 'Спортивное': 'Спортивное', 'Другое': 'Другое'
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
            
            ${ad.photo_urls && ad.photo_urls.length > 0 ? `
            <div class="ad-details-photos">
                <div class="ad-main-photo" id="adMainPhotoContainer" style="position: relative; touch-action: pan-y; width: 100%; height: 400px; background: linear-gradient(135deg, #1a1a2e 0%, #2e2e42 100%); border-radius: 12px; overflow: hidden;">
                    ${ad.photo_urls.map((photoUrl, photoIndex) => `
                        <img class="ad-slide-photo" 
                            data-index="${photoIndex}"
                            src="${getPhotoUrl(photoUrl, 'medium')}" 
                            alt="Фото ${photoIndex + 1}" 
                            loading="eager"
                            data-full-url="${getPhotoUrl(photoUrl, 'large')}"
                            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; cursor: pointer; opacity: ${photoIndex === 0 ? '1' : '0'}; transition: opacity 0.25s ease; z-index: ${photoIndex === 0 ? '2' : '1'};" 
                            onclick="openPhotoFullscreen(this.dataset.fullUrl || this.src)">
                    `).join('')}
                    ${ad.photo_urls.length > 1 ? `
                    <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.6); padding: 5px 12px; border-radius: 20px; color: white; font-size: 0.8rem; z-index: 10;">
                        <span id="photoCounter">1 / ${ad.photo_urls.length}</span>
                    </div>
                    <button onclick="event.stopPropagation(); switchAdPhoto((window.currentPhotoIndex - 1 + window.currentAdPhotos.length) % window.currentAdPhotos.length)" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; cursor: pointer; z-index: 10;">❮</button>
                    <button onclick="event.stopPropagation(); switchAdPhoto((window.currentPhotoIndex + 1) % window.currentAdPhotos.length)" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; cursor: pointer; z-index: 10;">❯</button>
                    ` : ''}
                </div>
                ${ad.photo_urls.length > 1 ? `
                <div class="ad-photo-gallery">
                    ${ad.photo_urls.map((photoUrl, photoIndex) => `
                        <div class="ad-photo-thumbnail-small ${photoIndex === 0 ? 'active' : ''}" data-thumb-index="${photoIndex}" onclick="event.stopPropagation(); switchAdPhoto(${photoIndex})" style="background: linear-gradient(135deg, #1a1a2e 0%, #2e2e42 100%); border: 2px solid ${photoIndex === 0 ? 'var(--neon-cyan)' : 'transparent'}; border-radius: 8px;">
                            <img src="${getPhotoUrl(photoUrl, 'small')}" alt="Photo ${photoIndex + 1}" 
                                loading="eager" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
            ` : ''}
            
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
                    <div class="param-item"><span class="param-icon">👥</span><span>${formatTarget(ad.target)}, ${ageFrom}-${ageTo} лет</span></div>
                    <div class="param-item"><span class="param-icon">🎯</span><span>${formatGoals(ad.goal)}</span></div>
                    ${ad.orientation ? `<div class="param-item"><span class="param-icon">💗</span><span>${formatOrientation(ad.orientation)}</span></div>` : ''}
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
    
    console.log('✅ [ADS] Контент adContent заполнен, длина:', adContent.innerHTML.length);
    
    // Обновляем кнопку "Написать автору"
    const contactBtn = document.querySelector('#adDetails button.neon-button');
    if (contactBtn) {
        contactBtn.onclick = () => contactAuthor(ad.id, ad.user_token);
    }
    
    showScreen('adDetails');
    
    if (ad.photo_urls && ad.photo_urls.length > 1) {
        setupAdPhotoSwipe();
    }
}

/**
 * Переключение фото в анкете (все фото уже в DOM)
 */
function switchAdPhoto(photoIndex) {
    if (!window.currentAdPhotos || photoIndex >= window.currentAdPhotos.length) return;
    if (photoIndex === window.currentPhotoIndex) return; // Уже на этом фото
    
    window.currentPhotoIndex = photoIndex;
    
    // Переключаем видимость фото
    const photos = document.querySelectorAll('.ad-slide-photo');
    photos.forEach((img, idx) => {
        if (idx === photoIndex) {
            img.style.opacity = '1';
            img.style.zIndex = '2';
        } else {
            img.style.opacity = '0';
            img.style.zIndex = '1';
        }
    });
    
    // Обновляем счётчик
    const counter = document.getElementById('photoCounter');
    if (counter) counter.textContent = `${photoIndex + 1} / ${window.currentAdPhotos.length}`;
    
    // Обновляем активный thumbnail
    const thumbs = document.querySelectorAll('.ad-photo-thumbnail-small');
    thumbs.forEach((thumb, idx) => {
        thumb.style.borderColor = idx === photoIndex ? 'var(--neon-cyan)' : 'transparent';
    });
}

/**
 * Настройка свайпа для фото анкеты
 */
function setupAdPhotoSwipe() {
    const container = document.getElementById('adMainPhotoContainer');
    if (!container) return;
    
    let startX = 0;
    let isDragging = false;
    
    const handleStart = (e) => {
        startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        isDragging = true;
    };
    
    const handleEnd = (e) => {
        if (!isDragging) return;
        const endX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
        const diff = startX - endX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                const nextIndex = (window.currentPhotoIndex + 1) % window.currentAdPhotos.length;
                switchAdPhoto(nextIndex);
            } else {
                const prevIndex = (window.currentPhotoIndex - 1 + window.currentAdPhotos.length) % window.currentAdPhotos.length;
                switchAdPhoto(prevIndex);
            }
        }
        isDragging = false;
    };
    
    container.addEventListener('touchstart', handleStart, { passive: true });
    container.addEventListener('touchend', handleEnd, { passive: true });
    container.addEventListener('mousedown', handleStart);
    container.addEventListener('mouseup', handleEnd);
}

/**
 * Открыть фото в полноэкранном режиме
 */
function openPhotoFullscreen(photoUrl) {
    const overlay = document.createElement('div');
    overlay.id = 'photoFullscreenOverlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.95); z-index: 10000;
        display: flex; align-items: center; justify-content: center; cursor: zoom-out;
    `;
    
    const img = document.createElement('img');
    img.src = photoUrl;
    img.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain;';
    
    // Кнопка закрытия
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        position: absolute; top: 20px; right: 20px;
        background: rgba(255, 255, 255, 0.2); border: none;
        color: white; width: 40px; height: 40px; border-radius: 50%;
        font-size: 20px; cursor: pointer; z-index: 10001;
    `;
    closeBtn.onclick = (e) => { e.stopPropagation(); closePhotoFullscreen(); };
    
    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    overlay.addEventListener('click', closePhotoFullscreen);
    document.body.appendChild(overlay);
    
    // Сохраняем состояние для обработки кнопки "Назад" (проверяется в handleBackButton)
    window.photoFullscreenOpen = true;
}

/**
 * Закрыть полноэкранный просмотр фото
 */
function closePhotoFullscreen() {
    const overlay = document.getElementById('photoFullscreenOverlay');
    if (overlay) {
        overlay.remove();
        window.photoFullscreenOpen = false;
    }
}

/**
 * Получить URL фото с размером
 */
function getPhotoUrl(url, size = 'medium') {
    if (!url) return '';
    // Если это наш прокси URL - возвращаем как есть
    if (url.startsWith('/api/')) return url;
    return url;
}

/**
 * Переключение компактного режима списка анкет
 */
function toggleAdsCompact() {
    const current = window.localStorage.getItem('ads_compact') === '1';
    window.localStorage.setItem('ads_compact', current ? '0' : '1');
    loadAds(adsFilters);
}

/**
 * ===== УПРАВЛЕНИЕ СОБСТВЕННЫМИ АНКЕТАМИ =====
 */

/**
 * Показать мои анкеты
 */
function showMyAds() {
    console.log('📋 [ADS] Открытие моих анкет');
    showScreen('myAds');
    loadMyAds();
}

/**
 * Загрузить мои анкеты (фильтрация по user_token как в монолите)
 */
async function loadMyAds() {
    console.log('📋 [ADS] Загрузка моих анкет');
    
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
        const userToken = localStorage.getItem('user_token');
        const userId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;
        
        if (!userToken && !userId) {
            myAdsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">🔐</div>
                    <h3>Требуется авторизация</h3>
                    <p>Авторизуйтесь чтобы видеть свои анкеты</p>
                </div>
            `;
            return;
        }
        
        // Получаем ВСЕ анкеты (как в монолите)
        const response = await fetch('/api/ads');
        const result = await response.json();
        const allAds = result.ads || [];
        
        console.log('📋 Всего анкет:', allAds.length);
        
        // Фильтруем по user_token (как в монолите)
        let myAds = [];
        if (userToken) {
            myAds = allAds.filter(ad => ad.user_token === userToken);
            console.log('🔍 Фильтрация по user_token:', userToken.substring(0, 16) + '...', 
                'найдено:', myAds.length,
                'первые 3 токена анкет:', allAds.slice(0, 3).map(a => a.user_token?.substring(0, 16) + '...')
            );
        } else if (userId) {
            myAds = allAds.filter(ad => String(ad.tg_id) === String(userId));
        }
        
        console.log('📋 Мои анкеты:', myAds.length);
        
        if (myAds.length === 0) {
            myAdsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">📭</div>
                    <h3>У вас пока нет анкет</h3>
                    <p>Создайте первую анкету и она появится здесь</p>
                    <button class="neon-button primary" onclick="showCreateAd()">
                        ✏️ Создать анкету
                    </button>
                </div>
            `;
            return;
        }
        
        // Отображаем анкеты с кнопками действий
        myAdsList.innerHTML = myAds.map(ad => {
            const isPinned = ad.is_pinned && (!ad.pinned_until || new Date(ad.pinned_until) > new Date());
            const ageFrom = ad.age_from || ad.ageFrom || '?';
            const ageTo = ad.age_to || ad.ageTo || '?';
            const nickname = ad.display_nickname || 'Аноним';
            
            const bodyLabels = {
                slim: 'Худощавое', athletic: 'Спортивное', average: 'Среднее', curvy: 'Полное',
                'Стройное': 'Стройное', 'Обычное': 'Обычное', 'Плотное': 'Плотное', 'Спортивное': 'Спортивное', 'Другое': 'Другое'
            };
            const bodyType = ad.body_type ? (bodyLabels[ad.body_type] || ad.body_type) : 'не указано';
            
            const authorGender = typeof formatGender === 'function' ? formatGender(ad.gender) : ad.gender;
            const genderLower = ad.gender?.toLowerCase();
            let authorIcon = '♀️';
            if (genderLower === 'male' || genderLower === 'мужчина') authorIcon = '♂️';
            else if (genderLower === 'пара') authorIcon = '👫';
            
            const targetText = typeof formatTarget === 'function' ? formatTarget(ad.target) : ad.target;
            const targetLower = ad.target?.toLowerCase();
            let targetIcon = '👤';
            if (targetLower === 'male' || targetLower === 'мужчину') targetIcon = '♂️';
            else if (targetLower === 'female' || targetLower === 'женщину' || targetLower === 'девушку') targetIcon = '♀️';
            else if (targetLower === 'couple' || targetLower === 'пару') targetIcon = '♂️♀️';
            
            const flag = (typeof locationData !== 'undefined' && locationData[ad.country]) ? locationData[ad.country].flag : '🌍';
            const cityText = ad.region === ad.city ? ad.city : `${ad.region}, ${ad.city}`;
            
            return `
            <div class="ad-card" data-ad-id="${ad.id}">
                ${isPinned ? '<span class="pinned-badge">📌 Закреплено</span>' : ''}
                <div class="ad-header">
                    <h3>${authorIcon} ${authorGender}, ${ad.my_age || '?'} лет</h3>
                    <div class="created-at"><span class="icon">⏰</span> ${typeof formatCreatedAt === 'function' ? formatCreatedAt(ad.created_at) : ad.created_at}</div>
                </div>
                <div class="ad-info">
                    <div class="ad-field"><span class="icon">💪</span> <strong>Телосложение:</strong> ${bodyType}</div>
                    ${ad.orientation ? `<div class="ad-field"><span class="icon">💗</span> <strong>Ориентация:</strong> ${typeof formatOrientation === 'function' ? formatOrientation(ad.orientation) : ad.orientation}</div>` : ''}
                    <div class="ad-field"><span class="icon">🎯</span> <strong>Цель:</strong> ${typeof formatGoals === 'function' ? formatGoals(ad.goal) : ad.goal}</div>
                    <div class="ad-field"><span class="icon">${targetIcon}</span> <strong>Ищу:</strong> ${targetText}, ${ageFrom}-${ageTo} лет</div>
                    <div class="ad-field"><span class="icon">📍</span> ${flag} ${cityText}</div>
                    ${ad.text ? `<div class="ad-field full-width"><span class="icon">💬</span> <strong>О себе:</strong> ${ad.text}</div>` : ''}
                </div>
                <div class="ad-actions">
                    <button class="delete-ad-btn" onclick="deleteMyAd(${ad.id})">🗑️ Удалить</button>
                    <button class="pin-ad-btn" onclick="pinMyAd(${ad.id}, ${!isPinned})">${isPinned ? '✖️ Открепить' : '📌 Закрепить (1ч)'}</button>
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
                <button class="neon-button primary" onclick="loadMyAds()">🔄 Попробовать снова</button>
            </div>
        `;
    }
}

/**
 * Удалить мою анкету
 */
async function deleteMyAd(adId) {
    tg.showConfirm('Удалить анкету?', async (confirmed) => {
        if (!confirmed) return;
        
        try {
            const userToken = localStorage.getItem('user_token');
            
            const response = await fetch(`/api/ads/${adId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_token: userToken })
            });
            
            const result = await response.json();
            
            if (result.error) {
                tg.showAlert('Ошибка удаления анкеты');
                return;
            }
            
            tg.showAlert('✅ Анкета удалена');
            showMyAds(); // Перезагружаем список
            
        } catch (error) {
            console.error('❌ [ADS] Ошибка удаления анкеты:', error);
            tg.showAlert('Ошибка');
        }
    });
}

/**
 * ===== ОБЩИЕ ФУНКЦИИ =====
 */

/**
 * Связаться с автором анкеты
 */
async function contactAuthor(adId, authorToken) {
    console.log('💬 [ADS] Создание чата с автором анкеты');
    
    const userToken = localStorage.getItem('user_token');
    if (!userToken || userToken === 'null' || userToken === 'undefined') {
        tg.showAlert('⚠️ Сначала создайте анкету или авторизуйтесь');
        return;
    }
    
    if (!authorToken) {
        tg.showAlert('⚠️ Не удалось определить автора анкеты');
        return;
    }
    
    // Проверяем что пользователь не пишет сам себе
    if (userToken === authorToken) {
        tg.showAlert('❌ Вы не можете написать сами себе');
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
                    blockedToken: userToken
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
    
    // Закрываем модалку анкеты
    closeAdModal();
    
    // Запрашиваем текст сообщения через кастомное модальное окно
    showCustomPrompt('Введите сообщение автору анкеты:', async (message) => {
        if (!message || message.trim() === '') {
            return;
        }
        
        try {
            // Проверяем, существует ли уже чат
            const checkResponse = await fetch('/api/neon-chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'check-existing',
                    params: { user1_token: userToken, user2_token: authorToken, adId: adId }
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
                if (existingChat.blocked_by_token) {
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

            // Создаем новый запрос на чат
            const createResponse = await fetch('/api/neon-chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    params: { 
                        user1_token: userToken, 
                        user2_token: authorToken, 
                        adId: adId,
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
                        'Эта анкета уже получила максимум запросов.\n\n' +
                        'Хотите получить PRO и написать автору в любом случае?',
                        (confirmed) => {
                            if (confirmed && typeof showPremiumModal === 'function') {
                                showPremiumModal();
                            }
                        }
                    );
                    return;
                }
                
                tg.showAlert('❌ ' + (createResult.error.details || createResult.error.message));
                return;
            }
            
            tg.showAlert('✅ Запрос на чат отправлен!\n\nИди в раздел "Мои чаты" для просмотра ответа');
            
        } catch (error) {
            console.error('❌ [ADS] Ошибка создания чата:', error);
            tg.showAlert('Ошибка при создании чата');
        }
    });
}

/**
 * Вспомогательная функция для отправки сообщения автору
 */
async function sendContactMessage(ad, authorToken, currentUserToken, message) {
    try {
        // Проверяем, существует ли уже чат
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

        // Создаем новый запрос на чат
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
                    'Эта анкета уже получила максимум запросов.\n\n' +
                    'Хотите получить PRO и написать автору в любом случае?',
                    (confirmed) => {
                        if (confirmed && typeof showPremiumModal === 'function') {
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
            // Отправляем уведомление в Telegram
            try {
                await fetch('/api/send-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        receiverToken: authorToken,
                        receiverTgId: ad.tg_id,
                        adId: ad.id,
                        messageText: message.trim()
                    })
                });
            } catch (notifyError) {
                console.warn('Notification failed:', notifyError);
            }

            tg.showAlert('✅ Запрос на чат отправлен!\n\nАвтор анкеты получит уведомление.');
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        tg.showAlert('❌ Ошибка при отправке сообщения. Попробуйте позже.');
    }
}

/**
 * Перейти на следующую страницу анкет
 */
function nextAdsPage() {
    const totalPages = Math.ceil(totalAdsCount / 10);
    if (currentAdsPage < totalPages) {
        currentAdsPage++;
        loadAds();
        window.scrollTo(0, 0);
    }
}

/**
 * Вернуться на предыдущую страницу анкет
 */
function prevAdsPage() {
    if (currentAdsPage > 1) {
        currentAdsPage--;
        loadAds();
        window.scrollTo(0, 0);
    }
}

/**
 * ===== ФИЛЬТРЫ АНКЕТ =====
 */

/**
 * Переключить панель фильтров
 */
function toggleFilters() {
    const panel = document.getElementById('filtersPanel');
    if (!panel) return;
    if (panel.style.display === 'none' || !panel.style.display) {
        panel.style.display = 'block';
        updateFilterButtons();
    } else {
        panel.style.display = 'none';
    }
}

/**
 * Установить значение фильтра
 */
function setFilter(type, value) {
    adsFilters[type] = value;
    updateFilterButtons();
}

/**
 * Обновить активные кнопки фильтров
 */
function updateFilterButtons() {
    document.querySelectorAll('[data-filter-type="gender"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === adsFilters.gender);
    });
    document.querySelectorAll('[data-filter-type="target"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === adsFilters.target);
    });
    document.querySelectorAll('[data-filter-type="orientation"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === adsFilters.orientation);
    });
}

/**
 * Применить фильтры
 */
function applyFilters() {
    const ageFromInput = document.getElementById('ageFrom');
    const ageToInput = document.getElementById('ageTo');
    
    if (ageFromInput && ageToInput) {
        adsFilters.ageFrom = parseInt(ageFromInput.value) || 18;
        adsFilters.ageTo = parseInt(ageToInput.value) || 99;
    }
    
    let activeCount = 0;
    if (adsFilters.gender !== 'all') activeCount++;
    if (adsFilters.target !== 'all') activeCount++;
    if (adsFilters.orientation !== 'all') activeCount++;
    if (adsFilters.ageFrom !== 18 || adsFilters.ageTo !== 99) activeCount++;
    
    const badge = document.getElementById('filterBadge');
    if (badge) {
        badge.textContent = activeCount > 0 ? activeCount : '';
        badge.style.display = activeCount > 0 ? 'inline' : 'none';
    }
    
    const panel = document.getElementById('filtersPanel');
    if (panel) panel.style.display = 'none';
    
    showBrowseAds();
}

/**
 * Сбросить фильтры
 */
function resetFilters() {
    adsFilters = {
        gender: 'all',
        target: 'all',
        orientation: 'all',
        ageFrom: 18,
        ageTo: 99
    };
    
    const ageFromInput = document.getElementById('ageFrom');
    const ageToInput = document.getElementById('ageTo');
    if (ageFromInput) ageFromInput.value = 18;
    if (ageToInput) ageToInput.value = 99;
    
    updateFilterButtons();
    
    const badge = document.getElementById('filterBadge');
    if (badge) {
        badge.textContent = '';
        badge.style.display = 'none';
    }
    
    const panel = document.getElementById('filtersPanel');
    if (panel) panel.style.display = 'none';
    
    showBrowseAds();
}

/**
 * ===== ФУНКЦИИ ВОЗРАСТА =====
 */

/**
 * Увеличить возраст
 */
function increaseAge(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    let currentValue = parseInt(input.value);
    const maxValue = parseInt(input.max) || 100;
    
    if (isNaN(currentValue) || !input.value) {
        input.value = 18;
        syncAgeFromTo(inputId);
        return;
    }
    
    if (currentValue < maxValue) {
        input.value = currentValue + 1;
        syncAgeFromTo(inputId);
    }
}

/**
 * Уменьшить возраст
 */
function decreaseAge(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    let currentValue = parseInt(input.value);
    const minValue = parseInt(input.min) || 18;
    
    if (isNaN(currentValue) || !input.value) {
        input.value = 18;
        syncAgeFromTo(inputId);
        return;
    }
    
    if (currentValue > minValue) {
        input.value = currentValue - 1;
        syncAgeFromTo(inputId);
    }
}

/**
 * Синхронизация полей "От" и "До" для возраста партнера
 * Если "От" >= "До", то "До" автоматически увеличивается
 */
function syncAgeFromTo(changedInputId) {
    const ageFromInput = document.getElementById('ageFrom');
    const ageToInput = document.getElementById('ageTo');
    
    if (!ageFromInput || !ageToInput) return;
    
    const ageFrom = parseInt(ageFromInput.value) || 0;
    const ageTo = parseInt(ageToInput.value) || 0;
    
    // Если изменили "От" и оно >= "До", увеличиваем "До"
    if (changedInputId === 'ageFrom' && ageFrom > 0 && ageTo > 0 && ageFrom >= ageTo) {
        const newAgeTo = Math.min(ageFrom + 1, 99);
        ageToInput.value = newAgeTo;
        console.log(`📅 [AGE] Авто-синхронизация: От=${ageFrom}, До=${newAgeTo}`);
    }
}

/**
 * ===== ФУНКЦИИ ЖАЛОБ =====
 */

let currentReportData = {
    reportedUserId: null,
    reportedNickname: null,
    reportType: null,
    relatedAdId: null,
    reason: null
};

/**
 * Пожаловаться на анкету
 */
function reportAd() {
    const ad = window.currentAds?.[window.currentAdIndex];
    if (!ad) {
        tg.showAlert('Анкета не найдена');
        return;
    }
    
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
    
    const modal = document.getElementById('reportModal');
    if (modal) modal.style.display = 'flex';
}

/**
 * Закрыть модальное окно жалобы
 */
function closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) modal.style.display = 'none';
    
    const details = document.getElementById('reportDetailsSection');
    if (details) details.style.display = 'none';
    
    const desc = document.getElementById('reportDescription');
    if (desc) desc.value = '';
    
    document.querySelectorAll('.report-reason-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    currentReportData.reason = null;
}

/**
 * Выбрать причину жалобы
 */
function selectReportReason(reason) {
    currentReportData.reason = reason;
    
    document.querySelectorAll('.report-reason-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    if (event && event.target) {
        const btn = event.target.closest('.report-reason-btn');
        if (btn) btn.classList.add('selected');
    }
    
    const details = document.getElementById('reportDetailsSection');
    if (details) details.style.display = 'block';
}

/**
 * Отправить жалобу
 */
async function submitReport() {
    if (!currentReportData.reason) {
        tg.showAlert('Выберите причину жалобы');
        return;
    }
    
    const currentUserId = tg?.initDataUnsafe?.user?.id || localStorage.getItem('user_id');
    
    if (!currentUserId || !currentReportData.reportedUserId) {
        tg.showAlert('Ошибка: не удалось определить пользователей');
        return;
    }
    
    const description = document.getElementById('reportDescription')?.value?.trim();
    
    try {
        const response = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reporterId: parseInt(currentUserId),
                reportedUserId: parseInt(currentReportData.reportedUserId),
                reportType: currentReportData.reportType,
                reason: currentReportData.reason,
                description: description || null,
                relatedAdId: currentReportData.relatedAdId || null,
                relatedMessageId: null
            })
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

// Экспорт функций в глобальную область
window.showCreateAd = showCreateAd;
window.showBrowseAds = showBrowseAds;
window.showMyAds = showMyAds;
window.nextStep = nextStep;
window.previousStep = previousStep;
window.showStep = showStep;
window.resetForm = resetForm;
window.validateCurrentStep = validateCurrentStep;
window.pinMyAd = pinMyAd;
window.submitAd = submitAd;
window.closeAdModal = closeAdModal;
window.showAdModal = showAdModal;
window.contactAuthor = contactAuthor;
window.deleteMyAd = deleteMyAd;
window.loadAds = loadAds;
window.nextAdsPage = nextAdsPage;
window.prevAdsPage = prevAdsPage;
window.handleCreateAdBack = handleCreateAdBack;
window.nextFormStep = nextFormStep;
window.prevFormStep = prevFormStep;
window.updateFormStep = updateFormStep;
window.displayAds = displayAds;
window.toggleFilters = toggleFilters;
window.setFilter = setFilter;
window.updateFilterButtons = updateFilterButtons;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.increaseAge = increaseAge;
window.decreaseAge = decreaseAge;
window.reportAd = reportAd;
window.closeReportModal = closeReportModal;
window.selectReportReason = selectReportReason;
window.submitReport = submitReport;
window.initFormHandlers = initFormHandlers;
window.selectGender = selectGender;
window.selectTarget = selectTarget;
window.selectGoal = selectGoal;
window.selectBody = selectBody;
window.selectOrientation = selectOrientation;
window.updateCharacterCount = updateCharacterCount;
window.showAdDetails = showAdDetails;
window.switchAdPhoto = switchAdPhoto;
window.setupAdPhotoSwipe = setupAdPhotoSwipe;
window.openPhotoFullscreen = openPhotoFullscreen;
window.getPhotoUrl = getPhotoUrl;
window.toggleAdsCompact = toggleAdsCompact;
window.normalizeCity = normalizeCity;
window.updateFormLocationDisplay = updateFormLocationDisplay;
window.handleCityFilter = handleCityFilter;
window.loadAdsByLocation = loadAdsByLocation;
window.loadMoreAds = loadMoreAds;
window.setupInfiniteScroll = setupInfiniteScroll;
window.sendContactMessage = sendContactMessage;
window.showMyAds = showMyAds;
window.loadMyAds = showMyAds;
window.formatGender = formatGender;
window.formatTarget = formatTarget;
window.formatGoals = formatGoals;
window.formatOrientation = formatOrientation;
window.getAllAds = getAllAds;
window.performDeleteAd = performDeleteAd;
window.validateAgeRange = validateAgeRange;
window.validateAgeRangeWithMessage = validateAgeRangeWithMessage;

/**
 * Получить все анкеты (сортированные)
 */
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
    
    // Сортируем: сначала закрепленные, потом по дате
    const now = new Date();
    return ads.sort((a, b) => {
        const aPinned = a.is_pinned && (!a.pinned_until || new Date(a.pinned_until) > now);
        const bPinned = b.is_pinned && (!b.pinned_until || new Date(b.pinned_until) > now);
        
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        return new Date(b.created_at) - new Date(a.created_at);
    });
}

/**
 * Удаление анкеты
 */
async function performDeleteAd(adId) {
    try {
        const userId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;
        const userToken = localStorage.getItem('user_token');

        if ((!userId || userId.startsWith('web_')) && !userToken) {
            tg.showAlert('❌ Требуется авторизация через Telegram');
            return;
        }

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

        if (result.success) {
            tg.showAlert('🗑️ Анкета удалена!');
            if (typeof loadMyAds === 'function') loadMyAds();
            if (typeof loadPremiumStatus === 'function') await loadPremiumStatus();
        } else {
            tg.showAlert('❌ Не удалось удалить анкету');
        }
    } catch (error) {
        console.error('Error deleting ad:', error);
        tg.showAlert('❌ Ошибка при удалении анкеты');
    }
}

/**
 * Валидация диапазона возраста (автокоррекция)
 */
function validateAgeRange() {
    const ageFrom = document.getElementById('ageFrom');
    const ageTo = document.getElementById('ageTo');
    
    if (ageFrom && ageTo) {
        let fromValue = parseInt(ageFrom.value);
        let toValue = parseInt(ageTo.value);
        
        if (ageFrom.value && !isNaN(fromValue)) {
            if (fromValue < 18) { ageFrom.value = 18; fromValue = 18; }
            if (fromValue > 99) { ageFrom.value = 99; fromValue = 99; }
        }
        
        if (ageTo.value && !isNaN(toValue)) {
            if (toValue < 18) { ageTo.value = 18; toValue = 18; }
            if (toValue > 99) { ageTo.value = 99; toValue = 99; }
        }
        
        if (ageFrom.value && ageTo.value && !isNaN(fromValue) && !isNaN(toValue)) {
            if (fromValue > toValue) ageTo.value = fromValue;
        }
    }
}

/**
 * Валидация диапазона возраста с сообщением об ошибке
 */
function validateAgeRangeWithMessage() {
    const ageFrom = document.getElementById('ageFrom');
    const ageTo = document.getElementById('ageTo');
    
    const fromValue = parseInt(ageFrom?.value);
    const toValue = parseInt(ageTo?.value);
    
    if (!fromValue || isNaN(fromValue) || !toValue || isNaN(toValue)) {
        tg.showAlert('❌ Укажите возраст партнера');
        return false;
    }
    
    if (fromValue < 18 || fromValue > 99 || toValue < 18 || toValue > 99) {
        tg.showAlert('❌ Возраст должен быть от 18 до 99 лет');
        return false;
    }
    
    if (fromValue > toValue) {
        tg.showAlert('❌ Возраст "От" не может быть больше "До"');
        return false;
    }
    
    return true;
}

/**
 * Настройка обработчиков событий для формы создания анкеты
 */
function setupEventListeners() {
    // Инициализируем систему локации
    if (typeof initLocationSelector === 'function') {
        initLocationSelector();
    }
    
    // Кнопки выбора пола
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof selectGender === 'function') {
                selectGender(btn.dataset.gender);
            }
        });
    });

    // Кнопки выбора цели поиска
    document.querySelectorAll('.target-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof selectTarget === 'function') {
                selectTarget(btn.dataset.target);
            }
        });
    });

    // Кнопки выбора цели знакомства
    document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof selectGoal === 'function') {
                selectGoal(btn.dataset.goal);
            }
        });
    });

    // Кнопки выбора телосложения
    document.querySelectorAll('.body-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof selectBody === 'function') {
                selectBody(btn.dataset.body);
            }
        });
    });

    // Фильтры в просмотре анкет
    document.querySelectorAll('.city-btn.filter').forEach(btn => {
        btn.addEventListener('click', function() {
            if (typeof handleCityFilter === 'function') {
                handleCityFilter(this.dataset.city);
            }
        });
    });
    
    console.log('✅ [ADS] setupEventListeners выполнен');
}

window.setupEventListeners = setupEventListeners;

console.log('✅ [ADS] Модуль анкет инициализирован');

} catch(e) { console.error('❌ Ошибка в модуле ads.js:', e); }
})();

// ========== chats.js (65.1 KB) ==========
(function() {
try {
/**
 * Модуль чатов и мессинджинга (chats.js)
 * 
 * Функции:
 * - Загрузка и отправка сообщений
 * - Управление чатами (блокировка, удаление)
 * - Уведомления и счётчики
 * - UI для чатов
 */

console.log('💬 [CHATS] Инициализация модуля чатов');

/**
 * ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
 */

let currentChatId = null;
let currentAdId = null;
let chatPollingInterval = null;
let myChatsPollingInterval = null;
let currentOpponentId = null;
let isUserBlocked = false;

// Переменная для ответа на сообщение
let replyToMessage = null;

/**
 * ===== ОСНОВНЫЕ ФУНКЦИИ ЧАТОВ =====
 */

/**
 * Показать список моих чатов
 */
async function showMyChats() {
    console.log('📱 [CHATS] Открытие моих чатов');
    
    // Проверяем никнейм перед показом чатов
    const nickname = localStorage.getItem('userNickname');
    if (!nickname || nickname.trim() === '') {
        console.warn('⚠️ [CHATS] Попытка открыть чаты без никнейма - блокируем');
        tg.showAlert('Сначала выберите никнейм');
        return;
    }
    
    showScreen('myChats');
    await loadMyChats();
    
    // Запускаем автообновление
    if (myChatsPollingInterval) clearInterval(myChatsPollingInterval);
    
    myChatsPollingInterval = setInterval(async () => {
        const myChatsScreen = document.getElementById('myChats');
        if (myChatsScreen?.classList.contains('active')) {
            console.log('🔄 [CHATS] Автообновление списка чатов...');
            await loadMyChats();
            await updateChatBadge();
        } else {
            clearInterval(myChatsPollingInterval);
            myChatsPollingInterval = null;
        }
    }, 5000); // Каждые 5 секунд
}

/**
 * Загрузить список чатов пользователя
 */
async function loadMyChats() {
    try {
        console.log('📥 [CHATS] Загрузка списка чатов');
        
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        if (!userId && !userToken) {
            console.error('❌ [CHATS] Нет авторизации');
            return;
        }
        
        // Запрашиваем активные чаты
        const acceptedResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-active',
                params: { userId: userToken || userId }
            })
        });
        const acceptedResult = await acceptedResponse.json();
        
        // Запрашиваем входящие запросы
        const pendingResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-pending',
                params: { user_token: userToken || userId }
            })
        });
        const pendingResult = await pendingResponse.json();
        
        if (acceptedResult.error || pendingResult.error) {
            console.error('❌ [CHATS] Ошибка загрузки чатов:', 
                acceptedResult.error || pendingResult.error);
            return;
        }
        
        let acceptedChats = acceptedResult.data || [];
        let pendingRequests = pendingResult.data || [];
        
        // Сортируем чаты по времени последнего сообщения
        acceptedChats.sort((a, b) => {
            const timeB = new Date(b.last_message_time || b.updated_at || b.created_at).getTime();
            const timeA = new Date(a.last_message_time || a.updated_at || a.created_at).getTime();
            return timeB - timeA;
        });
        
        console.log(`✅ [CHATS] Загружено ${acceptedChats.length} активных + ${pendingRequests.length} входящих`);
        
        // Обновляем UI
        updateChatsList(acceptedChats, pendingRequests);
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка loadMyChats:', error);
    }
}

/**
 * Обновить UI списка чатов
 */
function updateChatsList(acceptedChats, pendingRequests) {
    const activeChats = document.getElementById('activeChats');
    const chatRequests = document.getElementById('chatRequests');
    const activeCount = document.getElementById('activeChatsCount');
    const requestsCount = document.getElementById('requestsCount');
    const userId = localStorage.getItem('user_token') || getCurrentUserId();
    
    if (activeCount) activeCount.textContent = acceptedChats.length;
    if (requestsCount) requestsCount.textContent = pendingRequests.length;
    
    // Отображаем активные чаты
    if (activeChats) {
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
                        blockStatus = '<span style="color: var(--neon-orange); font-size: 0.8rem;">🚫 (Чат заблокирован вами)</span>';
                    } else {
                        blockStatus = '<span style="color: var(--neon-pink); font-size: 0.8rem;">🚫 (Вы заблокированы)</span>';
                    }
                }
                
                return `
                    <div class="chat-card" onclick="openChat('${chat.id}')">
                        <div class="chat-card-header">
                            <span class="chat-ad-id">💬 Чат #${chat.id || 'N/A'}</span>
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
    }
    
    // Отображаем входящие запросы
    if (chatRequests) {
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
                const senderName = chat.sender_nickname || 'Собеседник';
                
                let messageText = chat.last_message_text || chat.message || 'Хочет начать диалог';
                if (messageText.length > 80) {
                    messageText = messageText.substring(0, 77) + '...';
                }
                
                // PRO статус отправителя
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
                            <strong>${typeof escapeHtml === 'function' ? escapeHtml(senderName) : senderName}</strong><br>
                            "${typeof escapeHtml === 'function' ? escapeHtml(messageText) : messageText}"
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
    }
}

/**
 * Открыть чат
 */
async function openChat(chatId) {
    console.log('💬 [CHATS] Открытие чата:', chatId);
    
    currentChatId = chatId;
    showScreen('chatView');
    
    try {
        // Используем user_token как основной идентификатор
        const userToken = localStorage.getItem('user_token');
        const userId = userToken || getCurrentUserId();
        
        if (!userId) {
            console.warn('⚠️ [CHATS] userId не найден');
        }
        
        // Отмечаем пользователя как активного (если есть userId)
        if (userId) {
            await markUserActive(userId, chatId);
        }
        
        // Загружаем информацию о чате и сообщения
        await loadChatMessages(chatId);
        
        // Проверяем статус блокировки
        await checkBlockStatus(chatId);
        
        // Запускаем автообновление сообщений
        if (userId) {
            startChatPolling(chatId, userId);
        }
        
        // Помечаем сообщения как прочитанные
        await markMessagesAsRead(chatId);
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка открытия чата:', error);
        tg.showAlert('Ошибка при открытии чата');
        showMyChats();
    }
}

/**
 * Загрузить сообщения чата
 */
async function loadChatMessages(chatId, silent = false) {
    try {
        console.log('📥 [CHATS] Загрузка сообщений чата:', chatId);
        
        const messagesContainer = document.getElementById('chatMessages');
        const scrollContainer = document.querySelector('.chat-messages-container');
        
        if (!silent && messagesContainer) {
            messagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray); padding: 20px;">Загрузка сообщений...</p>';
        }
        
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
            console.error('❌ [CHATS] Ошибка загрузки сообщений:', result.error);
            if (!silent && messagesContainer) {
                messagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray);">Ошибка загрузки сообщений</p>';
            }
            return;
        }
        
        const messages = result.data || [];
        console.log(`✅ [CHATS] Загружено ${messages.length} сообщений`);
        
        if (messages.length === 0) {
            if (messagesContainer) {
                messagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray);">Нет сообщений. Начните диалог!</p>';
            }
            return;
        }
        
        // Получаем user_token для сравнения
        let myUserId = localStorage.getItem('user_token');
        if (!myUserId || myUserId === 'null' || myUserId === 'undefined') {
            myUserId = getCurrentUserId();
        }
        
        // Проверяем, нужно ли обновлять
        if (silent && messagesContainer) {
            const currentMessagesCount = messagesContainer.querySelectorAll('.message').length;
            if (currentMessagesCount === messages.length) {
                return; // Нет новых сообщений
            }
        }
        
        // Сохраняем позицию скролла для silent режима
        const wasAtBottom = silent && scrollContainer ? 
            (scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 50) : 
            true;
        
        // Сохраняем никнейм оппонента
        const firstOpponentMessage = messages.find(msg => msg.sender_token != myUserId);
        if (firstOpponentMessage && firstOpponentMessage.sender_nickname) {
            window.currentOpponentNickname = firstOpponentMessage.sender_nickname;
        }
        
        if (messagesContainer) {
            messagesContainer.innerHTML = messages.map(msg => {
                const isMine = msg.sender_token == myUserId;
                const messageClass = isMine ? 'sent' : 'received';
                const time = formatMessageTime(msg.created_at);
                
                // Индикатор ответа
                let replyIndicatorHtml = '';
                if (msg.reply_to_message_id) {
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
                
                // Никнейм для входящих
                let nicknameHtml = '';
                if (!isMine) {
                    const nickname = msg.sender_nickname || 'Собеседник';
                    nicknameHtml = `<div class="message-nickname">${escapeHtml(nickname)}</div>`;
                }
                
                // Фото/видео
                let photoHtml = '';
                if (msg.photo_url) {
                    const isVideo = msg.photo_url.includes('.mp4') || msg.photo_url.includes('.mov') || msg.photo_url.includes('video');
                    
                    if (isVideo) {
                        photoHtml = `<video src="${escapeHtml(msg.photo_url)}" class="message-photo" controls playsinline controlslist="nodownload" disablePictureInPicture></video>`;
                    } else {
                        photoHtml = `<div class="message-photo-secure" style="background-image: url('${escapeHtml(msg.photo_url)}');" onclick="showPhotoModal('${escapeHtml(msg.photo_url)}')"></div>`;
                    }
                }
                
                // Текст сообщения
                let messageTextHtml = '';
                if (msg.message) {
                    messageTextHtml = `<div class="message-text">${escapeHtml(msg.message)}</div>`;
                }
                
                // Статусы доставки
                let statusIcon = '';
                if (isMine) {
                    if (msg.read) {
                        statusIcon = '<span class="message-status read">✓✓</span>';
                    } else if (msg.delivered) {
                        statusIcon = '<span class="message-status delivered">✓✓</span>';
                    } else {
                        statusIcon = '<span class="message-status sent">✓</span>';
                    }
                }
                
                const nickname = msg.sender_nickname || 'Собеседник';
                
                // Реакции
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
            
            // Обработчики реакций
            if (typeof setupMessageReactions === 'function') {
                setupMessageReactions();
            }
            
            // Обработчики свайпов
            if (typeof setupMessageSwipeHandlers === 'function') {
                setupMessageSwipeHandlers();
            }
        }
        
        // Скроллим вниз
        if (scrollContainer && (!silent || wasAtBottom)) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            setTimeout(() => {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }, 100);
        }
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка при загрузке сообщений:', error);
    }
}

/**
 * Отправить сообщение
 */
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const messageText = input?.value?.trim();
    
    if (!messageText || !currentChatId) return;
    
    try {
        console.log('📤 [CHATS] Отправка сообщения в чат:', currentChatId);
        
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        const nickname = getUserNickname();
        
        const response = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'send-message',
                params: {
                    chatId: currentChatId,
                    senderId: userToken || userId,
                    messageText: messageText,
                    senderNickname: nickname,
                    skipNotification: false
                }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            console.error('❌ [CHATS] Ошибка отправки сообщения:', result.error);
            
            if (result.error.message === 'Chat is blocked') {
                tg.showAlert('Чат заблокирован');
            }
            return;
        }
        
        console.log('✅ [CHATS] Сообщение отправлено');
        
        // Очищаем поле ввода
        if (input) input.value = '';
        
        // Перезагружаем сообщения
        await loadChatMessages(currentChatId);
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка при отправке сообщения:', error);
        tg.showAlert('Ошибка при отправке сообщения');
    }
}

/**
 * Принять запрос на чат
 */
async function acceptChatRequest(chatId) {
    try {
        console.log('✅ [CHATS] Принятие запроса на чат:', chatId);
        
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        const response = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'accept',
                params: { chatId, userId: userToken || userId }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            tg.showAlert('Ошибка при принятии запроса');
            return;
        }
        
        tg.showAlert('✅ Чат создан!');
        await loadMyChats();
        await updateChatBadge();
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка acceptChatRequest:', error);
    }
}

/**
 * Отклонить запрос на чат
 */
async function rejectChatRequest(chatId) {
    try {
        console.log('❌ [CHATS] Отклонение запроса на чат:', chatId);
        
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        const response = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'reject',
                params: { chatId, userId: userToken || userId }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            tg.showAlert('Ошибка при отклонении запроса');
            return;
        }
        
        tg.showAlert('✅ Запрос отклонён');
        await loadMyChats();
        await updateChatBadge();
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка rejectChatRequest:', error);
    }
}

/**
 * Помечение сообщений как прочитанных
 */
async function markMessagesAsRead(chatId) {
    try {
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'mark-read',
                params: { chatId, userId: userToken || userId }
            })
        });
        
        await updateChatBadge();
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка markMessagesAsRead:', error);
    }
}

/**
 * Отметить пользователя как активного в чате
 */
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
    } catch (error) {
        console.error('⚠️ [CHATS] Ошибка markUserActive:', error);
    }
}

/**
 * Запустить автообновление сообщений в чате
 */
function startChatPolling(chatId, userId) {
    if (chatPollingInterval) clearInterval(chatPollingInterval);
    
    chatPollingInterval = setInterval(async () => {
        if (currentChatId === chatId) {
            await loadChatMessages(chatId, true); // silent режим
            await markUserActive(userId, chatId);
        } else {
            clearInterval(chatPollingInterval);
            chatPollingInterval = null;
        }
    }, 3000); // Каждые 3 секунды
}

/**
 * Проверить статус блокировки чата
 */
async function checkBlockStatus(chatId) {
    try {
        console.log('🔍 [CHATS] Проверка статуса блокировки');
        
        const userToken = localStorage.getItem('user_token');
        
        if (!userToken || !chatId) {
            console.warn('⚠️ [CHATS] Нет userToken или chatId для проверки блокировки');
            return;
        }
        
        // Сначала получаем информацию о чате чтобы узнать токен оппонента
        const chatResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-chat-info',
                params: { chatId }
            })
        });
        
        const chatResult = await chatResponse.json();
        
        if (chatResult.error || !chatResult.data) {
            console.warn('⚠️ [CHATS] Не удалось получить информацию о чате');
            return;
        }
        
        const chat = chatResult.data;
        
        // Определяем токен оппонента
        const opponentToken = chat.user_token_1 === userToken ? chat.user_token_2 : chat.user_token_1;
        
        if (!opponentToken) {
            console.warn('⚠️ [CHATS] Не удалось определить токен оппонента');
            return;
        }
        
        // Проверяем блокировку между двумя пользователями
        const response = await fetch('/api/blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'check-block-status',
                params: { 
                    user1_token: userToken, 
                    user2_token: opponentToken 
                }
            })
        });
        
        const result = await response.json();
        
        if (result.data?.isBlocked) {
            isUserBlocked = result.data.blockedByCurrentUser;
            showBlockWarning(true, isUserBlocked ? 'self' : 'other');
        } else {
            isUserBlocked = false;
            showBlockWarning(false);
        }
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка проверки блокировки:', error);
    }
}

/**
 * Заблокировать/разблокировать пользователя
 */
async function toggleBlockUser() {
    console.log('🚫 [toggleBlockUser] Начало блокировки/разблокировки');
    
    const menu = document.getElementById('chatMenu');
    if (menu) menu.style.display = 'none';
    
    // Если идентификаторы не установлены, получаем из чата
    if (!currentOpponentId && !window.currentOpponentToken) {
        console.log('⚠️ [toggleBlockUser] Идентификаторы не найдены, получаем из чата...');
        
        if (!currentChatId) {
            tg.showAlert('Ошибка: ID собеседника не найден');
            return;
        }
        
        try {
            let userId = localStorage.getItem('user_token');
            if (!userId || userId === 'null') {
                userId = getCurrentUserId();
            }
            
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
                tg.showAlert('Ошибка загрузки информации о чате');
                return;
            }
            
            const chat = result.data.find(c => c.id == currentChatId);
            
            if (!chat) {
                tg.showAlert('Чат не найден');
                return;
            }
            
            if (chat.opponent_token) {
                window.currentOpponentToken = chat.opponent_token;
                currentOpponentId = chat.opponent_token;
                window.currentOpponentNickname = chat.opponent_nickname || null;
            } else {
                tg.showAlert('Ошибка: не удалось определить собеседника');
                return;
            }
            
        } catch (error) {
            console.error('❌ [toggleBlockUser] Ошибка:', error);
            tg.showAlert('Ошибка загрузки информации о чате');
            return;
        }
    }
    
    const action = isUserBlocked ? 'unblock-user' : 'block-user';
    const confirmText = isUserBlocked 
        ? 'Разблокировать собеседника?' 
        : 'Заблокировать собеседника? Он не сможет отправлять вам сообщения.';
    
    tg.showConfirm(confirmText, async (confirmed) => {
        if (!confirmed) return;
        
        try {
            const blockerToken = localStorage.getItem('user_token') || getCurrentUserId();
            const targetToken = window.currentOpponentToken || currentOpponentId;
            
            console.log('📤 [toggleBlockUser] Отправляем запрос:', { action, blockerToken: blockerToken?.substring(0, 16), targetToken: targetToken?.substring(0, 16) });
            
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
            console.log('📥 [toggleBlockUser] Ответ:', result);
            
            if (result.error) {
                tg.showAlert('Ошибка: ' + (result.error.message || 'Неизвестная ошибка'));
                return;
            }
            
            isUserBlocked = !isUserBlocked;
            
            const blockMenuText = document.getElementById('blockMenuText');
            if (blockMenuText) {
                blockMenuText.textContent = isUserBlocked ? '✅ Разблокировать собеседника' : '🚫 Заблокировать собеседника';
            }
            
            updateBlockUI();
            tg.showAlert(isUserBlocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
            
            if (!isUserBlocked && currentChatId) {
                setTimeout(() => checkBlockStatus(currentChatId), 500);
            }
            
        } catch (error) {
            console.error('❌ [toggleBlockUser] Ошибка:', error);
            tg.showAlert('Ошибка при выполнении действия');
        }
    });
}

/**
 * Показать/скрыть предупреждение о блокировке
 */
function showBlockWarning(show, type = 'other') {
    const warning = document.getElementById('blockWarning');
    const messageInput = document.getElementById('messageInput');
    
    if (!warning) return;
    
    if (show) {
        const text = type === 'self' 
            ? '🚫 Вы заблокировали этого собеседника' 
            : '⚠️ Собеседник внес вас в черный список';
        
        warning.textContent = text;
        warning.style.display = 'block';
        
        if (messageInput) {
            messageInput.disabled = true;
            messageInput.placeholder = 'Сообщения заблокированы';
        }
    } else {
        warning.style.display = 'none';
        
        if (messageInput) {
            messageInput.disabled = false;
            messageInput.placeholder = 'Введите сообщение...';
        }
    }
}

/**
 * Обновить UI блокировки
 */
function updateBlockUI() {
    showBlockWarning(isUserBlocked, isUserBlocked ? 'self' : 'other');
}

/**
 * Удалить чат
 */
async function deleteChat() {
    if (!currentChatId) return;
    
    tg.showConfirm('Удалить чат и всю историю?', async (confirmed) => {
        if (!confirmed) return;
        
        try {
            const userToken = localStorage.getItem('user_token');
            
            const response = await fetch('/api/neon-chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete-chat',
                    params: { chatId: currentChatId, userId: userToken }
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                tg.showAlert('Ошибка удаления чата');
                return;
            }
            
            tg.showAlert('✅ Чат удален');
            showMyChats();
            
        } catch (error) {
            console.error('❌ [CHATS] Ошибка удаления чата:', error);
        }
    });
}

/**
 * Обновить счётчик чатов на кнопке
 */
async function updateChatBadge() {
    try {
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        if (!userId && !userToken) return;
        
        const response = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'count-requests',
                params: { userId: userToken || userId }
            })
        });
        
        const result = await response.json();
        const badge = document.getElementById('chatBadge');
        
        if (result.data?.count > 0 && badge) {
            badge.textContent = result.data.count;
            badge.style.display = 'inline';
        } else if (badge) {
            badge.style.display = 'none';
        }
        
    } catch (error) {
        console.error('⚠️ [CHATS] Ошибка updateChatBadge:', error);
    }
}

/**
 * Переключение вкладок чатов (active/requests)
 */
function switchChatTab(tab) {
    console.log('💬 [CHATS] Переключение вкладки:', tab);
    
    // Переключаем активную кнопку
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        const targetBtn = event.target.closest('.tab-btn');
        if (targetBtn) targetBtn.classList.add('active');
    }
    
    // Переключаем контент
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'active') {
        const activeTab = document.getElementById('activeChatsTab');
        if (activeTab) activeTab.classList.add('active');
    } else if (tab === 'requests') {
        const requestsTab = document.getElementById('requestsTab');
        if (requestsTab) requestsTab.classList.add('active');
    }
}

/**
 * Отмена ответа на сообщение
 */
function cancelReply() {
    replyToMessage = null;
    const preview = document.getElementById('replyPreview');
    if (preview) preview.style.display = 'none';
}

/**
 * Переключение размера шрифта в чате
 */
function toggleChatFontSize() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) return;
    
    let currentSize = localStorage.getItem('chatFontSize') || 'medium';
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    const nextSize = sizes[nextIndex];
    
    messagesContainer.classList.remove('font-small', 'font-medium', 'font-large');
    messagesContainer.classList.add(`font-${nextSize}`);
    localStorage.setItem('chatFontSize', nextSize);
    
    const btn = document.getElementById('chatFontSizeBtn');
    if (btn) {
        btn.style.fontSize = nextSize === 'small' ? '14px' : nextSize === 'medium' ? '18px' : '22px';
    }
}

/**
 * Переключение меню чата
 */
function toggleChatMenu() {
    const menu = document.getElementById('chatMenu');
    if (!menu) return;
    if (menu.style.display === 'none' || !menu.style.display) {
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
    }
}

/**
 * Подтверждение удаления чата
 */
function confirmDeleteChat() {
    const menu = document.getElementById('chatMenu');
    if (menu) menu.style.display = 'none';
    
    tg.showConfirm(
        '⚠️ Чат будет удален у обеих сторон. Все сообщения будут потеряны. Продолжить?',
        async (confirmed) => {
            if (confirmed) {
                await deleteChat();
            }
        }
    );
}

/**
 * Открыть чат в Telegram
 */
function openTelegramChat() {
    const username = localStorage.getItem('opponentTelegramUsername');
    if (username) {
        const url = `https://t.me/${username}`;
        if (tg && tg.openTelegramLink) {
            tg.openTelegramLink(url);
        } else {
            window.open(url, '_blank');
        }
    } else {
        tg.showAlert('Telegram собеседника недоступен');
    }
}

/**
 * ===== ФУНКЦИИ РЕАКЦИЙ НА СООБЩЕНИЯ =====
 */

/**
 * Настройка обработчиков свайпа для сообщений
 */
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
            
            const isMine = msg.getAttribute('data-is-mine') === 'true';
            
            // Свайп влево (для всех) - ответить
            if (diffX < 0 && diffX > -150) {
                msg.style.transform = `translateX(${diffX}px)`;
                if (Math.abs(diffX) > 5) {
                    hasMoved = true;
                }
            }
            // Свайп вправо (только свои) - удалить
            else if (diffX > 0 && diffX < 150 && isMine) {
                msg.style.transform = `translateX(${diffX}px)`;
                if (Math.abs(diffX) > 5) {
                    hasMoved = true;
                }
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
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
                    }
                    if (typeof replyToMsg === 'function') {
                        replyToMsg(messageId, nickname, messageText);
                    }
                }
            }
            // Свайп вправо (60px) И своё сообщение И было движение - удалить
            else if (diff > 60 && isMine && hasMoved) {
                const messageId = msg.getAttribute('data-message-id');
                if (messageId) {
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
                    }
                    if (typeof showDeleteMessageMenu === 'function') {
                        showDeleteMessageMenu(null, parseInt(messageId));
                    }
                }
            }
            
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

/**
 * Настройка реакций на сообщения
 */
function setupMessageReactions() {
    const messages = document.querySelectorAll('.message');
    
    messages.forEach(msg => {
        const isMine = msg.getAttribute('data-is-mine') === 'true';
        
        let clickTimeout = null;
        let clickCount = 0;
        let longPressTimer = null;
        let longPressStarted = false;
        
        // Обработчик двойного клика
        const handleClick = (e) => {
            if (e.target.closest('.message-photo, .message-photo-secure, video, button, .message-reply-indicator, .message-reaction')) {
                return;
            }
            
            if (isMine) return;
            
            if (longPressStarted) {
                longPressStarted = false;
                return;
            }
            
            clickCount++;
            
            if (clickCount === 1) {
                clickTimeout = setTimeout(() => {
                    clickCount = 0;
                }, 300);
            } else if (clickCount === 2) {
                clearTimeout(clickTimeout);
                clickCount = 0;
                addReaction(msg, '❤️');
            }
        };
        
        // Долгое нажатие - показываем меню реакций
        const handleLongPressStart = (e) => {
            if (e.target.closest('.message-photo, .message-photo-secure, video, button, .message-reply-indicator, .message-reaction')) {
                return;
            }
            
            if (isMine) return;
            
            const coords = e.touches ? e.touches[0] : e;
            longPressTimer = setTimeout(() => {
                longPressStarted = true;
                showReactionPicker(msg, coords);
            }, 500);
        };
        
        const handleLongPressEnd = () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            setTimeout(() => {
                longPressStarted = false;
            }, 100);
        };
        
        const handleLongPressMove = () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        };
        
        msg.addEventListener('click', handleClick);
        msg.addEventListener('touchstart', handleLongPressStart, { passive: true });
        msg.addEventListener('touchend', handleLongPressEnd);
        msg.addEventListener('touchmove', handleLongPressMove);
        msg.addEventListener('mousedown', handleLongPressStart);
        msg.addEventListener('mouseup', handleLongPressEnd);
        msg.addEventListener('mousemove', handleLongPressMove);
    });
}

/**
 * Показать меню выбора реакций
 */
function showReactionPicker(messageElement, event) {
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
    
    picker.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    }, { passive: true });
    
    picker.addEventListener('touchmove', (e) => {
        e.stopPropagation();
    }, { passive: true });
    
    const rect = messageElement.getBoundingClientRect();
    const pickerRect = picker.getBoundingClientRect();
    
    let left = rect.left + rect.width / 2 - pickerRect.width / 2;
    let top = rect.top - pickerRect.height - 10;
    
    if (left < 10) left = 10;
    if (left + pickerRect.width > window.innerWidth - 10) {
        left = window.innerWidth - pickerRect.width - 10;
    }
    if (top < 10) {
        top = rect.bottom + 10;
    }
    
    picker.style.left = left + 'px';
    picker.style.top = top + 'px';
    
    setTimeout(() => {
        document.addEventListener('click', closeReactionPickerOnClickOutside);
    }, 100);
}

/**
 * Закрыть меню реакций
 */
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

/**
 * Добавить реакцию на сообщение
 */
async function addReaction(messageElement, emoji) {
    const messageId = messageElement.dataset.messageId;
    
    if (!messageId) {
        console.error('Message ID not found');
        return;
    }
    
    try {
        showReactionOnMessage(messageElement, emoji);
        
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
        removeReactionFromMessage(messageElement);
    }
}

/**
 * Показать реакцию на сообщении
 */
function showReactionOnMessage(messageElement, emoji, count = 1) {
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
    
    reaction.addEventListener('click', removeHandler);
    messageElement.appendChild(reaction);
}

/**
 * Убрать реакцию с сообщения
 */
function removeReactionFromMessage(messageElement) {
    const reaction = messageElement.querySelector('.message-reaction');
    if (reaction) {
        reaction.remove();
    }
}

// Экспорт функций в глобальную область
window.switchChatTab = switchChatTab;
window.showMyChats = showMyChats;
window.loadMyChats = loadMyChats;
window.updateChatBadge = updateChatBadge;
window.sendMessage = sendMessage;
window.openChat = openChat;
window.loadChatMessages = loadChatMessages;
window.acceptChatRequest = acceptChatRequest;
window.rejectChatRequest = rejectChatRequest;
window.markMessagesAsRead = markMessagesAsRead;
window.toggleBlockUser = toggleBlockUser;
window.showBlockWarning = showBlockWarning;
window.updateBlockUI = updateBlockUI;
window.deleteChat = deleteChat;
window.updateChatsList = updateChatsList;
window.checkBlockStatus = checkBlockStatus;
window.cancelReply = cancelReply;
window.toggleChatFontSize = toggleChatFontSize;
window.toggleChatMenu = toggleChatMenu;
window.confirmDeleteChat = confirmDeleteChat;
window.openTelegramChat = openTelegramChat;
window.setupMessageSwipeHandlers = setupMessageSwipeHandlers;
window.setupMessageReactions = setupMessageReactions;
window.showReactionPicker = showReactionPicker;
window.closeReactionPicker = closeReactionPicker;
window.addReaction = addReaction;
window.showReactionOnMessage = showReactionOnMessage;
window.removeReactionFromMessage = removeReactionFromMessage;

/**
 * Закрыть меню удаления сообщения
 */
function closeDeleteMessageMenu() {
    const menu = document.querySelector('.delete-message-modal');
    const overlay = document.querySelector('.delete-message-overlay');
    if (menu) menu.remove();
    if (overlay) overlay.remove();
}

/**
 * Удалить сообщение
 */
async function deleteMessage(messageId) {
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            if (typeof tg !== 'undefined' && tg?.showAlert) {
                tg.showAlert('⚠️ Ошибка авторизации');
            }
            return;
        }
        
        console.log('🗑️ [CHATS] Удаление сообщения:', messageId);
        
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
            if (typeof tg !== 'undefined' && tg?.showAlert) {
                tg.showAlert('❌ ' + data.error);
            }
            return;
        }
        
        console.log('✅ [CHATS] Сообщение удалено');
        closeDeleteMessageMenu();
        
        // Перезагружаем сообщения
        if (currentChatId && typeof loadChatMessages === 'function') {
            await loadChatMessages(currentChatId);
        }
        
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('✅ Сообщение удалено');
        }
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка удаления:', error);
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('❌ Ошибка при удалении сообщения');
        }
    }
}

window.closeDeleteMessageMenu = closeDeleteMessageMenu;
window.deleteMessage = deleteMessage;

/**
 * ==================== ОТВЕТ НА СООБЩЕНИЕ ====================
 */

/**
 * Ответить на сообщение
 */
function replyToMsg(messageId, nickname, messageText) {
    replyToMessage = { id: messageId, nickname, text: messageText };
    
    // Показываем превью
    const replyPreview = document.getElementById('replyPreview');
    const replyToNickname = document.getElementById('replyToNickname');
    const replyToText = document.getElementById('replyToText');
    
    if (replyToNickname) {
        replyToNickname.textContent = nickname;
    }
    if (replyToText) {
        replyToText.textContent = messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText;
    }
    if (replyPreview) {
        replyPreview.style.display = 'flex';
    }
    
    // Фокусируем поле ввода
    const messageInput = document.getElementById('messageInput');
    if (messageInput) messageInput.focus();
}

/**
 * Скролл к сообщению и подсветка
 */
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

/**
 * Применить сохраненный размер шрифта при загрузке чата
 */
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

window.replyToMsg = replyToMsg;
window.scrollToMessage = scrollToMessage;
window.applyChatFontSize = applyChatFontSize;

/**
 * Показать меню удаления сообщения
 */
function showDeleteMessageMenu(event, messageId) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('Меню удаления для сообщения:', messageId);
    
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
    `;
    
    modal.innerHTML = `
        <div style="margin-bottom: 15px; text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: var(--neon-red);">Удалить сообщение?</div>
            <div style="font-size: 12px; color: var(--text-gray);">Сообщение будет удалено у обоих</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button onclick="deleteMessage(${messageId})" style="
                padding: 12px; background: linear-gradient(135deg, #ff4444, #cc0000);
                border: none; border-radius: 10px; color: white; font-size: 14px; cursor: pointer;
            ">🗑️ Удалить</button>
            <button onclick="closeDeleteMessageMenu()" style="
                padding: 12px; background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
                border: none; border-radius: 10px; color: white; font-size: 14px; cursor: pointer;
            ">Отмена</button>
        </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.className = 'delete-message-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.7); z-index: 9999;
    `;
    overlay.onclick = closeDeleteMessageMenu;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

/**
 * Настройка long press для удаления своих сообщений
 */
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
        
        msg.addEventListener('touchstart', startLongPress, { passive: true });
        msg.addEventListener('touchend', cancelLongPress, { passive: true });
        msg.addEventListener('touchmove', handleTouchMove, { passive: true });
        msg.addEventListener('mousedown', startLongPress);
        msg.addEventListener('mouseup', cancelLongPress);
        msg.addEventListener('mouseleave', cancelLongPress);
    });
}

/**
 * Пометить сообщения как доставленные
 */
async function markMessagesAsDelivered() {
    try {
        const userId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;
        if (!userId || userId.startsWith('web_')) return;
        
        const response = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'mark-delivered',
                params: { userId }
            })
        });
        const result = await response.json();
        
        if (!result.error) {
            console.log('✅ Сообщения помечены как доставленные');
        }
    } catch (error) {
        console.error('Ошибка markMessagesAsDelivered:', error);
    }
}

/**
 * Отметить пользователя как неактивного
 */
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
        console.log('👋 Пользователь неактивен');
    } catch (error) {
        console.error('Ошибка markUserInactive:', error);
    }
}

window.showDeleteMessageMenu = showDeleteMessageMenu;
window.setupMessageLongPress = setupMessageLongPress;
window.markMessagesAsDelivered = markMessagesAsDelivered;
window.markUserInactive = markUserInactive;

console.log('✅ [CHATS] Модуль чатов инициализирован');

} catch(e) { console.error('❌ Ошибка в модуле chats.js:', e); }
})();

// ========== onboarding.js (50.4 KB) ==========
(function() {
try {
/**
 * Модуль онбординга (onboarding.js)
 * 
 * Функции:
 * - Управление процессом первого входа
 * - Заполнение профиля
 * - Выбор пола, возраста, ориентации и целей
 * - Валидация данных профиля
 */

console.log('🎯 [ONBOARDING] Инициализация модуля онбординга');

/**
 * Глобальные переменные онбординга
 */
let onboardingStep = 1;
let onboardingData = {
    gender: null,
    age: null,
    orientation: null,
    goals: [],
    languages: []
};
let isNicknameAvailable = false;
let nicknameCheckTimeout = null;

/**
 * ===== УПРАВЛЕНИЕ ПРОЦЕССОМ ОНБОРДИНГА =====
 */

/**
 * Показать экран онбординга
 */
function showOnboardingScreen() {
    const screen = document.getElementById('onboardingScreen');
    if (!screen) {
        console.warn('⚠️ [ONBOARDING] Экран онбординга не найден');
        return;
    }
    
    screen.style.display = 'flex';
    console.log('📱 [ONBOARDING] Показан экран онбординга, шаг:', onboardingStep);
    
    updateOnboardingStep();
}

/**
 * Скрыть экран онбординга
 */
function hideOnboardingScreen() {
    const screen = document.getElementById('onboardingScreen');
    if (screen) {
        screen.style.display = 'none';
        console.log('📱 [ONBOARDING] Экран онбординга скрыт');
    }
}

/**
 * Обновить текущий шаг онбординга
 */
function updateOnboardingStep() {
    // Шаги онбординга
    const steps = {
        1: showOnboardingStep1,     // Добро пожаловать
        2: showOnboardingStep2,     // Выбор пола
        3: showOnboardingStep3,     // Выбор возраста
        4: showOnboardingStep4,     // Выбор ориентации
        5: showOnboardingStep5,     // Выбор целей
        6: showOnboardingStep6      // Выбор языков
    };
    
    if (steps[onboardingStep]) {
        steps[onboardingStep]();
    } else {
        console.log('✅ [ONBOARDING] Все шаги пройдены');
        completeOnboarding();
    }
}

/**
 * Следующий шаг онбординга
 */
function nextOnboardingStep() {
    // Валидируем текущий шаг перед переходом
    if (!validateOnboardingStep(onboardingStep)) {
        console.log('⚠️ [ONBOARDING] Шаг', onboardingStep, 'не прошел валидацию');
        tg.showAlert('Заполните все обязательные поля');
        return;
    }
    
    onboardingStep++;
    updateOnboardingStep();
}

/**
 * Предыдущий шаг онбординга
 */
function previousOnboardingStep() {
    if (onboardingStep > 1) {
        onboardingStep--;
        updateOnboardingStep();
    }
}

/**
 * Валидация текущего шага
 */
function validateOnboardingStep(step) {
    switch(step) {
        case 1: // Приветствие - всегда OK
            return true;
        case 2: // Пол
            return onboardingData.gender !== null;
        case 3: // Возраст
            return onboardingData.age !== null;
        case 4: // Ориентация
            return onboardingData.orientation !== null;
        case 5: // Цели
            return onboardingData.goals.length > 0;
        case 6: // Языки
            return onboardingData.languages.length > 0;
        default:
            return true;
    }
}

/**
 * ===== ШАГИ ОНБОРДИНГА =====
 */

/**
 * Шаг 1: Приветствие
 */
function showOnboardingStep1() {
    const content = document.querySelector('[data-onboarding-content]');
    if (!content) return;
    
    content.innerHTML = `
        <div class="onboarding-card">
            <div class="onboarding-icon">👋</div>
            <h1>Добро пожаловать в Anonimka!</h1>
            <p>Создайте свою анонимную анкету и найдите интересных людей.</p>
            <p style="font-size: 12px; color: var(--text-gray);">Никто не узнает, кто вы — вы сами выбираете, когда и кому рассказать.</p>
        </div>
    `;
}

/**
 * Шаг 2: Выбор пола
 */
function showOnboardingStep2() {
    const content = document.querySelector('[data-onboarding-content]');
    if (!content) return;
    
    const genderOptions = [
        { value: 'male', label: '👨 Мужчина' },
        { value: 'female', label: '👩 Женщина' },
        { value: 'other', label: '🌈 Другое' }
    ];
    
    let html = `
        <div class="onboarding-card">
            <h2>Какой ваш пол?</h2>
            <div class="onboarding-options" style="display: flex; flex-direction: column; gap: 10px;">
    `;
    
    genderOptions.forEach(option => {
        const isSelected = onboardingData.gender === option.value ? 'selected' : '';
        html += `
            <button 
                class="onboarding-option ${isSelected}"
                onclick="selectOnboardingGender('${option.value}')"
            >
                ${option.label}
            </button>
        `;
    });
    
    html += `</div></div>`;
    content.innerHTML = html;
}

/**
 * Выбрать пол
 */
function selectOnboardingGender(gender) {
    onboardingData.gender = gender;
    console.log('👤 [ONBOARDING] Выбран пол:', gender);
    
    // Обновляем визуально
    document.querySelectorAll('.onboarding-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.closest('.onboarding-option').classList.add('selected');
}

/**
 * Шаг 3: Выбор возраста
 */
function showOnboardingStep3() {
    const content = document.querySelector('[data-onboarding-content]');
    if (!content) return;
    
    const minAge = 18;
    const maxAge = 80;
    const currentAge = onboardingData.age || 25;
    
    content.innerHTML = `
        <div class="onboarding-card">
            <h2>Сколько вам лет?</h2>
            <div style="text-align: center;">
                <div style="font-size: 48px; font-weight: bold; color: var(--primary); margin: 20px 0;">
                    ${currentAge}
                </div>
                <input 
                    type="range" 
                    min="${minAge}" 
                    max="${maxAge}" 
                    value="${currentAge}"
                    oninput="updateOnboardingAge(this.value)"
                    style="width: 100%; cursor: pointer;"
                />
                <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; color: var(--text-gray);">
                    <span>${minAge}</span>
                    <span>${maxAge}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Обновить возраст в онбординге
 */
function updateOnboardingAge(age) {
    onboardingData.age = parseInt(age);
    
    const display = document.querySelector('.onboarding-card div[style*="font-size: 48px"]');
    if (display) {
        display.textContent = age;
    }
    
    console.log('🎂 [ONBOARDING] Выбран возраст:', age);
}

/**
 * Шаг 4: Выбор ориентации
 */
function showOnboardingStep4() {
    const content = document.querySelector('[data-onboarding-content]');
    if (!content) return;
    
    const orientationOptions = [
        { value: 'straight', label: '💕 Гетеросексуал' },
        { value: 'gay', label: '💙 Гей' },
        { value: 'lesbian', label: '💛 Лесбиянка' },
        { value: 'bisexual', label: '💜 Бисексуал' },
        { value: 'asexual', label: '⚪ Асексуал' },
        { value: 'other', label: '🌈 Другое' }
    ];
    
    let html = `
        <div class="onboarding-card">
            <h2>Сексуальная ориентация?</h2>
            <div class="onboarding-options" style="display: flex; flex-direction: column; gap: 10px;">
    `;
    
    orientationOptions.forEach(option => {
        const isSelected = onboardingData.orientation === option.value ? 'selected' : '';
        html += `
            <button 
                class="onboarding-option ${isSelected}"
                onclick="selectOnboardingOrientation('${option.value}')"
            >
                ${option.label}
            </button>
        `;
    });
    
    html += `</div></div>`;
    content.innerHTML = html;
}

/**
 * Выбрать ориентацию
 */
function selectOnboardingOrientation(orientation) {
    onboardingData.orientation = orientation;
    console.log('💕 [ONBOARDING] Выбрана ориентация:', orientation);
    
    document.querySelectorAll('.onboarding-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.closest('.onboarding-option').classList.add('selected');
}

/**
 * Шаг 5: Выбор целей
 */
function showOnboardingStep5() {
    const content = document.querySelector('[data-onboarding-content]');
    if (!content) return;
    
    const goalsOptions = [
        { value: 'dating', label: '💑 Знакомства' },
        { value: 'friendship', label: '🤝 Дружба' },
        { value: 'talking', label: '💬 Общение' },
        { value: 'fun', label: '🎉 Развлечение' },
        { value: 'advice', label: '🤔 Советы' },
        { value: 'other', label: '❓ Другое' }
    ];
    
    let html = `
        <div class="onboarding-card">
            <h2>Выберите цели (можно несколько)</h2>
            <div class="onboarding-options" style="display: flex; flex-direction: column; gap: 10px;">
    `;
    
    goalsOptions.forEach(option => {
        const isSelected = onboardingData.goals.includes(option.value) ? 'selected' : '';
        html += `
            <button 
                class="onboarding-option ${isSelected}"
                onclick="toggleOnboardingGoal('${option.value}')"
            >
                ${option.label}
            </button>
        `;
    });
    
    html += `</div></div>`;
    content.innerHTML = html;
}

/**
 * Переключить выбор цели
 */
function toggleOnboardingGoal(goal) {
    const index = onboardingData.goals.indexOf(goal);
    
    if (index > -1) {
        onboardingData.goals.splice(index, 1);
    } else {
        onboardingData.goals.push(goal);
    }
    
    console.log('🎯 [ONBOARDING] Выбранные цели:', onboardingData.goals);
    
    // Обновляем визуально
    event.target.closest('.onboarding-option').classList.toggle('selected');
}

/**
 * Шаг 6: Выбор языков
 */
function showOnboardingStep6() {
    const content = document.querySelector('[data-onboarding-content]');
    if (!content) return;
    
    const languageOptions = [
        { value: 'russian', label: '🇷🇺 Русский' },
        { value: 'english', label: '🇬🇧 English' },
        { value: 'kazakh', label: '🇰🇿 Қазақша' },
        { value: 'turkish', label: '🇹🇷 Türkçe' },
        { value: 'arabic', label: '🇦🇪 العربية' }
    ];
    
    let html = `
        <div class="onboarding-card">
            <h2>На каких языках вы говорите?</h2>
            <div class="onboarding-options" style="display: flex; flex-direction: column; gap: 10px;">
    `;
    
    languageOptions.forEach(option => {
        const isSelected = onboardingData.languages.includes(option.value) ? 'selected' : '';
        html += `
            <button 
                class="onboarding-option ${isSelected}"
                onclick="toggleOnboardingLanguage('${option.value}')"
            >
                ${option.label}
            </button>
        `;
    });
    
    html += `</div></div>`;
    content.innerHTML = html;
}

/**
 * Переключить выбор языка
 */
function toggleOnboardingLanguage(language) {
    const index = onboardingData.languages.indexOf(language);
    
    if (index > -1) {
        onboardingData.languages.splice(index, 1);
    } else {
        onboardingData.languages.push(language);
    }
    
    console.log('🗣️ [ONBOARDING] Выбранные языки:', onboardingData.languages);
    
    // Обновляем визуально
    event.target.closest('.onboarding-option').classList.toggle('selected');
}

/**
 * ===== СТАТУС НИКНЕЙМА =====
 */

/**
 * Проверка доступности никнейма
 */
async function checkNicknameAvailability(nickname) {
    // Если никнейм пустой - сбрасываем
    if (!nickname || nickname.length < 1) {
        isNicknameAvailable = false;
        showNicknameStatus('', '');
        updateContinueButton();
        return;
    }
    
    // Показываем статус проверки
    showNicknameStatus('checking', '⏳ Проверяем...');
    
    try {
        const response = await fetch(`/api/nickname?nickname=${encodeURIComponent(nickname)}`);
        const data = await response.json();
        
        if (data.available) {
            isNicknameAvailable = true;
            showNicknameStatus('available', '✅ Доступен');
        } else {
            isNicknameAvailable = false;
            showNicknameStatus('taken', '❌ Уже занят');
        }
        
        updateContinueButton();
    } catch (error) {
        console.error('Ошибка проверки никнейма:', error);
        isNicknameAvailable = false;
        showNicknameStatus('error', '❌ Ошибка проверки');
        updateContinueButton();
    }
}

/**
 * Показать статус проверки никнейма
 */
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

/**
 * Обновить состояние кнопки "Готово"
 */
function updateContinueButton() {
    const nicknameInput = document.getElementById('onboardingNicknameInput');
    const agreeCheckbox = document.getElementById('agreeTerms');
    const continueBtn = document.getElementById('onboardingContinue');
    const statusEl = document.getElementById('nicknameStatus');
    
    if (!continueBtn) return;
    
    const nickname = nicknameInput?.value.trim() || '';
    const agreed = agreeCheckbox?.checked || false;
    const nicknameAvailable = statusEl?.classList.contains('available');
    
    // Никнейм от 1 символа + доступен + чекбокс нажат
    const canContinue = nickname.length >= 1 && nicknameAvailable && agreed;
    
    continueBtn.disabled = !canContinue;
    continueBtn.textContent = canContinue ? '✅ Готово' : '⏳ Заполните данные...';
    continueBtn.style.opacity = canContinue ? '1' : '0.5';
}

/**
 * ===== ЗАВЕРШЕНИЕ ОНБОРДИНГА =====
 */

/**
 * Завершить онбординг и сохранить профиль
 */
async function completeOnboarding() {
    console.log('✅ [ONBOARDING] Завершение онбординга');
    
    // Получаем никнейм и проверяем чекбокс
    const nicknameInput = document.getElementById('onboardingNicknameInput');
    const agreeCheckbox = document.getElementById('agreeTerms');
    const continueBtn = document.getElementById('onboardingContinue');
    
    const nickname = nicknameInput?.value.trim() || '';
    const agreed = agreeCheckbox?.checked || false;
    
    // Проверяем условия
    if (!nickname || nickname.length < 1) {
        if (typeof tg !== 'undefined' && tg.showAlert) {
            tg.showAlert('Введите никнейм');
        } else {
            alert('Введите никнейм');
        }
        return;
    }
    
    if (!isNicknameAvailable) {
        if (typeof tg !== 'undefined' && tg.showAlert) {
            tg.showAlert('Этот никнейм уже занят');
        } else {
            alert('Этот никнейм уже занят');
        }
        return;
    }
    
    if (!agreed) {
        if (typeof tg !== 'undefined' && tg.showAlert) {
            tg.showAlert('Примите условия использования');
        } else {
            alert('Примите условия использования');
        }
        return;
    }
    
    // Блокируем кнопку
    if (continueBtn) {
        continueBtn.disabled = true;
        continueBtn.textContent = '⏳ Сохраняем...';
    }
    
    try {
        const userToken = localStorage.getItem('user_token');
        
        if (!userToken) {
            console.error('❌ [ONBOARDING] Токен не найден');
            if (typeof tg !== 'undefined' && tg.showAlert) {
                tg.showAlert('Ошибка: пользователь не авторизован');
            } else {
                alert('Ошибка: пользователь не авторизован');
            }
            updateContinueButton();
            return;
        }
        
        // Сначала сохраняем никнейм
        console.log('📝 [ONBOARDING] Сохраняем никнейм:', nickname);
        const nicknameResponse = await fetch('/api/nickname', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_token: userToken,
                nickname: nickname
            })
        });
        
        const nicknameData = await nicknameResponse.json();
        
        if (!nicknameData.success) {
            console.error('❌ [ONBOARDING] Ошибка сохранения никнейма:', nicknameData.message);
            if (typeof tg !== 'undefined' && tg.showAlert) {
                tg.showAlert(nicknameData.message || 'Ошибка сохранения никнейма');
            } else {
                alert(nicknameData.message || 'Ошибка сохранения никнейма');
            }
            updateContinueButton();
            return;
        }
        
        console.log('✅ [ONBOARDING] Никнейм сохранен');
        
        // Сохраняем никнейм локально
        localStorage.setItem('userNickname', nickname);
        localStorage.setItem('user_nickname', nickname);
        
        // Определяем и сохраняем местоположение
        await detectAndSaveLocation(userToken);
        
        // Сохраняем данные локально
        localStorage.setItem('onboardingCompleted', 'true');
        
        // Обработка реферальной награды если нужна
        if (typeof processReferralReward === 'function') {
            await processReferralReward();
        }
        
        // Закрываем онбординг
        hideOnboardingScreen();
        
        // Инициализируем меню
        if (typeof initializeMenuModule === 'function') {
            initializeMenuModule();
        }
        
        // Показываем главный экран
        if (typeof goToHome === 'function') {
            goToHome();
        } else if (typeof showMainMenu === 'function') {
            showMainMenu();
        }
        
    } catch (error) {
        console.error('❌ [ONBOARDING] Ошибка завершения:', error);
        if (typeof tg !== 'undefined' && tg.showAlert) {
            tg.showAlert('Ошибка при завершении регистрации');
        } else {
            alert('Ошибка при завершении регистрации');
        }
        updateContinueButton();
    }
}

/**
 * Определение и сохранение местоположения пользователя
 * Приоритет: GPS → IP → Timezone
 */
async function detectAndSaveLocation(userToken) {
    console.log('📍 [LOCATION] Начинаем определение местоположения...');
    
    let locationData = null;
    
    // 1. Пробуем GPS (Geolocation API)
    try {
        locationData = await getLocationByGPS();
        if (locationData) {
            console.log('✅ [LOCATION] Получено по GPS:', locationData);
        }
    } catch (e) {
        console.log('⚠️ [LOCATION] GPS недоступен:', e.message);
    }
    
    // 2. Если GPS не сработал - пробуем по IP
    if (!locationData) {
        try {
            locationData = await getLocationByIP();
            if (locationData) {
                console.log('✅ [LOCATION] Получено по IP:', locationData);
            }
        } catch (e) {
            console.log('⚠️ [LOCATION] IP геолокация недоступна:', e.message);
        }
    }
    
    // 3. Если IP не сработал - определяем по часовому поясу
    if (!locationData) {
        try {
            locationData = getLocationByTimezone();
            if (locationData) {
                console.log('✅ [LOCATION] Получено по часовому поясу:', locationData);
            }
        } catch (e) {
            console.log('⚠️ [LOCATION] Timezone определение не удалось:', e.message);
        }
    }
    
    // 4. Если ничего не определилось - ставим по умолчанию
    if (!locationData) {
        locationData = { country: 'KZ', city: 'Алматы', region: null };
        console.log('⚠️ [LOCATION] Используем значение по умолчанию:', locationData);
    }
    
    // Сохраняем локально (все форматы для совместимости)
    localStorage.setItem('userCountry', locationData.country);
    localStorage.setItem('userCity', locationData.city);
    if (locationData.region) {
        localStorage.setItem('userRegion', locationData.region);
    }
    // Сохраняем как JSON объект для location.js
    localStorage.setItem('userLocation', JSON.stringify(locationData));
    
    // Обновляем глобальную переменную в модуле location.js
    if (typeof window.currentUserLocation !== 'undefined') {
        window.currentUserLocation = locationData;
    }
    // Также пробуем установить напрямую (если переменная глобальная)
    try {
        currentUserLocation = locationData;
    } catch (e) {
        // Переменная не в глобальной области - игнорируем
    }
    
    // Обновляем отображение локации сразу (до запроса на сервер)
    if (typeof updateLocationDisplay === 'function') {
        updateLocationDisplay();
    }
    
    // Сохраняем на сервер
    try {
        const response = await fetch('/api/users/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userToken: userToken,
                country: locationData.country,
                region: locationData.region,
                city: locationData.city
            })
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('✅ [LOCATION] Локация сохранена в БД');
            // Обновляем отображение локации в главном меню
            if (typeof updateLocationDisplay === 'function') {
                updateLocationDisplay();
            }
        } else {
            console.error('❌ [LOCATION] Ошибка сохранения:', result.error);
        }
    } catch (error) {
        console.error('❌ [LOCATION] Ошибка запроса:', error);
    }
}

/**
 * Получить локацию по GPS
 */
function getLocationByGPS() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation не поддерживается'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    console.log('📍 [GPS] Координаты:', latitude, longitude);
                    
                    // Реверс-геокодинг через бесплатный API
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru`
                    );
                    const data = await response.json();
                    
                    if (data && data.address) {
                        const country = data.address.country_code?.toUpperCase() || 'KZ';
                        const city = data.address.city || data.address.town || data.address.village || data.address.state || 'Неизвестно';
                        const region = data.address.state || null;
                        
                        resolve({ country, city, region });
                    } else {
                        reject(new Error('Не удалось определить адрес'));
                    }
                } catch (e) {
                    reject(e);
                }
            },
            (error) => {
                reject(new Error('GPS отклонен: ' + error.message));
            },
            { timeout: 10000, enableHighAccuracy: false }
        );
    });
}

/**
 * Получить локацию по IP
 */
async function getLocationByIP() {
    // Пробуем несколько бесплатных сервисов
    const services = [
        'https://ipapi.co/json/',
        'https://ip-api.com/json/?lang=ru'
    ];
    
    for (const url of services) {
        try {
            const response = await fetch(url, { timeout: 5000 });
            const data = await response.json();
            
            if (data) {
                // ipapi.co формат
                if (data.country_code) {
                    return {
                        country: data.country_code,
                        city: data.city || 'Неизвестно',
                        region: data.region || null
                    };
                }
                // ip-api.com формат
                if (data.countryCode) {
                    return {
                        country: data.countryCode,
                        city: data.city || 'Неизвестно',
                        region: data.regionName || null
                    };
                }
            }
        } catch (e) {
            console.log('⚠️ [IP] Сервис недоступен:', url);
        }
    }
    
    return null;
}

/**
 * Получить локацию по часовому поясу
 */
function getLocationByTimezone() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('🕐 [TIMEZONE]:', timezone);
    
    // Маппинг часовых поясов на локации
    const timezoneMap = {
        'Asia/Almaty': { country: 'KZ', city: 'Алматы', region: 'Алматы' },
        'Asia/Qyzylorda': { country: 'KZ', city: 'Кызылорда', region: 'Кызылординская область' },
        'Asia/Aqtobe': { country: 'KZ', city: 'Актобе', region: 'Актюбинская область' },
        'Asia/Aqtau': { country: 'KZ', city: 'Актау', region: 'Мангистауская область' },
        'Asia/Atyrau': { country: 'KZ', city: 'Атырау', region: 'Атырауская область' },
        'Asia/Oral': { country: 'KZ', city: 'Уральск', region: 'Западно-Казахстанская область' },
        'Europe/Moscow': { country: 'RU', city: 'Москва', region: 'Москва' },
        'Europe/Kiev': { country: 'UA', city: 'Киев', region: 'Киев' },
        'Europe/Minsk': { country: 'BY', city: 'Минск', region: 'Минск' },
        'Asia/Tashkent': { country: 'UZ', city: 'Ташкент', region: 'Ташкент' },
        'Asia/Bishkek': { country: 'KG', city: 'Бишкек', region: 'Чуйская область' },
        'Asia/Dushanbe': { country: 'TJ', city: 'Душанбе', region: 'Душанбе' },
        'Asia/Ashgabat': { country: 'TM', city: 'Ашхабад', region: 'Ашхабад' },
        'Asia/Baku': { country: 'AZ', city: 'Баку', region: 'Баку' },
        'Asia/Yerevan': { country: 'AM', city: 'Ереван', region: 'Ереван' },
        'Asia/Tbilisi': { country: 'GE', city: 'Тбилиси', region: 'Тбилиси' }
    };
    
    if (timezoneMap[timezone]) {
        return timezoneMap[timezone];
    }
    
    // Если точного совпадения нет - определяем по префиксу
    if (timezone.startsWith('Asia/')) {
        return { country: 'KZ', city: 'Алматы', region: null };
    }
    if (timezone.startsWith('Europe/')) {
        return { country: 'RU', city: 'Москва', region: null };
    }
    
    return null;
}

/**
 * Проверить, нужен ли онбординг
 */
function checkOnboarding() {
    // Проверяем localStorage
    const isCompleted = localStorage.getItem('onboardingCompleted') === 'true';
    
    // Также проверяем наличие никнейма - если есть, значит уже зарегистрирован
    const hasNickname = localStorage.getItem('userNickname') || localStorage.getItem('user_nickname');
    const hasUserToken = localStorage.getItem('user_token');
    
    // Если есть никнейм и токен - онбординг не нужен
    if (hasNickname && hasUserToken && hasNickname !== 'null' && hasNickname !== 'undefined') {
        console.log('✅ [ONBOARDING] Никнейм найден, онбординг не нужен:', hasNickname);
        // Синхронизируем флаг
        localStorage.setItem('onboardingCompleted', 'true');
        return false;
    }
    
    if (isCompleted) {
        console.log('✅ [ONBOARDING] Онбординг уже пройден (по флагу)');
        return false;
    }
    
    console.log('📱 [ONBOARDING] Онбординг требуется');
    onboardingStep = 1;
    showOnboardingScreen();
    return true;
}

/**
 * Показать экран редактирования никнейма
 */
function showNicknameEditorScreen() {
    if (typeof closeHamburgerMenu === 'function') closeHamburgerMenu();
    if (typeof showScreen === 'function') showScreen('nicknameEditScreen');
    
    const currentNicknameDisplay = document.getElementById('currentNicknameDisplay');
    const nicknameInputPage = document.getElementById('nicknameInputPage');
    const savedNickname = localStorage.getItem('userNickname') || localStorage.getItem('user_nickname') || 'Аноним';
    
    console.log('📝 [ONBOARDING] Показываем редактор никнейма, текущий:', savedNickname);
    
    if (currentNicknameDisplay) {
        currentNicknameDisplay.textContent = savedNickname;
    }
    
    if (nicknameInputPage) {
        nicknameInputPage.value = savedNickname;
        setTimeout(() => nicknameInputPage.focus(), 300);
    }
    
    // Показываем подсказку для пользователей с автоматическим никнеймом
    const anonymousUserHint = document.getElementById('anonymousUserHint');
    if (anonymousUserHint) {
        const isAnonymousNickname = savedNickname.startsWith('Аноним');
        anonymousUserHint.style.display = isAnonymousNickname ? 'block' : 'none';
    }
    
    updateTelegramNameButton();
}

/**
 * Обновить текст кнопки с именем из Telegram
 */
function updateTelegramNameButton() {
    let telegramName = 'Аноним';
    
    if (typeof isTelegramWebApp !== 'undefined' && isTelegramWebApp && tg?.initDataUnsafe?.user) {
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

/**
 * Сохранить никнейм со страницы редактирования
 */
async function saveNicknamePage() {
    const nicknameInputPage = document.getElementById('nicknameInputPage');
    
    if (!nicknameInputPage) return;
    
    let nickname = nicknameInputPage.value.trim();
    
    if (!nickname) {
        if (typeof tg !== 'undefined' && tg?.showAlert) {
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
    
    if (authMethod === 'email' || (isAndroid && userToken)) {
        tgIdAuth = 99999999;
        console.log('📱 [ONBOARDING] Email/Android user, using fake tgId');
    } else if (typeof isTelegramWebApp !== 'undefined' && isTelegramWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
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
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('❌ Не удалось получить данные авторизации');
        } else {
            alert('❌ Не удалось получить данные авторизации');
        }
        return;
    }

    try {
        const payload = { 
            tgId: tgIdAuth, 
            nickname: nickname 
        };
        
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

            if (typeof tg !== 'undefined' && tg?.showAlert) {
                tg.showAlert(errorMessage);
            } else {
                alert(errorMessage);
            }
            return;
        }

        // Успешно сохранено
        localStorage.setItem('user_nickname', nickname);
        localStorage.setItem('userNickname', nickname);
        console.log('✅ [ONBOARDING] Никнейм сохранён:', nickname);

        // Обновляем nickname во всех анкетах
        const userId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;

        if (userId || userToken || tgIdAuth) {
            try {
                const adsPayload = {
                    action: 'update-all-nicknames',
                    nickname: nickname
                };
                if (userToken && userToken !== 'null' && userToken !== 'undefined') {
                    adsPayload.userToken = userToken;
                }
                if (typeof tgIdAuth === 'number' && Number.isFinite(tgIdAuth)) {
                    adsPayload.tgId = tgIdAuth;
                } else if (userId && !isNaN(Number(userId))) {
                    adsPayload.tgId = Number(userId);
                }

                const adsResponse = await fetch('/api/ads', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(adsPayload)
                });
                const adsResult = await adsResponse.json();
                if (adsResult.success) {
                    console.log('✅ [ONBOARDING] Никнейм обновлен в анкетах:', adsResult.count);
                }
            } catch (error) {
                console.error('[ONBOARDING] Ошибка обновления никнейма в анкетах:', error);
            }
        }
        
        // Показываем уведомление и возвращаемся на главную
        if (typeof tg !== 'undefined' && tg?.showPopup) {
            tg.showPopup({
                title: '✅ Сохранено',
                message: `Ваш ${result.isFirstTime ? '' : 'новый '}псевдоним: "${nickname}"`,
                buttons: [{ type: 'ok' }]
            });
        }
        
        setTimeout(() => {
            if (typeof showMainMenu === 'function') showMainMenu();
        }, 300);
    } catch (error) {
        console.error('[ONBOARDING] Ошибка сохранения никнейма:', error);
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('❌ Ошибка сохранения никнейма');
        } else {
            alert('❌ Ошибка сохранения никнейма');
        }
    }
}

/**
 * Показать редактор никнейма (старая версия)
 */
function showNicknameEditor() {
    showNicknameEditorScreen();
}

/**
 * Сохранить никнейм (старая версия)
 */
function saveNickname() {
    saveNicknamePage();
}

// Экспорт функций для onclick
window.showOnboardingScreen = showOnboardingScreen;
window.hideOnboardingScreen = hideOnboardingScreen;
window.updateOnboardingStep = updateOnboardingStep;
window.nextOnboardingStep = nextOnboardingStep;
window.previousOnboardingStep = previousOnboardingStep;
window.validateOnboardingStep = validateOnboardingStep;
window.showOnboardingStep1 = showOnboardingStep1;
window.showOnboardingStep2 = showOnboardingStep2;
window.selectOnboardingGender = selectOnboardingGender;
window.showOnboardingStep3 = showOnboardingStep3;
window.updateOnboardingAge = updateOnboardingAge;
window.showOnboardingStep4 = showOnboardingStep4;
window.selectOnboardingOrientation = selectOnboardingOrientation;
window.showOnboardingStep5 = showOnboardingStep5;
window.toggleOnboardingGoal = toggleOnboardingGoal;
window.showOnboardingStep6 = showOnboardingStep6;
window.toggleOnboardingLanguage = toggleOnboardingLanguage;
window.completeOnboarding = completeOnboarding;
window.checkOnboarding = checkOnboarding;
window.checkNicknameAvailability = checkNicknameAvailability;
window.showNicknameStatus = showNicknameStatus;
window.updateContinueButton = updateContinueButton;
window.showNicknameEditorScreen = showNicknameEditorScreen;
window.updateTelegramNameButton = updateTelegramNameButton;
window.saveNicknamePage = saveNicknamePage;
window.showNicknameEditor = showNicknameEditor;
window.saveNickname = saveNickname;
window.cancelNicknameEdit = cancelNicknameEdit;
window.useDefaultNickname = useDefaultNickname;
window.useDefaultNicknameMain = useDefaultNicknameMain;
window.checkOnboardingStatus = checkOnboardingStatus;

/**
 * Отменить редактирование никнейма
 */
function cancelNicknameEdit() {
    if (typeof showMainMenu === 'function') showMainMenu();
}

/**
 * Использовать имя из Telegram (старая версия для совместимости)
 */
function useDefaultNickname() {
    let telegramName = 'Аноним';
    
    if (typeof isTelegramWebApp !== 'undefined' && isTelegramWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
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
    }
}

/**
 * Использовать имя из Telegram на главной странице
 */
function useDefaultNicknameMain() {
    useDefaultNickname();
}

/**
 * Проверка статуса онбординга пользователя
 */
async function checkOnboardingStatus() {
    console.log('checkOnboardingStatus вызвана');
    try {
        // Проверяем, не открыто ли уже модальное окно никнейма
        const nicknameModal = document.getElementById('requiredNicknameModal');
        if (nicknameModal && nicknameModal.style.display === 'flex') {
            console.log('⚠️ Модальное окно никнейма уже открыто');
            return;
        }
        
        // Сначала проверяем локальное хранилище
        const localNickname = localStorage.getItem('userNickname');
        if (localNickname && localNickname.trim() !== '') {
            console.log('✅ Никнейм найден в localStorage:', localNickname);
            
            // Проверяем есть ли локация
            const userLocation = localStorage.getItem('userLocation');
            if (!userLocation) {
                console.log('⚠️ Локация не найдена, предлагаем выбрать');
                // Показываем главное меню, а затем экран выбора локации
                if (typeof showMainMenu === 'function') showMainMenu();
                setTimeout(() => {
                    if (typeof showLocationSetup === 'function') {
                        showLocationSetup();
                    } else if (typeof showScreen === 'function') {
                        showScreen('locationSetup');
                    }
                }, 500);
                return;
            }
            
            if (typeof showMainMenu === 'function') showMainMenu();
            return;
        }
        
        // Получаем tgId или userToken
        let tgId = null;
        let userToken = localStorage.getItem('user_token');
        
        if (typeof isTelegramWebApp !== 'undefined' && isTelegramWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
            tgId = window.Telegram.WebApp.initDataUnsafe.user.id;
        } else {
            try {
                const savedUser = localStorage.getItem('telegram_user');
                if (savedUser) {
                    const user = JSON.parse(savedUser);
                    tgId = user.id;
                }
            } catch (e) {}
        }
        
        if (!tgId && !userToken) {
            console.log('⚠️ Нет ни tgId ни userToken');
            return;
        }
        
        // Проверяем никнейм в БД
        let url = '/api/users?';
        if (tgId) url += `tgId=${tgId}`;
        else if (userToken) url += `userToken=${userToken}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const nickname = data.displayNickname || data.nickname;
        
        if (nickname && nickname.trim() !== '') {
            localStorage.setItem('userNickname', nickname);
            localStorage.setItem('user_nickname', nickname);
            console.log('✅ Никнейм из БД:', nickname);
            
            // Проверяем локацию из БД
            if (data.location) {
                localStorage.setItem('userLocation', JSON.stringify(data.location));
                console.log('✅ Локация из БД:', data.location);
            }
            
            // Проверяем есть ли локация
            const userLocation = localStorage.getItem('userLocation');
            if (!userLocation) {
                console.log('⚠️ Локация не найдена, предлагаем выбрать');
                if (typeof showMainMenu === 'function') showMainMenu();
                setTimeout(() => {
                    if (typeof showLocationSetup === 'function') {
                        showLocationSetup();
                    } else if (typeof showScreen === 'function') {
                        showScreen('locationSetup');
                    }
                }, 500);
                return;
            }
            
            if (typeof showMainMenu === 'function') showMainMenu();
        } else {
            console.log('⚠️ У пользователя нет никнейма');
            if (typeof showOnboardingScreen === 'function') showOnboardingScreen();
        }
    } catch (error) {
        console.error('❌ Ошибка checkOnboardingStatus:', error);
        if (typeof showOnboardingScreen === 'function') showOnboardingScreen();
    }
}

/**
 * Инициализация обработчиков событий для онбординга
 */
function initOnboardingEventListeners() {
    console.log('🎯 [ONBOARDING] Инициализация обработчиков событий');
    
    // Обработчик ввода никнейма
    const nicknameInput = document.getElementById('onboardingNicknameInput');
    if (nicknameInput) {
        nicknameInput.addEventListener('input', function() {
            const nickname = this.value.trim();
            
            // Очищаем предыдущий таймер
            if (nicknameCheckTimeout) {
                clearTimeout(nicknameCheckTimeout);
            }
            
            // Если пустое поле - сбрасываем
            if (!nickname || nickname.length < 1) {
                isNicknameAvailable = false;
                showNicknameStatus('', '');
                updateContinueButton();
                return;
            }
            
            // Debounce: проверяем через 300мс после последнего ввода
            nicknameCheckTimeout = setTimeout(() => {
                checkNicknameAvailability(nickname);
            }, 300);
        });
        console.log('✅ [ONBOARDING] Обработчик никнейма установлен');
    }
    
    // Обработчик чекбокса
    const agreeCheckbox = document.getElementById('agreeTerms');
    if (agreeCheckbox) {
        agreeCheckbox.addEventListener('change', function() {
            updateContinueButton();
        });
        console.log('✅ [ONBOARDING] Обработчик чекбокса установлен');
    }
    
    // Начальное состояние кнопки
    updateContinueButton();
}

// Запускаем инициализацию при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnboardingEventListeners);
} else {
    // DOM уже загружен
    setTimeout(initOnboardingEventListeners, 100);
}

console.log('✅ [ONBOARDING] Модуль онбординга загружен');

} catch(e) { console.error('❌ Ошибка в модуле onboarding.js:', e); }
})();

// ========== menu.js (53.5 KB) ==========
(function() {
try {
/**
 * Модуль навигации и меню (menu.js)
 * 
 * Функции:
 * - Управление экранами (меню, профиль, рефералка и т.д.)
 * - Переключение вкладок
 * - Бургер-меню
 */

console.log('📋 [MENU] Инициализация модуля навигации');

/**
 * Скрытые/видимые экраны
 */
const screens = {
    homeScreen: 'mainMenu',            // Главный экран = главное меню с кнопками
    myProfileScreen: 'mainMenu',       // Пока нет отдельного экрана профиля
    myAdsScreen: 'myAds',
    chatsScreen: 'myChats',
    referralScreen: 'mainMenu',        // Пока нет отдельного экрана реферала
    settingsScreen: 'mainMenu'         // Пока нет отдельного экрана настроек
};

let currentScreen = 'mainMenu';

/**
 * ===== УПРАВЛЕНИЕ ЭКРАНАМИ =====
 */

/**
 * Показать определённый экран
 */
function showScreen(screenId) {
    console.log('📺 [MENU] Переход на экран:', screenId);
    
    // Скрываем ВСЕ экраны с классом .screen (как в backup)
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    
    // Показываем нужный экран с правильными стилями
    const screenEl = document.getElementById(screenId);
    if (screenEl) {
        screenEl.style.display = 'flex';
        screenEl.style.flexDirection = 'column';
        screenEl.classList.add('active');
        currentScreen = screenId;
        
        // Управление видимостью переключателя тарифов (как в backup)
        const premiumToggle = document.getElementById('premiumToggle');
        if (premiumToggle) {
            if (screenId === 'mainMenu') {
                premiumToggle.style.display = 'flex';
            } else {
                premiumToggle.style.display = 'none';
            }
        }
        
        // Логируем для дебага
        console.log('✅ [MENU] Экран отображен');
    } else {
        console.warn('⚠️ [MENU] Экран не найден:', screenId);
    }
    
    // Обновляем меню кнопки
    updateMenuButtons();
    
    // Закрываем бургер-меню если открыто
    closeBurgerMenu();
    
    // Обновляем кнопки Telegram
    if (typeof updateTelegramButtons === 'function') {
        updateTelegramButtons(screenId);
    }
}

/**
 * Инициализация контента экрана
 */
function initializeScreenContent(screenId) {
    switch(screenId) {
        case screens.homeScreen:
            // Главный экран - mainMenu
            console.log('🏠 [MENU] Инициализация главного экрана (mainMenu)');
            // Загружаем превью последнего сообщения для кнопки Мир чат
            if (typeof loadWorldChatPreview === 'function') {
                loadWorldChatPreview();
            }
            break;
            
        case 'browseAds':
            // Экран просмотра анкет - загружаем объявления
            console.log('👁️ [MENU] Инициализация экрана просмотра анкет');
            if (typeof loadAds === 'function') {
                loadAds();
            }
            // Устанавливаем UI фильтра локации
            if (typeof setFilterLocationUI === 'function') {
                setFilterLocationUI();
            }
            break;
            
        case screens.myProfileScreen:
            // Профиль - загружаем данные пользователя
            console.log('👤 [MENU] Инициализация профиля');
            if (typeof loadMyProfile === 'function') {
                loadMyProfile();
            }
            break;
            
        case screens.myAdsScreen:
            // Мои объявления - загружаем список
            console.log('📄 [MENU] Инициализация моих объявлений');
            if (typeof loadMyAds === 'function') {
                loadMyAds();
            }
            break;
            
        case screens.chatsScreen:
            // Чаты - загружаем список чатов
            console.log('💬 [MENU] Инициализация чатов');
            if (typeof loadMyChats === 'function') {
                loadMyChats();
            }
            break;
            
        case screens.referralScreen:
            // Рефералка
            console.log('🎁 [MENU] Инициализация рефералки');
            if (typeof showReferralModal === 'function') {
                showReferralModal();
            }
            break;
            
        case screens.settingsScreen:
            // Настройки
            console.log('⚙️ [MENU] Инициализация настроек');
            if (typeof loadSettingsScreen === 'function') {
                loadSettingsScreen();
            }
            break;
    }
}

/**
 * ===== УПРАВЛЕНИЕ МЕНЮ КНОПКАМИ =====
 */

/**
 * Обновить состояние кнопок меню
 */
function updateMenuButtons() {
    const buttons = document.querySelectorAll('.menu-button');
    
    buttons.forEach(btn => {
        btn.classList.remove('active');
        
        const targetScreen = btn.getAttribute('data-screen');
        if (targetScreen === currentScreen) {
            btn.classList.add('active');
        }
    });
}

/**
 * Инициализировать кнопки меню
 */
function initializeMenuButtons() {
    console.log('🔘 [MENU] Инициализация кнопок меню');
    
    const buttons = document.querySelectorAll('.menu-button');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const screen = btn.getAttribute('data-screen');
            if (screen) {
                showScreen(screen);
            }
        });
    });
}

/**
 * ===== БУРГЕР МЕНЮ =====
 */

/**
 * Открыть/закрыть бургер-меню
 */
function toggleBurgerMenu() {
    console.log('🍔 [MENU] toggleBurgerMenu вызван');
    const overlay = document.getElementById('hamburgerMenuOverlay');
    console.log('🍔 [MENU] hamburgerMenuOverlay найден:', !!overlay);
    if (overlay) {
        overlay.classList.toggle('active');
        console.log('🍔 [MENU] classList после toggle:', overlay.classList.contains('active'));
    }
}

/**
 * Переключить hamburger меню (альтернативное имя)
 */
function toggleHamburgerMenu() {
    toggleBurgerMenu();
}

/**
 * Закрыть hamburger меню (альтернативное имя)
 */
function closeHamburgerMenu() {
    closeBurgerMenu();
}

/**
 * Закрыть hamburger меню и перейти на главный экран
 */
function closeHamburgerAndGoHome() {
    closeBurgerMenu();
    showMainMenu();
}

/**
 * Обновить активный пункт меню
 */
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

/**
 * Обновить кнопки Telegram в зависимости от экрана
 */
function updateTelegramButtons(screenId) {
    if (typeof tg === 'undefined' || !tg) return;
    
    switch(screenId) {
        case 'mainMenu':
        case 'homeScreen':
            if (tg.BackButton) tg.BackButton.hide();
            if (tg.MainButton) tg.MainButton.hide();
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
            if (tg.BackButton) tg.BackButton.show();
            if (tg.MainButton) tg.MainButton.hide();
            break;
        default:
            if (tg.BackButton) tg.BackButton.show();
            if (tg.MainButton) tg.MainButton.hide();
            break;
    }
}

/**
 * Обработчик кнопки назад в Telegram
 */
function handleBackButton() {
    // Сначала проверяем полноэкранный просмотр фото
    if (window.photoFullscreenOpen && typeof closePhotoFullscreen === 'function') {
        closePhotoFullscreen();
        return;
    }
    
    // Проверяем открытое бургер-меню
    const burgerOverlay = document.getElementById('hamburgerMenuOverlay');
    if (burgerOverlay && burgerOverlay.classList.contains('active')) {
        closeBurgerMenu();
        return;
    }
    
    const activeScreen = document.querySelector('.screen.active')?.id;
    
    switch(activeScreen) {
        case 'createAd':
        case 'browseAds':
        case 'chatsScreen':
        case 'worldChatScreen':
        case 'locationSetup':
        case 'locationChoice':
        case 'autoLocationDetection':
        case 'referralScreen':
            showMainMenu();
            break;
        case 'adDetails':
            if (typeof showBrowseAds === 'function') showBrowseAds();
            break;
        case 'chatScreen':
            if (typeof showScreen === 'function') showScreen('chatsScreen');
            break;
        default:
            showMainMenu();
    }
}

/**
 * Открыть бургер-меню
 */
function openBurgerMenu() {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    if (overlay) {
        overlay.classList.add('active');
        console.log('📖 [MENU] Бургер-меню открыто');
    }
}

/**
 * Закрыть бургер-меню
 */
function closeBurgerMenu() {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        console.log('📖 [MENU] Бургер-меню закрыто');
    }
}

/**
 * ===== БЫСТРЫЕ ПЕРЕХОДЫ =====
 */

/**
 * На главный экран
 */
function goToHome() {
    showScreen(screens.homeScreen);
}

/**
 * Показать главное меню (синоним goToHome для HTML)
 */
function showMainMenu() {
    console.log('🏠 [MENU] Переход в главное меню');
    
    // Убедимся что модальные окна авторизации скрыты
    const telegramModal = document.getElementById('telegramAuthModal');
    const emailModal = document.getElementById('emailAuthModal');
    if (telegramModal) telegramModal.style.display = 'none';
    if (emailModal) emailModal.style.display = 'none';
    
    // Скрываем все экраны
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    
    // Показываем главный экран (ID в HTML = mainMenu)
    const mainMenuScreen = document.getElementById('mainMenu');
    if (mainMenuScreen) {
        mainMenuScreen.classList.add('active');
        mainMenuScreen.style.display = 'flex';
    }
    
    // Показываем переключатель FREE/PRO на главном меню
    const premiumToggle = document.getElementById('premiumToggle');
    if (premiumToggle) {
        premiumToggle.style.display = 'flex';
    }
    
    // Обновляем отображение локации
    if (typeof updateLocationDisplay === 'function') {
        updateLocationDisplay();
    }
    
    // Обновляем статус PRO и переключатель FREE/PRO
    if (typeof loadPremiumStatus === 'function') {
        loadPremiumStatus();
    }
    
    // Обновляем счетчик непрочитанных чатов
    if (typeof updateChatBadge === 'function') {
        updateChatBadge();
    }
    
    // Загружаем превью мирового чата
    if (typeof loadWorldChatPreview === 'function') {
        loadWorldChatPreview();
    }
    
    // Загружаем статистику для админов
    if (typeof loadSiteStats === 'function') {
        loadSiteStats();
    }
    
    // Обновляем Telegram кнопки
    if (typeof updateTelegramButtons === 'function') {
        updateTelegramButtons('homeScreen');
    }
    
    // Убираем Back Button в Telegram
    if (window.Telegram?.WebApp?.BackButton) {
        window.Telegram.WebApp.BackButton.hide();
    }
    
    currentScreen = 'homeScreen';
}

/**
 * На профиль
 */
function goToProfile() {
    showScreen(screens.myProfileScreen);
}

/**
 * На мои объявления
 */
function goToMyAds() {
    showScreen(screens.myAdsScreen);
}

/**
 * На чаты
 */
function goToChats() {
    showScreen(screens.chatsScreen);
}

/**
 * На рефералку
 */
function goToReferral() {
    showScreen(screens.referralScreen);
}

/**
 * На настройки
 */
function goToSettings() {
    showScreen(screens.settingsScreen);
}

/**
 * ===== ДОПОЛНИТЕЛЬНЫЕ ЭКРАНЫ =====
 */

/**
 * Показать экран правил
 */
function showRulesScreen() {
    closeBurgerMenu();
    showScreen('rules');
}

/**
 * Показать правила (алиас)
 */
function showRules() {
    showRulesScreen();
}

/**
 * Показать модальное окно правил
 */
function showRulesModal() {
    document.getElementById('rulesModal').style.display = 'flex';
}

/**
 * Закрыть модальное окно правил
 */
function closeRulesModal() {
    document.getElementById('rulesModal').style.display = 'none';
}

/**
 * Показать экран приватности
 */
function showPrivacyScreen() {
    closeBurgerMenu();
    showScreen('privacy');
}

/**
 * Показать приватность (алиас)
 */
function showPrivacy() {
    showPrivacyScreen();
}

/**
 * Показать модальное окно приватности
 */
function showPrivacyModal() {
    document.getElementById('privacyModal').style.display = 'flex';
}

/**
 * Закрыть модальное окно приватности
 */
function closePrivacyModal() {
    document.getElementById('privacyModal').style.display = 'none';
}

/**
 * Показать экран контактов
 */
function showContactsScreen() {
    closeBurgerMenu();
    showScreen('contacts');
}

/**
 * Показать контакты
 */
function showContacts() {
    closeBurgerMenu();
    showScreen('contacts');
}

/**
 * Показать "О приложении"
 */
function showAbout() {
    closeBurgerMenu();
    showScreen('about');
    updateActiveMenuItem('about');
}

/**
 * Показать редактор никнейма
 */
function showNicknameEditor() {
    showNicknameEditorScreen();
}

/**
 * Показать экран редактирования никнейма
 */
function showNicknameEditorScreen() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    const nicknameScreen = document.getElementById('nicknameEditScreen');
    if (nicknameScreen) {
        nicknameScreen.classList.add('active');
        nicknameScreen.style.display = 'flex';
        
        // Заполняем текущий никнейм в инпут и в отображение
        const currentNickname = localStorage.getItem('user_nickname') || localStorage.getItem('userNickname') || '';
        
        const input = nicknameScreen.querySelector('#nicknameInputPage');
        if (input) {
            input.value = currentNickname;
        }
        
        const display = document.getElementById('currentNicknameDisplay');
        if (display) {
            display.textContent = currentNickname || 'Аноним';
        }
    }
    closeBurgerMenu();
}

/**
 * Показать заблокированных пользователей
 */
async function showBlockedUsers() {
    closeBurgerMenu();
    showScreen('blockedUsers');
    
    const container = document.getElementById('blockedUsersContainer');
    if (!container) return;
    
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
            const userId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;
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
        
        const escapeHtmlFn = typeof escapeHtml === 'function' ? escapeHtml : (str) => str;
        const formatTimeFn = typeof formatChatTime === 'function' ? formatChatTime : (t) => t;
        
        container.innerHTML = blockedUsers.map(user => `
            <div class="blocked-user-card">
                <div class="blocked-user-info">
                    <span class="blocked-user-icon">👤</span>
                    <div class="blocked-user-details">
                        <div class="blocked-user-name">${escapeHtmlFn(user.blocked_nickname || 'Неизвестный')}</div>
                        <div class="blocked-user-date">Заблокирован ${formatTimeFn(user.created_at)}</div>
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

/**
 * Разблокировать пользователя из списка заблокированных
 */
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

/**
 * Показать админ-панель
 */
function showAdminPanel() {
    const adminScreen = document.getElementById('adminScreen');
    if (adminScreen) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        
        adminScreen.classList.add('active');
        adminScreen.style.display = 'flex';
    }
    closeBurgerMenu();
}

/**
 * Показать информацию об аффилиате
 */
function showAffiliateInfo() {
    const affiliateScreen = document.getElementById('affiliateInfoScreen');
    if (affiliateScreen) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        
        affiliateScreen.classList.add('active');
        affiliateScreen.style.display = 'flex';
    }
    closeBurgerMenu();
}

/**
 * Показать опросы
 */
function showPolls() {
    const pollsScreen = document.getElementById('pollsScreen');
    if (pollsScreen) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        
        pollsScreen.classList.add('active');
        pollsScreen.style.display = 'flex';
    }
    closeBurgerMenu();
}

/**
 * Показать FAQ Мирового чата
 */
function showWorldChatFAQ() {
    const modal = document.getElementById('worldChatFAQModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Закрыть FAQ Мирового чата
 */
function closeWorldChatFAQ() {
    const modal = document.getElementById('worldChatFAQModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Закрыть любой модальный экран
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Выход из аккаунта
 */
function logoutUser() {
    const confirm = window.confirm('Вы уверены? Вы выйдете из аккаунта и все данные будут удалены.');
    
    if (confirm) {
        console.log('🚪 [MENU] Выход из аккаунта');
        
        // Вызываем функцию выхода из auth.js
        if (typeof logout === 'function') {
            logout();
        }
        
        // Переходим на главный экран
        showScreen(screens.homeScreen);
        closeBurgerMenu();
    }
}

/**
 * Обработка обратных кнопок (Android)
 */
function setupBackButtonHandler() {
    if (typeof tg === 'undefined' || !tg?.BackButton) return;
    
    // Обработка back-кнопки в Telegram
    tg.BackButton.onClick(() => {
        const menu = document.getElementById('burgerMenu');
        
        // Если меню открыто - закрываем его
        if (menu && menu.style.display === 'flex') {
            closeBurgerMenu();
            tg.BackButton.hide();
            return;
        }
        
        // Если на главном экране - ничего не делаем
        if (currentScreen === screens.homeScreen) {
            return;
        }
        
        // Иначе переходим на главный экран
        showScreen(screens.homeScreen);
    });
}

/**
 * ===== ИНИЦИАЛИЗАЦИЯ =====
 */

/**
 * Инициализировать модуль меню
 */
function initializeMenuModule() {
    console.log('🚀 [MENU] Инициализация модуля навигации');
    
    // Инициализируем кнопки меню
    initializeMenuButtons();
    
    // Инициализируем back button handler
    setupBackButtonHandler();
    
    // Показываем переключатель FREE/PRO
    const premiumToggle = document.getElementById('premiumToggle');
    if (premiumToggle) {
        premiumToggle.style.display = 'flex';
    }
    
    // Показываем главный экран
    showScreen(screens.homeScreen);
    
    // Загружаем превью последнего сообщения для кнопки Мир чат (как в backup)
    setTimeout(() => {
        try {
            if (typeof loadWorldChatPreview === 'function') {
                loadWorldChatPreview();
                // Обновляем превью каждые 10 секунд
                setInterval(() => {
                    loadWorldChatPreview();
                }, 10000);
            }
        } catch (e) {
            console.error('❌ [MENU] Ошибка loadWorldChatPreview:', e);
        }
    }, 300);
    
    console.log('✅ [MENU] Модуль навигации инициализирован');
}

// Алиасы для совместимости
function showNicknameChange() {
    showNicknameEditor();
}

function showAffiliateProgram() {
    showAffiliateInfo();
}

// Экспорт функций в глобальную область
window.showScreen = showScreen;
window.showMainMenu = showMainMenu;
window.toggleHamburgerMenu = toggleHamburgerMenu;
window.toggleBurgerMenu = toggleBurgerMenu;
window.closeBurgerMenu = closeBurgerMenu;
window.closeHamburgerMenu = closeHamburgerMenu;
window.openBurgerMenu = openBurgerMenu;
window.showPolls = showPolls;
window.showContacts = showContacts;
window.showAbout = showAbout;
window.showNicknameChange = showNicknameChange;
window.showNicknameEditor = showNicknameEditor;
window.showBlockedUsers = showBlockedUsers;
window.unblockUserFromList = unblockUserFromList;
window.showAdminPanel = showAdminPanel;
window.showAffiliateProgram = showAffiliateProgram;
window.showAffiliateInfo = showAffiliateInfo;
window.initializeMenuModule = initializeMenuModule;
window.closeHamburgerAndGoHome = closeHamburgerAndGoHome;
window.updateActiveMenuItem = updateActiveMenuItem;
window.updateTelegramButtons = updateTelegramButtons;
window.handleBackButton = handleBackButton;
window.goToHome = goToHome;
window.goToProfile = goToProfile;
window.goToMyAds = goToMyAds;
window.goToChats = goToChats;
window.goToReferral = goToReferral;
window.goToSettings = goToSettings;
window.showRulesScreen = showRulesScreen;
window.showRules = showRules;
window.showRulesModal = showRulesModal;
window.closeRulesModal = closeRulesModal;
window.showPrivacyScreen = showPrivacyScreen;
window.showPrivacy = showPrivacy;
window.showPrivacyModal = showPrivacyModal;
window.closePrivacyModal = closePrivacyModal;
window.showContactsScreen = showContactsScreen;
window.closeModal = closeModal;
window.logoutUser = logoutUser;
window.showWorldChatFAQ = showWorldChatFAQ;
window.closeWorldChatFAQ = closeWorldChatFAQ;
window.showNicknameEditorScreen = showNicknameEditorScreen;
window.handleBackButton = handleBackButton;
window.updateMenuButtons = updateMenuButtons;
window.initializeMenuButtons = initializeMenuButtons;

/**
 * Открыть партнёрскую программу в Telegram боте
 */
function openAffiliateProgram() {
    const botUsername = 'anonimka_kz_bot';
    const botProfileUrl = `https://t.me/${botUsername}`;
    
    if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(botProfileUrl);
    } else {
        window.open(botProfileUrl, '_blank');
    }
}

/**
 * Голосование в опросе
 */
async function votePoll(pollId, answer) {
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
        alert('Ошибка: токен пользователя не найден');
        return;
    }
    
    try {
        const response = await fetch('/api/poll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Token': userToken
            },
            body: JSON.stringify({
                poll_id: pollId,
                answer: answer
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem(`poll_voted_${pollId}`, 'true');
            loadPollResults(pollId);
        } else {
            if (data.error === 'Already voted') {
                alert('Вы уже проголосовали в этом опросе!');
                loadPollResults(pollId);
            } else {
                alert('Ошибка голосования: ' + (data.error || 'Неизвестная ошибка'));
            }
        }
    } catch (error) {
        console.error('Ошибка голосования:', error);
        alert('Ошибка соединения с сервером');
    }
}

/**
 * Загрузить результаты опроса
 */
async function loadPollResults(pollId) {
    let prefix = '';
    if (pollId === 'photos_in_ads') {
        prefix = 'photos';
    }
    
    const optionsElement = document.getElementById(`${prefix}PollOptions`);
    const resultsElement = document.getElementById(`${prefix}PollResults`);
    
    if (!optionsElement || !resultsElement) return;
    
    try {
        const userToken = localStorage.getItem('user_token');
        const headers = { 'Content-Type': 'application/json' };
        if (userToken) headers['X-User-Token'] = userToken;
        
        const response = await fetch(`/api/poll?poll_id=${pollId}`, { headers });
        const data = await response.json();
        
        if (data.success) {
            const total = data.results.yes + data.results.no;
            const yesPercent = total > 0 ? Math.round((data.results.yes / total) * 100) : 0;
            const noPercent = total > 0 ? Math.round((data.results.no / total) * 100) : 0;
            
            if (data.hasVoted) {
                optionsElement.style.display = 'none';
                resultsElement.style.display = 'block';
                resultsElement.innerHTML = `
                    <div class="poll-result">
                        <span>✅ Да</span>
                        <div class="progress-bar"><div class="progress" style="width: ${yesPercent}%"></div></div>
                        <span>${yesPercent}% (${data.results.yes})</span>
                    </div>
                    <div class="poll-result">
                        <span>❌ Нет</span>
                        <div class="progress-bar"><div class="progress" style="width: ${noPercent}%"></div></div>
                        <span>${noPercent}% (${data.results.no})</span>
                    </div>
                    <p style="margin-top: 10px; color: var(--muted);">Всего голосов: ${total}</p>
                `;
            } else {
                optionsElement.style.display = 'flex';
                resultsElement.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки результатов:', error);
    }
}

/**
 * Установить приложение на рабочий стол
 */
function promptInstallApp() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isTelegramWebApp = window.Telegram?.WebApp?.platform !== 'unknown';
    
    if (!isTelegramWebApp && window.deferredPWAPrompt) {
        window.deferredPWAPrompt.prompt();
        window.deferredPWAPrompt.userChoice.then((choiceResult) => {
            window.deferredPWAPrompt = null;
        });
        return;
    }
    
    if (!isTelegramWebApp && !window.deferredPWAPrompt) {
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
                '3. Подтвердите установку'
            );
        }
        return;
    }
    
    if (window.Telegram?.WebApp?.addToHomeScreen && !isIOS) {
        try {
            window.Telegram.WebApp.addToHomeScreen();
        } catch (error) {
            tg.showAlert('❌ Не удалось создать ярлык. Попробуйте через меню Telegram (⋮).');
        }
    } else {
        if (isIOS) {
            tg.showAlert(
                '📲 Установка на iPhone:\n\n' +
                '1️⃣ Нажмите ⋮ (три точки) в ПРАВОМ ВЕРХНЕМ углу\n\n' +
                '2️⃣ Выберите "Создать ярлык" или "Add to Home Screen"\n\n' +
                '3️⃣ Нажмите "Добавить"'
            );
        } else {
            tg.showAlert(
                '📲 Создание ярлыка:\n\n' +
                '1. Откройте меню Telegram (⋮ в правом верхнем углу)\n' +
                '2. Выберите "Создать ярлык"\n' +
                '3. Подтвердите добавление на рабочий стол'
            );
        }
    }
}

/**
 * Переключение вкладок админ-панели
 */
function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const tabContent = document.getElementById(`admin-${tab}`);
    if (tabContent) tabContent.style.display = 'block';
    
    if (tab === 'users') loadAdminUsers();
}

/**
 * Загрузить список пользователей для админ-панели
 */
async function loadAdminUsers() {
    try {
        const container = document.getElementById('admin-users-list');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">Загрузка...</div>';
        
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        
        if (!data.success) {
            container.innerHTML = '<div class="error">Ошибка загрузки</div>';
            return;
        }
        
        if (!data.users?.length) {
            container.innerHTML = '<div class="empty">Нет пользователей</div>';
            return;
        }
        
        container.innerHTML = data.users.map(user => `
            <div class="admin-user-item">
                <div class="user-info">
                    <span class="nickname">${user.display_nickname || 'Аноним'}</span>
                    <span class="id">ID: ${user.telegram_id || user.id}</span>
                </div>
                <div class="user-status ${user.is_premium ? 'premium' : ''}">
                    ${user.is_premium ? '⭐ PRO' : 'FREE'}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
    }
}

/**
 * Отправить уведомление всем пользователям
 */
async function sendAdminNotification() {
    const message = document.getElementById('adminNotificationText')?.value?.trim();
    if (!message) {
        tg.showAlert('Введите текст уведомления');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        if (data.success) {
            tg.showAlert(`✅ Отправлено ${data.count} уведомлений`);
            document.getElementById('adminNotificationText').value = '';
        } else {
            tg.showAlert('Ошибка: ' + data.error);
        }
    } catch (error) {
        console.error('Ошибка отправки уведомления:', error);
        tg.showAlert('Ошибка при отправке');
    }
}

/**
 * ===== АДМИНСКИЕ ФУНКЦИИ =====
 */

// Используем isAdminUser из admin.js через window.isAdminUser
let adminCheckCompleted = false;

/**
 * Загрузить статистику сайта (для админов)
 */
async function loadSiteStats() {
    try {
        // Проверяем is_admin только один раз
        if (!adminCheckCompleted) {
            let userId = typeof tg !== 'undefined' && tg?.initDataUnsafe?.user?.id ? tg.initDataUnsafe.user.id : null;
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
            
            const userToken = localStorage.getItem('user_token');
            console.log('[ADMIN STATS] 🔍 Проверка админа - userId:', userId, 'userToken:', userToken ? userToken.substring(0, 16) + '...' : 'нет');
            
            // DEBUG: показываем что происходит
            if (userId == 884253640 || userId == 543332884) {
                console.log('[ADMIN STATS] 🎯 ОБНАРУЖЕН ПОТЕНЦИАЛЬНЫЙ АДМИН! userId:', userId);
            }
            
            if (userId) {
                try {
                    const userStatusResponse = await fetch(`/api/users?action=check-admin&user_id=${userId}`);
                    const userStatusData = await userStatusResponse.json();
                    console.log('[ADMIN STATS] Ответ API (по user_id):', userStatusData);
                    window.isAdminUser = userStatusData.is_admin === true;
                    console.log('[ADMIN STATS] isAdminUser:', window.isAdminUser);
                } catch (err) {
                    console.error('[ADMIN STATS] Ошибка проверки статуса админа:', err);
                }
            } else if (userToken) {
                try {
                    const userStatusResponse = await fetch(`/api/users?action=check-admin&userToken=${userToken}`);
                    const userStatusData = await userStatusResponse.json();
                    console.log('[ADMIN STATS] Ответ API (по userToken):', userStatusData);
                    window.isAdminUser = userStatusData.is_admin === true;
                    console.log('[ADMIN STATS] isAdminUser:', window.isAdminUser);
                } catch (err) {
                    console.error('[ADMIN STATS] Ошибка проверки статуса админа по токену:', err);
                }
            } else {
                console.warn('[ADMIN STATS] Ни userId, ни userToken не найдены - пропускаем проверку');
                // Не устанавливаем adminCheckCompleted = true, чтобы попробовать снова
                return;
            }
            
            adminCheckCompleted = true;
            
            // Скрываем/показываем элементы админа
            const adminStatsEl = document.getElementById('adminStats');
            console.log('[ADMIN STATS] Элемент adminStats найден:', !!adminStatsEl);
            if (adminStatsEl) {
                adminStatsEl.style.display = window.isAdminUser ? 'flex' : 'none';
                console.log('[ADMIN STATS] Установлен display:', adminStatsEl.style.display);
            }

            const adminMenuItem = document.getElementById('adminMenuItem');
            if (adminMenuItem) {
                adminMenuItem.style.display = window.isAdminUser ? 'flex' : 'none';
            }
        }
        
        if (!window.isAdminUser) return;
        
        const response = await fetch('/api/analytics?metric=all');
        const data = await response.json();
        
        console.log('[STATS] API Response:', data);
        
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
        
        if (totalVisitsEl && data.total_unique_users !== undefined) {
            totalVisitsEl.textContent = formatNumber(data.total_unique_users);
            console.log('[STATS] Updated totalVisits:', data.total_unique_users);
        }
        
        if (onlineNowEl && data.unique_last_24h !== undefined) {
            onlineNowEl.textContent = formatNumber(data.unique_last_24h);
            console.log('[STATS] Updated onlineNow:', data.unique_last_24h);
        }
        
        if (totalAdsEl && data.total_ads !== undefined) {
            totalAdsEl.textContent = formatNumber(data.total_ads);
            console.log('[STATS] Updated totalAds:', data.total_ads);
        }
        
        if (blockedUsersEl && data.blocked_users !== undefined) {
            blockedUsersEl.textContent = formatNumber(data.blocked_users);
            console.log('[STATS] Updated blockedUsers:', data.blocked_users);
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

/**
 * Запустить автообновление статистики
 */
function startStatsAutoUpdate() {
    loadSiteStats();
    setInterval(() => {
        if (window.isAdminUser) {
            loadSiteStats();
        }
    }, 10000);
}

/**
 * Форматирование чисел
 */
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
}

/**
 * Форматирование даты
 */
function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('ru-RU', { hour12: false });
}

/**
 * Запрос к API администратора
 */
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

/**
 * Забанить пользователя (админ)
 */
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

/**
 * Снять бан с пользователя (админ)
 */
async function unbanUserFromAdmin(userToken) {
    if (!confirm('Снять бан с пользователя?')) return;
    try {
        await fetchAdminData('unban-user', { userToken });
        loadAdminUsers();
    } catch (err) {
        tg.showAlert ? tg.showAlert(err.message) : alert(err.message);
    }
}

/**
 * Заблокировать анкету (админ)
 */
async function blockAdFromAdmin(adId) {
    const reason = prompt('Причина блокировки анкеты?', 'Модерация');
    if (reason === null) return;
    const hoursInput = prompt('Длительность блокировки (часов, пусто = бессрочно)');
    const durationHours = hoursInput && hoursInput.trim() !== '' ? Number(hoursInput) : null;
    try {
        await fetchAdminData('block-ad', { adId, reason, durationHours });
        if (typeof loadAdminAds === 'function') loadAdminAds();
    } catch (err) {
        tg.showAlert ? tg.showAlert(err.message) : alert(err.message);
    }
}

/**
 * Разблокировать анкету (админ)
 */
async function unblockAdFromAdmin(adId) {
    if (!confirm('Разблокировать анкету?')) return;
    try {
        await fetchAdminData('unblock-ad', { adId });
        if (typeof loadAdminAds === 'function') loadAdminAds();
    } catch (err) {
        tg.showAlert ? tg.showAlert(err.message) : alert(err.message);
    }
}

window.openAffiliateProgram = openAffiliateProgram;
window.votePoll = votePoll;
window.loadPollResults = loadPollResults;
window.promptInstallApp = promptInstallApp;
window.switchAdminTab = switchAdminTab;
window.loadAdminUsers = loadAdminUsers;
window.sendAdminNotification = sendAdminNotification;
window.loadSiteStats = loadSiteStats;
window.startStatsAutoUpdate = startStatsAutoUpdate;
window.fetchAdminData = fetchAdminData;
window.banUserFromAdmin = banUserFromAdmin;
window.unbanUserFromAdmin = unbanUserFromAdmin;
window.blockAdFromAdmin = blockAdFromAdmin;
window.unblockAdFromAdmin = unblockAdFromAdmin;
window.formatDateTime = formatDateTime;

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
        console.log('📱 [MENU] Not Android app, hiding Android-specific menu items');
        document.querySelectorAll('.android-only').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.non-android-only').forEach(el => el.style.display = 'flex');
        return;
    }
    
    console.log('✅ [MENU] Android app detected, showing Android menu items');
    document.querySelectorAll('.android-only').forEach(el => el.style.display = 'flex');
    document.querySelectorAll('.non-android-only').forEach(el => el.style.display = 'none');
}

window.isAndroidApp = isAndroidApp;
window.initializeAndroidMenu = initializeAndroidMenu;

// Инициализируем Android меню при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAndroidMenu);
} else {
    initializeAndroidMenu();
}

// Закрытие меню при клике вне меню (как в backup)
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    const menu = overlay?.querySelector('.hamburger-menu-content');
    const hamburgerBtn = document.querySelector('.hamburger-menu');
    
    if (overlay && menu) {
        document.addEventListener('click', (e) => {
            // Если меню открыто и клик НЕ внутри меню и НЕ на кнопке открытия
            if (overlay.classList.contains('active') && 
                !menu.contains(e.target) && 
                !hamburgerBtn?.contains(e.target)) {
                closeBurgerMenu();
            }
        });
    }
});

console.log('✅ [MENU] Модуль навигации загружен');

// Проверка параметра auth в URL
function checkAuthParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');
    
    if (authParam) {
        console.log('🔗 [MENU] URL параметр auth:', authParam);
        
        // Очищаем параметр из URL
        window.history.replaceState({}, '', window.location.pathname);
        
        if (authParam === 'telegram') {
            console.log('📱 [MENU] Параметр auth=telegram - показываем модальное окно');
            if (typeof showTelegramAuthModal === 'function') {
                setTimeout(() => showTelegramAuthModal(), 100);
                return true;
            }
        }
        
        if (authParam === 'email') {
            console.log('📧 [MENU] Параметр auth=email - показываем модальное окно');
            if (typeof showEmailAuthModal === 'function') {
                setTimeout(() => showEmailAuthModal(), 100);
                return true;
            }
        }
    }
    return false;
}

// Автоматически запускаем приложение после загрузки модуля
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 [MENU] DOMContentLoaded - запуск приложения');
        if (!checkAuthParam() && typeof checkOnboardingStatus === 'function') {
            checkOnboardingStatus();
        }
    });
} else {
    console.log('🚀 [MENU] DOM уже загружен - запуск приложения');
    if (!checkAuthParam() && typeof checkOnboardingStatus === 'function') {
        setTimeout(() => checkOnboardingStatus(), 100);
    }
}

} catch(e) { console.error('❌ Ошибка в модуле menu.js:', e); }
})();

console.log('✅ [BUNDLE] Все 18 модулей загружены!');
