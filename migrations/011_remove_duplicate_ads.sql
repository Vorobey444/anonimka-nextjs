-- Migration 011: Remove duplicate ads by text field and specific goal patterns
-- Date: 2025-11-19
-- Purpose: Clean up duplicate ad entries and ads with array-format goals

BEGIN;

-- Delete duplicates, keeping only the first occurrence (lowest id)
DELETE FROM ads a
USING ads b
WHERE a.id > b.id
  AND a.text = b.text
  AND a.created_at >= '2025-11-16'
  AND a.created_at < '2025-11-18';

-- Delete ads with array-format goals (PostgreSQL array syntax)
DELETE FROM ads
WHERE created_at >= '2025-11-16'
  AND created_at < '2025-11-18'
  AND (
    goal = '{friendship,chat}'
    OR goal = '{dating,friendship}'
    OR goal = '{friendship,travel}'
    OR goal = '{relationship,dating}'
    OR goal = '{dating,relationship}'
    OR goal = '{travel,friendship}'
    OR goal = '{friendship,dating}'
    OR goal LIKE '{%,%}'
  );

-- Verification
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count FROM ads WHERE created_at >= '2025-11-16' AND created_at < '2025-11-18';
    RAISE NOTICE '✅ Migration 011 complete! Remaining example ads: %', remaining_count;
END $$;

COMMIT;
