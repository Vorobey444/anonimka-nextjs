-- Добавление поддержки фотографий в сообщения
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'photo'));

-- Изменяем ограничение: message_text может быть NULL если есть фото
ALTER TABLE messages 
ALTER COLUMN message_text DROP NOT NULL;

-- Добавляем ограничение: должен быть либо текст, либо фото
ALTER TABLE messages 
ADD CONSTRAINT check_message_content 
CHECK (
    (message_text IS NOT NULL AND message_text <> '') 
    OR 
    (photo_url IS NOT NULL AND photo_url <> '')
);

-- Индекс для фильтрации по типу сообщений
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);

-- Комментарии
COMMENT ON COLUMN messages.photo_url IS 'URL фотографии (если сообщение содержит фото)';
COMMENT ON COLUMN messages.message_type IS 'Тип сообщения: text или photo';
