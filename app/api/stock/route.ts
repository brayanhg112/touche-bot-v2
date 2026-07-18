export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getInventory } from '@/lib/googleSheets';

export async function GET() {
  try {
    const rows = await getInventory();

    // Build a { [perfume_id]: boolean } map — true = ACTIVO (in stock)
    const stock: Record<string, boolean> = {};
    const outOfStock: string[] = [];

    for (const row of rows) {
      const id: string = row.id ?? '';
      const isActive = (row.estado ?? '').toString().toUpperCase() === 'ACTIVO';
      if (id) {
        stock[id] = isActive;
        if (!isActive) outOfStock.push(id);
      }
    }

    return NextResponse.json({ stock, outOfStock });
  } catch (error) {
    console.error('Error loading stock from Google Sheets:', error);
    // Graceful fallback — empty maps, frontend handles this silently
    return NextResponse.json({ stock: {}, outOfStock: [] });
  }
}