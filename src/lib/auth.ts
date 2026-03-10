import { auth } from "@clerk/nextjs/server";

export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}
