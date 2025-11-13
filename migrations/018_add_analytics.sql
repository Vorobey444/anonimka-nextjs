-- Создание таблицы аналитики посещений
CREATE TABLE IF NOT EXISTS page_visits (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    page VARCHAR(100) NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    country VARCHAR(100),
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_page_visits_user_id ON page_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_page ON page_visits(page);
CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON page_visits(created_at);

-- Таблица для хранения общей статистики (кэш)
CREATE TABLE IF NOT EXISTS site_stats (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(50) UNIQUE NOT NULL,
    metric_value INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Инициализируем основные метрики
INSERT INTO site_stats (metric_name, metric_value) VALUES 
    ('total_visits', 0),
    ('unique_users', 0),
    ('online_now', 0)
ON CONFLICT (metric_name) DO NOTHING;

-- Функция для обновления счетчика посещений
CREATE OR REPLACE FUNCTION increment_visit_counter()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE site_stats 
    SET metric_value = metric_value + 1,
        updated_at = NOW()
    WHERE metric_name = 'total_visits';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического инкремента
DROP TRIGGER IF EXISTS trigger_increment_visits ON page_visits;
CREATE TRIGGER trigger_increment_visits
AFTER INSERT ON page_visits
FOR EACH ROW
EXECUTE FUNCTION increment_visit_counter();
