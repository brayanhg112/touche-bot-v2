/**
 * sheets.ts — Cliente compartido para Google Sheets API v4 (InventarioBot en vivo)
 * Usa la Service Account configurada en .env.local y consulta SIEMPRE con cache: 'no-store'.
 */
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

export const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1eVNytdcAy2zP0n0bgxVuoHgyDbUA6SGjaV10HjMlD9o';

export const SHEETS = {
  INVENTARIO_BOT: 'InventarioBot',
} as const;

export const INVENTARIO_RANGE = 'InventarioBot!A1:H1000';

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

export interface RawSheetAuditRow extends PerfumeSheetRow {
  rowNumber: number;
  rawId: string;
  rawName: string;
  rawFamilia: string;
  rawOcasion: string;
  rawIntensidad: string;
  rawGenero: string;
  rawTipo: string;
}

export interface InventorySheetsSnapshot {
  allRows: RawSheetAuditRow[];
  activeRows: PerfumeSheetRow[];
  inactiveRows: RawSheetAuditRow[];
}

const INVALID_ID_TOKENS = new Set(['VENDIDO', 'ACTIVO', 'INACTIVO', 'AGOTADO', '']);
const CORRUPTED_META_TOKENS = new Set(['ACTIVO', 'INACTIVO', 'VENDIDO']);

async function optOutNextCache(): Promise<void> {
  try {
    const nextCache = await import('next/cache');
    if (typeof nextCache.unstable_noStore === 'function') {
      nextCache.unstable_noStore();
    }
  } catch {
    // Ejecución fuera de Next.js (ej. scripts CLI como test_recommender.ts)
  }
}

function parseGoogleCredentials(): { clientEmail: string; privateKey: string } {
  let clientEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? '')
    .trim()
    .replace(/^["']|["']$/g, '');
  let rawKey = (process.env.GOOGLE_PRIVATE_KEY ?? '').trim();

  // Soportar si el usuario pegó el JSON completo de la Service Account en GOOGLE_PRIVATE_KEY
  if (rawKey.startsWith('{')) {
    try {
      const parsed = JSON.parse(rawKey) as { private_key?: string; client_email?: string };
      if (parsed.private_key) rawKey = parsed.private_key;
      if (!clientEmail && parsed.client_email) clientEmail = parsed.client_email.trim();
    } catch {
      throw new Error(
        'GOOGLE_PRIVATE_KEY parece un objeto JSON pero no se pudo parsear. Verifica el formato en Vercel.'
      );
    }
  } else if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
    try {
      const unquoted = JSON.parse(rawKey);
      if (typeof unquoted === 'string') rawKey = unquoted;
    } catch {
      rawKey = rawKey.slice(1, -1);
    }
  } else {
    rawKey = rawKey.replace(/^["']|["']$/g, '');
  }

  // Normalizar saltos de línea para Vercel (escapados simples, dobles o CRLF)
  const privateKey = rawKey
    .replace(/\\\\n/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .trim();

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Faltan credenciales de Google Sheets (GOOGLE_SERVICE_ACCOUNT_EMAIL o GOOGLE_PRIVATE_KEY).'
    );
  }

  if (!privateKey.includes('-----BEGIN') || !privateKey.includes('PRIVATE KEY-----')) {
    throw new Error(
      'GOOGLE_PRIVATE_KEY tiene un formato PEM inválido (asegúrate de incluir -----BEGIN PRIVATE KEY----- y los saltos de línea \\n).'
    );
  }

  return { clientEmail, privateKey };
}

/** Obtiene un access token fresco para Google Sheets API */
async function getSheetsAccessToken(): Promise<string> {
  const { clientEmail, privateKey } = parseGoogleCredentials();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });

  const authClient = await auth.getClient();
  const tokenResponse = await authClient.getAccessToken();
  const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

  if (!token) {
    throw new Error('No se pudo obtener un token de acceso válido para Google Sheets.');
  }

  return token;
}

function cleanMetaValue(val: string): string {
  const trimmed = val.trim();
  if (CORRUPTED_META_TOKENS.has(trimmed.toUpperCase())) return '';
  return trimmed;
}

/**
 * Consulta la pestaña 'InventarioBot!A1:H1000' SIEMPRE en vivo usando fetch(..., { cache: 'no-store' }).
 * Si falla la conexión o la respuesta de Sheets, registra un error explícito en consola y lanza excepción.
 */
