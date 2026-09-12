const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');
const { getUi, getModules, normalizeLang, SUPPORTED_LANGS, AGE_GROUPS, normalizeAgeGroup, getRecommendedModules } = require('../lib/content');
const backup = require('../lib/backup');
const pkg = require('../package.json');
const { getSettings, setSettings, isMailConfigured } = require('../lib/settings');
const { sendMail } = require('../lib/mailer');
const { detectProvider, providerName } = require('../lib/email-provider');
const updater = require('../lib/updater');

// Avoids visually ambiguous characters (0/O, 1/l/I) so a hand-typed
// temporary password is easy to read correctly off an email or screen.
const PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
function generatePassword(length = 10) {
  let out = '';
  for (let i = 0; i < length; i++) out += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
  return out;
}

const upload = multer({
  dest: path.join(backup.BACKUPS_DIR, '_incoming'),
  limits: { fileSize: 200 * 1024 * 1024 }
});

const router = express.Router();
router.use(requireAdmin);

const RECOMMENDED_MODULES_MAP = Object.fromEntries(AGE_GROUPS.map((g) => [g, getRecommendedModules(g)]));

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
    ageGroups: AGE_GROUPS,
    recommendedModules: RECOMMENDED_MODULES_MAP,
    error: null,
    notice: req.query.sent ? `Inloggegevens verstuurd naar ${req.query.sent}.` : null,
    mailConfigured: isMailConfigured(),
    formStudent: null
  });
});

router.post('/students', (req, res) => {
  const { username, full_name, email, password, language, age_group, modules } = req.body;
  const t = res.locals.t;
  if (!username || !full_name || !password) {
    return res.render('admin/students', {
      students: studentsWithProgress(res.locals.lang), modules: getModules(), langs: SUPPORTED_LANGS,
      ageGroups: AGE_GROUPS, recommendedModules: RECOMMENDED_MODULES_MAP, mailConfigured: isMailConfigured(),
      error: 'Vul gebruikersnaam, naam en wachtwoord in.', notice: null, formStudent: req.body
    });
  }
  const uname = username.trim().toLowerCase();
  const exists = db.prepare('SELECT 1 FROM students WHERE username = ?').get(uname);
  if (exists) {
    return res.render('admin/students', {
      students: studentsWithProgress(res.locals.lang), modules: getModules(), langs: SUPPORTED_LANGS,
      ageGroups: AGE_GROUPS, recommendedModules: RECOMMENDED_MODULES_MAP, mailConfigured: isMailConfigured(),
      error: 'Gebruikersnaam bestaat al.', notice: null, formStudent: req.body
    });
  }
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO students (username, password_hash, full_name, email, language, age_group) VALUES (?, ?, ?, ?, ?, ?)')
    .run(uname, hash, full_name.trim(), (email || '').trim() || null, normalizeLang(language), normalizeAgeGroup(age_group));

  const selectedModules = Array.isArray(modules) ? modules : (modules ? [modules] : []);
  const insertMod = db.prepare('INSERT OR IGNORE INTO student_modules (student_id, module_key) VALUES (?, ?)');
  selectedModules.forEach((m) => insertMod.run(info.lastInsertRowid, m));

  res.redirect('/admin/students');
});

