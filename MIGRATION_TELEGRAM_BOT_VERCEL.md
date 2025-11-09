# Telegram Bot on Vercel (Webhook Migration Guide)

Your current Python bots (`bot.py`, `bot_neon.py`) use long polling (`application.run_polling()`), which WILL NOT work on Vercel because Vercel serverless functions are short‑lived and cannot keep an open connection.

## ✅ What Works on Vercel
Use a **webhook**: Telegram sends updates via HTTPS POST to your Vercel API route (`/api/telegram-webhook`). You process each update quickly (< 10s) and return HTTP 200.

## ❌ What Does NOT Work
- `run_polling()` loops
- In‑memory chat state (serverless is stateless)
- Persistent processes / sockets

## 1. Enable the API Route
We added: `src/app/api/telegram-webhook/route.ts`
This handles `/api/telegram-webhook` POST requests.

## 2. Set Environment Variables (Vercel Dashboard → Project → Settings → Environment Variables)
| Key | Value | Notes |
| --- | ----- | ----- |
| TELEGRAM_BOT_TOKEN | Your bot token | Required |
| TELEGRAM_WEBHOOK_SECRET | (optional) random string | If set, you must append `?secret=...` to webhook URL |
| WEBAPP_URL | https://anonimka.kz/webapp | Override if staging |

Redeploy after saving env vars.

## 3. Set the Telegram Webhook
Use PowerShell / terminal (replace <TOKEN> & <DOMAIN>):
```powershell
$token = "<BOT_TOKEN>"
$domain = "https://anonimka.kz"  # or your Vercel domain
$secret = "<OPTIONAL_SECRET>"    # omit if not used

$webhookUrl = "$domain/api/telegram-webhook" + ($secret ? "?secret=$secret" : "")
Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook?url=$webhookUrl" -Method GET
```
Check status:
```powershell
Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getWebhookInfo" -Method GET
```
You should see `url` pointing to your Vercel route and minimal `pending_update_count`.

## 4. Test Locally (Optional)
Local development requires a public URL. Use `vercel dev` + `ngrok`:
```powershell
vercel dev
# In another terminal
ngrok http 3000
# Then set webhook to https://<ngrok-subdomain>.ngrok.io/api/telegram-webhook
```

## 5. Expand Functionality
Current webhook route supports:
- `/start [ref_xxx|auth_xxx]`
- `/help`
- Default reply (nudges user into WebApp)

To migrate advanced features (chat invites, blocking, media):
1. Persist data in database (Neon / Supabase) instead of `context.bot_data`
2. Create additional API endpoints (already have `/api/neon-chats`, `/api/neon-messages`)
3. Have webhook route call those endpoints
4. Replace each Python handler with a TypeScript function in the webhook route or modular sub‑handlers

## 6. Handling Photos / Files
Telegram sends `message.photo`. In webhook:
```ts
const photo = update.message?.photo?.slice(-1)[0];
if (photo) {
  // process file_id, maybe store in DB or forward
}
```
Use `sendPhoto` with `file_id` to relay.

## 7. Stateless Design Pattern
Because serverless = stateless:
- Pass context via DB records (chat_id, user_id, roles)
- Derive active chat from last action or explicit command (/openchat123)
- Avoid assumptions about stored memory per request

## 8. If You NEED Polling / Rich Python Logic
Use a persistent host instead (Railway, Fly.io, Render, EC2, Docker on VPS):
- Keep current `bot.py`
- Set webhook there OR keep polling
- Still serve WebApp from Vercel

## 9. Disable Previous Webhook (when switching)
```powershell
Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/deleteWebhook" -Method GET
```
Then set new one.

## 10. Common Troubleshooting
| Symptom | Cause | Fix |
| ------- | ----- | ---- |
| 200 OK but no responses | Missing `TELEGRAM_BOT_TOKEN` | Set env + redeploy |
| 403 Forbidden | Using secret but not appended | Add `?secret=...` to webhook URL |
| Slow / timeouts | Long DB queries | Return early, queue work (e.g. store update → process later) |
| Duplicate messages | Retries due to non‑200 response | Always return 200 even on handled errors |

## 11. Quick Extension Example
Add simple echo for debugging (inside route.ts, before fallback):
```ts
if (lower.startsWith('/echo ')) {
  await tg('sendMessage', token, { chat_id: chatId, text: text.slice(6) });
  return NextResponse.json({ ok: true });
}
```

## 12. Security Notes
- DO NOT hardcode bot token in repo
- Optional: verify Telegram IP ranges (advanced)
- Use shared secret (`TELEGRAM_WEBHOOK_SECRET`) for basic filtering

## 13. Rollback Plan
If webhook migration fails:
1. Delete webhook (`deleteWebhook`)
2. Relaunch Python polling bot
3. Re‑evaluate DB persistence strategy

---
**Next Step Suggestion:** Gradually port one Python feature (e.g. `/mychats`) into webhook route using existing `/api/neon-chats` endpoint.
