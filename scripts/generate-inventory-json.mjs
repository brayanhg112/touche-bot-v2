/**
 * generate-inventory-json.mjs
 * Convierte inventario.csv → data/inventory.json
 * Uso: node scripts/generate-inventory-json.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSV_PATH = join(ROOT, 'inventario.csv');
const DATA_DIR = join(ROOT, 'data');
const OUT_PATH = join(DATA_DIR, 'inventory.json');

// Crear carpeta data/ si no existe
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
  console.log('📁 Carpeta data/ creada.');
}

const raw = readFileSync(CSV_PATH, 'utf-8');
const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

// Saltar encabezado
const dataLines = lines.slice(1);

const inventory = {};
let skipped = 0;

for (const line of dataLines) {
  // Separador: punto y coma
  const cols = line.split(';');
  // Columnas: [id_key, nombre_perfume, tipo, estado, familia, ocasion, intensidad, genero, ...]
  const rawId   = (cols[0] || '').trim();
  const rawName = (cols[1] || '').trim();
  const version = (cols[2] || 'ESTANDAR').trim().toUpperCase() || 'ESTANDAR';
  const estado  = (cols[3] || '').trim().toUpperCase();

  // Validar nombre: debe existir, tener longitud y no ser un número puro
  if (!rawName || /^\d+$/.test(rawName) || rawName.length < 2) {
    skipped++;
    continue;
  }

  // Normalizar versión: "1,1" → "1.1"
  const cleanVersion = version.replace(',', '.');

  // Estado activo: sólo si dice explícitamente ACTIVO o TRUE
  const isActive =
    estado === 'ACTIVO' ||
    estado === 'TRUE'   ||
    estado === 'SI'     ||
    estado === '1';

  // Usar rawName como clave (identificador legible)
  inventory[rawName] = {
    id:      rawId || rawName,
    name:    rawName,
    version: cleanVersion,
    active:  isActive,
  };
}

writeFileSync(OUT_PATH, JSON.stringify(inventory, null, 2), 'utf-8');

const total   = Object.keys(inventory).length;
const activos = Object.values(inventory).filter(i => i.active).length;
console.log(`✅ inventory.json generado: ${total} perfumes (${activos} activos, ${total - activos} inactivos)`);
console.log(`⚠️  Filas ignoradas (vacías/inválidas): ${skipped}`);
console.log(`📄 Archivo guardado en: ${OUT_PATH}`);
