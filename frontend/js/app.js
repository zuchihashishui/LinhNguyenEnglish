// =====================================================
// Frontend SPA đơn giản cho hệ thống điểm danh Linh English
// =====================================================

console.log('[Linh English] app.js v22 đang nạp...');

const API = '/api';

// ----- Lưu phiên đăng nhập vào localStorage -----
const LS_TEACHER = 'linh_english_teacher';
let currentTeacher = null;
try {
  const raw = localStorage.getItem(LS_TEACHER);
  if (raw) currentTeacher = JSON.parse(raw);
} catch (e) { /* ignore */ }

function setCurrentTeacher(t) {
  currentTeacher = t;
  if (t) localStorage.setItem(LS_TEACHER, JSON.stringify(t));
  else localStorage.removeItem(LS_TEACHER);
  updateAuthUI();
}

function updateAuthUI() {
  const header = $('#userInfo');
  if (!header) return;
  if (currentTeacher) {
    header.innerHTML = '';
    if (currentTeacher.is_admin) {
      const linkTeachers = document.createElement('a');
      linkTeachers.href = '#teachers';
      linkTeachers.textContent = '👥 Quản lý GV';
      linkTeachers.style.cssText = 'color:#fff;text-decoration:none;margin-right:8px;font-size:14px';
      header.appendChild(linkTeachers);
    }
    const span = document.createElement('span');
    span.style.color = '#374151';
    span.style.marginRight = '8px';
    span.textContent = '👋 ' + currentTeacher.full_name + (currentTeacher.is_admin ? ' (Quản trị viên)' : '');
    header.appendChild(span);
    const btnOut = document.createElement('button');
    btnOut.className = 'btn btn-sm btn-secondary';
    btnOut.textContent = 'Đăng xuất';
    btnOut.addEventListener('click', function (e) {
      e.preventDefault();
      logout();
    });
    header.appendChild(btnOut);
  } else {
    header.innerHTML = '';
  }
}

async function logout() {
  setCurrentTeacher(null);
  location.hash = '';
  await renderLogin();
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (currentTeacher) headers['X-Teacher-Id'] = currentTeacher.id;
  const res = await fetch(API + path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      // Hết phiên / chưa login → quay về màn login
      setCurrentTeacher(null);
      await renderLogin();
    }
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

// ----- Utilities -----
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === false || v == null) continue;
    else if (v === true) node.setAttribute(k, '');
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    if (c instanceof Node) node.appendChild(c);
    else if (typeof c === 'string' || typeof c === 'number') node.appendChild(document.createTextNode(String(c)));
    // bỏ qua các kiểu khác (object, boolean) để tránh lỗi appendChild
  }
  return node;
}

