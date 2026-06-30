import { GoogleGenerativeAI } from "@google/generative-ai";
import { getInventory } from '@/lib/googleSheets';

// Inicialización del cliente
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // 1. Obtención de datos del "Almacén"
        const inventario = await getInventory();
        const inventarioTexto = inventario
            .filter(p => p.estado === 'ACTIVO')
            .map(p => `${p.nombre} (${p.tipo})`)
            .join(', ');

        // 2. Configuración del modelo
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `Eres Aria, la sommelier de fragancias de lujo de Touche Essencielle.
            Tu inventario disponible: ${inventarioTexto}.
            Tono: Lujo, elegante, editorial (Royal Purple & Obsidian aesthetic).`
        });

        // 3. Preparación del historial (Limpieza extrema)
        // Eliminamos todo hasta que encontremos el primer mensaje de usuario
        const rawHistory = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

        const firstUserIndex = rawHistory.findIndex((m: any) => m.role === 'user');
        const validHistory = firstUserIndex !== -1 ? rawHistory.slice(firstUserIndex) : [];

        // 4. Chat y respuesta
        const chat = model.startChat({ history: validHistory });
        const lastMessage = messages[messages.length - 1];

        const result = await chat.sendMessage(lastMessage.content);
        const response = await result.response;

        return Response.json({ message: response.text() });

    } catch (error) {
        console.error("Error crítico en API Chat:", error);
        return Response.json({ message: "Error interno del bot. Revisa los logs de Vercel." }, { status: 500 });
    }
}