-- =====================================================
-- Migration 002: them cot exercise_score
-- Ngay 2026-06-15 - them cot diem bai tap (1-10) vao bang attendances
-- Idempotent: chay lai khong loi
-- =====================================================

-- Them cot exercise_score neu chua co
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attendances'
    AND COLUMN_NAME = 'exercise_score'
);

SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE attendances ADD COLUMN exercise_score TINYINT DEFAULT NULL COMMENT ''Điểm bài tập (1-10)'' AFTER lesson_grade',
  'SELECT ''Cot exercise_score da ton tai'' AS msg'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Them CHECK constraint neu chua co (MySQL 8.0.16+)
SET @cons_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attendances'
    AND CONSTRAINT_NAME = 'chk_exercise_score'
);

SET @ddl := IF(@cons_exists = 0,
  'ALTER TABLE attendances ADD CONSTRAINT chk_exercise_score CHECK (exercise_score IS NULL OR (exercise_score BETWEEN 1 AND 10))',
  'SELECT ''Constraint chk_exercise_score da ton tai'' AS msg'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
