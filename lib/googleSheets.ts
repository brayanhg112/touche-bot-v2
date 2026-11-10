import { getInventoryFromSheets, PerfumeSheetRow } from './sheets';

export type InventoryItem = PerfumeSheetRow;

/**
 * Consulta la pestaña 'InventarioBot' en Google Sheets y devuelve solo perfumes 'ACTIVO'.
 */
export async function getInventory(): Promise<PerfumeSheetRow[]> {
    return await getInventoryFromSheets();
}
