// seed-exercise-score.js
// Seed gia lap cot exercise_score cho cac attendances HIEN CO trong DB.
// Phan phoi diem giong het lesson_score trong init-db.js:
//   30% diem cao (9-10), 50% diem trung binh (7-9), 20% diem thap (5-6)
// Chi cap nhat record co is_present = 1, cac record vang/vac bo qua (NULL).
// Chay:  node seed-exercise-score.js
//       node seed-exercise-score.js --reset  (XOA het exercise_score truoc khi seed)

const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'linh_english_attendance',
    charset: 'utf8mb4',
  });

  if (process.argv.includes('--reset')) {
    console.log('Reset exercise_score ve NULL truoc khi seed...');
    const [r] = await conn.query('UPDATE attendances SET exercise_score = NULL');
    console.log('  Da reset ' + r.affectedRows + ' dong.');
  }

  console.log('Dang dem so attendance co mat (is_present = 1)...');
  const [cnt] = await conn.query('SELECT COUNT(*) AS n FROM attendances WHERE is_present = 1');
  console.log('  Co ' + cnt[0].n + ' records can seed diem bai tap.');

  if (cnt[0].n === 0) {
    console.log('Khong co gi de seed. Thoat.');
    await conn.end();
    return;
  }

  // Lay tat ca record co mat (id, de debug neu can)
  const [rows] = await conn.query('SELECT id FROM attendances WHERE is_present = 1 ORDER BY id ASC');
  console.log('Bat dau sinh diem bai tap...');

  let updated = 0;
  let p1 = 0, p2 = 0, p3 = 0; // dem phan phoi de in thong ke
  for (const row of rows) {
    const r = Math.random();
    let score;
    if (r < 0.3)      { score = Math.floor(Math.random() * 2) + 9; p1++; }   // 9-10 (cao)
    else if (r < 0.8) { score = Math.floor(Math.random() * 3) + 7; p2++; }   // 7-9 (trung binh)
    else              { score = Math.floor(Math.random() * 2) + 5; p3++; }   // 5-6 (thap)
    await conn.query('UPDATE attendances SET exercise_score = ? WHERE id = ?', [score, row.id]);
    updated++;
  }

  console.log('\n=== KET QUA ===');
  console.log('Tong da cap nhat: ' + updated + ' attendance');
  console.log('Phan phoi: 9-10 (cao): ' + p1 + '  |  7-9 (trung binh): ' + p2 + '  |  5-6 (thap): ' + p3);

  // Thong ke verify
  const [st] = await conn.query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN exercise_score IS NOT NULL THEN 1 ELSE 0 END) AS has_score,
      ROUND(AVG(exercise_score), 2) AS avg_score,
      MIN(exercise_score) AS min_score,
      MAX(exercise_score) AS max_score
    FROM attendances
  `);
  console.log('\nVerify trong DB:');
  console.log('  Tong attendance: ' + st[0].total);
  console.log('  Co exercise_score: ' + st[0].has_score);
  console.log('  Diem TB: ' + st[0].avg_score);
  console.log('  Min/Max: ' + st[0].min_score + ' / ' + st[0].max_score);

  await conn.end();
})().catch((e) => { console.error('Loi:', e); process.exit(1); });
