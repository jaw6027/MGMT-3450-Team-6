import fs from 'node:fs/promises';
await fs.mkdir('docs/venture',{recursive:true});
await fs.copyFile('dist-venture/Laura-Customer-Website.html','docs/venture/index.html');
console.log('Customer-facing venture website prepared in docs/venture/.');
