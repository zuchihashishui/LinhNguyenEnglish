-- =====================================================
-- Database: linh_english_attendance
-- Hệ thống điểm danh học sinh - Linh English
-- =====================================================

DROP DATABASE IF EXISTS linh_english_attendance;
CREATE DATABASE linh_english_attendance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE linh_english_attendance;

-- ----------------------------------------------------
-- Bảng teachers: Giáo viên (tài khoản đăng nhập)
-- ----------------------------------------------------
CREATE TABLE teachers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)   NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  full_name     VARCHAR(100)  NOT NULL,
  is_admin      TINYINT(1)    NOT NULL DEFAULT 0,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- Bảng classes: Danh sách lớp học
-- ----------------------------------------------------
CREATE TABLE classes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)   NOT NULL,
  grade_level VARCHAR(50)    NULL,
  teacher_id  INT           DEFAULT NULL,
  created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_classes_teacher
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);

-- ----------------------------------------------------
-- Bảng students: Danh sách học sinh
-- ----------------------------------------------------
CREATE TABLE students (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  class_id      INT           NOT NULL,
  full_name     VARCHAR(100)  NOT NULL,
  student_code  VARCHAR(20)   NOT NULL UNIQUE,
  gender        ENUM('M','F','O') DEFAULT NULL,
  date_of_birth DATE          DEFAULT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_students_class
    FOREIGN KEY (class_id) REFERENCES classes(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_students_class_id ON students(class_id);

-- ----------------------------------------------------
-- Bảng sessions: Buổi học
-- ----------------------------------------------------
CREATE TABLE sessions (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  class_id     INT           NOT NULL,
  session_date DATE          NOT NULL,
  title        VARCHAR(150)  NULL,
  note         TEXT          NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_class
    FOREIGN KEY (class_id) REFERENCES classes(id)
    ON DELETE CASCADE,
  CONSTRAINT uq_sessions_class_date UNIQUE (class_id, session_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_sessions_class_id ON sessions(class_id);

-- ----------------------------------------------------
-- Bảng attendances: Điểm danh + điểm bài cũ + nhận xét
-- ----------------------------------------------------
CREATE TABLE attendances (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  session_id   INT           NOT NULL,
  student_id   INT           NOT NULL,
  is_present   TINYINT(1)    NOT NULL DEFAULT 0,
  lesson_score TINYINT       DEFAULT NULL,
  lesson_grade VARCHAR(20)   DEFAULT NULL,
  exercise_score TINYINT     DEFAULT NULL COMMENT 'Điểm bài tập (1-10)',
  teacher_note TEXT          NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_attendances_session
    FOREIGN KEY (session_id) REFERENCES sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_attendances_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE,
  CONSTRAINT uq_attendances_session_student UNIQUE (session_id, student_id),
  CONSTRAINT chk_lesson_score    CHECK (lesson_score    IS NULL OR (lesson_score    BETWEEN 1 AND 10)),
  CONSTRAINT chk_exercise_score  CHECK (exercise_score  IS NULL OR (exercise_score  BETWEEN 1 AND 10)),
  CONSTRAINT chk_lesson_grade    CHECK (lesson_grade    IS NULL OR lesson_grade IN ('Tốt','Khá','Trung bình','Yếu'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_attendances_session_id ON attendances(session_id);
CREATE INDEX idx_attendances_student_id ON attendances(student_id);

-- =====================================================
-- Dữ liệu mẫu (giáo viên + lớp sẽ được seed bằng init-db.js
-- vì password_hash cần sinh từ crypto.scrypt ở Node)
-- =====================================================
