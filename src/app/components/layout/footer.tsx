'use client'
import React from 'react';
import Image from 'next/image';

const Navbar: React.FC = () => {
	return (
		<div className="flex justify-between bg-lightmain p-4 px-40">
			<div className='flex flex-col space-y-2'>
				<div className="flex items-center space-x-4">
						<div>
							<Image src="/logoIOM.png" alt="IOM logo"  width={46} height={0}/>
						</div>
						<div>
							<p className="text-[18px] font-bold text-main leading-5">Ikatan Orang Tua Mahasiswa</p>	
							<p className='text-main'>Institut Teknologi Bandung</p>
						</div>
				</div>
				<div className=' text-footertext text-sm'>
				Kota Bandung, Coblong Sekretariat IOM-ITB <br/> Gedung Kampus Center Timur ITB Lantai 2 <br/> Jl. Ganesha No. 10 Kec. Coblong 40132.
				</div>
			</div>

			<div>
				<p className='font-bold'>Kontak</p>
				<p>sekretariat.iom.itb@gmail.com</p>
				<p>+62 856-2465-4990</p>
			</div>
		</div>
	);
};

export default Navbar;