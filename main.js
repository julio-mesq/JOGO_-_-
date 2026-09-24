// City Rush — ponto de entrada: liga todos os módulos e roda o loop do jogo.
import * as THREE from 'three';
import { criarMundo, LUGARES, INT } from './src/world.js';
import { Jogador, teclas, animar, trocarArma, K2 } from './src/player.js';
import { Carro, MODELOS } from './src/vehicles.js';
import { criarNPCs, criarOrganizador } from './src/npcs.js';
import { ARMAS, FORMAS } from './src/weapons.js';
import * as A from './src/audio.js';
import * as UI from './src/ui.js';
import * as Esc from './src/choices.js';
import { atualizarCamera } from './src/pov.js';
import * as FX from './src/effects.js';
import * as M from './src/missions.js';
import * as Tel from './src/phone.js';
import * as DB from './src/db.js';
import * as MG from './src/minigames.js';
import * as TR from './src/traffic.js';
import { criarInterior } from './src/interiors.js';
import { criarClima } from './src/weather.js';

const cv = document.getElementById('c'), $ = id => document.getElementById(id);
const passo = async (p, t) => { $('cb').style.width = p + '%'; $('ct').textContent = t; await new Promise(r => setTimeout(r, 40)); }; // tela de carregamento
await passo(5, 'Abrindo banco de dados…'); await DB.abrir(); const save = await DB.ler() || {};

const fraco = (navigator.hardwareConcurrency || 4) <= 4; // detecção de dispositivo fraco
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !fraco });
renderer.setPixelRatio(fraco ? 1 : Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); scene.fog = new THREE.Fog(0x87ceeb, 150, fraco ? 500 : 900);
const cam = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, .1, 1500), cam2 = new THREE.PerspectiveCamera(70, 1, .1, 1500); scene.add(cam);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); });

await passo(25, 'Construindo a cidade…');
const ceu = criarMundo(scene), interior = criarInterior(scene);
await passo(55, 'Criando pessoas, trânsito e aviões…');
const jog = new Jogador(scene), jog2 = new Jogador(scene, { k: K2, cor: 0xb03a2e, x: 9 }), npcs = criarNPCs(scene), org = criarOrganizador(scene);
jog2.obj.visible = false;
FX.iniciar(scene); M.iniciar(scene); MG.iniciar(scene);
const clima = criarClima(scene), sem = TR.criarSemaforos(scene), av = TR.criarAvioes(scene), transito = Array.from({ length: 10 }, (_, i) => new TR.Transito(scene, i));
{ // placa do organizador de mini-jogos
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#000a'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#ffcc00'; x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.fillText('MINI-JOGOS [G]', 128, 42);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, side: THREE.DoubleSide })); s.position.set(0, 2.3, 0); org.obj.add(s);
}
const cores = [0xff0000, 0x000000, 0xffffff, 0xffcc00, 0x1e90ff];
const carros = Array.from({ length: 14 }, (_, i) => {
  const h = i % 2, rua = (i % 5 - 2) * 100, livre = (Math.random() - .5) * 400;
  return i === 0 ? new Carro(scene, 0, 32, MODELOS[1], 0) : new Carro(scene, h ? livre : rua, h ? rua : livre, MODELOS[i % MODELOS.length], h * Math.PI / 2);
});
const frota = new Map(); // carros comprados (garagem)
function chamar(i) {
  let c = frota.get(i); const p = jog.obj.position;
  if (!c) { c = new Carro(scene, p.x + 4, p.z + 4, MODELOS[i], jog.yaw); frota.set(i, c); carros.push(c); } else { c.obj.position.set(p.x + 4, 0, p.z + 4); c.hp = 100; c.v = 0; }
  UI.notificar('Seu ' + c.nome + ' chegou!');
}
const fp = new THREE.Group(); cam.add(fp); // arma visível na primeira pessoa
function armaFP(i) { fp.clear(); const d = FORMAS[i]; if (!d) return; const g = new THREE.Mesh(new THREE.BoxGeometry(...d), new THREE.MeshLambertMaterial({ color: i === 5 ? 0x4a5d3a : 0x222222 })); g.position.set(.22, -.2, -.45 - d[2] / 2); fp.add(g); }
armaFP(0);

