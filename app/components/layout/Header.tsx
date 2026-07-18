import React from 'react';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(126,34,206,0.12)] flex justify-between items-center px-6 h-20 border-b border-[#7E22CE]/20">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-primary">auto_awesome</span>
        <h1 className="text-xl font-bold tracking-tighter font-headline text-white">
          Touche <span className="text-primary">Essencielle</span>
        </h1>
      </div>
      <div className="w-10 h-10 rounded-full border border-primary/30 overflow-hidden flex items-center justify-center shadow-[0_0_12px_rgba(126,34,206,0.3)] bg-black">
        <Image alt="Touche Essencielle" height={32} src="/logo-nuevo.png" width={32} className="object-contain" />
      </div>
    </header>
  );
}
