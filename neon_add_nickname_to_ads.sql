-- Добавляем поле nickname в таблицу ads
-- Это позволит хранить никнейм автора в каждой анкете

-- Добавляем столбец nickname (если его еще нет)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'nickname'
    ) THEN
        ALTER TABLE ads ADD COLUMN nickname VARCHAR(100) DEFAULT 'Аноним';
        RAISE NOTICE 'Column "nickname" added to ads table';
    ELSE
        RAISE NOTICE 'Column "nickname" already exists in ads table';
    END IF;
END $$;

-- Обновляем существующие записи, ставим дефолтное значение 'Аноним' где NULL
UPDATE ads SET nickname = 'Аноним' WHERE nickname IS NULL;

-- Комментарий к столбцу
COMMENT ON COLUMN ads.nickname IS 'Никнейм автора анкеты (может быть изменен пользователем)';
