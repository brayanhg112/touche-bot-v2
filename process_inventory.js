const fs = require('fs');
const path = require('path');

const csvFile = path.join(__dirname, 'inventario.csv');
const dataDir = path.join(__dirname, 'data');
const outputFile = path.join(dataDir, 'inventory.json');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const csvContent = fs.readFileSync(csvFile, 'utf8');
const lines = csvContent.split('\n');

const inventory = {};
let idCounter = 1;

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(';');
    
    // Columnas basadas en: ;nombre_perfume;Tipo;estado;...
    const rawId = parts[0] ? parts[0].trim() : `id_${idCounter++}`;
    const rawName = (parts[1] || '').trim();
    
    const isPureNumber = /^\d+$/.test(rawName);
    if (!rawName || isPureNumber || rawName.length < 2) {
        continue;
    }

    const version = (parts[2] || 'Standard').trim();
    const stateRaw = (parts[3] || '').trim().toUpperCase();

    // Default to active if empty, or verify with keywords
    const isActive = stateRaw === '' || stateRaw.includes('ACTIVO') || stateRaw === 'TRUE' || stateRaw === 'SI' || stateRaw === '1';

    inventory[rawName] = {
        id: rawId,
        name: rawName,
        version: version,
        active: isActive
    };
}

// Result mapping
const total = Object.keys(inventory).length;
console.log(`Guardando ${total} items de inventario...`);

fs.writeFileSync(outputFile, JSON.stringify(inventory, null, 2), 'utf8');
console.log('✅ Inventario guardado en data/inventory.json');
