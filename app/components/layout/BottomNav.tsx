import React from 'react';

type Tab = 'sommelier' | 'colecciones' | 'guardados';

interface Props {
  activeTab: Tab;
  onChangeTab: (tab: Tab) => void;
}

export default function BottomNav({ activeTab, onChangeTab }: Props) {
  const getTabClass = (tab: Tab) => {
    const base = 'min-w-[64px] min-h-[44px] px-3 py-1.5 flex flex-col items-center justify-center rounded-xl transition-colors';
    return activeTab === tab
      ? `${base} text-[#f2ca50] font-semibold`
      : `${base} text-[#e4e1e9]/40 hover:text-[#f2ca50]/80`;
  };

  const getIconStyle = (tab: Tab) => {
    return activeTab === tab ? { fontVariationSettings: "'FILL' 1" } : { fontVariationSettings: "'FILL' 0" };
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 w-full bg-[#131318]/85 backdrop-blur-2xl z-50 rounded-t-[2rem] border-t border-[#d4af37]/15 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom)]"
      style={{ WebkitBackdropFilter: 'blur(40px)' }}
    >
      <div className="w-full max-w-5xl mx-auto h-20 flex justify-around items-center px-4 sm:px-8">
        <button type="button" onClick={() => onChangeTab('sommelier')} className={getTabClass('sommelier')}>
          <span className="material-symbols-outlined mb-1" style={getIconStyle('sommelier')}>smart_toy</span>
          <span className="font-label text-[10px] uppercase tracking-[0.05em]">Sommelier</span>
        </button>
        <button type="button" onClick={() => onChangeTab('colecciones')} className={getTabClass('colecciones')}>
          <span className="material-symbols-outlined mb-1" style={getIconStyle('colecciones')}>auto_awesome_motion</span>
          <span className="font-label text-[10px] uppercase tracking-[0.05em]">Colecciones</span>
        </button>
        <button type="button" onClick={() => onChangeTab('guardados')} className={getTabClass('guardados')}>
          <span className="material-symbols-outlined mb-1" style={getIconStyle('guardados')}>bookmark</span>
          <span className="font-label text-[10px] uppercase tracking-[0.05em]">Guardados</span>
        </button>
      </div>
    </nav>
  );
}
