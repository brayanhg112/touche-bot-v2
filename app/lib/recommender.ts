import type { BotAnswers, Feel, Perfume } from './types';
import { catalog } from './catalog';
import type { PerfumeSheetRow } from './sheets';
import { resolveProductImageUrl } from './productImages';

export type SheetInventoryItem = PerfumeSheetRow;

export interface ScoredPerfume {
  perfume: Perfume;
  score: number;
  reasons: string[];
  sommelierSummary: string;
  isImmediate: boolean;
  isNicho: boolean;
  isFallback?: boolean;
  cascadeLevel?: 1 | 2 | 3 | 4;
}

// ── BLOQUE 4: Normalización de texto en el motor de matching ──────────────────

const BRAND_TYPOS: Record<string, string> = {
  lataffa: 'Lattafa',
  lattafa: 'Lattafa',
  mochino: 'Moschino',
  'katty-perry': 'Katy Perry',
  'al-hamarain': 'Al Haramain',
  'dolce-and-gabanna': 'Dolce & Gabbana',
  dng: 'Dolce & Gabbana',
  ysaintlaurent: 'Yves Saint Laurent',
  jpg: 'Jean Paul Gaultier',
  'aqua-di-gio': 'Giorgio Armani',
  'charlotte-tibury': 'Charlotte Tilbury',
  'orto-parasi': 'Orto Parisi',
  'gardoni-toscana': 'Giardini di Toscana',
  killian: 'Kilian',
  marly: 'Parfums de Marly',
  'perry-ellis': 'Perry Ellis',
  'carolina-herrera': 'Carolina Herrera',
  'louis-vuitton': 'Louis Vuitton',
  'paco-rabanne': 'Paco Rabanne',
  'antonio-banderas': 'Antonio Banderas',
  'roger-gallet': 'Roger & Gallet',
  'calvin-klein': 'Calvin Klein',
  'tom-ford': 'Tom Ford',
  'ralph-lauren': 'Ralph Lauren',
  'viktor-rolf': 'Viktor & Rolf',
  'jean-paul-gaultier': 'Jean Paul Gaultier',
  'giorgio-armani': 'Giorgio Armani',
  'sol-de-janeiro': 'Sol de Janeiro',
  'kim-kardashian': 'Kim Kardashian',
  'paris-hilton': 'Paris Hilton',
  'paris-corner': 'Paris Corner',
  'victoria-secret': "Victoria's Secret",
  'ariana-grande': 'Ariana Grande',
  'maison-crivelli': 'Maison Crivelli',
  'bond-n9': 'Bond No. 9',
  'beverly-hills': 'Giorgio Beverly Hills',
};

/**
 * Normaliza un token individual quitando plurales en español.
 * Ej: "DULCES" -> "DULCE", "FLORALES" -> "FLORAL", "CITRICAS" -> "CITRICA"
 */
function normalizeSpanishToken(token: string): string {
  if (token.length <= 3) return token;
  if (/(ALES|ELES|ILES|ONES|ORES|ADES)$/.test(token) && token.length > 5) {
    return token.slice(0, -2);
  }
  if (token.endsWith('S')) {
    return token.slice(0, -1);
  }
  return token;
}

/**
 * Raíz insensible a género gramatical (-O/-A) para comparar adjetivos olfativos.
 * Ej: "AROMATICO" === "AROMATICA", "CITRICO" === "CITRICA", "FRESCO" === "FRESCA"
 */
function stemToken(normalizedToken: string): string {
  if (normalizedToken.length >= 6 && /[OA]$/.test(normalizedToken)) {
    return normalizedToken.slice(0, -1);
  }
  return normalizedToken;
}

const normalizeCache = new Map<string, string>();

/**
 * BLOQUE 4:
 * Elimina tildes, convierte a mayúsculas, colapsa espacios sobrantes y normaliza
 * plurales simples al comparar columnas.
 * Ejemplos garantizados:
 *   normalizeText("DULCE") === normalizeText("DULCES")
 *   normalizeText("Cita romántica") === "CITA ROMANTICA"
 */
export function normalizeText(input: string): string {
  if (!input) return '';
  const key = String(input);
  const cached = normalizeCache.get(key);
  if (cached !== undefined) return cached;

  const cleaned = key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  const res = cleaned
    .split(/([/\s,-]+)/)
    .map((part) => (/^[A-Z0-9]+$/.test(part) ? normalizeSpanishToken(part) : part))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalizeCache.size < 2000) normalizeCache.set(key, res);
  return res;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function tokensLooselyEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const sa = stemToken(a);
  const sb = stemToken(b);
  if (sa === sb) return true;
  const minLen = Math.min(sa.length, sb.length);
  const maxDist = minLen >= 8 ? 2 : minLen >= 5 ? 1 : 0;
  if (maxDist === 0 || Math.abs(sa.length - sb.length) > maxDist) return false;
  return levenshtein(sa, sb) <= maxDist;
}

const textMatchesCache = new Map<string, boolean>();

/**
 * Compara dos textos tolerando tildes, mayúsculas, espacios sobrantes, plurales,
 * concordancia -O/-A, delimitadores '/' y errores tipográficos menores.
 * Ej: textMatches("DULCE", "DULCES") === true
 *     textMatches("CITA ROMANTICA", "CITA ROMATICA") === true
 *     textMatches("Cítricas", "CITICAS") === true
 *     textMatches("Aromáticas", "AROMATICO") === true
 */
