import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;

  // If signed in and on the landing page → redirect to dashboard
  if (userId && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If signed out and trying to access a protected route → redirect to home
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/', req.url));
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};