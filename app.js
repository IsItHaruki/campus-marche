'use strict';
/* Campus マルシェ — campus marketplace prototype.
   Everything runs in the browser and is saved in localStorage on this device.
   No server, no real email, no real ID check yet. Edit CONFIG to change the university. */

// ================= CONFIG (edit for your university) =================
const CONFIG = {
  appName: 'Campus マルシェ',
  // Add more universities here later — the same system copies to each one.
  universities: [
    {
      id: 'u-hyogo', name: 'University of Hyogo', nameJa: '兵庫県立大学',
      emailEnding: 'u-hyogo.ac.jp', // accepts subdomains too, e.g. xxx@stu.u-hyogo.ac.jp
      campuses: [
        { id: 'kobe-shoka', name: 'Kobe Commerce', nameJa: '神戸商科' },
        { id: 'himeji-kogaku', name: 'Himeji Engineering', nameJa: '姫路工学' },
        { id: 'himeji-kankyo', name: 'Himeji Environment & Human', nameJa: '姫路環境人間' },
        { id: 'harima-rigaku', name: 'Harima Science', nameJa: '播磨理学' },
        { id: 'akashi-kango', name: 'Akashi Nursing', nameJa: '明石看護' },
        { id: 'kobe-joho', name: 'Kobe Information Science', nameJa: '神戸情報科学' },
      ],
    },
  ],
  categories: [
    { id: 'textbooks', label: 'Textbooks' },
    { id: 'electronics', label: 'Electronics' },
    { id: 'furniture', label: 'Furniture' },
    { id: 'bedding', label: 'Bedding' },
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'bikes', label: 'Bikes' },
    { id: 'clothes', label: 'Clothes' },
    { id: 'other', label: 'Other' },
  ],
  conditions: ['Like new', 'Good', 'Used', 'Well used'],
  reportReasons: {
    listing: ['Not allowed on campus / prohibited item', 'Scam or suspicious', 'Misleading photo or description', 'Other'],
    user: ["Didn't show up / unreliable", 'Rude or harassing', 'Scam or suspicious', 'Not a student here', 'Other'],
  },
};
const TYPES = { sell: 'For sale', free: 'Free' };
const NOTIFY_KINDS = [
  { k: 'deals', label: 'Requests, offers and meetups', hint: 'When someone wants your item, sends an offer or agrees a meetup' },
  { k: 'campus', label: 'New items on my campus', hint: 'When another student posts something on your campus' },
  { k: 'saved', label: 'Saved search matches', hint: 'When a new item matches a search you saved' },
  { k: 'likes', label: 'Likes on my items', hint: 'When someone likes your listing' },
  { k: 'price', label: 'Price drops', hint: 'When an item you liked or saved to favorites gets cheaper' },
  { k: 'favorites', label: 'Favorite sellers', hint: 'When a seller in your favorites posts something new' },
];
const KEY = 'senpaiswap_v7';

