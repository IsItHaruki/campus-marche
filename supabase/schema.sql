-- =====================================================================
-- Campus マルシェ — Supabase database
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- It is safe to run again: it drops and recreates the policies/triggers.
-- Times are stored as milliseconds (bigint), the same as the app uses.
-- =====================================================================

-- ---------- 1. Only University of Hyogo emails can sign up ----------
-- To add another university later, add its email ending to this list.
create or replace function public.enforce_student_email()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  allowed text[] := array['u-hyogo.ac.jp'];
  ending text;
  ok boolean := false;
begin
  -- Friends who join with an invite code have no email (anonymous sign-in). The invite code is
  -- checked by join_with_code() below, and without it they can't see or do anything.
  if coalesce(new.is_anonymous, false) then return new; end if;
  foreach ending in array allowed loop
    if lower(new.email) like '%@' || ending or lower(new.email) like '%.' || ending then ok := true; end if;
  end loop;
  if not ok then
    raise exception 'Please use your university email (ending in u-hyogo.ac.jp)';
  end if;
  return new;
end $$;

drop trigger if exists enforce_student_email on auth.users;
create trigger enforce_student_email before insert on auth.users
  for each row execute function public.enforce_student_email();

-- ---------- 2. Tables ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  uni text not null default 'u-hyogo',
  campus text not null default 'kobe-shoka',
  name text not null default '',
  bio text default '',
  photo text,
  verified boolean not null default false,
  verification_status text not null default 'none',   -- none | pending | verified | rejected
  invited boolean not null default false,              -- joined with an invite code (can post and message)
  is_admin boolean not null default false,
  deleted boolean not null default false,
  seed_handoffs int not null default 0,
  joined bigint not null default (extract(epoch from now()) * 1000)::bigint
);

alter table public.profiles add column if not exists invited boolean not null default false;

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notify jsonb not null default '{}'::jsonb
);

create table if not exists public.saved_searches (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  q text not null,
  at bigint not null
);

create table if not exists public.blocks (
  blocker uuid not null references auth.users(id) on delete cascade,
  blocked uuid not null references auth.users(id) on delete cascade,
  at bigint,
  primary key (blocker, blocked)
);

create table if not exists public.listings (
  id text primary key,
  seller_id uuid not null references auth.users(id) on delete cascade,
  uni text not null,
  title text not null,
  category text not null,
  type text not null check (type in ('sell', 'free')),
  price int not null default 0,
  condition text,
  times text,
  description text,
  photo text,
  bg text,
  status text not null default 'available' check (status in ('available', 'reserved', 'done', 'deleted')),
  reserved_thread text,
  created_at bigint not null,
  edited_at bigint,
  done_at bigint,
  receiver_id uuid
);

create table if not exists public.likes (
  listing_id text not null references public.listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (listing_id, user_id)
);

-- Favorites are private bookmarks: saved items, and favorite sellers (like following). Nobody else can see them.
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('item', 'seller')),
  target_id text not null,          -- a listing id, or a seller's user id
  at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  primary key (user_id, kind, target_id)
);
create index if not exists favorites_target_idx on public.favorites(kind, target_id);

create table if not exists public.views (
  listing_id text not null references public.listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (listing_id, user_id)
);

create table if not exists public.threads (
  id text primary key,
  listing_id text not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  created_at bigint not null,
  outcome text,                 -- null | handed | noshow
  meetup jsonb,                 -- { when, place }
  agreed_price int,
  noshow_by uuid,
  handed_at bigint              -- ratings open 1 day after this
);
alter table public.threads add column if not exists handed_at bigint;

create table if not exists public.messages (
  id text primary key,
  thread_id text not null references public.threads(id) on delete cascade,
  from_id uuid,                 -- null for system messages
  kind text not null,           -- text | meetup | offer | system
  text text,
  amount int,
  when_at text,
  place text,
  status text,                  -- pending | accepted | declined
  at bigint not null
);

