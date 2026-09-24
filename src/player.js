// Jogador e humanos: proporções reais, rosto, cabelo, roupas, animação de caminhada, arma na mão, soco, morte e renascimento.
import * as THREE from 'three';
import { colide } from './world.js';
import { FORMAS } from './weapons.js';
export const teclas = {};
addEventListener('keydown', e => teclas[e.code] = true);
addEventListener('keyup', e => teclas[e.code] = false);
const K1 = { f: 'KeyW', b: 'KeyS', l: 'KeyA', r: 'KeyD', run: 'ShiftLeft', ag: 'KeyC', pulo: 'Space' };
export const K2 = { f: 'KeyI', b: 'KeyK', l: 'KeyJ', r: 'KeyL', run: 'ShiftRight', ag: 'KeyN', pulo: 'KeyU', giro: true }; // jogador 2 (split-screen)

export function criarHumano(cor, pele = 0xe0ac82, cabelo = 0x2b1b12, calca = 0x2b2b3a) {
  const g = new THREE.Group(), L = (c, r = .85) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const P = (geo, c, x, y, z, r) => { const o = new THREE.Mesh(geo, L(c, r)); o.position.set(x, y, z); return o; };
  const torso = P(new THREE.CapsuleGeometry(.2, .36, 6, 12), cor, 0, 1.3, 0); torso.scale.z = .6;
  const quad = P(new THREE.CapsuleGeometry(.19, .1, 6, 12), calca, 0, .98, 0); quad.scale.z = .62;
  const cab = P(new THREE.SphereGeometry(.12, 16, 14), pele, 0, 1.76, 0, .5); cab.scale.set(.92, 1.12, 1);
  const fc = document.createElement('canvas'); fc.width = 64; fc.height = 64; const x = fc.getContext('2d'); // rosto pintado
  x.fillStyle = '#fff'; [20, 44].forEach(cx => { x.beginPath(); x.ellipse(cx, 28, 7, 4, 0, 0, 7); x.fill(); });
  x.fillStyle = '#3b2a1a'; [20, 44].forEach(cx => { x.beginPath(); x.arc(cx, 28, 3.2, 0, 7); x.fill(); });
  x.strokeStyle = '#' + cabelo.toString(16).padStart(6, '0'); x.lineWidth = 3; x.beginPath(); x.moveTo(12, 20); x.lineTo(28, 18); x.moveTo(36, 18); x.lineTo(52, 20); x.stroke();
  x.strokeStyle = '#8a3b3b'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(24, 50); x.quadraticCurveTo(32, 54, 40, 50); x.stroke();
  const tx = new THREE.CanvasTexture(fc); tx.colorSpace = THREE.SRGBColorSpace;
  const rosto = new THREE.Mesh(new THREE.PlaneGeometry(.17, .2), new THREE.MeshBasicMaterial({ map: tx, transparent: true })); rosto.position.set(0, 1.765, -.108);
  const perna = px => { const p = new THREE.Group(); p.position.set(px, .95, 0); p.add(P(new THREE.CapsuleGeometry(.085, .62, 5, 10), calca, 0, -.42, 0), P(new THREE.BoxGeometry(.13, .09, .29), 0x151515, 0, -.9, -.06, .4)); return p; };
  const braco = px => { const p = new THREE.Group(); p.position.set(px, 1.5, 0); p.add(P(new THREE.CapsuleGeometry(.065, .2, 5, 10), cor, 0, -.15, 0), P(new THREE.CapsuleGeometry(.05, .24, 5, 10), pele, 0, -.42, 0, .5), P(new THREE.SphereGeometry(.055, 10, 8), pele, 0, -.6, 0, .5)); return p; };
  g.userData = { pe: perna(-.1), pd: perna(.1), be: braco(-.27), bd: braco(.27) };
  g.add(torso, quad, cab, rosto, P(new THREE.CylinderGeometry(.05, .06, .1, 8), pele, 0, 1.6, 0, .5), P(new THREE.SphereGeometry(.023, 8, 6), pele, 0, 1.75, -.118, .5),
    P(new THREE.SphereGeometry(.025, 8, 6), pele, -.115, 1.76, 0, .5), P(new THREE.SphereGeometry(.025, 8, 6), pele, .115, 1.76, 0, .5),
    P(new THREE.SphereGeometry(.13, 16, 12, 0, 6.283, 0, 1.35), cabelo, 0, 1.78, .01, .6), P(new THREE.SphereGeometry(.12, 12, 10), cabelo, 0, 1.74, .05, .6),
    P(new THREE.SphereGeometry(.08, 10, 8), cor, -.26, 1.5, 0), P(new THREE.SphereGeometry(.08, 10, 8), cor, .26, 1.5, 0), g.userData.pe, g.userData.pd, g.userData.be, g.userData.bd);
  return g;
}
export function trocarArma(g, i) { // 0-5 armas; 6 = punhos (mãos livres)
  const u = g.userData; if (u.gun) { u.bd.remove(u.gun); u.gun = null; } const d = FORMAS[i]; u.armado = !!d; if (!d) return;
  u.gun = new THREE.Mesh(new THREE.BoxGeometry(d[0], d[2], d[1]), new THREE.MeshStandardMaterial({ color: i === 5 ? 0x4a5d3a : 0x222222, roughness: .5 }));
  u.gun.position.set(0, -.5 - d[2] / 2 + .15, 0); u.bd.add(u.gun);
}
export function animar(g, vel, t) {
  const u = g.userData, a = Math.sin(t * 8) * Math.min(1, vel / 3) * .8; u.pe.rotation.x = a; u.pd.rotation.x = -a;
  if (u.socoAte && t < u.socoAte) { u.bd.rotation.x = 1.57; u.be.rotation.x = -.4; } // soco
  else if (u.armado) { u.bd.rotation.x = 1.45; u.be.rotation.x = 1.15; u.be.rotation.z = .3; } else { u.be.rotation.x = -a; u.bd.rotation.x = a; u.be.rotation.z = 0; }
}

