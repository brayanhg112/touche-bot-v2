'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { PerfumeStockItem } from '../lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StockResponse {
  total: number;
  stock: Record<string, PerfumeStockItem>;
  outOfStock: string[];
  fullInventory: Record<string, PerfumeStockItem>;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type ImportStatus = 'idle' | 'importing' | 'success' | 'error';
interface ImportResult {
  message: string;
  imported?: number;
  total?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const VERSIONS = ['ESTANDAR', '1.1', 'LIMITED', 'EXCLUSIVO'] as const;

// ─── Admin Panel ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [inventory, setInventory] = useState<Record<string, PerfumeStockItem>>({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [newVersion, setNewVersion] = useState<string>('ESTANDAR');
  const [addError, setAddError] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerfume, setSelectedPerfume] = useState<PerfumeStockItem | null>(null);

  const OPTIONS = useMemo(() => ({
    version: ["ESTANDAR", "1.1"],
    gender: ["HOMBRE", "MUJER", "UNISEX"],
    olfactory_family: ["FLORALES", "ORIENTALES/ESPECIADAS", "DULCES", "AROMATICO", "FRUTALES", "FRESCO", "ATALCADO", "ACUATICAS"],
    occasion: ["OFICINA", "USO DIARIO", "CITA ROMATICA", "EVENTO FORMAL", "DEPORTE"],
    intensity: ["ALTA", "MEDIA", "BAJA"],
    status: ["ACTIVO", "INACTIVO"]
  }), []);

  // ── Fetch inventory desde Supabase (vía API) ─────────────────────────────────
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      // Usamos la API de inventario que mapea con Supabase
      const res = await fetch('/api/admin/inventory', { cache: 'no-store' });
      const data = await res.json();

      // Transformamos los datos que vienen de Supabase al formato visual del Admin
      const formattedInventory: Record<string, PerfumeStockItem> = {};
      if (data.inventory && Array.isArray(data.inventory)) {
        data.inventory.forEach((item: any) => {
          const key = item.nombre_perfume;
          formattedInventory[key] = {
            id: key,
            name: key,
            version: item.tipo || 'ESTANDAR',
            active: item.estado ?? true,
            gender: item.genero,
            olfactory_family: item.familia_olfativa,
            occasion: item.ocasion,
            intensity: item.intensidad
          };
        });
      }
      setInventory(formattedInventory);
    } catch {
      console.error('Error cargando inventario desde Supabase');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  // ── Persist inventory en Supabase ──────────────────────────────────────────
  const persistItem = useCallback(async (item: PerfumeStockItem) => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_perfume: item.id || item.name,
          estado: item.active,
          tipo: item.version || 'ESTANDAR',
          familia_olfativa: item.olfactory_family || '',
          ocasion: item.occasion || '',
          intensidad: item.intensity || '',
          genero: item.genero || 'UNISEX'
        }),
      });
      if (!res.ok) throw new Error('Server error');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, []);

  // ── Toggle active state ────────────────────────────────────────────────────
  const toggleActive = useCallback((key: string) => {
    setInventory(prev => {
      const currentItem = prev[key];
      if (!currentItem) return prev;

      const updatedItem = { ...currentItem, active: !currentItem.active };
      const updated = { ...prev, [key]: updatedItem };

      persistItem(updatedItem);
      return updated;
    });
  }, [persistItem]);

  // ── Edit Handle ────────────────────────────────────────────────────────────
  const handleEditClick = useCallback((item: PerfumeStockItem) => {
    setSelectedPerfume({ ...item });
    setIsModalOpen(true);
  }, []);

  const handleEditChange = useCallback((field: keyof PerfumeStockItem | 'status', value: string) => {
    if (!selectedPerfume) return;
    if (field === 'status') {
      setSelectedPerfume(prev => prev ? { ...prev, active: value === 'ACTIVO' } : null);
    } else {
      setSelectedPerfume(prev => prev ? { ...prev, [field]: value } : null);
    }
  }, [selectedPerfume]);

  const updateInventoryItem = useCallback(() => {
    if (!selectedPerfume) return;
    setInventory(prev => {
      const updated = {
        ...prev,
        [selectedPerfume.id]: selectedPerfume,
      };
      persistItem(selectedPerfume);
      return updated;
    });
    setIsModalOpen(false);
    setSelectedPerfume(null);
  }, [selectedPerfume, persistItem]);

  // ── Add new perfume ────────────────────────────────────────────────────────
  const handleAdd = useCallback(() => {
    const name = newName.trim().toLowerCase();
    if (!name) { setAddError('El nombre no puede estar vacío.'); return; }
    if (inventory[name]) { setAddError(`"${name}" ya existe en el inventario.`); return; }

    const newItem: PerfumeStockItem = {
      id: name,
      name,
      version: newVersion,
      active: true,
      gender: 'UNISEX',
      olfactory_family: 'FRESCO',
      occasion: 'USO DIARIO',
      intensity: 'MEDIA'
    };

    const updated = { ...inventory, [name]: newItem };
    setInventory(updated);
    persistItem(newItem);
    setNewName('');
    setAddError('');
  }, [newName, newVersion, inventory, persistItem]);

  // ── Import from CSV ────────────────────────────────────────────────────────
  const handleImportCSV = useCallback(async () => {
    setImportStatus('importing');
    setImportResult(null);
    try {
      const res = await fetch('/api/import', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || data.error) {
        setImportStatus('error');
        setImportResult({ message: data.error || 'Error al importar' });
        setTimeout(() => { setImportStatus('idle'); setImportResult(null); }, 5000);
        return;
      }
      setImportStatus('success');
      setImportResult({ message: data.message, imported: data.imported, total: data.total });
      await fetchInventory();
      setTimeout(() => { setImportStatus('idle'); setImportResult(null); }, 6000);
    } catch {
      setImportStatus('error');
      setImportResult({ message: 'Error de conexión al importar CSV.' });
      setTimeout(() => { setImportStatus('idle'); setImportResult(null); }, 5000);
    }
  }, [fetchInventory]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return Object.entries(inventory).filter(([key, item]) => {
      const matchesQuery = key.toLowerCase().includes(query.toLowerCase()) ||
        item.name.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filterStatus === 'all' ||
        (filterStatus === 'active' && item.active) ||
        (filterStatus === 'inactive' && !item.active);
      return matchesQuery && matchesFilter;
    });
  }, [inventory, query, filterStatus]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalItems = Object.keys(inventory).length;
  const activeCount = Object.values(inventory).filter(i => i.active).length;
  const inactiveCount = totalItems - activeCount;

  // ── Save indicator ──────────────────────────────────────────────────────────
  const saveLabel: Record<SaveStatus, string> = {
    idle: '',
    saving: '⏳ Guardando...',
    saved: '✅ Guardado',
    error: '❌ Error al guardar',
  };
  const saveColor: Record<SaveStatus, string> = {
    idle: 'transparent',
    saving: '#a78bfa',
    saved: '#34d399',
    error: '#f87171',
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }

        .admin-root {
          min-height: 100vh;
          background: #0a0a0f;
          color: #e2e8f0;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          padding: 0 0 60px;
        }

        .admin-header {
          background: linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%);
          border-bottom: 1px solid rgba(167,139,250,0.15);
          padding: 24px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(12px);
        }
        .admin-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .admin-logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #a78bfa, #7c3aed);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .admin-logo-text { font-size: 1.2rem; font-weight: 700; letter-spacing: -0.02em; }
        .admin-logo-sub { font-size: 0.72rem; color: #94a3b8; letter-spacing: 0.08em; text-transform: uppercase; }

        .admin-stats {
          display: flex; gap: 12px; flex-wrap: wrap;
        }
        .stat-chip {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          display: flex; align-items: center; gap: 6px;
        }
        .stat-total  { background: rgba(167,139,250,0.15); color: #a78bfa; border: 1px solid rgba(167,139,250,0.3); }
        .stat-active { background: rgba(52,211,153,0.1);  color: #34d399;  border: 1px solid rgba(52,211,153,0.25); }
        .stat-out    { background: rgba(248,113,113,0.1); color: #f87171;  border: 1px solid rgba(248,113,113,0.25); }

        .save-indicator {
          font-size: 0.8rem; font-weight: 600;
          transition: color 0.3s;
          min-width: 130px; text-align: right;
        }

        .admin-main { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }

        .add-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(167,139,250,0.15);
          border-radius: 16px;
          padding: 24px 28px;
          margin-bottom: 28px;
        }
        .add-card-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #a78bfa;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .add-form {
          display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start;
        }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
        .form-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 10px 14px;
          color: #e2e8f0;
          font-size: 0.9rem;
          outline: none;
          min-width: 260px;
        }
        .form-input:focus {
          border-color: #a78bfa;
          box-shadow: 0 0 0 3px rgba(167,139,250,0.15);
        }
        .form-select {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 10px 14px;
          color: #e2e8f0;
          font-size: 0.9rem;
          outline: none;
          cursor: pointer;
          min-width: 140px;
        }
        .form-error { font-size: 0.78rem; color: #f87171; margin-top: 8px; }

        .btn-add {
          padding: 10px 22px;
          background: linear-gradient(135deg, #7c3aed, #a78bfa);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          align-self: flex-end;
          transition: opacity 0.15s, transform 0.1s;
          white-space: nowrap;
        }
        .btn-add:hover  { opacity: 0.9; transform: translateY(-1px); }

        .toolbar {
          display: flex; gap: 12px; align-items: center;
          margin-bottom: 20px; flex-wrap: wrap;
        }
        .search-wrap { position: relative; flex: 1; min-width: 200px; }
        .search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%);
          color: #64748b; font-size: 15px; pointer-events: none;
        }
        .search-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 10px 14px 10px 36px;
          color: #e2e8f0;
          font-size: 0.9rem;
          outline: none;
        }
        .search-input:focus {
          border-color: #a78bfa;
          box-shadow: 0 0 0 3px rgba(167,139,250,0.12);
        }

        .filter-btns { display: flex; gap: 6px; }
        .filter-btn {
          padding: 8px 14px; border-radius: 8px; border: 1px solid transparent;
          font-size: 0.78rem; font-weight: 600; cursor: pointer;
          transition: all 0.15s;
        }
        .filter-btn-all     { background: rgba(255,255,255,0.06); color: #94a3b8; border-color: rgba(255,255,255,0.08); }
        .filter-btn-active  { background: rgba(52,211,153,0.08);  color: #34d399;  border-color: rgba(52,211,153,0.2); }
        .filter-btn-inactive{ background: rgba(248,113,113,0.08); color: #f87171;  border-color: rgba(248,113,113,0.2); }
        .filter-btn.active  { opacity: 1; box-shadow: 0 0 0 2px rgba(167,139,250,0.5); }
        .filter-btn:not(.active) { opacity: 0.55; }

        .btn-sync {
          padding: 8px 18px;
          background: linear-gradient(135deg, #059669, #10b981);
          border: 1px solid rgba(16,185,129,0.3);
          border-radius: 10px;
          color: #fff;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; gap: 6px;
          white-space: nowrap;
        }
        .btn-sync:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-sync:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-sync-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .import-toast {
          position: fixed; bottom: 24px; right: 24px;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
          z-index: 2000;
          max-width: 420px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .import-toast-success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
        .import-toast-error { background: rgba(248,113,113,0.15); border: 1px solid rgba(248,113,113,0.3); color: #f87171; }

        .result-count { font-size: 0.78rem; color: #64748b; margin-left: auto; }

        .table-wrap {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          overflow: hidden;
        }
        .inv-table { width: 100%; border-collapse: collapse; }
        .inv-table thead tr {
          background: rgba(167,139,250,0.07);
          border-bottom: 1px solid rgba(167,139,250,0.15);
        }
        .inv-table th {
          padding: 12px 18px;
          text-align: left;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748b;
          font-weight: 700;
        }
        .inv-table tbody tr {
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .inv-table tbody tr:hover { background: rgba(167,139,250,0.04); }
        .inv-table td {
          padding: 13px 18px;
          font-size: 0.875rem;
          vertical-align: middle;
        }

        .td-name { color: #e2e8f0; font-weight: 500; }
        .td-version {
          font-size: 0.75rem; font-weight: 700;
          padding: 3px 8px; border-radius: 6px;
          display: inline-block;
        }
        .ver-11       { background: rgba(251,191,36,0.12); color: #fbbf24; border: 1px solid rgba(251,191,36,0.25); }
        .ver-standard { background: rgba(148,163,184,0.1); color: #94a3b8;  border: 1px solid rgba(148,163,184,0.2); }
        .ver-limited  { background: rgba(167,139,250,0.12); color: #a78bfa; border: 1px solid rgba(167,139,250,0.25); }
        .ver-other    { background: rgba(99,102,241,0.1);  color: #818cf8;  border: 1px solid rgba(99,102,241,0.2); }

        .badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 20px;
          font-size: 0.75rem; font-weight: 700;
        }
        .badge-active   { background: rgba(52,211,153,0.12); color: #34d399; border: 1px solid rgba(52,211,153,0.25); }
        .badge-inactive { background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid rgba(248,113,113,0.2); }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

        .btn-toggle {
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn-toggle-deactivate { background: rgba(248,113,113,0.06); color: #f87171; border-color: rgba(248,113,113,0.2); }
        .btn-toggle-activate   { background: rgba(52,211,153,0.06); color: #34d399; border-color: rgba(52,211,153,0.2); }

        .skeleton-cell { height: 14px; border-radius: 6px; background: rgba(255,255,255,0.06); display: inline-block; }

        .empty-state { text-align: center; padding: 60px 20px; color: #475569; }

        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex; justify-content: center; align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: #111827; 
          border: 1px solid rgba(167,139,250,0.2);
          border-radius: 16px;
          padding: 28px 32px;
          width: 90%; max-width: 500px;
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .modal-title { font-size: 1.1rem; font-weight: 700; color: #e2e8f0; display: flex; align-items: center; gap: 8px; }
        .btn-close { background: none; border: none; color: #64748b; font-size: 1.2rem; cursor: pointer; }
        .modal-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
        .btn-save { padding: 10px 22px; background: linear-gradient(135deg, #7c3aed, #a78bfa); border: none; border-radius: 10px; color: #fff; font-weight: 600; cursor: pointer; }
        .btn-cancel { padding: 10px 22px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #e2e8f0; font-weight: 600; cursor: pointer; }
      `}</style>

      <div className="admin-root">
        <header className="admin-header">
          <div className="admin-logo">
            <div className="admin-logo-icon">🌹</div>
            <div>
              <div className="admin-logo-text">Touche Essencielle</div>
              <div className="admin-logo-sub">Panel de Administración</div>
            </div>
          </div>

          <div className="admin-stats">
            <span className="stat-chip stat-total">📦 {totalItems} referencias</span>
            <span className="stat-chip stat-active">✓ {activeCount} disponibles</span>
            <span className="stat-chip stat-out">✗ {inactiveCount} agotados</span>
          </div>

          <div className="save-indicator" style={{ color: saveColor[saveStatus] }}>
            {saveLabel[saveStatus]}
          </div>
        </header>

        <main className="admin-main">
          <div className="add-card">
            <div className="add-card-title">✦ Agregar nueva referencia</div>
            <div className="add-form">
              <div className="form-group">
                <label className="form-label" htmlFor="new-name">Nombre del perfume</label>
                <input
                  id="new-name"
                  className="form-input"
                  type="text"
                  placeholder="ej. sauvage---dior"
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setAddError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-version">Versión</label>
                <select
                  id="new-version"
                  className="form-select"
                  value={newVersion}
                  onChange={e => setNewVersion(e.target.value)}
                >
                  {VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <button className="btn-add" onClick={handleAdd} id="btn-add-perfume">
                + Agregar
              </button>
            </div>
            {addError && <p className="form-error">⚠ {addError}</p>}
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                id="search-input"
                className="search-input"
                type="text"
                placeholder="Buscar perfume..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>

            <div className="filter-btns">
              {(['all', 'active', 'inactive'] as const).map(f => (
                <button
                  key={f}
                  className={`filter-btn filter-btn-${f === 'all' ? 'all' : f === 'active' ? 'active' : 'inactive'} ${filterStatus === f ? 'active' : ''}`}
                  onClick={() => setFilterStatus(f)}
                  id={`filter-${f}`}
                >
                  {f === 'all' ? 'Todos' : f === 'active' ? 'Disponibles' : 'Agotados'}
                </button>
              ))}
            </div>

            <button
              id="btn-sync-csv"
              className="btn-sync"
              onClick={handleImportCSV}
              disabled={importStatus === 'importing'}
            >
              {importStatus === 'importing' ? <><span className="btn-sync-spinner" /> Importando...</> : <>📥 Sync CSV</>}
            </button>

            <span className="result-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Versión</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td><span className="skeleton-cell" style={{ width: 24 }} /></td>
                      <td><span className="skeleton-cell" style={{ width: 180 }} /></td>
                      <td><span className="skeleton-cell" style={{ width: 70 }} /></td>
                      <td><span className="skeleton-cell" style={{ width: 90 }} /></td>
                      <td><span className="skeleton-cell" style={{ width: 80 }} /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🌸</div>
                        <div>{query ? `Sin resultados para "${query}"` : 'El inventario está vacío'}</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(([key, item], idx) => {
                    const verClass = item.version === '1.1' ? 'ver-11' : 'ver-standard';
                    return (
                      <tr key={key}>
                        <td style={{ color: '#475569', fontSize: '0.75rem' }}>{idx + 1}</td>
                        <td className="td-name">{item.name || key}</td>
                        <td><span className={`td-version ${verClass}`}>{item.version}</span></td>
                        <td>
                          <span className={`badge ${item.active ? 'badge-active' : 'badge-inactive'}`}>
                            <span className="badge-dot" />
                            {item.active ? 'Disponible' : 'Agotado'}
                          </span>
                        </td>
                        <td style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn-toggle"
                            onClick={() => handleEditClick(item)}
                            style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.25)' }}
                          >
                            ✎
                          </button>
                          <button
                            className={`btn-toggle ${item.active ? 'btn-toggle-deactivate' : 'btn-toggle-activate'}`}
                            onClick={() => toggleActive(key)}
                          >
                            {item.active ? 'Agotar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>

        {isModalOpen && selectedPerfume && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title"><span style={{ color: '#a78bfa' }}>✎</span> Editar Referencia</div>
                <button className="btn-close" onClick={() => setIsModalOpen(false)}>✖</button>
              </div>
              <div className="modal-form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nombre del perfume</label>
                  <input className="form-input" type="text" value={selectedPerfume.name} disabled style={{ opacity: 0.6, width: '100%' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Versión</label>
                  <select className="form-select" value={selectedPerfume.version} onChange={e => handleEditChange('version', e.target.value)}>
                    {OPTIONS.version.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Género</label>
                  <select className="form-select" value={selectedPerfume.gender || ''} onChange={e => handleEditChange('gender', e.target.value)}>
                    <option value="" disabled>Selecciona...</option>
                    {OPTIONS.gender.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Familia Olfativa</label>
                  <select className="form-select" value={selectedPerfume.olfactory_family || ''} onChange={e => handleEditChange('olfactory_family', e.target.value)}>
                    <option value="" disabled>Selecciona...</option>
                    {OPTIONS.olfactory_family.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ocasión</label>
                  <select className="form-select" value={selectedPerfume.occasion || ''} onChange={e => handleEditChange('occasion', e.target.value)}>
                    <option value="" disabled>Selecciona...</option>
                    {OPTIONS.occasion.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Intensidad</label>
                  <select className="form-select" value={selectedPerfume.intensity || ''} onChange={e => handleEditChange('intensity', e.target.value)}>
                    <option value="" disabled>Selecciona...</option>
                    {OPTIONS.intensity.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select className="form-select" value={selectedPerfume.active ? 'ACTIVO' : 'INACTIVO'} onChange={e => handleEditChange('status', e.target.value)}>
                    {OPTIONS.status.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button className="btn-save" onClick={updateInventoryItem}>Guardar Cambios</button>
              </div>
            </div>
          </div>
        )}

        {importResult && (
          <div className={`import-toast ${importStatus === 'success' ? 'import-toast-success' : 'import-toast-error'}`}>
            {importStatus === 'success' ? '✅' : '❌'} {importResult.message}
          </div>
        )}
      </div>
    </>
  );
}