create table if not exists public.notifications (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  link text,
  listing_id text,
  icon text,
  kind text,
  at bigint not null,
  read boolean not null default false
);

create table if not exists public.reviews (
  id text primary key,
  from_id uuid not null references auth.users(id) on delete cascade,
  to_id uuid not null references auth.users(id) on delete cascade,
  thread_id text,
  listing_id text,
  rating int not null check (rating between 1 and 5),   -- 1 to 5 stars
  comment text,
  at bigint not null,
  unique (thread_id, from_id)
);

create table if not exists public.reports (
  id text primary key,
  from_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  target_id text not null,
  reason text,
  note text,
  at bigint not null
);

create table if not exists public.events (
  id text primary key,
  type text not null,
  at bigint not null,
  user_id uuid,
  listing_id text,
  thread_id text
);

create index if not exists messages_thread_idx on public.messages(thread_id);
create index if not exists notifications_user_idx on public.notifications(user_id);
create index if not exists listings_uni_idx on public.listings(uni);

-- ---------- 3. Helper functions ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false)
$$;

-- A member is someone who finished joining (has a profile). Signed-in visitors without one see nothing.
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid())
$$;

-- Who can post and message: students with a checked card, or friends who joined with an invite code.
create or replace function public.can_trade() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and (verified or invited))
$$;

create or replace function public.is_thread_member(t_id text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from threads t where t.id = t_id and auth.uid() in (t.buyer_id, t.seller_id))
$$;

-- ---------- 4. Row Level Security (who can read/write what) ----------
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.saved_searches enable row level security;
alter table public.blocks enable row level security;
alter table public.listings enable row level security;
alter table public.likes enable row level security;
alter table public.favorites enable row level security;
alter table public.views enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.events enable row level security;

do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Profiles: every signed-in student can see profiles; you can only create/edit your own.
create policy "profiles read" on public.profiles for select to authenticated using (true);
create policy "profiles insert own" on public.profiles for insert to authenticated
  with check (id = auth.uid() and not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false));
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Settings and saved searches are private.
create policy "settings own" on public.user_settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "saved own" on public.saved_searches for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Blocks: you see blocks you made and blocks against you (so the app can hide both ways).
create policy "blocks read" on public.blocks for select to authenticated using (auth.uid() in (blocker, blocked));
create policy "blocks insert own" on public.blocks for insert to authenticated with check (blocker = auth.uid());
create policy "blocks delete own" on public.blocks for delete to authenticated using (blocker = auth.uid());

-- Listings: everyone signed in can see them; only verified students can post; only the seller can edit.
create policy "listings read" on public.listings for select to authenticated using (true);
create policy "listings insert verified" on public.listings for insert to authenticated
  with check (seller_id = auth.uid() and public.can_trade());
create policy "listings update own" on public.listings for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());

-- Likes and views: anyone can read counts; you add/remove your own.
create policy "likes read" on public.likes for select to authenticated using (true);
create policy "likes insert own" on public.likes for insert to authenticated with check (user_id = auth.uid());
create policy "likes delete own" on public.likes for delete to authenticated using (user_id = auth.uid());
-- Favorites: only you can see, add or remove your own (sellers are never told).
create policy "favorites own" on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "views read" on public.views for select to authenticated using (true);
create policy "views insert own" on public.views for insert to authenticated with check (user_id = auth.uid());

-- Threads and messages: only the two people in the chat can see or write them.
create policy "threads read members" on public.threads for select to authenticated using (auth.uid() in (buyer_id, seller_id));
create policy "threads insert buyer" on public.threads for insert to authenticated
  with check (buyer_id = auth.uid() and public.can_trade());
create policy "threads update members" on public.threads for update to authenticated using (auth.uid() in (buyer_id, seller_id)) with check (auth.uid() in (buyer_id, seller_id));
create policy "messages read members" on public.messages for select to authenticated using (public.is_thread_member(thread_id));
create policy "messages insert members" on public.messages for insert to authenticated
  with check (public.is_thread_member(thread_id) and (from_id = auth.uid() or from_id is null));
