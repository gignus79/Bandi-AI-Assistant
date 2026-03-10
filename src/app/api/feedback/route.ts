import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { ensureUser } from "@/lib/db/users";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";

const zBody = z.object({
  message: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    await ensureUser(userId);
    const body = await req.json();
    const parsed = zBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Messaggio non valido (max 2000 caratteri)." },
        { status: 400 }
      );
    }
    await db.insert(feedback).values({
      userId,
      message: parsed.data.message,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Feedback error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore" },
      { status: 500 }
    );
  }
}
