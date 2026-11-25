'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BotAnswers } from '../lib/types';
import type { ScoredPerfume } from '../lib/recommender';
import { buildWhatsappPerPerfume, buildSommelierSummary } from '../lib/recommender';
import { resolveProductImageUrl } from '../lib/productImages';
import { useFavorites } from '../hooks/useFavorites';

interface Props {
  result: ScoredPerfume;
  rank?: number;
  answers?: BotAnswers;
}

export default function PerfumeCard({ result, rank, answers }: Props) {
  const { perfume } = result;
  const [showDetails, setShowDetails] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { favorites, toggleFavorite, isLoaded } = useFavorites();
  const isFavorite = favorites.includes(perfume.id);

  useEffect(() => {
    setImgError(false);
  }, [perfume.id]);

  const cleanStr = (str: string) =>
    str ? str.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/['"´°]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') : '';

  const exactId = perfume.id.trim();
  const nameSlug = cleanStr(perfume.name);

  const verifiedImage =
    perfume.imageUrl ||
    resolveProductImageUrl({
      id: perfume.id,
      name: perfume.name,
      brand: perfume.brand,
    });
  const imgSrc = !imgError && verifiedImage ? verifiedImage : null;
  const isPlaceholder = imgSrc === null;

  const whatsappUrl = answers
    ? buildWhatsappPerPerfume(answers.name, perfume.name, perfume.brand)
    : `https://wa.me/573136876673?text=${encodeURIComponent(
        `Hola Brian 🌸 Me encantó la fragancia ${perfume.name} de ${perfume.brand} en mis colecciones y quiero pedirla. ¿Me puedes mostrar enseguidita para ensayarla en mi piel? 😍`
      )}`;

  const cleanTechnicalText = (text: string) => {
    if (!text) return text;
    return text.replace(/Nuestro contratipo(?: 1\.1)?.*?premium[^\.]*\.?/gi, '')
      .replace(/Con \+10gr de esencia.*?premium[^\.]*\.?/gi, '')
      .trim();
  };

  // Sobrescritura de descripciones emocionales específicas solicitadas
  let customEmotionalDesc = null;
  if (exactId.includes('212-nyc') || nameSlug.includes('212-nyc')) {
    customEmotionalDesc = "Una brisa urbana de pura elegancia. Para la mujer moderna de ciudad que pisa fuerte desde temprano.";
  } else if (exactId.includes('212-vip') || nameSlug.includes('212-vip')) {
    customEmotionalDesc = "La lista de invitados soñada. Un shot de oro líquido que grita diversión y lujo nocturno.";
  }

  const baseEmotionalDesc = customEmotionalDesc || perfume.emotionalDesc;

  const sommelierText = cleanTechnicalText((answers && rank)
    ? buildSommelierSummary(answers, perfume, rank)
    : baseEmotionalDesc);

  const isChWithoutEssence = exactId === 'ch' || nameSlug === 'ch' || exactId.includes('ch-carolina-herrera');
  const rawVersion = String(perfume.version || '').trim();
  const isVersion11 = !isChWithoutEssence && rawVersion === '1.1';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: (rank || 1) * 0.1, type: 'spring', damping: 20, stiffness: 300 }}
      className="relative mb-6 mt-4"
    >
      {rank !== undefined && (
        <div className="absolute -top-6 -left-2 z-10 pointer-events-none">
          <span className="font-headline text-[5rem] font-extrabold text-primary/15 italic select-none">
            0{rank}
          </span>
        </div>
      )}

      <div className="glass-card rounded-[1rem] overflow-hidden obsidian-glow flex flex-col relative z-20">
        {isLoaded && (
          <button
            type="button"
            onClick={() => toggleFavorite(perfume.id)}
            className="absolute top-4 right-4 z-50 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#111115]/80 backdrop-blur-md flex items-center justify-center border border-primary/20 shadow-lg transition-transform duration-300 hover:scale-110"
            style={{ WebkitBackdropFilter: 'blur(12px)' }}
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

        <div className="h-[320px] relative overflow-hidden bg-[#0e0e13]">
          {isPlaceholder ? (
            <div className="w-full h-full flex flex-col items-center justify-center relative px-4 text-center">
              <div className="absolute inset-0 bg-gradient-radial from-primary/15 via-transparent to-transparent" />
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg,#7E22CE 0,#7E22CE 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#7E22CE 0,#7E22CE 1px,transparent 1px,transparent 40px)',
                }}
              />
              <span
                className="material-symbols-outlined text-[4rem] text-primary/50 relative z-10 drop-shadow-[0_0_15px_rgba(126,34,206,0.35)] mb-2"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
              >
                liquor
              </span>
              <span className="font-label text-[10px] text-primary/70 tracking-[0.2em] uppercase z-10">
                {perfume.brand || 'Alta Perfumería'}
              </span>
            </div>
          ) : (
            <img
              src={imgSrc!}
              alt={perfume.name}
              loading="lazy"
              className="w-full h-full object-cover opacity-85"
              onError={() => setImgError(true)}
            />
          )}
          <div className="absolute bottom-0 left-0 w-full h-2/5 bg-gradient-to-t from-[#131318] to-transparent pointer-events-none" />
        </div>

        <div className="p-6 -mt-10 relative z-30">
          <div className="flex flex-wrap items-center gap-2 mb-1 drop-shadow-md">
            <span className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">
              {perfume.brand}
            </span>
            {isVersion11 ? (
              <span className="px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold gold-gradient text-white rounded-sm shadow-[0_0_10px_rgba(126,34,206,0.4)]">
                DISPONIBILIDAD: ENTREGA INMEDIATA
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold bg-[#1a1a25] text-secondary/80 rounded-sm">
                BAJO PEDIDO
              </span>
            )}
          </div>

          <h3 className="font-headline text-[1.6rem] sm:text-[1.75rem] leading-tight font-bold mb-4 text-on-surface">
            {perfume.name}
          </h3>

          {/* Bloque emocional con 3 líneas exactas */}
          <div className="mb-5 p-4 rounded-xl bg-primary/[0.08] shadow-[inset_0_0_15px_rgba(126,34,206,0.08)]">
            <div className="flex items-start gap-2">
              <span
                className="material-symbols-outlined text-primary text-[18px] mt-0.5 flex-shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <p className="font-body text-[13px] text-white/90 leading-relaxed line-clamp-3">
                {sommelierText}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-expanded={showDetails}
            onClick={() => setShowDetails(!showDetails)}
            className="w-full min-h-[44px] flex justify-between items-center py-2.5 mb-2 group"
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
                    <span className="block text-[9px] uppercase tracking-tighter text-on-surface/50 font-bold mb-1">Salida</span>
                    <span className="text-[11px] font-medium text-primary-fixed-dim truncate block" title={perfume.topNotes}>{perfume.topNotes}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-tighter text-on-surface/50 font-bold mb-1">Corazón</span>
                    <span className="text-[11px] font-medium text-primary-fixed-dim truncate block" title={perfume.heartNotes}>{perfume.heartNotes}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-tighter text-on-surface/50 font-bold mb-1">Fondo</span>
                    <span className="text-[11px] font-medium text-primary-fixed-dim truncate block" title={perfume.baseNotes}>{perfume.baseNotes}</span>
                  </div>
                </div>
                <p className="text-[12px] font-body text-on-surface-variant leading-relaxed italic opacity-90 pl-3 mb-5">
                  &ldquo;{cleanTechnicalText(baseEmotionalDesc)}&rdquo;
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.a
            id={`btn-buy-${perfume.id}`}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="w-full min-h-[48px] py-3.5 px-4 rounded-full gold-gradient text-white font-label font-extrabold text-[11px] uppercase tracking-[0.15em] shadow-[0_4px_25px_rgba(126,34,206,0.35)] hover:shadow-[0_4px_30px_rgba(126,34,206,0.55)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" className="opacity-95 shrink-0">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 2.83.736 5.484 2.025 7.784L0 32l8.437-2.011A15.927 15.927 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.22 22.22c-.34.957-1.983 1.822-2.73 1.938-.739.115-1.662.163-2.682-.168a24.34 24.34 0 0 1-2.426-.897C12.21 21.52 9.624 18.317 9.43 18.07c-.195-.247-1.59-2.117-1.59-4.04s1.008-2.87 1.366-3.263c.357-.394.779-.492.04-.492l-.832.016c-.274 0-.716.103-1.09.492-.373.39-1.428 1.396-1.428 3.406 0 2.01 1.463 3.953 1.667 4.23.204.274 2.878 4.59 7.112 6.278 1.007.39 1.793.623 2.406.797.99.284 1.89.244 2.602.148.793-.107 2.442-.998 2.786-1.963.344-.965.344-1.793.24-1.963-.104-.17-.373-.274-.78-.48z" />
            </svg>
            Pedir por WhatsApp
          </motion.a>
        </div>
      </div>
    </motion.article>
  );
}