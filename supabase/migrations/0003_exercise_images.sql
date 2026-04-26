-- =====================================================================
-- 0003 — Aggiunge image_url alla tabella exercises
-- Rimuoviamo la dipendenza da video_url (resta presente, opzionale).
-- =====================================================================

alter table public.exercises
  add column if not exists image_url text;

-- Aggiorna config Next per accettare immagini da host comuni:
-- (lato app: next.config.ts gia accetta supabase.co; per altri domini
-- aggiungerli manualmente o usare <img> normale.)
