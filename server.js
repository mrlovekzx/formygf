const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB = path.join(DATA_DIR, 'tickets.json');

if (!process.env.ADMIN_PASSWORD) console.warn('⚠️  ยังไม่ได้ตั้ง ADMIN_PASSWORD ตอนนี้ใช้รหัสเริ่มต้น admin1234 ควรเปลี่ยนก่อนใช้งานจริง');

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB)) fs.copyFileSync(path.join(__dirname, 'data', 'tickets.json'), DB);

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const read = () => { try { return JSON.parse(fs.readFileSync(DB, 'utf8')); } catch { return []; } };
const write = (d) => { const tmp = DB + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(d, null, 2)); fs.renameSync(tmp, DB); };

const sha = s => crypto.createHash('sha256').update(String(s)).digest();
const fails = new Map(); // ip -> {n, until}
function admin(req, res, next) {
  const ip = req.ip, f = fails.get(ip);
  if (f && f.until > Date.now()) return res.status(429).json({ error: 'ลองผิดหลายครั้งเกินไป รอสักครู่แล้วลองใหม่' });
  const ok = crypto.timingSafeEqual(sha(req.get('x-admin-password') || ''), sha(ADMIN_PASSWORD));
  if (!ok) {
    const n = (f ? f.n : 0) + 1;
    fails.set(ip, { n, until: n >= 5 ? Date.now() + 60000 : 0 });
    return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
  }
  fails.delete(ip); next();
}

function clean(b) {
  return {
    title: String(b.title || '').trim().slice(0, 80),
    description: String(b.description || '').trim().slice(0, 300),
    emoji: Array.from(String(b.emoji || '🎟️')).slice(0, 2).join('') || '🎟️',
    expiresAt: /^\d{4}-\d{2}-\d{2}$/.test(b.expiresAt || '') ? b.expiresAt : null
  };
}
const expired = t => t.expiresAt && new Date(t.expiresAt).getTime() + 86400000 <= Date.now();

// ---------- ฝั่งแฟน ----------
app.get('/api/tickets', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(read().filter(t => !t.usedAt && !expired(t))
    .map(({ id, title, description, emoji, expiresAt }) => ({ id, title, description, emoji, expiresAt })));
});

app.post('/api/tickets/:id/use', (req, res) => {
  const data = read(), t = data.find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'ไม่พบตั๋ว' });
  if (t.usedAt || expired(t)) return res.status(409).json({ error: 'ตั๋วนี้ใช้ไม่ได้แล้ว' });
  t.usedAt = new Date().toISOString();
  write(data); res.json({ ok: true });
});

// ---------- หลังบ้าน ----------
app.get('/api/admin/tickets', admin, (req, res) => res.json(read()));

app.post('/api/admin/tickets', admin, (req, res) => {
  const c = clean(req.body || {});
  if (!c.title) return res.status(400).json({ error: 'ใส่ชื่อตั๋วก่อน' });
  const t = { id: crypto.randomUUID(), ...c, createdAt: new Date().toISOString(), usedAt: null };
  const data = read(); data.unshift(t); write(data); res.json(t);
});

app.put('/api/admin/tickets/:id', admin, (req, res) => {
  const data = read(), t = data.find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'ไม่พบตั๋ว' });
  const c = clean(req.body || {});
  if (!c.title) return res.status(400).json({ error: 'ใส่ชื่อตั๋วก่อน' });
  Object.assign(t, c); write(data); res.json(t);
});

app.post('/api/admin/tickets/:id/reset', admin, (req, res) => {
  const data = read(), t = data.find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'ไม่พบตั๋ว' });
  t.usedAt = null; write(data); res.json(t);
});

app.delete('/api/admin/tickets/:id', admin, (req, res) => {
  write(read().filter(x => x.id !== req.params.id)); res.json({ ok: true });
});

app.listen(PORT, () => console.log(`🎟️  เปิดแล้วที่ http://localhost:${PORT}\n   หลังบ้าน: http://localhost:${PORT}/admin.html`));
