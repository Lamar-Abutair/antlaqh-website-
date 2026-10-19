-- Run in Supabase SQL Editor.
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  business_name text not null check (char_length(business_name) between 1 and 120),
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 60),
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(btrim(comment)) between 3 and 500),
  approved boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists reviews_public_idx on public.reviews (business_name, created_at desc) where approved = true;
alter table public.reviews enable row level security;
revoke all on public.reviews from anon, authenticated;
grant select (business_name, customer_name, rating, comment, approved, created_at) on public.reviews to anon, authenticated;
grant insert (business_name, customer_name, rating, comment) on public.reviews to anon, authenticated;
drop policy if exists "Public can view approved reviews" on public.reviews;
create policy "Public can view approved reviews" on public.reviews for select to anon, authenticated using (approved = true);
drop policy if exists "Public can submit pending reviews" on public.reviews;
create policy "Public can submit pending reviews" on public.reviews for insert to anon, authenticated with check (approved = true);
-- Review moderation: use Supabase Table Editor as project owner to set approved=true.
-- Before wide public launch, enable CAPTCHA/rate-limiting through a server-side endpoint.
