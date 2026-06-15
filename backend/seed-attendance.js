// seed-attendance.js
// Tạo dữ liệu điểm danh mẫu cho 10 ngày gần nhất (trong tháng hiện tại)
// cho tất cả các lớp, mỗi buổi điểm danh ngẫu nhiên cho 10 học sinh.
require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'linh_english_attendance';

const NOTES_PRESENT = [
  'Phát biểu tích cực, trả lời đúng.',
  'Hoàn thành tốt bài tập.',
  'Cần ôn thêm từ vựng.',
  'Chú ý nghe giảng hơn.',
  'Tích cực tham gia hoạt động nhóm.',
  null, null,  // một số HS không ghi nhận xét
];
const NOTES_ABSENT_EXCUSED = ['Xin nghỉ ốm', 'Có việc gia đình', null];
const NOTES_ABSENT_UNEXCUSED = ['Vắng không phép', null, null];

const TITLES = [
  'Unit 1: Family Life - Reading',
  'Unit 1: Family Life - Speaking',
  'Unit 1: Family Life - Listening',
  'Unit 1: Family Life - Writing',
  'Unit 2: Friends - Vocabulary',
  'Unit 2: Friends - Grammar',
  'Unit 2: Friends - Reading',
  'Unit 2: Friends - Speaking',
  'Unit 3: Teen Life - Vocabulary',
  'Unit 3: Teen Life - Reading',
  'Unit 3: Teen Life - Speaking',
  'Unit 3: Teen Life - Listening',
];

function gradeForScore(score) {
  if (score == null) return null;
  if (score >= 9) return 'Tốt';
  if (score >= 7) return 'Khá';
  if (score >= 5) return 'Trung bình';
  return 'Yếu';
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

(async () => {
  const conn = await mysql.createConnection({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME,
    charset: 'utf8mb4',
  });
  console.log('✔ Kết nối DB');

  // Lấy tất cả lớp
  const [classes] = await conn.query('SELECT id, name FROM classes ORDER BY id');
  console.log(`  Tìm thấy ${classes.length} lớp`);

  // Lấy tất cả học sinh theo lớp
  let totalSessionsCreated = 0;
  let totalAttendancesCreated = 0;

  for (const cls of classes) {
    const [students] = await conn.query('SELECT id FROM students WHERE class_id = ?', [cls.id]);
    if (students.length === 0) {
      console.log(`  Lớp ${cls.id} (${cls.name}): chưa có HS, bỏ qua`);
      continue;
    }

    // 10 ngày gần nhất (không tính hôm nay)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let classSessions = 0;
    for (let i = 10; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // Bỏ qua Chủ nhật (0) và Thứ 7 (6) - lớp không học
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const dateStr = ymd(d);

      // Check session đã tồn tại?
      const [existing] = await conn.query(
        'SELECT id FROM sessions WHERE class_id = ? AND session_date = ?',
        [cls.id, dateStr]
      );
      let sessionId;
      if (existing.length > 0) {
        sessionId = existing[0].id;
      } else {
        const title = pick(TITLES);
        const [r] = await conn.query(
          'INSERT INTO sessions (class_id, session_date, title, note) VALUES (?,?,?,?)',
          [cls.id, dateStr, title, 'Buổi học tự động']
        );
        sessionId = r.insertId;
        classSessions++;
        totalSessionsCreated++;
      }

      // Check attendances đã có?
      const [existingAtt] = await conn.query(
        'SELECT student_id FROM attendances WHERE session_id = ?', [sessionId]
      );
      if (existingAtt.length > 0) continue; // skip nếu đã có

      // Tạo điểm danh cho từng HS
      for (const st of students) {
        const r = Math.random();
        let isPresent, score, comment;

        if (r < 0.75) {
          // 75% có mặt
          isPresent = 1;
          score = 5 + Math.floor(Math.random() * 6); // 5-10
          comment = pick(NOTES_PRESENT);
        } else if (r < 0.85) {
          // 10% vắng có phép
          isPresent = 0;
          score = null;
          comment = pick(NOTES_ABSENT_EXCUSED);
        } else {
          // 15% vắng không phép
          isPresent = 0;
          score = null;
          comment = pick(NOTES_ABSENT_UNEXCUSED);
        }

        await conn.query(
          'INSERT INTO attendances (session_id, student_id, is_present, lesson_score, lesson_grade, teacher_note) VALUES (?,?,?,?,?,?)',
          [sessionId, st.id, isPresent, score, score != null ? gradeForScore(score) : null, comment]
        );
        totalAttendancesCreated++;
      }
    }

    console.log(`  Lớp ${cls.id} (${cls.name}, ${students.length} HS): +${classSessions} buổi mới`);
  }

  console.log(`\n✔ TỔNG KẾT:`);
  console.log(`  Sessions tạo mới:  ${totalSessionsCreated}`);
  console.log(`  Attendances tạo mới: ${totalAttendancesCreated}`);

  // Thống kê theo lớp
  const [stats] = await conn.query(`
    SELECT c.id, c.name,
      COUNT(DISTINCT s.id) AS num_sessions,
      COUNT(a.id) AS num_attendances,
      SUM(CASE WHEN a.is_present = 1 THEN 1 ELSE 0 END) AS num_present
    FROM classes c
    LEFT JOIN sessions s ON s.class_id = c.id
    LEFT JOIN attendances a ON a.session_id = s.id
    GROUP BY c.id, c.name
    ORDER BY c.id
  `);
  console.log('\nThống kê hiện tại:');
  console.table(stats);

  await conn.end();
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
