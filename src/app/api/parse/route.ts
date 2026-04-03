import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ensureUser } from "@/lib/db/users";
import { parseFile } from "@/lib/parsers";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    await ensureUser(userId);

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const pasted = body.text as string | undefined;
      if (typeof pasted === "string" && pasted.trim()) {
        return NextResponse.json({
          text: pasted.trim(),
          sourceType: "paste" as const,
        });
      }
      return NextResponse.json(
        { error: "Fornisci text nel body JSON." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "Nessun file fornito." },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const mimeType = file.type || undefined;
    const parsed = await parseFile(buffer, mimeType, fileName);
    return NextResponse.json({
      text: parsed.text,
      fileName: parsed.fileName ?? fileName,
      mimeType: parsed.mimeType,
      sourceType: "file" as const,
    });
  } catch (err) {
    console.error("Parse error:", err);
    const message = err instanceof Error ? err.message : "Errore di parsing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
