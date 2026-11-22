import fs from 'node:fs/promises';
await fs.mkdir('docs/product-development',{recursive:true});
await fs.copyFile('dist-product/Laura-Product-Development-Dashboard.html','docs/product-development/index.html');
console.log('Separate product-development website prepared in docs/product-development/.');
