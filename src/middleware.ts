// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { nextUrl } = req;
    const { token } = req.nextauth;

    // Extract the user's role from the token
    const userRole = token?.role;

    // Define role-based route restrictions
    if (userRole === "Mahasiswa" && !nextUrl.pathname.startsWith("/student")) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    if (userRole === "Pengurus_IOM" && !nextUrl.pathname.startsWith("/iom")) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    if (userRole === "Admin" && !nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    // Allow access if the role matches the route
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Protects routes if no token is present
    },
    pages: {
      signIn: "/login", // Redirect unauthenticated users to /login
    },
  }
);

// Protected routes
export const config = {
  matcher: ["/student/:path*", "/iom/:path*"],
};