// Comprueba los ejercicios de dados celdilla: caras opuestas suman 7, el rodar es coherente
// (se reproduce el ejemplo del cuadernillo) y cada pregunta tiene una única respuesta correcta.
const fs = require('fs'), vm = require('vm'), path = require('path'), d = path.join(__dirname, '..');
const ctx = { console, Math }; vm.createContext(ctx);
vm.runInContext(['figures.js', 'spatial.js'].map(f => fs.readFileSync(path.join(d, f), 'utf8')).join(';') + ';this.Spatial=Spatial;', ctx);
const { rodar } = ctx.Spatial._test; let fallos = 0;
const suma7 = o => o.t + o.b === 7 && o.px + o.nx === 7 && o.py + o.ny === 7 && new Set(Object.values(o)).size === 6;
// Ejemplo de la foto: arriba 4, izquierda 1, derecha 5. Pasos comprobados en la solución del cuadernillo.
let o = { t: 4, b: 3, px: 5, nx: 2, py: 1, ny: 6 };
const esperado = [['py', null], ['ny', [5, 1, 3]], ['ny', [1, 2, 3]], ['ny', [2, 6, 3]], ['px', [4, 6, 2]]];
// Desde 5·1·3 (arriba·izq·dcha) en adelante, las vistas del cuadernillo:
o = { t: 5, b: 2, py: 1, ny: 6, px: 3, nx: 4 };
for (const [d, v] of esperado.slice(2)) { o = rodar(o, d); if ([o.t, o.py, o.px].join() !== v.join()) { fallos++; console.log('Rodar no cuadra con el ejemplo', d, o, v); } }
if (o.b !== 3) { fallos++; console.log('La base del ejemplo debería ser 3 y es', o.b); }
for (const diff of ['facil', 'media', 'dificil', 'examen']) for (let k = 0; k < 2000; k++) {
  const q = ctx.Spatial.dados(diff), D = q._dado;
  if (!suma7(D.o0) || !suma7(D.fin)) { fallos++; console.log('Caras que no suman 7', D); }
  let e = D.o0; D.dirs.forEach(x => { e = rodar(e, x); });
  if (e[D.que] !== D.ans) { fallos++; console.log('Respuesta mal', D); }
  const oks = q.options.filter(x => x.ok);
  if (oks.length !== 1 || +oks[0].t !== D.ans || new Set(q.options.map(x => x.t)).size !== 4) { fallos++; console.log('Opciones mal', q.options); }
  // El camino no se toca a sí mismo salvo entre celdas consecutivas
  const P = D.path;
  for (let i = 0; i < P.length; i++) for (let j = i + 2; j < P.length; j++) if (Math.abs(P[i][0] - P[j][0]) + Math.abs(P[i][1] - P[j][1]) <= 1) { fallos++; console.log('Camino ambiguo', P); }
}
console.log(fallos ? `${fallos} fallos` : 'Dados celdilla: todo correcto');
process.exit(fallos ? 1 : 0);