// ================= icons (simple line icons) =================
const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  home: svg('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  bell: svg('<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'),
  camera: svg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/>'),
  chat: svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  back: svg('<path d="m15 18-6-6 6-6"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>'),
  calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  heart: svg('<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>'),
  tag: svg('<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  flag: svg('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>'),
  shield: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  chart: svg('<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'),
  swap: svg('<path d="M16 3h5v5"/><path d="M21 3l-7 7"/><path d="M8 21H3v-5"/><path d="M3 21l7-7"/>'),
  logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>'),
  thumbUp: svg('<path d="M7 10v12"/><path d="M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.5 22H7V10l4.3-8a2.3 2.3 0 0 1 3.7 3.9z"/>'),
  thumbDown: svg('<path d="M17 14V2"/><path d="M9 18.1 10 14H4.2a2 2 0 0 1-2-2.3l1.4-8A2 2 0 0 1 5.5 2H17v12l-4.3 8a2.3 2.3 0 0 1-3.7-3.9z"/>'),
  eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  star: svg('<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>'),
  globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>'),
  bookmark: svg('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
  gift: svg('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>'),
  yen: svg('<path d="M12 10v11"/><path d="m6 3 6 7 6-7"/><path d="M7 14h10M7 10.5h10"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  cap: svg('<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/><path d="M22 10v5"/>'),
  hourglass: svg('<path d="M5 22h14M5 2h14"/><path d="M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22"/><path d="M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4A2 2 0 0 0 17 6.2V2"/>'),
  idcard: svg('<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M14 10h4M14 14h4M5 16a3.5 3.5 0 0 1 6 0"/>'),
  language: svg('<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>'),
  // category icons (same stroke style as everything else)
  cat_textbooks: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h7"/>'),
  cat_electronics: svg('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/><path d="M9 20l1-4h4l1 4"/>'),
  cat_furniture: svg('<path d="M7 3h10v9H7z"/><path d="M5 12h14v3H5z"/><path d="M6 15v6M18 15v6"/>'),
  cat_bedding: svg('<path d="M2 19V6"/><path d="M2 13h20v6"/><path d="M22 19v-6"/><path d="M6 13v-2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><path d="M2 17h20"/>'),
  cat_kitchen: svg('<path d="M3 11h18"/><path d="M19 11v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-7"/><path d="M9 7V5M12 7V4M15 7V5"/>'),
  cat_bikes: svg('<circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M5.5 17 9 9h6l3.5 8"/><path d="M12 17 9 9M15 9l-1-3h2.5"/>'),
  cat_clothes: svg('<path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2z"/>'),
  cat_other: svg('<path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'),
};
// Categories use the line icons above instead of emoji
CONFIG.categories.forEach((c) => { c.icon = `<span class="cat-ic">${ICON['cat_' + c.id] || ICON.cat_other}</span>`; });
// Favorites are private: { items: [listingIds], sellers: [userIds] }
const favsOf = (u) => ({ items: [...(u?.favorites?.items || [])], sellers: [...(u?.favorites?.sellers || [])] });
const isFav = (u, kind, id) => favsOf(u)[kind === 'seller' ? 'sellers' : 'items'].includes(id);

// ================= helpers =================
const $app = document.getElementById('app');
const uid = (p) => p + Math.random().toString(36).slice(2, 9);
const now = () => Date.now();
const HOUR = 3600e3;
const DAY = 24 * HOUR;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const yen = (n) => '¥' + Number(n || 0).toLocaleString('ja-JP');
const cat = (id) => CONFIG.categories.find((c) => c.id === id) || CONFIG.categories[CONFIG.categories.length - 1];
const user = (id) => db.users.find((u) => u.id === id);
const me = () => { const u = user(db.currentUserId); return u && !u.deleted ? u : null; };
const listing = (id) => db.listings.find((l) => l.id === id);
const uni = (id) => CONFIG.universities.find((u) => u.id === id);
const campusOf = (u) => { const cs = uni(u?.uni)?.campuses || []; return cs.find((c) => c.id === u?.campus) || cs[0]; };
const campusLabel = (u) => { const c = campusOf(u); return c ? `${c.nameJa} (${c.name})` : ''; };
const firstName = (u) => (u?.name || '').split(' ')[0];
const initials = (name) => (name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const avatarColor = (id) => ['#020651', '#0050e1', '#9a7b2c', '#2d3a8c', '#3a6fe8', '#6b5a2a'][[...(id || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 6];
const isBlocked = (a, b) => !!a && !!b && ((a.blocked || []).includes(b.id) || (b.blocked || []).includes(a.id));
const settingsOf = (u) => ({ notify: { deals: true, campus: true, saved: true, likes: true, price: true, favorites: true, ...(u?.settings?.notify || {}) } });

// ---------- ratings open one day after the hand-off (nobody has to rate on the spot) ----------
// Tell the live chat server (livechat.js) about chat actions, if it's running
const live = (payloadOrFn, t) => { if (typeof Live === 'undefined') return; if (typeof payloadOrFn === 'function') payloadOrFn(Live); else Live.onSend(t, payloadOrFn); };
const RATE_DELAY = DAY;
const rateOpensAt = (t) => (t.handedAt || 0) + RATE_DELAY;
const canRateNow = (t) => t.outcome === 'handed' && now() >= rateOpensAt(t);
function hoursLeft(t) { return Math.max(1, Math.ceil((rateOpensAt(t) - now()) / HOUR)); }
// When I open the app and a rating has opened for me, add one notification (each student does this for themselves)
function checkRatingsOpen(u) {
  let added = false;
  db.threads.forEach((t) => {
    if (!(t.buyerId === u.id || t.sellerId === u.id) || !canRateNow(t)) return;
    if (db.reviews.some((r) => r.threadId === t.id && r.from === u.id)) return;
    if (db.notifications.some((n) => n.userId === u.id && n.icon === 'star' && n.link === '#/chat/' + t.id)) return;
    const other = user(t.buyerId === u.id ? t.sellerId : t.buyerId);
    const l = listing(t.listingId);
    db.notifications.push({ id: uid('n_'), userId: u.id, text: `You can now rate ${other?.name} for "${l?.title}"`, link: '#/chat/' + t.id, listingId: t.listingId, icon: 'star', kind: 'account', at: now(), read: false });
    added = true;
  });
  if (added) save();
}

// ---------- nicknames (students never show their real name) ----------
function randomNickname() {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  if (I18N.lang === 'ja') {
    return pick(['のんびり', 'はらぺこ', 'ねむい', 'げんきな', 'しずかな', 'きまぐれ', 'まじめな', 'ふわふわ', 'もぐもぐ', 'ほかほか'])
      + pick(['パンダ', 'ペンギン', 'カワウソ', 'たぬき', 'うさぎ', 'くま', 'ねこ', 'アザラシ', 'ハリネズミ', 'シマエナガ']);
  }
  return pick(['Sleepy', 'Hungry', 'Calm', 'Lucky', 'Quiet', 'Sunny', 'Brave', 'Fluffy', 'Cosy', 'Curious'])
    + pick(['Panda', 'Penguin', 'Otter', 'Tanuki', 'Rabbit', 'Bear', 'Cat', 'Seal', 'Hedgehog', 'Owl']) + Math.floor(10 + Math.random() * 90);
}
// A gentle check, not a guarantee: "Taro Yamada", "山田 太郎", or the name part of their email
function looksLikeRealName(nick, email) {
  const n = (nick || '').trim();
  if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(n)) return true;
  if (/^[\u4e00-\u9fff]{1,4}[ \u3000][\u4e00-\u9fff]{1,3}$/.test(n)) return true;
  const local = (email || '').split('@')[0].toLowerCase().replace(/[^a-z]/g, '');
  const flat = n.toLowerCase().replace(/[^a-z]/g, '');
  return local.length >= 4 && flat.length >= 4 && (local.includes(flat) || flat.includes(local));
}
const NICK_HINT = "Don't use your real name. Other students only see your nickname.";

function ago(t) {
  const ja = I18N.lang === 'ja';
  const m = Math.round((now() - t) / 60000);
  if (m < 1) return ja ? 'たった今' : 'just now';
  if (m < 60) return ja ? m + '分前' : m + 'm ago';
  const h = Math.round(m / 60);
  if (h < 24) return ja ? h + '時間前' : h + 'h ago';
  return ja ? Math.round(h / 24) + '日前' : Math.round(h / 24) + 'd ago';
}
function fmtWhen(str) {
  const d = new Date(str);
  if (isNaN(d)) return str;
  if (I18N.lang === 'ja') return d.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function fmtDuration(ms) {
  if (ms == null) return '–';
  const h = ms / HOUR;
  if (h < 1) return Math.max(1, Math.round(ms / 60000)) + ' min';
  if (h < 48) return h.toFixed(1) + ' h';
  return (h / 24).toFixed(1) + ' days';
}
function priceLabel(l) { return l?.type === 'free' ? 'Free' : yen(l?.price); }
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}
function photoHTML(l, cls) {
  if (l?.photo) return `<img class="${cls}" src="${esc(l.photo)}" alt="">`;
  return `<div class="${cls} ph">${cat(l?.category).icon}</div>`;
}
function avatar(u, size = '') {
  if (u?.photo) return `<img class="avatar ${size}" src="${esc(u.photo)}" alt="">`;
  return `<div class="avatar ${size}" style="background:${avatarColor(u?.id)}">${esc(initials(u?.name))}</div>`;
}
function verifiedTag(u) { return u?.verified ? `<span class="verified">${ICON.check} Verified student</span>` : '<span class="badge warn">Not verified</span>'; }
function handoffCount(userId) {
  const u = user(userId);
  return (u?.seedHandoffs || 0) + db.threads.filter((t) => t.outcome === 'handed' && (t.sellerId === userId || t.buyerId === userId)).length;
}
// ---------- 5-star ratings ----------
// Older saved data used 'good' / 'bad'; treat those as 5 and 2 stars.
const starsOf = (r) => { const n = Number(r?.rating); if (n >= 1 && n <= 5) return Math.round(n); return r?.rating === 'bad' ? 2 : r?.rating === 'good' ? 5 : 0; };
function ratingStats(userId) {
  const rs = db.reviews.filter((r) => r.to === userId && starsOf(r));
  const count = rs.length;
  const avg = count ? rs.reduce((s, r) => s + starsOf(r), 0) / count : 0;
  const dist = [0, 0, 0, 0, 0, 0]; // dist[1..5]
  rs.forEach((r) => { dist[starsOf(r)]++; });
  return { avg, count, dist };
}
// "★★★★☆" — filled stars in gold, empty in grey
function starsHTML(n, cls = '') {
  const v = Math.round(n);
  return `<span class="stars ${cls}" aria-label="${v} out of 5 stars">${[1, 2, 3, 4, 5].map((i) => `<span class="${i <= v ? 'on' : ''}">★</span>`).join('')}</span>`;
}
// "★ 4.8 (12)" — used on the seller card, Me card and profile
function ratingHTML(userId) {
  const { avg, count } = ratingStats(userId);
  if (!count) return '<span class="rating none">No ratings yet</span>';
  return `<span class="rating"><span class="star">★</span><b>${avg.toFixed(1)}</b><span class="muted">(${count})</span></span>`;
}
function statusBadge(l) {
  return l?.status === 'reserved' ? '<span class="badge grey">Reserved</span>' : l?.status === 'done' ? '<span class="badge grey">Gone</span>' : '';
}

// ================= data =================
let db = load();
function emptyDb() { return { version: 7, currentUserId: null, users: [], listings: [], threads: [], events: [], notifications: [], reviews: [], reports: [] }; }
function load() {
  if (Backend.on) return emptyDb(); // real data is loaded after login
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && d.version === 7) return stripPersonal(d);
  } catch (e) { /* fall through to seed */ }
  return seed();
}
// We don't keep faculty, year, hometown or languages: students only show a nickname and campus
function stripPersonal(d) {
  const SEED_BIOS = { u_mai: '部屋を片付けています。4限のあとなら会えます。', u_leo: 'Everything I post is free or cheap. I just want it to go to a good home!' };
  (d.users || []).forEach((u) => { delete u.faculty; delete u.languages; if (SEED_BIOS[u.id]) u.bio = SEED_BIOS[u.id]; });
  return d;
}
function save() {
  if (Backend.on) { Backend.queueSync(); return; }
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { toast('Storage full: try a smaller photo or reset demo data'); }
}
function logEvent(type, data = {}) { db.events.push({ id: uid('e_'), type, at: now(), userId: db.currentUserId, ...data }); }

// Notifications respect each student's settings. kind "account" is always sent (welcome, verified).
function notify(userId, text, { link = '', listingId = null, icon = 'bell', kind = 'deals' } = {}) {
  const target = user(userId);
  if (!target || target.deleted) return;
  if (userId === db.currentUserId && kind !== 'account') return;
  if (kind !== 'account' && settingsOf(target).notify[kind] === false) return;
  db.notifications.push({ id: uid('n_'), userId, text, link, listingId, icon, kind, at: now(), read: false });
}
const unreadCount = (u) => db.notifications.filter((n) => n.userId === u.id && !n.read).length;

function seed() {
  const t = now();
  const users = [
    { id: 'u_mai', name: 'まいまい', email: 'mai.t@demo.u-hyogo.ac.jp', uni: 'u-hyogo', campus: 'kobe-shoka', bio: '部屋を片付けています。4限のあとなら会えます。', verified: true, seed: true, seedHandoffs: 4, joined: t - 40 * DAY },
    { id: 'u_leo', name: 'Croissant', email: 'leo.m@demo.u-hyogo.ac.jp', uni: 'u-hyogo', campus: 'kobe-shoka', bio: 'Everything I post is free or cheap. I just want it to go to a good home!', verified: true, seed: true, seedHandoffs: 2, joined: t - 20 * DAY },
    { id: 'u_yuki', name: 'ゆきだるま', email: 'yuki.s@demo.u-hyogo.ac.jp', uni: 'u-hyogo', campus: 'himeji-kogaku', bio: '教科書とガジェットが中心です。値下げ交渉はご遠慮ください。', verified: true, seed: true, seedHandoffs: 1, joined: t - 60 * DAY },
  ];
  const L = (o) => ({ id: uid('l_'), status: 'available', condition: 'Good', times: '', desc: '', photo: null, seed: true, likes: [], viewers: [], ...o });
  const listings = [
    L({ sellerId: 'u_mai', title: '炊飯器 3合炊き', category: 'kitchen', type: 'sell', price: 1500, times: '平日17時以降', desc: '3月に引っ越すので出品します。問題なく使えます。計量カップとしゃもじ付きです。', bg: '#fbf3dc', createdAt: t - 3 * HOUR, likes: ['u_leo'] }),
    L({ sellerId: 'u_yuki', title: 'ミクロ経済学 教科書（1年必修）', category: 'textbooks', type: 'sell', price: 800, condition: 'Used', times: '昼休み 12:10〜13:00', desc: '1年の必修科目で使いました。1〜4章に蛍光ペンの線があります。', bg: '#e6eeff', createdAt: t - 7 * HOUR }),
    L({ sellerId: 'u_leo', title: 'Single futon set + cover', category: 'bedding', type: 'free', price: 0, times: 'Any evening this week', desc: 'Leaving Japan at the end of the semester. Washed. Just come and take it!', bg: '#eceafb', createdAt: t - 26 * HOUR, likes: ['u_mai'] }),
    L({ sellerId: 'u_leo', title: 'LED desk lamp', category: 'electronics', type: 'free', price: 0, condition: 'Like new', times: 'Tue / Thu lunch', desc: 'USB powered, 3 brightness levels.', bg: '#fdf6e3', createdAt: t - 30 * HOUR }),
    L({ sellerId: 'u_mai', title: 'ママチャリ（カゴ・鍵付き）', category: 'bikes', type: 'sell', price: 3000, condition: 'Well used', times: '土日', desc: '普通に乗れます。カゴと鍵付き。防犯登録の名義変更が必要なので、手続きも手伝います。', bg: '#e3f1ff', createdAt: t - 50 * HOUR, likes: ['u_leo', 'u_yuki'] }),
    L({ sellerId: 'u_yuki', title: 'JLPT N2 対策本 3冊セット', category: 'textbooks', type: 'sell', price: 600, times: '月・水の4限後', desc: '去年N2の勉強に使いました。鉛筆の書き込みが少しありますが、消せます。', bg: '#f6ecd6', createdAt: t - 72 * HOUR }),
    L({ sellerId: 'u_leo', title: 'Colour box shelf (3 tiers)', category: 'furniture', type: 'sell', price: 500, desc: 'From Nitori. Light, easy to carry.', bg: '#e8eefc', createdAt: t - 96 * HOUR }),
    L({ sellerId: 'u_mai', title: '冬用コート Mサイズ（ネイビー）', category: 'clothes', type: 'sell', price: 2000, condition: 'Like new', desc: '2回だけ着ました。とても暖かいです。', bg: '#efeaf8', createdAt: t - 120 * HOUR }),
  ];
  const R = (from, to, rating, comment, daysAgo) => ({ id: uid('r_'), from, to, rating, comment, at: t - daysAgo * DAY, seed: true });
  const reviews = [
    R('u_leo', 'u_mai', 5, 'Super kind and on time. The desk was exactly as described!', 12),
    R('u_yuki', 'u_mai', 5, '返信が早く、駅での受け渡しもスムーズでした。', 18),
    R('u_leo', 'u_mai', 4, 'Thanks again for the kettle! Was a few minutes late but no problem.', 25),
    R('u_yuki', 'u_mai', 5, 'スムーズで親切でした。', 33),
    R('u_mai', 'u_leo', 5, '電子レンジを無料でゆずってくれて、運ぶのも手伝ってくれました。Merci!', 9),
    R('u_mai', 'u_leo', 4, 'とても親切で、早めに来てくれました。', 15),
    R('u_mai', 'u_yuki', 4, '本がきれいで安かったです。', 40),
  ];
  // Demo favorites (private bookmarks of items and sellers)
  const byTitle = (t) => listings.find((l) => l.title.startsWith(t)).id;
  users.find((u) => u.id === 'u_mai').favorites = { items: [byTitle('LED desk lamp'), byTitle('Colour box shelf')], sellers: ['u_leo'] };
  users.find((u) => u.id === 'u_leo').favorites = { items: [byTitle('ママチャリ'), byTitle('冬用コート')], sellers: ['u_mai'] };
  users.find((u) => u.id === 'u_yuki').favorites = { items: [byTitle('炊飯器')], sellers: ['u_mai'] };
  // Give each demo student a few notifications so the tab isn't empty
  const notifications = [];
  users.forEach((u) => {
    listings.filter((l) => l.sellerId !== u.id && users.find((x) => x.id === l.sellerId).campus === u.campus).slice(0, 3)
      .forEach((l, i) => notifications.push({ id: uid('n_'), userId: u.id, text: `New on your campus: ${l.title} · ${priceLabel(l)}`, link: '#/item/' + l.id, listingId: l.id, icon: 'bell', kind: 'campus', at: l.createdAt, read: i > 0 }));
    notifications.push({ id: uid('n_'), userId: u.id, text: 'Your student card is verified. You can post and message now.', link: '#/me', icon: 'check', kind: 'account', at: u.joined, read: true });
  });
  return { version: 7, currentUserId: null, users, listings, threads: [], events: [], notifications, reviews, reports: [] };
}

// ================= state for screens =================
const ui = {
  filters: { q: '', type: 'all', cat: 'all', campus: 'mine', sort: 'new', hideGone: false, minPrice: null, maxPrice: null, today: false },
  priceOpen: false,
  searchOpen: false,  // search panel (categories, quick filters, recent searches) is showing
  searchDraft: '',    // what's typed in the search box while the panel is open
  onboard: { step: 'welcome', name: '', email: '', uni: CONFIG.universities[0].id, campus: CONFIG.universities[0].campuses[0].id, code: '', error: '' },
  draftPhoto: null,
  draftAvatar: undefined,
  editingId: null,
  cardPreview: null,
  panel: null, // 'meet' | 'offer' in chat
};

// ================= router =================
function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
window.addEventListener('hashchange', () => { ui.panel = null; render(); window.scrollTo(0, 0); });

function render() {
  const u = me();
  if (!u) { $app.innerHTML = viewOnboarding(); return; }
  const parts = (location.hash || '#/home').split('/');
  const route = parts[1] || 'home';
  const param = parts[2];
  if (route !== 'edit' && route !== 'post') ui.editingId = null;
  if (route !== 'profile') ui.draftAvatar = undefined;
  let html;
  switch (route) {
    case 'item': html = viewItem(u, param); break;
    case 'post': html = viewPost(u); break;
    case 'edit': html = viewPost(u, param); break;
    case 'notifs': html = viewNotifs(u); break;
    case 'inbox': html = viewInbox(u); break;
    case 'chat': html = viewChat(u, param); break;
    case 'me': html = viewMe(u); break;
    case 'user': html = viewUser(u, param); break;
    case 'profile': html = viewEditProfile(u); break;
    case 'settings': html = viewSettings(u); break;
    case 'likes': html = viewLikes(u); break;
    case 'favorites': html = viewFavorites(u, param); break;
    case 'report': html = viewReport(u, param, parts[3]); break;
    case 'safety': html = viewSafety(); break;
    case 'verify': html = viewVerify(u, param === 'first'); break;
    case 'stats': html = viewStats(); break;
    default: html = viewHome(u);
  }
  checkRatingsOpen(u);
  if (route === 'notifs') { // opening the tab marks everything read
    db.notifications.forEach((n) => { if (n.userId === u.id) n.read = true; });
    save();
  }
  $app.innerHTML = html + nav(route);
  if (route === 'chat') window.scrollTo(0, document.body.scrollHeight);
}

function nav(route) {
  const u = me();
  const msgs = db.threads.filter((t) => (t.buyerId === u.id || t.sellerId === u.id) && lastMsg(t)?.from && lastMsg(t).from !== u.id && !t.outcome).length;
  const notes = unreadCount(u);
  const dot = (n) => (n ? `<span class="dot">${n > 9 ? '9+' : n}</span>` : '');
  const on = (r) => (route === r || (r === 'inbox' && route === 'chat') || (r === 'me' && ['settings', 'profile', 'likes', 'favorites', 'stats'].includes(route))) ? 'on' : '';
  const tab = (r, icon, label, n = 0) => `<a href="#/${r}" class="${on(r)}"><span class="ic">${icon}${dot(n)}</span><span>${label}</span></a>`;
  return `<nav class="nav">
    ${tab('home', ICON.home, 'Home')}
    ${tab('notifs', ICON.bell, 'Notifications', notes)}
    <a href="#/post" class="post ${on('post')}"><span class="ic">${ICON.camera}</span><span>Post</span></a>
    ${tab('inbox', ICON.chat, 'Messages', msgs)}
    ${tab('me', ICON.user, 'Me')}
  </nav>`;
}

// One-tap language switch, shown in the top bar of every screen
const langBtn = () => `<button class="lang-chip" data-notr data-act="set-lang" data-v="${I18N.lang === 'ja' ? 'en' : 'ja'}" aria-label="${I18N.lang === 'ja' ? 'Switch to English' : '日本語に切り替え'}">${ICON.globe}<span>${I18N.lang === 'ja' ? 'EN' : '日本語'}</span></button>`;
const logoHTML = () => `<span class="logo" data-notr>Campus<span>マルシェ</span></span>`;
// Every screen has the logo in the top right; tapping it goes home.
function topbar(title, back) {
  return `<header class="topbar">${back ? `<button class="back" data-act="back" aria-label="Back">${ICON.back}</button>` : ''}<h1>${title}</h1>${langBtn()}<a class="logo-link" href="#/home" aria-label="Go to home">${logoHTML()}</a></header>`;
}
function topbarRaw(title, act) {
  return `<header class="topbar"><button class="back" data-act="${act}" aria-label="Back">${ICON.back}</button><h1>${esc(title)}</h1>${langBtn()}<button class="logo-link" data-act="ob-welcome" aria-label="Back to start">${logoHTML()}</button></header>`;
}

// ================= onboarding =================
function viewOnboarding() {
  const o = ui.onboard;
  if (o.step === 'welcome') {
    return `<div class="welcome">
      <div class="welcome-top">${logoHTML()}<button class="lang-toggle" data-notr data-act="set-lang" data-v="${I18N.lang === 'ja' ? 'en' : 'ja'}">${I18N.lang === 'ja' ? 'English' : '日本語'}</button></div>
      <div class="welcome-main stack">
        <div class="mark">${ICON.cap}</div>
        <h1>Campus swaps,<br><span>no shipping.</span></h1>
        <ul class="ticks">
          <li>${ICON.check} Buy, sell and give away</li>
          <li>${ICON.check} Only students from your university</li>
          <li>${ICON.check} Hand things over on campus</li>
        </ul>
      </div>
      <div class="stack">
        <button class="btn block" data-act="ob-start">Sign up with university email</button>
        ${Backend.on ? '<button class="btn ghost block" data-act="ob-login">I already have an account</button>'
          : '<button class="btn ghost block" data-act="ob-demo">Try a demo account</button><p class="muted small center">Demo mode · data stays on this device</p>'}
      </div>
    </div>`;
  }
  if (o.step === 'demo') {
    const seeds = db.users.filter((u) => !u.deleted && (u.seed || u.emailConfirmed));
    return `${topbarRaw('Pick a demo account', 'ob-welcome')}
    <div class="pad stack">
      ${seeds.map((u) => `<button class="card seller pick" data-act="login" data-id="${u.id}">
        ${avatar(u)}<div><b>${esc(u.name)}</b><div class="small muted">${esc(campusOf(u)?.nameJa)}</div></div></button>`).join('')}
    </div>`;
  }
  if (o.step === 'email') {
    return `${topbarRaw('Create account', 'ob-welcome')}
    <form class="pad" data-form="ob-email">
      <h2>Students only</h2>
      <p class="muted small">You need a university email so everyone here is a real student.</p>
      <label class="field"><span>Nickname</span>
        <div class="nick-row"><input name="name" required maxlength="24" value="${esc(o.name)}" placeholder="e.g. Sleepy Panda"><button type="button" class="btn sm light" data-act="nick-random">${ICON.swap} Suggest</button></div>
        <div class="hint">${NICK_HINT}</div></label>
      ${o.nickWarn ? `<div class="err">That looks like a real name. For your safety, please use a nickname. (Tap "Send code" again to keep it.)</div>` : ''}
      <label class="field"><span>University</span><select name="uni">
        ${CONFIG.universities.map((u) => `<option value="${u.id}" ${u.id === o.uni ? 'selected' : ''}>${esc(u.nameJa)} · ${esc(u.name)}</option>`).join('')}
      </select></label>
      <label class="field"><span>Your campus</span><select name="campus">
        ${uni(o.uni).campuses.map((c) => `<option value="${c.id}" ${c.id === o.campus ? 'selected' : ''}>${esc(c.nameJa)} · ${esc(c.name)}</option>`).join('')}
      </select><div class="hint">You'll see items from your campus first.</div></label>
      <label class="field"><span>University email</span><input name="email" type="email" required value="${esc(o.email)}" placeholder="you@${esc(uni(o.uni).emailEnding)}">
        <div class="hint">Must end in ${esc(uni(o.uni).emailEnding)}</div></label>
      ${o.error ? `<div class="err">${esc(o.error)}</div>` : ''}
      <button class="btn block" ${o.busy ? 'disabled' : ''}>${o.busy ? 'Sending…' : 'Send code'}</button>
    </form>`;
  }
  if (o.step === 'login') {
    return `${topbarRaw('Log in', 'ob-welcome')}
    <form class="pad" data-form="ob-login">
      <h2>Welcome back</h2>
      <p class="muted small">We'll email a code to your university address.</p>
      <label class="field"><span>University email</span><input name="email" type="email" required value="${esc(o.email)}" placeholder="you@${esc(uni(o.uni).emailEnding)}"></label>
      ${o.error ? `<div class="err">${esc(o.error)}</div>` : ''}
      <button class="btn block" ${o.busy ? 'disabled' : ''}>${o.busy ? 'Sending…' : 'Send code'}</button>
    </form>`;
  }
  if (o.step === 'code') {
    return `${topbarRaw('Check your email', o.mode === 'login' ? 'ob-login' : 'ob-back-email')}
    <form class="pad stack" data-form="ob-code">
      <p>We sent a code to <b>${esc(o.email)}</b>.</p>
      ${Backend.on ? '<p class="muted small">Check your university inbox. It can take a minute, and sometimes lands in spam.</p>'
        : `<div class="demo-note">Demo mode: no email is really sent. Your code is <b>${o.code}</b></div>`}
      <label class="field"><span>Code</span><input name="code" class="code-input" inputmode="numeric" autocomplete="one-time-code" maxlength="10" required autofocus></label>
      ${o.error ? `<div class="err">${esc(o.error)}</div>` : ''}
      <button class="btn block" ${o.busy ? 'disabled' : ''}>${o.busy ? 'Checking…' : 'Confirm'}</button>
      ${Backend.on ? '<button type="button" class="linkbtn small center" style="display:block;margin:8px auto" data-act="ob-resend">Send a new code</button>' : ''}
    </form>`;
  }
  return '';
}

// ================= verify student card =================
function viewVerify(u, first) {
  if (u.verified) {
    return `${topbar('Student card', true)}<div class="pad"><div class="card center stack">
      <div class="big-icon ok">${ICON.check}</div><h2>You're verified</h2>
      <p class="muted small">Other students see a "Verified student" tag on your profile.</p>
      <a class="btn block" href="#/home">Go to home</a></div></div>`;
  }
  if (Backend.on && u.verificationStatus === 'pending') {
    return `${topbar('Student card', true)}<div class="pad"><div class="card center stack">
      <div class="big-icon">${ICON.hourglass}</div><h2>We're checking your card</h2>
      <p class="muted small">This usually takes less than a day. You'll get a notification when you're verified. Until then you can browse and like items.</p>
      <a class="btn block" href="#/home">Browse items</a></div></div>`;
  }
  return `${topbar('Verify student card', !first)}
  <form class="pad stack" data-form="verify">
    ${u.verificationStatus === 'rejected' ? '<div class="demo-note">We could not read your last photo. Please try again with a clear, well-lit picture.</div>' : ''}
    <p class="small">Take a photo of the front of your student card (学生証). We check that your name and university match your account.</p>
    <label class="photo-pick">
      ${ui.cardPreview ? `<img src="${esc(ui.cardPreview)}" alt="">` : `<div><span class="pick-ic">${ICON.camera}</span>Tap to add a photo of your student card</div>`}
      <input type="file" accept="image/*" capture="environment" data-change="card">
    </label>
    <label class="small check-row">
      <input type="checkbox" name="ok" required> <span>My name and university are readable. I'm a current student at ${esc(uni(u.uni)?.nameJa)}.</span></label>
    <div class="demo-note">${Backend.on ? 'Only the app admin can see this photo. It is deleted after your card is checked.'
      : 'Demo mode: the card photo is not saved or sent anywhere, and approval is instant.'}</div>
    <button class="btn block" ${ui.cardPreview ? '' : 'disabled'}>Submit for check</button>
    ${first ? '<button type="button" class="linkbtn small center" style="display:block;margin:12px auto" data-act="skip-verify">Skip for now (you can browse, but not post or message)</button>' : ''}
  </form>`;
}

// ================= home =================
// ---------- price range (Amazon-style) ----------
const PRICE_BRACKETS = [
  { min: null, max: 500 }, { min: 500, max: 1000 }, { min: 1000, max: 3000 }, { min: 3000, max: 5000 }, { min: 5000, max: null },
];
const priceOf = (l) => (l.type === 'free' ? 0 : l.price);
const inRange = (p, min, max) => (min == null || p >= min) && (max == null || p <= max);
function rangeLabel(min, max) {
  if (min == null && max == null) return 'Any price';
  if (min == null || min === 0) return max === 0 ? 'Free' : `Up to ${yen(max)}`;
  if (max == null) return `${yen(min)} & above`;
  return `${yen(min)} – ${yen(max)}`;
}
// Slider top: the highest price on the app, rounded up, at least ¥5,000. Top of the slider means "no limit".
function priceTop() {
  const hi = Math.max(0, ...db.listings.filter((l) => l.status !== 'deleted').map(priceOf));
  return Math.max(5000, Math.ceil(hi / 1000) * 1000);
}
function priceSheetHTML(u) {
  const f = ui.filters;
  const base = visibleListings(u, { ignorePrice: true }).filter((l) => l.status !== 'done');
  const top = priceTop();
  const lo = f.minPrice ?? 0;
  const hi = f.maxPrice ?? top;
  const isOn = (b) => (b.min ?? null) === (f.minPrice ?? null) && (b.max ?? null) === (f.maxPrice ?? null);
  return `<div class="price-sheet" id="price-sheet">
    <div class="ps-head"><b>Price</b>${f.minPrice != null || f.maxPrice != null ? '<button class="linkbtn small" data-act="price-set" data-min="" data-max="">Clear</button>' : ''}</div>
    <div class="ps-brackets">
      <button class="ps-row ${f.minPrice == null && f.maxPrice == null ? 'on' : ''}" data-act="price-set" data-min="" data-max=""><span>Any price</span><span class="ps-count">${base.length}</span></button>
      ${PRICE_BRACKETS.map((b) => `<button class="ps-row ${isOn(b) ? 'on' : ''}" data-act="price-set" data-min="${b.min ?? ''}" data-max="${b.max ?? ''}">
        <span>${rangeLabel(b.min, b.max)}</span><span class="ps-count">${base.filter((l) => inRange(priceOf(l), b.min, b.max)).length}</span></button>`).join('')}
    </div>
    <div class="ps-slider">
      <div class="ps-values"><span id="ps-lo">${yen(lo)}</span><span id="ps-hi">${hi >= top ? yen(top) + '+' : yen(hi)}</span></div>
      <div class="range" data-top="${top}">
        <div class="track"></div><div class="fill" style="left:${(lo / top) * 100}%;right:${100 - (hi / top) * 100}%"></div>
        <input type="range" min="0" max="${top}" step="100" value="${lo}" data-range="lo" aria-label="Minimum price">
        <input type="range" min="0" max="${top}" step="100" value="${hi}" data-range="hi" aria-label="Maximum price">
      </div>
      <div class="ps-preview small muted" id="ps-preview">${base.filter((l) => inRange(priceOf(l), f.minPrice, f.maxPrice)).length} items in this range</div>
    </div>
    <form class="ps-custom" data-form="price">
      <label>¥<input name="min" type="number" min="0" step="10" inputmode="numeric" placeholder="Min" value="${f.minPrice ?? ''}"></label>
      <span class="muted">–</span>
      <label>¥<input name="max" type="number" min="0" step="10" inputmode="numeric" placeholder="Max" value="${f.maxPrice ?? ''}"></label>
      <button class="btn sm">Go</button>
    </form>
  </div>`;
}

function visibleListings(u, opts = {}) {
  const f = ui.filters;
  const q = f.q.trim().toLowerCase();
  const list = db.listings
    .filter((l) => l.status !== 'deleted' && user(l.sellerId)?.uni === u.uni && !user(l.sellerId)?.deleted)
    .filter((l) => !isBlocked(u, user(l.sellerId)))
    .filter((l) => f.campus === 'all' || campusOf(user(l.sellerId))?.id === campusOf(u)?.id)
    .filter((l) => f.type === 'all' || l.type === f.type)
    .filter((l) => f.cat === 'all' || l.category === f.cat)
    .filter((l) => !f.hideGone || l.status !== 'done')
    .filter((l) => opts.ignorePrice || inRange(priceOf(l), f.minPrice, f.maxPrice))
    .filter((l) => !f.today || l.createdAt >= startOfToday())
    .filter((l) => !q || matches(l, q));
  const price = (l) => (l.type === 'free' ? 0 : l.price);
  const sorters = {
    new: (a, b) => (a.status === 'done') - (b.status === 'done') || b.createdAt - a.createdAt,
    low: (a, b) => (a.status === 'done') - (b.status === 'done') || price(a) - price(b),
    high: (a, b) => (a.status === 'done') - (b.status === 'done') || price(b) - price(a),
    liked: (a, b) => (a.status === 'done') - (b.status === 'done') || (b.likes || []).length - (a.likes || []).length,
  };
  return list.sort(sorters[f.sort] || sorters.new);
}
const matches = (l, q) => (l.title + ' ' + l.desc + ' ' + cat(l.category).label).toLowerCase().includes(q.toLowerCase());
function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }

// ================= search panel (opens when you tap the search bar) =================
const RECENT_KEY = 'cm_recent_searches';
function getRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) { return []; } }
function setRecent(list) { try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8))); } catch (e) { /* storage full */ } }
function addRecent(q) {
  q = (q || '').trim();
  if (!q) return;
  setRecent([q, ...getRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())]);
}
function removeRecent(q) { setRecent(getRecent().filter((x) => x !== q)); }
// Items a search can find: same university, not blocked, on the chosen campus filter
function searchPool(u) {
  const f = ui.filters;
  return db.listings
    .filter((l) => l.status !== 'deleted' && user(l.sellerId)?.uni === u.uni && !user(l.sellerId)?.deleted && !isBlocked(u, user(l.sellerId)))
    .filter((l) => f.campus === 'all' || campusOf(user(l.sellerId))?.id === campusOf(u)?.id);
}
// Bold the part of the text that matches what was typed
function hl(text, q) {
  const i = (text || '').toLowerCase().indexOf(q.toLowerCase());
  if (!q || i < 0) return esc(text);
  return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
}
function searchPanelHTML(u) {
  const pool = searchPool(u);
  const where = ui.filters.campus === 'all' ? 'all campuses' : 'your campus';
  const d = ui.searchDraft.trim();
  if (d) {
    const hits = pool.filter((l) => matches(l, d));
    const catRows = CONFIG.categories
      .map((c) => ({ c, n: hits.filter((l) => l.category === c.id && l.status !== 'done').length, label: c.label.toLowerCase().includes(d.toLowerCase()) }))
      .filter((x) => x.n || x.label)
      .sort((a, b) => b.label - a.label || b.n - a.n)
      .slice(0, 4)
      .map((x) => x.label && !x.n
        ? `<button class="sp-row" data-act="search-cat" data-v="${x.c.id}" data-q=""><span class="sp-ic">${x.c.icon}</span><span class="sp-main">Browse <b>${hl(x.c.label, d)}</b></span><span class="sp-go">›</span></button>`
        : `<button class="sp-row" data-act="search-run" data-q="${esc(d)}" data-cat="${x.c.id}"><span class="sp-ic">${x.c.icon}</span><span class="sp-main">"${esc(d)}" in <b>${esc(x.c.label)}</b></span><span class="sp-count">${x.n}</span></button>`)
      .join('');
    const items = hits.sort((a, b) => (a.status === 'done') - (b.status === 'done') || b.createdAt - a.createdAt).slice(0, 6)
      .map((l) => `<button class="sp-row" data-act="search-item" data-id="${l.id}">${photoHTML(l, 'sp-thumb')}<span class="sp-main">${hl(l.title, d)}<span class="sp-sub">${priceLabel(l)}${l.status === 'done' ? ' · Gone' : l.status === 'reserved' ? ' · Reserved' : ''}</span></span><span class="sp-go">›</span></button>`)
      .join('');
    return `<div class="sp-list">
      ${catRows ? `<div class="sp-head">Categories</div>${catRows}` : ''}
      ${items ? `<div class="sp-head">Items</div>${items}` : ''}
      ${!catRows && !items ? `<div class="sp-empty">Nothing matches "${esc(d)}" on ${where} yet. Search anyway and tap "Save search" to hear when it's posted.</div>` : ''}
      <button class="sp-row sp-all" data-act="search-run" data-q="${esc(d)}"><span class="sp-ic">${ICON.search}</span><span class="sp-main">Search for "<b>${esc(d)}</b>"</span><span class="sp-go">›</span></button>
    </div>`;
  }
  const recent = getRecent();
  const saved = u.savedSearches || [];
  return `<section class="sp-sec"><div class="sp-head">Search by category <span class="muted">· ${where}</span></div>
      <div class="cat-grid">${CONFIG.categories.map((c) => {
        const n = pool.filter((l) => l.category === c.id && l.status === 'available').length;
        return `<button class="cat-tile ${ui.filters.cat === c.id ? 'on' : ''}" data-act="search-cat" data-v="${c.id}"><span class="ct-ic">${c.icon}</span><span class="ct-label">${c.label}</span><span class="ct-count">${n} item${n === 1 ? '' : 's'}</span></button>`;
      }).join('')}</div></section>
    <section class="sp-sec"><div class="sp-head">Quick filters</div>
      <div class="quick-filters">
        <button class="qf" data-act="search-quick" data-v="free">${ICON.gift}Free items</button>
        <button class="qf" data-act="search-quick" data-v="under">${ICON.yen}Up to ¥1,000</button>
        <button class="qf" data-act="search-quick" data-v="today">${ICON.clock}Posted today</button>
      </div></section>
    <section class="sp-sec"><div class="sp-head">Price</div>
      <div class="quick-filters">${PRICE_BRACKETS.map((b) => `<button class="qf" data-act="price-set" data-min="${b.min ?? ''}" data-max="${b.max ?? ''}" data-close="1">${rangeLabel(b.min, b.max)}</button>`).join('')}
        <button class="qf" data-act="price-custom">Custom range…</button></div></section>
    ${recent.length ? `<section class="sp-sec"><div class="sp-head">Recent searches <button class="linkbtn small" data-act="recent-clear">Clear</button></div>
      ${recent.map((q) => `<div class="sp-row recent"><button class="sp-row-main" data-act="search-run" data-q="${esc(q)}"><span class="sp-ic">${ICON.clock}</span><span class="sp-main">${esc(q)}</span></button><button class="icon-btn" data-act="recent-remove" data-q="${esc(q)}" aria-label="Remove">${ICON.x}</button></div>`).join('')}</section>` : ''}
    ${saved.length ? `<section class="sp-sec"><div class="sp-head">Saved searches</div>
      <div class="quick-filters">${saved.map((s) => `<button class="chip" data-act="search-run" data-q="${esc(s.q)}">${ICON.bell} ${esc(s.q)}</button>`).join('')}</div></section>` : ''}`;
}
function openSearch(input) {
  const panel = document.getElementById('search-panel');
  if (!panel) return;
  ui.searchOpen = true;
  ui.searchDraft = input.value;
  panel.hidden = false;
  const body = document.getElementById('home-body');
  if (body) body.hidden = true;
  const cancel = $app.querySelector('.search-cancel');
  if (cancel) cancel.hidden = false;
  refreshSearchPanel();
  window.scrollTo(0, 0);
}
function refreshSearchPanel() {
  const panel = document.getElementById('search-panel');
  if (panel && ui.searchOpen) panel.innerHTML = searchPanelHTML(me());
}
function closeSearch() {
  ui.searchOpen = false; ui.searchDraft = '';
  if (document.activeElement) document.activeElement.blur();
  render();
}
function applySearch(q, catId) {
  const f = ui.filters;
  f.q = (q || '').trim();
  if (catId) f.cat = catId;
  addRecent(f.q);
  ui.searchOpen = false; ui.searchDraft = '';
  if (document.activeElement) document.activeElement.blur();
  render();
  window.scrollTo(0, 0);
}
// Pills above the results so students see (and can remove) what's applied
function filterPillsHTML() {
  const f = ui.filters;
  const pill = (v, label) => `<button class="fpill" data-act="pill-clear" data-v="${v}">${label}<span class="fx">${ICON.x}</span></button>`;
  const pills = [];
  if (f.q.trim()) pills.push(pill('q', `"${esc(f.q.trim())}"`));
  if (f.cat !== 'all') pills.push(pill('cat', `${cat(f.cat).icon} ${cat(f.cat).label}`));
  if (f.type !== 'all') pills.push(pill('type', f.type === 'free' ? 'Free' : 'For sale'));
  if (f.minPrice != null || f.maxPrice != null) pills.push(pill('price', rangeLabel(f.minPrice, f.maxPrice)));
  if (f.today) pills.push(pill('today', 'Posted today'));
  if (!pills.length) return '';
  return `<div class="fpills">${pills.join('')}${pills.length > 1 ? '<button class="linkbtn small" data-act="pill-clear" data-v="all">Clear all</button>' : ''}</div>`;
}

function cardHTML(l, u) {
  const c = campusOf(user(l.sellerId));
  const meta = c && c.id !== campusOf(u)?.id ? `${esc(c.nameJa)} · ${ago(l.createdAt)}` : `${cat(l.category).label} · ${ago(l.createdAt)}`;
  const liked = (l.likes || []).includes(u.id);
  return `<a class="item ${l.status}" href="#/item/${l.id}">
    <div class="photo-wrap">${photoHTML(l, 'photo')}
      <span class="price ${l.type}">${priceLabel(l)}</span>
      ${l.status === 'reserved' ? '<span class="stamp">Reserved</span>' : l.status === 'done' ? '<span class="stamp sold">Gone</span>' : ''}
      ${liked ? `<span class="mini-heart">${ICON.heart}</span>` : ''}
    </div>
    <div class="body"><div class="title">${esc(l.title)}</div><div class="meta">${meta}</div></div>
  </a>`;
}
function gridHTML(u) {
  const items = visibleListings(u);
  const f = ui.filters;
  const saved = f.q.trim() && (u.savedSearches || []).some((s) => s.q.toLowerCase() === f.q.trim().toLowerCase());
  const tools = `<div class="toolbar"><span class="muted small">${items.length} item${items.length === 1 ? '' : 's'}</span>
    ${f.q.trim() ? `<button class="chip ${saved ? 'on' : ''}" data-act="save-search">${ICON.bell} ${saved ? 'Search saved' : 'Save search'}</button>` : ''}</div>`;
  const pills = filterPillsHTML();
  if (!items.length) return pills + tools + `<div class="empty">${pills ? 'No items match these filters.<br><button class="linkbtn" data-act="pill-clear" data-v="all">Clear filters</button>' : 'Nothing here yet.<br><a href="#/post">Be the first to post something</a>'}${f.campus === 'mine' ? '<br><br><button class="linkbtn" data-act="f-campus" data-v="all">See other campuses</button>' : ''}</div>`;
  return pills + tools + `<div class="grid">${items.map((l) => cardHTML(l, u)).join('')}</div>`;
}
function viewHome(u) {
  const f = ui.filters;
  const chip = (act, v, label, current) => `<button class="chip ${current === v ? 'on' : ''}" data-act="${act}" data-v="${v}">${label}</button>`;
  return `<header class="topbar home">
    <div class="brand-row"><div class="where"><b>${esc(uni(u.uni)?.nameJa)}</b><span>${esc(campusOf(u)?.nameJa)} · students only</span></div>
      ${u.verified ? '' : '<a class="badge warn" href="#/verify">Verify</a>'}
      ${langBtn()}<a class="logo-link" href="#/home" data-act="home-top" aria-label="Go to home">${logoHTML()}</a></div>
    <div class="search-row">
      <label class="search-box">${ICON.search}<input type="search" enterkeyhint="search" autocomplete="off" placeholder="Search textbooks, rice cookers, bikes…" value="${esc(ui.searchOpen ? ui.searchDraft : f.q)}" data-input="search"></label>
      <button class="search-cancel" data-act="search-cancel" ${ui.searchOpen ? '' : 'hidden'}>Cancel</button>
    </div>
  </header>
  <div id="search-panel" class="search-panel" ${ui.searchOpen ? '' : 'hidden'}>${ui.searchOpen ? searchPanelHTML(u) : ''}</div>
  <div id="home-body" ${ui.searchOpen ? 'hidden' : ''}>
  <div class="tabs">
    ${chip('f-campus', 'mine', 'My campus', f.campus)}${chip('f-campus', 'all', 'All campuses', f.campus)}
  </div>
  <div class="chips">${chip('f-type', 'all', 'All', f.type)}${chip('f-type', 'sell', 'For sale', f.type)}${chip('f-type', 'free', 'Free', f.type)}
    <button class="chip price-chip ${f.minPrice != null || f.maxPrice != null ? 'on' : ''} ${ui.priceOpen ? 'open' : ''}" data-act="price-toggle">${f.minPrice != null || f.maxPrice != null ? rangeLabel(f.minPrice, f.maxPrice) : 'Price'} <span class="caret">▾</span></button>
    <span class="chip-sep"></span>
    <label class="chip select-chip"><select data-change="sort">
      ${[['new', 'Newest'], ['low', 'Price: low → high'], ['high', 'Price: high → low'], ['liked', 'Most liked']].map(([v, t]) => `<option value="${v}" ${f.sort === v ? 'selected' : ''}>${t}</option>`).join('')}
    </select></label>
    <button class="chip ${f.hideGone ? 'on' : ''}" data-act="f-hidegone">Hide gone</button></div>
  ${ui.priceOpen ? priceSheetHTML(u) : ''}
  <div class="chips">${chip('f-cat', 'all', 'All categories', f.cat)}${CONFIG.categories.map((c) => chip('f-cat', c.id, `${c.icon} ${c.label}`, f.cat)).join('')}</div>
  <a class="banner" href="#/safety"><b>Meet on campus. No shipping.</b><span>Agree on a place and time in chat. Safety tips ›</span></a>
  <div id="grid">${gridHTML(u)}</div>
  </div>`;
}

// ================= item =================
function viewItem(u, id) {
  const l = listing(id);
  if (!l || l.status === 'deleted') return `${topbar('Not found', true)}<div class="empty">This item was removed.</div>`;
  const s = user(l.sellerId);
  const mine = l.sellerId === u.id;
  if (!mine && !(l.viewers || []).includes(u.id)) { (l.viewers = l.viewers || []).push(u.id); save(); }
  const liked = (l.likes || []).includes(u.id);
  const blocked = isBlocked(u, s);
  const existing = db.threads.find((t) => t.listingId === l.id && t.buyerId === u.id);
  let cta;
  if (mine) cta = `<div class="cta-row"><a class="btn ghost" href="#/edit/${l.id}">${ICON.edit} Edit listing</a><a class="btn" href="#/me">My listings</a></div>`;
  else if (blocked) cta = `<button class="btn block" disabled>You can't contact this student</button>`;
  else if (l.status === 'done') cta = `<button class="btn block" disabled>This item is gone</button>`;
  else if (existing) cta = `<a class="btn block" href="#/chat/${existing.id}">Open chat with ${esc(firstName(s))}</a>`;
  else cta = `<button class="btn block" data-act="contact" data-id="${l.id}">${l.type === 'free' ? 'I want this' : 'Ask to buy'}</button>`;
  return `${topbar('', true)}
  <div class="big-wrap">${photoHTML(l, 'big-photo')}
    <div class="photo-actions">
      <button class="fav-btn ${isFav(u, 'item', l.id) ? 'on' : ''}" data-act="fav-item" data-id="${l.id}" aria-label="Save to favorites" title="${isFav(u, 'item', l.id) ? 'Saved to favorites' : 'Save to favorites'}">${ICON.bookmark}<span>${isFav(u, 'item', l.id) ? 'Saved' : 'Save'}</span></button>
      <button class="like-btn ${liked ? 'on' : ''}" data-act="like" data-id="${l.id}" aria-label="Like">${ICON.heart}<span>${(l.likes || []).length}</span></button>
    </div></div>
  <div class="pad stack item-page" style="padding-bottom:96px">
    <div>
      <h2 class="item-title">${esc(l.title)}</h2>
      <div class="price-row"><span class="price-big">${priceLabel(l)}</span>${statusBadge(l)}</div>
      <div class="small muted item-stats"><span>${cat(l.category).icon} ${cat(l.category).label}</span><span>posted ${ago(l.createdAt)}${l.editedAt ? ' · edited' : ''}</span>
        <span>${ICON.eye} ${(l.viewers || []).length}</span><span>${ICON.heart} ${(l.likes || []).length}</span></div>
    </div>
    <div class="card"><dl class="facts">
      <dt>Condition</dt><dd>${esc(l.condition)}</dd>
      <dt>Campus</dt><dd>${esc(campusLabel(s))}${campusOf(s)?.id !== campusOf(u)?.id ? ' <span class="muted small">· not your campus</span>' : ''}</dd>
      ${l.times ? `<dt>Free times</dt><dd>${esc(l.times)}</dd>` : ''}
    </dl></div>
    ${l.desc ? `<div class="card"><h3>Details</h3><p class="desc">${esc(l.desc)}</p></div>` : ''}
    <a class="card seller link-card" href="#/user/${s.id}">${avatar(s)}<div style="flex:1;min-width:0"><b>${esc(s.name)}</b>${mine ? ' <span class="small muted">(you)</span>' : ''}
      <div class="small muted">${esc(campusOf(s)?.nameJa || uni(s.uni)?.name)}</div>
      <div class="seller-meta">${verifiedTag(s)} ${ratingHTML(s.id)} <span class="small muted">${handoffCount(s.id)} hand-offs</span></div></div><span class="chev">›</span></a>
    ${mine ? '' : `<a class="report-link" href="#/report/listing/${l.id}">${ICON.flag} Report this item</a>`}
  </div>
  <div class="sticky-cta">${cta}</div>`;
}

// ================= post / edit =================
function viewPost(u, editId) {
  if (!u.verified) return needVerify('post items');
  const l = editId ? listing(editId) : null;
  if (editId && (!l || l.sellerId !== u.id)) return `${topbar('Edit', true)}<div class="empty">You can only edit your own listings.</div>`;
  if (l && ui.editingId !== l.id) { ui.editingId = l.id; ui.draftPhoto = l.photo; }
  if (!l && ui.editingId) { ui.editingId = null; ui.draftPhoto = null; }
  const v = l || { type: 'sell', condition: 'Good', category: 'textbooks' };
  return `${topbar(l ? 'Edit listing' : 'Post an item', !!l)}
  <form class="pad" data-form="post" ${l ? `data-id="${l.id}"` : ''}>
    <label class="photo-pick" style="margin-bottom:14px">
      ${ui.draftPhoto ? `<img src="${esc(ui.draftPhoto)}" alt="">` : `<div><span class="pick-ic">${ICON.camera}</span>Add a photo<br><span class="small">Optional, but items with photos go faster</span></div>`}
      <input type="file" accept="image/*" data-change="photo">
    </label>
    <label class="field"><span>What is it?</span><input name="title" required maxlength="60" value="${esc(v.title || '')}" placeholder="e.g. Rice cooker, Biology textbook"></label>
    <div class="field-group"><span class="group-label">Type</span>
      <div class="seg two">
        <label><input type="radio" name="type" value="sell" ${v.type === 'sell' ? 'checked' : ''} data-change="type"><span>Sell</span></label>
        <label><input type="radio" name="type" value="free" ${v.type === 'free' ? 'checked' : ''} data-change="type"><span>Give away</span></label>
      </div></div>
    <label class="field" id="price-field" ${v.type === 'free' ? 'style="display:none"' : ''}><span>Price (¥)</span><input name="price" type="number" min="0" step="10" inputmode="numeric" value="${v.type === 'sell' && v.price ? v.price : ''}" placeholder="1500"></label>
    <label class="field"><span>Category</span><select name="category">${CONFIG.categories.map((c) => `<option value="${c.id}" ${c.id === v.category ? 'selected' : ''}>${c.label}</option>`).join('')}</select></label>
    <label class="field"><span>Condition</span><select name="condition">${CONFIG.conditions.map((c) => `<option ${c === v.condition ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
    <label class="field"><span>When are you free? <em>optional</em></span><input name="times" maxlength="60" value="${esc(v.times || '')}" placeholder="e.g. Lunch break, weekdays after 4th period"></label>
    <label class="field"><span>Details <em>optional</em></span><textarea name="desc" maxlength="600" placeholder="Size, why you're selling, anything people should know">${esc(v.desc || '')}</textarea></label>
    ${l && l.type === 'sell' && (l.likes || []).length ? `<div class="demo-note">${(l.likes || []).length} student(s) liked this. If you lower the price, they'll get a notification.</div><br>` : ''}
    <button class="btn block">${l ? 'Save changes' : 'Post'}</button>
  </form>`;
}
function needVerify(what) {
  return `${topbar('Verify first')}<div class="pad"><div class="card center stack">
    <div class="big-icon">${ICON.idcard}</div><h2>Verify your student card</h2>
    <p class="muted small">To keep this students-only, you need a verified student card to ${what}.</p>
    <a class="btn block" href="#/verify">Verify now</a></div></div>`;
}

// ================= notifications =================
function viewNotifs(u) {
  const list = db.notifications.filter((n) => n.userId === u.id).sort((a, b) => b.at - a.at);
  const rows = list.map((n) => {
    const l = n.listingId ? listing(n.listingId) : null;
    const pic = l ? photoHTML(l, 'thumb') : `<div class="thumb icon-thumb ${n.icon}">${ICON[n.icon] || ICON.bell}</div>`;
    return `<a class="note-row ${n.read ? '' : 'unread'}" href="${esc(n.link || '#/notifs')}">${pic}
      <div class="mid"><div class="note-text">${esc(n.text)}</div><div class="small muted">${ago(n.at)}</div></div>
      ${n.read ? '' : '<span class="unread-dot"></span>'}</a>`;
  }).join('');
  return `${topbar('Notifications')}
  <div class="sub-bar"><a href="#/settings">${ICON.gear} Notification settings</a></div>
  ${rows || `<div class="empty"><div class="big-icon">${ICON.bell}</div>No notifications yet.<br>You'll hear here when someone wants your item, a meetup is agreed, or something new is posted on your campus.</div>`}`;
}

// ================= inbox & chat =================
const lastMsg = (t) => t.messages[t.messages.length - 1];
function viewInbox(u) {
  const threads = db.threads.filter((t) => t.buyerId === u.id || t.sellerId === u.id)
    .sort((a, b) => (lastMsg(b)?.at || 0) - (lastMsg(a)?.at || 0));
  const rows = threads.map((t) => {
    const l = listing(t.listingId);
    const other = user(t.buyerId === u.id ? t.sellerId : t.buyerId);
    const m = lastMsg(t);
    const pill = t.outcome === 'handed' ? '<span class="badge free">Handed off</span>' : t.outcome === 'noshow' ? '<span class="badge warn">No-show</span>' : t.meetup ? '<span class="badge">Meetup set</span>' : '';
    const preview = m ? (m.kind === 'meetup' ? 'Meetup proposal' : m.kind === 'offer' ? `Offer: ${yen(m.amount)}` : m.kind === 'system' ? m.text : (m.from === u.id ? 'You: ' : '') + m.text) : '';
    return `<a class="thread-row" href="#/chat/${t.id}">${photoHTML(l, 'thumb')}
      <div class="mid"><div class="name">${esc(other?.name)} ${pill}</div><div class="small muted">${esc(l?.title)}</div><div class="last">${esc(preview)}</div></div>
      <div class="small muted">${m ? ago(m.at) : ''}</div></a>`;
  }).join('');
  return `${topbar('Messages')}${rows || `<div class="empty"><div class="big-icon">${ICON.chat}</div>No messages yet.<br>Find something on Home and tap "Ask to buy".</div>`}`;
}

function viewChat(u, id) {
  const t = db.threads.find((x) => x.id === id);
  if (!t) return `${topbar('Chat', true)}<div class="empty">Chat not found.</div>`;
  const l = listing(t.listingId);
  const isParty = u.id === t.buyerId || u.id === t.sellerId;
  const otherId = u.id === t.buyerId ? t.sellerId : t.buyerId;
  const other = user(isParty ? otherId : t.sellerId);
  const switchTo = isParty ? user(otherId) : user(t.sellerId);
  const blocked = isBlocked(u, other);

  const lastMine = [...t.messages].reverse().find((m) => m.from === u.id && m.kind === 'text');
  const liveOn = typeof Live !== 'undefined' && Live.on && Live.isBot(other?.id);
  const msgs = t.messages.map((m) => {
    if (m.kind === 'system') return `<div class="sys">${esc(m.text)}</div>`;
    const mine = m.from === u.id;
    const waiting = `<span class="badge grey">Waiting for ${mine ? esc(firstName(other)) : 'you'}</span>`;
    if (m.kind === 'meetup') {
      let acts = '';
      if (m.status === 'pending' && !mine && isParty && !t.outcome && !blocked) acts = `<div class="acts"><button class="btn sm" data-act="meet-accept" data-id="${m.id}">Accept</button><button class="btn sm light" data-act="meet-decline" data-id="${m.id}">Can't make it</button></div>`;
      const st = m.status === 'accepted' ? '<span class="badge free">Accepted</span>' : m.status === 'declined' ? '<span class="badge grey">Declined</span>' : waiting;
      return `<div class="meet"><div class="ttl">${ICON.calendar} Meetup proposal · from ${mine ? 'you' : esc(firstName(user(m.from)))}</div>
        <div class="where">${esc(fmtWhen(m.when))}</div>${m.place ? `<div class="small">${esc(m.place)}</div>` : ''}<div style="margin-top:6px">${st}</div>${acts}</div>`;
    }
    if (m.kind === 'offer') {
      let acts = '';
      if (m.status === 'pending' && u.id === t.sellerId && !t.outcome && !blocked) acts = `<div class="acts"><button class="btn sm" data-act="offer-accept" data-id="${m.id}">Accept ${yen(m.amount)}</button><button class="btn sm light" data-act="offer-decline" data-id="${m.id}">Decline</button></div>`;
      const st = m.status === 'accepted' ? '<span class="badge free">Accepted</span>' : m.status === 'declined' ? '<span class="badge grey">Declined</span>' : waiting;
      return `<div class="meet offer"><div class="ttl">${ICON.tag} Price offer · from ${mine ? 'you' : esc(firstName(user(m.from)))}</div>
        <div class="where">${yen(m.amount)} <span class="small muted strike">${priceLabel(l)}</span></div><div style="margin-top:6px">${st}</div>${acts}</div>`;
    }
    const read = mine && m === lastMine && t.readAt && t.readAt >= m.at ? '<span class="read">Read</span>' : '';
    return `<div class="msg ${mine ? 'me' : 'them'}">${esc(m.text)}<span class="t">${ago(m.at)}</span></div>${read}`;
  }).join('');

  let outcome = '';
  if (t.meetup && !t.outcome && isParty) {
    outcome = `<div class="outcome">Meetup: <b>${esc(fmtWhen(t.meetup.when))}</b>${t.meetup.place ? ' · ' + esc(t.meetup.place) : ''}. Did the hand-off happen?
      <div class="acts"><button class="btn sm" data-act="handed" data-id="${t.id}">Yes, handed off</button><button class="btn sm danger" data-act="noshow" data-id="${t.id}">They didn't show</button></div></div>`;
  }
  // Review after a hand-off (like Mercari / Jimoty)
  let review = '';
  if (t.outcome === 'handed' && isParty) {
    const mineR = db.reviews.find((r) => r.threadId === t.id && r.from === u.id);
    const words = { 1: 'Bad', 2: 'Poor', 3: 'OK', 4: 'Good', 5: 'Great' };
    if (!mineR && !canRateNow(t)) {
      review = `<div class="review-wait">${ICON.clock}<div><b>You can rate ${esc(firstName(other))} from tomorrow</b>
        <div class="small muted">Ratings open 1 day after the hand-off, so nobody has to rate on the spot. We'll send you a reminder.</div>
        <div class="small muted">Opens in ${hoursLeft(t)} h</div>
        ${Backend.on ? '' : `<button class="linkbtn small" data-act="skip-day" data-id="${t.id}">Demo: skip ahead 1 day</button>`}</div></div>`;
    } else review = mineR
      ? `<div class="review-done">You rated ${esc(firstName(other))} ${starsHTML(starsOf(mineR))}</div>`
      : `<form class="review-box" data-form="review" data-id="${t.id}"><b>Rate your hand-off with ${esc(firstName(other))}</b>
          <div class="star-input" role="radiogroup" aria-label="Rating out of 5">
            ${[5, 4, 3, 2, 1].map((v) => `<input type="radio" id="star-${t.id}-${v}" name="stars" value="${v}"><label for="star-${t.id}-${v}" title="${v} star${v > 1 ? 's' : ''} · ${words[v]}">★</label>`).join('')}
          </div>
          <input name="comment" maxlength="140" placeholder="Say thanks or leave a short comment (optional)">
          <div class="acts"><button class="btn sm">Submit rating</button></div></form>`;
  }

  const quick = u.id === t.buyerId
    ? ['Is it still available?', 'Where should we meet?', 'I can come today', 'Thank you!']
    : ['Yes, still available!', 'Where works for you?', 'Sorry, it\'s reserved', 'Thank you!'];
  const canPropose = isParty && !t.outcome && l && l.status !== 'done';
  const canOffer = canPropose && u.id === t.buyerId && l.type === 'sell';
  const d = new Date(now() + DAY);
  const pad2 = (n) => String(n).padStart(2, '0');
  const dw = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T12:15`;
  const priceShown = t.agreedPrice != null ? `${yen(t.agreedPrice)} <span class="badge free">agreed</span>` : priceLabel(l);

  let panel = '';
  if (ui.panel === 'meet') panel = `<div class="propose">
      <label class="field"><span>When</span><input type="datetime-local" name="when" value="${dw}"></label>
      <label class="field"><span>Where <em>optional</em></span><input name="place" maxlength="60" placeholder="e.g. Library entrance (or decide in chat)"></label>
      <div class="acts"><button type="button" class="btn sm" data-act="meet-send" data-id="${t.id}">Send proposal</button><button type="button" class="btn sm light" data-act="panel-close">Cancel</button></div></div>`;
  if (ui.panel === 'offer') panel = `<div class="propose">
      <label class="field"><span>Your offer (¥) <em>listed at ${priceLabel(l)}</em></span><input type="number" name="amount" min="0" step="10" inputmode="numeric" value="${Math.round((l.price * 0.8) / 10) * 10}"></label>
      <div class="acts"><button type="button" class="btn sm" data-act="offer-send" data-id="${t.id}">Send offer</button><button type="button" class="btn sm light" data-act="panel-close">Cancel</button></div></div>`;

  const composer = !isParty ? '' : blocked
    ? `<div class="composer blocked-note">You can't message each other because one of you blocked the other.</div>`
    : `<form class="composer" data-form="msg" data-id="${t.id}">
    ${panel || `<div class="quick">${canPropose ? `<button type="button" class="chip accent" data-act="meet-open">${ICON.calendar} Propose meetup</button>` : ''}${canOffer ? `<button type="button" class="chip accent" data-act="offer-open">${ICON.tag} Offer a price</button>` : ''}${quick.map((q) => `<button type="button" class="chip" data-act="quick" data-v="${esc(q)}" data-id="${t.id}">${esc(q)}</button>`).join('')}</div>`}
    <div class="row"><input name="text" placeholder="Message" autocomplete="off" maxlength="500"><button class="btn sm">Send</button></div>
  </form>`;

  return `${topbar(`<a class="plain" href="#/user/${other?.id}">${esc(other?.name || 'Chat')}</a>${liveOn ? '<span class="presence"><i></i><span>Online</span></span>' : ''}`, true)}
  <a class="chat-item" href="#/item/${l?.id}">${photoHTML(l, 'thumb')}<div style="flex:1;min-width:0"><b>${esc(l?.title)}</b><div class="muted">${priceShown} · ${esc(campusOf(user(t.sellerId))?.nameJa)}</div></div>${statusBadge(l)}</a>
  ${Backend.on || liveOn ? '' : `<div class="demo-bar">Demo: you're <b>${esc(u.name)}</b>. <button class="linkbtn" data-act="login" data-id="${switchTo.id}" data-back="chat/${t.id}">Switch to ${esc(switchTo.name)}'s side</button> to reply.</div>`}
  ${outcome}${review}
  <div class="msgs">${msgs}${ui.typing && ui.typing[t.id] ? '<div class="msg them typing" aria-label="typing"><span></span><span></span><span></span></div>' : ''}</div>
  ${composer}`;
}

