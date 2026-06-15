const express = require('express');
const pool = require('../db');
const { requireTeacher } = require('../auth');

const router = express.Router();
router.use(requireTeacher);

const ALLOWED_GRADES = ['Tốt', 'Khá', 'Trung bình', 'Yếu'];

async function canAccessSession(req, sessionId) {
  const [rows] = await pool.query(
    'SELECT s.class_id, c.teacher_id FROM sessions s \
     JOIN classes c ON c.id = s.class_id WHERE s.id = ?',
    [sessionId]
  );
  if (rows.length === 0) return { ok: false, status: 404, error: 'Không tìm thấy buổi học' };
  if (!req.teacher.is_admin && Number(rows[0].teacher_id) !== req.teacher.id) {
    return { ok: false, status: 403, error: 'Bạn không phụ trách lớp này' };
  }
  return { ok: true };
}

// POST /api/sessions/:id/attendances
router.post('/sessions/:id/attendances', async (req, res) => {
  const sessionId = req.params.id;
  const access = await canAccessSession(req, sessionId);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Danh sách điểm danh không hợp lệ' });
  }

  for (const it of items) {
    if (!it.student_id) {
      return res.status(400).json({ error: 'Thiếu student_id' });
    }
    if (it.lesson_score !== null && it.lesson_score !== undefined && it.lesson_score !== '') {
      const n = Number(it.lesson_score);
      if (!Number.isInteger(n) || n < 1 || n > 10) {
        return res.status(400).json({ error: 'Điểm bài cũ phải là số nguyên từ 1 đến 10' });
      }
    }
    if (it.lesson_grade && !ALLOWED_GRADES.includes(it.lesson_grade)) {
      return res.status(400).json({ error: `Xếp loại không hợp lệ: ${it.lesson_grade}` });
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const it of items) {
      const isPresent = it.is_present ? 1 : 0;
      const score = (it.lesson_score === '' || it.lesson_score === undefined || it.lesson_score === null)
        ? null : Number(it.lesson_score);
      const grade = it.lesson_grade || null;
      const note = it.teacher_note || null;

      await conn.query(
        `INSERT INTO attendances (session_id, student_id, is_present, lesson_score, lesson_grade, teacher_note)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           is_present = VALUES(is_present),
           lesson_score = VALUES(lesson_score),
           lesson_grade = VALUES(lesson_grade),
           teacher_note = VALUES(teacher_note),
           updated_at = CURRENT_TIMESTAMP`,
        [sessionId, it.student_id, isPresent, score, grade, note]
      );
    }
    await conn.commit();
    res.json({ ok: true, count: items.length });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
