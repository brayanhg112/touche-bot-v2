import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getInventoryFromSheets, PerfumeSheetRow } from '@/app/lib/sheets';
import type { PerfumeStockItem } from '../../lib/types';

export const dynamic = 'force-dynamic';

const INVENTORY_PATH = path.join(process.cwd(), 'data', 'inventory.json');

function readLocalFallbackInventory(): Record<string, PerfumeStockItem> {
  if (fs.existsSync(INVENTORY_PATH)) {
    return JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'));
  }
  return {};
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    // 1. Intentar extraer inventario en vivo desde Google Sheets (pestaña InventarioBot!A1:H1000)
    let stockData: PerfumeSheetRow[] = [];
    try {
      stockData = await getInventoryFromSheets();
    } catch (sheetError: unknown) {
      console.warn(
        '⚠️ [GET /api/stock] No se pudo conectar a Google Sheets, usando respaldo local:',
        sheetError instanceof Error ? sheetError.message : sheetError
      );
    }

    const stock: Record<string, any> = {};
    const outOfStock: string[] = [];

    if (stockData && stockData.length > 0) {
      for (const item of stockData) {
        stock[item.nombre_perfume || item.id] = {
          id: item.id,
          name: item.nombre_perfume,
          version: item.tipo,
          active: true,
          gender: item.genero,
          olfactory_family: item.familia_olfativa,
          occasion: item.ocasion,
          intensity: item.intensidad,
        };
      }

      return NextResponse.json({
        total: stockData.length,
        stock,
        outOfStock,
        stockData,
        source: 'google-sheets',
      });
    }

    // 2. Fallback a data/inventory.json si Sheets no devolvió datos
    const fallback = readLocalFallbackInventory();
    for (const [name, item] of Object.entries(fallback)) {
      if (item.active) {
        stock[name] = item;
      } else {
        outOfStock.push(name);
      }
    }

    return NextResponse.json({
      total: Object.keys(fallback).length,
      stock,
      outOfStock,
      fullInventory: fallback,
      source: 'local-fallback',
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
