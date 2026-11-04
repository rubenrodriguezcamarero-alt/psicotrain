'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];

const CATS = [
  { id: 'giros', name: 'Giros', em: '🔄', desc: 'Rotaciones de figuras', c1: '#8b5cf6', c2: '#3b82f6', g: 'spatial' },
  { id: 'volteos', name: 'Volteos', em: '🪞', desc: 'Imágenes en espejo', c1: '#ec4899', c2: '#f97316', g: 'spatial' },
  { id: 'sinonimos', name: 'Sinónimos', em: '🤝', desc: 'Mismo significado', c1: '#14b8a6', c2: '#0284c7', g: 'verbal' },
  { id: 'antonimos', name: 'Antónimos', em: '⚖️', desc: 'Significado opuesto', c1: '#f43f5e', c2: '#f59e0b', g: 'verbal' },
  { id: 'gentilicios', name: 'Gentilicios', em: '🌍', desc: '¿De dónde es?', c1: '#16a34a', c2: '#0d9488', g: 'verbal' },
  { id: 'ortografia', name: 'Ortografía', em: '✍️', desc: 'Caza la falta', c1: '#f59e0b', c2: '#e11d48', g: 'verbal' },
  { id: 'analogias', name: 'Analogías', em: '🧩', desc: 'A es a B como…', c1: '#6366f1', c2: '#c026d3', g: 'verbal' },
  { id: 'intrusa', name: 'Palabra intrusa', em: '🔍', desc: '¿Cuál no encaja?', c1: '#0ea5e9', c2: '#7c3aed', g: 'verbal' },
];
const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
const VERBAL = CATS.filter(c => c.g === 'verbal').map(c => c.id);

// ---------------- Almacenamiento ----------------
const KEY = 'psicotrain.v1';
const DEFAULTS = () => ({ settings: { count: 10, time: 0, diff: 'examen', auto: 1, fx: 1, theme: 'auto', name: 'Lorena', apodos: 'Amparito, Pequeña, Amparo, Perrangana, Cuchifrita' }, stats: {}, days: [], errors: {} });
let DB = (() => {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d) { const def = DEFAULTS(); return { ...def, ...d, settings: { ...def.settings, ...d.settings } }; }
  } catch (e) {}
  return DEFAULTS();
})();
// Migración: quien tenía la dificultad media pasa al nivel examen (People Experts tiene nivel alto)
if (!DB.v) { if (DB.settings.diff === 'media') DB.settings.diff = 'examen'; DB.v = 2; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} };

// ---------------- Generación de preguntas ----------------
const decks = {};
function draw(cat, len) {
  if (!decks[cat] || !decks[cat].length) decks[cat] = shuffle([...Array(len).keys()]);
  return decks[cat].pop();
}
const opt = (t, ok) => ({ t, ok: !!ok });

