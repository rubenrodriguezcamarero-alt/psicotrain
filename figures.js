// Generador de ejercicios de GIROS y VOLTEOS con figuras aleatorias.
const Fig = (() => {
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // --- Geometría de celdas ---------------------------------------------
  function norm(cs) {
    const mx = Math.min(...cs.map(c => c.x)), my = Math.min(...cs.map(c => c.y));
    return cs.map(c => ({ x: c.x - mx, y: c.y - my, m: c.m })).sort((a, b) => a.y - b.y || a.x - b.x);
  }
  const key = cs => norm(cs).map(c => c.x + ',' + c.y + (c.m ? '*' : '')).join(';');
  // Giro de 90º en sentido horario (eje Y hacia abajo, como en pantalla)
  const rot1 = cs => norm(cs.map(c => ({ x: -c.y, y: c.x, m: c.m })));
  const rot = (cs, n) => { n = ((n % 4) + 4) % 4; let r = norm(cs); while (n--) r = rot1(r); return r; };
  const flipLR = cs => norm(cs.map(c => ({ x: -c.x, y: c.y, m: c.m }))); // espejo izquierda-derecha
  const flipUD = cs => norm(cs.map(c => ({ x: c.x, y: -c.y, m: c.m }))); // espejo arriba-abajo
  const family = cs => [0, 1, 2, 3].map(k => key(rot(cs, k)));

  // «examen»: como en People Experts, sin pista de color y con piezas casi iguales como trampa
  const LEVEL = { facil: { n: 5, box: 3 }, media: { n: 6, box: 4 }, dificil: { n: 8, box: 4 }, examen: { n: 8, box: 4, nomark: true } };

  function isChiral(cs) {
    const r = family(cs);
    if (new Set(r).size < 4) return false;
    const m = family(flipLR(cs));
    return !m.some(k => r.includes(k));
  }

  function gen(diff) {
    const { n, box, nomark } = LEVEL[diff] || LEVEL.media;
    for (let t = 0; t < 2000; t++) {
      const cells = [{ x: 0, y: 0 }];
      const has = (x, y) => cells.some(c => c.x === x && c.y === y);
      let guard = 0;
      while (cells.length < n && guard++ < 300) {
        const c = cells[rnd(cells.length)];
        const d = [[1, 0], [-1, 0], [0, 1], [0, -1]][rnd(4)];
        const x = c.x + d[0], y = c.y + d[1];
        if (has(x, y)) continue;
        const xs = cells.map(c => c.x).concat(x), ys = cells.map(c => c.y).concat(y);
        if (Math.max(...xs) - Math.min(...xs) >= box || Math.max(...ys) - Math.min(...ys) >= box) continue;
        cells.push({ x, y });
      }
      if (cells.length < n) continue;
      const cs = norm(cells.map(c => ({ ...c, m: false })));
      if (!nomark) cs[rnd(cs.length)].m = true;
      if (isChiral(cs)) return cs;
    }
    throw new Error('No se pudo generar figura');
  }

  // Misma figura con una sola pieza cambiada de sitio (distractor casi idéntico)
  function nearMiss(cs) {
    for (let t = 0; t < 200; t++) {
      const i = rnd(cs.length);
      const rest = cs.filter((_, k) => k !== i);
      if (!connected(rest)) continue;
      const c = rest[rnd(rest.length)], d = [[1, 0], [-1, 0], [0, 1], [0, -1]][rnd(4)];
      const x = c.x + d[0], y = c.y + d[1];
      if ((x === cs[i].x && y === cs[i].y) || rest.some(r => r.x === x && r.y === y)) continue;
      return norm([...rest, { x, y, m: false }]);
    }
    return null;
  }
  function connected(cs) {
    const seen = new Set([0]), stack = [0];
    while (stack.length) {
      const a = cs[stack.pop()];
      cs.forEach((b, k) => { if (!seen.has(k) && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1) { seen.add(k); stack.push(k); } });
    }
    return seen.size === cs.length;
  }
  // Distractor sutil: sin marca, una pieza movida; con marca, la marca en otra celda
  const variant = cs => cs.some(c => c.m) ? moveMarker(cs) : nearMiss(cs);

  // Misma silueta pero con la marca en otra celda (distractor sutil)
  function moveMarker(cs) {
    const i = cs.findIndex(c => c.m);
    let j = rnd(cs.length - 1); if (j >= i) j++;
    return norm(cs.map((c, k) => ({ ...c, m: k === j })));
  }

  // Elige n figuras distintas del pool cuyo key no esté en "exclude"
  function pickDistinct(pool, exclude, n) {
    const used = new Set(exclude), out = [];
    for (const cs of pool) {
      const k = key(cs);
      if (used.has(k)) continue;
      used.add(k); out.push(cs);
      if (out.length === n) break;
    }
    return out;
  }

  // --- Dibujo SVG --------------------------------------------------------
  function svg(cs, size) {
    const w = Math.max(...cs.map(c => c.x)) + 1, h = Math.max(...cs.map(c => c.y)) + 1;
    const n = (size || Math.max(w, h)) + 0.5;
    const ox = (n - w) / 2, oy = (n - h) / 2;
    let s = `<svg viewBox="0 0 ${n} ${n}" class="figsvg" aria-hidden="true">`;
    for (const c of cs) {
      const x = c.x + ox, y = c.y + oy;
      s += `<rect x="${x + .05}" y="${y + .05}" width=".9" height=".9" rx=".18" class="${c.m ? 'cm' : 'cc'}"/>`;
      if (c.m) s += `<circle cx="${x + .5}" cy="${y + .5}" r=".2" class="cd"/>`;
    }
    return s + '</svg>';
  }
  const dim = cs => Math.max(Math.max(...cs.map(c => c.x)), Math.max(...cs.map(c => c.y))) + 1;
  const ref = (cs, label) => `<div class="ref"><div class="reffig">${svg(cs, dim(cs))}</div>${label ? `<span>${label}</span>` : ''}</div>`;
  const figOpts = (correct, wrongs, size) =>
    shuffle([{ html: svg(correct, size), ok: true, cells: correct }, ...wrongs.map(w => ({ html: svg(w, size), cells: w }))]);
  const DEG = { 1: '90° horario ↻', 2: '180°', 3: '90° antihorario ↺' };
  // Describe cómo pasar de la original a la correcta (para la animación y la explicación)
  const anim = (cs, size, flip, k) => ({ origHtml: svg(cs, size), anim: { flip, deg: [0, 90, 180, -90][k] } });
  const describe = (flip, k) => {
    const parts = [];
    if (flip === 'x') parts.push('volteada en espejo ⇆');
    if (flip === 'y') parts.push('volteada de arriba a abajo ⇅');
    if (k) parts.push((flip ? 'y girada ' : 'girada ') + DEG[k]);
    return parts.join(' ');
  };

  // --- GIROS ---------------------------------------------------------------
  function giro(diff) {
    const o = gen(diff), size = dim(o), R = family(o);
    const t = rnd(3);
    if (t === 0) {
      // ¿Cuál es la misma figura girada?
      const k = 1 + rnd(3);
      const pool = shuffle([0, 1, 2, 3].map(j => rot(flipLR(o), j)));
      if (diff !== 'facil') pool.splice(1, 0, ...[0, 1, 2].map(() => variant(o)).filter(Boolean).map(v => rot(v, rnd(4))));
      const wr = pickDistinct(pool, R, 3);
      return {
        cat: 'giros', kind: 'fig',
        prompt: '¿Cuál es la <b>misma figura girada</b>?',
        figHtml: ref(o, 'Figura original'),
        options: figOpts(rot(o, k), wr, size),
        explain: `Es la original <b>girada ${DEG[k]}</b>. Las demás están volteadas (en espejo) o tienen alguna pieza cambiada de sitio.`,
        ...anim(o, size, null, k),
      };
    }
    if (t === 1) {
      // ¿Cómo queda tras girar X grados?
      const k = [1, 3, 2][rnd(diff === 'facil' ? 2 : 3)];
      const others = [1, 2, 3].filter(j => j !== k).map(j => rot(o, j));
      const pool = [...others, rot(flipLR(o), k), rot(flipLR(o), rnd(4))];
      const wr = pickDistinct(pool, [key(rot(o, k))], 3);
      return {
        cat: 'giros', kind: 'fig',
        prompt: `Si giramos la figura <b>${DEG[k]}</b>, ¿cómo queda?`,
        figHtml: ref(o, 'Figura original'),
        options: figOpts(rot(o, k), wr, size),
        explain: `Girar ${DEG[k]}: lo que estaba arriba pasa a ${k === 1 ? 'la derecha' : k === 3 ? 'la izquierda' : 'abajo'}.`,
        ...anim(o, size, null, k),
      };
    }
    // ¿Cuántos grados ha girado?
    const isFlip = Math.random() < .25;
    const k = 1 + rnd(3), j = rnd(4);
    const b = isFlip ? rot(flipLR(o), j) : rot(o, k);
    const labels = [DEG[1], DEG[2], DEG[3], 'Ninguno: está volteada'];
    const correctIdx = isFlip ? 3 : k - 1;
    return {
      cat: 'giros', kind: 'text',
      prompt: '¿Qué giro transforma la figura A en la B?',
      figHtml: `<div class="pair">${ref(o, 'A')}<div class="arrow">➜</div>${ref(b, 'B')}</div>`,
      options: labels.map((t, i) => ({ t, ok: i === correctIdx })),
      explain: isFlip ? `B es A <b>${describe('x', j)}</b>: por mucho que gires A, nunca coincide con B.` : `B es A <b>girada ${DEG[k]}</b>.`,
      ...(isFlip ? anim(o, size, 'x', j) : anim(o, size, null, k)),
    };
  }

  // --- VOLTEOS -------------------------------------------------------------
  function volteo(diff) {
    const o = gen(diff), size = dim(o);
    const M = family(flipLR(o));
    const t = rnd(3);
    if (t === 0) {
      // ¿Cuál es la figura volteada?
      const j = diff === 'facil' ? 0 : rnd(4);
      const correct = rot(flipLR(o), j);
      const pool = shuffle([0, 1, 2, 3].map(j => rot(o, j)));
      if (diff !== 'facil') pool.splice(1, 0, ...[0, 1].map(() => variant(flipLR(o))).filter(Boolean).map(v => rot(v, rnd(4))));
      const wr = pickDistinct(pool, M, 3);
      return {
        cat: 'volteos', kind: 'fig',
        prompt: '¿Cuál es la figura <b>volteada</b>? <small class="hint">(como si le dieras la vuelta a la ficha: queda en espejo, y puede estar además girada)</small>',
        figHtml: ref(o, 'Figura original'),
        options: figOpts(correct, wr, size),
        explain: `Es la original <b>${describe('x', j)}</b>. Las demás son la original solo girada: esas no están volteadas.`,
        ...anim(o, size, 'x', j),
      };
    }
    if (t === 1) {
      // Intrusa: tres giros y una volteada
      const ks = shuffle([0, 1, 2, 3]).slice(0, 3);
      return {
        cat: 'volteos', kind: 'fig',
        prompt: 'Tres son la misma figura girada. <b>¿Cuál está volteada?</b>',
        options: figOpts(rot(flipLR(o), rnd(4)), ks.map(k => rot(o, k)), size),
        explain: 'Gira mentalmente cada figura hasta que coincidan: tres encajan, pero la volteada queda como en un espejo y nunca encaja.',
      };
    }
    // Volteo respecto a un eje concreto
    const lr = Math.random() < .5;
    const correct = lr ? flipLR(o) : flipUD(o);
    const other = lr ? flipUD(o) : flipLR(o);
    const wr = pickDistinct([other, rot(o, 2), rot(o, 1), rot(o, 3)], [key(correct)], 3);
    return {
      cat: 'volteos', kind: 'fig',
      prompt: lr ? 'Le damos la vuelta a la figura de <b>izquierda a derecha</b> ⇆ <small class="hint">(como al mirarla en un espejo)</small>. ¿Cómo queda?'
                 : 'Le damos la vuelta a la figura de <b>arriba a abajo</b> ⇅ <small class="hint">(como su reflejo en el agua)</small>. ¿Cómo queda?',
      figHtml: ref(o, 'Figura original'),
      options: figOpts(correct, wr, size),
      explain: lr ? 'Lo que estaba a la izquierda pasa a la derecha; arriba y abajo no cambian.'
                  : 'Lo que estaba arriba pasa abajo; izquierda y derecha no cambian.',
      ...anim(o, size, lr ? 'x' : 'y', 0),
    };
  }

  return { giro, volteo, svg, _test: { gen, rot, flipLR, flipUD, family, key, isChiral } };
})();
if (typeof module !== 'undefined') module.exports = Fig;
