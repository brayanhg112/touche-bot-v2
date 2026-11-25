import { NextResponse } from 'next/server';
import { getAllInventoryRowsFromSheets } from '@/app/lib/sheets';
import { buildActiveSheetPool } from '@/app/lib/recommender';

// BLOQUE 3: Forzar lectura en vivo — sin cache de Sheets, sin stock congelado
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Extraer inventario en vivo desde Google Sheets (InventarioBot!A1:H1000) con cache: 'no-store'
    const { activeRows, inactiveRows } = await getAllInventoryRowsFromSheets();

    if (!activeRows || activeRows.length === 0) {
      console.error(
        '❌ [GET /api/stock] Google Sheets devolvió 0 perfumes con estado ACTIVO en InventarioBot. No se usará respaldo local obsoleto.'
      );
      return NextResponse.json(
        {
          error: 'No se encontraron perfumes ACTIVOS en InventarioBot.',
          total: 0,
          stock: {},
          outOfStock: inactiveRows.map((r) => r.id || r.nombre_perfume).filter(Boolean),
          stockData: [],
          activeCatalog: [],
          source: 'google-sheets-empty',
        },
        { status: 503 }
      );
    }

    const stock: Record<string, unknown> = {};
    for (const item of activeRows) {
      const entry = {
        id: item.id,
        name: item.nombre_perfume,
        version: item.tipo,
        active: true,
        gender: item.genero,
        olfactory_family: item.familia_olfativa,
        occasion: item.ocasion,
        intensity: item.intensidad,
      };
      stock[item.id] = entry;
      stock[item.nombre_perfume] = entry;
    }

    const outOfStock = inactiveRows
      .map((r) => r.id || r.nombre_perfume)
      .filter(Boolean);

    // Catálogo enriquecido EXCLUSIVAMENTE con perfumes ACTIVOS de Sheets
    const activeCatalog = buildActiveSheetPool(activeRows).map((entry) => entry.perfume);

    return NextResponse.json({
      total: activeRows.length,
      stock,
      outOfStock,
      stockData: activeRows,
      activeCatalog,
      source: 'google-sheets',
    });
  } catch (error: unknown) {
    // BLOQUE 3: Error explícito en consola — NUNCA caer silenciosamente en archivos JSON viejos
    const message =
      error instanceof Error ? error.message : 'Error interno al consultar InventarioBot en vivo';
    console.error('❌ [GET /api/stock] Error leyendo inventario en vivo desde Google Sheets:', message);
    return NextResponse.json(
      {
        error: `Error leyendo inventario en vivo de Google Sheets: ${message}`,
        total: 0,
        stock: {},
        outOfStock: [],
        stockData: [],
        activeCatalog: [],
        source: 'sheets-error',
      },
      { status: 503 }
    );
  }
}
