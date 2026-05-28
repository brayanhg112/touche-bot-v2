import type { BotAnswers, Perfume } from './types';
import { catalog } from './catalog';

export interface ScoredPerfume {
  perfume: typeof catalog[0];
  score: number;
  reasons: string[];       // 3 dynamic bullet points
  sommelierSummary: string; // Personalized match summary
  isImmediate: boolean;
  isNicho: boolean;        // Flag for luxury profile tone
}

// ── Occasion labels ─────────────────────────────────────────────────────────

const occasionLabel: Record<string, string> = {
  diario:   'Tu aliada del día a día',
  trabajo:  'Elegante en la oficina',
  cita:     'Hecha para seducir',
  noche:    'Protagonista de la noche',
  evento:   'Brillante en cada evento',
  verano:   'Fresca bajo el sol',
  invierno: 'Cálida en temporada fría',
};

const occasionFriendly: Record<string, string> = {
  diario:   'el día a día',
  trabajo:  'la oficina',
  cita:     'una cita romántica',
  noche:    'una salida nocturna',
  evento:   'un evento especial',
  verano:   'la playa y el verano',
  invierno: 'la temporada fría',
};

const feelFriendly: Record<string, string> = {
  fresco:    'fresco y limpio',
  dulce:     'dulce y envolvente',
  floral:    'floral y romántico',
  amaderado: 'cálido y amaderado',
  especiado: 'especiado y misterioso',
  citrico:   'cítrico y vibrante',
  frutal:    'frutal y alegre',
  oud:       'intenso y oriental',
  acuatico:  'marino y fresco',
  gourmand:  'gourmand y sensual',
};

// ── Dynamic bullet point generators ────────────────────────────────────────

function buildBulletFamily(family: string): string {
  const map: Record<string, string> = {
    oriental:        'Elegancia de la familia Oriental Amaderada',
    floral:          'Corazón de la familia Floral Romántica',
    fresco:          'Frescura de la familia Acuática y Cítrica',
    amaderado:       'Calidez de la familia Amaderada de Lujo',
    chipre:          'Sofisticación de la familia Chipre',
    fougere:         'Energía de la familia Fougère Clásica',
    gourmand:        'Irresistible familia Gourmand',
    arabe:           'Misticismo de la familia Árabe Oriental',
    nicho:           'Exclusividad de la familia Nicho Artesanal',
  };
  const key = family?.toLowerCase().trim() ?? '';
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k)) return v;
  }
  return `Familia ${family ?? 'única'} con carácter propio`;
}

function buildBulletNotes(topNotes: string, heartNotes: string): string {
  if (heartNotes && heartNotes.length > 0) {
    return `Corazón de ${heartNotes.split(',').slice(0, 2).map(n => n.trim()).join(' y ')}`;
  }
  if (topNotes && topNotes.length > 0) {
    return `Apertura de ${topNotes.split(',')[0].trim()}`;
  }
  return 'Composición de alta perfumería';
}

function buildBulletEmotional(feels: string[]): string {
  const emotionMap: Record<string, string> = {
    oud:       'Proyecta un aura de misterio y sofisticación oriental',
    amaderado: 'Transmite elegancia cálida y presencia imponente',
    especiado: 'Evoca sensualidad y carácter indomable',
    fresco:    'Genera una imagen de frescura y confianza',
    dulce:     'Envuelve con una calidez dulce y magnética',
    floral:    'Irradia feminidad, romanticismo y delicadeza',
    citrico:   'Inspira vitalidad, energía y buen humor',
    frutal:    'Transmite alegría, juventud y dinamismo',
    acuatico:  'Evoca libertad, pureza y naturaleza',
    gourmand:  'Seduce con una presencia irresistible y adictiva',
  };
  for (const feel of feels) {
    const label = emotionMap[feel.toLowerCase().trim()];
    if (label) return label;
  }
  return 'Una firma olfativa única e inolvidable';
}

// ── Reference perfume matching ──────────────────────────────────────────────

