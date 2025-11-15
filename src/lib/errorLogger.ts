/**
 * Глобальный обработчик ошибок для отправки в Telegram
 */

interface ErrorInfo {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  componentStack?: string;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private apiUrl = '/api/log-error';
  private userId: string | null = null;
  private errorQueue: ErrorInfo[] = [];
  private isSending = false;

  private constructor() {
    this.init();
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private init() {
    // Глобальный обработчик JS ошибок
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: this.userId || undefined,
      });
    });

    // Обработчик необработанных Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: this.userId || undefined,
      });
    });

    // Обработчик React ошибок (через componentStack)
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Ловим React ошибки
      if (args[0]?.includes?.('React') || args[0]?.includes?.('component')) {
        this.logError({
          message: String(args[0]),
          componentStack: args[1]?.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          userId: this.userId || undefined,
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  private async logError(errorInfo: ErrorInfo) {
    // Фильтруем спам
    const ignorePatterns = [
      'ResizeObserver loop',
      'Script error',
      'Extension context invalidated',
    ];

    if (ignorePatterns.some(pattern => errorInfo.message.includes(pattern))) {
      return;
    }

    // Добавляем в очередь
    this.errorQueue.push(errorInfo);

    // Отправляем если не отправляется уже
    if (!this.isSending) {
      await this.sendErrors();
    }
  }

  private async sendErrors() {
    if (this.errorQueue.length === 0) return;

    this.isSending = true;

    while (this.errorQueue.length > 0) {
      const error = this.errorQueue.shift()!;

      try {
        await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(error),
        });

        // Задержка между отправками (не спамим)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error('Failed to send error log:', err);
        // Не возвращаем в очередь - теряем ошибку чтобы не зациклиться
      }
    }

    this.isSending = false;
  }

  // Ручная отправка ошибки
  logManual(message: string, additionalInfo?: Record<string, any>) {
    this.logError({
      message: `[Manual] ${message}`,
      stack: new Error().stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      ...additionalInfo,
    });
  }
}

// Экспортируем синглтон
export const errorLogger = ErrorLogger.getInstance();

// Инициализация при загрузке модуля
if (typeof window !== 'undefined') {
  errorLogger;
}
