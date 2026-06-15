// Test thật sự submit form bằng cách gọi thẳng hàm async của handler
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'app.js'), 'utf8');

const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
const win = dom.window;

let fetchCalls = [];
win.fetch = (url, opts) => {
  fetchCalls.push({ url, body: opts && opts.body });
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true, teacher: { id: 99, username: 'p', full_name: 'P', is_admin: false } }) });
};

// Lưu lại: hook addEventListener cho form
let formSubmitHandler = null;
const orig = win.EventTarget.prototype.addEventListener;
win.EventTarget.prototype.addEventListener = function (type, fn, opts) {
  if (this.tagName === 'FORM' && type === 'submit' && !formSubmitHandler) {
    formSubmitHandler = fn;
  }
  return orig.call(this, type, fn, opts);
};

try { win.eval(appJs); } catch (e) { console.error('EVAL', e.stack); }

setTimeout(async () => {
  console.log('handler captured:', typeof formSubmitHandler);
  if (!formSubmitHandler) { console.log('NO HANDLER'); process.exit(1); }

  // Đặt giá trị vào input
  const u = win.document.querySelector('#loginUser');
  const p = win.document.querySelector('#loginPass');
  console.log('loginUser found:', !!u, 'loginPass found:', !!p);

  u.value = 'p';
  p.value = '1234';

  // Gọi handler với fake event
  const ev = { preventDefault: () => console.log('  preventDefault called') };
  try {
    await formSubmitHandler(ev);
    console.log('Handler completed');
  } catch (e) {
    console.error('Handler error:', e.stack);
  }
  await new Promise(r => setTimeout(r, 300));
  console.log('Fetch calls:');
  fetchCalls.forEach(c => console.log('  ', c.url, c.body));
  console.log('localStorage:', win.localStorage.getItem('linh_english_teacher'));
  console.log('Toast text:', win.document.querySelector('#toast') && win.document.querySelector('#toast').textContent);
}, 300);
