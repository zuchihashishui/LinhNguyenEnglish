// test-features.js - test cac tinh nang moi
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

  // 1. Login admin
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await page.type('#loginUser', 'admin');
  await page.type('#loginPass', '123456');
  await page.click('button[type=submit]');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'screenshots/feat-01-home.png' });

  // 2. Mo modal Doi mat khau
  const changeBtn = await page.$('.user-action.btn-secondary, .user-action[title*="Đổi mật khẩu"]');
  if (changeBtn) {
    await changeBtn.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'screenshots/feat-02-change-pw.png' });

    // Test sai mk cu
    await page.type('#cpCurrent', 'wrongpw');
    await page.type('#cpNew', 'newpw');
    await page.type('#cpConfirm', 'newpw');
    await page.click('.modal-actions .btn:not(.btn-secondary)');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'screenshots/feat-03-change-pw-wrong.png' });

    // Close
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 300));
  } else {
    console.log('ERROR: Khong tim thay nut Doi MK');
  }

  // 3. Mo trang Quan ly GV (click link admin)
  await page.goto('http://localhost:3000/#teachers', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));
  console.log('URL after teachers:', page.url());
  console.log('Page title:', await page.title());
  const mainText = await page.evaluate(() => document.querySelector('#app')?.textContent?.slice(0, 200) || 'EMPTY');
  console.log('Main text:', mainText);
  await page.screenshot({ path: 'screenshots/feat-04-teachers.png' });

  // 4. Bam Reset MK
  const resetBtns = await page.$$('button.btn-warning');
  if (resetBtns.length > 0) {
    await resetBtns[0].click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'screenshots/feat-05-reset-pw.png' });
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 300));
  } else {
    console.log('Khong co nut Reset MK');
  }

  // 5. Vao 1 lop, test student stats
  await page.goto('http://localhost:3000/#class/1', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const cells = await page.$$('table tbody tr td:nth-child(3)');
  if (cells.length > 0) {
    await cells[0].click();
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'screenshots/feat-06-student-stats.png', fullPage: true });
  } else {
    console.log('Khong click duoc student');
  }

  // Test mobile viewport
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/#', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'screenshots/feat-07-home-mobile.png' });
  const changeBtnM = await page.$('.user-action.btn-secondary, .user-action[title*="Đổi mật khẩu"]');
  if (changeBtnM) {
    await changeBtnM.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'screenshots/feat-08-change-pw-mobile.png' });
    await page.keyboard.press('Escape');
  }

  await browser.close();
  console.log('Done. Feature screenshots saved.');
})().catch(e => { console.error(e); process.exit(1); });
