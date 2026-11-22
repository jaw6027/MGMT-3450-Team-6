import fs from 'node:fs/promises';
import path from 'node:path';

// Package the built app into one HTML file for downloading and offline use.
const root = path.resolve(process.argv[2] || 'dist');
let html = await fs.readFile(path.join(root,'index.html'),'utf8');
const jsPath = html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/)[1];
const cssPath = html.match(/<link[^>]*href="([^"]+)"[^>]*>/)[1];
let css = await fs.readFile(path.join(root,cssPath),'utf8');
for (const match of [...css.matchAll(/url\(([^)]+)\)/g)]) {
  const source=match[1].replace(/^["']|["']$/g,'');
  if(source.startsWith('data:')) continue;
  const file=source.startsWith('/') ? path.join(root,source) : path.resolve(root,path.dirname(cssPath).replace(/^\//,''),source);
  const font=await fs.readFile(file);
  css=css.replace(match[0],`url(data:font/woff2;base64,${font.toString('base64')})`);
}
const js=await fs.readFile(path.join(root,jsPath),'utf8');
html=html.replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/,()=>`<script type="module">${js.replaceAll('</script','<\\/script')}</script>`);
html=html.replace(/<link[^>]*href="[^"]+"[^>]*>/,()=>`<style>${css}</style>`);
const output=path.join(root,process.argv[3] || 'Plant-Based-Leather-Dashboard.html');
await fs.writeFile(output,html);
console.log(`Standalone dashboard saved to ${output}`);
