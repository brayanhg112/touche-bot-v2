const fs = require('fs');
const path = require('path');

const baseDir = 'f:/BRIAN/PROYECTOS ANTIGRAVITY/BOT PARA FRAGANCIAS/app/lib/catalog';

function getFragrances(filename, categoryName) {
    try {
        const fullPath = path.join(baseDir, filename);
        if (!fs.existsSync(fullPath)) return [];
        const content = fs.readFileSync(fullPath, 'utf8');
        const perfumes = [];
        const matches = content.matchAll(/\{[\s\S]*?id: '([\s\S]*?)'[\s\S]*?\}/g);
        for (const match of matches) {
            const block = match[0];
            const nameMatch = block.match(/name: '(.*)'/);
            const brandMatch = block.match(/brand: '(.*)'/);
            const topMatch = block.match(/topNotes: '(.*)'/);
            const occasionsMatch = block.match(/occasions: \[(.*)\]/);
            
            if (nameMatch && brandMatch) {
                const name = nameMatch[1];
                const brand = brandMatch[1];
                const top = topMatch ? topMatch[1] : 'No especificadas';
                const occasions = occasionsMatch ? occasionsMatch[1].replace(/'/g, '').split(',').map(s => s.trim()).join(', ') : 'Versátil';
                
                perfumes.push({ name, brand, category: categoryName, notes: top, occasion: occasions });
            }
        }
        return perfumes;
    } catch (e) {
        console.error('Error reading ' + filename + ':', e);
        return [];
    }
}

const allPerfumes = [
    ...getFragrances('original.ts', 'Aceite (Clásico)'),
    ...getFragrances('masculinos.ts', 'Aceite (Masculino)'),
    ...getFragrances('femeninos.ts', 'Aceite (Femenino)'),
    ...getFragrances('nicho.ts', 'Nicho (Lujo)'),
    ...getFragrances('uno_a_uno.ts', 'Versión 1.1'),
    ...getFragrances('arabes_bodymists.ts', 'Árabe / Mist')
];

let md = '# 🌟 CATÁLOGO PÚBLICO - TOUCHE ESSENCIELLE 🌟\n\n';
md += 'Aquí tienes nuestra colección de fragancias de alta calidad. Encuentra tu aroma ideal y pídelo por WhatsApp.\n\n';

// Group by gender/category if preferred, but user asked for simple list
// We will sort alphabetically by name
allPerfumes.sort((a, b) => a.name.localeCompare(b.name)).forEach(p => {
    md += `### ${p.name} - ${p.brand}\n`;
    md += `*   **Categoría:** ${p.category}\n`;
    md += `*   **Notas principales:** ${p.notes}\n`;
    md += `*   **Ocasión:** ${p.occasion}\n\n`;
});

fs.writeFileSync('f:/BRIAN/PROYECTOS ANTIGRAVITY/BOT PARA FRAGANCIAS/CATALOGO_PUBLICO.md', md);
console.log('✅ Catálogo generado con ' + allPerfumes.length + ' perfumes.');
