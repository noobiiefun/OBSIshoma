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
