// Missão principal (7 etapas + final por karma) e missões dadas por telefone. Destino atual = GPS.
import * as THREE from 'three';
import { LUGARES } from './world.js';
const MISSOES = [
  { t: 'Vá até o marcador amarelo', x: 200, z: -100, tipo: 'ir', r: 6, d: 300 },
  { t: 'Dirija um carro até o marcador', x: -300, z: 300, tipo: 'carro', r: 8, d: 500 },
  { t: 'Elimine 5 pessoas', tipo: 'matar', n: 5, d: 800 },
  { t: 'Vá ao mercado marcado no mapa', lugar: 'mercado', tipo: 'ir', r: 28, d: 400 },
  { t: 'Leve um carro até o posto', lugar: 'posto', tipo: 'carro', r: 28, d: 600 },
  { t: 'Elimine 8 pessoas', tipo: 'matar', n: 8, d: 1200 },
  { t: 'Chegue ao marcador com 2+ estrelas', x: 0, z: -600, tipo: 'ir', r: 8, d: 2000, est: 2 }
];
let i = 0, mortes = 0, extra = null, farol;
const dest = () => extra || MISSOES[i], rnd = () => Math.round((Math.random() * 2 - 1) * 8) * 100;
function posicionar() { const m = dest(); farol.visible = !!m && m.x !== undefined; if (farol.visible) farol.position.set(m.x, 40, m.z); }
export function iniciar(scene) {
  for (const m of MISSOES) if (m.lugar) { const l = LUGARES.find(k => k.tipo === m.lugar); m.x = l.x; m.z = l.z; }
  farol = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 80, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: .35, side: THREE.DoubleSide }));
  scene.add(farol); posicionar();
}
// Missão de um contato do telefone (retorna false se já houver uma)
export function dar(tipo) {
  if (extra) return false;
  const p = LUGARES.filter(l => l.tipo === 'posto')[0], mk = LUGARES.find(l => l.tipo === 'mercado');
  const T = { entrega: { t: 'Entrega: leve um carro até o ponto', tipo: 'carro', x: rnd(), z: rnd(), r: 10, d: 400 }, matar: { t: 'Cobrança: elimine 4 alvos', tipo: 'matar', n: 4, d: 700 },
    posto: { t: 'Encontre o informante no posto', tipo: 'ir', x: p.x, z: p.z, r: 28, d: 300 }, fuga: { t: 'Fuga: chegue ao ponto com 2+ estrelas', tipo: 'ir', x: rnd(), z: rnd(), r: 10, est: 2, d: 1200 },
    taxi: { t: 'Táxi: leve o passageiro (de carro) até o ponto', tipo: 'carro', x: rnd(), z: rnd(), r: 10, d: 350 }, mercado: { t: 'Encomenda: vá ao mercado', tipo: 'ir', x: mk.x, z: mk.z, r: 28, d: 250 } };
  extra = { ...T[tipo], mortes: 0 }; posicionar(); return true;
}
export const matou = () => { if (extra?.tipo === 'matar') extra.mortes++; else if (!extra && MISSOES[i]?.tipo === 'matar') mortes++; };
export const atual = dest;
export function texto(jog) {
  const m = dest(); if (!m) return 'Missão principal concluída';
  const p = jog.veiculo ? jog.veiculo.obj.position : jog.obj.position;
  return (m === extra ? '📞 ' : 'Missão: ') + m.t + (m.tipo === 'matar' ? ` (${m === extra ? extra.mortes : mortes}/${m.n})` : '') + (m.x !== undefined ? ` — GPS: ${Math.round(Math.hypot(p.x - m.x, p.z - m.z))} m` : '');
}
export function atualizar(jog, est) {
  const m = dest(); if (!m) return null;
  const p = jog.veiculo ? jog.veiculo.obj.position : jog.obj.position, perto = m.x !== undefined && Math.hypot(p.x - m.x, p.z - m.z) < m.r;
  const ok = m.tipo === 'ir' ? perto && (!m.est || est >= m.est) : m.tipo === 'carro' ? perto && !!jog.veiculo : (m === extra ? extra.mortes : mortes) >= m.n;
  if (!ok) return null;
  jog.dinheiro += m.d; const eraExtra = m === extra;
  if (eraExtra) extra = null; else { i++; mortes = 0; }
  posicionar(); return { recompensa: m.d, fim: !eraExtra && !MISSOES[i] };
}
export const indice = () => i;
export const definir = v => { i = Math.min(v, MISSOES.length); posicionar(); };
