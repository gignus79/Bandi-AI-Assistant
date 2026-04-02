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
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` solo server-side; il webhook verifica la firma delle richieste.
- **Clerk webhooks**: endpoint `POST /api/webhooks/clerk`, variabile `CLERK_WEBHOOK_SIGNING_SECRET` (signing secret della dashboard). L’URL in Clerk deve coincidere con il dominio pubblico dell’app.
- **LLM**: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` solo su variabili server.
- **Database**: connessione TLS (`sslmode=require` dove richiesto), accesso ristretto per ambiente.
- **Multi-app**: `NEXT_PUBLIC_APP_SLUG` per attribuzione deploy (metadata Clerk/Stripe/DB).

---

## Deploy

**Vercel**: collegare il repository, impostare le variabili per Production (e Preview se serve). Webhook Stripe: `https://<dominio>/api/webhooks/stripe`. Webhook Clerk: `https://<dominio>/api/webhooks/clerk` con lo stesso signing secret di `CLERK_WEBHOOK_SIGNING_SECRET`. Ridistribuire dopo modifiche alle variabili.

---

## Verifica locale

```bash
npm run test
npm run lint
npm run build
```

I test unitari coprono helper (URL, Markdown, identità app). E2E e integrazione con API esterne sono fuori scope.

---

## Clerk: OAuth e domini

- `NEXT_PUBLIC_APP_URL` in produzione = origine pubblica effettiva (schema, host, coerenza slash). Ridistribuire dopo modifiche.
- **Google Cloud Console**: *Authorized JavaScript origins* e *Authorized redirect URIs* come da Clerk per l’ambiente.
- Scope **`user`**: non valido per Google OAuth; in Clerk → Google rimuovere scope custom errati.
- **Production Keys / Origin**: l’hostname deve essere in **Clerk → Domains**; opzionale `NEXT_PUBLIC_CLERK_ALLOWED_ORIGINS` per preview.

### Email OTP (Clerk)

L’invio è gestito da **Clerk**, non dall’app Next.js.

- **Development**: tetto **100 email/mese** (e 20 SMS/mese) per OTP inviate da Clerk; superata la quota, le richieste OTP vengono rifiutate. Riferimento: [Test emails](https://clerk.com/docs/guides/development/testing/test-emails-and-phones). Produzione o piano adeguato per traffico reale.
- **SMTP custom** in dashboard: validare credenziali se attivo.
- Deliverability dominio proprio: [Email deliverability](https://clerk.com/docs/guides/development/email-deliverability).
- Test senza inbox: `nome+clerk_test@example.com`, codice **`424242`** ([doc](https://clerk.com/docs/guides/development/testing/test-emails-and-phones)).

---

## Documentazione aggiuntiva

- `docs/` — note interne (conformità, sicurezza).
- Privacy e Cookie policy nell’app.

---

## Licenza

Codice **proprietario**. Vedi [`LICENSE`](./LICENSE). Uso del servizio hosted e abbonamenti: termini in-app e Stripe Checkout.
