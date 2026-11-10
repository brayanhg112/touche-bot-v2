import { getInventoryFromSheets, PerfumeSheetRow } from './sheets';

export type PerfumeStockItem = PerfumeSheetRow;

export async function getInventory(): Promise<PerfumeSheetRow[]> {
    return await getInventoryFromSheets();
}
