'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export interface Transaccion {
  id: string;
  tipo: 'ingreso' | 'egreso';
  monto: number;
  categoria: string;
  concepto: string;
  fecha: string;
}

const CATEGORIAS_INGRESO = [
  'Venta Perfumes POS',
  'Sueldo / Honorarios',
  'Inversión / Retorno',
  'Ventas Mayoristas',
  'Otros Ingresos',
];

const CATEGORIAS_EGRESO = [
  'Insumos Fragancias (Esencias/Envases)',
  'Arriendo / Local',
  'Alimentación',
  'Transporte / Envíos',
  'Servicios Públicos',
  'Marketing / Publicidad',
  'Varios Personales',
];

const INITIAL_TRANSACCIONES: Transaccion[] = [
  {
    id: 'tx_1',
    tipo: 'ingreso',
    monto: 350000,
    categoria: 'Venta Perfumes POS',
    concepto: 'Combo 2x100ml Oud Imperial + Sauvage',
    fecha: new Date().toISOString().split('T')[0],
  },
  {
    id: 'tx_2',
    tipo: 'egreso',
    monto: 120000,
    categoria: 'Insumos Fragancias (Esencias/Envases)',
    concepto: 'Reabastecimiento envases bala 30ml x50',
    fecha: new Date().toISOString().split('T')[0],
  },
];

