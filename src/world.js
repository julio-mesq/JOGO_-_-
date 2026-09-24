// Mundo: ruas, prédios (InstancedMesh), praia, montanhas e ciclo dia/noite.
import * as THREE from 'three';
export const INT = { on: false, x: 3000, z: 3000, tipo: 'mercado' }; // sala do interior das lojas
export const LUGARES = []; // mercados e postos (interação, GPS e missões)
const lotes = new Map(); // colisão: prédios por quarteirão (100x100)
const R = (a, b) => a + Math.random() * (b - a);

// Retorna true se o ponto (x,z) com raio r bate em algum prédio
export function colide(x, z, r) {
  if (INT.on) return Math.abs(x - INT.x) > 7.4 || Math.abs(z - INT.z) > 5.4;
  if (Math.abs(x) > 1090 || Math.abs(z) > 1090) return true;
  const a = lotes.get(Math.floor(x / 100) + ',' + Math.floor(z / 100));
  if (!a) return false;
  for (const l of a) if (Math.abs(x - l.x) < l.w + r && Math.abs(z - l.z) < l.d + r) return true;
  return false;
}

export function criarMundo(scene) {
  const mat = c => new THREE.MeshLambertMaterial({ color: c });
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), mat(0xa0a0a0));
  chao.rotation.x = -Math.PI / 2; scene.add(chao);

  // Ruas (#2b2b2b) com faixa central branca, a cada 100 m
  const asf = mat(0x2b2b2b), faixa = mat(0xffffff);
  for (let i = -10; i <= 10; i++) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(14, .1, 2000), asf); a.position.set(i * 100, .05, 0);
    const b = new THREE.Mesh(new THREE.BoxGeometry(2000, .1, 14), asf); b.position.set(0, .05, i * 100);
    const fa = new THREE.Mesh(new THREE.BoxGeometry(.3, .1, 2000), faixa); fa.position.set(i * 100, .1, 0);
    const fb = new THREE.Mesh(new THREE.BoxGeometry(2000, .1, .3), faixa); fb.position.set(0, .1, i * 100);
    scene.add(a, b, fa, fb);
  }

  // Prédios: 4 por quarteirão (vidro azul, concreto, tijolo)
  // Janelas: textura procedural (escura de dia) + mapa emissivo que acende à noite
  const texJan = luz => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = luz ? '#000' : '#fff'; g.fillRect(0, 0, 64, 128);
    for (let y = 6; y < 124; y += 12) for (let x = 6; x < 58; x += 12) { g.fillStyle = luz ? (Math.random() < .5 ? '#ffd76a' : '#000') : '#1a2733'; g.fillRect(x, y, 7, 7); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const matPredio = new THREE.MeshLambertMaterial({ map: texJan(false), emissive: 0xffffff, emissiveMap: texJan(true), emissiveIntensity: 0 });
  const cores = [0x4a90e2, 0x808080, 0xa0522d];
  // Prédios especiais (1º lote de alguns quarteirões): mercados e postos, baixos e coloridos, com placa
  const ESP = { '1,0': 'mercado', '-3,2': 'mercado', '4,-3': 'mercado', '-2,-4': 'mercado', '0,1': 'posto', '3,3': 'posto', '-4,-1': 'posto', '2,-4': 'posto', '2,2': 'casa0', '-1,3': 'casa1', '-3,-2': 'casa2' };
  const placa = (tipo, x, z, h) => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const g = cv.getContext('2d');
    g.fillStyle = tipo === 'mercado' ? '#0b6b2e' : tipo === 'posto' ? '#b00020' : '#7a4a10'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#fff'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.fillText(({ mercado: 'MERCADO', posto: 'POSTO 24h', casa: 'CASA' })[tipo], 128, 46);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(12, 3), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), side: THREE.DoubleSide })); s.position.set(x, h + 2, z); scene.add(s);
  };
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matPredio, 1600);
  const m = new THREE.Matrix4(), c = new THREE.Color(); let n = 0;
  for (let bx = -10; bx < 10; bx++) for (let bz = -10; bz < 10; bz++) {
    const arr = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const esp = i + j === 0 ? ESP[bx + ',' + bz] : null, w = esp ? 30 : R(20, 34), d = esp ? 30 : R(20, 34), h = esp ? 7 : R(10, 70);
      const x = bx * 100 + 28 + i * 44, z = bz * 100 + 28 + j * 44;
      m.compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d));
      im.setMatrixAt(n, m); im.setColorAt(n, c.setHex(esp ? (esp === 'mercado' ? 0x2ecc71 : esp === 'posto' ? 0xe74c3c : 0xc9a27e) : cores[Math.random() * 3 | 0])); n++;
      if (esp) { const ca = esp.startsWith('casa'); LUGARES.push({ tipo: ca ? 'casa' : esp, idx: ca ? +esp[4] : 0, x, z }); placa(ca ? 'casa' : esp, x, z + d / 2 + .3, h); }
      arr.push({ x, z, w: w / 2, d: d / 2 });
    }
    lotes.set(bx + ',' + bz, arr);
  }
  im.frustumCulled = false; scene.add(im);

  // Árvores (tronco #5b3a1e, folhas #2e8b57) e postes de luz nas calçadas
  const tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(.25, .3, 3, 6), mat(0x5b3a1e), 800), fo = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.8, 0), mat(0x2e8b57), 800);
  const po = new THREE.InstancedMesh(new THREE.CylinderGeometry(.1, .1, 7, 6), mat(0x555555), 400), lu = new THREE.InstancedMesh(new THREE.SphereGeometry(.4, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffe9a0 }), 400);
  const uni = new THREE.Vector3(1, 1, 1), qi = new THREE.Quaternion(); let ia = 0, ib = 0;
  const poe = (o, k, x, y, z) => { m.compose(new THREE.Vector3(x, y, z), qi, uni); o.setMatrixAt(k, m); };
  for (let bx = -10; bx < 10; bx++) for (let bz = -10; bz < 10; bz++) {
    for (const [x, z] of [[9, 36], [91, 64]]) { poe(tr, ia, bx * 100 + x, 1.5, bz * 100 + z); poe(fo, ia, bx * 100 + x, 4.2, bz * 100 + z); ia++; }
    poe(po, ib, bx * 100 + 91, 3.5, bz * 100 + 15); poe(lu, ib, bx * 100 + 91, 7.2, bz * 100 + 15); ib++;
  }
  for (const o of [tr, fo, po, lu]) { o.frustumCulled = false; scene.add(o); }

  // Praia (areia + mar) ao sul e montanhas ao redor
  const areia = new THREE.Mesh(new THREE.BoxGeometry(2400, .1, 100), mat(0xf4e2a1)); areia.position.set(0, .03, 1050);
  const mg = new THREE.PlaneGeometry(2400, 100, 80, 4); mg.rotateX(-Math.PI / 2); const mar = new THREE.Mesh(mg, mat(0x1e90ff)); mar.position.set(0, .3, 1150); const mp = mg.attributes.position; // mar com ondas
  scene.add(areia, mar);
  // Praia leste + guarda-sóis nas duas praias
  const areia2 = new THREE.Mesh(new THREE.BoxGeometry(100, .1, 2000), mat(0xf4e2a1)); areia2.position.set(1050, .03, 0);
  const mar2 = new THREE.Mesh(new THREE.BoxGeometry(100, .1, 2000), mat(0x1e90ff)); mar2.position.set(1150, .04, 0); scene.add(areia2, mar2);
  const gs = new THREE.InstancedMesh(new THREE.ConeGeometry(1.6, .7, 8), new THREE.MeshLambertMaterial(), 60), gp = new THREE.InstancedMesh(new THREE.CylinderGeometry(.05, .05, 2.2, 5), mat(0xeeeeee), 60);
  for (let k = 0; k < 60; k++) {
    const sul = k < 30, x = sul ? R(-900, 900) : 1010 + R(0, 60), z = sul ? 1010 + R(0, 60) : R(-900, 900);
    m.compose(new THREE.Vector3(x, 2.4, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); gs.setMatrixAt(k, m); gs.setColorAt(k, c.setHex([0xff3b3b, 0xffd23b, 0x3bb0ff, 0xffffff][k % 4]));
    m.compose(new THREE.Vector3(x, 1.1, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); gp.setMatrixAt(k, m);
  }
  gs.frustumCulled = gp.frustumCulled = false; scene.add(gs, gp);
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2, mt = new THREE.Mesh(new THREE.ConeGeometry(R(120, 180), R(150, 300), 6), mat(i % 2 ? 0x3cb371 : 0x8b4513));
    mt.position.set(Math.cos(a) * 1350, 100, Math.sin(a) * 1350); scene.add(mt);
  }

  // Estrelas (aparecem à noite)
  const ea = new Float32Array(1200); for (let i = 0; i < 400; i++) { const u = Math.random() * 6.283, v = Math.random() * 1.4, r = 1000; ea[i * 3] = Math.cos(u) * Math.cos(v) * r; ea[i * 3 + 1] = Math.sin(v) * r + 50; ea[i * 3 + 2] = Math.sin(u) * Math.cos(v) * r; }
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ea, 3));
  const estrelas = new THREE.Points(eg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.5, sizeAttenuation: false, transparent: true, opacity: 0, fog: false })); estrelas.frustumCulled = false; scene.add(estrelas);
  // Luz do sol + céu dinâmico (azul -> laranja -> roxo)
  const sol = new THREE.DirectionalLight(0xffffff, 1.5); scene.add(sol, sol.target);
  const amb = new THREE.HemisphereLight(0x87ceeb, 0x444444, .6); scene.add(amb);
  const dia = new THREE.Color(0x87ceeb), por = new THREE.Color(0xff8c00), noite = new THREE.Color(0x191970);
  return function atualizarCeu(t, alvo) { // t: 0..1 = um dia completo
    const a = t * Math.PI * 2, h = Math.sin(a);
    sol.position.set(alvo.x + Math.cos(a) * 500, Math.sin(a) * 500, alvo.z + 200); sol.target.position.copy(alvo);
    const col = h > .3 ? dia.clone() : h > 0 ? por.clone().lerp(dia, h / .3) : por.clone().lerp(noite, Math.min(1, -h * 4));
    scene.background.copy(col); scene.fog.color.copy(col);
    sol.intensity = Math.max(.3, h * 1.6); amb.intensity = .6 + Math.max(0, h) * .4; // noite clara o bastante para jogar
    matPredio.emissiveIntensity = Math.min(1, Math.max(0, (.15 - h) * 4)); // janelas acendem à noite
    estrelas.position.copy(alvo); estrelas.material.opacity = Math.min(1, Math.max(0, -h * 3));
    const tt = performance.now() / 800; for (let i = 0; i < mp.count; i++) mp.setY(i, Math.sin(mp.getX(i) * .05 + tt) * .25 + Math.cos(mp.getZ(i) * .3 + tt) * .15); mp.needsUpdate = true; // ondas
  };
}
