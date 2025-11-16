-- Migration 021: Premium Transactions для покупок через Telegram Stars
-- Date: 2025-01-XX
-- Purpose: Создание таблицы для хранения истории покупок PRO подписки

BEGIN;

-- Удаляем старую таблицу если она существует с неправильной структурой
DROP TABLE IF EXISTS premium_transactions CASCADE;

-- Создаём таблицу транзакций PRO подписки заново
CREATE TABLE premium_transactions (
  id SERIAL PRIMARY KEY,
  
  -- Пользователь
  user_id INTEGER,                -- users.id (numeric tg_id), может быть NULL для новых юзеров
  telegram_id BIGINT NOT NULL,    -- telegram ID покупателя
  
  -- Детали покупки
  months INTEGER NOT NULL,        -- количество месяцев (1, 3, 6, 12)
  amount_stars INTEGER NOT NULL,  -- стоимость в Stars (50, 130, 215, 360)
  transaction_id TEXT,            -- ID транзакции от Telegram
  payment_method TEXT DEFAULT 'stars',  -- метод оплаты (stars, card, etc.)
  
  -- Статус
  status TEXT DEFAULT 'completed',  -- completed, pending, failed, refunded
  
  -- Временные метки
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска (создаём после таблицы)
CREATE INDEX idx_premium_trans_user ON premium_transactions(user_id);
CREATE INDEX idx_premium_trans_telegram_id ON premium_transactions(telegram_id);
CREATE INDEX idx_premium_trans_created ON premium_transactions(created_at DESC);
CREATE INDEX idx_premium_trans_transaction_id ON premium_transactions(transaction_id);
CREATE INDEX idx_premium_trans_status ON premium_transactions(status);

-- Комментарии
COMMENT ON TABLE premium_transactions IS 'История покупок PRO подписки через Telegram Stars';
COMMENT ON COLUMN premium_transactions.user_id IS 'ID пользователя в таблице users (может быть NULL)';
COMMENT ON COLUMN premium_transactions.telegram_id IS 'Telegram ID покупателя (всегда заполнен)';
COMMENT ON COLUMN premium_transactions.months IS 'Количество месяцев подписки: 1, 3, 6, 12';
COMMENT ON COLUMN premium_transactions.amount_stars IS 'Стоимость в Stars: 50, 130, 215, 360';
COMMENT ON COLUMN premium_transactions.transaction_id IS 'ID транзакции от Telegram (для предотвращения дублей)';
COMMENT ON COLUMN premium_transactions.status IS 'Статус: completed, pending, failed, refunded';

COMMIT;

-- Примеры использования:

-- Проверить общую статистику продаж
-- SELECT 
--   COUNT(*) as total_sales,
--   SUM(amount_stars) as total_stars_earned,
--   SUM(months) as total_months_sold
-- FROM premium_transactions
-- WHERE status = 'completed';

-- Топ покупателей
-- SELECT 
--   telegram_id,
--   COUNT(*) as purchases_count,
--   SUM(amount_stars) as total_spent_stars,
--   SUM(months) as total_months_bought
-- FROM premium_transactions
-- WHERE status = 'completed'
-- GROUP BY telegram_id
-- ORDER BY total_spent_stars DESC
-- LIMIT 10;

-- Динамика продаж по дням
-- SELECT 
--   DATE(created_at) as sale_date,
--   COUNT(*) as sales_count,
--   SUM(amount_stars) as daily_revenue_stars
-- FROM premium_transactions
-- WHERE status = 'completed'
-- GROUP BY DATE(created_at)
-- ORDER BY sale_date DESC;

-- Популярность тарифов
-- SELECT 
--   months,
--   COUNT(*) as purchases_count,
--   ROUND(AVG(amount_stars)) as avg_stars
-- FROM premium_transactions
-- WHERE status = 'completed'
-- GROUP BY months
-- ORDER BY months;
