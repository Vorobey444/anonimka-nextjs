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
-- Проверка результатов
-- ===================================================

-- Посмотреть сколько записей исправлено
SELECT 
    location->>'country' as country, 
    COUNT(*) as count 
FROM users 
WHERE location IS NOT NULL 
GROUP BY location->>'country'
ORDER BY count DESC;

-- Найти любые оставшиеся нестандартные коды
SELECT DISTINCT location->>'country' as country
FROM users 
WHERE location IS NOT NULL 
  AND location->>'country' NOT IN ('KZ', 'RU', 'KG', 'UZ', 'TJ', 'TM', 'BY')
ORDER BY country;
