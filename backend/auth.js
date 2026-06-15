// =====================================================
// auth.js
// Helper xác thực giáo viên bằng header X-Teacher-Id.
// Mật khẩu hash bằng crypto.scrypt, lưu dạng "salt:hash".
// =====================================================
const crypto = require('crypto');
const pool = require('./db');

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plain, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(plain, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(plain, salt, 64).toString('hex');
  // Tránh timing attack bằng cách so sánh độ dài trước
  if (candidate.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
}

// Middleware: bắt buộc có X-Teacher-Id hợp lệ, gắn req.teacher
async function requireTeacher(req, res, next) {
  const tid = Number(req.header('X-Teacher-Id'));
  if (!tid) {
    return res.status(401).json({ error: 'Chưa đăng nhập. Thiếu header X-Teacher-Id.' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, username, full_name, is_admin FROM teachers WHERE id = ?',
      [tid]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Tài khoản không hợp lệ' });
    }
    req.teacher = rows[0];
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Middleware chỉ dành cho admin
function requireAdmin(req, res, next) {
  if (!req.teacher || !req.teacher.is_admin) {
    return res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền này' });
  }
  next();
}

module.exports = { hashPassword, verifyPassword, requireTeacher, requireAdmin };
