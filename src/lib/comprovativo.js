// Modelos do AUTO-COMPROVATIVO (cada grupo pode personalizar): detetado, aguarde, agradecimento.
const U = require('./utils');
const F = require('./fonte');
const vars = require('./vars');
const S = require('./sales');

const DEFAULTS = {
  detectado: '🧾 *Comprovativo detectado* ([PROVEDOR])\n🔑 *Chave:* [CHAVE]\n[DESTINO_LINHA]\n💵 *Valor:* [VALOR]\n🕒 Hoje às [HORA]\n📦 *Número para receber:* [NUMERO]',
  aguarde: '➖ *Pagamento [PROVEDOR] detectado!*\n\n⏳ ✨ [CLIENTE], aguarde alguns instantes enquanto o adm confirma o seu pagamento.\n\n💡 `Qualquer tentativa de enviar comprovativos falsos resultará em banimento imediato.`\n\n✅ Obrigado pela preferência.\nO adm já volta com a confirmação!',
  agradecimento: 'Obrigado [CLIENTE] por comprar *[QUANTIDADE]*!\n\nVocê está fazendo a sua [COMPRA_DO_DIA].\n\nVocê é o *comprador nº [POSICAO]* do grupo, com um total acumulado de *[TOTAL]*!\n[MAIOR_LINHA]\nLute para ultrapassar esse nível e ganhar bónus incríveis!\n\n🏆 Cliente como você merece o melhor. Obrigado!'
};
const NOMES = { detectado: 'Comprovativo detectado', aguarde: 'Mensagem de aguarde', agradecimento: 'Agradecimento da compra (.compra)' };
const VARIAVEIS = {
  detectado: '[CLIENTE] [PROVEDOR] [CHAVE] [DESTINO] [DESTINO_LINHA] [VALOR] [HORA] [NUMERO]',
  aguarde: '[CLIENTE] [PROVEDOR] [CHAVE] [DESTINO] [VALOR] [HORA] [NUMERO]',
  agradecimento: '[CLIENTE] [QUANTIDADE] [COMPRA_DO_DIA] [POSICAO] [TOTAL] [MAIOR_COMPRADOR] [MAIOR_LINHA] [TOTAL_COMPRAS]'
};
const COMUNS = '[NOME_DA_LOJA] [SUPORTE_DO_GRUPO] [NOME_DO_DONO_DO_GRUPO]';

const gb = (mb) => `${(mb / 1024).toFixed(2)}GB`;
const ordinalDia = (n) => n <= 1 ? 'primeira compra do dia' : `${n}ª compra do dia`;

// texto do grupo (intacto) ou modelo padrao (so o texto do bot recebe a fonte)
function render(g, chave, mapa, nomeGrupo = '') {
  const base = (g.txt.modelos && g.txt.modelos[chave]) || F.f(g, DEFAULTS[chave]);
  const t = Object.entries(mapa).reduce((s, [k, v]) => s.split('[' + k + ']').join(v), base);
  return vars.fill(t, g, nomeGrupo);
}

// estatisticas do cliente depois de registar a compra
function estatisticas(g, user) {
  const lista = Object.entries(g.buyers).filter(([, b]) => b.mb > 0 || b.count > 0).map(([u, b]) => ({ u, mb: b.mb })).sort((a, b) => b.mb - a.mb);
  const pos = Math.max(1, lista.findIndex(x => x.u === user) + 1);
  const b = g.buyers[user] || { mb: 0, count: 0 };
  const maior = lista.length ? lista[0].mb : 0;
  return {
    compraDia: S.period(g, 'dia').filter(s => s.user === user).length, posicao: pos, total: b.mb, maior, ehTop: pos === 1, totalCompras: b.count
  };
}
function mapaAgradecimento(g, user, quantidade, mention = '@' + user) {
  const e = estatisticas(g, user);
  return {
    CLIENTE: mention, QUANTIDADE: quantidade, COMPRA_DO_DIA: ordinalDia(e.compraDia), POSICAO: String(e.posicao), TOTAL: gb(e.total),
    MAIOR_COMPRADOR: gb(e.maior), TOTAL_COMPRAS: String(e.totalCompras),
    MAIOR_LINHA: e.ehTop ? F.f(g, '👑 Você é o maior comprador do grupo!') : `${F.f(g, 'O maior comprador acumulou')} *${gb(e.maior)}*.`
  };
}
module.exports = { DEFAULTS, NOMES, VARIAVEIS, COMUNS, render, estatisticas, mapaAgradecimento, gb, ordinalDia };
