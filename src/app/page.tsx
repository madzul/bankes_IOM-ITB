import Link from 'next/link';

export default function Home() {
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
