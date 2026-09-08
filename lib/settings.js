const db = require('../db/database');

const SETTING_KEYS = [
  'smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass',
  'mail_from_name', 'mail_from_address', 'course_url'
];

function getSetting(key, fallback = '') {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row && row.value !== null ? row.value : fallback;
}

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const map = {};
  rows.forEach((r) => { map[r.key] = r.value; });
  const result = {};
  SETTING_KEYS.forEach((k) => { result[k] = map[k] || ''; });
  return result;
}

function setSetting(key, value) {
  db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value == null ? null : String(value));
}

function setSettings(obj) {
  const set = db.transaction((entries) => {
    entries.forEach(([key, value]) => setSetting(key, value));
  });
  set(Object.entries(obj).filter(([key]) => SETTING_KEYS.includes(key)));
}

function isMailConfigured() {
  const s = getSettings();
  return !!(s.smtp_host && s.smtp_port && s.mail_from_address);
}

module.exports = { SETTING_KEYS, getSetting, getSettings, setSetting, setSettings, isMailConfigured };
