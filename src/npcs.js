// NPCs a pé: andam pelas calçadas, fogem ou brigam quando agredidos; policiais perseguem; organizador de mini-jogos.
import * as THREE from 'three';
import { criarHumano } from './player.js';
const R = (a, b) => a + Math.random() * (b - a);
const peles = [0xf1c27d, 0xc68642, 0x8d5524, 0xffdbac], roupas = [0xff0000, 0xffffff, 0x000000, 0x2e8b57, 0xffcc00, 0x6a5acd];
export class NPC {
  constructor(scene, policia, fixo, cor) {
    this.policia = policia; this.fixo = fixo; this.cacando = false; this.tt = 0; this.briga = 0; this.brigou = false;
    this.obj = criarHumano(cor ?? (policia ? 0x1e3a8a : roupas[Math.random() * 6 | 0]), peles[Math.random() * 4 | 0], [0x111111, 0x5a3825, 0xd8b45a, 0x8b2500][Math.random() * 4 | 0], [0x223355, 0x333333, 0x6b5b3e][Math.random() * 3 | 0]);
    this.obj.scale.setScalar(R(.94, 1.06)); scene.add(this.obj); this.reset();
  }
  reset() {
    this.hp = 100; this.fuga = 0; this.cacando = false; this.briga = 0; this.dir = Math.random() < .5 ? 1 : -1; this.eixo = Math.random() < .5 ? 'x' : 'z';
    const rua = Math.round(R(-9, 9)) * 100 + 10, p = R(-900, 900);
    this.obj.position.set(this.eixo === 'z' ? rua : p, 0, this.eixo === 'z' ? p : rua);
    if (this.fixo) this.obj.position.set(9, 0, 50);
  }
  hostil(x, z) { this.obj.position.set(x, 0, z); this.hp = 100; this.briga = 60; this.fuga = 0; }
  // Retorna o dano causado ao jogador neste frame
  atualizar(dt, alvo, estrelas) {
    this.tt += dt; const p = this.obj.position, dx = alvo.x - p.x, dz = alvo.z - p.z, d = Math.hypot(dx, dz) || 1;
    if (this.briga > 0) { // briga: persegue e bate
      this.briga -= dt; this.brigou = true; this.obj.rotation.y = Math.atan2(-dx, -dz);
      if (d > 1.6) { p.x += dx / d * 4.5 * dt; p.z += dz / d * 4.5 * dt; return 0; }
      this.obj.userData.socoAte = this.tt + .25; return 6 * dt;
    }
    if (this.brigou) { this.brigou = false; if (!this.fixo) this.reset(); }
    if (this.fixo) { if (d < 8) this.obj.rotation.y = Math.atan2(-dx, -dz); return 0; }
    if (this.policia && estrelas > 0) {
      this.cacando = true; this.obj.rotation.y = Math.atan2(-dx, -dz);
      if (d > 2.5) { p.x += dx / d * (5 + estrelas) * dt; p.z += dz / d * (5 + estrelas) * dt; return 0; }
      this.obj.userData.socoAte = this.tt + .25; return 8 * dt;
    }
    if (this.cacando) this.reset();
    this.fuga = Math.max(0, this.fuga - dt);
    const e = this.eixo, antes = Math.floor(p[e] / 100);
    p[e] += this.dir * (this.fuga > 0 ? 8 : 1.6) * dt;
    if (p[e] > 950) this.dir = -1; else if (p[e] < -950) this.dir = 1;
    if (Math.floor(p[e] / 100) !== antes && Math.random() < .5) { p[e] = Math.round(p[e] / 100) * 100 + this.dir * 10; this.eixo = e === 'x' ? 'z' : 'x'; this.dir = Math.random() < .5 ? 1 : -1; }
    this.obj.rotation.y = this.eixo === 'x' ? -this.dir * Math.PI / 2 : (this.dir > 0 ? Math.PI : 0);
    return 0;
  }
}
export const criarNPCs = (scene, n = 30) => Array.from({ length: n }, (_, i) => new NPC(scene, i < 4));
export const criarOrganizador = scene => new NPC(scene, false, true, 0xff7a00);
