import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const ADMIN_TELEGRAM_ID = process.env.ADMIN_CHAT_ID || '884253640';

  console.log('=== Telegram Test ===');
  console.log('Bot Token:', TELEGRAM_BOT_TOKEN ? `SET (${TELEGRAM_BOT_TOKEN.substring(0, 10)}...)` : 'NOT SET');
  console.log('Chat ID:', ADMIN_TELEGRAM_ID);

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({
      success: false,
      error: 'TELEGRAM_BOT_TOKEN не настроен в Environment Variables',
      debug: {
        botToken: 'NOT SET',
        chatId: ADMIN_TELEGRAM_ID,
      }
    }, { status: 500 });
  }

  try {
    const testMessage = `
🧪 <b>Тестовое сообщение</b>

Это тестовое сообщение для проверки работы бота.
Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })}

Если вы видите это сообщение, значит бот работает корректно! ✅
    `.trim();

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_TELEGRAM_ID,
        text: testMessage,
        parse_mode: 'HTML',
      }),
    });

    const responseData = await response.json();
    
    console.log('Telegram response status:', response.status);
    console.log('Telegram response:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Telegram API вернул ошибку',
        telegramResponse: responseData,
        debug: {
          botToken: 'SET',
          chatId: ADMIN_TELEGRAM_ID,
          status: response.status,
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Сообщение успешно отправлено в Telegram!',
      telegramResponse: responseData,
      debug: {
        botToken: 'SET',
        chatId: ADMIN_TELEGRAM_ID,
      }
    });

  } catch (error: any) {
    console.error('Error testing Telegram:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      debug: {
        botToken: 'SET',
        chatId: ADMIN_TELEGRAM_ID,
      }
    }, { status: 500 });
  }
}
