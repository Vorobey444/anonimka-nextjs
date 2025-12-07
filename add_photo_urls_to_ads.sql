-- Добавление поля photo_urls в таблицу ads
-- Это поле хранит массив URL фотографий для анкеты

ALTER TABLE ads ADD COLUMN IF NOT EXISTS photo_urls TEXT[];

-- Комментарий для документации
COMMENT ON COLUMN ads.photo_urls IS 'Массив URL фотографий анкеты (до 5 штук)';
