// Routes giả lập - dùng khi USE_MOCK=1
// Cùng interface với routes/classes.js, students.js, sessions.js, attendances.js
// nhưng thao tác trên mockData (in-memory) thay vì MySQL.

const express = require('express');
const store = require('../mockData');

const ALLOWED_GRADES = ['Tốt', 'Khá', 'Trung bình', 'Yếu'];

const classesRouter = express.Router();
const apiRouter = express.Router(); // gắn /classes/:id/students, /students/:id, /classes/:id/sessions, /sessions/:id, /sessions/:id/attendances

// ---------- Classes ----------
classesRouter.get('/', (req, res) => {
  res.json([...store.classes].sort((a, b) => b.id - a.id));
});

classesRouter.post('/', (req, res) => {
  const { name, grade_level } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Tên lớp không được để trống' });
  }
  const row = {
    id: store.newId(),
    name: String(name).trim(),
    grade_level: grade_level || null,
    created_at: new Date().toISOString(),
  };
  store.classes.push(row);
  res.status(201).json(row);
});

classesRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = store.classes.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Không tìm thấy lớp' });
  store.classes.splice(idx, 1);
  // Xoá học sinh, buổi học, điểm danh liên quan
  for (let i = store.students.length - 1; i >= 0; i--) {
    if (store.students[i].class_id === id) store.students.splice(i, 1);
  }
  const removedSessionIds = store.sessions.filter(s => s.class_id === id).map(s => s.id);
  for (let i = store.sessions.length - 1; i >= 0; i--) {
    if (store.sessions[i].class_id === id) store.sessions.splice(i, 1);
  }
  for (let i = store.attendances.length - 1; i >= 0; i--) {
    if (removedSessionIds.includes(store.attendances[i].session_id)) store.attendances.splice(i, 1);
  }
  res.json({ ok: true });
});

// ---------- Students ----------
apiRouter.get('/classes/:id/students', (req, res) => {
  const list = store.getStudentsByClass(req.params.id);
  res.json(list);
});

apiRouter.post('/classes/:id/students', (req, res) => {
  const classId = Number(req.params.id);
  if (!store.classes.find(c => c.id === classId)) {
    return res.status(404).json({ error: 'Không tìm thấy lớp' });
  }
  const { full_name, student_code, gender, date_of_birth } = req.body || {};
  if (!full_name || !String(full_name).trim()) {
    return res.status(400).json({ error: 'Họ tên không được để trống' });
  }
  if (!student_code || !String(student_code).trim()) {
    return res.status(400).json({ error: 'Mã học sinh không được để trống' });
  }
  if (store.students.find(s => s.student_code === String(student_code).trim())) {
    return res.status(400).json({ error: 'Mã học sinh đã tồn tại' });
  }
  const row = {
    id: store.newId(),
    class_id: classId,
    full_name: String(full_name).trim(),
    student_code: String(student_code).trim(),
    gender: gender || null,
    date_of_birth: date_of_birth || null,
    created_at: new Date().toISOString(),
  };
  store.students.push(row);
  res.status(201).json(row);
});

apiRouter.delete('/students/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = store.students.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  store.students.splice(idx, 1);
  for (let i = store.attendances.length - 1; i >= 0; i--) {
    if (store.attendances[i].student_id === id) store.attendances.splice(i, 1);
  }
  res.json({ ok: true });
});

apiRouter.get('/students/:id/stats', (req, res) => {
  const id = Number(req.params.id);
  const list = store.attendances.filter(a => a.student_id === id);
  const total = list.length;
  const present = list.filter(a => a.is_present === 1).length;
  const absent  = list.filter(a => a.is_present === 0).length;
  const scores = list.filter(a => a.lesson_score != null).map(a => a.lesson_score);
  const avg = scores.length ? Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 100) / 100 : null;
  res.json({ total_sessions: total, present_count: present, absent_count: absent, avg_lesson_score: avg });
});

apiRouter.get('/students/:id', (req, res) => {
  const id = Number(req.params.id);
  const st = store.students.find(s => s.id === id);
  if (!st) return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  res.json(st);
});

