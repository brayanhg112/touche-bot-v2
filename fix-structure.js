const fs = require('fs');
const path = require('path');

// Mueve los archivos a donde deben estar realmente
const moves = [
    { from: './app/app/api/stock/route.ts', to: './app/api/stock/route.ts' },
    { from: './app/lib/catalog/googleSheets.js', to: './lib/catalog/googleSheets.js' }
];

moves.forEach(move => {
    if (fs.existsSync(move.from)) {
        // Asegurar que la carpeta destino exista
        fs.mkdirSync(path.dirname(move.to), { recursive: true });
        fs.renameSync(move.from, move.to);
        console.log(`✅ Movido: ${move.from} -> ${move.to}`);
    } else {
        console.log(`⚠️ No se encontró: ${move.from}`);
    }
});

console.log("¡Listo! Estructura aplanada.");