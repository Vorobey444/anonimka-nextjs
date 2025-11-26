-- Миграция: установить auto_premium_source и premium_until для существующих PRO пользователей
-- Дата: 2025-11-27

-- 1. Найти пользователей с PRO без auto_premium_source
-- 2. Определить источник по логике:
--    - female_bonus: first_ad_gender = 'Девушка' AND premium_until IS NULL
--    - referral: есть запись в referrals с reward_given = true
--    - stars: есть запись в premium_transactions
--    - trial: trial7h_used = true AND premium_until близко к текущей дате

-- ВАЖНО: Выполнять по одному блоку, проверяя результаты!

-- ====================
-- 1. FEMALE BONUS - установить премиум на 30 лет
-- ====================
UPDATE users
SET 
    premium_until = (NOW() + INTERVAL '30 years'),
    auto_premium_source = 'female_bonus'
WHERE 
    is_premium = TRUE 
    AND first_ad_gender = 'Девушка'
    AND auto_premium_source IS NULL
    AND (premium_until IS NULL OR premium_until < NOW());

-- Проверка результата:
-- SELECT id, first_ad_gender, auto_premium_source, premium_until FROM users WHERE auto_premium_source = 'female_bonus';

-- ====================
-- 2. REFERRAL - установить премиум на 30 дней от сегодня (если истек)
-- ====================
UPDATE users u
SET 
    premium_until = CASE 
        WHEN u.premium_until IS NULL OR u.premium_until < NOW() 
        THEN (NOW() + INTERVAL '30 days')
        ELSE u.premium_until
    END,
    auto_premium_source = 'referral'
WHERE 
    u.is_premium = TRUE
    AND u.auto_premium_source IS NULL
    AND u.first_ad_gender != 'Девушка'
    AND EXISTS (
        SELECT 1 FROM referrals r 
        WHERE r.referrer_id = u.id 
        AND r.reward_given = TRUE
        LIMIT 1
    );

-- Проверка результата:
-- SELECT id, auto_premium_source, premium_until FROM users WHERE auto_premium_source = 'referral';

-- ====================
-- 3. STARS (платные) - оставить существующий premium_until
-- ====================
UPDATE users u
SET 
    auto_premium_source = 'paid'
WHERE 
    u.is_premium = TRUE
    AND u.auto_premium_source IS NULL
    AND u.first_ad_gender != 'Девушка'
    AND EXISTS (
        SELECT 1 FROM premium_transactions pt 
        WHERE pt.telegram_id = u.id
        LIMIT 1
    );

-- Проверка результата:
-- SELECT id, auto_premium_source, premium_until FROM users WHERE auto_premium_source = 'paid';

-- ====================
-- 4. TRIAL (пробный) - установить на 7 часов от сейчас (если истек)
-- ====================
UPDATE users
SET 
    premium_until = CASE 
        WHEN premium_until IS NULL OR premium_until < NOW() 
        THEN (NOW() + INTERVAL '7 hours')
        ELSE premium_until
    END,
    auto_premium_source = 'trial'
WHERE 
    is_premium = TRUE
    AND auto_premium_source IS NULL
    AND trial7h_used = TRUE
    AND first_ad_gender != 'Девушка';

-- Проверка результата:
-- SELECT id, auto_premium_source, trial7h_used, premium_until FROM users WHERE auto_premium_source = 'trial';

-- ====================
-- 5. Остальные - установить paid с датой +30 дней (безопасное значение)
-- ====================
UPDATE users
SET 
    premium_until = CASE 
        WHEN premium_until IS NULL OR premium_until < NOW() 
        THEN (NOW() + INTERVAL '30 days')
        ELSE premium_until
    END,
    auto_premium_source = 'paid'
WHERE 
    is_premium = TRUE
    AND auto_premium_source IS NULL;

-- Проверка результата:
-- SELECT id, auto_premium_source, premium_until FROM users WHERE is_premium = TRUE AND auto_premium_source IS NULL;
-- Должен вернуть 0 строк

-- ====================
-- ИТОГОВАЯ ПРОВЕРКА
-- ====================
-- SELECT 
--     auto_premium_source, 
--     COUNT(*) as count,
--     COUNT(CASE WHEN premium_until IS NULL THEN 1 END) as null_dates
-- FROM users 
-- WHERE is_premium = TRUE 
-- GROUP BY auto_premium_source;
