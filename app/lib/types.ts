export type Gender = 'M' | 'F' | 'U';
export type Occasion = 'diario' | 'noche' | 'trabajo' | 'cita' | 'verano' | 'invierno' | 'evento' | 'deporte';
export type Feel = 'dulce' | 'fresco' | 'especiado' | 'amaderado' | 'floral' | 'frutal' | 'oud' | 'citrico' | 'gourmand' | 'acuatico' | 'cuero' | 'limpio' | 'verde' | 'atalcado' | 'polvo';
export type Projection = 'discreta' | 'moderada' | 'intensa' | '';

export interface Perfume {
  id: string;
  name: string;
  brand: string;
  gender: Gender;
  family: string;
  occasions: Occasion[];
  feels: Feel[];
  topNotes: string;
  heartNotes: string;
  baseNotes: string;
  duration: string;
  avoidTags: string[];
  sweetness: number;   // 1-5
  freshness: number;   // 1-5
  intensity: number;   // 1-5  (also used for projection matching)
  inStock?: boolean; 
  emotionalDesc: string; // Sommelier-style emotional description
  version?: string;      // Ej. '1.1'
  isLimited?: boolean;   // Hard lock for out of stock items
  imageUrl?: string;     // URL de la imagen del producto
}

export interface BotAnswers {
  name: string;
  gender: Gender | '';
  occasion: Occasion | '';
  projection: Projection;
  feel: Feel[];
  avoid: string[];
  referencePerfume?: string; // Perfume de referencia del usuario (ej. 'Sauvage')
}
