-- =====================================================
-- Migration 005: them 2 checkbox check-task
--   video_lesson_done     - HS da quay video bai cu
--   exercise_online_done  - HS da lam bai tap online ve nha
-- TINYINT(1) giong is_present de checkbox tuong thich.
-- Default 0 (chua tick); an toan voi du lieu cu (NULL -> 0).
-- Idempotent: chay lai nhieu lan khong loi.
-- =====================================================

SET @db := DATABASE();

-- 1) video_lesson_done
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME   = 'attendances'
    AND COLUMN_NAME  = 'video_lesson_done'
);
SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE attendances ADD COLUMN video_lesson_done TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''Da quay video bai cu'' AFTER is_present',
  'SELECT ''Cot video_lesson_done da ton tai'' AS msg'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) exercise_online_done
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME   = 'attendances'
    AND COLUMN_NAME  = 'exercise_online_done'
);
SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE attendances ADD COLUMN exercise_online_done TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''Da lam bai tap online ve nha'' AFTER video_lesson_done',
  'SELECT ''Cot exercise_online_done da ton tai'' AS msg'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Migration 005 hoan tat: video_lesson_done + exercise_online_done' AS done;
