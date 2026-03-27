import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/cookie-policy",
  "/api/webhooks(.*)",
]);

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  },
  {
    ...(appUrl ? { authorizedParties: [appUrl.replace(/\/$/, "")] } : {}),
  }
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|ico|svg|woff2?|ttf|otf)).*)",
    "/(api|trpc)(.*)",
  ],
};
