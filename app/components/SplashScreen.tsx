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
          {/* Sutil resplandor morado de fondo */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-zinc-950 to-zinc-950" />
          
          <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            className="text-4xl md:text-6xl font-serif tracking-widest text-center"
          >
            TOUCHE ESSENCIELLE
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-4 text-sm md:text-base tracking-[0.3em] font-light text-zinc-400 uppercase"
          >
            Perfumería
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
