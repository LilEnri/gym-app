-- =====================================================================
-- 0002 — Patch al sistema inviti
-- 1. Aggiunge profiles.invited_by per tracciare chi ha invitato l'utente
-- 2. Aggiorna handle_new_user per popolarlo dall'invito
-- 3. Aggiunge RLS UPDATE policy mancante: coach può revocare propri inviti
-- =====================================================================

-- 1. Colonna invited_by ----------------------------------------------------
alter table public.profiles
  add column if not exists invited_by uuid references public.profiles(id) on delete set null;

create index if not exists profiles_invited_by_idx on public.profiles(invited_by);

-- 2. Trigger handle_new_user aggiornato ----------------------------------
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

    insert into public.profiles (id, role, full_name, invited_by)
    values (
      new.id,
      assigned_role,
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      invite_record.invited_by
    );
  else
    insert into public.profiles (id, role, full_name)
    values (
      new.id,
      'user',
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
    );
  end if;

  return new;
end; $$;

-- 3. RLS: coach può aggiornare i propri inviti (revoca) -----------------
drop policy if exists "coach update own invites" on public.invites;

create policy "coach update own invites" on public.invites
  for update
  using (
    public.current_user_role() = 'coach' and invited_by = auth.uid()
  )
  with check (
    public.current_user_role() = 'coach' and invited_by = auth.uid()
  );

-- 4. Backfill invited_by per profili creati prima di questa patch -------
-- Se l'utente fu creato accettando un invito ma senza il campo, lo recuperiamo
-- dall'email dell'invito (status accepted, invited_by più recente).
update public.profiles p
set invited_by = sub.invited_by
from (
  select distinct on (i.email) i.email, i.invited_by
  from public.invites i
  where i.status = 'accepted'
  order by i.email, i.accepted_at desc nulls last
) sub
join auth.users u on u.email = sub.email
where p.id = u.id and p.invited_by is null;
