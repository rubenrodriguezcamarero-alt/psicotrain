// Más ejercicios de RAZONAMIENTO ESPACIAL:
// cubos desplegados, contar cubos, vistas, papel plegado y encajar piezas.
// Usa algunas utilidades de figures.js (bloques y rotaciones 3D).
const Spatial = (() => {
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const r2 = v => Math.round(v * 100) / 100 || 0;
  const { Blocks: B, Cubes, ROTS } = Fig._test;
  const ref = (html, label, cls = '') => `<div class="ref"><div class="reffig ${cls}">${html}</div>${label ? `<span>${label}</span>` : ''}</div>`;
  const level = d => ({ facil: 0, media: 1, dificil: 2, examen: 3 }[d] ?? 1);

  // ---------- Dibujo isométrico de cubos ----------
  const C30 = Math.cos(Math.PI / 6);
  const proj = (x, y, z) => [(x - y) * C30, (x + y) * 0.5 - z];
  const faces = ([x, y, z]) => [
    ['f1', [proj(x, y, z + 1), proj(x + 1, y, z + 1), proj(x + 1, y + 1, z + 1), proj(x, y + 1, z + 1)]],
    ['f2', [proj(x + 1, y, z), proj(x + 1, y + 1, z), proj(x + 1, y + 1, z + 1), proj(x + 1, y, z + 1)]],
    ['f3', [proj(x, y + 1, z), proj(x + 1, y + 1, z), proj(x + 1, y + 1, z + 1), proj(x, y + 1, z + 1)]],
  ];
  const pts = p => p.map(([x, y]) => r2(x) + ',' + r2(y)).join(' ');
  function isoSvg(cubes, pad = .4, floor = null) {
    const fs = [...cubes].sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2])).flatMap(faces);
    // Suelo cuadriculado bajo la construcción (ayuda a ver dónde está cada columna)
    let fl = '';
    if (floor) {
      const [W, D] = floor;
      fl = `<polygon points="${pts([proj(0, 0, 0), proj(W, 0, 0), proj(W, D, 0), proj(0, D, 0)])}" class="fl"/>`;
      for (let x = 1; x < W; x++) fl += `<line x1="${r2(proj(x, 0, 0)[0])}" y1="${r2(proj(x, 0, 0)[1])}" x2="${r2(proj(x, D, 0)[0])}" y2="${r2(proj(x, D, 0)[1])}" class="fll"/>`;
      for (let y = 1; y < D; y++) fl += `<line x1="${r2(proj(0, y, 0)[0])}" y1="${r2(proj(0, y, 0)[1])}" x2="${r2(proj(W, y, 0)[0])}" y2="${r2(proj(W, y, 0)[1])}" class="fll"/>`;
    }
    const all = fs.flatMap(f => f[1]);
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const S = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) + pad;
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    return `<svg viewBox="${r2(cx - S / 2)} ${r2(cy - S / 2)} ${r2(S)} ${r2(S)}" class="figsvg" aria-hidden="true">` +
      fl + fs.map(([c, p]) => `<polygon points="${pts(p)}" class="${c}"/>`).join('') + '</svg>';
  }
  // Cuadrícula plana de celdas [x, y]
  function gridSvg(cells, cls = 'cc', size) {
    const w = Math.max(...cells.map(c => c[0])) + 1, h = Math.max(...cells.map(c => c[1])) + 1;
    const n = (size || Math.max(w, h)) + .5, ox = (n - w) / 2, oy = (n - h) / 2;
    return `<svg viewBox="0 0 ${n} ${n}" class="figsvg" aria-hidden="true">` +
      cells.map(([x, y]) => `<rect x="${r2(x + ox + .05)}" y="${r2(y + oy + .05)}" width=".9" height=".9" rx=".12" class="${cls}"/>`).join('') + '</svg>';
  }

  // =====================================================================
  // 1) CUBOS DESPLEGADOS
  // =====================================================================
  // Los 11 desarrollos posibles de un cubo
  const NETS = [
    [[0, 1], [1, 1], [2, 1], [3, 1], [0, 0], [0, 2]],
    [[0, 1], [1, 1], [2, 1], [3, 1], [0, 0], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [3, 1], [0, 0], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [3, 1], [0, 0], [3, 2]],
    [[0, 1], [1, 1], [2, 1], [3, 1], [1, 0], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [3, 1], [1, 0], [2, 2]],
    [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [1, 2]],
    [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [2, 2]],
    [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 2]],
    [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]],
    [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1]],
  ];
  // Símbolos simétricos (se ven igual aunque la cara gire)
  const SYM = [
    '<circle cx=".5" cy=".5" r=".2" class="sy"/>',
    '<circle cx=".5" cy=".5" r=".22" class="sy-o"/>',
    '<path d="M.5 .2V.8M.2 .5H.8" class="sy-l"/>',
    '<path d="M.27 .27L.73 .73M.73 .27L.27 .73" class="sy-l"/>',
    '<rect x=".3" y=".3" width=".4" height=".4" class="sy"/>',
    '<path d="M.5 .2L.8 .5L.5 .8L.2 .5Z" class="sy-o"/>',
  ];
  const SYM_NAME = ['el punto', 'el círculo', 'la cruz', 'el aspa', 'el cuadrado', 'el rombo'];
  const neg = a => a.map(v => -v);
  // Pliega el desarrollo: devuelve hacia dónde mira cada cara en el cubo montado
  function fold(net) {
    const fr = new Map([[0, { n: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0] }]]), q = [0];
    while (q.length) {
      const i = q.shift(), f = fr.get(i), [x, y] = net[i];
      net.forEach(([a, b], j) => {
        if (fr.has(j)) return;
        const dx = a - x, dy = b - y;
        if (Math.abs(dx) + Math.abs(dy) !== 1) return;
        const g = dx === 1 ? { n: f.u, u: neg(f.n), v: f.v } : dx === -1 ? { n: neg(f.u), u: f.n, v: f.v }
          : dy === 1 ? { n: f.v, u: f.u, v: neg(f.n) } : { n: neg(f.v), u: f.u, v: f.n };
        fr.set(j, g); q.push(j);
      });
    }
    return net.map((_, i) => fr.get(i).n);
  }
  const apply = (m, c) => [0, 1, 2].map(i => m[i][0] * c[0] + m[i][1] * c[1] + m[i][2] * c[2]);
  const eq = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  // Todas las vistas posibles del cubo montado: [arriba, derecha, izquierda]
  function views(normals, sym) {
    const set = new Set();
    for (const m of ROTS) {
      const r = normals.map(n => apply(m, n));
      const f = d => sym[r.findIndex(n => eq(n, d))];
      set.add([f([0, 0, 1]), f([1, 0, 0]), f([0, 1, 0])].join(','));
    }
    return set;
  }
  // Transformación que lleva el cuadrado unidad a cada cara visible del cubo dibujado
  const faceMatrix = (o, u, v) => `matrix(${r2(u[0] - o[0])} ${r2(u[1] - o[1])} ${r2(v[0] - o[0])} ${r2(v[1] - o[1])} ${r2(o[0])} ${r2(o[1])})`;
  const FACES = [
    ['d1', proj(0, 0, 1), proj(1, 0, 1), proj(0, 1, 1)],
    ['d2', proj(1, 0, 0), proj(1, 1, 0), proj(1, 0, 1)],
    ['d3', proj(0, 1, 0), proj(1, 1, 0), proj(0, 1, 1)],
  ];
  function cubeSvg([t, r, l]) {
    let s = `<svg viewBox="-1.25 -1.25 2.5 2.5" class="figsvg" aria-hidden="true"><g transform="translate(0 0)">`;
    [t, r, l].forEach((sym, i) => {
      const [cls, o, u, v] = FACES[i];
      s += `<g transform="${faceMatrix(o, u, v)}"><rect width="1" height="1" class="${cls}"/>${SYM[sym]}</g>`;
    });
    return s + '</g></svg>';
  }
  function netSvg(net, sym) {
    const w = Math.max(...net.map(c => c[0])) + 1, h = Math.max(...net.map(c => c[1])) + 1;
    const n = Math.max(w, h) + .4, ox = (n - w) / 2, oy = (n - h) / 2;
    return `<svg viewBox="0 0 ${r2(n)} ${r2(n)}" class="figsvg" aria-hidden="true">` +
      net.map(([x, y], i) => `<g transform="translate(${r2(x + ox)} ${r2(y + oy)})"><rect width="1" height="1" class="d1 nc"/>${SYM[sym[i]]}</g>`).join('') + '</svg>';
  }
  const symSvg = s => `<svg viewBox="-.1 -.1 1.2 1.2" class="figsvg" aria-hidden="true"><rect width="1" height="1" class="d1 nc"/>${SYM[s]}</svg>`;
  // Gira o voltea el desarrollo para que no salga siempre en la misma posición
  function randomNet() {
    let net = NETS[rnd(NETS.length)].map(c => ({ x: c[0], y: c[1] }));
    net = B.rot(net, rnd(4));
    if (rnd(2)) net = B.flipLR(net);
    return shuffle(net.map(c => [c.x, c.y]));
  }

  function desarrollos(diff) {
    for (let t = 0; t < 50; t++) {
      const net = randomNet(), normals = fold(net);
      const sym = shuffle([0, 1, 2, 3, 4, 5]);
      const valid = views(normals, sym);
      const opp = i => sym[normals.findIndex(n => eq(n, neg(normals[sym.indexOf(i)])))];
      // Vistas imposibles: orden al revés (espejo) o dos caras opuestas juntas
      const impossible = () => {
        const v = [...valid][rnd(valid.size)].split(',').map(Number);
        const c = rnd(2) ? [v[0], v[2], v[1]] : (() => { const k = rnd(3), w = [...v]; w[(k + 1) % 3] = opp(w[k]); return w; })();
        return c.join(',');
      };
      const tipo = rnd(3);
      const netHtml = ref(netSvg(net, sym), 'Desarrollo', 'big');
      if (tipo === 0) {
        const ok = [...valid][rnd(valid.size)];
        const wr = new Set();
        for (let k = 0; k < 60 && wr.size < 3; k++) { const c = impossible(); if (!valid.has(c) && c !== ok) wr.add(c); }
        if (wr.size < 3) continue;
        return {
          cat: 'desarrollos', kind: 'fig',
          prompt: '¿Qué cubo se puede formar con este <b>desarrollo</b>?',
          figHtml: netHtml,
          options: shuffle([{ html: cubeSvg(ok.split(',').map(Number)), ok: true, view: ok }, ...[...wr].map(w => ({ html: cubeSvg(w.split(',').map(Number)), view: w }))]),
          explain: 'Al montar el cubo, las caras opuestas nunca se ven a la vez y el orden alrededor de cada esquina no se puede invertir. Truco: en una fila de tres caras, la primera y la tercera quedan opuestas.',
          _valid: [...valid],
        };
      }
      if (tipo === 1) {
        const oks = shuffle([...valid]).slice(0, 3);
        let bad = null;
        for (let k = 0; k < 60 && !bad; k++) { const c = impossible(); if (!valid.has(c)) bad = c; }
        if (!bad) continue;
        return {
          cat: 'desarrollos', kind: 'fig',
          prompt: '¿Qué cubo <b>NO</b> se puede formar con este desarrollo?',
          figHtml: netHtml,
          options: shuffle([{ html: cubeSvg(bad.split(',').map(Number)), ok: true, view: bad }, ...oks.map(w => ({ html: cubeSvg(w.split(',').map(Number)), view: w }))]),
          explain: 'Ese cubo junta dos caras que en realidad quedan opuestas, o las coloca en el orden contrario. Las otras tres sí salen al montar el desarrollo.',
          _valid: [...valid],
        };
      }
      const f = sym[rnd(6)], o = opp(f);
      const others = shuffle(sym.filter(s => s !== f && s !== o)).slice(0, 3);
      return {
        cat: 'desarrollos', kind: 'fig',
        prompt: `Al montar el cubo, ¿qué cara queda <b>opuesta</b> a esta? ${'<span class="inl">' + symSvg(f) + '</span>'}`,
        figHtml: netHtml,
        options: shuffle([{ html: symSvg(o), ok: true, sym: o }, ...others.map(s => ({ html: symSvg(s), sym: s }))]),
        explain: `Queda opuesta a ${SYM_NAME[f]}: ${SYM_NAME[o]}. En el desarrollo, dos caras son opuestas si están en la misma fila o columna con una cara entre ellas.`,
        _opp: [f, o],
      };
    }
    throw new Error('No se pudo generar desarrollo');
  }

  // =====================================================================
  // 2) CONTAR CUBOS
  // =====================================================================
  function stack(diff) {
    const L = level(diff), W = [3, 3, 4, 4][L], D = [3, 3, 3, 4][L], H = [3, 3, 4, 4][L];
    for (let t = 0; t < 200; t++) {
      // Alturas que bajan hacia el frente: así se ve la parte de arriba de todas las columnas
      const h = Array.from({ length: W }, () => new Array(D).fill(0));
      for (let x = 0; x < W; x++) for (let y = 0; y < D; y++) {
        const lim = Math.min(x ? h[x - 1][y] : H, y ? h[x][y - 1] : H);
        h[x][y] = x === 0 && y === 0 ? H - rnd(2) : 1 + rnd(lim); // todas las columnas tienen al menos un cubo
      }
      const total = h.flat().reduce((a, b) => a + b, 0);
      if (total < 6 + L * 3) continue;
      const cubes = [];
      h.forEach((col, x) => col.forEach((v, y) => { for (let z = 0; z < v; z++) cubes.push([x, y, z]); }));
      return { h, cubes, total, W, D, H: Math.max(...h.flat()) };
    }
  }
  function contar(diff) {
    const s = stack(diff);
    const faltan = level(diff) >= 2 && rnd(2);
    const ans = faltan ? s.W * s.D * s.H - s.total : s.total;
    const ds = shuffle([-3, -2, -1, 1, 2, 3]).map(d => ans + d).filter(v => v > 0).slice(0, 3);
    return {
      cat: 'contar', kind: 'text',
      prompt: faltan
        ? `¿Cuántos cubos <b>faltan</b> para completar un bloque de ${s.W}×${s.D}×${s.H}? <small class="hint">(los cubos que no se ven por detrás también están, sosteniendo a los de arriba)</small>`
        : '¿Cuántos <b>cubos</b> hay en total? <small class="hint">(cuenta también los que no se ven y sostienen a los de arriba)</small>',
      figHtml: ref(isoSvg(s.cubes, .4, [s.W, s.D]), '', 'big'),
      options: shuffle([{ t: String(ans), ok: true }, ...ds.map(d => ({ t: String(d) }))]),
      explain: faltan
        ? `Hay ${s.total} cubos y el bloque completo tendría ${s.W}×${s.D}×${s.H} = ${s.W * s.D * s.H}, así que faltan <b>${ans}</b>.`
        : `Hay <b>${ans}</b> cubos. Truco: cuenta columna a columna mirando la altura de cada una (${s.h.flat().filter(v => v).join(' + ')}).`,
      _ans: ans,
    };
  }

  // =====================================================================
  // 3) VISTAS (planta de una pieza 3D)
  // =====================================================================
  const toCells = cs => cs.map(([x, y]) => ({ x, y, m: false }));
  const canon2 = cells => {
    const c = toCells(cells); const ks = [];
    for (let k = 0; k < 4; k++) { ks.push(B.key(B.rot(c, k))); ks.push(B.key(B.rot(B.flipLR(c), k))); }
    return ks.sort()[0];
  };
  const uniq = cs => [...new Map(cs.map(c => [c.join(','), c])).values()];
  const planta = cs => uniq(cs.map(([x, y]) => [x, y]));
  const alzado = cs => uniq(cs.map(([x, , z]) => [x, z]));
  const perfil = cs => uniq(cs.map(([, y, z]) => [y, z]));
  function vistas(diff) {
    for (let t = 0; t < 60; t++) {
      const o = Cubes.gen(diff === 'facil' ? 'media' : diff);
      const shown = Cubes.orient(o);
      if (!shown) continue;
      const top = planta(shown), ck = canon2(top);
      const pool = [alzado(shown), perfil(shown)];
      for (let k = 0; k < 8; k++) { const v = Cubes.variant(shown); if (v) pool.push(planta(v)); }
      // También la planta con una celda de más
      const extra = [...top]; const c = extra[rnd(extra.length)], d = [[1, 0], [-1, 0], [0, 1], [0, -1]][rnd(4)];
      pool.push([...top, [c[0] + d[0], c[1] + d[1]]].map(([x, y]) => [x + 1, y + 1]));
      const seen = new Set([ck]), wr = [];
      for (const p of shuffle(pool)) {
        if (Math.min(...p.flat()) < 0) continue;
        const k = canon2(p); if (seen.has(k)) continue;
        seen.add(k); wr.push(p); if (wr.length === 3) break;
      }
      if (wr.length < 3) continue;
      const norm2 = p => { const mx = Math.min(...p.map(c => c[0])), my = Math.min(...p.map(c => c[1])); return p.map(([x, y]) => [x - mx, y - my]); };
      const all = [top, ...wr].map(norm2);
      const size = Math.max(...all.flat(2)) + 1;
      return {
        cat: 'vistas', kind: 'fig',
        prompt: '¿Cuál es la <b>vista desde arriba</b> (planta) de esta pieza? <small class="hint">(puede aparecer girada)</small>',
        figHtml: ref(isoSvg(shown), 'Pieza', 'big'),
        options: shuffle(all.map((p, i) => ({ html: gridSvg(p, 'cc', size), ok: i === 0, canon: canon2(p) }))),
        explain: 'Imagina que miras la pieza desde el techo: solo ves la «sombra» de cada columna de cubos, sin importar su altura. Las otras opciones son la vista de frente, la de lado o tienen un cuadrado de más o de menos.',
        _canon: ck,
      };
    }
    throw new Error('No se pudo generar vista');
  }

  // =====================================================================
  // 4) PAPEL PLEGADO Y PERFORADO
  // =====================================================================
  const N = 4;
  // Cada pliegue: qué mitad queda quieta y cómo se refleja una celda al desdoblar
  const FOLDS = {
    L: { keep: (x, y) => x >= 2, refl: (x, y) => [N - 1 - x, y], line: [[2, 0], [2, 4]], arrow: [[.8, 2], [3.2, 2]] },
    R: { keep: (x, y) => x <= 1, refl: (x, y) => [N - 1 - x, y], line: [[2, 0], [2, 4]], arrow: [[3.2, 2], [.8, 2]] },
    T: { keep: (x, y) => y >= 2, refl: (x, y) => [x, N - 1 - y], line: [[0, 2], [4, 2]], arrow: [[2, .8], [2, 3.2]] },
    U: { keep: (x, y) => y <= 1, refl: (x, y) => [x, N - 1 - y], line: [[0, 2], [4, 2]], arrow: [[2, 3.2], [2, .8]] },
    D: { keep: (x, y) => x > y, refl: (x, y) => [y, x], line: [[0, 0], [4, 4]], arrow: [[1, 3], [3, 1]], diag: true },
  };
  const k2 = c => c.join(',');
  function paperSvg(region, folds, holes = [], fold = null) {
    const keep = (x, y) => folds.every(f => FOLDS[f].keep(x, y));
    let s = `<svg viewBox="-.3 -.3 4.6 4.6" class="figsvg" aria-hidden="true">`;
    s += `<rect x="0" y="0" width="4" height="4" class="pgh"/>`;
    if (folds.includes('D')) {
      // Papel doblado por la diagonal: triángulo de arriba a la derecha
      const others = folds.filter(f => f !== 'D');
      if (!others.length) s += `<polygon points="0,0 4,0 4,4" class="pp"/>`;
    }
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) {
      if (folds.includes('D')) continue;
      if (keep(x, y)) s += `<rect x="${x}" y="${y}" width="1.02" height="1.02" class="pp"/>`;
    }
    if (fold) {
      const F = FOLDS[fold];
      s += `<line x1="${F.line[0][0]}" y1="${F.line[0][1]}" x2="${F.line[1][0]}" y2="${F.line[1][1]}" class="pf"/>`;
      const [[ax, ay], [bx, by]] = F.arrow, ang = Math.atan2(by - ay, bx - ax);
      const hx = bx - .35 * Math.cos(ang), hy = by - .35 * Math.sin(ang);
      s += `<line x1="${ax}" y1="${ay}" x2="${r2(hx)}" y2="${r2(hy)}" class="pa"/>` +
        `<polygon points="${bx},${by} ${r2(hx - .22 * Math.sin(ang))},${r2(hy + .22 * Math.cos(ang))} ${r2(hx + .22 * Math.sin(ang))},${r2(hy - .22 * Math.cos(ang))}" class="pah"/>`;
    }
    s += holes.map(([x, y]) => `<circle cx="${x + .5}" cy="${y + .5}" r=".24" class="ph"/>`).join('');
    return s + '</svg>';
  }
  const fullSvg = holes => `<svg viewBox="-.3 -.3 4.6 4.6" class="figsvg" aria-hidden="true"><rect x="0" y="0" width="4" height="4" class="pp"/>` +
    holes.map(([x, y]) => `<circle cx="${x + .5}" cy="${y + .5}" r=".24" class="ph"/>`).join('') + '</svg>';
  const unfold = (holes, folds) => {
    let set = new Map(holes.map(h => [k2(h), h]));
    for (const f of [...folds].reverse()) for (const h of [...set.values()]) { const r = FOLDS[f].refl(...h); set.set(k2(r), r); }
    return [...set.values()];
  };
  function papel(diff) {
    const L = level(diff);
    for (let t = 0; t < 200; t++) {
      let folds;
      if (L === 0) folds = [rnd(2) ? 'L' : 'T'];
      else if (L >= 2 && rnd(3) === 0) folds = ['D'];
      else if (L === 1 && rnd(2)) folds = [['L', 'R', 'T', 'U'][rnd(4)]];
      else folds = [['L', 'R'][rnd(2)], ['T', 'U'][rnd(2)]];
      if (rnd(2) && folds.length === 2) folds.reverse();
      const keep = (x, y) => folds.every(f => FOLDS[f].keep(x, y));
      const region = [];
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if (keep(x, y)) region.push([x, y]);
      const nh = L >= 2 ? 1 + rnd(2) : 1;
      const holes = shuffle(region).slice(0, nh);
      const ok = unfold(holes, folds);
      const sig = s => s.map(k2).sort().join(';');
      const cands = [];
      cands.push(holes); // sin desdoblar
      if (folds.length === 2) cands.push(unfold(holes, [folds[1]]), unfold(holes, [folds[0]])); // desdoblando solo una vez
      const wrongAxis = { L: 'T', R: 'U', T: 'L', U: 'R', D: 'L' };
      cands.push(unfold(holes, folds.map(f => wrongAxis[f]))); // reflejo con el eje equivocado
      if (folds[0] === 'D') cands.push(unfold(holes, ['L']), unfold(holes, ['T']));
      if (ok.length > 1) { const m = shuffle(ok); cands.push(m.slice(1)); }
      const extra = [rnd(N), rnd(N)]; cands.push([...ok, extra]);
      const seen = new Set([sig(ok)]), wr = [];
      for (const c of cands) { const s = sig(c); if (seen.has(s) || !c.length) continue; seen.add(s); wr.push(c); if (wr.length === 3) break; }
      if (wr.length < 3) continue;
      // Pasos: papel con la línea de pliegue, papel doblado y perforado
      const steps = [];
      steps.push(paperSvg(null, [], [], folds[0]));
      if (folds.length === 2) steps.push(paperSvg(null, [folds[0]], [], folds[1]));
      steps.push(paperSvg(null, folds, holes));
      const figHtml = `<div class="steps">${steps.map((s, i) => `${i ? '<span class="arrow">➜</span>' : ''}<div class="ref"><div class="reffig sm">${s}</div><span>${i + 1}</span></div>`).join('')}</div>`;
      return {
        cat: 'papel', kind: 'fig',
        prompt: `Doblamos el papel ${folds.length === 2 ? 'dos veces' : 'una vez'} por la línea discontinua y lo perforamos. <b>¿Cómo queda al desdoblarlo?</b>`,
        figHtml,
        options: shuffle([{ html: fullSvg(ok), ok: true, sig: sig(ok) }, ...wr.map(w => ({ html: fullSvg(w), sig: sig(w) }))]),
        explain: `Cada agujero atraviesa todas las capas: al desdoblar, aparece reflejado al otro lado de cada pliegue. Por eso salen <b>${ok.length}</b> agujeros.`,
        _folds: folds, _holes: holes, _ok: sig(ok),
      };
    }
    throw new Error('No se pudo generar papel');
  }

  // =====================================================================
  // 5) ENCAJAR PIEZAS
  // =====================================================================
  function encajar(diff) {
    const L = level(diff), W = L >= 2 ? 5 : 4, H = 4, n = [4, 5, 5, 6][L];
    for (let t = 0; t < 500; t++) {
      // Hueco: una pieza aleatoria dentro del tablero
      const cells = [[rnd(W), rnd(H)]];
      let g = 0;
      while (cells.length < n && g++ < 200) {
        const c = cells[rnd(cells.length)], d = [[1, 0], [-1, 0], [0, 1], [0, -1]][rnd(4)];
        const p = [c[0] + d[0], c[1] + d[1]];
        if (p[0] < 0 || p[1] < 0 || p[0] >= W || p[1] >= H || cells.some(q => q[0] === p[0] && q[1] === p[1])) continue;
        cells.push(p);
      }
      if (cells.length < n) continue;
      const piece = B.rot(toCells(cells), 0);
      const R = [0, 1, 2, 3].map(k => B.key(B.rot(piece, k)));
      const pool = shuffle([0, 1, 2, 3].map(k => B.rot(B.flipLR(piece), k)));
      for (let k = 0; k < 6; k++) { const v = B.variant(piece); if (v) pool.push(B.rot(v, rnd(4))); }
      const seen = new Set(R), wr = [];
      for (const p of pool) { const k = B.key(p); if (seen.has(k)) continue; seen.add(k); wr.push(p); if (wr.length === 3) break; }
      if (wr.length < 3) continue;
      const correct = B.rot(piece, 1 + rnd(3));
      const size = Math.max(...[correct, ...wr].map(B.size));
      const hole = new Set(cells.map(k2));
      let board = `<svg viewBox="-.3 -.3 ${W + .6} ${W + .6}" class="figsvg" aria-hidden="true"><g transform="translate(0 ${(W - H) / 2})">`;
      for (let x = 0; x < W; x++) for (let y = 0; y < H; y++)
        board += hole.has(k2([x, y])) ? `<rect x="${x + .06}" y="${y + .06}" width=".88" height=".88" rx=".1" class="bh"/>`
                                      : `<rect x="${x + .03}" y="${y + .03}" width=".94" height=".94" rx=".1" class="bd"/>`;
      board += '</g></svg>';
      return {
        cat: 'encajar', kind: 'fig',
        prompt: '¿Qué pieza <b>encaja</b> en el hueco para completar el rectángulo? <small class="hint">(las piezas se pueden girar, pero no dar la vuelta)</small>',
        figHtml: ref(board, '', 'big'),
        options: shuffle([{ html: B.svg(correct, size), ok: true, shape: correct }, ...wr.map(w => ({ html: B.svg(w, size), shape: w }))]),
        explain: 'La correcta es la forma del hueco girada. Las otras son su imagen en espejo (habría que darle la vuelta) o tienen un cuadrado cambiado de sitio.',
        _piece: piece,
      };
    }
    throw new Error('No se pudo generar encajar');
  }

  return { desarrollos, contar, vistas, papel, encajar, _test: { NETS, fold, views, unfold, FOLDS, canon2, planta } };
})();
if (typeof module !== 'undefined') module.exports = Spatial;