export function textMatches(a: string, b: string): boolean {
  if (!a || !b) return false;
  const cacheKey = `${a}\u0000${b}`;
  const cached = textMatchesCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const na = normalizeText(a);
  const nb = normalizeText(b);
  let matched = false;

  if (na && nb) {
    if (na === nb || tokensLooselyEqual(na, nb)) {
      matched = true;
    } else {
      const partsA = na.split(/[/,]+/).map((s) => s.trim()).filter(Boolean);
      const partsB = nb.split(/[/,]+/).map((s) => s.trim()).filter(Boolean);

      outer: for (const pa of partsA) {
        for (const pb of partsB) {
          if (tokensLooselyEqual(pa, pb)) {
            matched = true;
            break outer;
          }
          if (pa.length >= 5 && pb.length >= 5 && (pa.includes(pb) || pb.includes(pa))) {
            matched = true;
            break outer;
          }
        }
      }
    }
  }

  if (textMatchesCache.size < 10000) textMatchesCache.set(cacheKey, matched);
  return matched;
}

function slugify(str: string): string {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function formatTitle(slug: string): string {
  return String(slug || '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function parseNameAndBrand(rawNombre: string): { name: string; brand: string } {
  const parts = String(rawNombre || '').split('---');
  const rawNamePart = (parts[0] || '').trim();
  const rawBrandPart = (parts[1] || '').trim();

  const name = formatTitle(rawNamePart) || 'Fragancia Exclusiva';
  const brandSlug = rawBrandPart.toLowerCase().trim();
  const brand = rawBrandPart
    ? BRAND_TYPOS[brandSlug] || formatTitle(rawBrandPart)
    : 'Alta Perfumería';

  return { name, brand };
}

// ── Mapeo de catálogo para enriquecer filas ACTIVAS de Sheets ────────────────

const catalogByExactSlug = new Map<string, Perfume>();
const catalogByNameSlug = new Map<string, Perfume>();

for (const item of catalog) {
  catalogByExactSlug.set(slugify(item.id), item);
  catalogByNameSlug.set(slugify(item.name), item);
}

function findCatalogMetadata(row: SheetInventoryItem): Perfume | undefined {
  const idSlug = slugify(row.id);
  const fullSlug = slugify(row.nombre_perfume);
  const [rawNamePart, rawBrandPart = ''] = row.nombre_perfume.split('---');
  const namePartSlug = slugify(rawNamePart);
  const brandPartSlug = slugify(rawBrandPart);
  const idPartSlug = slugify(row.id.split('---')[0]);
  const mappedBrandSlug = slugify(BRAND_TYPOS[rawBrandPart.toLowerCase().trim()] || '');
  const rowGender = normalizeText(row.genero || '');

  const isCompatiblePartial = (cat: Perfume | undefined): cat is Perfume => {
    if (!cat) return false;
    if (rowGender.includes('HOMBRE') && cat.gender === 'F') return false;
    if (rowGender.includes('MUJER') && cat.gender === 'M') return false;
    if (!brandPartSlug) return true;
    const catBrand = slugify(cat.brand);
    const catId = slugify(cat.id);
    const catName = slugify(cat.name);
    return (
      catBrand.includes(brandPartSlug) ||
      brandPartSlug.includes(catBrand) ||
      (mappedBrandSlug.length > 0 && catBrand.includes(mappedBrandSlug)) ||
      catId.includes(brandPartSlug) ||
      catName.includes(brandPartSlug)
    );
  };

  if (catalogByExactSlug.has(idSlug)) return catalogByExactSlug.get(idSlug);
  if (catalogByExactSlug.has(fullSlug)) return catalogByExactSlug.get(fullSlug);

  if (brandPartSlug) {
    const reversedSlug = `${brandPartSlug}${namePartSlug}`;
    if (catalogByExactSlug.has(reversedSlug)) return catalogByExactSlug.get(reversedSlug);
    if (namePartSlug === 'clasica') {
      if (catalogByExactSlug.has(brandPartSlug)) return catalogByExactSlug.get(brandPartSlug);
      if (brandPartSlug === 'aquadigio' && catalogByExactSlug.has('acquadigio')) {
        return catalogByExactSlug.get('acquadigio');
      }
    }
  }

  const byExactNamePart = catalogByExactSlug.get(namePartSlug);
  if (isCompatiblePartial(byExactNamePart)) return byExactNamePart;

  const byExactIdPart = catalogByExactSlug.get(idPartSlug);
  if (isCompatiblePartial(byExactIdPart)) return byExactIdPart;

  const byNamePart = catalogByNameSlug.get(namePartSlug);
  if (isCompatiblePartial(byNamePart)) return byNamePart;

  const byIdPart = catalogByNameSlug.get(idPartSlug);
  if (isCompatiblePartial(byIdPart)) return byIdPart;

  return undefined;
}

// ── Textos amigables y bullets ──────────────────────────────────────────────

const occasionFriendly: Record<string, string> = {
  diario: 'el día a día',
  trabajo: 'la oficina',
  cita: 'una cita romántica',
  noche: 'una salida nocturna',
  evento: 'un evento especial',
  verano: 'la playa y el verano',
  invierno: 'la temporada fría',
};

const feelFriendly: Record<string, string> = {
  fresco: 'fresco y limpio',
  dulce: 'dulce y envolvente',
  floral: 'floral y romántico',
  amaderado: 'cálido y amaderado',
  especiado: 'especiado y misterioso',
  citrico: 'cítrico y vibrante',
  frutal: 'frutal y alegre',
  oud: 'intenso y oriental',
  acuatico: 'marino y fresco',
  gourmand: 'gourmand y sensual',
  verde: 'aromático y distinguido',
  atalcado: 'atalcado y elegante',
};

function buildBulletFamily(family: string): string {
  const norm = normalizeText(family);
  if (norm.includes('ORIENTAL') || norm.includes('ESPECIAD')) return 'Elegancia de la familia Oriental Especiada';
  if (norm.includes('FLORAL')) return 'Corazón de la familia Floral';
  if (norm.includes('CITRIC')) return 'Frescura vibrante de la familia Cítrica';
  if (norm.includes('AMADERAD')) return 'Calidez distinguida de la familia Amaderada';
  if (norm.includes('DULCE')) return 'Estela envolvente de la familia Dulce';
  if (norm.includes('FRUTAL')) return 'Luminosidad moderna de la familia Frutal';
  if (norm.includes('ACUATIC')) return 'Pureza oceánica de la familia Acuática';
  if (norm.includes('FRESC')) return 'Limpieza y vitalidad de la familia Fresca';
  if (norm.includes('AROMATIC')) return 'Carácter pulcro de la familia Aromática';
  if (norm.includes('ATALCAD')) return 'Suavidad sofisticada de la familia Atalcada';
  return `Familia ${family || 'exclusiva'} con carácter propio`;
}

function buildBulletNotes(perfume: Perfume): string {
  if (perfume.heartNotes) {
    return `Corazón de ${perfume.heartNotes.split(',').slice(0, 2).map((n) => n.trim()).join(' y ')}`;
  }
  if (perfume.topNotes) {
    return `Apertura de ${perfume.topNotes.split(',')[0].trim()}`;
  }
  return 'Composición de alta perfumería';
}

function buildBulletEmotional(feels: string[]): string {
  const emotionMap: Record<string, string> = {
    oud: 'Proyecta un aura de misterio y sofisticación oriental',
    amaderado: 'Transmite elegancia cálida y presencia imponente',
    especiado: 'Evoca sensualidad y carácter indomable',
    fresco: 'Genera una imagen de frescura y confianza',
    dulce: 'Envuelve con una calidez dulce y magnética',
    floral: 'Irradia romanticismo y delicadeza sofisticada',
    citrico: 'Inspira vitalidad, energía y buen humor',
    frutal: 'Transmite alegría, dinamismo y luminosidad',
    acuatico: 'Evoca libertad, pureza y frescura marina',
    gourmand: 'Seduce con una presencia irresistible y adictiva',
    verde: 'Proyecta frescura herbal y distinción atemporal',
    atalcado: 'Brinda un halo pulcro, suave y elegante',
  };
  for (const feel of feels) {
    const label = emotionMap[feel.toLowerCase().trim()];
    if (label) return label;
  }
  return 'Una firma olfativa única e inolvidable';
}

function synthesizeNotesForFamily(family: string): { top: string; heart: string; base: string; desc: string } {
  const norm = normalizeText(family);
  if (norm.includes('ORIENTAL') || norm.includes('ESPECIAD')) {
    return {
      top: 'Cardamomo, Pimienta Rosa, Bergamota',
      heart: 'Especias Cálidas, Ámbar, Incienso',
      base: 'Maderas Nobles, Vainilla, Resinas',
      desc: 'Una composición especiada y envolvente con estela magnética y profunda.',
    };
  }
  if (norm.includes('DULCE')) {
    return {
      top: 'Frutas Confitadas, Mandarina',
      heart: 'Vainilla Cremosa, Caramelo, Haba Tonka',
      base: 'Ámbar Dorado, Almizcle Suave, Sándalo',
      desc: 'Aroma cálido, dulce y sumamente seductor con excelente fijación.',
    };
  }
  if (norm.includes('CITRIC')) {
    return {
      top: 'Bergamota, Limón Siciliano, Pomelo',
      heart: 'Neroli, Flor de Azahar, Té Verde',
      base: 'Almizcle Blanco, Cedro Ligero',
      desc: 'Explosión cítrica chispeante que transmite energía y frescura inmediata.',
    };
  }
  if (norm.includes('ACUATIC') || norm.includes('FRESC')) {
    return {
      top: 'Notas Marinas, Bergamota Fresca',
      heart: 'Brisa Oceánica, Lavanda, Romero',
      base: 'Ambroxan, Cedro Blanco, Almizcle',
      desc: 'Sensación limpia, cristalina y revitalizante inspirada en el océano.',
    };
  }
  if (norm.includes('FLORAL')) {
    return {
      top: 'Pera Fresca, Bergamota, Lichi',
      heart: 'Rosa de Damasco, Jazmín, Peonía',
      base: 'Almizcle Aterciopelado, Ámbar Suave',
      desc: 'Ramo floral elegante y luminoso que realza la distinción natural.',
    };
  }
  if (norm.includes('FRUTAL')) {
    return {
      top: 'Manzana Jugosa, Piña, Frutos Rojos',
      heart: 'Acorde Frutal Tropical, Flores Blancas',
      base: 'Vainilla Suave, Almizcle, Maderas Claras',
      desc: 'Fragancia frutal vibrante, alegre y moderna de gran magnetismo.',
    };
  }
  if (norm.includes('ATALCAD')) {
    return {
      top: 'Violeta, Flor de Azahar',
      heart: 'Iris Noble, Heliotropo, Rosa Suave',
      base: 'Almizcle Empolvado, Sándalo, Haba Tonka',
      desc: 'Estela limpia, aterciopelada y refinada con elegancia sutil.',
    };
  }
  if (norm.includes('AROMATIC')) {
    return {
      top: 'Lavanda, Menta, Bergamota',
      heart: 'Salvia, Geranio, Cardamomo',
      base: 'Vetiver, Cedro, Musgo de Roble',
      desc: 'Aroma pulcro, herbal y distinguido para proyectar seguridad.',
    };
  }
  return {
    top: 'Bergamota, Pimienta',
    heart: 'Cedro del Atlas, Vetiver, Especias',
    base: 'Sándalo, Pachulí, Ámbar Amaderado',
    desc: 'Elegancia amaderada atemporal de gran carácter y presencia.',
  };
}

// ── Conversión de fila ACTIVA de Sheets a Perfume enriquecido ────────────────

function mapSheetGenderToCode(rawGenero: string, catalogFallback?: Perfume): 'M' | 'F' | 'U' | '' {
  const g = normalizeText(rawGenero);
  if (!g) return catalogFallback?.gender ?? '';
  if (g.includes('UNISEX') || g === 'U') return 'U';
  if (g.includes('HOMBRE') || g.includes('CABALLERO') || g === 'M' || g === 'H') return 'M';
  if (g.includes('MUJER') || g.includes('DAMA') || g === 'F') return 'F';
  return catalogFallback?.gender ?? '';
}

function mapSheetIntensityToNumber(rawInt: string, catalogFallback?: Perfume): number {
  const i = normalizeText(rawInt);
  if (i.includes('ALTA')) return 5;
  if (i.includes('MEDIA')) return 3;
  if (i.includes('BAJA') || i.includes('SUAVE')) return 2;
  return catalogFallback?.intensity ?? 3;
}

export interface ActiveSheetEntry {
  row: SheetInventoryItem;
  perfume: Perfume;
  sheetGender: 'M' | 'F' | 'U' | '';
  sheetFamily: string;
  sheetOccasion: string;
  sheetIntensity: string;
  is11: boolean;
}

const activePoolCache = new WeakMap<SheetInventoryItem[], ActiveSheetEntry[]>();

export function buildActiveSheetPool(sheetsInventory: SheetInventoryItem[]): ActiveSheetEntry[] {
  const cached = activePoolCache.get(sheetsInventory);
  if (cached) return cached;

  const pool = sheetsInventory
    .filter((row) => {
      // Garantía absoluta: solo estado ACTIVO (si viene la columna) y con nombre real
      const estadoOk = !row.estado || row.estado.trim().toUpperCase() === 'ACTIVO';
      return estadoOk && row.nombre_perfume && row.nombre_perfume.trim().length > 0;
    })
    .map((row) => {
      const cat = findCatalogMetadata(row);
      const parsed = parseNameAndBrand(row.nombre_perfume);
      const synth = synthesizeNotesForFamily(row.familia_olfativa || cat?.family || '');
      const version = (row.tipo || 'ESTANDAR').toUpperCase().includes('1.1') ? '1.1' : 'ESTANDAR';
      const sheetGender = mapSheetGenderToCode(row.genero, cat);

      const displayName = cat?.name || parsed.name;
      const displayBrand = cat?.brand || parsed.brand;
      const resolvedImageUrl =
        resolveProductImageUrl({
          id: row.id,
          rawName: row.nombre_perfume,
          name: displayName,
          brand: displayBrand,
        }) || cat?.imageUrl;

      const perfume: Perfume = {
        id: row.id || row.nombre_perfume,
        name: displayName,
        brand: displayBrand,
        gender: sheetGender || 'U',
        family: row.familia_olfativa || cat?.family || 'Aromática',
        occasions: cat?.occasions ?? [],
        feels: cat?.feels ?? [],
        topNotes: cat?.topNotes || synth.top,
        heartNotes: cat?.heartNotes || synth.heart,
        baseNotes: cat?.baseNotes || synth.base,
        duration: cat?.duration || (version === '1.1' ? '10h+' : '8h+'),
        avoidTags: cat?.avoidTags ?? [],
        sweetness: cat?.sweetness ?? 3,
        freshness: cat?.freshness ?? 3,
        intensity: mapSheetIntensityToNumber(row.intensidad, cat),
        inStock: true,
        version,
        emotionalDesc: cat?.emotionalDesc || synth.desc,
        imageUrl: resolvedImageUrl,
      };

      return {
        row,
        perfume,
        sheetGender,
        sheetFamily: row.familia_olfativa || '',
        sheetOccasion: row.ocasion || '',
        sheetIntensity: row.intensidad || '',
        is11: version === '1.1',
      };
    });

  activePoolCache.set(sheetsInventory, pool);
  return pool;
}

// ── Matching normalizado por atributo contra columnas reales de Sheets ───────

/**
 * Mapea los Feels del cuestionario o el texto de familia a las etiquetas del Sheet.
 */
function resolveTargetFamilyLabels(answers: BotAnswers & { familyFilter?: string }): string[] {
  if (answers.familyFilter && answers.familyFilter.trim().length > 0) {
    return [answers.familyFilter.trim()];
  }
  const feels = (answers.feel || []).map((f) => f.toLowerCase().trim());
  const labels: string[] = [];

  for (const f of feels) {
    if (f === 'citrico') labels.push('CITRICAS');
    else if (f === 'amaderado') labels.push('AMADERADAS');
    else if (f === 'floral') labels.push('FLORALES');
    else if (f === 'frutal') labels.push('FRUTALES');
    else if (f === 'fresco') labels.push('FRESCO');
    else if (f === 'acuatico') labels.push('ACUATICAS');
    else if (f === 'dulce' || f === 'gourmand') labels.push('DULCES');
    else if (f === 'especiado' || f === 'oud') labels.push('ORIENTALES/ESPECIADAS');
    else if (f === 'verde') labels.push('AROMATICO');
    else if (f === 'atalcado' || f === 'polvo') labels.push('ATALCADO');
  }

  return Array.from(new Set(labels));
}

function resolveTargetOccasionLabel(occasion: string): string {
  const o = normalizeText(occasion);
  if (!o) return '';
  if (o.includes('OFICINA') || o.includes('TRABAJO')) return 'OFICINA';
  if (o.includes('CITA')) return 'CITA ROMANTICA';
  if (o.includes('EVENTO') || o.includes('FORMAL') || o.includes('NOCHE')) return 'EVENTO FORMAL';
  if (o.includes('DEPORTE')) return 'DEPORTE';
  if (o.includes('DIARIO')) return 'USO DIARIO';
  return occasion;
}

function resolveTargetIntensityLabel(projection: string): string {
  const p = normalizeText(projection);
  if (!p) return '';
  if (p.includes('DISCRETA') || p.includes('BAJA') || p.includes('SUAVE')) return 'BAJA';
  if (p.includes('MODERADA') || p.includes('MEDIA')) return 'MEDIA';
  if (p.includes('INTENSA') || p.includes('ALTA')) return 'ALTA';
  return '';
}

function matchesSheetGender(entry: ActiveSheetEntry, requestedGender: string): boolean {
  const req = normalizeText(requestedGender);
  const g = entry.sheetGender;
  if (!g) return false;
  if (req === 'U' || req.includes('UNISEX')) {
    return g === 'U';
  }
  if (req === 'M' || req.includes('HOMBRE')) {
    return g === 'M' || g === 'U';
  }
  if (req === 'F' || req.includes('MUJER')) {
    return g === 'F' || g === 'U';
  }
  return true;
}

function matchesSheetFamily(entry: ActiveSheetEntry, targetFamilies: string[]): boolean {
  if (targetFamilies.length === 0) return true;
  if (!entry.sheetFamily) return false;
  return targetFamilies.some((tf) => textMatches(entry.sheetFamily, tf));
}

function matchesSheetOccasion(entry: ActiveSheetEntry, targetOccasion: string): boolean {
  if (!targetOccasion) return true;
  if (!entry.sheetOccasion) return false;
  return textMatches(entry.sheetOccasion, targetOccasion);
}

function matchesSheetIntensity(entry: ActiveSheetEntry, targetIntensity: string): boolean {
  if (!targetIntensity) return true;
  if (!entry.sheetIntensity) return false;
  return textMatches(entry.sheetIntensity, targetIntensity);
}

function shouldAvoidEntry(entry: ActiveSheetEntry, avoidList: string[]): boolean {
  if (!avoidList || avoidList.length === 0) return false;
  const fam = normalizeText(entry.sheetFamily);
  const pTags = (entry.perfume.avoidTags || []).map((t) => normalizeText(t));

  for (const avoid of avoidList) {
    const a = normalizeText(avoid);
    if (!a || a === 'NINGUNA') continue;
    if (a.includes('DULCE') || a.includes('GOURMAND')) {
      if (textMatches(fam, 'DULCES') || pTags.some((t) => t.includes('DULCE'))) return true;
    }
    if (a.includes('OUD') || a.includes('INTENSA') || a.includes('PESADA')) {
      if (normalizeText(entry.sheetIntensity) === 'ALTA' && (fam.includes('ORIENTAL') || fam.includes('DULCE'))) {
        return true;
      }
      if (pTags.some((t) => t.includes('OUD'))) return true;
    }
    if (a.includes('CITRIC')) {
      if (textMatches(fam, 'CITRICAS') || pTags.some((t) => t.includes('CITRIC'))) return true;
    }
    if (a.includes('AMADERAD')) {
      if (textMatches(fam, 'AMADERADAS') || pTags.some((t) => t.includes('AMADERAD'))) return true;
    }
  }
  return false;
}

// ── Reference perfume matching ──────────────────────────────────────────────

interface ReferenceMatch {
  found: boolean;
  perfumeName: string;
  matchedFamily?: string;
  matchedNotes?: string[];
  keywords: string[];
}

export function findReferencePerfume(input: string): ReferenceMatch {
  if (!input || input.trim().length === 0) {
    return { found: false, perfumeName: '', keywords: [] };
  }

  const inputLower = input.toLowerCase().trim();
  const perfumeName = input.trim();

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
    const allNotes = [
      ...match.topNotes.split(','),
      ...match.heartNotes.split(','),
      ...match.baseNotes.split(','),
    ]
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean);

    return {
      found: true,
      perfumeName,
      matchedFamily: match.family,
      matchedNotes: allNotes,
      keywords: [match.family?.toLowerCase() ?? '', ...allNotes].filter(Boolean),
    };
  }

  const words = inputLower.split(/\s+/).filter((w) => w.length > 2);
  return { found: false, perfumeName, keywords: words };
}

