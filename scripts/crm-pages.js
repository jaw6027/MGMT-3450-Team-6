import fs from 'node:fs/promises';
await fs.mkdir('docs/customer-relationships',{recursive:true});
await fs.copyFile('dist-crm/Laura-PPE-Customer-Relationships.html','docs/customer-relationships/index.html');
console.log('Separate CRM website prepared in docs/customer-relationships/.');
