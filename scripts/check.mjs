// Проверка целостности: все локальные href/src в html существуют.
import {readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
let bad = 0;
for (const f of ['index.html','geo/index.html','kirjandus/index.html']) {
  const dir = path.dirname(f), s = readFileSync(f,'utf8');
  for (const m of s.matchAll(/(?:href|src)="([^"#?:]+)(?:[#?][^"]*)?"/g)) {
    const u = m[1]; if (/^(https?:|mailto:|\/\/)/.test(u)) continue;
    const p = path.join(dir, u); if (!existsSync(p)) { console.log('MISSING', f, u); bad++; }
  }
}
console.log(bad ? bad+' broken' : 'links ok'); process.exit(bad ? 1 : 0);
