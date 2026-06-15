-- =====================================================
-- Migration 003: index cho sessions.session_date
-- Cai thien hieu nang truy van theo khoang ngay (thong ke)
-- Idempotent: chay lai khong loi
-- =====================================================

-- Index cho session_date (loc theo khoang ngay)
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sessions'
    AND INDEX_NAME = 'idx_sessions_session_date'
);

SET @ddl := IF(@idx_exists = 0,
  'CREATE INDEX idx_sessions_session_date ON sessions (session_date)',
  'SELECT ''Index idx_sessions_session_date da ton tai'' AS msg'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Composite (class_id, session_date) - cho truy van thong ke theo lop + thang
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sessions'
    AND INDEX_NAME = 'idx_sessions_class_date'
);

SET @ddl := IF(@idx_exists = 0,
  'CREATE INDEX idx_sessions_class_date ON sessions (class_id, session_date)',
  'SELECT ''Index idx_sessions_class_date da ton tai'' AS msg'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
