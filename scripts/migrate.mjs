import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mysql from 'mysql2/promise';

async function ensureMigrationsTable(conn) {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) UNIQUE,
      checksum VARCHAR(64),
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  await conn.query(createTableSQL);
}

function getMigrationsDir() {
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), '../db/migrations');
}

function readMigrationFiles() {
  const dir = getMigrationsDir();
  if (!fs.existsSync(dir)) throw new Error(`Migrations directory not found: ${dir}`);
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.sql'))
    .sort();
  return files.map((filename) => ({ filename, fullpath: path.join(dir, filename) }));
}

function sha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

async function alreadyApplied(conn, filename, checksum) {
  const [rows] = await conn.query('SELECT filename, checksum FROM _migrations WHERE filename = ? LIMIT 1', [filename]);
  if (rows.length === 0) return 'none';
  return rows[0].checksum === checksum ? 'same' : 'different';
}

async function executeSql(conn, sql) {
  try {
    await conn.query(sql);
  } catch (err) {
    const statements = sql
      .split(/;\s*(\r?\n|$)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      await conn.query(stmt);
    }
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not set');

  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });
  try {
    await ensureMigrationsTable(conn);

    const migrations = readMigrationFiles();
    if (migrations.length === 0) {
      console.log('No migration files found.');
      return;
    }

    for (const m of migrations) {
      const content = fs.readFileSync(m.fullpath, 'utf8');
      const checksum = sha256(content);
      const status = await alreadyApplied(conn, m.filename, checksum);
      if (status === 'same') {
        console.log(`Skip (already applied): ${m.filename}`);
        continue;
      }
      if (status === 'different') {
        throw new Error(`Migration checksum mismatch for ${m.filename}. Resolve manually before proceeding.`);
      }

      console.log(`Applying: ${m.filename}`);
      await conn.beginTransaction();
      try {
        await executeSql(conn, content);
        await conn.query('INSERT INTO _migrations (filename, checksum) VALUES (?, ?)', [m.filename, checksum]);
        await conn.commit();
        console.log(`Applied: ${m.filename}`);
      } catch (e) {
        await conn.rollback();
        throw e;
      }
    }

    console.log('Migrations complete.');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


