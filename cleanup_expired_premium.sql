-- Автоматическая очистка истёкших PRO подписок
-- Выполняется для всех пользователей с истёкшим premium_until

-- Сбрасываем PRO для пользователей с истёкшим сроком
UPDATE users 
SET 
    is_premium = false,
    updated_at = NOW()
WHERE 
    is_premium = true 
    AND premium_until IS NOT NULL 
    AND premium_until < NOW();

-- Сбрасываем PRO для токенов с истёкшим сроком
UPDATE premium_tokens 
SET 
    is_premium = false
WHERE 
    is_premium = true 
    AND premium_until IS NOT NULL 
    AND premium_until < NOW();

-- Проверка результатов
SELECT 
    'users' as table_name,
    COUNT(*) as expired_count
FROM users 
WHERE 
    is_premium = false 
    AND premium_until IS NOT NULL 
    AND premium_until < NOW()
UNION ALL
SELECT 
    'premium_tokens' as table_name,
    COUNT(*) as expired_count
FROM premium_tokens 
WHERE 
    is_premium = false 
    AND premium_until IS NOT NULL 
    AND premium_until < NOW();
