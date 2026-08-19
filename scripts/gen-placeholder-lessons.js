// One-off generator for placeholder lesson content (modules 2-5).
// Run with: node scripts/gen-placeholder-lessons.js
const fs = require('fs');
const path = require('path');

const modules = require('../content/modules.json');

const placeholderText = {
  nl: {
    lessonTitle: 'Binnenkort beschikbaar',
    stepTitle: 'Deze les wordt nog voorbereid',
    body: (desc) => `<p>Deze module gaat over: <em>${desc}</em>.</p><p>De docent kan hier stap-voor-stap lesmateriaal aan toevoegen via de contentmap van het project (<code>content/lessons/</code>). De structuur van module 1 (E-mailen etc.) kan als voorbeeld dienen.</p>`
  },
  en: {
    lessonTitle: 'Coming soon',
    stepTitle: 'This lesson is still being prepared',
    body: (desc) => `<p>This module covers: <em>${desc}</em>.</p><p>The teacher can add step-by-step material here via the project's content folder (<code>content/lessons/</code>). Module 1 (Email etc.) can serve as an example.</p>`
  },
  de: {
    lessonTitle: 'Demnächst verfügbar',
    stepTitle: 'Diese Lektion wird noch vorbereitet',
    body: (desc) => `<p>Dieses Modul behandelt: <em>${desc}</em>.</p><p>Die Lehrkraft kann hier Schritt-für-Schritt-Material über den Content-Ordner des Projekts hinzufügen (<code>content/lessons/</code>). Modul 1 (E-Mail usw.) kann als Beispiel dienen.</p>`
  }
};

for (const mod of modules) {
  if (mod.key === 'module1') continue;
  for (const lang of ['nl', 'en', 'de']) {
    const dir = path.join(__dirname, '..', 'content', 'lessons', mod.key);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${lang}.json`);
    const t = placeholderText[lang];
    const data = {
      lessons: [
        {
          id: 'intro',
          title: `${mod.title[lang]} — ${t.lessonTitle}`,
          steps: [
            { title: t.stepTitle, body: t.body(mod.description[lang]) }
          ]
        }
      ]
    };
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log('wrote', file);
  }
}
