-- Проверка премиум статуса для Vorobey444
SELECT 
    id,
    display_nickname,
    is_premium,
    premium_until,
    nickname_changed_at,
    CASE 
        WHEN premium_until IS NULL THEN 'NO EXPIRY DATE'
        WHEN premium_until > NOW() THEN 'ACTIVE'
        ELSE 'EXPIRED'
    END as premium_status,
    CASE
        WHEN nickname_changed_at IS NULL THEN '0 changes (first change allowed)'
        ELSE CONCAT(
            'Last change: ', 
            nickname_changed_at::text,
            ' (', 
            ROUND(EXTRACT(EPOCH FROM (NOW() - nickname_changed_at)) / 3600, 1),
            ' hours ago)'
        )
    END as nickname_info
FROM users 
WHERE display_nickname = 'Vorobey444'
   OR id = (SELECT id FROM users WHERE display_nickname = 'Vorobey444' LIMIT 1);
