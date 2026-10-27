-- Pink Rose Cafe security hardening. Applied through Supabase migration 20261027065846.
create extension if not exists pg_cron with schema pg_catalog;
create index if not exists rate_limits_window_start_idx on public.rate_limits(window_start);
create index if not exists records_insight_day_idx on public.records ((data->>'day')) where kind='insight';

create or replace function public.consume_rate_limit(p_key text,p_limit integer,p_window_seconds integer)
returns boolean
language plpgsql
security invoker
set search_path=public
as $$
declare n integer;
begin
  if p_key is null or length(p_key)>128 or p_limit<1 or p_limit>10000 or p_window_seconds<1 or p_window_seconds>86400 then
    raise exception 'Invalid rate-limit arguments' using errcode='22023';
  end if;
  insert into public.rate_limits(key,window_start,attempts)
  values(p_key,now(),1)
  on conflict(key) do update set
    attempts=case when rate_limits.window_start < now()-make_interval(secs => p_window_seconds) then 1 else rate_limits.attempts+1 end,
    window_start=case when rate_limits.window_start < now()-make_interval(secs => p_window_seconds) then now() else rate_limits.window_start end
  returning attempts into n;
  return n<=p_limit;
end;
$$;
revoke all on function public.consume_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;

create or replace function public.consume_rate_limit(p_key text,p_limit integer)
returns boolean
language plpgsql
security invoker
set search_path=public
as $$
begin
  return public.consume_rate_limit(p_key,p_limit,60);
end;
$$;
revoke all on function public.consume_rate_limit(text,integer) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer) to service_role;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

do $$
declare existing_job record;
begin
  for existing_job in select jobid from cron.job where jobname in ('pinkrose-rate-limit-cleanup','pinkrose-insight-retention') loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
  perform cron.schedule(
    'pinkrose-rate-limit-cleanup',
    '17 * * * *',
    'delete from public.rate_limits where window_start < now() - interval ''1 day'''
  );
  perform cron.schedule(
    'pinkrose-insight-retention',
    '31 2 * * *',
    $job$delete from public.records where kind = 'insight' and data->>'day' < to_char((now() at time zone 'Europe/Istanbul')::date - 35, 'YYYY-MM-DD');$job$
  );
end;
$$;