function referenceBonus(perfume: Perfume, ref?: ReferenceMatch): number {
  if (!ref || (!ref.found && ref.keywords.length === 0)) return 0;

  if (ref.matchedFamily && perfume.family) {
    if (textMatches(perfume.family, ref.matchedFamily)) return 25;
  }

  const perfNotes = [
    ...perfume.topNotes.split(','),
    ...perfume.heartNotes.split(','),
    ...perfume.baseNotes.split(','),
  ]
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);

  if (ref.matchedNotes && ref.matchedNotes.length > 0) {
    const shared = ref.matchedNotes.filter((rn) =>
      perfNotes.some((pn) => pn.includes(rn) || rn.includes(pn))
    );
    if (shared.length >= 2) return 25;
    if (shared.length === 1) return 12;
  }

  if (ref.keywords.length > 0) {
    const perfText = [perfume.name, perfume.brand, perfume.family ?? '', ...perfNotes]
      .join(' ')
      .toLowerCase();
    const kwMatches = ref.keywords.filter((kw) => perfText.includes(kw));
    if (kwMatches.length >= 2) return 20;
    if (kwMatches.length === 1) return 10;
  }

  return 0;
}

// ── Conversión a ScoredPerfume ──────────────────────────────────────────────

function entryToScoredPerfume(
  entry: ActiveSheetEntry,
  answers: BotAnswers,
  score: number,
  cascadeLevel: 1 | 2 | 3 | 4,
  refMatch?: ReferenceMatch
): ScoredPerfume {
  const { perfume, is11 } = entry;
  const isFallback = cascadeLevel > 1;
  const feelWord =
    (answers.feel || []).map((f) => feelFriendly[f] ?? f)[0] || 'especial';
  const occasionWord = occasionFriendly[answers.occasion ?? ''] ?? (answers.occasion || 'tu estilo');
  const heartNote = perfume.heartNotes?.split(',')[0]?.trim() || 'sus notas únicas';

  const reasons: string[] = [
    buildBulletFamily(entry.sheetFamily || perfume.family),
    buildBulletNotes(perfume),
    buildBulletEmotional(answers.feel?.length ? answers.feel : perfume.feels),
  ];

  if (is11) {
    reasons.unshift('✦ Disponible en versión 1.1 de alta concentración — entrega inmediata');
    reasons.splice(4);
  }

  const refBonus = referenceBonus(perfume, refMatch);
  let sommelierSummary: string;

  if (isFallback) {
    sommelierSummary = `${answers.name || 'Tú'}, ${perfume.name} fue seleccionada de nuestro inventario activo por su afinidad con tu estilo para ${occasionWord}, destacando su corazón de ${heartNote}.`;
  } else if (answers.referencePerfume && refBonus > 0) {
    sommelierSummary = `${answers.name || 'Tú'}, como me contaste que te gusta ${answers.referencePerfume}, elegí ${perfume.name} porque comparten esa esencia ${feelWord} que buscas — su corazón de ${heartNote} lo confirma.`;
  } else {
    sommelierSummary = `${answers.name || 'Tú'}, este ${perfume.name} es tu match ideal porque buscabas algo ${feelWord} para ${occasionWord} y destaca por su corazón de ${heartNote}.`;
  }

  return {
    perfume,
    score,
    reasons,
    sommelierSummary,
    isImmediate: true,
    isNicho: is11,
    isFallback,
    cascadeLevel,
  };
}

