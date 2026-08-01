// =====================================================
// routes/students.js
// Học sinh của 1 lớp (chỉ giáo viên phụ trách hoặc admin)
// =====================================================
const express = require('express');
const pool = require('../db');
const { requireTeacher } = require('../auth');

const router = express.Router();
router.use(requireTeacher);

async function canAccessClass(req, classId) {
  if (req.teacher.is_admin) return true;
  const [rows] = await pool.query('SELECT teacher_id FROM classes WHERE id = ?', [classId]);
  if (rows.length === 0) return false;
  return Number(rows[0].teacher_id) === req.teacher.id;
}

// GET /api/classes/:id/students
router.get('/classes/:id/students', async (req, res) => {
  if (!await canAccessClass(req, req.params.id)) {
    return res.status(403).json({ error: 'Bạn không phụ trách lớp này' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, class_id, full_name, student_code, gender, date_of_birth, created_at \
       FROM students WHERE class_id = ? ORDER BY full_name ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/classes/:id/students
router.post('/classes/:id/students', async (req, res) => {
  if (!await canAccessClass(req, req.params.id)) {
    return res.status(403).json({ error: 'Bạn không phụ trách lớp này' });
  }
  const { full_name, student_code, gender, date_of_birth } = req.body || {};
  if (!full_name || !full_name.trim()) {
    return res.status(400).json({ error: 'Họ tên không được để trống' });
  }
  if (!student_code || !student_code.trim()) {
    return res.status(400).json({ error: 'Mã học sinh không được để trống' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO students (class_id, full_name, student_code, gender, date_of_birth) \
       VALUES (?, ?, ?, ?, ?)',
      [req.params.id, full_name.trim(), student_code.trim(), gender || null, date_of_birth || null]
    );
    res.status(201).json({
      id: result.insertId,
      class_id: Number(req.params.id),
      full_name,
      student_code,
      gender: gender || null,
      date_of_birth: date_of_birth || null,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Mã học sinh đã tồn tại' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/students/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT class_id FROM students WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    if (!await canAccessClass(req, rows[0].class_id)) {
      return res.status(403).json({ error: 'Bạn không phụ trách lớp của HS này' });
    }
    await pool.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id  (lấy thông tin 1 học sinh)
router.get('/students/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, class_id, full_name, student_code, gender, date_of_birth, created_at \
       FROM students WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    }
    if (!await canAccessClass(req, rows[0].class_id)) {
      return res.status(403).json({ error: 'Bạn không phụ trách lớp của HS này' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id/notes?year=&month=
// Trả về TẤT CẢ các buổi trong tháng của 1 học sinh (kể cả buổi vắng / không có teacher_note),
// kèm đầy đủ điểm bài cũ, điểm bài tập, trạng thái video bài cũ / bài tập online.
// total_notes vẫn đếm số buổi có teacher_note (để tương thích ngược với phần "Có N nhận xét").
router.get('/students/:id/notes', async (req, res) => {
  try {
    const studentId = req.params.id;
    const now = new Date();
    const year  = parseInt(req.query.year  || (now.getFullYear()), 10);
    const month = parseInt(req.query.month || (now.getMonth() + 1), 10);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'year/month không hợp lệ' });
    }
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to   = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const [sRows] = await pool.query('SELECT id, class_id, full_name, student_code FROM students WHERE id = ?', [studentId]);
    if (sRows.length === 0) return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    if (!await canAccessClass(req, sRows[0].class_id)) {
      return res.status(403).json({ error: 'Bạn không phụ trách lớp của HS này' });
    }

    // Lấy TẤT CẢ buổi trong tháng (kể cả buổi HS chưa được tick attendance) để LLM có dữ liệu chính xác.
    // Trước đây JOIN attendances vô tình loại bỏ buổi HS chưa tick → LLM tưởng HS không có buổi nào.
    const [rows] = await pool.query(
      `SELECT s.id AS session_id, s.session_date, s.title AS session_title,
              s.has_exercise_online,
              a.id AS attendance_id,
              a.teacher_note, a.lesson_score, a.exercise_score, a.is_present,
              a.video_lesson_done, a.exercise_online_done
         FROM sessions s
         LEFT JOIN attendances a
           ON a.session_id = s.id
          AND a.student_id = ?
        WHERE s.class_id = ?
          AND s.session_date BETWEEN ? AND ?
        ORDER BY s.session_date ASC`,
      [studentId, sRows[0].class_id, from, to]
    );

    // Chuẩn hoá: nếu HS chưa tick 1 buổi nào, attendance_id sẽ null → is_present, điểm, note cũng null.
    const normalized = rows.map(r => ({
      session_id: r.session_id,
      session_date: r.session_date,
      session_title: r.session_title,
      teacher_note: r.teacher_note,
      lesson_score: r.lesson_score,
      exercise_score: r.exercise_score,
      is_present: r.is_present,
      video_lesson_done: r.video_lesson_done,
      exercise_online_done: r.exercise_online_done,
    }));

    const total_notes = normalized.filter(r => r.teacher_note && String(r.teacher_note).trim() !== '').length;
    res.json({
      student: sRows[0],
      period: { year, month, from, to },
      total_notes,
      total_sessions_in_month: normalized.length,
      notes: normalized,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id/stats
router.get('/students/:id/stats', async (req, res) => {
  try {
    const [agg] = await pool.query(
      `SELECT
         COUNT(se.id) AS total_sessions,
         SUM(CASE WHEN a.is_present = 1 THEN 1 ELSE 0 END) AS present_count,
         SUM(CASE WHEN a.is_present = 0 THEN 1 ELSE 0 END) AS absent_count,
         SUM(CASE WHEN a.video_lesson_done    = 1 THEN 1 ELSE 0 END) AS video_done_count,
         -- Chi dem bai tap online khi GV tick co bai tap
         SUM(CASE WHEN se.has_exercise_online = 1 AND a.exercise_online_done = 1 THEN 1 ELSE 0 END) AS exercise_done_count,
         ROUND(AVG(a.lesson_score),   2) AS avg_lesson_score,
         -- Chi tinh diem bai tap khi buoi co bai tap
         ROUND(AVG(CASE WHEN se.has_exercise_online = 1 THEN a.exercise_score END), 2) AS avg_exercise_score
       FROM sessions se
       LEFT JOIN attendances a ON a.session_id = se.id AND a.student_id = ?
       WHERE se.class_id = ? AND se.session_date BETWEEN ? AND ?`,
      [studentId, sRows[0].class_id, from, to]
    );
    res.json(agg[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/students/:id  - sửa thông tin học sinh
router.put('/students/:id', async (req, res) => {
  const { full_name, student_code, gender, date_of_birth } = req.body || {};
  try {
    const [rows] = await pool.query('SELECT class_id FROM students WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    if (!await canAccessClass(req, rows[0].class_id)) {
      return res.status(403).json({ error: 'Bạn không phụ trách lớp của HS này' });
    }
    const fields = [];
    const params = [];
    if (full_name !== undefined) {
      if (!String(full_name).trim()) return res.status(400).json({ error: 'Họ tên không được để trống' });
      fields.push('full_name = ?');
      params.push(String(full_name).trim());
    }
    if (student_code !== undefined) {
      if (!String(student_code).trim()) return res.status(400).json({ error: 'Mã học sinh không được để trống' });
      fields.push('student_code = ?');
      params.push(String(student_code).trim());
    }
    if (gender !== undefined) {
      const allowed = ['M', 'F', 'O', null, ''];
      if (!allowed.includes(gender)) {
        return res.status(400).json({ error: 'Giới tính không hợp lệ (M/F/O)' });
      }
      fields.push('gender = ?');
      params.push(gender || null);
    }
    if (date_of_birth !== undefined) {
      if (date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)) {
        return res.status(400).json({ error: 'Ngày sinh phải có định dạng yyyy-MM-dd' });
      }
      fields.push('date_of_birth = ?');
      params.push(date_of_birth || null);
    }
    if (fields.length === 0) return res.status(400).json({ error: 'Không có trường nào để cập nhật' });
    params.push(req.params.id);
    await pool.query('UPDATE students SET ' + fields.join(', ') + ' WHERE id = ?', params);

    const [updated] = await pool.query(
      'SELECT id, class_id, full_name, student_code, gender, date_of_birth, created_at FROM students WHERE id = ?',
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Mã học sinh đã tồn tại' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id/history?year=&month=
// Trả 1 lần: info HS + stats tháng + danh sách buổi học (kèm điểm danh).
// Thay thế cho N+1 query ở frontend renderStudentStats.
router.get('/students/:id/history', async (req, res) => {
  const studentId = req.params.id;
  const now = new Date();
  const year  = parseInt(req.query.year  || (now.getFullYear()), 10);
  const month = parseInt(req.query.month || (now.getMonth() + 1), 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: 'year/month không hợp lệ' });
  }
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to   = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  try {
    const [sRows] = await pool.query(
      'SELECT id, class_id, full_name, student_code, gender, date_of_birth, created_at FROM students WHERE id = ?',
      [studentId]
    );
    if (sRows.length === 0) return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    if (!await canAccessClass(req, sRows[0].class_id)) {
      return res.status(403).json({ error: 'Bạn không phụ trách lớp của HS này' });
    }

    // Tổng quan tháng (1 query)
    const [monthAgg] = await pool.query(
      `SELECT
         COUNT(se.id) AS total_sessions,
         SUM(CASE WHEN a.is_present = 1 THEN 1 ELSE 0 END) AS present_count,
         SUM(CASE WHEN a.is_present = 0 THEN 1 ELSE 0 END) AS absent_count,
         SUM(CASE WHEN a.video_lesson_done    = 1 THEN 1 ELSE 0 END) AS video_done_count,
         SUM(CASE WHEN se.has_exercise_online = 1 AND a.exercise_online_done = 1 THEN 1 ELSE 0 END) AS exercise_done_count,
         ROUND(AVG(a.lesson_score),   2) AS avg_lesson_score,
         ROUND(AVG(CASE WHEN se.has_exercise_online = 1 THEN a.exercise_score END), 2) AS avg_exercise_score
       FROM sessions se
       LEFT JOIN attendances a ON a.session_id = se.id AND a.student_id = ?
       WHERE se.class_id = ? AND se.session_date BETWEEN ? AND ?`,
      [studentId, sRows[0].class_id, from, to]
    );

    // Tổng quan all-time (1 query) - join sessions để lọc theo has_exercise_online
    const [allAgg] = await pool.query(
      `SELECT
         COUNT(*) AS total_sessions,
         SUM(CASE WHEN a.is_present = 1 THEN 1 ELSE 0 END) AS present_count,
         SUM(CASE WHEN a.is_present = 0 THEN 1 ELSE 0 END) AS absent_count,
         SUM(CASE WHEN a.video_lesson_done    = 1 THEN 1 ELSE 0 END) AS video_done_count,
         SUM(CASE WHEN se.has_exercise_online = 1 AND a.exercise_online_done = 1 THEN 1 ELSE 0 END) AS exercise_done_count,
         ROUND(AVG(a.lesson_score),   2) AS avg_lesson_score,
         ROUND(AVG(CASE WHEN se.has_exercise_online = 1 THEN a.exercise_score END), 2) AS avg_exercise_score
       FROM attendances a
       JOIN sessions se ON se.id = a.session_id
       WHERE a.student_id = ?`,
      [studentId]
    );

// Danh sách buổi học trong tháng + attendance (1 query)
    const [details] = await pool.query(
      `SELECT se.id AS session_id, se.session_date, se.title,
              a.is_present, a.video_lesson_done, a.exercise_online_done,
              a.lesson_score, a.exercise_score, a.teacher_note
        FROM sessions se
        LEFT JOIN attendances a ON a.session_id = se.id AND a.student_id = ?
       WHERE se.class_id = ? AND se.session_date BETWEEN ? AND ?
       ORDER BY se.session_date ASC`,
      [studentId, sRows[0].class_id, from, to]
    );

    res.json({
      student: sRows[0],
      period: { year, month, from, to },
      month_stats: monthAgg[0],
      all_stats: allAgg[0],
      details,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
