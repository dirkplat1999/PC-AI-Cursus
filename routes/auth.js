const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { getUi, normalizeLang } = require('../lib/content');

const router = express.Router();

function adminExists() {
  return !!db.prepare('SELECT 1 FROM admin WHERE id = 1').get();
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
  res.render('login', { t: getUi(lang), lang, error: null });
});

router.post('/login', (req, res) => {
  const lang = normalizeLang(req.body.lang || 'nl');
  const t = getUi(lang);
  const { role, username, password } = req.body;

  if (role === 'admin') {
    const admin = db.prepare('SELECT * FROM admin WHERE id = 1').get();
    if (admin && bcrypt.compareSync(password || '', admin.password_hash)) {
      req.session.role = 'admin';
      return res.redirect('/admin');
    }
    return res.render('login', { t, lang, error: t.loginError });
  }

  const student = db.prepare('SELECT * FROM students WHERE username = ?').get((username || '').trim().toLowerCase());
  if (student && bcrypt.compareSync(password || '', student.password_hash)) {
    req.session.role = 'student';
    req.session.studentId = student.id;
    return res.redirect('/student');
  }
  return res.render('login', { t, lang, error: t.loginError });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
