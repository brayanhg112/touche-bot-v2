'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MetaCommercial {
  id: string;
  titulo: string;
  objetivo: number;
  actual: number;
  unidad: string;
  categoria: 'Ventas' | 'Ahorro' | 'Producción' | 'Personal';
}

const INITIAL_METAS: MetaCommercial[] = [
  {
    id: 'm_1',
    titulo: 'Ventas Mensuales Fragancias',
    objetivo: 5000000,
    actual: 2850000,
    unidad: '$ COP',
    categoria: 'Ventas',
  },
  {
    id: 'm_2',
    titulo: 'Producción Frascos 50ml/100ml',
    objetivo: 150,
    actual: 95,
    unidad: 'frascos',
    categoria: 'Producción',
  },
  {
    id: 'm_3',
    titulo: 'Fondo de Reserva Touche',
    objetivo: 2000000,
    actual: 1200000,
    unidad: '$ COP',
    categoria: 'Ahorro',
  },
];

export default function MetasPage() {
  const [metas, setMetas] = useState<MetaCommercial[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('touche_metas_list');
      if (saved) {
        try { return JSON.parse(saved); } catch { return INITIAL_METAS; }
      }
    }
    return INITIAL_METAS;
  });

  const [titulo, setTitulo] = useState('');
  const [objetivo, setObjetivo] = useState<number>(1000000);
  const [actual, setActual] = useState<number>(0);
  const [unidad, setUnidad] = useState('$ COP');
  const [categoria, setCategoria] = useState<'Ventas' | 'Ahorro' | 'Producción' | 'Personal'>('Ventas');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('touche_metas_list', JSON.stringify(metas));
    }
  }, [metas]);

  const handleAddMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      alert('Ingresa el título de la meta.');
      return;
    }
    const newMeta: MetaCommercial = {
      id: `m_${Date.now()}`,
      titulo,
      objetivo,
      actual,
      unidad,
      categoria,
    };
    setMetas([...metas, newMeta]);
    setTitulo('');
    setActual(0);
  };

  const handleUpdateProgress = (id: string, delta: number) => {
    setMetas(metas.map(m => {
      if (m.id === id) {
        return { ...m, actual: Math.max(0, m.actual + delta) };
      }
      return m;
    }));
  };

  const handleDelete = (id: string) => {
    setMetas(metas.filter(m => m.id !== id));
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-widest">
            Tablero de Crecimiento
          </span>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-transparent bg-clip-text gold-gradient mt-2">
            Metas Visuales & Gamificación
          </h1>
          <p className="text-sm text-white/60 font-label mt-1">
            Seguimiento de objetivos financieros, volumen de ventas y hitos de marca
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulario (5 Cols) */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 sm:p-8 border border-primary/20 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">flag</span>
            </div>
            <div>
              <h2 className="font-headline text-xl font-bold text-white">Nueva Meta</h2>
              <p className="text-xs text-white/50 font-label">Fija un nuevo objetivo con barra de progreso</p>
            </div>
          </div>

          <form onSubmit={handleAddMeta} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                Título de la Meta *
              </label>
              <input
                type="text"
                placeholder="Ej: Vender 200 frascos de Oud Imperial..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-base text-white placeholder:text-white/30 focus:border-primary focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as any)}
                  className="w-full min-h-[56px] bg-[#0a0a0f] border border-primary/30 rounded-2xl py-4 px-5 text-base text-white focus:border-primary focus:outline-none transition-all"
                >
                  <option value="Ventas">Ventas</option>
                  <option value="Producción">Producción</option>
                  <option value="Ahorro">Ahorro</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                  Unidad
                </label>
                <input
                  type="text"
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                  className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-base text-white focus:border-primary focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                  Progreso Actual
                </label>
                <input
                  type="number"
                  min="0"
                  value={actual}
                  onChange={(e) => setActual(Number(e.target.value))}
                  className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-lg font-bold text-white focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                  Objetivo Meta *
                </label>
                <input
                  type="number"
                  min="1"
                  value={objetivo}
                  onChange={(e) => setObjetivo(Number(e.target.value))}
                  className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-lg font-bold text-white focus:border-primary focus:outline-none transition-all"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              className="w-full min-h-[64px] py-4 px-6 rounded-2xl bg-primary text-white font-label font-extrabold text-base uppercase tracking-wider shadow-[0_0_25px_rgba(126,34,206,0.4)] transition-all flex items-center justify-center gap-3 mt-2"
            >
              <span className="material-symbols-outlined text-[26px]">stars</span>
              Fijar Meta
            </motion.button>
          </form>
        </div>

        {/* Metas Active Grid (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <AnimatePresence>
            {metas.map((m) => {
              const pct = Math.min(100, Math.round((m.actual / m.objetivo) * 100));
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card rounded-3xl p-6 border border-primary/20 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                        {m.categoria}
                      </span>
                      <h3 className="font-headline text-xl font-bold text-white mt-1">{m.titulo}</h3>
                    </div>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/40 transition-all flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold font-mono">
                      <span className="text-white/60">
                        {m.unidad === '$ COP' ? `$${m.actual.toLocaleString('es-CO')}` : `${m.actual} ${m.unidad}`} / {m.unidad === '$ COP' ? `$${m.objetivo.toLocaleString('es-CO')}` : `${m.objetivo} ${m.unidad}`}
                      </span>
                      <span className="text-primary font-headline text-base">{pct}%</span>
                    </div>
                    <div className="w-full h-4 rounded-full bg-white/10 overflow-hidden border border-white/10 p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          pct >= 100
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.6)]'
                            : 'bg-gradient-to-r from-primary to-purple-400 shadow-[0_0_15px_rgba(126,34,206,0.6)]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Steppers */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="text-xs text-white/40 font-label uppercase">Ajuste Rápido</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateProgress(m.id, m.unidad === '$ COP' ? -100000 : -10)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/70 hover:text-white"
                      >
                        -{m.unidad === '$ COP' ? '100k' : '10'}
                      </button>
                      <button
                        onClick={() => handleUpdateProgress(m.id, m.unidad === '$ COP' ? 100000 : 10)}
                        className="px-3 py-1.5 rounded-xl bg-primary/20 border border-primary/40 text-xs font-bold text-primary hover:bg-primary/30"
                      >
                        +{m.unidad === '$ COP' ? '100k' : '10'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
