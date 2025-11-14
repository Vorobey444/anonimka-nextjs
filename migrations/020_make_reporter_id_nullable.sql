-- Эта миграция больше не нужна
-- reporter_id остаётся обязательным полем (NOT NULL)
-- Все жалобы должны быть с идентификацией пользователя для модерации

-- Если вы случайно применили эту миграцию, откатите её:
/*
ALTER TABLE reports 
DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;

ALTER TABLE reports 
ALTER COLUMN reporter_id SET NOT NULL;

ALTER TABLE reports
ADD CONSTRAINT reports_reporter_id_fkey 
FOREIGN KEY (reporter_id) 
REFERENCES users(id) 
ON DELETE CASCADE;
*/