await passo(80, 'Carregando seu progresso…');
jog.dinheiro = save.dinheiro ?? 500; Tel.carregar(save.tel); M.definir(save.missao || 0); Esc.carregar(save.karma);
const rec = { corrida: save.corrida || 0, kills: save.kills || 0 };
let apagando = false;
const gravar = () => { if (!apagando) DB.gravar({ dinheiro: jog.dinheiro, tel: Tel.dados(), missao: M.indice(), karma: Esc.estado, corrida: rec.corrida, kills: rec.kills }); };
setInterval(gravar, 8000); addEventListener('beforeunload', gravar);
Tel.dados().garagem.forEach(i => { const c = new Carro(scene, 4 + (i % 4) * 5, 45 + i * 5, MODELOS[i], 0); frota.set(i, c); carros.push(c); }); // carros comprados aparecem perto do início

let rodando = false, telaAberta = false, pov = 0, povAntes = 0, estrelas = 0, semCrime = 0, arma = 0, tiroT = 0, tempoDia = .25, tempoJogo = 0, buf = '', passoT = 0, lento = 0, reduzido = false, crime = 0, semMouse = 0, split = false, cool2 = 0, saida = null;
const municao = ARMAS.map(a => a.mun);
jog.aoRenascer = () => { INT.on = false; UI.wasted(false); UI.notificar('Você foi levado ao hospital (-10% do dinheiro)'); };
function iniciarJogo(t) { const r = MG.comecar(t, jog); UI.notificar(r || (t === 'corrida' ? 'Corrida! Passe pelos 6 pontos em 90 s' : 'Sobreviva por 60 s!')); }
Tel.iniciar(jog, {
  ligar: (t, n) => UI.notificar(M.dar(t) ? n + ': "Tenho um trabalho pra você. Veja o GPS."' : 'Termine a missão atual primeiro.'),
  chamar, jogo: t => { Tel.alternar(false); iniciarJogo(t); }, aviso: UI.notificar, salvar: gravar,
  aoAbrir: on => { telaAberta = on; if (on) document.exitPointerLock(); else cv.requestPointerLock?.(); }
});
$('vol').oninput = e => A.volume(e.target.value / 100);
$('novo').onclick = async e => { e.stopPropagation(); apagando = true; await DB.apagar(); location.reload(); };
$('menu').onclick = () => { cv.requestPointerLock?.(); rodando = true; $('menu').classList.add('off'); A.iniciar(); A.click(); };
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && !telaAberta) { rodando = false; $('menu').classList.remove('off'); } });
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('mousedown', e => { if (!rodando || !document.pointerLockElement) return; if (e.button === 0) teclas.Mouse0 = true; if (e.button === 2) jog.mira = true; });
addEventListener('mouseup', e => { if (e.button === 0) teclas.Mouse0 = false; if (e.button === 2) jog.mira = false; });
addEventListener('mousemove', e => {
  if (!document.pointerLockElement) return; const s = jog.mira ? .0012 : .0025; semMouse = 0;
  if (jog.veiculo) jog.olho -= e.movementX * s; else jog.yaw -= e.movementX * s; // no carro a câmera gira livre
  jog.pitch = Math.max(-1, Math.min(1, jog.pitch - e.movementY * s));
});