interface ReferenceMatch {
  found: boolean;
  perfumeName: string;       // The name the user typed
  matchedFamily?: string;    // Family of the reference perfume (if found in catalog)
  matchedNotes?: string[];   // Key notes from the reference perfume
  keywords: string[];        // Extracted keywords for fuzzy matching
}

/**
 * Searches the catalog for the user's reference perfume.
 * If found, extracts its family and principal notes.
 * If not found, extracts keywords from the user input for fuzzy matching.
 */
export function findReferencePerfume(input: string): ReferenceMatch {
  if (!input || input.trim().length === 0) {
    return { found: false, perfumeName: '', keywords: [] };
  }

  const inputLower = input.toLowerCase().trim();
  const perfumeName = input.trim();

  // Try exact or partial name match in catalog
  const match = catalog.find((p) => {
    const pName = p.name.toLowerCase();
    const pBrand = p.brand.toLowerCase();
    return (
      pName.includes(inputLower) ||
      inputLower.includes(pName) ||
      pBrand.includes(inputLower) ||
      inputLower.includes(pBrand)
    );
  });

  if (match) {
    // Extract all principal notes
    const allNotes = [
      ...match.topNotes.split(','),
      ...match.heartNotes.split(','),
      ...match.baseNotes.split(','),
    ].map((n) => n.trim().toLowerCase()).filter(Boolean);

    return {
      found: true,
      perfumeName,
      matchedFamily: match.family,
      matchedNotes: allNotes,
      keywords: [match.family?.toLowerCase() ?? '', ...allNotes].filter(Boolean),
    };
  }

  // Not found in catalog — extract keywords from the user's input for fuzzy matching
  const words = inputLower.split(/\s+/).filter((w) => w.length > 2);
  return {
    found: false,
    perfumeName,
    keywords: words,
  };
}

/**
 * Calculates bonus score (+20) if a perfume shares family or notes
 * with the reference perfume.
 */
function referenceBonus(perfume: typeof catalog[0], ref: ReferenceMatch): number {
  if (!ref.found && ref.keywords.length === 0) return 0;

  // Family match
  if (ref.matchedFamily) {
    const perfFamily = (perfume.family ?? '').toLowerCase().trim();
    const refFamily = ref.matchedFamily.toLowerCase().trim();
    if (perfFamily && refFamily && (perfFamily.includes(refFamily) || refFamily.includes(perfFamily))) {
      return 20;
    }
  }

  // Notes overlap — check if perfume shares any principal notes with the reference
  if (ref.matchedNotes && ref.matchedNotes.length > 0) {
    const perfNotes = [
      ...perfume.topNotes.split(','),
      ...perfume.heartNotes.split(','),
      ...perfume.baseNotes.split(','),
    ].map((n) => n.trim().toLowerCase()).filter(Boolean);

    const sharedNotes = ref.matchedNotes.filter((rn) =>
      perfNotes.some((pn) => pn.includes(rn) || rn.includes(pn))
    );

    if (sharedNotes.length >= 2) return 20;
    if (sharedNotes.length === 1) return 10;
  }

  // Keyword fuzzy match (for perfumes not in catalog)
  if (ref.keywords.length > 0) {
    const perfText = [
      perfume.name, perfume.brand, perfume.family ?? '',
      perfume.topNotes, perfume.heartNotes, perfume.baseNotes,
    ].join(' ').toLowerCase();

    const kwMatches = ref.keywords.filter((kw) => perfText.includes(kw));
    if (kwMatches.length >= 2) return 20;
    if (kwMatches.length === 1) return 10;
  }

  return 0;
}

// ── Main recommendation engine ──────────────────────────────────────────────

