const { JSDOM } = require('jsdom');
const dom = new JSDOM('<form id="f"><input id="i"/></form>');
const w = dom.window;
const f = w.document.querySelector('#f');
f.addEventListener('submit', (e) => { e.preventDefault(); w.console.log('FIRED'); });
// Test dispatch
f.dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true }));
// Test qua el() helper pattern
