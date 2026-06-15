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
// Trả về danh sách nhận xét (teacher_note) theo tháng của 1 học sinh
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

    const [rows] = await pool.query(
      `SELECT a.id, a.session_id, a.teacher_note, a.lesson_score, a.lesson_grade, a.is_present,
              s.session_date, s.title AS session_title
         FROM attendances a
         JOIN sessions s ON s.id = a.session_id
        WHERE a.student_id = ?
          AND s.session_date BETWEEN ? AND ?
          AND (a.teacher_note IS NOT NULL AND TRIM(a.teacher_note) <> '')
        ORDER BY s.session_date ASC`,
      [studentId, from, to]
    );

    res.json({
      student: sRows[0],
      period: { year, month, from, to },
      total_notes: rows.length,
      notes: rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id/stats
router.get('/students/:id/stats', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS total_sessions,
         SUM(CASE WHEN a.is_present = 1 THEN 1 ELSE 0 END) AS present_count,
         SUM(CASE WHEN a.is_present = 0 THEN 1 ELSE 0 END) AS absent_count,
         ROUND(AVG(a.lesson_score),   2) AS avg_lesson_score,
         ROUND(AVG(a.exercise_score), 2) AS avg_exercise_score
       FROM attendances a
       WHERE a.student_id = ?`,
      [req.params.id]
    );
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
