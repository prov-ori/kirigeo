import test from 'node:test'; import assert from 'node:assert/strict'; import {createRequire} from 'node:module';
const merge = createRequire(import.meta.url)('../sync-merge.js');
test('числа — максимум, массивы — объединение, объекты — рекурсивно', () => {
  assert.deepEqual(merge({done:[1,2],xp:5,d:{x:1}}, {done:[2,3],xp:9,d:{y:2}}), {done:[1,2,3],xp:9,d:{x:1,y:2}});
});
test('null с одной стороны возвращает другую; слияние идемпотентно', () => {
  const a = {done:{a:1},xp:3}; assert.deepEqual(merge(a,null), a); assert.deepEqual(merge(merge(a,a),a), a);
});
test('даты — более поздняя', () => assert.equal(merge({d:'2026-01-02'},{d:'2026-03-01'}).d, '2026-03-01'));
