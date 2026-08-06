'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AiGuideAnswers, AiGuideStep, AiGuideResult, AiGuideOccasion, AiGuideExpression, AiGuideNoteFamily } from '../lib/aiGuideTypes';
import { assistantContent } from '../lib/assistantContent';

// --- Subcomponents ---

function VideoPlaceholder({ step }: { step: AiGuideStep }) {
  // Placeholder for HeyGen video. Currently displays an animated gradient/pulsing circle.
  return (
    <div className="relative w-full aspect-[9/16] max-h-[40vh] bg-surface-container-low rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(100,20,150,0.15)] flex flex-col items-center justify-center border border-primary/20">
      {/* Background gradients for luxury dark feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-surface-container-lowest to-[#1a0525] z-0" />
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-48 h-48 bg-primary/20 blur-[60px] rounded-full z-0"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute w-32 h-32 bg-[#bf40ff]/20 blur-[50px] rounded-full top-1/4 left-1/4 z-0"
      />

      <div className="relative z-10 flex flex-col items-center gap-4 text-center p-6">
        <span className="material-symbols-outlined text-[48px] text-primary/80">play_circle</span>
        <p className="text-on-surface/50 font-label text-[10px] uppercase tracking-[0.2em] font-bold">Guía Virtual</p>
        <p className="text-on-surface/30 font-body text-xs mt-2 italic max-w-[200px]">
          (Espacio reservado para avatar HeyGen - Step {step})
        </p>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function AiGuide() {
  const [step, setStep] = useState<AiGuideStep>(1);
  const [answers, setAnswers] = useState<AiGuideAnswers>({
    occasion: '',
    expression: '',
    noteFamily: '',
  });
  const [results, setResults] = useState<AiGuideResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = (key: keyof AiGuideAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    setStep(prev => (prev + 1) as AiGuideStep);
  };

  const submitAnswers = async () => {
    setIsLoading(true);
    setStep(5); // Transition step
    try {
      const res = await fetch('/api/ai-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      setResults(data.recommendations || []);
      setStep(0); // 0 means finished/results
    } catch (e) {
      console.error(e);
      setStep(1); // fallback
    } finally {
      setIsLoading(false);
    }
  };

  const getWhatsAppLink = (perfume: AiGuideResult) => {
    const text = `Hola, me interesó la recomendación de la Guía IA: ${perfume.name} de ${perfume.brand}. ¿Podrían darme más información?`;
    return `https://wa.me/573136876673?text=${encodeURIComponent(text)}`;
  };

  // Content configuration for each step
  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: "Bienvenido a Touche Essencielle",
          message: assistantContent.step1.message,
          options: [
            { label: 'Empezar mi experiencia', action: () => setStep(2), highlight: true }
          ]
        };
      case 2:
        return {
          title: "¿Para qué ocasión buscas esta fragancia?",
          message: assistantContent.intermediate.message,
          options: [
            { label: 'Oficina', value: 'oficina' },
            { label: 'Uso Diario', value: 'uso-diario' },
            { label: 'Cita Romántica', value: 'cita-romantica' },
            { label: 'Evento Formal', value: 'evento-formal' },
            { label: 'Deporte', value: 'deporte' }
          ],
          actionKey: 'occasion' as keyof AiGuideAnswers
        };
      case 3:
        return {
          title: "¿Qué mensaje deseas proyectar?",
          message: assistantContent.intermediate.message,
          options: [
            { label: 'Elegancia y Seriedad', value: 'elegancia' },
            { label: 'Sensualidad y Atrevimiento', value: 'sensualidad' },
            { label: 'Frescura y Limpieza', value: 'frescura' },
            { label: 'Éxito y Poder', value: 'exito' }
          ],
          actionKey: 'expression' as keyof AiGuideAnswers
        };
      case 4:
         return {
          title: "¿Qué familia de notas prefieres?",
          message: assistantContent.preTransition.message,
          options: [
            { label: 'Orientales / Especiadas', value: 'orientales' },
            { label: 'Frutales', value: 'frutales' },
            { label: 'Florales', value: 'florales' },
            { label: 'Frescos', value: 'frescos' },
            { label: 'Amaderados', value: 'amaderados' },
            { label: 'Cítricas', value: 'citricos' },
            { label: 'Aromáticas', value: 'aromaticas' },
            { label: 'Acuáticos', value: 'acuaticos' },
          ],
          actionKey: 'noteFamily' as keyof AiGuideAnswers
        };
      case 5:
        return {
          title: "Creando Magia...",
          message: assistantContent.loading.message,
          options: []
        }
      case 0:
      default:
        return null; // Handled separately in render
    }
  };

  const content = getStepContent();

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 min-h-[85vh] relative z-10 px-4">
      {/* Luxury aesthetic background accent */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1d052d] via-background to-background opacity-80" />

      {step > 0 && <VideoPlaceholder step={step} />}

      <AnimatePresence mode="wait">
        {step > 0 && content ? (
           <motion.div
             key={`step-${step}`}
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -15 }}
             transition={{ duration: 0.4 }}
             className="flex flex-col gap-6 pt-4"
           >
              {/* Step indicator (except on welcome & transition) */}
              {step > 1 && step < 5 && (
                <div className="flex justify-center items-center gap-2 mb-2">
                  {[2,3,4].map(s => (
                    <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step === s ? 'w-8 bg-primary shadow-[0_0_10px_rgba(212,175,55,0.6)]' : 'w-2 bg-primary/20'}`} />
                  ))}
                </div>
              )}

              <h2 className="text-2xl font-headline font-bold text-primary/90 text-center leading-snug">
                {content.title}
              </h2>
              <p className="text-center font-body text-on-surface/80 text-sm italic tracking-wide max-w-sm mx-auto">
                "{content.message}"
              </p>

              <div className="flex flex-col gap-3 mt-4">
                {content.options.map((opt: any, i) => (
                  <motion.button
                    key={opt.value || opt.label}
                    onClick={() => {
                      if (opt.action) opt.action();
                      else if (content.actionKey && step === 4) {
                         setAnswers(prev => ({...prev, [content.actionKey]: opt.value}));
                         submitAnswers(); // if last step
                      }
                      else if (content.actionKey) {
                        handleNext(content.actionKey, opt.value);
                      }
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full py-4 px-6 rounded-xl border text-center font-label text-sm uppercase tracking-wider font-bold transition-all duration-300
                      ${opt.highlight 
                        ? 'gold-gradient text-black border-transparent shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]' 
                        : 'border-primary/30 bg-surface-container/50 backdrop-blur-md text-on-surface/80 hover:border-primary/60 hover:text-primary'}
                    `}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>

              {isLoading && step === 5 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center items-center py-8"
                >
                  <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                </motion.div>
              )}
           </motion.div>
        ) : step === 0 ? (
          // RESULTS VIEW
          <motion.div
             key="results"
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.5 }}
             className="flex flex-col gap-8 pt-4 w-full"
          >
             <div className="text-center flex flex-col gap-4">
                <span className="material-symbols-outlined text-5xl text-primary drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">auto_awesome</span>
                <h2 className="text-3xl font-headline font-bold text-on-surface">Tus Revelaciones</h2>
                <p className="font-body text-on-surface/80 text-sm leading-relaxed max-w-sm mx-auto italic">
                  "{assistantContent.final.message}"
                </p>
             </div>

             <div className="flex flex-col gap-6 w-full">
               {results.map((r, i) => (
                 <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    key={r.id}
                    className="relative group bg-surface-container/60 backdrop-blur-lg border border-primary/20 hover:border-primary/50 transition-all rounded-3xl p-5 overflow-hidden"
                 >
                    {/* Position badge */}
                    <div className="absolute top-0 right-0 bg-primary text-black font-label text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest z-10 shadow-lg">
                      Match #{i+1}
                    </div>
                    {/* 1.1 Badge */}
                    {r.version === '1.1' && (
                       <div className="absolute top-0 left-0 bg-red-900/80 text-white font-label text-[9px] font-bold px-3 py-1 rounded-br-xl uppercase tracking-wider z-10 border-b border-r border-red-500/50">
                         VERSIÓN 1.1
                       </div>
                    )}

                    <div className="mt-4 flex flex-col gap-1">
                      <p className="text-[10px] font-label text-primary/80 uppercase tracking-widest">{r.brand}</p>
                      <h3 className="text-xl font-headline font-bold text-on-surface">{r.name}</h3>
                      <p className="text-xs font-body text-on-surface/60 mt-1 capitalize">{r.family}</p>
                    </div>

                    <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                    <div className="flex flex-col gap-2 mb-6">
                       <p className="text-xs font-body text-on-surface/70 leading-relaxed line-clamp-3 italic">
                         "{r.emotionalDesc.split('.')[0]}."
                       </p>
                       <p className="text-[11px] font-body text-primary/90 font-medium mt-2">
                         <strong className="font-label uppercase tracking-widest text-[9px] text-on-surface/50 mr-1">Corazón:</strong> 
                         {r.heartNotes || r.topNotes}
                       </p>
                    </div>

                    <a
                      href={getWhatsAppLink(r)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 rounded-xl border border-primary/40 text-center font-label text-[11px] uppercase tracking-widest font-bold text-primary hover:bg-primary hover:text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
                    >
                      Solicitar Asesoría
                    </a>
                 </motion.div>
               ))}
               
               {results.length === 0 && (
                 <p className="text-center text-on-surface/50 font-body text-sm py-10">No logramos encontrar un match perfecto. Por favor, intenta de nuevo.</p>
               )}
             </div>

             <button
                onClick={() => { setStep(1); setAnswers({ occasion: '', expression: '', noteFamily: ''}); }}
                className="mt-4 mx-auto flex items-center gap-2 text-on-surface/50 hover:text-primary transition-colors font-label text-xs uppercase tracking-widest font-bold"
             >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Volver a empezar
             </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
