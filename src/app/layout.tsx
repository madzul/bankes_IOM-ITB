import type { Metadata } from "next";
import "./globals.css";
import { DM_Sans } from 'next/font/google';
import ClientLayout from "./components/layout/clientlayout";

const dmSans = DM_Sans({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "IOM",
  description: "Website for IOM-ITB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} antialiased flex flex-col min-h-screen`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
