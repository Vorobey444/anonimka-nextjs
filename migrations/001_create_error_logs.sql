-- Drop corrupted table if exists
DROP TABLE IF EXISTS error_logs CASCADE;

-- Create error logs table for debugging
CREATE TABLE IF NOT EXISTS error_logs (
  id BIGSERIAL PRIMARY KEY,
  user_token VARCHAR(255) REFERENCES users(user_token) ON DELETE SET NULL,
  photo_id VARCHAR(255),
  action VARCHAR(100),
  error_message TEXT,
  error_stack TEXT,
  status_code INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for quick queries
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_token ON error_logs(user_token);
CREATE INDEX IF NOT EXISTS idx_error_logs_action ON error_logs(action);
CREATE INDEX IF NOT EXISTS idx_error_logs_photo_id ON error_logs(photo_id);

-- Create retention policy: keep only 30 days of error logs
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM error_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Run cleanup daily (uncomment if using pg_cron)
-- SELECT cron.schedule('cleanup_error_logs', '0 2 * * *', 'SELECT cleanup_old_error_logs()');
