# 🗄️ SQL Миграции для Neon PostgreSQL

## 📋 Что нужно сделать

Откройте **Neon Console**: https://console.neon.tech/

Перейдите в **SQL Editor** → выберите вашу базу данных

---

## 1️⃣ Миграция 1: Таблица messages

Скопируйте и выполните содержимое файла:
**`neon_messages_schema.sql`**

```sql
-- Создаём таблицу messages
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_chat FOREIGN KEY (chat_id) REFERENCES private_chats(id) ON DELETE CASCADE
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read) WHERE read = false;
```

Нажмите **Run** ✅

---

## 2️⃣ Миграция 2: Поле last_message_at

Скопируйте и выполните содержимое файла:
**`neon_add_last_message.sql`**

```sql
-- Добавляем поле last_message_at
ALTER TABLE private_chats 
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Обновляем существующие записи
UPDATE private_chats 
SET last_message_at = created_at 
WHERE last_message_at IS NULL;

-- Индекс
CREATE INDEX IF NOT EXISTS idx_private_chats_last_message ON private_chats(last_message_at DESC);
```

Нажмите **Run** ✅

---

## 3️⃣ Миграция 3: Поле delivered (статусы прочтения)

Скопируйте и выполните содержимое файла:
**`neon_add_delivered.sql`**

```sql
-- Добавляем поле delivered для статусов доставки
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS delivered BOOLEAN DEFAULT FALSE;

-- Обновляем существующие сообщения
UPDATE messages 
SET delivered = TRUE 
WHERE delivered IS NULL;

-- Индекс
CREATE INDEX IF NOT EXISTS idx_messages_delivered ON messages(delivered) WHERE delivered = false;
```

Нажмите **Run** ✅

---

## ✅ Проверка

После выполнения миграций выполните:

```sql
-- Проверка таблицы messages
SELECT COUNT(*) FROM messages;

-- Проверка поля last_message_at
SELECT id, user_id, last_message_at FROM private_chats LIMIT 5;
```

Если ошибок нет - всё готово! 🎉

---

## 🚀 Следующий шаг

После миграций:
1. Откройте бота: https://t.me/anonimka_kz_bot
2. Отправьте `/start`
3. Нажмите кнопку WebApp
4. Создайте чат или отправьте сообщение
5. Проверьте уведомление в боте
6. Команда `/my_chats` покажет активные чаты

Готово! 🎊
