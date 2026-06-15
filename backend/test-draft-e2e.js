// test-draft-e2e.js - Test localStorage draft cho điểm danh
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Auto-accept dialog (cho confirm restore)
  let dialogCount = 0;
  let dialogMode = 'restore'; // 'restore' = OK, 'discard' = OK, 'navigate' = OK
  page.on('dialog', async (dialog) => {
    console.log('  Dialog (' + dialogMode + '):', dialog.message().slice(0, 80));
    dialogCount++;
    if (dialogMode === 'restore' || dialogMode === 'discard' || dialogMode === 'navigate') {
      await dialog.accept();
    } else {
      await dialog.dismiss();
    }
  });

  // 1. Login
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await page.type('#loginUser', 'admin');
  await page.type('#loginPass', '123456');
  await page.click('button[type=submit]');
  await new Promise(r => setTimeout(r, 1500));
  console.log('Step 1: Logged in');

  // 2. Vào lớp 1, sessions tab, tìm buổi hôm nay
  await page.goto('http://localhost:3000/#class/1', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  console.log('Step 2: Class detail');

  // Tìm 1 session_id để test (lấy từ API)
  const sessionsData = await page.evaluate(async () => {
    const r = await fetch('/api/classes/1/sessions', { headers: { 'X-Teacher-Id': '1' } });
    return r.json();
  });
  if (!sessionsData || sessionsData.length === 0) {
    console.log('No sessions to test');
    await browser.close();
    return;
  }
  const testSession = sessionsData[0];
  console.log('Step 2b: Found session ' + testSession.id + ' - ' + testSession.session_date);

  // 3. Clear draft cũ (nếu có)
  await page.evaluate((sid) => {
    localStorage.removeItem('linh_attendance_draft_v1_' + sid);
    const idx = JSON.parse(localStorage.getItem('linh_attendance_drafts_index_v1') || '{}');
    if (idx[sid]) { delete idx[sid]; localStorage.setItem('linh_attendance_drafts_index_v1', JSON.stringify(idx)); }
  }, testSession.id);
  console.log('Step 3: Cleared any old draft');

  // 4. Vào trang điểm danh, KHÔNG có draft → indicator trống / ẩn discard
  await page.goto('http://localhost:3000/#session-edit/' + testSession.id, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  const indicatorEmpty = await page.evaluate(() => {
    const ind = document.querySelector('#draftIndicator');
    return ind ? (ind.textContent.trim() === '' || ind.textContent.includes('Đã lưu nháp')) : true;
  });
  const discardHidden1 = await page.evaluate(() => {
    const btn = document.querySelector('#btnDiscardDraft');
    return btn ? btn.style.display === 'none' : true;
  });
  console.log('Step 4: Initial - indicator empty=' + indicatorEmpty + ', discard hidden=' + discardHidden1);
  if (!discardHidden1) throw new Error('Discard button should be hidden initially');
  await page.screenshot({ path: 'screenshots/draft-01-initial.png' });

  // 5. Tick "Có mặt" cho HS đầu tiên + nhập điểm + nhận xét
  console.log('Step 5: Modify first student...');
  await page.evaluate(() => {
    const tr = document.querySelector('table tbody tr');
    if (!tr) return;
    // Tick có mặt
    const chk = tr.querySelector('input[type=checkbox]');
    if (!chk.checked) chk.click();
    // Nhập điểm bài cũ
    const numInps = tr.querySelectorAll('input[type=number]');
    if (numInps[0]) {
      numInps[0].value = '8';
      numInps[0].dispatchEvent(new Event('input', { bubbles: true }));
    }
    // Nhập nhận xét
    const ta = tr.querySelector('textarea');
    ta.value = 'HS chăm học, phát biểu tốt';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  });

  // 6. Đợi 500ms để debounce fire
  await new Promise(r => setTimeout(r, 500));
  const draftSaved = await page.evaluate((sid) => {
    return localStorage.getItem('linh_attendance_draft_v1_' + sid) !== null;
  }, testSession.id);
  console.log('Step 6: Draft saved to localStorage=' + draftSaved);
  if (!draftSaved) throw new Error('Draft should be saved to localStorage');

  const draftContent = await page.evaluate((sid) => {
    return JSON.parse(localStorage.getItem('linh_attendance_draft_v1_' + sid));
  }, testSession.id);
  console.log('  Draft has ' + draftContent.items.length + ' items');
  console.log('  First item:', JSON.stringify(draftContent.items[0]));

  // 7. Indicator hiển thị (sau khi modify thì sẽ có "Đã lưu nháp lúc")
  const indicatorVisible = await page.evaluate(() => {
    const ind = document.querySelector('#draftIndicator');
    return ind && ind.textContent.includes('Đã lưu nháp');
  });
  const discardVisible = await page.evaluate(() => {
    const btn = document.querySelector('#btnDiscardDraft');
    return btn && btn.style.display !== 'none';
  });
  console.log('Step 7: After change - indicator visible=' + indicatorVisible + ', discard visible=' + discardVisible);
  if (!indicatorVisible || !discardVisible) throw new Error('Indicator/discard should be visible after change');
  await page.screenshot({ path: 'screenshots/draft-02-modified.png' });

  // 8. RELOAD trang → draft phải còn → hỏi restore
  console.log('Step 8: Reload page to simulate crash/refresh...');
  dialogMode = 'restore';
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));
  console.log('  Dialogs seen: ' + dialogCount);

  // 9. Verify dữ liệu đã được restore
  const restored = await page.evaluate(() => {
    const tr = document.querySelector('table tbody tr');
    if (!tr) return null;
    const chk = tr.querySelector('input[type=checkbox]');
    const numInps = tr.querySelectorAll('input[type=number]');
    const ta = tr.querySelector('textarea');
    return {
      checked: chk ? chk.checked : null,
      lessonScore: numInps[0] ? numInps[0].value : null,
      note: ta ? ta.value : null,
    };
  });
  console.log('Step 9: After restore - ' + JSON.stringify(restored));
  if (!restored.checked || restored.lessonScore !== '8' || !restored.note.includes('chăm học')) {
    throw new Error('Draft not restored properly: ' + JSON.stringify(restored));
  }
  await page.screenshot({ path: 'screenshots/draft-03-restored.png' });

  // 10. Bấm "Bỏ nháp" → load lại từ server
  console.log('Step 10: Click "Bỏ nháp"...');
  dialogMode = 'discard';
  dialogCount = 0;
  await page.click('#btnDiscardDraft');
  await new Promise(r => setTimeout(r, 2500));

  const draftCleared = await page.evaluate((sid) => {
    return localStorage.getItem('linh_attendance_draft_v1_' + sid) === null;
  }, testSession.id);
  console.log('  Draft cleared from localStorage=' + draftCleared);
  if (!draftCleared) throw new Error('Draft should be cleared after discard');

  // 11. Modify lại + Lưu thành công → draft phải bị xóa
  console.log('Step 11: Modify again and save...');
  await page.evaluate(() => {
    const tr = document.querySelector('table tbody tr');
    const ta = tr.querySelector('textarea');
    ta.value = 'Bây giờ Lưu';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'screenshots/draft-04-before-save.png' });
  // Click nút "Lưu điểm danh" - tìm button có text "Lưu điểm danh"
  const saveClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Lưu điểm danh'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('  Click save: ' + saveClicked);
  if (!saveClicked) throw new Error('Save button not found');
  await new Promise(r => setTimeout(r, 2500));
  const draftClearedAfterSave = await page.evaluate((sid) => {
    return localStorage.getItem('linh_attendance_draft_v1_' + sid) === null;
  }, testSession.id);
  console.log('  Draft cleared after save=' + draftClearedAfterSave);
  if (!draftClearedAfterSave) throw new Error('Draft should be cleared after successful save');
  await page.screenshot({ path: 'screenshots/draft-05-after-save.png' });

  // 12. Test "Navigate cảnh báo" - modify + navigate tới trang khác
  console.log('Step 12: Modify + navigate to test warning...');
  await page.evaluate(() => {
    const tr = document.querySelector('table tbody tr');
    const ta = tr.querySelector('textarea');
    ta.value = 'Có draft chưa lưu';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 500));
  dialogMode = 'navigate';
  dialogCount = 0;
  // Click "Quay lại lớp"
  const backBtn = await page.$('button.btn-secondary');
  if (backBtn) {
    // Trigger navigate programmatically
    await page.evaluate(() => { location.hash = '#class/1'; });
  }
  await new Promise(r => setTimeout(r, 1500));
  console.log('  Dialogs seen: ' + dialogCount);

  // Sau khi navigate, draft vẫn còn
  const draftStillThere = await page.evaluate((sid) => {
    return localStorage.getItem('linh_attendance_draft_v1_' + sid) !== null;
  }, testSession.id);
  console.log('  Draft still in localStorage after navigate=' + draftStillThere);
  if (!draftStillThere) throw new Error('Draft should be preserved in localStorage after navigate');

  // 13. Test trên mobile
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/#session-edit/' + testSession.id, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'screenshots/draft-06-mobile.png', fullPage: true });
  const mobileUI = await page.evaluate(() => {
    return {
      hasSave: !!document.querySelector('button.btn'),
      hasDiscard: !!document.querySelector('#btnDiscardDraft'),
      hasIndicator: !!document.querySelector('#draftIndicator'),
    };
  });
  console.log('Step 13: Mobile UI - ' + JSON.stringify(mobileUI));

  await browser.close();
  console.log('\n=== ALL DRAFT TESTS PASSED ===');
})().catch(e => { console.error('FAIL:', e.message); console.error(e.stack); process.exit(1); });
