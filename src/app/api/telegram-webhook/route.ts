import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Small helper to call Telegram Bot API
async function tg(method: string, token: string, payload: any) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    console.error('[TELEGRAM API ERROR]', res.status, data);
  }
  return data;
}

function getText(update: any): string | null {
  return update?.message?.text ?? update?.edited_message?.text ?? null;
}

function getChatId(update: any): number | null {
  return update?.message?.chat?.id ?? update?.edited_message?.chat?.id ?? null;
}

function getUserFirstName(update: any): string | null {
  return update?.message?.from?.first_name ?? update?.edited_message?.from?.first_name ?? null;
}

export async function POST(request: NextRequest) {
  // ⚠️ WEBHOOK ОТКЛЮЧЕН - бот работает в POLLING режиме на VPS
  // Этот endpoint больше не используется, чтобы избежать конфликта с polling
  return NextResponse.json({ 
    ok: false, 
    error: 'Webhook disabled - bot runs in polling mode on VPS' 
  }, { status: 410 }); // 410 Gone

  /* СТАРЫЙ КОД ЗАКОММЕНТИРОВАН
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET; // optional

    if (!token) {
      return NextResponse.json({ error: { message: 'TELEGRAM_BOT_TOKEN not set' } }, { status: 500 });
    }

    // Optional: simple shared-secret check to avoid random posts
    const url = request.nextUrl;
    const secretParam = url.searchParams.get('secret');
    if (webhookSecret && secretParam !== webhookSecret) {
      return NextResponse.json({ error: { message: 'Forbidden' } }, { status: 403 });
    }

    const update = await request.json();

    const text = getText(update) || '';
    const chatId = getChatId(update);
    const firstName = getUserFirstName(update) || 'друг';

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    // Basic command routing
    const lower = text.trim().toLowerCase();

    // WebApp base (your app already deployed on Vercel)
    const WEBAPP_URL = process.env.WEBAPP_URL || 'https://anonimka.kz/webapp';

    if (lower.startsWith('/start')) {
      // support /start ref_xxx or /start auth_xxx
      const parts = text.split(' ');
      const param = parts.length > 1 ? parts[1] : '';

      let welcome = `👋 Привет, ${firstName}!
\n🎯 Anonimka.kz — анонимное общение.
\nОткрывай мини‑приложение ниже:`;

      // If referral param exists, pass it to webapp
      let url = WEBAPP_URL;
      if (param) {
        if (param.startsWith('ref_')) url += `?ref=${encodeURIComponent(param.replace('ref_', ''))}`;
        if (param.startsWith('auth_')) url += `?authorized=true`;
      }

      await tg('sendMessage', token, {
        chat_id: chatId,
        text: welcome,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🚀 Открыть приложение', web_app: { url } },
            ],
          ],
        },
      });

      return NextResponse.json({ ok: true });
    }

    if (lower === '/help') {
      await tg('sendMessage', token, {
        chat_id: chatId,
        text: '📖 Помощь\n\nНажми «Открыть приложение», чтобы создать анкету и начать общение.',
        reply_markup: {
          inline_keyboard: [
            [ { text: '🚀 Открыть приложение', web_app: { url: WEBAPP_URL } } ],
          ],
        },
      });
      return NextResponse.json({ ok: true });
    }

    // Fallback: nudge users to open the WebApp
    await tg('sendMessage', token, {
      chat_id: chatId,
      text: '✍️ Пиши в приложении — так удобнее! Нажми кнопку ниже.',
      reply_markup: {
        inline_keyboard: [
          [ { text: '🚀 Открыть приложение', web_app: { url: WEBAPP_URL } } ],
        ],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[TELEGRAM WEBHOOK ERROR]', error);
    return NextResponse.json({ error: { message: error.message } }, { status: 200 }); // Telegram expects 200
  }
  */
}