// ================= profiles =================
function viewUser(u, id) {
  const p = user(id);
  if (!p || p.deleted) return `${topbar('Profile', true)}<div class="empty">This student isn't on ${CONFIG.appName} any more.</div>`;
  const isMe = p.id === u.id;
  const items = db.listings.filter((l) => l.sellerId === p.id && l.status !== 'deleted').sort((a, b) => (a.status === 'done') - (b.status === 'done') || b.createdAt - a.createdAt);
  const reviews = db.reviews.filter((r) => r.to === p.id).sort((a, b) => b.at - a.at);
  const iBlocked = (u.blocked || []).includes(p.id);
  const rs = ratingStats(p.id);
  return `${topbar(isMe ? 'My profile' : 'Profile', true)}
  <div class="profile-head">
    ${avatar(p, 'lg')}
    <h2>${esc(p.name)}</h2>
    <div class="small muted">${esc(campusOf(p)?.nameJa)}</div>
    <div class="seller-meta center-row">${verifiedTag(p)}</div>
    <div class="profile-stats">
      <div><b class="avg">${rs.count ? '★ ' + rs.avg.toFixed(1) : '–'}</b><span>Rating</span></div>
      <div><b>${rs.count}</b><span>Ratings</span></div>
      <div><b>${handoffCount(p.id)}</b><span>Hand-offs</span></div>
      <div><b>${items.filter((l) => l.status !== 'done').length}</b><span>Listed</span></div>
    </div>
    ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : isMe ? '<p class="bio muted">Add a short bio so other students know who you are.</p>' : ''}
    ${isMe ? `<a class="btn ghost block" href="#/profile">${ICON.edit} Edit profile</a>`
      : `<div class="cta-row"><button class="btn fav-seller ${isFav(u, 'seller', p.id) ? 'on' : 'light'}" data-act="fav-seller" data-id="${p.id}">${ICON.bookmark} ${isFav(u, 'seller', p.id) ? 'Favorite seller' : 'Add to favorites'}</button><button class="btn ${iBlocked ? '' : 'light'}" data-act="block" data-id="${p.id}">${iBlocked ? 'Unblock' : 'Block'}</button><a class="btn light" href="#/report/user/${p.id}">${ICON.flag} Report</a></div>`}
  </div>
  <div class="section-title">Items (${items.length})</div>
  ${items.length ? `<div class="grid">${items.map((l) => cardHTML(l, u)).join('')}</div>` : '<div class="empty small">No items yet.</div>'}
  <div class="section-title">Ratings (${rs.count})</div>
  ${rs.count ? `<div class="rating-summary">
    <div class="rating-big"><b>${rs.avg.toFixed(1)}</b>${starsHTML(rs.avg)}<span class="small muted">${rs.count} rating${rs.count === 1 ? '' : 's'}</span></div>
    <div class="rating-bars">${[5, 4, 3, 2, 1].map((n) => `<div class="bar-row"><span>${n}★</span><div class="bar"><i style="width:${Math.round((rs.dist[n] / rs.count) * 100)}%"></i></div><span class="muted">${rs.dist[n]}</span></div>`).join('')}</div>
  </div>` : ''}
  <div class="reviews">${reviews.map((r) => { const from = user(r.from); return `<div class="review">
      ${avatar(from, 'sm')}<div class="mid"><div class="review-top"><b>${esc(from?.name || 'Student')}</b> ${starsHTML(starsOf(r), 'sm')}</div>
      ${r.comment ? `<div class="small">${esc(r.comment)}</div>` : ''}<div class="small muted">${ago(r.at)}</div></div></div>`; }).join('') || '<div class="empty small">No ratings yet.</div>'}</div>`;
}

