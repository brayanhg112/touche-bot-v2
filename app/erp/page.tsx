import type { Metadata } from 'next';
import ERPPanel from '../components/ERPPanel';

export const metadata: Metadata = {
  title: 'Brian ERP · Touche Essencielle',
  description: 'Módulo operativo: punto de venta y control de insumos.',
};

export default function ERPPage() {
  return <ERPPanel />;
}
