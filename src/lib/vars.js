// Variaveis do grupo: [NOME_DA_LOJA] [TABELA_DO_GRUPO] [PAGAMENTO_DO_GRUPO] [SUPORTE_DO_GRUPO] [NOME_DO_DONO_DO_GRUPO] ...
// Nada fixo no codigo: tudo vem do que o proprio grupo configurou.
const cfg = require('../config');
const U = require('./utils');
const sales = require('./sales');

function tabelaTexto(g) {
  if (g.tableText) return g.tableText;
  return Object.values(g.table).map(r => `▪️ ${r.label} — ${U.fmt(r.price)} ${cfg.moeda}`).join('\n');
}
function pagamentoTexto(g) {
  const extra = [g.conf.numero && `📱 ${g.conf.numero}`, g.conf.dono && `👤 ${g.conf.dono}`].filter(Boolean);
  return [sales.payInfo(g), ...extra].filter(Boolean).join('\n');
}
// substitui as variaveis; linhas cuja variavel esta vazia sao removidas (ex.: "Suporte — [SUPORTE_DO_GRUPO]" sem suporte)
function fill(text, g, nomeGrupo = '') {
  const map = {
    '[NOME_DA_LOJA]': g.conf.nome || nomeGrupo || '', '[TABELA_DO_GRUPO]': tabelaTexto(g), '[PAGAMENTO_DO_GRUPO]': pagamentoTexto(g),
    '[SUPORTE_DO_GRUPO]': g.conf.suporte || '', '[NOME_DO_DONO_DO_GRUPO]': g.conf.dono || '', '[NUMERO_DO_GRUPO]': g.conf.numero || '',
    '[ILIMITADO_DO_GRUPO]': g.txt.ilimitado || ''
  };
  return String(text).split('\n').filter(l => !Object.entries(map).some(([k, v]) => l.includes(k) && !v))
    .map(l => Object.entries(map).reduce((a, [k, v]) => a.split(k).join(v), l)).join('\n');
}
module.exports = { fill, tabelaTexto, pagamentoTexto };
