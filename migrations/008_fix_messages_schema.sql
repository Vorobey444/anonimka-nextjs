-- Migration 008: Fix messages table schema - add missing columns and constraints
-- Problem: After rollback, table was created without proper schema
-- Solution: Add id, read, delivered columns with proper constraints

BEGIN;

-- Step 1: Add id column if missing (should be PRIMARY KEY)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'id'
    ) THEN
        -- Add id column as BIGSERIAL
        ALTER TABLE messages ADD COLUMN id BIGSERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column';
    ELSE
        RAISE NOTICE 'id column already exists';
    END IF;
END $$;

-- Step 2: Add read column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'read'
    ) THEN
        ALTER TABLE messages ADD COLUMN read BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added read column';
    ELSE
        RAISE NOTICE 'read column already exists';
    END IF;
END $$;

-- Step 3: Add delivered column if missing  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'delivered'
    ) THEN
        ALTER TABLE messages ADD COLUMN delivered BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added delivered column';
    ELSE
        RAISE NOTICE 'delivered column already exists';
    END IF;
END $$;

-- Step 4: Add sender_nickname if missing (used for display in chats)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'sender_nickname'
    ) THEN
        ALTER TABLE messages ADD COLUMN sender_nickname TEXT;
        RAISE NOTICE 'Added sender_nickname column';
    ELSE
        RAISE NOTICE 'sender_nickname column already exists';
    END IF;
END $$;

-- Step 5: Add photo_url if missing (for image messages)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'photo_url'
    ) THEN
        ALTER TABLE messages ADD COLUMN photo_url TEXT;
        RAISE NOTICE 'Added photo_url column';
    ELSE
        RAISE NOTICE 'photo_url column already exists';
    END IF;
END $$;

-- Step 6: Add telegram_file_id if missing (for Telegram photos)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'telegram_file_id'
    ) THEN
        ALTER TABLE messages ADD COLUMN telegram_file_id TEXT;
        RAISE NOTICE 'Added telegram_file_id column';
    ELSE
        RAISE NOTICE 'telegram_file_id column already exists';
    END IF;
END $$;

-- Step 7: Create indexes if missing
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_messages_delivered ON messages(delivered) WHERE delivered = false;

-- Step 8: Verify schema
DO $$
DECLARE
    has_id BOOLEAN;
    has_read BOOLEAN;
    has_delivered BOOLEAN;
    has_sender_token BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'id') INTO has_id;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'read') INTO has_read;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'delivered') INTO has_delivered;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'sender_token') INTO has_sender_token;
    
    IF NOT has_id THEN
        RAISE EXCEPTION 'Migration 008 FAILED: id column missing!';
    END IF;
    
    IF NOT has_read THEN
        RAISE EXCEPTION 'Migration 008 FAILED: read column missing!';
    END IF;
    
    IF NOT has_delivered THEN
        RAISE EXCEPTION 'Migration 008 FAILED: delivered column missing!';
    END IF;
    
    IF NOT has_sender_token THEN
        RAISE EXCEPTION 'Migration 008 FAILED: sender_token column missing!';
    END IF;
    
    RAISE NOTICE '✅ Migration 008 completed successfully!';
    RAISE NOTICE '✅ Schema: id (BIGSERIAL PRIMARY KEY), sender_token (TEXT), message (TEXT), read (BOOLEAN), delivered (BOOLEAN)';
    RAISE NOTICE '✅ Optional: sender_nickname, photo_url, telegram_file_id';
END $$;

COMMIT;
