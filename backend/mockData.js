// Kho dữ liệu giả lập (in-memory) - dùng khi chưa kết nối MySQL.
// Bật bằng cách set USE_MOCK=1 trong file .env hoặc:  set USE_MOCK=1 && npm start

const today = new Date();
const todayStr = today.toISOString().slice(0, 10);
const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().slice(0, 10);
const twoDaysAgo = new Date(today); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const twoDaysAgoStr = twoDaysAgo.toISOString().slice(0, 10);
const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);
const lastWeekStr = lastWeek.toISOString().slice(0, 10);

let nextId = 1;
const newId = () => nextId++;

// ---------- Classes ----------
const classes = [
  { id: newId(), name: 'Lớp 10A1 - Tiếng Anh', grade_level: 'Lớp 10', created_at: lastWeekStr },
  { id: newId(), name: 'Lớp 11B2 - Tiếng Anh', grade_level: 'Lớp 11', created_at: lastWeekStr },
];

// ---------- Students (10 học sinh lớp 10A1, 8 học sinh lớp 11B2) ----------
const students = [
  { id: newId(), class_id: classes[0].id, full_name: 'Nguyễn Minh Anh',     student_code: 'HS001', gender: 'F', date_of_birth: '2008-04-12', created_at: lastWeekStr },
  { id: newId(), class_id: classes[0].id, full_name: 'Trần Quốc Bảo',       student_code: 'HS002', gender: 'M', date_of_birth: '2008-08-25', created_at: lastWeekStr },
  { id: newId(), class_id: classes[0].id, full_name: 'Lê Hồng Châu',        student_code: 'HS003', gender: 'F', date_of_birth: '2008-02-09', created_at: lastWeekStr },
  { id: newId(), class_id: classes[0].id, full_name: 'Phạm Gia Đức',        student_code: 'HS004', gender: 'M', date_of_birth: '2008-11-30', created_at: lastWeekStr },
  { id: newId(), class_id: classes[0].id, full_name: 'Hoàng Bảo Hân',       student_code: 'HS005', gender: 'F', date_of_birth: '2008-06-18', created_at: lastWeekStr },
  { id: newId(), class_id: classes[0].id, full_name: 'Vũ Khánh Huy',        student_code: 'HS006', gender: 'M', date_of_birth: '2008-09-04', created_at: lastWeekStr },
  { id: newId(), class_id: classes[0].id, full_name: 'Đặng Thùy Linh',      student_code: 'HS007', gender: 'F', date_of_birth: '2008-01-22', created_at: lastWeekStr },
  { id: newId(), class_id: classes[0].id, full_name: 'Bùi Quang Minh',      student_code: 'HS008', gender: 'M', date_of_birth: '2008-05-15', created_at: lastWeekStr },
  { id: newId(), class_id: classes[0].id, full_name: 'Đỗ Thanh Ngân',       student_code: 'HS009', gender: 'F', date_of_birth: '2008-07-07', created_at: lastWeekStr },
  { id: newId(), class_id: classes[0].id, full_name: 'Ngô Tuấn Phong',      student_code: 'HS010', gender: 'M', date_of_birth: '2008-03-28', created_at: lastWeekStr },
  { id: newId(), class_id: classes[1].id, full_name: 'Đào Duy Thành',       student_code: 'HS011', gender: 'M', date_of_birth: '2007-05-02', created_at: lastWeekStr },
  { id: newId(), class_id: classes[1].id, full_name: 'Hà Kim Yến',          student_code: 'HS012', gender: 'F', date_of_birth: '2007-09-14', created_at: lastWeekStr },
];

// ---------- Sessions ----------
const sessions = [
  { id: newId(), class_id: classes[0].id, session_date: lastWeekStr,    title: 'Unit 1: Family Life - Reading',     note: 'Đọc hiểu bài Family Life.',      created_at: lastWeekStr },
  { id: newId(), class_id: classes[0].id, session_date: twoDaysAgoStr, title: 'Unit 2: Friends - Listening',       note: 'Luyện nghe chủ đề Friends.',     created_at: lastWeekStr },
  { id: newId(), class_id: classes[0].id, session_date: yesterdayStr,  title: 'Unit 3: Teen Life - Vocabulary',    note: 'Học từ vựng chương 3.',          created_at: yesterdayStr },
  { id: newId(), class_id: classes[0].id, session_date: todayStr,      title: 'Unit 3: Teen Life - Speaking',      note: 'Ôn tập từ vựng chương 3.',       created_at: todayStr },
  { id: newId(), class_id: classes[1].id, session_date: todayStr,      title: 'Unit 5: Travel - Speaking',         note: 'Nói về du lịch.',                created_at: todayStr },
];

