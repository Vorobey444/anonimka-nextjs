-- Создание таблицы user_blocks для хранения заблокированных пользователей
-- Каждый пользователь может заблокировать других пользователей, чтобы не получать от них сообщения

CREATE TABLE IF NOT EXISTS user_blocks (
    id SERIAL PRIMARY KEY,
    blocker_token VARCHAR(255) NOT NULL,  -- Токен пользователя, который блокирует
    blocked_token VARCHAR(255) NOT NULL,  -- Токен заблокированного пользователя
    blocked_nickname VARCHAR(255),        -- Никнейм заблокированного (для удобства отображения)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Индексы для быстрого поиска
    CONSTRAINT unique_block UNIQUE (blocker_token, blocked_token)
);

-- Индекс для быстрой проверки блокировок
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_token);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_token);

-- Комментарии для документации
COMMENT ON TABLE user_blocks IS 'Таблица заблокированных пользователей';
COMMENT ON COLUMN user_blocks.blocker_token IS 'Токен пользователя, который заблокировал';
COMMENT ON COLUMN user_blocks.blocked_token IS 'Токен заблокированного пользователя';
COMMENT ON COLUMN user_blocks.blocked_nickname IS 'Никнейм заблокированного для отображения';
