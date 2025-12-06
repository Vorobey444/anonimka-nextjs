-- Migration 022: Add indexes to user_blocks for performance
-- Date: 2025-12-06
-- Purpose: Fix slow queries with NOT IN (SELECT ... FROM user_blocks)

BEGIN;

-- Индексы для быстрого поиска блокировок
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_token ON user_blocks(blocker_token);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_token ON user_blocks(blocked_token);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_blocked ON user_blocks(blocker_token, blocked_token);

COMMIT;
