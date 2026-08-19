const express = require('express');
const bcrypt = require('bcryptjs');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');
const { getUi, getModules, normalizeLang, SUPPORTED_LANGS } = require('../lib/content');
const pkg = require('../package.json');

const router = express.Router();
router.use(requireAdmin);

function withAdminLocals(req, res, next) {
  res.locals.adminLang = normalizeLang(req.query.lang || req.session.adminLang || 'nl');
  req.session.adminLang = res.locals.adminLang;
  res.locals.t = getUi(res.locals.adminLang);
  res.locals.lang = res.locals.adminLang;
  next();
}
router.use(withAdminLocals);

function studentsWithProgress(lang) {
  const students = db.prepare('SELECT * FROM students ORDER BY full_name COLLATE NOCASE').all();
  const modules = getModules();
  const titleByKey = {};
  modules.forEach((m) => { titleByKey[m.key] = m.title[lang] || m.title.nl; });
  return students.map((s) => {
    const assigned = db.prepare('SELECT module_key FROM student_modules WHERE student_id = ?').all(s.id).map((r) => r.module_key);
    const progressRows = db.prepare('SELECT * FROM progress WHERE student_id = ?').all(s.id);
    const progressByModule = {};
    progressRows.forEach((p) => { progressByModule[p.module_key] = p; });
    const completedCount = assigned.filter((k) => progressByModule[k] && progressByModule[k].completed).length;
    return {
      ...s,
      assignedModules: assigned,
      assignedModuleTitles: assigned.map((k) => titleByKey[k] || k),
      progressByModule,
      completedCount,
      totalAssigned: assigned.length
    };
  });
}

router.get('/', (req, res) => {
  const openHelp = db.prepare(`
    SELECT h.*, s.full_name, s.username FROM help_requests h
    JOIN students s ON s.id = h.student_id
    WHERE h.status = 'open' ORDER BY h.created_at DESC
  `).all();
  const students = studentsWithProgress(res.locals.lang);
  res.render('admin/dashboard', {
    students,
    openHelp,
    modules: getModules(),
    version: pkg.version
  });
});

router.get('/students', (req, res) => {
  res.render('admin/students', {
    students: studentsWithProgress(res.locals.lang),
    modules: getModules(),
    langs: SUPPORTED_LANGS,
    error: null,
    formStudent: null
  });
});

router.post('/students', (req, res) => {
  const { username, full_name, password, language, modules } = req.body;
  const t = res.locals.t;
  if (!username || !full_name || !password) {
    return res.render('admin/students', {
      students: studentsWithProgress(res.locals.lang), modules: getModules(), langs: SUPPORTED_LANGS,
      error: 'Vul gebruikersnaam, naam en wachtwoord in.', formStudent: req.body
    });
  }
  const uname = username.trim().toLowerCase();
  const exists = db.prepare('SELECT 1 FROM students WHERE username = ?').get(uname);
  if (exists) {
    return res.render('admin/students', {
      students: studentsWithProgress(res.locals.lang), modules: getModules(), langs: SUPPORTED_LANGS,
      error: 'Gebruikersnaam bestaat al.', formStudent: req.body
    });
  }
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO students (username, password_hash, full_name, language) VALUES (?, ?, ?, ?)')
    .run(uname, hash, full_name.trim(), normalizeLang(language));

  const selectedModules = Array.isArray(modules) ? modules : (modules ? [modules] : []);
  const insertMod = db.prepare('INSERT OR IGNORE INTO student_modules (student_id, module_key) VALUES (?, ?)');
  selectedModules.forEach((m) => insertMod.run(info.lastInsertRowid, m));

  res.redirect('/admin/students');
});

router.post('/students/:id', (req, res) => {
  const id = Number(req.params.id);
  const { full_name, language, modules, new_password } = req.body;
  db.prepare('UPDATE students SET full_name = ?, language = ? WHERE id = ?')
    .run(full_name.trim(), normalizeLang(language), id);

  if (new_password && new_password.length >= 6) {
    db.prepare('UPDATE students SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(new_password, 10), id);
  }

  const selectedModules = Array.isArray(modules) ? modules : (modules ? [modules] : []);
  db.prepare('DELETE FROM student_modules WHERE student_id = ?').run(id);
  const insertMod = db.prepare('INSERT OR IGNORE INTO student_modules (student_id, module_key) VALUES (?, ?)');
  selectedModules.forEach((m) => insertMod.run(id, m));

  res.redirect('/admin/students');
});

router.post('/students/:id/delete', (req, res) => {
  db.prepare('DELETE FROM students WHERE id = ?').run(Number(req.params.id));
  res.redirect('/admin/students');
});

router.post('/help/:id/resolve', (req, res) => {
  db.prepare("UPDATE help_requests SET status = 'resolved', resolved_at = datetime('now') WHERE id = ?").run(Number(req.params.id));
  const io = req.app.get('io');
  if (io) io.emit('help-resolved', { id: Number(req.params.id) });
  res.redirect('/admin');
});

// --- Changelog & updates ---
router.get('/changelog', (req, res) => {
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
  const changelog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : 'Geen CHANGELOG.md gevonden.';
  res.render('admin/changelog', { changelog, version: pkg.version, gitResult: null });
});

router.post('/changelog/check', (req, res) => {
  execFile('git', ['fetch'], { cwd: path.join(__dirname, '..') }, (fetchErr) => {
    const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
    const changelog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : 'Geen CHANGELOG.md gevonden.';
    if (fetchErr) {
      return res.render('admin/changelog', { changelog, version: pkg.version, gitResult: 'Kon niet verbinden met de remote repository (geen internet of geen git-remote geconfigureerd).' });
    }
    execFile('git', ['log', 'HEAD..@{u}', '--oneline'], { cwd: path.join(__dirname, '..') }, (logErr, stdout) => {
      const result = logErr
        ? 'Geen remote/upstream branch gevonden.'
        : (stdout.trim() ? `Nieuwe commits beschikbaar:\n${stdout.trim()}` : 'Je hebt de laatste versie al.');
      res.render('admin/changelog', { changelog, version: pkg.version, gitResult: result });
    });
  });
});

router.post('/changelog/update', (req, res) => {
  execFile('git', ['pull'], { cwd: path.join(__dirname, '..') }, (err, stdout, stderr) => {
    const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
    const changelog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : 'Geen CHANGELOG.md gevonden.';
    const result = err
      ? `Bijwerken mislukt: ${stderr || err.message}`
      : `Bijgewerkt:\n${stdout}\n\nHerstart de server (stop en start npm start opnieuw) om de wijzigingen te laden.`;
    res.render('admin/changelog', { changelog, version: pkg.version, gitResult: result });
  });
});

module.exports = router;
