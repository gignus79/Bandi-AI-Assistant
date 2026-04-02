import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Endpoint per webhook Clerk (es. `user.created`). Richiede `CLERK_WEBHOOK_SIGNING_SECRET`
 * e URL in Dashboard: `https://<dominio>/api/webhooks/clerk`
 */
export async function POST(req: NextRequest) {
  try {
    await verifyWebhook(req);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }
}
