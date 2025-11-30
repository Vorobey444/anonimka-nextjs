-- Добавляем поддержку trial7h для email-пользователей
-- Эта миграция добавляет поле trial7h_used в web_user_limits

ALTER TABLE web_user_limits 
ADD COLUMN IF NOT EXISTS trial7h_used BOOLEAN DEFAULT FALSE;

-- Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_web_user_limits_trial7h 
ON web_user_limits(trial7h_used);

-- Проверка
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'web_user_limits' 
AND column_name = 'trial7h_used';
