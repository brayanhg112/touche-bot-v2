import { getInventory } from './lib/googleSheets.js';

async function test() {
    console.log("Conectando al inventario...");
    const data = await getInventory();
    console.log("¡Éxito! Datos obtenidos:", data);
}

test();