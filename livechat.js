'use strict';
/* Campus マルシェ — live chat with bot students (demo mode).
   If the app is opened from the mini chat server (node server/server.js → http://localhost:3458),
   messages to the demo students go to the server, and their replies come back live:
   "read", "typing…", the message itself, and actions like accepting your meetup.
   Opened any other way (e.g. the normal preview), this file does nothing. */

const Live = (() => {
  let on = false;
  const isBot = (id) => !!user(id)?.seed;

  // Run app code as the bot student (so "accept meetup" etc. use the normal app rules)
  function asUser(id, fn) {
    const real = db.currentUserId;
    db.currentUserId = id;
    try { fn(); } finally { db.currentUserId = real; }
    save();
    safeRender();
  }
  const threadById = (id) => db.threads.find((t) => t.id === id);
  const inChat = (t) => (location.hash || '').startsWith('#/chat/' + t.id);
  const lastPending = (t, kind, fromNot) => [...t.messages].reverse().find((m) => m.kind === kind && m.status === 'pending' && m.from !== fromNot);

  async function post(path, body) {
    try { await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
    catch (e) { console.warn('[live] server not reachable', e); }
  }

  // Called by the app after the student does something in a chat with a bot
  function onSend(t, payload) {
    if (!on || !t) return;
    const meId = db.currentUserId;
    if (isBot(meId)) return; // the bot itself is acting
    const otherId = t.buyerId === meId ? t.sellerId : t.buyerId;
    if (!isBot(otherId)) return;
    const l = listing(t.listingId) || {};
    post('/api/chat', {
      threadId: t.id, botId: otherId, role: t.sellerId === otherId ? 'seller' : 'buyer', uiLang: I18N.lang,
      listing: { id: l.id, title: l.title, price: l.price, type: l.type },
      state: { hasMeetup: !!t.meetup, outcome: t.outcome || null, agreedPrice: t.agreedPrice ?? null },
      ...payload,
    });
  }
  // Called by the app after the student posts something: a bot student may get interested
  function onListing(l) {
    if (!on) return;
    const seller = user(l.sellerId);
    post('/api/listing', {
      listing: { id: l.id, title: l.title, price: l.price, type: l.type }, sellerId: l.sellerId, campus: seller?.campus, uiLang: I18N.lang,
      bots: db.users.filter((u) => u.seed && !u.deleted).map((u) => ({ id: u.id, campus: u.campus })),
    });
  }

  function handle(ev) {
    const me0 = me();
    if (!me0) return;
    if (ev.type === 'interest') {
      const l = listing(ev.listingId);
      if (!l || l.sellerId !== me0.id || db.threads.some((x) => x.listingId === l.id && x.buyerId === ev.from)) return;
      const t = { id: uid('t_'), listingId: l.id, buyerId: ev.from, sellerId: me0.id, createdAt: now(), messages: [], outcome: null, meetup: null, agreedPrice: null };
      t.messages.push({ id: uid('m_'), from: ev.from, kind: 'text', text: ev.text, at: now() });
      db.threads.push(t);
      asUser(ev.from, () => notify(me0.id, `${user(ev.from).name} wants your "${l.title}"`, { link: '#/chat/' + t.id, listingId: l.id }));
      toast(`${user(ev.from).name}: ${ev.text}`);
      return;
    }
    const t = threadById(ev.threadId);
    if (!t) return;
    ui.typing = ui.typing || {};
    if (ev.type === 'read') { t.readAt = now(); save(); if (inChat(t)) safeRender(); return; }
    if (ev.type === 'typing') { ui.typing[t.id] = ev.on; if (inChat(t)) safeRender(); return; }
    if (ev.type === 'message') {
      ui.typing[t.id] = false;
      asUser(ev.from, () => t.messages.push({ id: uid('m_'), from: ev.from, kind: 'text', text: ev.text, at: now() }));
      if (!inChat(t)) toast(`${user(ev.from).name}: ${ev.text}`);
      return;
    }
    if (ev.type === 'action') {
      const bot = ev.from;
      if (ev.action === 'accept-meetup') { const m = lastPending(t, 'meetup', bot); if (m) asUser(bot, () => ACTIONS['meet-accept']({ dataset: { id: m.id } })); }
      if (ev.action === 'accept-offer') { const m = lastPending(t, 'offer', bot); if (m) asUser(bot, () => ACTIONS['offer-accept']({ dataset: { id: m.id } })); }
      if (ev.action === 'decline-offer') { const m = lastPending(t, 'offer', bot); if (m) asUser(bot, () => ACTIONS['offer-decline']({ dataset: { id: m.id } })); }
      if (ev.action === 'propose-meetup') {
        asUser(bot, () => {
          t.messages.push({ id: uid('m_'), from: bot, kind: 'meetup', when: ev.when, place: ev.place || '', status: 'pending', at: now() });
          notify(me0.id, `${user(bot).name} proposed a meetup: ${fmtWhen(ev.when)}`, { link: '#/chat/' + t.id, listingId: t.listingId });
        });
      }
      if (ev.action === 'offer') {
        const l = listing(t.listingId);
        asUser(bot, () => {
          t.messages.push({ id: uid('m_'), from: bot, kind: 'offer', amount: ev.amount, status: 'pending', at: now() });
          notify(me0.id, `${user(bot).name} offered ${yen(ev.amount)} for "${l?.title}"`, { link: '#/chat/' + t.id, listingId: t.listingId, icon: 'tag' });
        });
      }
    }
  }

  async function init() {
    if (Backend.on) return; // the real backend has real students instead
    try {
      const r = await fetch('/api/health', { cache: 'no-store' });
      if (!r.ok) return;
      const es = new EventSource('/api/events');
      es.onmessage = (e) => { try { handle(JSON.parse(e.data)); } catch (err) { console.error('[live]', err); } };
      es.onopen = () => { on = true; Live.on = true; safeRender(); };
      es.onerror = () => { on = false; Live.on = false; };
    } catch (e) { /* no server: normal demo mode */ }
  }
  init();
  return { on: false, onSend, onListing, isBot };
})();
