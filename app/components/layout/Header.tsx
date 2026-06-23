import React from 'react';

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#131318]/70 backdrop-blur-xl shadow-[0_0_40px_rgba(242,202,80,0.04)] flex justify-between items-center px-6 h-20 border-b border-[#d4af37]/15">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-[#f2ca50]">menu</span>
        <h1 className="text-xl font-bold tracking-tighter text-[#f2ca50] font-headline">Touche Essencielle</h1>
      </div>
      <div className="w-10 h-10 rounded-full border border-[#d4af37]/30 overflow-hidden bg-surface-container-high flex items-center justify-center">
        <span className="material-symbols-outlined text-[#f2ca50]">person</span>
      </div>
    </header>
  );
}