function viewEditProfile(u) {
  const pic = ui.draftAvatar !== undefined ? ui.draftAvatar : u.photo;
  const preview = pic ? `<img class="avatar lg" src="${esc(pic)}" alt="">` : avatar(u, 'lg');
  return `${topbar('Edit profile', true)}
  <form class="pad" data-form="profile">
    <div class="avatar-edit">
      <label class="avatar-pick">${preview}<span class="avatar-cam">${ICON.camera}</span><input type="file" accept="image/*" data-change="avatar"></label>
      ${pic ? '<button type="button" class="linkbtn small" data-act="avatar-remove">Remove photo</button>' : '<span class="small muted">Tap to add a photo</span>'}
    </div>
    <label class="field"><span>Nickname</span>
      <div class="nick-row"><input name="name" required maxlength="24" value="${esc(u.name)}"><button type="button" class="btn sm light" data-act="nick-random">${ICON.swap} Suggest</button></div>
      <div class="hint">${NICK_HINT}</div></label>
    <label class="field"><span>Campus</span><select name="campus">
      ${uni(u.uni).campuses.map((c) => `<option value="${c.id}" ${c.id === campusOf(u)?.id ? 'selected' : ''}>${esc(c.nameJa)} · ${esc(c.name)}</option>`).join('')}
    </select></label>
    <label class="field"><span>Bio <em>optional</em></span><textarea name="bio" maxlength="200" placeholder="e.g. Free after 4th period. No price negotiation please.">${esc(u.bio || '')}</textarea><div class="hint">Don't write your faculty, year, nationality or where you're from.</div></label>
    <div class="field"><span class="group-label">University email</span><div class="readonly">${esc(u.email)} ${verifiedTag(u)}</div><div class="hint">Your email can't be changed, because it proves you're a student.</div></div>
    <button class="btn block">Save profile</button>
  </form>`;
}

