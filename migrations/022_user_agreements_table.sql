-- Migration 022: Create user_agreements table for storing agreement status
-- This table stores terms agreement for both Telegram and web users by user_token

-- Create user_agreements table
CREATE TABLE IF NOT EXISTS user_agreements (
    user_token VARCHAR(64) PRIMARY KEY,
    agreed_to_terms BOOLEAN DEFAULT FALSE,
    agreed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_agreements_agreed ON user_agreements(agreed_to_terms);

-- Add comment
COMMENT ON TABLE user_agreements IS 'Хранит согласия пользователей с условиями использования по user_token';
COMMENT ON COLUMN user_agreements.user_token IS 'Уникальный токен пользователя (для Telegram и веб-пользователей)';
COMMENT ON COLUMN user_agreements.agreed_to_terms IS 'Пользователь согласился с условиями использования';
COMMENT ON COLUMN user_agreements.agreed_at IS 'Дата и время согласия с условиями';

-- Migrate existing data from users table
INSERT INTO user_agreements (user_token, agreed_to_terms, agreed_at, created_at, updated_at)
SELECT 
    COALESCE(
        (SELECT user_token FROM ads WHERE tg_id = users.id ORDER BY created_at DESC LIMIT 1),
        encode(digest(users.id::text || ':v1', 'sha256'), 'hex')
    ) as user_token,
    users.agreed_to_terms,
    users.agreed_at,
    NOW(),
    NOW()
FROM users
WHERE users.agreed_to_terms = TRUE
ON CONFLICT (user_token) DO NOTHING;

-- Verification query
SELECT 
    COUNT(*) as total_agreements,
    COUNT(CASE WHEN agreed_to_terms = TRUE THEN 1 END) as agreed_count
FROM user_agreements;
