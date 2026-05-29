const fs = require('fs');
const path = require('path');

// Esta es la ruta donde están tus fotos
const dir = path.join(__dirname, 'app', 'public', 'perfumes');

fs.readdir(dir, (err, files) => {
    if (err) throw err;

    files.forEach(file => {
        // Obtenemos la extensión original (.png, .jpg)
        const ext = path.extname(file);
        const nameWithoutExt = path.basename(file, ext);

        // Aplicamos la misma lógica que en PerfumeCard.tsx
        const newName = nameWithoutExt
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')      // Espacios a guiones
            .replace(/[^\w\-]+/g, '')  // Quita caracteres raros
            .replace(/\-\-+/g, '-')    // Evita guiones dobles
            + ext.toLowerCase();       // Aseguramos extensión minúscula

        const oldPath = path.join(dir, file);
        const newPath = path.join(dir, newName);

        if (oldPath !== newPath) {
            fs.rename(oldPath, newPath, (err) => {
                if (err) console.error(`Error en ${file}:`, err);
                else console.log(`Renombrado: ${file} -> ${newName}`);
            });
        }
    });
});