import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { ensureUser } from "@/lib/db/users";
import { db } from "@/lib/db";
import { bandoFolders } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

const zPost = z.object({
  name: z.string().min(1).max(120),
});

export async function GET() {
  try {
    const userId = await requireAuth();
    await ensureUser(userId);
    const list = await db
      .select()
      .from(bandoFolders)
      .where(eq(bandoFolders.userId, userId))
      .orderBy(asc(bandoFolders.name));
    return NextResponse.json(list);
  } catch (err) {
    console.error("Folders list error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    await ensureUser(userId);
    const parsed = zPost.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload non valido.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const [created] = await db
      .insert(bandoFolders)
      .values({ userId, name: parsed.data.name.trim() })
      .returning();
    return NextResponse.json(created);
  } catch (err) {
    console.error("Folder create error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore" },
      { status: 500 }
    );
  }
}
