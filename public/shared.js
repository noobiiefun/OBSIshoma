// Dipakai dashboard & overlay. Semua perhitungan dilakukan di browser (offline) dengan adhan-js.
const EVENTS = [
  { key: 'imsak', label: 'Imsak', emoji: '🌙', count: true },
  { key: 'fajr', label: 'Subuh', emoji: '🌅', count: true },
  { key: 'sunrise', label: 'Terbit', emoji: '☀️', count: false },
  { key: 'dhuhr', label: 'Dzuhur', emoji: '🕛', count: true },
  { key: 'asr', label: 'Ashar', emoji: '🌤️', count: true },
  { key: 'maghrib', label: 'Maghrib', emoji: '🌇', count: true },
  { key: 'isha', label: 'Isya', emoji: '🌃', count: true }
];
const CITIES = [
  ['Jakarta', -6.2088, 106.8456, 'Asia/Jakarta'], ['Bandung', -6.9175, 107.6191, 'Asia/Jakarta'],
  ['Bekasi', -6.2383, 106.9756, 'Asia/Jakarta'], ['Tangerang', -6.1783, 106.6319, 'Asia/Jakarta'],
  ['Bogor', -6.5971, 106.806, 'Asia/Jakarta'], ['Semarang', -6.9667, 110.4167, 'Asia/Jakarta'],
  ['Yogyakarta', -7.7956, 110.3695, 'Asia/Jakarta'], ['Surabaya', -7.2575, 112.7521, 'Asia/Jakarta'],
  ['Malang', -7.9666, 112.6326, 'Asia/Jakarta'], ['Medan', 3.5952, 98.6722, 'Asia/Jakarta'],
  ['Banda Aceh', 5.5483, 95.3238, 'Asia/Jakarta'], ['Padang', -0.9471, 100.4172, 'Asia/Jakarta'],
  ['Pekanbaru', 0.5071, 101.4478, 'Asia/Jakarta'], ['Palembang', -2.9761, 104.7754, 'Asia/Jakarta'],
  ['Bandar Lampung', -5.45, 105.2667, 'Asia/Jakarta'], ['Pontianak', -0.0263, 109.3425, 'Asia/Jakarta'],
  ['Banjarmasin', -3.3194, 114.5908, 'Asia/Makassar'], ['Balikpapan', -1.2379, 116.8529, 'Asia/Makassar'],
  ['Samarinda', -0.5022, 117.1536, 'Asia/Makassar'], ['Denpasar', -8.6705, 115.2126, 'Asia/Makassar'],
  ['Mataram', -8.5833, 116.1167, 'Asia/Makassar'], ['Makassar', -5.1477, 119.4327, 'Asia/Makassar'],
  ['Manado', 1.4748, 124.8421, 'Asia/Makassar'], ['Kendari', -3.9985, 122.5129, 'Asia/Makassar'],
  ['Palu', -0.9, 119.8707, 'Asia/Makassar'], ['Ambon', -3.6954, 128.1814, 'Asia/Jayapura'],
  ['Jayapura', -2.5337, 140.7181, 'Asia/Jayapura']
].map(c => ({ n: c[0], lat: c[1], lng: c[2], tz: c[3] }));

const pad = n => String(n).padStart(2, '0');
function ymd(date, tz) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(date).split('-').map(Number);
}
function fmt(date, tz, sec) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: sec ? '2-digit' : undefined, hour12: false }).format(date);
}
function fmtDate(date, tz) {
  const g = new Intl.DateTimeFormat('id-ID', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  let h = ''; try { h = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', { timeZone: tz, day: 'numeric', month: 'long', year: 'numeric' }).format(date); } catch {}
  return { masehi: g, hijri: h };
}
function dayKey(cfg, date) { return ymd(date, cfg.tz).join('-'); }
function computeDay(cfg, date) {
  const [y, m, d] = ymd(date, cfg.tz);
  const p = adhan.CalculationMethod.Other();
  p.fajrAngle = +cfg.fajrAngle; p.ishaAngle = +cfg.ishaAngle;
  p.madhab = cfg.madhab === 'hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  const ih = +cfg.ihtiyath;
  Object.assign(p.adjustments, { fajr: ih, sunrise: -ih, dhuhr: ih, asr: ih, maghrib: ih, isha: ih });
  if (adhan.Rounding) p.rounding = adhan.Rounding.Up;
  const t = new adhan.PrayerTimes(new adhan.Coordinates(+cfg.lat, +cfg.lng), new Date(y, m - 1, d), p);
  const base = { fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha };
  base.imsak = new Date(t.fajr.getTime() - cfg.imsakMinutes * 60000);
  return EVENTS.map(e => ({ ...e, time: base[e.key] }));
}
function nextEvent(cfg, now) {
  const list = computeDay(cfg, now).concat(computeDay(cfg, new Date(now.getTime() + 864e5)));
  return list.find(e => e.count && e.time > now);
}
function countdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60);
}
