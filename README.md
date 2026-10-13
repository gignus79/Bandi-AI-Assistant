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

Applicazione **Next.js** per professionisti e organizzazioni che devono leggere bandi complessi: carica i documenti del bando e, se serve, la visura del soggetto, ottieni **analisi strutturate** (requisiti, scadenze, criteri), una **verifica di aderenza** e **chat contestuale**. I bandi si raggruppano in cartelle. Include autenticazione, consenso all’uso dei modelli, piani di utilizzo e abbonamenti.

**MediaMatter** · Giorgio Lovecchio

---

## Funzionalità principali

| Area | Contenuto |
|------|-----------|
| **Ingestione** | PDF, DOCX, fogli di calcolo, testo, immagini (bando, profilo/visura, moduli) |
| **Organizzazione** | Cartelle, rinomina, trascinamento dei bandi, cancellazione dalla dashboard |
| **Analisi** | Sintesi, requisiti, scadenze, criteri; verbosità della risposta a scelta |
| **Aderenza** | Confronto tra visura (e altri documenti di profilo) e requisiti del bando |
| **Moduli** | Compilazione di un modulo a partire dai documenti già caricati |
| **Suggerimenti** | Insight e grafici solo con i numeri presenti nei documenti |
| **Chat** | Assistente sul singolo bando, su tutti gli allegati; export della chat in PDF e DOCX |
| **Export** | Markdown, PDF, DOCX e calendario (.ics) di analisi e scadenze |
| **Business** | Clerk (auth), consenso AI, Stripe (checkout abbonamenti), limiti d’uso e piani |

---

## Stack tecnico

| Layer | Tecnologie |
|--------|------------|
| **App** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| **Auth** | Clerk (sessioni, OAuth, middleware) |
| **Dati** | PostgreSQL, Drizzle ORM |
| **Pagamenti** | Stripe Billing (Checkout, webhook) |
| **AI** | Anthropic Claude Opus 5.5 (default, `ANTHROPIC_MODEL`), OpenAI come fallback |
| **Test** | Vitest (unit), ESLint |

---

## Requisiti

- **Node.js** 18+
- Account **Clerk**, database **PostgreSQL** (es. Neon, Vercel Postgres)
- Chiavi **LLM** e opzionalmente **Stripe** per uso completo in locale/produzione

---

## Avvio in locale

1. Clona il repository e installa le dipendenze:

   ```bash
   git clone <url-del-repository>
   cd bandi-ai-assistant
   npm install
   ```

2. Variabili d’ambiente: copia `.env.example` in `.env.local` e imposta i valori reali (solo in `.env.local`, mai in Git).

3. Schema database:

   ```bash
   npm run db:push
   ```

   Alternativa con migrazioni SQL versionate: `npm run db:generate` e `npm run db:migrate`.

4. Sviluppo:

   ```bash
   npm run dev
   ```

   [http://localhost:3000](http://localhost:3000)

`npm run build` richiede le variabili obbligatorie in fase di build (chiavi Clerk pubbliche, `NEXT_PUBLIC_APP_URL` dove applicabile).

---

## Script npm

| Comando | Uso |
|---------|-----|
| `npm run dev` | Server di sviluppo |
| `npm run build` / `npm run start` | Build e avvio produzione |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (unit) |
| `npm run db:push` | Sincronizza schema Drizzle → DB |
| `npm run db:generate` / `db:migrate` | Migrazioni SQL (Drizzle) |

---

## Sicurezza e segreti

- Non versionare `.env`, `.env.local` né chiavi API. Template: `.env.example`.
- **Clerk**: chiavi `pk_test_` / `sk_test_` in sviluppo; `pk_live_` / `sk_live_` in produzione. Allineare `NEXT_PUBLIC_APP_URL` e domini nella dashboard Clerk.
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` solo server-side; il webhook verifica la firma delle richieste. Il checkout accetta solo i prezzi Pro e Unlimited e indirizzi di ritorno sullo stesso sito.
- **Clerk webhooks**: endpoint `POST /api/webhooks/clerk`, variabile `CLERK_WEBHOOK_SIGNING_SECRET` (signing secret della dashboard). L’URL in Clerk deve coincidere con il dominio pubblico dell’app.
- **LLM**: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` solo su variabili server.
- **Database**: connessione TLS (`sslmode=require` dove richiesto), accesso ristretto per ambiente.
- **Multi-app**: `NEXT_PUBLIC_APP_SLUG` per attribuzione deploy (metadata Clerk/Stripe/DB).

---

## Deploy

**Vercel**: collegare il repository, impostare le variabili per Production (e Preview se serve). Webhook Stripe: `https://<dominio>/api/webhooks/stripe`. Webhook Clerk: `https://<dominio>/api/webhooks/clerk` con lo stesso signing secret di `CLERK_WEBHOOK_SIGNING_SECRET`. Ridistribuire dopo modifiche alle variabili.


## Verifica locale

```bash
npm run test
npm run lint
npm run build
```

I test unitari coprono helper (URL, Markdown, identità app). E2E e integrazione con API esterne sono fuori scope.

---



## Documentazione aggiuntiva

Privacy, cookie, cancellazione dati e resi sono pagine dell’app (`/privacy`, `/cookie-policy`, `/cancellazione-dati`, `/resi-rimborsi`).

---

## Licenza

Codice **proprietario**. Vedi [`LICENSE`](./LICENSE). Uso del servizio hosted e abbonamenti: termini in-app e Stripe Checkout.
