// ============= СИСТЕМА ЛОГИРОВАНИЯ ОШИБОК =============
// Портировано из WORK/public/webapp/app.js

export interface ErrorData {
  message: string;
  stack: string;
  url: string;
  userAgent: string;
  userId?: string | null;
  username?: string;
  timestamp: string;
  type: 'error' | 'unhandledRejection' | 'manual' | 'async_error';
  critical: boolean;
  appState: {
    isAuthorized: boolean;
    hasNickname: boolean;
    currentPage: string;
    screenSize: string;
    online: boolean;
  };
  recentActions: Array<{
    action: string;
    details: Record<string, any>;
    timestamp: string;
  }>;
}

// Кеш ошибок с временными метками
const errorLogCache = new Map<string, number>();
const ERROR_CACHE_TTL = 30000; // 30 секунд
const ENABLE_ERROR_DEBUG = false; // Отладка системы логирования

// История действий пользователя (последние 10 действий)
const userActionHistory: Array<{
  action: string;
  details: Record<string, any>;
  timestamp: string;
}> = [];
const MAX_ACTION_HISTORY = 10;

/**
 * Функция для логирования действий пользователя
 */
export function logUserAction(action: string, details: Record<string, any> = {}): void {
  const timestamp = new Date().toISOString();
  userActionHistory.push({ action, details, timestamp });
  if (userActionHistory.length > MAX_ACTION_HISTORY) {
    userActionHistory.shift(); // Удаляем самое старое действие
  }
}

/**
 * Отправка ошибки на сервер
 */
export async function logErrorToServer(
  error: Error | { message: string; stack?: string },
  type: ErrorData['type'] = 'error'
): Promise<void> {
  try {
    // Создаем более точный ключ кеша
    const errorMessage = error.message || String(error);
    const errorStack = (error as Error).stack || '';
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

    if (cachedTime && now - cachedTime < ERROR_CACHE_TTL) {
      if (ENABLE_ERROR_DEBUG) {
        const remainingTime = Math.ceil((ERROR_CACHE_TTL - (now - cachedTime)) / 1000);
        console.log(
          `[ERROR LOG] Ошибка в кеше, осталось ${remainingTime} сек до повторной отправки`
        );
      }
      return;
    }

    // Обновляем кеш
    errorLogCache.set(errorKey, now);

    // Очищаем старые записи из кеша (оптимизация памяти)
    if (errorLogCache.size > 50) {
      const keysToDelete: string[] = []
      Array.from(errorLogCache.entries()).forEach(([key, time]) => {
        if (now - time > ERROR_CACHE_TTL) {
          keysToDelete.push(key)
        }
      })
      keysToDelete.forEach((key) => errorLogCache.delete(key))
    }

    // Определяем критичность ошибки
    const isCritical =
      errorMessage.includes('not defined') ||
      errorMessage.includes('is not a function') ||
      errorMessage.includes('Cannot read') ||
      type === 'unhandledRejection';

    const errorData: ErrorData = {
      message: errorMessage,
      stack: errorStack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      userId:
        typeof window !== 'undefined'
          ? localStorage.getItem('user_id') || localStorage.getItem('telegram_user_id')
          : null,
      username: typeof window !== 'undefined' ? localStorage.getItem('user_nickname') : undefined,
      timestamp: new Date().toISOString(),
      type: type,
      critical: isCritical,
      // Состояние приложения
      appState: {
        isAuthorized:
          typeof window !== 'undefined'
            ? !!(localStorage.getItem('user_token') || localStorage.getItem('telegram_user'))
            : false,
        hasNickname:
          typeof window !== 'undefined' ? !!localStorage.getItem('user_nickname') : false,
        currentPage: typeof window !== 'undefined' ? window.location.pathname : '',
        screenSize:
          typeof window !== 'undefined'
            ? `${window.innerWidth}x${window.innerHeight}`
            : 'unknown',
        online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      },
      // Последние действия пользователя
      recentActions: userActionHistory.slice(-5), // Последние 5 действий
    };

    if (ENABLE_ERROR_DEBUG) {
      console.log('[ERROR LOG] Отправка на сервер...');
    }

    // Отправляем асинхронно, не блокируем UI
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    })
      .then((response) => {
        if (ENABLE_ERROR_DEBUG) {
          console.log('[ERROR LOG] Ответ сервера:', response.status);
        }
        return response.json();
      })
      .then((data) => {
        if (ENABLE_ERROR_DEBUG) {
          console.log('[ERROR LOG] Результат:', data);
          if (data.telegramSent === false && data.telegramError) {
            console.error('[ERROR LOG] ❌ Ошибка отправки в Telegram:', data.telegramError);
          } else if (data.telegramSent === true) {
            console.log('[ERROR LOG] ✅ Уведомление отправлено в Telegram');
          }
        }
      })
      .catch((err) => console.error('[ERROR LOG] Не удалось отправить лог:', err));
  } catch (logError) {
    console.error('[ERROR LOG] Ошибка при логировании:', logError);
  }
}

