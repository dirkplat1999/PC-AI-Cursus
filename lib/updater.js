// Bijwerken vanaf GitHub, met twee methodes:
//   1. git (fetch/pull) — gebruikt als er een .git-map is en het git-commando
//      werkt. Sneller (alleen de wijzigingen), en behoudt precies welke
//      bestanden verwijderd zijn tussen versies.
//   2. HTTP-download — gebruikt als methode 1 niet beschikbaar is (geen git
//      geïnstalleerd, geen .git-map — bijvoorbeeld na het downloaden van de
//      ZIP van GitHub in plaats van een git clone, of in een Dokploy-
//      container waar bewust geen .git-map wordt meegeleverd). Haalt de
//      nieuwste broncode op als .zip via een gewone HTTPS-download (geen
//      git-protocol nodig) en kopieert de bestanden over de huidige
//      installatie heen. Verwijderde bestanden tussen versies worden hierbij
//      niet automatisch opgeruimd (alleen overschreven/toegevoegd) — voor
//      zulke (zeldzame) gevallen is een verse installatie schoner.
//
// Zo werkt "bijwerken" altijd, zolang er internet is — met of zonder git.

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const AdmZip = require('adm-zip');

const REPO_OWNER = 'dirkplat1999';
const REPO_NAME = 'PC-AI-Cursus';
const BRANCH = 'main';
const PROJECT_ROOT = path.join(__dirname, '..');
const GIT_DIR = path.join(PROJECT_ROOT, '.git');

function hasGitRepo() {
  return fs.existsSync(GIT_DIR);
}

function runGit(args) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: PROJECT_ROOT, timeout: 30000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout);
    });
  });
}