export function recommend(answers: BotAnswers, stockMap?: Record<string, boolean>): ScoredPerfume[] {
  // ── Resolve reference perfume ──
  const refMatch = findReferencePerfume(answers.referencePerfume ?? '');

  return catalog
    // ① Gender filter
    .filter((p) => {
      const g = (answers.gender || '').toUpperCase().trim();
      if (g === 'M') return p.gender === 'M' || p.gender === 'U';
      if (g === 'F') return p.gender === 'F' || p.gender === 'U';
      return p.gender === 'U';
    })

    // ② HARD FAIL — avoidTags exclusion
    .filter((p) => {
      if (!answers.avoid || answers.avoid.length === 0) return true;
      if (!p.avoidTags || p.avoidTags.length === 0) return true;
      const avoidLow = answers.avoid.map(a => a.toLowerCase().trim());
      const pTagsLow = p.avoidTags.map(t => t.toLowerCase().trim());
      return !avoidLow.some((a) => pTagsLow.includes(a));
    })

    // ③ HARD LOCK — Versiones 1.1 limitadas sin stock
    .filter((p) => {
      if (p.version === '1.1' && p.isLimited) {
        const isImmediate = stockMap ? stockMap[p.id] === true : p.inStock !== false;
        if (!isImmediate) return false;
      }
      return true;
    })

    // ④ Scoring + dynamic copywriting
    .map((p) => {
      let score = 0;
      const ansOccasion = (answers.occasion || '').toLowerCase().trim();
      const pOccasionsLow = (p.occasions || []).map(o => o.toLowerCase().trim());
      const ansFeelLow = (answers.feel || []).map(f => f.toLowerCase().trim());
      const pFeelsLow = (p.feels || []).map(f => f.toLowerCase().trim());

      // Occasion match (+20pts)
      if (ansOccasion && pOccasionsLow.includes(ansOccasion)) {
        score += 20;
      }

      // Feel/vibe match (+15pts each, up to 3)
      const feelMatches = ansFeelLow.filter((f) => pFeelsLow.includes(f));
      feelMatches.slice(0, 3).forEach(() => { score += 15; });

      // Projection alignment (+12pts)
      if (answers.projection) {
        const projMap: Record<string, number> = { discreta: 2, moderada: 3, intensa: 5 };
        const desired = projMap[answers.projection.toLowerCase().trim()] ?? 3;
        const diff = Math.abs(p.intensity - desired);
        if (diff === 0) score += 12;
        else if (diff === 1) score += 6;
      }

      // Sweetness alignment (+10pts)
      const sweetnessDesired = ansFeelLow.includes('dulce') || ansFeelLow.includes('gourmand') ? 4
        : ansFeelLow.includes('fresco') || ansFeelLow.includes('citrico') ? 1 : 3;
      const sweetnessDiff = Math.abs(p.sweetness - sweetnessDesired);
      if (sweetnessDiff === 0) score += 10;
      else if (sweetnessDiff === 1) score += 5;

      // Freshness alignment (+10pts)
      const freshnessDesired = ansFeelLow.includes('fresco') || ansFeelLow.includes('acuatico') || ansFeelLow.includes('citrico') ? 4 : 2;
      const freshnessDiff = Math.abs(p.freshness - freshnessDesired);
      if (freshnessDiff === 0) score += 10;
      else if (freshnessDiff === 1) score += 5;

      // Reference perfume similarity bonus (+20pts max)
      const refBonus = referenceBonus(p, refMatch);
      score += refBonus;

      const isImmediate = stockMap ? stockMap[p.id] === true : p.inStock !== false;
      const isNicho = p.version === '1.1' || (p.family ?? '').toLowerCase().includes('nicho');

      // ── Dynamic bullet points ────────────────────────────────────────────
      const reasons: string[] = [
        buildBulletFamily(p.family ?? ''),
        buildBulletNotes(p.topNotes, p.heartNotes),
        buildBulletEmotional(ansFeelLow.length > 0 ? ansFeelLow : pFeelsLow),
      ];

      // Bonus bullet for 1.1 stock
      if (p.version === '1.1' && isImmediate) {
        reasons.unshift('✦ Disponible en versión 1.1 de alta calidad — unidades muy limitadas 🔥');
        reasons.splice(4); // max 4 bullets
      }

      // ── Personalized sommelier summary ──────────────────────────────────
      const feelWord = ansFeelLow.length > 0
        ? feelFriendly[ansFeelLow[0]] ?? ansFeelLow[0]
        : 'especial';
      const occasionWord = occasionFriendly[ansOccasion] ?? ansOccasion;
      const heartNote = p.heartNotes?.split(',')[0]?.trim() ?? 'sus notas únicas';

      // Build sommelier summary — include reference perfume mention if provided
      let sommelierSummary: string;
      if (answers.referencePerfume && refBonus > 0) {
        sommelierSummary = `${answers.name || 'Tú'}, como me contaste que te gusta ${answers.referencePerfume}, elegí ${p.name} porque comparten esa esencia ${feelWord} que tanto buscas — su corazón de ${heartNote} lo confirma.`;
      } else {
        sommelierSummary = `${answers.name || 'Tú'}, este ${p.name} es tu match perfecto porque buscabas algo ${feelWord} para ${occasionWord} y esta fragancia destaca por su corazón de ${heartNote}.`;
      }

      return { perfume: p, score, reasons, sommelierSummary, isImmediate, isNicho };
    })

    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const a11 = a.perfume.version === '1.1' ? 1 : 0;
      const b11 = b.perfume.version === '1.1' ? 1 : 0;
      return b11 - a11;
    })
    .slice(0, 3);
}

