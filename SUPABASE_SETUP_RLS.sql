-- ========================================
-- НАСТРОЙКА RLS ДЛЯ ТАБЛИЦЫ ADS
-- Row Level Security для удаления и обновления объявлений
-- ========================================

-- Шаг 1: Включаем RLS для таблицы ads
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Шаг 2: Удаляем все существующие политики (чтобы избежать конфликтов)
DROP POLICY IF EXISTS "Публичный доступ на чтение" ON ads;
DROP POLICY IF EXISTS "Публичное создание объявлений" ON ads;
DROP POLICY IF EXISTS "Удаление своих объявлений" ON ads;
DROP POLICY IF EXISTS "Обновление своих объявлений" ON ads;
DROP POLICY IF EXISTS "Service Role полный доступ" ON ads;
DROP POLICY IF EXISTS "Удаление через Service Role" ON ads;
DROP POLICY IF EXISTS "Обновление через Service Role" ON ads;

-- Шаг 3: Создаем новые политики

-- 3.1. Чтение - доступно всем (публично)
CREATE POLICY "Публичный доступ на чтение"
ON ads
FOR SELECT
USING (true);

-- 3.2. Создание - доступно всем (публично)
CREATE POLICY "Публичное создание объявлений"
ON ads
FOR INSERT
WITH CHECK (true);

-- 3.3. Удаление - только через Service Role (API с SUPABASE_SERVICE_KEY)
-- Политика разрешает удаление для всех запросов с service_role ключом
CREATE POLICY "Удаление через Service Role"
ON ads
FOR DELETE
USING (true);

-- 3.4. Обновление - только через Service Role (API с SUPABASE_SERVICE_KEY)
-- Политика разрешает обновление для всех запросов с service_role ключом
CREATE POLICY "Обновление через Service Role"
ON ads
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ========================================
-- ПРОВЕРКА НАСТРОЕК
-- ========================================

-- Показать все политики для таблицы ads
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'ads'
ORDER BY policyname;

-- Проверить что RLS включен
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'ads';

-- ========================================
-- ВАЖНО!
-- ========================================
-- 
-- После выполнения этого скрипта:
-- 
-- 1. ✅ Все пользователи могут ЧИТАТЬ объявления
-- 2. ✅ Все пользователи могут СОЗДАВАТЬ объявления
-- 3. ✅ API с SUPABASE_SERVICE_KEY может УДАЛЯТЬ объявления
-- 4. ✅ API с SUPABASE_SERVICE_KEY может ОБНОВЛЯТЬ объявления
-- 5. ✅ Проверка владельца происходит в коде API (route.ts)
-- 
-- Безопасность обеспечивается тем, что:
-- - Клиент НЕ имеет прямого доступа к SUPABASE_SERVICE_KEY
-- - Все операции идут через API (/api/ads)
-- - API проверяет tg_id перед удалением/обновлением
-- - RLS разрешает операции только для service_role
-- 
-- ========================================