function makeQuestion(cat, idx) {
  if (cat === 'giros') return Fig.giro(DB.settings.diff);
  if (cat === 'volteos') return Fig.volteo(DB.settings.diff);
  const L = DATA[cat];
  const i = idx ?? draw(cat, L.length);
  const p = L[i].split('|');
  const base = { cat, id: i, kind: 'text' };
  switch (cat) {
    case 'sinonimos':
    case 'antonimos': {
      const [w, ok, ...ds] = p;
      const syn = cat === 'sinonimos';
      return { ...base, prompt: `Elige el <b>${syn ? 'sinónimo' : 'antónimo'}</b> de`, word: w,
        options: shuffle([opt(ok, 1), ...ds.map(d => opt(d))]),
        explain: `<b>${w}</b> ${syn ? 'significa lo mismo que' : 'es lo contrario de'} <b>${ok}</b>.`,
        review: `${w} → ${ok}`, rae: w };
    }
    case 'gentilicios': {
      const [place, ok, ...fakes] = p;
      const ds = [...fakes].slice(0, 2);
      const others = shuffle(L.filter((_, j) => j !== i).map(s => s.split('|')[1]));
      while (ds.length < 3) { const o = others.pop(); if (o !== ok && !ds.includes(o)) ds.push(o); }
      return { ...base, prompt: '¿Cuál es el <b>gentilicio</b> de', word: place,
        options: shuffle([opt(ok, 1), ...ds.map(d => opt(d))]),
        explain: `Quien es de <b>${place}</b> es <b>${ok}</b>.`, review: `${place} → ${ok}`, rae: ok };
    }
    case 'ortografia': {
      const [ok, ...bad] = p;
      if (Math.random() < .5) {
        return { ...base, prompt: '¿Qué palabra está <b>bien escrita</b>?', word: '',
          options: shuffle([opt(ok, 1), ...bad.map(b => opt(b))]),
          explain: `Se escribe <b>${ok}</b>.`, review: `Se escribe ${ok}`, rae: ok };
      }
      const b = pick(bad);
      const goods = shuffle(L.filter((_, j) => j !== i)).slice(0, 3).map(s => s.split('|')[0]);
      return { ...base, prompt: '¿Qué palabra tiene una <b>falta de ortografía</b>?', word: '',
        options: shuffle([opt(b, 1), ...goods.map(g => opt(g))]),
        explain: `<b>${b}</b> está mal: se escribe <b>${ok}</b>.`, review: `${b} ✗ → ${ok}`, rae: ok };
    }
    case 'intrusa': {
      const [intr, a, b, c, comun] = p;
      return { ...base, prompt: '¿Qué palabra <b>no encaja</b> con las demás?', word: '',
        options: shuffle([opt(intr, 1), opt(a), opt(b), opt(c)]),
        explain: `<b>${intr}</b> es la intrusa: las demás son ${comun}.`, review: `${intr} (las demás: ${comun})`, rae: /^[a-záéíóúñ]+$/.test(intr) ? intr : '' };
    }
    case 'analogias': {
      const [a, b, c, ok, ...ds] = p;
      return { ...base, prompt: 'Completa la <b>analogía</b>', word: `${a} es a ${b}<br>como ${c} es a…`, analog: true,
        options: shuffle([opt(ok, 1), ...ds.map(d => opt(d))]),
        explain: `<b>${a}</b> es a <b>${b}</b> como <b>${c}</b> es a <b>${ok}</b>.`, review: `${c} → ${ok}` };
    }
  }
}

// Enlace a la definición en el diccionario oficial de la RAE (dle.rae.es)
const raeLink = w => w ? ` <a class="rae" href="https://dle.rae.es/${encodeURIComponent(w)}" target="_blank" rel="noopener">📖 «${w}» en la RAE</a>` : '';

// ---------------- Ánimo ----------------
// Casi siempre usa el nombre; de vez en cuando (40 %), uno de los apodos cariñosos
const apodos = () => (DB.settings.apodos || '').split(',').map(s => s.trim()).filter(Boolean);
const nombre = () => {
  const n = (DB.settings.name || '').trim(), ap = apodos();
  if (ap.length && (!n || Math.random() < .4)) return pick(ap);
  return n;
};
function frase(tipo, vars = {}) {
  let f = Array.isArray(MOTIVA[tipo]) ? pick(MOTIVA[tipo]) : MOTIVA[tipo];
  for (const [k, v] of Object.entries(vars)) f = f.split('{' + k + '}').join(v);
  const n = nombre();
  // Sin nombre, quita el vocativo («, {n}» / «{n}, ») para que la frase siga leyéndose bien
  if (!n) f = f.replace(/,\s*\{n\}/g, '').replace(/\{n\},\s*/g, '').replace(/\{n\}/g, '');
  else f = f.split('{n}').join(n);
  return f.charAt(0).toUpperCase() + f.slice(1);
}
function animo(texto) {
  const el = $('#cheer');
  el.textContent = texto;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(animo.t); animo.t = setTimeout(() => el.classList.remove('show'), 4200);
}
function nuevaFraseInicio() { $('#motivText').textContent = frase('inicio'); }

