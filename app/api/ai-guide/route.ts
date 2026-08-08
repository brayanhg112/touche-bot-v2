import { NextResponse } from 'next/server';
import { catalog } from '../../lib/catalog';
import { supabase } from '@/lib/supabase';
import type { AiGuideAnswers, AiGuideResult } from '../../lib/aiGuideTypes';

export async function POST(req: Request) {
  try {
    const body: AiGuideAnswers = await req.json();
    console.log("📥 Petición recibida con filtros:", body);

    // 1. Fetch del inventario y overrides desde Supabase con índice múltiple robusto
    let adminOverrides: Record<string, any> = {};
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*');

    if (error) {
      console.error("❌ Error conectando a Supabase:", error);
    } else if (inventory) {
      for (const item of inventory) {
        const nombre = (item.nombre_perfume || '').trim().toLowerCase();
        const itemId = String(item.id || '').trim().toLowerCase();

        const itemData = {
          ...item,
          active: item.estado !== undefined ? item.estado : true,
          gender: item.genero || '',
          family: item.familia_olfativa || '',
          occasion: item.ocasion || ''
        };

        if (nombre) adminOverrides[nombre] = itemData;
        if (itemId) adminOverrides[itemId] = itemData;
      }
    }

    // 2. Fusionar el catálogo base con Supabase usando búsqueda flexible de coincidencias
    let liveCatalog = catalog.map(p => {
      const pId = (p.id || '').trim().toLowerCase();
      const pName = (p.name || '').trim().toLowerCase();

      // Búsqueda inteligente por ID, por Nombre, o por inclusión parcial (salva los slugs con guiones)
      let override = adminOverrides[pId] || adminOverrides[pName];

      if (!override) {
        const matchedKey = Object.keys(adminOverrides.raw || adminOverrides).find(
          k => k.includes(pId) || pId.includes(k) || k.includes(pName) || pName.includes(k)
        );
        if (matchedKey) override = adminOverrides[matchedKey];
      }

      override = override || {};

      return {
        ...p,
        gender: override.gender !== undefined && override.gender !== '' ? override.gender : p.gender,
        family: override.family !== undefined && override.family !== '' ? override.family : p.family,
        occasions: override.occasion ? [override.occasion] : (override.occasions || p.occasions),
        active: override.active !== undefined ? override.active : true
      };
    });

    // 3. Sistema de puntajes con EXCLUSIÓN ESTRICTA DE GÉNERO (Candado Absoluto)
    let scored = liveCatalog.map(p => {
      let score = 10;

      // --- FILTRO DE GÉNERO ESTRICTO ---
      const ansGenderRaw = (body.gender || '').toUpperCase();
      const pGenderRaw = (p.gender || '').toUpperCase();

      let ansGender = ansGenderRaw.includes('HOMBRE') || ansGenderRaw === 'M' ? 'HOMBRE' : ansGenderRaw.includes('MUJER') || ansGenderRaw === 'F' ? 'MUJER' : ansGenderRaw === 'U' ? 'UNISEX' : ansGenderRaw;
      let pGender = pGenderRaw.includes('HOMBRE') || pGenderRaw === 'M' ? 'HOMBRE' : pGenderRaw.includes('MUJER') || pGenderRaw === 'F' ? 'MUJER' : 'UNISEX';

      if (ansGender && ansGender !== 'UNISEX') {
        if (pGender !== ansGender && pGender !== 'UNISEX') {
          score -= 9999; // EXCLUSIÓN TOTAL: Si pide mujer y es hombre, muere instantáneamente.
        } else {
          score += 100;
        }
      } else {
        score += 40;
      }

      // --- FAMILY NORMALIZATION ---
      let pFamily = p.family?.toLowerCase() || '';
      let ansFamily = (body.noteFamily || '').toUpperCase();

      const familyMappings: Record<string, string[]> = {
        'ORIENTALES/ESPECIADAS': ['oriental', 'especiad', 'ambar', 'ámbar', 'oud', 'arab', 'vainilla'],
        'AMADERADAS': ['amaderad', 'madera', 'cedro', 'sándalo', 'vetiver', 'pachulí', 'amaderada'],
        'CITRICAS': ['citric', 'cítric', 'bergamota', 'limón', 'naranja', 'fresco'],
        'DULCES': ['dulce', 'gourmand', 'vainilla', 'caramelo', 'pralin', 'azúcar'],
        'FRUTALES': ['frutal', 'fruta', 'manzana', 'cereza', 'piña', 'mango', 'durazno'],
        'FLORALES': ['floral', 'flor', 'rosa', 'jazmín', 'iris', 'peonía'],
        'ACUATICAS': ['acuatic', 'acuátic', 'marino', 'mar', 'agua', 'salado'],
        'FRESCO': ['fresco', 'fresca', 'citric', 'acuatic', 'aromatic'],
        'AROMATICO': ['aromatic', 'fresco', 'herbal']
      };

      const familyKeywords = familyMappings[ansFamily] || [ansFamily.toLowerCase()];
      if (ansFamily && (pFamily.includes(ansFamily.toLowerCase()) || familyKeywords.some(k => pFamily.includes(k)))) {
        score += 120;
      }

      // --- OCCASION NORMALIZATION ---
      const ansOccasion = (body.occasion || '').toUpperCase();
      const pOccasions = (p.occasions || []).map(o => o.toLowerCase());
      const pEmotionalDesc = p.emotionalDesc?.toLowerCase() || '';

      const occMapping: Record<string, string[]> = {
        'OFICINA': ['trabajo', 'diario', 'oficina', 'formal', 'casual', 'día', 'profesional'],
        'USO DIARIO': ['diario', 'casual', 'versátil', 'día', 'fresco', 'cotidiano'],
        'CITA ROMATICA': ['cita', 'noche', 'romántic', 'sensual', 'íntim', 'seductor', 'atracción'],
        'EVENTO FORMAL': ['evento', 'noche', 'formal', 'elegante', 'especial', 'lujo', 'gala'],
        'DEPORTE': ['diario', 'verano', 'deporte', 'fresco', 'gym', 'energía', 'vitalidad']
      };

      const occKeywords = occMapping[ansOccasion] || [ansOccasion.toLowerCase()];
      if (ansOccasion && (occKeywords.some(k => pOccasions.some(o => o.includes(k)) || pEmotionalDesc.includes(k)))) {
        score += 60;
      }

      // --- STOCK CHECK ---
      if (p.active === false) {
        score -= 9999;
      }

      return { perfume: p, score };
    });

    // Ordenar y aplicar el filtro estricto (score > 0)
    scored.sort((a, b) => b.score - a.score);

    const validScored = scored.filter(item => item.score > 0 && item.perfume.active !== false);

    const uniquePerfumes: typeof validScored = [];
    const seenIds = new Set<string>();
    for (const item of validScored) {
      if (!seenIds.has(item.perfume.id)) {
        seenIds.add(item.perfume.id);
        uniquePerfumes.push(item);
      }
    }

    let top3 = uniquePerfumes.slice(0, 3).map(x => x.perfume);

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

    console.log("📤 Recomendaciones enviadas:", recommendations.length);
    return NextResponse.json({ recommendations });

  } catch (error) {
    console.error("❌ Error crítico en API de AiGuide:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}