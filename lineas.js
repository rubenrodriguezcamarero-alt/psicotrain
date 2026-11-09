// Preguntas sobre las líneas de Metro, generadas SOLO a partir de los listados de lineas/datos.js.
const Lineas = (() => {
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const L = (typeof LINEAS !== 'undefined' ? LINEAS : []).filter(l => l.tramos.some(t => t.length));
  const byId = Object.fromEntries(L.map(l => [l.id, l]));
  // Estaciones de cada línea (sin repetir) y en qué líneas está cada estación
  const est = Object.fromEntries(L.map(l => [l.id, [...new Map(l.tramos.flat().map(s => [norm(s), s])).values()]]));
  const lineasDe = new Map();
  L.forEach(l => est[l.id].forEach(s => { const k = norm(s); if (!lineasDe.has(k)) lineasDe.set(k, new Set()); lineasDe.get(k).add(l.id); }));
  // Correspondencias marcadas en los planos: también cuentan como líneas que pasan por la estación
  const TODAS = typeof LINEAS !== 'undefined' ? LINEAS : [];
  const NOMBRE = { ...Object.fromEntries(TODAS.map(l => [l.id, l.nombre])), ml1: 'Metro Ligero 1', ml2: 'Metro Ligero 2', ml3: 'Metro Ligero 3', r: 'Ramal' };
  L.forEach(l => Object.entries(l.corr || {}).forEach(([s, ls]) => ls.forEach(o => lineasDe.get(norm(s)).add(o))));
  const tiene = (id, s) => lineasDe.get(norm(s))?.has(id);
  const nom = id => NOMBRE[id] || id;
  // Líneas de Metro «normales» para usar como opciones incorrectas
  const METRO = TODAS.map(l => l.id);
  const corrDe = id => Object.entries(byId[id].corr || {});
  const opt = (t, ok) => ({ t, ok: !!ok });
  const q = (cat, id, prompt, ok, wrongs, explain) => ({
    cat, id, kind: 'text', abc: true, prompt, word: '',
    options: shuffle([opt(ok, 1), ...wrongs.map(w => opt(w))]), explain, review: `${prompt.replace(/<[^>]+>/g, '')} → ${ok}`,
  });
  const otras = (id, n, filtro = () => true) => shuffle(L.filter(l => l.id !== id && filtro(l))).slice(0, n);
  const cabeceras = (l, t = 0) => `${l.tramos[t][0]} – ${l.tramos[t][l.tramos[t].length - 1]}`;

  // Cada tipo devuelve la pregunta o null si con los listados disponibles no se puede formar
  const TIPOS = {
    // ¿A qué línea pertenece la estación X?
    linea(id) {
      if (L.length < 3) return null;
      const s = pick(est[id]), suyas = lineasDe.get(norm(s));
      const malas = shuffle(METRO.filter(m => !suyas.has(m))).slice(0, 2);
      if (malas.length < 2) return null;
      return suyas.size === 1
        ? [`¿A qué línea pertenece la estación <b>${s}</b>?`, nom(id), malas.map(nom), `${s} está en el listado de la ${nom(id)} y el plano no marca correspondencias.`]
        : [`¿Cuál de estas líneas pasa por la estación <b>${s}</b>?`, nom(id), malas.map(nom),
          `Según los planos, por ${s} pasan: ${[...suyas].map(nom).join(', ')}.`];
    },
    // ¿Cuántas estaciones tiene la línea X?
    numero(id) {
      const n = est[id].length;
      const ws = shuffle([-3, -2, -1, 1, 2, 3]).slice(0, 2).map(d => String(n + d));
      return [`Según el listado, ¿cuántas estaciones tiene la <b>${nom(id)}</b>?`, String(n), ws,
        `La ${nom(id)} tiene ${n} estaciones en el listado.`];
    },
    // ¿Qué estación está entre A y C?
    entre(id) {
      const t = pick(byId[id].tramos.filter(t => t.length >= 3)); if (!t) return null;
      const i = 1 + rnd(t.length - 2), ok = t[i];
      const ws = shuffle(est[id].filter(s => s !== ok && s !== t[i - 1] && s !== t[i + 1])).slice(0, 2);
      if (ws.length < 2) return null;
      return [`En la ${nom(id)}, ¿qué estación está entre <b>${t[i - 1]}</b> y <b>${t[i + 1]}</b>?`, ok, ws,
        `${t[i - 1]} → <b>${ok}</b> → ${t[i + 1]}.`];
    },
    // ¿Cuál es la siguiente estación en dirección a…?
    siguiente(id) {
      const t = pick(byId[id].tramos.filter(t => t.length >= 4)); if (!t) return null;
      const sentido = rnd(2), seq = sentido ? t : [...t].reverse();
      const i = rnd(seq.length - 2), ok = seq[i + 1];
      const ws = shuffle([seq[i - 1], seq[i + 2], ...seq].filter(s => s && s !== ok && s !== seq[i]));
      const w = [...new Set(ws)].slice(0, 2); if (w.length < 2) return null;
      return [`En la ${nom(id)}, viajando desde <b>${seq[i]}</b> en dirección a <b>${seq[seq.length - 1]}</b>, ¿cuál es la siguiente estación?`, ok, w,
        `Dirección ${seq[seq.length - 1]}: ${seq[i]} → <b>${ok}</b>.`];
    },
    // ¿Cuáles son las cabeceras?
    cabeceras(id) {
      const l = byId[id]; if (l.circular) return null;
      const ok = cabeceras(l), t = l.tramos[0];
      const ws = new Set();
      otras(id, 4).forEach(o => { if (!o.circular) ws.add(cabeceras(o)); });
      if (t.length >= 4) ws.add(`${t[0]} – ${t[t.length - 2]}`), ws.add(`${t[1]} – ${t[t.length - 1]}`);
      ws.delete(ok);
      const w = shuffle([...ws]).slice(0, 2); if (w.length < 2) return null;
      return [`¿Cuáles son las estaciones cabecera de la <b>${nom(id)}</b>?`, ok, w, `Según el listado, la ${nom(id)} va de ${ok}.`];
    },
    // ¿Cuál NO pertenece a la línea X?
    intrusa(id) {
      const fuera = L.filter(l => l.id !== id).flatMap(l => est[l.id]).filter(s => !tiene(id, s));
      if (!fuera.length || est[id].length < 2) return null;
      const ok = pick(fuera), ws = shuffle(est[id]).slice(0, 2);
      return [`¿Cuál de estas estaciones <b>NO</b> pertenece a la ${nom(id)}?`, ok, ws,
        `${ok} no aparece en el listado de la ${nom(id)}${lineasDe.get(norm(ok)) ? ` (es de la ${[...lineasDe.get(norm(ok))].map(nom).join(' y ')})` : ''}.`];
    },
    // ¿En qué estación coinciden dos líneas?
    coinciden(id) {
      // Solo estaciones que aparecen con el mismo nombre en los dos listados
      const enLista = (lid, s) => est[lid].some(x => norm(x) === norm(s));
      const pares = L.filter(l => l.id !== id).map(l => [l, est[id].filter(s => enLista(l.id, s))]).filter(([, c]) => c.length);
      if (!pares.length) return null;
      const [o, comunes] = pick(pares), ok = pick(comunes);
      const ws = shuffle(est[id].filter(s => !tiene(o.id, s))).slice(0, 2); if (ws.length < 2) return null;
      return [`¿En cuál de estas estaciones coinciden la <b>${nom(id)}</b> y la <b>${o.nombre}</b>?`, ok, ws,
        `${ok} aparece en los listados de la ${nom(id)} y de la ${o.nombre}.`];
    },
    // ¿Cuántas estaciones hay entre A y B?
    distancia(id) {
      const t = pick(byId[id].tramos.filter(t => t.length >= 6)); if (!t) return null;
      const i = rnd(t.length - 4), j = i + 3 + rnd(Math.min(5, t.length - i - 3)), n = j - i - 1;
      const ws = [n - 1, n + 1, n + 2].filter(x => x >= 0).slice(0, 2).map(String);
      return [`En la ${nom(id)}, ¿cuántas estaciones hay <b>entre</b> ${t[i]} y ${t[j]} (sin contarlas a ellas)?`, String(n), ws,
        `${t.slice(i, j + 1).join(' → ')}: ${n} estaciones en medio.`];
    },
    // ¿Con qué línea hay correspondencia en la estación X?
    corrLinea(id) {
      const cs = corrDe(id); if (!cs.length) return null;
      const [s, ls] = pick(cs), ok = pick(ls), suyas = lineasDe.get(norm(s));
      const malas = shuffle(METRO.filter(m => !suyas.has(m))).slice(0, 2);
      if (malas.length < 2) return null;
      return [`En la estación <b>${s}</b> de la ${nom(id)}, ¿con qué línea hay correspondencia?`, nom(ok), malas.map(nom),
        `El plano de la ${nom(id)} marca en ${s}: ${ls.map(nom).join(', ')}.`];
    },
    // ¿En qué estación de la línea X se hace transbordo a la línea Y?
    corrEstacion(id) {
      const cs = corrDe(id); if (!cs.length) return null;
      const destinos = [...new Set(cs.flatMap(([, ls]) => ls))], o = pick(destinos);
      const oks = cs.filter(([, ls]) => ls.includes(o)).map(([s]) => s), ok = pick(oks);
      const ws = shuffle(est[id].filter(s => !tiene(o, s))).slice(0, 2); if (ws.length < 2) return null;
      return [`En la ${nom(id)}, ¿en qué estación hay correspondencia con la <b>${nom(o)}</b>?`, ok, ws,
        `Según el plano de la ${nom(id)}, hay correspondencia con la ${nom(o)} en: ${oks.join(', ')}.`];
    },
    // ¿Cuántas correspondencias con otras líneas tiene la estación X?
    corrNumero(id) {
      const cs = corrDe(id); if (!cs.length) return null;
      const [s, ls] = pick(cs), n = ls.length;
      const ws = [n + 1, n + 2, n - 1].filter(x => x >= 0 && x !== n).slice(0, 2).map(String);
      return [`Según el plano de la ${nom(id)}, ¿con cuántas líneas (Metro, Metro Ligero o Ramal) tiene correspondencia la estación <b>${s}</b>?`, String(n), ws,
        `${s}: ${ls.map(nom).join(', ')}.`];
    },
    // Transbordos entre estaciones con distinto nombre
    transbordo(id) {
      const TB = (typeof TRANSBORDOS !== 'undefined' ? TRANSBORDOS : []).flatMap(([a, la, b, lb]) => [[a, la, b, lb], [b, lb, a, la]])
        .filter(([a, la, , lb]) => la === id && byId[lb]);
      if (!TB.length) return null;
      const [a, , b, lb] = pick(TB);
      const ws = shuffle(est[lb].filter(s => s !== b && !tiene(id, s))).slice(0, 2); if (ws.length < 2) return null;
      return [`La estación <b>${a}</b> (${nom(id)}) tiene transbordo con una estación de la ${nom(lb)} que tiene otro nombre. ¿Cuál es?`, b, ws,
        `${a} (${nom(id)}) ↔ ${b} (${nom(lb)}): transbordo mutuo.`];
    },
  };
  const NOMBRES = Object.keys(TIPOS);
  function pregunta(id, spec) {
    for (let k = 0; k < 40; k++) {
      const tipo = spec?.split('|')[0] || pick(NOMBRES);
      const r = TIPOS[tipo]?.(id);
      if (r) { const [p, ok, ws, ex] = r; return q(id, undefined, p, ok, ws, ex); }
      if (spec) spec = null;
    }
    return TIPOS.numero(id) && q(id, undefined, ...TIPOS.numero(id));
  }
  return { lineas: L, todas: typeof LINEAS !== 'undefined' ? LINEAS : [], est, pregunta, _test: { TIPOS, lineasDe, norm } };
})();