create policy "messages update members" on public.messages for update to authenticated using (public.is_thread_member(thread_id));

-- Notifications: you only read your own; any signed-in student can create one for someone else
-- (the trigger below drops it if that person turned that kind off or blocked the sender).
create policy "notifications read own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications insert" on public.notifications for insert to authenticated with check (auth.uid() is not null);
create policy "notifications update own" on public.notifications for update to authenticated using (user_id = auth.uid());

-- Reviews are public; you can only write your own, once per chat.
create policy "reviews read" on public.reviews for select to authenticated using (true);
create policy "reviews insert own" on public.reviews for insert to authenticated
  with check (from_id = auth.uid() and public.is_thread_member(thread_id)
    -- ratings open 1 day after the hand-off
    and exists (select 1 from threads th where th.id = thread_id and th.outcome = 'handed'
                and th.handed_at <= (extract(epoch from now()) * 1000)::bigint - 86400000));

-- Reports: you can send them; only admins can read them.
create policy "reports insert own" on public.reports for insert to authenticated with check (from_id = auth.uid());
create policy "reports read admin" on public.reports for select to authenticated using (public.is_admin());

-- Events (for the test stats): you log your own; only admins can read them.
create policy "events insert own" on public.events for insert to authenticated with check (user_id = auth.uid());
create policy "events read admin" on public.events for select to authenticated using (public.is_admin());

-- Members only: on top of the rules above, nobody without a profile can read or write anything.
-- ("restrictive" means this must pass as well as the normal rule.)
do $$ declare t text; begin
  foreach t in array array['user_settings', 'saved_searches', 'blocks', 'listings', 'likes', 'favorites', 'views',
                           'threads', 'messages', 'notifications', 'reviews', 'reports', 'events'] loop
    execute format('create policy "members only" on public.%I as restrictive for all to authenticated using (public.is_member()) with check (public.is_member())', t);
  end loop;
end $$;
create policy "members only read" on public.profiles as restrictive for select to authenticated using (public.is_member() or id = auth.uid());
create policy "members only update" on public.profiles as restrictive for update to authenticated using (public.is_member());

-- ---------- 5. Triggers ----------
-- Students can't make themselves verified or admin. Only you (in the dashboard / SQL editor) can.
create or replace function public.protect_profile() returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'authenticated' then return new; end if;  -- dashboard / service role: allow
  if current_setting('campus.joining', true) = 'yes' then return new; end if;  -- join_with_code() below
  if tg_op = 'INSERT' then
    new.verified := false; new.verification_status := 'none'; new.is_admin := false; new.seed_handoffs := 0;
    new.invited := false;
    return new;
  end if;
  new.verified := old.verified;
  new.invited := old.invited;
  new.is_admin := old.is_admin;
  new.seed_handoffs := old.seed_handoffs;
  if new.verification_status is distinct from old.verification_status
     and not (new.verification_status = 'pending' and old.verification_status in ('none', 'rejected')) then
    new.verification_status := old.verification_status;
  end if;
  return new;
end $$;
drop trigger if exists protect_profile on public.profiles;
create trigger protect_profile before insert or update on public.profiles
  for each row execute function public.protect_profile();

-- Drop notifications the person turned off, or that come from someone blocked either way.
create or replace function public.filter_notification() returns trigger
language plpgsql security definer set search_path = public as $$
declare pref jsonb;
begin
  if new.kind = 'account' then
    if auth.uid() is not null and new.user_id <> auth.uid() then return null; end if;
    return new;
  end if;
  select notify into pref from user_settings where user_id = new.user_id;
  if pref is not null and (pref ->> coalesce(new.kind, 'deals')) = 'false' then return null; end if;
  if auth.uid() is not null and exists (
    select 1 from blocks b where (b.blocker = new.user_id and b.blocked = auth.uid()) or (b.blocker = auth.uid() and b.blocked = new.user_id)
  ) then return null; end if;
  return new;
