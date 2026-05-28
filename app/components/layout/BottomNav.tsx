import React from 'react';

type Tab = 'sommelier' | 'colecciones' | 'guardados';

interface Props {
  activeTab: Tab;
  onChangeTab: (tab: Tab) => void;
}

export default function BottomNav({ activeTab, onChangeTab }: Props) {
  const getTabClass = (tab: Tab) => {
    return activeTab === tab 
      ? 'flex flex-col items-center justify-center text-[#f2ca50] font-semibold'
      : 'flex flex-col items-center justify-center text-[#e4e1e9]/40 hover:text-[#f2ca50]/80 transition-colors';
  };

  const getIconStyle = (tab: Tab) => {
    return activeTab === tab ? { fontVariationSettings: "'FILL' 1" } : { fontVariationSettings: "'FILL' 0" };
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full h-24 bg-[#131318]/80 backdrop-blur-2xl flex justify-around items-center px-8 pb-4 z-50 rounded-t-[2rem] border-t border-[#d4af37]/15 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <button onClick={() => onChangeTab('sommelier')} className={getTabClass('sommelier')}>
        <span className="material-symbols-outlined mb-1" style={getIconStyle('sommelier')}>storm</span>
        <span className="font-label text-[10px] uppercase tracking-[0.05em]">Sommelier</span>
      </button>
      <button onClick={() => onChangeTab('colecciones')} className={getTabClass('colecciones')}>
        <span className="material-symbols-outlined mb-1" style={getIconStyle('colecciones')}>auto_awesome_motion</span>
        <span className="font-label text-[10px] uppercase tracking-[0.05em]">Colecciones</span>
      </button>
      <button onClick={() => onChangeTab('guardados')} className={getTabClass('guardados')}>
        <span className="material-symbols-outlined mb-1" style={getIconStyle('guardados')}>bookmark</span>
        <span className="font-label text-[10px] uppercase tracking-[0.05em]">Guardados</span>
      </button>
    </nav>
  );
}
