-- Make referred_id nullable to allow registration before user creates first ad
-- The referred_id will be filled later when processReferralReward is called

ALTER TABLE referrals 
ALTER COLUMN referred_id DROP NOT NULL;

-- Add comment explaining the workflow
COMMENT ON COLUMN referrals.referred_id IS 'Filled automatically when referred user creates their first ad (initially NULL for new users)';
