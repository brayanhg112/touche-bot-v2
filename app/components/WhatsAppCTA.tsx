'use client';

import { buildWhatsappSummary, type ScoredPerfume } from '../lib/recommender';

interface WhatsAppCTAProps {
  userName: string;
  top3: ScoredPerfume[];
}

export default function WhatsAppCTA({ userName, top3 }: WhatsAppCTAProps) {
  const url = buildWhatsappSummary(userName, top3);

  return (
    <div className="flex flex-col gap-3 items-center mt-2">
      <a
        id="whatsapp-cta"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#25D366] text-white font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-[#20BE5A] hover:scale-105 transition-all duration-300"
      >
        <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 2.83.736 5.484 2.025 7.784L0 32l8.437-2.011A15.927 15.927 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.22 22.22c-.34.957-1.983 1.822-2.73 1.938-.739.115-1.662.163-2.682-.168a24.34 24.34 0 0 1-2.426-.897C12.21 21.52 9.624 18.317 9.43 18.07c-.195-.247-1.59-2.117-1.59-4.04s1.008-2.87 1.366-3.263c.357-.394.779-.492.04-.492l-.832.016c-.274 0-.716.103-1.09.492-.373.39-1.428 1.396-1.428 3.406 0 2.01 1.463 3.953 1.667 4.23.204.274 2.878 4.59 7.112 6.278 1.007.39 1.793.623 2.406.797.99.284 1.89.244 2.602.148.793-.107 2.442-.998 2.786-1.963.344-.965.344-1.793.24-1.963-.104-.17-.373-.274-.78-.48z" />
        </svg>
        ¡Los quiero todos — WhatsApp
      </a>
      
      {/* Catálogo Completo (Google Drive) */}
      <a
        id="catalog-drive-cta"
        href="https://drive.google.com/drive/folders/1YULOX4W95_ndlKqxqPP1EMRFpr3rfuM_?usp=sharing"
        target="_blank"
        rel="noopener noreferrer"
        style={{ 
          fontSize: '0.8rem', 
          color: 'var(--text-muted)', 
          textDecoration: 'underline',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
        Ver catálogo de entrega inmediata
      </a>

      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Te atendemos con toda la clase del mundo 🌸
      </p>
    </div>
  );
}
