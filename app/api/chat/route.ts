import { GoogleGenerativeAI } from "@google/generative-ai";
import { getInventory } from '@/lib/googleSheets';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    const { messages } = await req.json();

    // 1. Pedimos el inventario al "Almacén"
    const inventario = await getInventory();
    const inventarioTexto = inventario
        .filter(p => p.estado === 'ACTIVO')
        .map(p => `${p.nombre} (${p.tipo})`)
        .join(', ');

    // 2. Instrucción de Aria
    const systemInstruction = `Eres Aria, la sommelier de fragancias de lujo de Touche Essencielle.
    Tu inventario disponible (solo recomienda de aquí): ${inventarioTexto}.
    
    Tu lógica de respuesta es:
    1. SI el usuario hace una pregunta abierta (ej: "¿Cómo elijo un perfume?"): RESPONDE como experta, educa, da consejos sobre pH, notas, ocasiones, y luego ofrece opciones del inventario si aplica.
    2. SI el usuario hace clic en una opción o busca un producto directo (ej: "Cítrico y fresco"): ACTÚA como filtro. Busca en el inventario, PERO presenta los resultados con tu toque sofisticado y explica POR QUÉ esos productos encajan con lo que pidió.
    
    NUNCA des una lista simple. Tu respuesta siempre debe ser:
    - Un saludo o reconocimiento del estilo/solicitud del cliente.
    - La recomendación técnica (explicando notas y sensaciones, usando los productos del inventario).
    - Una invitación a interactuar más (pregunta abierta).
    
    Mantén un tono de lujo, elegante, empático y editorial (Royal Purple & Obsidian aesthetic).`;

    // 3. Inicializamos el modelo
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction
    });

    // 4. Mapeamos y limpiamos el historial (Fix de roles para Gemini)
    const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    // Aseguramos que el historial no empiece con un mensaje del modelo
    const validHistory = (history.length > 0 && history[0].role === 'model')
        ? history.slice(1)
        : history;

    const chat = model.startChat({
        history: validHistory,
    });

    // 5. Enviamos el último mensaje y retornamos respuesta
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;

    return Response.json({ message: response.text() });
}