// ── BLOQUE 2: Motor principal + Fallback en cascada de 4 niveles ────────────

export interface CascadeAnswers extends BotAnswers {
  /** Familia olfativa directa cuando el quiz la envía explícitamente (ej. "ORIENTALES/ESPECIADAS") */
  familyFilter?: string;
}

/**
 * Fallback en cascada usando EXCLUSIVAMENTE el inventario real de Sheets con estado "ACTIVO"
 * (respetando el género seleccionado o UNISEX):
 *   Nivel 1: Coincidencia exacta (género + familia_olfativa + ocasion + intensidad).
 *   Nivel 2: Género + familia_olfativa + ocasion.
 *   Nivel 3: Género + familia_olfativa (o género + ocasion).
 *   Nivel 4: Perfumes reales activos del mismo género hasta completar siempre 3 recomendaciones reales.
 */
export function recommendFromActiveSheets(
  answers: CascadeAnswers,
  sheetsInventory: SheetInventoryItem[]
): ScoredPerfume[] {
  if (!sheetsInventory || sheetsInventory.length === 0) {
    console.error('❌ [Recommender] Sin inventario ACTIVO de Sheets para recomendar.');
    return [];
  }

  const pool = buildActiveSheetPool(sheetsInventory);
  const reqGender = normalizeText(answers.gender || '');
  const targetFamilies = resolveTargetFamilyLabels(answers);
  const targetOccasion = resolveTargetOccasionLabel(answers.occasion || '');
  const targetIntensity = resolveTargetIntensityLabel(answers.projection || '');
  const refMatch = findReferencePerfume(answers.referencePerfume ?? '');

  // Puntuación interna para ordenar candidatos dentro de cada nivel
  const scoreEntry = (entry: ActiveSheetEntry, extra: number) => {
    let s = extra;
    // Priorizar género exacto sobre UNISEX cuando usuario eligió M o F
    if (reqGender === 'M' && entry.sheetGender === 'M') s += 30;
    else if (reqGender === 'F' && entry.sheetGender === 'F') s += 30;
    else if (entry.sheetGender === 'U') s += 10;

    // Priorizar versión 1.1
    if (entry.is11) s += 25;

    // Coincidencia con familia principal (cuando el usuario eligió una nota específica en Step 4 / AiGuide)
    if (targetFamilies.length > 0 && textMatches(entry.sheetFamily, targetFamilies[0])) {
      s += 20;
    }

    // Coincidencia de intensidad como desempate cuando no es obligatoria
    if (targetIntensity && matchesSheetIntensity(entry, targetIntensity)) {
      s += 15;
    }

    // Coincidencia de perfume de referencia
    s += referenceBonus(entry.perfume, refMatch);
    return s;
  };

  const results: ScoredPerfume[] = [];
  const usedNames = new Set<string>();

  const isAlreadyUsed = (entry: ActiveSheetEntry) => {
    const fullSlugKey = slugify(entry.row.nombre_perfume);
    const dispKey = slugify(`${entry.perfume.name} ${entry.perfume.brand}`);
    return usedNames.has(fullSlugKey) || usedNames.has(dispKey);
  };

  const markUsed = (entry: ActiveSheetEntry) => {
    usedNames.add(slugify(entry.row.nombre_perfume));
    usedNames.add(slugify(`${entry.perfume.name} ${entry.perfume.brand}`));
  };

  const pickFromLevel = (
    candidates: { entry: ActiveSheetEntry; rankScore: number }[],
    level: 1 | 2 | 3 | 4
  ) => {
    candidates.sort((a, b) => b.rankScore - a.rankScore);
    for (const c of candidates) {
      if (results.length >= 3) break;
      if (isAlreadyUsed(c.entry)) continue;
      markUsed(c.entry);
      results.push(entryToScoredPerfume(c.entry, answers, c.rankScore, level, refMatch));
    }
  };

  // Filtrar universo por género compatible (NUNCA recomendar otro género opuesto)
  const genderCompatible = pool.filter((e) => matchesSheetGender(e, answers.gender || ''));

  // ── NIVEL 1: Coincidencia exacta (género + familia + ocasión + intensidad) ─
  const level1 = genderCompatible
    .filter(
      (e) =>
        !shouldAvoidEntry(e, answers.avoid || []) &&
        matchesSheetFamily(e, targetFamilies) &&
        matchesSheetOccasion(e, targetOccasion) &&
        matchesSheetIntensity(e, targetIntensity)
    )
    .map((e) => ({ entry: e, rankScore: scoreEntry(e, 1000) }));
  pickFromLevel(level1, 1);

  // ── NIVEL 2: Género + familia_olfativa + ocasion (relaja intensidad) ──────
  if (results.length < 3) {
    const level2 = genderCompatible
      .filter(
        (e) =>
          !isAlreadyUsed(e) &&
          !shouldAvoidEntry(e, answers.avoid || []) &&
          matchesSheetFamily(e, targetFamilies) &&
          matchesSheetOccasion(e, targetOccasion)
      )
      .map((e) => ({ entry: e, rankScore: scoreEntry(e, 700) }));
    pickFromLevel(level2, 2);
  }

  // ── NIVEL 3: Género + familia_olfativa  o  género + ocasion ────────────────
  if (results.length < 3) {
    const level3 = genderCompatible
      .filter(
        (e) =>
          !isAlreadyUsed(e) &&
          !shouldAvoidEntry(e, answers.avoid || []) &&
          (matchesSheetFamily(e, targetFamilies) || matchesSheetOccasion(e, targetOccasion))
      )
      .map((e) => {
        const famHit = matchesSheetFamily(e, targetFamilies) ? 80 : 0;
        const occHit = matchesSheetOccasion(e, targetOccasion) ? 40 : 0;
        return { entry: e, rankScore: scoreEntry(e, 400 + famHit + occHit) };
      });
    pickFromLevel(level3, 3);
  }

  // ── NIVEL 4: Perfumes reales activos del mismo género hasta completar 3 ───
  if (results.length < 3) {
    // Primero respetando avoid
    const level4StrictAvoid = genderCompatible
      .filter((e) => !isAlreadyUsed(e) && !shouldAvoidEntry(e, answers.avoid || []))
      .map((e) => ({ entry: e, rankScore: scoreEntry(e, 200) }));
    pickFromLevel(level4StrictAvoid, 4);
  }

  if (results.length < 3) {
    // Si aún faltan por restricción de avoid muy estricta, completar dentro del mismo género
    const level4GenderOnly = genderCompatible
      .filter((e) => !isAlreadyUsed(e))
      .map((e) => ({ entry: e, rankScore: scoreEntry(e, 100) }));
    pickFromLevel(level4GenderOnly, 4);
  }

  return results.slice(0, 3);
}

