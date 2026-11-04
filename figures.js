// Generador de ejercicios de GIROS y VOLTEOS con figuras aleatorias.
// Tres tipos de figura: bloques planos, polígonos irregulares y piezas 3D de cubos.
const Fig = (() => {
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickW = w => { let r = Math.random() * w.reduce((s, [, p]) => s + p, 0); for (const [v, p] of w) { if ((r -= p) < 0) return v; } return w[0][0]; };
  const r2 = v => Math.round(v * 100) / 100 || 0;

  // ======================================================================
  // 1) BLOQUES (cuadrados unidos)
  // ======================================================================
  function norm(cs) {
    const mx = Math.min(...cs.map(c => c.x)), my = Math.min(...cs.map(c => c.y));
    return cs.map(c => ({ x: c.x - mx, y: c.y - my, m: c.m })).sort((a, b) => a.y - b.y || a.x - b.x);
  }
  const bKey = cs => norm(cs).map(c => c.x + ',' + c.y + (c.m ? '*' : '')).join(';');
  // Giro de 90º en sentido horario (eje Y hacia abajo, como en pantalla)
  const rot1 = cs => norm(cs.map(c => ({ x: -c.y, y: c.x, m: c.m })));
  const bRot = (cs, n) => { n = ((n % 4) + 4) % 4; let r = norm(cs); while (n--) r = rot1(r); return r; };
  const bFlipLR = cs => norm(cs.map(c => ({ x: -c.x, y: c.y, m: c.m })));
  const bFlipUD = cs => norm(cs.map(c => ({ x: c.x, y: -c.y, m: c.m })));
  const B_LEVEL = { facil: { n: 5, box: 3 }, media: { n: 6, box: 4 }, dificil: { n: 8, box: 4 }, examen: { n: 8, box: 4, nomark: true } };

  function connected2(cs) {
    const seen = new Set([0]), stack = [0];
    while (stack.length) {
      const a = cs[stack.pop()];
      cs.forEach((b, k) => { if (!seen.has(k) && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1) { seen.add(k); stack.push(k); } });
    }
    return seen.size === cs.length;
  }
  const Blocks = {
    name: 'bloques', steps: () => 4,
    gen(diff) {
      const { n, box, nomark } = B_LEVEL[diff] || B_LEVEL.media;
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
        if (chiral2(Blocks, cs, 4)) return cs;
      }
      throw new Error('No se pudo generar figura');
    },
    rot: bRot, flipLR: bFlipLR, flipUD: bFlipUD, key: bKey,
    // Distractor casi idéntico: la marca en otra celda o una pieza cambiada de sitio
    variant(cs) {
      const i = cs.findIndex(c => c.m);
      if (i >= 0) { let j = rnd(cs.length - 1); if (j >= i) j++; return norm(cs.map((c, k) => ({ ...c, m: k === j }))); }
      for (let t = 0; t < 200; t++) {
        const r = rnd(cs.length), rest = cs.filter((_, k) => k !== r);
        if (!connected2(rest)) continue;
        const c = rest[rnd(rest.length)], d = [[1, 0], [-1, 0], [0, 1], [0, -1]][rnd(4)];
        const x = c.x + d[0], y = c.y + d[1];
        if ((x === cs[r].x && y === cs[r].y) || rest.some(q => q.x === x && q.y === y)) continue;
        return norm([...rest, { x, y, m: false }]);
      }
      return null;
    },
    size: cs => Math.max(Math.max(...cs.map(c => c.x)), Math.max(...cs.map(c => c.y))) + 1,
    svg(cs, size) {
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
    },
  };

  // ======================================================================
  // 2) POLÍGONOS IRREGULARES (con un punto y una raya como detalle)
  // ======================================================================
  const P_LEVEL = { facil: 6, media: 7, dificil: 8, examen: 9 };
  const pMap = (s, f) => ({ pts: s.pts.map(f), dot: f(s.dot), line: s.line.map(f) });
  const Poly = {
    name: 'poligono',
    // En los niveles altos los giros van de 45 en 45 grados
    steps: diff => (diff === 'dificil' || diff === 'examen') ? 8 : 4,
    gen(diff) {
      const n = P_LEVEL[diff] || 7;
      for (let t = 0; t < 500; t++) {
        // Ángulos aleatorios con huecos razonables (polígono estrellado alrededor del centro)
        const off = Math.random() * 2 * Math.PI, step = 2 * Math.PI / n;
        const ang = Array.from({ length: n }, (_, i) => off + i * step + (Math.random() - .5) * step * .7);
        const rad = ang.map(() => 0.42 + Math.random() * 0.58);
        const pts = ang.map((a, i) => [rad[i] * Math.cos(a), rad[i] * Math.sin(a)]);
        const i = rnd(n), j = (i + 2 + rnd(n - 3)) % n;
        const dot = [pts[i][0] * 0.55, pts[i][1] * 0.55];
        const line = [[pts[j][0] * 0.15, pts[j][1] * 0.15], [pts[j][0] * 0.62, pts[j][1] * 0.62]];
        const s = { pts, dot, line };
        if (chiral2(Poly, s, Poly.steps(diff))) return s;
      }
      throw new Error('No se pudo generar polígono');
    },
    rot(s, k, steps = 4) {
      const a = k * 2 * Math.PI / steps, c = Math.cos(a), sn = Math.sin(a);
      return pMap(s, ([x, y]) => [x * c - y * sn, x * sn + y * c]); // positivo = horario en pantalla
    },
    flipLR: s => pMap(s, ([x, y]) => [-x, y]),
    flipUD: s => pMap(s, ([x, y]) => [x, -y]),
    key: s => [...s.pts, s.dot, ...s.line].map(([x, y]) => r2(x) + ',' + r2(y)).join(';'),
    variant(s) {
      if (Math.random() < .5) {
        // Mueve el punto junto a otro vértice
        const i = rnd(s.pts.length);
        return { ...s, dot: [s.pts[i][0] * 0.55, s.pts[i][1] * 0.55] };
      }
      // Estira o encoge un vértice
      const i = rnd(s.pts.length), [x, y] = s.pts[i], r = Math.hypot(x, y);
      const f = (r > 0.7 ? r - 0.32 : r + 0.32) / r;
      return { ...s, pts: s.pts.map((p, k) => k === i ? [x * f, y * f] : p) };
    },
    size: () => 0,
    svg(s) {
      const p = s.pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ');
      return `<svg viewBox="-1.12 -1.12 2.24 2.24" class="figsvg" aria-hidden="true">` +
        `<polygon points="${p}" class="pg"/>` +
        `<line x1="${r2(s.line[0][0])}" y1="${r2(s.line[0][1])}" x2="${r2(s.line[1][0])}" y2="${r2(s.line[1][1])}" class="pl"/>` +
        `<circle cx="${r2(s.dot[0])}" cy="${r2(s.dot[1])}" r=".11" class="pd"/></svg>`;
    },
  };

  // Comprueba que la figura no tiene simetrías: ningún giro la deja igual y su espejo no coincide con ningún giro
  function chiral2(K, s, steps) {
    const R = [...Array(steps).keys()].map(k => K.key(K.rot(s, k, steps)));
    if (new Set(R).size < steps) return false;
    const M = [...Array(steps).keys()].map(k => K.key(K.rot(K.flipLR(s), k, steps)));
    return !M.some(k => R.includes(k));
  }

  // ======================================================================
  // 3) PIEZAS 3D (cubos unidos, en perspectiva isométrica)
  // ======================================================================
  const ROTS = (() => {
    const mul = (A, B) => A.map(r => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
    const RX = [[1, 0, 0], [0, 0, -1], [0, 1, 0]], RY = [[0, 0, 1], [0, 1, 0], [-1, 0, 0]];
    const seen = new Map(), q = [[[1, 0, 0], [0, 1, 0], [0, 0, 1]]];
    while (q.length) { const m = q.pop(), k = JSON.stringify(m); if (seen.has(k)) continue; seen.set(k, m); q.push(mul(RX, m), mul(RY, m)); }
    return [...seen.values()]; // las 24 orientaciones de un cubo
  })();
  const apply = (m, c) => [0, 1, 2].map(i => m[i][0] * c[0] + m[i][1] * c[1] + m[i][2] * c[2]);
  const cNorm = cs => { const mn = [0, 1, 2].map(i => Math.min(...cs.map(c => c[i]))); return cs.map(c => c.map((v, i) => v - mn[i])).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]); };
  const cKey = cs => cNorm(cs).map(c => c.join(',')).join(';');
  const cRot = (cs, m) => cNorm(cs.map(c => apply(m, c)));
  const cMirror = cs => cNorm(cs.map(([x, y, z]) => [-x, y, z]));
  const canon = cs => ROTS.map(m => cKey(cRot(cs, m))).sort()[0];
  const connected3 = cs => {
    const seen = new Set([0]), st = [0];
    while (st.length) { const a = cs[st.pop()]; cs.forEach((b, k) => { if (!seen.has(k) && Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) === 1) { seen.add(k); st.push(k); } }); }
    return seen.size === cs.length;
  };
  const C30 = Math.cos(Math.PI / 6);
  const proj = (x, y, z) => [(x - y) * C30, (x + y) * 0.5 - z];
  const faces = ([x, y, z]) => [
    ['f1', [proj(x, y, z + 1), proj(x + 1, y, z + 1), proj(x + 1, y + 1, z + 1), proj(x, y + 1, z + 1)]], // arriba
    ['f2', [proj(x + 1, y, z), proj(x + 1, y + 1, z), proj(x + 1, y + 1, z + 1), proj(x + 1, y, z + 1)]], // derecha
    ['f3', [proj(x, y + 1, z), proj(x + 1, y + 1, z), proj(x + 1, y + 1, z + 1), proj(x, y + 1, z + 1)]], // izquierda
  ];
  const inPoly = ([px, py], pts) => {
    let ins = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  };
  const depth = c => c[0] + c[1] + c[2];
  // Comprueba que en el dibujo se ve una parte suficiente de cada cubo (si no, la pieza sería ambigua)
  const LONE = (() => { let n = 0; for (let x = -1; x <= 1; x += .13) for (let y = -1.2; y <= 1.2; y += .13) if (faces([0, 0, 0]).some(f => inPoly([x, y], f[1]))) n++; return n; })();
  function visible(cs) {
    const sorted = [...cs].sort((a, b) => depth(a) - depth(b));
    const fs = sorted.map(faces);
    const all = fs.flat().flatMap(f => f[1]);
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const cnt = new Array(cs.length).fill(0);
    for (let x = Math.min(...xs); x <= Math.max(...xs); x += .13)
      for (let y = Math.min(...ys); y <= Math.max(...ys); y += .13) {
        for (let i = sorted.length - 1; i >= 0; i--) if (fs[i].some(f => inPoly([x, y], f[1]))) { cnt[i]++; break; }
      }
    return cnt.every(c => c >= LONE * 0.28);
  }
  const C_LEVEL = { facil: 4, media: 5, dificil: 6, examen: 6 };
  const Cubes = {
    name: 'cubos',
    gen(diff) {
      const n = C_LEVEL[diff] || 5;
      for (let t = 0; t < 3000; t++) {
        const cs = [[0, 0, 0]];
        let guard = 0;
        while (cs.length < n && guard++ < 200) {
          const c = cs[rnd(cs.length)], d = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]][rnd(6)];
          const p = c.map((v, i) => v + d[i]);
          if (cs.some(q => q.every((v, i) => v === p[i]))) continue;
          const span = i => Math.max(...cs.map(q => q[i]), p[i]) - Math.min(...cs.map(q => q[i]), p[i]);
          if ([0, 1, 2].some(i => span(i) > 2)) continue;
          cs.push(p);
        }
        if (cs.length < n) continue;
        const N = cNorm(cs);
        if ([0, 1, 2].some(i => Math.max(...N.map(q => q[i])) === 0)) continue; // que no sea plana
        if (canon(cMirror(N)) === canon(N)) continue; // que su espejo sea distinto
        return N;
      }
      throw new Error('No se pudo generar pieza 3D');
    },
    // Una orientación aleatoria en la que se vean bien todos los cubos
    orient(cs, avoid = []) {
      for (const m of shuffle(ROTS)) {
        const r = cRot(cs, m);
        if (!avoid.includes(cKey(r)) && visible(r)) return r;
      }
      return null;
    },
    variant(cs) {
      for (let t = 0; t < 200; t++) {
        const i = rnd(cs.length), rest = cs.filter((_, k) => k !== i);
        if (!connected3(rest)) continue;
        const c = rest[rnd(rest.length)], d = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]][rnd(6)];
        const p = c.map((v, k) => v + d[k]);
        if (cs.some(q => q.every((v, k) => v === p[k]))) continue;
        const v = cNorm([...rest, p]);
        if (canon(v) !== canon(cs) && canon(v) !== canon(cMirror(cs))) return v;
      }
      return null;
    },
    // Tamaño que ocupa el dibujo (para usar la misma escala en todas las opciones)
    extent(cs) {
      const all = cs.flatMap(faces).flatMap(f => f[1]);
      const w = Math.max(...all.map(p => p[0])) - Math.min(...all.map(p => p[0]));
      const h = Math.max(...all.map(p => p[1])) - Math.min(...all.map(p => p[1]));
      return Math.max(w, h);
    },
    svg(cs, S = 5.6) {
      const sorted = [...cs].sort((a, b) => depth(a) - depth(b));
      const fs = sorted.flatMap(faces);
      const all = fs.flatMap(f => f[1]);
      const cx = (Math.min(...all.map(p => p[0])) + Math.max(...all.map(p => p[0]))) / 2;
      const cy = (Math.min(...all.map(p => p[1])) + Math.max(...all.map(p => p[1]))) / 2;
      let s = `<svg viewBox="${r2(cx - S / 2)} ${r2(cy - S / 2)} ${S} ${S}" class="figsvg" aria-hidden="true">`;
      for (const [cls, pts] of fs) s += `<polygon points="${pts.map(([x, y]) => r2(x) + ',' + r2(y)).join(' ')}" class="${cls}"/>`;
      return s + '</svg>';
    },
    key: cKey, canon, mirror: cMirror,
  };

  // ======================================================================
  // Utilidades comunes de las preguntas 2D
  // ======================================================================
  // Aplica a la figura un volteo ('x' izquierda-derecha, 'y' arriba-abajo) y después k pasos de giro
  const T = (K, s, flip, k, steps) => {
    let r = flip === 'x' ? K.flipLR(s) : flip === 'y' ? K.flipUD(s) : s;
    return K.rot(r, k, steps);
  };
  const angle = (k, steps) => { const d = k * 360 / steps; return d > 180 ? d - 360 : d; };
  const degText = d => d === 180 || d === -180 ? '180°' : d > 0 ? `${d}° horario ↻` : `${-d}° antihorario ↺`;
  const describe = (flip, d) => {
    const parts = [];
    if (flip === 'x') parts.push('volteada en espejo ⇆');
    if (flip === 'y') parts.push('volteada de arriba a abajo ⇅');
    if (d) parts.push((flip ? 'y girada ' : 'girada ') + degText(d));
    return parts.join(' ');
  };
  function pickDistinct(K, pool, exclude, n) {
    const used = new Set(exclude), out = [];
    for (const s of pool) {
      if (!s) continue;
      const k = K.key(s);
      if (used.has(k)) continue;
      used.add(k); out.push(s);
      if (out.length === n) break;
    }
    return out;
  }
  const ref = (html, label) => `<div class="ref"><div class="reffig">${html}</div>${label ? `<span>${label}</span>` : ''}</div>`;
  const opts = (draw, correct, wrongs, K) =>
    shuffle([{ html: draw(correct), ok: true, shape: correct }, ...wrongs.map(w => ({ html: draw(w), shape: w }))]);

  function giro2D(K, diff) {
    const o = K.gen(diff), steps = K.steps(diff), size = K.size(o);
    const draw = s => K.svg(s, size);
    const R = [...Array(steps).keys()].map(k => K.key(K.rot(o, k, steps)));
    const anim = (flip, k) => ({ origHtml: draw(o), anim: { flip, deg: angle(k, steps) } });
    const t = steps === 4 ? rnd(3) : rnd(2);
    if (t === 0) {
      const k = 1 + rnd(steps - 1);
      const pool = shuffle([...Array(steps).keys()].map(j => T(K, o, 'x', j, steps)));
      if (diff !== 'facil') pool.splice(1, 0, ...[0, 1, 2].map(() => K.variant(o)).filter(Boolean).map(v => K.rot(v, rnd(steps), steps)));
      const wr = pickDistinct(K, pool, R, 3);
      return {
        cat: 'giros', kind: 'fig',
        prompt: `¿Cuál es la <b>misma figura girada</b>?`,
        figHtml: ref(draw(o), 'Figura original'),
        options: opts(draw, K.rot(o, k, steps), wr, K),
        explain: `Es la original <b>girada ${degText(angle(k, steps))}</b>. Las demás están volteadas (en espejo) o tienen algún detalle cambiado.`,
        ...anim(null, k),
      };
    }
    if (t === 1) {
      const k = 1 + rnd(steps - 1), d = angle(k, steps);
      const pool = shuffle([...[...Array(steps).keys()].filter(j => j && j !== k).map(j => K.rot(o, j, steps)), T(K, o, 'x', k, steps), T(K, o, 'x', rnd(steps), steps)]);
      const wr = pickDistinct(K, pool, [K.key(K.rot(o, k, steps))], 3);
      return {
        cat: 'giros', kind: 'fig',
        prompt: `Si giramos la figura <b>${degText(d)}</b>, ¿cómo queda?`,
        figHtml: ref(draw(o), 'Figura original'),
        options: opts(draw, K.rot(o, k, steps), wr, K),
        explain: steps === 4
          ? `Girar ${degText(d)}: lo que estaba arriba pasa a ${d === 90 ? 'la derecha' : d === -90 ? 'la izquierda' : 'abajo'}.`
          : `Girar ${degText(d)}: sigue con la vista el punto y la raya mientras la figura da ${Math.abs(d) / 45} octavo${Math.abs(d) === 45 ? '' : 's'} de vuelta.`,
        ...anim(null, k),
      };
    }
    // ¿Qué giro transforma A en B? (solo con giros de 90°)
    const isFlip = Math.random() < .25;
    const k = 1 + rnd(3), j = rnd(4);
    const b = isFlip ? T(K, o, 'x', j, 4) : K.rot(o, k, 4);
    const labels = [degText(90), degText(180), degText(-90), 'Ninguno: está volteada'];
    const correctIdx = isFlip ? 3 : k - 1;
    return {
      cat: 'giros', kind: 'text',
      prompt: '¿Qué giro transforma la figura A en la B?',
      figHtml: `<div class="pair">${ref(draw(o), 'A')}<div class="arrow">➜</div>${ref(draw(b), 'B')}</div>`,
      options: labels.map((t, i) => ({ t, ok: i === correctIdx })),
      explain: isFlip ? `B es A <b>${describe('x', angle(j, 4))}</b>: por mucho que gires A, nunca coincide con B.` : `B es A <b>girada ${degText(angle(k, 4))}</b>.`,
      ...(isFlip ? anim('x', j) : anim(null, k)),
    };
  }

  function volteo2D(K, diff) {
    const o = K.gen(diff), steps = K.steps(diff), size = K.size(o);
    const draw = s => K.svg(s, size);
    const M = [...Array(steps).keys()].map(k => K.key(T(K, o, 'x', k, steps)));
    const anim = (flip, k) => ({ origHtml: draw(o), anim: { flip, deg: angle(k, steps) } });
    const t = rnd(3);
    if (t === 0) {
      const j = diff === 'facil' ? 0 : rnd(steps);
      const pool = shuffle([...Array(steps).keys()].map(i => K.rot(o, i, steps)));
      if (diff !== 'facil') pool.splice(1, 0, ...[0, 1].map(() => K.variant(K.flipLR(o))).filter(Boolean).map(v => K.rot(v, rnd(steps), steps)));
      const wr = pickDistinct(K, pool, M, 3);
      return {
        cat: 'volteos', kind: 'fig',
        prompt: '¿Cuál es la figura <b>volteada</b>? <small class="hint">(como si le dieras la vuelta a la ficha: queda en espejo, y puede estar además girada)</small>',
        figHtml: ref(draw(o), 'Figura original'),
        options: opts(draw, T(K, o, 'x', j, steps), wr, K),
        explain: `Es la original <b>${describe('x', angle(j, steps))}</b>. Las demás son la original solo girada (o con algún detalle cambiado).`,
        ...anim('x', j),
      };
    }
    if (t === 1) {
      const ks = shuffle([...Array(steps).keys()]).slice(0, 3);
      return {
        cat: 'volteos', kind: 'fig',
        prompt: 'Tres son la misma figura girada. <b>¿Cuál está volteada?</b>',
        options: opts(draw, T(K, o, 'x', rnd(steps), steps), ks.map(k => K.rot(o, k, steps)), K),
        explain: 'Gira mentalmente cada figura hasta que coincidan: tres encajan, pero la volteada queda como en un espejo y nunca encaja.',
      };
    }
    const lr = Math.random() < .5;
    const correct = T(K, o, lr ? 'x' : 'y', 0, steps), other = T(K, o, lr ? 'y' : 'x', 0, steps);
    const half = steps / 2;
    const wr = pickDistinct(K, [other, K.rot(o, half, steps), K.rot(o, 1, steps), K.rot(o, steps - 1, steps)], [K.key(correct)], 3);
    return {
      cat: 'volteos', kind: 'fig',
      prompt: lr ? 'Le damos la vuelta a la figura de <b>izquierda a derecha</b> ⇆ <small class="hint">(como al mirarla en un espejo)</small>. ¿Cómo queda?'
                 : 'Le damos la vuelta a la figura de <b>arriba a abajo</b> ⇅ <small class="hint">(como su reflejo en el agua)</small>. ¿Cómo queda?',
      figHtml: ref(draw(o), 'Figura original'),
      options: opts(draw, correct, wr, K),
      explain: lr ? 'Lo que estaba a la izquierda pasa a la derecha; arriba y abajo no cambian.'
                  : 'Lo que estaba arriba pasa abajo; izquierda y derecha no cambian.',
      ...anim(lr ? 'x' : 'y', 0),
    };
  }

  // ======================================================================
  // Preguntas 3D
  // ======================================================================
  function giro3D(diff) {
    for (let t = 0; t < 30; t++) {
      const o = Cubes.gen(diff);
      const shown = Cubes.orient(o);
      if (!shown) continue;
      const correct = Cubes.orient(o, [cKey(shown)]);
      const m = Cubes.mirror(o);
      const pool = [Cubes.orient(m), Cubes.orient(m)];
      if (diff !== 'facil') { const v = Cubes.variant(o); if (v) pool.splice(1, 0, Cubes.orient(v)); }
      pool.push(Cubes.orient(m), Cubes.orient(m));
      const wr = pickDistinct(Cubes, pool, [cKey(correct || [])], 3);
      if (!correct || wr.length < 3) continue;
      const S = Math.max(...[shown, correct, ...wr].map(Cubes.extent)) + .35;
      const draw = c => Cubes.svg(c, S);
      return {
        cat: 'giros', kind: 'fig', fig3d: true, _canon: canon(o),
        prompt: '¿Cuál es la <b>misma pieza</b> vista desde otra posición? <small class="hint">(está girada en el espacio)</small>',
        figHtml: ref(draw(shown), 'Pieza original'),
        options: opts(draw, correct, wr, Cubes),
        explain: 'Es la misma pieza girada en el espacio. Las demás son su imagen en espejo o tienen un cubo cambiado de sitio. Truco: fíjate en hacia dónde apuntan los dos extremos de la pieza respecto al codo.',
      };
    }
    return giro2D(Blocks, diff);
  }

  function volteo3D(diff) {
    for (let t = 0; t < 30; t++) {
      const o = Cubes.gen(diff);
      const a = Cubes.orient(o); if (!a) continue;
      const b = Cubes.orient(o, [cKey(a)]); if (!b) continue;
      const c = Cubes.orient(o, [cKey(a), cKey(b)]); if (!c) continue;
      const m = Cubes.orient(Cubes.mirror(o)); if (!m) continue;
      const S = Math.max(...[a, b, c, m].map(Cubes.extent)) + .35;
      return {
        cat: 'volteos', kind: 'fig', fig3d: true, _canon: canon(o),
        prompt: 'Tres son la misma pieza girada. <b>¿Cuál es su imagen en espejo?</b>',
        options: opts(x => Cubes.svg(x, S), m, [a, b, c], Cubes),
        explain: 'La pieza en espejo es como la mano izquierda frente a la derecha: por mucho que la gires, nunca coincide con las otras tres.',
      };
    }
    return volteo2D(Blocks, diff);
  }

  // Mezcla de tipos de figura según la dificultad
  const MIX = {
    facil: [['bloques', 6], ['poligono', 4], ['cubos', 0]],
    media: [['bloques', 4], ['poligono', 3.5], ['cubos', 2.5]],
    dificil: [['bloques', 3], ['poligono', 3.5], ['cubos', 3.5]],
    examen: [['bloques', 3], ['poligono', 3.5], ['cubos', 3.5]],
  };
  function giro(diff, tipo) {
    const t = tipo || pickW(MIX[diff] || MIX.media);
    return t === 'cubos' ? giro3D(diff) : giro2D(t === 'poligono' ? Poly : Blocks, diff);
  }
  function volteo(diff, tipo) {
    const t = tipo || pickW(MIX[diff] || MIX.media);
    return t === 'cubos' ? volteo3D(diff) : volteo2D(t === 'poligono' ? Poly : Blocks, diff);
  }

  return { giro, volteo, _test: { Blocks, Poly, Cubes, T, ROTS, visible, canon, cKey } };
})();
if (typeof module !== 'undefined') module.exports = Fig;
