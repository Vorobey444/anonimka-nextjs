# 🔧 Применение миграции для админ-панели

## Проблема
```
NeonDbError: column "banned_until" does not exist
```

База данных не содержит колонки для системы модерации (баны пользователей, блокировка объявлений).

## Решение

### 1. Подключитесь к базе данных Neon

Откройте Neon Console: https://console.neon.tech/

Или используйте psql:
```bash
psql "postgresql://username:password@host/database?sslmode=require"
```

### 2. Выполните миграцию

Скопируйте содержимое файла `migrations/add_admin_panel_controls.sql` и выполните в SQL редакторе Neon.

Или через psql:
```bash
psql "your-connection-string" < migrations/add_admin_panel_controls.sql
```

### 3. Проверьте результат

После выполнения миграции вы должны увидеть:
```
NOTICE:  Migration completed!
NOTICE:  users.banned_until exists: t
NOTICE:  ads.is_blocked exists: t
```

### 4. Проверьте колонки вручную

```sql
-- Проверить колонки users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('banned_until', 'banned_by', 'banned_by_token');

-- Проверить колонки ads
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ads' 
  AND column_name IN ('is_blocked', 'blocked_reason', 'blocked_until', 'blocked_by_admin', 'blocked_at');
```

### Что добавляет миграция

#### Таблица `users`:
- `banned_until` - дата окончания бана (NULL = перманентный)
- `banned_by` - ID администратора, который забанил
- `banned_by_token` - токен администратора

#### Таблица `ads`:
- `is_blocked` - флаг блокировки объявления
- `blocked_reason` - причина блокировки
- `blocked_until` - дата окончания блокировки (NULL = перманентная)
- `blocked_by_admin` - токен администратора
- `blocked_at` - время блокировки

#### Индексы для производительности:
- `idx_users_banned_until` - поиск забаненных пользователей
- `idx_users_banned_by` - поиск по администратору
- `idx_ads_is_blocked` - фильтрация заблокированных объявлений
- `idx_ads_blocked_until` - поиск по времени блокировки

## После применения

1. Перезапустите приложение (Vercel перезапустится автоматически)
2. Проверьте админ-панель: `https://anonimka.online/webapp/?admin=true`
3. Все API должны работать без ошибок

## Откат (если нужно)

```sql
-- Откат миграции (осторожно, удалит данные!)
ALTER TABLE users 
  DROP COLUMN IF EXISTS banned_until,
  DROP COLUMN IF EXISTS banned_by,
  DROP COLUMN IF EXISTS banned_by_token;

ALTER TABLE ads
  DROP COLUMN IF EXISTS is_blocked,
  DROP COLUMN IF EXISTS blocked_reason,
  DROP COLUMN IF EXISTS blocked_until,
  DROP COLUMN IF EXISTS blocked_by_admin,
  DROP COLUMN IF EXISTS blocked_at;
```
