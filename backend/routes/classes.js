const express = require('express');
const pool = require('../db');
const { requireTeacher } = require('../auth');

const router = express.Router();

// Tất cả route lớp đều yêu cầu đăng nhập
router.use(requireTeacher);

// GET /api/classes
// - Admin: thấy tất cả lớp
// - Teacher thường: chỉ thấy lớp do mình phụ trách (teacher_id = req.teacher.id)
router.get('/', async (req, res) => {
  try {
    let rows;
    if (req.teacher.is_admin) {
      [rows] = await pool.query(
        `SELECT c.id, c.name, c.grade_level, c.teacher_id, c.created_at, t.full_name AS teacher_name
         FROM classes c
         LEFT JOIN teachers t ON t.id = c.teacher_id
         ORDER BY c.id DESC`
      );
    } else {
      [rows] = await pool.query(
        `SELECT c.id, c.name, c.grade_level, c.teacher_id, c.created_at, t.full_name AS teacher_name
         FROM classes c
         LEFT JOIN teachers t ON t.id = c.teacher_id
         WHERE c.teacher_id = ?
         ORDER BY c.id DESC`,
        [req.teacher.id]
      );
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/classes
// - Admin: tạo lớp và chỉ định teacher_id tuỳ ý
// - Teacher: tạo lớp mặc định gán cho chính mình
router.post('/', async (req, res) => {
  const { name, grade_level, teacher_id } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Tên lớp không được để trống' });
  }
  try {
    let finalTeacherId = null;
    if (req.teacher.is_admin) {
      finalTeacherId = teacher_id ? Number(teacher_id) : null;
    } else {
      finalTeacherId = req.teacher.id;
    }
    const [result] = await pool.query(
      'INSERT INTO classes (name, grade_level, teacher_id) VALUES (?, ?, ?)',
      [name.trim(), grade_level || null, finalTeacherId]
    );
    res.status(201).json({
      id: result.insertId,
      name,
      grade_level: grade_level || null,
      teacher_id: finalTeacherId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/classes/:id
// - Admin: sửa mọi trường (name, grade_level, teacher_id)
// - Teacher thường: chỉ sửa được lớp của mình, không đổi teacher_id
router.put('/:id', async (req, res) => {
  const { name, grade_level, teacher_id } = req.body || {};
  try {
    const [rows] = await pool.query('SELECT teacher_id FROM classes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy lớp' });
    }
    if (!req.teacher.is_admin && Number(rows[0].teacher_id) !== req.teacher.id) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa lớp này' });
    }

    const fields = [];
    const params = [];
    if (name !== undefined) {
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'Tên lớp không được để trống' });
      }
      fields.push('name = ?');
      params.push(String(name).trim());
    }
    if (grade_level !== undefined) {
      fields.push('grade_level = ?');
      params.push(grade_level ? String(grade_level).trim() : null);
    }
    if (teacher_id !== undefined) {
      // Chỉ admin mới được đổi giáo viên phụ trách
      if (!req.teacher.is_admin) {
        return res.status(403).json({ error: 'Chỉ quản trị viên mới được đổi giáo viên phụ trách' });
      }
      fields.push('teacher_id = ?');
      params.push(teacher_id ? Number(teacher_id) : null);
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Không có trường nào để cập nhật' });
    }
    params.push(req.params.id);
    await pool.query('UPDATE classes SET ' + fields.join(', ') + ' WHERE id = ?', params);

    const [updated] = await pool.query(
      `SELECT c.id, c.name, c.grade_level, c.teacher_id, c.created_at, t.full_name AS teacher_name
       FROM classes c LEFT JOIN teachers t ON t.id = c.teacher_id WHERE c.id = ?`,
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/classes/:id
// - Teacher thường chỉ xoá được lớp của mình
router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT teacher_id FROM classes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy lớp' });
    }
    if (!req.teacher.is_admin && Number(rows[0].teacher_id) !== req.teacher.id) {
      return res.status(403).json({ error: 'Bạn không có quyền xoá lớp này' });
    }
    await pool.query('DELETE FROM classes WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
