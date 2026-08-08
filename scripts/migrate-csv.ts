// scripts/migrate-csv.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
);

async function migrateFromCSV() {
    const csvPath = path.join(process.cwd(), 'inventario.csv');

    if (!fs.existsSync(csvPath)) {
        console.error("❌ No se encontró 'inventario.csv' en la raíz:", csvPath);
        return;
    }

    // .replace(/^\uFEFF/, '') limpia el BOM invisible de los archivos CSV de Excel
    const fileContent = fs.readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '');
    const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length < 2) {
        console.log("⚠️ El archivo está vacío o sin datos.");
        return;
    }

    const headers = lines[0].split(';').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
    console.log("📋 Cabeceras limpias detectadas:", headers);

    const dataToUpload = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const row: Record<string, any> = {};
        headers.forEach((header, index) => {
            if (header) row[header] = values[index];
        });

        // Buscamos el nombre asegurando variantes por si el header se llama distinto o usando la columna 1
        const nombrePerfume = row['nombre_perfume'] || row['nombre'] || row['perfume'] || row['producto'] || values[1];

        if (nombrePerfume) {
            const estadoStr = (row['estado'] || '').toUpperCase();
            const isActive = estadoStr === 'ACTIVO' || estadoStr === 'TRUE' || estadoStr === '1' || estadoStr === '';

            dataToUpload.push({
                nombre_perfume: String(nombrePerfume).trim().toLowerCase(),
                estado: isActive,
                tipo: row['tipo'] || 'ESTANDAR',
                familia_olfativa: row['familia_olfativa'] || '',
                ocasion: row['ocasion'] || '',
                intensidad: row['intensidad'] || '',
                genero: (row['genero'] || 'UNISEX').toUpperCase()
            });
        }
    }

    console.log("🧹 Vaciando datos incompletos en Supabase...");
    const { error: deleteError } = await supabase.from('inventory').delete().neq('id', -1);
    if (deleteError) {
        console.warn("⚠️ Nota al vaciar:", deleteError.message);
    }

    console.log(`🚀 Subiendo ${dataToUpload.length} referencias con nombres corregidos a Supabase...`);

    for (let i = 0; i < dataToUpload.length; i += 50) {
        const chunk = dataToUpload.slice(i, i + 50);
        const { error } = await supabase.from('inventory').insert(chunk);

        if (error) {
            console.error(`❌ Error en el bloque ${i}:`, error);
        } else {
            console.log(`✅ Bloque del ${i} al ${i + chunk.length} sincronizado con éxito.`);
        }
    }

    console.log("🏁 ¡Migración con nombres corregidos completada!");
}

migrateFromCSV();