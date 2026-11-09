// Comprueba las preguntas de LÍNEAS: opciones distintas y respuesta correcta coherente con los listados.
const fs = require('fs'), path = require('path'), d = path.join(__dirname, '..');
eval(fs.readFileSync(path.join(d, 'lineas/datos.js'), 'utf8').replace('const LINEAS', 'globalThis.LINEAS') +
  fs.readFileSync(path.join(d, 'lineas.js'), 'utf8').replace('const Lineas', 'globalThis.Lineas'));
const T = Lineas._test.TIPOS; let fallos = 0, n = 0; const cuenta = {};
// Simetría de correspondencias entre líneas cargadas (misma estación en ambos listados)
const norm = Lineas._test.norm;
for (const a of Lineas.lineas) for (const [s, ls] of Object.entries(a.corr || {})) for (const o of ls) {
  const b = Lineas.lineas.find(l => l.id === o); if (!b) continue;
  const enB = Object.keys(b.corr || {}).find(x => norm(x) === norm(s));
  if (enB && !b.corr[enB].includes(a.id)) { fallos++; console.log(`Correspondencia no recíproca: ${s} ${a.id}->${o}`); }
}
for (const l of Lineas.lineas) for (const t in T) for (let k = 0; k < 300; k++) {
  const r = T[t](l.id); if (!r) continue; n++; cuenta[t] = (cuenta[t] || 0) + 1;
  const [p, ok, ws] = r;
  if (new Set([ok, ...ws]).size !== 3 || ws.length !== 2) { fallos++; console.log('Opciones repetidas', t, l.id, ok, ws); }
}
console.log(`${n} preguntas generadas`, cuenta, fallos ? `${fallos} fallos` : 'todo correcto');
process.exit(fallos ? 1 : 0);
