-- Обновить PRO статус для Vorobey444
UPDATE users 
SET 
    is_premium = true,
    premium_until = '2025-12-11 23:59:59+00'::TIMESTAMPTZ
WHERE id = 884253640;

-- Проверка
SELECT 
    id,
    display_nickname,
    is_premium,
    premium_until,
    CASE 
        WHEN premium_until IS NULL THEN 'NO EXPIRY DATE'
        WHEN premium_until > NOW() THEN 'ACTIVE'
        ELSE 'EXPIRED'
    END as premium_status
FROM users 
WHERE id = 884253640;
