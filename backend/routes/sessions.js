// =====================================================
// routes/sessions.js
// Buổi học + điểm danh (chỉ giáo viên phụ trách hoặc admin)
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

// GET /api/classes/:id/sessions
router.get('/classes/:id/sessions', async (req, res) => {
  if (!await canAccessClass(req, req.params.id)) {
    return res.status(403).json({ error: 'Bạn không phụ trách lớp này' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, class_id, session_date, title, note, created_at \
       FROM sessions WHERE class_id = ? ORDER BY session_date DESC, id DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/classes/:id/sessions
router.post('/classes/:id/sessions', async (req, res) => {
  if (!await canAccessClass(req, req.params.id)) {
    return res.status(403).json({ error: 'Bạn không phụ trách lớp này' });
  }
  const { session_date, title, note } = req.body || {};
  if (!session_date) {
    return res.status(400).json({ error: 'Ngày học không được để trống' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO sessions (class_id, session_date, title, note) VALUES (?, ?, ?, ?)',
      [req.params.id, session_date, title || null, note || null]
    );
    res.status(201).json({
      id: result.insertId,
      class_id: Number(req.params.id),
      session_date,
      title: title || null,
      note: note || null,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Lớp này đã có buổi học trong ngày này rồi' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id  (kèm danh sách điểm danh)
router.get('/sessions/:id', async (req, res) => {
  try {
    const [sessionRows] = await pool.query(
      'SELECT id, class_id, session_date, title, note, created_at FROM sessions WHERE id = ?',
      [req.params.id]
    );
    if (sessionRows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy buổi học' });
    }
    const session = sessionRows[0];
    if (!await canAccessClass(req, session.class_id)) {
      return res.status(403).json({ error: 'Bạn không phụ trách lớp này' });
    }
    const [attendances] = await pool.query(
      `SELECT s.id AS student_id, s.full_name, s.student_code,
              a.id AS attendance_id, a.is_present, a.video_lesson_done, a.exercise_online_done,
              a.lesson_score, a.lesson_grade, a.exercise_score, a.teacher_note
       FROM students s
       LEFT JOIN attendances a ON a.session_id = ? AND a.student_id = s.id
       WHERE s.class_id = ?
       ORDER BY s.full_name ASC`,
      [req.params.id, session.class_id]
    );
    res.json({ session, attendances });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sessions/:id  - sửa title / note / session_date
router.put('/sessions/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT class_id FROM sessions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy buổi học' });
    if (!await canAccessClass(req, rows[0].class_id)) {
      return res.status(403).json({ error: 'Bạn không phụ trách lớp này' });
    }
    const { session_date, title, note } = req.body || {};
    const fields = [];
    const params = [];
    if (session_date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(session_date)) {
        return res.status(400).json({ error: 'Ngày học phải có định dạng yyyy-MM-dd' });
      }
      fields.push('session_date = ?');
      params.push(session_date);
    }
    if (title !== undefined) {
      fields.push('title = ?');
      params.push(title ? String(title).trim() : null);
    }
    if (note !== undefined) {
      fields.push('note = ?');
      params.push(note ? String(note) : null);
    }
    if (fields.length === 0) return res.status(400).json({ error: 'Không có trường nào để cập nhật' });
    params.push(req.params.id);
    await pool.query('UPDATE sessions SET ' + fields.join(', ') + ' WHERE id = ?', params);

    const [updated] = await pool.query(
      'SELECT id, class_id, session_date, title, note, created_at FROM sessions WHERE id = ?',
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Lớp này đã có buổi học trong ngày này rồi' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sessions/:id
router.delete('/sessions/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT class_id FROM sessions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy buổi học' });
    if (!await canAccessClass(req, rows[0].class_id)) {
      return res.status(403).json({ error: 'Bạn không phụ trách lớp này' });
    }
    await pool.query('DELETE FROM sessions WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
