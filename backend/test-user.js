// Test thật: mô phỏng user thật - mở trang, đợi, click, xem phản hồi
const puppeteer = require('puppeteer-core');

(async () => {
  console.log('Launching Edge (headed with minimal UI)...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: false,  // HIỂN THỊ BROWSER THẬT
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=800,600'],
    timeout: 30000,
  });
  const page = await browser.newPage();

  const logs = [];
  const errors = [];
  page.on('console', msg => logs.push('[' + msg.type() + '] ' + msg.text()));
  page.on('pageerror', err => errors.push('PAGEERR: ' + err.message + '\n' + (err.stack || '').slice(0, 500)));

  // CHỈ xem trang 1 lần, không có cache buster, không có networkidle0
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });

  // Chờ form xuất hiện
  await page.waitForSelector('#loginUser', { timeout: 5000 });
  console.log('Form is visible. Now you can interact manually.');
  console.log('Type linh / 123456 and click Đăng nhập.');
  console.log('I will monitor the page for 60 seconds...');

  // Monitor trong 60s, bất kỳ thay đổi localStorage nào thì báo
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const t = await page.evaluate(() => localStorage.getItem('linh_english_teacher'));
    const err = await page.evaluate(() => {
      const e = document.querySelector('#loginErr');
      return e ? e.textContent : '';
    });
    const url = page.url();
    if (t) {
      console.log(`[${i}s] LOCALSTORAGE: ${t}`);
      console.log(`[${i}s] URL: ${url}`);
      break;
    }
    if (err) {
      console.log(`[${i}s] ERR BOX: ${err}`);
    }
    if (i % 10 === 0) console.log(`[${i}s] waiting... url=${url} errBox="${err}"`);
  }

  console.log('\n--- Console logs ---');
  logs.forEach(l => console.log(l));
  console.log('--- Page errors ---');
  errors.forEach(e => console.log(e));

  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