export default function DashboardPage() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('touche_cfo_txs');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return INITIAL_TRANSACCIONES;
        }
      }
    }
    return INITIAL_TRANSACCIONES;
  });

  // Form states
  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const [monto, setMonto] = useState<string>('');
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_INGRESO[0]);
  const [concepto, setConcepto] = useState<string>('');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'ingreso' | 'egreso'>('todos');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('touche_cfo_txs', JSON.stringify(transacciones));
    }
  }, [transacciones]);

  // Cambiar lista de categorías al cambiar tipo
  useEffect(() => {
    if (tipo === 'ingreso') {
      setCategoria(CATEGORIAS_INGRESO[0]);
    } else {
      setCategoria(CATEGORIAS_EGRESO[0]);
    }
  }, [tipo]);

  // Totales
  const totalIngresos = transacciones
    .filter((t) => t.tipo === 'ingreso')
    .reduce((acc, t) => acc + t.monto, 0);

  const totalEgresos = transacciones
    .filter((t) => t.tipo === 'egreso')
    .reduce((acc, t) => acc + t.monto, 0);

  const balanceNeto = totalIngresos - totalEgresos;

  const handleAddTransaccion = (e: React.FormEvent) => {
    e.preventDefault();
    const numMonto = Number(monto);
    if (!monto || isNaN(numMonto) || numMonto <= 0) {
      alert('Ingresa un monto válido.');
      return;
    }
    if (!concepto.trim()) {
      alert('Ingresa una descripción o concepto.');
      return;
    }

    const newTx: Transaccion = {
      id: `tx_${Date.now()}`,
      tipo,
      monto: numMonto,
      categoria,
      concepto,
      fecha,
    };

    setTransacciones([newTx, ...transacciones]);
    setMonto('');
    setConcepto('');
  };

  const handleDelete = (id: string) => {
    setTransacciones(transacciones.filter((t) => t.id !== id));
  };

  const filteredTx = transacciones.filter(
    (t) => filtroTipo === 'todos' || t.tipo === filtroTipo
  );

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-widest">
            Visión Consolidada
          </span>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-transparent bg-clip-text gold-gradient mt-2">
            Dashboard Híbrido CFO
          </h1>
          <p className="text-sm text-white/60 font-label mt-1">
            Gestor Integral de Ingresos, Egresos Personales y Operación Touche Essencielle
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Link
            href="/erp"
            className="flex-1 md:flex-none min-h-[56px] px-6 py-3 rounded-2xl bg-primary text-white font-label font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(126,34,206,0.4)] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[24px]">point_of_sale</span>
            Ir al POS / Insumos
          </Link>
        </div>
      </div>

      {/* KPI Cards (High Contrast & Big Typography) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-label uppercase tracking-widest text-emerald-400 font-bold">
              Ingresos Totales
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">trending_up</span>
            </div>
          </div>
          <p className="font-headline text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-4">
            ${totalIngresos.toLocaleString('es-CO')}
          </p>
          <span className="text-[11px] text-emerald-400/60 mt-1 font-label">Flujo de caja positivo</span>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-red-500/30 bg-red-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-label uppercase tracking-widest text-red-400 font-bold">
              Egresos Totales
            </span>
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">trending_down</span>
            </div>
          </div>
          <p className="font-headline text-3xl sm:text-4xl font-extrabold text-red-400 mt-4">
            ${totalEgresos.toLocaleString('es-CO')}
          </p>
          <span className="text-[11px] text-red-400/60 mt-1 font-label">Gastos & Compras registradas</span>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-primary/40 bg-primary/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-label uppercase tracking-widest text-primary font-bold">
              Balance Neto
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            </div>
          </div>
          <p className={`font-headline text-3xl sm:text-4xl font-extrabold mt-4 ${balanceNeto >= 0 ? 'text-white' : 'text-red-400'}`}>
            ${balanceNeto.toLocaleString('es-CO')}
          </p>
          <span className="text-[11px] text-white/50 mt-1 font-label">Saldo Disponible</span>
        </div>
      </div>

      {/* Main Grid: Formulario Gestor Finanzas + Historial Movimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Gestor Formulario (5 Cols) */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 sm:p-8 border border-primary/20 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">add_card</span>
            </div>
            <div>
              <h2 className="font-headline text-xl font-bold text-white">Registrar Movimiento</h2>
              <p className="text-xs text-white/50 font-label">Ingresos y Gastos Personales / Negocio</p>
            </div>
          </div>

          <form onSubmit={handleAddTransaccion} className="flex flex-col gap-5">
            {/* Tipo Selector Buttons (Ingreso vs Egreso) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo('ingreso')}
                className={`min-h-[56px] py-3.5 px-4 rounded-2xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                  tipo === 'ingreso'
                    ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">arrow_downward</span>
                Ingreso
              </button>

              <button
                type="button"
                onClick={() => setTipo('egreso')}
                className={`min-h-[56px] py-3.5 px-4 rounded-2xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                  tipo === 'egreso'
                    ? 'bg-red-500 text-white border-red-400 font-extrabold shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">arrow_upward</span>
                Egreso
              </button>
            </div>

            {/* Monto */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                Monto ($ COP) *
              </label>
              <input
                type="number"
                placeholder="Ej: 150000"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-xl font-bold text-white placeholder:text-white/30 focus:border-primary focus:outline-none transition-all"
              />
            </div>

            {/* Categoría */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                Categoría *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full min-h-[56px] bg-[#0a0a0f] border border-primary/30 rounded-2xl py-4 px-5 text-base text-white focus:border-primary focus:outline-none transition-all"
              >
                {(tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO).map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0a0a0f] py-2">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Concepto */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                Concepto / Descripción *
              </label>
              <input
                type="text"
                placeholder="Ej: Pago de insumos de frascos..."
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-base text-white placeholder:text-white/30 focus:border-primary focus:outline-none transition-all"
              />
            </div>

            {/* Fecha */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full min-h-[56px] bg-[#0a0a0f] border border-primary/30 rounded-2xl py-4 px-5 text-base text-white focus:border-primary focus:outline-none transition-all"
              />
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              className="w-full min-h-[64px] py-4 px-6 rounded-2xl bg-primary text-white font-label font-extrabold text-base uppercase tracking-wider shadow-[0_0_25px_rgba(126,34,206,0.4)] transition-all flex items-center justify-center gap-3 mt-2"
            >
              <span className="material-symbols-outlined text-[26px]">save</span>
              Guardar Movimiento
            </motion.button>
          </form>
        </div>

        {/* Historial de Movimientos (7 Cols) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8 border border-primary/20 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-headline text-xl font-bold text-white">Historial de Finanzas</h2>
              <p className="text-xs text-white/50 font-label">Movimientos Registrados en el Sistema</p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
              {(['todos', 'ingreso', 'egreso'] as const).map((ft) => (
                <button
                  key={ft}
                  onClick={() => setFiltroTipo(ft)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    filtroTipo === ft
                      ? 'bg-primary text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            <AnimatePresence>
              {filteredTx.length === 0 ? (
                <div className="text-center py-12 text-white/40 text-sm font-label">
                  No hay movimientos registrados en esta categoría.
                </div>
              ) : (
                filteredTx.map((tx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4 hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${
                          tx.tipo === 'ingreso'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[24px]">
                          {tx.tipo === 'ingreso' ? 'arrow_downward' : 'arrow_upward'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base text-white truncate">{tx.concepto}</h4>
                        <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-primary font-mono">
                            {tx.categoria}
                          </span>
                          <span>• {tx.fecha}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`font-headline text-lg font-extrabold ${
                          tx.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {tx.tipo === 'ingreso' ? '+' : '-'}${tx.monto.toLocaleString('es-CO')}
                      </span>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/40 transition-all flex items-center justify-center"
                        title="Eliminar registro"
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
