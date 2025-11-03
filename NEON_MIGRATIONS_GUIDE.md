# Инструкция по выполнению миграций в Neon PostgreSQL

## Шаг 1: Открыть Neon Dashboard

1. Перейдите на https://console.neon.tech/
2. Войдите в свой проект
3. Откройте раздел **SQL Editor** в левом меню

## Шаг 2: Выполнить миграции по порядку

### 2.1. Создание таблицы messages

Откройте файл `neon_messages_schema.sql` и скопируйте весь SQL код.
Вставьте в SQL Editor и нажмите **Run**.

Эта миграция создаст таблицу для сообщений с полями:
- `id` - уникальный ID сообщения
- `chat_id` - ID чата (связь с private_chats)
- `sender_id` - Telegram ID отправителя
- `receiver_id` - Telegram ID получателя
- `message` - текст сообщения
- `read` - прочитано ли
- `created_at` - время отправки

### 2.2. Добавление поля last_message_at

Откройте файл `neon_add_last_message.sql` и скопируйте весь SQL код.
Вставьте в SQL Editor и нажмите **Run**.

Эта миграция добавит поле `last_message_at` в таблицу `private_chats` для сортировки чатов по времени последнего сообщения.

## Шаг 3: Проверка выполнения

После выполнения миграций проверьте что таблицы созданы:

```sql
-- Проверка структуры messages
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- Проверка структуры private_chats
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'private_chats' 
ORDER BY ordinal_position;
```

## Шаг 4: Тестирование

После выполнения миграций:

1. Сохраните изменения в Neon
2. Дождитесь деплоя на Vercel (происходит автоматически при push в GitHub)
3. Откройте приложение и попробуйте открыть чат

## Возможные проблемы

### Ошибка: "relation already exists"
Это нормально - таблица уже создана. Можно игнорировать.

### Ошибка: "foreign key constraint"
Убедитесь что таблица `private_chats` существует перед созданием `messages`.

### Ошибка: "permission denied"
Убедитесь что используете основную базу данных проекта, а не read-only replica.

## Проверка после миграции

Выполните тестовый запрос:

```sql
-- Должен вернуть 0 записей (таблица пустая)
SELECT COUNT(*) FROM messages;
```

Если запрос выполнился успешно - миграция прошла успешно! ✅
