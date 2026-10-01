-- Apply only to the dedicated Pink Rose Supabase project.
begin;
create table if not exists public.records (
  id text primary key,
  kind text not null,
  data jsonb not null
);
create table if not exists public.orders (
  id uuid primary key,
  request_key uuid not null unique,
  data jsonb not null,
  created timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders(created desc);
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  attempts integer not null
);
alter table public.records enable row level security;
alter table public.orders enable row level security;
alter table public.admin_users enable row level security;
alter table public.rate_limits enable row level security;
revoke all on public.records, public.orders, public.admin_users, public.rate_limits from anon,authenticated;
grant all on public.records, public.orders, public.admin_users, public.rate_limits to service_role;

create or replace function public.consume_rate_limit(p_key text,p_limit integer)
returns boolean language plpgsql security invoker set search_path=public as $$
declare n integer;
begin
  delete from public.rate_limits where window_start < now() - interval '1 day';
  insert into public.rate_limits(key,window_start,attempts) values(p_key,now(),1)
  on conflict(key) do update set
    attempts=case when rate_limits.window_start < now()-interval '1 minute' then 1 else rate_limits.attempts+1 end,
    window_start=case when rate_limits.window_start < now()-interval '1 minute' then now() else rate_limits.window_start end
  returning attempts into n;
  return n<=p_limit;
end;
$$;
revoke all on function public.consume_rate_limit(text,integer) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',false,4194304,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
commit;
