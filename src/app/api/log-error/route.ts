import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_TELEGRAM_ID = '884253640';

interface ErrorLog {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  componentStack?: string;
}

async function sendTelegramAlert(error: ErrorLog) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return;
  }

  const errorText = `
🔴 <b>Ошибка на сайте!</b>

📍 <b>URL:</b> ${error.url}
⏰ <b>Время:</b> ${error.timestamp}
👤 <b>User ID:</b> ${error.userId || 'Неизвестен'}

❌ <b>Ошибка:</b>
<code>${error.message.slice(0, 500)}</code>

🌐 <b>Browser:</b>
<code>${error.userAgent.slice(0, 200)}</code>

${error.stack ? `📋 <b>Stack:</b>\n<code>${error.stack.slice(0, 800)}</code>` : ''}
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

export async function POST(request: NextRequest) {
  try {
    const errorLog: ErrorLog = await request.json();

    // Фильтруем спам и неважные ошибки
    const ignorePatterns = [
      'ResizeObserver loop',
      'Script error',
      'Extension context invalidated',
      'Non-Error promise rejection',
    ];

    const shouldIgnore = ignorePatterns.some(pattern =>
      errorLog.message.includes(pattern)
    );

    if (shouldIgnore) {
      return NextResponse.json({ success: true, ignored: true });
    }

    // Логируем на сервере
    console.error('Client Error:', {
      message: errorLog.message,
      url: errorLog.url,
      userId: errorLog.userId,
      timestamp: errorLog.timestamp,
    });

    // Отправляем в Telegram (асинхронно, не блокируем ответ)
    sendTelegramAlert(errorLog).catch(err =>
      console.error('Failed to send alert:', err)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing error log:', error);
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}
