const express = require('express');
const db = require('../db/database');
const { requireStudent } = require('../middleware/auth');
const { getUi, getModules, getModule, getLessons, getGlossary, normalizeLang, SUPPORTED_LANGS } = require('../lib/content');
const { detectDevice } = require('../lib/device');

const router = express.Router();
router.use(requireStudent);

function currentStudent(req) {
  return db.prepare('SELECT * FROM students WHERE id = ?').get(req.session.studentId);
}

router.use((req, res, next) => {
  const student = currentStudent(req);
  if (!student) {
    return req.session.destroy(() => res.redirect('/login'));
  }
  req.student = student;
  res.locals.student = student;
  res.locals.lang = normalizeLang(req.query.lang || student.language);
  res.locals.t = getUi(res.locals.lang);
  next();
});

router.get('/', (req, res) => {
  const assigned = db.prepare('SELECT module_key FROM student_modules WHERE student_id = ?').all(req.student.id).map((r) => r.module_key);
  const allModules = getModules();
  const modules = allModules.filter((m) => assigned.includes(m.key));
  const progressRows = db.prepare('SELECT * FROM progress WHERE student_id = ?').all(req.student.id);
  const progressByModule = {};
  progressRows.forEach((p) => { progressByModule[p.module_key] = p; });

  const modulesWithProgress = modules.map((m) => {
    const lessons = getLessons(m.key, res.locals.lang);
    const totalSteps = lessons.reduce((sum, l) => sum + l.steps.length, 0);
    const p = progressByModule[m.key];
    return {
      ...m,
      totalSteps,
      stepIndex: p ? p.step_index : 0,
      completed: p ? !!p.completed : false,
      percent: !p || !totalSteps ? 0 : p.completed ? 100 : Math.round((Math.min(p.step_index, totalSteps - 1) / totalSteps) * 100)
    };
  });

  res.render('student/dashboard', { modules: modulesWithProgress, glossary: getGlossary(res.locals.lang) });
});

router.get('/module/:key', (req, res) => {
  const mod = getModule(req.params.key);
  const assigned = db.prepare('SELECT 1 FROM student_modules WHERE student_id = ? AND module_key = ?').get(req.student.id, req.params.key);
  if (!mod || !assigned) return res.status(404).render('student/dashboard', { modules: [], glossary: getGlossary(res.locals.lang) });

  const lessons = getLessons(req.params.key, res.locals.lang);
  const flatSteps = [];
  lessons.forEach((lesson) => {
    lesson.steps.forEach((step, idx) => {
      flatSteps.push({ ...step, lessonTitle: lesson.title, lessonId: lesson.id, isFirstOfLesson: idx === 0 });
    });
  });

  const progress = db.prepare('SELECT * FROM progress WHERE student_id = ? AND module_key = ?').get(req.student.id, req.params.key);
  let stepIndex = req.query.step !== undefined ? parseInt(req.query.step, 10) : (progress ? progress.step_index : 0);
  if (Number.isNaN(stepIndex) || stepIndex < 0) stepIndex = 0;
  if (stepIndex >= flatSteps.length) stepIndex = flatSteps.length - 1;

  res.render('student/lesson', {
    module: mod,
    steps: flatSteps,
    currentIndex: stepIndex,
    currentStep: flatSteps[stepIndex],
    total: flatSteps.length,
    glossary: getGlossary(res.locals.lang)
  });
});

router.post('/module/:key/progress', (req, res) => {
  const { step_index, completed } = req.body;
  const key = req.params.key;
  const existing = db.prepare('SELECT * FROM progress WHERE student_id = ? AND module_key = ?').get(req.student.id, key);
  if (existing) {
    db.prepare(`UPDATE progress SET step_index = ?, completed = ?, updated_at = datetime('now')
      WHERE student_id = ? AND module_key = ?`)
      .run(Number(step_index) || 0, completed ? 1 : 0, req.student.id, key);
  } else {
    db.prepare(`INSERT INTO progress (student_id, module_key, step_index, completed) VALUES (?, ?, ?, ?)`)
      .run(req.student.id, key, Number(step_index) || 0, completed ? 1 : 0);
  }
  res.json({ ok: true });
});

router.post('/help', (req, res) => {
  const { message, module_key } = req.body;
  const info = db.prepare('INSERT INTO help_requests (student_id, module_key, message) VALUES (?, ?, ?)')
    .run(req.student.id, module_key || null, (message || '').trim().slice(0, 500));
  const io = req.app.get('io');
  if (io) {
    io.emit('help-request', {
      id: info.lastInsertRowid,
      studentName: req.student.full_name,
      username: req.student.username,
      message: message || '',
      moduleKey: module_key || null,
      createdAt: new Date().toISOString()
    });
  }
  res.json({ ok: true });
});

// Fired by the phishing-mail practice widget when a student clicks the
// simulated "bad" button, so the teacher can follow up with them.
router.post('/phishing-alert', (req, res) => {
  const { module_key } = req.body;
  const message = 'Klikte op de knop in de phishing-oefening (viel voor de nepmail tijdens het oefenen).';
  const info = db.prepare('INSERT INTO help_requests (student_id, module_key, message) VALUES (?, ?, ?)')
    .run(req.student.id, module_key || null, message);
  const io = req.app.get('io');
  if (io) {
    io.emit('help-request', {
      id: info.lastInsertRowid,
      studentName: req.student.full_name,
      username: req.student.username,
      message,
      moduleKey: module_key || null,
      createdAt: new Date().toISOString()
    });
  }
  res.json({ ok: true });
});

router.post('/preferences', (req, res) => {
  const { language, font_size, high_contrast } = req.body;
  const updates = [];
  const values = [];
  if (language && SUPPORTED_LANGS.includes(language)) { updates.push('language = ?'); values.push(language); }
  if (font_size) { updates.push('font_size = ?'); values.push(font_size); }
  if (high_contrast !== undefined) { updates.push('high_contrast = ?'); values.push(high_contrast ? 1 : 0); }
  if (updates.length) {
    values.push(req.student.id);
    db.prepare(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }
  res.json({ ok: true });
});

router.get('/browser', (req, res) => {
  const url = req.query.url || 'https://www.google.com';
  const back = req.query.back || '/student';
  const device = detectDevice(req.headers['user-agent']);
  res.render('student/browser', { url, back, device });
});

module.exports = router;