// ================= settings =================
function viewSettings(u) {
  const s = settingsOf(u);
  const blocked = (u.blocked || []).map(user).filter(Boolean);
  const saved = u.savedSearches || [];
  return `${topbar('Settings', true)}
  <div class="list-page">
    <div class="card"><h3>Notifications</h3>
      ${NOTIFY_KINDS.map((n) => `<label class="switch-row"><div><div>${n.label}</div><div class="hint">${n.hint}</div></div>
        <input type="checkbox" class="switch" data-change="notify" data-k="${n.k}" ${s.notify[n.k] ? 'checked' : ''}></label>`).join('')}
    </div>
    <div class="card"><h3 data-notr>言語 · Language</h3>
      <div class="lang-seg" data-notr><button class="${I18N.lang === 'ja' ? 'on' : ''}" data-act="set-lang" data-v="ja">日本語</button><button class="${I18N.lang === 'en' ? 'on' : ''}" data-act="set-lang" data-v="en">English</button></div>
    </div>
    <div class="card"><h3>Saved searches</h3>
      ${saved.length ? saved.map((x) => `<div class="list-row"><span>${ICON.search} "${esc(x.q)}"</span><button class="icon-btn" data-act="unsave-search" data-id="${x.id}" aria-label="Remove">${ICON.x}</button></div>`).join('')
        : '<p class="muted small">Search on Home and tap "Save search" to get told when a matching item is posted.</p>'}
    </div>
    <div class="card"><h3>Blocked students</h3>
      ${blocked.length ? blocked.map((b) => `<div class="list-row"><span class="inline-user">${avatar(b, 'sm')} ${esc(b.name)}</span><button class="btn sm light" data-act="block" data-id="${b.id}">Unblock</button></div>`).join('')
        : '<p class="muted small">Nobody blocked. Blocked students can\'t message you and you won\'t see their items.</p>'}
    </div>
    <div class="card menu"><h3>Account</h3>
      <a href="#/profile"><span>${ICON.edit} Edit profile</span><span>›</span></a>
      <a href="#/verify"><span>${ICON.shield} Student verification · ${u.verified ? 'Verified' : 'Not verified'}</span><span>›</span></a>
      <a href="#/safety"><span>${ICON.shield} Safety tips for meetups</span><span>›</span></a>
      <button data-act="logout"><span>${ICON.logout} Log out</span><span>›</span></button>
      <button data-act="delete-account" class="danger-text"><span>${ICON.x} Delete my account</span><span>›</span></button>
    </div>
  </div>`;
}

