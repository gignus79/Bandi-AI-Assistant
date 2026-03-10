# Bandi AI Assistant

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

- **Next.js 15** (App Router), **React 19**, **TypeScript**, **Tailwind CSS**
- **Clerk** (autenticazione)
- **PostgreSQL** + **Drizzle ORM**
- **Stripe** (abbonamenti)
- **OpenAI / Anthropic** (analisi e chat)

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

## Documentazione interna

Nella cartella `docs/` trovi guida per:
- Note su sicurezza e conformità

Il file `.env.example` elenca le variabili d’ambiente necessarie senza valori sensibili.

---

## Licenza

Progetto privato. Tutti i diritti riservati.
