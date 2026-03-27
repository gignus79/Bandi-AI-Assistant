# Bandi AI Assistant

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Clerk-auth-6C47FF?logo=clerk&logoColor=white)](https://clerk.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-000?logo=drizzle&logoColor=white)](https://orm.drizzle.team/)
[![Stripe](https://img.shields.io/badge/Stripe-payments-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![Vercel](https://img.shields.io/badge/Vercel-deploy-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-Proprietary-8b5cf6)](./LICENSE)

Applicazione **Next.js** per professionisti e organizzazioni che devono leggere bandi complessi: carica documenti o URL, ottieni **analisi strutturate** (requisiti, scadenze, criteri) e **chat contestuale** con output leggibile. Include autenticazione, piani di utilizzo e abbonamenti.

**MediaMatter** · Giorgio Lovecchio

---

## Funzionalità principali

| Area | Contenuto |
|------|-----------|
| **Ingestione** | PDF, fogli di calcolo, testo, immagini; più URL con crawling e individuazione PDF collegati |
| **Analisi** | Sintesi, requisiti, scadenze, suggerimenti tramite modelli OpenAI / Anthropic |
| **Chat** | Assistente sul singolo bando, rendering Markdown con formattazione curata |
| **Export** | Markdown, PDF, calendario (.ics) |
| **Business** | Clerk (auth), Stripe (checkout abbonamenti), limiti d’uso e piani |

---

## Stack tecnico

| Layer | Tecnologie |
|--------|------------|
| **App** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| **Auth** | Clerk (sessioni, OAuth, middleware) |
| **Dati** | PostgreSQL, Drizzle ORM |
| **Pagamenti** | Stripe Billing (Checkout, webhook) |
| **AI** | OpenAI API, Anthropic API (analisi e chat) |
| **Test** | Vitest (unit), ESLint |

---

## Requisiti

- **Node.js** 18+
- Account **Clerk**, database **PostgreSQL** (es. Neon, Vercel Postgres)
- Chiavi **LLM** e opzionalmente **Stripe** per uso completo in locale/produzione

---

## Avvio in locale

1. **Clona** il repository e installa le dipendenze:

   ```bash
   git clone <url-del-repository>
   cd bandi-ai-assistant
   npm install
   ```

2. **Variabili d’ambiente**  
   Copia `.env.example` in `.env.local`. Compila i valori reali **solo** in `.env.local` (file ignorato da Git). Consulta i commenti in `.env.example` per il significato di ogni variabile.

3. **Schema database** (allinea il DB allo schema Drizzle):

   ```bash
   npm run db:push
   ```

   In alternativa, per progetti che usano migrazioni versionate: `npm run db:generate` e `npm run db:migrate`.

4. **Sviluppo**

   ```bash
   npm run dev
   ```

   Apri [http://localhost:3000](http://localhost:3000).

La **build di produzione** (`npm run build`) richiede le variabili obbligatorie disponibili in fase di build (in particolare chiavi Clerk pubbliche e URL app dove previsto).

---

## Script npm

| Comando | Uso |
|---------|-----|
| `npm run dev` | Server di sviluppo |
| `npm run build` / `npm run start` | Build e avvio produzione |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (unit) |
| `npm run db:push` | Sincronizza schema Drizzle → DB |
| `npm run db:generate` / `db:migrate` | Migrazioni SQL (workflow classico Drizzle) |

---

## Sicurezza e segreti

- **Non committare** `.env`, `.env.local` né chiavi API. Il repository include solo `.env.example` con placeholder.
- **Clerk**: usa chiavi `pk_test_` / `sk_test_` in sviluppo e `pk_live_` / `sk_live_` in produzione; allinea `NEXT_PUBLIC_APP_URL` e i domini autorizzati nella dashboard Clerk.
- **Stripe**: `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` solo lato server; il webhook verifica la firma delle richieste in ingresso.
- **LLM**: `OPENAI_API_KEY` e `ANTHROPIC_API_KEY` restano su variabili server-only (mai esposte al client).
- **Database**: stringa di connessione con TLS (`sslmode=require` dove applicabile) e accesso limitato per ambiente.
- **Multi-app / marketing**: `NEXT_PUBLIC_APP_SLUG` identifica il deploy senza mettere dati sensibili nel client; l’attribuzione utente è descritta in codice (metadata Clerk/Stripe/DB).

Per dettagli operativi su domini, webhook e OAuth, usa la documentazione interna di deploy (non versionata) e le console Clerk / Stripe / Vercel.

---

## Deploy

Progetto pensato per **Vercel**: collega il repository, imposta le variabili d’ambiente per Production (e Preview se serve), configura il webhook Stripe verso `https://<tuo-dominio>/api/webhooks/stripe` e ridistribuisci dopo ogni modifica alle variabili.

---

## Qualità del codice (check locale)

Prima di una release o di una PR, conviene eseguire:

```bash
npm run test
npm run lint
npm run build
```

I test unitari coprono helper (URL, Markdown chat, identità app); non sostituiscono test end-to-end su browser o integrazione reale con API esterne.

---

## Clerk e Google OAuth (note rapide)

- **`NEXT_PUBLIC_APP_URL`**: in produzione deve coincidere con l’origine effettiva del sito (schema + host, coerenza sugli slash finali). Ridistribuire dopo le modifiche.
- **Google Cloud Console**: *Authorized JavaScript origins* e *Authorized redirect URIs* devono includere gli URL indicati da Clerk per l’ambiente in uso.
- **Errore `invalid_scope` con `user`**: Google non accetta lo scope letterale `user`. In Clerk → Google, rimuovi scope personalizzati non validi e usa i default documentati.

Se compare un errore sulle **Production Keys** o sull’header **Origin**, verifica che l’hostname da cui apri l’app sia registrato in **Clerk → Domains** e che non si mescolino chiavi live con URL di preview non autorizzati. Opzionale: `NEXT_PUBLIC_CLERK_ALLOWED_ORIGINS` per origini aggiuntive (es. preview Vercel).

---

## Documentazione aggiuntiva

- Cartella `docs/` per note interne (es. conformità).
- Pagine legali nell’app: Privacy, Cookie policy.

---

## Licenza

Il codice è **proprietario** e non è rilasciato come open source. Vedi [`LICENSE`](./LICENSE). L’uso del servizio hosted e gli abbonamenti sono regolati dai termini mostrati nell’applicazione e dagli accordi con Stripe Checkout.
