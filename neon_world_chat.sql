-- Создание таблицы для мир-чата (общий чат)
-- Выполните этот SQL в Neon Dashboard

CREATE TABLE IF NOT EXISTS world_chat_messages (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,  -- ID пользователя или бота
    message TEXT NOT NULL,
    is_bot BOOLEAN DEFAULT FALSE,   -- Является ли сообщение от бота
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрой выборки
CREATE INDEX idx_world_chat_created_at ON world_chat_messages(created_at DESC);
CREATE INDEX idx_world_chat_user_id ON world_chat_messages(user_id);

-- Автоматическое удаление старых сообщений (старше 7 дней)
-- Можно настроить через cron job или функцию
CREATE OR REPLACE FUNCTION cleanup_old_world_chat_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM world_chat_messages
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Комментарии
COMMENT ON TABLE world_chat_messages IS 'Общий чат для всех пользователей';
COMMENT ON COLUMN world_chat_messages.is_bot IS 'TRUE если сообщение от бота активности';
