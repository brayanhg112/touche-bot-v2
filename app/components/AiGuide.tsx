'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AiGuideResult } from '../lib/aiGuideTypes';
import { assistantContent } from '../lib/assistantContent';

export default function AiGuide() {
  const [step, setStep] = useState<number>(1);

  const [answers, setAnswers] = useState<any>({
    gender: '',
    occasion: '',
    noteFamily: '',
  });

  const [results, setResults] = useState<AiGuideResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const getClipForStep = (currentStep: number) => {
    switch (currentStep) {
      case 2: return { start: 0, end: 15 };       // Bienvenida + Selección de género
      case 3: return { start: 15.1, end: 21.5 };  // Registro / Recepción de preferencias
      case 4: return { start: 21.6, end: 28.3 };    // Transición hacia la recta final
      case 5: return { start: 28.5, end: 39.8 };  // Carga / Procesando
      case 0: return { start: 28.5, end: 39.8 };  // Cierre y propuesta de valor
      default: return { start: 0, end: 0 };
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || step === 1) return;

    const clip = getClipForStep(step);
    video.currentTime = clip.start;

    video.play().catch(e => console.warn("Video blocked by browser policy", e));

    const handleTimeUpdate = () => {
      if (video.currentTime >= clip.end) {
        video.pause();
        video.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [step]);

  // ─── AUDIO UNLOCK (Antigravity Fix) ────────────────────────────────────────
  const startExperience = () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const silentBuffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = silentBuffer;
          source.connect(ctx.destination);
          source.start(0);
          source.onended = () => ctx.close().catch(() => { });
        }
      } catch (_) { }

      audio.volume = 0.15;
      audio.muted = false;
      audio.load();
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) =>
          console.warn('[AiGuide] Audio bloqueado:', e)
        );
      }
    }
    setStep(2);
  };

  const handleNext = (key: string, value: string) => {
    setAnswers((prev: any) => ({ ...prev, [key]: value }));
    setStep(prev => prev + 1);
  };

  const getWhatsAppLink = (perfume: AiGuideResult) => {
    const text = `Hola, me interesó la recomendación del Sommelier IA: ${perfume.name} de ${perfume.brand}. ¿Podrían darme más información?`;
    return `https://wa.me/573136876673?text=${encodeURIComponent(text)}`;
  };

  // ─── ENCUADRE A LA CARA EN MÓVIL ───────────────────────────────
  const getVideoClass = () => {
    return "w-full h-full object-cover object-[center_5%] md:object-cover md:object-top";
  };

  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: "Bienvenido a Touche Essencielle",
          message: "Para poder ofrecerte la mejor experiencia con nuestro Sommelier, presiona el botón de abajo.",
          options: [
            { label: 'Empezar mi experiencia', action: startExperience, highlight: true }
          ]
        };
      case 2:
        return {
          title: "Definiendo la Dirección",
          message: "¿Te inclinas hoy por una creación masculina, femenina o una propuesta sin etiquetas?",
          options: [
            { label: 'Caballero', value: 'HOMBRE' },
            { label: 'Dama', value: 'MUJER' },
            { label: 'Unisex', value: 'UNISEX' }
          ],
          actionKey: 'gender'
        };
      case 3:
        return {
          title: "Calibrando el Perfil",
          message: "Comprendo perfectamente tu elección; guardaré cada detalle en la memoria. ¿Para qué ocasión principal buscas esta fragancia?",
          options: [
            { label: 'Oficina / Profesional', value: 'OFICINA' },
            { label: 'Uso Diario', value: 'USO DIARIO' },
            { label: 'Cita Romántica', value: 'CITA ROMATICA' },
            { label: 'Evento Formal', value: 'EVENTO FORMAL' },
            { label: 'Deporte', value: 'DEPORTE' }
          ],
          actionKey: 'occasion'
        };
      case 4:
        return {
          title: "Revelando tu Esencia",
          message: "Estamos a tan solo un paso de revelar esa esencia. ¿Qué familia olfativa te cautiva más?",
          options: [
            { label: 'Orientales / Especiadas', value: 'ORIENTALES/ESPECIADAS' },
            { label: 'Amaderadas', value: 'AMADERADAS' },
            { label: 'Cítricas', value: 'CITRICAS' },
            { label: 'Dulces', value: 'DULCES' },
            { label: 'Frutales', value: 'FRUTALES' },
            { label: 'Florales', value: 'FLORALES' },
            { label: 'Acuáticas', value: 'ACUATICAS' }
          ],
          actionKey: 'noteFamily'
        };
      case 5:
        return {
          title: "Creando Magia...",
          message: "Seleccionando las mejores piezas de nuestra bóveda...",
          options: []
        };
      case 0:
      default:
        return null;
    }
  };

  const content = getStepContent();

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4 md:gap-6 min-h-[100dvh] md:min-h-[85vh] relative z-10 px-4 pb-8 md:pb-0 justify-center">

      <audio
        ref={audioRef}
        src="/audio/mafia-song.mp3"
        loop
        preload="auto"
        playsInline
        className="hidden"
      />

      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1d052d] via-background to-background opacity-80" />

      {step !== -1 && (
        <div className={`relative w-full aspect-square max-h-[42vh] md:aspect-[9/16] md:max-h-[52vh] bg-black rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(100,20,150,0.15)] flex flex-col items-center justify-center border border-primary/30 transition-all duration-500 ${step === 0 ? 'scale-95 border-primary/50 shadow-[0_0_30px_rgba(212,175,55,0.4)]' : ''}`}>
          <video
            ref={videoRef}
            className={`w-full h-full transition-all duration-300 ${getVideoClass()}`}
            playsInline
            controls={false}
          >
            <source src="/video/bot-introduccion.mp4" type="video/mp4" />
          </video>
        </div>
      )}

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
            {step > 1 && step < 5 && (
              <div className="flex justify-center items-center gap-2 mb-2">
                {[2, 3, 4].map(s => (
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

            <div className="flex flex-col gap-3 mt-2 md:mt-4 max-h-[45vh] md:max-h-none overflow-y-auto md:overflow-visible no-scrollbar pb-4 md:pb-0 scroll-smooth">
              {content.options.map((opt: any, i) => (
                <motion.button
                  key={opt.value || opt.label}
                  onClick={() => {
                    if (opt.action) opt.action();
                    else if (content.actionKey && step === 4) {
                      const updatedAnswers = { ...answers, noteFamily: opt.value };
                      setAnswers(updatedAnswers);
                      setIsLoading(true);
                      setStep(5);
                      fetch('/api/ai-guide', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedAnswers),
                      })
                        .then(res => res.json())
                        .then(data => {
                          setResults(data.recommendations || []);
                          setStep(0);
                        })
                        .catch(e => {
                          console.error(e);
                          setStep(1);
                        })
                        .finally(() => {
                          setIsLoading(false);
                        });
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
                     w-full py-4 px-6 rounded-xl border text-center font-label text-sm uppercase tracking-wider font-bold transition-all duration-300 select-none
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
                "Listo, tras analizar tus preferencias, he seleccionado estas tres creaciones que parecen hechas a tu medida."
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
                  <div className="absolute top-0 right-0 bg-primary text-black font-label text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest z-10 shadow-lg">
                    Match #{i + 1}
                  </div>
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
                      "{r.emotionalDesc?.split('.')[0] || "Una creación única y cautivadora"}."
                    </p>
                    <p className="text-[11px] font-body text-primary/90 font-medium mt-2">
                      <strong className="font-label uppercase tracking-widest text-[9px] text-on-surface/50 mr-1">Notas:</strong>
                      {r.heartNotes || r.topNotes || "Mezcla exclusiva Touche Essencielle"}
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
                <p className="text-center text-on-surface/50 font-body text-sm py-10">No logramos encontrar un match perfecto en stock. Por favor, intenta de nuevo ampliando tus opciones.</p>
              )}
            </div>

            <button
              onClick={() => { setStep(1); setAnswers({ gender: '', occasion: '', noteFamily: '' }); }}
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