-- Диагностика: Проверка чатов и сообщений email пользователей

-- 1. Проверить email пользователей и их токены
SELECT 
  id,
  email,
  user_token,
  auth_method,
  created_at
FROM users 
WHERE auth_method = 'email'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Проверить, есть ли чаты с старыми токенами
-- (токены которые НЕ совпадают с детерминированными)
SELECT 
  pc.id,
  pc.user_token_1,
  pc.user_token_2,
  u1.email as email_1,
  u2.email as email_2,
  pc.created_at
FROM private_chats pc
LEFT JOIN users u1 ON pc.user_token_1 = u1.user_token
LEFT JOIN users u2 ON pc.user_token_2 = u2.user_token
WHERE pc.user_token_1 NOT IN (SELECT user_token FROM users WHERE auth_method = 'email')
   OR pc.user_token_2 NOT IN (SELECT user_token FROM users WHERE auth_method = 'email')
LIMIT 10;

-- 3. Проверить чаты email пользователей
SELECT 
  pc.id,
  pc.user_token_1,
  pc.user_token_2,
  u1.email as email_1,
  u2.email as email_2,
  pc.accepted,
  pc.created_at,
  (SELECT COUNT(*) FROM messages WHERE chat_id = pc.id) as message_count
FROM private_chats pc
LEFT JOIN users u1 ON pc.user_token_1 = u1.user_token
LEFT JOIN users u2 ON pc.user_token_2 = u2.user_token
WHERE u1.auth_method = 'email' OR u2.auth_method = 'email'
ORDER BY pc.created_at DESC
LIMIT 10;

-- 4. Проверить сообщения email пользователей
SELECT 
  m.id,
  m.sender_token,
  u.email as sender_email,
  m.message,
  m.created_at
FROM messages m
LEFT JOIN users u ON m.sender_token = u.user_token
WHERE u.auth_method = 'email'
ORDER BY m.created_at DESC
LIMIT 10;

-- 5. Найти "потерянные" чаты (токены не найдены в users)
SELECT 
  pc.id as chat_id,
  pc.user_token_1,
  pc.user_token_2,
  CASE WHEN u1.id IS NULL THEN 'LOST TOKEN 1' ELSE 'OK' END as token_1_status,
  CASE WHEN u2.id IS NULL THEN 'LOST TOKEN 2' ELSE 'OK' END as token_2_status
FROM private_chats pc
LEFT JOIN users u1 ON pc.user_token_1 = u1.user_token
LEFT JOIN users u2 ON pc.user_token_2 = u2.user_token
WHERE u1.id IS NULL OR u2.id IS NULL
LIMIT 20;
