'use client';

import { motion } from 'framer-motion';
import { catalog } from '../lib/catalog';
import PerfumeCard from './PerfumeCard';

interface Props {
  stockMap: Record<string, boolean>;
  outOfStock: string[];
}

export default function CollectionsView({ stockMap, outOfStock }: Props) {
  // Filter out any perfume that is explicitly out of stock.
  // The catalog is already sorted in lib/catalog.ts with 1.1 first
  const available = catalog.filter(p => !outOfStock.includes(p.id));

  return (
    <div className="pt-24 pb-28 px-4 max-w-2xl mx-auto min-h-screen">

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h2 className="font-headline text-3xl font-bold text-transparent bg-clip-text gold-gradient mb-2">Colecciones</h2>
        <p className="font-body text-on-surface-variant text-sm">Explora nuestras selectas obras maestras olfativas.</p>
      </motion.div>

      <section className="mb-14">
        <div className="space-y-6">
          {available.map((perfume, i) => (
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
      </section>
    </div>
  );
}