/**
 * Punto de entrada unificado para el recomendador.
 * Requiere `sheetsInventory` con los perfumes ACTIVOS de InventarioBot.
 */
export function recommend(
  answers: CascadeAnswers,
  _stockMap?: Record<string, boolean>,
  _inventoryData?: Record<
    string,
    { gender?: string; olfactory_family?: string; occasion?: string; intensity?: string; active?: boolean }
  >,
  sheetsInventory?: SheetInventoryItem[]
): ScoredPerfume[] {
  if (!sheetsInventory || sheetsInventory.length === 0) {
    console.error(
      '❌ [recommend] No se recibió inventario vivo de Sheets (InventarioBot). No se recomendarán datos congelados ni ficticios.'
    );
    return [];
  }
  return recommendFromActiveSheets(answers, sheetsInventory);
}

// ── WhatsApp message builders ───────────────────────────────────────────────

export function buildWhatsappPerPerfume(userName: string, perfumeName: string, brandName: string): string {
  const caller = userName?.trim() ? `soy ${userName.trim()} ` : '';
  const text = `Hola Brian, ${caller}🌸 Me encantó tu recomendación de ${perfumeName} de ${brandName} y quiero pedirlo. ¿Me puedes mostrar enseguidita para ensayarlo en mi piel? 😍`;
  return `https://wa.me/573136876673?text=${encodeURIComponent(text)}`;
}

