-- =====================================================================
-- Gym App — Schema iniziale (unificato)
-- Ruoli: admin | coach | user
-- Accesso: invite-only (admin/coach invitano; utenti non si auto-registrano)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENUM
-- ---------------------------------------------------------------------
create type public.user_role as enum ('admin', 'coach', 'user');
create type public.workout_structure as enum ('weekly', 'rotation', 'single');
create type public.invite_status as enum ('pending', 'accepted', 'revoked', 'expired');

-- ---------------------------------------------------------------------
-- 2. profiles (estende auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'user',
  full_name text,
  avatar_url text,
  phone text,
  date_of_birth date,
  notes text,                      -- note coach sull'allievo (solo coach/admin)
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);
create index profiles_active_idx on public.profiles(is_active);

-- ---------------------------------------------------------------------
-- 3. exercises (libreria — preset + custom)
-- ---------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null,
  equipment text,
  description text,
  video_url text,
  is_preset boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index exercises_muscle_idx on public.exercises(muscle_group);
create index exercises_preset_idx on public.exercises(is_preset);

-- ---------------------------------------------------------------------
-- 4. workouts (schede)
-- ---------------------------------------------------------------------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete set null,
  title text not null,
  description text,
  structure public.workout_structure not null default 'weekly',
  start_date date not null default current_date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workouts_user_idx on public.workouts(user_id);
create index workouts_active_idx on public.workouts(user_id, is_active);
create index workouts_coach_idx on public.workouts(coach_id);

-- ---------------------------------------------------------------------
-- 5. workout_days (A/B/C o Lun/Mer/Ven)
-- ---------------------------------------------------------------------
create table public.workout_days (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  label text not null,
  order_index int not null default 0,
  notes text
);

create index workout_days_workout_idx on public.workout_days(workout_id, order_index);

-- ---------------------------------------------------------------------
-- 6. workout_exercises (esercizi in un giorno)
-- ---------------------------------------------------------------------
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  order_index int not null default 0,
  sets int not null default 3,
  target_reps text not null,       -- "8-10", "12", "AMRAP"
  target_weight text,
  rest_seconds int,
  notes text
);

create index workout_exercises_day_idx on public.workout_exercises(workout_day_id, order_index);

-- ---------------------------------------------------------------------
-- 7. workout_logs (sessione eseguita)
-- ---------------------------------------------------------------------
create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  performed_at timestamptz not null default now(),
  duration_minutes int,
  overall_notes text
);

create index workout_logs_user_date_idx on public.workout_logs(user_id, performed_at desc);

-- ---------------------------------------------------------------------
-- 8. exercise_logs (dettaglio serie)
-- ---------------------------------------------------------------------
create table public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references public.workout_logs(id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_number int not null,
  weight_kg numeric(6,2),
  reps_done int,
  completed boolean not null default true,
  notes text
);

create index exercise_logs_workout_idx on public.exercise_logs(workout_log_id);
create index exercise_logs_exercise_idx on public.exercise_logs(workout_exercise_id);

-- ---------------------------------------------------------------------
-- 9. invites (admin/coach invitano nuovi utenti)
-- ---------------------------------------------------------------------
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role public.user_role not null default 'user',
  invited_by uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  status public.invite_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index invites_email_idx on public.invites(email);
create index invites_token_idx on public.invites(token);
create index invites_status_idx on public.invites(status);

-- ---------------------------------------------------------------------
-- 10. activity_logs (audit per admin)
-- ---------------------------------------------------------------------
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index activity_logs_actor_idx on public.activity_logs(actor_id, created_at desc);
create index activity_logs_action_idx on public.activity_logs(action);

-- =====================================================================
-- TRIGGER: updated_at automatico
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger workouts_updated_at
  before update on public.workouts
  for each row execute function public.set_updated_at();

-- =====================================================================
-- TRIGGER: handle_new_user — legge invito per determinare il ruolo
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  assigned_role public.user_role;
  invite_record record;
