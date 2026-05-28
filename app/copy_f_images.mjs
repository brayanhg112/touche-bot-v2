import fs from 'fs';
import path from 'path';

function copyDirWithTryCatch(src, destSub) {
  const destDir = `F:\\BRIAN\\PROYECTOS ANTIGRAVITY\\BOT PARA FRAGANCIAS\\app\\public\\perfumes\\${destSub}`;
  fs.mkdirSync(destDir, { recursive: true });
  
  if (!fs.existsSync(src)) {
    console.log(`Source not found: ${src}`);
    return;
  }
  
  const files = fs.readdirSync(src);
  console.log(`Found ${files.length} files in ${src}`);
  
  let success = 0;
  for (const file of files) {
    try {
      const srcPath = path.join(src, file);
      const destPath = path.join(destDir, file);
      fs.copyFileSync(srcPath, destPath);
      success++;
    } catch (e) {
      console.error(`Failed to copy ${file}:`, e.message);
    }
  }
  console.log(`Successfully copied ${success}/${files.length} files to ${destSub}.`);
}

const fSrcList = [
  'F:\\BRIAN\\ENTREGA INMEDIATA🫧\\DAMA🧖‍♀️',
  'F:\\BRIAN\\ENTREGA INMEDIATA\u{1FAB7}\\DAMA\u{1F9D6}\u{200D}\u{2640}\u{FE0F}'
];

for(const src of fSrcList) {
    if(fs.existsSync(src)) {
        console.log(`Found female source directory! ${src}`);
        copyDirWithTryCatch(src, 'f');
        break;
    }
}
