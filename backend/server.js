require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const port = Number(process.env.PORT || 3000);
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET is required');

const origins = (process.env.CORS_ORIGIN || '*').split(',').map(x => x.trim());
app.use(cors({ origin: origins.includes('*') ? true : origins }));
app.use(express.json({ limit: '1mb' }));

const db = new Database(path.join(__dirname, 'educore.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS olympiads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    published INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    olympiad_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    answer TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 10,
    FOREIGN KEY (olympiad_id) REFERENCES olympiads(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    statement TEXT NOT NULL,
    answer TEXT DEFAULT '',
    difficulty TEXT DEFAULT 'Oson',
    category TEXT DEFAULT 'Umumiy',
    points INTEGER NOT NULL DEFAULT 10,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    olympiad_id INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    percent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || '';
if (!adminEmail || !adminPassword) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!existingAdmin) {
  db.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)')
    .run('Admin', adminEmail, bcrypt.hashSync(adminPassword, 12), 'admin');
}

const publicUser = u => ({ id: u.id, name: u.name, phone: u.phone, email: u.email, role: u.role, createdAt: u.created_at });
const tokenFor = u => jwt.sign({ id: u.id, role: u.role, email: u.email }, jwtSecret, { expiresIn: '7d' });
function auth(req, res, next) {
  const value = req.headers.authorization || '';
  if (!value.startsWith('Bearer ')) return res.status(401).json({ error: 'Token kerak' });
  try { req.auth = jwt.verify(value.slice(7), jwtSecret); next(); }
  catch { res.status(401).json({ error: 'Token yaroqsiz yoki muddati tugagan' }); }
}
function admin(req, res, next) { if (req.auth?.role !== 'admin') return res.status(403).json({ error: 'Admin huquqi kerak' }); next(); }
function clean(value, max = 5000) { return String(value ?? '').trim().slice(0, max); }

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'EduCore AI API' }));
app.post('/api/auth/register', (req, res) => {
  const name = clean(req.body.name, 120), phone = clean(req.body.phone, 40), email = clean(req.body.email, 160).toLowerCase(), password = String(req.body.password || '');
  if (!name || !email || password.length < 6) return res.status(400).json({ error: 'Ism, email va kamida 6 belgili parol kerak' });
  if (email === adminEmail) return res.status(409).json({ error: 'Admin emailidan foydalanib bo‘lmaydi' });
  try {
    const result = db.prepare('INSERT INTO users (name,phone,email,password_hash) VALUES (?,?,?,?)').run(name, phone, email, bcrypt.hashSync(password, 12));
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ user: publicUser(user), token: tokenFor(user) });
  } catch { res.status(409).json({ error: 'Email allaqachon mavjud' }); }
});
app.post('/api/auth/login', (req, res) => {
  const email = clean(req.body.email, 160).toLowerCase(), password = String(req.body.password || '');
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Email yoki parol noto‘g‘ri' });
  res.json({ user: publicUser(user), token: tokenFor(user) });
});
app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth.id)) }));

app.get('/api/courses', (req, res) => res.json([
  { slug: 'python', title: 'Python dasturlash' }, { slug: 'web', title: 'Web dasturlash' },
  { slug: 'english', title: 'Ingliz tili' }, { slug: 'php', title: 'PHP Backend' },
  { slug: 'ai', title: 'AI asoslari' }, { slug: 'prompt', title: 'Prompt Engineering' }
]));
app.get('/api/olympiads', (req, res) => {
  const rows = db.prepare('SELECT * FROM olympiads WHERE published = 1 ORDER BY starts_at DESC').all();
  res.json(rows.map(o => ({ ...o, published: Boolean(o.published), questions: db.prepare('SELECT id,text,points FROM questions WHERE olympiad_id = ?').all(o.id) })));
});
app.post('/api/olympiads', auth, admin, (req, res) => {
  const name = clean(req.body.name, 200), description = clean(req.body.description), startsAt = clean(req.body.startsAt, 80), endsAt = clean(req.body.endsAt, 80), duration = Math.max(1, Number(req.body.durationMinutes || 60));
  if (!name || !startsAt || !endsAt) return res.status(400).json({ error: 'Nomi va vaqtlar kerak' });
  const r = db.prepare('INSERT INTO olympiads (name,description,starts_at,ends_at,duration_minutes) VALUES (?,?,?,?,?)').run(name, description, startsAt, endsAt, duration);
  res.status(201).json(db.prepare('SELECT * FROM olympiads WHERE id = ?').get(r.lastInsertRowid));
});
app.post('/api/olympiads/:id/questions', auth, admin, (req, res) => {
  const text = clean(req.body.text), answer = clean(req.body.answer), points = Math.max(1, Number(req.body.points || 10));
  if (!text || !answer) return res.status(400).json({ error: 'Savol va javob kerak' });
  const r = db.prepare('INSERT INTO questions (olympiad_id,text,answer,points) VALUES (?,?,?,?)').run(Number(req.params.id), text, answer, points);
  res.status(201).json(db.prepare('SELECT id,text,points FROM questions WHERE id = ?').get(r.lastInsertRowid));
});
app.patch('/api/olympiads/:id/publish', auth, admin, (req, res) => { db.prepare('UPDATE olympiads SET published = ? WHERE id = ?').run(req.body.published ? 1 : 0, Number(req.params.id)); res.json({ ok: true }); });
app.get('/api/problems', (req, res) => res.json(db.prepare('SELECT id,name,statement,difficulty,category,points,created_at FROM problems ORDER BY id DESC').all()));
app.post('/api/problems', auth, admin, (req, res) => {
  const name = clean(req.body.name, 200), statement = clean(req.body.statement, 10000), answer = clean(req.body.answer), difficulty = clean(req.body.difficulty, 40), category = clean(req.body.category, 80), points = Math.max(1, Number(req.body.points || 10));
  if (!name || !statement) return res.status(400).json({ error: 'Masala nomi va sharti kerak' });
  const r = db.prepare('INSERT INTO problems (name,statement,answer,difficulty,category,points) VALUES (?,?,?,?,?,?)').run(name, statement, answer, difficulty || 'Oson', category || 'Umumiy', points);
  res.status(201).json(db.prepare('SELECT * FROM problems WHERE id = ?').get(r.lastInsertRowid));
});
app.get('/api/leaderboard', (req, res) => res.json(db.prepare(`SELECT u.id,u.name,COALESCE(SUM(s.score),0) score,COALESCE(ROUND(AVG(s.percent)),0) percent,COUNT(s.id) attempts FROM users u LEFT JOIN submissions s ON s.user_id=u.id GROUP BY u.id ORDER BY score DESC, percent DESC`).all()));
app.get('/api/chats/:withUserId', auth, (req, res) => res.json(db.prepare('SELECT id,sender_id,receiver_id,text,created_at FROM messages WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?) ORDER BY id').all(req.auth.id, Number(req.params.withUserId), Number(req.params.withUserId), req.auth.id)));
app.post('/api/chats/:withUserId/messages', auth, (req, res) => { const text = clean(req.body.text, 4000); if (!text) return res.status(400).json({ error: 'Xabar bo‘sh' }); const r=db.prepare('INSERT INTO messages (sender_id,receiver_id,text) VALUES (?,?,?)').run(req.auth.id, Number(req.params.withUserId), text); res.status(201).json(db.prepare('SELECT id,sender_id,receiver_id,text,created_at FROM messages WHERE id=?').get(r.lastInsertRowid)); });
app.use((req, res) => res.status(404).json({ error: 'Endpoint topilmadi' }));
app.listen(port, () => console.log(`EduCore API listening on :${port}`));
