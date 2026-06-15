// Tổng hợp nhận xét bằng LLM (OpenAI-compatible API)
// Body: { api_key, base_url, model, student_id, student_name, year, month,
//         notes:[{date, note, lesson_score, exercise_score, grade, present}],
//         monthly_summary: {total_sessions, present, absent, unmarked, avg_lesson_score, avg_exercise_score} }
// Trả về: { summary, model, usage }

const express = require('express');
const pool = require('../db');
const { requireTeacher } = require('../auth');
const router = express.Router();
router.use(requireTeacher);

// Helper: kiểm tra quyền truy cập lớp của HS
async function canAccessClass(req, classId) {
  if (req.teacher.is_admin) return true;
  const [rows] = await pool.query('SELECT teacher_id FROM classes WHERE id = ?', [classId]);
  if (rows.length === 0) return false;
  return Number(rows[0].teacher_id) === req.teacher.id;
}

router.post('/summarize-notes', async (req, res) => {
  try {
    const {
      api_key, base_url, model,
      student_id, student_name, year, month, grade_level, notes, monthly_summary,
    } = req.body || {};

    if (!api_key || !api_key.trim()) {
      return res.status(400).json({ error: 'Thiếu API key' });
    }
    if (!Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ error: 'Không có nhận xét nào trong tháng này để tổng hợp' });
    }

    // Kiểm tra quyền truy cập HS (nếu có student_id)
    if (student_id) {
      const [sRows] = await pool.query('SELECT class_id, full_name FROM students WHERE id = ?', [student_id]);
      if (sRows.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy học sinh' });
      }
      if (!await canAccessClass(req, sRows[0].class_id)) {
        return res.status(403).json({ error: 'Bạn không phụ trách lớp của HS này' });
      }
    }

    // Chuẩn hoá base_url
    let base = (base_url || 'https://api.openai.com').trim();
    base = base.replace(/\/+$/, '');
    if (!/\/v\d+/.test(base)) base = base + '/v1';

    // Tổng hợp nhanh các số liệu tháng
    const summary = monthly_summary || {};
    const present  = Number(summary.present || 0);
    const absent   = Number(summary.absent || 0);
    const unmarked = Number(summary.unmarked || 0);
    const total    = Number(summary.total_sessions || (present + absent + unmarked));
    const rate     = total > 0 ? Math.round((present / total) * 100) : null;
    const avgLes   = summary.avg_lesson_score != null ? Number(summary.avg_lesson_score) : null;
    const avgEx    = summary.avg_exercise_score != null ? Number(summary.avg_exercise_score) : null;

    // Prompt: nhận xét học sinh tiểu học (cấp 1: lớp 1-5)
    const noteLines = notes.map((n, i) => {
      const parts = [`Buổi ${i + 1} (${n.date})`];
      if (n.present === 1) parts.push('Có mặt');
      else if (n.present === 0) parts.push('Vắng');
      else parts.push('Chưa điểm danh');
      if (n.lesson_score != null) parts.push('Điểm bài cũ: ' + n.lesson_score + '/10');
      if (n.exercise_score != null) parts.push('Điểm bài tập: ' + n.exercise_score + '/10');
      if (n.grade) parts.push('Xếp loại: ' + n.grade);
      if (n.note) parts.push('GV nhận xét: ' + n.note);
      return '- ' + parts.join(' | ');
    }).join('\n');

    // Xác định cấp học từ grade_level (1-5 là tiểu học/cấp 1, 6-9 là THCS, 10-12 là THPT)
    const gl = parseInt(grade_level);
    const isPrimary = !isNaN(gl) ? (gl >= 1 && gl <= 5) : true; // mặc định coi như cấp 1
    const levelLabel = isPrimary ? 'tiểu học (cấp 1, lớp 1-5)' : 'trung học';

    // Tổng hợp số liệu tháng để đưa vào prompt
    const statsLines = [];
    statsLines.push(`- Tổng số buổi học trong tháng: ${total}`);
    statsLines.push(`- Số buổi có mặt: ${present}`);
    statsLines.push(`- Số buổi vắng: ${absent}`);
    if (unmarked > 0) statsLines.push(`- Số buổi chưa điểm danh: ${unmarked}`);
    if (rate != null) statsLines.push(`- Tỉ lệ chuyên cần: ${rate}%`);
    if (avgLes != null) statsLines.push(`- Điểm trung bình bài cũ: ${avgLes}/10`);
    if (avgEx != null) statsLines.push(`- Điểm trung bình bài tập: ${avgEx}/10`);

    const sysPrompt = `Bạn là một giáo viên tiếng Anh tại Việt Nam, đang viết nhận xét tổng kết hàng tháng cho học sinh ${levelLabel}. \
Nhiệm vụ: dựa trên (1) tất cả nhận xét của giáo viên trong tháng, (2) thông tin điểm danh, (3) điểm bài cũ, điểm bài tập, \
hãy viết MỘT đoạn nhận xét tổng hợp (khoảng 4-7 câu, 120-200 từ) bằng tiếng Việt, giọng văn ấm áp, khích lệ, phù hợp với lứa tuổi ${isPrimary ? 'tiểu học' : ''}. \
Cấu trúc đoạn nhận xét nên đề cập: \
  (1) Sự chuyên cần / thái độ học tập của bé trong tháng. \
  (2) Điểm mạnh nổi bật (ví dụ: tích cực phát biểu, hoàn thành tốt bài tập, tiến bộ về từ vựng/ngữ pháp/...). \
  (3) Điểm cần cải thiện (ví dụ: cần luyện thêm phát âm, cần chú ý nghe giảng, ...). \
  (4) Gợi ý cụ thể cho phụ huynh hỗ trợ ở nhà. \
Yêu cầu: trả về ĐÚNG MỘT đoạn văn tiếng Việt, KHÔNG bullet point, KHÔNG JSON, KHÔNG tiêu đề, KHÔNG giải thích thêm, KHÔNG ký tự đặc biệt Markdown.`;

    const userPrompt = `Học sinh: ${student_name || 'HS'}\nTháng: ${month}/${year}\n\nThống kê điểm danh và điểm số trong tháng:\n${statsLines.join('\n')}\n\nNhật ký các buổi học trong tháng:\n${noteLines}`;

    const body = {
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 600,
    };

    const r = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + api_key,
      },
      body: JSON.stringify(body),
    });

    const txt = await r.text();
    let data;
    try { data = JSON.parse(txt); } catch { data = null; }

    if (!r.ok) {
      const msg = (data && (data.error?.message || data.error)) || ('HTTP ' + r.status);
      return res.status(r.status).json({ error: 'LLM lỗi: ' + msg });
    }
    const summaryText = data.choices?.[0]?.message?.content?.trim();
    if (!summaryText) {
      return res.status(500).json({ error: 'LLM không trả về nội dung', raw: data });
    }
    res.json({
      summary: summaryText,
      model: data.model || body.model,
      usage: data.usage || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
