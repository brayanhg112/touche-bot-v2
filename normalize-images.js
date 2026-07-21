import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = path.join(__dirname, 'public', 'products');

if (!fs.existsSync(dir)) {
    console.error('❌ Error: No encontré la carpeta public/products/. Asegúrate de correr esto en la raíz del proyecto.');
    process.exit(1);
}

function cleanName(filename) {
    const ext = path.extname(filename).toLowerCase();
    const nameWithoutExt = path.basename(filename, ext);

    const normalized = nameWithoutExt
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita tildes
        .replace(/['"´°]/g, '')
        .replace(/[^a-z0-9]+/g, '-') // símbolos raros a guion
        .replace(/^-+|-+$/g, '') // quita guiones extremos
        .replace(/-+/g, '-'); // evita guiones dobles

    return normalized + ext;
}

fs.readdir(dir, (err, files) => {
    if (err) {
        console.error('Error leyendo la carpeta:', err);
        return;
    }

    files.forEach(file => {
        const oldPath = path.join(dir, file);
        if (fs.statSync(oldPath).isDirectory()) return;

        const newFilename = cleanName(file);
        const newPath = path.join(dir, newFilename);

        if (oldPath !== newPath) {
            fs.rename(oldPath, newPath, err => {
                if (err) console.error(`❌ No se pudo renombrar ${file}:`, err);
                else console.log(`✅ ${file} ➔ ${newFilename}`);
            });
        }
    });
    console.log('🎉 ¡Normalización de imágenes física terminada con éxito!');
});