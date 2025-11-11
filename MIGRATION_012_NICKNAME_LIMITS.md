# Migration 012: Nickname Change Tracking

## Дата: 2025-11-11

## Цель
Добавление отслеживания времени последней смены никнейма для реализации ограничений:
- **FREE пользователи**: никнейм устанавливается ОДИН РАЗ при регистрации и больше не может быть изменен
- **PRO пользователи**: никнейм можно менять раз в 24 часа

## Как применить

### 1. Откройте Neon Database Console
https://console.neon.tech

### 2. Выберите ваш проект и базу данных

### 3. Откройте SQL Editor

### 4. Скопируйте и выполните SQL из файла `migrations/012_add_nickname_change_tracking.sql`:

```sql
-- Migration 012: Add nickname change tracking for PRO users
-- Date: 2025-11-11
-- Purpose: Track last nickname change time to enforce limits (FREE: never, PRO: once per 24h)

BEGIN;

-- Add column to track when nickname was last changed
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nickname_changed_at TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN users.nickname_changed_at IS 'Timestamp of last nickname change (для PRO: ограничение раз в 24 часа)';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_nickname_changed_at ON users(nickname_changed_at);

COMMIT;
```

### 5. Нажмите "Run" для выполнения

## Проверка

После применения проверьте, что колонка создана:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'nickname_changed_at';
```

Должно вернуть:
- `column_name`: nickname_changed_at
- `data_type`: timestamp with time zone
- `is_nullable`: YES

Проверьте индекс:

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users' AND indexname = 'idx_users_nickname_changed_at';
```

## Изменения в коде

### API `/api/nickname` (POST)
Теперь проверяет:
1. Если пользователь устанавливает никнейм впервые - разрешено
2. Если FREE пользователь пытается изменить никнейм - запрещено (403)
3. Если PRO пользователь пытается изменить раньше чем через 24 часа - запрещено (429)
4. Если PRO пользователь меняет после 24 часов - разрешено и обновляется `nickname_changed_at`

### Коды ошибок
- `NICKNAME_LOCKED_FREE` - FREE пользователь не может менять никнейм
- `NICKNAME_COOLDOWN` - PRO должен подождать 24 часа
- `NICKNAME_TAKEN` - никнейм уже занят

### Фронтенд
`public/webapp/app.js` - функция `saveNicknamePage()` теперь показывает:
- 🔒 Для FREE: "FREE пользователи не могут менять никнейм. Обновитесь до PRO!"
- ⏳ Для PRO: "PRO пользователи могут менять никнейм раз в 24 часа. Попробуйте через X ч."
- ❌ "Этот никнейм уже занят. Выберите другой."

## Откат (если нужно)

Если что-то пошло не так:

```sql
BEGIN;

DROP INDEX IF EXISTS idx_users_nickname_changed_at;
ALTER TABLE users DROP COLUMN IF EXISTS nickname_changed_at;

COMMIT;
```

## Примечания

- Колонка `nickname_changed_at` обновляется только при смене никнейма (не при первичной установке)
- При первичной установке никнейма колонка остается NULL
- PRO статус проверяется автоматически (включая проверку истечения срока `premium_until`)
- Индекс `idx_users_nickname_changed_at` ускоряет проверку времени последней смены
