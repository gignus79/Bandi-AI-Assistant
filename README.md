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

Applicazione web per analizzare documentazione di bandi (pubblici e privati) con intelligenza artificiale: estrae sintesi, requisiti, scadenze e suggerimenti in modo strutturato.

**MediaMatter** · Giorgio Lovecchio

---

## Cosa fa

- **Carica** documenti (PDF, fogli di calcolo, testo, immagini) o più URL e ottieni un’analisi unificata.
- **Chatta** con l’assistente sul bando: risposte formattate (titoli, elenchi, tabelle).
- **Esporta** l’analisi in Markdown o PDF e aggiungi le scadenze al calendario (.ics).

L’app gestisce autenticazione, piani di utilizzo e limiti; è predisposta per il deploy in produzione.

---

## Stack

| Area | Tecnologie |
|------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| Auth | Clerk |
| Database | PostgreSQL, Drizzle ORM |
| Pagamenti | Stripe |
| AI | OpenAI / Anthropic (analisi e chat) |

---

## Avvio in locale

**Prerequisiti:** Node.js 18+, un account Clerk, un database PostgreSQL e (opzionale) chiavi API per LLM e Stripe.

1. Clona il repository e installa le dipendenze:

   ```bash
   git clone <url-del-repo>
   cd bandi-ai-assistant
   npm install
   ```

2. Configura l’ambiente:
   - Copia `.env.example` in `.env.local`.
   - Compila le variabili indicate nel file (chiavi di autenticazione, database, eventuali servizi esterni).  
   I nomi delle variabili e dove ottenere le chiavi sono descritti in `.env.example`.

3. Inizializza il database e avvia l’app:

   ```bash
   npm run db:generate
   npm run db:push
   npm run dev
   ```

4. Apri [http://localhost:3000](http://localhost:3000).

La build (`npm run build`) richiede che le variabili obbligatorie siano impostate (ad esempio le chiavi Clerk).

---

## Deploy

Il progetto è predisposto per il deploy su **Vercel**. Dopo aver collegato il repo e impostato le variabili d’ambiente nel progetto Vercel, esegui il deploy. La documentazione interna descrive i passaggi per database e integrazioni (es. webhook) da configurare dopo il primo deploy.

---

## Licenza

Il codice è **proprietario** e **non** è rilasciato come open source. Vedi il file [`LICENSE`](./LICENSE) nel repository. L’uso dell’applicazione hosted e i piani di abbonamento sono regolati dai termini mostrati nell’app e dagli accordi con lo Stripe Checkout.
