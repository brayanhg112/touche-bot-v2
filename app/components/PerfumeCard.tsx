'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BotAnswers } from '../lib/types';
import type { ScoredPerfume } from '../lib/recommender';
import { buildWhatsappPerPerfume, buildSommelierSummary } from '../lib/recommender';
import { getImagePath } from '../lib/imageMap';
import { useFavorites } from '../hooks/useFavorites';

interface Props {
  result: ScoredPerfume;
  rank?: number;
  answers?: BotAnswers;
}

export default function PerfumeCard({ result, rank, answers }: Props) {
  const { perfume, isImmediate } = result;
  const [showDetails, setShowDetails] = useState(false);
  const { favorites, toggleFavorite, isLoaded } = useFavorites();
  const isFavorite = favorites.includes(perfume.id);
  // Image resolution sequence: 
  // 1. Exact map from imageMap
  // 2. Fallback to /perfumes/[id].png (lowercase)
  // 3. Fallback to /perfumes/[id].jpg (lowercase)
  const idSlug = perfume.id.trim().toLowerCase()
    .replace(/\s+/g, '-')      // Espacios a guiones
    .replace(/[^\w\-]+/g, '')  // Quita caracteres raros
    .replace(/\-\-+/g, '-');   // Evita guiones dobles

  const fallbackBase = `/perfumes/${idSlug}`;

  const imagePathsToTry = [
    getImagePath(perfume.id.trim()),
    `${fallbackBase}.png`, // Ahora sí queda bien: /perfumes/narcotic-delight-initio.png
    `${fallbackBase}.jpg`  // Y aquí: /perfumes/narcotic-delight-initio.jpg
  ].filter(Boolean) as string[];

  const [attemptIndex, setAttemptIndex] = useState(0);

  const imgSrc = attemptIndex < imagePathsToTry.length ? imagePathsToTry[attemptIndex] : null;
  const isPlaceholder = imgSrc === null;

  const handleBuy = () => {
    const url = answers ? buildWhatsappPerPerfume(answers.name, perfume.name, perfume.brand)
      : `https://wa.me/573136876673?text=${encodeURIComponent(`Hola Brayan 🌸 Me encantó la fragancia ${perfume.name} de ${perfume.brand} en mis colecciones y quiero pedirla. ¿Me puedes mostrar enseguidita para ensayarla en mi piel? 😍`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  /** Dynamic, unique match paragraph for this card */
  const sommelierText = (answers && rank)
    ? buildSommelierSummary(answers, perfume, rank)
    : perfume.emotionalDesc;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (rank || 1) * 0.18, type: 'spring', stiffness: 80 }}
      className="relative mb-12 mt-8"
    >
      {/* Large rank watermark (only if rank is provided) */}
      {rank !== undefined && (
        <div className="absolute -top-6 -left-2 z-10 pointer-events-none">
          <span className="font-headline text-[5rem] font-extrabold text-primary/15 italic select-none">
            0{rank}
          </span>
        </div>
      )}

      <div className="glass-card rounded-[1rem] overflow-hidden obsidian-glow flex flex-col relative z-20">
        {/* Bookmark Favorite Button */}
        {isLoaded && (
          <button
            onClick={() => toggleFavorite(perfume.id)}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-[#111115]/80 backdrop-blur-md flex items-center justify-center border border-primary/20 shadow-lg transition-transform duration-300 hover:scale-110"
            aria-label={isFavorite ? "Quitar de guardados" : "Guardar en favoritos"}
          >
            <span
              className={`material-symbols-outlined text-[20px] transition-colors duration-300 ${isFavorite ? 'text-primary' : 'text-on-surface/50'}`}
              style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
            >
              bookmark
            </span>
          </button>
        )}

        {/* ── Image area ── */}
        <div className="h-[340px] relative overflow-hidden bg-[#0e0e13]">
          {isPlaceholder ? (
            /* Placeholder: golden bottle SVG centered with ambient glow */
            <div className="w-full h-full flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
              {/* Subtle grid texture */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg,#d4af37 0,#d4af37 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#d4af37 0,#d4af37 1px,transparent 1px,transparent 40px)',
                }}
              />
              <img
                src="/perfumes/placeholder.svg"
                alt={perfume.name}
                className="w-[180px] h-[240px] object-contain relative z-10 drop-shadow-[0_0_30px_rgba(212,175,55,0.18)]"
              />
            </div>
          ) : (
            /* Real product image */
            <img
              src={imgSrc!}
              alt={perfume.name}
              className="w-full h-full object-cover opacity-85"
              onError={() => setAttemptIndex(prev => prev + 1)}
            />
          )}

          {/* Bottom gradient to blend with card */}
          <div className="absolute bottom-0 left-0 w-full h-2/5 bg-gradient-to-t from-[#131318] to-transparent pointer-events-none" />
        </div>

        {/* ── Card body ── */}
        <div className="p-6 -mt-10 relative z-30">

          {/* Brand row + availability badge */}
          <div className="flex items-center gap-2 mb-1 drop-shadow-md">
            <span className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">
              {perfume.brand}
            </span>
            {isImmediate ? (
              <span className="px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold gold-gradient text-white rounded-sm shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                ENTREGA INMEDIATA
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold bg-[#1a1a25] text-secondary/80 rounded-sm">
                BAJO PEDIDO
              </span>
            )}
          </div>

          {/* Perfume name */}
          <h3 className="font-headline text-[1.75rem] leading-tight font-bold mb-4 text-on-surface">
            {perfume.name}
          </h3>

          {/* ── Dynamic sommelier match paragraph ── */}
          <div className="mb-5 p-4 rounded-xl bg-primary/[0.08] shadow-[inset_0_0_15px_rgba(212,175,55,0.05)]">
            <div className="flex items-start gap-2">
              <span
                className="material-symbols-outlined text-primary text-[18px] mt-0.5 flex-shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <p className="font-body text-[13px] text-white/90 leading-relaxed">
                {sommelierText}
              </p>
            </div>
          </div>

          {/* ── Expandable notes ── */}
          <button
            aria-expanded={showDetails}
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex justify-between items-center py-2 mb-2 group"
          >
            <span className="text-[11px] font-label tracking-[0.1em] uppercase text-primary font-bold">
              Pirámide olfativa
            </span>
            <span className="material-symbols-outlined text-[16px] text-primary/70 transition-transform duration-300">
              {showDetails ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-3 gap-3 mb-6 text-center py-4 bg-primary/5 rounded-lg">
                  <div>
                    <span className="block text-[9px] uppercase tracking-tighter text-on-surface/50 font-bold mb-1">
                      Salida
                    </span>
                    <span
                      className="text-[11px] font-medium text-primary-fixed-dim truncate block"
                      title={perfume.topNotes}
                    >
                      {perfume.topNotes}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-tighter text-on-surface/50 font-bold mb-1">
                      Corazón
                    </span>
                    <span
                      className="text-[11px] font-medium text-primary-fixed-dim truncate block"
                      title={perfume.heartNotes}
                    >
                      {perfume.heartNotes}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-tighter text-on-surface/50 font-bold mb-1">
                      Fondo
                    </span>
                    <span
                      className="text-[11px] font-medium text-primary-fixed-dim truncate block"
                      title={perfume.baseNotes}
                    >
                      {perfume.baseNotes}
                    </span>
                  </div>
                </div>

                {/* Emotional desc as italic quote */}
                <p className="text-[12px] font-body text-on-surface-variant leading-relaxed italic opacity-90 pl-3 mb-5">
                  "{perfume.emotionalDesc}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CTA Button ── */}
          <button
            id={`btn-buy-${perfume.id}`}
            onClick={handleBuy}
            className="w-full py-4 rounded-full gold-gradient text-[#1c1605] font-label font-extrabold text-[11px] uppercase tracking-[0.15em] shadow-[0_4px_25px_rgba(212,175,55,0.3)] hover:scale-[1.02] hover:shadow-[0_4px_30px_rgba(212,175,55,0.5)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" className="opacity-90">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 2.83.736 5.484 2.025 7.784L0 32l8.437-2.011A15.927 15.927 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.22 22.22c-.34.957-1.983 1.822-2.73 1.938-.739.115-1.662.163-2.682-.168a24.34 24.34 0 0 1-2.426-.897C12.21 21.52 9.624 18.317 9.43 18.07c-.195-.247-1.59-2.117-1.59-4.04s1.008-2.87 1.366-3.263c.357-.394.779-.492.04-.492l-.832.016c-.274 0-.716.103-1.09.492-.373.39-1.428 1.396-1.428 3.406 0 2.01 1.463 3.953 1.667 4.23.204.274 2.878 4.59 7.112 6.278 1.007.39 1.793.623 2.406.797.99.284 1.89.244 2.602.148.793-.107 2.442-.998 2.786-1.963.344-.965.344-1.793.24-1.963-.104-.17-.373-.274-.78-.48z" />
            </svg>
            Pedir por WhatsApp
          </button>
        </div>
      </div>
    </motion.article>
  );
}