export async function getAllInventoryRowsFromSheets(): Promise<InventorySheetsSnapshot> {
  await optOutNextCache();

  const spreadsheetId = (process.env.GOOGLE_SHEET_ID || SHEET_ID)
    .trim()
    .replace(/^["']|["']$/g, '');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(INVENTARIO_RANGE)}`;

  let rows: unknown[][] = [];
  try {
    const token = await getSheetsAccessToken();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Google Sheets HTTP ${response.status}: ${errBody}`);
    }

    const payload = (await response.json()) as { values?: unknown[][] };
    rows = Array.isArray(payload.values) ? payload.values : [];
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ [Sheets LIVE ERROR] Falló la lectura en vivo de InventarioBot:', message);
    throw err;
  }

  if (rows.length <= 1) {
    console.error('❌ [Sheets LIVE ERROR] La pestaña InventarioBot está vacía o sin filas de datos.');
    return { allRows: [], activeRows: [], inactiveRows: [] };
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
  const allRows: RawSheetAuditRow[] = [];

  dataRows.forEach((row: unknown[], idx: number) => {
    const rowNumber = idx + 2;
    const rawId = (row[0] ? String(row[0]) : '').trim();
    const rawName = (row[nameIdx >= 0 ? nameIdx : 1] ? String(row[nameIdx >= 0 ? nameIdx : 1]) : '').trim();
    const rawTipo = (row[tipoIdx >= 0 ? tipoIdx : 2] ? String(row[tipoIdx >= 0 ? tipoIdx : 2]) : '').trim();
    const estado = (row[estadoIdx >= 0 ? estadoIdx : 3] ? String(row[estadoIdx >= 0 ? estadoIdx : 3]) : '').trim();
    const rawFamilia = (row[familyIdx >= 0 ? familyIdx : 4] ? String(row[familyIdx >= 0 ? familyIdx : 4]) : '').trim();
    const rawOcasion = (row[ocasionIdx >= 0 ? ocasionIdx : 5] ? String(row[ocasionIdx >= 0 ? ocasionIdx : 5]) : '').trim();
    const rawIntensidad = (row[intensidadIdx >= 0 ? intensidadIdx : 6] ? String(row[intensidadIdx >= 0 ? intensidadIdx : 6]) : '').trim();
    const rawGenero = (row[generoIdx >= 0 ? generoIdx : 7] ? String(row[generoIdx >= 0 ? generoIdx : 7]) : '').trim();

    // Saltar filas completamente en blanco
    const isEmptyRow = !rawId && !rawName && !estado && !rawFamilia && !rawOcasion && !rawGenero;
    if (isEmptyRow) {
      allRows.push({
        rowNumber,
        id: '',
        nombre_perfume: '',
        tipo: '',
        estado: '',
        familia_olfativa: '',
        ocasion: '',
        intensidad: '',
        genero: '',
        rawId,
        rawName,
        rawFamilia,
        rawOcasion,
        rawIntensidad,
        rawGenero,
        rawTipo,
      });
      return;
    }

    // Si nombre_perfume está corrupto (ej. "C") pero la columna A tiene un slug real, úsalo para no mostrar "C" al usuario
    const effectiveName = rawName.length <= 2 && rawId.includes('---') ? rawId : (rawName || rawId);
    const effectiveId = !INVALID_ID_TOKENS.has(rawId.toUpperCase())
      ? rawId
      : (effectiveName || `perfume-${rowNumber}`);

    allRows.push({
      rowNumber,
      id: effectiveId,
      nombre_perfume: effectiveName,
      tipo: rawTipo || 'ESTANDAR',
      estado,
      familia_olfativa: cleanMetaValue(rawFamilia),
      ocasion: cleanMetaValue(rawOcasion),
      intensidad: cleanMetaValue(rawIntensidad),
      genero: cleanMetaValue(rawGenero),
      rawId,
      rawName,
      rawFamilia,
      rawOcasion,
      rawIntensidad,
      rawGenero,
      rawTipo,
    });
  });

  // Filtrar estrictamente estado === 'ACTIVO' y con nombre válido
  const activeRows: PerfumeSheetRow[] = allRows
    .filter((item) => item.estado.trim().toUpperCase() === 'ACTIVO' && item.nombre_perfume.trim().length > 0)
    .map(({ id, nombre_perfume, tipo, estado, familia_olfativa, ocasion, intensidad, genero }) => ({
      id,
      nombre_perfume,
      tipo,
      estado,
      familia_olfativa,
      ocasion,
      intensidad,
      genero,
    }));

  const inactiveRows = allRows.filter(
    (item) => item.estado.trim().toUpperCase() !== 'ACTIVO' && (item.rawName || item.rawId)
  );

  return { allRows, activeRows, inactiveRows };
}

/**
 * Extrae el inventario ACTIVO desde 'InventarioBot!A1:H1000' en vivo (cache: 'no-store').
 * Filtra únicamente filas con estado === 'ACTIVO'.
 */
export async function getInventoryFromSheets(): Promise<PerfumeSheetRow[]> {
  const { activeRows } = await getAllInventoryRowsFromSheets();
  return activeRows;
}
