-- Удаляем UNIQUE constraint на ads.user_token
-- Это позволит пользователям создавать несколько активных анкет

ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_user_token_key;

-- Проверка: должно быть OK
SELECT 'Constraint removed successfully' AS status;
