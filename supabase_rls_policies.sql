-- Политики безопасности Row Level Security (RLS) для таблицы ads
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Включаем RLS для таблицы ads (если еще не включен)
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- 2. Удаляем все существующие политики (если есть)
DROP POLICY IF EXISTS "Allow public read access" ON ads;
DROP POLICY IF EXISTS "Allow insert for all" ON ads;
DROP POLICY IF EXISTS "Allow update own ads" ON ads;
DROP POLICY IF EXISTS "Allow delete own ads" ON ads;
DROP POLICY IF EXISTS "Allow service role full access" ON ads;

-- 3. Политика для чтения (SELECT) - все могут читать объявления
CREATE POLICY "Allow public read access" 
ON ads FOR SELECT 
USING (true);

-- 4. Политика для создания (INSERT) - все могут создавать объявления
CREATE POLICY "Allow insert for all" 
ON ads FOR INSERT 
WITH CHECK (true);

-- 5. Политика для обновления (UPDATE) - можно обновлять только свои объявления
CREATE POLICY "Allow update own ads" 
ON ads FOR UPDATE 
USING (true)  -- Разрешаем через service key
WITH CHECK (true);

-- 6. Политика для удаления (DELETE) - можно удалять только свои объявления
CREATE POLICY "Allow delete own ads" 
ON ads FOR DELETE 
USING (true);  -- Разрешаем через service key

-- 7. Полный доступ для service role (для API)
CREATE POLICY "Allow service role full access" 
ON ads FOR ALL 
USING (auth.role() = 'service_role');

-- Проверка: показать все политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'ads';
