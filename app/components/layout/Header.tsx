import React from 'react';
import Image from 'next/image';

export default function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 w-full z-50 bg-[#050505]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(126,34,206,0.12)] border-b border-[#7E22CE]/20 pt-[env(safe-area-inset-top)]"
      style={{ WebkitBackdropFilter: 'blur(24px)' }}
    >
      <div className="w-full max-w-5xl mx-auto flex justify-between items-center px-4 sm:px-6 h-20">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <span className="material-symbols-outlined text-primary shrink-0">auto_awesome</span>
          <h1 className="text-lg sm:text-xl font-bold tracking-tighter font-headline text-white truncate">
            Touche <span className="text-primary">Essencielle</span>
          </h1>
        </div>
        <div className="w-11 h-11 rounded-full border border-primary/30 overflow-hidden flex items-center justify-center shadow-[0_0_12px_rgba(126,34,206,0.3)] bg-black shrink-0">
          <Image alt="Touche Essencielle" height={32} src="/logo-nuevo.png" width={32} className="object-contain" />
        </div>
      </div>
    </header>
  );
}
