// Test: giả lập user đã login từ session trước (localStorage có teacher)
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
  const requests = [];
  page.on('console', msg => logs.push('[' + msg.type() + '] ' + msg.text()));
  page.on('pageerror', err => errors.push('PAGEERR: ' + err.message));
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      requests.push(res.status() + ' ' + res.request().method() + ' ' + res.url());
    }
  });

  // Vào trang 1 lần để set localStorage trên đúng origin
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.evaluateOnNewDocument(() => { window.__EL_DEBUG = true; });
  // Set localStorage giả lập đã login
  await page.evaluate(() => {
    localStorage.setItem('linh_english_teacher', JSON.stringify({
      id: 2, username: 'linh', full_name: 'Lê Thị Linh', is_admin: 0
    }));
  });
  // Reload
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  const afterReload = await page.evaluate(() => ({
    hash: location.hash,
    h1: document.querySelector('h1') && document.querySelector('h1').textContent,
    teacher: localStorage.getItem('linh_english_teacher'),
    hasBtnSuccess: !!document.querySelector('button.btn-success'),
  }));
  console.log('After reload (simulated login):', afterReload);

  // Click nút "Điểm danh" - dùng evaluate với querySelectorAll để biết có bao nhiêu btn-success
  const btnInfo = await page.evaluate(() => {
    const btns = document.querySelectorAll('button.btn-success');
    return Array.from(btns).map(b => ({
      text: b.textContent.trim(),
      onclick: !!b.onclick,
      hasEventListeners: typeof getEventListeners === 'function' ? getEventListeners(b) : 'N/A',
    }));
  });
  console.log('btn-success count:', btnInfo.length);
  btnInfo.forEach((b, i) => console.log(`  [${i}]`, b));

  // Test gọi thẳng bằng JS
  console.log('Inspecting button + dispatching click...');
  const direct = await page.evaluate(async () => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Điểm danh'));
    if (!btn) return { ok: false, reason: 'no button' };

    // Tạo listener monitor: nếu goAttendance fire, ta sẽ thấy navigate thay đổi hash
    const beforeHash = location.hash;
    const evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
    btn.dispatchEvent(evt);

    // Đợi 1s
    await new Promise(r => setTimeout(r, 500));
    return {
      ok: true,
      beforeHash,
      afterHash: location.hash,
      changed: beforeHash !== location.hash,
    };
  });
  console.log('Direct dispatch:', direct);
  await new Promise(r => setTimeout(r, 2000));

  const final = await page.evaluate(() => ({
    hash: location.hash,
    h1: document.querySelector('h1') && document.querySelector('h1').textContent,
    appText: document.getElementById('app').textContent.slice(0, 200),
  }));
  console.log('Final:', final);

  console.log('--- API requests ---');
  requests.forEach(r => console.log(r));
  console.log('--- Console logs ---');
  logs.forEach(l => console.log(l));
  console.log('--- Errors ---');
  errors.forEach(e => console.log(e));

  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
