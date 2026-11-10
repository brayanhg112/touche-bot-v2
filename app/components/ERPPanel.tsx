'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { catalog } from '../lib/catalog';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tamano = '30ml' | '50ml' | '100ml' | 'recarga';

export interface InsumoItem {
  id: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  rowIndex: number;
  cell: string;
}

type Toast = { type: 'success' | 'error'; msg: string } | null;

// ─── Toast Bar Component ──────────────────────────────────────────────────────
function ToastBar({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl border text-base font-bold backdrop-blur-xl flex items-center gap-3 max-w-md w-[calc(100%-2rem)] ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
              : 'bg-red-950/90 border-red-500/50 text-red-300'
          }`}
        >
          <span className="material-symbols-outlined text-[26px]">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="flex-1">{toast.msg}</span>
          <button onClick={onDismiss} className="p-1 opacity-70 hover:opacity-100">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Section Header Component ─────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-primary text-[32px]">
          {icon}
        </span>
      </div>
      <div>
        <h2 className="font-headline text-2xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-xs font-label text-white/50 uppercase tracking-widest mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── POS Form Component (Scaled Touch UI) ─────────────────────────────────────
function POSForm({ onSuccess }: { onSuccess: () => void }) {
  const [comprador, setComprador] = useState('');
  const [perfumeId, setPerfumeId] = useState('');
  const [tamano, setTamano] = useState<Tamano>('30ml');
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const selectedPerfume = catalog.find(p => p.id === perfumeId);
  const genero = selectedPerfume?.gender ?? 'U';

  const TAMANOS: { key: Tamano; label: string; icon: string }[] = [
    { key: '30ml',    label: '30ml',    icon: 'water_drop' },
    { key: '50ml',    label: '50ml',    icon: 'local_drink' },
    { key: '100ml',   label: '100ml',   icon: 'liquor' },
    { key: 'recarga', label: 'Recarga', icon: 'autorenew' },
  ];

  const sortedCatalog = [...catalog].sort((a, b) => {
    if (a.version === '1.1' && b.version !== '1.1') return -1;
    if (a.version !== '1.1' && b.version === '1.1') return 1;
    return a.name.localeCompare(b.name);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comprador.trim() || !perfumeId) {
      setToast({ type: 'error', msg: 'Ingresa el comprador y selecciona una fragancia.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/erp/tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comprador, perfume: selectedPerfume!.name, genero, tamano, cantidad }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Error al registrar venta');
      setToast({ type: 'success', msg: `✅ Venta registrada: ${selectedPerfume!.name} → ${comprador}` });
      setComprador(''); setPerfumeId(''); setTamano('30ml'); setCantidad(1);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar';
      setToast({ type: 'error', msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastBar toast={toast} onDismiss={() => setToast(null)} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Comprador Input (Scaled min-h-[56px]) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
            👤 Comprador *
          </label>
          <input
            type="text"
            placeholder="Nombre o ID del cliente..."
            value={comprador}
            onChange={e => setComprador(e.target.value)}
            className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-lg text-white placeholder:text-white/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        {/* Perfume Selector (Scaled Dropdown) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
            🌸 Fragancia en Inventario *
          </label>
          <div className="relative">
            <select
              value={perfumeId}
              onChange={e => setPerfumeId(e.target.value)}
              className="w-full min-h-[56px] appearance-none bg-[#0a0a0f] border border-primary/30 rounded-2xl py-4 pl-5 pr-12 text-lg text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-body"
            >
              <option value="" disabled>Selecciona un perfume del catálogo...</option>
              {sortedCatalog.map(p => (
                <option key={p.id} value={p.id} className="bg-[#0a0a0f] py-3 text-base">
                  {p.version === '1.1' ? '⚡ ' : ''}{p.name} — {p.brand} ({p.gender === 'M' ? '♂ Hombre' : p.gender === 'F' ? '♀ Mujer' : '⚥ Unisex'})
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary text-[28px] pointer-events-none">
              expand_more
            </span>
          </div>
          {selectedPerfume && (
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-white/70">
              Mapeo automático a Tracker: <span className="text-primary font-bold">
                {genero === 'M' ? '♂ Columna B (Hombre)' : '♀ Columna C (Mujer/Unisex)'}
              </span>
            </div>
          )}
        </div>

        {/* Tamaño Buttons (Large Touch Targets) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
            📦 Presentación / Tamaño *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TAMANOS.map(({ key, label, icon }) => (
              <button
                type="button"
                key={key}
                onClick={() => setTamano(key)}
                className={`min-h-[64px] flex flex-col items-center justify-center gap-1.5 py-3 px-4 rounded-2xl border text-sm font-bold uppercase tracking-wider transition-all active:scale-95 ${
                  tamano === key
                    ? 'border-primary bg-primary text-white shadow-[0_0_20px_rgba(126,34,206,0.4)]'
                    : 'border-white/10 bg-white/5 text-white/70 hover:border-primary/50 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cantidad Stepper */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
            🔢 Unidades Vendidas
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setCantidad(c => Math.max(1, c - 1))}
              className="w-16 h-16 rounded-2xl border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center justify-center text-3xl font-bold active:scale-95"
            >−</button>
            <div className="flex-1 min-h-[64px] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-headline font-bold text-primary">
              {cantidad}
            </div>
            <button
              type="button"
              onClick={() => setCantidad(c => c + 1)}
              className="w-16 h-16 rounded-2xl border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center justify-center text-3xl font-bold active:scale-95"
            >+</button>
          </div>
        </div>

        {/* Submit Button (Scaled Action Target) */}
        <motion.button
          type="submit"
          disabled={loading || !perfumeId || !comprador}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: 0.97 }}
          className="w-full min-h-[64px] py-4 px-6 rounded-2xl bg-primary text-white font-label font-extrabold text-lg uppercase tracking-[0.15em] shadow-[0_0_30px_rgba(126,34,206,0.5)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 mt-4"
        >
          {loading ? (
            <>
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              Procesando Venta…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[28px]">point_of_sale</span>
              Registrar Venta en POS
            </>
          )}
        </motion.button>
      </form>
    </>
  );
}

