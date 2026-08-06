// ─── AiGuide — Type definitions ─────────────────────────────────────────────

export type AiGuideStep = 0 | 1 | 2 | 3 | 4 | 5;

export type AiGuideOccasion =
  | 'oficina'
  | 'uso-diario'
  | 'cita-romantica'
  | 'evento-formal'
  | 'deporte';

export type AiGuideExpression =
  | 'elegancia'
  | 'sensualidad'
  | 'frescura'
  | 'exito';

export type AiGuideNoteFamily =
  | 'orientales'
  | 'frutales'
  | 'florales'
  | 'frescos'
  | 'amaderados'
  | 'citricos'
  | 'aromaticas'
  | 'acuaticos'
  | 'oud';

export interface AiGuideAnswers {
  occasion: AiGuideOccasion | '';
  expression: AiGuideExpression | '';
  noteFamily: AiGuideNoteFamily | '';
}

export interface AiGuideResult {
  id: string;
  name: string;
  brand: string;
  family: string;
  topNotes: string;
  heartNotes: string;
  baseNotes: string;
  emotionalDesc: string;
  version?: string;
  gender: string;
}