function httpsGet(url, { asBuffer = false } = {}) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    https.get(url, { headers: { 'User-Agent': 'pc-ai-cursus-updater' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return httpsGet(res.headers.location, { asBuffer }).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} bij ophalen van ${url}`));
      }
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve(asBuffer ? buf : buf.toString('utf8'));
      });
    }).on('error', reject).setTimeout(20000, function onTimeout() { this.destroy(new Error('Time-out bij verbinden.')); });
  });
}

// Simpele x.y.z-vergelijking (geen npm-dependency nodig voor dit ene doel).
function compareVersions(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

async function remotePackageVersion() {
  const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/package.json`;
  const text = await httpsGet(url);
  return JSON.parse(text).version;
}

async function checkForUpdate() {
  const localVersion = require('../package.json').version;

  if (hasGitRepo()) {
    try {
      await runGit(['fetch']);
      const stdout = await runGit(['log', 'HEAD..@{u}', '--oneline']);
      return {
        method: 'git',
        updateAvailable: !!stdout.trim(),
        message: stdout.trim() ? `Nieuwe commits beschikbaar:\n${stdout.trim()}` : 'Je hebt de laatste versie al.'
      };
    } catch (err) {
      // Geen bruikbare git-verbinding (geen internet, geen remote/upstream
      // geconfigureerd, git niet geïnstalleerd) — val terug op HTTP.
    }
  }

  const remoteVersion = await remotePackageVersion();
  const updateAvailable = compareVersions(remoteVersion, localVersion) > 0;
  return {
    method: 'http',
    updateAvailable,
    message: updateAvailable
      ? `Nieuwe versie beschikbaar: v${remoteVersion} (jij hebt v${localVersion}).`
      : `Je hebt de laatste versie al (v${localVersion}).`
  };
}

// Spawnt "node <npm-cli.js> install" i.p.v. npm(.cmd) rechtstreeks: dat
// laatste is op Windows een batchbestand, wat execFile alleen via een shell
// kan starten — en shell-quoting van een pad met spaties (zoals de
// standaard "C:\Program Files\nodejs") is foutgevoelig. process.execPath
// (node.exe) is altijd een gewoon, direct spawnbaar programma, en werkt zo
// ook automatisch met de portable Node.js-installatie uit ensure-node.ps1.
function npmCliPath() {
  const nodeDir = path.dirname(process.execPath);
  const cliJs = path.join(nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js');
  if (fs.existsSync(cliJs)) return cliJs;
  return null; // val terug op PATH-npm hieronder
}

function runNpmInstall() {
  return new Promise((resolve, reject) => {
    const cliJs = npmCliPath();
    const [cmd, args] = cliJs
      ? [process.execPath, [cliJs, 'install', '--omit=dev']]
      : [process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--omit=dev']];
    execFile(cmd, args, { cwd: PROJECT_ROOT, timeout: 5 * 60 * 1000, shell: !cliJs }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout);
    });
  });
}

// Kopieert alle bestanden uit srcDir naar PROJECT_ROOT, met dezelfde
// relatieve paden. Overschrijft bestaande bestanden, verwijdert niets dat
// niet in srcDir voorkomt — zo blijven data/, node_modules/, node-portable/,
// .env en .git altijd ongemoeid (die staan toch nooit in de gedownloade
// broncode, want ze staan in .gitignore).
function copyTree(srcDir, destDir) {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyTree(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
    // symlinks en andere bestandstypes worden bewust overgeslagen.
  }
}

async function performUpdate() {
  if (hasGitRepo()) {
    try {
      const stdout = await runGit(['pull']);
      return {
        method: 'git',
        message: `Bijgewerkt via git:\n${stdout}\n\nHerstart de server (stop en start npm start opnieuw) om de wijzigingen te laden.`
      };
    } catch (err) {
      // Val terug op de HTTP-methode.
    }
  }

  const zipUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/refs/heads/${BRANCH}.zip`;
  const zipBuffer = await httpsGet(zipUrl, { asBuffer: true });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pcai-update-'));
  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();
    if (!entries.length) throw new Error('Het gedownloade bestand van GitHub bevatte geen bestanden.');

    // Elke entry begint met "<repo>-<branch>/" — dat prefix strippen we,
    // en we schrijven elk bestand handmatig (geen extractAllTo) zodat we
    // zelf paden valideren i.p.v. te vertrouwen op de zip-inhoud.
    const rootPrefix = entries[0].entryName.split('/')[0] + '/';
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      if (!entry.entryName.startsWith(rootPrefix)) continue;
      const relPath = entry.entryName.slice(rootPrefix.length);
      const resolved = path.resolve(tmpDir, relPath);
      if (!resolved.startsWith(path.resolve(tmpDir) + path.sep)) continue; // bescherming tegen padtraversal
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      fs.writeFileSync(resolved, entry.getData());
    }

    copyTree(tmpDir, PROJECT_ROOT);

    let npmMessage = '';
    try {
      await runNpmInstall();
      npmMessage = '\nBenodigde bestanden zijn ook automatisch bijgewerkt.';
    } catch (npmErr) {
      npmMessage = `\nLet op: het automatisch bijwerken van benodigde bestanden is mislukt (${npmErr.message}). Start de server opnieuw op via "Start PC en AI Cursus.bat" — die installeert ze dan alsnog.`;
    }

    // Het net gekopieerde package.json rechtstreeks van schijf lezen (niet
    // via require(), want dat zou de gecachete, oude module teruggeven, en
    // niet via raw.githubusercontent.com, want die CDN kan een paar minuten
    // achterlopen op wat er echt net gedownload/gekopieerd is).
    let newVersion = null;
    try {
      newVersion = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8')).version;
    } catch (e) { /* geen probleem, dan tonen we gewoon geen versienummer */ }

    return {
      method: 'http',
      message: `Bijgewerkt via download van GitHub${newVersion ? ` naar v${newVersion}` : ''} (geen git nodig).${npmMessage}\n\nHerstart de server om de wijzigingen te laden.`
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

module.exports = { checkForUpdate, performUpdate, hasGitRepo, compareVersions };
