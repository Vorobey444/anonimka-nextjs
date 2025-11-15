/**
 * Серверный логгер ошибок с отправкой в Telegram
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_TELEGRAM_ID = '884253640';

interface ServerErrorInfo {
  message: string;
  stack?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  userId?: string;
  timestamp: string;
  environment: string;
}

export class ServerErrorLogger {
  private static lastErrorTime = 0;
  private static errorCount = 0;
  private static readonly RATE_LIMIT_MS = 60000; // 1 минута
  private static readonly MAX_ERRORS_PER_MINUTE = 10;

  static async logError(error: Error, context?: {
    endpoint?: string;
    method?: string;
    statusCode?: number;
    userId?: string;
  }) {
    // Rate limiting - не спамить
    const now = Date.now();
    if (now - this.lastErrorTime < this.RATE_LIMIT_MS) {
      this.errorCount++;
      if (this.errorCount > this.MAX_ERRORS_PER_MINUTE) {
        console.warn('Too many errors, skipping Telegram alert');
        return;
      }
    } else {
      this.errorCount = 1;
      this.lastErrorTime = now;
    }

    const errorInfo: ServerErrorInfo = {
      message: error.message,
      stack: error.stack,
      endpoint: context?.endpoint,
      method: context?.method,
      statusCode: context?.statusCode,
      userId: context?.userId,
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    };

    // Логируем в консоль (Vercel Logs)
    console.error('Server Error:', {
      message: errorInfo.message,
      endpoint: errorInfo.endpoint,
      statusCode: errorInfo.statusCode,
      userId: errorInfo.userId,
    });

    // Отправляем в Telegram только в production
    if (errorInfo.environment === 'production') {
      await this.sendTelegramAlert(errorInfo);
    }
  }

  private static async sendTelegramAlert(errorInfo: ServerErrorInfo) {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return;
    }

    const errorText = `
🔴 <b>Серверная ошибка!</b>

${errorInfo.endpoint ? `📍 <b>Endpoint:</b> ${errorInfo.method} ${errorInfo.endpoint}` : ''}
${errorInfo.statusCode ? `📊 <b>Status:</b> ${errorInfo.statusCode}` : ''}
⏰ <b>Время:</b> ${errorInfo.timestamp}
${errorInfo.userId ? `👤 <b>User ID:</b> ${errorInfo.userId}` : ''}
🌍 <b>Environment:</b> ${errorInfo.environment}

❌ <b>Ошибка:</b>
<code>${errorInfo.message.slice(0, 500)}</code>

${errorInfo.stack ? `📋 <b>Stack:</b>\n<code>${errorInfo.stack.slice(0, 800)}</code>` : ''}
    `.trim();

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: ADMIN_TELEGRAM_ID,
            text: errorText,
            parse_mode: 'HTML',
          }),
        }
      );

      if (!response.ok) {
        console.error('Failed to send Telegram alert:', await response.text());
      }
    } catch (err) {
      console.error('Error sending Telegram alert:', err);
    }
  }

  // Удобная обертка для try-catch
  static async wrap<T>(
    fn: () => Promise<T>,
    context?: {
      endpoint?: string;
      method?: string;
      userId?: string;
    }
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      await this.logError(error as Error, context);
      throw error;
    }
  }
}

// Хелпер для API routes
export function withErrorLogging(
  handler: (req: Request) => Promise<Response>,
  endpoint: string
) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (error) {
      await ServerErrorLogger.logError(error as Error, {
        endpoint,
        method: req.method,
      });

      // Возвращаем 500 ошибку
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