function loja(t) {
  const c = t === 'mercado' ? 50 : 30; if (jog.dinheiro < c) return UI.notificar('Dinheiro insuficiente');
  jog.dinheiro -= c;
  if (t === 'mercado') { jog.hp = Math.min(100, jog.hp + 50); UI.notificar('Caixa: obrigado! (+50 de vida)'); } else { ARMAS.forEach((a, i) => municao[i] = a.mun); UI.notificar('Munição reabastecida'); }
}
function entrar(l) { INT.on = true; INT.tipo = l.tipo; interior.cor(l.tipo); saida = { x: l.x, z: l.z + 18 }; povAntes = pov; pov = 1; jog.obj.position.set(INT.x, 0, INT.z + 4); jog.yaw = 0; jog.pitch = 0; UI.notificar('Vá até o balcão e aperte E para comprar'); }
function sair() { INT.on = false; pov = povAntes; jog.obj.position.set(saida.x, 0, saida.z); }
function casa(l) { if (Tel.possui(l.idx)) { jog.hp = 100; gravar(); UI.notificar('Você descansou em casa. Progresso salvo!'); } else UI.notificar('Casa à venda — compre pelo celular (T)'); }

addEventListener('keydown', e => {
  const k = e.code; buf = (buf + e.key).toLowerCase().slice(-7);
  if (buf === 'hesoyam') { jog.hp = 100; jog.dinheiro += 250000; UI.notificar('Cheat ativado!'); }
  if (k === 'Tab') e.preventDefault();
  if (k === 'Escape' && telaAberta) Tel.alternar(false);
  if (!rodando || jog.morto) return;
  if (k === 'KeyT') Tel.alternar();
  if (Esc.aberto()) { // diálogo aberto: 1-3 escolhem
    const o = /^Digit[1-3]$/.test(k) && Esc.escolher(+k.slice(5) - 1);
    if (o) { if (o.mg) iniciarJogo(o.mg); if (o.d !== undefined) { jog.dinheiro += o.d; if (o.e) { estrelas = Math.min(5, estrelas + o.e); semCrime = 0; } UI.notificar('Karma: ' + Esc.rotulo()); } }
    return;
  }
  if (k === 'Tab') { UI.inventario(jog, ARMAS, municao, Esc.rotulo(), `Recorde de corrida: ${rec.corrida ? rec.corrida.toFixed(1) + ' s' : '—'} · Abates: ${rec.kills}`); UI.alternar('inv'); }
  if (k === 'KeyM') UI.alternar('mapa');
  if (k === 'KeyK') UI.notificar(clima.alternar() ? 'Chuva ligada' : 'Chuva desligada');
  if (k === 'KeyP') document.body.classList.toggle('foto');
  if (k === 'KeyY') { split = !split; jog2.obj.visible = split; if (split) { jog2.obj.position.copy(jog.obj.position); jog2.obj.position.x += 2; } $('hud2').style.display = split ? 'block' : 'none'; }
  if (k === 'KeyB' && jog.veiculo) { jog.veiculo.obj.children[0].material.color.setHex(cores[Math.random() * 5 | 0]); UI.notificar('Cor alterada'); }
  if (jog.veiculo && (k === 'ArrowLeft' || k === 'ArrowRight')) UI.notificar('📻 ' + A.radio(k === 'ArrowRight' ? 1 : -1));
  if (k === 'KeyV') { if (jog.veiculo) pov = pov === 4 ? 0 : 4; else do pov = (pov + 1) % 5; while (pov === 4); } // no carro: 3ª pessoa <-> interno
  if (k === 'KeyR') { municao[arma] = ARMAS[arma].mun; A.click(); }
  if (/^Digit[1-7]$/.test(k)) { arma = +k.slice(5) - 1; trocarArma(jog.obj, arma); armaFP(arma); A.click(); }
  if (k === 'KeyH' && jog.veiculo) A.buzina();
  if (k === 'KeyG' && !jog.veiculo) {
    if (org.obj.position.distanceTo(jog.obj.position) < 5) Esc.abrir('Rafa: "Quer competir?"', [{ t: 'Corrida (6 pontos, 90 s)', mg: 'corrida' }, { t: 'Sobrevivência (60 s)', mg: 'sobrevivencia' }, { t: 'Agora não' }]);
    else if (npcs.some(n => !n.policia && n.obj.position.distanceTo(jog.obj.position) < 6)) Esc.abrir();
  }
  if (k === 'KeyE') {
    const p = jog.obj.position;
    if (jog.veiculo) { const c = jog.veiculo, q = c.obj.position; p.set(q.x + Math.cos(c.yaw) * 3, 0, q.z - Math.sin(c.yaw) * 3); jog.yaw = c.yaw; jog.olho = 0; jog.veiculo = null; }
    else if (INT.on) { if (Math.hypot(p.x - interior.caixa.x, p.z - interior.caixa.z) < 4) loja(INT.tipo); else if (p.z > INT.z + 3.5) sair(); else UI.notificar('Chegue perto do balcão para comprar ou volte à porta.'); }
    else { const c = carros.find(v => v.obj.position.distanceTo(p) < 8), l = LUGARES.find(l => Math.hypot(l.x - p.x, l.z - p.z) < 26); if (c) jog.veiculo = c; else if (l) l.tipo === 'casa' ? casa(l) : entrar(l); }
    A.click();
  }
});