function toast(msg, type = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = 'toast'; }, 2800);
}

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatDate(s) {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

// ----- Hash Router -----
const routes = {
  '': renderHome,
  'classes': renderHome,
  'class': renderClassDetail,
  'class-stats': renderClassStats,
  'student-stats': renderStudentStats,
  'session-edit': renderSessionEdit,
  'session-view': renderSessionView,
  'teachers': renderTeachers,
};

function parseHash() {
  // # / #classes/2/students / #session-edit/5 / #session-view/5
  // #class/2 / #class-stats/2/2026/6
  const raw = location.hash.replace(/^#\/?/, '');
  const parts = raw.split('/').filter(Boolean);
  return { parts };
}

function navigate(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

window.addEventListener('hashchange', render);

function setCrumbs(items) {
  const c = $('#crumbs');
  c.innerHTML = '';
  c.appendChild(el('a', { href: '#' }, 'Trang chủ'));
  items.forEach((it, i) => {
    c.appendChild(el('span', { class: 'sep' }, '›'));
    if (it.href && i < items.length - 1) c.appendChild(el('a', { href: it.href }, it.label));
    else c.appendChild(el('span', { class: 'current' }, it.label));
  });
}

async function render() {
  const { parts } = parseHash();
  const key = parts[0] || '';
  if (!currentTeacher) {
    // Trang đăng ký vẫn cho xem khi chưa login
    if (key === 'register') {
      await renderRegister();
      return;
    }
    await renderLogin();
    return;
  }
  updateAuthUI();
  const key2 = parts[0] || '';
  const handler = routes[key2] || renderHome;
  handler(parts);
}

$('#brandHome').addEventListener('click', () => navigate('#'));

// =====================================================
// View: Đăng nhập
// =====================================================
async function renderLogin() {
  const main = $('#app');
  main.innerHTML = '';
  setCrumbs([{ label: 'Đăng nhập' }]);

  const wrap = el('div', { style: {
    maxWidth: '420px', margin: '60px auto', background: '#fff',
    padding: '32px', borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  } });

  wrap.appendChild(el('h1', { style: { marginTop: 0, color: '#4f46e5' } }, '🔐 Đăng nhập'));
  wrap.appendChild(el('p', { style: { color: '#6b7280', marginBottom: '24px' } },
    'Hệ thống điểm danh Linh English'));

  // Banner tài khoản mẫu
  const hint = el('div', { style: {
    background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '8px',
    padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#3730a3',
  } });
  hint.innerHTML = 'Tài khoản mẫu (mật khẩu: <b>123456</b>):<br>' +
    '<b>admin</b> — quản trị viên, thấy tất cả lớp<br>' +
    '<b>linh</b>, <b>mai</b>, <b>tuan</b> — giáo viên phụ trách từng lớp';
  wrap.appendChild(hint);

  // Form: dùng DOM thuần để chắc chắn handler được gắn
  const form = document.createElement('form');
  form.id = 'loginForm';
  form.noValidate = true;

  const row1 = document.createElement('div');
  row1.className = 'form-row';
  row1.innerHTML = '<label>Tên đăng nhập</label><input type="text" id="loginUser" placeholder="VD: linh" required autocomplete="username">';

  const row2 = document.createElement('div');
  row2.className = 'form-row';
  row2.innerHTML = '<label>Mật khẩu</label><input type="password" id="loginPass" placeholder="123456" required autocomplete="current-password">';

  const errBox = document.createElement('div');
  errBox.id = 'loginErr';
  errBox.style.cssText = 'color:#dc2626;font-size:13px;min-height:18px;margin:4px 0 8px;';

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'btn';
  btn.style.width = '100%';
  btn.textContent = 'Đăng nhập';

  form.appendChild(row1);
  form.appendChild(row2);
  form.appendChild(errBox);
  form.appendChild(btn);
  wrap.appendChild(form);

  // Gắn handler bằng addEventListener trực tiếp
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    console.log('[login] submit fired, going to call API');
    const username = (document.getElementById('loginUser') || {}).value || '';
    const password = (document.getElementById('loginPass') || {}).value || '';
    errBox.textContent = '';
    try {
      const data = await api('/auth/login', { method: 'POST', body: { username: username.trim(), password } });
      console.log('[login] API OK:', data);
      setCurrentTeacher(data.teacher);
      toast('Xin chào ' + data.teacher.full_name, 'success');
      location.hash = '';
      render();
    } catch (err) {
      console.log('[login] API ERR:', err.message);
      errBox.textContent = err.message;
    }
  });
  // Lưu ý: gắn thêm vào button click để bắt mọi trường hợp
  btn.addEventListener('click', function (e) {
    console.log('[login] button clicked');
    // Không preventDefault - để form submit tự nhiên
  });

  // Link sang trang đăng ký
  wrap.appendChild(el('div', { style: { textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#6b7280' } },
    'Chưa có tài khoản? ',
    el('a', { href: '#register', style: { color: '#4f46e5', fontWeight: '500', textDecoration: 'none' } }, 'Đăng ký giáo viên mới')
  ));

  main.appendChild(wrap);
}

// =====================================================
// View: Đăng ký giáo viên mới
// =====================================================
async function renderRegister() {
  const main = $('#app');
  main.innerHTML = '';
  setCrumbs([{ label: 'Đăng ký giáo viên' }]);

  const wrap = el('div', { style: {
    maxWidth: '420px', margin: '60px auto', background: '#fff',
    padding: '32px', borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  } });

  wrap.appendChild(el('h1', { style: { marginTop: 0, color: '#4f46e5' } }, '📝 Đăng ký giáo viên'));
  wrap.appendChild(el('p', { style: { color: '#6b7280', marginBottom: '24px' } },
    'Tạo tài khoản để bắt đầu quản lý lớp học và điểm danh.'));

  // Banner gợi ý
  const note = el('div', { style: {
    background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px',
    padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#92400e',
  } });
  note.innerHTML = 'Sau khi đăng ký, bạn sẽ được tự động đăng nhập. ' +
    'Nếu muốn phụ trách lớp có sẵn, hãy liên hệ quản trị viên để được gán.';
  wrap.appendChild(note);

  // Form: dùng DOM thuần để chắc chắn handler được gắn
  const form = document.createElement('form');
  form.noValidate = true;

  const r1 = document.createElement('div');
  r1.className = 'form-row';
  r1.innerHTML = '<label>Họ và tên *</label><input type="text" id="regName" placeholder="VD: Nguyễn Văn A" required autocomplete="name">';

  const r2 = document.createElement('div');
  r2.className = 'form-row';
  r2.innerHTML = '<label>Tên đăng nhập *</label><input type="text" id="regUser" placeholder="VD: nguyenvana (chữ thường, không dấu)" required autocomplete="username">';

  const r3 = document.createElement('div');
  r3.className = 'form-row';
  r3.innerHTML = '<label>Mật khẩu * (ít nhất 4 ký tự)</label><input type="password" id="regPass" placeholder="Tối thiểu 4 ký tự" required minlength="4" autocomplete="new-password">';

  const r4 = document.createElement('div');
  r4.className = 'form-row';
  r4.innerHTML = '<label>Nhập lại mật khẩu *</label><input type="password" id="regPass2" placeholder="Nhập lại mật khẩu" required minlength="4" autocomplete="new-password">';

  const errBox = document.createElement('div');
  errBox.id = 'regErr';
  errBox.style.cssText = 'color:#dc2626;font-size:13px;min-height:18px;margin:4px 0 8px;';

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'btn';
  btn.style.width = '100%';
  btn.textContent = 'Tạo tài khoản';

  form.appendChild(r1);
  form.appendChild(r2);
  form.appendChild(r3);
  form.appendChild(r4);
  form.appendChild(errBox);
  form.appendChild(btn);
  wrap.appendChild(form);

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const full_name = (document.getElementById('regName') || {}).value || '';
    const username = (document.getElementById('regUser') || {}).value || '';
    const password = (document.getElementById('regPass') || {}).value || '';
    const password_confirm = (document.getElementById('regPass2') || {}).value || '';
    errBox.textContent = '';
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: { full_name: full_name.trim(), username: username.trim(), password, password_confirm },
      });
      setCurrentTeacher(data.teacher);
      toast('Đăng ký thành công! Xin chào ' + data.teacher.full_name, 'success');
      location.hash = '';
      render();
    } catch (err) {
      errBox.textContent = err.message;
    }
  });

  // Link quay lại login
  wrap.appendChild(el('div', { style: { textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#6b7280' } },
    'Đã có tài khoản? ',
    el('a', { href: '#', style: { color: '#4f46e5', fontWeight: '500', textDecoration: 'none' },
      onClick: (e) => { e.preventDefault(); location.hash = ''; } }, 'Đăng nhập')
  ));

  main.appendChild(wrap);
}

// =====================================================
// View: Trang chủ - Danh sách lớp
// =====================================================
async function renderHome() {
  setCrumbs([{ label: 'Danh sách lớp' }]);
  const main = $('#app');
  main.innerHTML = '<p class="loading">Đang tải...</p>';

  try {
    const classes = await api('/classes');
    main.innerHTML = '';

    main.appendChild(el('h1', {}, 'Danh sách lớp học'));
    main.appendChild(el('p', { style: { color: '#6b7280' } },
      currentTeacher.is_admin
        ? 'Bạn đang đăng nhập với tư cách quản trị viên - thấy tất cả lớp.'
        : 'Danh sách lớp bạn phụ trách. Chọn một lớp để xem học sinh và bắt đầu điểm danh.'));

    // Form thêm lớp
    const card = el('div', { class: 'card' });
    card.appendChild(el('h3', {}, '➕ Thêm lớp mới'));

    // Nếu là admin: cho chọn giáo viên phụ trách
    let teachers = [];
    if (currentTeacher.is_admin) {
      try { teachers = await api('/teachers'); } catch (_) { teachers = []; }
    }

    const formChildren = [
      el('div', { class: 'form-grid' },
        el('div', { class: 'form-row' },
          el('label', {}, 'Tên lớp *'),
          el('input', { type: 'text', id: 'newClassName', placeholder: 'VD: Lớp 5A', required: true })
        ),
        el('div', { class: 'form-row' },
          el('label', {}, 'Cấp học'),
          el('input', { type: 'text', id: 'newClassGrade', placeholder: 'VD: Tiểu học' })
        ),
      ),
    ];

    if (currentTeacher.is_admin) {
      const teacherSelect = el('select', { id: 'newClassTeacher' });
      teacherSelect.appendChild(el('option', { value: '' }, '— Chưa gán —'));
      teachers.forEach(t => {
        teacherSelect.appendChild(el('option', { value: t.id }, t.full_name + ' (@' + t.username + ')'));
      });
      formChildren.push(el('div', { class: 'form-row', style: { marginTop: '8px' } },
        el('label', {}, 'Giáo viên phụ trách'),
        teacherSelect
      ));
    }

    formChildren.push(
      el('div', { style: { marginTop: '12px' } },
        el('button', { class: 'btn', type: 'submit' }, 'Thêm lớp')
      )
    );

    const form = el('form', { onSubmit: async (e) => {
      e.preventDefault();
      const name = $('#newClassName').value.trim();
      const grade = $('#newClassGrade').value.trim();
      if (!name) return;
      const body = { name, grade_level: grade };
      if (currentTeacher.is_admin) {
        const tid = $('#newClassTeacher').value;
        if (tid) body.teacher_id = Number(tid);
      }
      try {
        await api('/classes', { method: 'POST', body });
        toast('Đã thêm lớp mới', 'success');
        $('#newClassName').value = '';
        $('#newClassGrade').value = '';
        render();
      } catch (err) { toast(err.message, 'error'); }
    }}, ...formChildren);
    card.appendChild(form);
    main.appendChild(card);

    // Bảng lớp
    if (classes.length === 0) {
      main.appendChild(el('div', { class: 'card empty' }, 'Chưa có lớp nào. Hãy thêm lớp đầu tiên ở trên.'));
      return;
    }

    const tableCard = el('div', { class: 'card' });
    const table = el('table');
    table.appendChild(el('thead', {},
      el('tr', {},
        el('th', {}, 'STT'),
        el('th', {}, 'Tên lớp'),
        el('th', {}, 'Cấp học'),
        currentTeacher.is_admin ? el('th', {}, 'Giáo viên') : null,
        el('th', { style: { width: '280px' } }, 'Hành động'),
      )
    ));
    const tbody = el('tbody');
    classes.forEach((c, i) => {
      const openClass = () => navigate('#class/' + c.id);
      const goAttendance = async () => {
        console.log('[goAttendance] clicked, classId=', c.id);
        try {
          const today = todayStr();
          console.log('[goAttendance] today=', today);
          const list = await api('/classes/' + c.id + '/sessions');
          console.log('[goAttendance] got sessions:', list.length);
          let target = list.find(s => s.session_date === today);
          if (!target) {
            if (!confirm('Chưa có buổi học nào cho ngày hôm nay (' + today + ').\n\n' +
              'Bấm OK để tạo buổi học mới và bắt đầu điểm danh.\n' +
              'Bấm Huỷ để quay lại.')) return;
            const created = await api('/classes/' + c.id + '/sessions', {
              method: 'POST',
              body: {
                session_date: today,
                title: 'Buổi học ' + new Date().toLocaleDateString('vi-VN'),
                note: 'Tạo tự động khi bấm Điểm danh'
              }
            });
            target = created;
            toast('Đã tạo buổi học hôm nay', 'success');
          }
          console.log('[goAttendance] navigate to', '#session-edit/' + target.id);
          navigate('#session-edit/' + target.id);
        } catch (err) {
          console.log('[goAttendance] ERR:', err.message);
          toast(err.message, 'error');
        }
      };
      // Build row với DOM thuần để chắc chắn listener hoạt động
      const tr = document.createElement('tr');

      const tdIdx = document.createElement('td');
      tdIdx.textContent = String(i + 1);
      tr.appendChild(tdIdx);

      const tdName = document.createElement('td');
      tdName.style.cursor = 'pointer';
      const nameStrong = document.createElement('strong');
      nameStrong.style.color = '#4f46e5';
      nameStrong.textContent = c.name;
      const nameHint = document.createElement('div');
      nameHint.style.cssText = 'font-size:12px;color:#6b7280';
      nameHint.textContent = 'Click để điểm danh nhanh';
      tdName.appendChild(nameStrong);
      tdName.appendChild(nameHint);
      tdName.addEventListener('click', goAttendance);
      tr.appendChild(tdName);

      const tdGrade = document.createElement('td');
      tdGrade.textContent = c.grade_level || '—';
      tr.appendChild(tdGrade);

      if (currentTeacher.is_admin) {
        const tdTeacher = document.createElement('td');
        tdTeacher.textContent = c.teacher_name || '—';
        tr.appendChild(tdTeacher);
      }

      const tdActions = document.createElement('td');
      const actionsCell = document.createElement('div');
      actionsCell.className = 'actions-cell';

      const btnAtt = document.createElement('button');
      btnAtt.className = 'btn btn-sm btn-success';
      btnAtt.textContent = '📋 Điểm danh';
      btnAtt.addEventListener('click', function (e) {
        e.stopPropagation();
        goAttendance();
      });
      actionsCell.appendChild(btnAtt);

      const btnStats = document.createElement('button');
      btnStats.className = 'btn btn-sm';
      btnStats.textContent = '📊 Thống kê';
      btnStats.addEventListener('click', function () {
        const today = new Date();
        navigate('#class-stats/' + c.id + '/' + today.getFullYear() + '/' + (today.getMonth() + 1));
      });
      actionsCell.appendChild(btnStats);

      const btnManage = document.createElement('button');
      btnManage.className = 'btn btn-sm btn-secondary';
      btnManage.textContent = '👥 Quản lý';
      btnManage.addEventListener('click', openClass);
      actionsCell.appendChild(btnManage);

      const btnDel = document.createElement('button');
      btnDel.className = 'btn btn-sm btn-danger';
      btnDel.textContent = 'Xoá';
      btnDel.addEventListener('click', async function () {
        if (!confirm('Xoá lớp "' + c.name + '"? Tất cả học sinh và buổi học sẽ bị xoá theo.')) return;
        try { await api('/classes/' + c.id, { method: 'DELETE' }); toast('Đã xoá lớp', 'success'); render(); }
        catch (err) { toast(err.message, 'error'); }
      });
      actionsCell.appendChild(btnDel);

      tdActions.appendChild(actionsCell);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableCard.appendChild(table);
    main.appendChild(tableCard);
  } catch (err) {
    $('#app').innerHTML = `<div class="card empty">Lỗi tải dữ liệu: ${err.message}</div>`;
  }
}

// =====================================================
// View: Chi tiết lớp - Tabs Học sinh / Buổi học
// =====================================================
let currentClass = null;
let currentTab = 'students';

async function renderClassDetail(parts) {
  const classId = parts[1];
  if (!classId) return navigate('#');

  setCrumbs([{ label: 'Lớp ' + classId }]);
  $('#app').innerHTML = '<p class="loading">Đang tải...</p>';

  try {
    const [cls, students, sessions] = await Promise.all([
      api('/classes').then(list => list.find(c => c.id == classId)),
      api('/classes/' + classId + '/students'),
      api('/classes/' + classId + '/sessions'),
    ]);
    if (!cls) { toast('Không tìm thấy lớp', 'error'); return navigate('#'); }
    currentClass = cls;

    setCrumbs([{ label: 'Lớp: ' + cls.name }]);

    const main = $('#app');
    main.innerHTML = '';
    const headerRow = el('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' } },
      el('h1', { style: { margin: 0 } }, 'Lớp: ' + cls.name),
      el('div', { style: { marginLeft: 'auto', display: 'flex', gap: '8px' } },
        el('button', { class: 'btn btn-secondary', onClick: () => navigate('#') }, '← DS lớp'),
        el('button', { class: 'btn', onClick: () => {
          const today = new Date();
          navigate('#class-stats/' + classId + '/' + today.getFullYear() + '/' + (today.getMonth() + 1));
        }, title: 'Xem thống kê tháng này' }, '📊 Thống kê tháng'),
      )
    );
    main.appendChild(headerRow);
    if (cls.grade_level) main.appendChild(el('p', { style: { color: '#6b7280' } }, 'Cấp học: ' + cls.grade_level));

    // Tabs
    const tabs = el('div', { class: 'tabs' });
    const tabStudents = el('button', { class: 'tab' + (currentTab === 'students' ? ' active' : ''),
      onClick: () => { currentTab = 'students'; renderClassDetail(parts); } }, '👨‍🎓 Học sinh');
    const tabSessions = el('button', { class: 'tab' + (currentTab === 'sessions' ? ' active' : ''),
      onClick: () => { currentTab = 'sessions'; renderClassDetail(parts); } }, '📅 Buổi học');
    tabs.appendChild(tabStudents);
    tabs.appendChild(tabSessions);
    main.appendChild(tabs);

    if (currentTab === 'students') renderStudentsTab(main, classId, students);
    else renderSessionsTab(main, classId, sessions);
  } catch (err) {
    $('#app').innerHTML = `<div class="card empty">Lỗi: ${err.message}</div>`;
  }
}

function renderStudentsTab(main, classId, students) {
  const card = el('div', { class: 'card' });
  card.appendChild(el('h3', {}, '➕ Thêm học sinh'));
  card.appendChild(el('form', { onSubmit: async (e) => {
    e.preventDefault();
    const body = {
      full_name: $('#stName').value.trim(),
      student_code: $('#stCode').value.trim(),
      gender: $('#stGender').value || null,
      date_of_birth: $('#stDob').value || null,
    };
    if (!body.full_name || !body.student_code) return;
    try {
      await api('/classes/' + classId + '/students', { method: 'POST', body });
      toast('Đã thêm học sinh', 'success');
      renderClassDetail(['class', classId]);
    } catch (err) { toast(err.message, 'error'); }
  }},
    el('div', { class: 'form-grid' },
      el('div', { class: 'form-row' },
        el('label', {}, 'Họ tên *'),
        el('input', { type: 'text', id: 'stName', required: true })
      ),
      el('div', { class: 'form-row' },
        el('label', {}, 'Mã học sinh *'),
        el('input', { type: 'text', id: 'stCode', required: true, placeholder: 'HS001' })
      ),
      el('div', { class: 'form-row' },
        el('label', {}, 'Giới tính'),
        el('select', { id: 'stGender' },
          el('option', { value: '' }, '--'),
          el('option', { value: 'M' }, 'Nam'),
          el('option', { value: 'F' }, 'Nữ'),
          el('option', { value: 'O' }, 'Khác'),
        )
      ),
      el('div', { class: 'form-row' },
        el('label', {}, 'Ngày sinh'),
        el('input', { type: 'date', id: 'stDob' })
      ),
    ),
    el('div', { style: { marginTop: '12px' } },
      el('button', { class: 'btn', type: 'submit' }, 'Thêm học sinh')
    )
  ));
  main.appendChild(card);

  if (students.length === 0) {
    main.appendChild(el('div', { class: 'card empty' }, 'Lớp chưa có học sinh nào.'));
    return;
  }

  const tableCard = el('div', { class: 'card' });
  tableCard.appendChild(el('h3', {}, 'Danh sách học sinh (' + students.length + ')'));
  const table = el('table');
  table.appendChild(el('thead', {},
    el('tr', {},
      el('th', {}, 'STT'),
      el('th', {}, 'Mã'),
      el('th', {}, 'Họ tên'),
      el('th', {}, 'Giới tính'),
      el('th', {}, 'Ngày sinh'),
      el('th', { style: { width: '90px' } }, 'Hành động'),
    )
  ));
  const tbody = el('tbody');
  students.forEach((s, i) => {
    tbody.appendChild(el('tr', {},
      el('td', {}, String(i + 1)),
      el('td', {}, s.student_code),
      el('td', {}, el('strong', {}, s.full_name)),
      el('td', {}, s.gender === 'M' ? 'Nam' : s.gender === 'F' ? 'Nữ' : s.gender === 'O' ? 'Khác' : '—'),
      el('td', {}, s.date_of_birth ? formatDate(s.date_of_birth) : '—'),
      el('td', {},
        el('button', { class: 'btn btn-sm btn-danger', onClick: async () => {
          if (!confirm(`Xoá học sinh "${s.full_name}"?`)) return;
          try { await api('/students/' + s.id, { method: 'DELETE' }); toast('Đã xoá', 'success'); renderClassDetail(['class', classId]); }
          catch (err) { toast(err.message, 'error'); }
        }}, 'Xoá')
      )
    ));
  });
  table.appendChild(tbody);
  tableCard.appendChild(table);
  main.appendChild(tableCard);
}

function renderSessionsTab(main, classId, sessions) {
  const card = el('div', { class: 'card' });
  card.appendChild(el('h3', {}, '➕ Tạo buổi học mới'));
  card.appendChild(el('form', { onSubmit: async (e) => {
    e.preventDefault();
    const body = {
      session_date: $('#sesDate').value,
      title: $('#sesTitle').value.trim(),
      note: $('#sesNote').value.trim(),
    };
    if (!body.session_date) return;
    try {
      await api('/classes/' + classId + '/sessions', { method: 'POST', body });
      toast('Đã tạo buổi học', 'success');
      renderClassDetail(['class', classId]);
    } catch (err) { toast(err.message, 'error'); }
  }},
    el('div', { class: 'form-grid' },
      el('div', { class: 'form-row' },
        el('label', {}, 'Ngày học *'),
        el('input', { type: 'date', id: 'sesDate', value: todayStr(), required: true })
      ),
      el('div', { class: 'form-row', style: { gridColumn: 'span 2' } },
        el('label', {}, 'Chủ đề buổi học'),
        el('input', { type: 'text', id: 'sesTitle', placeholder: 'VD: Unit 5 - Weather' })
      ),
    ),
    el('div', { class: 'form-row', style: { marginTop: '10px' } },
      el('label', {}, 'Ghi chú chung'),
      el('textarea', { id: 'sesNote', rows: '2' })
    ),
    el('div', { style: { marginTop: '12px' } },
      el('button', { class: 'btn', type: 'submit' }, 'Tạo buổi học')
    )
  ));
  main.appendChild(card);

  if (sessions.length === 0) {
    main.appendChild(el('div', { class: 'card empty' }, 'Lớp chưa có buổi học nào. Tạo buổi đầu tiên ở trên.'));
    return;
  }

  const tableCard = el('div', { class: 'card' });
  tableCard.appendChild(el('h3', {}, 'Danh sách buổi học (' + sessions.length + ')'));
  const table = el('table');
  table.appendChild(el('thead', {},
    el('tr', {},
      el('th', {}, 'Ngày'),
      el('th', {}, 'Chủ đề'),
      el('th', {}, 'Ghi chú'),
      el('th', { style: { width: '260px' } }, 'Hành động'),
    )
  ));
  const tbody = el('tbody');
  sessions.forEach(s => {
    tbody.appendChild(el('tr', {},
      el('td', {}, el('strong', {}, formatDate(s.session_date))),
      el('td', {}, s.title || '—'),
      el('td', {}, s.note || '—'),
      el('td', {},
        el('div', { class: 'actions-cell' },
          el('button', { class: 'btn btn-sm btn-success', onClick: () => navigate('#session-edit/' + s.id) }, '✏️ Điểm danh'),
          el('button', { class: 'btn btn-sm btn-secondary', onClick: () => navigate('#session-view/' + s.id) }, '👁️ Xem'),
          el('button', { class: 'btn btn-sm btn-danger', onClick: async () => {
            if (!confirm('Xoá buổi học này?')) return;
            try { await api('/sessions/' + s.id, { method: 'DELETE' }); toast('Đã xoá buổi học', 'success'); renderClassDetail(['class', classId]); }
            catch (err) { toast(err.message, 'error'); }
          }}, 'Xoá'),
        )
      )
    ));
  });
  table.appendChild(tbody);
  tableCard.appendChild(table);
  main.appendChild(tableCard);
}

// =====================================================
// View: Điểm danh buổi học
// =====================================================
let currentSession = null;
let currentAttendances = [];
let currentClassSessions = []; // danh sách tất cả sessions của lớp hiện tại (cho điều hướng Trước/Sau)

async function renderSessionEdit(parts) {
  const sessionId = parts[1];
  if (!sessionId) return navigate('#');

  $('#app').innerHTML = '<p class="loading">Đang tải...</p>';

  try {
    const data = await api('/sessions/' + sessionId);
    currentSession = data.session;
    currentAttendances = data.attendances;
    // Lấy luôn toàn bộ sessions của lớp để dùng cho điều hướng Trước/Sau
    try {
      currentClassSessions = await api('/classes/' + currentSession.class_id + '/sessions');
    } catch (e) {
      currentClassSessions = [currentSession];
    }
    paintSessionEditor(true);
  } catch (err) {
    $('#app').innerHTML = `<div class="card empty">Lỗi: ${err.message}</div>`;
  }
}

async function renderSessionView(parts) {
  const sessionId = parts[1];
  if (!sessionId) return navigate('#');

  $('#app').innerHTML = '<p class="loading">Đang tải...</p>';

  try {
    const data = await api('/sessions/' + sessionId);
    currentSession = data.session;
    currentAttendances = data.attendances;
    try {
      currentClassSessions = await api('/classes/' + currentSession.class_id + '/sessions');
    } catch (e) {
      currentClassSessions = [currentSession];
    }
    paintSessionEditor(false);
  } catch (err) {
    $('#app').innerHTML = `<div class="card empty">Lỗi: ${err.message}</div>`;
  }
}

// Tìm buổi học gần nhất theo hướng (offset âm = trước, dương = sau)
// direction: -1 = trước, 1 = sau
// fromDate: ngày tham chiếu (string yyyy-MM-dd). Mặc định = ngày của currentSession
function findAdjacentSession(direction, fromDate) {
  const ref = fromDate || (currentSession ? currentSession.session_date : null);
  if (!ref || !currentClassSessions.length) return null;
  // Sắp xếp theo ngày tăng dần
  const sorted = currentClassSessions.slice().sort((a, b) => a.session_date.localeCompare(b.session_date));
  if (direction < 0) {
    // Tìm buổi có session_date < ref, lấy cái gần nhất (lớn nhất < ref)
    const candidates = sorted.filter(s => s.session_date < ref);
    return candidates.length ? candidates[candidates.length - 1] : null;
  } else {
    // Tìm buổi có session_date > ref, lấy cái gần nhất (nhỏ nhất > ref)
    const candidates = sorted.filter(s => s.session_date > ref);
    return candidates.length ? candidates[0] : null;
  }
}

// Tìm buổi học đúng ngày (yyyy-MM-dd). Nếu không có thì trả null.
function findSessionByDate(dateStr) {
  return currentClassSessions.find(s => s.session_date === dateStr) || null;
}

// Hàm chung: chuyển sang trang điểm danh của 1 session
function gotoSession(s, editable) {
  if (!s) return;
  if (editable) navigate('#session-edit/' + s.id);
  else navigate('#session-view/' + s.id);
}

// Điều hướng theo ngày từ input date picker
async function goToDate(dateStr) {
  if (!dateStr) return;
  // Nếu đúng ngày hiện tại -> reload
  if (currentSession && dateStr === currentSession.session_date) {
    // re-render
    if (location.hash.startsWith('#session-view/')) renderSessionView(['session-view', currentSession.id]);
    else renderSessionEdit(['session-edit', currentSession.id]);
    return;
  }
  // Tìm buổi có ngày đó
  const target = findSessionByDate(dateStr);
  if (target) {
    gotoSession(target, true);
    return;
  }
  // Không có buổi đúng ngày - hỏi có muốn tạo mới không
  if (!confirm('Chưa có buổi học ngày ' + dateStr + ' cho lớp này.\nBấm OK để tạo buổi mới và bắt đầu điểm danh.')) return;
  try {
    const created = await api('/classes/' + currentSession.class_id + '/sessions', {
      method: 'POST',
      body: {
        session_date: dateStr,
        title: 'Buổi học ' + dateStr,
        note: 'Tạo nhanh từ trang điểm danh'
      }
    });
    toast('Đã tạo buổi học mới', 'success');
    gotoSession(created, true);
  } catch (err) {
    toast(err.message, 'error');
  }
}

function bulkSet(mode) {
  // mode: true = tất cả có mặt, false = tất cả vắng, null = đảo ngược
  currentAttendances.forEach(a => {
    if (mode === null)      a.is_present = a.is_present == 1 ? 0 : 1;
    else if (mode === true) a.is_present = 1;
    else                    a.is_present = 0;
  });
  paintSessionEditor(true);
  updateSummary();
}

function updateSummary() {
  const present = currentAttendances.filter(a => a.is_present == 1).length;
  const absent  = currentAttendances.filter(a => a.is_present == 0).length;
  const sumCard = $('#attendanceSummary');
  if (sumCard) {
    sumCard.innerHTML = `
      <div style="display:flex; gap:24px; flex-wrap:wrap">
        <div><strong>Tổng:</strong> ${currentAttendances.length}</div>
        <div><strong style="color:#059669">Có mặt:</strong> ${present}</div>
        <div><strong style="color:#dc2626">Vắng:</strong> ${absent}</div>
      </div>`;
  }
}

function paintSessionEditor(editable) {
  const s = currentSession;
  if (!s) return;
  setCrumbs([
    { label: 'Lớp: ' + (currentClass ? currentClass.name : ''), href: '#class/' + s.class_id },
    { label: 'Buổi ' + formatDate(s.session_date) + ' - ' + (s.title || 'Điểm danh') },
  ]);

  const main = $('#app');
  main.innerHTML = '';

  main.appendChild(el('h1', {}, '📋 ' + (editable ? 'Điểm danh' : 'Xem điểm danh') + ': ' + formatDate(s.session_date)));
  if (s.title) main.appendChild(el('h2', { style: { color: '#6b7280', fontWeight: 500 } }, s.title));
  if (s.note) main.appendChild(el('p', { style: { color: '#6b7280' } }, '📝 ' + s.note));

  // === Thanh điều hướng ngày (Trước / Sau / Date picker / Hôm nay) ===
  const nav = el('div', {
    class: 'card',
    id: 'dateNavBar',
    style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', background: '#f9fafb' }
  });

  // Nút "Trước"
  const prev = findAdjacentSession(-1);
  const btnPrev = document.createElement('button');
  btnPrev.className = 'btn btn-sm';
  btnPrev.innerHTML = '◀ Trước';
  if (prev) {
    const prevLabel = formatDate(prev.session_date);
    btnPrev.title = 'Buổi ' + prevLabel + ' - ' + (prev.title || 'Điểm danh');
    btnPrev.addEventListener('click', function () { gotoSession(prev, editable); });
  } else {
    btnPrev.disabled = true;
    btnPrev.style.opacity = '0.4';
    btnPrev.style.cursor = 'not-allowed';
    btnPrev.title = 'Không có buổi trước đó';
  }
  nav.appendChild(btnPrev);

  // Date picker
  const dateWrap = document.createElement('div');
  dateWrap.style.cssText = 'display:flex;align-items:center;gap:6px';
  const dateLabel = document.createElement('label');
  dateLabel.textContent = '📅 Chọn ngày:';
  dateLabel.style.cssText = 'font-size:14px;color:#374151';
  dateWrap.appendChild(dateLabel);
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.id = 'sessionDatePicker';
  dateInput.value = s.session_date;
  dateInput.style.cssText = 'padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:14px';
  dateInput.addEventListener('change', function () { goToDate(dateInput.value); });
  dateWrap.appendChild(dateInput);
  nav.appendChild(dateWrap);

  // Nút "Hôm nay"
  const todayStrVal = todayStr();
  const btnToday = document.createElement('button');
  btnToday.className = 'btn btn-sm btn-secondary';
  btnToday.textContent = '📌 Hôm nay';
  if (s.session_date === todayStrVal) {
    btnToday.disabled = true;
    btnToday.style.opacity = '0.4';
    btnToday.style.cursor = 'not-allowed';
    btnToday.title = 'Đang ở buổi hôm nay';
  } else {
    btnToday.addEventListener('click', function () { goToDate(todayStrVal); });
  }
  nav.appendChild(btnToday);

  // Nút "Sau"
  const next = findAdjacentSession(1);
  const btnNext = document.createElement('button');
  btnNext.className = 'btn btn-sm';
  btnNext.innerHTML = 'Sau ▶';
  if (next) {
    const nextLabel = formatDate(next.session_date);
    btnNext.title = 'Buổi ' + nextLabel + ' - ' + (next.title || 'Điểm danh');
    btnNext.addEventListener('click', function () { gotoSession(next, editable); });
  } else {
    btnNext.disabled = true;
    btnNext.style.opacity = '0.4';
    btnNext.style.cursor = 'not-allowed';
    btnNext.title = 'Không có buổi sau đó';
  }
  nav.appendChild(btnNext);

  // Hiển thị số buổi đã có (cho biết mình đang ở vị trí nào)
  const idx = currentClassSessions.slice().sort((a,b)=>a.session_date.localeCompare(b.session_date)).findIndex(x => x.id === s.id);
  const total = currentClassSessions.length;
  const posInfo = document.createElement('div');
  posInfo.style.cssText = 'margin-left:auto;font-size:13px;color:#6b7280';
  posInfo.textContent = 'Buổi ' + (idx >= 0 ? (idx + 1) : '?') + ' / ' + total + ' của lớp';
  nav.appendChild(posInfo);

  main.appendChild(nav);

  if (currentAttendances.length === 0) {
    main.appendChild(el('div', { class: 'card empty' }, 'Lớp chưa có học sinh. Hãy thêm học sinh trước.'));
    return;
  }

  // Tóm tắt
  const present = currentAttendances.filter(a => a.is_present == 1).length;
  const absent  = currentAttendances.filter(a => a.is_present == 0).length;
  const summary = el('div', { class: 'card', id: 'attendanceSummary', style: { background: '#eef2ff' } },
    el('div', { style: { display: 'flex', gap: '24px', flexWrap: 'wrap' } },
      el('div', {}, el('strong', {}, 'Tổng: '), currentAttendances.length),
      el('div', {}, el('strong', { style: { color: '#059669' } }, 'Có mặt: '), present),
      el('div', {}, el('strong', { style: { color: '#dc2626' } }, 'Vắng: '), absent),
    )
  );
  main.appendChild(summary);

  // Bảng điểm danh - dùng DOM thuần để chắc chắn mọi handler hoạt động
  const tableCard = document.createElement('div');
  tableCard.className = 'card';
  const table = document.createElement('table');
  table.className = 'attendance-table';

  // thead
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const ths = [
    { w: '40px',  label: '#' },
    { w: null,    label: 'Họ tên' },
    { w: '90px',  label: 'Có mặt' },
    { w: '90px',  label: 'Điểm (1-10)' },
    { w: '150px', label: 'Xếp loại' },
    { w: null,    label: 'Nhận xét' },
  ];
  ths.forEach(t => {
    const th = document.createElement('th');
    if (t.w) th.style.width = t.w;
    th.textContent = t.label;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  // tbody
  const tbody = document.createElement('tbody');
  currentAttendances.forEach((a, i) => {
    // Backend có thể trả rows có student_id=null khi session chưa có attendance (LEFT JOIN).
    // Trong trường hợp đó ta dùng chỉ số thứ tự để phân biệt, và sẽ tạo mới khi lưu.
    const tr = document.createElement('tr');
    const sidTag = a.student_id != null ? String(a.student_id) : 'new-' + i;
    tr.setAttribute('data-sid', sidTag);

    const td1 = document.createElement('td');
    td1.textContent = String(i + 1);
    tr.appendChild(td1);

    const td2 = document.createElement('td');
    const nameStrong = document.createElement('strong');
    nameStrong.textContent = a.full_name;
    const codeDiv = document.createElement('div');
    codeDiv.style.cssText = 'font-size:12px;color:#6b7280';
    codeDiv.textContent = a.student_code;
    td2.appendChild(nameStrong);
    td2.appendChild(codeDiv);
    tr.appendChild(td2);

    if (editable) {
      // Có mặt - chỉ checkbox, không label thay đổi
      const tdPresent = document.createElement('td');
      tdPresent.className = 'present-cell';
      tdPresent.style.textAlign = 'center';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.checked = a.is_present == 1;
      chk.setAttribute('data-field', 'is_present');
      chk.addEventListener('change', function () { a.is_present = chk.checked ? 1 : 0; });
      tdPresent.appendChild(chk);
      tr.appendChild(tdPresent);

      // Điểm
      const tdScore = document.createElement('td');
      const scoreInp = document.createElement('input');
      scoreInp.type = 'number';
      scoreInp.min = '1';
      scoreInp.max = '10';
      scoreInp.step = '1';
      scoreInp.value = a.lesson_score != null ? String(a.lesson_score) : '';
      scoreInp.style.cssText = 'width:70px;padding:4px;border:1px solid #d1d5db;border-radius:4px';
      // Auto cập nhật xếp loại theo điểm
      function autoGrade(score) {
        if (score == null || score === '' || isNaN(score)) return null;
        const n = Number(score);
        if (n >= 9) return 'Tốt';
        if (n >= 7) return 'Khá';
        if (n >= 5) return 'Trung bình';
        return 'Yếu';
      }
      scoreInp.addEventListener('input', function () {
        a.lesson_score = scoreInp.value;
        // Nếu user chưa tự chọn xếp loại (giá trị rỗng hoặc trùng auto), cập nhật theo
        const g = autoGrade(scoreInp.value);
        if (g && (!a.lesson_grade || ['Tốt','Khá','Trung bình','Yếu'].indexOf(a.lesson_grade) >= 0)) {
          a.lesson_grade = g;
          // Cập nhật lại select nếu tồn tại
          const tr2 = scoreInp.closest('tr');
          if (tr2) {
            const sel2 = tr2.querySelector('select');
            if (sel2) {
              for (const opt of sel2.options) {
                if (opt.value === g) { opt.selected = true; break; }
              }
            }
          }
        }
      });
      tdScore.appendChild(scoreInp);
      tr.appendChild(tdScore);

      // Xếp loại
      const tdGrade = document.createElement('td');
      const sel = document.createElement('select');
      sel.style.cssText = 'padding:4px;border:1px solid #d1d5db;border-radius:4px';
      [['--', null], ['Tốt', 'Tốt'], ['Khá', 'Khá'], ['Trung bình', 'Trung bình'], ['Yếu', 'Yếu']].forEach(([label, val]) => {
        const opt = document.createElement('option');
        opt.value = val || '';
        opt.textContent = label;
        if ((a.lesson_grade || '') === (val || '')) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', function () { a.lesson_grade = sel.value || null; });
      tdGrade.appendChild(sel);
      tr.appendChild(tdGrade);

      // Nhận xét
      const tdNote = document.createElement('td');
      const ta = document.createElement('textarea');
      ta.rows = 1;
      ta.placeholder = 'Nhận xét...';
      ta.style.cssText = 'width:100%;padding:4px;border:1px solid #d1d5db;border-radius:4px;resize:vertical';
      ta.value = a.teacher_note || '';
      ta.addEventListener('input', function () { a.teacher_note = ta.value; });
      tdNote.appendChild(ta);
      tr.appendChild(tdNote);
    } else {
      // Read-only view
      const tdP = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = 'badge ' + (a.is_present == 1 ? 'badge-green' : 'badge-red');
      badge.textContent = a.is_present == 1 ? 'Có mặt' : 'Vắng';
      tdP.appendChild(badge);
      tr.appendChild(tdP);

      const tdS = document.createElement('td');
      tdS.textContent = a.lesson_score != null ? String(a.lesson_score) : '—';
      tr.appendChild(tdS);

      const tdG = document.createElement('td');
      tdG.textContent = a.lesson_grade || '—';
      tr.appendChild(tdG);

      const tdN = document.createElement('td');
      tdN.style.whiteSpace = 'pre-wrap';
      tdN.textContent = a.teacher_note || '—';
      tr.appendChild(tdN);
    }

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tableCard.appendChild(table);

  if (editable) {
    // Toolbar phụ: tick nhanh - DOM thuần
    const quickBar = document.createElement('div');
    quickBar.className = 'toolbar';
    quickBar.style.cssText = 'margin-top:12px;background:#f9fafb';
    const qbLabel = document.createElement('span');
    qbLabel.style.cssText = 'color:#6b7280;margin-right:8px';
    qbLabel.textContent = 'Thao tác nhanh:';
    quickBar.appendChild(qbLabel);
    const btnAllPresent = document.createElement('button');
    btnAllPresent.className = 'btn btn-sm';
    btnAllPresent.textContent = '✅ Tất cả có mặt';
    btnAllPresent.addEventListener('click', function () { bulkSet(true); });
    quickBar.appendChild(btnAllPresent);
    const btnAllAbsent = document.createElement('button');
    btnAllAbsent.className = 'btn btn-sm btn-secondary';
    btnAllAbsent.textContent = '❌ Tất cả vắng';
    btnAllAbsent.addEventListener('click', function () { bulkSet(false); });
    quickBar.appendChild(btnAllAbsent);
    const btnToggle = document.createElement('button');
    btnToggle.className = 'btn btn-sm btn-secondary';
    btnToggle.textContent = '🔄 Đảo ngược';
    btnToggle.addEventListener('click', function () { bulkSet(null); });
    quickBar.appendChild(btnToggle);
    tableCard.appendChild(quickBar);

    // Toolbar chính: Lưu + Quay lại
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    toolbar.style.marginTop = '12px';

    const btnSave = document.createElement('button');
    btnSave.className = 'btn';
    btnSave.textContent = '💾 Lưu điểm danh';
    btnSave.addEventListener('click', async function () {
      btnSave.disabled = true;
      btnSave.textContent = '⏳ Đang lưu...';
      try {
        // Lọc bỏ rows không có student_id (do backend LEFT JOIN trả về cho HS chưa điểm danh)
        // và chỉ gửi những rows có student_id thật.
        const validItems = currentAttendances.filter(a => a.student_id != null);
        if (validItems.length === 0) {
          toast('Không có học sinh nào để lưu', 'error');
          btnSave.textContent = '💾 Lưu điểm danh';
          btnSave.disabled = false;
          return;
        }
        const items = validItems.map(a => ({
          student_id: a.student_id,
          is_present: a.is_present == 1,
          lesson_score: (a.lesson_score === '' || a.lesson_score == null || a.lesson_score === undefined)
            ? null : Number(a.lesson_score),
          lesson_grade: a.lesson_grade || null,
          teacher_note: a.teacher_note || null,
        }));
        await api('/sessions/' + s.id + '/attendances', { method: 'POST', body: { items } });
        toast('Đã lưu điểm danh (' + items.length + ' học sinh)', 'success');
        btnSave.textContent = '✅ Đã lưu';
        setTimeout(function () { btnSave.textContent = '💾 Lưu điểm danh'; btnSave.disabled = false; }, 1500);
      } catch (err) {
        toast(err.message, 'error');
        btnSave.textContent = '💾 Lưu điểm danh';
        btnSave.disabled = false;
      }
    });
    toolbar.appendChild(btnSave);

    const btnBack = document.createElement('button');
    btnBack.className = 'btn btn-secondary';
    btnBack.textContent = '← Quay lại lớp';
    btnBack.addEventListener('click', function () {
      if (currentClass) navigate('#class/' + s.class_id);
      else navigate('#');
    });
    toolbar.appendChild(btnBack);

    tableCard.appendChild(toolbar);
  } else {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    toolbar.style.marginTop = '12px';

    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn';
    btnEdit.textContent = '✏️ Sửa điểm danh';
    btnEdit.addEventListener('click', function () { navigate('#session-edit/' + s.id); });
    toolbar.appendChild(btnEdit);

    const btnBack = document.createElement('button');
    btnBack.className = 'btn btn-secondary';
    btnBack.textContent = '← Quay lại lớp';
    btnBack.addEventListener('click', function () {
      if (currentClass) navigate('#class/' + s.class_id);
      else navigate('#');
    });
    toolbar.appendChild(btnBack);

    tableCard.appendChild(toolbar);
  }
  main.appendChild(tableCard);
}

// =====================================================
// View: Thống kê điểm danh theo tháng
// =====================================================
async function renderClassStats(parts) {
  const classId = parts[1];
  const year = Number(parts[2]) || new Date().getFullYear();
  const month = Number(parts[3]) || (new Date().getMonth() + 1);
  if (!classId) return navigate('#');

  setCrumbs([
    { label: 'Lớp: ' + (currentClass ? currentClass.name : '#' + classId), href: '#class/' + classId },
    { label: 'Thống kê tháng ' + month + '/' + year },
  ]);

  const main = $('#app');
  main.innerHTML = '<p class="loading">Đang tải thống kê...</p>';

  try {
    // Lấy tên lớp nếu chưa có
    if (!currentClass || currentClass.id != classId) {
      const list = await api('/classes');
      currentClass = list.find(c => c.id == classId) || { id: classId, name: 'Lớp ' + classId };
    }
    const stats = await api(`/classes/${classId}/stats?year=${year}&month=${month}`);

    main.innerHTML = '';
    main.appendChild(el('h1', {}, '📊 Thống kê điểm danh'));
    main.appendChild(el('h2', { style: { color: '#6b7280', fontWeight: 500 } },
      stats.class.name + ' • Tháng ' + stats.period.month + '/' + stats.period.year +
      ' (từ ' + stats.period.from + ' đến ' + stats.period.to + ')'
    ));

    // Bộ chọn tháng/năm
    const picker = el('div', { class: 'card', style: { padding: '16px' } });
    picker.appendChild(el('div', { style: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' } },
      el('label', {}, 'Tháng:'),
      (() => {
        const sel = el('select', { id: 'statMonth',
          onChange: () => {
            const y = $('#statYear') ? $('#statYear').value : year;
            console.log('[stats] month change -> #class-stats/' + classId + '/' + y + '/' + sel.value);
            navigate('#class-stats/' + classId + '/' + y + '/' + sel.value);
          }
        });
        for (let m = 1; m <= 12; m++) {
          const opt = el('option', { value: m, selected: m === month }, 'Tháng ' + m);
          sel.appendChild(opt);
        }
        return sel;
      })(),
      el('label', {}, 'Năm:'),
      (() => {
        const sel = el('select', { id: 'statYear',
          onChange: () => {
            const m = $('#statMonth') ? $('#statMonth').value : month;
            console.log('[stats] year change -> #class-stats/' + classId + '/' + sel.value + '/' + m);
            navigate('#class-stats/' + classId + '/' + sel.value + '/' + m);
          }
        });
        const thisYear = new Date().getFullYear();
        for (let y = thisYear - 2; y <= thisYear + 1; y++) {
          sel.appendChild(el('option', { value: y, selected: y === year }, String(y)));
        }
        return sel;
      })(),
      el('button', { class: 'btn btn-secondary', style: { marginLeft: 'auto' },
        onClick: () => navigate('#class/' + classId) }, '← Về lớp'),
    ));
    main.appendChild(picker);

    // Thẻ tổng quan
    const totalPresent = stats.students.reduce((s, x) => s + x.present_count, 0);
    const totalAbsent  = stats.students.reduce((s, x) => s + x.absent_count, 0);
    const overview = el('div', { class: 'card', style: { background: '#eef2ff', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' } },
      el('div', {}, el('div', { style: { fontSize: '13px', color: '#6b7280' } }, 'Số buổi học trong tháng'), el('div', { style: { fontSize: '28px', fontWeight: '700', color: '#4f46e5' } }, String(stats.total_sessions))),
      el('div', {}, el('div', { style: { fontSize: '13px', color: '#6b7280' } }, 'Tổng lượt có mặt'), el('div', { style: { fontSize: '28px', fontWeight: '700', color: '#059669' } }, String(totalPresent))),
      el('div', {}, el('div', { style: { fontSize: '13px', color: '#6b7280' } }, 'Tổng lượt vắng'), el('div', { style: { fontSize: '28px', fontWeight: '700', color: '#dc2626' } }, String(totalAbsent))),
      el('div', {}, el('div', { style: { fontSize: '13px', color: '#6b7280' } }, 'Sĩ số lớp'), el('div', { style: { fontSize: '28px', fontWeight: '700' } }, String(stats.students.length))),
    );
    main.appendChild(overview);

    // Bảng chi tiết từng HS
    const card = el('div', { class: 'card' });
    card.appendChild(el('h3', {}, 'Chi tiết theo học sinh'));

    if (stats.students.length === 0) {
      card.appendChild(el('div', { class: 'empty' }, 'Lớp chưa có học sinh.'));
    } else {
      const table = el('table');
      table.appendChild(el('thead', {},
        el('tr', {},
          el('th', {}, '#'),
          el('th', {}, 'Họ tên'),
          el('th', { style: { textAlign: 'center' } }, 'Có mặt'),
          el('th', { style: { textAlign: 'center' } }, 'Vắng'),
          el('th', { style: { textAlign: 'center' } }, 'Chưa tick'),
          el('th', { style: { textAlign: 'center' } }, 'Tổng buổi'),
          el('th', { style: { textAlign: 'center' } }, 'Tỉ lệ chuyên cần'),
          el('th', { style: { textAlign: 'center' } }, 'Điểm TB'),
        )
      ));
      const tbody = el('tbody');
      stats.students.forEach((s, i) => {
        const rateColor = s.attendance_rate >= 90 ? '#059669' : s.attendance_rate >= 75 ? '#d97706' : '#dc2626';
        const rateBg    = s.attendance_rate >= 90 ? '#d1fae5' : s.attendance_rate >= 75 ? '#fef3c7' : '#fee2e2';
        // Thanh tỉ lệ
        const bar = el('div', { style: { background: '#e5e7eb', borderRadius: '4px', height: '8px', width: '100%', overflow: 'hidden', marginTop: '4px' } },
          el('div', { style: { background: rateColor, width: s.attendance_rate + '%', height: '100%' } })
        );
        const avgCell = s.avg_score != null
          ? el('strong', { style: { color: s.avg_score >= 8 ? '#059669' : s.avg_score >= 5 ? '#d97706' : '#dc2626' } }, s.avg_score + ' đ')
          : '—';
        // Tên HS có thể click để xem chi tiết
        const nameLink = el('a', {
          href: '#student-stats/' + s.student_id,
          style: { color: '#4f46e5', textDecoration: 'none' }
        }, s.full_name);
        tbody.appendChild(el('tr', {},
          el('td', {}, String(i + 1)),
          el('td', {},
            nameLink,
            el('div', { style: { fontSize: '12px', color: '#6b7280' } }, s.student_code)
          ),
          el('td', { style: { textAlign: 'center', color: '#059669', fontWeight: '600' } }, String(s.present_count)),
          el('td', { style: { textAlign: 'center', color: s.absent_count > 0 ? '#dc2626' : '#6b7280', fontWeight: '600' } }, String(s.absent_count)),
          el('td', { style: { textAlign: 'center', color: s.unmarked_count > 0 ? '#d97706' : '#6b7280', fontWeight: '600' } },
            s.unmarked_count > 0
              ? el('span', { class: 'badge', style: { background: '#fef3c7', color: '#92400e' } }, String(s.unmarked_count))
              : String(s.unmarked_count)
          ),
          el('td', { style: { textAlign: 'center' } }, String(s.total_marked)),
          el('td', { style: { textAlign: 'center' } },
            el('span', { style: { display: 'inline-block', minWidth: '52px', padding: '2px 8px', background: rateBg, color: rateColor, borderRadius: '12px', fontWeight: '600', fontSize: '13px' } }, s.attendance_rate + '%'),
            bar
          ),
          el('td', { style: { textAlign: 'center' } }, avgCell),
        ));
      });
      table.appendChild(tbody);
      card.appendChild(table);
    }
    main.appendChild(card);
  } catch (err) {
    main.innerHTML = `<div class="card empty">Lỗi: ${err.message}</div>`;
  }
}

// =====================================================
// View: Thống kê chi tiết 1 học sinh
// =====================================================
async function renderStudentStats(parts) {
  const studentId = parts[1];
  if (!studentId) return navigate('#');

  setCrumbs([{ label: 'Học sinh #' + studentId }]);
  const main = $('#app');
  main.innerHTML = '<p class="loading">Đang tải thống kê học sinh...</p>';

  try {
    // Lấy thông tin HS + thống kê tổng quan
    const [studentList, stats, classes] = await Promise.all([
      api('/students/' + studentId).catch(() => null),
      api('/students/' + studentId + '/stats'),
    ]);

    main.innerHTML = '';
    if (!studentList) {
      main.appendChild(el('div', { class: 'card empty' }, 'Không tìm thấy học sinh #' + studentId));
      return;
    }

    setCrumbs([
      { label: 'Lớp: ' + (currentClass ? currentClass.name : ''), href: '#class/' + studentList.class_id },
      { label: 'HS: ' + studentList.full_name },
    ]);

    main.appendChild(el('h1', {}, '👤 ' + studentList.full_name));
    main.appendChild(el('p', { style: { color: '#6b7280' } },
      'Mã: ' + studentList.student_code +
      ' • Lớp: ' + (currentClass ? currentClass.name : '#' + studentList.class_id) +
      ' • Giới tính: ' + (studentList.gender === 'M' ? 'Nam' : studentList.gender === 'F' ? 'Nữ' : studentList.gender === 'O' ? 'Khác' : '—') +
      (studentList.date_of_birth ? ' • Sinh: ' + formatDate(studentList.date_of_birth) : '')
    ));

    // Thẻ tổng quan
    const total = Number(stats.total_sessions || 0);
    const present = Number(stats.present_count || 0);
    const absent = Number(stats.absent_count || 0);
    const unmarked = total - present - absent; // những buổi chưa tick
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    const avgScore = stats.avg_lesson_score;

    const overview = el('div', { class: 'card', style: { background: '#eef2ff', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' } },
      el('div', {}, el('div', { style: { fontSize: '13px', color: '#6b7280' } }, 'Tổng buổi'), el('div', { style: { fontSize: '28px', fontWeight: '700', color: '#4f46e5' } }, String(total))),
      el('div', {}, el('div', { style: { fontSize: '13px', color: '#6b7280' } }, 'Có mặt'), el('div', { style: { fontSize: '28px', fontWeight: '700', color: '#059669' } }, String(present))),
      el('div', {}, el('div', { style: { fontSize: '13px', color: '#6b7280' } }, 'Vắng'), el('div', { style: { fontSize: '28px', fontWeight: '700', color: '#dc2626' } }, String(absent))),
      el('div', {}, el('div', { style: { fontSize: '13px', color: '#6b7280' } }, 'Chưa tick'), el('div', { style: { fontSize: '28px', fontWeight: '700', color: unmarked > 0 ? '#d97706' : '#6b7280' } }, String(unmarked))),
      el('div', {}, el('div', { style: { fontSize: '13px', color: '#6b7280' } }, 'Tỉ lệ chuyên cần'), el('div', { style: { fontSize: '28px', fontWeight: '700' } }, rate + '%')),
      el('div', {}, el('div', { style: { fontSize: '13px', color: '#6b7280' } }, 'Điểm bài cũ TB'), el('div', { style: { fontSize: '28px', fontWeight: '700' } }, avgScore != null ? avgScore + ' đ' : '—')),
    );
    main.appendChild(overview);

    // Lấy lịch sử điểm danh
    const sessions = await api('/classes/' + studentList.class_id + '/sessions');
    const attendances = await api('/sessions/' + (sessions[0] ? sessions[0].id : 0) + '/attendances').catch(() => null);

    // Lấy từng attendance cho từng session
    const details = [];
    for (const s of sessions) {
      try {
        const a = await api('/sessions/' + s.id);
        const row = (a.attendances || []).find(x => x.student_id == studentId);
        details.push({
          session_id: s.id,
          session_date: s.session_date,
          title: s.title,
          is_present: row ? row.is_present : null,
          lesson_score: row ? row.lesson_score : null,
          lesson_grade: row ? row.lesson_grade : null,
          teacher_note: row ? row.teacher_note : null,
        });
      } catch (e) { /* skip */ }
    }
    details.sort((a, b) => b.session_date.localeCompare(a.session_date));

    const card = el('div', { class: 'card' });
    card.appendChild(el('h3', {}, 'Lịch sử điểm danh (' + details.length + ' buổi)'));

    if (details.length === 0) {
      card.appendChild(el('div', { class: 'empty' }, 'Lớp chưa có buổi học nào.'));
    } else {
      const table = el('table');
      table.appendChild(el('thead', {},
        el('tr', {},
          el('th', {}, 'Ngày'),
          el('th', {}, 'Chủ đề'),
          el('th', { style: { textAlign: 'center' } }, 'Trạng thái'),
          el('th', { style: { textAlign: 'center' } }, 'Điểm'),
          el('th', { style: { textAlign: 'center' } }, 'Xếp loại'),
          el('th', {}, 'Nhận xét'),
          el('th', { style: { textAlign: 'center', width: '90px' } }, ''),
        )
      ));
      const tbody = el('tbody');
      details.forEach(d => {
        const badge = d.is_present == null
          ? el('span', { class: 'badge', style: { background: '#f3f4f6', color: '#6b7280' } }, '— Chưa tick')
          : d.is_present == 1
            ? el('span', { class: 'badge badge-green' }, 'Có mặt')
            : el('span', { class: 'badge badge-red' }, 'Vắng');
        tbody.appendChild(el('tr', {},
          el('td', {}, el('strong', {}, formatDate(d.session_date))),
          el('td', {}, d.title || '—'),
          el('td', { style: { textAlign: 'center' } }, badge),
          el('td', { style: { textAlign: 'center' } }, d.lesson_score != null ? String(d.lesson_score) : '—'),
          el('td', { style: { textAlign: 'center' } }, d.lesson_grade || '—'),
          el('td', { style: { whiteSpace: 'pre-wrap' } }, d.teacher_note || '—'),
          el('td', { style: { textAlign: 'center' } },
            el('button', { class: 'btn btn-sm',
              onClick: () => navigate('#session-edit/' + d.session_id) }, 'Điểm danh')
          ),
        ));
      });
      table.appendChild(tbody);
      card.appendChild(table);
    }
    main.appendChild(card);

    // ============= Tổng hợp nhận xét bằng LLM =============
    const aiCard = el('div', { class: 'card', style: { background: '#fffbeb', borderLeft: '4px solid #f59e0b' } });
    aiCard.appendChild(el('h3', {}, '🤖 Tổng hợp nhận xét tháng bằng AI'));
    aiCard.appendChild(el('p', { style: { color: '#6b7280', fontSize: '14px' } },
      'Tổng hợp tất cả nhận xét trong tháng của học sinh này thành 1 đoạn nhận xét chung. ' +
      'API key / base url chỉ dùng để gọi LLM, không lưu trên server.'));

    // Hàng chọn tháng + nhập API
    const lsKey = 'llm_settings_v1';
    const saved = (() => { try { return JSON.parse(localStorage.getItem(lsKey) || '{}'); } catch { return {}; } })();

    const aiForm = el('div', { class: 'form-grid' });
    // Tháng
    const now = new Date();
    const monthSel = el('select', { id: 'aiMonth' },
      ...Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const txt = `Tháng ${m}/${now.getFullYear()}`;
        return el('option', { value: m, selected: m === (now.getMonth() + 1) ? 'selected' : null }, txt);
      })
    );
    const yearInp = el('input', { type: 'number', id: 'aiYear', value: String(saved.year || now.getFullYear()), min: '2020', max: '2100' });
    aiForm.appendChild(el('div', { class: 'form-row' }, el('label', {}, 'Tháng'), monthSel));
    aiForm.appendChild(el('div', { class: 'form-row' }, el('label', {}, 'Năm'), yearInp));

    // API key
    const keyInp = el('input', { type: 'password', id: 'aiKey', placeholder: 'sk-...', value: saved.api_key || '' });
    aiForm.appendChild(el('div', { class: 'form-row' },
      el('label', {}, '🔑 API key (lưu local)'),
      keyInp
    ));
    // Base URL
    const baseInp = el('input', { type: 'text', id: 'aiBase', placeholder: 'https://api.openai.com', value: saved.base_url || 'https://api.openai.com' });
    aiForm.appendChild(el('div', { class: 'form-row' },
      el('label', {}, '🌐 Base URL'),
      baseInp
    ));
    // Model
    const modelInp = el('input', { type: 'text', id: 'aiModel', placeholder: 'gpt-4o-mini', value: saved.model || 'gpt-4o-mini' });
    aiForm.appendChild(el('div', { class: 'form-row' },
      el('label', {}, '🧠 Model'),
      modelInp
    ));
    aiCard.appendChild(aiForm);

    const btnRow = el('div', { style: { display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' } });
    const btnSum = el('button', { class: 'btn', type: 'button' }, '✨ Tổng hợp nhận xét tháng');
    const btnSave = el('button', { class: 'btn btn-secondary', type: 'button' }, '💾 Lưu cấu hình');
    const noteCountSpan = el('span', { id: 'aiNoteCount', style: { color: '#6b7280', fontSize: '14px' } }, 'Đang đếm nhận xét...');
    btnRow.appendChild(btnSum);
    btnRow.appendChild(btnSave);
    btnRow.appendChild(noteCountSpan);
    aiCard.appendChild(btnRow);

    const aiResult = el('div', { id: 'aiResult', style: { marginTop: '16px' } });
    aiCard.appendChild(aiResult);
    main.appendChild(aiCard);

    // Đếm số note trong tháng hiện tại + cập nhật khi đổi tháng
    async function refreshNoteCount() {
      try {
        const m = Number($('#aiMonth').value);
        const y = Number($('#aiYear').value);
        const d = await api('/students/' + studentId + '/notes?year=' + y + '&month=' + m);
        noteCountSpan.textContent = 'Có ' + d.total_notes + ' nhận xét trong tháng ' + m + '/' + y;
        return d;
      } catch (e) {
        noteCountSpan.textContent = '(lỗi đếm note)';
        return null;
      }
    }
    monthSel.addEventListener('change', refreshNoteCount);
    yearInp.addEventListener('change', refreshNoteCount);
    refreshNoteCount();

    // Nút lưu cấu hình
    btnSave.addEventListener('click', () => {
      const cfg = {
        api_key: $('#aiKey').value.trim(),
        base_url: $('#aiBase').value.trim(),
        model: $('#aiModel').value.trim(),
        year: Number($('#aiYear').value),
      };
      localStorage.setItem(lsKey, JSON.stringify(cfg));
      toast('Đã lưu cấu hình LLM vào trình duyệt', 'success');
    });

    // Nút tổng hợp
    btnSum.addEventListener('click', async () => {
      const api_key = $('#aiKey').value.trim();
      const base_url = $('#aiBase').value.trim();
      const model = $('#aiModel').value.trim();
      const m = Number($('#aiMonth').value);
      const y = Number($('#aiYear').value);
      if (!api_key) { toast('Vui lòng nhập API key', 'error'); return; }

      // Lưu cấu hình luôn
      localStorage.setItem(lsKey, JSON.stringify({ api_key, base_url, model, year: y }));

      aiResult.innerHTML = '';
      aiResult.appendChild(el('p', { style: { color: '#6b7280' } }, '⏳ Đang gọi LLM...'));
      btnSum.disabled = true; btnSum.textContent = '⏳ Đang tổng hợp...';
      try {
        const data = await api('/students/' + studentId + '/notes?year=' + y + '&month=' + m);
        if (data.total_notes === 0) {
          aiResult.innerHTML = '';
          aiResult.appendChild(el('div', { class: 'empty', style: { background: '#fef3c7', color: '#92400e' } },
            '⚠ Tháng ' + m + '/' + y + ' chưa có nhận xét nào cho học sinh này. Hãy nhập nhận xét ở các buổi học trước rồi thử lại.'));
          return;
        }
        const r = await api('/ai/summarize-notes', {
          method: 'POST',
          body: {
            api_key, base_url, model,
            student_name: studentList.full_name,
            year: y, month: m,
            grade_level: (currentClass && currentClass.grade_level) || 3,
            notes: data.notes.map(n => ({
              date: n.session_date,
              note: n.teacher_note,
              score: n.lesson_score,
              grade: n.lesson_grade,
              present: n.is_present,
            })),
          }
        });
        aiResult.innerHTML = '';
        const summaryBox = el('div', { class: 'card', style: { background: '#f0fdf4', borderLeft: '4px solid #059669' } });
        summaryBox.appendChild(el('h4', {}, '📝 Nhận xét chung tháng ' + m + '/' + y + ' cho ' + studentList.full_name));
        const p = el('p', { style: { whiteSpace: 'pre-wrap', lineHeight: '1.7' } });
        p.textContent = r.summary;
        summaryBox.appendChild(p);
        if (r.model) {
          summaryBox.appendChild(el('div', { style: { fontSize: '12px', color: '#6b7280', marginTop: '8px' } },
            'Model: ' + r.model + (r.usage ? ' • Tokens: ' + (r.usage.total_tokens || '?') : '')));
        }
        // Nút copy
        const btnCopy = el('button', { class: 'btn btn-sm btn-secondary', type: 'button', style: { marginTop: '8px' },
          onClick: () => {
            navigator.clipboard.writeText(r.summary).then(() => toast('Đã copy nhận xét', 'success'));
          }
        }, '📋 Copy');
        summaryBox.appendChild(btnCopy);
        aiResult.appendChild(summaryBox);
      } catch (err) {
        aiResult.innerHTML = '';
        aiResult.appendChild(el('div', { class: 'card empty', style: { background: '#fee2e2', color: '#991b1b' } },
          '❌ Lỗi: ' + err.message));
      } finally {
        btnSum.disabled = false; btnSum.textContent = '✨ Tổng hợp nhận xét tháng';
      }
    });

    // Nút về lớp
    main.appendChild(el('div', { style: { marginTop: '16px' } },
      el('button', { class: 'btn btn-secondary',
        onClick: () => navigate('#class/' + studentList.class_id) }, '← Về lớp')
    ));
  } catch (err) {
    main.innerHTML = `<div class="card empty">Lỗi: ${err.message}</div>`;
  }
}

// =====================================================
// View: Quản lý giáo viên (chỉ admin)
// =====================================================
async function renderTeachers() {
  if (!currentTeacher || !currentTeacher.is_admin) {
    return navigate('#');
  }
  setCrumbs([{ label: 'Quản lý giáo viên' }]);
  const main = $('#app');
  main.innerHTML = '<p class="loading">Đang tải...</p>';

  try {
    const [teachers, classes] = await Promise.all([
      api('/teachers'),
      api('/classes'),
    ]);
    main.innerHTML = '';

    main.appendChild(el('h1', {}, '👥 Quản lý giáo viên'));
    main.appendChild(el('p', { style: { color: '#6b7280' } },
      'Danh sách tài khoản giáo viên. Chỉ quản trị viên mới thấy trang này.'));

    // Form thêm GV
    const card = el('div', { class: 'card' });
    card.appendChild(el('h3', {}, '➕ Thêm giáo viên mới'));
    const form = el('form', { onSubmit: async (e) => {
      e.preventDefault();
      const body = {
        full_name: $('#tFullName').value.trim(),
        username: $('#tUsername').value.trim().toLowerCase(),
        password: $('#tPassword').value,
        is_admin: $('#tIsAdmin').value === '1',
      };
      if (!body.full_name || !body.username || !body.password) {
        toast('Vui lòng nhập đầy đủ họ tên, tên đăng nhập và mật khẩu', 'error');
        return;
      }
      try {
        await api('/teachers', { method: 'POST', body });
        toast('Đã thêm giáo viên ' + body.full_name, 'success');
        $('#tFullName').value = '';
        $('#tUsername').value = '';
        $('#tPassword').value = '';
        $('#tIsAdmin').value = '0';
        renderTeachers();
      } catch (err) { toast(err.message, 'error'); }
    }},
      el('div', { class: 'form-grid' },
        el('div', { class: 'form-row' },
          el('label', {}, 'Họ tên *'),
          el('input', { type: 'text', id: 'tFullName', required: true, placeholder: 'VD: Nguyễn Văn A' })
        ),
        el('div', { class: 'form-row' },
          el('label', {}, 'Tên đăng nhập *'),
          el('input', { type: 'text', id: 'tUsername', required: true, placeholder: 'VD: nguyenvana (chữ thường, không dấu)' })
        ),
        el('div', { class: 'form-row' },
          el('label', {}, 'Mật khẩu * (ít nhất 4 ký tự)'),
          el('input', { type: 'password', id: 'tPassword', required: true, minlength: 4, placeholder: 'Tối thiểu 4 ký tự' })
        ),
        el('div', { class: 'form-row' },
          el('label', {}, 'Vai trò'),
          el('select', { id: 'tIsAdmin' },
            el('option', { value: '0' }, 'Giáo viên thường'),
            el('option', { value: '1' }, 'Quản trị viên (admin)'),
          )
        ),
      ),
      el('div', { style: { marginTop: '12px' } },
        el('button', { class: 'btn', type: 'submit' }, 'Thêm giáo viên')
      )
    );
    card.appendChild(form);
    main.appendChild(card);

    // Bảng danh sách GV
    const tableCard = el('div', { class: 'card' });
    tableCard.appendChild(el('h3', {}, 'Danh sách (' + teachers.length + ' giáo viên)'));
    const table = el('table');
    table.appendChild(el('thead', {},
      el('tr', {},
        el('th', { style: { width: '40px' } }, 'STT'),
        el('th', {}, 'Họ tên'),
        el('th', {}, 'Tên đăng nhập'),
        el('th', {}, 'Vai trò'),
        el('th', {}, 'Số lớp phụ trách'),
        el('th', { style: { width: '90px' } }, 'Hành động'),
      )
    ));
    const tbody = el('tbody');
    teachers.forEach((t, i) => {
      const classCount = classes.filter(c => Number(c.teacher_id) === t.id).length;
      const isMe = t.id === currentTeacher.id;
      tbody.appendChild(el('tr', {},
        el('td', {}, String(i + 1)),
        el('td', {}, el('strong', {}, t.full_name), isMe ? el('div', { style: { fontSize: '12px', color: '#4f46e5' } }, '(Bạn)') : null),
        el('td', {}, '@' + t.username),
        el('td', {}, t.is_admin == 1 || t.is_admin === true
          ? el('span', { class: 'badge', style: { background: '#fef3c7', color: '#92400e' } }, 'Quản trị viên')
          : 'Giáo viên'),
        el('td', {}, String(classCount)),
        el('td', {},
          isMe
            ? el('span', { style: { color: '#9ca3af', fontSize: '13px' } }, '—')
            : el('button', { class: 'btn btn-sm btn-danger',
                onClick: async () => {
                  if (!confirm('Xoá giáo viên "' + t.full_name + '" (@' + t.username + ')?\n\n' +
                    'Lưu ý: Lớp do GV này phụ trách sẽ được set teacher_id = NULL (không xoá lớp).')) return;
                  try {
                    await api('/teachers/' + t.id, { method: 'DELETE' });
                    toast('Đã xoá giáo viên', 'success');
                    renderTeachers();
                  } catch (err) { toast(err.message, 'error'); }
                }
              }, 'Xoá')
        ),
      ));
    });
    table.appendChild(tbody);
    tableCard.appendChild(table);
    main.appendChild(tableCard);
  } catch (err) {
    main.innerHTML = `<div class="card empty">Lỗi: ${err.message}</div>`;
  }
}

// =====================================================
// Khởi động
// =====================================================
render();
