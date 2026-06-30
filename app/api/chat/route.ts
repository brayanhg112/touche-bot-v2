import { GoogleGenerativeAI } from "@google/generative-ai";
import { getInventory } from '@/lib/googleSheets';

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

    // 1. Mapeamos mensajes
    const allMessages = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    // 2. Extraemos el último mensaje (el que el usuario acaba de enviar)
    const lastMessage = allMessages[allMessages.length - 1];

    // 3. Tomamos el historial previo (todo menos el último)
    const history = allMessages.slice(0, -1);

    // 4. LIMPIEZA TOTAL: Buscamos el primer mensaje que sea 'user'
    // Si no hay ninguno, el historial será vacío (lo cual es seguro)
    const firstUserIndex = history.findIndex((m: any) => m.role === 'user');
    const validHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];

    // 5. Iniciamos el chat
    const chat = model.startChat({
        history: validHistory,
    });

    // 6. Enviamos el último mensaje
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const response = await result.response;

    return Response.json({ message: response.text() });
}