import { Anthropic } from '@anthropic-ai/sdk';
import { getInventory } from '@/lib/googleSheets'; // Aquí es donde Aria lee tu inventario

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
    const { messages } = await req.json();

    // 1. Pedimos el inventario al "Almacén" (la función que ya funciona)
    const inventario = await getInventory();

    // 2. Preparamos la lista para Aria
    const inventarioTexto = inventario
        .filter(p => p.estado === 'ACTIVO')
        .map(p => `${p.nombre} (${p.tipo})`)
        .join(', ');

    // 3. Instrucción secreta para Aria (Modo Inteligente Híbrido)
    const systemPrompt = {
        role: "system",
        content: `Eres Aria, la sommelier de fragancias de lujo de Touche Essencielle.
    Tu inventario disponible (solo recomienda de aquí): ${inventarioTexto}.
    
    Tu lógica de respuesta es:
    1. SI el usuario hace una pregunta abierta (ej: "¿Cómo elijo un perfume?"): RESPONDE como experta, educa, da consejos sobre pH, notas, ocasiones, y luego ofrece opciones del inventario si aplica.
    2. SI el usuario hace clic en una opción o busca un producto directo (ej: "Cítrico y fresco"): ACTÚA como filtro. Busca en el inventario, PERO presenta los resultados con tu toque sofisticado y explica POR QUÉ esos productos encajan con lo que pidió.
    
    NUNCA des una lista simple. Tu respuesta siempre debe ser:
    - Un saludo o reconocimiento del estilo/solicitud del cliente.
    - La recomendación técnica (explicando notas y sensaciones, usando los productos del inventario).
    - Una invitación a interactuar más (pregunta abierta).
    
    Mantén un tono de lujo, elegante, empático y editorial (Royal Purple & Obsidian aesthetic).`
    };

    // 4. Mandamos todo a Claude
    const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        messages: [systemPrompt, ...messages],
    });

    const content = response.content[0];
    if (content.type === 'text') {
        return Response.json({ message: content.text });
    } else {
        // Esto maneja si el bot pensó o hizo otra cosa en vez de responder texto
        return Response.json({ message: "El bot no generó texto directamente." });
    }
}