// ---------- Attendances (dữ liệu mẫu cho các buổi đã diễn ra + buổi hôm nay điểm danh dở) ----------
const GRADE_OPTIONS = ['Tốt', 'Khá', 'Trung bình', 'Yếu'];
const NOTES = [
  'Phát biểu tích cực, trả lời đúng.',
  'Hoàn thành tốt bài tập.',
  'Cần ôn thêm từ vựng.',
  'Chú ý nghe giảng hơn.',
  'Tích cực tham gia hoạt động nhóm.',
  'Vắng không phép.',
  'Xin nghỉ ốm.',
  'Cần cố gắng thêm.',
];

const attendances = []; // {id, session_id, student_id, is_present, lesson_score, lesson_grade, teacher_note}

function gradeForScore(score) {
  if (score == null) return null;
  if (score >= 9) return 'Tốt';
  if (score >= 7) return 'Khá';
  if (score >= 5) return 'Trung bình';
  return 'Yếu';
}

function seedSession(sessionIdx, presentCount, withScores) {
  const sess = sessions[sessionIdx];
  const classStu = students.filter(s => s.class_id === sess.class_id);
  classStu.forEach((st, i) => {
    const present = i < presentCount;
    let score = null;
    if (present && withScores) {
      // Phân bổ điểm hợp lý: ~30% Tốt, 50% Khá, 20% TB
      const r = Math.random();
      score = r < 0.3 ? Math.floor(Math.random() * 2) + 9      // 9-10 (Tốt)
           : r < 0.8 ? Math.floor(Math.random() * 3) + 7      // 7-9  (Khá)
           :           Math.floor(Math.random() * 2) + 5;     // 5-6  (Trung bình)
    }
    attendances.push({
      id: newId(),
      session_id: sess.id,
      student_id: st.id,
      is_present: present ? 1 : 0,
      lesson_score: score,
      lesson_grade: present ? gradeForScore(score) : null,
      teacher_note: present ? NOTES[Math.floor(Math.random() * 5)] : (i === presentCount ? 'Vắng không phép' : 'Xin nghỉ ốm'),
    });
  });
}

// Tuần trước: 9/10 có mặt, có điểm đầy đủ
seedSession(0, 9, true);
// Hai ngày trước: 8/10 có mặt, có điểm
seedSession(1, 8, true);
// Hôm qua: 10/10 có mặt, có điểm
seedSession(2, 10, true);
// Hôm nay lớp 10A1: 6/10 có mặt, có điểm một số em (điểm danh dở)
seedSession(3, 6, true);
// Hôm nay lớp 11B2: 6/8 có mặt
seedSession(4, 6, true);

// =====================================================
// Query helpers
// =====================================================
function getStudentsByClass(classId) {
  return students
    .filter(s => s.class_id === Number(classId))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'vi'));
}

function getSessionsByClass(classId) {
  return sessions
    .filter(s => s.class_id === Number(classId))
    .sort((a, b) => (a.session_date < b.session_date ? 1 : -1));
}

function getAttendancesForSession(sessionId) {
  const session = sessions.find(s => s.id === Number(sessionId));
  if (!session) return null;
  const list = getStudentsByClass(session.class_id).map(st => {
    const att = attendances.find(a => a.session_id === Number(sessionId) && a.student_id === st.id);
    return {
      id: att ? att.id : null,
      student_id: st.id,
      full_name: st.full_name,
      student_code: st.student_code,
      is_present: att ? att.is_present : 0,
      lesson_score: att ? att.lesson_score : null,
      lesson_grade: att ? att.lesson_grade : null,
      teacher_note: att ? att.teacher_note : null,
    };
  });
  return list;
}

module.exports = {
  classes,
  students,
  sessions,
  attendances,
  newId,
  getStudentsByClass,
  getSessionsByClass,
  getAttendancesForSession,
};
