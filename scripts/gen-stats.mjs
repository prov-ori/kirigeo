// Считает реальные цифры по содержимому обоих предметов и пишет stats.js для главной страницы.
import vm from 'node:vm';
import {readFileSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const w = {}; w.window = w; vm.createContext(w);
for (const f of ['config','c1','c2','c3','c4','c5','extra','tests'])
  vm.runInContext(readFileSync(path.join(root,'kirjandus',f+'.js'),'utf8'), w, {filename:f});
const P = w.PLATFORM;
const sum = (a,f)=>a.reduce((s,x)=>s+f(x),0);
const lit = {
  courses: P.config.courses.length,
  lessons: P.lessons.length,
  questions: sum(P.lessons,l=>l.quiz.length),
  cards: sum(P.lessons,l=>l.cards.length),
  examItems: sum(Object.values(P.tests),t=>t.items.length),
};
const g = await import(pathToFileURL(path.join(root,'geo','content.js')).href);
const q = await import(pathToFileURL(path.join(root,'geo','quiz-extra.js')).href);
const geo = {
  courses: g.courses.length,
  lessons: g.lessons.length,
  questions: g.lessons.length + sum(g.lessons,l=>l.terms.length) + sum(Object.values(q.extraQuiz),a=>a.length), // как в questionBank() geo/app.js
  terms: g.terms.length,
  projects: g.projects.length,
};
const stats = {lit, geo};
writeFileSync(path.join(root,'stats.js'), '/* Сгенерировано scripts/gen-stats.mjs — не править вручную */\nwindow.KG_STATS = '+JSON.stringify(stats,null,2)+';\n');
console.log(JSON.stringify(stats));
