# Migration 022: User Agreements Table

## Проблема
Веб-пользователи (без `tg_id`) не могли сохранить согласие с условиями, так как:
1. Таблица `users` использует `id = tg_id` как PRIMARY KEY
2. Веб-пользователи не имеют `tg_id`, только `user_token`
3. Таблица `ads` удаляется через 7 дней, не подходит для постоянного хранения
4. Согласие сохранялось только в `localStorage` и терялось при очистке

## Решение
Создана отдельная таблица `user_agreements` для хранения согласий по `user_token`:
- Работает для **Telegram пользователей** (есть `tg_id` → генерируется детерминированный `user_token`)
- Работает для **веб-пользователей** (нет `tg_id`, но есть/генерируется `user_token`)
- Данные не удаляются (в отличие от `ads`)

## Как выполнить миграцию

### 1. Через Neon Console (Рекомендуется)
1. Откройте https://console.neon.tech
2. Выберите вашу базу данных
3. Перейдите в SQL Editor
4. Скопируйте и выполните содержимое `022_user_agreements_table.sql`

### 2. Через командную строку
```bash
export DATABASE_URL="your_connection_string"
psql $DATABASE_URL < migrations/022_user_agreements_table.sql
```

## Изменения в коде

### Backend: `src/app/api/onboarding/route.ts`
**POST** (сохранение согласия):
- Принимает `userToken` ИЛИ `tgId`
- Если есть только `tgId` - генерирует детерминированный `user_token`
- Сохраняет в `user_agreements` по `user_token`
- Дополнительно синхронизирует в `users` для Telegram пользователей
- Возвращает `userToken` для веб-пользователей

**GET** (проверка согласия):
- Принимает `userToken` ИЛИ `tgId` (query parameters)
- Генерирует `user_token` из `tgId` если нужно
- Проверяет в `user_agreements`

### Frontend: `public/webapp/app.js`
Функция `completeOnboarding()`:
- Отправляет `userToken` И `tgId` (если доступны)
- Сохраняет полученный `userToken` в `localStorage`
- Теперь работает для веб-пользователей без `tg_id`

## Проверка

После выполнения миграции:

```sql
-- Проверка создания таблицы
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_agreements'
ORDER BY ordinal_position;

-- Проверка данных (должны быть перенесены из users)
SELECT COUNT(*) as total, 
       COUNT(CASE WHEN agreed_to_terms = TRUE THEN 1 END) as agreed
FROM user_agreements;
```

## Миграция существующих данных

Скрипт автоматически:
1. Переносит согласия из `users` в `user_agreements`
2. Генерирует `user_token` для каждого пользователя:
   - Берёт из последнего объявления (`ads.user_token`)
   - Или генерирует детерминированно из `tg_id`

## Дополнительно

Для Telegram пользователей данные **дублируются**:
- В `users.agreed_to_terms` (для обратной совместимости)
- В `user_agreements.agreed_to_terms` (основное хранилище)

Для веб-пользователей:
- Только в `user_agreements.agreed_to_terms`

## После деплоя

1. Vercel автоматически развернёт обновлённый код
2. Веб-пользователи смогут сохранять согласие
3. При завершении onboarding получат `user_token`
4. Согласие будет постоянным (не удалится через 7 дней)
