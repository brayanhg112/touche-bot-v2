import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aria — Tu Asesora de Fragancias | Touche Essencielle',
  description: 'Descubre tu perfume ideal con Aria, la asesora personal de fragancias de Touche Essencielle. Recomendaciones personalizadas basadas en tu estilo y ocasión.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&family=Manrope:wght@300;400;600;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface text-on-surface font-body">{children}</body>
    </html>
  );
}
