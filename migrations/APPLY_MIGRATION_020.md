# Применение миграции 020

## Что делает миграция
Делает поле `reporter_id` в таблице `reports` опциональным (NULL), чтобы поддерживать анонимные жалобы от пользователей без авторизации.

## Как применить

### Через Neon Console (рекомендуется)
1. Открой https://console.neon.tech/
2. Выбери свой проект `anonimka`
3. Перейди в SQL Editor
4. Скопируй и выполни содержимое файла `020_make_reporter_id_nullable.sql`

### Через командную строку
```bash
psql "postgresql://neondb_owner:password@host/neondb?sslmode=require" -f migrations/020_make_reporter_id_nullable.sql
```

## Проверка
После применения выполни:
```sql
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'reporter_id';
```

Должно вернуть: `is_nullable = YES`

## Откат (если нужно вернуть назад)
```sql
-- Удалить все анонимные жалобы
DELETE FROM reports WHERE reporter_id IS NULL;

-- Вернуть NOT NULL constraint
ALTER TABLE reports 
DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;

ALTER TABLE reports 
ALTER COLUMN reporter_id SET NOT NULL;

ALTER TABLE reports
ADD CONSTRAINT reports_reporter_id_fkey 
FOREIGN KEY (reporter_id) 
REFERENCES users(id) 
ON DELETE CASCADE;
```
