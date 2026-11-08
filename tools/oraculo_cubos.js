// Oráculo físico: el desarrollo impreso boca arriba (como en pantalla), la cara base queda ARRIBA
// y las solapas se doblan hacia abajo para que lo impreso quede por fuera.
// Mundo: este=+x, norte=+y, arriba=+z. En pantalla, x crece a la derecha (este) e y crece hacia abajo (sur).
const sub=(a,b)=>a.map((v,i)=>v-b[i]), neg=a=>a.map(v=>-v);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function physFold(net){ // devuelve normal exterior de cada cara
  // marco de cada cara: n = normal exterior; e = dirección mundo del "este de pantalla" sobre la cara; s = dirección mundo del "sur de pantalla"
  const fr=new Map([[0,{n:[0,0,1],e:[1,0,0],s:[0,-1,0]}]]), q=[0];
  while(q.length){const i=q.shift(),f=fr.get(i),[x,y]=net[i];
    net.forEach(([a,b],j)=>{ if(fr.has(j))return; const dx=a-x,dy=b-y; if(Math.abs(dx)+Math.abs(dy)!==1)return;
      // la solapa en la dirección d de la cara se dobla hacia abajo (hacia -n): su normal pasa a ser d; su "d" pasa a ser -n
      let g; if(dx===1) g={n:f.e,e:neg(f.n),s:f.s}; else if(dx===-1) g={n:neg(f.e),e:f.n,s:f.s};
      else if(dy===1) g={n:f.s,e:f.e,s:neg(f.n)}; else g={n:neg(f.s),e:f.e,s:f.n};
      fr.set(j,g); q.push(j);});}
  return net.map((_,i)=>fr.get(i).n);
}
// Vistas reales: para cada orientación del cubo (24 rotaciones) y cámara desde arriba en la esquina (+1,+1,+1)
function physViews(normals, sym, ROTS, apply, eq){
  const set=new Set();
  const V=[1,1,1], fwd=neg(V), up=[0,0,1], right=cross(fwd,up); // derecha de pantalla real
  for(const m of ROTS){ const r=normals.map(n=>apply(m,n)); const f=d=>sym[r.findIndex(n=>eq(n,d))];
    // caras visibles: +z (arriba), +x y +y. ¿Cuál queda a la derecha?
    const rx=dot([1,0,0],right), ry=dot([0,1,0],right);
    const R = rx>ry?[1,0,0]:[0,1,0], L = rx>ry?[0,1,0]:[1,0,0];
    set.add([f([0,0,1]),f(R),f(L)].join(','));}
  return set;
}
module.exports={physFold,physViews};
