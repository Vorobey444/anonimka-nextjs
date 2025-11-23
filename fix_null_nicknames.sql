-- Исправляем все NULL в sender_nickname
UPDATE messages 
SET sender_nickname = COALESCE(
    (SELECT nickname FROM ads WHERE user_token = messages.sender_token ORDER BY created_at DESC LIMIT 1), 
    'Аноним'
) 
WHERE sender_nickname IS NULL;

-- Проверяем результат
SELECT COUNT(*) as fixed_count FROM messages WHERE sender_nickname = 'Аноним' OR sender_nickname IS NOT NULL;
SELECT COUNT(*) as remaining_nulls FROM messages WHERE sender_nickname IS NULL;
