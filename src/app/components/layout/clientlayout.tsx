"use client";

import { SessionProvider } from "next-auth/react";
import Navbar from "./navbar";
import Footer from "./footer";
import PushNotification from "../PushNotification";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PushNotification/>
      <Navbar />
        <main className="flex-grow">{children}</main>
      <Footer />
    </SessionProvider>
  );
}