// Preguntas sobre las líneas de Metro, generadas SOLO a partir de los listados de lineas/datos.js.
const Lineas = (() => {
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  // Una línea está disponible si tiene listado de estaciones o, al menos, sus cabeceras (o se sabe que es circular)
  const L = (typeof LINEAS !== 'undefined' ? LINEAS : []).filter(l => l.tramos.some(t => t.length) || l.cabeceras || l.circular);
  const byId = Object.fromEntries(L.map(l => [l.id, l]));
  // Estaciones de cada línea (sin repetir) y en qué líneas está cada estación
  const est = Object.fromEntries(L.map(l => [l.id, [...new Map(l.tramos.flat().map(s => [norm(s), s])).values()]]));
  const lineasDe = new Map();
  const conocidas = l => [...est[l.id], ...(l.cabeceras || [])]; // las cabeceras también son estaciones de la línea
  L.forEach(l => conocidas(l).forEach(s => { const k = norm(s); if (!lineasDe.has(k)) lineasDe.set(k, new Set()); lineasDe.get(k).add(l.id); }));
  // Correspondencias marcadas en los planos: también cuentan como líneas que pasan por la estación
  const TODAS = typeof LINEAS !== 'undefined' ? LINEAS : [];
  const NOMBRE = { ml1: 'ML-1', ml2: 'ML-2', ml3: 'ML-3', r: 'Ramal', ...Object.fromEntries(TODAS.map(l => [l.id, l.nombre])) };
  L.forEach(l => Object.entries(l.corr || {}).forEach(([s, ls]) => ls.forEach(o => lineasDe.get(norm(s)).add(o))));
  // Cabeceras de cada línea: del listado completo o del cuadro de cabeceras
  const cabs = l => l.circular ? null : l.tramos[0]?.length ? [l.tramos[0][0], l.tramos[0][l.tramos[0].length - 1]] : l.cabeceras;
  const tiene = (id, s) => lineasDe.get(norm(s))?.has(id);
  const nom = id => NOMBRE[id] || id;
  const La = id => (id === 'r' ? 'El ' : 'La ') + nom(id);
  const la = id => (id === 'r' ? 'el ' : 'la ') + nom(id); // «el Ramal», «la Línea 6»
  const art = t => t.replace(/\b([Dd]e|a) (<b>)?el /g, (m, p, b) => (p.toLowerCase() === 'de' ? 'del ' : 'al ') + (b || ''));
  // Líneas de Metro «normales» para usar como opciones incorrectas
  const METRO = TODAS.map(l => l.id);
  const corrDe = id => Object.entries(byId[id].corr || {});
  const opt = (t, ok) => ({ t, ok: !!ok });
  const q = (cat, id, prompt, ok, wrongs, explain) => ({
    cat, id, kind: 'text', abc: true, prompt: art(prompt), word: '',
    options: shuffle([opt(ok, 1), ...wrongs.map(w => opt(w))]), explain: art(explain), review: `${prompt.replace(/<[^>]+>/g, '')} → ${ok}`,
  });
  const otras = (id, n, filtro = () => true) => shuffle(L.filter(l => l.id !== id && filtro(l))).slice(0, n);
  const cabeceras = l => cabs(l).join(' – ');

  // Cada tipo devuelve la pregunta o null si con los listados disponibles no se puede formar
  const TIPOS = {
    // ¿A qué línea pertenece la estación X?
    linea(id) {
      if (L.length < 3) return null;
      const s = pick(est[id]), suyas = lineasDe.get(norm(s));
      // Solo líneas con listado completo: de las demás no se sabe con certeza si pasan por ahí
      const malas = shuffle(L.filter(l => est[l.id].length && !suyas.has(l.id)).map(l => l.id)).slice(0, 2);
      if (malas.length < 2) return null;
      return suyas.size === 1
        ? [`¿A qué línea pertenece la estación <b>${s}</b>?`, nom(id), malas.map(nom), `${s} está en el listado de ${la(id)} y el plano no marca correspondencias.`]
        : [`¿Cuál de estas líneas pasa por la estación <b>${s}</b>?`, nom(id), malas.map(nom),
          `Según los planos, por ${s} pasan: ${[...suyas].map(nom).join(', ')}.`];
    },
    // ¿Cuántas estaciones tiene la línea X?
    numero(id) {
      const n = est[id].length;
      const ws = shuffle([-3, -2, -1, 1, 2, 3]).slice(0, 2).map(d => String(n + d));
      return [`Según el listado, ¿cuántas estaciones tiene <b>${la(id)}</b>?`, String(n), ws,
        `${La(id)} tiene ${n} estaciones en el listado.`];
    },
    // ¿Qué estación está entre A y C?
    entre(id) {
      const t = pick(byId[id].tramos.filter(t => t.length >= 3)); if (!t) return null;
      const n = t.length, circ = byId[id].circular;
      const i = circ ? rnd(n) : 1 + rnd(n - 2), ok = t[i], a = t[(i - 1 + n) % n], b = t[(i + 1) % n];
      const ws = shuffle(est[id].filter(s => s !== ok && s !== a && s !== b)).slice(0, 2);
      if (ws.length < 2) return null;
      return [`En ${la(id)}, ¿qué estación está entre <b>${a}</b> y <b>${b}</b>?`, ok, ws,
        `${a} → <b>${ok}</b> → ${b}.${circ && (i === 0 || i === n - 1) ? ' (La línea es circular: tras ' + t[n - 1] + ' viene ' + t[0] + '.)' : ''}`];
    },
    // ¿Cuál es la siguiente estación en dirección a…?
    siguiente(id) {
      const t = pick(byId[id].tramos.filter(t => t.length >= 4)); if (!t) return null;
      if (byId[id].circular) {
        const n = t.length, i = rnd(n), ok = t[(i + 1) % n];
        const w = shuffle(est[id].filter(s => s !== ok && s !== t[i])).slice(0, 1).concat(t[(i - 1 + n) % n]).filter(s => s !== ok);
        if (new Set(w).size < 2) return null;
        return [`En ${la(id)} (circular), siguiendo el orden del listado (${t[0]} → ${t[1]} → …), ¿qué estación va después de <b>${t[i]}</b>?`, ok, w,
          `${t[i]} → <b>${ok}</b>.${i === n - 1 ? ' Al ser circular, tras ' + t[n - 1] + ' vuelve a ' + t[0] + '.' : ''}`];
      }
      const sentido = rnd(2), seq = sentido ? t : [...t].reverse();
      const i = rnd(seq.length - 2), ok = seq[i + 1];
      const ws = shuffle([seq[i - 1], seq[i + 2], ...seq].filter(s => s && s !== ok && s !== seq[i]));
      const w = [...new Set(ws)].slice(0, 2); if (w.length < 2) return null;
      return [`En ${la(id)}, viajando desde <b>${seq[i]}</b> en dirección a <b>${seq[seq.length - 1]}</b>, ¿cuál es la siguiente estación?`, ok, w,
        `Dirección ${seq[seq.length - 1]}: ${seq[i]} → <b>${ok}</b>.`];
    },
    // ¿Cuáles son las cabeceras?
    cabeceras(id) {
      const l = byId[id]; if (l.circular) return null;
      const ok = cabeceras(l), t = l.tramos[0] || [];
      const ws = new Set();
      otras(id, 6).forEach(o => { if (!o.circular) ws.add(cabeceras(o)); });
      if (t.length >= 4) ws.add(`${t[0]} – ${t[t.length - 2]}`), ws.add(`${t[1]} – ${t[t.length - 1]}`);
      ws.delete(ok);
      const w = shuffle([...ws]).slice(0, 2); if (w.length < 2) return null;
      return [`¿Cuáles son las estaciones cabecera de <b>${la(id)}</b>?`, ok, w, `Según el listado, las cabeceras de ${la(id)} son ${ok}.`];
    },
    // ¿Cuál de estas líneas tiene cabecera en X? (una estación puede ser cabecera de varias líneas)
    cabeceraLinea(id) {
      const c = cabs(byId[id]); if (!c) return null;
      const s = pick(c), de = L.filter(l => cabs(l)?.some(x => norm(x) === norm(s))).map(l => l.id);
      const ws = shuffle(L.filter(l => !de.includes(l.id) && !tiene(l.id, s))).slice(0, 2).map(l => l.nombre);
      if (ws.length < 2) return null;
      return [`¿Cuál de estas líneas tiene una de sus cabeceras en <b>${s}</b>?`, nom(id), ws,
        `${s} es cabecera de: ${de.map(nom).join(', ')}.`];
    },
    // La línea X tiene una cabecera en A, ¿cuál es la otra?
    otraCabecera(id) {
      const c = cabs(byId[id]); if (!c) return null;
      const k = rnd(2), dada = c[k], ok = c[1 - k];
      const ws = shuffle([...new Set(L.filter(l => l.id !== id && cabs(l)).flatMap(cabs))].filter(s => norm(s) !== norm(ok) && norm(s) !== norm(dada))).slice(0, 2);
      if (ws.length < 2) return null;
      return [`<b>${La(id)}</b> tiene una cabecera en <b>${dada}</b>. ¿Cuál es la otra?`, ok, ws, `${La(id)} va de ${c.join(' a ')}.`];
    },
    // Líneas circulares
    circular(id) {
      const circ = L.filter(l => l.circular), no = L.filter(l => !l.circular);
      if (!circ.length || no.length < 2) return null;
      if (byId[id].circular) return [`¿Cuál de estas líneas es <b>circular</b>?`, nom(id), shuffle(no).slice(0, 2).map(l => l.nombre),
        `Las líneas circulares son: ${circ.map(l => l.nombre).join(' y ')}.`];
      if (circ.length < 2) return null;
      return [`¿Cuál de estas líneas <b>NO</b> es circular?`, nom(id), shuffle(circ).slice(0, 2).map(l => l.nombre),
        `${circ.map(l => l.nombre).join(' y ')} son circulares; ${la(id)} tiene cabeceras (${cabeceras(byId[id])}).`];
    },
    // Cómo figura una línea circular en el cuadro de cabeceras
    via(id) {
      const l = byId[id]; if (!l.circular || !l.via) return null;
      const ok = `Circular. ${l.via}`;
      const ws = shuffle(L.filter(o => !o.circular && cabs(o)).map(cabeceras)).slice(0, 2);
      if (ws.length < 2) return null;
      return [`En el cuadro de cabeceras, ¿qué figura para <b>${la(id)}</b>?`, ok, ws, `${nom(id)}: ${ok}.`];
    },
    // ¿Cuál NO pertenece a la línea X?
    intrusa(id) {
      const fuera = L.filter(l => l.id !== id).flatMap(l => est[l.id]).filter(s => !tiene(id, s));
      if (!fuera.length || est[id].length < 2) return null;
      const ok = pick(fuera), ws = shuffle(est[id]).slice(0, 2);
      return [`¿Cuál de estas estaciones <b>NO</b> pertenece a ${la(id)}?`, ok, ws,
        `${ok} no aparece en el listado de ${la(id)}${lineasDe.get(norm(ok)) ? ` (es de la ${[...lineasDe.get(norm(ok))].map(nom).join(' y ')})` : ''}.`];
    },
    // ¿En qué estación coinciden dos líneas?
    coinciden(id) {
      // Solo estaciones que aparecen con el mismo nombre en los dos listados
      const enLista = (lid, s) => est[lid].some(x => norm(x) === norm(s));
      const pares = L.filter(l => l.id !== id).map(l => [l, est[id].filter(s => enLista(l.id, s))]).filter(([, c]) => c.length);
      if (!pares.length) return null;
      const [o, comunes] = pick(pares), ok = pick(comunes);
      const ws = shuffle(est[id].filter(s => !tiene(o.id, s))).slice(0, 2); if (ws.length < 2) return null;
      return [`¿En cuál de estas estaciones coinciden <b>${la(id)}</b> y <b>${la(o.id)}</b>?`, ok, ws,
        `${ok} aparece en los listados de ${la(id)} y de ${la(o.id)}.`];
    },
    // ¿Cuántas estaciones hay entre A y B?
    distancia(id) {
      if (byId[id].circular) return null; // en una circular hay dos caminos entre dos estaciones
      const t = pick(byId[id].tramos.filter(t => t.length >= 6)); if (!t) return null;
      const i = rnd(t.length - 4), j = i + 3 + rnd(Math.min(5, t.length - i - 3)), n = j - i - 1;
      const ws = [n - 1, n + 1, n + 2].filter(x => x >= 0).slice(0, 2).map(String);
      return [`En ${la(id)}, ¿cuántas estaciones hay <b>entre</b> ${t[i]} y ${t[j]} (sin contarlas a ellas)?`, String(n), ws,
        `${t.slice(i, j + 1).join(' → ')}: ${n} estaciones en medio.`];
    },
    // ¿Con qué línea hay correspondencia en la estación X?
    corrLinea(id) {
      const cs = corrDe(id); if (!cs.length) return null;
      const [s, ls] = pick(cs), ok = pick(ls), suyas = lineasDe.get(norm(s));
      const malas = shuffle(METRO.filter(m => !suyas.has(m))).slice(0, 2);
      if (malas.length < 2) return null;
      return [`En la estación <b>${s}</b> de ${la(id)}, ¿con qué línea hay correspondencia?`, nom(ok), malas.map(nom),
        `El plano de ${la(id)} marca en ${s}: ${ls.map(nom).join(', ')}.`];
    },
    // ¿En qué estación de la línea X se hace transbordo a la línea Y?
    corrEstacion(id) {
      const cs = corrDe(id); if (!cs.length) return null;
      const destinos = [...new Set(cs.flatMap(([, ls]) => ls))], o = pick(destinos);
      const oks = cs.filter(([, ls]) => ls.includes(o)).map(([s]) => s), ok = pick(oks);
      const ws = shuffle(est[id].filter(s => !tiene(o, s))).slice(0, 2); if (ws.length < 2) return null;
      return [`En ${la(id)}, ¿en qué estación hay correspondencia con <b>${la(o)}</b>?`, ok, ws,
        `Según el plano de ${la(id)}, hay correspondencia con ${la(o)} en: ${oks.join(', ')}.`];
    },
    // ¿Cuántas correspondencias con otras líneas tiene la estación X?
    corrNumero(id) {
      const cs = corrDe(id); if (!cs.length) return null;
      const [s, ls] = pick(cs), n = ls.length;
      const ws = [n + 1, n + 2, n - 1].filter(x => x >= 0 && x !== n).slice(0, 2).map(String);
      return [`Según el plano de ${la(id)}, ¿con cuántas líneas (Metro, Metro Ligero o Ramal) tiene correspondencia la estación <b>${s}</b>?`, String(n), ws,
        `${s}: ${ls.map(nom).join(', ')}.`];
    },
    // Transbordos entre estaciones con distinto nombre
    transbordo(id) {
      const TB = (typeof TRANSBORDOS !== 'undefined' ? TRANSBORDOS : []).flatMap(([a, la, b, lb]) => [[a, la, b, lb], [b, lb, a, la]])
        .filter(([a, la, , lb]) => la === id && byId[lb]);
      if (!TB.length) return null;
      const [a, , b, lb] = pick(TB);
      const ws = shuffle(est[lb].filter(s => s !== b && !tiene(id, s))).slice(0, 2); if (ws.length < 2) return null;
      return [`La estación <b>${a}</b> (${nom(id)}) tiene transbordo con una estación de ${la(lb)} que tiene otro nombre. ¿Cuál es?`, b, ws,
        `${a} (${nom(id)}) ↔ ${b} (${nom(lb)}): transbordo mutuo.`];
    },
  };
  const NOMBRES = Object.keys(TIPOS);
  // Sin listado de estaciones solo se puede preguntar por las cabeceras
  const SOLO_CABECERAS = ['cabeceras', 'cabeceraLinea', 'otraCabecera', 'circular', 'via'];
  function pregunta(id, spec) {
    const tipos = est[id]?.length ? NOMBRES : SOLO_CABECERAS;
    for (let k = 0; k < 60; k++) {
      const tipo = spec?.split('|')[0] || pick(tipos);
      const r = TIPOS[tipo]?.(id);
      if (r) { const [p, ok, ws, ex] = r; return q(id, undefined, p, ok, ws, ex); }
      if (spec) spec = null;
    }
    for (const t of tipos) { const r = TIPOS[t](id); if (r) return q(id, undefined, ...r); }
    return null;
  }
  return { lineas: L, todas: typeof LINEAS !== 'undefined' ? LINEAS : [], est, cabs, pregunta, _test: { TIPOS, lineasDe, norm, SOLO_CABECERAS } };
})();
