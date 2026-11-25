/**
 * test_recommender.ts — Auditor Automático del Bot de Fragancias
 *
 * BLOQUE 5:
 * - Lee el inventario real en vivo de Google Sheets (InventarioBot!A1:H1000).
 * - Prueba automáticamente TODAS las combinaciones posibles de opciones del cuestionario
 *   (tanto el Wizard de 6 pasos de /api/chat como la Guía IA de /api/ai-guide).
 * - Verifica la normalización de texto (DULCE === DULCES, CITA ROMANTICA === CITA ROMATICA).
 * - Verifica estrictamente que 0 perfumes INACTIVO y 0 perfumes ficticios aparezcan.
 * - Genera REPORTE_TEST_BOT.md.
 *
 * Uso: npx tsx test_recommender.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

import { getAllInventoryRowsFromSheets, RawSheetAuditRow, PerfumeSheetRow } from './app/lib/sheets';
import {
  recommend,
  recommendFromActiveSheets,
  normalizeText,
  textMatches,
  ScoredPerfume,
} from './app/lib/recommender';
import type { Gender, Occasion, Feel, Projection } from './app/lib/types';

// ── Opciones exactas de los cuestionarios ─────────────────────────────────────

// 1) Wizard 6 pasos (/api/chat)
const WIZARD_GENEROS = [
  'Hombre (18-25)',
  'Hombre (26-40)',
  'Hombre (40+)',
  'Mujer (18-25)',
  'Mujer (26-40)',
  'Mujer (40+)',
];
const WIZARD_OCASIONES = ['Oficina', 'Uso diario', 'Cita romántica', 'Evento formal', 'Deporte'];
const WIZARD_EXPRESIONES = [
  'Elegancia / Seriedad',
  'Sensualidad / Atrevimiento',
  'Frescura / Limpieza',
  'Éxito / Poder',
];
const WIZARD_NOTAS = [
  'Orientales/Especiadas',
  'Frutales',
  'Florales',
  'Frescos',
  'Amaderados',
  'Cítricas',
  'Aromáticas',
  'Acuáticos',
  'Atalcado',
];
const WIZARD_EVITAR = ['Muy Dulces', 'Muy Intensas / Pesadas', 'Cítricas', 'Amaderadas', 'Ninguna'];

// 2) Guía IA (/api/ai-guide)
const AIGUIDE_GENEROS = ['HOMBRE', 'MUJER', 'UNISEX'];
const AIGUIDE_OCASIONES = ['OFICINA', 'USO DIARIO', 'CITA ROMANTICA', 'EVENTO FORMAL', 'DEPORTE'];
const AIGUIDE_FAMILIAS = [
  'ORIENTALES/ESPECIADAS',
  'AMADERADAS',
  'CITRICAS',
  'DULCES',
  'FRUTALES',
  'FLORALES',
  'ACUATICAS',
];

// ── Helpers de mapeo (idénticos a los endpoints) ──────────────────────────────

function mapWizardGender(val: string): Gender {
  return val.toLowerCase().startsWith('mujer') ? 'F' : 'M';
}

function mapOccasion(val: string): Occasion {
  const v = val.toLowerCase();
  if (v.includes('oficina')) return 'trabajo';
  if (v.includes('cita')) return 'cita';
  if (v.includes('formal')) return 'evento';
  if (v.includes('deporte')) return 'deporte';
  return 'diario';
}

function mapProjection(express: string): Projection {
  const e = express.toLowerCase();
  if (e.includes('sensualidad') || e.includes('atrevimiento') || e.includes('éxito') || e.includes('poder')) {
    return 'intensa';
  }
  if (e.includes('frescura') || e.includes('limpieza')) return 'discreta';
  if (e.includes('elegancia') || e.includes('seriedad')) return 'moderada';
  return '';
}

function mapFeels(express: string, notes: string): Feel[] {
  const feels: Feel[] = [];
  const n = notes.toLowerCase();
  if (n.includes('cítric') || n.includes('citric')) feels.push('citrico');
  else if (n.includes('amadera')) feels.push('amaderado');
  else if (n.includes('floral')) feels.push('floral');
  else if (n.includes('frutal')) feels.push('frutal');
  else if (n.includes('fresco')) feels.push('fresco');
  else if (n.includes('aromátic') || n.includes('aromatic')) feels.push('verde');
  else if (n.includes('atalcado')) feels.push('atalcado', 'polvo');
  else if (n.includes('oriental') || n.includes('especiad')) feels.push('especiado', 'oud');
  else if (n.includes('acuátic') || n.includes('acuatic')) feels.push('acuatico', 'fresco');
  else if (n.includes('dulce')) feels.push('dulce');

  const e = express.toLowerCase();
  if (e.includes('sensualidad') || e.includes('atrevimiento')) feels.push('especiado', 'oud');
  else if (e.includes('frescura') || e.includes('limpieza')) feels.push('fresco', 'acuatico');
  else if (e.includes('éxito') || e.includes('poder')) feels.push('amaderado');
  else if (e.includes('elegancia') || e.includes('seriedad')) feels.push('amaderado', 'fresco');

  return Array.from(new Set(feels));
}

function mapAvoid(avoidVal: string): string[] {
  if (!avoidVal || avoidVal.toLowerCase().includes('ninguna')) return [];
  const v = avoidVal.toLowerCase();
  if (v.includes('dulce')) return ['dulce', 'gourmand'];
  if (v.includes('intensa') || v.includes('pesada')) return ['oud'];
  if (v.includes('cítric') || v.includes('citric')) return ['citrico'];
  if (v.includes('amadera')) return ['amaderado'];
  return [];
}

// ── Validación de seguridad (0 ficticios, 0 inactivos) ────────────────────────

const FAKE_PERFUMES = [
  'nuit de marbre',
  'oud celeste',
  'ambre noir',
  'rose imperiale',
];
const FAKE_BRANDS = ['touche essencielle'];

function normSlug(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function isFakePerfume(name: string, brand: string): boolean {
  const nName = String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  const nBrand = String(brand || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  return FAKE_PERFUMES.some((f) => nName.includes(f)) || FAKE_BRANDS.some((b) => nBrand === b);
}

// ── Auditoría de etiquetas del Sheet ─────────────────────────────────────────

function auditSheetLabels(allRows: RawSheetAuditRow[]): string {
  const nonEmptyRows = allRows.filter((r) => r.rawId || r.rawName || r.estado);
  const uniqueRaw = (getter: (r: RawSheetAuditRow) => string) => {
    const counts = new Map<string, number>();
    for (const r of nonEmptyRows) {
      const val = getter(r).trim() || '(VACÍO)';
      counts.set(val, (counts.get(val) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const estados = uniqueRaw((r) => r.estado);
  const familias = uniqueRaw((r) => r.rawFamilia);
  const ocasiones = uniqueRaw((r) => r.rawOcasion);
  const intensidades = uniqueRaw((r) => r.rawIntensidad);
  const generos = uniqueRaw((r) => r.rawGenero);
  const tipos = uniqueRaw((r) => r.rawTipo);

  const anomalies: string[] = [];
  const nameToRows = new Map<string, RawSheetAuditRow[]>();

  for (const r of allRows) {
    if (!r.rawId && !r.rawName && !r.estado) {
      anomalies.push(`- Fila ${r.rowNumber}: Fila completamente en blanco.`);
      continue;
    }

    const rowLabel = `Fila ${r.rowNumber} (\`${r.rawName || r.rawId}\`, estado: \`${r.estado || 'VACÍO'}\`)`;

    if (r.rawId.toUpperCase() === 'VENDIDO') {
      anomalies.push(`- ${rowLabel}: Columna A contiene \`"Vendido"\` en lugar de un ID válido.`);
    }
    if (!r.rawName || r.rawName.length <= 2) {
      anomalies.push(`- ${rowLabel}: \`nombre_perfume\` corrupto o muy corto (\`"${r.rawName}"\`); columna A tiene \`"${r.rawId}"\`.`);
    }
    if (r.rawName.endsWith('hombre') || r.rawName.endsWith('mujer')) {
      anomalies.push(`- ${rowLabel}: Género pegado al nombre del perfume (\`${r.rawName}\`).`);
    }
    if (!['ACTIVO', 'INACTIVO'].includes(r.estado.toUpperCase())) {
      anomalies.push(`- ${rowLabel}: Valor inválido o vacío en \`estado\`: \`"${r.estado}"\`.`);
    }
    if (
      r.rawFamilia.toUpperCase() === 'ACTIVO' ||
      r.rawOcasion.toUpperCase() === 'ACTIVO' ||
      r.rawIntensidad.toUpperCase() === 'ACTIVO'
    ) {
      anomalies.push(
        `- ${rowLabel}: **Datos cruzados** — la palabra \`"ACTIVO"\` aparece en columnas de atributos (\`familia=${r.rawFamilia}\`, \`ocasion=${r.rawOcasion}\`, \`intensidad=${r.rawIntensidad}\`).`
      );
    }
    if (r.estado.toUpperCase() === 'ACTIVO') {
      if (!r.rawGenero) anomalies.push(`- ${rowLabel}: Perfume ACTIVO sin \`genero\`.`);
      if (!r.rawFamilia) anomalies.push(`- ${rowLabel}: Perfume ACTIVO sin \`familia_olfativa\`.`);
      if (!r.rawOcasion) anomalies.push(`- ${rowLabel}: Perfume ACTIVO sin \`ocasion\`.`);
      if (!r.rawIntensidad) anomalies.push(`- ${rowLabel}: Perfume ACTIVO sin \`intensidad\`.`);
    }
    if (r.rawOcasion.toUpperCase().includes('ROMATICA')) {
      anomalies.push(`- ${rowLabel}: Error tipográfico en \`ocasion\` (\`"${r.rawOcasion}"\` en lugar de \`"CITA ROMANTICA"\`).`);
    }
    if (r.rawName.toLowerCase().includes('lataffa') || r.rawName.toLowerCase().includes('mochino') || r.rawName.toLowerCase().includes('katty-perry') || r.rawName.toLowerCase().includes('tibury')) {
      anomalies.push(`- ${rowLabel}: Error ortográfico en marca dentro de \`nombre_perfume\`.`);
    }

    const key = normSlug(r.nombre_perfume);
    if (key) {
      const list = nameToRows.get(key) || [];
      list.push(r);
      nameToRows.set(key, list);
    }
  }

  for (const [key, list] of Array.from(nameToRows.entries())) {
    if (list.length > 1) {
      const summary = list.map((r) => `Fila ${r.rowNumber} [${r.estado}/${r.genero}/${r.rawOcasion}]`).join(', ');
      anomalies.push(`- Duplicado potencial (\`${key}\`): ${summary}`);
    }
  }

  const formatCounts = (arr: [string, number][]) =>
    arr.map(([val, count]) => `- \`${val}\` (${count} filas)`).join('\n');

  return `## 3. 🏷️ Auditoría de Etiquetas del Sheet (\`InventarioBot\`)

### Valores únicos en \`estado\`:
${formatCounts(estados)}

### Valores únicos en \`familia_olfativa\`:
${formatCounts(familias)}

### Valores únicos en \`ocasion\`:
${formatCounts(ocasiones)}

### Valores únicos en \`intensidad\`:
${formatCounts(intensidades)}

### Valores únicos en \`genero\`:
${formatCounts(generos)}

### Valores únicos en \`tipo\`:
${formatCounts(tipos)}

### ⚠️ Filas con datos cruzados, faltantes, duplicados o mal escritos (${anomalies.length} hallazgos):
${anomalies.length > 0 ? anomalies.join('\n') : '✅ Sin anomalías detectadas.'}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface ComboTestRecord {
  flow: 'Guía IA' | 'Wizard';
  label: string;
  gender: string;
  occasion: string;
  expression: string;
  family: string;
  avoid: string;
  exactMatches: number;
  fallbackMatches: number;
  top3: {
    id: string;
    name: string;
    brand: string;
    cascadeLevel: number;
    isFallback: boolean;
    isFicticio: boolean;
    isInactive: boolean;
  }[];
}

async function main() {
  console.log('🧪 [Auditor] Iniciando test_recommender.ts...');

  // Pruebas unitarias de normalización (Bloque 4)
  const normDulce = normalizeText('DULCE') === normalizeText('DULCES');
  const normCita = textMatches('CITA ROMANTICA', 'CITA ROMATICA');
  const normAcento = textMatches('Cita romántica', 'CITA ROMATICA');
  console.log(`🔤 Normalización: "DULCE"==="DULCES": ${normDulce}, "CITA ROMANTICA"==="CITA ROMATICA": ${normCita}, acentos: ${normAcento}`);
  if (!normDulce || !normCita || !normAcento) {
    throw new Error('Falló la prueba de normalización de texto (Bloque 4).');
  }

  // 1. Leer inventario real en vivo de Sheets
  console.log('📡 Conectando en vivo a Google Sheets (InventarioBot!A1:H1000)...');
  const { allRows, activeRows, inactiveRows } = await getAllInventoryRowsFromSheets();

  if (activeRows.length === 0) {
    throw new Error('Google Sheets devolvió 0 perfumes ACTIVOS. Verifica la conexión y credenciales.');
  }

  console.log(
    `✅ Inventario cargado: ${allRows.length} filas leídas | ${activeRows.length} ACTIVOS | ${inactiveRows.length} INACTIVOS/NO-ACTIVOS`
  );

  // Conjuntos para verificación estricta de seguridad
  const activeIdsSet = new Set(activeRows.map((r) => normSlug(r.id)));
  const activeNamesSet = new Set(activeRows.map((r) => normSlug(r.nombre_perfume)));
  const inactiveOnlyRows = inactiveRows.filter(
    (ir) => !activeIdsSet.has(normSlug(ir.id)) && !activeNamesSet.has(normSlug(ir.nombre_perfume))
  );
  const inactiveIdsSet = new Set(inactiveOnlyRows.map((r) => normSlug(r.id)));
  const inactiveNamesSet = new Set(inactiveOnlyRows.map((r) => normSlug(r.nombre_perfume)));

  const records: ComboTestRecord[] = [];
  let ficticiosCount = 0;
  let inactivosCount = 0;
  let lessThan3Count = 0;

  const inspectResult = (recs: ScoredPerfume[]) => {
    if (recs.length < 3) lessThan3Count++;
    let exactMatches = 0;
    let fallbackMatches = 0;

    const top3 = recs.map((r) => {
      const idSlug = normSlug(r.perfume.id);
      const nameSlug = normSlug(r.perfume.name);
      const isFicticio = isFakePerfume(r.perfume.name, r.perfume.brand);
      const isActiveInSheet = activeIdsSet.has(idSlug) || activeNamesSet.has(idSlug);
      const isInactive =
        !isActiveInSheet ||
        inactiveIdsSet.has(idSlug) ||
        inactiveNamesSet.has(idSlug) ||
        inactiveNamesSet.has(nameSlug);

      if (isFicticio) ficticiosCount++;
      if (isInactive) inactivosCount++;

      const level = r.cascadeLevel ?? (r.isFallback ? 2 : 1);
      if (level === 1 && !r.isFallback) exactMatches++;
      else fallbackMatches++;

      return {
        id: r.perfume.id,
        name: r.perfume.name,
        brand: r.perfume.brand,
        cascadeLevel: level,
        isFallback: Boolean(r.isFallback),
        isFicticio,
        isInactive,
      };
    });

    return { exactMatches, fallbackMatches, top3 };
  };

  // 2A. Probar TODAS las combinaciones de Guía IA (3 x 5 x 7 = 105)
  for (const gen of AIGUIDE_GENEROS) {
    for (const occ of AIGUIDE_OCASIONES) {
      for (const fam of AIGUIDE_FAMILIAS) {
        const gCode: Gender = gen === 'HOMBRE' ? 'M' : gen === 'MUJER' ? 'F' : 'U';
        const recs = recommendFromActiveSheets(
          {
            name: '',
            gender: gCode,
            occasion: mapOccasion(occ),
            projection: '',
            feel: mapFeels('', fam),
            familyFilter: fam,
            avoid: [],
          },
          activeRows
        );
        const evaluated = inspectResult(recs);
        records.push({
          flow: 'Guía IA',
          label: `Guía IA | ${gen} | ${occ} | ${fam}`,
          gender: gen,
          occasion: occ,
          expression: 'N/A',
          family: fam,
          avoid: 'Ninguna',
          ...evaluated,
        });
      }
    }
  }

  // 2B. Probar TODAS las combinaciones del Wizard completo (6 x 5 x 4 x 9 x 5 = 5,400)
  for (const gen of WIZARD_GENEROS) {
    for (const occ of WIZARD_OCASIONES) {
      for (const exp of WIZARD_EXPRESIONES) {
        for (const nota of WIZARD_NOTAS) {
          for (const avoid of WIZARD_EVITAR) {
            const recs = recommend(
              {
                name: 'Test',
                gender: mapWizardGender(gen),
                occasion: mapOccasion(occ),
                projection: mapProjection(exp),
                feel: mapFeels(exp, nota),
                familyFilter: nota,
                avoid: mapAvoid(avoid),
                referencePerfume: '',
              },
              undefined,
              undefined,
              activeRows
            );
            const evaluated = inspectResult(recs);
            records.push({
              flow: 'Wizard',
              label: `Wizard | ${gen} | ${occ} | ${exp} | ${nota} | Evitar:${avoid}`,
              gender: gen,
              occasion: occ,
              expression: exp,
              family: nota,
              avoid,
              ...evaluated,
            });
          }
        }
      }
    }
  }

  // 3. Resumen estadístico (a)
  const summarize = (list: ComboTestRecord[]) => ({
    total: list.length,
    exact3Plus: list.filter((r) => r.exactMatches >= 3).length,
    exact1to2: list.filter((r) => r.exactMatches >= 1 && r.exactMatches <= 2).length,
    exact0: list.filter((r) => r.exactMatches === 0).length,
  });

  const allSummary = summarize(records);
  const aiGuideSummary = summarize(records.filter((r) => r.flow === 'Guía IA'));
  const wizardSummary = summarize(records.filter((r) => r.flow === 'Wizard'));

  // 4. Tabla de combinaciones más débiles (0 -> 1 -> 2 matches exactos)
  // Deduplicamos rangos de edad del Wizard (18-25 / 26-40 / 40+ producen el mismo match) para que la tabla sea legible y cubra todas las combinaciones únicas débiles
  const weakRecordsAll = records.filter((r) => r.exactMatches < 3);
  const seenWeakSignature = new Set<string>();
  const uniqueWeakRecords: ComboTestRecord[] = [];
  for (const r of weakRecordsAll) {
    const baseGender = r.gender.startsWith('Hombre')
      ? 'Hombre'
      : r.gender.startsWith('Mujer')
        ? 'Mujer'
        : r.gender;
    const sig = `${r.flow}|${baseGender}|${r.occasion}|${r.expression}|${r.family}|${r.avoid}`;
    if (!seenWeakSignature.has(sig)) {
      seenWeakSignature.add(sig);
      uniqueWeakRecords.push({ ...r, gender: baseGender });
    }
  }

  uniqueWeakRecords.sort(
    (a, b) => a.exactMatches - b.exactMatches || a.flow.localeCompare(b.flow)
  );

  // Mostramos hasta 120 filas representativas (priorizando todas las de Guía IA débiles y las de exactMatches=0 primero)
  const weakAiGuide = uniqueWeakRecords.filter((r) => r.flow === 'Guía IA');
  const weakWizardSample = uniqueWeakRecords
    .filter((r) => r.flow === 'Wizard')
    .slice(0, 100);
  const weakDisplay = [...weakAiGuide, ...weakWizardSample].sort(
    (a, b) => a.exactMatches - b.exactMatches || a.flow.localeCompare(b.flow)
  );

  const weakTableRows = weakDisplay
    .map((r) => {
      const topStr = r.top3
        .map((p) => `${p.name} [N${p.cascadeLevel}]${p.isFicticio ? ' ⚠️FICTICIO' : ''}${p.isInactive ? ' ⚠️INACTIVO' : ''}`)
        .join(' · ');
      return `| ${r.flow} | ${r.gender} | ${r.occasion} | ${r.expression} | ${r.family} | ${r.avoid} | ${r.exactMatches} | ${r.fallbackMatches} | ${topStr} |`;
    })
    .join('\n');

  // 5. Auditoría del Sheet (c)
  const sheetAuditSection = auditSheetLabels(allRows);

  // 6. Escribir REPORTE_TEST_BOT.md
  const pct = (n: number, tot: number) => ((n / (tot || 1)) * 100).toFixed(1);
  const report = `# 📊 REPORTE_TEST_BOT.md — Auditor Automático del Bot de Fragancias

> **Generado:** ${new Date().toISOString()}
> **Fuente en vivo:** Google Sheets \`InventarioBot!A1:H1000\` (\`cache: 'no-store'\`)
> **Inventario leído:** **${activeRows.length}** perfumes \`ACTIVO\` | **${inactiveRows.length}** filas no activas | **${allRows.length}** filas totales
> **Total combinaciones ejecutadas:** **${allSummary.total}** (Guía IA: ${aiGuideSummary.total} + Wizard completo: ${wizardSummary.total})

---

## 1. 📈 Resumen de Combinaciones

### Resumen Global (${allSummary.total} combinaciones)

| Categoría | Combinaciones | Porcentaje |
|-----------|--------------:|-----------:|
| ✅ 3+ matches exactos (Nivel 1 sin fallback) | ${allSummary.exact3Plus} | ${pct(allSummary.exact3Plus, allSummary.total)}% |
| 🟡 1-2 matches exactos (completado con cascada N2-N4) | ${allSummary.exact1to2} | ${pct(allSummary.exact1to2, allSummary.total)}% |
| 🔴 0 matches exactos (100% cascada N2-N4) | ${allSummary.exact0} | ${pct(allSummary.exact0, allSummary.total)}% |

### Desglose por Flujo

| Flujo | Total | ✅ 3+ Exactos | 🟡 1-2 Exactos | 🔴 0 Exactos |
|-------|------:|--------------:|---------------:|-------------:|
| **Guía IA** (\`/api/ai-guide\`) | ${aiGuideSummary.total} | ${aiGuideSummary.exact3Plus} (${pct(aiGuideSummary.exact3Plus, aiGuideSummary.total)}%) | ${aiGuideSummary.exact1to2} (${pct(aiGuideSummary.exact1to2, aiGuideSummary.total)}%) | ${aiGuideSummary.exact0} (${pct(aiGuideSummary.exact0, aiGuideSummary.total)}%) |
| **Wizard 6 Pasos** (\`/api/chat\`) | ${wizardSummary.total} | ${wizardSummary.exact3Plus} (${pct(wizardSummary.exact3Plus, wizardSummary.total)}%) | ${wizardSummary.exact1to2} (${pct(wizardSummary.exact1to2, wizardSummary.total)}%) | ${wizardSummary.exact0} (${pct(wizardSummary.exact0, wizardSummary.total)}%) |

---

## 2. 🧪 Combinaciones Más Débiles (0 → 1 → 2 matches exactos)

> Se muestran todas las combinaciones únicas débiles de **Guía IA** (${weakAiGuide.length}) y muestra de **Wizard** (${weakWizardSample.length} de ${uniqueWeakRecords.filter((r) => r.flow === 'Wizard').length} perfiles únicos con <3 matches exactos), ordenadas de **0 → 1 → 2** matches exactos.
> Etiquetas \`[N1]..[N4]\` indican el nivel de cascada real que entregó cada perfume.

| Flujo | Género | Ocasión | Expresión/Int. | Familia/Notas | Evitar | Exactos | Fallback | Top 3 Reales Entregados |
|-------|--------|---------|----------------|---------------|--------|--------:|---------:|-------------------------|
${weakTableRows || '| - | - | - | - | - | - | 0 | 0 | Todas las combinaciones obtuvieron 3+ matches exactos |'}

---

${sheetAuditSection}

---

## 4. 🔒 Verificación Estricta de Seguridad

| Verificación | Resultado |
|--------------|-----------|
| Normalización \`"DULCE" === "DULCES"\` | ✅ PASS |
| Normalización \`"CITA ROMANTICA" === "CITA ROMATICA"\` | ✅ PASS |
| Combinaciones con menos de 3 recomendaciones reales | ${lessThan3Count === 0 ? '✅ 0 (100% entrega 3 reales)' : `❌ ${lessThan3Count}`} |
| Perfumes \`INACTIVO\` aparecidos en ${allSummary.total} pruebas | ${inactivosCount === 0 ? '✅ 0 (correcto)' : `❌ ${inactivosCount} detectados`} |
| Perfumes FICTICIOS (\`Nuit de Marbre\`, \`Oud Céleste\`, \`Ambre Noir\`, \`Touche Essencielle\`) | ${ficticiosCount === 0 ? '✅ 0 (correcto)' : `❌ ${ficticiosCount} detectados`} |

---

*Reporte generado automáticamente por \`test_recommender.ts\`*
`;

  const reportPath = path.join(__dirname, 'REPORTE_TEST_BOT.md');
  fs.writeFileSync(reportPath, report, 'utf-8');

  console.log(`\n✅ REPORTE_TEST_BOT.md generado en: ${reportPath}`);
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`Total combinaciones: ${allSummary.total} (Guía IA: ${aiGuideSummary.total} | Wizard: ${wizardSummary.total})`);
  console.log(`✅ 3+ exactos: ${allSummary.exact3Plus} (${pct(allSummary.exact3Plus, allSummary.total)}%)`);
  console.log(`🟡 1-2 exactos: ${allSummary.exact1to2} (${pct(allSummary.exact1to2, allSummary.total)}%)`);
  console.log(`🔴 0 exactos: ${allSummary.exact0} (${pct(allSummary.exact0, allSummary.total)}%)`);
  console.log(`🔒 <3 recomendaciones: ${lessThan3Count} | INACTIVOS: ${inactivosCount} | FICTICIOS: ${ficticiosCount}`);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (ficticiosCount > 0 || inactivosCount > 0 || lessThan3Count > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('❌ Error fatal en test_recommender.ts:', err);
  process.exit(1);
});
