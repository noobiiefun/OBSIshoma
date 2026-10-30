// OBSIshoma server — tanpa dependensi npm. Jalankan: node server.js
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3210, HOST = process.env.HOST || '127.0.0.1';
const PUB = path.join(__dirname, 'public'), DATA = path.join(__dirname, 'data');
const MEDIA = path.join(DATA, 'media'), CFG = path.join(DATA, 'config.json');
fs.mkdirSync(MEDIA, { recursive: true });

const EV = ['imsak', 'fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const LBL = { imsak: 'Imsak', fajr: 'Subuh', sunrise: 'Terbit', dhuhr: 'Dzuhur', asr: 'Ashar', maghrib: 'Maghrib', isha: 'Isya' };
const EMO = { imsak: '🌙', fajr: '🌅', sunrise: '☀️', dhuhr: '🕛', asr: '🌤️', maghrib: '🌇', isha: '🌃' };

function defaults() {
  const notif = {};
  for (const k of EV) notif[k] = {
    enabled: k !== 'sunrise',
    title: k === 'imsak' ? 'Waktu Imsak' : k === 'sunrise' ? 'Matahari Terbit' : 'Waktu ' + LBL[k] + ' telah tiba',
    message: k === 'imsak' ? 'Waktunya berhenti makan dan minum.' : 'Untuk wilayah {kota} dan sekitarnya, pukul {waktu}.',
    emoji: EMO[k], image: '', sound: '', duration: 15,
    ishoma: ['dhuhr', 'asr', 'maghrib', 'isha'].includes(k) ? 10 : 0
  };
  return {
    city: 'Jakarta', lat: -6.2088, lng: 106.8456, tz: 'Asia/Jakarta',
    fajrAngle: 20, ishaAngle: 18, ihtiyath: 2, imsakMinutes: 10, madhab: 'shafi',
    widget: { show: true, position: 'bottom', scale: 1, accent: '#d6b25e', bg: '#0c1a14', showList: true },
    notif
  };
}
function load() {
  let s = {}; try { s = JSON.parse(fs.readFileSync(CFG, 'utf8')); } catch {}
  const d = defaults(), c = { ...d, ...s, widget: { ...d.widget, ...(s.widget || {}) }, notif: {} };
  for (const k of EV) c.notif[k] = { ...d.notif[k], ...((s.notif || {})[k] || {}) };
  return c;
}

const clients = new Set();
const broadcast = o => clients.forEach(r => r.write('data: ' + JSON.stringify(o) + '\n\n'));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.txt': 'text/plain' };
const OK_UPLOAD = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp3', '.wav', '.ogg', '.m4a'];
const json = (res, o, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
const readBody = (req, max) => new Promise((ok, no) => {
  const b = []; let n = 0;
  req.on('data', c => { n += c.length; if (n > max) { no(new Error('too large')); req.destroy(); } else b.push(c); });
  req.on('end', () => ok(Buffer.concat(b))); req.on('error', no);
});
function serve(res, base, rel) {
  const f = path.join(base, path.normalize(decodeURIComponent(rel)).replace(/^(\.\.[\/\\])+/, ''));
  if (!f.startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(f).pipe(res);
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'), p = u.pathname;
  try {
    if (p === '/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write('retry: 2000\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
    }
    if (p === '/api/config' && req.method === 'GET') return json(res, load());
    if (p === '/api/config' && req.method === 'POST') {
      const c = JSON.parse((await readBody(req, 1e6)).toString());
      fs.writeFileSync(CFG, JSON.stringify(c, null, 2)); broadcast({ type: 'config' }); return json(res, { ok: true });
    }
    if (p === '/api/test' && req.method === 'POST') {
      const b = JSON.parse((await readBody(req, 1e5)).toString() || '{}');
      if (EV.includes(b.key)) broadcast({ type: 'test', key: b.key }); return json(res, { ok: true });
    }
    if (p === '/api/media' && req.method === 'GET')
      return json(res, fs.readdirSync(MEDIA).filter(f => OK_UPLOAD.includes(path.extname(f).toLowerCase())));
    if (p === '/api/media' && req.method === 'POST') {
      const name = path.basename(u.searchParams.get('name') || '').replace(/[^\w.\- ]/g, '_');
      if (!OK_UPLOAD.includes(path.extname(name).toLowerCase())) return json(res, { error: 'Format tidak didukung' }, 400);
      fs.writeFileSync(path.join(MEDIA, name), await readBody(req, 25e6)); return json(res, { name });
    }
    if (p === '/api/media' && req.method === 'DELETE') {
      const f = path.join(MEDIA, path.basename(u.searchParams.get('name') || ''));
      if (fs.existsSync(f)) fs.unlinkSync(f); return json(res, { ok: true });
    }
    if (p.startsWith('/media/')) return serve(res, MEDIA, p.slice(7));
    if (p === '/') { res.writeHead(302, { Location: '/dashboard.html' }); return res.end(); }
    return serve(res, PUB, p.slice(1));
  } catch (e) { json(res, { error: String(e.message || e) }, 500); }
}).listen(PORT, HOST, () => {
  console.log('\n  OBSIshoma berjalan\n');
  console.log('  Dashboard : http://localhost:' + PORT + '/dashboard.html');
  console.log('  Overlay   : http://localhost:' + PORT + '/overlay.html   <- URL untuk OBS Browser Source\n');
});
