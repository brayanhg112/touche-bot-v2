export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { PerfumeStockItem } from '../../lib/types';

// ─── CSV Import Route ────────────────────────────────────────────────────────
// Reads inventario.csv and writes enriched data to data/inventory.json
// Fields: nombre_perfume, Tipo, estado, familia_olfativa, ocasion, intensidad, genero
// ──────────────────────────────────────────────────────────────────────────────

const CSV_PATH = path.join(process.cwd(), 'inventario.csv');
const INVENTORY_PATH = path.join(process.cwd(), 'data', 'inventory.json');

function normalizeVersion(raw: string): string {
  if (!raw) return 'ESTANDAR';
  const cleaned = raw.trim().toUpperCase().replace(',', '.');
  if (cleaned === '1.1') return '1.1';
  if (cleaned === 'ESTANDAR' || cleaned === 'STANDARD') return 'ESTANDAR';
  return cleaned || 'ESTANDAR';
}

function normalizeActive(raw: string): boolean {
  if (!raw) return false;
  return raw.trim().toUpperCase() === 'ACTIVO';
}

function cleanField(raw: string | undefined): string {
  return (raw ?? '').trim().replace(/\s+/g, ' ');
}

export async function GET() {
  try {
    // 1. Check CSV exists
    if (!fs.existsSync(CSV_PATH)) {
      return NextResponse.json(
        { error: 'El archivo inventario.csv no se encontró en la raíz del proyecto.' },
        { status: 404 }
      );
    }

    // 2. Read and parse CSV
    const csvRaw = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = csvRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'El CSV está vacío o solo tiene cabecera.' },
        { status: 400 }
      );
    }

    // Skip header (line 0)
    const dataLines = lines.slice(1);

    // 3. Read existing inventory to preserve manually added items
    let existingInventory: Record<string, PerfumeStockItem> = {};
    try {
      if (fs.existsSync(INVENTORY_PATH)) {
        existingInventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'));
      }
    } catch {
      existingInventory = {};
    }

    // 4. Parse each CSV row
    const inventory: Record<string, PerfumeStockItem> = {};
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const fields = dataLines[i].split(';');

      // CSV format: id;nombre_perfume;Tipo;estado;familia_olfativa;ocasion;intensidad;genero;(extras...)
      const idField    = cleanField(fields[0]);
      const nameField  = cleanField(fields[1]);
      const tipoField  = cleanField(fields[2]);
      const estadoField = cleanField(fields[3]);
      const familyField = cleanField(fields[4]);
      const occasionField = cleanField(fields[5]);
      const intensityField = cleanField(fields[6]);
      const genderField = cleanField(fields[7]);

      // Skip empty rows or rows where key fields look like column pollution
      if (!idField || !nameField) {
        skipped++;
        continue;
      }

      // Detect corrupted rows: if family/occasion/intensity contain "ACTIVO" or "INACTIVO"
      // it means columns shifted — try to handle gracefully
      const familyLooksCorrupted =
        familyField.toUpperCase() === 'ACTIVO' || familyField.toUpperCase() === 'INACTIVO';

      const version = normalizeVersion(tipoField);
      const active = normalizeActive(estadoField);

      // Use the id (first column) as the dictionary key
      const key = idField;

      const item: PerfumeStockItem = {
        id: key,
        name: nameField,
        version,
        active,
        gender: genderField ? genderField.toUpperCase() : undefined,
        olfactory_family: familyLooksCorrupted ? undefined : (familyField || undefined),
        occasion: familyLooksCorrupted ? undefined : (occasionField || undefined),
        intensity: familyLooksCorrupted ? undefined : (intensityField || undefined),
      };

      // Merge with existing data: preserve manually set extended fields if CSV lacks them
      const existing = existingInventory[key];
      if (existing) {
        if (!item.gender && existing.gender) item.gender = existing.gender;
        if (!item.olfactory_family && existing.olfactory_family) item.olfactory_family = existing.olfactory_family;
        if (!item.occasion && existing.occasion) item.occasion = existing.occasion;
        if (!item.intensity && existing.intensity) item.intensity = existing.intensity;
      }

      inventory[key] = item;
      imported++;
    }

    // 5. Preserve manually added items not in CSV
    let preserved = 0;
    for (const [key, item] of Object.entries(existingInventory)) {
      if (!inventory[key]) {
        inventory[key] = item;
        preserved++;
      }
    }

    // 6. Write enriched inventory
    fs.writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      preserved,
      total: Object.keys(inventory).length,
      errors: errors.length > 0 ? errors : undefined,
      message: `✅ Importación exitosa: ${imported} perfumes importados, ${preserved} preservados, ${skipped} omitidos. Total: ${Object.keys(inventory).length}.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[GET /api/import]', msg);
    return NextResponse.json({ error: `Error al importar CSV: ${msg}` }, { status: 500 });
  }
}
