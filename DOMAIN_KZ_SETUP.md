# Настройка домена anonimka.kz

## 1. DNS настройки в ps.kz

Войдите в панель управления ps.kz и добавьте следующие DNS записи:

### Вариант 1: CNAME (рекомендуется)
```
Тип    Имя    Значение
CNAME  @      cname.vercel-dns.com
CNAME  www    cname.vercel-dns.com
```

### Вариант 2: A-записи
```
Тип  Имя  Значение
A    @    76.76.21.21
A    www  76.76.21.21
```

**Примечание:** IP адрес Vercel может измениться, поэтому CNAME предпочтительнее.

## 2. Добавление домена в Vercel

1. Откройте проект в Vercel: https://vercel.com/vorobey444s-projects/anonimka-nextjs
2. Перейдите в **Settings** → **Domains**
3. Добавьте домены:
   - `anonimka.kz` (основной)
   - `www.anonimka.kz`
4. Vercel автоматически настроит SSL сертификаты

## 3. Настройка редиректов

Редиректы из anonimka.online → anonimka.kz уже настроены в `vercel.json`:

```json
"redirects": [
  {
    "source": "/:path*",
    "has": [{"type": "host", "value": "anonimka.online"}],
    "destination": "https://anonimka.kz/:path*",
    "permanent": true
  }
]
```

## 4. Обновление конфигурации бота

Бот уже обновлен для использования anonimka.kz:
- `API_BASE_URL = "https://anonimka.kz"`
- Приветственное сообщение указывает на новый домен

## 5. Проверка

После настройки DNS (может занять до 48 часов):

1. Проверьте доступность: https://anonimka.kz
2. Проверьте редирект: https://anonimka.online → https://anonimka.kz
3. Проверьте SSL сертификат (должен быть автоматически от Vercel)
4. Проверьте WebApp в боте

## 6. Telegram Bot настройки

После того как домен заработает:

1. Обновите BotFather (если нужно):
   ```
   /mybots → @anon_board_bot → Edit Bot → Edit Description
   ```
   Укажите новый домен: anonimka.kz

2. Перезапустите бота для применения изменений:
   ```powershell
   Stop-Process -Name python -Force
   cd "e:\my project\app chat\anon-board-bot"
   python bot.py
   ```

## Готово! 🎉

После выполнения всех шагов:
- ✅ Основной домен: anonimka.kz
- ✅ Редирект с anonimka.online
- ✅ SSL сертификат
- ✅ Бот использует новый домен
