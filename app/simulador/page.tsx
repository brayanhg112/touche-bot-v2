'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function SimuladorPage() {
  const [tamano, setTamano] = useState<'30ml' | '50ml' | '100ml'>('50ml');
  const [costoEsencia, setCostoEsencia] = useState<number>(18000);
  const [costoAlcohol, setCostoAlcohol] = useState<number>(3000);
  const [costoEnvase, setCostoEnvase] = useState<number>(8000);
  const [costoFeromonas, setCostoFeromonas] = useState<number>(2500);
  const [precioVenta, setPrecioVenta] = useState<number>(85000);
  const [volumenProyectado, setVolumenProyectado] = useState<number>(30);

  const costoTotalFrasco = costoEsencia + costoAlcohol + costoEnvase + costoFeromonas;
  const gananciaNetaUnidad = Math.max(0, precioVenta - costoTotalFrasco);
  const margenPorcentaje = precioVenta > 0 ? ((gananciaNetaUnidad / precioVenta) * 100).toFixed(1) : '0';
  const utilidadMensualProyectada = gananciaNetaUnidad * volumenProyectado;

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-widest">
            Simulador Financiero
          </span>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-transparent bg-clip-text gold-gradient mt-2">
            Simulador Premium de Márgenes
          </h1>
          <p className="text-sm text-white/60 font-label mt-1">
            Calculadora táctica de costo de producción por frasco vs. utilidad proyectada
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Controls (7 Cols) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8 border border-primary/20 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">science</span>
            </div>
            <div>
              <h2 className="font-headline text-xl font-bold text-white">Parámetros de Costeo</h2>
              <p className="text-xs text-white/50 font-label">Ajusta los insumos para obtener el margen unitario</p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {/* Tamaño Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                Tamaño del Frasco
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['30ml', '50ml', '100ml'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTamano(t)}
                    className={`min-h-[56px] rounded-2xl border font-bold text-base transition-all active:scale-95 ${
                      tamano === t
                        ? 'bg-primary text-white border-primary shadow-[0_0_20px_rgba(126,34,206,0.4)]'
                        : 'bg-white/5 text-white/70 border-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs de Insumos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                  Esencia ($ COP)
                </label>
                <input
                  type="number"
                  value={costoEsencia}
                  onChange={(e) => setCostoEsencia(Number(e.target.value))}
                  className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-lg font-bold text-white focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                  Alcohol & Solución ($)
                </label>
                <input
                  type="number"
                  value={costoAlcohol}
                  onChange={(e) => setCostoAlcohol(Number(e.target.value))}
                  className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-lg font-bold text-white focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                  Envase / Frasco ($)
                </label>
                <input
                  type="number"
                  value={costoEnvase}
                  onChange={(e) => setCostoEnvase(Number(e.target.value))}
                  className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-lg font-bold text-white focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                  Feromonas & Aditivos ($)
                </label>
                <input
                  type="number"
                  value={costoFeromonas}
                  onChange={(e) => setCostoFeromonas(Number(e.target.value))}
                  className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-lg font-bold text-white focus:border-primary focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Precio Venta & Volumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-widest text-emerald-400 font-bold">
                  Precio de Venta al Público ($)
                </label>
                <input
                  type="number"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(Number(e.target.value))}
                  className="w-full min-h-[56px] bg-emerald-950/20 border border-emerald-500/40 rounded-2xl py-4 px-5 text-xl font-extrabold text-emerald-400 focus:border-emerald-400 focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                  Frascos Estimados / Mes
                </label>
                <input
                  type="number"
                  value={volumenProyectado}
                  onChange={(e) => setVolumenProyectado(Number(e.target.value))}
                  className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-lg font-bold text-white focus:border-primary focus:outline-none transition-all"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Results Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-primary/30 bg-primary/10 flex flex-col justify-between">
            <span className="text-xs font-label uppercase tracking-widest text-primary font-bold">
              Costo Total de Producción
            </span>
            <p className="font-headline text-3xl sm:text-4xl font-extrabold text-white mt-3">
              ${costoTotalFrasco.toLocaleString('es-CO')}
            </p>
            <span className="text-xs text-white/50 mt-1 font-label">Por frasco de {tamano}</span>
          </div>

          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/30 bg-emerald-950/20 flex flex-col justify-between">
            <span className="text-xs font-label uppercase tracking-widest text-emerald-400 font-bold">
              Ganancia Neta por Unidad
            </span>
            <p className="font-headline text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-3">
              ${gananciaNetaUnidad.toLocaleString('es-CO')}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono">
                {margenPorcentaje}% Margen Bruto
              </span>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-primary/40 bg-gradient-to-br from-primary/20 to-purple-950/30 flex flex-col justify-between">
            <span className="text-xs font-label uppercase tracking-widest text-primary-light font-bold">
              Proyección Mensual ({volumenProyectado} frascos)
            </span>
            <p className="font-headline text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text gold-gradient mt-3">
              ${utilidadMensualProyectada.toLocaleString('es-CO')}
            </p>
            <span className="text-xs text-white/60 mt-2 font-label">
              Utilidad bruta proyectada a fin de mes
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
