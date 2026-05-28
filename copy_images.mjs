import fs from 'fs';
import path from 'path';

const BASE = 'F:\\BRIAN\\ENTREGA INMEDIATA\u{1FAB7}';
const DEST  = 'F:\\BRIAN\\PROYECTOS ANTIGRAVITY\\BOT PARA FRAGANCIAS\\app\\public\\perfumes';

const dirs = fs.readdirSync(BASE, { withFileTypes: true });
let mSrc, fSrc;
for (const d of dirs) {
  if (!d.isDirectory()) continue;
  if (d.name.includes('CABALLERO') || d.name.includes('\u{1F935}')) mSrc = path.join(BASE, d.name);
  if (d.name.includes('DAMA') || d.name.includes('\u{1F9D6}'))     fSrc = path.join(BASE, d.name);
}

console.log('Male source:', mSrc);
console.log('Female source:', fSrc);

function copyDir(src, destSub) {
  const dst = path.join(DEST, destSub);
  fs.mkdirSync(dst, { recursive: true });
  const files = fs.readdirSync(src);
  let count = 0;
  for (const file of files) {
    fs.copyFileSync(path.join(src, file), path.join(dst, file));
    count++;
  }
  console.log(`Copied ${count} files to /perfumes/${destSub}/`);
  return files;
}

if (mSrc) copyDir(mSrc, 'm');
else console.error('ERROR: male source not found');

if (fSrc) copyDir(fSrc, 'f');
else console.error('ERROR: female source not found');
