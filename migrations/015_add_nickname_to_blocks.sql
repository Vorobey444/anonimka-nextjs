-- Migration 015: Добавление никнейма в блокировки
-- Добавляем поле для хранения никнейма заблокированного пользователя

ALTER TABLE user_blocks 
ADD COLUMN IF NOT EXISTS blocked_nickname VARCHAR(100);

-- Обновляем существующие записи, получая никнейм из ads
UPDATE user_blocks ub
SET blocked_nickname = (
    SELECT nickname 
    FROM ads 
    WHERE user_token = ub.blocked_token 
    ORDER BY created_at DESC 
    LIMIT 1
)
WHERE blocked_nickname IS NULL;
