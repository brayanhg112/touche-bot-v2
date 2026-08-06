import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { PerfumeStockItem } from '../../lib/types';

export const dynamic = 'force-dynamic';

const INVENTORY_PATH = path.join(process.cwd(), 'data', 'inventory.json');

function readInventory(): Record<string, PerfumeStockItem> {
  if (!fs.existsSync(INVENTORY_PATH)) {
    throw new Error('El archivo inventory.json no existe. Ejecuta scripts/generate-inventory-json.mjs primero.');
  }
  return JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'));
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const inventory = readInventory();

    const stock: Record<string, PerfumeStockItem> = {};
    const outOfStock: string[] = [];

    for (const [name, item] of Object.entries(inventory)) {
      if (item.active) {
        stock[name] = item;
      } else {
        outOfStock.push(name);
      }
    }

    return NextResponse.json({
      total: Object.keys(inventory).length,
      stock,
      outOfStock,
      fullInventory: inventory,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno al consultar el inventario';
    console.error('[GET /api/stock]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body: Record<string, PerfumeStockItem> = await req.json();

    // Validate payload is a non-null object
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Payload inválido. Se esperaba un objeto de inventario.' },
        { status: 400 }
      );
    }

    // Persist to disk
    fs.writeFileSync(INVENTORY_PATH, JSON.stringify(body, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      total: Object.keys(body).length,
      message: `Inventario guardado con éxito (${Object.keys(body).length} perfumes).`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al guardar el inventario';
    console.error('[POST /api/stock]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}