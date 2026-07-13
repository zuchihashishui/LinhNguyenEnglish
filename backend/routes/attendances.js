const express = require('express');
const pool = require('../db');
const { requireTeacher } = require('../auth');

const router = express.Router();
router.use(requireTeacher);

// Validate diem: so nguyen hoac 1 chu so thap phan (vd 5.5, 8.5), trong khoang [1, 10].
function validateScore(val, label) {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  if (!Number.isFinite(n) || n < 1 || n > 10) return 'Điểm ' + label + ' phải trong khoảng 1 đến 10';
  // Cho phep toi da 1 chu so thap phan (5, 5.5; KHONG cho 5.25)
  if (Math.round(n * 10) !== n * 10) {
    return 'Điểm ' + label + ' chỉ được nhập tối đa 1 chữ số thập phân (vd 5.5, 8.5)';
  }
  return null;
}

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
    const err1 = validateScore(it.lesson_score, 'bài cũ');
    if (err1) return res.status(400).json({ error: err1 });
    const err2 = validateScore(it.exercise_score, 'bài tập');
    if (err2) return res.status(400).json({ error: err2 });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const it of items) {
      const isPresent = it.is_present ? 1 : 0;
      const videoDone = it.video_lesson_done ? 1 : 0;
      const exOnlineDone = it.exercise_online_done ? 1 : 0;
      const score = (it.lesson_score === '' || it.lesson_score === undefined || it.lesson_score === null)
        ? null : Number(it.lesson_score);
      const exScore = (it.exercise_score === '' || it.exercise_score === undefined || it.exercise_score === null)
        ? null : Number(it.exercise_score);
      const note = it.teacher_note || null;

      await conn.query(
        `INSERT INTO attendances (session_id, student_id, is_present, video_lesson_done, exercise_online_done,
                                  lesson_score, exercise_score, teacher_note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           is_present = VALUES(is_present),
           video_lesson_done = VALUES(video_lesson_done),
           exercise_online_done = VALUES(exercise_online_done),
           lesson_score = VALUES(lesson_score),
           exercise_score = VALUES(exercise_score),
           teacher_note = VALUES(teacher_note),
           updated_at = CURRENT_TIMESTAMP`,
        [sessionId, it.student_id, isPresent, videoDone, exOnlineDone, score, exScore, note]
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
