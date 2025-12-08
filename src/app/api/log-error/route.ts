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
  username?: string;
  componentStack?: string;
  type?: string;
  critical?: boolean;
  appState?: {
    isAuthorized: boolean;
    hasNickname: boolean;
    currentPage: string;
    screenSize: string;
    online: boolean;
  };
  recentActions?: Array<{
    action: string;
    details: any;
    timestamp: string;
  }>;
}

// Экранирование HTML символов для Telegram
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendTelegramAlert(error: ErrorLog) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return;
  }

  // Экранируем HTML в тексте ошибки и stack trace
  const safeMessage = escapeHtml(error.message.slice(0, 500));
  const safeStack = error.stack ? escapeHtml(error.stack.slice(0, 800)) : '';
  const safeUserAgent = escapeHtml(error.userAgent.slice(0, 200));
  
  // Иконка в зависимости от критичности
  const icon = error.critical ? '🚨' : '🔴';
  const priority = error.critical ? '<b>[КРИТИЧНО]</b> ' : '';

  // Форматируем последние действия
  let actionsText = '';
  if (error.recentActions && error.recentActions.length > 0) {
    actionsText = '\n\n👣 <b>Последние действия:</b>\n';
    error.recentActions.forEach((action, i) => {
      const time = new Date(action.timestamp).toLocaleTimeString('ru-RU');
      actionsText += `${i + 1}. [${time}] ${escapeHtml(action.action)}\n`;
    });
  }

  // Форматируем состояние приложения
  let stateText = '';
  if (error.appState) {
    stateText = `\n\n📊 <b>Состояние:</b>
🔐 Авторизован: ${error.appState.isAuthorized ? '✅' : '❌'}
👤 Никнейм: ${error.appState.hasNickname ? '✅' : '❌'}
📱 Экран: ${error.appState.screenSize}
🌐 Онлайн: ${error.appState.online ? '✅' : '❌'}`;
  }

  const errorText = `
${icon} ${priority}<b>Ошибка на сайте!</b>

📍 <b>URL:</b> ${error.url}
⏰ <b>Время:</b> ${error.timestamp}
👤 <b>User ID:</b> ${error.userId || 'Неизвестен'}${error.username ? ` (@${error.username})` : ''}

❌ <b>Ошибка:</b>
<code>${safeMessage}</code>

🌐 <b>Browser:</b>
<code>${safeUserAgent}</code>

${safeStack ? `📋 <b>Stack:</b>\n<code>${safeStack}</code>` : ''}${stateText}${actionsText}
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
    const body = await request.json().catch(() => ({}));
    const errorLog: ErrorLog = {
      message: body?.message || 'Unknown error',
      stack: body?.stack,
      url: body?.url || 'n/a',
      userAgent: body?.userAgent || (request.headers.get('user-agent') || 'n/a'),
      timestamp: body?.timestamp || new Date().toISOString(),
      userId: body?.userId,
      username: body?.username,
      componentStack: body?.componentStack,
      type: body?.type,
      critical: body?.critical,
      appState: body?.appState,
      recentActions: body?.recentActions,
    };

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

    const messageText = errorLog.message || '';
    const shouldIgnore = typeof messageText === 'string' && ignorePatterns.some(pattern =>
      messageText.includes(pattern)
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
    let telegramError = null;
    try {
      await sendTelegramAlert(errorLog);
      console.log('Telegram alert sent successfully');
    } catch (err) {
      console.error('Failed to send Telegram alert:', err);
      telegramError = err instanceof Error ? err.message : String(err);
    }

    return NextResponse.json({ 
      success: true,
      telegramSent: !telegramError,
      telegramError: telegramError,
      debug: {
        botTokenSet: !!TELEGRAM_BOT_TOKEN,
        chatId: ADMIN_TELEGRAM_ID
      }
    });
  } catch (error) {
    console.error('Error processing error log:', error);
    return NextResponse.json(
      { error: 'Failed to log error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