function viewLikes(u) {
  const items = db.listings.filter((l) => (l.likes || []).includes(u.id) && l.status !== 'deleted').sort((a, b) => b.createdAt - a.createdAt);
  return `${topbar('Liked items', true)}
  ${items.length ? `<div class="grid" style="padding-top:16px">${items.map((l) => cardHTML(l, u)).join('')}</div>` : `<div class="empty"><div class="big-icon">${ICON.heart}</div>Tap the heart on an item to save it here.<br>You'll get a notification if the price drops.</div>`}`;
}

// Favorites: a private list of saved items and trusted sellers (nobody is told)
function viewFavorites(u, tab) {
  const f = favsOf(u);
  const showSellers = tab === 'sellers';
  const items = f.items.map(listing).filter((l) => l && l.status !== 'deleted' && !isBlocked(u, user(l.sellerId)));
  const sellers = f.sellers.map(user).filter((p) => p && !p.deleted);
  const tabs = `<div class="tabs fav-tabs">
    <a class="chip ${showSellers ? '' : 'on'}" href="#/favorites">Items (${items.length})</a>
    <a class="chip ${showSellers ? 'on' : ''}" href="#/favorites/sellers">Sellers (${sellers.length})</a></div>`;
  const body = showSellers
    ? (sellers.length ? `<div class="fav-sellers">${sellers.map((p) => {
        const live = db.listings.filter((l) => l.sellerId === p.id && l.status === 'available').length;
        return `<a class="fav-seller-row" href="#/user/${p.id}">${avatar(p)}<div class="mid"><b>${esc(p.name)}</b>
          <div class="seller-meta">${ratingHTML(p.id)} <span class="small muted">${esc(campusOf(p)?.nameJa || '')}</span></div>
          <div class="small muted">${live} item${live === 1 ? '' : 's'} for sale</div></div>
          <button class="icon-btn" data-act="fav-seller" data-id="${p.id}" aria-label="Remove from favorites">${ICON.x}</button></a>`;
      }).join('')}</div>`
      : `<div class="empty"><div class="big-icon">${ICON.bookmark}</div>No favorite sellers yet.<br>Open a student's profile and tap "Add to favorites". You'll hear when they post something new.</div>`)
    : (items.length ? `<div class="grid" style="padding-top:16px">${items.map((l) => cardHTML(l, u)).join('')}</div>`
      : `<div class="empty"><div class="big-icon">${ICON.bookmark}</div>No saved items yet.<br>Tap "Save" on an item to keep it here. Only you can see your favorites.</div>`);
  return `${topbar('Favorites', true)}${tabs}<div class="sub-bar small muted">${ICON.shield} Private. Sellers aren't told when you save them.</div>${body}`;
}

function viewReport(u, kind, id) {
  const target = kind === 'listing' ? listing(id) : user(id);
  if (!target || !CONFIG.reportReasons[kind]) return `${topbar('Report', true)}<div class="empty">Nothing to report.</div>`;
  return `${topbar('Report', true)}
  <form class="pad stack" data-form="report" data-kind="${kind}" data-id="${id}">
    <p>Reporting ${kind === 'listing' ? 'the item' : 'the student'} <b>${esc(target.title || target.name)}</b>. Reports are private. The other person isn't told who reported them.</p>
    <div class="card radio-list">${CONFIG.reportReasons[kind].map((r, i) => `<label><input type="radio" name="reason" value="${esc(r)}" ${i === 0 ? 'checked' : ''}> ${esc(r)}</label>`).join('')}</div>
    <label class="field"><span>Anything else? <em>optional</em></span><textarea name="note" maxlength="300"></textarea></label>
    <button class="btn block">Send report</button>
  </form>`;
}

function viewSafety() {
  const tips = [
    ['Use a nickname, never your real name', 'Don\'t share your full name, faculty, year, nationality, address, phone number or LINE ID in your profile or listings.'],
    ['Meet on campus, in the daytime', 'Busy places like the library entrance, the co-op or the cafeteria are best.'],
    ['Check the item before paying', 'Look it over and make sure it works before you hand over cash.'],
    ['Pay in cash, in person', 'Don\'t send money before you meet. The app never asks you to pay in advance.'],
    ['Keep chats in the app', 'If something goes wrong, the chat history helps us look into it.'],
    ['Never share your student card photo', 'We only need it once, for verification. Nobody else should ask for it.'],
    ['Report and block', 'If someone is rude, doesn\'t show up, or seems like a scam, report them from their profile.'],
  ];
  return `${topbar('Safety tips', true)}<div class="list-page"><div class="card">${tips.map(([t, d]) => `<div class="tip">${ICON.shield}<div><b>${t}</b><div class="small muted">${d}</div></div></div>`).join('')}</div></div>`;
}

// ================= me =================
function viewMe(u) {
  const mine = db.listings.filter((l) => l.sellerId === u.id && l.status !== 'deleted').sort((a, b) => b.createdAt - a.createdAt);
  const likedCount = db.listings.filter((l) => (l.likes || []).includes(u.id) && l.status !== 'deleted').length;
  const rows = mine.map((l) => `<div class="my-row">${photoHTML(l, 'thumb')}<div class="mid">
      <a href="#/item/${l.id}" class="plain"><b>${esc(l.title)}</b></a><div class="small muted">${priceLabel(l)} · ${statusBadge(l) || '<span class="avail">Available</span>'} · ${ICON.heart} ${(l.likes || []).length}</div>
      <div class="acts">
        <a class="btn sm light" href="#/edit/${l.id}">Edit</a>
        ${l.status === 'available' ? `<button class="btn sm light" data-act="st-reserved" data-id="${l.id}">Mark reserved</button>` : ''}
        ${l.status === 'reserved' ? `<button class="btn sm light" data-act="st-available" data-id="${l.id}">Back to available</button>` : ''}
        ${l.status !== 'done' ? `<button class="btn sm light" data-act="st-done" data-id="${l.id}">Mark gone</button>` : ''}
        <button class="btn sm danger" data-act="st-delete" data-id="${l.id}">Delete</button>
      </div></div></div>`).join('');
  const others = db.users.filter((x) => x.id !== u.id && !x.deleted && (x.seed || x.emailConfirmed));
  return `${topbar('Me')}
  <div class="list-page">
    <a class="card seller link-card" href="#/user/${u.id}">${avatar(u, 'md')}<div style="flex:1;min-width:0"><b>${esc(u.name)}</b>
      <div class="small muted">${esc(uni(u.uni)?.nameJa)} · ${esc(campusOf(u)?.nameJa)}</div>
      <div class="seller-meta">${verifiedTag(u)} ${ratingHTML(u.id)}</div><div class="small link-text">View my profile</div></div><span class="chev">›</span></a>
    ${u.verified ? '' : '<a class="btn block" href="#/verify">Verify student card</a>'}
    <div class="quick-stats">
      <a href="#/user/${u.id}"><b>${mine.filter((l) => l.status !== 'done').length}</b><span>Listed</span></a>
      <a href="#/user/${u.id}"><b>${handoffCount(u.id)}</b><span>Hand-offs</span></a>
      <a href="#/likes"><b>${likedCount}</b><span>Liked</span></a>
      <a href="#/favorites"><b>${favsOf(u).items.length + favsOf(u).sellers.length}</b><span>Favorites</span></a>
    </div>
    <div class="card"><h3>My listings (${mine.length})</h3>${rows || '<p class="muted small">You haven\'t posted anything yet. <a href="#/post">Post an item</a></p>'}</div>
    <div class="card menu">
      <a href="#/favorites"><span>${ICON.bookmark} Favorites (items and sellers)</span><span>›</span></a>
      <a href="#/likes"><span>${ICON.heart} Liked items</span><span>›</span></a>
      <a href="#/profile"><span>${ICON.edit} Edit profile</span><span>›</span></a>
      <a href="#/settings"><span>${ICON.gear} Settings</span><span>›</span></a>
      <a href="#/safety"><span>${ICON.shield} Safety tips</span><span>›</span></a>
    </div>
    ${Backend.on ? (u.isAdmin ? `<div class="card menu"><h3>Admin</h3><a href="#/stats"><span>${ICON.chart} Test stats</span><span>›</span></a></div>` : '') : `<div class="card menu"><h3>Prototype tools</h3>
      <a href="#/stats"><span>${ICON.chart} Prototype stats (for your test)</span><span>›</span></a>
      ${others.map((x) => `<button data-act="login" data-id="${x.id}"><span>${ICON.swap} Switch to demo user: ${esc(x.name)}</span><span>›</span></button>`).join('')}
      <button data-act="reset" class="danger-text"><span>${ICON.x} Reset all demo data</span><span>›</span></button>
    </div>`}
  </div>`;
}

// ================= stats (what your 2-week test should measure) =================
function computeStats() {
  const ev = db.events;
  const count = (t) => ev.filter((e) => e.type === t).length;
  const handoffs = ev.filter((e) => e.type === 'handoff');
  const durations = handoffs.map((h) => { const l = listing(h.listingId); return l ? h.at - l.createdAt : null; }).filter((x) => x != null).sort((a, b) => a - b);
  const median = durations.length ? durations[Math.floor((durations.length - 1) / 2)] : null;
  const days = {};
  ev.forEach((e) => { if (e.userId) (days[e.userId] = days[e.userId] || new Set()).add(new Date(e.at).toDateString()); });
  const active = Object.keys(days).length;
  const returning = Object.values(days).filter((s) => s.size >= 2).length;
  const posted = count('listing_posted');
  return {
    signups: count('signup'), verified: count('verified'), posted,
    chats: count('chat_started'), meetups: count('meetup_accepted'), offers: count('offer_sent'),
    handoffs: handoffs.length, noshows: count('noshow'), reviews: count('review'), likes: count('like'), reports: count('report'),
    rate: posted ? Math.round((handoffs.filter((h) => !listing(h.listingId)?.seed).length / posted) * 100) + '%' : '–',
    median: fmtDuration(median), active, returning,
  };
}
function viewStats() {
  const s = computeStats();
  const box = (n, l) => `<div class="stat"><div class="n">${n}</div><div class="l">${l}</div></div>`;
  return `${topbar('Prototype stats', true)}
  <div class="pad stack">
    <p class="small muted">Counts real actions on this device (demo items are excluded from "posted"). In the real test these would come from everyone's phones.</p>
    <div class="stat-grid">
      ${box(s.posted, 'Listings posted')}${box(s.handoffs, 'Hand-offs completed')}
      ${box(s.rate, 'Posted items that were handed off')}${box(s.median, 'Median time: post → hand-off')}
      ${box(s.chats, 'Chats started')}${box(s.meetups, 'Meetups agreed')}
      ${box(s.offers, 'Price offers sent')}${box(s.likes, 'Likes')}
      ${box(s.noshows, 'No-shows reported')}${box(s.reviews, 'Reviews left')}
      ${box(s.returning + ' / ' + s.active, 'Students active on 2+ days')}${box(s.reports, 'Reports sent')}
      ${box(s.signups, 'Sign-ups')}${box(s.verified, 'Student cards verified')}
    </div>
    <button class="btn ghost block" data-act="export">Download event log (CSV)</button>
  </div>`;
}

