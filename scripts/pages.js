import fs from 'node:fs/promises';

// A self-contained file works at GitHub Pages' /repository/ path without
// relying on root-relative assets, an application server, or a build action.
await fs.mkdir('docs',{recursive:true});
await fs.copyFile('dist/Plant-Based-Leather-Dashboard.html','docs/index.html');
await fs.writeFile('docs/.nojekyll','');
console.log('GitHub Pages files prepared in docs/.');
