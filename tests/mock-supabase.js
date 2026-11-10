/* Fake Supabase for testing backend.js without a real project.
   Stores tables in localStorage, copies the main security rules and triggers from schema.sql. */
(function () {
  const K = 'mock_sb_store';
  const store = JSON.parse(localStorage.getItem(K) || '{}');
  const persist = () => localStorage.setItem(K, JSON.stringify(store));
  const tbl = (n) => (store[n] = store[n] || []);
  const KEYS = { profiles: ['id'], user_settings: ['user_id'], saved_searches: ['id'], blocks: ['blocker', 'blocked'], listings: ['id'], likes: ['listing_id', 'user_id'], favorites: ['user_id', 'kind', 'target_id'], views: ['listing_id', 'user_id'], threads: ['id'], messages: ['id'], notifications: ['id'], reviews: ['id'], reports: ['id'], events: ['id'] };
  let session = JSON.parse(localStorage.getItem('mock_session') || 'null');
  const uidMe = () => session && session.user.id;
  const prof = (id) => tbl('profiles').find((p) => p.id === id);
  const member = (tid) => { const t = tbl('threads').find((x) => x.id === tid); return t && [t.buyer_id, t.seller_id].includes(uidMe()); };
  const rls = (code) => ({ data: null, error: { code: '42501', message: 'new row violates row-level security policy (' + code + ')' } });
  window.__mockLog = [];

  // read rules
  const canRead = {
    threads: (r) => [r.buyer_id, r.seller_id].includes(uidMe()),
    messages: (r) => member(r.thread_id),
    notifications: (r) => r.user_id === uidMe(),
    blocks: (r) => [r.blocker, r.blocked].includes(uidMe()),
    user_settings: (r) => r.user_id === uidMe(),
    saved_searches: (r) => r.user_id === uidMe(),
    favorites: (r) => r.user_id === uidMe(),
    reports: () => !!prof(uidMe())?.is_admin,
    events: () => !!prof(uidMe())?.is_admin,
  };
  // write rules (insert/update)
  const canWrite = {
    profiles: (r) => r.id === uidMe(),
    user_settings: (r) => r.user_id === uidMe(),
    saved_searches: (r) => r.user_id === uidMe(),
    blocks: (r) => r.blocker === uidMe(),
    listings: (r) => r.seller_id === uidMe() && !!prof(uidMe())?.verified,
    likes: (r) => r.user_id === uidMe(),
    favorites: (r) => r.user_id === uidMe(),
    views: (r) => r.user_id === uidMe(),
    threads: (r, op) => (op === 'insert' ? r.buyer_id === uidMe() && !!prof(uidMe())?.verified : [r.buyer_id, r.seller_id].includes(uidMe())),
    messages: (r, op) => member(r.thread_id) && (op === 'update' || r.from_id === uidMe() || r.from_id == null),
    notifications: () => !!uidMe(),
    reviews: (r) => { const th = tbl('threads').find((x) => x.id === r.thread_id); return r.from_id === uidMe() && member(r.thread_id) && th && th.outcome === 'handed' && th.handed_at <= Date.now() - 86400000; },
    reports: (r) => r.from_id === uidMe(),
    events: (r) => r.user_id === uidMe(),
  };
  const keyOf = (t, r) => KEYS[t].map((c) => r[c]).join('|');

  function filterNotification(n) { // trigger
    if (n.kind === 'account') return n.user_id === uidMe() || !uidMe();
    const s = tbl('user_settings').find((x) => x.user_id === n.user_id);
    if (s && s.notify && s.notify[n.kind || 'deals'] === false) return false;
    if (tbl('blocks').some((b) => (b.blocker === n.user_id && b.blocked === uidMe()) || (b.blocker === uidMe() && b.blocked === n.user_id))) return false;
    return true;
  }
  function afterListingInsert(l) { // trigger
    const seller = prof(l.seller_id);
    const label = l.type === 'free' ? 'Free' : '¥' + Number(l.price).toLocaleString('en-US');
    tbl('profiles').filter((p) => p.id !== l.seller_id && p.uni === l.uni && !p.deleted).forEach((p) => {
      if (tbl('blocks').some((b) => (b.blocker === p.id && b.blocked === l.seller_id) || (b.blocker === l.seller_id && b.blocked === p.id))) return;
      const hit = tbl('saved_searches').find((s) => s.user_id === p.id && (l.title + ' ' + (l.description || '') + ' ' + l.category).toLowerCase().includes(s.q.toLowerCase()));
      const favSeller = tbl('favorites').some((f) => f.user_id === p.id && f.kind === 'seller' && f.target_id === l.seller_id);
      const n = favSeller ? { kind: 'favorites', text: `${seller.name} (a favorite seller) posted: ${l.title} · ${label}` } : hit ? { kind: 'saved', text: `Saved search "${hit.q}": ${l.title} · ${label}` } : p.campus === seller.campus ? { kind: 'campus', text: `New on your campus: ${l.title} · ${label}` } : null;
      if (n) { const row = { id: 'n_' + Math.random().toString(36).slice(2), user_id: p.id, link: '#/item/' + l.id, listing_id: l.id, icon: 'bell', at: l.created_at, read: false, ...n }; if (filterNotification(row)) tbl('notifications').push(row); }
    });
  }
  function protectProfile(row, old) {
    if (!old) return { ...row, verified: false, verification_status: 'none', is_admin: false, seed_handoffs: 0 };
    const out = { ...old, ...row, verified: old.verified, is_admin: old.is_admin, seed_handoffs: old.seed_handoffs };
    if (row.verification_status !== old.verification_status && !(row.verification_status === 'pending' && ['none', 'rejected'].includes(old.verification_status))) out.verification_status = old.verification_status;
    return out;
  }

  class Q {
    constructor(t) { this.t = t; this.op = 'select'; this.filters = []; }
    select() { return this; }
    insert(row) { this.op = 'insert'; this.row = row; return this; }
    update(row) { this.op = 'update'; this.row = row; return this; }
    upsert(row) { this.op = 'upsert'; this.row = row; return this; }
    delete() { this.op = 'delete'; return this; }
    eq(c, v) { this.filters.push((r) => r[c] === v); return this; }
    neq(c, v) { this.filters.push((r) => r[c] !== v); return this; }
    order(c, o = {}) { this.ord = [c, o.ascending !== false]; return this; }
    limit(n) { this.lim = n; return this; }
    maybeSingle() { this.single = true; return this; }
    then(res, rej) { return Promise.resolve().then(() => this.exec()).then(res, rej); }
    exec() {
      const t = this.t; const rows = tbl(t); const match = (r) => this.filters.every((f) => f(r));
      window.__mockLog.push(`${this.op} ${t}`);
      if (!uidMe()) return { data: null, error: { message: 'not logged in' } };
      if (this.op === 'select') {
        let out = rows.filter(match).filter((r) => !canRead[t] || canRead[t](r)).map((r) => JSON.parse(JSON.stringify(r)));
        if (this.ord) { const [c, asc] = this.ord; out.sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1)); }
        if (this.lim) out = out.slice(0, this.lim);
        return { data: this.single ? out[0] || null : out, error: null };
      }
      if (this.op === 'insert' || this.op === 'upsert') {
        let row = { ...this.row };
        const existing = rows.find((r) => keyOf(t, r) === keyOf(t, row));
        if (existing && this.op === 'insert') return { data: null, error: { code: '23505', message: 'duplicate key' } };
        if (!canWrite[t](row, existing ? 'update' : 'insert')) return rls(`${this.op} ${t}`);
        if (t === 'profiles') row = protectProfile(row, existing);
        if (t === 'notifications' && !existing && !filterNotification(row)) { persist(); return { data: null, error: null }; }
        if (existing) Object.assign(existing, row); else rows.push(row);
        if (t === 'listings' && !existing) afterListingInsert(row);
        persist(); return { data: null, error: null };
      }
      if (this.op === 'update') {
        const targets = rows.filter(match);
        for (const r of targets) {
          if (t === 'listings' && r.seller_id !== uidMe()) return rls('update listings (not owner)');
          if (!canWrite[t]({ ...r, ...this.row }, 'update')) return rls(`update ${t}`);
          Object.assign(r, t === 'profiles' ? protectProfile(this.row, r) : this.row);
        }
        persist(); return { data: null, error: null };
      }
      if (this.op === 'delete') {
        store[t] = rows.filter((r) => !(match(r) && canWrite[t](r, 'delete')));
        persist(); return { data: null, error: null };
      }
    }
  }

  const client = {
    from: (t) => new Q(t),
    rpc: async (name, a) => {
      window.__mockLog.push('rpc ' + name);
      const l = tbl('listings').find((x) => x.id === a.p_id);
      const ok = l && (l.seller_id === uidMe() || tbl('threads').some((t) => t.listing_id === l.id && t.buyer_id === uidMe()));
      if (!ok || !['available', 'reserved', 'done'].includes(a.p_status)) return { error: { message: 'Not allowed' } };
      Object.assign(l, { status: a.p_status, reserved_thread: a.p_reserved_thread, done_at: a.p_done_at, receiver_id: a.p_receiver });
      persist(); return { data: null, error: null };
    },
    auth: {
      getSession: async () => ({ data: { session } }),
      signInWithOtp: async ({ email }) => {
        if (!/[@.]u-hyogo\.ac\.jp$/.test(email)) return { error: { message: 'Database error saving new user' } };
        return { error: null };
      },
      verifyOtp: async ({ email, token }) => {
        if (token !== '123456') return { data: {}, error: { message: 'Token has expired or is invalid' } };
        const users = (store.auth_users = store.auth_users || []);
        let u = users.find((x) => x.email === email);
        if (!u) { u = { id: 'uuid-' + email.split('@')[0], email }; users.push(u); persist(); }
        session = { user: u }; localStorage.setItem('mock_session', JSON.stringify(session));
        return { data: { session }, error: null };
      },
      signOut: async () => { session = null; localStorage.removeItem('mock_session'); return { error: null }; },
    },
    storage: { from: (b) => ({
      upload: async (path) => { (store.storage = store.storage || []).push(b + '/' + path); persist(); return { error: null }; },
      getPublicUrl: (path) => ({ data: { publicUrl: 'https://mock.invalid/photos/' + path } }),
    }) },
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    removeChannel: () => {},
  };
  window.supabase = { createClient: () => client };
  window.__mockStore = store;
  window.__mockReset = () => { localStorage.removeItem(K); localStorage.removeItem('mock_session'); };
})();
