// =====================================================
// init-db.js
// Khởi tạo database + 5 bảng + seed dữ liệu mẫu bằng mysql2.
// Chạy:  node init-db.js
// =====================================================
require('dotenv').config();
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'linh_english_attendance';

// Hash mật khẩu bằng scrypt: lưu "salt:hash-hex" vào DB
function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plain, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function gradeForScore(score) {
  if (score == null) return null;
  if (score >= 9) return 'Tốt';
  if (score >= 7) return 'Khá';
  if (score >= 5) return 'Trung bình';
  return 'Yếu';
}

const NOTES_PRESENT = [
  'Phát biểu tích cực, trả lời đúng.',
  'Hoàn thành tốt bài tập.',
  'Cần ôn thêm từ vựng.',
  'Chú ý nghe giảng hơn.',
  'Tích cực tham gia hoạt động nhóm.',
];
const NOTE_ABSENT_EXCUSED = 'Xin nghỉ ốm';
const NOTE_ABSENT_UNEXCUSED = 'Vắng không phép';

(async () => {
  console.log('▶ Bước 1: Kết nối MySQL...');
  const root = await mysql.createConnection({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD,
    multipleStatements: true, charset: 'utf8mb4',
  });
  console.log(`  ✔ Kết nối ${DB_USER}@${DB_HOST}:${DB_PORT} thành công`);

  console.log('▶ Bước 2: Chạy schema...');
  const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
  await root.query(schemaSql);
  console.log('  ✔ Đã tạo database + 4 bảng (classes, students, sessions, attendances)');
  await root.end();

  console.log('▶ Bước 3: Kết nối lại vào database vừa tạo để seed...');
  const conn = await mysql.createConnection({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD,
    database: DB_NAME, charset: 'utf8mb4', dateStrings: true,
  });

  // Xoá dữ liệu cũ (nếu có) để seed sạch
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  await conn.query('TRUNCATE TABLE attendances');
  await conn.query('TRUNCATE TABLE sessions');
  await conn.query('TRUNCATE TABLE students');
  await conn.query('TRUNCATE TABLE classes');
  await conn.query('TRUNCATE TABLE teachers');
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');

  console.log('▶ Bước 4: Seed teachers (mật khẩu mặc định: 123456)...');
  const teachers = [
    { username: 'admin', full_name: 'Quản trị viên',  is_admin: 1 },
    { username: 'linh',  full_name: 'Lê Thị Linh',    is_admin: 0 },
    { username: 'mai',   full_name: 'Nguyễn Thị Mai', is_admin: 0 },
    { username: 'tuan',  full_name: 'Trần Minh Tuấn', is_admin: 0 },
  ];
  const teacherIds = {};
  for (const t of teachers) {
    const [r] = await conn.query(
      'INSERT INTO teachers (username, password_hash, full_name, is_admin) VALUES (?, ?, ?, ?)',
      [t.username, hashPassword('123456'), t.full_name, t.is_admin]
    );
    teacherIds[t.username] = r.insertId;
  }
  console.log(`  ✔ ${teachers.length} giáo viên (admin/linh/mai/tuan — pass: 123456)`);

  console.log('▶ Bước 5: Seed classes (gán giáo viên phụ trách)...');
  const [classRes] = await conn.query(
    "INSERT INTO classes (name, grade_level, teacher_id) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)",
    [
      'Lớp 10A1 - Tiếng Anh', 'Lớp 10', teacherIds.linh,
      'Lớp 11B2 - Tiếng Anh', 'Lớp 11', teacherIds.mai,
      'Lớp 12C3 - IELTS',     'Lớp 12', teacherIds.tuan,
    ]
  );
  const class1Id = classRes.insertId;
  const class2Id = classRes.insertId + 1;
  const class3Id = classRes.insertId + 2;
  console.log(`  ✔ Lớp 10A1 (linh) id=${class1Id}, Lớp 11B2 (mai) id=${class2Id}, Lớp 12C3 (tuan) id=${class3Id}`);

  console.log('▶ Bước 5: Seed students...');
  const class1Students = [
    ['Nguyễn Minh Anh', 'HS001', 'F', '2008-04-12'],
    ['Trần Quốc Bảo',   'HS002', 'M', '2008-08-25'],
    ['Lê Hồng Châu',    'HS003', 'F', '2008-02-09'],
    ['Phạm Gia Đức',    'HS004', 'M', '2008-11-30'],
    ['Hoàng Bảo Hân',   'HS005', 'F', '2008-06-18'],
    ['Vũ Khánh Huy',    'HS006', 'M', '2008-09-04'],
    ['Đặng Thùy Linh',  'HS007', 'F', '2008-01-22'],
    ['Bùi Quang Minh',  'HS008', 'M', '2008-05-15'],
    ['Đỗ Thanh Ngân',   'HS009', 'F', '2008-07-07'],
    ['Ngô Tuấn Phong',  'HS010', 'M', '2008-03-28'],
  ];
  const class2Students = [
    ['Đào Duy Thành',   'HS011', 'M', '2007-05-02'],
    ['Hà Kim Yến',      'HS012', 'F', '2007-09-14'],
  ];
  const class3Students = [
    ['Trương An Khang', 'HS013', 'M', '2006-03-10'],
    ['Lý Bảo Ngọc',     'HS014', 'F', '2006-08-22'],
    ['Phan Công Phú',   'HS015', 'M', '2006-12-05'],
  ];
  for (const s of class1Students) {
    await conn.query(
      'INSERT INTO students (class_id, full_name, student_code, gender, date_of_birth) VALUES (?,?,?,?,?)',
      [class1Id, ...s]
    );
  }
  for (const s of class2Students) {
    await conn.query(
      'INSERT INTO students (class_id, full_name, student_code, gender, date_of_birth) VALUES (?,?,?,?,?)',
      [class2Id, ...s]
    );
  }
  for (const s of class3Students) {
    await conn.query(
      'INSERT INTO students (class_id, full_name, student_code, gender, date_of_birth) VALUES (?,?,?,?,?)',
      [class3Id, ...s]
    );
  }
  console.log(`  ✔ Lớp 10A1: ${class1Students.length} HS, Lớp 11B2: ${class2Students.length} HS, Lớp 12C3: ${class3Students.length} HS`);

  console.log('▶ Bước 6: Seed sessions + attendances...');
  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };
  const sessions = [
    { classId: class1Id, date: daysAgo(7), title: 'Unit 1: Family Life - Reading',  note: 'Đọc hiểu bài Family Life.' },
    { classId: class1Id, date: daysAgo(2), title: 'Unit 2: Friends - Listening',    note: 'Luyện nghe chủ đề Friends.' },
    { classId: class1Id, date: daysAgo(1), title: 'Unit 3: Teen Life - Vocabulary', note: 'Học từ vựng chương 3.' },
    { classId: class1Id, date: daysAgo(0), title: 'Unit 3: Teen Life - Speaking',   note: 'Ôn tập từ vựng chương 3.' },
    { classId: class2Id, date: daysAgo(0), title: 'Unit 5: Travel - Speaking',      note: 'Nói về du lịch.' },
    { classId: class3Id, date: daysAgo(3), title: 'IELTS Speaking Part 1 - Intro',  note: 'Làm quen part 1.' },
    { classId: class3Id, date: daysAgo(0), title: 'IELTS Speaking Part 2 - Cue Card', note: 'Long turn.' },
  ];
  // Quy tắc điểm danh giống mock:
  //   sess 0: 9/10 có mặt, có điểm
  //   sess 1: 8/10 có mặt, có điểm
  //   sess 2: 10/10 có mặt, có điểm
  //   sess 3: 6/10 có mặt, có điểm (hôm nay 10A1)
  //   sess 4: 6/8  có mặt, có điểm (hôm nay 11B2)
  //   sess 5: 2/3  có mặt
  //   sess 6: 3/3  có mặt
  const presentRules = [9, 8, 10, 6, 6, 2, 3];
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    const [sessRes] = await conn.query(
      'INSERT INTO sessions (class_id, session_date, title, note) VALUES (?,?,?,?)',
      [s.classId, s.date, s.title, s.note]
    );
    const sessId = sessRes.insertId;

    // Lấy danh sách HS lớp đó, sort theo tên
    const [stuRows] = await conn.query(
      'SELECT id, full_name FROM students WHERE class_id = ? ORDER BY full_name ASC',
      [s.classId]
    );
    const presentCount = Math.min(presentRules[i], stuRows.length);
    for (let j = 0; j < stuRows.length; j++) {
      const st = stuRows[j];
      const present = j < presentCount;
      let score = null;
      if (present) {
        const r = Math.random();
        if (r < 0.3)      score = Math.floor(Math.random() * 2) + 9;   // 9-10
        else if (r < 0.8) score = Math.floor(Math.random() * 3) + 7;   // 7-9
        else              score = Math.floor(Math.random() * 2) + 5;   // 5-6
      }
      const note = present
        ? NOTES_PRESENT[Math.floor(Math.random() * NOTES_PRESENT.length)]
        : (j === presentCount ? NOTE_ABSENT_UNEXCUSED : NOTE_ABSENT_EXCUSED);
      await conn.query(
        'INSERT INTO attendances (session_id, student_id, is_present, lesson_score, lesson_grade, teacher_note) VALUES (?,?,?,?,?,?)',
        [sessId, st.id, present ? 1 : 0, score, present ? gradeForScore(score) : null, note]
      );
    }
  }
  console.log(`  ✔ ${sessions.length} buổi học + attendances tương ứng`);

  // Tổng kết
  const [t] = await conn.query('SELECT COUNT(*) AS n FROM teachers');
  const [c] = await conn.query('SELECT COUNT(*) AS n FROM classes');
  const [st] = await conn.query('SELECT COUNT(*) AS n FROM students');
  const [se] = await conn.query('SELECT COUNT(*) AS n FROM sessions');
  const [a] = await conn.query('SELECT COUNT(*) AS n FROM attendances');
  console.log('');
  console.log('=========================================');
  console.log(`✅ Database "${DB_NAME}" đã sẵn sàng:`);
  console.log(`   - teachers:    ${t[0].n}`);
  console.log(`   - classes:     ${c[0].n}`);
  console.log(`   - students:    ${st[0].n}`);
  console.log(`   - sessions:    ${se[0].n}`);
  console.log(`   - attendances: ${a[0].n}`);
  console.log('');
  console.log('🔑 Tài khoản giáo viên (mật khẩu: 123456):');
  console.log('   admin / linh / mai / tuan');
  console.log('=========================================');

  await conn.end();
})().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
