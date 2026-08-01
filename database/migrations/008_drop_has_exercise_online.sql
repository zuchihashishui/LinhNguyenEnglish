-- =====================================================
-- Migration 008 (rollback 007): Xoa cot has_exercise_online
--   Ly do: cot "BT online ve nha" da co san trong
--          attendances.exercise_online_done - khong can
--          them cot moi. Su dung nguyen cot cu.
-- Idempotent: chay lai nhieu lan khong loi.
-- =====================================================

SET @db := DATABASE();

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME   = 'sessions'
    AND COLUMN_NAME  = 'has_exercise_online'
);
SET @ddl := IF(@col_exists = 1,
  'ALTER TABLE sessions DROP COLUMN has_exercise_online',
  'SELECT ''Cot has_exercise_online khong ton tai, bo qua'' AS msg'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Migration 008 hoan tat: da xoa sessions.has_exercise_online' AS done;