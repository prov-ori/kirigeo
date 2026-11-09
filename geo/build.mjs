import {mkdir,copyFile} from 'node:fs/promises';
await import('./scripts/build-locales.mjs');
await mkdir('dist',{recursive:true});
for(const f of ['index.html','style.css','mobile.css','language.js','mobile.js','app.js','app-et.js','core.js','content.js','content-et.js','countries.js','countries-et.js','world.json','logo.svg','og-image.png']) await copyFile(f,`dist/${f}`);
console.log('Built GEO: static, offline-capable content, no runtime dependencies.');
