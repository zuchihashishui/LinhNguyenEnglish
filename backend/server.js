require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const USE_MOCK = process.env.USE_MOCK === '1' || process.env.USE_MOCK === 'true';

app.use(cors());
app.use(express.json());

// Phục vụ frontend tĩnh (no-cache để phát triển dễ thấy thay đổi)
app.use(express.static(path.join(__dirname, '..', 'frontend'), {
  setHeaders: (res) => { res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate'); }
}));

// ---------- Mount API: chọn chế độ mock hoặc MySQL ----------
if (USE_MOCK) {
  const { classesRouter, apiRouter } = require('./routes/mock');
  app.use('/api/classes', classesRouter);
  app.use('/api', apiRouter);
  console.log('🧪 Chế độ MOCK (in-memory) - không cần MySQL');
  console.log('   Đã nạp sẵn 1 lớp "Lớp 10A1 - Tiếng Anh" với 10 học sinh và 1 buổi học hôm nay.');
} else {
  // Kiểm tra kết nối DB khi khởi động
  const pool = require('./db');
  pool.getConnection()
    .then((conn) => {
      console.log('✅ Đã kết nối MySQL');
      conn.release();
    })
    .catch((err) => {
      console.error('❌ Lỗi kết nối MySQL:', err.message);
      console.error('   Gợi ý: chạy với USE_MOCK=1 để dùng dữ liệu giả lập (xem README).');
    });

  const authRouter        = require('./routes/auth');
  const teachersRouter    = require('./routes/teachers');
  const classesRouter     = require('./routes/classes');
  const studentsRouter    = require('./routes/students');
  const sessionsRouter    = require('./routes/sessions');
  const attendancesRouter = require('./routes/attendances');
  const statsRouter       = require('./routes/stats');
  const aiRouter          = require('./routes/ai');

  app.use('/api/auth', authRouter);
  app.use('/api/teachers', teachersRouter);
  app.use('/api/classes', classesRouter);
  app.use('/api', studentsRouter);
  app.use('/api', sessionsRouter);
  app.use('/api', attendancesRouter);
  app.use('/api/classes', statsRouter);
  app.use('/api/ai', aiRouter);
}

// Health check (cho cả 2 chế độ)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, mode: USE_MOCK ? 'mock' : 'mysql', time: new Date().toISOString() });
});

// Fallback: trả về index.html cho các route không phải /api
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`   Mở trình duyệt: http://localhost:${PORT}/`);
});