// ── WhatsApp message builders ───────────────────────────────────────────────

/** Per-perfume link (one button per card) */
export function buildWhatsappPerPerfume(userName: string, perfumeName: string, brandName: string): string {
  const text = `Hola Brayan, soy ${userName} 🌸 Aria me recomendó ${perfumeName} de ${brandName} y quiero pedirlo. ¿Me puedes mostrar enseguidita para ensayarlo en mi piel? 😍`;
  return `https://wa.me/573136876673?text=${encodeURIComponent(text)}`;
}

/** Summary link (footer CTA with all 3) */
export function buildWhatsappSummary(userName: string, top3: ScoredPerfume[]): string {
  const names = top3.map((r) => `${r.perfume.name} de ${r.perfume.brand}`).join(', ');
  const text = `Hola Brayan, soy ${userName} 🌸 Aria me recomendó estas fragancias: ${names}. ¿Me puedes mostrar enseguidita para ensayarlas en mi piel? 😍`;
  return `https://wa.me/573136876673?text=${encodeURIComponent(text)}`;
}

// ── Dynamic Sommelier Summary ────────────────────────────────────────────────

/**
 * Generates a unique, personalized match paragraph for each perfume card.
 * Accepts the full BotAnswers object to cross-reference what the client
 * specifically asked for (feel, occasion) against the perfume's actual notes.
 * Each rank uses a completely different sentence structure.
 */
