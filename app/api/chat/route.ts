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

    // 3. Instrucción secreta para Aria
    const systemPrompt = {
        role: "system",
        content: `Eres Aria, experta en Touche Essencielle. 
    Tu inventario disponible es: ${inventarioTexto}. 
    Reglas: Responde basándote SOLO en esto. Si no está en la lista, di que por ahora no lo tienes.`
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