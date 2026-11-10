'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export interface NavItem {
  href: string;
  label: string;
  subtitle: string;
  icon: string;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard Híbrido',
    subtitle: 'Finanzas & KPIs Integrados',
    icon: 'dashboard',
  },
  {
    href: '/erp',
    label: 'Agente & POS',
    subtitle: 'Rastreador de Ventas e Insumos',
    icon: 'point_of_sale',
    badge: 'Core',
  },
  {
    href: '/simulador',
    label: 'Simulador Premium',
    subtitle: 'Costeo & Márgenes por Frasco',
    icon: 'science',
  },
  {
    href: '/danos',
    label: 'Control de Daños',
    subtitle: 'Registro de Mermas & Pérdidas',
    icon: 'shield_heart',
  },
  {
    href: '/metas',
    label: 'Metas Visuales',
    subtitle: 'Tracker de Objetivos & Ahorro',
    icon: 'military_tech',
  },
  {
    href: '/negociador',
    label: 'Negociador C1',
    subtitle: 'Combos & Scripts Tácticos',
    icon: 'handshake',
  },
  {
    href: '/',
    label: 'Sommelier & Catálogo',
    subtitle: 'Asistente IA de Fragancias',
    icon: 'auto_awesome',
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const currentItem = NAV_ITEMS.find((item) => item.href === pathname) || {
    label: 'Touche Essencielle',
    subtitle: 'Plataforma CFO & ERP',
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-body selection:bg-primary selection:text-white">
      {/* ── Fixed Header ── */}
      <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-primary/20 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Abrir Menú de Navegación"
              className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/25 transition-all active:scale-95 text-lg"
            >
              <span className="material-symbols-outlined text-[28px]">
                {sidebarOpen ? 'close' : 'menu'}
              </span>
            </button>
            <Link href="/dashboard" className="flex flex-col">
              <span className="font-headline text-lg sm:text-xl font-bold tracking-tight text-transparent bg-clip-text gold-gradient">
                TOUCHE ESSENCIELLE
              </span>
              <span className="text-[11px] font-label text-white/50 uppercase tracking-widest -mt-1">
                {currentItem.label}
              </span>
            </Link>
          </div>

          {/* Quick Shortcuts on Header */}
          <div className="hidden md:flex items-center gap-2">
            {NAV_ITEMS.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2.5 rounded-xl text-xs font-label uppercase font-bold tracking-wider transition-all flex items-center gap-2 ${
                  pathname === item.href
                    ? 'bg-primary text-white shadow-[0_0_15px_rgba(126,34,206,0.5)]'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ERP Online
            </div>
          </div>
        </div>
      </header>

      {/* ── Slide-Over Sidebar Drawer ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
            />

            {/* Sidebar Content */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-full max-w-sm bg-[#0a0a0f] border-r border-primary/20 z-50 flex flex-col p-6 overflow-y-auto"
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between pb-6 border-b border-primary/15 mb-6">
                <div>
                  <h2 className="font-headline text-2xl font-bold text-transparent bg-clip-text gold-gradient">
                    Navegación
                  </h2>
                  <p className="text-xs text-white/50 font-label uppercase tracking-widest">
                    Plataforma CFO & ERP
                  </p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>

              {/* Navigation Items — Big Touch Targets */}
              <nav className="flex flex-col gap-3 flex-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`min-h-[64px] px-5 py-4 rounded-2xl border transition-all flex items-center justify-between group active:scale-[0.98] ${
                        isActive
                          ? 'bg-primary/25 border-primary text-white shadow-[0_0_20px_rgba(126,34,206,0.3)]'
                          : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-primary/40 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${
                            isActive ? 'bg-primary text-white' : 'bg-white/10 text-primary group-hover:bg-primary/20'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[24px]">
                            {item.icon}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-headline text-base font-bold text-white">
                            {item.label}
                          </span>
                          <span className="text-xs text-white/50 font-label">
                            {item.subtitle}
                          </span>
                        </div>
                      </div>
                      {item.badge && (
                        <span className="px-2.5 py-1 rounded-full bg-primary/30 text-primary-light border border-primary/40 text-[10px] font-bold uppercase tracking-wider">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="pt-6 border-t border-primary/15 mt-6 text-center">
                <p className="text-xs text-white/40 font-label">
                  Touche Essencielle v2.5 · ERP Operativo
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main View Container ── */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        {children}
      </main>

      {/* ── Quick Mobile Bottom Bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08080c]/95 backdrop-blur-xl border-t border-primary/20 px-3 py-2 flex items-center justify-around">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all min-h-[52px] justify-center ${
                isActive ? 'text-primary font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              <span className="text-[10px] font-label uppercase tracking-tight">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
