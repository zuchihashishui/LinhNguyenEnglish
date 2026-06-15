// Tổng hợp nhận xét bằng LLM (OpenAI-compatible API)
// Body: { api_key, base_url, model, student_name, year, month, notes:[{date, note, score, grade, present}] }
// Trả về: { summary, model, usage }

const express = require('express');
const router = express.Router();

router.post('/summarize-notes', async (req, res) => {
  try {
    if (!req.headers['x-teacher-id']) {
      return res.status(401).json({ error: 'Chưa đăng nhập. Thiếu header X-Teacher-Id.' });
    }
    const {
      api_key, base_url, model,
      student_name, year, month, grade_level, notes,
    } = req.body || {};

    if (!api_key || !api_key.trim()) {
      return res.status(400).json({ error: 'Thiếu API key' });
    }
    if (!Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ error: 'Không có nhận xét nào trong tháng này để tổng hợp' });
    }

    // Chuẩn hoá base_url
    let base = (base_url || 'https://api.openai.com').trim();
    base = base.replace(/\/+$/, '');
    if (!/\/v\d+/.test(base)) base = base + '/v1';

    // Prompt: nhận xét học sinh tiểu học (cấp 1: lớp 1-5)
    const noteLines = notes.map((n, i) => {
      const parts = [`Buổi ${i + 1} (${n.date})`];
      if (n.present === 1) parts.push('Có mặt');
      else if (n.present === 0) parts.push('Vắng');
      if (n.score != null) parts.push('Điểm bài cũ: ' + n.score);
      if (n.grade) parts.push('Xếp loại: ' + n.grade);
      if (n.note) parts.push('GV nhận xét: ' + n.note);
      return '- ' + parts.join(' | ');
    }).join('\n');

    const isPrimary = !grade_level || (grade_level >= 1 && grade_level <= 5);
    const levelLabel = isPrimary ? 'tiểu học (cấp 1, lớp 1-5)' : 'trung học';

    const sysPrompt = `Bạn là một giáo viên tiếng Anh Việt Nam đang viết nhận xét tổng kết hàng tháng cho học sinh ${levelLabel}. \
Hãy đọc tất cả nhận xét của giáo viên trong tháng, tổng hợp thành MỘT đoạn nhận xét chung (khoảng 4-7 câu), \
giọng văn ấm áp, khích lệ, phù hợp với lứa tuổi ${isPrimary ? 'tiểu học' : ''}. \
Đề cập: (1) thái độ học tập / sự chuyên cần, (2) điểm mạnh nổi bật, (3) điểm cần cải thiện, (4) gợi ý phụ huynh hỗ trợ ở nhà. \
Trả về ĐÚNG MỘT đoạn văn tiếng Việt, KHÔNG bullet point, KHÔNG JSON, KHÔNG tiêu đề, KHÔNG giải thích thêm.`;

    const userPrompt = `Học sinh: ${student_name || 'HS'}\nTháng: ${month}/${year}\n\n${noteLines}`;

    const body = {
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
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
    const summary = data.choices?.[0]?.message?.content?.trim();
    if (!summary) {
      return res.status(500).json({ error: 'LLM không trả về nội dung', raw: data });
    }
    res.json({
      summary,
      model: data.model || body.model,
      usage: data.usage || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
