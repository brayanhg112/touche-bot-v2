import type { Perfume } from './types';
import { catalog as original } from './catalog/original';
import { mujeresNuevas } from './catalog/femeninos';
import { hombresNuevos } from './catalog/masculinos';
import { arabesMists } from './catalog/arabes_bodymists';
import { unoAUno } from './catalog/uno_a_uno';
import { nichoPerfumes } from './catalog/nicho';

// Merge all arrays
const merged = [...original, ...mujeresNuevas, ...hombresNuevos, ...arabesMists, ...unoAUno, ...nichoPerfumes];

// Remove duplicates by ID, giving precedence to the original catalog items
const uniqueCatalogMap = new Map<string, Perfume>();

for (const perfume of merged) {
  if (!uniqueCatalogMap.has(perfume.id)) {
    uniqueCatalogMap.set(perfume.id, perfume);
  }
}

export const catalog: Perfume[] = Array.from(uniqueCatalogMap.values());