end $$;
drop trigger if exists filter_notification on public.notifications;
create trigger filter_notification before insert on public.notifications
  for each row execute function public.filter_notification();

-- When someone posts: tell saved-search matches, then everyone else on the same campus.
-- Runs on the server so nobody can read other people's saved searches.
create or replace function public.notify_new_listing() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  seller_campus text;
  seller_name text;
  label text;
  r record;
begin
  select campus, name into seller_campus, seller_name from profiles where id = new.seller_id;
  label := case when new.type = 'free' then 'Free' else '¥' || to_char(new.price, 'FM999,999,999') end;
  for r in
    select p.id, p.campus,
      (select s.q from saved_searches s
        where s.user_id = p.id
          and (new.title || ' ' || coalesce(new.description, '') || ' ' || new.category) ilike '%' || s.q || '%'
        limit 1) as hit,
      exists (select 1 from favorites f where f.user_id = p.id and f.kind = 'seller' and f.target_id = new.seller_id::text) as fav_seller
    from profiles p
    where p.id <> new.seller_id and p.uni = new.uni and not p.deleted
      and not exists (select 1 from blocks b where (b.blocker = p.id and b.blocked = new.seller_id) or (b.blocker = new.seller_id and b.blocked = p.id))
  loop
    -- Favorite seller beats saved search beats campus, so nobody gets two alerts for one item
    if r.fav_seller then
      insert into notifications (id, user_id, text, link, listing_id, icon, kind, at)
      values ('n_' || substr(md5(random()::text), 1, 12), r.id, seller_name || ' (a favorite seller) posted: ' || new.title || ' · ' || label,
              '#/item/' || new.id, new.id, 'bell', 'favorites', new.created_at);
    elsif r.hit is not null then
      insert into notifications (id, user_id, text, link, listing_id, icon, kind, at)
      values ('n_' || substr(md5(random()::text), 1, 12), r.id, 'Saved search "' || r.hit || '": ' || new.title || ' · ' || label,
              '#/item/' || new.id, new.id, 'bell', 'saved', new.created_at);
    elsif r.campus = seller_campus then
      insert into notifications (id, user_id, text, link, listing_id, icon, kind, at)
      values ('n_' || substr(md5(random()::text), 1, 12), r.id, 'New on your campus: ' || new.title || ' · ' || label,
              '#/item/' || new.id, new.id, 'bell', 'campus', new.created_at);
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists notify_new_listing on public.listings;
create trigger notify_new_listing after insert on public.listings
  for each row execute function public.notify_new_listing();

-- Price drop: tell students who saved the item to favorites. The app already tells people who liked it
-- (likes are public), so anyone who both liked and saved it is skipped here to avoid two alerts.
create or replace function public.notify_price_drop() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  old_price int := case when old.type = 'free' then 0 else old.price end;
  new_price int := case when new.type = 'free' then 0 else new.price end;
  label text := case when new.type = 'free' then 'Free' else '¥' || to_char(new.price, 'FM999,999,999') end;
begin
  if new_price >= old_price or new.status in ('done', 'deleted') then return new; end if;
  insert into notifications (id, user_id, text, link, listing_id, icon, kind, at)
  select 'n_' || substr(md5(random()::text), 1, 12), f.user_id,
         'Price drop: "' || new.title || '" is now ' || label || ' (was ¥' || to_char(old_price, 'FM999,999,999') || ')',
         '#/item/' || new.id, new.id, 'tag', 'price', (extract(epoch from now()) * 1000)::bigint
  from favorites f
  where f.kind = 'item' and f.target_id = new.id and f.user_id <> new.seller_id
    and not exists (select 1 from likes lk where lk.listing_id = new.id and lk.user_id = f.user_id);
  return new;
