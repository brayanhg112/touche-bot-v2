'use client';

import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import CollectionsView from './components/CollectionsView';
import SavedView from './components/SavedView';
import AiGuide from './components/AiGuide';
import type { Perfume } from './lib/types';

type Tab = 'sommelier' | 'colecciones' | 'guardados';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('sommelier');
  const [stockMap, setStockMap] = useState<Record<string, boolean>>({});
  const [activeCatalog, setActiveCatalog] = useState<Perfume[]>([]);
  const [stockLoaded, setStockLoaded] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stock', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Error al cargar inventario en vivo');
        }
        return data;
      })
      .then((data) => {
        if (data.stock) {
          const map: Record<string, boolean> = {};
          for (const key of Object.keys(data.stock)) {
            map[key] = true;
          }
          setStockMap(map);
        }
        if (Array.isArray(data.activeCatalog)) {
          setActiveCatalog(data.activeCatalog);
        }
        setStockError(null);
        setStockLoaded(true);
      })
      .catch((err) => {
        console.error('❌ Failed to load live stock:', err);
        setStockError('No pudimos cargar el inventario en vivo en este momento.');
        setActiveCatalog([]);
        setStockLoaded(true);
      });
  }, []);

  return (
    <div className="w-full min-h-[100dvh] flex flex-col overflow-x-hidden">
      <SplashScreen />
      <Header />

      {/* Background Monogram Watermark */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-headline text-primary opacity-[0.03] pointer-events-none select-none z-0">
        TE
      </div>

      {activeTab === 'sommelier' && (
        <main className="pt-[calc(6rem+env(safe-area-inset-top))] pb-[calc(7.5rem+env(safe-area-inset-bottom))] min-h-[100dvh] flex flex-col w-full max-w-4xl mx-auto relative z-10 px-4">
          <div className="mb-4 mt-2 text-center">
            <h2 className="text-3xl font-headline font-bold text-primary mb-1">Guía IA</h2>
            <p className="text-[10px] font-body text-on-surface/60 tracking-[0.2em] uppercase">
              Especialista Interactivo
            </p>
          </div>
          <AiGuide />
        </main>
      )}

      {activeTab === 'colecciones' && (
        <main className="relative z-10 w-full">
          <CollectionsView
            activeCatalog={activeCatalog}
            stockMap={stockMap}
            stockLoaded={stockLoaded}
            stockError={stockError}
          />
        </main>
      )}

      {activeTab === 'guardados' && (
        <main className="relative z-10 w-full">
          <SavedView
            activeCatalog={activeCatalog}
            stockMap={stockMap}
            onChangeTab={setActiveTab}
          />
        </main>
      )}

      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}
