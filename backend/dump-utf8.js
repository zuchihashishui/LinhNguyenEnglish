// dump-utf8.js
// Dump toan bo database ra file SQL voi charset utf8mb4 chuan xac.
// Su dung Node.js de bypass hoan toan van de charset cua CMD/PowerShell.
//
// Su dung:
//   node dump-utf8.js [output-file]
// Mac dinh: backup_YYYYMMDD_HHmmss.sql

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'linh_english_attendance';

const outFile = process.argv[2] || (() => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
                '_' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
  return `backup_${DB_NAME}_utf8_${stamp}.sql`;
})();

const outputPath = path.isAbsolute(outFile)
  ? outFile
  : path.join(__dirname, outFile);

(async () => {
  console.log('Ket noi MySQL...');
  const conn = await mysql.createConnection({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD,
    database: DB_NAME, charset: 'utf8mb4', dateStrings: true,
  });
  console.log(`  OK: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);

  const out = [];
  out.push('-- =====================================================');
  out.push('-- Backup UTF-8 chuan cho ' + DB_NAME);
  out.push('-- Sinh luc: ' + new Date().toISOString());
  out.push('-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci');
  out.push('-- =====================================================');
  out.push('');
  out.push('SET NAMES utf8mb4;');
  out.push('SET FOREIGN_KEY_CHECKS = 0;');
  out.push('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";');
  out.push('');
  out.push('CREATE DATABASE /*!32312 IF NOT EXISTS*/ `' + DB_NAME +
    '` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;');
  out.push('USE `' + DB_NAME + '`;');
  out.push('');

  const [tables] = await conn.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES " +
    "WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME",
    [DB_NAME]
  );

  for (const t of tables) {
    const tbl = t.TABLE_NAME;
    console.log('Dump bang: ' + tbl);

    out.push('-- --------------------------------------------------------');
    out.push('-- Cau truc bang `' + tbl + '`');
    out.push('-- --------------------------------------------------------');
    out.push('DROP TABLE IF EXISTS `' + tbl + '`;');

    const [create] = await conn.query('SHOW CREATE TABLE `' + tbl + '`');
    let createSql = create[0]['Create Table'];
    createSql = createSql.replace(/CHARSET=[^\s]+/i, 'CHARSET=utf8mb4');
    createSql = createSql.replace(/COLLATE=[^\s]+/i, 'COLLATE=utf8mb4_unicode_ci');
    out.push(createSql + ';');
    out.push('');

    const [cols] = await conn.query(
      "SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT, EXTRA " +
      "FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
      [DB_NAME, tbl]
    );
    const textCols = cols
      .filter(c => ['varchar', 'char', 'text', 'tinytext', 'mediumtext', 'longtext', 'enum', 'set'].includes(c.DATA_TYPE))
      .map(c => '`' + c.COLUMN_NAME + '`');
    out.push("/*!40000 ALTER TABLE `" + tbl + "` DISABLE KEYS */;");

    const [rows] = await conn.query('SELECT * FROM `' + tbl + '`');
    if (rows.length > 0) {
      out.push('INSERT INTO `' + tbl + '` VALUES');
      const valueLines = rows.map((row, idx) => {
        const vals = Object.values(row).map((v) => {
          if (v === null || v === undefined) return 'NULL';
          if (v instanceof Date) return "'" + v.toISOString().slice(0, 19).replace('T', ' ') + "'";
          if (Buffer.isBuffer(v)) return '0x' + v.toString('hex');
          if (typeof v === 'number') return String(v);
          if (typeof v === 'boolean') return v ? '1' : '0';
          const s = String(v)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\x00/g, '\\0');
          return "'" + s + "'";
        });
        return '  (' + vals.join(',') + ')' + (idx < rows.length - 1 ? ',' : ';');
      });
      out.push(valueLines.join('\n'));
    }
    out.push("/*!40000 ALTER TABLE `" + tbl + "` ENABLE KEYS */;");
    out.push('');
  }

  out.push('SET FOREIGN_KEY_CHECKS = 1;');
  out.push('');
  out.push('-- Backup hoan tat: ' + new Date().toISOString());

  // Ghi file UTF-8 KHONG BOM
  fs.writeFileSync(outputPath, out.join('\n'), { encoding: 'utf8' });
  console.log('');
  console.log('Xong! File backup: ' + outputPath);
  console.log('Kich thuoc: ' + (fs.statSync(outputPath).size / 1024).toFixed(2) + ' KB');
  console.log('Encoding: UTF-8 (khong BOM)');

  // Verify: doc lai va check encoding
  const back = fs.readFileSync(outputPath, 'utf8');
  const sample = back.split('\n').slice(0, 20).join('\n');
  console.log('--- 20 dong dau ---');
  console.log(sample);

  await conn.end();
})().catch((err) => {
  console.error('Loi:', err);
  process.exit(1);
});
