# Применение миграции: Добавление полей локации

## Проблема
API `/api/users/location` пытается сохранить `region`, но эта колонка не существует в таблице `users`.

Ошибка:
```
NeonDbError: column "region" of relation "users" does not exist
```

## Решение

Добавить колонки `country`, `region` и `city` в таблицу `users`.

## Применение миграции

### 1. Подключиться к Neon Database

Перейти на https://console.neon.tech и выбрать проект `anonimka`.

### 2. Открыть SQL Editor

В левом меню выбрать **SQL Editor**.

### 3. Выполнить миграцию

Скопировать содержимое файла `neon_add_location_fields.sql` и выполнить:

```sql
-- Добавляем колонки country, region, city если их нет
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS country VARCHAR(2),
ADD COLUMN IF NOT EXISTS region VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(255);

-- Создаем индекс для быстрого поиска по стране/городу
CREATE INDEX IF NOT EXISTS idx_users_location ON users(country, city);

-- Комментарии для понимания назначения колонок
COMMENT ON COLUMN users.country IS 'ISO код страны (например, KZ, RU, US)';
COMMENT ON COLUMN users.region IS 'Область/регион пользователя';
COMMENT ON COLUMN users.city IS 'Город пользователя';
```

### 4. Проверить результат

```sql
-- Проверяем, что колонки добавлены
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('country', 'region', 'city')
ORDER BY column_name;
```

Ожидаемый результат:
```
column_name | data_type        | character_maximum_length
------------|------------------|------------------------
city        | character varying| 255
country     | character varying| 2
region      | character varying| 255
```

### 5. Проверить индексы

```sql
-- Проверяем созданные индексы
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users' AND indexname = 'idx_users_location';
```

## После применения

1. API `/api/users/location` сможет сохранять локацию пользователя
2. Telegram WebApp будет автоматически сохранять локацию при первом входе
3. Android приложение будет сохранять локацию после Google Sign-In

## Проверка работы

После применения миграции протестировать:

1. Войти в WebApp
2. Проверить консоль браузера - должно быть:
   ```
   [Location] ✅ Локация сохранена
   ```
3. В Neon SQL Editor проверить данные:
   ```sql
   SELECT user_token, country, region, city 
   FROM users 
   WHERE country IS NOT NULL 
   LIMIT 10;
   ```

## Статус

- [ ] Миграция применена в Neon
- [ ] Проверена работа API
- [ ] Проверено сохранение локации в WebApp
- [ ] Проверено сохранение локации в Android
