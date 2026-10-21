import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk needs to see every request so `auth()` works in layouts and routes.
 * It doesn't protect anything by itself; the (app) layout and requireSession do.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
