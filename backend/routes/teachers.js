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

module.exports = router;
