import fs from 'fs';
import path from 'path';
import { image_search } from 'duckduckgo-images-api';

const catalogFiles = [
  'original.ts', 'masculinos.ts', 'femeninos.ts', 'arabes_bodymists.ts', 'uno_a_uno.ts', 'nicho.ts'
];
const baseDir = path.join('f:', 'BRIAN', 'PROYECTOS ANTIGRAVITY', 'BOT PARA FRAGANCIAS', 'app', 'lib', 'catalog');

// Delay helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchImageFast(query) {
  try {
    const results = await image_search({ query: query + ' perfume bottle white background high quality', moderate: true });
    if (results && results.length > 0) {
      // Find the first valid non-broken image looking URL (preferably .jpg, .png or not too weird)
      const valid = results.find(r => r.image && r.image.match(/\.(jpg|jpeg|png)/i));
      return valid ? valid.image : results[0].image;
    }
  } catch (e) {
    console.error('  -> Search error:', e.message);
  }
  return null;
}

const placeholderImage = 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800';

async function processCatalog() {
  console.log('STARTING IMAGE INTEGRATION...');
  for (const file of catalogFiles) {
    const filePath = path.join(baseDir, file);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Using regex to find blocks of perfume definitions
    const perfumeBlockRegex = /(\{\s*id:\s*['"](.*?)['"],[\s\S]*?emotionalDesc:\s*(['"][\s\S]*?['"]),?)(\s*\})/g;
    
    let match;
    let newContent = content;
    const blocksToReplace = [];

    // First collect all matches to avoid regex state issues with async
    let searchMatches = [...content.matchAll(perfumeBlockRegex)];
    
    console.log(`\n📄 Processing ${file} - Found ${searchMatches.length} perfumes`);
    
    for (const m of searchMatches) {
      const fullMatch = m[0];
      const id = m[2];
      const emotionalDescLine = m[3];
      
      // If it already has imageUrl somewhere in the block, skip
      if (fullMatch.includes('imageUrl:')) {
        continue;
      }

      // Extract name and brand
      const nameMatch = fullMatch.match(/name:\s*['"](.*?)['"]/);
      const brandMatch = fullMatch.match(/brand:\s*['"](.*?)['"]/);
      
      const name = nameMatch ? nameMatch[1] : '';
      const brand = brandMatch ? brandMatch[1] : '';
      
      const query = `${name} ${brand}`;
      process.stdout.write(`  🔍 Searching for ${query}... `);
      
      let imageUrl = await fetchImageFast(query);
      if (!imageUrl) {
        process.stdout.write(`Failed. Using placeholder.\n`);
        imageUrl = placeholderImage;
      } else {
        process.stdout.write(`Found!\n`);
      }

      const replacementText = m[1] + `\n    imageUrl: '${imageUrl.replace(/'/g, "\\'")}',` + m[4];
      blocksToReplace.push({ old: fullMatch, new: replacementText });
      
      // Sleep a tiny bit to avoid DDG rate limits
      await delay(250);
    }

    // Apply replacements
    for (const block of blocksToReplace) {
      newContent = newContent.replace(block.old, block.new);
    }

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Saved ${file}`);
  }
  console.log('\n🎉 ALL IMAGES INTEGRATED SUCESSFULLY!');
}

processCatalog();
