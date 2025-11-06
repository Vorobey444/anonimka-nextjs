-- Rollback 004: Restore PII from backup
-- WARNING: Only use if backup table exists and data is recent

BEGIN;

-- Restore from backup
UPDATE users u
SET 
  username = b.username,
  first_name = b.first_name,
  last_name = b.last_name
FROM users_backup_20251106 b
WHERE u.id = b.id;

-- Verify
DO $$
DECLARE
  restored_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO restored_count
  FROM users u
  JOIN users_backup_20251106 b ON u.id = b.id
  WHERE u.username = b.username 
    AND COALESCE(u.first_name, '') = COALESCE(b.first_name, '')
    AND COALESCE(u.last_name, '') = COALESCE(b.last_name, '');
  
  RAISE NOTICE 'Restored % user records from backup', restored_count;
END $$;

COMMIT;
