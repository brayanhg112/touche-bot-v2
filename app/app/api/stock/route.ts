import { NextResponse } from 'next/server';
import { catalog } from '../../../lib/catalog';

// Public CSV export URL — must be set to "Anyone with link can view"
const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1rIU-p4HhfTdd3-Tyst-sVz19AxkeyfPY9DVaG0NGIVc/export?format=csv';

/** Strip accents, lowercase, trim */
function normalize(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Minimal CSV row splitter — handles quoted fields correctly
 * without any external dependency.
 */
function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(SHEET_CSV_URL, {
      cache: 'no-store',
      // Abort quickly so a public-sheet misconfiguration doesn't hang the UI
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ stock: {} });
    }

    const csvText = await res.text();
    const lines = csvText.split('\n');

    let customStockMap: Record<string, boolean> = {};
    let stockIdx = -1;
    let nameIdx = -1;

    // 1. Encontrar la fila de encabezados
    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const cols = parseCSVRow(lines[i]).map(c => c.toLowerCase().trim());
      const sIdx = cols.findIndex(c => c === 'stock' || c === 'entrega' || c === 'disponible');
      if (sIdx !== -1) {
        stockIdx = sIdx;
        const nIdx = cols.findIndex(c => c === 'perfume' || c === 'nombre' || c === 'fragancia' || c === 'producto');
        nameIdx = nIdx !== -1 ? nIdx : 0;
        break;
      }
    }

    // Si encontramos las columnas exactas, lo usamos:
    if (stockIdx !== -1 && nameIdx !== -1) {
      for (const line of lines) {
        if (!line.trim()) continue;
        const cols = parseCSVRow(line);
        if (cols.length <= Math.max(stockIdx, nameIdx)) continue;
        
        const rawName = normalize(cols[nameIdx]);
        const rawStock = cols[stockIdx].trim().toUpperCase();
        
        if (rawName) {
          // Buscamos a qué perfume del catálogo corresponde
          const matched = catalog.find(p => 
            normalize(p.name) === rawName || rawName.includes(normalize(p.name)) || normalize(p.name).includes(rawName)
          );
          if (matched) {
            // 'S' = entrega inmediata, cualquier otra cosa = bajo pedido
            customStockMap[matched.id] = (rawStock === 'S' || rawStock === 'SI' || rawStock === 'SÍ');
          }
        }
      }
    } else {
      // Método de respaldo (Fallback): Escanear todas las celdas buscando nombres de catálogo y la letra 'S' o 'N'
      for (const line of lines) {
        if (!line.trim()) continue;
        const cols = parseCSVRow(line);
        const normCols = cols.map(normalize);
        
        for (const perfume of catalog) {
          const normName = normalize(perfume.name);
          const nameFound = normCols.some(c => c.includes(normName) || normName.includes(c) && c.length > 3);
          
          if (nameFound) {
            // Check si alguna otra celda contiene 'S' o 'N'
            const hasS = cols.some(c => c.trim().toUpperCase() === 'S');
            const hasN = cols.some(c => c.trim().toUpperCase() === 'N');
            if (hasS) customStockMap[perfume.id] = true;
            else if (hasN) customStockMap[perfume.id] = false;
          }
        }
      }
    }

    // Rellenamos el resto del catálogo por defecto a False ('Bajo pedido') si no se reportaron con 'S'
    const finalStockMap: Record<string, boolean> = {};
    catalog.forEach((perfume) => {
      finalStockMap[perfume.id] = customStockMap[perfume.id] === true;
    });

    return NextResponse.json({ stock: finalStockMap });
  } catch (err) {
    return NextResponse.json({ stock: {} });
  }
}

