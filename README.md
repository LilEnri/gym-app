# Gym App

Web app per la gestione di una palestra — tre ruoli (admin, coach, allievo), schede personalizzate, storico, statistiche.

**Stack**: Next.js 15 · TypeScript · Tailwind CSS v4 · Supabase (Auth + Postgres + RLS) · Vercel.

> Architettura, pattern, sicurezza → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Setup

### 1. Node.js 20+

[Scarica](https://nodejs.org/) e installa.

### 2. Dipendenze

```bash
npm install
```

### 3. Supabase

1. Crea un progetto su [supabase.com](https://supabase.com).
2. **SQL Editor** → incolla il contenuto di `supabase/migrations/0001_initial.sql` → Run.
3. Copia URL, anon key e service role key (Project Settings → API) in `.env.local`:

```bash
cp .env.example .env.local
```

### 4. Crea il primo admin

Dato che l'app è **invite-only**, il primo admin si crea a mano:

1. In Supabase: **Auth → Users → Invite user** con la tua email.
2. Apri il link ricevuto via email, scegli una password.
3. **SQL Editor**:
   ```sql
   update public.profiles set role = 'admin' where id = '<tuo-user-id>';
   ```
   (trovi l'`id` in `Auth → Users` o in `Table Editor → profiles`)

### 5. Avvia in locale

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) e accedi.

## Flusso invito

1. Admin/coach inserisce un nuovo invito nella tabella `invites` (email + ruolo + token random + `invited_by`).
2. L'admin/coach manda all'utente il link `https://app.example.com/accept-invite?token=<token>`.
3. L'utente apre il link, vede l'email pre-compilata, sceglie nome + password.
4. Al `auth.signUp()`, il trigger `handle_new_user()` cerca un invito pending per quella email, assegna il ruolo dell'invito e lo marca come `accepted`.

> In una iterazione successiva costruiamo l'UI per generare inviti + manderemo l'email tramite Resend / Supabase Auth Admin API.

## Ruoli e route

| Ruolo  | Path     | Cosa vede |
|--------|----------|-----------|
| user   | `/user`  | Scheda attiva, storico, statistiche, profilo |
| coach  | `/coach` | Allievi, schede, esercizi |
| admin  | `/admin` | Utenti, log, impostazioni |

Il `middleware.ts` intercetta tutte le request, rinfresca la sessione e blocca route non autorizzate. Le RLS policy sul DB garantiscono che il client non possa leggere/scrivere fuori dai propri permessi anche se il middleware viene aggirato.

## Deploy su Vercel

1. Push su GitHub.
2. [vercel.com/new](https://vercel.com/new) → seleziona il repo.
3. Aggiungi le env var in **Project Settings → Environment Variables** (le stesse di `.env.example`).
4. Deploy.

## Design

- **Liquid glass**: `backdrop-filter: blur()` su gradienti trasparenti. Utility `.glass`, `.glass-strong`, `.glass-brand` in `src/app/globals.css`.
- **Palette**: rosso `--color-brand-*` su sfondo quasi nero, con orbs sfumati animati.
- **Mobile-first**: bottom nav su mobile, sidebar su desktop (≥1024px). Safe-area iOS.
- **Font**: Inter per il testo, Bricolage Grotesque per i display headings.
