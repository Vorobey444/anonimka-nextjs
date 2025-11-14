-- Делаем reporter_id опциональным для поддержки анонимных жалоб
-- Сначала удаляем FK constraint
ALTER TABLE reports 
DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;

-- Делаем поле nullable
ALTER TABLE reports 
ALTER COLUMN reporter_id DROP NOT NULL;

-- Создаём новый FK constraint с ON DELETE SET NULL
ALTER TABLE reports
ADD CONSTRAINT reports_reporter_id_fkey 
FOREIGN KEY (reporter_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- Комментарий для понимания
COMMENT ON COLUMN reports.reporter_id IS 'ID пользователя подавшего жалобу (NULL если жалоба анонимная)';
