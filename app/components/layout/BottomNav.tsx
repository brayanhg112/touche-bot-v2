import React from 'react';

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full h-24 bg-[#131318]/80 backdrop-blur-2xl flex justify-around items-center px-8 pb-4 z-50 rounded-t-[2rem] border-t border-[#d4af37]/15 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <a className="flex flex-col items-center justify-center text-[#f2ca50] font-semibold" href="#">
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>storm</span>
        <span className="font-label text-[10px] uppercase tracking-[0.05em]">Sommelier</span>
      </a>
      <a className="flex flex-col items-center justify-center text-[#e4e1e9]/40 hover:text-[#f2ca50]/80 transition-colors" href="#">
        <span className="material-symbols-outlined mb-1">auto_awesome_motion</span>
        <span className="font-label text-[10px] uppercase tracking-[0.05em]">Colecciones</span>
      </a>
      <a className="flex flex-col items-center justify-center text-[#e4e1e9]/40 hover:text-[#f2ca50]/80 transition-colors" href="#">
        <span className="material-symbols-outlined mb-1">bookmark</span>
        <span className="font-label text-[10px] uppercase tracking-[0.05em]">Guardados</span>
      </a>
    </nav>
  );
}
