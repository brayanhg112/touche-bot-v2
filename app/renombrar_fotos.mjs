import fs from 'fs';
import path from 'path';

const perfumesDir = 'F:\\BRIAN\\PROYECTOS ANTIGRAVITY\\BOT PARA FRAGANCIAS\\app\\public\\perfumes';

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkDir(fullPath); // Entra a las subcarpetas solito
    } else {
      const newFileName = file.toLowerCase();
      const newPath = path.join(dir, newFileName);

      if (file !== newFileName) {
        fs.renameSync(fullPath, newPath);
        console.log(`Renombrado: ${file} --> ${newFileName}`);
      }
    }
  }
}

try {
  walkDir(perfumesDir);
  console.log("\n✅ ¡Misión cumplida! Todas las fotos (incluso las de subcarpetas) están en minúsculas.");
} catch (error) {
  console.error("❌ Error:", error.message);
}