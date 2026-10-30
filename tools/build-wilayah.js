// Membuat public/data/* dari cahyadsn/wilayah_boundaries (MIT). Jalankan: node build-wilayah.js <folder wilayah_boundaries/db>
const fs = require('fs'), path = require('path');
const DB = process.argv[2], OUT = process.argv[3];
const ROW = /^\s*\('([\d.]+)','((?:[^']|'')*)',\s*(-?[\d.eE+-]+|NULL)\s*,\s*(-?[\d.eE+-]+|NULL)\s*,/;
const r4 = v => v === 'NULL' ? null : Math.round(parseFloat(v) * 1e4) / 1e4;
function rows(dir) {
  const out = [];
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => e.isDirectory() ? walk(path.join(d, e.name)) :
    fs.readFileSync(path.join(d, e.name), 'utf8').split('\n').forEach(l => {
      const m = ROW.exec(l); if (m) out.push({ k: m[1], n: m[2].replace(/''/g, "'"), lat: r4(m[3]), lng: r4(m[4]) });
    }));
  walk(path.join(DB, dir)); return out;
}
const prov = rows('prov'), kab = rows('kab'), kec = rows('kec'), kel = rows('kel');
console.log({ prov: prov.length, kab: kab.length, kec: kec.length, kel: kel.length });
const WITA = ['51','52','53','63','64','65','71','72','73','74','75','76'], WIT = ['81','82','91','92','93','94','95','96','97'];
const tz = p => WIT.includes(p) ? 'Asia/Jayapura' : WITA.includes(p) ? 'Asia/Makassar' : 'Asia/Jakarta';
const by = (arr, f) => arr.reduce((m, x) => ((m[f(x)] ||= []).push(x), m), {});
const kecByKab = by(kec, x => x.k.slice(0, 5)), kelByKec = by(kel, x => x.k.slice(0, 8)), kabByProv = by(kab, x => x.k.slice(0, 2));
const avg = (a, f) => { const v = a.map(f).filter(x => x != null); return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length * 1e4) / 1e4 : null; };
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, 'kab'), { recursive: true });
let miss = 0;
const index = prov.sort((a, b) => a.k.localeCompare(b.k)).map(p => ({
  k: p.k, n: p.n, tz: tz(p.k),
  kab: (kabByProv[p.k] || []).sort((a, b) => a.k.localeCompare(b.k)).map(kb => {
    const ks = kecByKab[kb.k] || [];
    const lat = kb.lat ?? avg(ks, x => x.lat), lng = kb.lng ?? avg(ks, x => x.lng);
    const kecs = ks.sort((a, b) => a.k.localeCompare(b.k)).map(kc => {
      const ds = (kelByKec[kc.k] || []).sort((a, b) => a.k.localeCompare(b.k));
      const klat = kc.lat ?? avg(ds, x => x.lat) ?? lat, klng = kc.lng ?? avg(ds, x => x.lng) ?? lng;
      return [kc.k, kc.n, klat, klng, ds.map(d => { if (d.lat == null) miss++; return [d.k, d.n, d.lat ?? klat, d.lng ?? klng]; })];
    });
    fs.writeFileSync(path.join(OUT, 'kab', kb.k + '.json'), JSON.stringify(kecs));
    return [kb.k, kb.n, lat, lng];
  })
}));
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
console.log('desa tanpa koordinat (pakai kecamatan):', miss);
