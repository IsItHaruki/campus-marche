'use strict';
/* Campus マルシェ — backend layer (Supabase).
   If config.js has no Supabase keys, Backend.on is false and the app runs in demo mode (localStorage).

   How it works: the app keeps working on its in-memory `db` object, exactly like demo mode.
   After every change the app calls save(); here we compare `db` with the last copy we got from
   the server and send only the rows that changed. Live updates from other students reload `db`. */

const Backend = (() => {
  const cfg = window.CAMPUS_CONFIG || {};
  const on = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const sb = on ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  let session = null;
  let snapshot = null;
  let chain = Promise.resolve();
  let reloadTimer = null;
  let channel = null;
  let poll = null;

  // ---------- row mappers (app object <-> database row) ----------
  const T = {
    profiles: { key: ['id'] },
    user_settings: { key: ['user_id'] },
    saved_searches: { key: ['id'] },
    blocks: { key: ['blocker', 'blocked'] },
    listings: { key: ['id'] },
    likes: { key: ['listing_id', 'user_id'] },
    favorites: { key: ['user_id', 'kind', 'target_id'] }, // private bookmarks of items and sellers
    views: { key: ['listing_id', 'user_id'] },
    threads: { key: ['id'] },
    messages: { key: ['id'] },
    notifications: { key: ['id'] },
    reviews: { key: ['id'] },
    reports: { key: ['id'] },
    events: { key: ['id'] },
  };
  const ORDER = Object.keys(T);                                   // write order (parents before children)
  const DELETABLE = new Set(['saved_searches', 'blocks', 'likes', 'favorites']); // rows removed in the app get deleted
  const UPSERT = new Set(['profiles', 'user_settings']);          // own single rows

  const toProfile = (u) => ({
    id: u.id, uni: u.uni, campus: u.campus, name: u.name || '', bio: u.bio || '',
    photo: u.photo || null, verification_status: u.verificationStatus || 'none', deleted: !!u.deleted,
  });
  const fromProfile = (r) => ({
    id: r.id, uni: r.uni, campus: r.campus, name: r.name, bio: r.bio, photo: r.photo,
    verified: r.verified, verificationStatus: r.verification_status, isAdmin: r.is_admin, deleted: r.deleted,
    seedHandoffs: r.seed_handoffs, joined: r.joined, blocked: [],
  });
  const toListing = (l) => ({
    id: l.id, seller_id: l.sellerId, uni: l.uni || user(l.sellerId)?.uni || CONFIG.universities[0].id, title: l.title, category: l.category,
    type: l.type, price: l.price || 0, condition: l.condition || null, times: l.times || null, description: l.desc || null,
    photo: l.photo || null, bg: l.bg || null, status: l.status, reserved_thread: l.reservedThread || null,
    created_at: l.createdAt, edited_at: l.editedAt || null, done_at: l.doneAt || null, receiver_id: l.receiverId || null,
  });
  const fromListing = (r) => ({
    id: r.id, sellerId: r.seller_id, uni: r.uni, title: r.title, category: r.category, type: r.type, price: r.price,
    condition: r.condition, times: r.times || '', desc: r.description || '', photo: r.photo, bg: r.bg, status: r.status,
    reservedThread: r.reserved_thread, createdAt: r.created_at, editedAt: r.edited_at, doneAt: r.done_at, receiverId: r.receiver_id,
    likes: [], viewers: [],
  });
  const toThread = (t) => ({
    id: t.id, listing_id: t.listingId, buyer_id: t.buyerId, seller_id: t.sellerId, created_at: t.createdAt,
    outcome: t.outcome || null, meetup: t.meetup || null, agreed_price: t.agreedPrice ?? null, noshow_by: t.noshowBy || null, handed_at: t.handedAt || null,
  });
  const fromThread = (r) => ({
    id: r.id, listingId: r.listing_id, buyerId: r.buyer_id, sellerId: r.seller_id, createdAt: r.created_at,
    outcome: r.outcome, meetup: r.meetup, agreedPrice: r.agreed_price, noshowBy: r.noshow_by, handedAt: r.handed_at, messages: [],
  });
  const toMsg = (m, threadId) => ({
    id: m.id, thread_id: threadId, from_id: m.from || null, kind: m.kind, text: m.text ?? null, amount: m.amount ?? null,
    when_at: m.when ?? null, place: m.place ?? null, status: m.status ?? null, at: m.at,
  });
  const fromMsg = (r) => {
    const m = { id: r.id, kind: r.kind, at: r.at };
    if (r.from_id) m.from = r.from_id;
    if (r.text != null) m.text = r.text;
    if (r.amount != null) m.amount = r.amount;
    if (r.when_at != null) m.when = r.when_at;
    if (r.place != null) m.place = r.place;
    if (r.status != null) m.status = r.status;
    return m;
  };
  const toNotif = (n) => ({ id: n.id, user_id: n.userId, text: n.text, link: n.link || null, listing_id: n.listingId || null, icon: n.icon || null, kind: n.kind || null, at: n.at, read: !!n.read });
  const fromNotif = (r) => ({ id: r.id, userId: r.user_id, text: r.text, link: r.link, listingId: r.listing_id, icon: r.icon || 'bell', kind: r.kind, at: r.at, read: r.read });
  const toReview = (r) => ({ id: r.id, from_id: r.from, to_id: r.to, thread_id: r.threadId || null, listing_id: r.listingId || null, rating: Number(r.rating), comment: r.comment || null, at: r.at });
  const fromReview = (r) => ({ id: r.id, from: r.from_id, to: r.to_id, threadId: r.thread_id, listingId: r.listing_id, rating: Number(r.rating), comment: r.comment, at: r.at });
  const toReport = (r) => ({ id: r.id, from_id: r.from, kind: r.kind, target_id: r.targetId, reason: r.reason || null, note: r.note || null, at: r.at });
  const toEvent = (e) => ({ id: e.id, type: e.type, at: e.at, user_id: e.userId || null, listing_id: e.listingId || null, thread_id: e.threadId || null });
  const fromEvent = (r) => ({ id: r.id, type: r.type, at: r.at, userId: r.user_id, listingId: r.listing_id, threadId: r.thread_id });

  // Turn the app's db into table rows, keyed by primary key.
  function currentRows() {
    const R = Object.fromEntries(ORDER.map((t) => [t, new Map()]));
    const put = (table, row) => R[table].set(T[table].key.map((c) => row[c]).join('|'), row);
    const id = db.currentUserId;
    const u = id && user(id);
    if (u) {
      put('profiles', toProfile(u));
      put('user_settings', { user_id: id, notify: settingsOf(u).notify });
      (u.savedSearches || []).forEach((s) => put('saved_searches', { id: s.id, user_id: id, q: s.q, at: s.at || 0 }));
      (u.blocked || []).forEach((b) => put('blocks', { blocker: id, blocked: b }));
      // "at" is left out on purpose: the row only changes when it's added or removed
      (u.favorites?.items || []).forEach((t) => put('favorites', { user_id: id, kind: 'item', target_id: t }));
      (u.favorites?.sellers || []).forEach((t) => put('favorites', { user_id: id, kind: 'seller', target_id: t }));
    }
    db.listings.forEach((l) => {
      put('listings', toListing(l));
      if ((l.likes || []).includes(id)) put('likes', { listing_id: l.id, user_id: id });
      if ((l.viewers || []).includes(id)) put('views', { listing_id: l.id, user_id: id });
    });
    db.threads.forEach((t) => { put('threads', toThread(t)); t.messages.forEach((m) => put('messages', toMsg(m, t.id))); });
    db.notifications.forEach((n) => put('notifications', toNotif(n)));
    db.reviews.forEach((r) => put('reviews', toReview(r)));
    db.reports.forEach((r) => put('reports', toReport(r)));
    db.events.forEach((e) => put('events', toEvent(e)));
    return R;
  }

  // ---------- load everything this student is allowed to see ----------
  async function loadAll() {
    const id = session.user.id;
    const q = (t) => sb.from(t).select('*');
    const res = await Promise.all([
      q('profiles'), q('listings'), q('likes'), q('views'), q('threads'), q('messages').order('at'),
      q('notifications').eq('user_id', id).order('at', { ascending: false }).limit(300),
      q('reviews'), q('blocks'), q('user_settings').eq('user_id', id), q('saved_searches').eq('user_id', id),
      q('events').limit(5000), // only admins get rows back
      q('favorites').eq('user_id', id), // private: only your own
    ]);
    const bad = res.find((r) => r.error);
    if (bad) throw bad.error;
    const [profiles, listings, likes, views, threads, messages, notifs, reviews, blocks, settings, saved, events, favs] = res.map((r) => r.data || []);

    const users = profiles.map(fromProfile);
    const byId = Object.fromEntries(users.map((u) => [u.id, u]));
    blocks.forEach((b) => byId[b.blocker]?.blocked.push(b.blocked));
    const mine = byId[id];
    if (mine) {
      mine.email = session.user.email;
      mine.emailConfirmed = true;
      if (settings[0]) mine.settings = { notify: settings[0].notify || {} };
      mine.savedSearches = saved.map((s) => ({ id: s.id, q: s.q, at: s.at }));
      const byAt = (a, b) => (a.at || 0) - (b.at || 0);
      mine.favorites = {
        items: favs.filter((f) => f.kind === 'item').sort(byAt).map((f) => f.target_id),
        sellers: favs.filter((f) => f.kind === 'seller').sort(byAt).map((f) => f.target_id),
      };
    }
    const ls = listings.map(fromListing);
    const lById = Object.fromEntries(ls.map((l) => [l.id, l]));
    likes.forEach((x) => lById[x.listing_id]?.likes.push(x.user_id));
    views.forEach((x) => lById[x.listing_id]?.viewers.push(x.user_id));
    const ths = threads.map(fromThread);
    const tById = Object.fromEntries(ths.map((t) => [t.id, t]));
    messages.forEach((m) => tById[m.thread_id]?.messages.push(fromMsg(m)));

    db = {
      version: 7, currentUserId: id, users, listings: ls, threads: ths,
      notifications: notifs.map(fromNotif), reviews: reviews.map(fromReview), reports: [], events: events.map(fromEvent),
    };
    snapshot = currentRows();
  }

  // ---------- send changes ----------
  async function upload(bucket, dataUrl) {
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await sb.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    return bucket === 'photos' ? sb.storage.from(bucket).getPublicUrl(path).data.publicUrl : path;
  }
  async function uploadPendingPhotos() {
    const id = session.user.id;
    for (const l of db.listings) if (l.sellerId === id && typeof l.photo === 'string' && l.photo.startsWith('data:')) l.photo = await upload('photos', l.photo);
    const u = user(id);
    if (u && typeof u.photo === 'string' && u.photo.startsWith('data:')) u.photo = await upload('photos', u.photo);
  }
  async function writeRow(table, row, exists) {
    let res;
    if (table === 'listings' && row.seller_id !== session.user.id) {
      // Not my listing: I can only change its status (meetup accepted, handed off, no-show)
      res = await sb.rpc('set_listing_status', { p_id: row.id, p_status: row.status, p_reserved_thread: row.reserved_thread, p_done_at: row.done_at, p_receiver: row.receiver_id });
    } else if (UPSERT.has(table)) {
      res = await sb.from(table).upsert(row);
    } else if (!exists) {
      res = await sb.from(table).insert(row);
    } else {
      let qq = sb.from(table).update(row);
      T[table].key.forEach((c) => { qq = qq.eq(c, row[c]); });
      res = await qq;
    }
    if (res.error && res.error.code !== '23505') throw res.error; // 23505 = already exists, fine
  }
  async function deleteRow(table, row) {
    let qq = sb.from(table).delete();
    T[table].key.forEach((c) => { qq = qq.eq(c, row[c]); });
    const { error } = await qq;
    if (error) throw error;
  }
  async function doSync() {
    if (!session || !snapshot) return;
    await uploadPendingPhotos();
    const cur = currentRows();
    for (const table of ORDER) {
      const before = snapshot[table];
      for (const [k, row] of cur[table]) {
        const prev = before.get(k);
        if (prev && JSON.stringify(prev) === JSON.stringify(row)) continue;
        await writeRow(table, row, !!prev);
      }
      if (DELETABLE.has(table)) for (const [k, row] of before) if (!cur[table].has(k)) await deleteRow(table, row);
    }
    snapshot = cur;
  }
  function queueSync() {
    chain = chain.then(doSync).catch((e) => {
      console.error('[backend] save failed', e);
      toast('Could not save: ' + (e.message || e));
      scheduleReload();
    });
    return chain;
  }

  // ---------- live updates ----------
  function scheduleReload() {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(async () => {
      await chain;
      if (!session) return;
      try { await loadAll(); if (window.onBackendUpdate) window.onBackendUpdate(); }
      catch (e) { console.error('[backend] reload failed', e); }
    }, 400);
  }
  function subscribe() {
    if (channel) return;
    channel = sb.channel('campus-marche')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => scheduleReload())
      .subscribe();
    // Fallback in case live updates drop (e.g. phone went to sleep)
    poll = setInterval(() => { if (document.visibilityState === 'visible') scheduleReload(); }, 45000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && session) scheduleReload(); });
  }

  // ---------- login (6-digit code sent to the university email) ----------
  async function sendCode(email) {
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw error;
  }
  async function verifyCode(email, token) {
    const { data, error } = await sb.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
    session = data.session;
  }
  // Creates the profile the first time someone logs in. Returns true if they are new.
  async function ensureProfile(info = {}) {
    const id = session.user.id;
    const { data, error } = await sb.from('profiles').select('id').eq('id', id).maybeSingle();
    if (error) throw error;
    if (data) return false;
    const { error: e2 } = await sb.from('profiles').insert({
      id, uni: info.uni || CONFIG.universities[0].id, campus: info.campus || CONFIG.universities[0].campuses[0].id,
      name: info.name || session.user.email.split('@')[0], joined: Date.now(),
    });
    if (e2) throw e2;
    return true;
  }
  async function afterLogin(info) {
    const isNew = await ensureProfile(info);
    await loadAll();
    subscribe();
    return isNew;
  }
  // Called once when the page opens. Returns true if someone is already logged in.
  async function start() {
    const { data } = await sb.auth.getSession();
    session = data.session;
    if (!session) return false;
    await afterLogin({});
    return true;
  }
  async function signOut() {
    await chain;
    if (channel) { sb.removeChannel(channel); channel = null; }
    clearInterval(poll);
    await sb.auth.signOut();
    session = null; snapshot = null;
  }
  const flush = () => chain;
  const uploadCard = (dataUrl) => upload('student-cards', dataUrl);

  return { on, sb, start, sendCode, verifyCode, afterLogin, signOut, queueSync, flush, uploadCard, reload: scheduleReload };
})();
