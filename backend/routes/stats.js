// =====================================================
// routes/stats.js
// Thống kê điểm danh theo tháng cho 1 lớp
// =====================================================
const express = require('express');
const pool = require('../db');
const { requireTeacher } = require('../auth');

const router = express.Router();
router.use(requireTeacher);

router.get('/:id/stats', async (req, res) => {
  // Check quyền
  const [clsCheck] = await pool.query('SELECT id, teacher_id FROM classes WHERE id = ?', [req.params.id]);
  if (clsCheck.length === 0) {
    return res.status(404).json({ error: 'Không tìm thấy lớp' });
  }
  if (!req.teacher.is_admin && Number(clsCheck[0].teacher_id) !== req.teacher.id) {
    return res.status(403).json({ error: 'Bạn không phụ trách lớp này' });
  }

  const classId = Number(req.params.id);
  const today = new Date();
  const year = Number(req.query.year) || today.getFullYear();
  const month = Number(req.query.month) || (today.getMonth() + 1);

  if (month < 1 || month > 12) {
    return res.status(400).json({ error: 'Tháng không hợp lệ (1-12)' });
  }

  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  try {
    const [clsRows] = await pool.query(
      'SELECT id, name, grade_level, teacher_id FROM classes WHERE id = ?',
      [classId]
    );
    const [sessRows] = await pool.query(
      'SELECT COUNT(*) AS n FROM sessions WHERE class_id = ? AND session_date BETWEEN ? AND ?',
      [classId, from, to]
    );
    const totalSessions = sessRows[0].n;

    const [rows] = await pool.query(
      `SELECT
         s.id           AS student_id,
         s.full_name    AS full_name,
         s.student_code AS student_code,
         SUM(CASE WHEN a.is_present = 1 THEN 1 ELSE 0 END) AS present_count,
         SUM(CASE WHEN a.is_present = 0 THEN 1 ELSE 0 END) AS absent_count,
         ROUND(AVG(a.lesson_score), 2) AS avg_score
       FROM students s
       LEFT JOIN sessions se
         ON se.class_id = s.class_id
         AND se.session_date BETWEEN ? AND ?
       LEFT JOIN attendances a
         ON a.session_id = se.id
         AND a.student_id = s.id
       WHERE s.class_id = ?
       GROUP BY s.id, s.full_name, s.student_code
       ORDER BY s.full_name ASC`,
      [from, to, classId]
    );

    const students = rows.map((r) => {
      const total = Number(r.present_count || 0) + Number(r.absent_count || 0);
      const rate = total > 0 ? Math.round((Number(r.present_count) / total) * 100) : 0;
      // Tổng số buổi của lớp trong tháng mà HS có thể điểm danh = total_sessions
      // Số buổi HS chưa được tick (do GV quên tick) = total_sessions - total_marked
      const unmarked = totalSessions - total;
      return {
        student_id: r.student_id,
        full_name: r.full_name,
        student_code: r.student_code,
        present_count: Number(r.present_count || 0),
        absent_count: Number(r.absent_count || 0),
        unmarked_count: Math.max(0, unmarked),
        total_marked: total,
        attendance_rate: rate,
        avg_score: r.avg_score != null ? Number(r.avg_score) : null,
      };
    });

    res.json({
      class: clsRows[0],
      period: { year, month, from, to, last_day: lastDay },
      total_sessions: totalSessions,
      students,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
