import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/cookie-policy",
  "/cancellazione-dati",
  "/resi-rimborsi",
  "/api/webhooks(.*)",
]);

function getAuthorizedParties(): string[] | undefined {
  const parties = new Set<string>();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (appUrl) parties.add(appUrl);
  const extraOrigins = process.env.NEXT_PUBLIC_CLERK_ALLOWED_ORIGINS;
  if (extraOrigins) {
    for (const part of extraOrigins.split(",")) {
      const o = part.trim().replace(/\/$/, "");
      if (o) parties.add(o);
    }
  }
  if (process.env.NODE_ENV === "development") {
    parties.add("http://localhost:3000");
  }
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    const origin = vercelUrl.startsWith("http")
      ? vercelUrl
      : `https://${vercelUrl}`;
    parties.add(origin.replace(/\/$/, ""));
  }
  if (parties.size === 0) return undefined;
  return Array.from(parties);
}

const authorizedParties = getAuthorizedParties();

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  },
  {
    ...(authorizedParties ? { authorizedParties } : {}),
  }
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|ico|svg|woff2?|ttf|otf)).*)",
    "/(api|trpc)(.*)",
  ],
};
