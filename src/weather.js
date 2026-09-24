// Clima: chuva (tecla K) com partículas ao redor do jogador e neblina mais densa.
import * as THREE from 'three';
export function criarClima(scene) {
  const N = 2000, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 60; pos[i * 3 + 1] = Math.random() * 30; pos[i * 3 + 2] = (Math.random() - .5) * 60; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const chuva = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9ec5ff, size: .18, transparent: true, opacity: .7 }));
  chuva.visible = false; chuva.frustumCulled = false; scene.add(chuva);
  let on = false, longe = scene.fog.far;
  return {
    alternar() { on = !on; chuva.visible = on; scene.fog.far = on ? 220 : longe; return on; },
    reduzir(f) { longe = f; if (!on) scene.fog.far = f; },
    atualizar(dt, c) {
      if (!on) return; chuva.position.set(c.x, 0, c.z);
      for (let i = 0; i < N; i++) { let y = pos[i * 3 + 1] - 28 * dt; if (y < 0) y += 30; pos[i * 3 + 1] = y; }
      g.attributes.position.needsUpdate = true;
    }
  };
}