const ray = new THREE.Raycaster(), tmp = new THREE.Vector3();
function tracante(a, b) { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color: 0xffff00 })); scene.add(l); setTimeout(() => { scene.remove(l); l.geometry.dispose(); }, 60); }
function dano(n, v) { // NPC ferido: foge ou revida
  n.hp -= v; crime = Math.max(crime, n.policia ? 2 : 1);
  if (n.hp <= 0) { jog.dinheiro += 50; M.matou(); rec.kills++; n.reset(); } else if (!n.policia) { if (Math.random() < .5) n.briga = 20; else n.fuga = 6; }
}
function socar(j) {
  j.obj.userData.socoAte = j.tt + .25; A.soco(); const p = j.obj.position, fx = -Math.sin(j.yaw), fz = -Math.cos(j.yaw);
  for (const n of npcs) { const dx = n.obj.position.x - p.x, dz = n.obj.position.z - p.z; if (Math.hypot(dx, dz) < 2.3 && dx * fx + dz * fz > 0) { dano(n, 20); break; } }
}
function atirar(t) {
  const a = ARMAS[arma];
  if (jog.veiculo || jog.morto || t < tiroT + a.cad) return;
  if (a.melee) { tiroT = t; socar(jog); return; }
  if (municao[arma] <= 0) return;
  tiroT = t; municao[arma]--; A.tiro(arma); jog.pitch = Math.min(1, jog.pitch + .006 * (arma + 1)); // recuo
  ray.setFromCamera({ x: 0, y: 0 }, cam);
  const o = ray.ray.origin.clone(), ini = jog.obj.position.clone().setY(1.4);
  for (let p = 0; p < a.pel; p++) {
    const d = ray.ray.direction.clone().add(new THREE.Vector3(...[0, 0, 0].map(() => (Math.random() - .5) * a.esp))).normalize(), r = new THREE.Ray(o, d);
    let alvo = null, md = a.alc;
    for (const n of npcs) { tmp.copy(n.obj.position).setY(1.2); const di = tmp.distanceTo(o); if (di < md && r.distanceSqToPoint(tmp) < .5) { alvo = n; md = di; } }
    const fim = o.clone().addScaledVector(d, alvo ? md : Math.min(a.alc, 80));
    tracante(ini, fim);
    if (alvo) dano(alvo, a.dano);
    if (a.area) { FX.explodir(fim, a.area); A.tiro(5); npcs.forEach(n => { if (n.obj.position.distanceTo(fim) < a.area) dano(n, 100); }); }
  }
  npcs.forEach(n => { if (n.obj.position.distanceTo(jog.obj.position) < 40 && n.briga <= 0) n.fuga = 4; });
}

