'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PerfumeCard from './PerfumeCard';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ScoredPerfume } from '../lib/recommender';
import type { BotAnswers } from '../lib/types';

interface WizardStep {
  step: number;
  question: string;
  options: string[];
  is_finished: boolean;
  recommendations: ScoredPerfume[] | null;
  botAnswers?: BotAnswers;
}

export default function Bot() {
  const [currentStep, setCurrentStep] = useState<WizardStep>({
    step: 0,
    question: '',
    options: [],
    is_finished: false,
    recommendations: null,
  });
  const [collectedAnswers, setCollectedAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Step 6 State
  const [multiSelectValues, setMultiSelectValues] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const virtualizerRef = useRef<HTMLDivElement>(null);

  // Kick off: fetch step 1 on mount
  useEffect(() => {
    fetchStep(0, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentStep, isLoading]);

  const fetchStep = async (completedStep: number, answers: string[]) => {
    setIsLoading(true);
    setSelectedAnswer(null);
    setMultiSelectValues([]);
    setSearchTerm('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: completedStep, answers }),
      });
      const data: WizardStep = await res.json();
      setCurrentStep(data);
    } catch {
      setCurrentStep({
        step: 1,
        question: 'Error de conexión. Por favor, recarga la página.',
        options: [],
        is_finished: false,
        recommendations: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = (option: string) => {
    if (isLoading) return;

    // Save to history
    if (currentStep.question) {
      setHistory(prev => [...prev, { question: currentStep.question, answer: option }]);
    }

    // Collect answer
    const newAnswers = [...collectedAnswers, option];
    setCollectedAnswers(newAnswers);
    setSelectedAnswer(option);

    // Advance
    fetchStep(currentStep.step, newAnswers);
  };

  const handleToggleMultiSelect = (opt: string) => {
    setMultiSelectValues(prev => 
      prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]
    );
  };

  const handleConfirmMultiSelect = () => {
    const finalAnswer = multiSelectValues.length > 0 ? multiSelectValues.join(', ') : 'Ninguno';
    handleOptionClick(finalAnswer);
  };

  const handleRestart = () => {
    setCollectedAnswers([]);
    setSelectedAnswer(null);
    setHistory([]);
    fetchStep(0, []);
  };

  const totalSteps = 6;
  const progressPct = currentStep.is_finished
    ? 100
    : Math.round(((currentStep.step - 1) / totalSteps) * 100);

  const isStep6 = currentStep.step === 6;
  const filteredOptions = currentStep.options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const rowVirtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => virtualizerRef.current,
    estimateSize: () => 60, // approximate height of each item
  });

  return (
    <div className="flex-1 flex flex-col relative w-full">

      {/* ── Progress bar ── */}
      {!currentStep.is_finished && currentStep.step > 0 && (
        <div className="w-full h-0.5 bg-primary/10 rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full gold-gradient rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* ── Answer history (breadcrumb) ── */}
      <AnimatePresence>
        {history.length > 0 && !currentStep.is_finished && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2 mb-6"
          >
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] font-body text-on-surface/50">
                <span className="text-primary/60 font-bold">{i + 1}.</span>
                <span className="truncate">{h.question}</span>
                <span className="ml-auto shrink-0 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider text-[9px] max-w-[120px] truncate">
                  {h.answer}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading spinner ── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 gap-4"
          >
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
            </div>
            <p className="text-[12px] font-body text-on-surface/50 tracking-widest uppercase animate-pulse">
              Aria está evaluando…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STEP VIEW: Question + Options ── */}
      <AnimatePresence mode="wait">
        {!isLoading && !currentStep.is_finished && currentStep.step > 0 && (
          <motion.div
            key={`step-${currentStep.step}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col gap-6"
          >
            {/* Step label */}
            <div className="flex items-center gap-3">
              <span className="font-headline text-[2.5rem] font-extrabold text-primary/15 leading-none">
                0{currentStep.step}
              </span>
              <div className="text-[10px] font-label text-primary/60 uppercase tracking-[0.2em]">
                Paso {currentStep.step} de {totalSteps}
              </div>
            </div>

            {/* Question */}
            <h2 className="font-headline text-2xl font-bold text-on-surface leading-snug">
              {currentStep.question}
            </h2>

            {/* Option buttons */}
            <div className="flex flex-col gap-3">
              {isStep6 ? (
                /* Step 6: Search & Checkboxes */
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/50">search</span>
                    <input 
                      type="text" 
                      placeholder="Buscar fragancias..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-surface-container-high border border-primary/20 rounded-xl py-3 pl-12 pr-4 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-body"
                    />
                  </div>
                  <div ref={virtualizerRef} className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredOptions.length > 0 ? (
                      <div
                        style={{
                          height: `${rowVirtualizer.getTotalSize()}px`,
                          width: '100%',
                          position: 'relative',
                        }}
                      >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                          const opt = filteredOptions[virtualRow.index];
                          const isSelected = multiSelectValues.includes(opt);
                          return (
                            <motion.button
                              key={virtualRow.key}
                              data-index={virtualRow.index}
                              ref={rowVirtualizer.measureElement}
                              onClick={() => handleToggleMultiSelect(opt)}
                              initial={{ opacity: 0, y: 20, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualRow.start}px)`,
                              }}
                              className={`
                                p-3 mb-2 rounded-xl border text-left
                                font-label text-sm uppercase tracking-wider font-bold
                                transition-all duration-200 flex items-center justify-between
                                ${isSelected
                                  ? 'border-primary bg-primary/20 text-primary'
                                  : 'border-primary/20 bg-surface text-on-surface/70 hover:border-primary/50 hover:bg-primary/5 hover:text-primary'
                                }
                              `}
                            >
                              <span className="truncate pr-2">{opt}</span>
                              <div className={`w-5 h-5 flex-shrink-0 rounded flex items-center justify-center border transition-all ${isSelected ? 'border-primary bg-primary text-black' : 'border-primary/30'}`}>
                                {isSelected && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-on-surface/50 text-sm font-body">No se encontraron resultados.</p>
                    )}
                  </div>
                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    onClick={handleConfirmMultiSelect}
                    className="mt-2 w-full py-4 rounded-xl gold-gradient text-black font-bold uppercase tracking-[0.2em] font-label hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex justify-center items-center gap-2"
                  >
                    Continuar <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </motion.button>
                </div>
              ) : (
                /* Step 1-5: Single Select Buttons */
                currentStep.options?.map((opt, idx) => (
                  <motion.button
                    key={opt}
                    id={`opt-${currentStep.step}-${idx}`}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 250, delay: idx * 0.05 }}
                    onClick={() => handleOptionClick(opt)}
                    disabled={isLoading}
                    className={`
                      group w-full py-4 px-6 rounded-2xl border text-left
                      font-label text-sm uppercase tracking-wider font-bold
                      transition-all duration-300 flex items-center gap-3
                      ${selectedAnswer === opt
                        ? 'border-primary bg-primary/20 text-primary shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                        : 'border-primary/30 bg-surface-container-high/80 backdrop-blur-xl text-on-surface/80 hover:border-primary/70 hover:bg-primary/10 hover:text-primary hover:scale-[1.02]'
                      }
                      active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <span className="w-6 h-6 rounded-full border border-primary/30 group-hover:border-primary flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                      <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${selectedAnswer === opt ? 'bg-primary scale-100' : 'bg-primary/0 scale-0 group-hover:bg-primary/50 group-hover:scale-100'}`} />
                    </span>
                    {opt}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RESULTS VIEW ── */}
      <AnimatePresence mode="wait">
        {!isLoading && currentStep.is_finished && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4"
          >
            {/* Divider header */}
            <div className="flex items-center gap-3 mt-2 mb-4">
              <div className="flex-1 h-px bg-primary/20" />
              <span className="text-[10px] font-label uppercase tracking-[0.25em] text-primary">
                Tus fragancias ideales
              </span>
              <div className="flex-1 h-px bg-primary/20" />
            </div>

            {/* Result message */}
            <p className="text-center font-body text-on-surface/70 text-sm mb-2">
              {currentStep.question}
            </p>

            {/* Perfume cards */}
            {currentStep.recommendations && currentStep.recommendations.length > 0 ? (
              currentStep.recommendations.map((result, idx) => (
                <PerfumeCard
                  key={result.perfume.id}
                  result={result}
                  rank={idx + 1}
                  answers={currentStep.botAnswers}
                />
              ))
            ) : (
              <div className="text-center py-10 text-on-surface/40 font-body text-sm">
                No encontramos coincidencias exactas. Intenta con otras preferencias.
              </div>
            )}

            {/* Restart button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 pb-8 flex justify-center"
            >
              <button
                id="btn-restart-quiz"
                onClick={handleRestart}
                className="flex items-center gap-2 px-8 py-3 rounded-full border border-primary/40 text-primary font-label text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Reiniciar Cuestionario
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