router.post('/students/:id', (req, res) => {
  const id = Number(req.params.id);
  const { full_name, email, language, age_group, modules, new_password } = req.body;
  db.prepare('UPDATE students SET full_name = ?, email = ?, language = ?, age_group = ? WHERE id = ?')
    .run(full_name.trim(), (email || '').trim() || null, normalizeLang(language), normalizeAgeGroup(age_group), id);

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

// Genereert een nieuw wachtwoord voor de cursist en e-mailt de
// inloggegevens (gebruikersnaam, nieuw wachtwoord, cursus-URL). Werkt ook
// als "wachtwoord vergeten"-herstel: er wordt altijd een vers wachtwoord
// gegenereerd, nooit het oude (dat is alleen als hash bekend).
router.post('/students/:id/send-credentials', async (req, res) => {
  const id = Number(req.params.id);
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  const renderError = (error) => res.render('admin/students', {
    students: studentsWithProgress(res.locals.lang), modules: getModules(), langs: SUPPORTED_LANGS,
    ageGroups: AGE_GROUPS, recommendedModules: RECOMMENDED_MODULES_MAP, mailConfigured: isMailConfigured(),
    error, notice: null, formStudent: null
  });

  if (!student) return renderError('Cursist niet gevonden.');
  if (!student.email) return renderError(`${student.full_name} heeft nog geen e-mailadres — vul die eerst in bij het bewerken van de cursist.`);
  if (!isMailConfigured()) return renderError('E-mail is nog niet ingesteld. Ga naar Instellingen om de SMTP-gegevens in te vullen.');

  const newPassword = generatePassword();
  const settings = getSettings();
  const courseUrl = settings.course_url || `${req.protocol}://${req.get('host')}`;

  const text = [
    `Hallo ${student.full_name},`,
    '',
    'Je account voor de PC & AI Cursus is klaar. Zo log je in:',
    '',
    `Website: ${courseUrl}`,
    `Gebruikersnaam: ${student.username}`,
    `Wachtwoord: ${newPassword}`,
    '',
    'Open de website, kies "Cursisten" en log in met de gegevens hierboven.',
    '',
    'Tot snel!'
  ].join('\n');
  const html = `
    <p>Hallo ${student.full_name},</p>
    <p>Je account voor de <strong>PC &amp; AI Cursus</strong> is klaar. Zo log je in:</p>
    <p>
      Website: <a href="${courseUrl}">${courseUrl}</a><br>
      Gebruikersnaam: <strong>${student.username}</strong><br>
      Wachtwoord: <strong>${newPassword}</strong>
    </p>
    <p>Open de website, kies "Cursisten" en log in met de gegevens hierboven.</p>
    <p>Tot snel!</p>
  `;

  try {
    await sendMail({ to: student.email, subject: 'Je inloggegevens voor de PC & AI Cursus', text, html });
  } catch (err) {
    return renderError(`Versturen mislukt: ${err.message}`);
  }

  db.prepare('UPDATE students SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), id);
  res.redirect(`/admin/students?sent=${encodeURIComponent(student.email)}`);
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

router.post('/changelog/check', async (req, res) => {
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
  const changelog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : 'Geen CHANGELOG.md gevonden.';
  try {
    const result = await updater.checkForUpdate();
    res.render('admin/changelog', { changelog, version: pkg.version, gitResult: result.message });
  } catch (err) {
    res.render('admin/changelog', { changelog, version: pkg.version, gitResult: `Kon niet controleren op updates: ${err.message} (geen internetverbinding?)` });
  }
});

router.post('/changelog/update', async (req, res) => {
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
  const changelog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : 'Geen CHANGELOG.md gevonden.';
  try {
    const result = await updater.performUpdate();
    res.render('admin/changelog', { changelog, version: pkg.version, gitResult: result.message });
  } catch (err) {
    res.render('admin/changelog', { changelog, version: pkg.version, gitResult: `Bijwerken mislukt: ${err.message} (geen internetverbinding?)` });
  }
});

// --- Backup & restore ---
router.get('/backup', (req, res) => {
  res.render('admin/backup', {
    safetyBackups: backup.listSafetyBackups(),
    error: null,
    restored: false
  });
});

router.post('/backup/create', async (req, res) => {
  const tmpPath = path.join(backup.BACKUPS_DIR, `_download-${Date.now()}.sqlite`);
  try {
    await backup.createBackupFile(tmpPath);
    res.download(tmpPath, backup.downloadFileName(), (err) => {
      fs.unlink(tmpPath, () => {});
      if (err && !res.headersSent) {
        res.status(500).render('admin/backup', {
          safetyBackups: backup.listSafetyBackups(),
          error: 'Downloaden van de back-up is mislukt.',
          restored: false
        });
      }
    });
  } catch (err) {
    fs.unlink(tmpPath, () => {});
    res.status(500).render('admin/backup', {
      safetyBackups: backup.listSafetyBackups(),
      error: 'Back-up maken is mislukt: ' + err.message,
      restored: false
    });
  }
});

router.post('/backup/restore', upload.single('backupfile'), async (req, res) => {
  const cleanupUpload = () => { if (req.file) fs.unlink(req.file.path, () => {}); };

  if (!req.file) {
    return res.status(400).render('admin/backup', {
      safetyBackups: backup.listSafetyBackups(),
      error: 'Kies eerst een back-upbestand om te herstellen.',
      restored: false
    });
  }
  if (!req.body.confirm) {
    cleanupUpload();
    return res.status(400).render('admin/backup', {
      safetyBackups: backup.listSafetyBackups(),
      error: 'Bevestig eerst dat je begrijpt dat dit de huidige gegevens overschrijft.',
      restored: false
    });
  }

  const check = backup.validateBackupFile(req.file.path);
  if (!check.ok) {
    cleanupUpload();
    return res.status(400).render('admin/backup', {
      safetyBackups: backup.listSafetyBackups(),
      error: check.reason,
      restored: false
    });
  }

  try {
    await backup.replaceLiveDatabase(req.file.path);
  } catch (err) {
    cleanupUpload();
    return res.status(500).render('admin/backup', {
      safetyBackups: backup.listSafetyBackups(),
      error: 'Herstellen is mislukt: ' + err.message,
      restored: false
    });
  }
  cleanupUpload();
  // Render first (while the session is still intact for the layout's
  // locals), then destroy the session, then send — so the admin is
  // logged out only once the confirmation page is fully rendered.
  res.render('admin/backup', { safetyBackups: [], error: null, restored: true }, (err, html) => {
    if (err) return res.status(500).send('Herstel gelukt, maar de bevestigingspagina kon niet worden weergegeven. Herstart de server.');
    req.session.destroy(() => res.send(html));
  });
});

// --- Instellingen (SMTP & cursus-URL) ---
router.get('/settings', (req, res) => {
  res.render('admin/settings', {
    settings: getSettings(),
    error: null,
    notice: null,
    testEmail: ''
  });
});

router.post('/settings', (req, res) => {
  const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, mail_from_name, mail_from_address, course_url } = req.body;
  setSettings({
    smtp_host: (smtp_host || '').trim(),
    smtp_port: (smtp_port || '').trim(),
    smtp_secure: smtp_secure ? '1' : '0',
    smtp_user: (smtp_user || '').trim(),
    // Leeg gelaten wachtwoordveld laat het opgeslagen wachtwoord ongewijzigd,
    // zodat je de overige instellingen kunt bijwerken zonder het SMTP-
    // wachtwoord opnieuw te moeten intypen.
    smtp_pass: smtp_pass ? smtp_pass : getSettings().smtp_pass,
    mail_from_name: (mail_from_name || '').trim(),
    mail_from_address: (mail_from_address || '').trim(),
    course_url: (course_url || '').trim()
  });
  res.render('admin/settings', {
    settings: getSettings(),
    error: null,
    notice: 'Instellingen opgeslagen.',
    testEmail: ''
  });
});

router.post('/settings/test', async (req, res) => {
  const testEmail = (req.body.test_email || '').trim();
  const renderWith = (extra) => res.render('admin/settings', {
    settings: getSettings(), error: null, notice: null, testEmail, ...extra
  });

  if (!testEmail) return renderWith({ error: 'Vul een e-mailadres in om een testmail naartoe te sturen.' });
  if (!isMailConfigured()) return renderWith({ error: 'Vul eerst de SMTP-gegevens hieronder in en sla ze op.' });

  try {
    await sendMail({
      to: testEmail,
      subject: 'Testmail — PC & AI Cursus',
      text: 'Dit is een testmail vanuit het beheerdersdashboard van de PC & AI Cursus. Als je dit ontvangt, werken de e-mailinstellingen correct.',
      html: '<p>Dit is een testmail vanuit het beheerdersdashboard van de <strong>PC &amp; AI Cursus</strong>.</p><p>Als je dit ontvangt, werken de e-mailinstellingen correct.</p>'
    });
  } catch (err) {
    return renderWith({ error: `Testmail versturen mislukt: ${err.message}` });
  }
  renderWith({ notice: `Testmail verstuurd naar ${testEmail}.` });
});

module.exports = router;