// ================= actions =================
const otherParty = (t) => (me().id === t.buyerId ? t.sellerId : t.buyerId);
const ACTIONS = {
  back: () => history.length > 1 ? history.back() : go('#/home'),
  'home-top': () => { window.scrollTo({ top: 0, behavior: 'smooth' }); go('#/home'); },
  'ob-start': () => { ui.onboard.step = 'email'; ui.onboard.error = ''; render(); },
  'ob-demo': () => { ui.onboard.step = 'demo'; render(); },
  'ob-welcome': () => { ui.onboard.step = 'welcome'; render(); },
  'ob-back-email': () => { ui.onboard.step = 'email'; ui.onboard.error = ''; render(); },
  'ob-login': () => { ui.onboard.step = 'login'; ui.onboard.error = ''; render(); },
  'ob-resend': async () => {
    try { await Backend.sendCode(ui.onboard.email); toast('New code sent'); } catch (e) { toast(friendlyAuthError(e)); }
  },
  login: (el) => {
    db.currentUserId = el.dataset.id; save();
    ui.onboard.step = 'welcome';
    toast('You are now ' + me().name);
    go(el.dataset.back ? '#/' + el.dataset.back : '#/home');
  },
  logout: async () => {
    if (Backend.on) { await Backend.signOut(); db = emptyDb(); ui.onboard = { ...ui.onboard, step: 'welcome', error: '', busy: false }; return go('#/home'); }
    db.currentUserId = null; ui.onboard.step = 'welcome'; save(); go('#/home');
  },
  reset: () => {
    if (!confirm('Delete all demo data on this device and start fresh?')) return;
    localStorage.removeItem(KEY); db = seed(); ui.onboard.step = 'welcome'; go('#/home');
  },
  'delete-account': () => {
    if (!confirm('Delete your account? Your listings will be removed. This can\'t be undone.')) return;
    const u = me();
    u.deleted = true;
    db.listings.forEach((l) => { if (l.sellerId === u.id) l.status = 'deleted'; });
    logEvent('account_deleted');
    if (Backend.on) { save(); ACTIONS.logout(); return toast('Your account was deleted'); }
    db.currentUserId = null; ui.onboard.step = 'welcome'; save(); go('#/home');
    toast('Your account was deleted');
  },
  'skip-verify': () => go('#/home'),
  'f-type': (el) => { ui.filters.type = el.dataset.v; render(); },
  'f-cat': (el) => { ui.filters.cat = el.dataset.v; render(); },
  'f-campus': (el) => { ui.filters.campus = el.dataset.v; render(); },
  'f-hidegone': () => { ui.filters.hideGone = !ui.filters.hideGone; render(); },
  'set-lang': (el) => I18N.set(el.dataset.v),
  'skip-day': (el) => { const t = db.threads.find((x) => x.id === el.dataset.id); t.handedAt = (t.handedAt || now()) - RATE_DELAY; save(); render(); },
  'nick-random': (el) => { const i = el.closest('.nick-row').querySelector('input'); i.value = randomNickname(); i.focus(); },
  'price-toggle': () => { ui.priceOpen = !ui.priceOpen; render(); },
  'price-set': (el) => {
    const n = (v) => (v === '' || v == null ? null : Number(v));
    ui.filters.minPrice = n(el.dataset.min); ui.filters.maxPrice = n(el.dataset.max);
    if (el.dataset.close) { ui.searchOpen = false; ui.searchDraft = ''; ui.priceOpen = false; }
    render();
  },
  'price-custom': () => { ui.searchOpen = false; ui.searchDraft = ''; ui.priceOpen = true; render(); },
  'search-cancel': () => closeSearch(),
  'search-cat': (el) => applySearch(el.dataset.q != null ? el.dataset.q : ui.searchDraft, el.dataset.v),
  'search-run': (el) => applySearch(el.dataset.q != null ? el.dataset.q : ui.searchDraft, el.dataset.cat),
  'search-quick': (el) => {
    const f = ui.filters;
    if (el.dataset.v === 'free') f.type = 'free';
    if (el.dataset.v === 'under') { f.minPrice = null; f.maxPrice = 1000; }
    if (el.dataset.v === 'today') { f.today = true; f.sort = 'new'; }
    applySearch(ui.searchDraft);
  },
  'search-item': (el) => {
    addRecent(ui.searchDraft);
    ui.searchOpen = false; ui.searchDraft = '';
    go('#/item/' + el.dataset.id);
  },
  'recent-remove': (el) => { removeRecent(el.dataset.q); refreshSearchPanel(); },
  'recent-clear': () => { setRecent([]); refreshSearchPanel(); },
  'pill-clear': (el) => {
    const f = ui.filters;
    const v = el.dataset.v;
    if (v === 'q' || v === 'all') f.q = '';
    if (v === 'cat' || v === 'all') f.cat = 'all';
    if (v === 'type' || v === 'all') f.type = 'all';
    if (v === 'price' || v === 'maxPrice' || v === 'all') { f.minPrice = null; f.maxPrice = null; }
    if (v === 'today' || v === 'all') f.today = false;
    render();
  },
  'save-search': () => {
    const u = me();
    const q = ui.filters.q.trim();
    u.savedSearches = u.savedSearches || [];
    const existing = u.savedSearches.find((s) => s.q.toLowerCase() === q.toLowerCase());
    if (existing) { u.savedSearches = u.savedSearches.filter((s) => s !== existing); toast('Search removed'); }
    else { u.savedSearches.push({ id: uid('s_'), q, at: now() }); toast(`Saved. We'll tell you when "${q}" is posted`); logEvent('search_saved'); }
    save(); document.getElementById('grid').innerHTML = gridHTML(u);
  },
  'unsave-search': (el) => { const u = me(); u.savedSearches = (u.savedSearches || []).filter((s) => s.id !== el.dataset.id); save(); render(); },
  like: (el) => {
    const u = me();
    const l = listing(el.dataset.id);
    l.likes = l.likes || [];
    if (l.likes.includes(u.id)) { l.likes = l.likes.filter((x) => x !== u.id); }
    else {
      l.likes.push(u.id);
      notify(l.sellerId, `${u.name} liked your "${l.title}"`, { link: '#/item/' + l.id, listingId: l.id, kind: 'likes' });
      logEvent('like', { listingId: l.id });
      toast('Added to your likes');
    }
    save(); render();
  },
  'fav-item': (el) => {
    const u = me();
    const f = favsOf(u);
    const id = el.dataset.id;
    if (f.items.includes(id)) { f.items = f.items.filter((x) => x !== id); toast('Removed from favorites'); }
    else { f.items.push(id); logEvent('favorite_item', { listingId: id }); toast('Saved to favorites'); }
    u.favorites = f;
    save(); render();
  },
  'fav-seller': (el) => {
    const u = me();
    const f = favsOf(u);
    const id = el.dataset.id;
    const p = user(id);
    if (f.sellers.includes(id)) { f.sellers = f.sellers.filter((x) => x !== id); toast('Removed from favorites'); }
    else { f.sellers.push(id); logEvent('favorite_seller'); toast(`${firstName(p)} added to your favorite sellers`); }
    u.favorites = f;
    save(); render();
  },
  block: (el) => {
    const u = me();
    const p = user(el.dataset.id);
    u.blocked = u.blocked || [];
    if (u.blocked.includes(p.id)) { u.blocked = u.blocked.filter((x) => x !== p.id); toast(`${p.name} unblocked`); }
    else {
      if (!confirm(`Block ${p.name}? You won't see each other's items and can't message each other.`)) return;
      u.blocked.push(p.id); logEvent('block'); toast(`${p.name} blocked`);
    }
    save(); render();
  },
  'avatar-remove': () => { ui.draftAvatar = null; const keep = Object.fromEntries(new FormData($app.querySelector('form'))); render(); restoreForm(keep); },
  contact: (el) => {
    const u = me();
    if (!u.verified) return go('#/verify');
    const l = listing(el.dataset.id);
    if (isBlocked(u, user(l.sellerId))) return toast("You can't contact this student");
    let t = db.threads.find((x) => x.listingId === l.id && x.buyerId === u.id);
    if (!t) {
      t = { id: uid('t_'), listingId: l.id, buyerId: u.id, sellerId: l.sellerId, createdAt: now(), messages: [], outcome: null, meetup: null, agreedPrice: null };
      const first = l.type === 'free' ? `Hi! I'd love the "${l.title}" if it's still free.` : `Hi! Is the "${l.title}" still available?`;
      t.messages.push({ id: uid('m_'), from: u.id, kind: 'text', text: I18N.tr(first), at: now() });
      live({ kind: 'text', text: I18N.tr(first) }, t);
      db.threads.push(t);
      notify(l.sellerId, `${u.name} wants your "${l.title}"`, { link: '#/chat/' + t.id, listingId: l.id });
      logEvent('chat_started', { listingId: l.id, threadId: t.id });
      save();
    }
    go('#/chat/' + t.id);
  },
  quick: (el) => sendText(el.dataset.id, el.textContent.trim() || el.dataset.v),
  'meet-open': () => { ui.panel = 'meet'; render(); },
  'offer-open': () => { ui.panel = 'offer'; render(); },
  'panel-close': () => { ui.panel = null; render(); },
  'meet-send': (el) => {
    const f = el.closest('form');
    const t = db.threads.find((x) => x.id === el.dataset.id);
    if (!f.when.value) return toast('Pick a time');
    const u = me();
    t.messages.push({ id: uid('m_'), from: u.id, kind: 'meetup', when: f.when.value, place: f.place.value.trim(), status: 'pending', at: now() });
    notify(otherParty(t), `${u.name} proposed a meetup: ${fmtWhen(f.when.value)}`, { link: '#/chat/' + t.id, listingId: t.listingId });
    logEvent('meetup_proposed', { listingId: t.listingId, threadId: t.id });
    live({ kind: 'meetup', when: f.when.value, place: f.place.value.trim() }, t);
    ui.panel = null; save(); render();
  },
  'meet-accept': (el) => {
    const { t, m } = findMsg(el.dataset.id);
    const l = listing(t.listingId);
    if (l.status === 'done') return toast('This item is already gone');
    if (l.status === 'reserved' && l.reservedThread && l.reservedThread !== t.id) return toast('Already reserved for someone else');
    t.messages.forEach((x) => { if (x.kind === 'meetup' && x.status === 'accepted') x.status = 'declined'; });
    m.status = 'accepted';
    t.meetup = { when: m.when, place: m.place };
    l.status = 'reserved'; l.reservedThread = t.id;
    t.messages.push({ id: uid('m_'), kind: 'system', text: `Meetup agreed: ${fmtWhen(m.when)}${m.place ? ', ' + m.place : ''}. Item reserved.`, at: now() });
    notify(m.from, `${me().name} accepted your meetup for "${l.title}" · ${fmtWhen(m.when)}`, { link: '#/chat/' + t.id, listingId: l.id });
    db.threads.filter((x) => x.listingId === l.id && x.id !== t.id && !x.outcome)
      .forEach((x) => notify(x.buyerId, `"${l.title}" was reserved by someone else`, { link: '#/item/' + l.id, listingId: l.id }));
    logEvent('meetup_accepted', { listingId: l.id, threadId: t.id });
    live({ kind: 'accepted' }, t);
    save(); render();
  },
  'meet-decline': (el) => {
    const { t, m } = findMsg(el.dataset.id);
    m.status = 'declined';
    t.messages.push({ id: uid('m_'), kind: 'system', text: 'Proposal declined. Suggest another time?', at: now() });
    notify(m.from, `${me().name} can't make that time. Suggest another?`, { link: '#/chat/' + t.id, listingId: t.listingId });
    live({ kind: 'declined' }, t);
    save(); render();
  },
  'offer-send': (el) => {
    const f = el.closest('form');
    const t = db.threads.find((x) => x.id === el.dataset.id);
    const amount = Number(f.amount.value);
    const l = listing(t.listingId);
    if (!(amount > 0)) return toast('Enter an amount');
    if (amount >= l.price) return toast(`Offer less than ${yen(l.price)}, or just ask to buy`);
    t.messages.push({ id: uid('m_'), from: me().id, kind: 'offer', amount, status: 'pending', at: now() });
    notify(t.sellerId, `${me().name} offered ${yen(amount)} for "${l.title}"`, { link: '#/chat/' + t.id, listingId: l.id, icon: 'tag' });
    logEvent('offer_sent', { listingId: l.id, threadId: t.id });
    live({ kind: 'offer', amount }, t);
    ui.panel = null; save(); render();
  },
  'offer-accept': (el) => {
    const { t, m } = findMsg(el.dataset.id);
    m.status = 'accepted'; t.agreedPrice = m.amount;
    t.messages.push({ id: uid('m_'), kind: 'system', text: `Offer accepted: ${yen(m.amount)}. Now agree on a time to meet.`, at: now() });
    notify(t.buyerId, `${me().name} accepted your offer of ${yen(m.amount)}`, { link: '#/chat/' + t.id, listingId: t.listingId, icon: 'tag' });
    logEvent('offer_accepted', { listingId: t.listingId, threadId: t.id });
    live({ kind: 'offer-accepted' }, t);
    save(); render();
  },
  'offer-decline': (el) => {
    const { t, m } = findMsg(el.dataset.id);
    m.status = 'declined';
    t.messages.push({ id: uid('m_'), kind: 'system', text: 'Offer declined.', at: now() });
    notify(t.buyerId, `${me().name} declined your offer`, { link: '#/chat/' + t.id, listingId: t.listingId, icon: 'tag' });
    live({ kind: 'offer-declined' }, t);
    save(); render();
  },
  handed: (el) => {
    const t = db.threads.find((x) => x.id === el.dataset.id);
    const l = listing(t.listingId);
    t.outcome = 'handed'; t.handedAt = now();
    l.status = 'done'; l.doneAt = now(); l.receiverId = t.buyerId;
    t.messages.push({ id: uid('m_'), kind: 'system', text: `Hand-off confirmed by ${me().name}. Thanks for swapping on campus.`, at: now() });
    notify(otherParty(t), `Hand-off done: "${l.title}". You can rate ${me().name} from tomorrow.`, { link: '#/chat/' + t.id, listingId: l.id });
    logEvent('handoff', { listingId: l.id, threadId: t.id });
    live({ kind: 'handed' }, t);
    save(); render(); toast('Hand-off recorded');
  },
  noshow: (el) => {
    if (!confirm('Report that the other person did not show up?')) return;
    const t = db.threads.find((x) => x.id === el.dataset.id);
    const l = listing(t.listingId);
    t.outcome = 'noshow';
    t.noshowBy = otherParty(t);
    if (l.reservedThread === t.id && l.status === 'reserved') { l.status = 'available'; l.reservedThread = null; }
    t.messages.push({ id: uid('m_'), kind: 'system', text: `${me().name} reported a no-show. The item is available again.`, at: now() });
    notify(t.noshowBy, `${me().name} reported that you missed the meetup for "${l.title}"`, { link: '#/chat/' + t.id, listingId: l.id });
    logEvent('noshow', { listingId: l.id, threadId: t.id });
    save(); render();
  },
  'st-reserved': (el) => { listing(el.dataset.id).status = 'reserved'; save(); render(); },
  'st-available': (el) => { const l = listing(el.dataset.id); l.status = 'available'; l.reservedThread = null; save(); render(); },
  'st-done': (el) => { listing(el.dataset.id).status = 'done'; logEvent('marked_gone', { listingId: el.dataset.id }); save(); render(); },
  'st-delete': (el) => {
    if (!confirm('Delete this listing?')) return;
    listing(el.dataset.id).status = 'deleted'; logEvent('deleted', { listingId: el.dataset.id }); save(); render();
  },
  export: () => {
    const rows = [['time', 'event', 'user', 'listing', 'thread']].concat(db.events.map((e) => [new Date(e.at).toISOString(), e.type, user(e.userId)?.name || '', listing(e.listingId)?.title || '', e.threadId || '']));
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
    a.download = 'campus-marche-events.csv';
    a.click();
  },
};
function findMsg(mid) {
  for (const t of db.threads) { const m = t.messages.find((x) => x.id === mid); if (m) return { t, m }; }
  return {};
}
function sendText(tid, text) {
  text = (text || '').trim();
  if (!text) return;
  const t = db.threads.find((x) => x.id === tid);
  t.messages.push({ id: uid('m_'), from: me().id, kind: 'text', text, at: now() });
  live({ kind: 'text', text }, t);
  save(); render();
}

