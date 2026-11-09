-- КириГео: схема для Supabase. Выполнить целиком в SQL Editor (один раз).
create table if not exists public.progress (
  user_id    uuid not null references auth.users(id) on delete cascade,
  subject    text not null check (subject in ('kirjandus','geo')),
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, subject),
  constraint progress_size check (pg_column_size(data) < 500000)
);

alter table public.progress enable row level security;

-- Каждый видит и меняет только свои строки.
create policy "own rows" on public.progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Если у пользователя подключён Google Authenticator, доступ к данным только после ввода кода (aal2).
create policy "require 2fa when enrolled" on public.progress
  as restrictive for all to authenticated
  using (
    array[(select auth.jwt()->>'aal')] <@ (
      select case when count(id) > 0 then array['aal2'] else array['aal1','aal2'] end
      from auth.mfa_factors
      where (select auth.uid()) = user_id and status = 'verified'
    )
  );

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger progress_touch before update on public.progress
  for each row execute function public.touch_updated_at();
