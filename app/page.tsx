'use client';

import { useState, useEffect } from 'react';
import Bot from './components/Bot';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import CollectionsView from './components/CollectionsView';
import SavedView from './components/SavedView';

type Tab = 'sommelier' | 'colecciones' | 'guardados';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('sommelier');
  const [stockMap, setStockMap] = useState<Record<string, boolean>>({});
  const [outOfStock, setOutOfStock] = useState<string[]>([]);
  const [stockLoaded, setStockLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/stock')
      .then((res) => res.json())
      .then((data) => {
        if (data.stock) setStockMap(data.stock);
        if (data.outOfStock) setOutOfStock(data.outOfStock);
        setStockLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load live stock', err);
        setStockLoaded(true);
      });
  }, []);

  return (
    <>
      <Header />

      {/* Background Monogram Watermark */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-headline text-primary opacity-[0.03] pointer-events-none select-none z-0">
        TE
      </div>

      {activeTab === 'sommelier' && (
        <main className="pt-24 pb-32 min-h-screen flex flex-col max-w-2xl mx-auto px-4 relative z-10">
          <div className="mb-4 mt-2 text-center">
            <h2 className="text-3xl font-headline font-bold text-primary mb-1">Sommelier Digital</h2>
            <p className="text-[10px] font-body text-on-surface/60 tracking-[0.2em] uppercase">Encuentra tu esencia perfecta</p>
          </div>

          <Bot stockMap={stockLoaded ? stockMap : undefined} />
        </main>
      )}

      {activeTab === 'colecciones' && (
        <div className="relative z-10">
          <CollectionsView stockMap={stockMap} outOfStock={outOfStock} />
        </div>
      )}

      {activeTab === 'guardados' && (
        <div className="relative z-10">
          <SavedView stockMap={stockMap} onChangeTab={setActiveTab} />
        </div>
      )}

      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </>
  );
}
