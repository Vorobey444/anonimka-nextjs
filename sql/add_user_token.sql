-- Если есть таблица payments, добавить user_token
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
		ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_token VARCHAR(64);
		UPDATE payments SET user_token = encode(gen_random_bytes(24), 'hex') WHERE user_token IS NULL;
		CREATE INDEX IF NOT EXISTS idx_payments_user_token ON payments(user_token);
	END IF;
END $$;
-- Если есть таблица notifications, добавить user_token
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
		ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_token VARCHAR(64);
		UPDATE notifications SET user_token = encode(gen_random_bytes(24), 'hex') WHERE user_token IS NULL;
		CREATE INDEX IF NOT EXISTS idx_notifications_user_token ON notifications(user_token);
	END IF;
END $$;
-- Если есть таблица logs, добавить user_token
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'logs') THEN
		ALTER TABLE logs ADD COLUMN IF NOT EXISTS user_token VARCHAR(64);
		UPDATE logs SET user_token = encode(gen_random_bytes(24), 'hex') WHERE user_token IS NULL;
		CREATE INDEX IF NOT EXISTS idx_logs_user_token ON logs(user_token);
	END IF;
END $$;
-- Если есть таблица messages, добавить user_token
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
		ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_token VARCHAR(64);
		UPDATE messages SET user_token = encode(gen_random_bytes(24), 'hex') WHERE user_token IS NULL;
		CREATE INDEX IF NOT EXISTS idx_messages_user_token ON messages(user_token);
	END IF;
END $$;
-- Аналогично для приватных чатов
ALTER TABLE private_chats ADD COLUMN IF NOT EXISTS user_token VARCHAR(64);
UPDATE private_chats SET user_token = encode(gen_random_bytes(24), 'hex') WHERE user_token IS NULL;
CREATE INDEX IF NOT EXISTS idx_private_chats_user_token ON private_chats(user_token);
-- Добавить поле user_token в таблицу анкет
ALTER TABLE ads ADD COLUMN IF NOT EXISTS user_token VARCHAR(64) UNIQUE;

-- Заполнить user_token для существующих пользователей
UPDATE ads SET user_token = encode(gen_random_bytes(24), 'hex') WHERE user_token IS NULL;

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_ads_user_token ON ads(user_token);

-- Аналогично для других таблиц, где используется tg_id
-- Добавить поле user_token в user_blocks и referrals
ALTER TABLE user_blocks ADD COLUMN IF NOT EXISTS user_token VARCHAR(64);
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS user_token VARCHAR(64);

-- Заполнить user_token для существующих записей
UPDATE user_blocks SET user_token = encode(gen_random_bytes(24), 'hex') WHERE user_token IS NULL;
UPDATE referrals SET user_token = encode(gen_random_bytes(24), 'hex') WHERE user_token IS NULL;

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_blocks_user_token ON user_blocks(user_token);
CREATE INDEX IF NOT EXISTS idx_referrals_user_token ON referrals(user_token);
