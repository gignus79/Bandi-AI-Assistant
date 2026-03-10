import path from "path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Carica .env e .env.local quando esegui drizzle-kit da terminale (Next non è in esecuzione)
config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), ".env.local") });

const connectionUrl = process.env.POSTGRES_URL;
if (!connectionUrl) {
  throw new Error(
    "POSTGRES_URL non trovata. Aggiungila in .env.local (o .env) e riprova."
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionUrl,
  },
});
