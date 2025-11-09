-- Add orientation field to ads table
-- Run this in Neon SQL Editor

ALTER TABLE ads ADD COLUMN IF NOT EXISTS orientation TEXT;

-- Optional: add index for filtering by orientation
CREATE INDEX IF NOT EXISTS idx_ads_orientation ON ads(orientation);

-- Note: Valid values will be enforced in the application layer:
-- 'hetero', 'gay', 'bi', 'pan', 'ace', 'demi', 'queer', 'grey', 'sever'
