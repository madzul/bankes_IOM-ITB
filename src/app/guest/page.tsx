import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-var">
      <div className="w-3/5 ml-[10%] mt-[10%]">
        <h1 className="text-2xl">Mohon tunggu akun anda untuk diperiksa</h1>
        <h2 className="mb-8 mt-2">Anda akan mendapat akses ke halaman lainnya setelah akun anda disetujui</h2>
        <Link href="/" className="py-2 px-5 rounded-full bg-var hover:bg-var/90 text-white">Home</Link>
      </div>
    </div>
  );
}
