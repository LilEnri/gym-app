# Gym App

Web app per la gestione di una palestra — tre ruoli (admin, coach, allievo), schede personalizzate, storico e statistiche.

**Stack**: Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Auth + Postgres + RLS) · Vercel.

## Setup rapido

### 1. Installa Node.js

Node 20+ richiesto. [Scarica qui](https://nodejs.org/) se non lo hai.

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Configura Supabase

1. Crea un progetto su [supabase.com](https://supabase.com).
2. Apri **SQL Editor** → incolla il contenuto di `supabase/migrations/0001_initial.sql` → esegui.
3. Copia URL e anon key (Project Settings → API) in `.env.local`:

```bash
cp .env.example .env.local
# poi compila NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 4. Avvia in locale

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Come promuovere un utente a coach/admin

Ogni registrazione crea di default un profilo con ruolo `user`. Per promuoverlo:

```sql
-- In Supabase SQL Editor
update public.profiles set role = 'coach' where id = '<user-id>';
-- oppure 'admin'
```

Poi collega un allievo a un coach:

```sql
insert into public.coach_athletes (coach_id, athlete_id)
values ('<coach-user-id>', '<athlete-user-id>');
```

## Struttura

```
src/
  app/
    (auth)/          # login, register
    (app)/           # area autenticata, sidebar + bottom nav
      dashboard/     # home utente
      coach/         # area coach
      admin/         # area admin
    auth/signout/    # route POST per logout
    locked/          # schermata utente bloccato
  components/
    ui/              # Button, Input, GlassCard
    app-shell.tsx    # layout sidebar + bottom nav
  lib/
    supabase/        # client browser, server, middleware, types
    utils.ts
  middleware.ts      # session refresh + role guard
supabase/migrations/ # schema SQL
```

## Deploy su Vercel

1. Pusha il repo su GitHub.
2. Su Vercel → "New Project" → seleziona il repo.
3. Aggiungi le env var da `.env.example` nelle Project Settings.
4. Deploy.

## Design

- **Liquid glass**: `backdrop-filter` + gradienti su trasparenze bianche. Utility `.glass`, `.glass-strong`, `.glass-brand` in `globals.css`.
- **Palette**: rosso (`--color-brand-*`) su sfondo scuro quasi nero con orbs sfocati animati.
- **Mobile-first**: bottom nav + topbar su mobile, sidebar su desktop (≥1024px).

## Ruoli

| Ruolo  | Path            | Capacità |
|--------|-----------------|----------|
| user   | `/dashboard`    | Visualizza scheda attuale, storico, statistiche |
| coach  | `/coach`        | Gestisce allievi, crea schede, libreria esercizi |
| admin  | `/admin`        | Gestione utenti, log, blocco account |

Il `middleware.ts` protegge le route in base al ruolo. Le RLS policy sul DB garantiscono che il client non possa leggere/scrivere dati fuori dai suoi permessi.
