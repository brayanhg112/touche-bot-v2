import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mDir = path.join(__dirname, 'public', 'perfumes', 'm');
const fDir = path.join(__dirname, 'public', 'perfumes', 'f');
const mFiles = fs.readdirSync(mDir);
const fFiles = fs.readdirSync(fDir);

// Re-creating the actual logic of M and F resolving paths because we can't import TS imageMap directly 
// without ts-node or transpiling. The user's imageMap is mostly manually defined.
// The easiest way is to read imageMap.ts, regex match all `'id': M('filename')` or F('filename'), 
// verify the filename, and if missing, search the directories for best match.

const mapContent = fs.readFileSync(path.join(__dirname, 'lib', 'imageMap.ts'), 'utf8');

const regex = /'([^']+)':\s+([MF])\('([^']+)'\),?/g;
let match;
let newContent = mapContent;

while ((match = regex.exec(mapContent)) !== null) {
  const id = match[1];
  const type = match[2]; // 'M' or 'F'
  let filename = match[3];
  
  const targetDir = type === 'M' ? mDir : fDir;
  const targetFiles = type === 'M' ? mFiles : fFiles;

  // Exact match check
  let found = targetFiles.find(f => f === filename);
  if (found) continue;

  // Sometimes it's slightly off, e.g. .jpg instead of .png, or leading spaces
  filename = filename.trim();
  const baseNameNoExt = filename.replace(/\.[^/.]+$/, "");
  
  const bestMatch = targetFiles.find(f => {
    const fClean = f.trim().replace(/\.[^/.]+$/, "");
    return fClean.toLowerCase() === baseNameNoExt.toLowerCase();
  });

  if (bestMatch) {
    console.log(`Fixing: ${match[0]} -> '${id}': ${type}('${bestMatch}')`);
    newContent = newContent.replace(match[0], `'${id}':            ${type}('${bestMatch}'),`);
  } else {
    // try removing _ or spaces
    const looseMatch = targetFiles.find(f => {
       const a = f.toLowerCase().replace(/[^a-z0-9]/g, '');
       const b = filename.toLowerCase().replace(/[^a-z0-9]/g, '');
       return a === b || a.includes(b) || b.includes(a);
    });
    if (looseMatch) {
       console.log(`Fuzzy Fixing: ${match[0]} -> '${id}': ${type}('${looseMatch}')`);
       newContent = newContent.replace(match[0], `'${id}':            ${type}('${looseMatch}'),`);
    } else {
       console.error(`COULD NOT FIND ANY MATCH FOR: ${filename} (id: ${id}, type: ${type})`);
    }
  }
}

fs.writeFileSync(path.join(__dirname, 'lib', 'imageMap.fixed.ts'), newContent);
console.log('Fixed image map written to imageMap.fixed.ts');
