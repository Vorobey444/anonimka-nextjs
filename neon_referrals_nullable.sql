-- Делаем referrer_id и referred_id nullable в таблице referrals
-- Это позволяет регистрировать рефералов до того как найдется их tg_id

ALTER TABLE referrals 
ALTER COLUMN referrer_id DROP NOT NULL;

ALTER TABLE referrals 
ALTER COLUMN referred_id DROP NOT NULL;

-- Комментарий для ясности
COMMENT ON COLUMN referrals.referrer_id IS 'Telegram ID пригласившего (может быть NULL если известен только токен)';
COMMENT ON COLUMN referrals.referred_id IS 'Telegram ID приглашенного (заполняется при создании первой анкеты)';
