import type { Perfume } from './types';
import { catalog as original } from './catalog/original';
import { mujeresNuevas } from './catalog/femeninos';
import { hombresNuevos } from './catalog/masculinos';
import { arabesMists } from './catalog/arabes_bodymists';
import { unoAUno } from './catalog/uno_a_uno';
import { nichoPerfumes } from './catalog/nicho';

// ─── Descripción canónica para productos 1.1 ────────────────────────────────
const DESC_1_1 = (perfume: Perfume) => {
  const f = perfume.family.toLowerCase();
  let gancho = "Una esencia incomparable.";
  if (f.includes('acuátic') || f.includes('acuatic')) gancho = "Frescura oceánica inigualable.";
  else if (f.includes('cítric') || f.includes('citric')) gancho = "Energía radiante y explosiva.";
  else if (f.includes('amaderad')) gancho = "Elegancia maderada y profunda.";
  else if (f.includes('floral')) gancho = "Sofisticación floral absoluta.";
  else if (f.includes('oriental') || f.includes('especiad')) gancho = "Misterio oriental y seducción intensa.";

  return `${gancho} ${perfume.emotionalDesc} Nuestro contratipo 1.1 de Alta Concentración con +10gr de esencia premium para una fijación superior en piel y ropa.`;
};

// Merge all arrays
const merged = [...original, ...mujeresNuevas, ...hombresNuevos, ...arabesMists, ...unoAUno, ...nichoPerfumes];

// Remove duplicates by ID, giving precedence to the original catalog items
const uniqueCatalogMap = new Map<string, Perfume>();

for (const perfume of merged) {
  if (!uniqueCatalogMap.has(perfume.id)) {
    // Overwrite 1.1 descriptions with canonical marketing copy
    const entry: Perfume = perfume.version === '1.1'
      ? { ...perfume, emotionalDesc: DESC_1_1(perfume) }
      : perfume;
    uniqueCatalogMap.set(perfume.id, entry);
  }
}

const allPerfumes: Perfume[] = Array.from(uniqueCatalogMap.values());

// Sort: 1.1 versions always first, rest follow
export const catalog: Perfume[] = [
  ...allPerfumes.filter(p => p.version === '1.1'),
  ...allPerfumes.filter(p => p.version !== '1.1'),
];