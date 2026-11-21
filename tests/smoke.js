// Fumo: executa CADA comando (varias formas) num grupo simulado e mostra o que responde, o que da erro e o que fica mudo. Uso: node tests/smoke.js
const Module = require('module'); const { EventEmitter } = require('events'); const path = require('path'); const fs = require('fs'); const os = require('os');
const BOT = path.join(__dirname, '..');
process.env.SASUKE_DB_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'sasuke-smoke-')); process.env.SASUKE_PAIR_DELAY = '0';
global.fetch = async () => { throw new Error('sem rede'); };
const stubs = {
  '@whiskeysockets/baileys': { default: () => { const ev = new EventEmitter(); setTimeout(() => ev.emit('connection.update', { qr: 'Q' }), 10); return { ev, user: { id: '258872698781:1@s.whatsapp.net' }, end() {}, requestPairingCode: async () => 'ABCD1234', sendMessage: async () => ({}) }; },
    useMultiFileAuthState: async () => ({ state: { creds: { registered: false }, keys: {} }, saveCreds() {} }), makeCacheableSignalKeyStore: (k) => k, DisconnectReason: { loggedOut: 401 }, fetchLatestBaileysVersion: async () => ({ version: [2, 3000, 1] }), Browsers: { ubuntu: () => [] }, downloadMediaMessage: async () => Buffer.from('x') },
  '@hapi/boom': { Boom: class { constructor(e) { this.output = {}; } } }, pino: () => ({}), 'qrcode-terminal': { generate() {} }, qrcode: { toBuffer: async () => Buffer.from('png') } };
const orig = Module._load; Module._load = function (r, ...a) { return stubs[r] || orig.call(this, r, ...a); };
process.chdir(BOT);
const cfg = require(BOT + '/src/config'); cfg.human.on = false; cfg.fonte = 'nenhuma';
const db = require(BOT + '/src/lib/db'); const handler = require(BOT + '/src/lib/handler');
const ADM = '258841111111@s.whatsapp.net', CLI = '258842222222@s.whatsapp.net', BAD = '258843333333@s.whatsapp.net', DONO = cfg.owner.numero + '@s.whatsapp.net';
const out = [], reacts = []; const errs = [];
const origErr = console.error; console.error = (...a) => { errs.push(a.map(x => (x && x.message) || x).join(' ')); };
const sock = { user: { id: '258872698781:1@s.whatsapp.net' },
  sendMessage: async (j, c) => { if (c.react) { reacts.push(c.react.text); return {}; } out.push({ j, ...c }); return { key: { id: 'K' } }; },
  profilePictureUrl: async () => 'http://x/p.jpg', readMessages: async () => {}, presenceSubscribe: async () => {}, sendPresenceUpdate: async () => {},
  groupMetadata: async () => ({ subject: 'Grupo Teste', creation: 1700000000, desc: 'desc', participants: [{ id: ADM, admin: 'admin' }, { id: CLI }, { id: BAD }, { id: '258872698781@s.whatsapp.net', admin: 'admin' }] }),
  groupParticipantsUpdate: async () => [{ status: '200' }], groupSettingUpdate: async () => {}, groupInviteCode: async () => 'XYZ', groupRevokeInvite: async () => 'NEW', groupLeave: async () => {},
  groupUpdateSubject: async () => {}, groupUpdateDescription: async () => {}, groupFetchAllParticipating: async () => ({ '1@g.us': { subject: 'G1', participants: [1, 2] } }) };
db.ensureSession('main', { name: 'Sasuke', ownerPhone: cfg.owner.numero, until: 0 });
let n = 0;
const run = async (jid, from, text, ctx, dm) => { out.length = 0; reacts.length = 0; errs.length = 0;
  const key = { remoteJid: dm ? from : jid, id: 'S' + (++n), fromMe: false, participant: dm ? undefined : from };
  const msg = ctx ? { extendedTextMessage: { text, contextInfo: ctx } } : { conversation: text };
  await handler.handle(sock, 'main', { key, message: msg, messageTimestamp: Math.floor(Date.now() / 1000), pushName: 'T' }, 'notify');
  return { txt: out.map(o => o.text || o.caption || (o.contacts ? '[contacto]' : o.image ? '[imagem]' : '')).join(' | '), erro: errs.length ? errs[0] : null, react: reacts[0] || null }; };
const VARS = [['', null], [' x', null], [' @alvo 5', { mentionedJid: [BAD] }]];
(async () => {
  const res = []; let i = 0;
  for (const cmd of handler.list) {
    const nome = cmd.names[0]; const g = `1203${String(700 + (++i))}@g.us`;
    await run(g, DONO, '.alugar 258841234567 30');                       // grupo alugado so para este comando
    const quem = (cmd.scope === 'master' || cmd.scope === 'owner') ? DONO : ADM;
    let melhor = null, erro = null;
    for (const [args, ctx] of VARS) {
      const r = await run(g, quem, '.' + nome + args, ctx || (cmd.names.includes('revelar') || cmd.names.includes('dectetor') ? { quotedMessage: { conversation: 'x' }, participant: CLI, stanzaId: 'Q' } : null), false);
      if (r.erro) { erro = r.erro; }
      if (!melhor || (r.txt && !melhor.txt)) melhor = r;
    }
    // membro comum: so para comandos 'all'/'admin' (verifica a permissao)
    let membro = '';
    if (cmd.scope === 'admin') { const r = await run(g, CLI, '.' + nome); membro = /administrador/.test(r.txt) ? 'bloqueia' : (r.txt ? 'RESPONDE' : 'mudo'); }
    res.push({ nome, alias: cmd.names.slice(1).join(' '), scope: cmd.scope, file: cmd.file, desc: cmd.desc, resp: (melhor && melhor.txt || '').replace(/\n+/g, ' ⏎ ').slice(0, 110), erro, mudo: !(melhor && melhor.txt), membro });
  }
  console.error = origErr;
  const maus = res.filter(r => r.erro), mudos = res.filter(r => r.mudo && !r.erro), vaza = res.filter(r => r.membro === 'RESPONDE');
  console.log(`COMANDOS: ${res.length} | com ERRO: ${maus.length} | mudos: ${mudos.length} | admin que responde a membro: ${vaza.length}`);
  maus.forEach(r => console.log('ERRO  .' + r.nome, '->', r.erro)); mudos.forEach(r => console.log('MUDO  .' + r.nome, `(${r.scope})`)); vaza.forEach(r => console.log('MEMBRO .' + r.nome));
  fs.writeFileSync('/tmp/smoke.json', JSON.stringify(res)); fs.rmSync(process.env.SASUKE_DB_DIR, { recursive: true, force: true });
  for (const d of fs.readdirSync(path.join(BOT, 'sessoes'))) if (d !== '.gitkeep') fs.rmSync(path.join(BOT, 'sessoes', d), { recursive: true, force: true });
  process.exit(0);
})();
