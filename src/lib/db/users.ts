import { eq } from "drizzle-orm";
import { db } from "./index";
import { users as usersTable } from "./schema";

export async function ensureUser(id: string, email?: string | null): Promise<void> {
  const existing = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (existing.length > 0) {
    await db
      .update(usersTable)
      .set({ email: email ?? existing[0].email, updatedAt: new Date() })
      .where(eq(usersTable.id, id));
    return;
  }
  await db.insert(usersTable).values({
    id,
    email: email ?? null,
  });
}
