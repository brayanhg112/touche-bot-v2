'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Danomerma {
  id: string;
  tipo: string;
  descripcion: string;
  cantidad: number;
  costoEstimado: number;
  fecha: string;
}

const INITIAL_DANOS: Danomerma[] = [
  {
    id: 'd_1',
    tipo: 'Frasco Roto',
    descripcion: 'Caída de frasco 50ml cristal en empaque',
    cantidad: 1,
    costoEstimado: 26500,
    fecha: new Date().toISOString().split('T')[0],
  },
];

export default function DanosPage() {
  const [danos, setDanos] = useState<Danomerma[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('touche_danos_list');
      if (saved) {
        try { return JSON.parse(saved); } catch { return INITIAL_DANOS; }
      }
    }
    return INITIAL_DANOS;
  });

  const [tipo, setTipo] = useState('Frasco Roto');
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [costoEstimado, setCostoEstimado] = useState(15000);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('touche_danos_list', JSON.stringify(danos));
    }
  }, [danos]);

  const totalPerdida = danos.reduce((acc, d) => acc + d.costoEstimado * d.cantidad, 0);

  const handleAddDano = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) {
      alert('Ingresa una descripción del daño.');
      return;
    }
    const newDano: Danomerma = {
      id: `d_${Date.now()}`,
      tipo,
      descripcion,
      cantidad,
      costoEstimado,
      fecha: new Date().toISOString().split('T')[0],
    };
    setDanos([newDano, ...danos]);
    setDescripcion('');
    setCantidad(1);
  };

  const handleDelete = (id: string) => {
    setDanos(danos.filter(d => d.id !== id));
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-red-500/30 bg-red-950/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold uppercase tracking-widest">
            Módulo Operativo
          </span>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-transparent bg-clip-text gold-gradient mt-2">
            Control de Daños & Mermas
          </h1>
          <p className="text-sm text-white/60 font-label mt-1">
            Registro de pérdidas, frascos dañados y derrames de insumos valorizados
          </p>
        </div>

        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-500/20 border border-red-500/40">
          <span className="material-symbols-outlined text-red-400 text-[28px]">shield_heart</span>
          <div>
            <span className="text-2xl font-headline font-bold text-red-400">
              ${totalPerdida.toLocaleString('es-CO')}
            </span>
            <span className="text-xs text-white/60 block uppercase font-label">Pérdida Acumulada</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulario (5 Cols) */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 sm:p-8 border border-primary/20 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">report_problem</span>
            </div>
            <div>
              <h2 className="font-headline text-xl font-bold text-white">Reportar Incidente</h2>
              <p className="text-xs text-white/50 font-label">Registrar merma o daño en inventario</p>
            </div>
          </div>

          <form onSubmit={handleAddDano} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                Tipo de Daño / Merma *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full min-h-[56px] bg-[#0a0a0f] border border-primary/30 rounded-2xl py-4 px-5 text-base text-white focus:border-primary focus:outline-none transition-all"
              >
                <option value="Frasco Roto">Frasco Roto / Fisurado</option>
                <option value="Derrame Esencia">Derrame de Esencia / Alcohol</option>
                <option value="Valvula Defectuosa">Válvula / Atomizador Defectuoso</option>
                <option value="Empaque Dañado">Empaque o Caja Dañada</option>
                <option value="Muestra Regalada">Muestra Promocional / Tester</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                Descripción del Suceso *
              </label>
              <input
                type="text"
                placeholder="Ej: Caída durante el embotellado de Sauvage..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-base text-white placeholder:text-white/30 focus:border-primary focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-lg font-bold text-white focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                  Costo Est. ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={costoEstimado}
                  onChange={(e) => setCostoEstimado(Number(e.target.value))}
                  className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-lg font-bold text-white focus:border-primary focus:outline-none transition-all"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              className="w-full min-h-[64px] py-4 px-6 rounded-2xl bg-red-600 text-white font-label font-extrabold text-base uppercase tracking-wider shadow-[0_0_25px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-3 mt-2"
            >
              <span className="material-symbols-outlined text-[26px]">warning</span>
              Registrar Daño
            </motion.button>
          </form>
        </div>

        {/* Lista de Daños (7 Cols) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8 border border-primary/20 flex flex-col gap-6">
          <div>
            <h2 className="font-headline text-xl font-bold text-white">Historial de Mermas</h2>
            <p className="text-xs text-white/50 font-label">Registro acumulado de pérdidas operativas</p>
          </div>

          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            <AnimatePresence>
              {danos.length === 0 ? (
                <div className="text-center py-12 text-white/40 text-sm font-label">
                  No hay mermas registradas. ¡Inventario 100% intacto!
                </div>
              ) : (
                danos.map((d) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4 hover:border-red-500/40 transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[24px]">broken_image</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base text-white truncate">{d.descripcion}</h4>
                        <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-300 font-mono">
                            {d.tipo}
                          </span>
                          <span>• {d.cantidad} und • {d.fecha}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-headline text-lg font-extrabold text-red-400">
                        -${(d.costoEstimado * d.cantidad).toLocaleString('es-CO')}
                      </span>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/40 transition-all flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
