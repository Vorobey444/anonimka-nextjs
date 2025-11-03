-- Миграция для Neon PostgreSQL
-- Добавление поля delivered в таблицу messages

-- Добавляем поле delivered (доставлено)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS delivered BOOLEAN DEFAULT FALSE;

-- Обновляем существующие сообщения - считаем их доставленными
UPDATE messages 
SET delivered = TRUE 
WHERE delivered IS NULL;

-- Создаём индекс для быстрого поиска недоставленных сообщений
CREATE INDEX IF NOT EXISTS idx_messages_delivered ON messages(delivered) WHERE delivered = false;

-- Комментарий к полю
COMMENT ON COLUMN messages.delivered IS 'Сообщение доставлено получателю (открыл приложение)';

-- Итоговая структура статусов:
-- 1. Отправлено: сообщение создано (created_at)
-- 2. Доставлено: delivered = TRUE (получатель открыл приложение)
-- 3. Прочитано: read = TRUE (получатель открыл чат и увидел сообщение)
