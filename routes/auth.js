const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { getUi, normalizeLang } = require('../lib/content');
const { isValidEmail } = require('../lib/email-provider');
const { isRateLimited } = require('../lib/rate-limit');

const router = express.Router();

function adminExists() {
  return !!db.prepare('SELECT 1 FROM admin WHERE id = 1').get();
}

function renderLogin(res, lang, extra) {
  const t = getUi(lang);
  res.render('login', { t, lang, error: null, notice: null, ...extra });
}

router.get('/setup', (req, res) => {
  if (adminExists()) return res.redirect('/login');
  const lang = normalizeLang(req.query.lang || 'nl');
  res.render('setup', { t: getUi(lang), lang, error: null });
});

router.post('/setup', (req, res) => {
  if (adminExists()) return res.redirect('/login');
  const lang = normalizeLang(req.body.lang || 'nl');
  const t = getUi(lang);
  const { password, confirmPassword } = req.body;

  if (!password || password.length < 6) {
    return res.render('setup', { t, lang, error: 'Wachtwoord moet minstens 6 tekens zijn / must be at least 6 characters.' });
  }
  if (password !== confirmPassword) {
    return res.render('setup', { t, lang, error: t.passwordMismatch });
  }

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO admin (id, password_hash) VALUES (1, ?)').run(hash);
  req.session.role = 'admin';
  res.redirect('/admin');
});

router.get('/login', (req, res) => {
  if (!adminExists()) return res.redirect('/setup');
  if (req.session && req.session.role === 'admin') return res.redirect('/admin');
  if (req.session && req.session.role === 'student') return res.redirect('/student');
  const lang = normalizeLang(req.query.lang || 'nl');
  renderLogin(res, lang, {});
});

router.post('/login', (req, res) => {
  const lang = normalizeLang(req.body.lang || 'nl');
  const t = getUi(lang);
  const { role, username, password } = req.body;

  // Geen wachtwoord-lockout per account (dat zou een account juist
  // blokkeerbaar maken voor de echte eigenaar) — in plaats daarvan een
  // eenvoudige limiet per IP-adres tegen brute-force gokken.
  if (isRateLimited(`login:${req.ip}`, { max: 15, windowMs: 5 * 60 * 1000 })) {
    return renderLogin(res, lang, { error: t.rateLimited });
  }

  if (role === 'admin') {
    const admin = db.prepare('SELECT * FROM admin WHERE id = 1').get();
    if (admin && bcrypt.compareSync(password || '', admin.password_hash)) {
      req.session.role = 'admin';
      return res.redirect('/admin');
    }
    return renderLogin(res, lang, { error: t.loginError });
  }

  const student = db.prepare('SELECT * FROM students WHERE username = ?').get((username || '').trim().toLowerCase());
  if (student && bcrypt.compareSync(password || '', student.password_hash)) {
    req.session.role = 'student';
    req.session.studentId = student.id;
    return res.redirect('/student');
  }
  return renderLogin(res, lang, { error: t.loginError });
});

// Toegangsaanvraag vanaf het inlogscherm — komt binnen als openstaande
// aanvraag op het beheerdersdashboard, waar de docent 'm met één klik kan
// goedkeuren (maakt dan automatisch een account aan en mailt de
// inloggegevens) of afwijzen. De leeftijdscategorie/niveau wordt bewust
// niet hier gevraagd — de docent kiest/wijzigt die zelf op het
// beheerdersdashboard (het account start op niveau 1, aan te passen via
// "Bewerken" bij Cursisten).
router.post('/access-request', (req, res) => {
  const lang = normalizeLang(req.body.lang || 'nl');
  const t = getUi(lang);
  const fullName = (req.body.full_name || '').trim().slice(0, 200);
  const email = (req.body.email || '').trim().slice(0, 200);
  const message = (req.body.message || '').trim().slice(0, 500);

  if (!fullName || !email) {
    return renderLogin(res, lang, { error: t.requestAccessError });
  }
  if (!isValidEmail(email)) {
    return renderLogin(res, lang, { error: t.requestAccessInvalidEmail });
  }
  if (isRateLimited(`access-request:${req.ip}`, { max: 5, windowMs: 15 * 60 * 1000 })) {
    return renderLogin(res, lang, { error: t.rateLimited });
  }

  const info = db.prepare('INSERT INTO access_requests (full_name, email, language, message) VALUES (?, ?, ?, ?)')
    .run(fullName, email, lang, message || null);

  const io = req.app.get('io');
  if (io) {
    io.emit('access-request', {
      id: info.lastInsertRowid,
      fullName,
      email,
      message,
      createdAt: new Date().toISOString()
    });
  }

  renderLogin(res, lang, { notice: t.requestAccessSent });
});

// Eenmalige inloglink uit de "inloggegevens versturen"-e-mail (zie
// routes/admin.js) — logt de cursist direct in zonder wachtwoord, mits de
// link nog geldig is (binnen MAGIC_LOGIN_MINUTES na versturen, en nog niet
// eerder gebruikt).
router.get('/login/token/:token', (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE login_token = ?').get(req.params.token);
  const lang = normalizeLang(student ? student.language : (req.query.lang || 'nl'));
  const t = getUi(lang);

  const invalidate = () => {
    if (student) db.prepare('UPDATE students SET login_token = NULL, login_token_expires = NULL WHERE id = ?').run(student.id);
  };

  if (!student || !student.login_token_expires || new Date(student.login_token_expires).getTime() < Date.now()) {
    invalidate();
    return renderLogin(res, lang, { error: t.magicLinkExpired });
  }

  invalidate();
  req.session.role = 'student';
  req.session.studentId = student.id;
  res.redirect('/student');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