export class Jogador {
  constructor(scene, opt = {}) {
    this.k = opt.k || K1; this.obj = criarHumano(opt.cor || 0x1f4e79); scene.add(this.obj); trocarArma(this.obj, 0); this.obj.position.set(opt.x ?? 6, 0, 30);
    Object.assign(this, { yaw: 0, pitch: 0, vy: 0, hp: 100, st: 100, dinheiro: 500, veiculo: null, olho: 0, mira: false, morto: false, tm: 0, tt: 0, agachado: false });
  }
  morrer() { this.morto = true; this.tm = 0; this.veiculo = null; }
  renascer() { this.morto = false; this.obj.rotation.x = 0; this.hp = 100; this.dinheiro = Math.floor(this.dinheiro * .9); this.obj.position.set(6, 0, 30); this.aoRenascer?.(); }
  atualizar(dt) {
    if (this.morto) { this.tm += dt; this.obj.rotation.x = Math.min(this.tm * 4, 1.5); this.obj.position.y = .2; if (this.tm > 3.5) this.renascer(); return; }
    if (this.veiculo) return;
    const k = this.k; this.agachado = !!teclas[k.ag]; this.obj.scale.y = this.agachado ? .7 : 1;
    if (k.giro) this.yaw += ((teclas[k.l] ? 1 : 0) - (teclas[k.r] ? 1 : 0)) * 2.2 * dt;
    const fx = (teclas[k.f] ? 1 : 0) - (teclas[k.b] ? 1 : 0), sx = k.giro ? 0 : (teclas[k.r] ? 1 : 0) - (teclas[k.l] ? 1 : 0);
    const correr = teclas[k.run] && this.st > 0 && (fx || sx), l = Math.hypot(fx, sx) || 1;
    const v = (correr ? 9 : this.agachado ? 2.2 : 4.5) * (this.mira ? .6 : 1);
    const s = Math.sin(this.yaw), c = Math.cos(this.yaw), p = this.obj.position;
    const dx = (-s * fx + c * sx) / l * v * dt, dz = (-c * fx - s * sx) / l * v * dt;
    if (!colide(p.x + dx, p.z, .4)) p.x += dx;
    if (!colide(p.x, p.z + dz, .4)) p.z += dz;
    this.st = Math.max(0, Math.min(100, this.st + (correr ? -20 : 12) * dt));
    if (teclas[k.pulo] && p.y <= 0) this.vy = 6;
    this.vy -= 18 * dt; p.y = Math.max(0, p.y + this.vy * dt); if (p.y === 0) this.vy = 0;
    this.obj.rotation.y = this.yaw; this.tt += dt; animar(this.obj, (fx || sx) ? v : 0, this.tt);
  }
}
