// migrate-add-exercise-score.js
// Them cot exercise_score vao bang attendances (DB dang co du lieu).
// Chay:  node migrate-add-exercise-score.js
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'linh_english_attendance',
    charset: 'utf8mb4',
  });

  // Kiem tra cot da ton tai chua
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'attendances' AND COLUMN_NAME = 'exercise_score'`,
    [process.env.DB_NAME || 'linh_english_attendance']
  );
  if (cols.length > 0) {
    console.log('Cot exercise_score da ton tai - khong can them.');
  } else {
    console.log('Dang them cot exercise_score...');
    await conn.query(
      `ALTER TABLE attendances
       ADD COLUMN exercise_score TINYINT DEFAULT NULL COMMENT 'Điểm bài tập (1-10)' AFTER lesson_grade`
    );
    console.log('  OK da them cot.');
  }

  // Them constraint CHECK (MySQL 8.0.16+ moi enforce)
  const [cons] = await conn.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'attendances' AND CONSTRAINT_NAME = 'chk_exercise_score'`,
    [process.env.DB_NAME || 'linh_english_attendance']
  );
  if (cons.length === 0) {
    console.log('Dang them constraint chk_exercise_score...');
    try {
      await conn.query(
        `ALTER TABLE attendances
         ADD CONSTRAINT chk_exercise_score CHECK (exercise_score IS NULL OR (exercise_score BETWEEN 1 AND 10))`
      );
      console.log('  OK da them constraint.');
    } catch (e) {
      console.log('  Khong them duoc constraint (co the MySQL < 8.0.16):', e.message);
    }
  } else {
    console.log('Constraint chk_exercise_score da ton tai.');
  }

  console.log('\nMigration hoan tat!');
  await conn.end();
})().catch((e) => { console.error('Loi:', e); process.exit(1); });
