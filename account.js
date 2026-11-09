/* Аккаунт и синхронизация прогресса (Supabase). Подключается на портале и в обоих приложениях. */
(function () {
  'use strict';
  var cfg = window.KG_ACCOUNT || {};
  var BASE = (document.currentScript && document.currentScript.src || location.href).replace(/[^\/]*$/, ''); // корень платформы
  var SUBJECTS = { kirjandus: 'kirjandus.v1', geo: 'geo-expedition-v1' };
  var OWNER_KEY = 'kg.owner', IS_HUB = location.pathname.replace(/index\.html$/, '').replace(/\/+$/, '') === BASE.replace(location.origin, '').replace(/\/+$/, '');
  var client = null, session = null, status = 'off', msg = '', dlg = null, lastPushed = '', timer = null;

  var triggers = function () { return document.querySelectorAll('[data-kg-account]'); };
  function el(tag, attrs, kids) { var e = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }); (kids || []).forEach(function (c) { e.appendChild(c); }); return e; }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function parse(s) { try { return JSON.parse(s); } catch (e) { return null; } }

  function label() {
    var t = status === 'ready' && session ? '✓ ' + (session.user.email || 'Аккаунт') : status === 'needs2fa' ? 'Введите код' : 'Войти';
    triggers().forEach(function (n) { n.textContent = t; n.hidden = false; });
  }

  /* ---------- синхронизация ---------- */
  function localSnapshot() { var o = {}; Object.keys(SUBJECTS).forEach(function (s) { o[s] = lsGet(SUBJECTS[s]) || ''; }); return JSON.stringify(o); }

  async function sync() {
    if (!client || !session || status !== 'ready') return;
    var uid = session.user.id, owner = lsGet(OWNER_KEY);
    var res = await client.from('progress').select('subject,data').eq('user_id', uid);
    if (res.error) { msg = 'Синхронизация не удалась: ' + res.error.message; render(); return; }
    var remote = {}; (res.data || []).forEach(function (r) { remote[r.subject] = r.data; });
    var replaceLocal = false;
    if (owner && owner !== uid) { // на устройстве лежит прогресс другого аккаунта — не смешиваем
      if (!confirm('На этом устройстве есть прогресс другого аккаунта. Заменить его данными вашего аккаунта?')) { await client.auth.signOut(); return; }
      replaceLocal = true;
    }
    var changedLocal = false, ups = [];
    Object.keys(SUBJECTS).forEach(function (s) {
      var key = SUBJECTS[s], loc = replaceLocal ? null : parse(lsGet(key)), rem = remote[s] || null;
      var merged = window.KGMerge(loc, rem);
      if (merged === null || merged === undefined) { if (replaceLocal) { try { localStorage.removeItem(key); } catch (e) {} changedLocal = true; } return; }
      var ms = JSON.stringify(merged);
      if (ms !== JSON.stringify(loc)) { lsSet(key, ms); changedLocal = true; }
      if (ms !== JSON.stringify(rem)) ups.push({ user_id: uid, subject: s, data: merged });
    });
    if (ups.length) {
      var up = await client.from('progress').upsert(ups, { onConflict: 'user_id,subject' });
      if (up.error) { msg = 'Не удалось сохранить: ' + up.error.message; render(); return; }
    }
    lsSet(OWNER_KEY, uid); lastPushed = localSnapshot(); msg = 'Сохранено ' + new Date().toLocaleTimeString().slice(0, 5); render();
    if (changedLocal) {
      window.dispatchEvent(new Event('kg:synced'));
      if (!IS_HUB) { var last = +sessionStorage.getItem('kg.reload') || 0; if (Date.now() - last > 15000) { sessionStorage.setItem('kg.reload', String(Date.now())); location.reload(); } }
    }
  }

  function watch() {
    clearInterval(timer);
    timer = setInterval(function () { if (status === 'ready' && localSnapshot() !== lastPushed) sync(); }, 20000);
  }
  document.addEventListener('visibilitychange', function () { if (status === 'ready' && (document.visibilityState === 'hidden' ? localSnapshot() !== lastPushed : true)) sync(); });

  /* ---------- состояние сессии ---------- */
  var busy = false;
  async function refresh() {
    if (busy) return; busy = true; try { await refresh1(); } finally { busy = false; }
  }
  async function refresh1() {
    var r = await client.auth.getSession(); session = r.data && r.data.session;
    if (!session) { status = 'out'; label(); render(); return; }
    var a = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    status = a.data && a.data.nextLevel === 'aal2' && a.data.currentLevel !== 'aal2' ? 'needs2fa' : 'ready';
    label(); render();
    if (status === 'needs2fa' && IS_HUB) open();
    if (status === 'ready') { await sync(); watch(); }
  }

  /* ---------- окно ---------- */
  var css = '.kg-dlg{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;background:#0008;padding:16px}.kg-dlg.on{display:flex}' +
    '.kg-box{background:#fff;color:#1c2433;border-radius:14px;max-width:420px;width:100%;padding:22px;font:15px/1.5 system-ui,sans-serif;max-height:90vh;overflow:auto}' +
    '@media(prefers-color-scheme:dark){.kg-box{background:#1b2231;color:#e8ebf2}.kg-box input{background:#121722;color:#e8ebf2;border-color:#2c3547}}' +
    '.kg-box h2{margin:0 0 8px;font-size:20px}.kg-box p{margin:6px 0}.kg-box small{color:#6b7488}' +
    '.kg-box input{width:100%;padding:10px;border:1px solid #c5cbd6;border-radius:8px;font-size:16px;margin:6px 0}' +
    '.kg-box button{padding:10px 14px;border-radius:8px;border:1px solid #a92a21;background:#a92a21;color:#fff;font:600 15px system-ui;cursor:pointer;margin:4px 6px 4px 0}' +
    '.kg-box button.sec{background:transparent;color:inherit;border-color:#9aa3b5}.kg-box code{word-break:break-all;font-size:13px}.kg-msg{color:#1f7a4d}.kg-err{color:#b3261e}.kg-box img{width:180px;height:180px;background:#fff}';

  function build() {
    if (dlg) return;
    document.head.appendChild(el('style', { text: css }));
    dlg = el('div', { 'class': 'kg-dlg', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Аккаунт' });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.body.appendChild(dlg);
  }
  function open() { build(); render(); dlg.classList.add('on'); }
  function close() { if (dlg) dlg.classList.remove('on'); }
  function note(text, err) { return el('p', { 'class': err ? 'kg-err' : 'kg-msg', text: text }); }
  function btn(text, fn, sec) { var b = el('button', { type: 'button', 'class': sec ? 'sec' : '', text: text }); b.addEventListener('click', function () { Promise.resolve(fn()).catch(function (e) { msg = 'Ошибка: ' + (e && e.message || e); render(); }); }); return b; }

  function render() {
    if (!dlg) return;
    var box = el('div', { 'class': 'kg-box' }), h = el('h2', { text: 'Аккаунт КириГео' });
    box.appendChild(h);
    if (status === 'out' || status === 'off') {
      box.appendChild(el('p', { text: 'Войдите, чтобы прогресс по литературе и географии сохранялся и был одинаковым на всех устройствах. Без входа всё работает как раньше.' }));
      var email = el('input', { type: 'email', placeholder: 'ваш@email', autocomplete: 'email', 'aria-label': 'Email' });
      box.appendChild(email);
      box.appendChild(btn('Получить ссылку для входа', async function () {
        if (!/^\S+@\S+\.\S+$/.test(email.value)) { msg = 'Введите корректный email.'; return render(); }
        var r = await client.auth.signInWithOtp({ email: email.value.trim(), options: { emailRedirectTo: BASE } });
        msg = r.error ? 'Ошибка: ' + r.error.message : 'Ссылка отправлена на ' + email.value + '. Откройте письмо на этом устройстве.'; render();
      }));
      if (cfg.google) box.appendChild(btn('Войти через Google', async function () {
        var r = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: BASE } });
        if (r.error) { msg = 'Ошибка: ' + r.error.message; render(); }
      }, true));
      box.appendChild(el('p', {}, [el('small', { text: 'Храним только email и учебный прогресс. ' }), el('a', { href: BASE + 'privacy.html', target: '_blank', rel: 'noopener', text: 'Политика конфиденциальности' })]));
    } else if (status === 'needs2fa') {
      box.appendChild(el('p', { text: 'Введите 6-значный код из Google Authenticator.' }));
      var code = el('input', { inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '6', placeholder: '123456', 'aria-label': 'Код' });
      box.appendChild(code);
      box.appendChild(btn('Подтвердить', async function () {
        var f = await client.auth.mfa.listFactors(), t = f.data && f.data.totp && f.data.totp[0];
        if (!t) { msg = 'Фактор не найден.'; return render(); }
        var v = await client.auth.mfa.challengeAndVerify({ factorId: t.id, code: code.value.trim() });
        if (v.error) { msg = 'Неверный код.'; render(); } else { msg = ''; await refresh(); }
      }));
      box.appendChild(btn('Выйти', function () { return client.auth.signOut(); }, true));
    } else {
      box.appendChild(el('p', { text: 'Вы вошли как ' + session.user.email }));
      box.appendChild(btn('Синхронизировать сейчас', sync));
      box.appendChild(btn('Выйти', function () { return client.auth.signOut(); }, true));
      var tot = el('div'); box.appendChild(tot); mfaSection(tot);
    }
    if (msg) box.appendChild(note(msg, /ошибк|не удалось|неверн|введите/i.test(msg)));
    box.appendChild(btn('Закрыть', close, true));
    dlg.textContent = ''; dlg.appendChild(box);
  }

  async function mfaSection(host) {
    var f = await client.auth.mfa.listFactors(), t = f.data && f.data.totp && f.data.totp[0];
    host.appendChild(el('h3', { text: 'Google Authenticator' }));
    if (t) {
      host.appendChild(el('p', { text: 'Двухфакторная защита включена: при входе нужен код из приложения.' }));
      host.appendChild(btn('Отключить', async function () { if (!confirm('Отключить Google Authenticator?')) return; var r = await client.auth.mfa.unenroll({ factorId: t.id }); msg = r.error ? 'Ошибка: ' + r.error.message : 'Отключено.'; await refresh(); }, true));
    } else {
      host.appendChild(el('p', { text: 'Необязательная защита: при входе потребуется код из приложения.' }));
      host.appendChild(btn('Подключить', async function () {
        var e = await client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'КириГео ' + new Date().toISOString().slice(0, 10) });
        if (e.error) { msg = 'Ошибка: ' + e.error.message; return render(); }
        host.textContent = '';
        host.appendChild(el('p', { text: 'Отсканируйте QR-код в Google Authenticator (или введите ключ вручную), затем введите код.' }));
        host.appendChild(el('img', { src: e.data.totp.qr_code, alt: 'QR-код для Google Authenticator' }));
        host.appendChild(el('p', {}, [el('code', { text: e.data.totp.secret })]));
        var code = el('input', { inputmode: 'numeric', maxlength: '6', placeholder: '123456', 'aria-label': 'Код' });
        host.appendChild(code);
        host.appendChild(btn('Подтвердить', async function () {
          var v = await client.auth.mfa.challengeAndVerify({ factorId: e.data.id, code: code.value.trim() });
          msg = v.error ? 'Неверный код.' : 'Google Authenticator подключён.'; await refresh();
        }));
      }));
    }
  }

  /* ---------- запуск ---------- */
  function start() {
    if (!cfg.url || !cfg.anonKey) return; // не настроено — ничего не показываем
    function init() {
      try { client = window.supabase.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, detectSessionInUrl: true, autoRefreshToken: true } }); } catch (e) { return; }
      triggers().forEach(function (n) { n.addEventListener('click', function (e) { e.preventDefault(); open(); }); });
      client.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_OUT') { status = 'out'; session = null; clearInterval(timer); label(); render(); } else if (ev === 'SIGNED_IN' || ev === 'TOKEN_REFRESHED' || ev === 'MFA_CHALLENGE_VERIFIED') { setTimeout(refresh, 0); } });
      status = 'out'; label(); refresh();
    }
    if (window.supabase) return init();
    var s = document.createElement('script'); s.src = BASE + 'vendor/supabase.js'; s.onload = init; s.onerror = function () {}; document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.KGAccount = { open: open, sync: sync };
})();
