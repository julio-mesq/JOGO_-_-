// Interface: HUD, minimapa, mapa grande com GPS (M), inventário (Tab), notificações, dicas e tela de morte.
import * as A from './audio.js';
import { LUGARES } from './world.js';
const $ = id => document.getElementById(id); let tn;
export function hud(j, est, a, mun, karma) {
  $('hp').style.width = Math.max(0, j.hp) + '%'; $('st').style.width = j.st + '%';
  $('money').textContent = '$' + j.dinheiro + '  ' + karma; $('stars').textContent = '★'.repeat(est);
  $('info').textContent = j.veiculo ? j.veiculo.nome + ' · ' + Math.round(Math.abs(j.veiculo.v) * 3.6) + ' km/h' : a.melee ? a.n : a.n + ' ' + mun + '/' + a.mun;
}
export const dica = t => { $('dica').textContent = t; };
export const wasted = on => $('wasted').classList.toggle('on', on);
export function notificar(t) { const e = $('nt'); e.textContent = t; e.classList.add('on'); A.notif(); clearTimeout(tn); tn = setTimeout(() => e.classList.remove('on'), 2500); }
export const alternar = id => $(id).classList.toggle('on');
export function inventario(j, arm, m, k, ex = '') {
  $('inv').innerHTML = '<h3>Inventário</h3>' + arm.map((a, i) => `<div>[${i + 1}] ${a.n} — ${a.melee ? '∞' : m[i] + '/' + a.mun}</div>`).join('') + `<div>Dinheiro: $${j.dinheiro}</div><div>Karma: ${k}</div><div>${ex}</div>`;
}
// esc = pixels por metro. Rota do GPS (ciano) segue as ruas até o destino da missão.
function desenhar(cv, esc, cx, cz, jog, npcs, carros, m) {
  const c = cv.getContext('2d'), w = cv.width, h = cv.height, X = x => w / 2 + (x - cx) * esc, Z = z => h / 2 + (z - cz) * esc;
  c.fillStyle = '#1b2630'; c.fillRect(0, 0, w, h); c.strokeStyle = '#4b5b68'; c.lineWidth = Math.max(2, 14 * esc); c.beginPath();
  for (let k = -10; k <= 10; k++) { c.moveTo(X(k * 100), 0); c.lineTo(X(k * 100), h); c.moveTo(0, Z(k * 100)); c.lineTo(w, Z(k * 100)); }
  c.stroke();
  const pt = (x, z, cor, r) => { c.fillStyle = cor; c.beginPath(); c.arc(X(x), Z(z), r, 0, 7); c.fill(); };
  const q = (jog.veiculo ? jog.veiculo.obj : jog.obj).position;
  if (m && m.x !== undefined) {
    const sz = Math.round(q.z / 100) * 100, mx = Math.round(m.x / 100) * 100, mz = Math.round(m.z / 100) * 100;
    c.strokeStyle = '#00e5ff'; c.lineWidth = Math.max(3, 8 * esc); c.beginPath();
    [[q.x, q.z], [q.x, sz], [mx, sz], [mx, mz], [m.x, m.z]].forEach(([x, z], k) => k ? c.lineTo(X(x), Z(z)) : c.moveTo(X(x), Z(z))); c.stroke();
    pt(m.x, m.z, '#00e5ff', 7);
  }
  LUGARES.forEach(l => pt(l.x, l.z, l.tipo === 'mercado' ? '#2ecc71' : l.tipo === 'casa' ? '#3498db' : '#e74c3c', 5));
  carros.forEach(k => pt(k.obj.position.x, k.obj.position.z, '#ffcc00', 3));
  npcs.forEach(n => pt(n.obj.position.x, n.obj.position.z, n.policia ? '#3b82f6' : '#ddd', 2));
  pt(q.x, q.z, '#fff', 5);
  if (esc < .5) { c.fillStyle = '#fff'; c.font = '14px sans-serif'; c.fillText('Verde: mercado | Vermelho: posto | Azul: casa | Amarelo: carro | Ciano: GPS', 10, h - 10); }
}
export function mapas(jog, npcs, carros, m) {
  const p = (jog.veiculo ? jog.veiculo.obj : jog.obj).position;
  desenhar($('mini'), .8, p.x, p.z, jog, npcs, carros, m);
  if ($('mapa').classList.contains('on')) desenhar($('mapa'), .35, 0, 0, jog, npcs, carros, m);
}
