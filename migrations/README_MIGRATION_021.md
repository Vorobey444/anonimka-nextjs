# Инструкция по выполнению миграции в Neon

## Проблема
API `/api/onboarding` пытался обращаться к таблице `users` с колонкой `tg_id`, которой не существует.

## Решение
1. Изменён API для использования `user_token` вместо `tg_id`
2. API теперь работает с таблицей `ads` (основная таблица пользователей)
3. Добавлены колонки `agreed_to_terms` и `agreed_at` в таблицу `ads`

## Как выполнить миграцию

### Вариант 1: Через Neon Console (Рекомендуется)
1. Откройте https://console.neon.tech
2. Выберите вашу базу данных
3. Перейдите в SQL Editor
4. Скопируйте содержимое файла `EXECUTE_IN_NEON.sql`
5. Вставьте и выполните SQL

### Вариант 2: Через командную строку
```bash
# Установите переменную окружения с connection string
export DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# Выполните миграцию
psql $DATABASE_URL < migrations/021_add_terms_agreement.sql
```

## Проверка
После выполнения миграции проверьте, что колонки добавлены:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ads' AND column_name IN ('agreed_to_terms', 'agreed_at');
```

## Что изменилось в коде

### Backend (TypeScript)
- `src/app/api/onboarding/route.ts`: изменён с `tg_id` на `user_token`, с `users` на `ads`

### Frontend (JavaScript)
- `public/webapp/app.js`: функция `completeOnboarding()` теперь отправляет `userToken` вместо `tgId`

## После миграции
После выполнения миграции Vercel автоматически развернёт обновлённый код и API заработает корректно.
