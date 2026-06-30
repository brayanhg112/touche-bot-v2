import { GoogleGenerativeAI } from "@google/generative-ai";
import { getInventory } from '@/lib/googleSheets';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const inventario = await getInventory();
        const inventarioTexto = inventario
            .filter(p => p.estado === 'ACTIVO')
            .map(p => `${p.nombre} (${p.tipo})`)
            .join(', ');

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            systemInstruction: `Eres Aria, la sommelier de fragancias de lujo de Touche Essencielle. Inventario disponible: ${inventarioTexto}.`
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
        return Response.json({ message: "El bot está en mantenimiento. Intenta de nuevo en un minuto." }, { status: 500 });
    }
}