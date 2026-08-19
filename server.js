const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const http = require('http');
const { Server } = require('socket.io');

const db = require('./db/database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.set('io', io);

const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const secretPath = path.join(dataDir, '.session-secret');
let sessionSecret;
if (fs.existsSync(secretPath)) {
  sessionSecret = fs.readFileSync(secretPath, 'utf8').trim();
} else {
  sessionSecret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(secretPath, sessionSecret, 'utf8');
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 12 } // 12 hours
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.get('/', (req, res) => {
  const adminExists = !!db.prepare('SELECT 1 FROM admin WHERE id = 1').get();
  if (!adminExists) return res.redirect('/setup');
  if (req.session.role === 'admin') return res.redirect('/admin');
  if (req.session.role === 'student') return res.redirect('/student');
  return res.redirect('/login');
});

app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/student', studentRoutes);

app.use((req, res) => {
  res.status(404).send('Pagina niet gevonden / Page not found / Seite nicht gefunden');
});

io.on('connection', (socket) => {
  socket.on('join-admin', () => socket.join('admins'));
});

function getLanIPs() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) results.push(net.address);
    }
  }
  return results;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\nPC & AI Cursus draait!`);
  console.log(`Lokaal:   http://localhost:${PORT}`);
  getLanIPs().forEach((ip) => console.log(`Netwerk:  http://${ip}:${PORT}`));
  console.log('');
});
