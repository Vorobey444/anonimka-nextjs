# Инструкция по применению миграций в Neon Database

## Критические миграции (требуют немедленного применения)

### 1. Миграция 011: Исправление user_blocks для токенов
**Файл:** `migrations/011_fix_user_blocks_tokens.sql`  
**Проблема:** Ошибка "invalid input syntax for type bigint" при блокировке  
**Решение:** Добавляет колонки `blocker_token` и `blocked_token` типа TEXT

### 2. Миграция 012: Таблица для лимитов веб-пользователей
**Файл:** `migrations/012_web_user_limits.sql`  
**Проблема:** Веб-пользователи могут отправлять неограниченное количество фото  
**Решение:** Создает таблицу `web_user_limits` для учета по `user_token`

### 3. Миграция 013: Сброс аномальных счетчиков
**Файл:** `migrations/013_reset_photo_counters.sql`  
**Проблема:** В БД есть счетчики > 5 фото из-за бага  
**Решение:** Сбрасывает все счетчики для честного старта

## Как применить миграции

### Способ 1: Через Neon Console (рекомендуется)

1. Откройте [https://console.neon.tech](https://console.neon.tech)
2. Выберите ваш проект и базу данных
3. Перейдите в SQL Editor
4. Скопируйте содержимое каждого файла миграции и выполните по очереди:
   - `migrations/011_fix_user_blocks_tokens.sql`
   - `migrations/012_web_user_limits.sql`
   - `migrations/013_reset_photo_counters.sql`

### Способ 2: Через psql (если установлен PostgreSQL клиент)

```bash
# Установите переменную окружения с подключением
$env:DATABASE_URL = "postgresql://user:password@host/database"

# Примените миграции по очереди
psql $env:DATABASE_URL -f migrations/011_fix_user_blocks_tokens.sql
psql $env:DATABASE_URL -f migrations/012_web_user_limits.sql
psql $env:DATABASE_URL -f migrations/013_reset_photo_counters.sql
```

### Способ 3: Через API route (создать временный эндпоинт)

Можно создать защищенный API route `/api/run-migrations` который выполнит миграции программно.

## Проверка результата

После применения миграций выполните проверочные запросы:

```sql
-- Проверка миграции 011
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_blocks' 
AND column_name IN ('blocker_token', 'blocked_token');
-- Должно вернуть 2 строки

-- Проверка миграции 012
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'web_user_limits';
-- Должно вернуть 1 строку

-- Проверка счетчиков фото
SELECT user_id, photos_sent_today, photos_last_reset 
FROM user_limits 
WHERE photos_sent_today > 0 
ORDER BY photos_sent_today DESC 
LIMIT 10;
```

## Важно!

После применения миграций приложение **автоматически** начнет использовать новые таблицы и колонки, так как код уже обновлен и задеплоен на Vercel.

Если миграции не применить, будут ошибки:
- ❌ Блокировка пользователей не работает
- ❌ Веб-пользователи обходят лимит фото
