import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../content.js';
import {extraQuiz as ru} from '../quiz-extra.js';
import {extraQuiz as et} from '../quiz-extra-et.js';
const check=(name,q)=>{
  for(const l of lessons){
    const a=q[l.id];assert.ok(a&&a.length>=4,`${name}: у урока ${l.id} меньше 4 дополнительных вопросов`);
    for(const x of a){
      assert.equal(x.options.length,3,`${name} ${l.id}: нужно 3 варианта`);
      assert.equal(new Set(x.options).size,3,`${name} ${l.id}: повторяющиеся варианты «${x.prompt}»`);
      assert.equal(x.correct,0);assert.ok(x.prompt&&x.explanation,`${name} ${l.id}: пустой текст`);
    }
  }
  const prompts=Object.values(q).flat().map(x=>x.prompt);
  assert.equal(new Set(prompts).size,prompts.length,`${name}: повторяющиеся вопросы`);
};
test('Русские дополнительные вопросы полны и корректны',()=>check('ru',ru));
test('Эстонские дополнительные вопросы полны и корректны',()=>check('et',et));
test('Русская и эстонская версии содержат одинаковое число вопросов на урок',()=>{for(const l of lessons)assert.equal(ru[l.id].length,et[l.id].length,`урок ${l.id}`);});
test('Верный ответ не является самым длинным слишком часто (иначе его можно угадать)',()=>{
  for(const [n,q] of [['ru',ru],['et',et]]){const all=Object.values(q).flat();const longest=all.filter(x=>x.options[0].length>Math.max(x.options[1].length,x.options[2].length)).length;assert.ok(longest/all.length<0.5,`${n}: верный ответ самый длинный в ${Math.round(100*longest/all.length)}% вопросов`);}
});
