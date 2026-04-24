-- =====================================================================
-- Gym App — Schema iniziale
-- Ruoli: admin | coach | user
-- =====================================================================

-- Enum ruoli
create type public.user_role as enum ('admin', 'coach', 'user');

-- ---------------------------------------------------------------------
-- profiles (estende auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'user',
  full_name text,
  avatar_url text,
  phone text,
  date_of_birth date,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger updated_at generico
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-crea profilo alla registrazione
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- coach_athletes (relazione coach ↔ allievi)
-- ---------------------------------------------------------------------
create table public.coach_athletes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  unique (coach_id, athlete_id)
);

create index coach_athletes_coach_idx on public.coach_athletes(coach_id);
create index coach_athletes_athlete_idx on public.coach_athletes(athlete_id);

-- ---------------------------------------------------------------------
-- exercises (libreria esercizi)
-- ---------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null,
  equipment text,
  description text,
  video_url text,
  created_by uuid references public.profiles(id) on delete set null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index exercises_muscle_group_idx on public.exercises(muscle_group);

-- ---------------------------------------------------------------------
-- workout_plans (schede)
-- ---------------------------------------------------------------------
create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  notes text,
  start_date date,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_plans_athlete_idx on public.workout_plans(athlete_id);
create index workout_plans_coach_idx on public.workout_plans(coach_id);

create trigger workout_plans_set_updated_at
before update on public.workout_plans
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- plan_days (giorni di una scheda)
-- ---------------------------------------------------------------------
create table public.plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  day_number int not null,
  name text not null,
  unique (plan_id, day_number)
);

-- ---------------------------------------------------------------------
-- plan_exercises (esercizi di un giorno)
-- ---------------------------------------------------------------------
create table public.plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references public.plan_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  order_index int not null default 0,
  sets int not null,
  reps text not null,          -- es. "8-10" o "12"
  rest_seconds int,
  weight_kg numeric(6,2),
  notes text
);

create index plan_exercises_day_idx on public.plan_exercises(plan_day_id);

-- ---------------------------------------------------------------------
-- workout_logs (storico allenamenti eseguiti)
-- ---------------------------------------------------------------------
create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  plan_exercise_id uuid references public.plan_exercises(id) on delete set null,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  performed_at timestamptz not null default now(),
  sets_completed int not null,
  reps_completed text,
  weight_kg numeric(6,2),
  notes text
);

create index workout_logs_athlete_idx on public.workout_logs(athlete_id, performed_at desc);
create index workout_logs_exercise_idx on public.workout_logs(exercise_id);

-- ---------------------------------------------------------------------
-- audit_logs (per dashboard admin)
-- ---------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs(created_at desc);

-- =====================================================================
-- Helper functions (per RLS)
-- =====================================================================

create or replace function public.current_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_coach()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'coach');
$$;

create or replace function public.is_coach_of(p_athlete uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.coach_athletes
    where coach_id = auth.uid() and athlete_id = p_athlete and active = true
  );
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.coach_athletes enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.plan_days enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.workout_logs enable row level security;
alter table public.audit_logs enable row level security;

-- profiles ------------------------------------------------------------
create policy profiles_self_select on public.profiles
  for select using (id = auth.uid());

create policy profiles_coach_select_athletes on public.profiles
  for select using (public.is_coach_of(id));

create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy profiles_self_update on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- coach_athletes ------------------------------------------------------
create policy ca_coach_manage on public.coach_athletes
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid() and public.is_coach());

create policy ca_athlete_select on public.coach_athletes
  for select using (athlete_id = auth.uid());

create policy ca_admin_all on public.coach_athletes
  for all using (public.is_admin()) with check (public.is_admin());

-- exercises -----------------------------------------------------------
create policy exercises_read on public.exercises
  for select using (is_public or created_by = auth.uid() or public.is_admin());

create policy exercises_coach_insert on public.exercises
  for insert with check (public.is_coach() or public.is_admin());

create policy exercises_owner_update on public.exercises
  for update using (created_by = auth.uid() or public.is_admin());

create policy exercises_admin_delete on public.exercises
  for delete using (public.is_admin());

-- workout_plans -------------------------------------------------------
create policy wp_coach_manage on public.workout_plans
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid() and public.is_coach_of(athlete_id));

create policy wp_athlete_select on public.workout_plans
  for select using (athlete_id = auth.uid());

create policy wp_admin_all on public.workout_plans
  for all using (public.is_admin()) with check (public.is_admin());

-- plan_days -----------------------------------------------------------
create policy pd_via_plan on public.plan_days
  for all using (
    exists (select 1 from public.workout_plans p
            where p.id = plan_id
              and (p.coach_id = auth.uid() or p.athlete_id = auth.uid() or public.is_admin()))
  ) with check (
    exists (select 1 from public.workout_plans p
            where p.id = plan_id
              and (p.coach_id = auth.uid() or public.is_admin()))
  );

-- plan_exercises ------------------------------------------------------
create policy pe_via_day on public.plan_exercises
  for all using (
    exists (select 1 from public.plan_days d
            join public.workout_plans p on p.id = d.plan_id
            where d.id = plan_day_id
              and (p.coach_id = auth.uid() or p.athlete_id = auth.uid() or public.is_admin()))
  ) with check (
    exists (select 1 from public.plan_days d
            join public.workout_plans p on p.id = d.plan_id
            where d.id = plan_day_id
              and (p.coach_id = auth.uid() or public.is_admin()))
  );

-- workout_logs --------------------------------------------------------
create policy wl_athlete_manage on public.workout_logs
  for all using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());

create policy wl_coach_read on public.workout_logs
  for select using (public.is_coach_of(athlete_id));

create policy wl_admin_all on public.workout_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- audit_logs ----------------------------------------------------------
create policy al_admin_only on public.audit_logs
  for all using (public.is_admin()) with check (public.is_admin());
