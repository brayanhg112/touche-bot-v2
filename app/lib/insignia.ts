import type { Perfume } from './types';
import type { AiGuideResult } from './aiGuideTypes';

export const TOUCHE_INSIGNIA_PERFUMES: Perfume[] = [
  {
    id: 'nuit-de-marbre',
    name: 'Nuit de Marbre',
    brand: 'Touche Essencielle',
    gender: 'U',
    family: 'Oriental Amaderado',
    occasions: ['noche', 'cita', 'evento', 'diario'],
    feels: ['amaderado', 'oud', 'especiado', 'dulce'],
    topNotes: 'Pimienta Rosa, Bergamota Italiana, Incienso Real',
    heartNotes: 'Rosa Negra, Ámbar Blanco, Madera de Cedro del Atlas',
    baseNotes: 'Oud Ahumado, Vainilla de Madagascar, Almizcle Puro',
    duration: '14h+',
    avoidTags: [],
    sweetness: 3,
    freshness: 2,
    intensity: 5,
    inStock: true,
    version: '1.1',
    emotionalDesc: 'Una obra cumbre de misterio, elegancia y magnetismo nocturno, con fijación sublime en piel.',
    imageUrl: '/products/nuit-de-marbre.png'
  },
  {
    id: 'oud-celeste',
    name: 'Oud Céleste',
    brand: 'Touche Essencielle',
    gender: 'U',
    family: 'Oriental Especiado',
    occasions: ['evento', 'noche', 'cita', 'diario'],
    feels: ['oud', 'especiado', 'amaderado'],
    topNotes: 'Cardamomo Dorado, Azafrán Puro, Naranja Amarga',
    heartNotes: 'Oud Real, Canela de Ceilán, Jazmín Nocturno',
    baseNotes: 'Sándalo Cremoso, Cuero Suave, Haba Tonka',
    duration: '14h+',
    avoidTags: [],
    sweetness: 3,
    freshness: 2,
    intensity: 5,
    inStock: true,
    version: '1.1',
    emotionalDesc: 'Aura divina y magnética que fusiona la nobleza del oud con especias sagradas y un fondo cálido inolvidable.',
    imageUrl: '/products/oud-celeste.png'
  },
  {
    id: 'rose-imperiale',
    name: 'Rose Impériale',
    brand: 'Touche Essencielle',
    gender: 'U',
    family: 'Floral Ambarino',
    occasions: ['diario', 'cita', 'evento', 'trabajo'],
    feels: ['floral', 'dulce', 'fresco'],
    topNotes: 'Grosella Negra, Mandarina de Sicilia, Lichi',
    heartNotes: 'Rosa de Damasco, Peonía Real, Iris Silvestre',
    baseNotes: 'Pachulí Noble, Vainilla Bourbon, Ámbar Dorado',
    duration: '12h+',
    avoidTags: [],
    sweetness: 3,
    freshness: 3,
    intensity: 4,
    inStock: true,
    version: '1.1',
    emotionalDesc: 'El epítome de la distinción y la seducción refinada, radiante, envolvente y de presencia inolvidable.',
    imageUrl: '/products/rose-imperiale.png'
  }
];

export const TOUCHE_INSIGNIA_AI_RESULTS: AiGuideResult[] = TOUCHE_INSIGNIA_PERFUMES.map(p => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  family: p.family,
  topNotes: p.topNotes,
  heartNotes: p.heartNotes,
  baseNotes: p.baseNotes,
  emotionalDesc: p.emotionalDesc,
  version: p.version,
  gender: 'UNISEX'
}));
