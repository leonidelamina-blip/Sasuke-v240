// Fonte do bot: letras em sans-serif negrito (𝗲𝘀𝘀𝗮). Comandos (.menu), numeros, links, @ e [VARIAVEIS] ficam como estao.
const cfg = require('../config');
const LOW = 0x1D5EE, UP = 0x1D5D4;
const letra = (ch) => { const c = ch.charCodeAt(0); return c >= 97 && c <= 122 ? String.fromCodePoint(LOW + c - 97) : c >= 65 && c <= 90 ? String.fromCodePoint(UP + c - 65) : ch; };
const SKIP = /^[(\[{"'*_~`]*\.\p{L}|https?:|www\.|wa\.me|\.com|chat\.whatsapp|@|\d|[\[\]_{}<>|\\\/=]/u;

const palavra = (tok) => SKIP.test(tok) ? tok : tok.normalize('NFD').replace(/[A-Za-z]/g, letra);   // acentos viram marcas combinadas
const texto = (t) => String(t).split(/(\s+)/).map((p, i) => i % 2 ? p : palavra(p)).join('');

const ativo = (g) => cfg.fonte !== 'nenhuma' && (!g || g.on.fonte !== false);
const f = (g, t) => ativo(g) ? texto(t) : t;            // estiliza so se a fonte estiver ligada (global e no grupo)
module.exports = { texto, ativo, f };
