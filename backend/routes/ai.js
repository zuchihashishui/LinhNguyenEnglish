// Tổng hợp nhận xét bằng LLM (OpenAI-compatible API)
// Body: { api_key, base_url, model, student_id, student_name, year, month,
//         notes:[{date, note, lesson_score, exercise_score, video_done, exercise_online_done,
//                 present}],
//         monthly_summary: {total_sessions, present, absent, unmarked, video_done, exercise_online_done,
//                           avg_lesson_score, avg_exercise_score,
//                           lesson_trend, exercise_trend, low_score_sessions} }
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
      return res.status(400).json({ error: 'Không có buổi học nào trong tháng này để tổng hợp' });
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
    const videoDone = Number(summary.video_done || 0);
    const exerciseOnlineDone = Number(summary.exercise_online_done || 0);
    const lessonTrend = summary.lesson_trend || null;       // 'up' | 'down' | 'flat' | null
    const exerciseTrend = summary.exercise_trend || null;
    const lowScoreSessions = Array.isArray(summary.low_score_sessions) ? summary.low_score_sessions : [];

    // Prompt: nhận xét học sinh tiểu học (cấp 1: lớp 1-5)
    const noteLines = notes.map((n, i) => {
      const parts = [`Buổi ${i + 1} (${n.date})`];
      if (n.present === 1) parts.push('Có mặt');
      else if (n.present === 0) parts.push('Vắng');
      else parts.push('Chưa điểm danh');
      if (n.lesson_score != null) parts.push('Điểm bài cũ: ' + n.lesson_score + '/10');
      if (n.exercise_score != null) parts.push('Điểm bài tập: ' + n.exercise_score + '/10');
      if (n.video_done === 1) parts.push('Quay video bài cũ: ✓');
      // Bai tap online: cot exercise_online_done da co san (0 = chua tick, 1 = da tick "da lam")
      if (n.exercise_online_done === 1) {
        parts.push('Làm bài tập online: ✓');
      }
      if (n.note) parts.push('GV nhận xét: ' + n.note);
      return '- ' + parts.join(' | ');
    }).join('\n');

    // Xác định cấp học từ grade_level (1-5 là tiểu học/cấp 1, 6-9 là THCS, 10-12 là THPT)
    const gl = parseInt(grade_level);
    const isPrimary = !isNaN(gl) ? (gl >= 1 && gl <= 5) : true; // mặc định coi như cấp 1
    const levelLabel = isPrimary ? 'tiểu học (cấp 1, lớp 1-5)' : 'trung học';
    const styleHints = isPrimary
      ? 'Xưng hô "con/bé", giọng ấm áp, khích lệ, dùng từ ngữ gần gũi (ví dụ: "con làm tốt lắm", "con tiến bộ rõ rệt", "mẹ ơi hãy cùng con..."). Tránh dùng từ chuyên môn nặng.'
      : 'Giọng văn rõ ràng, đi thẳng vào điểm số và đánh giá, xưng "em/học sinh".';

    // Tổng hợp số liệu tháng để đưa vào prompt
    const statsLines = [];
    statsLines.push(`- Tổng số buổi học trong tháng: ${total}`);
    statsLines.push(`- Số buổi có mặt: ${present}`);
    statsLines.push(`- Số buổi vắng: ${absent}`);
    if (unmarked > 0) statsLines.push(`- Số buổi chưa điểm danh: ${unmarked}`);
    if (rate != null) statsLines.push(`- Tỉ lệ chuyên cần: ${rate}%`);
    if (avgLes != null) statsLines.push(`- Điểm trung bình bài cũ: ${avgLes}/10`);
    if (avgEx != null) statsLines.push(`- Điểm trung bình bài tập: ${avgEx}/10`);
    statsLines.push(`- Số buổi quay video bài cũ: ${videoDone}/${total}` + (total > 0 ? ` (${Math.round(videoDone/total*100)}%)` : ''));
    statsLines.push(`- Số buổi nộp bài tập online: ${exerciseOnlineDone}/${total}` + (total > 0 ? ` (${Math.round(exerciseOnlineDone/total*100)}%)` : ''));
    if (lessonTrend) {
      const trendText = lessonTrend === 'up' ? 'tăng dần (tiến bộ)' : lessonTrend === 'down' ? 'giảm dần (cần lưu ý)' : 'ổn định';
      statsLines.push(`- Xu hướng điểm bài cũ: ${trendText}`);
    }
    if (exerciseTrend) {
      const trendText = exerciseTrend === 'up' ? 'tăng dần (tiến bộ)' : exerciseTrend === 'down' ? 'giảm dần (cần lưu ý)' : 'ổn định';
      statsLines.push(`- Xu hướng điểm bài tập: ${trendText}`);
    }
    if (lowScoreSessions.length > 0) {
      statsLines.push(`- Các buổi điểm bài cũ/bài tập thấp (≤ 5): ${lowScoreSessions.join(', ')}`);
    }

    const sysPrompt = `Bạn là một giáo viên tiếng Anh tại Việt Nam, đang viết nhận xét tổng kết hàng tháng cho học sinh ${levelLabel}. \
${styleHints} \
Nhiệm vụ: dựa trên (1) tất cả nhận xét của giáo viên trong tháng, (2) thông tin điểm danh, (3) điểm bài cũ và điểm bài tập, (4) tình hình quay video bài cũ và làm bài tập online ở nhà, (5) xu hướng điểm số qua từng buổi, \
hãy viết MỘT đoạn nhận xét tổng hợp (khoảng 5-8 câu, 150-220 từ) bằng tiếng Việt. \
Cấu trúc đoạn nhận xét nên đề cập: \
  (1) Sự chuyên cần / thái độ học tập của con trong tháng (tỉ lệ đi học). \
  (2) Điểm mạnh nổi bật — cụ thể hoá bằng con số: điểm bài cũ/bài tập TB, số buổi quay video, số buổi nộp bài tập online, hoặc những buổi có điểm cao. \
  (3) Điểm cần cải thiện — nếu có xu hướng giảm hoặc buổi điểm thấp, hãy nêu cụ thể (ví dụ: "điểm bài cũ giảm ở các buổi 5, 8", "tỉ lệ quay video còn thấp"). \
  (4) Gợi ý cụ thể cho phụ huynh hỗ trợ ở nhà (ví dụ: nghe lại bài cũ 10 phút mỗi tối, quay video con đọc bài, cùng con làm bài tập online...). \
Yêu cầu: trả về ĐÚNG MỘT đoạn văn tiếng Việt, KHÔNG bullet point, KHÔNG JSON, KHÔNG tiêu đề, KHÔNG giải thích thêm, KHÔNG ký tự đặc biệt Markdown.`;

    const userPrompt = `Học sinh: ${student_name || 'HS'}\nTháng: ${month}/${year}\n\nThống kê điểm danh và điểm số trong tháng:\n${statsLines.join('\n')}\n\nNhật ký các buổi học trong tháng:\n${noteLines}`;

    const body = {
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 700,
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
