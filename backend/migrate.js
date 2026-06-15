// migrate.js
// Chay tat ca cac migration theo thu tu.
// Mac dinh chi chay cac migration chua danh dau "applied" trong bang migrations.
// Chay:  node migrate.js          (chay tat ca)
//        node migrate.js status   (xem trang thai)

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const MIGRATIONS_DIR = path.join(__dirname, '..', 'database', 'migrations');

async function getConn() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    charset: 'utf8mb4',
  });
}

async function ensureMigrationsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function getApplied(conn) {
  const [rows] = await conn.query('SELECT name FROM migrations ORDER BY id ASC');
  return new Set(rows.map(r => r.name));
}

function listMigrations() {
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
}

async function run() {
  const dbName = process.env.DB_NAME || 'linh_english_attendance';
  const conn = await getConn();
  await conn.query('USE `' + dbName + '`');
  await ensureMigrationsTable(conn);
  const applied = await getApplied(conn);
  const all = listMigrations();
  const pending = all.filter(m => !applied.has(m));

  if (process.argv[2] === 'status') {
    console.log('Migrations:');
    all.forEach(m => {
      const tag = applied.has(m) ? '[done]' : '[todo]';
      console.log('  ' + tag + ' ' + m);
    });
    console.log('\nTong: ' + all.length + ' | Da chay: ' + applied.size + ' | Cho: ' + pending.length);
    await conn.end();
    return;
  }

  if (pending.length === 0) {
    console.log('Khong co migration moi. Tat ca ' + all.length + ' migration da duoc ap dung.');
    await conn.end();
    return;
  }

  console.log('Se chay ' + pending.length + ' migration:\n');
  for (const name of pending) {
    console.log('>> ' + name);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8');
    try {
      await conn.beginTransaction();
      await conn.query(sql);
      await conn.query('INSERT INTO migrations (name) VALUES (?)', [name]);
      await conn.commit();
      console.log('   OK');
    } catch (err) {
      await conn.rollback();
      console.error('   LOI: ' + err.message);
      process.exit(1);
    }
  }
  console.log('\nHoan tat! Da chay ' + pending.length + ' migration.');
  await conn.end();
}

run().catch(e => { console.error('Loi:', e); process.exit(1); });
