'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const SCRIPTS_VENTA = [
  {
    id: 's_1',
    titulo: 'Cierre Táctico 2x1',
    script: '¡Hola [Nombre]! 👋 En Touche Essencielle activamos la promoción exclusiva de temporada: Llevas tu fragancia insignia de 100ml y te regalamos la versión pocket de 30ml + envío gratis. ¿Te separo el envío hoy mismo?',
    tipo: 'Promocional',
  },
  {
    id: 's_2',
    titulo: 'Objeción de Precio',
    script: 'Entiendo perfectamente tu punto. Recuerda que nuestras fragancias cuentan con un 30% de concentración de aceites esenciales franceses importados y feromonas de alta fijación (más de 12 horas en piel). ¡Es calidad nicho a una fracción del costo!',
    tipo: 'Objeciones',
  },
  {
    id: 's_3',
    titulo: 'Re-enganche Cliente Antiguo',
    script: '¡Hola de nuevo! 🌸 ¿Cómo estuvo la fijación de tu última fragancia? Queremos consentirte en tu siguiente compra con un 15% OFF VIP usando el código TOUCHE-VIP.',
    tipo: 'Fidelización',
  },
];

export default function NegociadorPage() {
  const [precioOriginal, setPrecioOriginal] = useState<number>(170000);
  const [descuentoPct, setDescuentoPct] = useState<number>(15);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const valorDescuento = (precioOriginal * descuentoPct) / 100;
  const precioFinal = precioOriginal - valorDescuento;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-widest">
            Asistente Comercial
          </span>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-transparent bg-clip-text gold-gradient mt-2">
            Negociador C1 & Scripts de Venta
          </h1>
          <p className="text-sm text-white/60 font-label mt-1">
            Calculadora de ofertas rápidas y argumentarios comerciales con conversión a WhatsApp
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Calculadora de Descuentos (5 Cols) */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 sm:p-8 border border-primary/20 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">percent</span>
            </div>
            <div>
              <h2 className="font-headline text-xl font-bold text-white">Calculadora de Combos</h2>
              <p className="text-xs text-white/50 font-label">Aplica descuentos en vivo frente al cliente</p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                Precio Combo Original ($ COP)
              </label>
              <input
                type="number"
                value={precioOriginal}
                onChange={(e) => setPrecioOriginal(Number(e.target.value))}
                className="w-full min-h-[56px] bg-white/5 border border-primary/30 rounded-2xl py-4 px-5 text-xl font-bold text-white focus:border-primary focus:outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-label uppercase tracking-widest text-primary font-bold">
                Descuento a Aplicar (%)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 25].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDescuentoPct(pct)}
                    className={`min-h-[48px] rounded-xl font-bold text-sm transition-all ${
                      descuentoPct === pct
                        ? 'bg-primary text-white border border-primary'
                        : 'bg-white/5 text-white/70 border border-white/10'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Total Results */}
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between text-xs font-label text-emerald-400 font-bold uppercase">
                <span>Descuento Otorgado:</span>
                <span>-${valorDescuento.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex items-center justify-between border-t border-emerald-500/20 pt-2">
                <span className="text-sm font-label text-white font-bold uppercase">Precio Final Cliente:</span>
                <span className="font-headline text-3xl font-extrabold text-emerald-400">
                  ${precioFinal.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scripts de Venta (7 Cols) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8 border border-primary/20 flex flex-col gap-6">
          <div>
            <h2 className="font-headline text-xl font-bold text-white">Scripts Tácticos de WhatsApp</h2>
            <p className="text-xs text-white/50 font-label">Copia con 1-Tap o envía directo a WhatsApp</p>
          </div>

          <div className="flex flex-col gap-4">
            {SCRIPTS_VENTA.map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 hover:border-primary/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-bold uppercase">
                    {s.tipo}
                  </span>
                  <h4 className="font-bold text-white text-base">{s.titulo}</h4>
                </div>

                <p className="text-sm text-white/80 font-body leading-relaxed bg-black/30 p-3.5 rounded-xl border border-white/5">
                  "{s.script}"
                </p>

                <div className="flex items-center gap-3 mt-1">
                  <button
                    onClick={() => copyToClipboard(s.script, s.id)}
                    className="flex-1 min-h-[48px] rounded-xl bg-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copiadoId === s.id ? 'check' : 'content_copy'}
                    </span>
                    {copiadoId === s.id ? '¡Copiado!' : 'Copiar Script'}
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(s.script)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-h-[48px] rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Enviar WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
