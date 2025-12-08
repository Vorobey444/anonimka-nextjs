// Утилита для безопасного логирования чувствительных данных

// В продакшене отключаем детальное логирование
const ENABLE_SENSITIVE_LOGS = process.env.NODE_ENV === 'development';

/**
 * Хеширует чувствительные данные для логов
 * Показывает только первые 3 и последние 3 символа
 */
function hashSensitiveData(data: any): string {
  if (!data) return '***';
  const str = String(data);
  if (str.length <= 6) return '***';
  return str.substring(0, 3) + '***' + str.substring(str.length - 3);
}

/**
 * Очищает объект от чувствительных полей
 */
function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  const sensitiveFields = [
    'userId', 'tg_id', 'tgId', 'chatId', 
    'referrerId', 'newUserId', 'blocked_id', 
    'blocker_id', 'user1', 'user2'
  ];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = hashSensitiveData(sanitized[field]);
    }
  }
  
  return sanitized;
}

/**
 * Безопасный console.log для чувствительных данных
 */
export function safeLog(message: string, data?: any): void {
  if (!ENABLE_SENSITIVE_LOGS) return;
  
  if (data) {
    const sanitized = sanitizeObject(data);
    console.log(message, sanitized);
  } else {
    console.log(message);
  }
}

/**
 * Безопасный console.error (всегда работает, но скрывает чувствительные данные)
 */
export function safeError(message: string, error?: any): void {
  if (error && typeof error === 'object') {
    const sanitized = sanitizeObject(error);
    console.error(message, sanitized);
  } else {
    console.error(message, error);
  }
}

/**
 * Логирование только для критических событий (всегда включено)
 */
export function criticalLog(message: string, data?: any): void {
  const sanitized = data ? sanitizeObject(data) : undefined;
  console.log(`🚨 [CRITICAL] ${message}`, sanitized || '');
}
