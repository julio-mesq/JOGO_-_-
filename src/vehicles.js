// Veículos com marcas, modelos, formatos e desempenho diferentes.
import * as THREE from 'three';
import { teclas } from './player.js';
import { colide } from './world.js';

export const MODELOS = [
  { marca: 'Volkswagen', nome: 'Gol', cor: 0xd9d9d9, w: 1.7, h: 1.4, l: 3.9, cab: .55, vmax: 30, acel: 12, preco: 9000 },
  { marca: 'Toyota', nome: 'Corolla', cor: 0x1e3a8a, w: 1.8, h: 1.45, l: 4.5, cab: .5, vmax: 34, acel: 14, preco: 18000 },
  { marca: 'Jeep', nome: 'Compass', cor: 0x2f4f2f, w: 1.9, h: 1.7, l: 4.4, cab: .62, vmax: 32, acel: 14, preco: 32000 },
  { marca: 'Ferrari', nome: 'F8', cor: 0xd40000, w: 1.95, h: 1.15, l: 4.5, cab: .4, vmax: 55, acel: 26, preco: 250000 },
  { marca: 'Ford', nome: 'F-350', cor: 0x333333, w: 2.2, h: 2.3, l: 6, cab: .35, vmax: 24, acel: 9, roda: .55, preco: 60000 },
  { marca: 'Mercedes', nome: 'Sprinter', cor: 0xf2f2f2, w: 2, h: 2.5, l: 5.6, cab: .8, vmax: 27, acel: 10, roda: .45, preco: 45000 },
  { marca: 'Táxi', nome: 'Sedan', cor: 0xffc400, w: 1.8, h: 1.45, l: 4.5, cab: .5, vmax: 33, acel: 13, preco: 15000 },
  { marca: 'Polícia', nome: 'Viatura', cor: 0x1e3a8a, teto: 0xffffff, w: 1.9, h: 1.5, l: 4.7, cab: .5, vmax: 40, acel: 18, preco: 70000 }
];

export class Carro {
  constructor(scene, x, z, mod, yaw) {
    const m = this.m = mod, mt = c => new THREE.MeshLambertMaterial({ color: c }), hb = m.h * .5, hc = m.h * .38, r = m.roda || .38;
    this.nome = m.marca + ' ' + m.nome; this.obj = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(m.w, hb, m.l), mt(m.cor)); b.position.y = .35 + hb / 2;   // carroceria (children[0])
    const k = new THREE.Mesh(new THREE.BoxGeometry(m.w * .92, hc, m.l * m.cab), mt(m.teto || 0x223344)); k.position.set(0, .35 + hb + hc / 2, m.l * .05);
    this.obj.add(b, k);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .3, 10), mt(0x111111));
      w.rotation.z = Math.PI / 2; w.position.set(sx * m.w / 2, r, sz * m.l * .32); this.obj.add(w);
    }
    this.obj.position.set(x, 0, z); this.yaw = yaw; this.v = 0; this.hp = 100; scene.add(this.obj);
  }
  atualizar(dt, dirigindo) {
    if (dirigindo) {
      const a = (teclas.KeyW ? 1 : 0) - (teclas.KeyS ? 1 : 0);
      this.v += a * (a * this.v < 0 ? 30 : this.m.acel) * dt;
      if (teclas.Space) this.v *= Math.max(0, 1 - 4 * dt);
      const dir = (teclas.KeyA ? 1 : 0) - (teclas.KeyD ? 1 : 0);
      this.yaw += dir * dt * 1.8 * Math.max(-1, Math.min(1, this.v / 8));
    }
    this.v = Math.max(-8, Math.min(this.m.vmax, this.v * Math.max(0, 1 - .5 * dt)));
    const p = this.obj.position, dx = -Math.sin(this.yaw) * this.v * dt, dz = -Math.cos(this.yaw) * this.v * dt;
    if (colide(p.x + dx, p.z + dz, Math.max(1.6, this.m.l / 2.6))) { this.hp = Math.max(0, this.hp - Math.abs(this.v) * .8); this.v *= -.3; }
    else { p.x += dx; p.z += dz; }
    this.obj.rotation.y = this.yaw;
  }
}
