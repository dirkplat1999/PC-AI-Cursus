const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const db = require('../db/database');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'pcai.sqlite');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
const INCOMING_DIR = path.join(BACKUPS_DIR, '_incoming');
if (!fs.existsSync(INCOMING_DIR)) fs.mkdirSync(INCOMING_DIR, { recursive: true });

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// Uses SQLite's online backup API (via better-sqlite3's db.backup) so a
// consistent snapshot is taken even while the live app keeps using the
// database (safe with WAL mode, unlike a raw file copy).
async function createBackupFile(destPath) {
  await db.backup(destPath);
  return destPath;
}

function downloadFileName() {
  return `pcai-cursus-backup-${timestamp()}.sqlite`;
}

// Opens the candidate file read-only and checks it has the tables this
// app expects, without touching the live database connection.
function validateBackupFile(filePath) {
  let check;
  try {
    check = new Database(filePath, { readonly: true, fileMustExist: true });
    const tables = check.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name);
    const required = ['admin', 'students', 'student_modules', 'progress'];
    const ok = required.every((t) => tables.includes(t));
    return ok ? { ok: true } : { ok: false, reason: 'Dit bestand mist de verwachte tabellen van deze applicatie.' };
  } catch (err) {
    return { ok: false, reason: 'Dit is geen geldig back-upbestand (kon het niet als database openen).' };
  } finally {
    if (check) check.close();
  }
}

function listSafetyBackups() {
  return fs.readdirSync(BACKUPS_DIR)
    .filter((f) => f.endsWith('.sqlite'))
    .map((f) => {
      const stat = fs.statSync(path.join(BACKUPS_DIR, f));
      return { name: f, size: stat.size, mtime: stat.mtime };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

// Replaces the live database file with a validated upload. Closes the
// shared connection first, so the app MUST be restarted afterwards for
// other routes to work again (same manual-restart pattern already used
// by the git update feature).
async function replaceLiveDatabase(newFilePath) {
  // Use the online backup API (not a raw file copy) for the safety copy too:
  // the live DB runs in WAL mode, so recent writes can still be sitting in
  // the -wal file and would be silently missing from a plain file copy.
  const preRestorePath = path.join(BACKUPS_DIR, `pre-restore-${timestamp()}.sqlite`);
  await db.backup(preRestorePath);

  db.close();

  for (const suffix of ['', '-wal', '-shm']) {
    const p = DB_PATH + suffix;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  fs.copyFileSync(newFilePath, DB_PATH);

  return preRestorePath;
}

module.exports = {
  DATA_DIR,
  DB_PATH,
  BACKUPS_DIR,
  createBackupFile,
  downloadFileName,
  validateBackupFile,
  listSafetyBackups,
  replaceLiveDatabase
};
