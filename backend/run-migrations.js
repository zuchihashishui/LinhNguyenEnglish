require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  try {
    const c = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'linh_english_attendance',
      multipleStatements: true,
    });

    // Danh sach migration theo thu tu (bo qua 001 - chi marker)
    const dir = '../database/migrations';
    const files = fs.readdirSync(dir)
      .filter(f => /^00[2-9]_.*\.sql$|^01\d_.*\.sql$/.test(f))
      .sort();

    // Tim migration da chay (neu co bang migrations)
    let applied = new Set();
    try {
      const [rows] = await c.query('SELECT name FROM migrations');
      applied = new Set(rows.map(r => r.name));
    } catch (_) {}

    for (const f of files) {
      if (applied.has(f)) {
        console.log('SKIP (da chay): ' + f);
        continue;
      }
      console.log('APPLY: ' + f);
      const sql = fs.readFileSync(dir + '/' + f, 'utf8');
      await c.query(sql);
      // Luu vao migrations neu co bang
      try {
        await c.query('INSERT INTO migrations (name) VALUES (?)', [f]);
      } catch (_) {}
    }

    // Verify
    const [cols] = await c.query("SHOW COLUMNS FROM attendances LIKE 'lesson_grade'");
    console.log('\n[VERIFY] Cot lesson_grade con ton tai? ' + (cols.length > 0 ? 'CO (LOI)' : 'KHONG (OK)'));

    const [cons] = await c.query(
      "SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS " +
      "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendances' " +
      "AND CONSTRAINT_NAME = 'chk_lesson_grade'"
    );
    console.log('[VERIFY] Constraint chk_lesson_grade con ton tai? ' + (cons.length > 0 ? 'CO (LOI)' : 'KHONG (OK)'));

    await c.end();
    console.log('\nMigration 006 done.');
  } catch (e) {
    console.error('Loi: ' + e.message);
    process.exit(1);
  }
})();
