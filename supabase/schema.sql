-- Schedule chatbot tables for Supabase (PostgreSQL).
-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Then run seed.sql to load the data. Re-running this file drops and recreates the tables.

drop table if exists class_group_courses, class_groups, directory_courses, directory_teachers,
  directory_signatories, directory_meta, weekly_schedule, periods, courses, schedule_meta cascade;

-- Main timetable (one teacher) -------------------------------------------

create table schedule_meta (
  id smallint primary key default 1 check (id = 1),
  semester text,
  department text,
  teacher text,
  qualification text,
  role text,
  week_range text,
  note text,
  total_theory numeric not null check (total_theory >= 0),
  total_practice numeric not null check (total_practice >= 0),
  total_credit numeric not null check (total_credit >= 0),
  total_hours numeric not null check (total_hours >= 0)
);

create table courses (
  code text primary key,
  name text not null,
  theory numeric not null check (theory >= 0),
  practice numeric not null check (practice >= 0),
  credit numeric not null check (credit >= 0),
  hours numeric not null check (hours >= 0),
  sort_order integer not null
);

create table periods (
  period integer primary key check (period >= 1),
  time_range text not null check (time_range ~ '^\d{2}:\d{2}-\d{2}:\d{2}$')
);

create table weekly_schedule (
  id bigint generated always as identity primary key,
  day text not null check (day in ('จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์')),
  time_range text not null check (time_range ~ '^\d{2}:\d{2}-\d{2}:\d{2}$'),
  type text not null,
  course_code text not null references courses (code) on update cascade,
  room text not null,
  group_name text not null,
  students integer not null check (students >= 0),
  sort_order integer not null
);

-- Department teacher directory (from OCR, semester 1/2568) ----------------

create table directory_meta (
  id smallint primary key default 1 check (id = 1),
  source text,
  college text,
  semester text,
  department text,
  note text
);

create table directory_signatories (
  id bigint generated always as identity primary key,
  name text not null,
  position text not null,
  sort_order integer not null
);

create table directory_teachers (
  id integer primary key,
  name text not null,
  program text,
  qualification text,
  role text,
  ocr_role text,
  note text,
  source_pages integer[] not null default '{}',
  sort_order integer not null
);

create table directory_courses (
  id bigint generated always as identity primary key,
  teacher_id integer not null references directory_teachers (id) on delete cascade,
  code text,
  name text,
  ocr_name text,
  confidence text check (confidence in ('high', 'medium', 'low')),
  note text,
  sort_order integer not null
);

create table class_groups (
  id integer primary key,
  group_code text not null,
  advisor text,
  program text,
  source_pages integer[] not null default '{}',
  sort_order integer not null
);

create table class_group_courses (
  id bigint generated always as identity primary key,
  group_id integer not null references class_groups (id) on delete cascade,
  code text,
  name text,
  ocr_name text,
  confidence text check (confidence in ('high', 'medium', 'low')),
  teacher text,
  sort_order integer not null
);

-- Read-only public access -------------------------------------------------
-- The chatbot reads with the publishable (anon) key. Nobody can write through
-- the API; edit the data in the Supabase Table Editor or SQL Editor instead.

do $$
declare t text;
begin
  foreach t in array array['schedule_meta', 'courses', 'periods', 'weekly_schedule', 'directory_meta',
    'directory_signatories', 'directory_teachers', 'directory_courses', 'class_groups', 'class_group_courses']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "public read" on %I for select to anon, authenticated using (true)', t);
    execute format('grant select on %I to anon, authenticated', t);
  end loop;
end $$;
