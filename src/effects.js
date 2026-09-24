// Efeitos visuais: explosões (foguete / carro) e fumaça de carro danificado.
import * as THREE from 'three';
const lista = [], esf = new THREE.SphereGeometry(1, 8, 6); let cena;
export const iniciar = s => { cena = s; };
function novo(p, cor, op, e, d, sobe, y) {
  const m = new THREE.Mesh(esf, new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: op }));
  m.position.copy(p); m.position.y += y; cena.add(m); lista.push({ m, t: 0, d, e, sobe, op });
}
export const explodir = (p, r = 6) => novo(p, 0xff8c00, .9, r, .6, 0, 1);
export const fumaca = p => novo(p, 0x444444, .6, 1.5, 1.2, 2, 1.5);
export function atualizar(dt) {
  for (let i = lista.length - 1; i >= 0; i--) {
    const o = lista[i]; o.t += dt; const k = o.t / o.d;
    o.m.scale.setScalar(.4 + o.e * k); o.m.position.y += o.sobe * dt; o.m.material.opacity = o.op * (1 - k);
    if (k >= 1) { cena.remove(o.m); o.m.material.dispose(); lista.splice(i, 1); }
  }
}
