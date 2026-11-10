import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { catalog } from '../../lib/catalog';
import { supabase } from '@/lib/supabase';
import { TOUCHE_INSIGNIA_AI_RESULTS } from '../../lib/insignia';
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

const formatTitle = (str: string) => {
  if (!str) return '';
  return str
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface InventoryItemRaw {
  id?: string;
  name?: string;
  nombre_perfume?: string;
  genero?: string;
  gender?: string;
  familia_olfativa?: string;
  olfactory_family?: string;
  family?: string;
  ocasion?: string;
  occasion?: string;
  intensidad?: string;
  intensity?: string;
  estado?: boolean;
  active?: boolean;
  tipo?: string;
  version?: string;
}

export async function POST(req: Request) {
  try {
    const body: AiGuideAnswers = await req.json();
    console.log("📥 [AI-GUIDE] Payload recibido del cliente:", JSON.stringify(body, null, 2));

    // 1. Cargar inventario resiliente (Supabase con fallback local inmediato)
    let rawInventory: InventoryItemRaw[] = [];

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*');

      if (!error && Array.isArray(data) && data.length > 0) {
        rawInventory = data;
        console.log(`✅ [AI-GUIDE] ${data.length} ítems cargados desde Supabase.`);
      } else if (error) {
        console.warn("⚠️ [AI-GUIDE] Supabase reportó error, activando respaldo local:", error.message);
      }
    } catch (supaErr) {
      console.warn("⚠️ [AI-GUIDE] Conexión a Supabase no disponible, usando inventario local.");
    }

    // Fallback a data/inventory.json si Supabase no entregó datos
    if (rawInventory.length === 0) {
      try {
        const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');
        if (fs.existsSync(inventoryPath)) {
          const fileRaw = fs.readFileSync(inventoryPath, 'utf-8');
          const parsed = JSON.parse(fileRaw);
          rawInventory = Object.values(parsed);
          console.log(`✅ [AI-GUIDE] ${rawInventory.length} ítems cargados desde data/inventory.json.`);
        }
      } catch (fileErr) {
        console.error("❌ [AI-GUIDE] Error leyendo inventario local:", fileErr);
      }
    }

    // Si aún está vacío, usar el catálogo en memoria directamente
    if (rawInventory.length === 0) {
      console.warn("⚠️ [AI-GUIDE] Usando catálogo en memoria como inventario base.");
      rawInventory = catalog.map(p => ({
        id: p.id,
        name: p.name,
        genero: p.gender === 'M' ? 'HOMBRE' : p.gender === 'F' ? 'MUJER' : 'UNISEX',
        familia_olfativa: p.family,
        ocasion: p.occasions?.[0] || 'USO DIARIO',
        intensidad: 'MEDIA',
        active: true,
        version: p.version || 'ESTANDAR'
      }));
    }

    // Filtrar activos
    const activeInventory = rawInventory.filter(item =>
      item.estado === true || item.active === true || (item.estado === undefined && item.active === undefined)
    );

    const itemsToProcess = activeInventory.length > 0 ? activeInventory : rawInventory;

    // 2. Construir mapa rápido de catálogo para enriquecer notas, descripción, marca, etc.
    const catalogMapById = new Map<string, typeof catalog[0]>();
    const catalogMapByName = new Map<string, typeof catalog[0]>();

    catalog.forEach(p => {
      catalogMapById.set(sanitize(p.id), p);
      catalogMapByName.set(sanitize(p.name), p);
    });

    const findCatalogMatch = (rawId: string, rawName: string) => {
      const cleanId = sanitize(rawId);
      const cleanName = sanitize(rawName);

      // Descomponer "perfume---marca"
      const idParts = rawId.split('---');
      const nameParts = rawName.split('---');
      const perfumeIdPart = sanitize(idParts[0]);
      const perfumeNamePart = sanitize(nameParts[0]);

      if (catalogMapById.has(cleanId)) return catalogMapById.get(cleanId);
      if (catalogMapById.has(perfumeIdPart)) return catalogMapById.get(perfumeIdPart);
      if (catalogMapByName.has(cleanName)) return catalogMapByName.get(cleanName);
      if (catalogMapByName.has(perfumeNamePart)) return catalogMapByName.get(perfumeNamePart);

      // Búsqueda difusa en el catálogo
      return catalog.find(p => {
        const pId = sanitize(p.id);
        const pName = sanitize(p.name);
        return (
          pId === perfumeIdPart ||
          pName === perfumeNamePart ||
          cleanName.includes(pId) ||
          cleanName.includes(pName) ||
          (perfumeIdPart && (pId.includes(perfumeIdPart) || perfumeIdPart.includes(pId))) ||
          (perfumeNamePart && (pName.includes(perfumeNamePart) || perfumeNamePart.includes(pName)))
        );
      });
    };

    // 3. Normalizar catálogo unificado
    const unifiedCatalog = itemsToProcess.map(item => {
      const rawId = String(item.id || '');
      const rawName = String(item.nombre_perfume || item.name || rawId);
      const matched = findCatalogMatch(rawId, rawName);

      // Extraer nombre y marca limpios
      let displayName = matched?.name;
      let displayBrand = matched?.brand;

      if (!displayName) {
        const parts = rawName.split('---');
        displayName = formatTitle(parts[0]) || 'Fragancia Exclusiva';
        displayBrand = parts[1] ? formatTitle(parts[1]) : 'Touche Essencielle';
      }

      // Normalizar notas a string
      const topNotes = matched?.topNotes || 'Notas cítricas y aromáticas de apertura';
      const heartNotes = matched?.heartNotes || 'Acorde envolvente de corazón floral y maderas';
      const baseNotes = matched?.baseNotes || 'Fondo aterciopelado de fijación prolongada';
      const emotionalDesc = matched?.emotionalDesc || 'Una creación única y cautivadora que resalta tu presencia con elegancia atemporal.';

      const genderRaw = String(item.genero || item.gender || matched?.gender || 'UNISEX').toUpperCase();
      let normalizedGender = 'UNISEX';
      if (genderRaw.includes('HOMBRE') || genderRaw === 'M' || genderRaw === 'H' || genderRaw.includes('CABALLERO')) {
        normalizedGender = 'HOMBRE';
      } else if (genderRaw.includes('MUJER') || genderRaw === 'F' || genderRaw === 'DAMA') {
        normalizedGender = 'MUJER';
      }

      const rawFamily = String(item.familia_olfativa || item.olfactory_family || item.family || matched?.family || 'Amaderado');
      const rawOccasion = String(item.ocasion || item.occasion || matched?.occasions?.[0] || 'USO DIARIO');
      const rawIntensity = String(item.intensidad || item.intensity || 'MEDIA');
      const version = String(item.tipo || item.version || matched?.version || 'ESTANDAR').toUpperCase();

      return {
        id: rawId || sanitize(displayName),
        name: displayName,
        brand: displayBrand || 'Touche Essencielle',
        family: rawFamily,
        topNotes,
        heartNotes,
        baseNotes,
        emotionalDesc,
        version: version.includes('1.1') ? '1.1' : 'ESTANDAR',
        gender: normalizedGender,
        occasion: rawOccasion,
        intensity: rawIntensity,
        feels: matched?.feels || [],
        occasions: matched?.occasions || [rawOccasion]
      };
    });

    // 4. Normalizar respuestas del usuario
    const ansGenderRaw = String(body.gender || '').toUpperCase();
    let ansGender = 'UNISEX';
    if (ansGenderRaw.includes('HOMBRE') || ansGenderRaw === 'M' || ansGenderRaw.includes('CABALLERO')) {
      ansGender = 'HOMBRE';
    } else if (ansGenderRaw.includes('MUJER') || ansGenderRaw === 'F' || ansGenderRaw.includes('DAMA')) {
      ansGender = 'MUJER';
    }

    const rawInputFamily = (body.noteFamily || body.family || (body as any).familia || (body as any).olfactiveFamily || '').toString();
    const normInputFamily = normalizeText(rawInputFamily);

    let resolvedFamilyKey = normInputFamily;
    if (normInputFamily.includes('oriental') || normInputFamily.includes('especiad')) resolvedFamilyKey = 'orientales/especiadas';
    else if (normInputFamily.includes('amaderad')) resolvedFamilyKey = 'amaderadas';
    else if (normInputFamily.includes('citric')) resolvedFamilyKey = 'citricas';
    else if (normInputFamily.includes('dulce') || normInputFamily.includes('gourmand')) resolvedFamilyKey = 'dulces';
    else if (normInputFamily.includes('frutal')) resolvedFamilyKey = 'frutales';
    else if (normInputFamily.includes('floral')) resolvedFamilyKey = 'florales';
    else if (normInputFamily.includes('acuatica') || normInputFamily.includes('marino')) resolvedFamilyKey = 'acuaticas';

    // Mapeo exhaustivo de palabras clave por familia
    const familyKeywordsMap: Record<string, string[]> = {
      'orientales/especiadas': ['oriental', 'especiad', 'ambar', 'oud', 'arab', 'vainilla', 'incienso', 'resina', 'canela', 'azafran', 'cuero'],
      'amaderadas': ['amaderad', 'madera', 'cedro', 'sandalo', 'vetiver', 'pachuli', 'guayaco', 'fougere', 'bosque'],
      'citricas': ['citric', 'bergamota', 'limon', 'naranja', 'mandarina', 'pomelo', 'fresco', 'neroli'],
      'dulces': ['dulce', 'gourmand', 'vainilla', 'caramelo', 'pralin', 'azucar', 'miel', 'tonka', 'cacao', 'chocolate'],
      'frutales': ['frutal', 'fruta', 'manzana', 'pera', 'durazno', 'cereza', 'maracuya', 'frambuesa', 'frutos', 'pina', 'mango', 'lorenzo'],
      'florales': ['floral', 'flor', 'rosa', 'jazmin', 'iris', 'peonia', 'nardo', 'violeta', 'lavanda', 'ylang', 'orquidea'],
      'acuaticas': ['acuatic', 'marino', 'mar', 'agua', 'sal', 'ozono', 'brisa', 'ocean', 'fresco'],
    };

    const targetKeywords = familyKeywordsMap[resolvedFamilyKey] || [resolvedFamilyKey];

    // Familias afines para fallback parcial
    const relatedChordsMap: Record<string, string[]> = {
      'orientales/especiadas': ['dulce', 'amaderad', 'oud', 'ambar'],
      'amaderadas': ['oriental', 'especiad', 'fresco', 'fougere'],
      'citricas': ['acuatic', 'fresco', 'aromatic', 'verde'],
      'dulces': ['oriental', 'frutal', 'ambar', 'floral'],
      'frutales': ['dulce', 'floral', 'citric', 'fresco'],
      'florales': ['frutal', 'dulce', 'ambar', 'fresco'],
      'acuaticas': ['citric', 'fresco', 'aromatic', 'amaderad'],
    };
    const relatedKeywords = relatedChordsMap[resolvedFamilyKey] || [];

    const normOccasion = normalizeText(body.occasion || '');

    // 5. Algoritmo de Coincidencia Flexible y Fallback Multi-Nivel
    interface ScoredItem {
      perfume: typeof unifiedCatalog[0];
      score: number;
      tier: number; // 1 = Match estricto, 2 = Match parcial/notas, 3 = Match por género/1.1
    }

    const scoredItems: ScoredItem[] = [];

    for (const p of unifiedCatalog) {
      // Compatibilidad de género
      const matchesGender =
        ansGender === 'UNISEX' ||
        p.gender === 'UNISEX' ||
        p.gender === ansGender;

      if (!matchesGender) continue;

      const pFamilyNorm = normalizeText(p.family);
      const pNotesNorm = normalizeText(`${p.topNotes} ${p.heartNotes} ${p.baseNotes} ${p.emotionalDesc}`);
      const pOccasionNorm = normalizeText(`${p.occasion} ${(p.occasions || []).join(' ')}`);

      // Match directo de familia
      const isDirectFamilyMatch =
        targetKeywords.some(kw => pFamilyNorm.includes(kw) || kw.includes(pFamilyNorm));

      // Match en notas olfativas
      const isNotesFamilyMatch =
        targetKeywords.some(kw => pNotesNorm.includes(kw));

      // Match en acordes afines (para fallback flexible)
      const isRelatedChordMatch =
        relatedKeywords.some(kw => pFamilyNorm.includes(kw) || pNotesNorm.includes(kw));

      // Match de ocasión
      const isOccasionMatch = normOccasion ? pOccasionNorm.includes(normOccasion) || normOccasion.includes(pOccasionNorm) : false;

      let score = 0;
      let tier = 3;

      if (isDirectFamilyMatch) {
        score += 5000;
        tier = 1;
      } else if (isNotesFamilyMatch) {
        score += 3000;
        tier = 1;
      } else if (isRelatedChordMatch) {
        score += 1500;
        tier = 2;
      } else {
        score += 500;
        tier = 3;
      }

      // Bonus por versión 1.1 exclusiva
      if (p.version === '1.1') score += 1500;

      // Bonus por ocasión
      if (isOccasionMatch) score += 600;

      // Bonus por género exacto (vs unisex)
      if (ansGender !== 'UNISEX' && p.gender === ansGender) score += 400;

      scoredItems.push({ perfume: p, score, tier });
    }

    // Ordenar por nivel (Tier ascendente) y puntaje descendente
    scoredItems.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return b.score - a.score;
    });

    // Desduplicar manteniendo el mejor resultado
    const selected: typeof unifiedCatalog = [];
    const seenNames = new Set<string>();

    for (const item of scoredItems) {
      const cleanKey = sanitize(item.perfume.name);
      if (!seenNames.has(cleanKey)) {
        seenNames.add(cleanKey);
        selected.push(item.perfume);
      }
      if (selected.length === 3) break;
    }

    // 6. Respaldo Final Garantizado: Touche Essencielle Insignia ("Nuit de Marbre", "Oud Céleste", "Rose Impériale")
    // Si aún con búsqueda relajada faltan puestos, se completan con las fragancias insignia para que NUNCA quede vacía
    if (selected.length < 3) {
      console.log(`ℹ️ [AI-GUIDE] Activando respaldo insignia de Touche Essencielle. Cupos actuales: ${selected.length}/3`);
      for (const insignia of TOUCHE_INSIGNIA_AI_RESULTS) {
        const cleanKey = sanitize(insignia.name);
        if (!seenNames.has(cleanKey)) {
          seenNames.add(cleanKey);
          selected.push({
            id: insignia.id,
            name: insignia.name,
            brand: insignia.brand,
            family: insignia.family,
            topNotes: insignia.topNotes,
            heartNotes: insignia.heartNotes,
            baseNotes: insignia.baseNotes,
            emotionalDesc: insignia.emotionalDesc,
            version: insignia.version || '1.1',
            gender: 'UNISEX',
            occasion: 'EVENTO FORMAL',
            intensity: 'ALTA',
            feels: ['amaderado', 'oud', 'floral'],
            occasions: ['evento', 'noche', 'cita', 'diario']
          });
        }
        if (selected.length === 3) break;
      }
    }

    const recommendations: AiGuideResult[] = selected.slice(0, 3).map(p => ({
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
    }));

    console.log("🏆 [AI-GUIDE FINAL] Revelaciones entregadas con éxito:", recommendations.map(r => `${r.name} (${r.brand})`));

    return NextResponse.json({ recommendations });

  } catch (error) {
    console.error("❌ [AI-GUIDE] Error inesperado en API:", error);
    // En caso de excepción crítica, responder siempre con las fragancias insignia de Touche Essencielle
    return NextResponse.json({ recommendations: TOUCHE_INSIGNIA_AI_RESULTS });
  }
}
