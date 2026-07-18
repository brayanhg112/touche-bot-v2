export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getInventory } from '@/lib/googleSheets';
import { recommend } from '../../lib/recommender';
import type { BotAnswers, Gender, Occasion, Feel } from '../../lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// WIZARD STEPS — strict 6-step definition (no AI, no free text)
// ─────────────────────────────────────────────────────────────────────────────

import { catalog } from '../../lib/catalog';

const STEPS = [
  {
    step: 1,
    question: 'Empecemos. ¿Cuál es tu género y rango de edad?',
    options: [
      'Hombre (18-25)',
      'Hombre (26-40)',
      'Hombre (40+)',
      'Mujer (18-25)',
      'Mujer (26-40)',
      'Mujer (40+)',
    ],
  },
  {
    step: 2,
    question: '¿Para qué ocasión buscas la fragancia?',
    options: ['Oficina', 'Uso diario', 'Cita romántica', 'Evento formal', 'Deporte'],
  },
  {
    step: 3,
    question: '¿Qué deseas expresar con tu fragancia?',
    options: ['Elegancia / Seriedad', 'Sensualidad / Atrevimiento', 'Frescura / Limpieza', 'Éxito / Poder'],
  },
  {
    step: 4,
    question: '¿Qué familia de notas prefieres?',
    options: ['Orientales/Especiadas', 'Frutales', 'Florales', 'Frescos', 'Amaderados', 'Cítricas', 'Aromáticas', 'Acuáticos', 'Atalcado'],
  },
  {
    step: 5,
    question: '¿Hay algún tipo de nota que quieras evitar?',
    options: ['Muy Dulces', 'Muy Intensas / Pesadas', 'Cítricas', 'Amaderadas', 'Ninguna'],
  },
  {
    step: 6,
    question: 'Por último, ¿cuáles han sido los perfumes que más has usado o que más te han gustado? (Selecciona varios)',
    options: Array.from(new Set(catalog.map(p => p.name))).sort().concat(['Otro / No sé']),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mapping helpers — convert wizard button values → BotAnswers fields
// ─────────────────────────────────────────────────────────────────────────────

function mapGender(val: string): Gender {
  return val.toLowerCase().startsWith('mujer') ? 'F' : 'M';
}

function mapOccasion(val: string): Occasion {
  const v = val.toLowerCase();
  if (v.includes('oficina')) return 'trabajo';
  if (v.includes('cita')) return 'cita';
  if (v.includes('formal')) return 'evento';
  if (v.includes('diario')) return 'diario';
  if (v.includes('deporte')) return 'diario'; // closest mapping
  return 'diario';
}

function mapFeels(express: string, notes: string): Feel[] {
  const feels: Feel[] = [];

  const e = express.toLowerCase();
  if (e.includes('sensualidad') || e.includes('atrevimiento')) feels.push('especiado', 'oud');
  else if (e.includes('frescura') || e.includes('limpieza')) feels.push('fresco', 'acuatico');
  else if (e.includes('éxito') || e.includes('poder')) feels.push('amaderado');
  else if (e.includes('elegancia') || e.includes('seriedad')) feels.push('amaderado', 'fresco');

  const n = notes.toLowerCase();
  if (n.includes('cítric')) feels.push('citrico');
  else if (n.includes('amadera')) feels.push('amaderado');
  else if (n.includes('floral')) feels.push('floral');
  else if (n.includes('frutal')) feels.push('frutal');
  else if (n.includes('fresco')) feels.push('fresco');
  else if (n.includes('aromátic')) feels.push('verde'); // Aromatic maps closely to verde in this model
  else if (n.includes('atalcado')) feels.push('atalcado', 'polvo');
  else if (n.includes('oriental') || n.includes('especiad')) feels.push('especiado', 'oud');
  else if (n.includes('acuátic')) feels.push('acuatico', 'fresco');

  // Deduplicate
  const seen = new Set<Feel>();
  const unique: Feel[] = [];
  for (const f of feels) { if (!seen.has(f)) { seen.add(f); unique.push(f); } }
  return unique;
}

function mapAvoid(avoidVal: string): string[] {
  if (!avoidVal || avoidVal.toLowerCase().includes('ninguna')) return [];
  const v = avoidVal.toLowerCase();
  if (v.includes('dulce')) return ['dulce', 'gourmand'];
  if (v.includes('intensa') || v.includes('pesada')) return ['oud'];
  if (v.includes('cítric')) return ['citrico'];
  if (v.includes('amadera')) return ['amaderado'];
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Expect: { step: number, answers: string[] }
    const currentStep: number = typeof body.step === 'number' ? body.step : 0;
    const answers: string[] = Array.isArray(body.answers) ? body.answers : [];

    // Guard: reject free-text or unexpected payload
    const nextStep = currentStep + 1;

    // If we haven't reached step 6 yet, return the next question
    if (nextStep <= 6) {
      const stepDef = STEPS[nextStep - 1];
      return Response.json({
        step: stepDef.step,
        question: stepDef.question,
        options: stepDef.options,
        is_finished: false,
        recommendations: null,
      });
    }

    // ── All 6 answers collected — build BotAnswers and run recommender ──
    // answers[0] = gender/age, [1] = occasion, [2] = expression,
    // [3] = preferred notes, [4] = avoid, [5] = reference perfume

    const genderRaw = answers[0] ?? '';
    const occasionRaw = answers[1] ?? '';
    const expressRaw = answers[2] ?? '';
    const notesRaw = answers[3] ?? '';
    const avoidRaw = answers[4] ?? '';
    const referenceRaw = answers[5] ?? '';

    const botAnswers: BotAnswers = {
      name: '',
      gender: mapGender(genderRaw),
      occasion: mapOccasion(occasionRaw),
      projection: '',
      feel: mapFeels(expressRaw, notesRaw),
      avoid: mapAvoid(avoidRaw),
      referencePerfume: referenceRaw.toLowerCase().includes('otro') || referenceRaw.toLowerCase().includes('no sé')
        ? ''
        : referenceRaw,
    };

    // Load live stock map
    let stockMap: Record<string, boolean> | undefined;
    try {
      const inventory = await getInventory();
      stockMap = {};
      for (const item of inventory) {
        stockMap[item.id] = item.estado === 'ACTIVO';
      }
    } catch {
      stockMap = undefined;
    }

    const results = recommend(botAnswers, stockMap);

    return Response.json({
      step: 7,
      question: '✨ Aquí están tus fragancias ideales, seleccionadas especialmente para ti.',
      options: [],
      is_finished: true,
      recommendations: results.slice(0, 3),
      botAnswers,
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error crítico en Wizard API:', msg);
    // Return step 1 to restart gracefully
    return Response.json({
      step: 1,
      question: STEPS[0].question,
      options: STEPS[0].options,
      is_finished: false,
      recommendations: null,
    }, { status: 500 });
  }
}