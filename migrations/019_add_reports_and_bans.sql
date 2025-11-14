-- Таблица жалоб/репортов
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- 'profile', 'message', 'ad'
    reason VARCHAR(100) NOT NULL, -- 'spam', 'porn', 'harassment', 'fake', 'underage', 'other'
    description TEXT,
    evidence_url TEXT, -- URL фото/скриншота если есть
    related_ad_id INTEGER REFERENCES ads(id) ON DELETE SET NULL,
    related_message_id INTEGER, -- ID сообщения если жалоба на чат
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'resolved'
    admin_notes TEXT,
    resolved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Таблица банов
CREATE TABLE IF NOT EXISTS banned_users (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    banned_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(200) NOT NULL,
    ban_type VARCHAR(20) DEFAULT 'permanent', -- 'permanent', 'temporary'
    ban_until TIMESTAMP, -- NULL для постоянного бана
    related_report_id INTEGER REFERENCES reports(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON banned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_ban_until ON banned_users(ban_until);

-- Добавляем поле is_banned в таблицу users для быстрой проверки
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason VARCHAR(200);

-- Триггер для автоматической установки is_banned при добавлении в banned_users
CREATE OR REPLACE FUNCTION update_user_ban_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET is_banned = TRUE, ban_reason = NEW.reason WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET is_banned = FALSE, ban_reason = NULL WHERE id = OLD.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ban_status ON banned_users;
CREATE TRIGGER trigger_update_ban_status
AFTER INSERT OR DELETE ON banned_users
FOR EACH ROW
EXECUTE FUNCTION update_user_ban_status();

-- Добавляем поле is_admin в users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Устанавливаем админа (твой ID)
UPDATE users SET is_admin = TRUE WHERE id = 884253640;
