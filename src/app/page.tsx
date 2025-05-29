"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (session?.user?.id) {
      const roleBasedUrls: { [key: string]: string } = {
        Mahasiswa: "/student/profile",
        Admin: "/admin/account",
        Pengurus_IOM: "/iom/document",
        Guest: "/guest",
        Pewawancara: "/interviewer/interview"
      };

      const redirectUrl = roleBasedUrls[session.user.role as string];
      if (redirectUrl) {
        router.push(redirectUrl);
      }
    }
  }, [session, status, router]);

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex min-h-screen bg-gray-100 justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  // Only show the home page content if user is not logged in
  if (!session) {
    return (
      <div className="text-var bg-cover bg-center" style={{ backgroundImage: "url('/bg.png')" }}>
        <div className="w-3/5 pl-[10%] py-[10%] min-h-screen">
          <h1 className="text-2xl">Selamat Datang di Sistem Seleksi Bantuan Kesejahteraan Mahasiswa</h1>
          <h2 className="mb-8 mt-2">Kami hadir untuk membantu mahasiswa ITB yang membutuhkan dukungan finansial dalam menjalani pendidikan. Daftarkan diri Anda, lengkapi persyaratan, dan ikuti proses seleksi. Semoga bantuan ini dapat mendukung perjalanan akademik Anda!</h2>
          <Link href="/login" className="py-2 px-5 rounded-full bg-var hover:bg-var/90 text-white">Daftar Sekarang →</Link>
        </div>
      </div>
    );
  }

  // Return null or loading while redirecting
  return null;
}