// Mensagens de LOJA para clientes (sem ponto): tabela, pagamento, megas, ilimitado, menu — e nanos por grupo (palavra ou numero).
const cfg = require('../config');
const db = require('./db');
const U = require('./utils');
const vars = require('./vars');
const human = require('./human');
const F = require('./fonte');

const STD = { menu: '00', tabela: '01', pagamento: '02', megas: '03', ilimitado: '04' };   // numero padrao de cada palavra
const NUM2WORD = Object.fromEntries(Object.entries(STD).map(([w, n]) => [n, w]));
const PALAVRAS = new Set(Object.keys(STD));
const DEFAULTS = {
  tabela: '[NOME_DA_LOJA]\n[TABELA_DO_GRUPO]\n\nPara comprar, digite: Pagamento ou 02',
  pagamento: '✅ *FORMAS DE PAGAMENTO*\n[PAGAMENTO_DO_GRUPO]\nSuporte — [SUPORTE_DO_GRUPO]\n\nApós o pagamento, envie o comprovativo juntamente com o número que vai receber os megas.',
  megas: 'Pode mandar o valor\nSe precisar da tabela\ndigite: Tabela ou 01\nFormas de pagamento\ndigite: Pagamento ou 02',
  menu: '👋 [NOME_DA_LOJA] ⚡\n📌 *Comandos úteis:*\nse precisar de tabela\nDigite: Tabela ou 01\ntabela de ilimitado\nDigite: ilimitado ou 04\nformas de pagamento\nDigite: Pagamento ou 02',
  ilimitado: '[ILIMITADO_DO_GRUPO]'
};

async function nomeGrupo(c) { try { return (await U.meta(c.sock, c.jid)).subject || ''; } catch { return ''; } }

// texto de uma palavra da loja, ou a mensagem "ainda nao configurou ..."
async function render(tipo, c) {
  const g = c.g;
  if (tipo === 'tabela' && !g.tableText && !Object.keys(g.table).length) return F.f(g, U.nc('a tabela'));
  if (tipo === 'pagamento' && !vars.pagamentoTexto(g)) return F.f(g, U.nc('o pagamento'));
  if (tipo === 'ilimitado' && !g.txt.ilimitado) return F.f(g, U.nc('a tabela de ilimitado'));
  // texto proprio do grupo: intacto; modelo padrao: so o texto do bot recebe a fonte (as [VARIAVEIS] ficam e depois sao preenchidas)
  const base = tipo === 'megas' && g.txt.megas ? g.txt.megas : F.f(g, DEFAULTS[tipo]);
  return vars.fill(base, g, await nomeGrupo(c));
}

// procura um nano pelo nome (segue aliases: "1" -> "tabela" -> texto)
function nanoLookup(g, name, hops = 0) {
  const v = g.nano.comandos[name];
  if (v === undefined || hops > 3) return null;
  if (typeof v === 'string') return { texto: v };
  if (v && v.alias) {
    if (g.nano.comandos[v.alias] !== undefined) return nanoLookup(g, v.alias, hops + 1);
    if (PALAVRAS.has(v.alias)) return { store: v.alias };
  }
  return null;
}

// responde a um nano / palavra da loja. Devolve true se respondeu.  O NANO TEM PRIORIDADE sobre o comando normal.
async function responder(c, t) {
  const g = c.g;
  let hit = g.nano.on !== false ? nanoLookup(g, t) : null;
  if (!hit && PALAVRAS.has(t)) hit = { store: t };
  if (!hit && NUM2WORD[t]) hit = { store: NUM2WORD[t] };
  if (!hit) return false;
  const text = hit.texto !== undefined ? vars.fill(hit.texto, g, await nomeGrupo(c)) : await render(hit.store, c);
  await c.reply(text, { raw: true });
  return true;
}

module.exports = { STD, NUM2WORD, PALAVRAS, render, nanoLookup, responder, nomeGrupo };
