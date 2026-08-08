import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ─── GET: Obtener todo el inventario desde Supabase para el Admin ───────────
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('*');

        if (error) {
            console.error("❌ Error al obtener el inventario de Supabase:", error);
            return NextResponse.json({ inventory: [], error: error.message }, { status: 500 });
        }

        return NextResponse.json({ inventory: data || [] });
    } catch (error) {
        console.error("❌ Error crítico en GET /api/admin/inventory:", error);
        return NextResponse.json({ inventory: [], message: 'Error interno del servidor' }, { status: 500 });
    }
}

// ─── POST: Guardar o actualizar un perfume de forma inteligente ─────────────
export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("📥 Actualización recibida en el Admin:", body);

        const { nombre_perfume, estado, tipo, familia_olfativa, ocasion, intensidad, genero } = body;

        if (!nombre_perfume) {
            return NextResponse.json(
                { success: false, message: 'El nombre del perfume es obligatorio' },
                { status: 400 }
            );
        }

        const cleanName = nombre_perfume.trim().toLowerCase();
        const cleanTipo = (tipo || 'ESTANDAR').trim().toUpperCase();

        // 1. Verificamos si ya existe esta variante exacta (nombre + tipo) en la base de datos
        const { data: existing, error: searchError } = await supabase
            .from('inventory')
            .select('id')
            .eq('nombre_perfume', cleanName)
            .eq('tipo', cleanTipo)
            .maybeSingle();

        if (searchError) {
            console.error("❌ Error buscando variante en Supabase:", searchError);
        }

        let error;

        if (existing) {
            // 2A. Si ya existe, actualizamos los datos usando su ID único
            const res = await supabase
                .from('inventory')
                .update({
                    estado: estado !== undefined ? estado : true,
                    familia_olfativa: familia_olfativa || '',
                    ocasion: ocasion || '',
                    intensidad: intensidad || '',
                    genero: (genero || 'UNISEX').toUpperCase()
                })
                .eq('id', existing.id);
            error = res.error;
        } else {
            // 2B. Si es nuevo, lo insertamos directo
            const res = await supabase
                .from('inventory')
                .insert({
                    nombre_perfume: cleanName,
                    estado: estado !== undefined ? estado : true,
                    tipo: cleanTipo,
                    familia_olfativa: familia_olfativa || '',
                    ocasion: ocasion || '',
                    intensidad: intensidad || '',
                    genero: (genero || 'UNISEX').toUpperCase()
                });
            error = res.error;
        }

        if (error) {
            console.error("❌ Error al guardar en Supabase:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        console.log("✅ Perfume guardado con éxito en Supabase desde el Admin");
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("❌ Error crítico en la API del Admin:", error);
        return NextResponse.json(
            { success: false, message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}