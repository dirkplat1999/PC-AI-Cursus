const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const SUPPORTED_LANGS = ['nl', 'en', 'de'];

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return fallback;
  }
}

function normalizeLang(lang) {
  return SUPPORTED_LANGS.includes(lang) ? lang : 'nl';
}

function getModules() {
  return readJson(path.join(CONTENT_DIR, 'modules.json'), []);
}

function getModule(key) {
  return getModules().find((m) => m.key === key) || null;
}

function getLessons(moduleKey, lang) {
  const file = path.join(CONTENT_DIR, 'lessons', moduleKey, `${normalizeLang(lang)}.json`);
  const data = readJson(file, null) || readJson(path.join(CONTENT_DIR, 'lessons', moduleKey, 'nl.json'), { lessons: [] });
  return data.lessons || [];
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
  normalizeLang,
  getModules,
  getModule,
  getLessons,
  getGlossary,
  getUi
};