// ================= forms =================
const FORMS = {
  'ob-email': (f) => {
    const o = ui.onboard;
    o.name = f.name.value.trim(); o.email = f.email.value.trim().toLowerCase(); o.uni = f.uni.value; o.campus = f.campus.value;
    const rule = uni(o.uni).emailEnding;
    if (!(o.email.endsWith('@' + rule) || o.email.endsWith('.' + rule))) { o.error = `Please use your university email (ending in ${rule}).`; o.nickWarn = false; return render(); }
    // Soft warning: shown once; submitting the same nickname again keeps it
    if (looksLikeRealName(o.name, o.email) && o.nickWarnFor !== o.name) { o.nickWarn = true; o.nickWarnFor = o.name; o.error = ''; return render(); }
    o.nickWarn = false;
    if (Backend.on) return sendCodeFor(o, 'signup');
    const taken = db.users.find((u) => u.email === o.email && !u.seed && !u.deleted);
    if (taken) { db.currentUserId = taken.id; save(); toast('Welcome back, ' + taken.name); return go('#/home'); }
    o.code = String(Math.floor(100000 + Math.random() * 900000));
    o.error = ''; o.step = 'code'; render();
  },
  'ob-login': (f) => {
    const o = ui.onboard;
    o.email = f.email.value.trim().toLowerCase(); o.name = '';
    return sendCodeFor(o, 'login');
  },
  'ob-code': (f) => {
    const o = ui.onboard;
    if (Backend.on) return verifyCodeFor(o, f.code.value.trim());
    if (f.code.value.trim() !== o.code) { o.error = 'That code is not right. Try again.'; return render(); }
    const u = { id: uid('u_'), name: o.name, email: o.email, uni: o.uni, campus: o.campus, bio: '', photo: null, verified: false, emailConfirmed: true, joined: now(), blocked: [], savedSearches: [] };
    db.users.push(u);
    // Demo students join your university; Mai & Leo move to your campus, Yuki stays on another one
    const otherCampus = uni(u.uni).campuses.find((c) => c.id !== u.campus).id;
    db.users.filter((x) => x.seed).forEach((x) => { x.uni = u.uni; x.campus = x.id === 'u_yuki' ? otherCampus : u.campus; });
    db.currentUserId = u.id;
    const near = db.listings.filter((l) => campusOf(user(l.sellerId))?.id === u.campus && l.status === 'available').length;
    notify(u.id, `Welcome to ${CONFIG.appName}! ${near} items are up for grabs on your campus right now.`, { link: '#/home', icon: 'home', kind: 'account' });
    logEvent('signup');
    o.step = 'welcome'; o.error = '';
    save();
    go('#/verify/first');
  },
  verify: async (f) => {
    const u = me();
    if (Backend.on) {
      const btn = f.querySelector('button.btn'); btn.disabled = true; btn.textContent = 'Uploading…';
      try {
        await Backend.uploadCard(ui.cardPreview);
        ui.cardPreview = null;
        u.verificationStatus = 'pending';
        logEvent('verification_submitted'); save(); await Backend.flush();
        toast("Sent! We'll check your card soon");
        return go('#/verify');
      } catch (e) { btn.disabled = false; btn.textContent = 'Submit for check'; return toast('Upload failed: ' + (e.message || e)); }
    }
    u.verified = true; u.verifiedAt = now();
    ui.cardPreview = null; // never stored
    notify(u.id, 'Your student card is verified. You can post and message now.', { link: '#/me', icon: 'check', kind: 'account' });
    logEvent('verified'); save();
    toast('Student card verified');
    go('#/home');
  },
  post: (f) => {
    const u = me();
    const type = f.type.value;
    const price = type === 'sell' ? Number(f.price.value) : 0;
    if (type === 'sell' && !(price > 0)) return toast('Add a price, or choose "Give away"');
    const fields = { title: f.title.value.trim(), category: f.category.value, type, price, condition: f.condition.value, times: f.times.value.trim(), desc: f.desc.value.trim(), photo: ui.draftPhoto };

    if (f.dataset.id) { // editing
      const l = listing(f.dataset.id);
      const oldPrice = l.type === 'free' ? 0 : l.price;
      Object.assign(l, fields, { editedAt: now() });
      const newPrice = type === 'free' ? 0 : price;
      if (newPrice < oldPrice) {
        // Everyone who liked it, plus (demo mode) everyone who saved it to favorites, told once each.
        // With the real backend, favorites are private, so the server tells favoriters (see schema.sql).
        const favers = Backend.on ? [] : db.users.filter((x) => favsOf(x).items.includes(l.id)).map((x) => x.id);
        [...new Set([...(l.likes || []), ...favers])].forEach((x) => notify(x, `Price drop: "${l.title}" is now ${priceLabel(l)} (was ${yen(oldPrice)})`, { link: '#/item/' + l.id, listingId: l.id, kind: 'price', icon: 'tag' }));
        logEvent('price_drop', { listingId: l.id });
      }
      ui.draftPhoto = null; ui.editingId = null;
      save(); toast('Changes saved'); return go('#/item/' + l.id);
    }

    const l = { id: uid('l_'), sellerId: u.id, ...fields, bg: '#eef2fb', status: 'available', createdAt: now(), likes: [], viewers: [] };
    db.listings.push(l);
    // Saved-search matches get a specific alert; everyone else on the campus gets "new on your campus".
    // With the real backend this happens on the server, so nobody sees other people's saved searches.
    if (!Backend.on) db.users.filter((x) => x.id !== u.id && !x.deleted && x.uni === u.uni && !isBlocked(u, x)).forEach((x) => {
      const hit = (x.savedSearches || []).find((s) => matches(l, s.q));
      // Favorite seller beats saved search beats campus, so nobody gets two alerts for one item
      if (favsOf(x).sellers.includes(u.id)) notify(x.id, `${u.name} (a favorite seller) posted: ${l.title} · ${priceLabel(l)}`, { link: '#/item/' + l.id, listingId: l.id, kind: 'favorites' });
      else if (hit) notify(x.id, `Saved search "${hit.q}": ${l.title} · ${priceLabel(l)}`, { link: '#/item/' + l.id, listingId: l.id, kind: 'saved' });
      else if (campusOf(x)?.id === campusOf(u)?.id) notify(x.id, `New on your campus: ${l.title} · ${priceLabel(l)}`, { link: '#/item/' + l.id, listingId: l.id, kind: 'campus' });
    });
    logEvent('listing_posted', { listingId: l.id });
    live((L) => L.onListing(l));
    ui.draftPhoto = null;
    save();
    toast('Posted! Other students can see it now');
    go('#/item/' + l.id);
  },
  msg: (f) => sendText(f.dataset.id, f.text.value),
  price: (f) => {
    let min = f.min.value === '' ? null : Math.max(0, Number(f.min.value));
    let max = f.max.value === '' ? null : Math.max(0, Number(f.max.value));
    if (min != null && max != null && min > max) [min, max] = [max, min]; // typed the wrong way round
    ui.filters.minPrice = min || null; ui.filters.maxPrice = max;
    render();
  },
  review: (f, submitter) => {
    const t = db.threads.find((x) => x.id === f.dataset.id);
    const to = otherParty(t);
    const picked = f.querySelector('input[name="stars"]:checked');
    if (!canRateNow(t)) return toast('Ratings open 1 day after the hand-off');
    if (!picked) return toast('Tap a star to rate (1 to 5)');
    const rating = Math.min(5, Math.max(1, Number(picked.value)));
    if (db.reviews.some((r) => r.threadId === t.id && r.from === me().id)) return toast('You already rated this hand-off');
    db.reviews.push({ id: uid('r_'), from: me().id, to, threadId: t.id, listingId: t.listingId, rating, comment: f.comment.value.trim(), at: now() });
    notify(to, `${firstName(me())} rated you ★${rating}${f.comment.value.trim() ? ': "' + f.comment.value.trim().slice(0, 60) + '"' : ''}`, { link: '#/user/' + to, icon: 'check' });
    logEvent('review', { threadId: t.id, rating });
    save(); render(); toast('Thanks for rating!');
  },
  profile: (f) => {
    const u = me();
    const nick = f.name.value.trim() || u.name;
    if (looksLikeRealName(nick, u.email) && ui.nickWarnFor !== nick) { ui.nickWarnFor = nick; return toast('That looks like a real name. Use a nickname for your safety, or tap Save again to keep it.'); }
    u.name = nick;
    u.campus = f.campus.value;
    u.bio = f.bio.value.trim();
    if (ui.draftAvatar !== undefined) u.photo = ui.draftAvatar;
    ui.draftAvatar = undefined;
    logEvent('profile_edited');
    save(); toast('Profile saved'); go('#/user/' + u.id);
  },
  report: (f) => {
    db.reports.push({ id: uid('rp_'), from: me().id, kind: f.dataset.kind, targetId: f.dataset.id, reason: f.reason.value, note: f.note.value.trim(), at: now() });
    logEvent('report', { listingId: f.dataset.kind === 'listing' ? f.dataset.id : undefined });
    save(); toast("Thanks. We'll look into it."); history.back();
  },
};

// ================= image handling =================
function resizeImage(file, max = 720) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ================= event wiring =================
$app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el); }
});
$app.addEventListener('submit', (e) => {
  const fn = FORMS[e.target.dataset.form];
  if (fn) { e.preventDefault(); fn(e.target, e.submitter); }
});
$app.addEventListener('input', (e) => {
  if (e.target.dataset.input === 'search') {
    if (ui.searchOpen) { ui.searchDraft = e.target.value; refreshSearchPanel(); return; } // suggestions only; Enter applies
    ui.filters.q = e.target.value;
    document.getElementById('grid').innerHTML = gridHTML(me());
  }
});
// Tapping the search bar opens the search panel (categories, quick filters, recent searches)
$app.addEventListener('focusin', (e) => {
  if (e.target.dataset && e.target.dataset.input === 'search' && !ui.searchOpen) openSearch(e.target);
});
$app.addEventListener('keydown', (e) => {
  if (!e.target.dataset || e.target.dataset.input !== 'search') return;
  if (e.isComposing || e.keyCode === 229) return; // Japanese IME: Enter confirms the kanji, not the search
  if (e.key === 'Enter') { e.preventDefault(); applySearch(e.target.value); }
  if (e.key === 'Escape') { e.preventDefault(); closeSearch(); }
});
// Price slider: dragging updates the labels and preview count; letting go applies the filter
function readSlider() {
  const box = $app.querySelector('.range');
  if (!box) return null;
  const top = Number(box.dataset.top);
  const loEl = box.querySelector('[data-range="lo"]');
  const hiEl = box.querySelector('[data-range="hi"]');
  let lo = Number(loEl.value), hi = Number(hiEl.value);
  if (lo > hi) { if (document.activeElement === loEl) { lo = hi; loEl.value = lo; } else { hi = lo; hiEl.value = hi; } }
  return { top, lo, hi };
}
$app.addEventListener('input', (e) => {
  if (!e.target.dataset || !e.target.dataset.range) return;
  const s = readSlider();
  if (!s) return;
  $app.querySelector('.range .fill').style.cssText = `left:${(s.lo / s.top) * 100}%;right:${100 - (s.hi / s.top) * 100}%`;
  document.getElementById('ps-lo').textContent = yen(s.lo);
  document.getElementById('ps-hi').textContent = s.hi >= s.top ? yen(s.top) + '+' : yen(s.hi);
  const max = s.hi >= s.top ? null : s.hi;
  const n = visibleListings(me(), { ignorePrice: true }).filter((l) => l.status !== 'done' && inRange(priceOf(l), s.lo || null, max)).length;
  document.getElementById('ps-preview').textContent = `${n} item${n === 1 ? '' : 's'} in this range`;
});
$app.addEventListener('change', (e) => {
  if (!e.target.dataset || !e.target.dataset.range) return;
  const s = readSlider();
  if (!s) return;
  ui.filters.minPrice = s.lo > 0 ? s.lo : null;
  ui.filters.maxPrice = s.hi >= s.top ? null : s.hi;
  const y = window.scrollY; render(); window.scrollTo(0, y);
});
// Leaving Home (e.g. bottom nav) closes the search panel
window.addEventListener('hashchange', () => { ui.searchOpen = false; ui.searchDraft = ''; });
$app.addEventListener('change', async (e) => {
  const kind = e.target.dataset.change;
  if (kind === 'type') document.getElementById('price-field').style.display = e.target.value === 'sell' ? '' : 'none';
  if (kind === 'sort') { ui.filters.sort = e.target.value; render(); }
  if (kind === 'notify') {
    const u = me();
    u.settings = settingsOf(u);
    u.settings.notify[e.target.dataset.k] = e.target.checked;
    save(); toast(e.target.checked ? 'Notifications on' : 'Notifications off');
  }
  if ((kind === 'photo' || kind === 'card' || kind === 'avatar') && e.target.files[0]) {
    const form = e.target.closest('form');
    const keep = form ? Object.fromEntries(new FormData(form)) : {};
    try {
      const data = await resizeImage(e.target.files[0], kind === 'card' ? 900 : kind === 'avatar' ? 320 : 720);
      if (kind === 'photo') ui.draftPhoto = data; else if (kind === 'avatar') ui.draftAvatar = data; else ui.cardPreview = data;
      render();
      restoreForm(keep);
    } catch (err) { toast('Could not read that image'); }
  }
});
function restoreForm(values, form = $app.querySelector('form')) {
  if (!form) return;
  for (const [k, v] of Object.entries(values)) {
    form.querySelectorAll(`[name="${k}"]`).forEach((el) => {
      if (el.type === 'file') return;
      if (el.type === 'radio') el.checked = el.value === v;
      else if (el.type === 'checkbox') el.checked = true;
      else el.value = v;
    });
  }
  const type = form.querySelector('[name="type"]:checked');
  const pf = document.getElementById('price-field');
  if (type && pf) pf.style.display = type.value === 'sell' ? '' : 'none';
}

// ================= backend helpers =================
function friendlyAuthError(e) {
  const m = (e && (e.message || e.error_description)) || String(e);
  if (/rate limit|too many/i.test(m)) return 'Too many emails sent. Please wait a few minutes and try again.';
  if (/database error saving new user|university email/i.test(m)) return 'Please use your University of Hyogo email (ending in u-hyogo.ac.jp).';
  if (/expired|invalid/i.test(m)) return 'That code is wrong or has expired. Try again or send a new code.';
  if (/signups not allowed/i.test(m)) return 'No account found for that email. Sign up first.';
  return m;
}
async function sendCodeFor(o, mode) {
  o.mode = mode; o.busy = true; o.error = ''; render();
  try { await Backend.sendCode(o.email); o.step = 'code'; }
  catch (e) { o.error = friendlyAuthError(e); }
  o.busy = false; render();
}
async function verifyCodeFor(o, code) {
  o.busy = true; o.error = ''; render();
  try {
    await Backend.verifyCode(o.email, code);
    const isNew = await Backend.afterLogin({ name: o.name, uni: o.uni, campus: o.campus });
    o.busy = false; o.step = 'welcome';
    const u = me();
    if (isNew) {
      notify(u.id, `Welcome to ${CONFIG.appName}! Verify your student card to start posting and messaging.`, { link: '#/verify', icon: 'home', kind: 'account' });
      logEvent('signup'); save();
    }
    toast(isNew ? 'Account created' : 'Welcome back, ' + firstName(u));
    go(isNew || (!u.verified && u.verificationStatus !== 'pending') ? '#/verify/first' : '#/home');
  } catch (e) { o.busy = false; o.error = friendlyAuthError(e); render(); }
}

// Re-draw after live updates without losing what someone is typing
function safeRender() {
  if (!me()) return render();
  const forms = [...$app.querySelectorAll('form[data-form]')].map((f) => [f.dataset.form, Object.fromEntries(new FormData(f))]);
  const a = document.activeElement;
  const focus = a && a.name && a.form ? { form: a.form.dataset.form, name: a.name, start: a.selectionStart, end: a.selectionEnd } : null;
  const searchFocused = a && a.dataset && a.dataset.input === 'search';
  const y = window.scrollY;
  const nearBottom = window.innerHeight + y >= document.body.scrollHeight - 120;
  render();
  forms.forEach(([name, vals]) => { const f = $app.querySelector(`form[data-form="${name}"]`); if (f) restoreForm(vals, f); });
  if (focus) {
    const el = $app.querySelector(`form[data-form="${focus.form}"] [name="${focus.name}"]`);
    if (el) { el.focus(); try { el.setSelectionRange(focus.start, focus.end); } catch (e) { /* not a text field */ } }
  }
  if (searchFocused) { const sIn = $app.querySelector('[data-input="search"]'); if (sIn) { sIn.focus(); sIn.setSelectionRange(sIn.value.length, sIn.value.length); } }
  const route = (location.hash || '#/home').split('/')[1] || 'home';
  if (route !== 'chat' || !nearBottom) window.scrollTo(0, y);
}
window.onBackendUpdate = safeRender;

async function boot() {
  if (!Backend.on) return render();
  $app.innerHTML = `<div class="welcome"><div class="welcome-main center">${logoHTML()}<p class="muted small">Loading…</p></div></div>`;
  try { await Backend.start(); }
  catch (e) { console.error(e); toast('Could not connect: ' + (e.message || e)); }
  render();
}
boot();
