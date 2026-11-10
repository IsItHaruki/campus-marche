# Campus マルシェ: turning on the real backend

Right now the app runs in **demo mode** (fake students, data stays in one browser).
Follow these steps to switch on the real backend, so real students can sign up, post and chat with each other.
It takes about 20 minutes and is free.

## 1. Create a Supabase project (you do this)

1. Go to https://supabase.com and sign up (free plan).
2. Click **New project**.
   - Name: `campus-marche`
   - Region: **Northeast Asia (Tokyo)** (closest to Kobe, so it's faster)
   - Set a database password and save it somewhere safe.
3. Wait about 2 minutes for it to finish setting up.

## 2. Create the database

1. In your project, open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this folder, copy all of it, paste it in, and press **Run**.
3. You should see "Success. No rows returned".

This creates the tables, the security rules (for example, only the two people in a chat can read it), the email check (only `u-hyogo.ac.jp` addresses can sign up), and photo storage.

## 3. Make the login email send a 6-digit code

The app logs people in with a code sent to their university email, not a password.

1. Go to **Authentication** → **Emails** (or **Email Templates**).
2. Open the **Magic Link** template and replace the message with:

   ```text
   <h2>Your Campus マルシェ code</h2>
   <p>Enter this code in the app:</p>
   <h1>{{ .Token }}</h1>
   <p>If you didn't ask for this, you can ignore this email.</p>
   ```

3. Do the same for the **Confirm signup** template.
4. Subject for both: `Your Campus マルシェ code`

## 4. Connect the app

1. Go to **Project Settings** → **API** (or **API Keys**).
2. Copy the **Project URL** and the **anon / publishable** key.
3. Open `config.js` in this folder and paste them in:

   ```js
   window.CAMPUS_CONFIG = {
     supabaseUrl: 'https://xxxxxxxx.supabase.co',
     supabaseAnonKey: 'eyJ... or sb_publishable_...',
   };
   ```

These two values are fine to be public. **Never** paste the `service_role` / secret key anywhere in the app.

## 5. Sign yourself up and become admin

1. Open the app and sign up with **your own** university email.
2. Upload your student card photo.
3. In Supabase → **SQL Editor**, open `supabase/admin.sql` and run:
   - **Query 1** with your email, to make yourself admin (you'll see "Test stats" on the Me page).
   - **Query 2**, to see who's waiting for approval (that's you).
   - **Query 3** with your id, to approve yourself.

You approve every new student the same way: look at their card in **Storage → student-cards**, run query 3, then delete the photo.

## 6. Emails to other students (important)

Supabase's built-in email sender is for testing only. It sends very few emails per hour and may only deliver to your own Supabase team's addresses. Before friends can sign up, connect your own sender in **Authentication → Emails → SMTP Settings**:

- **Easiest:** Gmail with an app password (Google account → Security → App passwords).
  - Host `smtp.gmail.com`
  - Port `587`
  - Username: your Gmail
  - Password: the app password
  - Gmail allows about 500 emails a day.
- **Later, more professional:** a service like Resend or Brevo with your own domain.

## 7. Put it online

The app is already live on GitHub Pages: **https://isitharuki.github.io/campus-marche/**

Every push to the `main` branch updates the site within about a minute.

In Supabase → **Authentication → URL Configuration**:
- **Site URL:** `https://isitharuki.github.io/campus-marche/`
- **Redirect URLs:** add `https://isitharuki.github.io/campus-marche/**` and `http://localhost:3457/**`

Share the link in the LINE group, and students can add it to their home screen.

## Checking it works

- Open the app on your phone and laptop with two different student emails.
- Post from one, and it should appear on the other without refreshing.
- Messages and notifications arrive live.
- `tests/mock-backend.html` runs the app against a fake Supabase (no real data). It's useful for checking changes before testing the real thing.

## Limits of the free plan

- 500 MB database
- 1 GB photo storage
- 50,000 monthly users

That's plenty for one university.

Free projects pause after 7 days with no activity. Open the dashboard to wake one up.
