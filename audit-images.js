
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = path.join(__dirname, 'public', 'products');

if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    console.log(`\n📦 Total de archivos físicos encontrados: ${files.length}\n`);
    files.forEach(file => console.log(`📌 ${file}`));
} else {
    console.log('❌ No encontré la carpeta public/products');
}