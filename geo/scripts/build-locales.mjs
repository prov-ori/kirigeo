// Estonian UI is generated from reviewed local translations. No external service is used.
import {parse} from './vendor/acorn.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),source=await readFile(new URL('app.js',root),'utf8'),cache=JSON.parse(await readFile(new URL('ui-et.json',root),'utf8'));
const nodes=[],tree=parse(source,{ecmaVersion:'latest',sourceType:'module'}),pattern=/[А-Яа-яЁё][А-Яа-яЁёA-Za-z0-9 \t.,:;!?…«»()\/%·=→↗←+−°–—\-]*/gu;
function walk(n){if(!n||typeof n!=='object')return;if(n.type==='Literal'&&typeof n.value==='string'&&/[А-Яа-яЁё]/u.test(n.value))nodes.push({start:n.start,end:n.end,text:n.value,kind:'literal'});if(n.type==='TemplateElement'&&/[А-Яа-яЁё]/u.test(n.value.raw))nodes.push({start:n.start,end:n.end,text:n.value.raw,kind:'template'});for(const[k,v]of Object.entries(n)){if(['start','end'].includes(k)||k==='value'&&['Literal','TemplateElement'].includes(n.type))continue;if(Array.isArray(v))v.forEach(walk);else walk(v);}}walk(tree);
const missing=[...new Set(nodes.flatMap(n=>[...n.text.matchAll(pattern)].map(m=>m[0].trim())).filter(s=>!cache[s]))];if(missing.length)throw Error('Missing Estonian translations: '+JSON.stringify(missing));
let app=source;for(const n of nodes.sort((a,b)=>b.start-a.start)){let t=n.text.replace(pattern,m=>{const s=m.trim();return cache[s]+m.slice(s.length);});if(n.kind==='literal')t=JSON.stringify(t);else t=t.replace(/`/g,'\\`').replace(/\$\{/g,'\\${');app=app.slice(0,n.start)+t+app.slice(n.end);}
app=app.replace("from './content.js'","from './content-et.js'").replace("from './countries.js'","from './countries-et.js'").replaceAll('»','”');
app=app.replace('prompt:`Riigi „${c.name}”?`','prompt:`Mis on riigi „${c.name}” pealinn?`');
await writeFile(new URL('app-et.js',root),app);
