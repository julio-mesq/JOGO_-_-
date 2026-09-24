// Escolhas (G perto de um NPC) e diálogos. Karma e histórico ficam no banco de dados (estado/carregar).
const K = { karma: 0, hist: [] }, el = () => document.getElementById('escolha'); let aberta = false, ops = [];
export const OPCOES = [{ t: 'Ajudar o estranho', k: 10, d: 0, e: 0 }, { t: 'Ignorar', k: 0, d: 0, e: 0 }, { t: 'Roubar', k: -15, d: 100, e: 1 }];
export const estado = K;
export const carregar = d => { if (d) Object.assign(K, d); };
export const aberto = () => aberta;
export const rotulo = () => K.karma >= 20 ? '😇 Bom' : K.karma <= -20 ? '😈 Mau' : '😐 Neutro';
export function abrir(titulo = 'Um estranho pede ajuda…', lista = OPCOES) {
  ops = lista; aberta = true; el().innerHTML = `<h3>${titulo}</h3>` + ops.map((o, i) => `<button>[${i + 1}] ${o.t}</button>`).join(''); el().classList.add('on');
}
export function escolher(i) {
  const o = ops[i]; if (!o) return null;
  aberta = false; el().classList.remove('on'); if (o.k !== undefined) { K.karma += o.k; K.hist = [...K.hist, o.t].slice(-50); } return o;
}
export function final() { // um de 3 finais conforme o karma
  const r = rotulo(), t = r.includes('Bom') ? 'Você virou o herói da cidade.' : r.includes('Mau') ? 'O crime dominou a cidade e seu nome virou lenda.' : 'Você seguiu seu próprio caminho, sem lado nenhum.';
  el().innerHTML = `<h2>FIM — Final ${r}</h2><p>${t}</p>`; el().classList.add('on'); setTimeout(() => el().classList.remove('on'), 9000);
}
