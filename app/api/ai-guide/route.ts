import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { catalog } from '../../lib/catalog';
import type { AiGuideAnswers, AiGuideResult, AiGuideOccasion, AiGuideExpression, AiGuideNoteFamily } from '../../lib/aiGuideTypes';

export async function POST(req: Request) {
  try {
    const body: AiGuideAnswers = await req.json();

    // 1. Read inventory
    let stockMap: Record<string, boolean> = {};
    try {
      const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');
      if (fs.existsSync(inventoryPath)) {
        const raw = fs.readFileSync(inventoryPath, 'utf-8');
        const inventory = JSON.parse(raw);
        for (const item of Object.values(inventory) as any) {
          stockMap[item.id] = item.active;
        }
      }
    } catch (e) {
       console.error("No se pudo leer inventory.json en AiGuide:", e);
    }

    // 2. Filter logic based on choices (simplified vs full bot)
    let scored = catalog.map(p => {
        let score = 0;
        
        // -- FAMILY MATCHING --
        let pFamily = p.family?.toLowerCase() || '';
        let ansFamily = body.noteFamily || '';
        
        const familyMappings: Record<string, string[]> = {
            'orientales': ['oriental', 'especiad'],
            'frutales': ['frutal'],
            'florales': ['floral'],
            'frescos': ['fresco'],
            'amaderados': ['amaderado'],
            'citricos': ['citric'],
            'aromaticas': ['aromatic'],
            'acuaticos': ['acuatic'],
            'oud': ['oud']
        };

        if (ansFamily && familyMappings[ansFamily]?.some(k => pFamily.includes(k))) score += 50;
        
        // -- OCCASION MATCHING --
        const ansOccasion = body.occasion || '';
        const occMapping: Record<string, string[]> = {
            'oficina': ['trabajo', 'diario'],
            'uso-diario': ['diario'],
            'cita-romantica': ['cita', 'noche'],
            'evento-formal': ['evento', 'noche'],
            'deporte': ['diario', 'verano']
        };

        const occKeywords = occMapping[ansOccasion] || [];
        const pOccasionsLow = (p.occasions || []).map(o => o.toLowerCase());
        if (ansOccasion && occKeywords.some(k => pOccasionsLow.includes(k))) {
            score += 30;
        }

        // -- EXPRESSION / FEEL MATCHING --
        const ansExpression = body.expression || '';
        const feelMapping: Record<string, string[]> = {
             'elegancia': ['amaderado', 'fresco', 'especiado', 'oud'],
             'sensualidad': ['especiado', 'oud', 'dulce', 'gourmand'],
             'frescura': ['fresco', 'acuatico', 'citrico'],
             'exito': ['amaderado', 'especiado', 'oud']
        };
        
        const pFeelsLow = (p.feels || []).map(f => f.toLowerCase());
        if (ansExpression && feelMapping[ansExpression]?.some(f => pFeelsLow.includes(f))) {
            score += 20;
        }

        // Boost for 1.1 version
        if (p.version === '1.1') score += 10; 

        // -- STOCK HANDLING --
        // In local logic, 'inStock' is primarily driven by inventory.json `active` flag
        const isActive = stockMap[p.id] === true; 
        
        // Strict guardrail: Prevent recommending any perfume not present or inactive in the active inventory
        if (!isActive) {
            score -= 500; // Hard fail
        }

        return { perfume: p, score };
    }).filter(x => x.score > -50); // Remove hardcore negative scores

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Dedup and extract top 3
    const uniquePerfumes: typeof scored = [];
    const seenIds = new Set<string>();
    
    for (const item of scored) {
        if (!seenIds.has(item.perfume.id)) {
            seenIds.add(item.perfume.id);
            uniquePerfumes.push(item);
        }
    }

    let top3 = uniquePerfumes.slice(0, 3).map(x => x.perfume);

    // -- PLAN B FALLBACK --
    // If strict filtering yields fewer than 3 results, relax stock constraints to find closest matches
    if (top3.length < 3) {
      const relaxed = catalog.map(p => {
          let score = 0;
          let pFamily = p.family?.toLowerCase() || '';
          let ansFamily = body.noteFamily || '';
          const familyMappings: Record<string, string[]> = {
              'orientales': ['oriental', 'especiad'],
              'frutales': ['frutal'],
              'florales': ['floral'],
              'frescos': ['fresco'],
              'amaderados': ['amaderado'],
              'citricos': ['citric'],
              'aromaticas': ['aromatic'],
              'acuaticos': ['acuatic'],
              'oud': ['oud']
          };
          if (ansFamily && familyMappings[ansFamily]?.some(k => pFamily.includes(k))) score += 50;
          
          const ansOccasion = body.occasion || '';
          const occMapping: Record<string, string[]> = {
              'oficina': ['trabajo', 'diario'],
              'uso-diario': ['diario'],
              'cita-romantica': ['cita', 'noche'],
              'evento-formal': ['evento', 'noche'],
              'deporte': ['diario', 'verano']
          };
          const occKeywords = occMapping[ansOccasion] || [];
          const pOccasionsLow = (p.occasions || []).map(o => o.toLowerCase());
          if (ansOccasion && occKeywords.some(k => pOccasionsLow.includes(k))) score += 30;

          const ansExpression = body.expression || '';
          const feelMapping: Record<string, string[]> = {
               'elegancia': ['amaderado', 'fresco', 'especiado', 'oud'],
               'sensualidad': ['especiado', 'oud', 'dulce', 'gourmand'],
               'frescura': ['fresco', 'acuatico', 'citrico'],
               'exito': ['amaderado', 'especiado', 'oud']
          };
          const pFeelsLow = (p.feels || []).map(f => f.toLowerCase());
          if (ansExpression && feelMapping[ansExpression]?.some(f => pFeelsLow.includes(f))) score += 20;

          if (p.version === '1.1') score += 10;
          // NO STOCK PENALTY HERE for fallback

          return { perfume: p, score };
      }).filter(x => x.score > 0);

      relaxed.sort((a, b) => b.score - a.score);

      for (const item of relaxed) {
        if (top3.length >= 3) break;
        if (!top3.some(t => t.id === item.perfume.id)) {
            top3.push(item.perfume);
        }
      }
    }

    const recommendations = top3.map(p => {
         return {
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
         } as AiGuideResult;
    });

    return NextResponse.json({ recommendations: top3 });
  } catch (error) {
    console.error("Error en API de AiGuide:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
