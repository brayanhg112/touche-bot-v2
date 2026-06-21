import { NextResponse } from 'next/server';
// Con el cambio del tsconfig, esta ruta funcionará siempre, sin importar dónde estés
import { getInventory } from '@/lib/googleSheets';

export async function GET() {
    try {
        const data = await getInventory();
        return NextResponse.json({ stock: data });
    } catch (error) {
        console.error('Error en el endpoint:', error);
        return NextResponse.json({ error: 'Fallo al cargar' }, { status: 500 });
    }
}