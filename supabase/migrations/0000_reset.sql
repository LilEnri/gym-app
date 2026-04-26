-- =====================================================================
-- RESET SCHEMA — usa SOLO in dev quando vuoi ripartire da zero.
-- Cancella tutto in public (tabelle, type, function, trigger, dati).
-- auth.users NON viene toccato (account utenti restano).
-- =====================================================================

drop schema public cascade;
create schema public;
grant all on schema public to postgres;
grant all on schema public to anon, authenticated, service_role;

-- Dopo questo, esegui 0001_initial.sql per ricreare lo schema.
