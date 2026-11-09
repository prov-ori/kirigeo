/* Слияние прогресса: числа — максимум, массивы — объединение, объекты — рекурсивно, прочее — локальное значение.
   Операция идемпотентна и коммутативна для чисел/множеств: прогресс на любом устройстве не теряется. */
(function (root) {
  function merge(a, b) {
    if (a === undefined || a === null) return b;
    if (b === undefined || b === null) return a;
    if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    if (Array.isArray(a) && Array.isArray(b)) {
      var seen = {}, out = [];
      a.concat(b).forEach(function (x) { var k = typeof x + JSON.stringify(x); if (!seen[k]) { seen[k] = 1; out.push(x); } });
      return out;
    }
    if (typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      var r = {}, keys = Object.keys(a).concat(Object.keys(b));
      keys.forEach(function (k) { if (!(k in r)) r[k] = merge(a[k], b[k]); });
      return r;
    }
    if (typeof a === 'string' && typeof b === 'string' && /^\d{4}-\d{2}-\d{2}/.test(a) && /^\d{4}-\d{2}-\d{2}/.test(b)) return a > b ? a : b; // даты: более поздняя
    if (typeof a === 'boolean' && typeof b === 'boolean') return a || b;
    return a;
  }
  root.KGMerge = merge;
  if (typeof module !== 'undefined') module.exports = merge;
})(typeof window !== 'undefined' ? window : globalThis);
