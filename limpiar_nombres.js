const fs = require('fs');
const path = require('path');

// Esta es la carpeta donde están tus fotos
const dir = './public/perfumes';

fs.readdir(dir, (err, files) => {
  if (err) throw err;

  files.forEach(file => {
    // 1. Convertimos a minúsculas
    // 2. Reemplazamos espacios por guiones
    // 3. Quitamos caracteres raros
    let newName = file.toLowerCase()
      .replace(/\s+/g, '-')      // Espacios a guiones
      .replace(/[^\w\-.]+/g, '') // Quita caracteres especiales
      .replace(/-+/g, '-');      // Evita guiones dobles

    const oldPath = path.join(dir, file);
    const newPath = path.join(dir, newName);

    if (oldPath !== newPath) {
      fs.rename(oldPath, newPath, (err) => {
        if (err) console.log(`Error renombrando ${file}: ${err}`);
        else console.log(`Renombrado: "${file}" -> "${newName}"`);
      });
    }
  });
});