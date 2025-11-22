import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_TELEGRAM_ID = process.env.ADMIN_CHAT_ID || '884253640'; // Ваш Telegram ID

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
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    console.log('Sending to Telegram, chat_id:', ADMIN_TELEGRAM_ID);
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_TELEGRAM_ID,
        text: errorText,
        parse_mode: 'HTML',
      }),
    });

    const responseText = await response.text();
    console.log('Telegram API response status:', response.status);
    console.log('Telegram API response:', responseText);

    if (!response.ok) {
      console.error('Failed to send Telegram alert. Status:', response.status);
      console.error('Response:', responseText);
      throw new Error(`Telegram API error: ${responseText}`);
    }
  } catch (err) {
    console.error('Error sending Telegram alert:', err);
    throw err;
  }
}

export async function POST(request: NextRequest) {
  try {
    const errorLog: ErrorLog = await request.json();

    // Логируем конфигурацию для диагностики
    console.log('=== Error Logging Debug ===');
    console.log('TELEGRAM_BOT_TOKEN:', TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT SET');
    console.log('ADMIN_TELEGRAM_ID:', ADMIN_TELEGRAM_ID);
    console.log('Error message:', errorLog.message);

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
      console.log('Error ignored by filter');
      return NextResponse.json({ success: true, ignored: true });
    }

    // Логируем на сервере
    console.error('Client Error:', {
      message: errorLog.message,
      url: errorLog.url,
      userId: errorLog.userId,
      timestamp: errorLog.timestamp,
    });

    // Отправляем в Telegram и ждем результата для диагностики
    try {
      await sendTelegramAlert(errorLog);
      console.log('Telegram alert sent successfully');
    } catch (err) {
      console.error('Failed to send Telegram alert:', err);
    }

    return NextResponse.json({ 
      success: true,
      debug: {
        botTokenSet: !!TELEGRAM_BOT_TOKEN,
        chatId: ADMIN_TELEGRAM_ID
      }
    });
  } catch (error) {
    console.error('Error processing error log:', error);
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}
