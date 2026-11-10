/**
 * POST /api/erp/tracker
 *
 * Registra una venta en "TRACKER DIARIO COMPLETO".
 * Estructura de columnas (A-H):
 *   A = Fecha
 *   B = Hombre  (nombre del perfume si género M)
 *   C = Mujer   (nombre del perfume si género F o U)
 *   D = 30ml    (cantidad)
 *   E = 50ml    (cantidad)
 *   F = 100ml   (cantidad)
 *   G = RECARGAS (cantidad)
 *   H = Vendidos a (comprador)
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSheetsClient, SHEET_ID, SHEETS } from '../../../lib/sheets';

export const dynamic = 'force-dynamic';

const SaleSchema = z.object({
  comprador:  z.string().min(1, 'Nombre del comprador requerido'),
  perfume:    z.string().min(1, 'Nombre del perfume requerido'),
  genero:     z.enum(['M', 'F', 'U']),
  tamano:     z.enum(['30ml', '50ml', '100ml', 'recarga']),
  cantidad:   z.number().int().positive(),
  fecha:      z.string().optional(), // ISO date string, defaults to today
});

export type SalePayload = z.infer<typeof SaleSchema>;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = SaleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { comprador, perfume, genero, tamano, cantidad, fecha } = parsed.data;

    // ── Formatear fecha (dd/MM/yyyy para Google Sheets) ──────────────────────
    const dateObj = fecha ? new Date(fecha) : new Date();
    const formattedDate = dateObj.toLocaleDateString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

    // ── Mapear género → columna B o C ────────────────────────────────────────
    const hombre = genero === 'M' ? perfume : '';
    const mujer  = genero !== 'M' ? perfume : '';

    // ── Mapear tamaño → columnas D, E, F, G ──────────────────────────────────
    const qty30     = tamano === '30ml'    ? cantidad : '';
    const qty50     = tamano === '50ml'    ? cantidad : '';
    const qty100    = tamano === '100ml'   ? cantidad : '';
    const qtyRec    = tamano === 'recarga' ? cantidad : '';

    // ── Construir fila [A, B, C, D, E, F, G, H] ──────────────────────────────
    const row = [formattedDate, hombre, mujer, qty30, qty50, qty100, qtyRec, comprador];

    const sheets = await getSheetsClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `'${SHEETS.TRACKER}'!A:H`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    console.log(`✅ Venta registrada: ${perfume} → ${comprador} | ${tamano} x${cantidad}`);

    return NextResponse.json({
      success: true,
      message: `Venta de "${perfume}" registrada correctamente para ${comprador}.`,
      row,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    console.error('[POST /api/erp/tracker]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
