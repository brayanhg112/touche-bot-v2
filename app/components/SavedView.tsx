'use client';

import { motion } from 'framer-motion';
import { catalog } from '../lib/catalog';
import { useFavorites } from '../hooks/useFavorites';
import PerfumeCard from './PerfumeCard';

interface Props {
  stockMap: Record<string, boolean>;
  onChangeTab: (tab: 'sommelier' | 'colecciones' | 'guardados') => void;
}

export default function SavedView({ stockMap, onChangeTab }: Props) {
  const { favorites, isLoaded } = useFavorites();

  const savedPerfumes = catalog.filter(p => favorites.includes(p.id));

  if (!isLoaded) {
    return <div className="pt-24 min-h-screen"></div>;
  }

  return (
    <div className="pt-24 pb-28 px-4 max-w-2xl mx-auto min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h2 className="font-headline text-3xl font-bold text-transparent bg-clip-text gold-gradient mb-2">Tus Favoritos</h2>
        <p className="font-body text-on-surface-variant text-sm">Tu selección privada de alta perfumería.</p>
      </motion.div>

      {savedPerfumes.length > 0 ? (
        <div className="space-y-6">
          {savedPerfumes.map(perfume => (
            <PerfumeCard 
              key={perfume.id} 
              result={{
                perfume,
                score: 0,
                reasons: [],
                sommelierSummary: '',
                isImmediate: stockMap[perfume.id] === true,
                isNicho: false
              }}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 mt-12 bg-[#111115] rounded-2xl border border-primary/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
        >
          <span className="material-symbols-outlined text-[48px] text-primary/40 mb-4">
            bookmark_border
          </span>
          <h3 className="font-headline text-xl text-on-surface font-bold mb-3">Aún no tienes guardados</h3>
          <p className="text-sm font-body text-on-surface-variant mb-6">
            Explora las colecciones o consulta al Sommelier para descubrir fragancias increíbles.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onChangeTab('colecciones')}
              className="py-3 px-6 rounded-full gold-gradient text-[#1c1605] font-bold text-sm uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:scale-105 transition-transform"
            >
              Ver Colecciones
            </button>
            <button
              onClick={() => onChangeTab('sommelier')}
              className="py-3 px-6 rounded-full border border-primary/30 text-primary font-bold text-sm uppercase tracking-widest hover:bg-primary/5 transition-colors"
            >
              Ir al Sommelier
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