/**
 * Функция для ручного логирования ошибок
 */
export function logError(message: string, error?: Error): void {
  console.error(message, error);
  logErrorToServer(error || { message, stack: '' }, 'manual');
}

/**
 * Утилита: безопасное выполнение async функций с автологированием
 */
export async function safeAsync<T>(
  actionName: string,
  asyncFn: () => Promise<T>
): Promise<T> {
  logUserAction(actionName, { started: true });
  try {
    const result = await asyncFn();
    logUserAction(actionName, { completed: true });
    return result;
  } catch (error) {
    console.error(`❌ Ошибка в ${actionName}:`, error);
    logUserAction(actionName, { error: (error as Error).message });
    logErrorToServer(error as Error, 'async_error');
    throw error; // Пробрасываем дальше
  }
}

/**
 * Утилиты для управления системой логирования
 */
export function clearErrorCache(): void {
  errorLogCache.clear();
  console.log('[ERROR LOG] ✅ Кеш очищен');
}

export function getErrorCacheInfo(): void {
  console.log('[ERROR LOG] Размер кеша:', errorLogCache.size)
  const now = Date.now()
  console.log('[ERROR LOG] Записи в кеше:')
  Array.from(errorLogCache.entries()).forEach(([key, time]) => {
    const age = Math.ceil((now - time) / 1000)
    console.log(`  - ${key.substring(0, 60)}... (${age} сек назад)`)
  })
}

export function getActionHistory(): void {
  console.log('[ACTION LOG] История действий пользователя:');
  userActionHistory.forEach((action, i) => {
    console.log(`${i + 1}. [${action.timestamp}] ${action.action}`, action.details);
  });
}

/**
 * Инициализация глобальных обработчиков ошибок
 * Вызывать один раз при загрузке приложения
 */
export function initErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  // Глобальный обработчик ошибок JavaScript
  window.addEventListener('error', (event) => {
    console.error('❌ Перехвачена ошибка:', event.error);
    logErrorToServer(event.error || { message: event.message, stack: '' }, 'error');
  });

  // Обработчик необработанных Promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Необработанное отклонение Promise:', event.reason);
    const error =
      event.reason instanceof Error
        ? event.reason
        : { message: String(event.reason), stack: '' };
    logErrorToServer(error, 'unhandledRejection');
  });

  // Делаем функции доступными глобально для отладки
  (window as any).logUserAction = logUserAction;
  (window as any).logError = logError;
  (window as any).safeAsync = safeAsync;
  (window as any).clearErrorCache = clearErrorCache;
  (window as any).getErrorCacheInfo = getErrorCacheInfo;
  (window as any).getActionHistory = getActionHistory;

  console.log('✅ [ERROR LOG] Система логирования ошибок инициализирована');
}
