import React from 'react';

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#0e0e13]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(168,85,247,0.08)] flex justify-between items-center px-4 md:px-6 h-20 border-b border-[#a855f7]/10">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[#a855f7]">auto_awesome</span>
        <h1 className="font-headline tracking-tighter text-lg md:text-xl font-bold text-white" style={{ textShadow: '0 0 20px rgba(168,85,247,0.5)' }}>
          Touche <span className="text-[#a855f7]">Essencielle</span>
        </h1>
      </div>
      <div className="w-10 h-10 rounded-full border border-[#a855f7]/40 overflow-hidden bg-[#1a1a25] flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.2)]">
        <span className="material-symbols-outlined text-[#a855f7]">person</span>
      </div>
    </header>
  );
}
