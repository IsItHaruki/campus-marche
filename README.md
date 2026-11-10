# Campus マルシェ

A students-only marketplace for 兵庫県立大学 (University of Hyogo). Students buy, sell and give things away, then hand them over on campus. There's no shipping.

**Live:** https://campus-marche-khaki.vercel.app/ (Vercel deploys every push to `main`)

## Run it locally

- **Demo mode:** open `index.html`. With `config.js` empty, the app uses fake students and keeps data in your browser.
- **With bot students who reply in chat:** run `node server/server.js`, then open http://localhost:3458. Bots only work in demo mode.
- **Real backend:** put the Supabase URL and anon key in `config.js`. See `SETUP.md`.

## Files

| File | What it does |
|---|---|
| `app.js` | The whole app: screens, actions, demo data |
| `backend.js` | Syncs the app's data with Supabase (login, database, live updates, photos) |
| `i18n.js` | English ⇄ 日本語 translation |
| `livechat.js` + `server/` | Bot students for local testing |
| `supabase/schema.sql` | Database tables and security rules |
| `supabase/admin.sql` | Admin queries for approving student cards |
| `tests/mock-backend.html` | Runs the app against a fake Supabase |

If you add text to the interface, add its Japanese version to `i18n.js` too.
