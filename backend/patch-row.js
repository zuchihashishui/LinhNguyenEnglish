// Thay thế block tbody.appendChild(el('tr', {}, ... )) bằng DOM thuần
const fs = require('fs');
const path = 'c:/project/Linh_English/frontend/js/app.js';
let s = fs.readFileSync(path, 'utf8');

const startMarker = "      tbody.appendChild(el('tr', {},";
const startIdx = s.indexOf(startMarker);
console.log('start idx:', startIdx);

if (startIdx < 0) { console.error('marker not found'); process.exit(1); }

// Tìm end: khớp "    });" ở dòng tiếp theo
const endMarker = "\n    });";
const endIdx = s.indexOf(endMarker, startIdx);
console.log('end idx:', endIdx);

const oldBlock = s.substring(startIdx, endIdx + endMarker.length);
console.log('--- OLD block (last 200) ---');
console.log(oldBlock.slice(-200));

const newBlock = `      // Build row v\u1edbi DOM thu\u1ea7n \u0111\u1ec3 ch\u1eafc ch\u1eafn listener ho\u1ea1t \u0111\u1ed9ng
      const tr = document.createElement('tr');

      const tdIdx = document.createElement('td');
      tdIdx.textContent = String(i + 1);
      tr.appendChild(tdIdx);

      const tdName = document.createElement('td');
      tdName.style.cursor = 'pointer';
      const nameStrong = document.createElement('strong');
      nameStrong.style.color = '#4f46e5';
      nameStrong.textContent = c.name;
      const nameHint = document.createElement('div');
      nameHint.style.cssText = 'font-size:12px;color:#6b7280';
      nameHint.textContent = 'Click \u0111\u1ec3 \u0111i\u1ec3m danh nhanh';
      tdName.appendChild(nameStrong);
      tdName.appendChild(nameHint);
      tdName.addEventListener('click', goAttendance);
      tr.appendChild(tdName);

      const tdGrade = document.createElement('td');
      tdGrade.textContent = c.grade_level || '\u2014';
      tr.appendChild(tdGrade);

      if (currentTeacher.is_admin) {
        const tdTeacher = document.createElement('td');
        tdTeacher.textContent = c.teacher_name || '\u2014';
        tr.appendChild(tdTeacher);
      }

      const tdActions = document.createElement('td');
      const actionsCell = document.createElement('div');
      actionsCell.className = 'actions-cell';

      const btnAtt = document.createElement('button');
      btnAtt.className = 'btn btn-sm btn-success';
      btnAtt.textContent = '\ud83d\udccb \u0110i\u1ec3m danh';
      btnAtt.addEventListener('click', function (e) {
        e.stopPropagation();
        goAttendance();
      });
      actionsCell.appendChild(btnAtt);

      const btnStats = document.createElement('button');
      btnStats.className = 'btn btn-sm';
      btnStats.textContent = '\ud83d\udcca Th\u1ed1ng k\u00ea';
      btnStats.addEventListener('click', function () {
        const today = new Date();
        navigate('#class-stats/' + c.id + '/' + today.getFullYear() + '/' + (today.getMonth() + 1));
      });
      actionsCell.appendChild(btnStats);

      const btnManage = document.createElement('button');
      btnManage.className = 'btn btn-sm btn-secondary';
      btnManage.textContent = '\ud83d\udc65 Qu\u1ea3n l\u00fd';
      btnManage.addEventListener('click', openClass);
      actionsCell.appendChild(btnManage);

      const btnDel = document.createElement('button');
      btnDel.className = 'btn btn-sm btn-danger';
      btnDel.textContent = 'Xo\u00e1';
      btnDel.addEventListener('click', async function () {
        if (!confirm('Xo\u00e1 l\u1edbp "' + c.name + '"? T\u1ea5t c\u1ea3 h\u1ecdc sinh v\u00e0 bu\u1ed5i h\u1ecdc s\u1ebd b\u1ecb xo\u00e1 theo.')) return;
        try { await api('/classes/' + c.id, { method: 'DELETE' }); toast('\u0110\u00e3 xo\u00e1 l\u1edbp', 'success'); render(); }
        catch (err) { toast(err.message, 'error'); }
      });
      actionsCell.appendChild(btnDel);

      tdActions.appendChild(actionsCell);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);` + endMarker;

const newContent = s.substring(0, startIdx) + newBlock + s.substring(endIdx + endMarker.length);
fs.writeFileSync(path, newContent, 'utf8');
console.log('\n\u2713 Replaced. New file size:', newContent.length);
