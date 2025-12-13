-- ===================================================
-- Исправление кодов стран в таблице users
-- Меняем полные названия на ISO коды (KZ, RU, etc.)
-- ===================================================

-- Казахстан: kazakhstan → KZ
UPDATE users 
SET location_country = 'KZ' 
WHERE location_country = 'kazakhstan' OR location_country = 'Kazakhstan';

-- Россия: russia → RU
UPDATE users 
SET location_country = 'RU' 
WHERE location_country = 'russia' OR location_country = 'Russia';

-- Кыргызстан: kyrgyzstan → KG
UPDATE users 
SET location_country = 'KG' 
WHERE location_country = 'kyrgyzstan' OR location_country = 'Kyrgyzstan';

-- Узбекистан: uzbekistan → UZ
UPDATE users 
SET location_country = 'UZ' 
WHERE location_country = 'uzbekistan' OR location_country = 'Uzbekistan';

-- Таджикистан: tajikistan → TJ
UPDATE users 
SET location_country = 'TJ' 
WHERE location_country = 'tajikistan' OR location_country = 'Tajikistan';

-- Туркменистан: turkmenistan → TM
UPDATE users 
SET location_country = 'TM' 
WHERE location_country = 'turkmenistan' OR location_country = 'Turkmenistan';

-- Беларусь: belarus → BY
UPDATE users 
SET location_country = 'BY' 
WHERE location_country = 'belarus' OR location_country = 'Belarus';

-- ===================================================
-- Проверка результатов
-- ===================================================

-- Посмотреть сколько записей исправлено
SELECT 
    location_country, 
    COUNT(*) as count 
FROM users 
WHERE location_country IS NOT NULL 
GROUP BY location_country 
ORDER BY count DESC;

-- Найти любые оставшиеся нестандартные коды
SELECT DISTINCT location_country 
FROM users 
WHERE location_country IS NOT NULL 
  AND location_country NOT IN ('KZ', 'RU', 'KG', 'UZ', 'TJ', 'TM', 'BY')
ORDER BY location_country;
