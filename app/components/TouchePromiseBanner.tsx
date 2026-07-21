'use client';

import { motion } from 'framer-motion';

export default function TouchePromiseBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="mb-8 rounded-[1.5rem] bg-gradient-to-br from-[#1a1a25] via-[#111115] to-[#1a1a25] border border-primary/30 p-6 md:p-8 relative overflow-hidden shadow-[0_10px_40px_rgba(212,175,55,0.15)]"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <span className="material-symbols-outlined text-9xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
      </div>
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-primary mb-3 text-4xl drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        
        <h4 className="font-label text-[11px] uppercase tracking-[0.25em] text-primary font-extrabold mb-2 drop-shadow opacity-90">
          La Promesa Touche Essencielle
        </h4>
        
        <p className="font-headline text-2xl md:text-3xl text-white font-bold mb-4 leading-snug">
          Experiencia <span className="gold-gradient text-transparent bg-clip-text">1.1 Alta Concentración</span>
        </p>
        
        <p className="text-[14px] font-body text-on-surface-variant leading-relaxed mb-6 max-w-lg mx-auto">
          Nuestras fragancias categoría 1.1 están formuladas con <b>+10gr de esencia premium</b>, garantizando una estela inolvidable y durabilidad extrema en piel.
        </p>

        <div className="w-full flex-1 h-px bg-primary/20 mb-6 max-w-sm mx-auto" />

        <p className="text-[13px] font-label uppercase tracking-widest text-primary font-bold mb-4">
          ¡Potencia tu compra con el Combo Edición Touche! <span className="text-white">(+10.000 COP)</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center w-full">
           <div className="flex items-center justify-center gap-2 text-[12px] font-body font-medium text-white/90 bg-primary/10 px-5 py-2.5 rounded-xl border border-primary/20 shadow-inner">
             <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
             Perfume 30ml extra
           </div>
           <div className="flex items-center justify-center gap-2 text-[12px] font-body font-medium text-white/90 bg-primary/10 px-5 py-2.5 rounded-xl border border-primary/20 shadow-inner">
             <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
             Decant Roll-on 10ml
           </div>
        </div>
      </div>
    </motion.div>
  );
}