// ─── Dynamic Insumos CRUD Panel ───────────────────────────────────────────────
function DynamicInsumosPanel() {
  const [insumos, setInsumos] = useState<InsumoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InsumoItem | null>(null);

  // Form Fields
  const [formNombre, setFormNombre] = useState('');
  const [formUnidad, setFormUnidad] = useState('ml');
  const [formCantidad, setFormCantidad] = useState(100);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInsumos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/erp/insumos', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.insumos)) {
        setInsumos(data.insumos);
      } else {
        throw new Error(data.error || 'Error al obtener insumos');
      }
    } catch (err) {
      setToast({ type: 'error', msg: 'No se pudieron cargar los insumos de Sheets.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsumos();
  }, [fetchInsumos]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormNombre('');
    setFormUnidad('ml');
    setFormCantidad(100);
    setModalOpen(true);
  };

  const openEditModal = (item: InsumoItem) => {
    setEditingItem(item);
    setFormNombre(item.nombre);
    setFormUnidad(item.unidad);
    setFormCantidad(item.cantidad);
    setModalOpen(true);
  };

  const handleSaveInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      setToast({ type: 'error', msg: 'El nombre del insumo es obligatorio.' });
      return;
    }

    setActionLoading(true);
    try {
      if (editingItem) {
        // Editar
        const res = await fetch('/api/erp/insumos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rowIndex: editingItem.rowIndex,
            nombre: formNombre,
            unidad: formUnidad,
            cantidad: formCantidad,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setToast({ type: 'success', msg: `✅ Insumo "${formNombre}" actualizado.` });
      } else {
        // Crear
        const res = await fetch('/api/erp/insumos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: formNombre,
            unidad: formUnidad,
            cantidad: formCantidad,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setToast({ type: 'success', msg: `✅ Insumo "${formNombre}" creado en Sheets.` });
      }
      setModalOpen(false);
      fetchInsumos();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error guardando insumo';
      setToast({ type: 'error', msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInsumo = async (item: InsumoItem) => {
    if (!confirm(`¿Seguro que deseas eliminar "${item.nombre}"?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/erp/insumos?rowIndex=${item.rowIndex}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setToast({ type: 'success', msg: `🗑️ Insumo "${item.nombre}" eliminado.` });
      fetchInsumos();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar';
      setToast({ type: 'error', msg });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <ToastBar toast={toast} onDismiss={() => setToast(null)} />

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Catálogo Dinámico de Insumos</h3>
          <p className="text-xs text-white/50">Escaneado desde hoja "TOUCHE ESSENCIELLE"</p>
        </div>
        <button
          onClick={openAddModal}
          className="min-h-[56px] px-6 py-3 rounded-2xl bg-primary text-white font-label font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(126,34,206,0.4)] active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[24px]">add_circle</span>
          Añadir Insumo
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-3 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-t-3 border-primary animate-spin" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insumos.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-white/5 border border-primary/20 flex items-center justify-between gap-4 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-[26px]">science</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-base text-white truncate">{item.nombre}</h4>
                  <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-primary font-mono">
                      Fila {item.rowIndex}
                    </span>
                    <span>• {item.unidad}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-2xl font-headline font-extrabold text-primary">
                    {item.cantidad}
                  </span>
                  <span className="text-xs text-white/50 block uppercase font-label">
                    {item.unidad}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="w-10 h-10 rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-primary/30 transition-all flex items-center justify-center"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteInsumo(item)}
                    className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CRUD Modal for Add/Edit */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-lg bg-[#0e0e14] border border-primary/30 rounded-3xl p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {editingItem ? 'Editar Insumo' : 'Añadir Nuevo Insumo'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveInsumo} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                    Nombre del Insumo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Esencia Oud Imperial, Frasco 50ml..."
                    value={formNombre}
                    onChange={e => setFormNombre(e.target.value)}
                    className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-lg text-white placeholder:text-white/30 focus:border-primary focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                      Unidad / Medida *
                    </label>
                    <select
                      value={formUnidad}
                      onChange={e => setFormUnidad(e.target.value)}
                      className="w-full min-h-[56px] bg-[#0a0a0f] border border-primary/30 rounded-2xl py-4 px-5 text-base text-white focus:border-primary focus:outline-none transition-all"
                    >
                      <option value="ml">Mililitros (ml)</option>
                      <option value="und">Unidades (und)</option>
                      <option value="g">Gramos (g)</option>
                      <option value="litros">Litros</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                      Cantidad Inicial *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formCantidad}
                      onChange={e => setFormCantidad(Number(e.target.value))}
                      className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-lg text-white focus:border-primary focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 min-h-[56px] py-4 rounded-2xl border border-white/10 text-white/70 hover:text-white font-bold uppercase text-xs tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 min-h-[56px] py-4 rounded-2xl bg-primary text-white font-bold uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(126,34,206,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Guardar en Sheets'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main ERP Panel Container ────────────────────────────────────────────────
type Tab = 'pos' | 'insumos';

export default function ERPPanel() {
  const [tab, setTab] = useState<Tab>('pos');
  const [salesCount, setSalesCount] = useState(0);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'pos',     label: 'Punto de Venta (POS)', icon: 'point_of_sale' },
    { key: 'insumos', label: 'Insumos Dinámicos',     icon: 'science' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner Stats */}
      <div className="glass-card rounded-3xl p-6 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-transparent bg-clip-text gold-gradient">
            Agente Operativo & POS
          </h1>
          <p className="text-xs text-white/50 font-label uppercase tracking-widest mt-1">
            Gestión de Ventas y Control de Insumos en Tiempo Real
          </p>
        </div>

        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-primary/20 border border-primary/40">
          <span className="material-symbols-outlined text-primary text-[28px]">sell</span>
          <div>
            <span className="text-2xl font-headline font-bold text-white">{salesCount}</span>
            <span className="text-xs text-white/60 block uppercase font-label">Ventas Registradas</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 p-1.5 bg-white/5 rounded-2xl border border-white/10">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 min-h-[56px] flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-label font-bold uppercase tracking-wider transition-all active:scale-[0.98] ${
              tab === key
                ? 'bg-primary text-white shadow-[0_0_20px_rgba(126,34,206,0.4)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-primary/20">
            {tab === 'pos' && (
              <>
                <SectionHeader
                  icon="point_of_sale"
                  title="Registrar Venta POS"
                  subtitle="Mapeo Automático A–H · TRACKER DIARIO COMPLETO"
                />
                <POSForm onSuccess={() => setSalesCount(c => c + 1)} />
              </>
            )}
            {tab === 'insumos' && (
              <>
                <SectionHeader
                  icon="science"
                  title="Control Dinámico de Insumos"
                  subtitle="Escaneo y Edición Directa · TOUCHE ESSENCIELLE (Cols A–C)"
                />
                <DynamicInsumosPanel />
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
