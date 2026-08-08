'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Exactly 2000ms duration for being visible before triggering fade-out
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-amber-500 overflow-hidden ${!isVisible ? 'pointer-events-none' : ''}`}
        >
          {/* Sutil resplandor de fondo minimalista */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1d052d]/40 via-zinc-950 to-zinc-950" />
          
          {/* Destellos dorados y luz (Flares & Sparkles) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0.15, 0.3, 0] }}
            transition={{ delay: 0.2, duration: 1.6, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.12)_0%,_transparent_40%)] mix-blend-screen pointer-events-none"
          />

          {/* Micro-sparkle 1 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.8], rotate: 45 }}
            transition={{ delay: 0.4, duration: 1.2, ease: "easeInOut" }}
            className="absolute top-[42%] left-[25%] md:left-[35%] w-1.5 h-1.5 bg-amber-100 rounded-full shadow-[0_0_20px_6px_rgba(212,175,55,0.9)] pointer-events-none"
          />

          {/* Micro-sparkle 2 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1, 0.8], rotate: -45 }}
            transition={{ delay: 0.7, duration: 1.0, ease: "easeInOut" }}
            className="absolute top-[58%] right-[25%] md:right-[35%] w-1 h-1 bg-amber-200 rounded-full shadow-[0_0_15px_4px_rgba(212,175,55,0.8)] pointer-events-none"
          />
          
          <div className="relative z-10 flex flex-col items-center px-6">
            <motion.h1
              initial={{ scale: 0.92, opacity: 0, filter: 'blur(8px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ delay: 0.2, duration: 0.9, ease: 'easeOut' }}
              className="text-5xl sm:text-6xl md:text-7xl font-serif tracking-[0.05em] text-center font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-50 via-amber-200 to-amber-600 drop-shadow-[0_0_25px_rgba(212,175,55,0.3)] leading-[1.1] max-w-[90vw]"
            >
              TOUCHE<br/>ESSENCIELLE
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
              className="mt-5 text-xs sm:text-sm tracking-[0.4em] font-light text-amber-100/70 uppercase drop-shadow-md"
            >
              PERFUMERÍA
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