end $$;
drop trigger if exists notify_price_drop on public.listings;
create trigger notify_price_drop after update of price, type on public.listings
  for each row execute function public.notify_price_drop();

-- Buyers can't edit someone's listing, but a meetup/hand-off changes its status.
-- This function lets the seller or a buyer in a chat change ONLY the status fields.
create or replace function public.set_listing_status(p_id text, p_status text, p_reserved_thread text, p_done_at bigint, p_receiver uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('available', 'reserved', 'done') then raise exception 'Not allowed'; end if;
  if not exists (
    select 1 from listings l where l.id = p_id
      and (l.seller_id = auth.uid() or exists (select 1 from threads t where t.listing_id = l.id and t.buyer_id = auth.uid()))
  ) then raise exception 'Not allowed'; end if;
  update listings set status = p_status, reserved_thread = p_reserved_thread, done_at = p_done_at, receiver_id = p_receiver where id = p_id;
end $$;
grant execute on function public.set_listing_status(text, text, text, bigint, uuid) to authenticated;

-- ---------- 6. Photo storage ----------
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('student-cards', 'student-cards', false) on conflict (id) do nothing;

drop policy if exists "photos read" on storage.objects;
drop policy if exists "photos upload own folder" on storage.objects;
drop policy if exists "cards upload own folder" on storage.objects;
create policy "photos read" on storage.objects for select using (bucket_id = 'photos');
create policy "photos upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text and public.is_member());
-- Student cards: students can upload into their own folder, but nobody can read them except you in the dashboard.
create policy "cards upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'student-cards' and (storage.foldername(name))[1] = auth.uid()::text and public.is_member());

-- ---------- 7. Live updates (new messages and notifications appear without refreshing) ----------
do $$
declare t text;
begin
  foreach t in array array['listings', 'likes', 'threads', 'messages', 'notifications', 'reviews', 'profiles'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------- 8. Invite codes (testing with friends, before email login) ----------
-- The codes live only in the database. Nobody can read this table from the app, so the code
-- never appears in the website's files. Add or change codes in supabase/admin.sql.
create table if not exists public.invite_codes (
  code text primary key,
  note text default '',
  active boolean not null default true,
  uses int not null default 0,
  max_uses int,                         -- empty = unlimited
  created_at timestamptz not null default now()
);
alter table public.invite_codes enable row level security;   -- no policies: unreadable from the app

create table if not exists public.join_attempts (
  user_id uuid not null,
  at timestamptz not null default now()
);
alter table public.join_attempts enable row level security;  -- no policies: unreadable from the app

create or replace function public.join_with_code(p_code text, p_name text, p_uni text, p_campus text)
returns void language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  c public.invite_codes;
begin
  if me is null then raise exception 'Not signed in'; end if;
  if exists (select 1 from profiles where id = me) then return; end if;   -- already joined
  if (select count(*) from join_attempts where user_id = me and at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many tries';
  end if;
  select * into c from invite_codes
    where upper(code) = upper(trim(p_code)) and active and (max_uses is null or uses < max_uses);
  if not found then
    insert into join_attempts (user_id) values (me);
    raise exception 'Invalid invite code';
  end if;
  if length(trim(coalesce(p_name, ''))) = 0 or length(p_name) > 24 then raise exception 'Invalid nickname'; end if;
  perform set_config('campus.joining', 'yes', true);
  insert into profiles (id, uni, campus, name, invited, joined)
    values (me, coalesce(nullif(p_uni, ''), 'u-hyogo'), coalesce(nullif(p_campus, ''), 'kobe-shoka'), trim(p_name), true,
            (extract(epoch from now()) * 1000)::bigint);
  perform set_config('campus.joining', '', true);
  update invite_codes set uses = uses + 1 where code = c.code;
end $$;
revoke all on function public.join_with_code(text, text, text, text) from public, anon;
grant execute on function public.join_with_code(text, text, text, text) to authenticated;
