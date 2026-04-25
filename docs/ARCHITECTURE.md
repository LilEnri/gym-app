# Architettura

Questo documento spiega le scelte tecniche di Gym App e i pattern da seguire.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
  - Server Components di default → niente JS lato client se non serve.
  - Route Handlers per API privilegiate (inviti, ruoli, blocco utenti).
  - Vercel come deploy target — preview automatica su ogni PR.
- **Tailwind CSS v4** (config CSS-based via `@theme`).
- **Supabase**: Postgres + Auth + Storage + Realtime in un unico servizio.
  - Row Level Security su tutte le tabelle → autorizzazione delegata al DB.
  - Trigger Postgres per logiche server-side (creazione profilo, lookup invito).

## Sicurezza

1. **RLS attivo su TUTTE le tabelle** — nessuna tabella aperta di default.
2. **Service role key** SOLO in `src/lib/supabase/admin.ts`. Mai esposta al client. Usata da Route Handler / Server Action lato server per: invitare utenti, cambiare ruolo, disattivare account.
3. **Middleware** rinfresca la sessione ad ogni richiesta. I token Supabase hanno TTL breve, il middleware li rotea trasparentemente.
4. **Trigger `handle_new_user()`** assegna il ruolo cercando un invito valido per la stessa email. Gira con `security definer` → un utente non può auto-promuoversi.
5. **Funzione `current_user_role()`** è `stable` + `security definer` per evitare ricorsioni RLS infinite (la policy su `profiles` userebbe una select su `profiles`).

## Pattern

### Lettura in Server Component (default)

```tsx
// src/app/(dashboard)/coach/athletes/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('*').eq('role', 'user');
  return <AthletesList data={data ?? []} />;
}
```

> Nota: in Next 15 `cookies()` è async, quindi anche `createClient()` lato server è async.

### Mutazione → Server Action

```tsx
// src/app/(dashboard)/coach/workouts/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createWorkout(formData: FormData) {
  const supabase = await createClient();
  // ... insert
  revalidatePath('/coach/workouts');
}
```

### Operazione privilegiata → Route Handler con admin client

Per operazioni che richiedono bypass dell'RLS (invitare un utente, promuovere a admin):

```tsx
// src/app/api/admin/invite/route.ts
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  // 1. verifica che l'utente loggato sia admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single();
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 });

  // 2. usa admin client per azione privilegiata
  const admin = createAdminClient();
  // admin.auth.admin.inviteUserByEmail(...)
}
```

### Query relazionali — usa la sintassi nested di PostgREST

```ts
// ✅ Una sola roundtrip, RLS rispettata
supabase.from('workouts').select('*, workout_days(*, workout_exercises(*, exercises(*)))');
```

## Cosa NON fare

- ❌ `createAdminClient()` in un Client Component o Server Component renderizzato → esporrebbe la service role key.
- ❌ Disabilitare RLS in dev "per comodità". Si finisce per dimenticarlo.
- ❌ Salvare ruoli/permessi in localStorage / cookie non-httpOnly. L'unica fonte di verità è `profiles.role`.
- ❌ Auto-registrazione libera. L'app è invite-only — un utente entra solo se admin/coach lo invita.

## Struttura cartelle

```
src/
  app/
    (auth)/                 # gruppo route — nessun layout autenticato
      layout.tsx            # background con orbs
      login/                # email + password (utente già esistente)
      accept-invite/        # accetta invito → set password → entra
    (dashboard)/            # gruppo route — protetto da auth
      layout.tsx            # check auth + AppShell con nav
      user/                 # area allievo
      coach/                # area coach
      admin/                # area admin
    auth/signout/           # POST → logout
    page.tsx                # / → redirect /login o /{role}
    layout.tsx              # root: font, viewport, manifest
    globals.css             # Tailwind v4 + utility liquid glass
  components/
    ui/                     # primitives (Button, Input, GlassCard)
    app-shell.tsx           # sidebar desktop + bottom nav mobile
    placeholder.tsx         # placeholder "coming soon"
  lib/
    supabase/
      client.ts             # browser client (browser only)
      server.ts             # server client (cookies-aware)
      middleware.ts         # session refresh + role guard
      admin.ts              # service-role client (server only!)
      database.types.ts     # tipi Postgres (manuali per ora)
    utils.ts                # cn() helper
  middleware.ts             # entry middleware Next
supabase/
  migrations/
    0001_initial.sql        # schema + RLS + seed (esegui in SQL Editor)
public/
  manifest.json             # PWA
  icons/                    # icon-192/512.png
docs/
  ARCHITECTURE.md           # questo file
```
