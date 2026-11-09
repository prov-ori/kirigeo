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

-- Проверка второго фактора вынесена в функцию с правами владельца: роль authenticated не читает auth.mfa_factors напрямую.
create or replace function public.kg_aal_ok() returns boolean
language sql stable security definer set search_path = '' as $$
  select (auth.jwt() ->> 'aal') = 'aal2'
      or not exists (select 1 from auth.mfa_factors where user_id = auth.uid() and status = 'verified');
$$;
revoke all on function public.kg_aal_ok() from public, anon;
grant execute on function public.kg_aal_ok() to authenticated;

-- Каждый видит и меняет только свои строки.
drop policy if exists "own rows" on public.progress;
create policy "own rows" on public.progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Если у пользователя подключён Google Authenticator, доступ к данным только после ввода кода (aal2).
drop policy if exists "require 2fa when enrolled" on public.progress;
create policy "require 2fa when enrolled" on public.progress
  as restrictive for all to authenticated
  using (public.kg_aal_ok())
  with check (public.kg_aal_ok());

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists progress_touch on public.progress;
create trigger progress_touch before update on public.progress
  for each row execute function public.touch_updated_at();
