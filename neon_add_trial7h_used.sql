-- Добавляем колонку trial7h_used в таблицу users
-- Эта колонка отслеживает, использовал ли пользователь 7-часовой триал PRO

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trial7h_used BOOLEAN DEFAULT FALSE;

-- Комментарий для документации
COMMENT ON COLUMN users.trial7h_used IS 'Флаг: использовал ли пользователь 7-часовой триал PRO (одноразовая акция)';
