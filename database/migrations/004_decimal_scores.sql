-- =====================================================
-- Migration 004: cho phep diem thap phan (1 chu so)
-- lesson_score & exercise_score: TINYINT -> DECIMAL(3,1)
-- Tuong thich nguoc: du lieu cu (TINYINT) duoc MySQL tu cast
-- (vd 8 -> 8.0) khong mat du lieu.
-- Idempotent: chay lai nhieu lan khong loi.
-- =====================================================

SET @db := DATABASE();

-- 1) lesson_score -> DECIMAL(3,1)
SET @col_type := (
  SELECT DATA_TYPE FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME   = 'attendances'
    AND COLUMN_NAME  = 'lesson_score'
);
SET @ddl := IF(@col_type IS NULL,
  'SELECT ''Khong tim thay cot lesson_score - kiem tra schema'' AS msg',
  IF(@col_type <> 'decimal',
    'ALTER TABLE attendances MODIFY COLUMN lesson_score DECIMAL(3,1) DEFAULT NULL',
    'SELECT ''lesson_score da la DECIMAL - khong can doi'' AS msg'
  )
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) exercise_score -> DECIMAL(3,1)
SET @col_type := (
  SELECT DATA_TYPE FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME   = 'attendances'
    AND COLUMN_NAME  = 'exercise_score'
);
SET @ddl := IF(@col_type IS NULL,
  'SELECT ''Khong tim thay cot exercise_score (hay chay migration 002 truoc)'' AS msg',
  IF(@col_type <> 'decimal',
    'ALTER TABLE attendances MODIFY COLUMN exercise_score DECIMAL(3,1) DEFAULT NULL COMMENT ''Điểm bài tập (1-10, cho phep thap phan 0.5)''',
    'SELECT ''exercise_score da la DECIMAL - khong can doi'' AS msg'
  )
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Dam bao CHECK constraint ton tai (BETWEEN van hop le voi DECIMAL)
SET @cons_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME   = 'attendances'
    AND CONSTRAINT_NAME = 'chk_lesson_score'
);
SET @ddl := IF(@cons_exists = 0,
  'ALTER TABLE attendances ADD CONSTRAINT chk_lesson_score CHECK (lesson_score IS NULL OR (lesson_score BETWEEN 1 AND 10))',
  'SELECT ''chk_lesson_score da ton tai'' AS msg'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @cons_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME   = 'attendances'
    AND CONSTRAINT_NAME = 'chk_exercise_score'
);
SET @ddl := IF(@cons_exists = 0,
  'ALTER TABLE attendances ADD CONSTRAINT chk_exercise_score CHECK (exercise_score IS NULL OR (exercise_score BETWEEN 1 AND 10))',
  'SELECT ''chk_exercise_score da ton tai'' AS msg'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Migration 004 hoan tat: lesson_score & exercise_score = DECIMAL(3,1)' AS done;
