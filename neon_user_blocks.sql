-- Создаем таблицу для блокировки пользователей
-- blocker_id - кто заблокировал
-- blocked_id - кого заблокировали

CREATE TABLE IF NOT EXISTS user_blocks (
    id SERIAL PRIMARY KEY,
    blocker_id BIGINT NOT NULL,
    blocked_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Индексы для быстрого поиска
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
    
    -- Внешние ключи на таблицу users
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Индексы для быстрой проверки блокировки
CREATE INDEX IF NOT EXISTS idx_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked ON user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_block_pair ON user_blocks(blocker_id, blocked_id);

-- Комментарии
COMMENT ON TABLE user_blocks IS 'Черный список пользователей';
COMMENT ON COLUMN user_blocks.blocker_id IS 'ID пользователя, который заблокировал';
COMMENT ON COLUMN user_blocks.blocked_id IS 'ID заблокированного пользователя';
