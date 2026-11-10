/**
 * sheets.ts — Cliente compartido para Google Sheets API v4
 * Usa la Service Account configurada en .env.local
 */
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1eVNytdcAy2zP0n0bgxVuoHgyDbUA6SGjaV10HjMlD9o';

/** Nombres exactos de las hojas en el Spreadsheet */
export const SHEETS = {
  TRACKER: 'TRACKER DIARIO COMPLETO',
  TOUCHE: 'TOUCHE ESSENCIELLE',
  INVENTARIO_BOT: 'InventarioBot',
} as const;

export const INVENTARIO_RANGE = 'InventarioBot!A1:H1000';

/** Columnas del TRACKER DIARIO COMPLETO (A=0 … H=7) */
export const TRACKER_COLS = {
  FECHA:       'A', // Fecha de la venta
  HOMBRE:      'B', // Nombre del perfume si es masculino
  MUJER:       'C', // Nombre del perfume si es femenino
  ML_30:       'D', // Cantidad vendida en 30ml
  ML_50:       'E', // Cantidad vendida en 50ml
  ML_100:      'F', // Cantidad vendida en 100ml
  RECARGAS:    'G', // Cantidad de recargas
  VENDIDOS_A:  'H', // Nombres de compradores
} as const;

/** Celdas de insumos en TOUCHE ESSENCIELLE */
export const INSUMO_CELLS = {
  ESENCIA:       'C3',
  ROLONES_10ML:  'C7',
  BALA_30ML:     'C10',
  ALCOHOL:       'C19',
  FEROMONAS:     'C20',
  FIJADOR:       'C21',
} as const;

export interface PerfumeSheetRow {
  id: string;
  nombre_perfume: string;
  tipo: string;
  estado: string;
  familia_olfativa: string;
  ocasion: string;
  intensidad: string;
  genero: string;
}

/** Construye un cliente autenticado de Google Sheets */
export async function getSheetsClient() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY ?? '';
  const privateKey = rawKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient as Parameters<typeof google.sheets>[0]['auth'] });
}

/**
 * Extrae el inventario desde la pestaña 'InventarioBot' en el rango 'InventarioBot!A1:H1000'.
 * Filtra únicamente los perfumes que tengan la columna estado con el valor exacto de ACTIVO.
 */
export async function getInventoryFromSheets(): Promise<PerfumeSheetRow[]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID || SHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: INVENTARIO_RANGE,
  });

  const rows = res.data.values || [];
  if (rows.length === 0) {
    console.log("Datos extraídos de Sheets: [] (hoja vacía o sin filas)");
    return [];
  }

  // Detectar dinámicamente columnas según cabecera
  const headerRow = (rows[0] || []).map((h: unknown) => (h ? String(h).trim().toLowerCase() : ''));
  const nameIdx = headerRow.findIndex((h: string) => h.includes('nombre'));
  const tipoIdx = headerRow.findIndex((h: string) => h.includes('tipo'));
  const estadoIdx = headerRow.findIndex((h: string) => h === 'estado');
  const familyIdx = headerRow.findIndex((h: string) => h.includes('familia'));
  const ocasionIdx = headerRow.findIndex((h: string) => h.includes('ocasion') || h.includes('ocasión'));
  const intensidadIdx = headerRow.findIndex((h: string) => h.includes('intensidad'));
  const generoIdx = headerRow.findIndex((h: string) => h.includes('genero') || h.includes('género'));

  const dataRows = rows.slice(1);
  const allParsed: PerfumeSheetRow[] = dataRows.map((row: unknown[], idx: number) => {
    const rawId = (row[0] ? String(row[0]) : '').trim();
    const rawName = (row[nameIdx >= 0 ? nameIdx : 1] ? String(row[nameIdx >= 0 ? nameIdx : 1]) : '').trim();
    const tipo = (row[tipoIdx >= 0 ? tipoIdx : 2] ? String(row[tipoIdx >= 0 ? tipoIdx : 2]) : 'ESTANDAR').trim();
    const estado = (row[estadoIdx >= 0 ? estadoIdx : 3] ? String(row[estadoIdx >= 0 ? estadoIdx : 3]) : '').trim();
    const familia_olfativa = (row[familyIdx >= 0 ? familyIdx : 4] ? String(row[familyIdx >= 0 ? familyIdx : 4]) : '').trim();
    const ocasion = (row[ocasionIdx >= 0 ? ocasionIdx : 5] ? String(row[ocasionIdx >= 0 ? ocasionIdx : 5]) : '').trim();
    const intensidad = (row[intensidadIdx >= 0 ? intensidadIdx : 6] ? String(row[intensidadIdx >= 0 ? intensidadIdx : 6]) : '').trim();
    const genero = (row[generoIdx >= 0 ? generoIdx : 7] ? String(row[generoIdx >= 0 ? generoIdx : 7]) : '').trim();

    return {
      id: rawId || rawName || `perfume-${idx}`,
      nombre_perfume: rawName,
      tipo,
      estado,
      familia_olfativa,
      ocasion,
      intensidad,
      genero,
    };
  });

  // Filtrar estrictamente los que tengan estado === 'ACTIVO'
  const stockData = allParsed.filter(item => item.estado?.trim().toUpperCase() === 'ACTIVO');

  // Log crucial requerido
  console.log("Datos extraídos de Sheets:", stockData);

  return stockData;
}
