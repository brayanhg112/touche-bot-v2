'use client';

import { motion } from 'framer-motion';
import { catalog } from '../lib/catalog';
import PerfumeCard from './PerfumeCard';

interface Props {
  stockMap: Record<string, boolean>;
  outOfStock: string[];
}

export default function CollectionsView({ stockMap, outOfStock }: Props) {
  // Filter out any perfume that is explicitly out of stock
  const available = catalog.filter(p => !outOfStock.includes(p.id));

  // Categorize
  const version11 = available.filter(p => p.version === '1.1');
  const femeninos = available.filter(p => p.gender === 'F' && p.version !== '1.1');
  const masculinos = available.filter(p => p.gender === 'M' && p.version !== '1.1');
  const unisex = available.filter(p => p.gender === 'U' && p.version !== '1.1');

  const categories = [
    { title: 'Versiones 1.1', items: version11 },
    { title: 'Femeninos', items: femeninos },
    { title: 'Masculinos', items: masculinos },
    { title: 'Unisex', items: unisex },
  ];

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

      {categories.map(category => category.items.length > 0 && (
        <section key={category.title} className="mb-14">
          <h3 className="font-headline text-2xl font-bold text-on-surface mb-6 border-b border-primary/20 pb-2">
            {category.title}
          </h3>
          <div className="space-y-6">
            {category.items.map((perfume, i) => (
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
      ))}
    </div>
  );
}
