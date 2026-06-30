import { GoogleGenerativeAI } from "@google/generative-ai";
import { getInventory } from '@/lib/googleSheets';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const inventario = await getInventory();
        const inventarioTexto = inventario
            .filter(p => p.estado === 'ACTIVO')
            .map(p => `${p.nombre} (Notas: ${p.tipo})`)
            .join(', ');

        // ESTA ES LA CAMISA DE FUERZA:
        const systemInstruction = `Eres Aria, asistente de Touche Essencielle. 
        TU TRABAJO: Guiar al cliente paso a paso mediante un cuestionario de 4 pasos. 
        NO seas poética, NO escribas párrafos largos. Sé breve y estructurada.

        FLUJO OBLIGATORIO:
        Paso 1: Pregunta la OCASIÓN (Ej: A. Oficina, B. Cita, C. Evento).
        Paso 2: Pregunta qué NOTAS le gustan (Ej: A. Cítrico, B. Amaderado, C. Floral).
        Paso 3: Pregunta qué NOTAS NO le gustan (Ej: A. Dulce, B. Cítrico, C. Amaderado).
        Paso 4: Con base en lo anterior y este inventario: ${inventarioTexto}, recomienda 2 perfumes exactos.

        REGLAS DE ORO:
        - Si el cliente no ha pasado por los 4 pasos, NO recomiendes perfumes todavía.
        - Muestra siempre opciones como "A) Opción, B) Opción".
        - Si el cliente escribe algo que no es una opción, ignora el texto y re-haz la pregunta del paso actual.
        - Tono: Profesional, directo, ejecutivo.`;

        const model = genAI.getGenerativeModel({
            model: "gemini-3.5-flash",
            systemInstruction: systemInstruction
        });

        const rawHistory = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

        const firstUserIndex = rawHistory.findIndex((m: any) => m.role === 'user');
        const validHistory = firstUserIndex !== -1 ? rawHistory.slice(firstUserIndex) : [];

        const chat = model.startChat({ history: validHistory });
        const lastMessage = messages[messages.length - 1];

        const result = await chat.sendMessage(lastMessage.content);
        const response = await result.response;

        return Response.json({ message: response.text() });

    } catch (error: any) {
        console.error("Error crítico en API Chat:", error.message);
        return Response.json({ message: "Error técnico. Por favor, reinicia." }, { status: 500 });
    }
}