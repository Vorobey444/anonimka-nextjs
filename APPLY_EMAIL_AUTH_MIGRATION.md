# 🔧 Инструкция: Применение миграции для Email авторизации

## Проблема
Email авторизация не работает из-за NOT NULL constraint на колонке `users.id`.

## Решение
Выполнить SQL миграцию в базе данных Neon.

## Шаги

### 1. Открыть Neon Dashboard
1. Перейди на https://console.neon.tech/
2. Войди в аккаунт
3. Выбери проект **anonimka** (или твой основной проект)

### 2. Открыть SQL Editor
1. В левом меню найди **SQL Editor**
2. Или перейди напрямую: https://console.neon.tech/app/projects/[твой-project-id]/branches/[твоя-ветка]/query

### 3. Выполнить миграцию
Скопируй и выполни этот SQL код:

```sql
-- Миграция: Исправление constraints для email авторизации
-- Дата: 2025-11-29

-- 1. Делаем колонку id nullable (для email пользователей у которых нет Telegram ID)
ALTER TABLE users ALTER COLUMN id DROP NOT NULL;

-- 2. Создаём таблицу verification_codes если её нет
CREATE TABLE IF NOT EXISTS verification_codes (
  email VARCHAR(255) PRIMARY KEY,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Создаём индексы для verification_codes
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);

-- 4. Проверка изменений
SELECT 
  'users.id is nullable: ' || is_nullable as status
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';

SELECT 
  'verification_codes exists' as status
FROM information_schema.tables 
WHERE table_name = 'verification_codes';
```

### 4. Проверить результат
После выполнения должно появиться:
```
status
-------------------------
users.id is nullable: YES
verification_codes exists
```

### 5. Готово!
Теперь Email авторизация будет работать:
- ✅ `users.id` может быть NULL для email пользователей
- ✅ Таблица `verification_codes` существует
- ✅ Android app сможет регистрировать пользователей через email

## Альтернатива: Через psql
Если есть доступ к psql:

```bash
# Подключение к Neon
psql "postgresql://[user]:[password]@[endpoint]/[database]"

# Выполнение миграции
\i migrations/fix_email_auth_constraints.sql
```

## Проверка
После миграции проверь в Android app:
1. Введи email → Отправить код
2. Введи код из email → Войти
3. ✅ Должно успешно войти в приложение
