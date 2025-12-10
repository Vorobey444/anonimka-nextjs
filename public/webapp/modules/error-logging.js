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
