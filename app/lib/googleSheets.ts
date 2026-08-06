/**
 * @deprecated Este módulo ya no se usa.
 * La integración con Google Sheets fue eliminada por corrupción de datos.
 * El inventario ahora se lee de data/inventory.json (ver app/api/stock/route.ts).
 */

export interface PerfumeStockItem {
    id: string;
    name: string;
    version: string;
    active: boolean;
}

/** @deprecated Usar fs.readFileSync sobre data/inventory.json directamente. */
export async function getInventory(): Promise<Record<string, PerfumeStockItem>> {
    throw new Error(
        '[googleSheets] Módulo obsoleto. Usa data/inventory.json a través de app/api/stock/route.ts.'
    );
}