apiRouter.get('/students/:id/notes', (req, res) => {
  const id = Number(req.params.id);
  const st = store.students.find(s => s.id === id);
  if (!st) return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  const now = new Date();
  const year = parseInt(req.query.year || now.getFullYear(), 10);
  const month = parseInt(req.query.month || (now.getMonth() + 1), 10);
  if (month < 1 || month > 12) return res.status(400).json({ error: 'month không hợp lệ' });
  const pad = n => String(n).padStart(2, '0');
  const from = `${year}-${pad(month)}-01`;
  const to   = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`;
  const notes = store.attendances
    .filter(a => a.student_id === id)
    .map(a => {
      const s = store.sessions.find(x => x.id === a.session_id);
      if (!s) return null;
      if (s.session_date < from || s.session_date > to) return null;
      if (!a.teacher_note || !a.teacher_note.trim()) return null;
      return {
        id: a.id,
        session_id: a.session_id,
        teacher_note: a.teacher_note,
        lesson_score: a.lesson_score,
        lesson_grade: a.lesson_grade,
        is_present: a.is_present,
        session_date: s.session_date,
        session_title: s.title,
      };
    })
    .filter(Boolean);
  res.json({
    student: st,
    period: { year, month, from, to },
    total_notes: notes.length,
    notes,
  });
});

// ---------- Sessions ----------
apiRouter.get('/classes/:id/sessions', (req, res) => {
  res.json(store.getSessionsByClass(req.params.id));
});

apiRouter.post('/classes/:id/sessions', (req, res) => {
  const classId = Number(req.params.id);
  if (!store.classes.find(c => c.id === classId)) {
    return res.status(404).json({ error: 'Không tìm thấy lớp' });
  }
  const { session_date, title, note } = req.body || {};
  if (!session_date) {
    return res.status(400).json({ error: 'Ngày học không được để trống' });
  }
  if (store.sessions.find(s => s.class_id === classId && s.session_date === session_date)) {
    return res.status(400).json({ error: 'Lớp này đã có buổi học trong ngày này rồi' });
  }
  const row = {
    id: store.newId(),
    class_id: classId,
    session_date,
    title: title || null,
    note: note || null,
    created_at: new Date().toISOString(),
  };
  store.sessions.push(row);
  res.status(201).json(row);
});

apiRouter.get('/sessions/:id', (req, res) => {
  const id = Number(req.params.id);
  const session = store.sessions.find(s => s.id === id);
  if (!session) return res.status(404).json({ error: 'Không tìm thấy buổi học' });
  res.json({ session, attendances: store.getAttendancesForSession(id) });
});

apiRouter.delete('/sessions/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = store.sessions.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Không tìm thấy buổi học' });
  store.sessions.splice(idx, 1);
  for (let i = store.attendances.length - 1; i >= 0; i--) {
    if (store.attendances[i].session_id === id) store.attendances.splice(i, 1);
  }
  res.json({ ok: true });
});

// ---------- Attendances ----------
apiRouter.post('/sessions/:id/attendances', (req, res) => {
  const sessionId = Number(req.params.id);
  const session = store.sessions.find(s => s.id === sessionId);
  if (!session) return res.status(404).json({ error: 'Không tìm thấy buổi học' });

  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Danh sách điểm danh không hợp lệ' });
  }

  for (const it of items) {
    if (!it.student_id) return res.status(400).json({ error: 'Thiếu student_id' });
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

  for (const it of items) {
    const idx = store.attendances.findIndex(a => a.session_id === sessionId && a.student_id === it.student_id);
    const score = (it.lesson_score === '' || it.lesson_score == null) ? null : Number(it.lesson_score);
    const grade = it.lesson_grade || null;
    const note  = it.teacher_note || null;
    const data = {
      id: idx >= 0 ? store.attendances[idx].id : store.newId(),
      session_id: sessionId,
      student_id: it.student_id,
      is_present: it.is_present ? 1 : 0,
      lesson_score: score,
      lesson_grade: grade,
      teacher_note: note,
    };
    if (idx >= 0) store.attendances[idx] = data;
    else store.attendances.push(data);
  }
  res.json({ ok: true, count: items.length });
});

module.exports = { classesRouter, apiRouter };
