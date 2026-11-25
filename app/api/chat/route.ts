export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getInventoryFromSheets, PerfumeSheetRow } from '@/app/lib/sheets';
import { buildAriaSystemPrompt } from '@/lib/ariaPrompt';
import { recommend } from '../../lib/recommender';
import type { Gender, Occasion, Feel, Projection } from '../../lib/types';
import { catalog } from '../../lib/catalog';

// ─────────────────────────────────────────────────────────────────────────────
// WIZARD STEPS — strict 6-step definition
// ─────────────────────────────────────────────────────────────────────────────

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
    options: Array.from(new Set(catalog.map((p) => p.name))).sort().concat(['Otro / No sé']),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mapping helpers — convert wizard button values → CascadeAnswers fields
// ─────────────────────────────────────────────────────────────────────────────

function mapGender(val: string): Gender {
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
  if (e.includes('frescura') || e.includes('limpieza')) {
    return 'discreta';
  }
  if (e.includes('elegancia') || e.includes('seriedad')) {
    return 'moderada';
  }
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

  const seen = new Set<Feel>();
  const unique: Feel[] = [];
  for (const f of feels) {
    if (!seen.has(f)) {
      seen.add(f);
      unique.push(f);
    }
  }
  return unique;
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

// ─────────────────────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ─── 1. MODO CONVERSACIONAL (AI Chat con Aria) ──────────────────────────
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      let stockData: PerfumeSheetRow[] = [];
      try {
        stockData = await getInventoryFromSheets();
      } catch (err) {
        console.error(
          '❌ [POST /api/chat - Aria] Error leyendo inventario en vivo de Google Sheets:',
          err instanceof Error ? err.message : err
        );
        return Response.json(
          { error: 'No se pudo consultar el inventario en vivo de Google Sheets.' },
          { status: 503 }
        );
      }

      if (!stockData || stockData.length === 0) {
        console.error('❌ [POST /api/chat - Aria] InventarioBot devolvió 0 perfumes ACTIVOS.');
        return Response.json(
          { error: 'No hay inventario ACTIVO disponible en este momento.' },
          { status: 503 }
        );
      }

      const systemInstruction = buildAriaSystemPrompt(stockData);

      if (process.env.ANTHROPIC_API_KEY) {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemInstruction,
          messages: body.messages.map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        });
        const contentBlock = response.content[0];
        const text = contentBlock.type === 'text' ? contentBlock.text : '';
        return Response.json({ message: text, stockData });
      }

      if (process.env.OPENAI_API_KEY) {
        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: systemInstruction }, ...body.messages],
            max_tokens: 1024,
          }),
          cache: 'no-store',
        });
        const openAiData = await openAiRes.json();
        const text = openAiData.choices?.[0]?.message?.content || 'Sin respuesta';
        return Response.json({ message: text, stockData });
      }

      if (process.env.GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction,
        });

        const allMessages = body.messages.map((m: { role: string; content: string }) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const lastMessage = allMessages[allMessages.length - 1];
        const history = allMessages.slice(0, -1);
        const firstUserIndex = history.findIndex((m: { role: string }) => m.role === 'user');
        const validHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];

        const chat = model.startChat({ history: validHistory });
        const result = await chat.sendMessage(lastMessage.parts[0].text);
        const response = await result.response;
        return Response.json({ message: response.text(), stockData });
      }

      return Response.json({
        message: 'Aria está activa, pero no se encontró ANTHROPIC_API_KEY, OPENAI_API_KEY ni GEMINI_API_KEY configurada.',
        stockData,
      });
    }

    // ─── 2. MODO WIZARD PASO A PASO ─────────────────────────────────────────
    const currentStep: number = typeof body.step === 'number' ? body.step : 0;
    const answers: string[] = Array.isArray(body.answers) ? body.answers : [];

    const nextStep = currentStep + 1;

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

    const genderRaw = answers[0] ?? '';
    const occasionRaw = answers[1] ?? '';
    const expressRaw = answers[2] ?? '';
    const notesRaw = answers[3] ?? '';
    const avoidRaw = answers[4] ?? '';
    const referenceRaw = answers[5] ?? '';

    const botAnswers = {
      name: '',
      gender: mapGender(genderRaw),
      occasion: mapOccasion(occasionRaw),
      projection: mapProjection(expressRaw),
      feel: mapFeels(expressRaw, notesRaw),
      familyFilter: notesRaw,
      avoid: mapAvoid(avoidRaw),
      referencePerfume:
        referenceRaw.toLowerCase().includes('otro') || referenceRaw.toLowerCase().includes('no sé')
          ? ''
          : referenceRaw,
    };

    // BLOQUE 3: Cargar inventario SIEMPRE en vivo desde Google Sheets (sin respaldo JSON local obsoleto)
    let sheetsInventory: PerfumeSheetRow[] = [];
    try {
      sheetsInventory = await getInventoryFromSheets();
    } catch (sheetErr) {
      console.error(
        '❌ [POST /api/chat - Wizard] Falló la lectura en vivo de Google Sheets (InventarioBot):',
        sheetErr instanceof Error ? sheetErr.message : sheetErr
      );
      return Response.json(
        {
          error: 'No pudimos consultar el inventario en vivo en este momento.',
          step: 7,
          question: 'Ocurrió un error al consultar el inventario en vivo. Por favor intenta de nuevo.',
          options: [],
          is_finished: true,
          recommendations: [],
        },
        { status: 503 }
      );
    }

    if (!sheetsInventory || sheetsInventory.length === 0) {
      console.error('❌ [POST /api/chat - Wizard] Sheets devolvió 0 perfumes ACTIVOS en InventarioBot.');
      return Response.json(
        {
          error: 'No se encontraron perfumes ACTIVOS en InventarioBot.',
          step: 7,
          question: 'No hay fragancias activas disponibles en este momento.',
          options: [],
          is_finished: true,
          recommendations: [],
        },
        { status: 503 }
      );
    }

    const results = recommend(botAnswers, undefined, undefined, sheetsInventory);

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
    console.error('❌ [POST /api/chat] Error crítico en Wizard/Chat API:', msg);
    return Response.json(
      {
        step: 1,
        question: STEPS[0].question,
        options: STEPS[0].options,
        is_finished: false,
        recommendations: null,
      },
      { status: 500 }
    );
  }
}
