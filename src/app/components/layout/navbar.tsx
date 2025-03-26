'use client'
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { useSession } from 'next-auth/react';
import { User, LayoutDashboard } from "lucide-react"

const Navbar: React.FC = () => {
	const { data: session } = useSession();

	return (
		<nav className="flex justify-between items-center py-5 px-27 bg-white shadow-md sticky top-0 z-50">
			<Link href="/" className="flex items-center space-x-4">
					<div>
						<Image src="/logoIOM.png" alt="IOM logo"  width={46} height={0}/>
					</div>
					<div>
						<h1 className="text-[18px] font-bold text-main leading-5">Ikatan Orang Tua Mahasiswa</h1>	
						<h2 className='text-main'>Institut Teknologi Bandung</h2>
					</div>
			</Link>
			{session?.user?.role === "Mahasiswa"
			? <Link href="/student/profile" className="py-2 px-5 rounded-full bg-var hover:bg-var/90 text-white flex"><User className="h-fit mr-2" /><span>Profil</span></Link>
			: session?.user?.role === "Pengurus_IOM"
			? <Link href="/iom/document" className="py-2 px-5 rounded-full bg-var hover:bg-var/90 text-white flex"><LayoutDashboard className="h-fit mr-2" /><span>Dashboard</span></Link>
			: session?.user?.role === "Admin"
			? <Link href="/admin/account" className="py-2 px-5 rounded-full bg-var hover:bg-var/90 text-white flex"><LayoutDashboard className="h-fit mr-2" /><span>Dashboard</span></Link>
			: session?.user?.role === "Guest"
			? <Link href="/login" className="py-2 px-5 rounded-full bg-var hover:bg-var/90 text-white">Masuk</Link>
			: <Link href="/login" className="py-2 px-5 rounded-full bg-var hover:bg-var/90 text-white">Masuk</Link>}
		</nav>
	);
};

export default Navbar;