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

## Login con Google (Clerk) — troubleshooting

Se compare un errore OAuth legato a scope (`openid`, `userinfo.email`, `userinfo.profile`) o messaggi tipo token / utente non valido:

1. **`NEXT_PUBLIC_APP_URL`** in produzione deve coincidere **esattamente** con l’origine del sito (es. `https://webapp.bandiassistant.giorgiolovecchio.com`, **senza** slash finale). Dopo ogni modifica, ridistribuisci l’app.
2. **Clerk Dashboard** → *User & Authentication* → *Social connections* → **Google**: abilita la connessione e incolla **Client ID** e **Client secret** dalla Google Cloud Console (OAuth 2.0 Client di tipo *Web application*).
3. **Google Cloud Console** → *APIs & Services* → *Credentials* → il client OAuth usato da Clerk deve avere:
   - **Authorized JavaScript origins**: l’URL del tuo sito e gli URL indicati da Clerk per il tuo ambiente (Frontend API / hosted pages).
   - **Authorized redirect URIs**: gli URI di callback che Clerk mostra nella configurazione Google (copiali dalla dashboard Clerk; non inventarli).
4. **Ambiente chiavi**: in locale usa le chiavi **publishable/secret** di sviluppo (`pk_test_` / `sk_test_`); in produzione le chiavi **live** (`pk_live_` / `sk_live_`). Mischio dev/prod tra URL e chiavi causa errori al login.
5. **OAuth consent screen**: se l’app Google è in modalità *Testing*, solo gli utenti di test possono accedere; in *Production* verifica dominio e schermata di consenso.

### Errore Google `400: invalid_scope` — `invalid=[user]`

Google rifiuta la richiesta se tra gli scope c’è il valore letterale **`user`**: **non è uno scope OAuth valido** (non va confuso con `profile` o con gli URL `userinfo.*`).

1. Apri **[Clerk Dashboard](https://dashboard.clerk.com)** → la tua applicazione → **User & Authentication** → **Social connections** → **Google**.
2. Cerca **`Custom scopes`**, **`Additional scopes`** o campo simile dove sono elencati scope extra e **rimuovi** qualsiasi voce `user` (o lascia solo gli scope standard / lista vuota per usare i default di Clerk).
3. Salva, attendi 1–2 minuti e riprova il login con Google.

Se in passato è stato aggiunto `user` pensando alla “info utente”, gli scope corretti sono già quelli predefiniti (`openid`, `email` / `userinfo.email`, `profile` / `userinfo.profile`), non la parola `user` da sola.

Il middleware include `authorizedParties` basato su `NEXT_PUBLIC_APP_URL`, più `http://localhost:3000` in sviluppo, l’host `VERCEL_URL` sui deploy Vercel e, se serve, **`NEXT_PUBLIC_CLERK_ALLOWED_ORIGINS`** (lista separata da virgole).

### «Production Keys are only allowed for domain …» / errore sull’header Origin

L’app deve essere aperta da un **hostname** presente nella configurazione **Domains** dell’applicazione Clerk in produzione. Se usi solo `pk_live_` ma visiti un dominio non registrato (es. `*.vercel.app` senza averlo aggiunto in Clerk), il caricamento di Clerk fallisce. Aggiungi in Clerk il dominio reale degli utenti e allinea `NEXT_PUBLIC_APP_URL`.

---

## Documentazione interna

Nella cartella `docs/` trovi guida per:

- Note su sicurezza e conformità

Il file `.env.example` elenca le variabili d’ambiente necessarie senza valori sensibili.

---

## Licenza

Il codice è **proprietario** e **non** è rilasciato come open source. Vedi il file [`LICENSE`](./LICENSE) nel repository. L’uso dell’applicazione hosted e i piani di abbonamento sono regolati dai termini mostrati nell’app e dagli accordi con lo Stripe Checkout.
