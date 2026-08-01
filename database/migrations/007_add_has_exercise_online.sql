-- =====================================================
-- Migration 007: Them cot has_exercise_online cho sessions
--   Muc dich: phan biet buoi CO giao bai tap online vs
--             buoi KHONG co bai tap (GV quen tick/khong co)
--   - Default 1: giu nguyen logic thong ke cu (cac buoi
--     cu mac dinh co bai tap online)
--   - Khi GV bo tick (= 0): se KHONG tinh diem bai tap
--     online cua buoi do vao thong ke thang
-- Idempotent: chay lai nhieu lan khong loi.
-- =====================================================

SET @db := DATABASE();

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME   = 'sessions'
    AND COLUMN_NAME  = 'has_exercise_online'
);
SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE sessions ADD COLUMN has_exercise_online TINYINT(1) NOT NULL DEFAULT 1 COMMENT ''Buoi nay co bai tap online (GV tick) - 0=khong co bai tap, bo qua khi thong ke'' AFTER note',
  'SELECT ''Cot has_exercise_online da ton tai'' AS msg'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Migration 007 hoan tat: sessions.has_exercise_online' AS done;
