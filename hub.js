(function () {
  'use strict';
  var S = window.KG_STATS || {lit: {}, geo: {}};
  function read(key) { try { return JSON.parse(localStorage.getItem(key)) || null; } catch (e) { return null; } }
  function $(id) { return document.getElementById(id); }
  function plural(n, a, b, c) { var m = n % 100, d = n % 10; return m > 10 && m < 20 ? c : d === 1 ? a : d >= 2 && d <= 4 ? b : c; }
  function stat(n, one, few, many) { return '<li><b>' + n + '</b> ' + plural(n, one, few, many) + '</li>'; }

  $('lit-stats').innerHTML = stat(S.lit.lessons, 'урок', 'урока', 'уроков') + stat(S.lit.questions, 'вопрос', 'вопроса', 'вопросов') + stat(S.lit.examItems, 'вопрос теста', 'вопроса теста', 'вопросов теста');
  $('geo-stats').innerHTML = stat(S.geo.lessons, 'урок', 'урока', 'уроков') + stat(S.geo.questions, 'вопрос', 'вопроса', 'вопросов') + stat(S.geo.terms, 'понятие', 'понятия', 'понятий');

  // Прогресс читаем из тех же ключей localStorage, что и сами приложения (один origin).
  var lit = read('kirjandus.v1'), geo = read('geo-expedition-v1');
  var litDone = lit && lit.done ? Object.keys(lit.done).length : 0;
  var geoDone = geo && Array.isArray(geo.done) ? geo.done.length : 0;
  var litXp = lit && +lit.xp > 0 ? +lit.xp : 0, geoXp = geo && +geo.xp > 0 ? +geo.xp : 0;

  function show(prefix, done, total, xp) {
    var pct = total ? Math.min(100, Math.round(done / total * 100)) : 0;
    $(prefix + '-bar').style.width = pct + '%';
    $(prefix + '-prog').textContent = done ? 'Пройдено уроков: ' + done + ' из ' + total + ' · ' + xp + ' XP' : 'Вы ещё не начинали — самое время.';
    if (done) $(prefix + '-go').textContent = 'Продолжить';
  }
  show('lit', litDone, S.lit.lessons, litXp);
  show('geo', geoDone, S.geo.lessons, geoXp);

  if (litDone || geoDone) {
    var t = $('total'), all = S.lit.lessons + S.geo.lessons, done = litDone + geoDone;
    t.hidden = false;
    t.textContent = 'Всего пройдено ' + done + ' из ' + all + ' уроков · ' + (litXp + geoXp) + ' XP';
  }
})();