// Anima la figura original hasta convertirla en la respuesta correcta:
// primero se da la vuelta (si es un volteo) y después gira.
function demo({ flip, deg }) {
  const el = document.querySelector('#demoFig svg');
  if (!el || !el.animate) return;
  const f = flip === 'x' ? 'scaleX(-1)' : flip === 'y' ? 'scaleY(-1)' : 'scale(1)';
  const frames = [{ transform: 'rotate(0deg) scale(1)' }];
  if (flip) frames.push({ transform: `rotate(0deg) ${f}`, offset: deg ? .45 : 1 });
  if (deg || !flip) frames.push({ transform: `rotate(${deg}deg) ${f}` });
  el.animate(frames, { duration: deg && flip ? 1800 : 1100, delay: 250, easing: 'ease-in-out', fill: 'forwards' });
}

// ---------------- Navegación ----------------
function show(id) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === id));
  window.scrollTo(0, 0);
}

// ---------------- Inicio ----------------
function catStats(id) { const s = DB.stats[id] || { ok: 0, n: 0 }; return { ...s, pct: s.n ? Math.round(100 * s.ok / s.n) : null }; }
function today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function streak() {
  const set = new Set(DB.days); let n = 0; const d = new Date();
  if (!set.has(today())) d.setDate(d.getDate() - 1);
  while (set.has(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`)) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function errCount() { return Object.values(DB.errors).reduce((a, l) => a + l.length, 0); }

function renderHome() {
  const h = new Date().getHours();
  const nom = nombre();
  const saludo = h < 6 ? 'Buenas noches' : h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
  $('#hello').textContent = `¡${saludo}${nom ? ', ' + nom : ''}! ${h >= 6 && h < 14 ? '☀️' : h >= 6 && h < 21 ? '👋' : '🌙'}`;
  const st = streak();
  $('#motivText').textContent = st >= 3 && Math.random() < .5 ? frase('dias', { d: st }) : frase('inicio');
  let ok = 0, n = 0;
  Object.values(DB.stats).forEach(s => { ok += s.ok; n += s.n; });
  $('#stStreak').textContent = streak();
  $('#stAcc').textContent = n ? Math.round(100 * ok / n) + '%' : '–';
  $('#stTotal').textContent = n;
  const card = c => {
    const s = catStats(c.id);
    return `<button class="cat${c.wide ? ' wide' : ''}" data-cat="${c.id}" style="--c1:${c.c1};--c2:${c.c2}">
      <span class="em">${c.em}</span><div><b>${c.name}</b><small>${c.desc}</small>
      <div class="bar"><i style="width:${s.pct ?? 0}%"></i></div></div>
      ${s.pct !== null ? `<span class="pct">${s.pct}%</span>` : ''}</button>`;
  };
  $('#gridSpatial').innerHTML = CATS.filter(c => c.g === 'spatial').map(card).join('');
  $('#gridVerbal').innerHTML = CATS.filter(c => c.g === 'verbal').map(card).join('');
  const ne = errCount();
  $('#btnReview').hidden = !ne;
  $('#nErr').textContent = ne;
}

// ---------------- Test ----------------
let Q = null, tick = null, advanceT = null;

function startQuiz(cats, mode = 'normal') {
  sfx.unlock();
  clearTimeout(animo.t); $('#cheer').classList.remove('show');
  let list;
  const n = DB.settings.count;
  if (mode === 'review') {
    const items = [];
    for (const [c, ids] of Object.entries(DB.errors)) ids.forEach(id => items.push([c, id]));
    list = shuffle(items).slice(0, n).map(([c, id]) => makeQuestion(c, id));
  } else if (mode === 'exam') {
    // Como el examen real: bloque verbal (20) y bloque espacial (20), 40 minutos, los fallos restan ⅓
    const bloque = (cats, nombre) => shuffle(Array.from({ length: 20 }, (_, k) => cats[k % cats.length]))
      .map(c => ({ lazy: c, block: nombre }));
    list = [...bloque(VERBAL, 'verbal'), ...bloque(['giros', 'volteos'], 'espacial')];
  } else {
    const seq = [];
    for (let k = 0; k < n; k++) seq.push(cats[k % cats.length]);
    list = shuffle(seq).map(c => ({ lazy: c })); // cada pregunta se genera al mostrarla
  }
  Q = { cats, mode, list, i: 0, res: [], start: Date.now(), racha: 0, fallosSeguidos: 0, ultimoAnimo: -9,
        examEnd: mode === 'exam' ? Date.now() + 40 * 60 * 1000 : 0 };
  show('quiz');
  renderQuestion();
}

function renderQuestion() {
  clearTimeout(advanceT);
  const pend = Q.list[Q.i];
  if (pend.lazy) Q.list[Q.i] = { ...makeQuestion(pend.lazy), block: pend.block };
  const q = Q.list[Q.i], c = CAT[q.cat];
  const quiz = $('#quiz');
  quiz.style.setProperty('--c1', c.c1); quiz.style.setProperty('--c2', c.c2);
  $('#qTag').textContent = `${c.em} ${c.name}`;
  if (q.block) {
    const ini = Q.list.findIndex(x => x.block === q.block);
    const tot = Q.list.filter(x => x.block === q.block).length;
    $('#qCount').textContent = `${q.block === 'verbal' ? 'Verbal' : 'Espacial'} ${Q.i - ini + 1}/${tot}`;
    const esteTest = Q;
    if (Q.i === ini) setTimeout(() => Q === esteTest && animo(q.block === 'verbal' ? 'Bloque 1 de 2: razonamiento verbal 📚' : 'Bloque 2 de 2: razonamiento espacial 🧩 ¡A por ello!'), 300);
  } else $('#qCount').textContent = `${Q.i + 1} / ${Q.list.length}`;
  $('#prog').style.width = `${100 * Q.i / Q.list.length}%`;
  $('#qPrompt').innerHTML = q.prompt;
  const w = $('#qWord');
  w.innerHTML = q.word || ''; w.style.display = q.word ? '' : 'none'; w.classList.toggle('analog', !!q.analog);
  $('#qFig').innerHTML = q.figHtml || ''; $('#qFig').style.display = q.figHtml ? '' : 'none';
  const box = $('#qOpts');
  box.className = 'opts' + (q.kind === 'fig' ? ' figs' : '');
  box.innerHTML = q.options.map((o, i) =>
    `<button class="opt" data-i="${i}"><span class="l">${'ABCD'[i]}</span>${o.html || o.t}</button>`).join('');
  $('#feedback').classList.remove('show', 'good', 'wrong');
  $('.spacer').style.height = '24px'; window.scrollTo(0, 0);
  q.t0 = Date.now();
  startTimer();
}

function startTimer() {
  clearInterval(tick);
  const el = $('#timer');
  const per = DB.settings.time;
  if (!Q.examEnd && !per) { el.hidden = true; return; }
  el.hidden = false;
  const qEnd = per && !Q.examEnd ? Date.now() + per * 1000 : 0;
  const upd = () => {
    const end = Q.examEnd || qEnd;
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    el.classList.toggle('warn', Q.examEnd ? left <= 30 : left <= 5);
    if (left <= 0) {
      clearInterval(tick);
      if (Q.examEnd) finish(true); else answer(-1);
    }
  };
  upd(); tick = setInterval(upd, 250);
}

function answer(i) {
  const q = Q.list[Q.i];
  if (q.done) return;
  q.done = true;
  clearInterval(tick);
  const box = $('#qOpts');
  box.classList.add('locked');
  const btns = [...box.children];
  const ci = q.options.findIndex(o => o.ok);
  const ok = i === ci;
  btns.forEach((b, k) => { if (k === ci) b.classList.add('ok'); else if (k === i) b.classList.add('bad'); else b.classList.add('dim'); });
  Q.res.push({ q, ok, blank: i < 0, chosen: i });
  record(q, ok);
  ok ? sfx.ok() : sfx.bad();
  const fb = $('#feedback');
  fb.classList.add('show', ok ? 'good' : 'wrong');
  $('#fbTitle').textContent = ok ? pick(['¡Correcto! 🎉', '¡Genial! ✨', '¡Bien hecho! 💪', '¡Eso es! 🚀']) : i < 0 ? '⏰ ¡Se acabó el tiempo!' : 'Incorrecto 😬';
  $('#fbText').innerHTML = q.anim
    ? `<span class="demo"><span class="demofig" id="demoFig" title="Toca para repetir">${q.origHtml}</span><span>${q.explain}<br><small class="replay">Toca la figura para verlo otra vez</small></span></span>`
    : q.explain + raeLink(q.rae);
  if (q.anim) { demo(q.anim); $('#demoFig').onclick = () => demo(q.anim); }
  $('#btnNext').textContent = Q.i + 1 < Q.list.length ? 'Siguiente ➜' : 'Ver resultados 🏁';
  // Deja visibles las opciones por encima del panel de respuesta
  requestAnimationFrame(() => {
    const fh = fb.querySelector('.in').offsetHeight + 24;
    $('.spacer').style.height = fh + 'px';
    const bottom = box.getBoundingClientRect().bottom;
    const over = bottom - (innerHeight - fh);
    if (over > 0) window.scrollTo({ top: scrollY + over, behavior: 'smooth' });
  });
  if (ok && DB.settings.auto == 1) advanceT = setTimeout(next, 1100);
  // Mensajes de ánimo de vez en cuando (como mucho uno cada 3 preguntas)
  Q.racha = ok ? Q.racha + 1 : 0;
  Q.fallosSeguidos = ok ? 0 : Q.fallosSeguidos + 1;
  let msg = '';
  if (ok && [3, 6, 10, 15, 20].includes(Q.racha)) msg = frase('racha', { k: Q.racha });
  else if (Q.fallosSeguidos === 2) msg = frase('fallos');
  else if (Q.list.length >= 10 && Q.i + 1 === Math.floor(Q.list.length / 2)) msg = frase('mitad');
  if (msg && Q.i - Q.ultimoAnimo >= 3) { Q.ultimoAnimo = Q.i; setTimeout(() => animo(msg), 350); }
}

function record(q, ok) {
  const s = DB.stats[q.cat] || (DB.stats[q.cat] = { ok: 0, n: 0 });
  s.n++; if (ok) s.ok++;
  if (q.id !== undefined) {
    const l = DB.errors[q.cat] || (DB.errors[q.cat] = []);
    const k = l.indexOf(q.id);
    if (ok && k >= 0) l.splice(k, 1);
    if (!ok && k < 0) l.push(q.id);
  }
  save();
}

function next() {
  clearTimeout(advanceT);
  if (!Q) return;
  $('#qOpts').classList.remove('locked');
  if (Q.i + 1 >= Q.list.length) return finish(false);
  Q.i++;
  renderQuestion();
}

function finish(timeUp) {
  clearInterval(tick); clearTimeout(advanceT);
  clearTimeout(animo.t); $('#cheer').classList.remove('show');
  $('#feedback').classList.remove('show');
  const total = Q.list.length;
  const okN = Q.res.filter(r => r.ok).length;
  const badN = Q.res.filter(r => !r.ok && !r.blank).length;
  const blank = total - okN - badN;
  const pct = Math.round(100 * okN / total);
  const nota = Math.max(0, (okN - badN / 3) / total * 10);
  if (!DB.days.includes(today())) { DB.days.push(today()); DB.days = DB.days.slice(-400); }
  save();

  show('results');
  $('#rOk').textContent = okN; $('#rBad').textContent = badN; $('#rBlank').textContent = blank;
  $('#rNota').textContent = nota.toFixed(1).replace('.', ',');
  const secs = Math.round((Date.now() - Q.start) / 1000);
  const [title, emoji] = pct >= 90 ? ['¡Espectacular!', '🏆'] : pct >= 70 ? ['¡Muy bien!', '🌟'] : pct >= 50 ? ['Vas por buen camino', '💪'] : ['¡A seguir entrenando!', '📚'];
  $('#resTitle').textContent = `${title} ${emoji}`;
  $('#resSub').textContent = `${timeUp ? '⏰ Tiempo agotado · ' : ''}${Math.floor(secs / 60)} min ${secs % 60} s · Los fallos restan ⅓`;
  const bl = $('#resBlocks');
  if (Q.mode === 'exam') {
    const nb = b => {
      const r = Q.res.filter(x => x.q.block === b), t = Q.list.filter(x => x.block === b).length;
      const ok = r.filter(x => x.ok).length, bad = r.filter(x => !x.ok && !x.blank).length;
      return { ok, bad, blank: t - ok - bad, nota: Math.max(0, (ok - bad / 3) / t * 10) };
    };
    const v = nb('verbal'), e = nb('espacial'), f = x => x.toFixed(1).replace('.', ',');
    bl.innerHTML = [['📚 Verbal', v], ['🧩 Espacial', e]].map(([t, x]) =>
      `<div class="blk"><b>${t}</b><span>${x.ok} ✓ · ${x.bad} ✗ · ${x.blank} en blanco</span><strong>${f(x.nota)}</strong></div>`).join('')
      + `<div class="blk total"><b>Media de los dos bloques</b><span>Así se calcula en el examen de Metro</span><strong>${f((v.nota + e.nota) / 2)}</strong></div>`;
    bl.hidden = false;
  } else bl.hidden = true;
  $('#resMotiv').textContent = frase(pct >= 75 ? 'alto' : pct >= 50 ? 'medio' : 'bajo');
  let shown = 0;
  const ring = $('#ringVal');
  ring.style.transition = 'none'; ring.style.strokeDashoffset = 414.7;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    ring.style.transition = ''; ring.style.strokeDashoffset = 414.7 * (1 - pct / 100);
  }));
  const step = () => { shown = Math.min(pct, shown + Math.max(1, Math.round(pct / 30))); $('#resPct').textContent = shown + '%'; if (shown < pct) requestAnimationFrame(step); };
  $('#resPct').textContent = '0%'; requestAnimationFrame(step);
  if (pct >= 70) setTimeout(confetti, 400);
  if (pct >= 70) sfx.win();

  const wrong = Q.res.filter(r => !r.ok);
  $('#review').innerHTML = wrong.length ? `<h3>Repasa tus fallos (${wrong.length})</h3>` + wrong.map(r => {
    const q = r.q, c = CAT[q.cat];
    const right = q.options.find(o => o.ok);
    if (q.kind === 'fig') return `<div class="rv"><div class="mini">${right.html}</div><div class="t"><small>${c.em} ${c.name}</small>${q.prompt.replace(/<[^>]+>/g, '')}<br><span class="yes">La miniatura es la solución</span></div></div>`;
    const mine = r.chosen >= 0 ? `<span class="no">${q.options[r.chosen].t}</span> · ` : '';
    return `<div class="rv"><div class="t"><small>${c.em} ${c.name}${q.word ? ' · ' + q.word.replace(/<br>/g, ' ') : ''}</small>${mine}<span class="yes">${right.t}</span>${raeLink(q.rae)}</div></div>`;
  }).join('') : '<h3 style="text-align:center">¡Ni un solo fallo! 🦄</h3>';
}

// ---------------- Efectos ----------------
const sfx = (() => {
  let ctx;
  const tone = (f, d, type = 'sine', t0 = 0, vol = .12) => {
    if (!DB.settings.fx || !ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d);
  };
  const vib = p => { if (DB.settings.fx && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };
  return {
    unlock() { try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); } catch (e) {} },
    ok() { tone(660, .12); tone(990, .18, 'sine', .09); vib(15); },
    bad() { tone(200, .25, 'triangle'); vib([40, 50, 40]); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .25, 'sine', i * .1)); },
  };
})();

function confetti() {
  const cv = $('#confetti'), x = cv.getContext('2d');
  const W = cv.width = innerWidth * devicePixelRatio, H = cv.height = innerHeight * devicePixelRatio;
  const cols = ['#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#e30613', '#0057b8'];
  const P = Array.from({ length: 140 }, () => ({ x: W / 2, y: H * .35, vx: (Math.random() - .5) * 26, vy: -Math.random() * 26 - 6,
    s: (6 + Math.random() * 8) * devicePixelRatio, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: pick(cols) }));
  let f = 0;
  (function loop() {
    x.clearRect(0, 0, W, H);
    P.forEach(p => { p.vy += .7; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); });
    if (++f < 150) requestAnimationFrame(loop); else x.clearRect(0, 0, W, H);
  })();
}

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------------- Ajustes ----------------
function applyTheme() {
  const t = DB.settings.theme;
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name=theme-color]').content = dark ? '#0b0f24' : '#f4f2ff';
}
function renderSettings() {
  $('#nameInput').value = DB.settings.name || '';
  $('#apodosInput').value = DB.settings.apodos || '';
  $$('.seg').forEach(seg => {
    const k = seg.dataset.key;
    [...seg.children].forEach(b => b.classList.toggle('on', String(DB.settings[k]) === b.dataset.v));
  });
}
function openSheet(open) {
  renderSettings();
  $('#sheet').classList.toggle('show', open);
  $('#overlay').classList.toggle('show', open);
}

// ---------------- Eventos ----------------
document.addEventListener('click', e => {
  const cat = e.target.closest('.cat');
  if (cat) return startQuiz([cat.dataset.cat]);
  const o = e.target.closest('.opt');
  if (o && Q) return answer(+o.dataset.i);
  const sb = e.target.closest('.seg button');
  if (sb) {
    const k = sb.parentElement.dataset.key, v = sb.dataset.v;
    DB.settings[k] = isNaN(v) ? v : +v;
    save(); renderSettings(); if (k === 'theme') applyTheme();
  }
});
$('#btnExam').onclick = () => startQuiz(CATS.map(c => c.id), 'exam');
$('#btnMix').onclick = () => startQuiz(CATS.map(c => c.id));
$('#btnReview').onclick = () => startQuiz(VERBAL, 'review');
$('#btnNext').onclick = next;
$('#btnQuit').onclick = () => {
  clearInterval(tick); clearTimeout(advanceT); $('#cheer').classList.remove('show'); $('#feedback').classList.remove('show'); Q = null; renderHome(); show('home');
};
$('#btnAgain').onclick = () => startQuiz(Q.cats, Q.mode === 'review' && !errCount() ? 'normal' : Q.mode);
$('#btnHome').onclick = () => { Q = null; renderHome(); show('home'); };
$('#btnSettings').onclick = () => openSheet(true);
$('#nameInput').addEventListener('input', e => { DB.settings.name = e.target.value.slice(0, 30); save(); renderHome(); });
$('#apodosInput').addEventListener('input', e => { DB.settings.apodos = e.target.value.slice(0, 200); save(); });
$('#motiv').onclick = nuevaFraseInicio;
$('#cheer').onclick = () => { clearTimeout(animo.t); $('#cheer').classList.remove('show'); }; // tocar para cerrarlo
$('#btnClose').onclick = $('#overlay').onclick = () => openSheet(false);
$('#btnReset').onclick = () => {
  const b = $('#btnReset');
  if (!b.dataset.armed) {
    b.dataset.armed = 1; b.textContent = 'Pulsa otra vez para borrarlo todo';
    setTimeout(() => { delete b.dataset.armed; b.textContent = 'Borrar estadísticas'; }, 3000);
    return;
  }
  delete b.dataset.armed; b.textContent = 'Borrar estadísticas';
  const s = DB.settings; DB = DEFAULTS(); DB.settings = s; save(); renderHome(); openSheet(false); toast('Estadísticas borradas');
};
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

// ---------------- Instalación (PWA) ----------------
let deferred = null;
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#install').classList.add('show'); });
if (!standalone && isIOS) {
  $('#installText').innerHTML = 'Para instalarla: pulsa <b>Compartir</b> <span style="font-size:16px">⬆️</span> y luego <b>«Añadir a pantalla de inicio»</b>.';
  $('#installBtn').textContent = 'Entendido';
  $('#install').classList.add('show');
}
$('#installBtn').onclick = async () => {
  if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; }
  $('#install').classList.remove('show');
};
window.addEventListener('appinstalled', () => { $('#install').classList.remove('show'); toast('¡App instalada! 🦄'); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});

applyTheme();
renderHome();
