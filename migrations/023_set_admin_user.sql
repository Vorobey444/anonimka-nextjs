-- Migration 023: Set admin flag for main user
-- Date: 2025-12-06

BEGIN;

UPDATE users 
SET is_admin = true
WHERE user_token = 'd82dca38a4c1e4f50ad242a7ef34af4bf580b4c5a0533e91cd7ff62ade19b57f';

COMMIT;
