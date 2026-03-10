import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ensureUser } from "@/lib/db/users";
import { db } from "@/lib/db";
import { bandi } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const zPost = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
});

export async function GET() {
  try {
    const userId = await requireAuth();
    await ensureUser(userId);
    const list = await db
      .select()
      .from(bandi)
      .where(eq(bandi.userId, userId))
      .orderBy(desc(bandi.updatedAt));
    return NextResponse.json(list);
  } catch (err) {
    console.error("Bandi list error:", err);
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
    const body = await req.json();
    const parsed = zPost.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload non valido.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const [created] = await db
      .insert(bandi)
      .values({
        userId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
      })
      .returning();
    return NextResponse.json(created);
  } catch (err) {
    console.error("Bando create error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore" },
      { status: 500 }
    );
  }
}
