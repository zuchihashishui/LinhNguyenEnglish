-- =====================================================
-- Migration 006: Xoa cot lesson_grade (XEP LOAI)
-- Ngay 2026-07-13 - Xoa cot xep loai khoi bang attendances
-- Idempotent: chay lai khong loi
-- =====================================================

SET @db := DATABASE();

-- 1) Xoa constraint CHECK chk_lesson_grade (neu co)
SET @cons_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'attendances'
    AND CONSTRAINT_NAME = 'chk_lesson_grade'
);
SET @ddl := IF(@cons_exists > 0,
  'ALTER TABLE attendances DROP CONSTRAINT chk_lesson_grade',
  'SELECT ''Constraint chk_lesson_grade khong ton tai'' AS msg'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Xoa cot lesson_grade (neu co)
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'attendances'
    AND COLUMN_NAME = 'lesson_grade'
);
SET @ddl := IF(@col_exists > 0,
  'ALTER TABLE attendances DROP COLUMN lesson_grade',
  'SELECT ''Cot lesson_grade khong ton tai'' AS msg'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;