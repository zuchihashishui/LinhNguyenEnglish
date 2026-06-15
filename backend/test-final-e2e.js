// test-final-e2e.js - Test toàn bộ tính năng mới trên laptop + iPhone 17 Pro Max
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runTests(viewport, prefix, isMobile) {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ ...viewport, isMobile: !!isMobile, hasTouch: !!isMobile });
  if (isMobile) {
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
  }
  const results = [];

  async function step(name, fn) {
    try {
      await fn();
      results.push({ name, status: 'OK' });
    } catch (err) {
      results.push({ name, status: 'FAIL', error: err.message });
    }
  }

  // 1. Health
  await step('1. Server health', async () => {
    const r = await fetch('http://localhost:3000/api/health');
    if (!r.ok) throw new Error('Status ' + r.status);
  });

  // 2. Login
  await step('2. Login admin', async () => {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await page.type('#loginUser', 'admin');
    await page.type('#loginPass', '123456');
    await page.click('button[type=submit]');
    await new Promise(r => setTimeout(r, 1500));
    const url = page.url();
    if (!url.endsWith('#') && url.includes('#login')) throw new Error('Still on login');
    await page.screenshot({ path: `screenshots/${prefix}-01-home.png` });
  });

  // 3. Mo modal Doi mat khau
  await step('3. Open change-password modal', async () => {
    const btn = await page.$('.user-action[title*="Đổi mật khẩu"], .user-action.btn-secondary');
    if (!btn) throw new Error('No change-pw button');
    await btn.click();
    await new Promise(r => setTimeout(r, 500));
    const modal = await page.$('.modal');
    if (!modal) throw new Error('No modal opened');
    await page.screenshot({ path: `screenshots/${prefix}-02-change-pw.png` });
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 300));
  });

  // 4. Test doi mat khau thanh cong
  await step('4. Change password then reset back', async () => {
    // Login
    const r1 = await fetch('http://localhost:3000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: '123456' }) });
    const d1 = await r1.json();
    const tid = d1.teacher.id;

    // Doi mk
    const r2 = await fetch('http://localhost:3000/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Teacher-Id': String(tid) }, body: JSON.stringify({ current_password: '123456', new_password: 'newpw123' }) });
    if (!r2.ok) throw new Error('Change pw failed: ' + r2.status);
    // Login voi mk moi
    const r3 = await fetch('http://localhost:3000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'newpw123' }) });
    if (!r3.ok) throw new Error('Login with new pw failed');
    // Reset
    const d3 = await r3.json();
    const r4 = await fetch('http://localhost:3000/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Teacher-Id': String(d3.teacher.id) }, body: JSON.stringify({ current_password: 'newpw123', new_password: '123456' }) });
    if (!r4.ok) throw new Error('Reset back failed');
  });

  // 5. Trang Teachers
  await step('5. Teachers page (admin)', async () => {
    await page.goto('http://localhost:3000/#teachers', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    const txt = await page.evaluate(() => document.querySelector('#app').textContent);
    if (!txt.includes('Quản lý giáo viên')) throw new Error('Wrong page content');
    const resetBtns = await page.$$('button.btn-warning');
    if (resetBtns.length === 0) throw new Error('No reset pw button');
    await page.screenshot({ path: `screenshots/${prefix}-03-teachers.png` });
  });

  // 6. Class list
  await step('6. Class list + table', async () => {
    await page.goto('http://localhost:3000/#', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `screenshots/${prefix}-04-classes.png` });
    const tableW = await page.evaluate(() => {
      const t = document.querySelector('table');
      return t ? t.offsetWidth : 0;
    });
    const cardW = await page.evaluate(() => {
      const c = document.querySelector('.card');
      return c ? c.offsetWidth : 0;
    });
    const sw = await page.evaluate(() => document.body.scrollWidth);
    const iw = await page.evaluate(() => window.innerWidth);
    // Tìm element nào rộng nhất
    const wideElements = await page.evaluate(() => {
      const all = document.querySelectorAll('*');
      const w = [];
      all.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > window.innerWidth + 5) {
          w.push({ tag: el.tagName, cls: el.className?.toString().slice(0, 50), w: r.width });
        }
      });
      return w.slice(0, 5);
    });
    console.log('   table=' + tableW + ' card=' + cardW + ' body=' + sw + ' iw=' + iw);
    if (wideElements.length > 0) console.log('   wide elements:', JSON.stringify(wideElements));
    if (sw > iw + 5) throw new Error('Horizontal overflow: body ' + sw + ' > innerWidth ' + iw + ' (viewport ' + viewport.width + ')');
  });

  // 7. Class detail
  await step('7. Class detail', async () => {
    await page.goto('http://localhost:3000/#class/1', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `screenshots/${prefix}-05-class-detail.png` });
  });

  // 8. Sessions tab
  await step('8. Sessions tab', async () => {
    const tabs = await page.$$('.tab');
    if (tabs.length < 2) throw new Error('No tabs');
    await tabs[1].click();
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `screenshots/${prefix}-06-sessions.png` });
  });

  // 9. Attendance
  await step('9. Attendance (session edit)', async () => {
    const editBtns = await page.$$('table tbody tr:first-child button.btn:not(.btn-danger)');
    if (editBtns.length === 0) throw new Error('No edit button');
    // Tim nut "Điểm danh" hoặc "Sửa"
    for (const b of editBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt.includes('Điểm danh') || txt.includes('Sửa')) {
        await b.click();
        await new Promise(r => setTimeout(r, 2000));
        break;
      }
    }
    await page.screenshot({ path: `screenshots/${prefix}-07-attendance.png`, fullPage: true });
  });

  // 10. Stats
  await step('10. Class stats', async () => {
    await page.goto('http://localhost:3000/#class-stats/1/2026/6', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `screenshots/${prefix}-08-stats.png`, fullPage: true });
  });

  // 11. Student stats (kem AI card)
  await step('11. Student stats', async () => {
    // Lay 1 student_id
    const allLinks = await page.$$eval('a', as => as.map(a => a.getAttribute('href')).filter(Boolean));
    const studentLink = allLinks.find(h => h.startsWith('#student-stats/'));
    if (studentLink) {
      await page.goto('http://localhost:3000/' + studentLink, { waitUntil: 'networkidle0' });
    } else {
      // Fallback: lay 1 HS tu API
      const r = await fetch('http://localhost:3000/api/classes/1/students', { headers: { 'X-Teacher-Id': '1' } });
      const students = await r.json();
      if (students.length > 0) {
        await page.goto('http://localhost:3000/#student-stats/' + students[0].id, { waitUntil: 'networkidle0' });
      } else {
        throw new Error('No students to test');
      }
    }
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: `screenshots/${prefix}-09-student-stats.png`, fullPage: true });
  });

  // 12. Verify no horizontal overflow
  await step('12. No horizontal overflow on all pages', async () => {
    for (const hash of ['', 'class/1', 'class-stats/1/2026/6', 'teachers']) {
      await page.goto('http://localhost:3000/#' + hash, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 1500));
      const { sw, iw } = await page.evaluate(() => ({ sw: document.body.scrollWidth, iw: window.innerWidth }));
      if (sw > iw + 5) {
        throw new Error('Overflow on #' + hash + ': body ' + sw + ' > innerWidth ' + iw);
      }
    }
  });

  await browser.close();
  return results;
}

(async () => {
  console.log('=== Test Laptop (1280x800) ===');
  const laptop = await runTests({ width: 1280, height: 800, deviceScaleFactor: 1 }, 'lap', false);
  laptop.forEach(r => console.log('  ' + r.status + ': ' + r.name + (r.error ? ' - ' + r.error : '')));

  console.log('\n=== Test iPhone 17 Pro Max (430x932) ===');
  const mobile = await runTests({ width: 430, height: 932, deviceScaleFactor: 3 }, 'mob', true);
  mobile.forEach(r => console.log('  ' + r.status + ': ' + r.name + (r.error ? ' - ' + r.error : '')));

  const failLap = laptop.filter(r => r.status === 'FAIL').length;
  const failMob = mobile.filter(r => r.status === 'FAIL').length;
  console.log('\n=== Summary ===');
  console.log('Laptop: ' + (laptop.length - failLap) + '/' + laptop.length + ' OK');
  console.log('Mobile: ' + (mobile.length - failMob) + '/' + mobile.length + ' OK');
  if (failLap + failMob > 0) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
