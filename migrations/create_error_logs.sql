-- Create error logs table for debugging
CREATE TABLE IF NOT EXISTS error_logs (
  id BIGSERIAL PRIMARY KEY,
  user_token VARCHAR(255),
  photo_id VARCHAR(255),
  action VARCHAR(100),
  error_message TEXT,
  error_stack TEXT,
  status_code INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes for quick queries
  CONSTRAINT error_logs_idx_user_token FOREIGN KEY (user_token) REFERENCES users(user_token) ON DELETE SET NULL,
  INDEX idx_created_at (created_at DESC),
  INDEX idx_user_token (user_token),
  INDEX idx_action (action)
);

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
