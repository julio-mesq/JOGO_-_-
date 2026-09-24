// Câmeras (V): 0 terceira pessoa, 1 primeira pessoa, 2 drone, 3 ação (ombro); no carro, V alterna 3ª pessoa / interno.
// No carro o mouse move a câmera livremente (jog.olho). Botão direito = mira com zoom (fovMira).
import * as THREE from 'three';
const pos = new THREE.Vector3();
export function atualizarCamera(cam, agora, dt, jog, pov, fovMira = 0) {
  const c = jog.veiculo, a = c ? c.obj.position : jog.obj.position, yaw = c ? c.yaw + jog.olho : jog.yaw; let fov = 70;
  if (c && pov === 1) pov = 4; if (pov === 4 && !c) pov = 0;
  if (pov === 4) { cam.position.set(a.x + Math.sin(c.yaw) * .2, a.y + 1.2, a.z + Math.cos(c.yaw) * .2); cam.rotation.set(jog.pitch, yaw, 0, 'YXZ'); fov = 80; }
  else if (pov === 1) { cam.position.set(a.x, a.y + (jog.agachado ? 1.1 : 1.7), a.z); cam.rotation.set(jog.pitch, yaw, 0, 'YXZ'); fov = fovMira || 70; }
  else {
    let d = c ? 9 : 4.5, h = c ? 3.5 - jog.pitch * 2 : 2.4 - jog.pitch * 2, lado = 0, s = 8;
    if (pov === 3) { d = c ? 8 : 3.2; h = 1.9 - jog.pitch * 1.5; lado = 1.1; s = 3; fov = 60; }
    if (fovMira && !c) { d = 2.4; h = 1.75 - jog.pitch * 1.5; lado = .9; s = 12; fov = fovMira; }
    if (pov === 2) { const t = agora / 4000; pos.set(a.x + Math.sin(t) * 18, a.y + 8, a.z + Math.cos(t) * 18); }
    else pos.set(a.x + Math.sin(yaw) * d + Math.cos(yaw) * lado, a.y + h, a.z + Math.cos(yaw) * d - Math.sin(yaw) * lado);
    cam.position.lerp(pos, 1 - Math.exp(-s * dt)); cam.lookAt(a.x, a.y + 1.6, a.z);
  }
  cam.fov += (fov - cam.fov) * (1 - Math.exp(-8 * dt)); cam.updateProjectionMatrix();
}
