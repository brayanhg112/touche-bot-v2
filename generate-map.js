import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsDir = path.join(__dirname, 'public', 'products');
const outputFile = path.join(__dirname, 'src', 'lib', 'imageMap.ts');

if (!fs.existsSync(productsDir)) {
    console.error('❌ No encontré la carpeta public/products');
    process.exit(1);
}

const files = fs.readdirSync(productsDir);

// Creamos un diccionario dinámico basado en las imágenes reales que existen
let mapContent = `// Archivo generado automáticamente por generate-map.js\n`;
mapContent += `const imageDatabase: Record<string, string> = {\n`;

files.forEach(file => {
    if (file === 'placeholder.svg' || fs.statSync(path.join(productsDir, file)).isDirectory()) return;

    const ext = path.extname(file);
    const baseName = path.basename(file, ext).toLowerCase();

    // Guardamos la relación: nombre base del archivo -> ruta completa
    mapContent += `  "${baseName}": "/products/${file}",\n`;
});

mapContent + `};\n\n`;
mapContent += `export function getImagePath(id: string): string | null {\n`;
mapContent += `  if (!id) return null;\n`;
mapContent += `  const cleanId = id.toLowerCase().replace(/^1\\.1[_-]/, '').trim();\n`;
mapContent += `  \n`;
mapContent += `  // Busca coincidencia directa o parcial en los archivos reales\n`;
mapContent += `  if (imageDatabase[cleanId]) return imageDatabase[cleanId];\n`;
mapContent += `  \n`;
mapContent += `  // Busca si algún archivo contiene el id del perfume\n`;
mapContent += `  const foundKey = Object.keys(imageDatabase).find(key => key.includes(cleanId) || cleanId.includes(key));\n`;
mapContent += `  return foundKey ? imageDatabase[foundKey] : null;\n`;
mapContent += `}\n`;

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, mapContent);

console.log('🎉 ¡Mapa de imágenes generado con éxito en src/lib/imageMap.ts!');