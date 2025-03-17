import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/layout/navbar";
import Footer from "./components/layout/footer";
import { DM_Sans } from 'next/font/google';

const dmSans = DM_Sans({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "IOM",
  description: "Website for IOM-ITB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} antialiased flex flex-col min-h-screen`}>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
      </body>
    </html>
  );
}