export function buildWhatsappSummary(userName: string, top3: ScoredPerfume[]): string {
  const caller = userName?.trim() ? `soy ${userName.trim()} ` : '';
  const names = top3.map((r) => `${r.perfume.name} de ${r.perfume.brand}`).join(', ');
  const text = `Hola Brian, ${caller}🌸 Tú me recomendaste estas fragancias: ${names}. ¿Me puedes mostrar enseguidita para ensayarlas en mi piel? 😍`;
  return `https://wa.me/573136876673?text=${encodeURIComponent(text)}`;
}

// ── Dynamic Sommelier Summary ────────────────────────────────────────────────

export function buildSommelierSummary(answers: BotAnswers, perfume: Perfume, rank: number): string {
  const refMatch = findReferencePerfume(answers.referencePerfume ?? '');
  const firstName = answers.name?.trim() || 'tú';

  const askedFeels = (answers.feel || []).map((f) => f.toLowerCase().trim());
  const allNotes = [
    ...perfume.topNotes.split(','),
    ...perfume.heartNotes.split(','),
    ...perfume.baseNotes.split(','),
  ]
    .map((n) => n.trim())
    .filter(Boolean);

  const feelToNoteKeywords: Record<string, string[]> = {
    dulce: ['vainilla', 'caramelo', 'miel', 'cacao', 'praline', 'tonka'],
    fresco: ['bergamota', 'limón', 'pepino', 'menta', 'té verde', 'aloe'],
    floral: ['jazmín', 'rosa', 'nardo', 'iris', 'ylang', 'lirio', 'peonía'],
    amaderado: ['sándalo', 'cedro', 'palo santo', 'vetiver', 'guayaco'],
    especiado: ['canela', 'cardamomo', 'pimienta', 'clavo', 'nuez moscada'],
    citrico: ['bergamota', 'limón', 'naranja', 'pomelo', 'mandarina'],
    frutal: ['manzana', 'pera', 'melocotón', 'frambuesa', 'frutos rojos'],
    oud: ['oud', 'incienso', 'resina', 'ámbar', 'mirra'],
    acuatico: ['algas', 'sal marina', 'agua', 'ozono', 'brisa', 'marinas'],
    gourmand: ['vainilla', 'azúcar', 'cacao', 'helado', 'caramelo'],
  };

  let matchingNote = allNotes[0] ?? 'sus notas características';
  for (const feel of askedFeels) {
    const keywords = feelToNoteKeywords[feel] ?? [];
    const found = allNotes.find((note) =>
      keywords.some((kw) => note.toLowerCase().includes(kw))
    );
    if (found) {
      matchingNote = found;
      break;
    }
  }

  const occasionWord = occasionFriendly[answers.occasion ?? ''] ?? answers.occasion ?? 'tu estilo';
  const feelWord =
    askedFeels.length > 0 ? feelFriendly[askedFeels[0]] ?? askedFeels[0] : 'especial';
  const impact = perfume.emotionalDesc.split('.')[0]?.trim() ?? perfume.emotionalDesc;

  const hasRef = Boolean(answers.referencePerfume && answers.referencePerfume.trim().length > 0);
  const refName = answers.referencePerfume?.trim() ?? '';
  const refBonusVal = referenceBonus(perfume, refMatch);

  if (rank === 1) {
    if (hasRef && refBonusVal > 0) {
      return `${firstName}, como me contaste que te encanta **${refName}**, elegí ${perfume.name} como tu #1 porque comparten esa esencia ${feelWord} que buscas — su nota de **${matchingNote}** es ese punto de conexión. ${impact}.`;
    }
    return `${firstName}, elegí ${perfume.name} como #1 porque buscabas algo ${feelWord} para ${occasionWord} — y su nota de **${matchingNote}** es exactamente ese punto de conexión. ${impact}.`;
  }

  if (rank === 2) {
    if (hasRef && refBonusVal > 0) {
      return `Aquí viene tu sorpresa, ${firstName}: si ${refName} te conquistó, la nota de **${matchingNote}** en ${perfume.name} te va a fascinar aún más. ${impact}. Una firma que te va a seguir sorprendiendo con el paso de las horas.`;
    }
    return `Aquí viene tu sorpresa, ${firstName}: la nota de **${matchingNote}** en ${perfume.name} responde directo a lo ${feelWord} que pediste, pero con una profundidad que va más allá. ${impact}. Una firma que te va a seguir sorprendiendo con el paso de las horas.`;
  }

  if (hasRef && refBonusVal > 0) {
    return `Para cerrar con broche de oro, ${firstName}: ${perfume.name}. Si te enamoró ${refName}, su **${matchingNote}** lleva esa misma magia a otra dimensión. ${impact}. Este es el tipo de fragancia que la gente te pregunta por nombre.`;
  }
  return `Para cerrar con broche de oro, ${firstName}: ${perfume.name}. Si algo de ${feelWord} resonó contigo, su **${matchingNote}** lo lleva a otra dimensión. ${impact}. Este es el tipo de fragancia que la gente te pregunta por nombre.`;
}
