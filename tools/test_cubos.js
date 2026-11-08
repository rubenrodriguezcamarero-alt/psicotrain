// Comprueba los ejercicios de cubos desplegados contra un plegado físico independiente.
// Uso: node tools/test_cubos.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const { physFold, physViews } = require('./oraculo_cubos.js');
const d = path.join(__dirname, '..');
const ctx = { console, Math }; vm.createContext(ctx);
vm.runInContext(['figures.js', 'spatial.js'].map(f => fs.readFileSync(path.join(d, f), 'utf8')).join(';') + ';this.Fig=Fig;this.Spatial=Spatial;', ctx);
const T = ctx.Spatial._test, ROTS = ctx.Fig._test.ROTS;
const apply = (m, c) => [0, 1, 2].map(i => m[i][0] * c[0] + m[i][1] * c[1] + m[i][2] * c[2]);
const eq = (a, b) => a.every((v, i) => v === b[i]);
let fallos = 0;
// 1) Los 11 desarrollos, en sus 8 posiciones (giros y volteo), dan las mismas vistas que el plegado físico
const rot = n => n.map(([x, y]) => [-y, x]), flip = n => n.map(([x, y]) => [-x, y]);
for (const base of T.NETS) {
  let n = base.map(c => [...c]);
  for (let k = 0; k < 8; k++) {
    if (k === 4) n = flip(n);
    const s = [0, 1, 2, 3, 4, 5];
    const p = physViews(physFold(n), s, ROTS, apply, eq), c = T.views(T.fold(n), s);
    if (p.size !== c.size || ![...p].every(v => c.has(v))) { fallos++; console.log('Vistas distintas en', JSON.stringify(n)); }
    n = rot(n);
  }
}
// 2) Preguntas generadas: exactamente una opción correcta, comprobada con el plegado físico
for (let t = 0; t < 3000; t++) {
  const q = ctx.Spatial.desarrollos('examen');
  if (q._opp) continue;
  const P = physViews(physFold(q._net), q._sym, ROTS, apply, eq);
  const okReal = q.options.map(o => q.prompt.includes('NO') ? !P.has(o.view) : P.has(o.view));
  const nOk = okReal.filter(Boolean).length, marcada = q.options.findIndex(o => o.ok);
  if (nOk !== 1 || !okReal[marcada]) { fallos++; if (fallos < 5) console.log('Pregunta mal:', q.prompt, okReal, marcada); }
}
console.log(fallos ? `${fallos} fallos` : 'Cubos desplegados: todo correcto');
process.exit(fallos ? 1 : 0);
