import type { Metadata, Viewport } from 'next';
import AppShell from './components/layout/AppShell';
import './globals.css';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://touche-bot-v2.vercel.app');

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050505',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Touche Essencielle | Sommelier Digital',
  description:
    'Descubre tu fragancia ideal con Aria, el Sommelier Digital de Touche Essencielle. Asesoría olfativa personalizada, alta perfumería e inventario en vivo.',
  icons: {
    icon: [
      { url: '/logo-nuevo.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/logo-nuevo.png', type: 'image/png' }],
  },
  openGraph: {
    title: 'Touche Essencielle | Sommelier Digital',
    description:
      'Encuentra tu firma olfativa ideal en segundos con Aria, nuestro Sommelier Digital de alta perfumería. Asesoría personalizada y stock en vivo.',
    type: 'website',
    locale: 'es_CO',
    siteName: 'Touche Essencielle',
    images: [
      {
        url: '/logo-nuevo.png',
        width: 1024,
        height: 1024,
        alt: 'Touche Essencielle — Sommelier Digital',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Touche Essencielle | Sommelier Digital',
    description:
      'Encuentra tu firma olfativa ideal con Aria, nuestro Sommelier Digital de alta perfumería.',
    images: ['/logo-nuevo.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&family=Manrope:wght@300;400;600;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#050505] text-white font-body antialiased" suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
