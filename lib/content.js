const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const SUPPORTED_LANGS = ['nl', 'en', 'de'];
const AGE_GROUPS = ['senior', 'young', 'genz'];

// Content files are static during a running session (they only change via a
// git pull + manual server restart, see README "Updates & wijzigingslog").
// Every route re-read and re-parsed them from disk on every single request,
// which under many simultaneous requests repeatedly blocks Node's single
// event loop on synchronous disk I/O. Caching the parsed result in memory
// removes that per-request cost entirely.
const jsonCache = new Map();

function readJson(filePath, fallback) {
  if (jsonCache.has(filePath)) return jsonCache.get(filePath);
  let value;
  try {
    value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    value = fallback;
  }
  jsonCache.set(filePath, value);
  return value;
}

function normalizeLang(lang) {
  return SUPPORTED_LANGS.includes(lang) ? lang : 'nl';
}

function normalizeAgeGroup(ageGroup) {
  return AGE_GROUPS.includes(ageGroup) ? ageGroup : 'senior';
}

function getModules() {
  return readJson(path.join(CONTENT_DIR, 'modules.json'), []);
}

function getModule(key) {
  return getModules().find((m) => m.key === key) || null;
}

function getLessons(moduleKey, lang, ageGroup) {
  const l = normalizeLang(lang);
  const age = normalizeAgeGroup(ageGroup);
  const file = path.join(CONTENT_DIR, 'lessons', moduleKey, l, `${age}.json`);
  const fallbackLangFile = path.join(CONTENT_DIR, 'lessons', moduleKey, 'nl', age);
  const data = readJson(file, null)
    || readJson(`${fallbackLangFile}.json`, null)
    || readJson(path.join(CONTENT_DIR, 'lessons', moduleKey, 'nl', 'senior.json'), { lessons: [] });
  return data.lessons || [];
}

// "meer op veiligheid" voor jonger dan 50, "veiligheid en apps" voor 50+,
// "AI, veiligheid en geld" voor jonger dan 30.
const RECOMMENDED_MODULES = {
  senior: ['module1', 'module2', 'module3', 'module5'],
  young: ['module3', 'module4'],
  genz: ['module3', 'module4', 'module9']
};

function getRecommendedModules(ageGroup) {
  return RECOMMENDED_MODULES[normalizeAgeGroup(ageGroup)];
}

function getGlossary(lang) {
  const file = path.join(CONTENT_DIR, 'glossary', `${normalizeLang(lang)}.json`);
  return readJson(file, []);
}

function getUi(lang) {
  const file = path.join(CONTENT_DIR, 'ui', `${normalizeLang(lang)}.json`);
  return readJson(file, {});
}

module.exports = {
  SUPPORTED_LANGS,
  AGE_GROUPS,
  normalizeLang,
  normalizeAgeGroup,
  getModules,
  getModule,
  getLessons,
  getGlossary,
  getUi,
  getRecommendedModules
};
