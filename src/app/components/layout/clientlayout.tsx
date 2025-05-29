"use client";

import { SessionProvider } from "next-auth/react";
import Navbar from "./navbar";
import Footer from "./footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* <Navbar /> */}
        <main className="flex-grow">{children}</main>
      <Footer />
    </SessionProvider>
  );
}