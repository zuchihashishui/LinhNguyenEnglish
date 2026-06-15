// Test đơn giản: chỉ cần biết click có fire handler không
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 15000,
  });
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.evaluateOnNewDocument(() => { window.__EL_DEBUG = true; });

  // Quan trọng: chờ network idle 0 thay vì domcontentloaded
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 10000 });

  // Đợi ổn định
  await new Promise(r => setTimeout(r, 1500));

  // Gán handler monitor trực tiếp lên form (không qua el)
  await page.evaluate(() => {
    const f = document.querySelector('form');
    if (f) {
      f.addEventListener('submit', () => {
        window.__SUBMIT_FIRED = true;
        console.log('[MONITOR] submit FIRED');
      });
      console.log('[MONITOR] handler attached');
    } else {
      console.log('[MONITOR] no form');
    }
  });

  // Điền + click
  await page.focus('#loginUser');
  await page.keyboard.type('linh');
  await page.focus('#loginPass');
  await page.keyboard.type('123456');
  console.log('Values typed. Clicking submit...');
  await page.click('button.btn[type="submit"]');
  await new Promise(r => setTimeout(r, 1500));

  const result = await page.evaluate(() => ({
    submitFired: !!window.__SUBMIT_FIRED,
    teacher: localStorage.getItem('linh_english_teacher'),
    errBox: document.querySelector('#loginErr') && document.querySelector('#loginErr').textContent,
    url: location.href,
  }));
  console.log('Result:', JSON.stringify(result, null, 2));

  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
