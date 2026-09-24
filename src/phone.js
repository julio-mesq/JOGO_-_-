// Celular (T): contatos que dão missões, site (carros, casas, investimentos), garagem e mini-jogos. Mouse liberado enquanto aberto.
import { MODELOS } from './vehicles.js';
const $ = id => document.getElementById(id);
const CONTATOS = [{ n: 'Marcos', f: 'Entregas', t: 'entrega' }, { n: 'Tony', f: 'Cobranças', t: 'matar' }, { n: 'Lia', f: 'Informante', t: 'posto' }, { n: 'Chefe', f: 'Fugas', t: 'fuga' }, { n: 'Zé', f: 'Táxi', t: 'taxi' }, { n: 'Rita', f: 'Encomenda', t: 'mercado' }];
const CASAS = [{ n: 'Kitnet no centro', p: 40000, r: 200 }, { n: 'Casa com piscina', p: 180000, r: 900 }, { n: 'Cobertura', p: 600000, r: 3200 }];
const est = { aba: 'contatos', casas: [], garagem: [], inv: 0, t: 0 }; let J, cb;
const fmt = n => '$' + Math.round(n).toLocaleString('pt-BR');
export const dados = () => ({ casas: est.casas, garagem: est.garagem, inv: est.inv });
export const carregar = d => { if (d) Object.assign(est, d); };
export const possui = i => est.casas.includes(i);
export function iniciar(jog, callbacks) { J = jog; cb = callbacks; $('tel').onclick = e => { const a = e.target.dataset.a; if (a) { agir(...a.split(':')); render(); } }; }
export const aberto = () => $('tel').classList.contains('on');
export function alternar(on = !aberto()) { $('tel').classList.toggle('on', on); if (on) render(); cb.aoAbrir(on); }
function agir(tipo, v) {
  if (tipo === 'aba') { est.aba = v; return; }
  if (tipo === 'fechar') { alternar(false); return; }
  v = +v;
  if (tipo === 'ligar') cb.ligar(CONTATOS[v].t, CONTATOS[v].n);
  else if (tipo === 'jogo') cb.jogo(v ? 'sobrevivencia' : 'corrida');
  else if (tipo === 'chamar') cb.chamar(v);
  else if (tipo === 'carro') { const m = MODELOS[v]; if (est.garagem.includes(v)) cb.aviso('Já está na sua garagem'); else if (J.dinheiro >= m.preco) { J.dinheiro -= m.preco; est.garagem.push(v); cb.chamar(v); cb.salvar(); } else cb.aviso('Saldo insuficiente'); }
  else if (tipo === 'casa') { const c = CASAS[v]; if (est.casas.includes(v)) return; if (J.dinheiro >= c.p) { J.dinheiro -= c.p; est.casas.push(v); cb.aviso('Você comprou: ' + c.n); cb.salvar(); } else cb.aviso('Saldo insuficiente'); }
  else if (tipo === 'inv') { if (v === 0) { J.dinheiro += Math.round(est.inv); est.inv = 0; } else if (J.dinheiro >= v) { J.dinheiro -= v; est.inv += v; } else cb.aviso('Saldo insuficiente'); }
}
export function tick(dt) { // a cada 20 s: investimento varia e os aluguéis caem na conta
  est.t += dt; if (est.t < 20) return; est.t = 0; est.inv *= 1 + (Math.random() - .42) * .1;
  const r = est.casas.reduce((s, i) => s + CASAS[i].r, 0) / 3; if (r) { J.dinheiro += Math.round(r); cb.aviso('Aluguel recebido: ' + fmt(r)); }
  if (aberto()) render();
}
function render() {
  const abas = ['contatos', 'carros', 'casas', 'invest', 'garagem', 'jogos'], nomes = ['📞 Contatos', '🌐 Carros', '🌐 Casas', '🌐 Investir', '🚗 Garagem', '🎮 Jogos'];
  let h = `<div class="tb">${abas.map((a, i) => `<button class="${est.aba === a ? 'sel' : ''}" data-a="aba:${a}">${nomes[i]}</button>`).join('')}</div><h3>Saldo: ${fmt(J.dinheiro)}</h3>`;
  if (est.aba === 'contatos') h += CONTATOS.map((c, i) => `<button data-a="ligar:${i}">📞 ${c.n} — ${c.f}</button>`).join('');
  else if (est.aba === 'carros') h += MODELOS.map((m, i) => `<button data-a="carro:${i}">${m.marca} ${m.nome} — ${fmt(m.preco)}${est.garagem.includes(i) ? ' ✅' : ''}</button>`).join('');
  else if (est.aba === 'casas') h += CASAS.map((c, i) => `<button data-a="casa:${i}">${c.n} — ${fmt(c.p)} (aluguel ${fmt(c.r)}/min)${est.casas.includes(i) ? ' ✅' : ''}</button>`).join('');
  else if (est.aba === 'garagem') h += est.garagem.length ? est.garagem.map(i => `<button data-a="chamar:${i}">🚗 Chamar ${MODELOS[i].marca} ${MODELOS[i].nome}</button>`).join('') : '<p>Nenhum carro comprado ainda.</p>';
  else if (est.aba === 'jogos') h += '<button data-a="jogo:0">🏁 Corrida (precisa de carro)</button><button data-a="jogo:1">🛡 Sobrevivência (60 s)</button>';
  else h += `<p>Investido: ${fmt(est.inv)}</p><button data-a="inv:1000">Investir $1.000</button><button data-a="inv:10000">Investir $10.000</button><button data-a="inv:0">Resgatar tudo</button>`;
  $('tel').innerHTML = h + '<button data-a="fechar:0">Fechar (T)</button>';
}
