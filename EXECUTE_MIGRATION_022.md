# ⚠️ ВАЖНО: Выполните эту миграцию СРАЗУ

## Проблема
Веб-пользователи (без Telegram) не могут сохранить согласие с условиями.
Их согласие теряется при очистке браузера.

## Решение
Создать таблицу `user_agreements` для хранения согласий по `user_token`.

## Как выполнить (2 минуты)

### 1. Откройте Neon Console
https://console.neon.tech

### 2. Перейдите в SQL Editor
Выберите свою базу данных → SQL Editor

### 3. Скопируйте и выполните этот SQL:

```sql
-- Создание таблицы user_agreements
CREATE TABLE IF NOT EXISTS user_agreements (
    user_token VARCHAR(64) PRIMARY KEY,
    agreed_to_terms BOOLEAN DEFAULT FALSE,
    agreed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_agreements_agreed ON user_agreements(agreed_to_terms);

-- Миграция данных из users
INSERT INTO user_agreements (user_token, agreed_to_terms, agreed_at, created_at, updated_at)
SELECT 
    COALESCE(
        (SELECT user_token FROM ads WHERE tg_id = users.id ORDER BY created_at DESC LIMIT 1),
        encode(digest(users.id::text || ':v1', 'sha256'), 'hex')
    ) as user_token,
    users.agreed_to_terms,
    users.agreed_at,
    NOW(),
    NOW()
FROM users
WHERE users.agreed_to_terms = TRUE
ON CONFLICT (user_token) DO NOTHING;

-- Проверка
SELECT COUNT(*) as total_agreements FROM user_agreements;
```

### 4. Проверьте результат
Должно появиться сообщение: `Constraint removed successfully` или подобное.
Количество записей в `user_agreements` должно совпадать с количеством согласий в `users`.

## После миграции
- Vercel автоматически развернёт код (1-2 минуты)
- Веб-пользователи смогут сохранять согласие
- Согласие станет постоянным (не удалится)

## Полная документация
См. `migrations/README_MIGRATION_022.md`
