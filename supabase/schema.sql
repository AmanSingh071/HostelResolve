-- HostelResolve production grievance schema
create table if not exists public.grievances (
  id text primary key,
  student_id uuid not null references auth.users(id) on delete cascade,
  student_email text not null,
  block text not null check (block in ('A','B','C')),
  floor text not null,
  room text not null,
  category text not null,
  subject text not null check (char_length(subject) between 1 and 70),
  description text not null check (char_length(description) between 10 and 1200),
  priority text not null check (priority in ('Low','Medium','High','Critical')),
  status text not null default 'Pending' check (status in ('Pending','In Progress','Awaiting Confirmation','Completed','Needs Work Again')),
  worker text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.grievances enable row level security;
revoke all on table public.grievances from anon;
grant select,insert,update on table public.grievances to authenticated;

drop policy if exists "students read own grievances" on public.grievances;
create policy "students read own grievances" on public.grievances for select to authenticated using (student_id=auth.uid());

drop policy if exists "students create own grievances" on public.grievances;
create policy "students create own grievances" on public.grievances for insert to authenticated with check (student_id=auth.uid() and student_email=coalesce(auth.jwt()->>'email',''));

drop policy if exists "students update own grievances" on public.grievances;
create policy "students update own grievances" on public.grievances for update to authenticated using (student_id=auth.uid()) with check (student_id=auth.uid());

create or replace function public.guard_student_grievance_update()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null and auth.uid()=old.student_id then
    if new.student_id is distinct from old.student_id
      or new.student_email is distinct from old.student_email
      or new.block is distinct from old.block
      or new.floor is distinct from old.floor
      or new.room is distinct from old.room
      or new.category is distinct from old.category
      or new.subject is distinct from old.subject
      or new.description is distinct from old.description
      or new.priority is distinct from old.priority
      or new.worker is distinct from old.worker then
      raise exception 'Students may not alter grievance details after submission';
    end if;
    if new.status not in ('Completed','Needs Work Again') then
      raise exception 'Students may only confirm or reopen a grievance';
    end if;
    if old.status <> 'Awaiting Confirmation' then
      raise exception 'This grievance is not awaiting student confirmation';
    end if;
  end if;
  if new.status='Completed' and old.status<>'Completed' then new.resolved_at=now(); end if;
  new.updated_at=now();
  return new;
end;
$$;

drop trigger if exists grievances_guard_update on public.grievances;
create trigger grievances_guard_update before update on public.grievances for each row execute function public.guard_student_grievance_update();

create index if not exists grievances_student_created_idx on public.grievances(student_id,created_at desc);
create index if not exists grievances_status_created_idx on public.grievances(status,created_at asc);

-- Run this in Supabase SQL Editor before using the new database-backed app.
