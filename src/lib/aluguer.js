// Aluguer POR GRUPO no bot principal. Dias em BigInt (sem limite): numeros gigantes nao estouram; acima do limite de datas = sem expiracao.
const cfg = require('../config');
const U = require('./utils');

const MS_DIA = 86400000n, MAX_DATE = 8640000000000000n, MAX_DIAS_COM_DATA = 365000n;   // ~1000 anos

// "30" -> 30n ; "0", "-5", "2.5", "abc" -> null
function parseDias(s) {
  if (typeof s !== 'string' || !/^\d+$/.test(s.trim())) return null;
  const n = BigInt(s.trim());
  return n > 0n ? n : null;
}
function calcular(dias, agora = Date.now()) {
  const fim = BigInt(agora) + dias * MS_DIA;
  if (dias > MAX_DIAS_COM_DATA || fim > MAX_DATE) return { infinito: true, fim: null };
  return { infinito: false, fim: Number(fim) };
}
const fmtData = (ms) => new Intl.DateTimeFormat('pt-PT', { timeZone: cfg.tz, day: '2-digit', month: '2-digit', year: 'numeric' }).format(ms);
const fmtDataHora = (ms) => `${fmtData(ms)} ${U.hm(ms)}`;

// st: 'sem' (nunca alugou) | 'ativo' | 'expirado'
function estado(g) {
  const r = g && g.rent;
  if (!r) return { st: 'sem' };
  if (r.infinito) return { st: 'ativo', infinito: true };
  const resta = r.fim - Date.now();
  return resta > 0 ? { st: 'ativo', infinito: false, restaMs: resta, dias: Math.ceil(resta / 864e5) } : { st: 'expirado' };
}
function registar(g, { jid, nome, por, dias, trial = false }) {
  const c = calcular(dias);
  g.rent = { grupo: jid, grupoNome: nome || '', por, dias: dias.toString(), inicio: Date.now(), fim: c.fim, infinito: c.infinito, trial, avisado1: false, expAvisado: false };
  return g.rent;
}
// avisos no grupo: falta 1 dia (so se nao for infinito) e expirou
async function avisos(sock, jid, g) {
  const r = g.rent; if (!r) return;
  const e = estado(g), send = (t) => require('./human').wrap(sock).sendMessage(jid, { text: t }).catch(() => {});
  if (e.st === 'ativo' && !e.infinito && !r.avisado1 && e.restaMs <= (r.trial ? 3 * 36e5 : 864e5)) {
    r.avisado1 = true; require('./db').save();
    await send(r.trial ? 'O teste grátis deste grupo termina em poucas horas.' : 'Falta 1 dia para o aluguer expirar.');
  }
  if (e.st === 'expirado' && !r.expAvisado) {
    r.expAvisado = true; require('./db').save();
    await send(r.trial ? `O teste grátis deste grupo terminou. Para continuar fale com o dono: ${cfg.contato}\n📢 Canal: ${cfg.canal}` : 'O aluguer deste grupo expirou.');
  }
}
module.exports = { avisos, parseDias, calcular, fmtData, fmtDataHora, estado, registar };
