// =====================================================
// routes/auth.js
// POST /api/auth/login
// POST /api/auth/register
// POST /api/auth/change-password  (đổi mật khẩu - yêu cầu mk hiện tại đúng)
// =====================================================
const express = require('express');
const pool = require('../db');
const { verifyPassword, hashPassword, requireTeacher } = require('../auth');

const router = express.Router();

// Đăng ký giáo viên mới (ai cũng có thể gọi). Trả về {ok, teacher} giống login
// để frontend có thể lưu currentTeacher luôn.
router.post('/register', async (req, res) => {
  const { username, password, password_confirm, full_name } = req.body || {};
  if (!username || !password || !full_name) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ họ tên, tên đăng nhập và mật khẩu' });
  }
  if (password_confirm !== undefined && password !== password_confirm) {
    return res.status(400).json({ error: 'Mật khẩu nhập lại không khớp' });
  }
  if (String(username).length < 3) {
    return res.status(400).json({ error: 'Tên đăng nhập phải có ít nhất 3 ký tự' });
  }
  if (String(password).length < 4) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 4 ký tự' });
  }
  if (String(full_name).trim().length < 2) {
    return res.status(400).json({ error: 'Họ tên phải có ít nhất 2 ký tự' });
  }
  if (!/^[A-Za-z0-9_.-]+$/.test(String(username))) {
    return res.status(400).json({ error: 'Tên đăng nhập chỉ gồm chữ cái, số, _, ., -' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO teachers (username, password_hash, full_name, is_admin) VALUES (?, ?, ?, 0)',
      [
        String(username).trim().toLowerCase(),
        hashPassword(String(password)),
        String(full_name).trim(),
      ]
    );
    res.status(201).json({
      ok: true,
      teacher: {
        id: result.insertId,
        username: String(username).trim().toLowerCase(),
        full_name: String(full_name).trim(),
        is_admin: false,
      },
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Thiếu username hoặc password' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, username, password_hash, full_name, is_admin FROM teachers WHERE username = ?',
      [String(username).trim().toLowerCase()]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
    const t = rows[0];
    if (!verifyPassword(password, t.password_hash)) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
    res.json({
      ok: true,
      teacher: {
        id: t.id,
        username: t.username,
        full_name: t.full_name,
        is_admin: t.is_admin === 1,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Đổi mật khẩu: bắt buộc nhập đúng mật khẩu hiện tại
// Body: { current_password, new_password, new_password_confirm }
router.post('/change-password', requireTeacher, async (req, res) => {
  const { current_password, new_password, new_password_confirm } = req.body || {};
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' });
  }
  if (new_password_confirm !== undefined && new_password !== new_password_confirm) {
    return res.status(400).json({ error: 'Mật khẩu mới nhập lại không khớp' });
  }
  if (String(new_password).length < 4) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 4 ký tự' });
  }
  if (String(current_password) === String(new_password)) {
    return res.status(400).json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, password_hash FROM teachers WHERE id = ?',
      [req.teacher.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }
    if (!verifyPassword(current_password, rows[0].password_hash)) {
      return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });
    }
    await pool.query(
      'UPDATE teachers SET password_hash = ? WHERE id = ?',
      [hashPassword(String(new_password)), req.teacher.id]
    );
    res.json({ ok: true, message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
