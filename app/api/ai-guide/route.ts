export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getInventoryFromSheets } from '@/app/lib/sheets';
import { recommendFromActiveSheets, normalizeText } from '@/app/lib/recommender';
import type { AiGuideAnswers, AiGuideResult } from '../../lib/aiGuideTypes';
import type { Feel, Gender, Occasion } from '../../lib/types';

function mapGender(raw?: string): Gender {
  const g = normalizeText(raw || '');
  if (g.includes('HOMBRE') || g === 'M' || g === 'H' || g.includes('CABALLERO')) return 'M';
  if (g.includes('MUJER') || g === 'F' || g.includes('DAMA')) return 'F';
  return 'U';
}

function mapOccasion(raw?: string): Occasion | '' {
  const o = normalizeText(raw || '');
  if (!o) return '';
  if (o.includes('OFICINA') || o.includes('TRABAJO')) return 'trabajo';
  if (o.includes('CITA')) return 'cita';
  if (o.includes('EVENTO') || o.includes('FORMAL')) return 'evento';
  if (o.includes('DEPORTE')) return 'deporte';
  if (o.includes('DIARIO')) return 'diario';
  return 'diario';
}

function mapFeels(rawFamily?: string): Feel[] {
  const f = normalizeText(rawFamily || '');
  if (!f) return [];
  if (f.includes('ORIENTAL') || f.includes('ESPECIAD')) return ['especiado', 'oud'];
  if (f.includes('AMADERAD')) return ['amaderado'];
  if (f.includes('CITRIC') || f.includes('CITIC')) return ['citrico'];
  if (f.includes('DULCE') || f.includes('GOURMAND')) return ['dulce'];
  if (f.includes('FRUTAL')) return ['frutal'];
  if (f.includes('FLORAL')) return ['floral'];
  if (f.includes('ACUATIC')) return ['acuatico', 'fresco'];
  if (f.includes('FRESC')) return ['fresco'];
  if (f.includes('AROMATIC')) return ['verde'];
  if (f.includes('ATALCAD')) return ['atalcado'];
  return [];
}

export async function POST(req: Request) {
  try {
    const body: AiGuideAnswers = await req.json();

    // BLOQUE 3: Lectura estricta en vivo desde Google Sheets (InventarioBot!A1:H1000) con cache: 'no-store'
    let activeSheetsInventory;
    try {
      activeSheetsInventory = await getInventoryFromSheets();
    } catch (sheetErr: unknown) {
      const msg = sheetErr instanceof Error ? sheetErr.message : String(sheetErr);
      console.error('❌ [POST /api/ai-guide] Error leyendo Google Sheets en vivo:', msg);
      return NextResponse.json(
        {
          error: 'No se pudo consultar el inventario en vivo desde Google Sheets.',
          recommendations: [],
        },
        { status: 503 }
      );
    }

    if (!activeSheetsInventory || activeSheetsInventory.length === 0) {
      console.error('❌ [POST /api/ai-guide] Google Sheets devolvió 0 perfumes ACTIVOS en InventarioBot.');
      return NextResponse.json(
        {
          error: 'No hay fragancias ACTIVAS disponibles en el inventario en este momento.',
          recommendations: [],
        },
        { status: 503 }
      );
    }

    const rawFamily =
      (body.noteFamily ||
        body.family ||
        (body as unknown as Record<string, string>).familia ||
        (body as unknown as Record<string, string>).olfactiveFamily ||
        '')
        .toString()
        .trim();

    // BLOQUE 2 & 4: Motor unificado con normalización y fallback en cascada de 4 niveles usando SOLO estado ACTIVO
    const scored = recommendFromActiveSheets(
      {
        name: '',
        gender: mapGender(body.gender),
        occasion: mapOccasion(body.occasion),
        projection: '',
        feel: mapFeels(rawFamily),
        familyFilter: rawFamily,
        avoid: [],
      },
      activeSheetsInventory
    );

    const recommendations: AiGuideResult[] = scored.slice(0, 3).map(({ perfume }) => ({
      id: perfume.id,
      name: perfume.name,
      brand: perfume.brand,
      family: perfume.family,
      topNotes: perfume.topNotes,
      heartNotes: perfume.heartNotes,
      baseNotes: perfume.baseNotes,
      emotionalDesc: perfume.emotionalDesc,
      version: perfume.version,
      gender: perfume.gender === 'M' ? 'HOMBRE' : perfume.gender === 'F' ? 'MUJER' : 'UNISEX',
    }));

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error(
      '❌ [POST /api/ai-guide] Error inesperado en API:',
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      {
        error: 'Error procesando recomendaciones del sommelier.',
        recommendations: [],
      },
      { status: 500 }
    );
  }
}