begin
  select * into invite_record
  from public.invites
  where email = new.email
    and status = 'pending'
    and expires_at > now()
  order by created_at desc
  limit 1;

  if invite_record.id is not null then
    assigned_role := invite_record.role;
    update public.invites
      set status = 'accepted', accepted_at = now()
      where id = invite_record.id;
  else
    assigned_role := 'user';
  end if;

  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    assigned_role,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );

  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- HELPER: current_user_role (stable + security definer per evitare RLS ricorsiva)
-- =====================================================================
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_logs enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.invites enable row level security;
alter table public.activity_logs enable row level security;

-- ----- profiles -----
create policy "own profile read" on public.profiles
  for select using (auth.uid() = id);

create policy "own profile update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "coach/admin read all profiles" on public.profiles
  for select using (public.current_user_role() in ('coach', 'admin'));

create policy "admin full profiles" on public.profiles
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ----- exercises -----
create policy "authenticated read exercises" on public.exercises
  for select using (auth.role() = 'authenticated');

create policy "coach/admin write exercises" on public.exercises
  for insert with check (public.current_user_role() in ('coach', 'admin'));

create policy "coach/admin update exercises" on public.exercises
  for update using (public.current_user_role() in ('coach', 'admin'));

create policy "admin delete exercises" on public.exercises
  for delete using (public.current_user_role() = 'admin');

-- ----- workouts -----
create policy "user read own workouts" on public.workouts
  for select using (auth.uid() = user_id);

create policy "coach/admin read all workouts" on public.workouts
  for select using (public.current_user_role() in ('coach', 'admin'));

create policy "coach/admin write workouts" on public.workouts
  for insert with check (public.current_user_role() in ('coach', 'admin'));

create policy "coach/admin update workouts" on public.workouts
  for update using (public.current_user_role() in ('coach', 'admin'));

create policy "coach/admin delete workouts" on public.workouts
  for delete using (public.current_user_role() in ('coach', 'admin'));

-- ----- workout_days -----
create policy "read workout_days via workout" on public.workout_days
  for select using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_days.workout_id
        and (w.user_id = auth.uid() or public.current_user_role() in ('coach', 'admin'))
    )
  );

create policy "coach/admin write workout_days" on public.workout_days
  for all using (public.current_user_role() in ('coach', 'admin'))
  with check (public.current_user_role() in ('coach', 'admin'));

-- ----- workout_exercises -----
create policy "read workout_exercises via day" on public.workout_exercises
  for select using (
    exists (
      select 1 from public.workout_days wd
      join public.workouts w on w.id = wd.workout_id
      where wd.id = workout_exercises.workout_day_id
        and (w.user_id = auth.uid() or public.current_user_role() in ('coach', 'admin'))
    )
  );

create policy "coach/admin write workout_exercises" on public.workout_exercises
  for all using (public.current_user_role() in ('coach', 'admin'))
  with check (public.current_user_role() in ('coach', 'admin'));

-- ----- workout_logs -----
create policy "user own workout_logs" on public.workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "coach/admin read workout_logs" on public.workout_logs
  for select using (public.current_user_role() in ('coach', 'admin'));

-- ----- exercise_logs -----
create policy "user own exercise_logs" on public.exercise_logs
  for all using (
    exists (
      select 1 from public.workout_logs wl
      where wl.id = exercise_logs.workout_log_id and wl.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_logs wl
      where wl.id = exercise_logs.workout_log_id and wl.user_id = auth.uid()
    )
  );

create policy "coach/admin read exercise_logs" on public.exercise_logs
  for select using (public.current_user_role() in ('coach', 'admin'));

-- ----- invites -----
create policy "admin full invites" on public.invites
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "coach create user invites" on public.invites
  for insert with check (
    public.current_user_role() = 'coach' and role = 'user'
  );

create policy "coach read own invites" on public.invites
  for select using (
    public.current_user_role() = 'coach' and invited_by = auth.uid()
  );

