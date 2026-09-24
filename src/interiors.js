// Interior das lojas (mercado/posto): sala separada da cidade, com prateleiras, balcão e caixa.
import * as THREE from 'three';
import { INT } from './world.js';
import { criarHumano } from './player.js';
export function criarInterior(scene) {
  const g = new THREE.Group(); g.position.set(INT.x, 0, INT.z); scene.add(g);
  const B = (w, h, d, c, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: c })); o.position.set(x, y, z); g.add(o); return o; };
  B(16, .2, 12, 0xd8d8d8, 0, 0, 0); B(16, 4, .3, 0xf4f4f4, 0, 2, -6); B(16, 4, .3, 0xf4f4f4, 0, 2, 6); B(.3, 4, 12, 0xf4f4f4, -8, 2, 0); B(.3, 4, 12, 0xf4f4f4, 8, 2, 0); B(16, .3, 12, 0xffffff, 0, 4, 0);
  for (let i = -1; i <= 1; i++) { B(1, 2, 6, 0x8b5a2b, i * 4, 1, 0); for (let k = 0; k < 12; k++) B(.5, .4, .5, [0xe74c3c, 0xf1c40f, 0x2ecc71, 0x3498db][k % 4], i * 4, .8 + (k % 3) * .6, -2.6 + (k / 3 | 0) * 1.6); }
  B(6, 1.1, 1.2, 0x444444, 0, .55, -4.5); B(3, 3, .2, 0x2e86de, 0, 1.5, 5.8);
  const placa = B(6, 1, .1, 0x0b6b2e, 0, 3.3, -5.8), luz = new THREE.PointLight(0xffffff, 1.2, 30); luz.position.set(0, 3.5, 0); g.add(luz);
  const cx = criarHumano(0xffffff, 0xc68642); cx.position.set(0, 0, -5.4); cx.rotation.y = Math.PI; g.add(cx);
  return { caixa: { x: INT.x, z: INT.z - 4.5 }, cor: t => placa.material.color.setHex(t === 'mercado' ? 0x0b6b2e : 0xb00020) };
}
