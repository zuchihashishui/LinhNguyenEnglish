// Test tổng hợp: login, click điểm danh, đăng xuất, đăng ký
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    timeout: 20000,
  });
  const page = await browser.newPage();
  await page.setCacheEnabled(false);

  const logs = [];
  const errors = [];
  page.on('console', msg => logs.push('[' + msg.type() + '] ' + msg.text()));
  page.on('pageerror', err => errors.push('PAGEERR: ' + err.message));

  // === Test 1: login ===
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
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
  await new Promise(r => setTimeout(r, 500));
  const afterLogin = await page.evaluate(() => ({
    h1: document.querySelector('h1') && document.querySelector('h1').textContent,
  }));
  console.log('After login:', afterLogin);

  // === Test 2: click nút điểm danh ===
  console.log('\n[TEST 2] Click nút "Điểm danh"...');
  const result2 = await page.evaluate(async () => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Điểm danh'));
    if (!btn) return { ok: false, reason: 'no button' };
    const before = location.hash;
    btn.click();
    await new Promise(r => setTimeout(r, 1000));
    return { ok: true, before, after: location.hash };
  });
  console.log('  result:', result2);
  await new Promise(r => setTimeout(r, 1000));

  // === Test 3: đăng xuất ===
  console.log('\n[TEST 3] Click nút "Đăng xuất"...');
  const result3 = await page.evaluate(async () => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.trim() === 'Đăng xuất');
    if (!btn) return { ok: false, reason: 'no button' };
    const before = !!localStorage.getItem('linh_english_teacher');
    btn.click();
    await new Promise(r => setTimeout(r, 500));
    return { ok: true, before, after: !!localStorage.getItem('linh_english_teacher'), h1: document.querySelector('h1') && document.querySelector('h1').textContent };
  });
  console.log('  result:', result3);
  await new Promise(r => setTimeout(r, 500));

  // === Test 4: click link "Đăng ký giáo viên mới" ===
  console.log('\n[TEST 4] Click "Đăng ký giáo viên mới"...');
  const result4 = await page.evaluate(async () => {
    const links = Array.from(document.querySelectorAll('a'));
    const link = links.find(a => a.textContent.includes('Đăng ký'));
    if (!link) return { ok: false, reason: 'no link' };
    link.click();
    await new Promise(r => setTimeout(r, 500));
    return { ok: true, h1: document.querySelector('h1') && document.querySelector('h1').textContent, hasRegName: !!document.getElementById('regName') };
  });
  console.log('  result:', result4);
  await new Promise(r => setTimeout(r, 500));

  // === Test 5: điền form đăng ký ===
  console.log('\n[TEST 5] Điền form đăng ký và submit...');
  if (result4.hasRegName) {
    await page.focus('#regName');
    await page.keyboard.type('Test User');
    await page.focus('#regUser');
    await page.keyboard.type('testuser_' + Date.now().toString().slice(-6));
    await page.focus('#regPass');
    await page.keyboard.type('123456');
    await page.focus('#regPass2');
    await page.keyboard.type('123456');
    await page.click('button.btn[type="submit"]');
    await new Promise(r => setTimeout(r, 1500));
    const result5 = await page.evaluate(() => ({
      h1: document.querySelector('h1') && document.querySelector('h1').textContent,
      hasTeacher: !!localStorage.getItem('linh_english_teacher'),
    }));
    console.log('  result:', result5);
  }

  console.log('\n--- Console logs ---');
  logs.forEach(l => console.log(l));
  console.log('--- Errors ---');
  errors.forEach(e => console.log(e));

  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
