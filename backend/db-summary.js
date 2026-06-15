var mysql = require('mysql2/promise');
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
  console.log('=== DB STATE ===');
  for (const t of ['teachers','classes','students','sessions','attendances','migrations']) {
    const [r] = await conn.query('SELECT COUNT(*) AS n FROM ' + t);
    console.log('  ' + t + ': ' + r[0].n + ' records');
  }
  console.log('');
  console.log('=== MIGRATIONS ===');
  const [m] = await conn.query('SELECT * FROM migrations ORDER BY id ASC');
  m.forEach((x) => console.log('  ' + x.id + '. ' + x.name));
  console.log('');
  console.log('=== INDEXES sessions ===');
  const [ix] = await conn.query("SHOW INDEX FROM sessions WHERE Key_name LIKE 'idx_sessions_%' OR Key_name LIKE 'uq_%'");
  ix.forEach((x) => console.log('  ' + x.Key_name + ' (' + x.Column_name + ')'));
  console.log('');
  console.log('=== INDEXES attendances ===');
  const [ix2] = await conn.query("SHOW INDEX FROM attendances");
  ix2.forEach((x) => console.log('  ' + x.Key_name + ' (' + x.Column_name + ')'));
  await conn.end();
})().catch((e) => { console.error(e); process.exit(1); });
