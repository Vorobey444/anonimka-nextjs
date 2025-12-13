-- ===================================================
-- Исправление кодов стран в таблице users
-- Меняем полные названия на ISO коды (KZ, RU, etc.)
-- Локация хранится в JSONB: {"country": "KZ", "region": "...", "city": "..."}
-- ===================================================

-- Казахстан: kazakhstan → KZ
UPDATE users 
SET location = jsonb_set(location, '{country}', '"KZ"', false)
WHERE location->>'country' IN ('kazakhstan', 'Kazakhstan');

-- Россия: russia → RU
UPDATE users 
SET location = jsonb_set(location, '{country}', '"RU"', false)
WHERE location->>'country' IN ('russia', 'Russia');

-- Кыргызстан: kyrgyzstan → KG
UPDATE users 
SET location = jsonb_set(location, '{country}', '"KG"', false)
WHERE location->>'country' IN ('kyrgyzstan', 'Kyrgyzstan');

-- Узбекистан: uzbekistan → UZ
UPDATE users 
SET location = jsonb_set(location, '{country}', '"UZ"', false)
WHERE location->>'country' IN ('uzbekistan', 'Uzbekistan');

-- Таджикистан: tajikistan → TJ
UPDATE users 
SET location = jsonb_set(location, '{country}', '"TJ"', false)
WHERE location->>'country' IN ('tajikistan', 'Tajikistan');

-- Туркменистан: turkmenistan → TM
UPDATE users 
SET location = jsonb_set(location, '{country}', '"TM"', false)
WHERE location->>'country' IN ('turkmenistan', 'Turkmenistan');

-- Беларусь: belarus → BY
UPDATE users 
SET location = jsonb_set(location, '{country}', '"BY"', false)
WHERE location->>'country' IN ('belarus', 'Belarus');

-- ===================================================
-- Исправление кодов стран в таблице ads
-- В таблице ads коды хранятся в отдельной колонке country (TEXT)
-- ===================================================

-- Казахстан: kazakhstan → KZ
UPDATE ads 
SET country = 'KZ' 
WHERE country IN ('kazakhstan', 'Kazakhstan');

-- Россия: russia → RU
UPDATE ads 
SET country = 'RU' 
WHERE country IN ('russia', 'Russia', 'Россия');

-- Кыргызстан: kyrgyzstan → KG
UPDATE ads 
SET country = 'KG' 
WHERE country IN ('kyrgyzstan', 'Kyrgyzstan');

-- Узбекистан: uzbekistan → UZ
UPDATE ads 
SET country = 'UZ' 
WHERE country IN ('uzbekistan', 'Uzbekistan');

-- Таджикистан: tajikistan → TJ
UPDATE ads 
SET country = 'TJ' 
WHERE country IN ('tajikistan', 'Tajikistan');

-- Туркменистан: turkmenistan → TM
UPDATE ads 
SET country = 'TM' 
WHERE country IN ('turkmenistan', 'Turkmenistan');

-- Беларусь: belarus → BY
UPDATE ads 
SET country = 'BY' 
WHERE country IN ('belarus', 'Belarus');

-- ===================================================
-- Проверка результатов
-- ===================================================

-- Посмотреть сколько записей исправлено в users
SELECT 
    location->>'country' as country, 
    COUNT(*) as count 
FROM users 
WHERE location IS NOT NULL 
GROUP BY location->>'country'
ORDER BY count DESC;

-- Посмотреть сколько записей исправлено в ads
SELECT 
    country, 
    COUNT(*) as count 
FROM ads 
WHERE country IS NOT NULL 
GROUP BY country
ORDER BY count DESC;

-- Найти любые оставшиеся нестандартные коды в users
SELECT DISTINCT location->>'country' as country
FROM users 
WHERE location IS NOT NULL 
  AND location->>'country' NOT IN ('KZ', 'RU', 'KG', 'UZ', 'TJ', 'TM', 'BY')
ORDER BY country;

-- Найти любые оставшиеся нестандартные коды в ads
SELECT DISTINCT country
FROM ads 
WHERE country IS NOT NULL 
  AND country NOT IN ('KZ', 'RU', 'KG', 'UZ', 'TJ', 'TM', 'BY')
ORDER BY country;
