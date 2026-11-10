-- =====================================================================
-- Campus マルシェ — admin queries (run these in Supabase → SQL Editor)
-- =====================================================================

-- 1. Make yourself admin (lets you see the Prototype stats page).
--    Replace the email with your own university email after you sign up.
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'YOUR-EMAIL@u-hyogo.ac.jp');

-- 2. See who is waiting for student card approval.
select p.id, p.name, u.email, p.campus, p.verification_status
from public.profiles p join auth.users u on u.id = p.id
where p.verification_status = 'pending';
--    To look at a card: Supabase → Storage → student-cards → the folder named with their id.

-- 3. Approve a student (paste their id from query 2).
update public.profiles set verified = true, verification_status = 'verified' where id = 'PASTE-ID-HERE';
--    Then delete their card photo in Storage → student-cards, so you don't keep ID images.
insert into public.notifications (id, user_id, text, link, icon, kind, at)
values ('n_' || substr(md5(random()::text), 1, 12), 'PASTE-ID-HERE',
        'Your student card is verified. You can post and message now.', '#/me', 'check', 'account',
        (extract(epoch from now()) * 1000)::bigint);

-- 4. Reject a card (e.g. blurry photo). They can upload again.
update public.profiles set verification_status = 'rejected' where id = 'PASTE-ID-HERE';

-- 5. Reports students have sent.
select r.at, r.kind, r.reason, r.note, r.target_id, p.name as reported_by
from public.reports r join public.profiles p on p.id = r.from_id
order by r.at desc;

-- 6. Test numbers for your 2-week trial.
select type, count(*) from public.events group by type order by count(*) desc;
select count(*) filter (where status = 'done') as handed_off, count(*) as posted from public.listings where status <> 'deleted';

-- ---------- Invite codes (friends join without email) ----------
-- Add a code (pick something hard to guess, e.g. MARCHE-7QK4). Never put it in the app's files.
-- insert into public.invite_codes (code, note) values ('YOUR-CODE-HERE', 'friends test');

-- See codes and how many people used each:
-- select code, note, active, uses, max_uses from public.invite_codes;

-- Turn a code off (people who already joined keep their accounts):
-- update public.invite_codes set active = false where code = 'YOUR-CODE-HERE';

-- See who joined with a code:
-- select name, campus, to_timestamp(joined / 1000) as joined_at from public.profiles where invited order by joined desc;
