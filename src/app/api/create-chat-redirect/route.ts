import { NextRequest, NextResponse } from 'next/server';

/**
 * Промежуточный endpoint для создания чата из Telegram URL button
 * Перенаправляет в WebApp после создания чата
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adId = searchParams.get('ad_id');
    const senderTgId = searchParams.get('sender_tg_id');
    const receiverTgId = searchParams.get('receiver_tg_id');

    if (!adId || !senderTgId || !receiverTgId) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Ошибка</title>
        </head>
        <body>
          <h1>❌ Ошибка</h1>
          <p>Недостаточно параметров для создания чата</p>
          <a href="https://t.me/anonimka_online_bot">Вернуться к боту</a>
        </body>
        </html>
        `,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    }

    // Вызываем API создания чата
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://anonimka.online';
    const createChatResponse = await fetch(`${baseUrl}/api/create-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adId: parseInt(adId),
        senderTgId: parseInt(senderTgId),
        receiverTgId: parseInt(receiverTgId)
      })
    });

    const result = await createChatResponse.json();

    if (result.success) {
      // Успешно создан чат - перенаправляем в WebApp
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="refresh" content="2;url=https://t.me/anonimka_online_bot">
          <title>Чат создан</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 20px;
              backdrop-filter: blur(10px);
            }
            h1 { font-size: 3rem; margin: 0 0 1rem 0; }
            p { font-size: 1.2rem; margin: 0.5rem 0; }
            a {
              color: white;
              text-decoration: none;
              border: 2px solid white;
              padding: 10px 20px;
              border-radius: 10px;
              display: inline-block;
              margin-top: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅</h1>
            <p><strong>Приватный чат создан!</strong></p>
            <p>Возвращаемся в бота...</p>
            <a href="https://t.me/anonimka_online_bot">Вернуться к боту</a>
          </div>
        </body>
        </html>
        `,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    } else {
      // Ошибка создания чата
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Ошибка</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 20px;
              backdrop-filter: blur(10px);
            }
            h1 { font-size: 3rem; margin: 0 0 1rem 0; }
            p { font-size: 1.2rem; margin: 0.5rem 0; }
            a {
              color: white;
              text-decoration: none;
              border: 2px solid white;
              padding: 10px 20px;
              border-radius: 10px;
              display: inline-block;
              margin-top: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌</h1>
            <p><strong>Ошибка создания чата</strong></p>
            <p>${result.error || 'Неизвестная ошибка'}</p>
            <a href="https://t.me/anonimka_online_bot">Вернуться к боту</a>
          </div>
        </body>
        </html>
        `,
        {
          status: 500,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    }

  } catch (error) {
    console.error('Error in create-chat-redirect:', error);
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ошибка сервера</title>
      </head>
      <body>
        <h1>❌ Ошибка сервера</h1>
        <p>${error instanceof Error ? error.message : 'Неизвестная ошибка'}</p>
        <a href="https://t.me/anonimka_online_bot">Вернуться к боту</a>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}
