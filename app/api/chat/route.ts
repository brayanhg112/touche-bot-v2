import { GoogleGenerativeAI } from "@google/generative-ai";
import { getInventory } from '@/lib/googleSheets';

// Asegúrate de que esta línea esté limpia y use GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    const { messages } = await req.json();

    const inventario = await getInventory();
    const inventarioTexto = inventario
        .filter(p => p.estado === 'ACTIVO')
        .map(p => `${p.nombre} (${p.tipo})`)
        .join(', ');

    const systemInstruction = `Eres Aria, la sommelier de fragancias de lujo de Touche Essencielle.
    Tu inventario disponible: ${inventarioTexto}.
    
    Tu lógica de respuesta es:
    1. SI el usuario hace una pregunta abierta: RESPONDE como experta, educa, y ofrece opciones del inventario.
    2. SI el usuario busca un producto directo: ACTÚA como filtro. Presenta resultados con toque sofisticado.
    
    Tono: Lujo, elegante, editorial (Royal Purple & Obsidian aesthetic).`;

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction
    });

    const chat = model.startChat({
        history: messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        })),
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;

    return Response.json({ message: response.text() });
}