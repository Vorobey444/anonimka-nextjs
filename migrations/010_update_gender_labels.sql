-- Migration 010: Update gender labels from Женщина to Девушка
-- Date: 2025-11-07
-- Purpose: Replace all "Женщина" with "Девушка" in existing ads

BEGIN;

-- Update gender field: Женщина → Девушка
UPDATE ads 
SET gender = 'Девушка' 
WHERE gender = 'Женщина';

-- Update target field: Женщину → Девушку
UPDATE ads 
SET target = 'Девушку' 
WHERE target = 'Женщину';

COMMIT;

-- Verification
DO $$
DECLARE
    female_count INTEGER;
    target_female_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO female_count FROM ads WHERE gender = 'Девушка';
    SELECT COUNT(*) INTO target_female_count FROM ads WHERE target = 'Девушку';
    
    RAISE NOTICE '✅ Migration 010 complete!';
    RAISE NOTICE 'Ads with gender "Девушка": %', female_count;
    RAISE NOTICE 'Ads seeking "Девушку": %', target_female_count;
END $$;
