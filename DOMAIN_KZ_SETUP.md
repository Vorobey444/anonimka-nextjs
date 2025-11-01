# Настройка домена anonimka.kz

## 1. DNS настройки в ps.kz

### Шаг 1: Создание DNS зоны

1. Войдите в панель управления ps.kz
2. Перейдите в раздел **"Домены"** → **"Мои домены"**
3. Выберите домен **anonimka.kz**
4. Найдите раздел **"DNS"** или **"DNS зона"**
5. Нажмите **"Создать DNS зону"** или **"Использовать DNS ps.kz"**
6. Подтвердите создание зоны

### Шаг 2: Проверка Name Servers

Убедитесь, что у домена установлены NS-серверы ps.kz:
```
ns1.ps.kz
ns2.ps.kz
```
(Обычно устанавливаются автоматически при создании зоны)

### Шаг 3: Добавление DNS записей

### Вариант 1: CNAME (рекомендуется)
```
Тип    Имя (Host)    Значение (Value)           TTL
CNAME  @             cname.vercel-dns.com       3600
CNAME  www           cname.vercel-dns.com       3600
```

**Примечание:** Если ps.kz не разрешает CNAME для корневого домена (@), используйте Вариант 2.

### Вариант 2: A-записи (если CNAME не работает для @)
```
Тип  Имя (Host)  Значение (Value)  TTL
A    @           76.76.21.21       3600
A    www         76.76.21.21       3600
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
