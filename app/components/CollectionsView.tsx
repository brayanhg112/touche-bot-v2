'use client';

import { motion } from 'framer-motion';
import type { Perfume } from '../lib/types';
import PerfumeCard from './PerfumeCard';

interface Props {
  activeCatalog: Perfume[];
  stockMap: Record<string, boolean>;
  stockLoaded: boolean;
  stockError: string | null;
}

export default function CollectionsView({ activeCatalog, stockLoaded, stockError }: Props) {
  return (
    <div className="pt-[calc(6rem+env(safe-area-inset-top))] pb-[calc(7.5rem+env(safe-area-inset-bottom))] px-4 w-full max-w-5xl mx-auto min-h-[100dvh]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h2 className="font-headline text-3xl font-bold text-transparent bg-clip-text gold-gradient mb-2">
          Colecciones
        </h2>
        <p className="font-body text-on-surface-variant text-sm">
          Explora nuestras fragancias activas disponibles en tienda.
        </p>
      </motion.div>

      {!stockLoaded ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : stockError ? (
        <div className="text-center p-8 rounded-2xl bg-[#111115] border border-red-500/30 max-w-md mx-auto">
          <p className="text-sm font-body text-red-300">{stockError}</p>
        </div>
      ) : activeCatalog.length === 0 ? (
        <div className="text-center p-8 rounded-2xl bg-[#111115] border border-primary/20 max-w-md mx-auto">
          <p className="text-sm font-body text-on-surface/70">
            No hay fragancias activas disponibles en este momento.
          </p>
        </div>
      ) : (
        <section className="mb-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCatalog.map((perfume) => (
              <PerfumeCard
                key={perfume.id}
                result={{
                  perfume,
                  score: 0,
                  reasons: [],
                  sommelierSummary: '',
                  isImmediate: true,
                  isNicho: perfume.version === '1.1',
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
