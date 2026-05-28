/**
 * Copies perfume images from emoji-named subfolders to clean /public/perfumes/m/ and /public/perfumes/f/
 * Run from: f:\BRIAN\PROYECTOS ANTIGRAVITY\BOT PARA FRAGANCIAS\app\
 *   node copy_images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const perfumesDir = path.join(__dirname, 'public', 'perfumes');

// Find the ENTREGA INMEDIATA folder dynamically (handles any emoji variant)
const topDirs = fs.readdirSync(perfumesDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name.toUpperCase().includes('ENTREGA'));

if (topDirs.length === 0) {
  console.error('ERROR: Could not find ENTREGA INMEDIATA folder in', perfumesDir);
  process.exit(1);
}

const entregaDir = path.join(perfumesDir, topDirs[0].name);
console.log('Found:', entregaDir);

// Find male/female subdirectories dynamically
const subDirs = fs.readdirSync(entregaDir, { withFileTypes: true })
  .filter(d => d.isDirectory());

console.log('Subdirectories:', subDirs.map(d => d.name));

let mSrc = null, fSrc = null;
for (const d of subDirs) {
  const n = d.name.toUpperCase();
  if (n.includes('CABALLERO') || n.includes('HOMBRE')) mSrc = path.join(entregaDir, d.name);
  else if (n.includes('DAMA') || n.includes('MUJER')) fSrc = path.join(entregaDir, d.name);
}

function copyDir(src, destName) {
  if (!src) { console.error(`Source not found for: ${destName}`); return 0; }
  const dst = path.join(perfumesDir, destName);
  fs.mkdirSync(dst, { recursive: true });
  const files = fs.readdirSync(src);
  let count = 0;
  for (const file of files) {
    const srcFile = path.join(src, file);
    const dstFile = path.join(dst, file);
    if (fs.statSync(srcFile).isFile()) {
      fs.copyFileSync(srcFile, dstFile);
      count++;
    }
  }
  console.log(`✓ Copied ${count} files → /public/perfumes/${destName}/`);
  return count;
}

const mCount = copyDir(mSrc, 'm');
const fCount = copyDir(fSrc, 'f');
console.log(`\nDone! Male: ${mCount}, Female: ${fCount}`);
