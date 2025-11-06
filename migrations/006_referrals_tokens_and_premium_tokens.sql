-- Migration 006: Add token-based referrals support and premium_tokens table
-- Date: 2025-11-06
-- Purpose: Enable referrals and premium rewards for token-only web users while keeping Telegram (numeric) flows working

BEGIN;

-- 1) Extend referrals to support tokens alongside existing numeric IDs
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS referrer_token TEXT,
  ADD COLUMN IF NOT EXISTS referred_token TEXT;

-- Helpful indexes for lookups by token
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_token ON referrals (referrer_token);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_token ON referrals (referred_token);

-- 2) Token-based premium store for web users without numeric tg_id
CREATE TABLE IF NOT EXISTS premium_tokens (
  user_token TEXT PRIMARY KEY,
  is_premium BOOLEAN NOT NULL DEFAULT TRUE,
  premium_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