export function buildSommelierSummary(answers: BotAnswers, perfume: Perfume, rank: number): string {
  const refMatch = findReferencePerfume(answers.referencePerfume ?? '');
  const firstName = answers.name?.trim() || 'tú';

  // ── Pick the most relevant note from the perfume that matches what client asked ──
  const askedFeels = (answers.feel || []).map(f => f.toLowerCase().trim());
  const allNotes = [
    ...perfume.topNotes.split(','),
    ...perfume.heartNotes.split(','),
    ...perfume.baseNotes.split(','),
  ].map(n => n.trim()).filter(Boolean);

  // Note matching map: feel keyword → note keywords to look for
  const feelToNoteKeywords: Record<string, string[]> = {
    dulce:     ['vainilla', 'caramelo', 'miel', 'cacao', 'praline', 'tonka'],
    fresco:    ['bergamota', 'limón', 'pepino', 'menta', 'té verde', 'aloe'],
    floral:    ['jazmín', 'rosa', 'nardo', 'iris', 'ylang', 'lirio', 'peony'],
    amaderado: ['sándalo', 'cedro', 'palo santo', 'vetiver', 'guayaco'],
    especiado: ['canela', 'cardamomo', 'pimienta', 'clavo', 'nuez moscada'],
    citrico:   ['bergamota', 'limón', 'naranja', 'pomelo', 'mandarina'],
    frutal:    ['manzana', 'pera', 'melocotón', 'frambuesa', 'frutos rojos'],
    oud:       ['oud', 'incienso', 'resina', 'ámbar', 'mirra'],
    acuatico:  ['algas', 'sal marina', 'agua', 'ozone', 'brisa'],
    gourmand:  ['vainilla', 'azúcar', 'cacao', 'helado', 'caramelo'],
  };

  // Find best matching note for the client's feel profile
  let matchingNote = allNotes[0] ?? 'sus notas características'; // default fallback
  for (const feel of askedFeels) {
    const keywords = feelToNoteKeywords[feel] ?? [];
    const found = allNotes.find(note =>
      keywords.some(kw => note.toLowerCase().includes(kw))
    );
    if (found) { matchingNote = found; break; }
  }

  // ── Occasion phrasing ──
  const occasionFriendlyLocal: Record<string, string> = {
    diario:   'el día a día',
    trabajo:  'la oficina',
    cita:     'una cita romántica',
    noche:    'una salida nocturna',
    evento:   'un evento especial',
    verano:   'la playa y el verano',
    invierno: 'la temporada fría',
  };
  const occasionWord = occasionFriendlyLocal[answers.occasion ?? ''] ?? answers.occasion ?? 'tu estilo';

  // ── Feel phrasing ──
  const feelFriendlyLocal: Record<string, string> = {
    fresco: 'fresco y limpio', dulce: 'dulce y envolvente', floral: 'floral y romántico',
    amaderado: 'cálido y amaderado', especiado: 'especiado y misterioso',
    citrico: 'cítrico y vibrante', frutal: 'frutal y alegre', oud: 'intenso y oriental',
    acuatico: 'marino y fresco', gourmand: 'gourmand y sensual',
  };
  const feelWord = askedFeels.length > 0
    ? (feelFriendlyLocal[askedFeels[0]] ?? askedFeels[0])
    : 'especial';

  // ── emotionalDesc — first sentence only ──
  const impact = perfume.emotionalDesc.split('.')[0]?.trim() ?? perfume.emotionalDesc;

  // ── Reference perfume mention ──
  const hasRef = answers.referencePerfume && answers.referencePerfume.trim().length > 0;
  const refName = answers.referencePerfume?.trim() ?? '';
  const refBonusVal = referenceBonus(perfume as unknown as typeof catalog[0], refMatch);

  // ── Rank variations — each structurally different ──
  if (rank === 1) {
    if (hasRef && refBonusVal > 0) {
      return `${firstName}, como me contaste que te encanta **${refName}**, elegí ${perfume.name} como tu #1 porque comparten esa esencia ${feelWord} que tanto buscas — su nota de **${matchingNote}** es ese punto de conexión. ${impact}.`;
    }
    return `${firstName}, elegí ${perfume.name} como #1 porque buscabas algo ${feelWord} para ${occasionWord} — y su nota de **${matchingNote}** es exactamente ese punto de conexión. ${impact}.`;
  }

  if (rank === 2) {
    if (hasRef && refBonusVal > 0) {
      return `Aquí viene tu sorpresa, ${firstName}: si ${refName} te conquistó, la nota de **${matchingNote}** en ${perfume.name} te va a fascinar aún más. ${impact}. Una firma que te va a seguir sorprendiendo con el paso de las horas.`;
    }
    return `Aquí viene tu sorpresa, ${firstName}: la nota de **${matchingNote}** en ${perfume.name} responde directo a lo ${feelWord} que pediste, pero con una profundidad que va más allá. ${impact}. Una firma que te va a seguir sorprendiendo con el paso de las horas.`;
  }

  // Rank 3 — emotional/narrative: story-driven closing
  if (hasRef && refBonusVal > 0) {
    return `Para cerrar con broche de oro, ${firstName}: ${perfume.name}. Si te enamoró ${refName}, su **${matchingNote}** lleva esa misma magia a otra dimensión. ${impact}. Este es el tipo de fragancia que la gente te pregunta por nombre.`;
  }
  return `Para cerrar con broche de oro, ${firstName}: ${perfume.name}. Si algo de ${feelWord} resonó contigo, su **${matchingNote}** lo lleva a otra dimensión. ${impact}. Este es el tipo de fragancia que la gente te pregunta por nombre.`;
}