await passo(100, 'Pronto!'); $('carga').classList.add('off');
let ultimo = performance.now();
function loop(agora) {
  requestAnimationFrame(loop);
  const bruto = (agora - ultimo) / 1000, dt = Math.min(.05, bruto); ultimo = agora;
  if (!rodando) { A.motor(-1); A.sirene(false); return; }
  lento = bruto > 1 / 35 ? lento + bruto : Math.max(0, lento - bruto); // FPS baixo por 3 s => reduz qualidade
  if (lento > 3 && !reduzido) { reduzido = true; renderer.setPixelRatio(1); clima.reduzir(400); UI.notificar('Qualidade reduzida'); }
  tempoDia = (tempoDia + dt / 420) % 1; tempoJogo += dt;
  jog.atualizar(dt); carros.forEach(c => c.atualizar(dt, c === jog.veiculo));
  if (split) { jog2.atualizar(dt); if (jog2.hp <= 0 && !jog2.morto) jog2.morrer(); if (teclas.KeyO && !jog2.morto && agora / 1000 > cool2 + .45) { cool2 = agora / 1000; socar(jog2); } }
  const alvo = jog.veiculo ? jog.veiculo.obj.position : jog.obj.position;
  if (jog.veiculo) { semMouse += dt; if (semMouse > 2.5) jog.olho *= 1 - 3 * dt; } // câmera volta ao centro se o mouse parar
  let dn = 0; npcs.forEach(n => { dn += n.atualizar(dt, alvo, estrelas); animar(n.obj, n.cacando || n.briga > 0 ? 5 : n.fuga > 0 ? 8 : 1.6, n.tt); });
  org.atualizar(dt, alvo, 0); animar(org.obj, 0, org.tt);
  if (!jog.morto) jog.hp -= dn;
  if (jog.veiculo && Math.abs(jog.veiculo.v) > 8) npcs.forEach(n => { if (n.obj.position.distanceTo(alvo) < 2.6) { dano(n, 100); jog.veiculo.hp -= 3; } }); // atropelar
  sem.atualizar(tempoJogo); av.atualizar(dt);
  transito.forEach(t => { // carros de NPCs
    t.atualizar(dt, tempoJogo); const tp = t.c.obj.position;
    if (t.pausa <= 0 && !INT.on) {
      if (!jog.veiculo && !jog.morto && tp.distanceTo(jog.obj.position) < 2.6) { jog.hp -= 35; t.pausa = 3; jog.vy = 5; UI.notificar('Você foi atropelado!'); }
      else if (jog.veiculo && tp.distanceTo(jog.veiculo.obj.position) < 3.8) { jog.veiculo.v *= -.3; jog.veiculo.hp -= 10; t.pausa = 2; A.buzina(); }
    }
  });
  carros.forEach(c => { // fumaça com pouca vida; explosão ao chegar a 0
    if (c.hp > 0 && c.hp < 20 && Math.random() < dt * 8) FX.fumaca(c.obj.position);
    if (c.hp <= 0) {
      FX.explodir(c.obj.position, 8); A.tiro(5); npcs.forEach(n => { if (n.obj.position.distanceTo(c.obj.position) < 8) dano(n, 100); });
      if (jog.veiculo === c) { jog.veiculo = null; jog.hp -= 50; jog.obj.position.set(c.obj.position.x + 3, 0, c.obj.position.z); }
      c.hp = 100; c.v = 0; c.yaw = 0; c.obj.position.set(Math.round((Math.random() * 2 - 1) * 5) * 100, 0, (Math.random() - .5) * 400); UI.notificar('Carro explodiu!');
    }
  });
  FX.atualizar(dt); clima.atualizar(dt, alvo); Tel.tick(dt);
  if (crime) { estrelas = Math.min(5, estrelas + crime); semCrime = 0; crime = 0; }
  const rm = M.atualizar(jog, estrelas);
  if (rm) { UI.notificar('Missão concluída! +$' + rm.recompensa); gravar(); if (rm.fim) Esc.final(); }
  const rg = MG.atualizar(dt, jog, npcs);
  if (rg) { if (rg.ok) { jog.dinheiro += rg.premio; UI.notificar('🏆 Mini-jogo vencido! +$' + rg.premio); if (rg.tempo && (!rec.corrida || rg.tempo < rec.corrida)) rec.corrida = rg.tempo; gravar(); } else UI.notificar('Mini-jogo perdido!'); }
  semCrime += dt; if (estrelas > 0 && semCrime > 20) { estrelas--; semCrime = 0; }
  if (jog.hp <= 0 && !jog.morto) { jog.morrer(); estrelas = 0; UI.wasted(true); }
  if (!telaAberta && (teclas.KeyF || teclas.Mouse0)) atirar(agora / 1000);
  if (!jog.veiculo && !jog.morto && (teclas.KeyW || teclas.KeyA || teclas.KeyS || teclas.KeyD) && jog.obj.position.y === 0 && (passoT += dt) > (teclas.ShiftLeft ? .28 : .45)) { passoT = 0; A.passo(); }
  A.motor(jog.veiculo ? Math.abs(jog.veiculo.v) : -1); A.sirene(estrelas > 0);
  jog.obj.visible = !jog.veiculo && (pov !== 1 || jog.morto); fp.visible = pov === 1 && !jog.veiculo && !jog.morto && arma < 6;
  atualizarCamera(cam, agora, dt, jog, pov, jog.mira && !jog.veiculo ? (arma === 4 ? 18 : 42) : 0); ceu(tempoDia, alvo);
  let dica = '';
  if (!jog.veiculo && !jog.morto) {
    const p = jog.obj.position;
    if (INT.on) dica = Math.hypot(p.x - interior.caixa.x, p.z - interior.caixa.z) < 4 ? 'E: comprar ' + (INT.tipo === 'mercado' ? 'comida ($50)' : 'munição ($30)') : p.z > INT.z + 3.5 ? 'E: sair da loja' : '';
    else { const c = carros.find(v => v.obj.position.distanceTo(p) < 8), l = LUGARES.find(l => Math.hypot(l.x - p.x, l.z - p.z) < 26);
      dica = c ? 'E: entrar no ' + c.nome : l ? (l.tipo === 'casa' ? 'E: casa' : 'E: entrar no ' + (l.tipo === 'mercado' ? 'mercado' : 'posto')) : org.obj.position.distanceTo(p) < 5 ? 'G: falar com o Rafa (mini-jogos)' : ''; }
  }
  UI.dica(dica); $('missao').textContent = MG.texto() || M.texto(jog);
  UI.hud(jog, estrelas, ARMAS[arma], municao[arma], Esc.rotulo()); UI.mapas(jog, npcs, carros, MG.destino() || M.atual());
  if (split) {
    $('hud2').textContent = 'J2 ❤ ' + Math.max(0, jog2.hp | 0); const p2 = jog2.obj.position, w = innerWidth >> 1, h = innerHeight;
    cam2.position.lerp(new THREE.Vector3(p2.x + Math.sin(jog2.yaw) * 5, p2.y + 2.6, p2.z + Math.cos(jog2.yaw) * 5), 1 - Math.exp(-8 * dt)); cam2.lookAt(p2.x, p2.y + 1.5, p2.z);
    renderer.setScissorTest(true); renderer.setViewport(0, 0, w, h); renderer.setScissor(0, 0, w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); renderer.render(scene, cam);
    renderer.setViewport(w, 0, w, h); renderer.setScissor(w, 0, w, h); cam2.aspect = w / h; cam2.updateProjectionMatrix(); renderer.render(scene, cam2);
  } else { renderer.setScissorTest(false); renderer.setViewport(0, 0, innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); renderer.render(scene, cam); }
}
requestAnimationFrame(loop);
