import { NextResponse } from 'next/server';
import { catalog } from '../../lib/catalog';
import { supabase } from '@/lib/supabase';
import type { AiGuideAnswers, AiGuideResult } from '../../lib/aiGuideTypes';

export async function POST(req: Request) {
  try {
    const body: AiGuideAnswers = await req.json();
    console.log("📥 Petición recibida con filtros:", body);

    // 1. Fetch del inventario directo desde Supabase (Fuente de Verdad en la Nube)
    let adminOverrides: Record<string, any> = {};
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*');

    if (error) {
      console.error("❌ Error conectando a Supabase:", error);
    } else if (inventory) {
      for (const item of inventory) {
        // Manejamos de forma segura el nombre sin rompernos con IDs numéricos
        const nombre = item.nombre_perfume || item.name || '';
        const key = String(nombre).trim().toLowerCase();
        if (key) {
          adminOverrides[key] = {
            ...item,
            active: item.estado !== undefined ? item.estado : (item.active !== undefined ? item.active : true),
            gender: item.genero || item.gender,
            family: item.familia_olfativa || item.family,
            occasion: item.ocasion || item.occasion
          };
        }
      }
    }

    // 2. Fusionar el catálogo base con los datos reales de Supabase
    let liveCatalog = catalog.map(p => {
      const pId = p.id?.trim().toLowerCase() || '';
      const pName = p.name?.trim().toLowerCase() || '';
      const override = adminOverrides[pId] || adminOverrides[pName] || {};

      return {
        ...p,
        gender: override.gender || p.gender,
        family: override.family || p.family,
        occasions: override.occasion ? [override.occasion] : p.occasions,
        active: override.active !== undefined ? override.active : true
      };
    });

    // 3. Sistema de puntajes flexible y robusto (Evita bloqueos en ceros)
    let scored = liveCatalog.map(p => {
      let score = 50;

      // --- FILTRO DE GÉNERO FLEXIBLE ---
      const ansGenderRaw = (body.gender || '').toUpperCase();
      const pGenderRaw = (p.gender || '').toUpperCase();

      let ansGender = ansGenderRaw.includes('HOMBRE') || ansGenderRaw === 'M' ? 'HOMBRE' : ansGenderRaw.includes('MUJER') || ansGenderRaw === 'F' ? 'MUJER' : 'UNISEX';
      let pGender = pGenderRaw.includes('HOMBRE') || pGenderRaw === 'M' ? 'HOMBRE' : pGenderRaw.includes('MUJER') || pGenderRaw === 'F' ? 'MUJER' : 'UNISEX';

      if (ansGender !== 'UNISEX' && pGender !== 'UNISEX' && pGender !== ansGender) {
        score -= 25; // Penalización leve en lugar de exclusión total
      } else if (ansGender === pGender || pGender === 'UNISEX') {
        score += 50;
      }

      // --- FAMILIA OLFATIVA ---
      let pFamily = p.family?.toLowerCase() || '';
      let ansFamily = (body.noteFamily || '').toUpperCase();
      if (ansFamily && pFamily.includes(ansFamily.toLowerCase())) {
        score += 80;
      }

      // --- OCASIÓN ---
      const ansOccasion = (body.occasion || '').toUpperCase();
      const pOccasions = (p.occasions || []).map(o => o.toLowerCase());
      if (ansOccasion && pOccasions.some(o => o.includes(ansOccasion.toLowerCase()))) {
        score += 40;
      }

      // --- STOCK CHECK ---
      if (p.active === false) {
        score = -999;
      }

      return { perfume: p, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Filtro limpio con red de seguridad para NUNCA retornar vacío
    let validScored = scored.filter(item => item.score > 0 && item.perfume.active !== false);

    if (validScored.length === 0) {
      validScored = scored.filter(item => item.perfume.active !== false).slice(0, 3);
    }

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