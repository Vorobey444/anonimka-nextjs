# Исправление синхронизации Premium между Telegram и Web версиями

## Проблема
Premium показывал разные данные:
- **Telegram**: до 12.12.2025 ✅ (правильно в `users`)
- **Web**: 7-час триал ❌ (старые данные в `premium_tokens`)

## Причина
Поле `users.user_token` было NULL → синхронизация не работала → Web читал старые данные из `premium_tokens`

## Решение

### 1. Выполните миграцию 024 в Neon Console

```sql
-- Migration 024: Синхронизация user_token между ads и users
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

-- Индекс для ускорения синхронизации
CREATE INDEX IF NOT EXISTS idx_users_user_token ON users(user_token) WHERE user_token IS NOT NULL;
```

### 2. Проверьте результат

```sql
-- Проверка вашего аккаунта
SELECT id, user_token, is_premium, premium_until 
FROM users 
WHERE id = 884253640;

-- Должно показать:
-- id: 884253640
-- user_token: 8e1e59ba9cddb0bddc73e422616896cf766eb6033f155c43d63ede2e8fa36dbe
-- is_premium: true
-- premium_until: 2025-12-11 23:59:59
```

### 3. Очистите кеш браузера

В консоли браузера (F12):
```javascript
// Очистите весь localStorage
localStorage.clear();

// Перезагрузите страницу
location.reload();
```

### 4. Проверьте синхронизацию

После входа на сайт проверьте в консоли:
```javascript
console.log('User token:', localStorage.getItem('user_token'));
```

Должно быть: `8e1e59ba9cddb0bddc73e422616896cf766eb6033f155c43d63ede2e8fa36dbe`

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
