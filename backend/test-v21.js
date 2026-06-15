const puppeteer = require('puppeteer-core');
const http = require('http');

function req(opts, body) {
  return new Promise((res, rej) => {
    const r = http.request(opts, x => { let b = ''; x.on('data', c => b += c); x.on('end', () => res(JSON.parse(b))); });
    r.on('error', rej);
    if (body) r.write(body);
    r.end();
  });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    timeout: 20000,
  });
  const page = await browser.newPage();
  page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warning') console.log('[' + msg.type() + ']', msg.text()); });
  page.on('pageerror', err => console.log('PAGEERR:', err.message));

  // ============== 1. Đăng nhập admin ==============
  console.log('=== [1] Login admin ===');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#loginUser', { timeout: 5000 });
  await new Promise(r => setTimeout(r, 500));
  await page.focus('#loginUser');
  await page.keyboard.type('admin');
  await page.focus('#loginPass');
  await page.keyboard.type('123456');
  await page.click('button.btn[type="submit"]');
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    const t = await page.evaluate(() => localStorage.getItem('linh_english_teacher'));
    if (t) break;
  }
  await new Promise(r => setTimeout(r, 800));

  // ============== 2. Test trang Quản lý GV ==============
  console.log('\n=== [2] Trang Quản lý GV (admin) ===');
  await page.evaluate(() => { location.hash = '#teachers'; });
  await new Promise(r => setTimeout(r, 1500));

  const teachersInfo = await page.evaluate(() => {
    const teacherLinks = Array.from(document.querySelectorAll('a')).filter(a => a.textContent.includes('Quản lý GV'));
    const hasForm = !!document.getElementById('tFullName');
    const rows = document.querySelectorAll('tbody tr').length;
    return {
      hasLink: teacherLinks.length > 0,
      hasForm, rows,
      h1: document.querySelector('h1') && document.querySelector('h1').innerText,
    };
  });
  console.log('  Link admin:', teachersInfo.hasLink);
  console.log('  Form thêm GV:', teachersInfo.hasForm);
  console.log('  Số dòng trong bảng:', teachersInfo.rows);
  console.log('  H1:', teachersInfo.h1);
  if (!teachersInfo.hasForm) { console.error('  ❌ FAIL: không có form thêm GV'); await browser.close(); return; }
  if (teachersInfo.rows < 2) { console.error('  ❌ FAIL: thiếu GV trong danh sách'); await browser.close(); return; }
  console.log('  ✅ PASS');

  // ============== 3. Test thêm GV mới ==============
  console.log('\n=== [3] Thêm GV mới ===');
  await page.focus('#tFullName');
  await page.keyboard.type('Test GV Auto');
  await page.focus('#tUsername');
  await page.keyboard.type('testgvauto');
  await page.focus('#tPassword');
  await page.keyboard.type('1234');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Thêm giáo viên' && b.type === 'submit');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const afterAdd = await page.evaluate(() => ({
    rows: document.querySelectorAll('tbody tr').length,
    toast: document.getElementById('toast') && document.getElementById('toast').innerText,
  }));
  console.log('  Rows after:', afterAdd.rows);
  console.log('  Toast:', afterAdd.toast);
  if (afterAdd.rows <= teachersInfo.rows) { console.error('  ❌ FAIL: không thêm được GV'); }
  else console.log('  ✅ PASS');

  // Verify DB
  const adminLogin = await req({hostname:'localhost',port:3000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json'}}, JSON.stringify({username:'admin',password:'123456'}));
  const teachers = await req({hostname:'localhost',port:3000,path:'/api/teachers',method:'GET',headers:{'X-Teacher-Id': adminLogin.teacher.id.toString()}});
  const testGV = teachers.find(t => t.username === 'testgvauto');
  if (!testGV) { console.error('  ❌ FAIL: GV testgvauto không có trong DB'); }
  else console.log('  ✅ PASS (DB có GV testgvauto id=' + testGV.id + ')');

  // ============== 4. Test xoá GV (GV test vừa tạo) ==============
  console.log('\n=== [4] Xoá GV testgvauto ===');
  // Setup dialog handler
  page.on('dialog', async dialog => { await dialog.accept(); });
  await page.evaluate((targetName) => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const row = rows.find(r => r.textContent.includes(targetName));
    if (row) {
      const btn = row.querySelector('button.btn-danger');
      if (btn) btn.click();
    }
  }, 'Test GV Auto');
  await new Promise(r => setTimeout(r, 1500));

  const teachersAfter = await req({hostname:'localhost',port:3000,path:'/api/teachers',method:'GET',headers:{'X-Teacher-Id': adminLogin.teacher.id.toString()}});
  const stillExists = teachersAfter.find(t => t.username === 'testgvauto');
  if (stillExists) { console.error('  ❌ FAIL: GV testgvauto vẫn còn trong DB'); }
  else console.log('  ✅ PASS (DB không còn testgvauto)');

  // ============== 5. Test trang thống kê + cột "Chưa tick" ==============
  console.log('\n=== [5] Trang thống kê + cột "Chưa tick" ===');
  await page.evaluate(() => { location.hash = '#'; });
  await new Promise(r => setTimeout(r, 1500));
  const firstClassId = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Thống kê'));
    if (!btn) return null;
    // Lấy classId từ onclick
    const t = btn.outerHTML.match(/(\d+)\/(\d+)/g);
    return t ? t[0] : null;
  });
  // Đi thẳng vào class-stats
  await page.evaluate(() => { location.hash = '#class-stats/1/' + new Date().getFullYear() + '/' + (new Date().getMonth() + 1); });
  await new Promise(r => setTimeout(r, 2000));

  const statsInfo = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('thead th')).map(h => h.innerText.trim());
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const firstRowCells = rows[0] ? Array.from(rows[0].querySelectorAll('td')).map(td => td.innerText.trim()) : [];
    return { headers, firstRowCells, hasUnmarked: headers.includes('Chưa tick') };
  });
  console.log('  Headers:', statsInfo.headers);
  console.log('  Row 0:', statsInfo.firstRowCells);
  if (!statsInfo.hasUnmarked) { console.error('  ❌ FAIL: không có cột "Chưa tick"'); }
  else console.log('  ✅ PASS');

  // ============== 6. Click tên HS → trang chi tiết ==============
  console.log('\n=== [6] Click tên HS → chi tiết ===');
  const hashBefore = await page.evaluate(() => location.hash);
  console.log('  Hash before:', hashBefore);
  await page.evaluate(() => {
    const link = document.querySelector('tbody a[href^="#student-stats/"]');
    if (link) link.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  const studentInfo = await page.evaluate(() => ({
    hash: location.hash,
    h1: document.querySelector('h1') && document.querySelector('p') && document.querySelector('p').innerText,
    tableRows: document.querySelectorAll('tbody tr').length,
  }));
  console.log('  Hash after:', studentInfo.hash);
  console.log('  Subtitle:', studentInfo.h1 && studentInfo.h1.slice(0, 100));
  console.log('  Số dòng lịch sử:', studentInfo.tableRows);
  if (!studentInfo.hash.startsWith('#student-stats/')) { console.error('  ❌ FAIL: không navigate đến student-stats'); }
  else console.log('  ✅ PASS');

  // ============== 7. Test confirm dialog khi tạo buổi tự động ==============
  console.log('\n=== [7] Confirm dialog khi tạo buổi mới ===');
  // Logout admin, login giáo viên
  await page.evaluate(() => { localStorage.removeItem('linh_english_teacher'); location.hash = ''; });
  await new Promise(r => setTimeout(r, 800));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#loginUser', { timeout: 5000 });
  await new Promise(r => setTimeout(r, 500));
  await page.focus('#loginUser');
  await page.keyboard.type('linhnguyen');
  await page.focus('#loginPass');
  await page.keyboard.type('123456');
  await page.click('button.btn[type="submit"]');
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    const t = await page.evaluate(() => localStorage.getItem('linh_english_teacher'));
    if (t) break;
  }
  await new Promise(r => setTimeout(r, 800));

  // Vào trang chủ, tìm lớp có thật + bấm Điểm danh
  // Lấy số buổi hiện tại của lớp 1
  const linhLogin = await req({hostname:'localhost',port:3000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json'}}, JSON.stringify({username:'linhnguyen',password:'123456'}));
  const sessionsBefore = await req({hostname:'localhost',port:3000,path:'/api/classes/1/sessions',method:'GET',headers:{'X-Teacher-Id': linhLogin.teacher.id.toString()}});
  console.log('  Số buổi lớp 1 trước:', sessionsBefore.length);

  // Lấy 1 lớp từ DB mà CHƯA có buổi hôm nay
  const allClasses = await req({hostname:'localhost',port:3000,path:'/api/classes',method:'GET',headers:{'X-Teacher-Id': linhLogin.teacher.id.toString()}});
  const today = new Date().toISOString().slice(0,10);
  let targetClass = null;
  for (const c of allClasses) {
    const ss = await req({hostname:'localhost',port:3000,path:'/api/classes/' + c.id + '/sessions',method:'GET',headers:{'X-Teacher-Id': linhLogin.teacher.id.toString()}});
    if (!ss.find(s => s.session_date === today)) {
      targetClass = c;
      break;
    }
  }
  if (!targetClass) {
    console.log('  Tất cả lớp đã có buổi hôm nay, tạo buổi trong tương lai...');
    // Lấy lớp đầu tiên, tạo buổi ở tương lai
    targetClass = allClasses[0];
    const futureDate = new Date(); futureDate.setDate(futureDate.getDate() + 30);
    const fd = futureDate.toISOString().slice(0,10);
    await req({hostname:'localhost',port:3000,path:'/api/classes/' + targetClass.id + '/sessions',method:'POST',headers:{'Content-Type':'application/json','X-Teacher-Id': linhLogin.teacher.id.toString()}}, JSON.stringify({session_date: fd, title: 'Buổi test' }));
    // Xoá luôn để test case này
    const ss2 = await req({hostname:'localhost',port:3000,path:'/api/classes/' + targetClass.id + '/sessions',method:'GET',headers:{'X-Teacher-Id': linhLogin.teacher.id.toString()}});
    const s2 = ss2.find(s => s.session_date === fd);
    if (s2) await req({hostname:'localhost',port:3000,path:'/api/sessions/' + s2.id,method:'DELETE',headers:{'X-Teacher-Id': linhLogin.teacher.id.toString()}});
    // Thêm buổi ở quá khứ để chắc lớp có buổi nhưng không phải hôm nay
    const pastDate = new Date(); pastDate.setDate(pastDate.getDate() - 1);
    const pd = pastDate.toISOString().slice(0,10);
    await req({hostname:'localhost',port:3000,path:'/api/classes/' + targetClass.id + '/sessions',method:'POST',headers:{'Content-Type':'application/json','X-Teacher-Id': linhLogin.teacher.id.toString()}}, JSON.stringify({session_date: pd, title: 'Buổi qua khứ' }));
  }
  console.log('  Target lớp:', targetClass.name, 'id=' + targetClass.id);

  // Đăng xuất + login lại để reload trang chủ
  await page.evaluate(() => { location.hash = ''; location.reload(); });
  await new Promise(r => setTimeout(r, 1500));

  // Bấm nút "Điểm danh" trên lớp target
  let dialogTriggered = false;
  page.once('dialog', async dialog => {
    dialogTriggered = true;
    console.log('  Dialog message:', dialog.message().slice(0, 80) + '...');
    await dialog.dismiss();  // Bấm Cancel để KHÔNG tạo buổi
  });
  await page.evaluate((classId) => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    for (const r of rows) {
      if (r.textContent.includes('Điểm danh')) {
        // Tìm nút Điểm danh
        const btn = Array.from(r.querySelectorAll('button')).find(b => b.textContent.includes('Điểm danh'));
        if (btn) { btn.click(); break; }
      }
    }
  }, targetClass.id);
  await new Promise(r => setTimeout(r, 2000));

  if (dialogTriggered) {
    console.log('  ✅ PASS (confirm dialog xuất hiện)');
  } else {
    console.log('  ❌ FAIL: confirm dialog KHÔNG xuất hiện');
  }

  // Verify không có buổi mới được tạo
  const sessionsAfter = await req({hostname:'localhost',port:3000,path:'/api/classes/' + targetClass.id + '/sessions',method:'GET',headers:{'X-Teacher-Id': linhLogin.teacher.id.toString()}});
  const today2 = new Date().toISOString().slice(0,10);
  const todayCount = sessionsAfter.filter(s => s.session_date === today2).length;
  console.log('  Số buổi hôm nay sau khi cancel:', todayCount);
  if (todayCount === 0) console.log('  ✅ PASS (không tạo buổi do user cancel)');
  else console.log('  ⚠ Buổi hôm nay đã tồn tại sẵn (count=' + todayCount + ')');

  // ============== 8. Test step="1" và auto-grade ==============
  console.log('\n=== [8] step="1" + auto-grade ===');
  // Mở buổi học của lớp 1
  const linhClasses = await req({hostname:'localhost',port:3000,path:'/api/classes',method:'GET',headers:{'X-Teacher-Id': linhLogin.teacher.id.toString()}});
  const cls1 = linhClasses.find(c => c.id == 1) || linhClasses[0];
  const cls1Sessions = await req({hostname:'localhost',port:3000,path:'/api/classes/' + cls1.id + '/sessions',method:'GET',headers:{'X-Teacher-Id': linhLogin.teacher.id.toString()}});
  const targetSession = cls1Sessions[0];
  if (!targetSession) { console.log('  ❌ FAIL: không có buổi nào để test'); }
  else {
    await page.evaluate((id) => { location.hash = '#session-edit/' + id; }, targetSession.id);
    await new Promise(r => setTimeout(r, 2000));
    // Check step attribute
    const scoreInfo = await page.evaluate(() => {
      const scoreInp = document.querySelector('input[type="number"]');
      if (!scoreInp) return { found: false };
      return { found: true, step: scoreInp.step, min: scoreInp.min, max: scoreInp.max };
    });
    console.log('  Input score step:', scoreInfo.step, 'min:', scoreInfo.min, 'max:', scoreInfo.max);
    if (scoreInfo.found && scoreInfo.step === '1') console.log('  ✅ PASS step=1');
    else console.log('  ❌ FAIL: input không có step=1');

    // Test auto-grade: nhập điểm 8 → xếp loại phải là "Khá"
    const autoGradeInfo = await page.evaluate(() => {
      const row = document.querySelector('tbody tr');
      if (!row) return { found: false };
      const scoreInp = row.querySelector('input[type="number"]');
      const sel = row.querySelector('select');
      if (!scoreInp || !sel) return { found: false };
      // Set value và dispatch input
      scoreInp.value = '8';
      scoreInp.dispatchEvent(new Event('input', { bubbles: true }));
      return { found: true, grade: sel.value };
    });
    console.log('  Sau khi nhập điểm 8, xếp loại:', autoGradeInfo.grade);
    if (autoGradeInfo.found && autoGradeInfo.grade === 'Khá') console.log('  ✅ PASS auto-grade');
    else console.log('  ❌ FAIL: auto-grade không đúng');
  }

  console.log('\n=== Tổng kết test ===');
  await browser.close();
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
