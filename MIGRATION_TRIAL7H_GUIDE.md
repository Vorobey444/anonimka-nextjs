# Миграция: Добавление trial7h_used в таблицу users

## Что делает эта миграция
Добавляет колонку `trial7h_used` в таблицу `users` для отслеживания, использовал ли пользователь 7-часовой PRO триал.

## Как применить

1. Откройте Neon Database Console: https://console.neon.tech
2. Выберите ваш проект и базу данных
3. Откройте SQL Editor
4. Скопируйте и выполните SQL из файла `neon_add_trial7h_used.sql`:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trial7h_used BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.trial7h_used IS 'Флаг: использовал ли пользователь 7-часовой триал PRO (одноразовая акция)';
```

5. Нажмите "Run" для выполнения

## Проверка
После применения проверьте:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'trial7h_used';
```

Должно вернуть:
- column_name: trial7h_used
- data_type: boolean
- column_default: false

## Деплой
После применения миграции задеплойте приложение:
```bash
vercel --prod
```

## Откат (если нужно)
Если что-то пошло не так:
```sql
ALTER TABLE users DROP COLUMN IF EXISTS trial7h_used;
```
