export const dynamic = 'force-dynamic';
export const revalidate = 0;

import fs from 'fs';
import path from 'path';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getInventoryFromSheets, PerfumeSheetRow } from '@/app/lib/sheets';
import { buildAriaSystemPrompt } from '@/lib/ariaPrompt';
import { recommend } from '../../lib/recommender';
import type { BotAnswers, Gender, Occasion, Feel, PerfumeStockItem } from '../../lib/types';
import { catalog } from '../../lib/catalog';

// ─────────────────────────────────────────────────────────────────────────────
// WIZARD STEPS — strict 6-step definition (no AI, no free text)
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
  if (v.includes('deporte')) return 'diario';
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
  else if (n.includes('aromátic')) feels.push('verde');
  else if (n.includes('atalcado')) feels.push('atalcado', 'polvo');
  else if (n.includes('oriental') || n.includes('especiad')) feels.push('especiado', 'oud');
  else if (n.includes('acuátic')) feels.push('acuatico', 'fresco');

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

    // ─── 1. MODO CONVERSACIONAL (AI Chat con Aria) ──────────────────────────
    // Cuando el cliente envía { messages: [...] } para chatear directamente con Aria
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      // Fetch live stock desde Google Sheets (InventarioBot!A1:H1000) filtrando solo ACTIVO
      let stockData: PerfumeSheetRow[] = [];
      try {
        stockData = await getInventoryFromSheets();
      } catch (err) {
        console.warn('⚠️ [API Chat Aria] Falló lectura de Sheets, usando inventario local:', err);
      }

      // Log crucial solicitado justo antes de enviarlo a Claude/OpenAI/Gemini
      console.log("Datos extraídos de Sheets:", stockData);

      // Construcción del prompt de Aria con instrucciones de familia_olfativa y ocasion
      const systemInstruction = buildAriaSystemPrompt(stockData);

      // Envío a Claude (Anthropic)
      if (process.env.ANTHROPIC_API_KEY) {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemInstruction,
          messages: body.messages.map((m: any) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        });
        const contentBlock = response.content[0];
        const text = contentBlock.type === 'text' ? contentBlock.text : '';
        return Response.json({ message: text, stockData });
      }

      // Envío a OpenAI si está configurado
      if (process.env.OPENAI_API_KEY) {
        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemInstruction },
              ...body.messages,
            ],
            max_tokens: 1024,
          }),
        });
        const openAiData = await openAiRes.json();
        const text = openAiData.choices?.[0]?.message?.content || 'Sin respuesta';
        return Response.json({ message: text, stockData });
      }

      // Envío a Gemini si está configurado
      if (process.env.GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction,
        });

        const allMessages = body.messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const lastMessage = allMessages[allMessages.length - 1];
        const history = allMessages.slice(0, -1);
        const firstUserIndex = history.findIndex((m: any) => m.role === 'user');
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
    // Expect: { step: number, answers: string[] }
    const currentStep: number = typeof body.step === 'number' ? body.step : 0;
    const answers: string[] = Array.isArray(body.answers) ? body.answers : [];

    const nextStep = currentStep + 1;

    // Si aún no se completaron los 6 pasos, devolver la siguiente pregunta
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

    // Respuestas completas: armar BotAnswers
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

    // Cargar inventario en vivo de Sheets
    let stockMap: Record<string, boolean> | undefined;
    let inventoryData: Record<string, { gender?: string; olfactory_family?: string; occasion?: string; intensity?: string; active?: boolean }> | undefined;
    try {
      const liveStock = await getInventoryFromSheets();
      if (liveStock && liveStock.length > 0) {
        stockMap = {};
        inventoryData = {};
        for (const item of liveStock) {
          stockMap[item.id] = true;
          stockMap[item.nombre_perfume] = true;
          inventoryData[item.id] = {
            gender: item.genero,
            olfactory_family: item.familia_olfativa,
            occasion: item.ocasion,
            intensity: item.intensidad,
            active: true,
          };
          inventoryData[item.nombre_perfume] = inventoryData[item.id];
        }
      }
    } catch (sheetErr) {
      console.warn('⚠️ [Wizard] Error leyendo Sheets en vivo, recurriendo a inventario local:', sheetErr);
    }

    // Fallback a data/inventory.json si Sheets no devolvió datos
    if (!stockMap || Object.keys(stockMap).length === 0) {
      try {
        const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');
        const raw = fs.readFileSync(inventoryPath, 'utf-8');
        const inventory: Record<string, PerfumeStockItem> = JSON.parse(raw);
        stockMap = {};
        inventoryData = {};
        for (const item of Object.values(inventory)) {
          stockMap[item.id] = item.active;
          inventoryData[item.id] = {
            gender: item.gender,
            olfactory_family: item.olfactory_family,
            occasion: item.occasion,
            intensity: item.intensity,
            active: item.active,
          };
        }
      } catch {
        stockMap = undefined;
        inventoryData = undefined;
      }
    }

    const results = recommend(botAnswers, stockMap, inventoryData);

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
    console.error('Error crítico en Wizard/Chat API:', msg);
    return Response.json({
      step: 1,
      question: STEPS[0].question,
      options: STEPS[0].options,
      is_finished: false,
      recommendations: null,
    }, { status: 500 });
  }
}
