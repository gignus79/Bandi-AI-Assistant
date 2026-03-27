# Messa in produzione (Bandi AI Assistant)

Questa guida copre dominio personalizzato su **giorgiolovecchio.com**, variabili d’ambiente, Clerk in produzione e verifiche post-deploy.

## Sottodominio consigliato

Esempi:

- `https://bandi.giorgiolovecchio.com` — chiaro e dedicato all’app  
- oppure `https://app.giorgiolovecchio.com` se preferisci un generico “app”

Scegli un solo host e usalo ovunque: **Vercel**, **Clerk** e **NEXT_PUBLIC_APP_URL** devono coincidere (stesso schema `https://` e nessuno slash finale, o coerente ovunque).

## DNS (registro dove gestisci giorgiolovecchio.com)

1. Nel pannello DNS del dominio, aggiungi un record per il sottodominio scelto:
   - **Tipo:** `CNAME`
   - **Nome / Host:** `bandi` (o `app`) — senza il dominio radice
   - **Valore / Target:** `cname.vercel-dns.com` (oppure il target indicato da Vercel nel progetto → *Domains*)

2. Attendi la propagazione (minuti–ore). In Vercel: **Project → Settings → Domains** aggiungi `bandi.giorgiolovecchio.com` e segui la verifica.

3. Se usi **Cloudflare** davanti al dominio:
   - Proxy arancione (CDN) di solito va bene con Vercel; in caso di errori SSL, prova “DNS only” (grigio) per il record del sottodominio o consulta la [documentazione Vercel sui domini](https://vercel.com/docs/concepts/projects/domains).

## Vercel

1. Collega il repository GitHub/GitLab al progetto Vercel (se non già fatto).
2. **Environment Variables** (Production, Preview, Development come serve):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — chiave **live** `pk_live_...`
   - `CLERK_SECRET_KEY` — `sk_live_...`
   - `NEXT_PUBLIC_APP_URL` — es. `https://bandi.giorgiolovecchio.com`
   - `POSTGRES_URL` — Postgres in produzione (es. Neon/Vercel Postgres)
   - Chiavi Stripe live (`STRIPE_*`, `NEXT_PUBLIC_STRIPE_*`) e webhook di produzione
   - `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` se usate in produzione

3. Ridistribuisci dopo ogni modifica alle variabili.

## Clerk (uscire da “Development”)

1. Nel [Clerk Dashboard](https://dashboard.clerk.com) seleziona l’applicazione.
2. **API Keys** → usa le chiavi **Production** (`pk_live_` / `sk_live_`) in Vercel (Production).
3. **Domains** (o **Paths**): aggiungi il dominio di produzione es. `bandi.giorgiolovecchio.com` e gli URL di callback/redirect che Clerk suggerisce (in genere allineati a `NEXT_PUBLIC_APP_URL`).
4. **Authorized redirect URLs** / **Allowed origins**: includi `https://bandi.giorgiolovecchio.com` (e le route Clerk `/sign-in`, `/sign-up` se richiesto).
5. Il middleware dell’app usa `NEXT_PUBLIC_APP_URL` per `authorizedParties`: in produzione deve essere esattamente l’URL pubblico dell’app (senza slash finale o coerente con la config Clerk). Opzionale: `NEXT_PUBLIC_CLERK_ALLOWED_ORIGINS` (origini separate da virgola) per preview Vercel o alias.

### Errore: «Production Keys are only allowed for domain …» / «HTTP Origin header must be equal to or a subdomain of the requesting URL»

Succede quando il browser apre l’app da un **host non registrato** nell’istanza Clerk di produzione (es. dominio `*.vercel.app` di preview mentre le chiavi `pk_live_` sono legate solo a `*.giorgiolovecchio.com`).

**Cosa fare:**

1. Usa in produzione **solo** l’URL pubblico previsto (es. `https://webapp.bandiassistant.giorgiolovecchio.com`) e imposta **`NEXT_PUBLIC_APP_URL`** in Vercel a quello stesso valore (nessuno slash finale).
2. In **Clerk Dashboard → Domains / Configure**, aggiungi quel **hostname** (e ogni sottodominio da cui gli utenti accedono realmente). Senza questo, Clerk rifiuta le richieste dal frontend.
3. Non mischiare **chiavi live** con URL di preview: per i deploy preview usa chiavi **test** (`pk_test_`) oppure aggiungi l’origine preview in Clerk e in `NEXT_PUBLIC_CLERK_ALLOWED_ORIGINS`.
4. Verifica che non ci siano redirect tra `www` e non-`www` che cambiano l’origine rispetto a quanto configurato.

## Scraping URL (limiti)

Il server scarica pagine e PDF con **User-Agent da browser** e timeout configurabile:

- `URL_FETCH_TIMEOUT_MS` — opzionale (default ~45s)
- `URL_SCRAPE_MAX_DEPTH`, `URL_SCRAPE_MAX_PAGES`, `URL_SCRAPE_MAX_PDFS` — opzionali

Alcuni siti bloccano IP da datacenter o richiedono CAPTCHA: in quel caso l’utente può scaricare i PDF manualmente e caricarli come file.

## Verifica post-deploy

1. Apri `https://bandi.giorgiolovecchio.com` — login Clerk funziona.
2. Dashboard e creazione bando senza errori in console.
3. Tab “Carica documenti” → prova un URL pubblico (meglio un bando con PDF in link diretti).

## Test automatici

Nel repository:

```bash
npm install
npm run test
npm run build
```