-- ----- activity_logs -----
create policy "admin read activity_logs" on public.activity_logs
  for select using (public.current_user_role() = 'admin');

create policy "authenticated insert activity_logs" on public.activity_logs
  for insert with check (auth.uid() = actor_id);

-- =====================================================================
-- GRANT — permessi base sui ruoli Supabase.
-- RLS resta la prima difesa; questi grant abilitano solo l'OPERAZIONE
-- (poi la policy dice se passa o no). Senza, anche con policy giuste
-- otteniamo "permission denied for table".
-- =====================================================================

grant usage on schema public to postgres, anon, authenticated, service_role;

grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all on tables to service_role;

grant usage, select on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;

grant execute on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

-- =====================================================================
-- SEED: libreria esercizi preimpostati (40)
-- =====================================================================
insert into public.exercises (name, muscle_group, equipment, is_preset) values
  -- Petto
  ('Panca piana', 'petto', 'bilanciere', true),
  ('Panca inclinata', 'petto', 'bilanciere', true),
  ('Panca con manubri', 'petto', 'manubri', true),
  ('Croci ai cavi', 'petto', 'cavi', true),
  ('Dip alle parallele', 'petto', 'corpo libero', true),
  ('Push-up', 'petto', 'corpo libero', true),
  -- Schiena
  ('Stacco da terra', 'schiena', 'bilanciere', true),
  ('Trazioni alla sbarra', 'schiena', 'corpo libero', true),
  ('Rematore bilanciere', 'schiena', 'bilanciere', true),
  ('Rematore manubrio', 'schiena', 'manubri', true),
  ('Lat machine', 'schiena', 'macchina', true),
  ('Pulley basso', 'schiena', 'cavi', true),
  -- Gambe
  ('Squat', 'gambe', 'bilanciere', true),
  ('Front squat', 'gambe', 'bilanciere', true),
  ('Leg press', 'gambe', 'macchina', true),
  ('Affondi', 'gambe', 'manubri', true),
  ('Stacco rumeno', 'gambe', 'bilanciere', true),
  ('Leg curl', 'gambe', 'macchina', true),
  ('Leg extension', 'gambe', 'macchina', true),
  ('Calf in piedi', 'gambe', 'macchina', true),
  -- Spalle
  ('Military press', 'spalle', 'bilanciere', true),
  ('Lento avanti manubri', 'spalle', 'manubri', true),
  ('Alzate laterali', 'spalle', 'manubri', true),
  ('Alzate posteriori', 'spalle', 'manubri', true),
  ('Arnold press', 'spalle', 'manubri', true),
  -- Braccia
  ('Curl bilanciere', 'braccia', 'bilanciere', true),
  ('Curl manubri', 'braccia', 'manubri', true),
  ('Curl a martello', 'braccia', 'manubri', true),
  ('French press', 'braccia', 'bilanciere', true),
  ('Push down ai cavi', 'braccia', 'cavi', true),
  ('Dip per tricipiti', 'braccia', 'corpo libero', true),
  -- Core
  ('Plank', 'core', 'corpo libero', true),
  ('Crunch', 'core', 'corpo libero', true),
  ('Russian twist', 'core', 'corpo libero', true),
  ('Hanging leg raise', 'core', 'corpo libero', true),
  ('Ab wheel', 'core', 'attrezzo', true),
  -- Cardio
  ('Corsa', 'cardio', 'tapis roulant', true),
  ('Bicicletta', 'cardio', 'cyclette', true),
  ('Vogatore', 'cardio', 'vogatore', true),
  ('Salto con la corda', 'cardio', 'corda', true);

-- =====================================================================
-- Setup primo admin:
-- 1. In Supabase: Auth → Users → Invite user con la tua email
-- 2. Imposta la password dal link
-- 3. SQL Editor: update public.profiles set role = 'admin' where id = '<tuo-id>';
-- =====================================================================
