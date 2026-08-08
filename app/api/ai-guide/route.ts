import { NextResponse } from 'next/server';
import { catalog } from '../../lib/catalog';
import { supabase } from '@/lib/supabase';
import type { AiGuideAnswers, AiGuideResult } from '../../lib/aiGuideTypes';

const sanitize = (str: string) => {
  if (!str) return '';
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

const normalizeText = (str: string) => {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export async function POST(req: Request) {
  try {
    const body: AiGuideAnswers = await req.json();
    console.log("📥 [DEBUG TOTAL] Payload recibido del cliente:", JSON.stringify(body, null, 2));

    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*');

    if (error) {
      console.error("❌ [AI-GUIDE] Error conectando a Supabase:", error);
      return NextResponse.json({ recommendations: [] });
    }

    if (!inventory || inventory.length === 0) {
      console.warn("⚠️ [AI-GUIDE] Inventario vacío en Supabase.");
      return NextResponse.json({ recommendations: [] });
    }

    const activeInventory = inventory.filter(item => item.estado === true || item.active === true);

    const catalogMap = new Map();
    catalog.forEach(p => {
      catalogMap.set(sanitize(p.id), p);
      catalogMap.set(sanitize(p.name), p);
    });

    let liveCatalog = activeInventory.map(item => {
      const rawName = item.nombre_perfume || item.name || '';
      const cleanName = sanitize(rawName);

      const baseItem = catalogMap.get(cleanName) || {
        id: cleanName,
        name: rawName,
        brand: 'Touche Essencielle',
        topNotes: ['Notas de Salida'],
        heartNotes: ['Notas de Corazón'],
        baseNotes: ['Notas de Fondo'],
        emotionalDesc: 'Una creación exclusiva adaptada a tus sentidos.',
        version: item.tipo || 'ESTANDAR'
      };

      return {
        ...baseItem,
        id: String(item.id || baseItem.id),
        name: rawName || baseItem.name,
        gender: String(item.genero || item.gender || '').trim().toUpperCase(),
        family: String(item.familia_olfativa || '').trim().toUpperCase(),
        occasion: String(item.ocasion || '').trim().toUpperCase(),
        intensity: String(item.intensidad || '').trim().toUpperCase(),
        occasions: item.ocasion ? [String(item.ocasion).trim().toUpperCase()] : (baseItem.occasions || []),
        active: true
      };
    });

    // 1. Género limpio
    const ansGenderRaw = String(body.gender || '').toUpperCase();
    let ansGender = ansGenderRaw.includes('HOMBRE') || ansGenderRaw === 'M' || ansGenderRaw === 'H' ? 'HOMBRE'
      : ansGenderRaw.includes('MUJER') || ansGenderRaw === 'F' || ansGenderRaw === 'DAMA' ? 'MUJER'
        : 'UNISEX';

    // 2. Extracción infalible de la familia olfativa (Revisando cualquier posible clave del frontend)
    const rawInputFamily =
      (body as any).noteFamily ||
      (body as any).family ||
      (body as any).familia ||
      (body as any).olfactiveFamily ||
      (body as any).note_family ||
      (body as any).selectedFamily || '';

    const rawFamilyInput = normalizeText(rawInputFamily);

    let resolvedFamily = rawFamilyInput;
    if (rawFamilyInput.includes('oriental') || rawFamilyInput.includes('especiada')) resolvedFamily = 'orientales/especiadas';
    else if (rawFamilyInput.includes('amaderada')) resolvedFamily = 'amaderadas';
    else if (rawFamilyInput.includes('citrica')) resolvedFamily = 'citricas';
    else if (rawFamilyInput.includes('dulce')) resolvedFamily = 'dulces';
    else if (rawFamilyInput.includes('frutal')) resolvedFamily = 'frutales';
    else if (rawFamilyInput.includes('floral')) resolvedFamily = 'florales';
    else if (rawFamilyInput.includes('acuatica') || rawFamilyInput.includes('marino')) resolvedFamily = 'acuaticas';

    const ansOccasionNorm = normalizeText(body.occasion);
    const ansIntensityNorm = normalizeText(body.intensity);

    console.log(`🔎 [CAPTURADOR] Familia cruda recibida: [${rawInputFamily}] -> Traducida: [${resolvedFamily}] | Género: [${ansGender}] | Ocasión: [${ansOccasionNorm}]`);

    const familyMappings: Record<string, string[]> = {
      'orientales/especiadas': ['oriental', 'especiad', 'ambar', 'oud', 'arab', 'vainilla', 'especiada'],
      'amaderadas': ['amaderad', 'madera', 'cedro', 'sandalo', 'vetiver', 'pachuli', 'amaderada'],
      'citricas': ['citric', 'bergamota', 'limon', 'naranja', 'fresco'],
      'dulces': ['dulce', 'gourmand', 'vainilla', 'caramelo', 'pralin', 'azucar'],
      'frutales': ['frutal', 'fruta', 'manzana', 'cereza', 'pina', 'mango', 'durazno'],
      'florales': ['floral', 'flor', 'rosa', 'jazmin', 'iris', 'peonia'],
      'acuaticas': ['acuatic', 'marino', 'mar', 'agua', 'salado'],
      'fresco': ['fresco', 'fresca', 'citric', 'acuatic', 'aromatic'],
      'aromatico': ['aromatic', 'fresco', 'herbal']
    };

    const familyKeywords = familyMappings[resolvedFamily] || [resolvedFamily];

    // 3. Sistema de puntendación con la Ley Suprema de la Familia (Si llega vacía, no destruye la búsqueda pero prioriza lo demás)
    let scored = liveCatalog.map(p => {
      let score = 100;

      const pGenderRaw = String(p.gender || '').toUpperCase();
      let pGender = pGenderRaw.includes('HOMBRE') || pGenderRaw === 'M' || pGenderRaw === 'H' ? 'HOMBRE'
        : pGenderRaw.includes('MUJER') || pGenderRaw === 'F' || pGenderRaw === 'DAMA' ? 'MUJER'
          : 'UNISEX';

      // Género
      if (ansGender === 'HOMBRE') {
        if (pGender !== 'HOMBRE' && pGender !== 'UNISEX') return { perfume: p, score: -9999 };
        score += (pGender === 'HOMBRE') ? 1500 : 500;
      } else if (ansGender === 'MUJER') {
        if (pGender !== 'MUJER' && pGender !== 'UNISEX') return { perfume: p, score: -9999 };
        score += (pGender === 'MUJER') ? 1500 : 500;
      } else {
        score += (pGender === 'UNISEX') ? 1500 : 800;
      }

      // Familia Olfativa (La Ley Suprema solo si el usuario la mandó)
      const pFamilyNorm = normalizeText(p.family);
      if (resolvedFamily && resolvedFamily !== '') {
        const isFamilyMatch = pFamilyNorm === resolvedFamily ||
          pFamilyNorm.includes(resolvedFamily) ||
          resolvedFamily.includes(pFamilyNorm) ||
          familyKeywords.some(k => pFamilyNorm.includes(k) || k.includes(pFamilyNorm));

        if (isFamilyMatch) {
          score += 15000;
        } else {
          score -= 12000;
        }
      }

      // Ocasión
      const pOccasionNorm = normalizeText(p.occasion);
      if (ansOccasionNorm && ansOccasionNorm !== 'empty') {
        if (pOccasionNorm && pOccasionNorm !== 'empty' && pOccasionNorm !== 'activo') {
          const isOccasionMatch = pOccasionNorm.includes(ansOccasionNorm) || ansOccasionNorm.includes(pOccasionNorm);
          if (isOccasionMatch) score += 1000;
          else score -= 200;
        }
      }

      // Intensidad
      const pIntensityNorm = normalizeText(p.intensity);
      if (ansIntensityNorm && ansIntensityNorm !== 'empty') {
        if (pIntensityNorm && pIntensityNorm !== 'empty' && pIntensityNorm !== 'activo') {
          const isIntensityMatch = pIntensityNorm.includes(ansIntensityNorm) || ansIntensityNorm.includes(pIntensityNorm);
          if (isIntensityMatch) score += 500;
        }
      }

      score += Math.random() * 2;
      return { perfume: p, score };
    });

    scored.sort((a, b) => b.score - a.score);

    let validScored = scored.filter(item => item.score > 0);
    if (validScored.length === 0) {
      validScored = scored.filter(item => item.score > -9999).slice(0, 5);
    }

    const uniquePerfumes: typeof validScored = [];
    const seenIds = new Set<string>();
    for (const item of validScored) {
      const pIdStr = String(item.perfume.id);
      if (!seenIds.has(pIdStr)) {
        seenIds.add(pIdStr);
        uniquePerfumes.push(item);
      }
    }

    let top3 = uniquePerfumes.slice(0, 3).map(x => x.perfume);

    console.log("🏆 [AI-GUIDE FINAL] Top 3 elegidos:", top3.map(p => `${p.name} (Género: ${p.gender}, Familia: ${p.family})`));

    const recommendations = top3.map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      family: p.family,
      topNotes: p.topNotes,
      heartNotes: p.heartNotes,
      baseNotes: p.baseNotes,
      emotionalDesc: p.emotionalDesc,
      version: p.version,
      gender: p.gender
    } as AiGuideResult));

    return NextResponse.json({ recommendations });

  } catch (error) {
    console.error("❌ Error crítico en API de AiGuide:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}