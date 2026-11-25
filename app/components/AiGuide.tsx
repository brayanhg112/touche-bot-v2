'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AiGuideResult } from '../lib/aiGuideTypes';

// ─── PERFIL BYPASS MAP ──────────────────────────────────────────────────────
const PERFIL_ANSWERS: Record<string, { gender: string; occasion: string; noteFamily: string }> = {
  magnetismo: { gender: 'UNISEX', occasion: 'CITA ROMANTICA', noteFamily: 'ORIENTALES/ESPECIADAS' },
  elegante: { gender: 'UNISEX', occasion: 'EVENTO FORMAL', noteFamily: 'AMADERADAS' },
  imponente: { gender: 'UNISEX', occasion: 'EVENTO FORMAL', noteFamily: 'ORIENTALES/ESPECIADAS' },
  vibrante: { gender: 'UNISEX', occasion: 'USO DIARIO', noteFamily: 'CITRICAS' },
  sensual: { gender: 'UNISEX', occasion: 'CITA ROMANTICA', noteFamily: 'FLORALES' },
  diferente: { gender: 'UNISEX', occasion: 'USO DIARIO', noteFamily: 'AMADERADAS' },
};

export default function AiGuide() {
  const [step, setStep] = useState<number>(1);
  const [answers, setAnswers] = useState<{ gender: string; occasion: string; noteFamily: string }>({
    gender: '',
    occasion: '',
    noteFamily: '',
  });
  const [results, setResults] = useState<AiGuideResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ─── BYPASS: Lee ?perfil= al montar ────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const perfil = params.get('perfil')?.toLowerCase();
    if (!perfil) return;

    const presetAnswers = PERFIL_ANSWERS[perfil];
    if (!presetAnswers) {
      console.warn(`[Bypass] Perfil desconocido: "${perfil}". Iniciando quiz normal.`);
      return;
    }

    setAnswers(presetAnswers);
    setIsLoading(true);
    setApiError(null);
    setStep(5);

    fetch('/api/ai-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(presetAnswers),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error consultando inventario en vivo');
        return data;
      })
      .then((data) => {
        setResults(Array.isArray(data.recommendations) ? data.recommendations : []);
        setStep(0);
      })
      .catch((e) => {
        console.error('[Bypass] Error al obtener recomendaciones en vivo:', e);
        setApiError('No pudimos conectar con el inventario en vivo en este momento.');
        setResults([]);
        setStep(0);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const getClipForStep = (currentStep: number) => {
    switch (currentStep) {
      case 2: return { start: 0, end: 15 };
      case 3: return { start: 15.1, end: 21.5 };
      case 4: return { start: 21.6, end: 28.3 };
      case 5: return { start: 28.5, end: 39.8 };
      case 0: return { start: 28.5, end: 39.8 };
      default: return { start: 0, end: 0 };
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || step === 1) return;

    const clip = getClipForStep(step);
    video.currentTime = clip.start;

    video.play().catch((e) => console.warn('Video blocked by browser policy', e));

    const handleTimeUpdate = () => {
      if (video.currentTime >= clip.end) {
        video.pause();
        video.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [step]);

  // ─── AUDIO UNLOCK ──────────────────────────────────────────────────────────
  const startExperience = () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const silentBuffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = silentBuffer;
          source.connect(ctx.destination);
          source.start(0);
          source.onended = () => ctx.close().catch(() => {});
        }
      } catch {
        // ignore audio unlock errors
      }

      audio.volume = 0.15;
      audio.muted = false;
      audio.load();
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => console.warn('[AiGuide] Audio bloqueado:', e));
      }
    }
    setStep(2);
  };

  const handleNext = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setStep((prev) => prev + 1);
  };

  const getWhatsAppLink = (perfume: AiGuideResult) => {
    const text = `Hola, me interesó la recomendación del Sommelier IA: ${perfume.name} de ${perfume.brand}. ¿Podrían darme más información?`;
    return `https://wa.me/573136876673?text=${encodeURIComponent(text)}`;
  };

  const getVideoClass = () =>
    'w-full h-full object-cover object-[center_0%] md:object-cover md:object-top';

  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: 'Bienvenido a Touche Essencielle',
          message: 'Para poder ofrecerte la mejor experiencia con nuestro Sommelier, presiona el botón de abajo.',
          options: [{ label: 'Empezar mi experiencia', action: startExperience, highlight: true }],
        };
      case 2:
        return {
          title: 'Definiendo la Dirección',
          message: '¿Te inclinas hoy por una creación masculina, femenina o una propuesta sin etiquetas?',
          options: [
            { label: 'Caballero', value: 'HOMBRE' },
            { label: 'Dama', value: 'MUJER' },
            { label: 'Unisex', value: 'UNISEX' },
          ],
          actionKey: 'gender',
        };
      case 3:
        return {
          title: 'Calibrando el Perfil',
          message: 'Comprendo perfectamente tu elección; guardaré cada detalle en la memoria. ¿Para qué ocasión principal buscas esta fragancia?',
          options: [
            { label: 'Oficina / Profesional', value: 'OFICINA' },
            { label: 'Uso Diario', value: 'USO DIARIO' },
            { label: 'Cita Romántica', value: 'CITA ROMANTICA' },
            { label: 'Evento Formal', value: 'EVENTO FORMAL' },
            { label: 'Deporte', value: 'DEPORTE' },
          ],
          actionKey: 'occasion',
        };
      case 4:
        return {
          title: 'Revelando tu Esencia',
          message: 'Estamos a tan solo un paso de revelar esa esencia. ¿Qué familia olfativa te cautiva más?',
          options: [
            { label: 'Orientales / Especiadas', value: 'ORIENTALES/ESPECIADAS' },
            { label: 'Amaderadas', value: 'AMADERADAS' },
            { label: 'Cítricas', value: 'CITRICAS' },
            { label: 'Dulces', value: 'DULCES' },
            { label: 'Frutales', value: 'FRUTALES' },
            { label: 'Florales', value: 'FLORALES' },
            { label: 'Acuáticas', value: 'ACUATICAS' },
          ],
          actionKey: 'noteFamily',
        };
      case 5:
        return {
          title: 'Creando Magia...',
          message: 'Seleccionando las mejores piezas disponibles en nuestro inventario en vivo...',
          options: [],
        };
      case 0:
      default:
        return null;
    }
  };

  const content = getStepContent();

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 md:gap-6 flex-1 relative z-10 pb-6 justify-center">
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
        <div
          className={`relative w-full max-w-md mx-auto aspect-square max-h-[36dvh] md:aspect-[9/16] md:max-h-[45dvh] bg-black rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(100,20,150,0.15)] flex flex-col items-center justify-center border border-primary/30 transition-all duration-500 ${
            step === 0 ? 'scale-95 border-primary/50 shadow-[0_0_30px_rgba(212,175,55,0.4)]' : ''
          }`}
        >
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
            className="w-full max-w-xl mx-auto flex flex-col gap-5 pt-2"
          >
            {step > 1 && step < 5 && (
              <div className="flex justify-center items-center gap-2 mb-1">
                {[2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      step === s ? 'w-8 bg-primary shadow-[0_0_10px_rgba(212,175,55,0.6)]' : 'w-2 bg-primary/20'
                    }`}
                  />
                ))}
              </div>
            )}

            <h2 className="text-2xl font-headline font-bold text-primary/90 text-center leading-snug">
              {content.title}
            </h2>
            <p className="text-center font-body text-on-surface/80 text-sm italic tracking-wide max-w-sm mx-auto">
              &ldquo;{content.message}&rdquo;
            </p>

            <div className="flex flex-col gap-3 mt-1 max-h-[40dvh] md:max-h-none overflow-y-auto md:overflow-visible no-scrollbar pb-2 md:pb-0 scroll-smooth">
              {content.options.map((opt: { label: string; value?: string; action?: () => void; highlight?: boolean }, i) => (
                <motion.button
                  type="button"
                  key={opt.value || opt.label}
                  onClick={() => {
                    if (opt.action) opt.action();
                    else if (content.actionKey && step === 4 && opt.value) {
                      const updatedAnswers = { ...answers, noteFamily: opt.value };
                      setAnswers(updatedAnswers);
                      setIsLoading(true);
                      setApiError(null);
                      setStep(5);
                      fetch('/api/ai-guide', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        cache: 'no-store',
                        body: JSON.stringify(updatedAnswers),
                      })
                        .then(async (res) => {
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Error consultando inventario');
                          return data;
                        })
                        .then((data) => {
                          setResults(Array.isArray(data.recommendations) ? data.recommendations : []);
                          setStep(0);
                        })
                        .catch((e) => {
                          console.error('[AiGuide] Error al obtener recomendaciones en vivo:', e);
                          setApiError('No pudimos consultar el inventario en vivo en este momento. Intenta de nuevo.');
                          setResults([]);
                          setStep(0);
                        })
                        .finally(() => {
                          setIsLoading(false);
                        });
                    } else if (content.actionKey && opt.value) {
                      handleNext(content.actionKey, opt.value);
                    }
                  }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  style={!opt.highlight ? { WebkitBackdropFilter: 'blur(12px)' } : undefined}
                  className={`
                    w-full min-h-[48px] py-3.5 px-6 rounded-xl border text-center font-label text-sm uppercase tracking-wider font-bold transition-all duration-300 select-none
                    ${
                      opt.highlight
                        ? 'gold-gradient text-white border-transparent shadow-[0_0_20px_rgba(126,34,206,0.35)] hover:shadow-[0_0_30px_rgba(126,34,206,0.55)]'
                        : 'border-primary/30 bg-surface-container/50 backdrop-blur-md text-on-surface/80 hover:border-primary/60 hover:text-primary'
                    }
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
            className="flex flex-col gap-6 pt-2 w-full"
          >
            <div className="text-center flex flex-col gap-3">
              <span className="material-symbols-outlined text-5xl text-primary drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">
                auto_awesome
              </span>
              <h2 className="text-3xl font-headline font-bold text-on-surface">Tus Revelaciones</h2>
              <p className="font-body text-on-surface/80 text-sm leading-relaxed max-w-md mx-auto italic">
                &ldquo;Listo, tras analizar tus preferencias y nuestro inventario en vivo, he seleccionado estas tres creaciones ideales para ti.&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {results.map((r, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.2 }}
                  key={`${r.id}-${i}`}
                  style={{ WebkitBackdropFilter: 'blur(16px)' }}
                  className="relative group bg-surface-container/60 backdrop-blur-lg border border-primary/20 hover:border-primary/50 transition-all rounded-3xl p-5 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="absolute top-0 right-0 bg-primary text-white font-label text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest z-10 shadow-lg">
                      Match #{i + 1}
                    </div>
                    {r.version === '1.1' && (
                      <div className="absolute top-0 left-0 bg-red-900/80 text-white font-label text-[9px] font-bold px-3 py-1 rounded-br-xl uppercase tracking-wider z-10 border-b border-r border-red-500/50">
                        VERSIÓN 1.1
                      </div>
                    )}

                    <div className="mt-5 flex flex-col gap-1">
                      <p className="text-[10px] font-label text-primary/80 uppercase tracking-widest">{r.brand}</p>
                      <h3 className="text-xl font-headline font-bold text-on-surface">{r.name}</h3>
                      <p className="text-xs font-body text-on-surface/60 mt-1 capitalize">{r.family}</p>
                    </div>

                    <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                    <div className="flex flex-col gap-2 mb-6">
                      <p className="text-xs font-body text-on-surface/70 leading-relaxed line-clamp-3 italic">
                        &ldquo;{r.emotionalDesc?.split('.')[0] || 'Una creación única y cautivadora'}.&rdquo;
                      </p>
                      <p className="text-[11px] font-body text-primary/90 font-medium mt-2">
                        <strong className="font-label uppercase tracking-widest text-[9px] text-on-surface/50 mr-1">
                          Notas:
                        </strong>
                        {r.heartNotes || r.topNotes || 'Selección olfativa exclusiva'}
                      </p>
                    </div>
                  </div>

                  <a
                    href={getWhatsAppLink(r)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] flex items-center justify-center w-full py-3 px-4 rounded-xl border border-primary/40 text-center font-label text-[11px] uppercase tracking-widest font-bold text-primary hover:bg-primary hover:text-white hover:shadow-[0_0_20px_rgba(126,34,206,0.4)] transition-all"
                  >
                    Solicitar Asesoría
                  </a>
                </motion.div>
              ))}

              {results.length === 0 && (
                <div className="md:col-span-3 flex flex-col items-center gap-3 py-6 text-center rounded-2xl border border-primary/20 bg-surface-container/50 p-6">
                  <p className="text-sm font-body text-on-surface/80">
                    {apiError || 'No hay fragancias activas disponibles en este momento.'}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('perfil');
                window.history.replaceState({}, '', url.toString());

                setResults([]);
                setApiError(null);
                setAnswers({ gender: '', occasion: '', noteFamily: '' });
                setStep(1);
              }}
              className="mt-2 mx-auto min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-full flex items-center justify-center gap-2 text-on-surface/60 hover:text-primary transition-colors font-label text-xs uppercase tracking-widest font-bold"
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
