# Исправление синхронизации Premium между Telegram и Web версиями

## Проблемы
1. Premium показывал разные данные:
   - **Telegram**: до 12.12.2025 ✅ (правильно в `users`)
   - **Web**: 7-час триал ❌ (старые данные в `premium_tokens`)

2. Аналитика не работала:
   - Ошибка: `column "user_token" of relation "page_visits" does not exist`

## Причины
- Поле `users.user_token` было NULL → синхронизация не работала
- Миграция 023 (user_token в page_visits) не была выполнена в БД

## Решение

### 1. ⚡ Выполните СРОЧНУЮ миграцию в Neon Console

**Файл:** `migrations/EXECUTE_NOW_analytics_and_users.sql`

Эта миграция исправляет ОБЕ проблемы:
- Добавляет `user_token` в `page_visits` (миграция 023)
- Заполняет `users.user_token` из `ads` (миграция 024)

```sql
BEGIN;

-- 1️⃣ Добавление user_token в page_visits
ALTER TABLE page_visits
ADD COLUMN IF NOT EXISTS user_token VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_page_visits_user_token ON page_visits(user_token);

-- 2️⃣ Синхронизация user_token в users
UPDATE users u
SET user_token = (
    SELECT a.user_token 
    FROM ads a 
    WHERE a.tg_id = u.id 
    ORDER BY a.created_at DESC 
    LIMIT 1
)
WHERE u.user_token IS NULL
  AND EXISTS (SELECT 1 FROM ads WHERE ads.tg_id = u.id);

CREATE INDEX IF NOT EXISTS idx_users_user_token ON users(user_token) WHERE user_token IS NOT NULL;

COMMIT;
```

### 2. Проверьте результат (автоматически выполнится в конце миграции)

```sql
-- Проверка 1: user_token добавлен в page_visits
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'page_visits' AND column_name = 'user_token';

-- Проверка 2: Статистика заполнения user_token в users
SELECT 
    COUNT(*) FILTER (WHERE user_token IS NOT NULL) as filled,
    COUNT(*) FILTER (WHERE user_token IS NULL) as empty,
    COUNT(*) as total
FROM users;

-- Проверка 3: Ваш аккаунт (должен быть user_token)
SELECT id, user_token, is_premium, premium_until 
FROM users 
WHERE id = 884253640;
```

### 3. Очистите кеш браузера

В консоли браузера (F12):
```javascript
// Очистите весь localStorage
localStorage.clear();

// Перезагрузите страницу
location.reload();
```

### 4. Проверьте работу системы

**Premium:**
- Telegram и Web версии должны показывать одинаковый срок (12.12.2025)

**Аналитика:**
- В консоли браузера не должно быть ошибок `column "user_token" does not exist`
- В Vercel Logs должны появиться логи синхронизации Premium

**User token:**
```javascript
console.log('User token:', localStorage.getItem('user_token'));
// Должен вернуть хеш (64 символа)
```

## Что исправлено в коде

### ✅ `/api/users` (route.ts)
Теперь **автоматически** заполняет `users.user_token` при каждом входе:
```typescript
INSERT INTO users (id, display_nickname, country, user_token, ...)
ON CONFLICT (id) DO UPDATE SET user_token = ${userToken}, ...
```

### ✅ `/api/premium` (route.ts)
Синхронизация работает:
1. Проверяет `premium_tokens` (для Web-пользователей)
2. Ищет пользователя в `users` по `user_token`
3. **Автоматически синхронизирует** Premium из `users` → `premium_tokens`

## Структура данных

### Таблица `users` (источник истины для Telegram пользователей)
- `id` - Telegram ID
- `user_token` - связь с Web-версией
- `is_premium` - статус Premium
- `premium_until` - срок действия

### Таблица `premium_tokens` (для Web-пользователей без Telegram)
- `user_token` - PRIMARY KEY
- `is_premium` - автосинхронизируется из `users`
- `premium_until` - автосинхронизируется из `users`

## Удаляемые колонки (TODO в будущем)

Эти колонки дублируются и не используются:
- `users.agreed_to_terms` → используется `user_agreements.agreed_to_terms`
- `users.agreed_at` → используется `user_agreements.agreed_at`

Миграция для очистки (выполнить позже):
```sql
ALTER TABLE users 
DROP COLUMN IF EXISTS agreed_to_terms,
DROP COLUMN IF EXISTS agreed_at;
```

## Проверка работы

1. **В Telegram**: должен показывать PRO до 12.12.2025
2. **В браузере**: после очистки кеша должен показывать то же самое
3. **Консоль браузера**: не должно быть ошибок синхронизации
4. **БД**: `premium_tokens` должен обновиться автоматически

## Лог успешной синхронизации

В Vercel Logs должно быть:
```
[PREMIUM API] Найден пользователь в users по user_token, проверяем синхронизацию: 884253640
[PREMIUM API] Premium в users: { is_premium: true, premium_until: '2025-12-11T23:59:59.000Z', expired: false }
[PREMIUM API] Синхронизируем premium_tokens с users
[PREMIUM API] ✅ PRO найден и синхронизирован
```
