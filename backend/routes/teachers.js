// =====================================================
// routes/teachers.js
// Quản lý giáo viên (chỉ admin)
// =====================================================
const express = require('express');
const pool = require('../db');
const { hashPassword, requireTeacher, requireAdmin } = require('../auth');

const router = express.Router();

// GET /api/teachers  - chỉ admin
router.get('/', requireTeacher, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, full_name, is_admin, created_at FROM teachers ORDER BY id ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/teachers  - tạo GV mới (chỉ admin)
router.post('/', requireTeacher, requireAdmin, async (req, res) => {
  const { username, password, full_name, is_admin } = req.body || {};
  if (!username || !password || !full_name) {
    return res.status(400).json({ error: 'Thiếu username / password / full_name' });
  }
  if (String(password).length < 4) {
    return res.status(400).json({ error: 'Mật khẩu phải ít nhất 4 ký tự' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO teachers (username, password_hash, full_name, is_admin) VALUES (?, ?, ?, ?)',
      [String(username).trim(), hashPassword(String(password)), String(full_name).trim(), is_admin ? 1 : 0]
    );
    res.status(201).json({
      id: result.insertId,
      username: String(username).trim(),
      full_name: String(full_name).trim(),
      is_admin: !!is_admin,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username đã tồn tại' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/teachers/:id  - sửa họ tên + quyền admin (chỉ admin)
router.put('/:id', requireTeacher, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { full_name, is_admin } = req.body || {};
  try {
    const [rows] = await pool.query('SELECT id FROM teachers WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy giáo viên' });
    }
    const fields = [];
    const params = [];
    if (full_name !== undefined) {
      if (!String(full_name).trim()) {
        return res.status(400).json({ error: 'Họ tên không được để trống' });
      }
      fields.push('full_name = ?');
      params.push(String(full_name).trim());
    }
    if (is_admin !== undefined) {
      // Không cho tự hạ quyền chính mình
      if (id === req.teacher.id && !is_admin) {
        return res.status(400).json({ error: 'Không thể tự hạ quyền admin của chính mình' });
      }
      fields.push('is_admin = ?');
      params.push(is_admin ? 1 : 0);
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Không có trường nào để cập nhật' });
    }
    params.push(id);
    await pool.query('UPDATE teachers SET ' + fields.join(', ') + ' WHERE id = ?', params);

    const [updated] = await pool.query(
      'SELECT id, username, full_name, is_admin, created_at FROM teachers WHERE id = ?', [id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/teachers/:id  - chỉ admin, không cho xoá chính mình
router.delete('/:id', requireTeacher, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.teacher.id) {
    return res.status(400).json({ error: 'Không thể xoá tài khoản đang đăng nhập' });
  }
  try {
    await pool.query('DELETE FROM teachers WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/teachers/:id/reset-password  - chỉ admin, reset mật khẩu cho GV khác
// Body: { new_password, new_password_confirm }
router.put('/:id/reset-password', requireTeacher, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { new_password, new_password_confirm } = req.body || {};
  if (!new_password) {
    return res.status(400).json({ error: 'Vui lòng nhập mật khẩu mới' });
  }
  if (new_password_confirm !== undefined && new_password !== new_password_confirm) {
    return res.status(400).json({ error: 'Mật khẩu nhập lại không khớp' });
  }
  if (String(new_password).length < 4) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 4 ký tự' });
  }
  try {
    const [rows] = await pool.query('SELECT id, username, full_name FROM teachers WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy giáo viên' });
    }
    await pool.query('UPDATE teachers SET password_hash = ? WHERE id = ?', [hashPassword(String(new_password)), id]);
    res.json({
      ok: true,
      message: 'Đã reset mật khẩu cho ' + rows[0].full_name,
      teacher: { id: rows[0].id, username: rows[0].username, full_name: rows[0].full_name },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
