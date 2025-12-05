-- Migration: Add message reactions table
-- Date: 2025-12-05
-- Purpose: Create table for storing emoji reactions on messages

CREATE TABLE IF NOT EXISTS message_reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL,
    user_token VARCHAR(255) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Индексы для быстрого поиска
    CONSTRAINT unique_user_reaction UNIQUE (message_id, user_token)
);

-- Индекс для получения реакций по сообщению
CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON message_reactions(message_id);

-- Индекс для получения реакций пользователя
CREATE INDEX IF NOT EXISTS idx_reactions_user_token ON message_reactions(user_token);

-- Комментарии
COMMENT ON TABLE message_reactions IS 'Emoji reactions on messages';
COMMENT ON COLUMN message_reactions.message_id IS 'ID of the message being reacted to';
COMMENT ON COLUMN message_reactions.user_token IS 'Token of the user who added the reaction';
COMMENT ON COLUMN message_reactions.emoji IS 'Emoji character of the reaction';

-- Вывод информации
DO $$
BEGIN
    RAISE NOTICE 'Table message_reactions created successfully';
    RAISE NOTICE 'Indexes created: idx_reactions_message_id, idx_reactions_user_token';
END $$;
