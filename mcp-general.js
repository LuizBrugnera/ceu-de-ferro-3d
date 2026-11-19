#!/usr/bin/env node
'use strict';
/* mcp-general.js: an MCP server (stdio) that lets a model play as one side's general in Ceu de Ferro 3D.

   It speaks the Model Context Protocol to the model's client over stdin/stdout (JSON-RPC 2.0, one JSON message per line, written by hand,
   no dependency beyond `ws`) and the relay's WebSocket protocol to the game server: it joins the room as a silent `cls: 'gen'` client of
   one side, claims that side's general seat (gclaim), keeps the latest `ecs` / `gen` / `glog` the host sends it, and turns each tool call
   into a `gcmd` (commands) or `gask` (questions) for the host, answering with the host's `gres`. Nothing but protocol messages is written to
   stdout; logs go to stderr.

   Run (the relay must have been started with the same key: `GENKEY=secret node server.js`; without GENKEY it refuses every bridge):
     CEU_URL=ws://localhost:8080 CEU_ROOM=modern CEU_SIDE=0 CEU_KEY=secret CEU_NAME=Claude node mcp-general.js

   Environment:
     CEU_URL   relay address, default ws://localhost:8080 (the path is not used)
     CEU_ROOM  the room = the era, as the page names it: modern (default) or ww2
     CEU_SIDE  0 or 1, the side to command (default 0)
     CEU_KEY   the relay's GENKEY (required)
     CEU_NAME  a name for the log lines this process writes (default Claude)
     CEU_SEAT  set to 0 to NOT claim the seat on connect (the model then calls the `seat` tool)
     CEU_DOMAINS  domains taken with the seat, comma list of eco,atk,def,sup (default eco: the attack is the seat's by default; defence and support stay with the AI)

   .mcp.json (project root; the path must be absolute or relative to where the client starts):
     {
       "mcpServers": {
         "ceu-general": {
           "command": "node",
           "args": ["/caminho/para/ceu-de-ferro-3d/mcp-general.js"],
           "env": { "CEU_URL": "ws://localhost:8080", "CEU_ROOM": "modern", "CEU_SIDE": "0", "CEU_KEY": "secret", "CEU_NAME": "Claude" }
         }
       }
     }

   What the host (the page that simulates the match) must do for the tools to work: see the report; in short it answers `gcmd` with
   `ecoCmd(s, c, 'mcp')` and `gask` with `ecoAsk` / `ecoView`, each as `gres { to: from, n, ok, why, id, r? }`, and streams `ecs`, `gen`,
   `glog` for the side. */
const WebSocket = require('ws');

const ENV = process.env;
const URL = ENV.CEU_URL || 'ws://localhost:8080', ROOM = ENV.CEU_ROOM || 'modern', SIDE = +(ENV.CEU_SIDE || 0), KEY = ENV.CEU_KEY || '', NAME = ENV.CEU_NAME || 'Claude';
const AUTOSEAT = ENV.CEU_SEAT !== '0', DOMS = ['eco', 'atk', 'def', 'sup'], DOM0 = (ENV.CEU_DOMAINS === undefined ? 'eco' : ENV.CEU_DOMAINS).split(',').filter(d => DOMS.includes(d)), WAITMAX = 60;
const VERSION = '2.0.0';   // 2: MCP v2 (W13), the general's whole funnel: campaigns, the threat board, defence policies, deposits, mines, sabotage, the militia, missions and the unit card
const LEGACY = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'], MODERN = ['2026-07-28'];   // handshake-based versions and the stateless one
const META_V = 'io.modelcontextprotocol/protocolVersion';
const CMD_GAP = 300, ASK_GAP = 1100, CLAIM_GAP = 1100, TIMEOUT = 8000, QMAX = 12;   // server allows gcmd 250 ms, gask 1 s, gclaim 1 s apart
const log = (...a) => process.stderr.write('[mcp-general] ' + a.join(' ') + '\n');
const now = () => Date.now(), sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------------------------------------------------------------- relay link */
const R = {
  ws: null, up: false, fatal: '', id: 0, w: null, host: 0, gn: [0, 0], gk: [0, 0], wantSeat: AUTOSEAT, tries: 0,
  gen: null, ecs: null, ecoAsked: 0, eco: null, pic: null, T: 0, Tat: 0, ev: [], evSeq: 0, picBusy: false, glog: [], logAt: 0, n: 0, pend: new Map(), lastCmd: 0, lastAsk: 0, lastClaim: 0, chain: Promise.resolve(), gctlWait: [],
};
if (SIDE !== 0 && SIDE !== 1) { log('CEU_SIDE must be 0 or 1'); R.fatal = 'CEU_SIDE must be 0 or 1'; }
if (!KEY) { log('CEU_KEY is not set: the relay will refuse this bridge'); }

function connect() {
  if (R.fatal) return;
  let ws;
  try { ws = new WebSocket(URL); } catch (e) { R.fatal = 'bad CEU_URL: ' + e.message; log(R.fatal); return; }
  R.ws = ws;
  ws.on('open', () => ws.send(JSON.stringify({ t: 'join', room: ROOM, name: NAME, cls: 'gen', side: SIDE, key: KEY })));
  ws.on('message', d => { let m; try { m = JSON.parse(d); } catch (e) { return; } onRelay(m); });
  ws.on('error', e => log('socket error: ' + e.message));
  ws.on('close', () => {
    if (R.ws !== ws) return;
    R.up = false; R.w = null; R.ws = null;
    for (const [n, p] of R.pend) { clearTimeout(p.timer); p.resolve({ ok: false, why: 'link', note: 'the connection to the relay dropped before the host answered' }); R.pend.delete(n); }
    if (R.fatal) return;
    const wait = Math.min(15000, 1000 * 2 ** Math.min(R.tries++, 4));
    log('disconnected; retrying in ' + wait / 1000 + ' s');
    setTimeout(connect, wait);
  });
}

function onRelay(m) {
  switch (m.t) {
    case 'welcome':
      R.w = m; R.id = m.id; R.host = m.host || 0; R.gn = m.gn || [0, 0]; R.gk = m.gk || [0, 0]; R.up = true; R.tries = 0;
      R.gen = null; R.ecs = null; R.eco = null; R.pic = null; R.glog = [];   // a fresh stream follows a join
      log('joined room ' + ROOM + ' side ' + SIDE + ' as player ' + R.id + ' (eco ' + (m.eco ? 1 : 0) + ', gen ' + (m.gen ? 1 : 0) + ')');
      if (m.eco && m.gen && R.wantSeat) R.claimP = claim(1).catch(() => {});   // ready() waits for its gctl, so the first tool call sees the seat
      break;
    case 'error': {
      const why = { gen: 'the relay refused the key (CEU_KEY must equal the relay\'s GENKEY, and the relay needs GENKEY set)', room: 'unknown room ' + ROOM, taken: 'another bridge already holds side ' + SIDE + ' (or CEU_SIDE is invalid)' }[m.code] || ('relay error ' + m.code);
      log(why);
      if (m.code === 'gen' || m.code === 'room') { R.fatal = why; try { R.ws.close(); } catch (e) { /* closing */ } }
      else R.lastErr = why;
      break;
    }
    case 'host': R.host = m.id; break;
    case 'left': if (m.id === R.host) R.host = 0; break;
    case 'gctl': {
      R.gn = m.g || R.gn; R.gk = m.k || R.gk;
      const w = R.gctlWait; R.gctlWait = []; for (const f of w) f();
      break;
    }
    case 'eco': onSites(m.e || []); break;
    case 'ecs': if (m.s === SIDE) { R.ecs = { at: now(), m }; clock(m.T); } break;
    case 'gen': if (m.s === SIDE) { onOps(R.gen && R.gen.m.v.ops, m.v && m.v.ops); R.gen = { at: now(), m }; clock(m.T); } break;
    case 'glog':
      if (m.s !== SIDE) break;
      R.logAt = now(); clock(m.T);
      if (m.full === 1) R.glog = [];
      else for (const e of m.e || []) if (NOTABLE(e)) event('log', e[2], e[0]);
      for (const e of m.e || []) R.glog.push(e);
      if (R.glog.length > 120) R.glog.splice(0, R.glog.length - 120);
      break;
    case 'gres': {
      const p = R.pend.get(m.n);
      if (p) { clearTimeout(p.timer); R.pend.delete(m.n); p.resolve({ ok: !!m.ok, why: m.why || '', id: m.id || 0, r: m.r }); }
      break;
    }
    default: break;
  }
}

const send = o => { if (R.ws && R.ws.readyState === 1) { R.ws.send(JSON.stringify(o)); return true; } return false; };
const held = () => R.gn[SIDE] === R.id && R.id > 0;
const holder_ = () => (R.gn[SIDE] === 0 ? 'nobody' : held() ? 'this bridge (player ' + R.id + ')' : 'player ' + R.gn[SIDE] + ' (' + (R.gk[SIDE] === 2 ? 'an MCP bridge' : 'a human') + ')');

async function ready() {
  for (let i = 0; i < 40; i++) { if (R.fatal) throw new Error(R.fatal); if (R.up && R.w) break; await sleep(100); }
  if (!(R.up && R.w)) throw new Error('not connected to the relay at ' + URL + (R.lastErr ? ' (' + R.lastErr + ')' : ' yet; it retries with backoff, try again shortly'));
  if (!R.w.eco || !R.w.gen) throw new Error('this relay/host does not support the economy and general features (welcome has no eco/gen flag); update the server');
  if (R.claimP) { const p = R.claimP; await p; if (R.claimP === p) R.claimP = null; }
}

/* one-at-a-time, spaced sends: the relay drops what comes faster (gcmd 250 ms, gask 1 s) */
function enqueue(kind, build) {
  if (R.pend.size >= QMAX) return Promise.resolve({ ok: false, why: 'busy', note: 'too many requests waiting for the host; wait for the earlier answers' });
  const run = async () => {
    const gap = kind === 'ask' ? ASK_GAP : CMD_GAP, last = kind === 'ask' ? R.lastAsk : R.lastCmd, d = last + gap - now();
    if (d > 0) await sleep(d);
    return new Promise(resolve => {
      const n = ++R.n % 1e9 || 1;
      const timer = setTimeout(() => { R.pend.delete(n); resolve({ ok: false, why: 'timeout', note: 'no answer from the host in ' + TIMEOUT / 1000 + ' s (is a host with the economy running?)' }); }, TIMEOUT);
      R.pend.set(n, { resolve, timer });
      if (kind === 'ask') R.lastAsk = now(); else R.lastCmd = now();
      if (!send(build(n))) { clearTimeout(timer); R.pend.delete(n); resolve({ ok: false, why: 'link', note: 'the connection to the relay is down' }); }
    });
  };
  const p = R.chain.then(run, run);
  R.chain = p.then(() => {}, () => {});
  return p;
}

async function claim(on) {
  const d = R.lastClaim + CLAIM_GAP - now(); if (d > 0) await sleep(d);
  R.lastClaim = now();
  const got = new Promise(res => { const t = setTimeout(res, 3000); R.gctlWait.push(() => { clearTimeout(t); res(); }); });
  if (!send({ t: 'gclaim', on })) return;
  await got;
}

/* a seat holds the attack by default; the economy (and any other listed domain) is taken with a ctl order. The economy is taken lazily: before the first economy order,
   and only when the host's own panel says the economy is not already the model's (ecs c = 2); it is not asked again for 3 s, the panel being a second behind */
async function takeDomains(list) {
  for (const d of list) {
    if (d === 'eco' && ((R.ecs && R.ecs.m.c === 2) || now() - R.ecoAsked < 3000)) continue;
    if (d === 'eco') R.ecoAsked = now();
    const r = await enqueue('cmd', n => ({ t: 'gcmd', d: 'cmd', c: { c: 'ctl', k2: d, k: 'me' }, n })); if (!r.ok) log('ctl ' + d + ' refused: ' + r.why);
  }
}
const ECOCMDS = ['build', 'make', 'cancel', 'prio', 'scrap', 'def', 'keep', 'scout', 'strike', 'expand'];
/* wait: match time (the host's clock, from its streams) or a notable event, whichever first */
async function waitFor(secs, stopOnEvent) {
  const T0 = R.T, seq0 = R.evSeq, wall0 = now(), wallMax = secs * 1500 + 4000, e0 = R.ecs && R.ecs.m, q0 = e0 ? flat(e0.q, 5).map(r => [r[0], kname(r[1])]) : [], stock0 = e0 ? e0.v.slice(0, 2) : null, log0 = R.glog.length;
  const sites0 = new Map((R.eco || []).map(r => [r[0], r[6]]));
  let reason = 'time', lastPic = now();
  const poll = () => { if (!R.picBusy && now() - lastPic > 8000) { lastPic = now(); refreshPic(0).catch(() => {}); } };
  for (;;) {
    await sleep(100);
    if (R.fatal || !R.up) { reason = 'link'; break; }
    if (R.T - T0 >= secs) break;
    if (stopOnEvent && R.evSeq > seq0 && now() - R.ev[R.ev.length - 1].wall > 400) { reason = 'event'; break; }   // a beat for related lines to arrive together
    if (now() - wall0 > wallMax) { reason = R.T === T0 ? 'clock_stalled' : 'wall_limit'; break; }
    poll();
  }
  if (R.up && !R.picBusy && now() - ((R.pic && R.pic.at) || 0) > 4000) await refreshPic(0).catch(() => {});   // one last look at the map, for the points that changed hands
  const e1 = R.ecs && R.ecs.m, q1 = e1 ? flat(e1.q, 5).map(r => r[0]) : [];
  const ev = R.ev.filter(x => x.seq > seq0).map(x => ({ T: x.T, kind: x.kind, text: x.text }));
  const lines = R.glog.slice(log0 > R.glog.length ? 0 : log0).filter(l => l[1] !== 'ord').slice(-10).map(l => ({ T: l[0], kind: l[1], text: l[2] }));
  const done = (R.eco || []).filter(r => r[6] >= 100 && sites0.has(r[0]) && sites0.get(r[0]) < 100).map(r => ({ id: r[0], kind: sname(r[2]) }));
  return { reason, waitedMatchSeconds: +(R.T - T0).toFixed(1), waitedWallSeconds: +((now() - wall0) / 1000).toFixed(1), matchClockT: R.T,
    note: reason === 'clock_stalled' ? 'the match clock did not advance: the host is paused, gone or not streaming' : reason === 'link' ? 'the connection dropped' : undefined,
    events: ev,
    changes: { stockDelta: stock0 && e1 ? { en: e1.v[0] - stock0[0], mt: e1.v[1] - stock0[1] } : null, ordersLeftQueue: q0.filter(([id]) => !q1.includes(id)).map(([id, kind]) => ({ id, kind })), sitesFinished: done, newLog: lines },
    next: 'call get_state for the full picture' };
}

const WHY = {
  ctl: 'you do not hold the general seat of your side (call the seat tool) or, for economy orders, you do not hold the economy domain (seat claim takes it by default; ctl {k2: "eco", k: "me"} takes it back)',
  rate: 'sent too fast for the relay; retry', shape: 'the relay or host rejected the command shape (unknown key, wrong type, or out-of-range value)', host: 'no host is connected to run the match',
  off: 'the host has no economy running (match not started or economy off)', over: 'the match is over', link: 'connection to the relay dropped', timeout: 'host did not answer',
  busy: 'queue full or the squads already have an operation', sq: 'no free squad for it (the ids do not exist, are dead or are already in an operation)', unknown: 'the host does not know that command or sighting', mcp: 'the economy controller of this side is not the model (seat not held yet?)',
};
/* the page's own texts for the codes the host answers, in Brazilian Portuguese, exactly as a person reads them on the general's view (the page's gNo: GEN.no,
   else ECO.tx.why), copied so a refusal always carries the same reason; tests/mcp-general.js checks every page code comes back with the page's text. Extra: en */
const PT = { off: 'Ordem indisponível agora', over: 'A partida terminou', ctl: 'Você não está no comando disso', shape: 'Ordem malformada', kind: 'Ordem desconhecida', at: 'Objetivo inválido',
  link: 'Ponto sem ligação com um ponto nosso: ainda não pode ser tomado', own: 'Esse ponto já é nosso', busy: 'Já há uma operação com essa tropa ou nessa estrada',
  max: 'Limite de operações simultâneas', sq: 'Nenhuma esquadra livre para isso', reach: 'Essas esquadras não chegam lá pela estrada delas', nores: 'Sem reserva disponível',
  fire: 'Nenhum morteiro ou bateria alcança esse ponto', amb: 'Emboscada só junto a uma estrada', id: 'Não encontrado', cool: 'Ainda em espera: tente daqui a pouco', tk: 'Tíquetes insuficientes',
  stock: 'Sem estoque no depósito', res: 'Nada na reserva: produza antes', rate: 'Ordens rápidas demais: aguarde um instante', host: 'A sala está sem anfitrião', bug: 'Erro ao aplicar a ordem',
  wait: 'Sem resposta do anfitrião', map: 'Fora do mapa ou na água', water: 'Na água', steep: 'Terreno inclinado', road: 'Em cima da estrada', obj: 'Obstruído', base: 'Perto demais de outra base',
  foe: 'Inimigo por perto', cap: 'Limite de bases ou deste tipo de instalação', pop: 'Acima do teto de população do lado', node: 'Nó de suprimento não encontrado', full: 'O nó está cheio',
  mt: 'Falta metal na base principal', conv: 'Comboios demais a caminho', lift: 'Sem helicóptero de transporte na reserva', cut: 'O nó está cortado da base: use a ponte aérea',
  era: 'Não existe nesta época', tow: 'Já há um veículo de recuperação a caminho', far: 'Longe demais: fora do território ou à frente da linha', hurt: 'Nenhum ferido para evacuar ali',
  mv: 'Ordens amplas e rotas só no mapa com rede de estradas', rt: 'Rota inválida: até 8 pontos no mapa, fora da água', way: 'Nenhuma esquadra com caminho até lá a pé (até 9 km)',
  air: 'Nenhum avião de ataque nosso no ar', fcap: 'Limite de 6 obras de campanha do lado', esc: 'Nenhum veículo nosso perto dali para escoltar', cost: 'Faltam energia ou metal para a obra',
  mcap: 'Limite de minas do lado', mkn: 'No máximo 4 unidades novas por ordem', hate: 'A população dessa vila se voltou contra nós', nociv: 'Ninguém para armar nessa vila',
  mil0: 'Sem tropa nossa na vila para armar os civis', roe: 'Civis à vista e alvo não identificado: fogo negado pelas regras de engajamento', down: 'A ponte já caiu',
  whole: 'A ponte está de pé: pontão só numa ponte destruída', pont: 'Já há um pontão nessa ponte', server: 'O servidor desta sala é antigo: sem pontes destrutíveis',
  hasmine: 'Já temos uma mina nessa jazida', foemine: 'O inimigo tem uma mina nessa jazida', sap: 'Nenhuma esquadra com sapadores livre para isso', path: 'Nenhum caminho a pé seguro até lá',
  cd: 'Essa manobra ainda está em espera', n: 'Número de esquadras inválido', near: 'perto demais de outra instalação', lot: 'num lote da cidade-sede', front: 'à frente da linha',
  dep: 'mina só sobre jazida livre', rcap: 'Limite de 3 antenas de rádio do lado', nrad: 'Nenhum veículo-rádio ou operador de rádio livre para isso', crl: 'O servidor desta sala é antigo: sem antenas de rádio', fabroad: 'fábrica precisa de estrada a menos de 500 m', q: 'fila cheia', unknown: 'instalação inimiga não localizada', none: 'nada na reserva', en: 'Falta energia' };
const explain = r => (r.ok ? 'accepted' : 'refused: ' + (r.why || 'unspecified') + (PT[r.why] ? ' (' + PT[r.why] + ')' : '') + (WHY[r.why] ? ' - ' + WHY[r.why] : '') + (r.note ? ' - ' + r.note : ''));

/* the host's answer to a command: text for the model */
async function runCmd(c, d) {
  await ready();
  if (ECOCMDS.includes(c.c) && DOM0.includes('eco') && held()) await takeDomains(['eco']);
  const r = await enqueue('cmd', n => ({ t: 'gcmd', d: d || 'eco', c, n }));
  const out = { accepted: r.ok, result: explain(r), command: c.c };
  if (r.ok && r.id) out.id = r.id;
  if (r.r !== undefined) out.detail = r.r;
  return { text: JSON.stringify(out), error: !r.ok };
}
/* the after-action review of a match the server keeps (GET /ana/list, /ana/r/<era>/<name> on the relay's own address) */
function httpGet(p) {
  return new Promise(res => {
    let u; try { u = new globalThis.URL(p, URL.replace(/^ws/, 'http')); } catch (e) { return res({ ok: false, why: 'url' }); }
    const req = require(u.protocol === 'https:' ? 'https' : 'http').get(u, r => { let b = ''; r.setEncoding('utf8'); r.on('data', d => { if (b.length < 1 << 20) b += d; }); r.on('end', () => { try { res({ ok: r.statusCode === 200, code: r.statusCode, j: JSON.parse(b) }); } catch (e) { res({ ok: false, code: r.statusCode, why: 'json' }); } }); });
    req.on('error', e => res({ ok: false, why: e.message })); req.setTimeout(TIMEOUT, () => { req.destroy(); res({ ok: false, why: 'timeout' }); });
  });
}
async function matchReport(a) {
  const m = (a && a.match) || 'current';
  if (m === 'current') return runAsk({ q: 'report' });
  if (m === 'list') {
    const r = await httpGet('/ana/list');
    if (!r.ok) return { text: JSON.stringify({ answered: false, result: r.code === 404 ? 'the server keeps no matches (ANALYTICS=0 or an older server)' : 'could not read the list: ' + (r.why || r.code) }), error: true };
    return { text: JSON.stringify({ answered: true, matches: r.j.m.slice(0, 30).map(o => ({ match: o.era + '/' + o.id, src: o.sum && o.sum.src, sides: o.sum && o.sum.fac, doctrines: o.sum && o.sum.doc, personalities: o.sum && o.sum.per, difficulties: o.sum && o.sum.dif, winner: o.sum && o.sum.end ? o.sum.end.win : null, why: o.sum && o.sum.end ? o.sum.end.why : null, seconds: o.sum && o.sum.end ? o.sum.end.t : null })) }) };
  }
  if (!/^(ww2|modern)\/\d{4}-\d{2}-\d{2}-[0-9a-f]{12}$/.test(m)) throw new Error('match must be "current", "list" or an era/name from the list');
  const r = await httpGet('/ana/r/' + m);
  if (!r.ok) return { text: JSON.stringify({ answered: false, result: 'no review for ' + m + ' (unfinished, deleted after 90 days, or analytics off)' }), error: true };
  return { text: JSON.stringify({ answered: true, match: m, data: r.j.rep || { end: r.j.end, hdr: r.j.hdr } }) };
}
async function runAsk(q) {
  await ready();
  const r = await enqueue('ask', n => ({ t: 'gask', q, n }));
  const out = { answered: r.ok, result: explain(r), question: q.q };
  if (r.r !== undefined) out.data = r.r;
  return { text: JSON.stringify(out), error: !r.ok };
}

/* ---------------------------------------------------------------- input checks (mirror the relay's gcmd whitelist) */
const GK = { k: 'w', k2: 'w', x: 'n', z: 'n', a: 'n', n: 'i', id: 'i', p: 'i', inf: 'i', aa: 'i', ri: 'i', op: 'i', why: 's',
  ids: 'L', j: 'i', pi: 'i', sd: 'i', smk: 'i', home: 'i', s: 'n', fx: 'n', fz: 'n', x2: 'n', z2: 'n', H: 'n', r: 'n',
  mk: 'w', lat: 'i', roe: 'w', brk: 'n', nd: 'w', rt: 'P', role: 'w', qrf: 'i' };
const ASKS = ['spots', 'why', 'view', 'state', 'pool', 'amb', 'fire', 'report', 'plan', 'logi', 'rec', 'brg', 'threats', 'missions', 'unit', 'lots', 'mines', 'tmap', 'ap'];   // the relay's gask kinds; it passes on k, x, z, a and id
const isNum = v => typeof v === 'number' && Number.isFinite(v), isInt = v => Number.isInteger(v);
function rawCmd(c) {   // returns an error string or null
  if (!c || typeof c !== 'object' || Array.isArray(c)) return 'command must be an object';
  if (typeof c.c !== 'string' || !/^[a-z]{2,8}$/.test(c.c)) return 'c.c (the command name) must be 2-8 lowercase letters';
  if (c.c === 'draw') return 'the draw command is reserved for the system';
  for (const k of Object.keys(c)) {
    if (k === 'c') continue;
    const t = GK[k], v = c[k];
    if (!Object.hasOwn(GK, k)) return 'unknown key "' + k + '"; allowed: ' + Object.keys(GK).join(', ');
    if (t === 'w' && !(typeof v === 'string' && /^[a-z0-9]{1,10}$/.test(v))) return k + ' must be 1-10 lowercase letters/digits';
    if (t === 'n' && !(isNum(v) && Math.abs(v) < 1e5)) return k + ' must be a finite number with |value| < 100000';
    if (t === 'i' && !(isInt(v) && Math.abs(v) < 1e6)) return k + ' must be an integer with |value| < 1000000';
    if (t === 's' && !(typeof v === 'string' && v.length <= 120)) return k + ' must be a string of at most 120 characters';
    if (t === 'L' && !(Array.isArray(v) && v.length <= 24 && v.every(e => isInt(e) && Math.abs(e) < 1e6))) return k + ' must be an array of at most 24 integers';
    if (t === 'P' && !(Array.isArray(v) && v.length >= 2 && v.length <= 16 && v.length % 2 === 0 && v.every(e => isNum(e) && Math.abs(e) < 1e5))) return k + ' must be a flat array of 1-8 x, z pairs (2-16 numbers)';
  }
  return null;
}
function rawAsk(q) {   // returns an error string or null
  if (!q || typeof q !== 'object' || Array.isArray(q)) return 'question must be an object';
  if (!ASKS.includes(q.q)) return 'q must be one of ' + ASKS.join(', ');
  for (const k of Object.keys(q)) {
    if (k === 'q') continue;
    if (k === 'k' ? !(typeof q.k === 'string' && /^[a-z0-9]{1,10}$/.test(q.k)) : k === 'id' ? !(isInt(q.id) && Math.abs(q.id) < 1e6) : ['x', 'z', 'a'].includes(k) ? !(isNum(q[k]) && Math.abs(q[k]) < 1e5) : true) return 'question key "' + k + '" is not allowed or has a wrong type; allowed: k (word), x, z, a (numbers), id (integer)';
  }
  return null;
}
const need = (a, spec) => {   // spec: { name: ['i'|'n'|'w'|'s', required, lo, hi] }
  if (!a || typeof a !== 'object') return 'arguments must be an object';
  for (const [k, [t, req, lo, hi]] of Object.entries(spec)) {
    const v = a[k];
    if (v === undefined || v === null) { if (req) return 'missing "' + k + '"'; continue; }
    if (t === 'i' && !(isInt(v) && (lo === undefined || v >= lo) && (hi === undefined || v <= hi))) return '"' + k + '" must be an integer' + (lo !== undefined ? ' in ' + lo + '..' + hi : '');
    if (t === 'n' && !(isNum(v) && Math.abs(v) < 1e5)) return '"' + k + '" must be a number with |value| < 100000';
    if (t === 'w' && !(typeof v === 'string' && /^[a-z0-9]{1,10}$/.test(v))) return '"' + k + '" must be 1-10 lowercase letters/digits' + (lo ? ' (one of ' + lo.join(', ') + ')' : '');
    if (t === 'w' && lo && !lo.includes(v)) return '"' + k + '" must be one of ' + lo.join(', ');
    if (t === 's' && !(typeof v === 'string' && v.length <= 120)) return '"' + k + '" must be a string of at most 120 characters';
  }
  return null;
};
const MISK = ['attack', 'defend', 'ambush', 'recon', 'escort', 'garrison', 'patrol', 'interdict', 'support', 'cap', 'cas', 'lift', 'build', 'reserve'];   // the mission kinds (the page's MIS)
const pick = (a, keys, map) => { const c = {}; for (const k of keys) if (a[k] !== undefined && a[k] !== null) c[(map && map[k]) || k] = a[k]; return c; };
const WHYP = { type: 'string', maxLength: 120, description: 'optional reason (appended to the order-log line the side sees; keep it short)' };

/* ---------------------------------------------------------------- state view for the model */
/* the page's index tables, mirrored: ecoI() = units then sites (ecs kinds), ESK (site kinds), EWHY, GEN.tag (squad jobs, +1), GEN.ord (+1), GOP (operation kinds) */
const UNITS = ['squad', 'car', 'truck', 'lav', 'aa', 'art', 'tank', 'rad', 'aaf', 'fighter', 'cas', 'heli', 'lift', 'drone'], SITES = ['pow', 'mine', 'fab'], KINDS = UNITS.concat(SITES);
const EWHY = ['', 'en', 'mt', 'busy', 'none', 'full'], JOBS = ['eng', 'line', 'garr', 'mort', 'wood', 'road', 'base', 'push', 'amb', 'rec', 'lp', 'guard', 'held', 'col'];
const ORDS = ['hold', 'assault', 'patrol', 'flank', 'withdraw', 'supply', 'build', 'ambush', 'escort', 'bait', 'overwatch', 'scout', 'mortar', 'observe', 'move'], OPS = ['', 'atk', 'amb', 'ctr', 'usr'];
const kname = i => KINDS[i] || 'kind#' + i, sname = i => SITES[i] || 'site#' + i;
const age = at => (at ? +((now() - at) / 1000).toFixed(1) : null);
const flat = (l, n) => { const o = []; for (let i = 0; i + n <= (l || []).length; i += n) o.push(l.slice(i, i + n)); return o; };
const clock = T => { if (typeof T === 'number' && T >= R.T) { R.T = T; R.Tat = now(); } };
/* things worth waking a waiting model for: the log lines of assaults, defence under pressure, reports, reinforcements and a lost site; not the economy's routine nor the model's own order echoes */
const NOTABLE = e => e[1] === 'atk' || e[1] === 'rep' || e[1] === 'rf' || (e[1] === 'def' && /atacad|inferioridade|perd/i.test(e[2])) || (e[1] === 'eco' && /Perdemos|destru/i.test(e[2]));
function event(kind, text, T) { R.ev.push({ seq: ++R.evSeq, wall: now(), T: T === undefined ? R.T : T, kind, text }); if (R.ev.length > 80) R.ev.splice(0, R.ev.length - 80); }
function onSites(rows) {   // the `eco` rows everyone gets: [id, side, kind, x, z, a, progress %, hp, stage]
  const old = new Map((R.eco || []).map(r => [r[0], r])), mine = rows.filter(r => r[1] === SIDE);
  for (const r of mine) { const o = old.get(r[0]); if (o && o[8] !== 2 && r[8] === 2) event('site_lost', 'your ' + sname(r[2]) + ' (id ' + r[0] + ') at ' + Math.round(r[3]) + ',' + Math.round(r[4]) + ' was destroyed'); if (o && o[6] < 100 && r[6] >= 100 && r[8] !== 2) event('site_done', 'your ' + sname(r[2]) + ' (id ' + r[0] + ') is finished'); }
  R.eco = mine;
}
function onOps(a, b) {
  if (!Array.isArray(b)) return;
  const was = new Map((a || []).map(o => [o && o.id, o])), is = new Map(b.map(o => [o && o.id, o]));
  for (const [id, o] of is) if (id !== undefined && !was.has(id) && a) event('op_started', 'operation ' + id + ' (' + (o.k || '?') + (o.nm ? ' ' + o.nm : '') + ') started');
  for (const [id, o] of was) if (id !== undefined && !is.has(id)) event('op_ended', 'operation ' + id + ' (' + (o.k || '?') + (o.nm ? ' ' + o.nm : '') + ') ended');
}
const holder = h => (h === -1 ? 'contested' : h === SIDE ? 'ours' : 'enemy');
function onPic(prev, d) {   // a point that changed hands since the last picture
  if (!prev || !Array.isArray(prev.pts) || !Array.isArray(d.pts)) return;
  for (const p of d.pts) { const o = prev.pts[p.i]; if (o && o.hold !== p.hold) event('point', p.L + ' ' + p.name + ' (point ' + p.i + '): ' + holder(o.hold) + ' -> ' + holder(p.hold), d.T); }
}
/* the host's whole picture (gask state): the map points, squads with positions, vehicles, the enemy seen. One question a second at most; kept so get_state and wait can reuse it */
async function refreshPic(maxAgeS) {
  if (R.pic && now() - R.pic.at < maxAgeS * 1000) return R.pic;
  if (R.picBusy) { for (let i = 0; i < 100 && R.picBusy; i++) await sleep(50); return R.pic; }
  await askState();
  return R.pic;
}
async function askState() {
  R.picBusy = true;
  try {
    const r = await enqueue('ask', n => ({ t: 'gask', q: { q: 'state' }, n }));
    if (r.ok && r.r && typeof r.r === 'object') { onPic(R.pic && R.pic.d, r.r); R.pic = { at: now(), d: r.r }; }
    return r;
  } finally { R.picBusy = false; }
}
/* a squad's radio link in the host's picture (genState sq.link): 0 cut by a jammer, 1 out of the command net, 2 in it; orders reach it later the worse it is */
const LINK = ['cut', 'out of net', 'in net'];
/* veterancy (the page's VET.rank): a squad's rank in the map's state, and the side's Veterano and Elite vehicles and aircraft */
const RANKS = ['recruit', 'regular', 'veteran', 'elite'];
const pos = (x, z) => (typeof x === 'number' && typeof z === 'number' ? { x: Math.round(x), z: Math.round(z) } : null);
function stateView(logN) {
  const e = R.ecs && R.ecs.m, g = R.gen && R.gen.m, v = e && e.v, pd = R.pic && R.pic.d;
  const sqPic = new Map(((pd && pd.sq) || []).map(q => [q.id, q]));
  const sqs = g ? flat(g.q, 6).map(([id, job, ord, op, dx, dz]) => { const p = sqPic.get(id) || {}; return { sqId: id, id, name: p.nm, rank: RANKS[p.rank], job: JOBS[job - 1] || '?', order: ORDS[ord - 1] || null, operation: OPS[op] || null, at: pos(p.x, p.z), men: p.n, goingTo: dx || dz ? { x: dx, z: dz } : null, radio: LINK[p.link], orderArrivesInS: p.eta }; })
    : ((pd && pd.sq) || []).map(p => ({ id: p.id, name: p.nm, rank: RANKS[p.rank], job: p.job, at: pos(p.x, p.z), men: p.n }));
  const out = {
    link: { connected: R.up, room: ROOM, side: SIDE, playerId: R.id, hostPresent: R.host > 0, seat: holder_(), seatHeldByMe: held(), error: R.fatal || undefined },
    matchClockT: R.T, clockAgeSeconds: age(R.Tat),
    economy: e ? {
      ageSeconds: age(R.ecs.at), controller: ['ai', 'me', 'mcp'][e.c],
      stock: { en: v[0], mt: v[1] }, incomePerMin: { en: v[2], mt: v[3] }, usePerMin: { en: v[4], mt: v[5] }, billPerMin: { en: v[6], mt: v[7] },
      sites: (R.eco || []).map(([id, , k, x, z, a, pct, hp, stage]) => ({ id, kind: sname(k), x: Math.round(x), z: Math.round(z), angle: a, progressPct: pct, hp, status: stage === 2 ? 'destroyed' : pct >= 100 ? 'working' : 'building' })),
      queue: flat(e.q, 5).map(([id, kind, at, pct, why]) => ({ id, kind: kname(kind), siteId: at || undefined, progressPct: pct, waitingFor: EWHY[why] || undefined })),
      reserve: Object.fromEntries(flat(e.r, 2).map(([k, n]) => [kname(k), n])), keepTarget: Object.fromEntries(flat(e.kp, 2).map(([k, n]) => [kname(k), n])),
      missing: Object.fromEntries(flat(e.ms, 2).map(([k, n]) => [kname(k), n])), lostUnits: Object.fromEntries(flat(e.ls, 2).map(([k, n]) => [kname(k), n])),
      ownSitesLostRecently: flat(e.sl, 4).map(([kind, x, z, agoS]) => ({ siteKind: sname(kind), x, z, agoS })),
      knownEnemySites: flat(e.kn, 6).map(([id, kind, x, z, ageS, dead]) => ({ id, siteKind: sname(kind), x, z, ageS, dead: !!dead })),
      siteGuards: flat(e.gd, 3).map(([id, inf, aa]) => ({ id, infantry: inf, antiAir: aa })),
      scout: e.sc && e.sc.length === 3 ? { x: e.sc[0], z: e.sc[1], secondsLeft: e.sc[2] } : null, strikeTargetId: e.tg || null,
      productionPlan: Array.isArray(e.po) && e.po.length === 8 ? { posture: ['attack', 'hold', 'defend'][e.po[0]] || '?', populationBudget: { men: e.po[1], vehicles: e.po[2], aircraft: e.po[3] },
        populationOut: { men: e.po[4], vehicles: e.po[5], aircraft: e.po[6] }, budgetScalePct: e.po[7], fieldWantedVsOut: Object.fromEntries(flat(e.pp, 3).map(([k, f, h]) => [kname(k), { wanted: f, out: h }])) } : null,
    } : null,
    general: g ? { ageSeconds: age(R.gen.at), view: pickView(g.v), squads: sqs } : (sqs.length ? { squads: sqs } : null),
    log: { ageSeconds: age(R.logAt), lines: R.glog.slice(-logN).map(([T, k, text, x, z, tx, tz]) => ({ T, kind: k, text, at: pos(x, z) })) },
  };
  if (pd) out.map = {
    ageSeconds: age(R.pic.at),
    points: (pd.pts || []).map(p => ({ i: p.i, name: p.L + ' ' + p.name, x: p.x, z: p.z, holder: holder(p.hold), capture: p.c, base: p.base >= 0 ? (p.base === SIDE ? 'ours' : 'enemy') : undefined })),
    roads: pd.roads, seenEnemies: pd.foe, ownVehicles: pd.veh, veterans: pd.vet && pd.vet.map(v => ({ unit: v.who, kind: v.g, rank: RANKS[v.rank], x: v.x, z: v.z })), tickets: pd.tk, ticketsNote: 'index 0 = side 0, 1 = side 1',
    seat: pd.ctl, doctrine: pd.doc, posture: pd.post, operations: pd.ops, fireMissions: pd.fm, requests: pd.res, gate: pd.gate,
    commandNet: pd.cn || undefined,
    personality: pd.per || undefined, difficulty: pd.dif || undefined, enemyHabits: pd.hab && pd.hab.length ? pd.hab : undefined,   // W17: the side's AI general, and the roads the enemy is seen to use again and again
  };
  if (!e || !g) out.hint = 'parts that are null have not arrived yet: the host streams ecs about once a second and gen every two seconds';
  return out;
}
const pickView = v => { if (!v) return null; const o = {}; for (const k of ['doc', 'post', 'gate', 'atkT', 'ops', 'fm', 'sc', 'hit', 'focus', 'thr', 'want', 'res', 'ev', 'mev', 'gue', 'per', 'dif', 'hab']) if (v[k] !== undefined && v[k] !== null && !(Array.isArray(v[k]) && v[k].length === 0)) o[k] = v[k]; return o; };

/* ---------------------------------------------------------------- tools */
const unit = { type: 'string', pattern: '^[a-z0-9]{1,10}$', description: 'unit kind key as in this era\'s production list (lowercase letters/digits, 1-10 chars); ask_view lists costs by kind (modern: squad car truck lav aa art tank rad aaf fighter cas heli lift drone; ww2 has no lav/heli/lift/drone)' };
const siteId = { type: 'integer', description: 'site id (from get_state or ask_view)' };
const xz = { x: { type: 'number', description: 'map x, metres' }, z: { type: 'number', description: 'map z, metres' } };
/* a route: 1-8 waypoints [{x, z}] the squads walk through, in order, before the target; flattened into rt */
const ROUTE = { type: 'array', minItems: 1, maxItems: 8, items: { type: 'object', properties: xz, required: ['x', 'z'], additionalProperties: false },
  description: 'optional route: 1-8 waypoints {x, z} the squads walk through, in order, before the target (straight over dry ground, by the roads where a leg crosses water; at most 9 km in all). Refused rt if a point is off the map or in water' };
function rtOf(a) {
  if (a.route === undefined || a.route === null) return null;
  if (!Array.isArray(a.route) || a.route.length < 1 || a.route.length > 8 || !a.route.every(p => p && isNum(p.x) && isNum(p.z) && Math.abs(p.x) < 1e5 && Math.abs(p.z) < 1e5)) throw new Error('"route" must be 1-8 points {x, z}');
  const o = []; for (const p of a.route) o.push(p.x, p.z); return o;
}
const IDS = { type: 'array', maxItems: 12, items: { type: 'integer' }, description: 'squad ids from get_state (general.squads); omit to let the general pick' };
const withRt = (c, a) => { const rt = rtOf(a); if (rt) c.rt = rt; return c; };
const TOOLS = [
  { name: 'get_state', description: 'Read what your side knows, in readable names: economy (stock, income, your sites with ids and progress, the production queue with ids, reserves, known enemy sites), the commander view (posture, operations, squads with ids and jobs) and the last order-log lines. Every part carries ageSeconds: trust the age. Cheap and unlimited, it never asks the host. The MAP part (points with index, name, position and holder; roads; enemy sightings; your vehicles; squad positions and men; tickets; the name and rank of each squad, and your veteran vehicles and aircraft) comes from one question to the host: pass refresh_map: true to ask now (about a second, at most one a second; do it on your first call and after big moves); wait also refreshes it every 8 s, so after a wait it is recent. Positions are metres on the map (x, z). The ids in it are what the tactical commands name (squad ids in ids, point indexes in pi, enemy site ids in strike/raid). With from_host: true you instead get the host\'s raw whole picture (genState, large) as data.',
    inputSchema: { type: 'object', properties: { log_lines: { type: 'integer', minimum: 0, maximum: 80, description: 'how many recent log lines to include (default 10)' }, refresh_map: { type: 'boolean', description: 'ask the host for a fresh map picture and merge it in' }, from_host: { type: 'boolean', description: 'return the host\'s raw picture instead (large)' } }, additionalProperties: false },
    annotations: { readOnlyHint: true }, run: async a => {
      const e = need(a, { log_lines: ['i', false, 0, 80] }); if (e) throw new Error(e);
      for (const k of ['from_host', 'refresh_map']) if (a[k] !== undefined && typeof a[k] !== 'boolean') throw new Error('"' + k + '" must be a boolean');
      if (a.from_host) { await ready(); const r = await askState(); return { text: JSON.stringify({ answered: r.ok, result: explain(r), question: 'state', data: r.r }), error: !r.ok }; }
      try { await ready(); } catch (x) { return { text: JSON.stringify(Object.assign({ error: x.message }, stateView(0))), error: true }; }
      if (a.refresh_map) await refreshPic(1.2);
      return { text: JSON.stringify(stateView(a.log_lines === undefined ? 10 : a.log_lines)) };
    } },
  { name: 'wait', description: 'Let match time pass without flooding the host: returns when `seconds` of MATCH time (1-60) have passed, or earlier when something notable happens (an assault or operation started or ended, a point changed hands, one of your sites was destroyed or finished, a reinforcement or report line, an under-attack line), with a short summary of what changed (stock change, orders that left the queue, sites finished or lost, new log lines, events). The loop to play is: get_state -> a few orders -> wait -> get_state. A wait with seconds 20-40 is typical; use stop_on_event false to sleep the whole time. It sends nothing but one status question every 8 s, so it never trips the relay\'s rate limits. If the match clock does not advance (host paused or gone) it returns after a wall-clock limit saying so.',
    inputSchema: { type: 'object', properties: { seconds: { type: 'number', minimum: 1, maximum: WAITMAX, description: 'match seconds to wait (1-60, default 20)' }, stop_on_event: { type: 'boolean', description: 'return early on a notable event (default true)' } }, additionalProperties: false },
    annotations: { readOnlyHint: true }, run: async a => {
      const e = need(a, { seconds: ['n', false] }); if (e) throw new Error(e);
      if (a.stop_on_event !== undefined && typeof a.stop_on_event !== 'boolean') throw new Error('"stop_on_event" must be a boolean');
      try { await ready(); } catch (x) { return { text: JSON.stringify({ error: x.message }), error: true }; }
      return { text: JSON.stringify(await waitFor(Math.min(WAITMAX, Math.max(1, a.seconds === undefined ? 20 : a.seconds)), a.stop_on_event !== false)) };
    } },
  { name: 'get_log', description: 'Read the recent order log of your side (what the economy and commander did, with match time and map positions), newest last. Use it to confirm that an order took effect or to see what happened while you were thinking.',
    inputSchema: { type: 'object', properties: { lines: { type: 'integer', minimum: 1, maximum: 120, description: 'how many lines (default 30)' } }, additionalProperties: false },
    annotations: { readOnlyHint: true }, run: async a => { const e = need(a, { lines: ['i', false, 1, 120] }); if (e) throw new Error(e); const s = stateView(a.lines || 30); return { text: JSON.stringify(s.log) }; } },
  { name: 'build_site', description: 'Order a new economy site built: pow (power plant, energy), mine (metal mine, must sit on a deposit), fab (factory, produces units). Needs resources and queue room. If the position is refused, call ask_placement for the best spots first. Returns accepted (with the new site id) or the refusal reason.',
    inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['pow', 'mine', 'fab'] }, ...xz, angle: { type: 'number', description: 'optional heading, radians' }, why: WHYP }, required: ['kind', 'x', 'z'], additionalProperties: false },
    run: async a => { const e = need(a, { kind: ['w', true, ['pow', 'mine', 'fab']], x: ['n', true], z: ['n', true], angle: ['n', false], why: ['s', false] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'build' }, pick(a, ['kind', 'x', 'z', 'angle', 'why'], { kind: 'k', angle: 'a' }))); } },
  { name: 'produce_unit', description: 'Queue 1-5 units of a kind for production (they join the unassigned pool and the commander assigns them). Needs the era to allow the kind and room in the queue. Returns accepted with the first order id, or the refusal reason.',
    inputSchema: { type: 'object', properties: { kind: unit, count: { type: 'integer', minimum: 1, maximum: 5, description: 'how many (default 1)' }, why: WHYP }, required: ['kind'], additionalProperties: false },
    run: async a => { const e = need(a, { kind: ['w', true], count: ['i', false, 1, 5], why: ['s', false] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'make', n: 1 }, pick(a, ['kind', 'count', 'why'], { kind: 'k', count: 'n' }))); } },
  { name: 'cancel_order', description: 'Cancel a queued production or construction order by its id (from get_state queue). Refunds part of what it paid; cancelling a site order also removes the unfinished site.',
    inputSchema: { type: 'object', properties: { id: { type: 'integer', description: 'order id' }, why: WHYP }, required: ['id'], additionalProperties: false },
    run: async a => { const e = need(a, { id: ['i', true], why: ['s', false] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'cancel' }, pick(a, ['id', 'why']))); } },
  { name: 'set_priority', description: 'Move one of your queued orders to a position in the queue (0 = front) so it is served first.',
    inputSchema: { type: 'object', properties: { id: { type: 'integer', description: 'order id' }, position: { type: 'integer', minimum: 0, description: 'queue index, 0 first' }, why: WHYP }, required: ['id', 'position'], additionalProperties: false },
    run: async a => { const e = need(a, { id: ['i', true], position: ['i', true, 0, 999999], why: ['s', false] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'prio' }, pick(a, ['id', 'position', 'why'], { position: 'p' }))); } },
  { name: 'scrap_site', description: 'Scrap one of your finished sites: it is removed and part of its cost is refunded. Irreversible.',
    inputSchema: { type: 'object', properties: { id: siteId, why: WHYP }, required: ['id'], additionalProperties: false },
    run: async a => { const e = need(a, { id: ['i', true], why: ['s', false] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'scrap' }, pick(a, ['id', 'why']))); } },
  { name: 'set_site_defence', description: 'Set how many ground defenders (0-2) and whether an anti-air guard (0 or 1) the commander should keep posted at one of your sites.',
    inputSchema: { type: 'object', properties: { id: siteId, infantry: { type: 'integer', minimum: 0, maximum: 2 }, anti_air: { type: 'integer', minimum: 0, maximum: 1 }, why: WHYP }, required: ['id', 'infantry', 'anti_air'], additionalProperties: false },
    run: async a => { const e = need(a, { id: ['i', true], infantry: ['i', true, 0, 2], anti_air: ['i', true, 0, 1], why: ['s', false] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'def' }, pick(a, ['id', 'infantry', 'anti_air', 'why'], { infantry: 'inf', anti_air: 'aa' }))); } },
  { name: 'set_reserve', description: 'Set the reserve target the economy keeps in stock for a unit kind (0-6 units held back rather than sent out).',
    inputSchema: { type: 'object', properties: { kind: unit, count: { type: 'integer', minimum: 0, maximum: 6 }, why: WHYP }, required: ['kind', 'count'], additionalProperties: false },
    run: async a => { const e = need(a, { kind: ['w', true], count: ['i', true, 0, 6], why: ['s', false] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'keep' }, pick(a, ['kind', 'count', 'why'], { kind: 'k', count: 'n' }))); } },
  { name: 'set_production_plan', description: 'Set how many of a unit kind your general wants in the FIELD (the production plan): the economy then produces toward it and Dispatch sends each unit out with a mission as soon as it is ready, within the side\'s population budget. count -1 hands the kind back to the plan\'s own number (drawn from the posture and the enemy you know); kind "auto" hands every kind back. Kinds: tank, lav (modern), aa, art, truck, squad (squads carried by columns), fighter, cas, heli and lift (modern). get_state economy.productionPlan shows wanted vs out and the budget.',
    inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['auto', 'tank', 'lav', 'aa', 'art', 'truck', 'squad', 'fighter', 'cas', 'heli', 'lift'] }, count: { type: 'integer', minimum: -1, maximum: 20, description: 'units wanted in the field (-1: the plan\'s own; ignored for auto)' }, why: WHYP }, required: ['kind'], additionalProperties: false },
    run: async a => { const e = need(a, { kind: ['w', true], count: ['i', false, -1, 20], why: ['s', false] }); if (e) throw new Error(e); if (a.kind !== 'auto' && a.count === undefined) throw new Error('missing "count"'); return runCmd(Object.assign({ c: 'pplan' }, pick(a, ['kind', 'count', 'why'], { kind: 'k', count: 'n' })), 'cmd'); } },
  { name: 'dispatch_units', description: 'Send 1-4 units of a kind out of your reserve NOW, by one Dispatch order with a mission: aircraft (fighter, cas, heli) take off from the base toward the area, ground units (tank, aa, art, truck, squad) leave as a column on the road nearest the area. Give the area as a point index (pi) or x,z (r radius, default 300 m). mission is the mission kind (default: the class\'s own); latitude 0 strict, 1 normal, 2 free; roe hold, return or free; h_hour seconds to its H-hour. Refused res when the reserve has none, pop over the population budget.',
    inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['tank', 'aa', 'art', 'truck', 'squad', 'fighter', 'cas', 'heli'] }, count: { type: 'integer', minimum: 1, maximum: 4 }, mission: { type: 'string', enum: MISK }, pi: { type: 'integer', minimum: 0, description: 'point index from get_state map.points' }, ...xz, r: { type: 'number', minimum: 50, maximum: 3000 }, latitude: { type: 'integer', minimum: 0, maximum: 2 }, roe: { type: 'string', enum: ['hold', 'return', 'free'] }, h_hour: { type: 'number', minimum: 0, maximum: 300 }, why: WHYP }, required: ['kind'], additionalProperties: false },
    run: async a => { const e = need(a, { kind: ['w', true], count: ['i', false, 1, 4], mission: ['w', false, MISK], pi: ['i', false, 0, 999], x: ['n', false], z: ['n', false], r: ['n', false], latitude: ['i', false, 0, 2], roe: ['w', false, ['hold', 'return', 'free']], h_hour: ['n', false], why: ['s', false] }); if (e) throw new Error(e); if (a.pi === undefined && (a.x === undefined || a.z === undefined)) throw new Error('give pi or both x and z'); return runCmd(Object.assign({ c: 'disp' }, pick(a, ['kind', 'count', 'mission', 'pi', 'x', 'z', 'r', 'latitude', 'roe', 'h_hour', 'why'], { kind: 'k', count: 'n', mission: 'mk', latitude: 'lat', h_hour: 'H' })), 'cmd'); } },
  { name: 'assign_mission', description: 'Give squads already in the field (ids from get_state general.squads, at most 24) a new mission at an area (pi, or x,z with r): defend, garrison and reserve hold the spot, attack assaults it, recon observes it, any other kind moves there. Optional latitude 0-2, roe hold|return|free, break_off (0-1, the strength under which they fall back), h_hour (seconds). The squads become a manual operation the AI leaves alone until freed (send_command free).',
    inputSchema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'integer' }, maxItems: 24 }, mission: { type: 'string', enum: MISK }, pi: { type: 'integer', minimum: 0 }, ...xz, r: { type: 'number', minimum: 50, maximum: 3000 }, latitude: { type: 'integer', minimum: 0, maximum: 2 }, roe: { type: 'string', enum: ['hold', 'return', 'free'] }, break_off: { type: 'number', minimum: 0, maximum: 1 }, h_hour: { type: 'number', minimum: 0, maximum: 300 }, why: WHYP }, required: ['ids', 'mission'], additionalProperties: false },
    run: async a => { const e = need(a, { mission: ['w', true, MISK], pi: ['i', false, 0, 999], x: ['n', false], z: ['n', false], r: ['n', false], latitude: ['i', false, 0, 2], roe: ['w', false, ['hold', 'return', 'free']], break_off: ['n', false], h_hour: ['n', false], why: ['s', false] }); if (e) throw new Error(e); if (!Array.isArray(a.ids) || !a.ids.length || a.ids.length > 24 || !a.ids.every(isInt)) throw new Error('ids must be 1-24 squad ids'); if (a.pi === undefined && (a.x === undefined || a.z === undefined)) throw new Error('give pi or both x and z'); return runCmd(Object.assign({ c: 'mis' }, pick(a, ['ids', 'mission', 'pi', 'x', 'z', 'r', 'latitude', 'roe', 'break_off', 'h_hour', 'why'], { mission: 'mk', latitude: 'lat', break_off: 'brk', h_hour: 'H' })), 'cmd'); } },
  { name: 'get_production_plan', description: 'Ask the host for your side\'s production plan now: posture, the population budget and what is out, and per kind the field wanted, out, in reserve, queued, why and whether a command fixed it. One host question a second.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true },
    run: async () => runAsk({ q: 'plan' }) },
  { name: 'get_logistics', description: 'Ask the host for your side\'s physical logistics now: every supply node (key b<id> for a supply base, p<index> for a point you hold) with its crates and cap, priority, whether it is tied to your main base, crates on their way and how long it has been dry; the convoys and airlifts under way; the crates an entry costs by kind (soldier 2, squad 8, car/truck 5, light armour/AA 12, artillery 15, rocket launcher/tank 20) and the weak line, if any. The main base is unlimited but far from the front. One host question a second.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true },
    run: async () => runAsk({ q: 'logi' }) },
  { name: 'send_convoy', description: 'Send a supply convoy now: a truck leaves the main base with 40 crates (30 metal) by road to the node (key from get_logistics: b<id> or p<index>), unloads what fits and comes back; on a dangerous road an escort goes with it when the reserve has one. A truck destroyed loses its load and costs 3 tickets; one left standing alone can be taken by enemy infantry. Refused node, cut (the point is cut off from your base: use airlift_supply), full, mt (no metal) or conv (4 already on their way).',
    inputSchema: { type: 'object', properties: { node: { type: 'string', pattern: '^[bp][0-9]{1,6}$' }, why: WHYP }, required: ['node'], additionalProperties: false },
    run: async a => { const e = need(a, { node: ['w', true], why: ['s', false] }); if (e) throw new Error(e); if (!/^[bp][0-9]{1,6}$/.test(a.node)) throw new Error('node must be b<id> or p<index>'); return runCmd(Object.assign({ c: 'conv' }, pick(a, ['node', 'why'], { node: 'nd' })), 'cmd'); } },
  { name: 'airlift_supply', description: 'Modern era only: a transport helicopter from your reserve flies 20 crates (15 metal) to the node over any road, lands beside it and comes back to the reserve; exposed to anti-air. Refused era, node, full, mt, conv, or lift (no transport helicopter in the reserve: produce a lift).',
    inputSchema: { type: 'object', properties: { node: { type: 'string', pattern: '^[bp][0-9]{1,6}$' }, why: WHYP }, required: ['node'], additionalProperties: false },
    run: async a => { const e = need(a, { node: ['w', true], why: ['s', false] }); if (e) throw new Error(e); if (!/^[bp][0-9]{1,6}$/.test(a.node)) throw new Error('node must be b<id> or p<index>'); return runCmd(Object.assign({ c: 'alift' }, pick(a, ['node', 'why'], { node: 'nd' })), 'cmd'); } },
  { name: 'set_supply_priority', description: 'How the logistics general ranks a node when it schedules convoys by itself: 0 never, 1 low, 2 normal (a supply base\'s default; a point\'s is 1), 3 first; -1 gives it back its default.',
    inputSchema: { type: 'object', properties: { node: { type: 'string', pattern: '^[bp][0-9]{1,6}$' }, priority: { type: 'integer', minimum: -1, maximum: 3 }, why: WHYP }, required: ['node', 'priority'], additionalProperties: false },
    run: async a => { const e = need(a, { node: ['w', true], priority: ['i', true, -1, 3], why: ['s', false] }); if (e) throw new Error(e); if (!/^[bp][0-9]{1,6}$/.test(a.node)) throw new Error('node must be b<id> or p<index>'); return runCmd(Object.assign({ c: 'sprio' }, pick(a, ['node', 'priority', 'why'], { node: 'nd', priority: 'p' })), 'cmd'); } },
  { name: 'get_recovery', description: 'Ask the host for your side\'s vehicle recovery and medical evacuation now: the immobilized hulks (your own, and the enemy\'s you saw lately) with their number id, kind, place, whether one is being towed or has a recovery vehicle coming, and the seconds before an untouched one is written off; the groups of wounded waiting (how many, how many stabilized); the recovery vehicles, ambulances and evacuation helicopters out; what is in the reserve (arv, amb, lift); the crates a full repair costs by kind; the wounded counted toward the next squad back in the reserve. One host question a second.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true },
    run: async () => runAsk({ q: 'rec' }) },
  { name: 'recover_vehicle', description: 'Send the reserve\'s recovery vehicle to an immobilized hulk (id from get_recovery): it goes by road, hitches the hulk and tows it to your nearest supply base with the crates (else the main base), where the full repair costs crates and the vehicle goes back to the reserve with its veterancy. An enemy hulk at most 300 m past your line is captured into your reserve. Refused id (no such hulk), tow (one is already on its way), far (an enemy hulk too far forward) or nores (no recovery vehicle in the reserve: produce an arv).',
    inputSchema: { type: 'object', properties: { id: { type: 'integer', minimum: 1 }, why: WHYP }, required: ['id'], additionalProperties: false },
    run: async a => { const e = need(a, { id: ['i', true, 1, 1e9], why: ['s', false] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'recv' }, pick(a, ['id', 'why'])), 'cmd'); } },
  { name: 'send_medevac', description: 'Evacuate your wounded lying within 250 m of a map position: an ambulance from the reserve goes by road and brings up to 4 back to the nearest node (in the modern era the transport helicopter flies it when they lie far from a road, the road is dangerous or no ambulance is in the reserve). Every squad\'s worth of wounded brought in goes back to the reserve as a squad; a badly wounded soldier who is not evacuated dies 10 minutes after first aid. Refused hurt (no wounded there) or nores.',
    inputSchema: { type: 'object', properties: { ...xz, why: WHYP }, required: ['x', 'z'], additionalProperties: false },
    run: async a => { const e = need(a, { x: ['n', true], z: ['n', true], why: ['s', false] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'medv' }, pick(a, ['x', 'z', 'why'])), 'cmd'); } },
  { name: 'get_bridges', description: 'Ask the host for the bridges now: every place a road crosses the river (id, name, road class 0 main / 1 secondary / 2 track, x, z, the axes it carries), its state (ok, hurt, down), hp %, whether its crossing is open, its pontoon if any (own or foe, % laid) and its two bank ends (home: 1 on your bank). A bridge down shuts the river there for everything but amphibious vehicles; with every bridge down nothing crosses on the ground. One host question a second.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true },
    run: async () => runAsk({ q: 'brg' }) },
  { name: 'demolish_bridge', description: 'Manoeuvre "demolição no recuo": the nearest free squad on your bank goes to the bridge nearest x,z (within 800 m; positions from get_bridges) and sets its demolition charges at the end; the bridge falls (main road 4 charges, secondary 3, track 2) and its stretch of river is shut. Refused down (already), busy (an operation there), sq (no free squad), server (old server), ctl, max, cd.',
    inputSchema: { type: 'object', properties: { ...xz, why: WHYP }, required: ['x', 'z'], additionalProperties: false },
    run: async a => { const e = need(a, { x: ['n', true], z: ['n', true], why: ['s', false] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'man', k: 'demolish' }, pick(a, ['x', 'z', 'why'])), 'cmd'); } },
  { name: 'lay_pontoon', description: 'Manoeuvre "travessia": the nearest free squad on your bank (sappers first) takes a pontoon to the fallen bridge nearest x,z and lays it at the bank end: 4 min for one sapper, 2 min at best (any other soldier counts half). Done, the crossing carries everything again until the pontoon is destroyed. Refused whole (the bridge stands), pont (one is there already), busy, sq, server, ctl, max, cd.',
    inputSchema: { type: 'object', properties: { ...xz, why: WHYP }, required: ['x', 'z'], additionalProperties: false },
    run: async a => { const e = need(a, { x: ['n', true], z: ['n', true], why: ['s', false] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'man', k: 'cross' }, pick(a, ['x', 'z', 'why'])), 'cmd'); } },
  { name: 'scout', description: 'Send a scout to a map position to look for enemy sites. Results show up as known enemy sites in get_state and in the log. One scout mission at a time.',
    inputSchema: { type: 'object', properties: { ...xz, why: WHYP }, required: ['x', 'z'], additionalProperties: false },
    run: async a => { const e = need(a, { x: ['n', true], z: ['n', true], why: ['s', false] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'scout' }, pick(a, ['x', 'z', 'why']))); } },
  { name: 'strike', description: 'Target a known enemy site (id from knownEnemySites, not dead, recently seen) for an artillery mission. Refused as unknown if the sighting is stale or never made.',
    inputSchema: { type: 'object', properties: { id: { type: 'integer', description: 'enemy site id from knownEnemySites' }, why: WHYP }, required: ['id'], additionalProperties: false },
    run: async a => { const e = need(a, { id: ['i', true], why: ['s', false] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'strike' }, pick(a, ['id', 'why']))); } },
  { name: 'send_command', description: 'Send any command object to the host, or (with question instead of command) a raw question. command is {"c": name, ...params}; d is "eco" for the economy names (build, make, cancel, prio, scrap, def, keep, scout, strike: the dedicated tools are easier) and "cmd" for everything else (default eco; the host ignores d, it is only a hint).\n'
    + 'GENERAL COMMANDS (ids = squad ids from get_state general.squads, at most 24; pi = point index from get_state map.points; x, z in metres; why = short note for the log). Unless noted, the answer is accepted with an operation id or refused with a Portuguese reason:\n'
    + '- atk {pi | x,z (nearest point within 600 m) | ri,s; ids?: squads to use (omit for the AI\'s pick), sd?: 1 to split, H?: seconds to H-hour 20-300, smk?: 0 for no smoke, fx,fz?: fire-support point, x2,z2?: second approach} planned assault on a point; refused link (point not adjacent to one of ours), own, busy, max (at most the side\'s fronts: 3 cautious, 4 balanced, 5 aggressive), sq, tk.\n'
    + '- stop {id}: call off operation id (assault, ambush, ...).  man {k: flank|infiltrate|raid|encircle|block|depth|feint|reserve|harass|demolish|cross, pi? | ri,s? | x,z, n?: squads, k2?: via, H?, id?}: a manoeuvre (demolish: blow the bridge nearest x,z; cross: a pontoon at the fallen bridge nearest x,z).\n'
    + '- amb {x,z, ids?}: ambush at the nearest road site.  res {x,z | home:1}: move the reserve (home sends it back).  ctr {x,z, pi?}: counter-attack with the reserve.  hold {pi, ids} or {x,z, ids}: squads hold a point or a spot.\n'
    + '- mil {pi | x,z}: arm a town\'s civilians as a militia squad that holds it (needs 3 of your soldiers in the town, once every 150 s a town; refused hate if the town turned against you after your fire killed 5 of its people, nociv with nobody left to arm, mil0 without 3 of your soldiers there; each civilian your side kills costs 2 tickets).\n'
    + '- raid {id: enemy site id, ids}: squads raid a seen enemy site.  sup {x,z, a?: heading, ids}: engineers build a supply base.  work {k: trench|sandbag, x,z, ids, a?}: dig in.  req {k: car|truck|rad|lav|aa|art|tank|heli, ri?}: requisition a vehicle from the depot (costs tickets).\n'
    + '- fire {k: he|smk, x,z, n?: 1-8 rounds}: fire mission (refused fire if no mortar/battery reaches it; refused roe where your side saw civilians in the open there in the last 20 s and the target is not identified; at most 6 live).  recon / move / assault {x,z, ids}: manual orders to squads (they become a "usr" operation and the AI leaves them alone until free).  free {ids}: hand manual squads back to the AI.\n'
    + '- doc {k: cautious|balanced|aggressive}: doctrine.  pos {ri, k: atk|hold|def|auto, H?}: posture of a road.  focus {x,z, r?} / rally {x,z | home:1} / mark {x,z | home:1}: air focus, rally point, pilot mark.  posts {k: eng|line|garr|mort|wood|road|base|push|amb, n: -1..6}: how many squads hold each post.\n'
    + '- ctl {k2: eco|atk|def|sup, k: ai|me}: which domains the AI also decides (me = you decide, ai = the AI too).\n'
    + '- pplan {k: kind | auto, n: field count 0-20 or -1}: the production plan.  disp {k, n?: 1-4, mk?: mission, pi | x,z, r?, lat?, roe?, H?, why?}: dispatch from the reserve with a mission.  mis {ids, mk, pi | x,z, r?, lat?, roe?, brk?, H?}: squads take a mission (the dedicated tools are easier).\n'
    + '- conv {nd} / alift {nd} / sprio {nd, p: -1..3}: logistics: a convoy, the airlift, a node\'s priority (nd: b<supply base id> | p<point index>).\n'
    + '- recv {id} / medv {x,z}: recovery and evacuation: a recovery vehicle for an immobilized hulk (id from the question rec), an evacuation of the wounded near x,z.\n'
    + '- ord {k: atk|def|rec|esc|amb|fire, pi | x,z, ids? | n?: 1-6 squads the general picks, k2?: a unit kind to create n of, rt?}: an abstract order (order_units is easier).  fort {k: trench|sandbag|bunker|atpost|post|aapos|mineat|mineap|sup|radio, x,z, a?, ids?, rt?}: a fortification, the general picks the builder (build_defence).  req {k: fire|recon|cas|lift|radio, x,z, n?, ids?, rt?}: a request for support (request_support).\n'
    + '- rt: a route, a flat list [x0, z0, x1, z1, ...] of 1-8 waypoints, on move, hold (x,z), recon, assault, work, man (flank, feint), ord (atk, def, rec, esc), fort (every kind but sup) and req (recon, lift).\n'
    + '- camp {H?: s to H-hour 20-300, why?} opens a campaign (answers its id); camp {id, op: operation id, role?: main|sec|fnt|raid} attaches an operation to it (an assault takes its H-hour); camp {id, k: end} ends it.  dpol {pi | id: own site or supply base, inf?: 0-3 squads to answer, aa?: 0-1 the site\'s fixed AA, qrf?: 0 never answer, 1 by triage, 2 always}: a place\'s defence policy.  triage {id: threat id, p: -1 ignore | 0 auto | 1-3 priority}.  qrf {id: threat id, ids?}: answer a threat now (one squad fixes, the others flank at a common H-hour, fire and air focus at H).\n'
    + '- expand {id: deposit i, inf?: 0-2, aa?: 0-1}: claim a deposit, a mine on it and its guard (claim_deposit).  clear {x,z, ids?}: sappers sweep a place for mines (clear_mines).  sabot {pi | x,z, ids?}: a raid with sappers and charges (sabotage).\n'
    + 'QUESTIONS {q: spots (k) | why (k,x,z) | view | state | pool (x,z: squads that could assault there) | amb (x,z) | fire (k,x,z) | plan | logi | rec | brg | threats (the threat board: incidents with id, value, urgency, known enemy, state open|resp|ign and why; the campaigns; the side\'s fronts) | missions | unit (id: a squad\'s card) | lots | mines}. Params allowed in a command: k, k2, mk, roe, nd, role (short lowercase words), x, z, a, s, fx, fz, x2, z2, H, r, brk (numbers), n, id, p, inf, aa, qrf, ri, op, j, pi, sd, smk, home, lat (integers), ids (list), rt (flat list of 1-8 x,z pairs), why (text up to 120 chars). Anything else is rejected. Refusal codes (Portuguese text is returned with them; ctl: you lack the seat): ' + Object.keys(PT).join(', ') + '.',
    inputSchema: { type: 'object', properties: { d: { type: 'string', enum: ['eco', 'cmd'], description: 'which dispatcher (default eco)' }, command: { type: 'object', description: 'the command: {"c": "name", ...params}', properties: { c: { type: 'string', pattern: '^[a-z]{2,8}$' } }, required: ['c'] }, question: { type: 'object', description: 'a question instead of a command: {"q": kind, k?, x?, z?, a?}', properties: { q: { type: 'string', enum: ASKS } }, required: ['q'] } }, additionalProperties: false },
    run: async a => {
      if (!a || (a.command === undefined) === (a.question === undefined)) throw new Error('give exactly one of command or question');
      if (a.question !== undefined) { const e = rawAsk(a.question); if (e) throw new Error(e); return runAsk(a.question); }
      if (a.d !== undefined && a.d !== 'eco' && a.d !== 'cmd') throw new Error('d must be "eco" or "cmd"'); const e = rawCmd(a.command); if (e) throw new Error(e); return runCmd(a.command, a.d || 'eco');
    } },
  { name: 'order_units', description: 'An abstract order to squads: a verb and a target, and the squads decide how. verb attack: each squad forms up on its own axis around the objective (up to three axes) and assaults; defend: a ring of holds facing the enemy\'s base; recon: observe the place; escort: keep around your own vehicle nearest x, z (within 300 m), following it as it moves; ambush: at the nearest road site; fire: a fire mission by whatever mortars and batteries reach (rounds 1-8, default 3). Target: point (index from get_state map.points; attack snaps x, z to the nearest point not yours within 400 m, defend to any point within 400 m) or x, z. Who: ids (squads you name), else count squads the general picks (the nearest free ones with a way there; default attack 3, defend 2, recon 1, escort 2), or create: a unit kind (squad tank aa art truck fighter cas heli, as dispatch_units) to dispatch count new ones from the reserve with this verb\'s mission instead (the economy must be on; new squads take the order once on foot, new batteries fire once in range). Optional route: waypoints the squads walk through first (attack, defend, recon, escort). Accepted with an operation id (cancel it with send_command stop, hand the squads back with free) or refused: way (no squad has a way there on foot, at most 9 km), sq, own, at, map, rt, esc (no own vehicle near to escort), mv (needs the road-network map), and for create the dispatch reasons (off, kind, pop, res).',
    inputSchema: { type: 'object', properties: { verb: { type: 'string', enum: ['attack', 'defend', 'recon', 'escort', 'ambush', 'fire'] }, point: { type: 'integer', description: 'point index from get_state map.points' }, ...xz, ids: IDS, count: { type: 'integer', minimum: 1, maximum: 6, description: 'squads the general picks when ids is omitted, or units to create with create (at most 4)' }, create: { type: 'string', pattern: '^[a-z0-9]{1,10}$', description: 'a unit kind: dispatch count new ones from the reserve for this order' }, rounds: { type: 'integer', minimum: 1, maximum: 8, description: 'verb fire only: rounds per tube' }, route: ROUTE, why: WHYP }, required: ['verb'], additionalProperties: false },
    run: async a => {
      const e = need(a, { verb: ['w', true, ['attack', 'defend', 'recon', 'escort', 'ambush', 'fire']], point: ['i', false, 0, 99], x: ['n', false], z: ['n', false], count: ['i', false, 1, 6], create: ['w', false], rounds: ['i', false, 1, 8], why: ['s', false] }); if (e) throw new Error(e);
      if (a.point === undefined && (a.x === undefined || a.z === undefined)) throw new Error('give point or both x and z');
      if (a.ids !== undefined && !(Array.isArray(a.ids) && a.ids.length <= 12 && a.ids.every(isInt))) throw new Error('"ids" must be a list of at most 12 squad ids');
      if (a.create !== undefined && a.ids !== undefined) throw new Error('give ids or create, not both');
      if (a.create !== undefined && a.count > 4) throw new Error('create makes at most 4 units per order');
      if (a.rounds !== undefined && a.verb !== 'fire') throw new Error('"rounds" is for verb fire only');
      if (a.verb === 'fire' && a.create === undefined && a.count !== undefined) throw new Error('verb fire takes rounds, not count (or create batteries with create and count)');
      const k = { attack: 'atk', defend: 'def', recon: 'rec', escort: 'esc', ambush: 'amb', fire: 'fire' }[a.verb], c = Object.assign({ c: 'ord', k }, pick(a, ['point', 'x', 'z', 'ids', 'create', 'why'], { point: 'pi', create: 'k2' }));
      if (a.create !== undefined || a.verb !== 'fire') { if (a.count !== undefined) c.n = a.count; } else if (a.rounds !== undefined) c.n = a.rounds;
      return runCmd(withRt(c, a), 'cmd');
    } },
  { name: 'request_support', description: 'Ask for support at a place; the general picks who answers. kind fire: an artillery fire mission by the mortars and batteries that reach it (rounds 1-8, default 3); recon: the nearest free squad goes to observe (count of them, or the ids you name; optional route); cas: the side\'s attack aircraft in the air get the pilots\' mark and the air focus there (refused air when none is up); lift: the squads you name (or count of the nearest free ones) head there at a run and a free truck carries them when the way is long (optional route); radio: cover a place with the command net: the side\'s free radio vehicle drives there by the roads and holds 4 min with its mast up, else (or the ids you name, with a radio operator among them) a squad with a radio operator goes and holds (optional route, which sends an operator). Smoke is a fire mission of its own (send_command fire with k smk). Accepted, or refused with the reason (fire: nothing reaches; way, sq, map, rt, air; nrad: no free radio vehicle or operator).',
    inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['fire', 'recon', 'cas', 'lift', 'radio'] }, ...xz, rounds: { type: 'integer', minimum: 1, maximum: 8, description: 'fire only' }, ids: IDS, count: { type: 'integer', minimum: 1, maximum: 6, description: 'recon and lift only' }, route: ROUTE, why: WHYP }, required: ['kind', 'x', 'z'], additionalProperties: false },
    run: async a => {
      const e = need(a, { kind: ['w', true, ['fire', 'recon', 'cas', 'lift', 'radio']], x: ['n', true], z: ['n', true], rounds: ['i', false, 1, 8], count: ['i', false, 1, 6], why: ['s', false] }); if (e) throw new Error(e);
      if (a.ids !== undefined && !(Array.isArray(a.ids) && a.ids.length <= 12 && a.ids.every(isInt))) throw new Error('"ids" must be a list of at most 12 squad ids');
      if (a.rounds !== undefined && a.kind !== 'fire') throw new Error('"rounds" is for kind fire only');
      if (a.count !== undefined && a.kind !== 'recon' && a.kind !== 'lift') throw new Error('"count" is for kinds recon and lift only');
      const c = Object.assign({ c: 'req', k: a.kind }, pick(a, ['x', 'z', 'ids', 'why'])); if (a.kind === 'fire' && a.rounds !== undefined) c.n = a.rounds; else if (a.count !== undefined) c.n = a.count;
      return runCmd(withRt(c, a), 'cmd');
    } },
  { name: 'build_defence', description: 'Order a field fortification at a place: trench; sandbag (a sandbag emplacement); bunker (a machine-gun nest); atpost (an anti-tank post); post (an observation tower); aapos (an AA position: a fixed anti-aircraft gun, one from the reserve when the economy is on); mineat or mineap (a minefield, anti-tank or anti-personnel, of 5 mines across the way to the enemy); sup (a supply base); radio (a radio relay: a mast that extends the command net about 2.8 km around it once built, at most 3 a side, its own cap apart from the field works; it can be jammed, located by direction finding and destroyed). The general picks the builder (an engineer squad first, then the nearest free one) unless you name ids. Works start once the builders are there and no enemy is near. Optional facing (radians; default toward the enemy base) and route (every kind but sup) the builders walk first. Accepted with an operation id or refused (way, sq, map, rt, fcap: the side already has its most field works, cost: short of energy or metal, rcap: the side already has its 3 radio relays, crl: the relay\'s server is too old, res: no fixed AA in the reserve, max, mcap: the side\'s mine limit, off, and for sup the supply-base reasons: steep, road, obj, base, foe, cap, reach).',
    inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['trench', 'sandbag', 'bunker', 'atpost', 'post', 'aapos', 'mineat', 'mineap', 'sup', 'radio'] }, ...xz, facing: { type: 'number', description: 'heading in radians' }, ids: IDS, route: ROUTE, why: WHYP }, required: ['kind', 'x', 'z'], additionalProperties: false },
    run: async a => {
      const e = need(a, { kind: ['w', true, ['trench', 'sandbag', 'bunker', 'atpost', 'post', 'aapos', 'mineat', 'mineap', 'sup', 'radio']], x: ['n', true], z: ['n', true], facing: ['n', false], why: ['s', false] }); if (e) throw new Error(e);
      if (a.ids !== undefined && !(Array.isArray(a.ids) && a.ids.length <= 12 && a.ids.every(isInt))) throw new Error('"ids" must be a list of at most 12 squad ids');
      return runCmd(withRt(Object.assign({ c: 'fort', k: a.kind }, pick(a, ['x', 'z', 'facing', 'ids', 'why'], { facing: 'a' })), a), 'cmd');
    } },
  /* ---- MCP v2 (W13): the rest of the general's tools, the same commands the general's view gives a person ---- */
  { name: 'get_threats', description: 'Ask the host for your side\'s threat board now: every incident (id, kind point/site/air, name, value, urgency, the enemy known there, your own force there, score, state open|resp|ign, the priority you gave it, why, the squads answering and their H-hour), the campaigns (id, state, seconds to H, operations with their roles) and the defence policies you set (pol, by key p<point index>, s<site id>, b<supply base id>), and how many fronts your doctrine allows. Use the ids with triage_threat, send_qrf and attach_operation. One host question a second.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, run: async () => runAsk({ q: 'threats' }) },
  { name: 'get_missions', description: 'Ask the host for every mission of your side now: squads by id (job, men, mission kind and its Portuguese name, state way|exec|done|inviable|lost, the general\'s words, operation id, area x z r, latitude 0-2, roe, break-off, seconds to H-hour, where the squad is), vehicles and aircraft by kind with the same mission fields. One host question a second.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, run: async () => runAsk({ q: 'missions' }) },
  { name: 'get_unit', description: 'The unit card of one of your squads (id from get_state general.squads or get_missions): what it sees (men standing, wounded, suppressed, its radio link, its contacts and the most dangerous one with its distance and how well it is made out) and what it decides (its mission, latitude, rules of engagement and break-off, the order it holds or that is on its way by radio, its operation and post, what its own mind chose now: carry out the mission, fall back or answer a call for help, the call for help it has open), as data and as two lists of Portuguese sentences, see and decide (the same card a person sees on the general\'s view). Refused id when no such live squad. One host question a second.',
    inputSchema: { type: 'object', properties: { id: { type: 'integer', description: 'squad id' } }, required: ['id'], additionalProperties: false }, annotations: { readOnlyHint: true },
    run: async a => { const e = need(a, { id: ['i', true, 0, 999999] }); if (e) throw new Error(e); return runAsk({ q: 'unit', id: a.id }); } },
  { name: 'get_lots', description: 'Ask the host for the lots of your seat town (map version 5): kind (pow, mine, fab, dep: a supply base), x, z, facing a, size w d, free or the site id on it. build_site on a free lot of its kind snaps to the lot. One host question a second.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, run: async () => runAsk({ q: 'lots' }) },
  { name: 'get_mines', description: 'Ask the host for the mines your side knows: its own (kind 0 anti-tank, 1 anti-personnel, x, z), the enemy mines it has found, its suspect fields (where a mine went off or was seen) and the side\'s mine limit. One host question a second.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, run: async () => runAsk({ q: 'mines' }) },
  { name: 'create_campaign', description: 'Open a campaign: a common H-hour for several operations, so assaults, feints and raids strike together (the attack domain). h_hour: seconds to H, 20-300 (default 60). Accepted with the campaign id (use it with attach_operation and end_campaign) or refused (off, max: the side already has its most campaigns).',
    inputSchema: { type: 'object', properties: { h_hour: { type: 'number', minimum: 20, maximum: 300 }, why: WHYP }, additionalProperties: false },
    run: async a => { const e = need(a || {}, { h_hour: ['n', false], why: ['s', false] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'camp' }, pick(a || {}, ['h_hour', 'why'], { h_hour: 'H' })), 'cmd'); } },
  { name: 'attach_operation', description: 'Attach one of your operations (id from get_state general.operations or get_threats) to a campaign: an assault takes the campaign\'s H-hour. role: main (the main effort, one a campaign), sec (secondary), fnt (a feint) or raid; default: the first assault main, the next sec, a feint fnt, a raid raid. Refused id (no such campaign or operation), busy (it is in another campaign, or the campaign has its main effort), kind (that role does not fit the operation).',
    inputSchema: { type: 'object', properties: { campaign: { type: 'integer' }, operation: { type: 'integer' }, role: { type: 'string', enum: ['main', 'sec', 'fnt', 'raid'] } }, required: ['campaign', 'operation'], additionalProperties: false },
    run: async a => { const e = need(a, { campaign: ['i', true, 0, 999999], operation: ['i', true, 0, 999999], role: ['w', false, ['main', 'sec', 'fnt', 'raid']] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'camp' }, pick(a, ['campaign', 'operation', 'role'], { campaign: 'id', operation: 'op' })), 'cmd'); } },
  { name: 'end_campaign', description: 'End a campaign (its operations go on by themselves).',
    inputSchema: { type: 'object', properties: { campaign: { type: 'integer' } }, required: ['campaign'], additionalProperties: false },
    run: async a => { const e = need(a, { campaign: ['i', true, 0, 999999] }); if (e) throw new Error(e); return runCmd({ c: 'camp', id: a.campaign, k: 'end' }, 'cmd'); } },
  { name: 'set_defence_policy', description: 'The defence policy of a place (the defence domain): a point (index) or one of your sites or supply bases (site id). infantry: at most 0-3 squads the threat board sends to answer there (a site: also its own guard, 0-2); anti_air: 0-1 the site\'s fixed AA; reaction: 0 never answer a threat there, 1 by the board\'s triage (default), 2 always. Refused at (no such point), id (no such site of yours), shape.',
    inputSchema: { type: 'object', properties: { point: { type: 'integer' }, site: { type: 'integer' }, infantry: { type: 'integer', minimum: 0, maximum: 3 }, anti_air: { type: 'integer', minimum: 0, maximum: 1 }, reaction: { type: 'integer', minimum: 0, maximum: 2 }, why: WHYP }, additionalProperties: false },
    run: async a => {
      const e = need(a, { point: ['i', false, 0, 999], site: ['i', false, 0, 999999], infantry: ['i', false, 0, 3], anti_air: ['i', false, 0, 1], reaction: ['i', false, 0, 2], why: ['s', false] }); if (e) throw new Error(e);
      if ((a.point === undefined) === (a.site === undefined)) throw new Error('give exactly one of point or site');
      return runCmd(Object.assign({ c: 'dpol' }, pick(a, ['point', 'site', 'infantry', 'anti_air', 'reaction', 'why'], { point: 'pi', site: 'id', infantry: 'inf', anti_air: 'aa', reaction: 'qrf' })), 'cmd');
    } },
  { name: 'triage_threat', description: 'Set the priority of an incident on the threat board (id from get_threats): -1 ignore it (its answer is called off), 0 the board\'s own judgement, 1-3 a priority (3 the highest).',
    inputSchema: { type: 'object', properties: { id: { type: 'integer' }, priority: { type: 'integer', minimum: -1, maximum: 3 } }, required: ['id', 'priority'], additionalProperties: false },
    run: async a => { const e = need(a, { id: ['i', true, 0, 999999], priority: ['i', true, -1, 3] }); if (e) throw new Error(e); return runCmd({ c: 'triage', id: a.id, p: a.priority }, 'cmd'); } },
  { name: 'send_qrf', description: 'Answer an incident of the threat board now with the quick reaction force (id from get_threats): one squad fixes it, the others flank at a common H-hour, with fire and the air focus at H. ids: the squads to send (default: the board picks the nearest free ones, as many as the place\'s policy allows). Refused id, busy (already answered, or the squads you named are in operations), kind (an air incident: that is the AA\'s), max (too many answers at once), sq (no free squad).',
    inputSchema: { type: 'object', properties: { id: { type: 'integer' }, ids: IDS }, required: ['id'], additionalProperties: false },
    run: async a => { const e = need(a, { id: ['i', true, 0, 999999] }); if (e) throw new Error(e); if (a.ids !== undefined && !(Array.isArray(a.ids) && a.ids.length <= 12 && a.ids.every(isInt))) throw new Error('"ids" must be a list of at most 12 squad ids'); return runCmd(Object.assign({ c: 'qrf' }, pick(a, ['id', 'ids'])), 'cmd'); } },
  { name: 'claim_deposit', description: 'Claim a resource deposit (its i from ask_view economy.dep): a metal mine is built on it (on the deposit or the nearest place round it the economy takes) and its guard is set (infantry 0-2 squads, default 1; anti_air 0-1, default 0) (the economy domain). Accepted with the new site id, or refused id (no such deposit), hasmine (yours is there), foemine (an enemy mine is known there), or a build reason (far: out of your territory, front: ahead of the line, steep, obj, q: queue full, cap, en/mt).',
    inputSchema: { type: 'object', properties: { deposit: { type: 'integer', minimum: 0 }, infantry: { type: 'integer', minimum: 0, maximum: 2 }, anti_air: { type: 'integer', minimum: 0, maximum: 1 }, why: WHYP }, required: ['deposit'], additionalProperties: false },
    run: async a => { const e = need(a, { deposit: ['i', true, 0, 999], infantry: ['i', false, 0, 2], anti_air: ['i', false, 0, 1], why: ['s', false] }); if (e) throw new Error(e); return runCmd(Object.assign({ c: 'expand' }, pick(a, ['deposit', 'infantry', 'anti_air', 'why'], { deposit: 'id', infantry: 'inf', anti_air: 'aa' }))); } },
  { name: 'lay_minefield', description: 'Lay a minefield at a place: kind at (anti-tank) or ap (anti-personnel), 5 mines across the way to the enemy; the general picks the layers (sappers, engineers first) unless you name ids (the same order as build_defence mineat/mineap). Optional facing (radians) and route. Refused like build_defence (mcap: the side\'s mine limit, way, sq, map, rt, fcap).',
    inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['at', 'ap'] }, ...xz, facing: { type: 'number' }, ids: IDS, route: ROUTE, why: WHYP }, required: ['kind', 'x', 'z'], additionalProperties: false },
    run: async a => {
      const e = need(a, { kind: ['w', true, ['at', 'ap']], x: ['n', true], z: ['n', true], facing: ['n', false], why: ['s', false] }); if (e) throw new Error(e);
      if (a.ids !== undefined && !(Array.isArray(a.ids) && a.ids.length <= 12 && a.ids.every(isInt))) throw new Error('"ids" must be a list of at most 12 squad ids');
      return runCmd(withRt(Object.assign({ c: 'fort', k: 'mine' + a.kind }, pick(a, ['x', 'z', 'facing', 'ids', 'why'], { facing: 'a' })), a), 'cmd');
    } },
  { name: 'clear_mines', description: 'A squad with sappers (the first of ids that has them, else the nearest free one) sweeps a place for mines: the suspect field and the enemy mines your side knows there (get_mines), lifting what the detector finds. Accepted with the squad id, or refused sap (no squad with sappers free), busy, way (no way there on foot), map, off.',
    inputSchema: { type: 'object', properties: { ...xz, ids: IDS, why: WHYP }, required: ['x', 'z'], additionalProperties: false },
    run: async a => { const e = need(a, { x: ['n', true], z: ['n', true], why: ['s', false] }); if (e) throw new Error(e); if (a.ids !== undefined && !(Array.isArray(a.ids) && a.ids.length <= 12 && a.ids.every(isInt))) throw new Error('"ids" must be a list of at most 12 squad ids'); return runCmd(Object.assign({ c: 'clear' }, pick(a, ['x', 'z', 'ids', 'why'])), 'cmd'); } },
  { name: 'sabotage', description: 'A raid on foot behind the enemy line with sappers and their demolition charges, against what stands at a point or x, z (an enemy battery, radio vehicle, supply base or site you have seen): the raid manoeuvre picks its squads and a squad with sappers goes along (the first of ids that has them, else the nearest free one); at the target a sapper sets a charge against a vehicle that stands still. Accepted with the operation id, or refused sap (no squad with sappers and charges), at (nothing known to raid there), path (no safe way on foot), sq, max, cd, off (map version 4 or later only).',
    inputSchema: { type: 'object', properties: { point: { type: 'integer' }, ...xz, ids: IDS, why: WHYP }, additionalProperties: false },
    run: async a => {
      const e = need(a, { point: ['i', false, 0, 999], x: ['n', false], z: ['n', false], why: ['s', false] }); if (e) throw new Error(e);
      if (a.point === undefined && (a.x === undefined || a.z === undefined)) throw new Error('give point or both x and z');
      if (a.ids !== undefined && !(Array.isArray(a.ids) && a.ids.length <= 12 && a.ids.every(isInt))) throw new Error('"ids" must be a list of at most 12 squad ids');
      return runCmd(Object.assign({ c: 'sabot' }, pick(a, ['point', 'x', 'z', 'ids', 'why'], { point: 'pi' })), 'cmd');
    } },
  { name: 'arm_militia', description: 'Arm a town\'s civilians as a militia squad that holds it (a point index, or x, z inside the town): needs 3 of your soldiers in the town, once every 150 s a town. Refused hate (the town turned against you after your fire killed its people), nociv (nobody left to arm), mil0 (not 3 of your soldiers there), cool.',
    inputSchema: { type: 'object', properties: { point: { type: 'integer' }, ...xz, why: WHYP }, additionalProperties: false },
    run: async a => {
      const e = need(a, { point: ['i', false, 0, 999], x: ['n', false], z: ['n', false], why: ['s', false] }); if (e) throw new Error(e);
      if (a.point === undefined && (a.x === undefined || a.z === undefined)) throw new Error('give point or both x and z');
      return runCmd(Object.assign({ c: 'mil' }, pick(a, ['point', 'x', 'z', 'why'], { point: 'pi' })), 'cmd');
    } },
  { name: 'ask_placement', description: 'Ask the host for the best places to build a kind of site (the economy AI\'s own placement scorer): up to 5 candidates {x, z, a, score, why}. Call this before build_site when unsure where to build. Limited to one question per second.',
    inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['pow', 'mine', 'fab'], description: 'site kind' } }, required: ['kind'], additionalProperties: false },
    annotations: { readOnlyHint: true }, run: async a => { const e = need(a, { kind: ['w', true, ['pow', 'mine', 'fab']] }); if (e) throw new Error(e); return runAsk({ q: 'spots', k: a.kind }); } },
  { name: 'ask_why', description: 'Ask the host why a site of a kind cannot be built at a position: empty reason means it can; otherwise a short code (en = energy, mt = metal, busy, none, full...).',
    inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['pow', 'mine', 'fab'] }, ...xz }, required: ['kind', 'x', 'z'], additionalProperties: false },
    annotations: { readOnlyHint: true }, run: async a => { const e = need(a, { kind: ['w', true, ['pow', 'mine', 'fab']], x: ['n', true], z: ['n', true] }); if (e) throw new Error(e); return runAsk({ q: 'why', k: a.kind, x: a.x, z: a.z }); } },
  { name: 'ask_view', description: 'Ask the host for the complete fog-limited view of your side right now: economy (stock, caps, sites with output and guards, deposits, queue, costs per unit kind with names), commander fields and the last 20 log lines. Bigger and slower than get_state (one question per second); use it for the cost table by unit and site kind, the resource deposits (dep: position, rich, own) and the production slots.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true }, run: async () => runAsk({ q: 'view' }) },
  { name: 'get_match_report', description: 'The after-action review of a match. match "current" (default) asks the host about the match on: while it runs, your side only (tickets and where they went, losses by kind, cost-effectiveness, the decisions that weighed most with how much they moved the margin, a ticket curve); once it is over, both sides. match "list" lists the matches the server keeps (newest first, kept 90 days; played and AI x AI tournaments); match "<era>/<name>" from that list returns that match\'s review. One host question a second, like the other asks.',
    inputSchema: { type: 'object', properties: { match: { type: 'string', description: 'current (default), list, or era/name from the list' } }, additionalProperties: false },
    annotations: { readOnlyHint: true }, run: matchReport },
  { name: 'seat', description: 'Claim or release the general\'s seat of your side, or just report who holds it. Commands are refused unless this bridge holds the seat; one general per side (a human or this bridge), first come first served. A claim also takes over the domains you list (default ["eco"]: the economy; the attack is yours with the seat; defence and support stay with the AI unless you list "def" and "sup", and the AI then no longer decides there). Release hands every domain back to the AI at once.',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['claim', 'release', 'status'], description: 'default status' }, domains: { type: 'array', items: { type: 'string', enum: ['eco', 'atk', 'def', 'sup'] }, description: 'with claim: domains to decide yourself (default ["eco"])' } }, additionalProperties: false },
    run: async a => {
      const act = (a && a.action) || 'status';
      if (!['claim', 'release', 'status'].includes(act)) throw new Error('action must be claim, release or status');
      if (a && a.domains !== undefined && !(Array.isArray(a.domains) && a.domains.every(d => DOMS.includes(d)))) throw new Error('domains must be a list of eco, atk, def, sup');
      await ready();
      if (act === 'claim') { R.wantSeat = true; await claim(1); if (held()) await takeDomains((a && a.domains) || DOM0); }
      if (act === 'release') { R.wantSeat = false; await claim(0); }
      return { text: JSON.stringify({ side: SIDE, heldByMe: held(), holder: holder_(), note: act === 'claim' && !held() ? 'the claim was refused: someone else holds the seat' : undefined }), error: act === 'claim' && !held() };
    } },
];
const TOOL = new Map(TOOLS.map(t => [t.name, t]));
const listing = () => TOOLS.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema, ...(t.annotations ? { annotations: t.annotations } : {}) }));

/* ---------------------------------------------------------------- MCP over stdio */
const INSTRUCTIONS = 'You are the general of side ' + SIDE + ' in Ceu de Ferro 3D, an economy-and-combat game. Play in cycles: get_state with refresh_map true (the first time), a few orders (economy tools for sites and production; order_units, request_support and build_defence for abstract orders the squads carry out their own way, with optional routes; send_command for planned assaults and the rest), then wait (20-40 s of match time) and get_state again. Call ask_view once for the cost table and the deposits. The same tools a person has on the general\'s view: campaigns (create_campaign, attach_operation), the threat board (get_threats, triage_threat, send_qrf, set_defence_policy), deposits and mines (claim_deposit, lay_minefield, clear_mines, sabotage), and a squad\'s card (get_missions, get_unit: what it sees and what it decides). You hold the seat and the economy automatically unless the seat is taken (check with seat). Every order is answered accepted or refused with a reason in Portuguese; get_log shows its effect. The state is fog-limited and ages: trust ageSeconds.';
const out = o => process.stdout.write(JSON.stringify(o) + '\n');
const ok = (id, result) => out({ jsonrpc: '2.0', id, result });
const fail = (id, code, message, data) => out({ jsonrpc: '2.0', id, error: Object.assign({ code, message }, data !== undefined ? { data } : {}) });
let legacyVersion = null;

async function handle(msg) {
  if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0') { if (msg && msg.id !== undefined) fail(msg.id, -32600, 'invalid request'); return; }
  const { id, method } = msg, params = msg.params || {}, isReq = id !== undefined && id !== null;
  if (typeof method !== 'string') return;   // a response from the client: nothing of ours is pending
  if (!isReq) return;   // notifications (initialized, cancelled, ...) need no answer
  const mv = params._meta && params._meta[META_V];   // stateless (2026-07-28) requests name their version
  if (mv !== undefined && method !== 'initialize' && !MODERN.includes(mv)) return fail(id, -32022, 'Unsupported protocol version', { supported: MODERN.concat(LEGACY), requested: mv });
  const extra = mv !== undefined ? { resultType: 'complete' } : {};
  try {
    switch (method) {
      case 'initialize': {
        const want = params.protocolVersion;
        legacyVersion = LEGACY.includes(want) ? want : LEGACY[0];
        return ok(id, { protocolVersion: legacyVersion, capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'ceu-general', version: VERSION }, instructions: INSTRUCTIONS });
      }
      case 'ping': return ok(id, {});
      case 'server/discover':
        return ok(id, { resultType: 'complete', supportedVersions: MODERN.concat(LEGACY), capabilities: { tools: { listChanged: false } }, _meta: { 'io.modelcontextprotocol/serverInfo': { name: 'ceu-general', version: VERSION } }, instructions: INSTRUCTIONS });
      case 'tools/list': return ok(id, Object.assign({ tools: listing() }, extra));
      case 'tools/call': {
        const t = typeof params.name === 'string' && TOOL.get(params.name);
        if (!t) return fail(id, -32602, 'unknown tool: ' + params.name);
        let res;
        try { res = await t.run(params.arguments || {}); } catch (e) { res = { text: String(e && e.message || e), error: true }; }   // tool failures are results, not protocol errors
        return ok(id, Object.assign({ content: [{ type: 'text', text: res.text }], isError: !!res.error }, extra));
      }
      default: return fail(id, -32601, 'method not found: ' + method);
    }
  } catch (e) { log('internal error: ' + (e && e.stack || e)); fail(id, -32603, 'internal error'); }
}

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => {
  buf += d;
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    let m; try { m = JSON.parse(line); } catch (e) { fail(null, -32700, 'parse error'); continue; }
    if (Array.isArray(m)) m.forEach(handle); else handle(m);
  }
});
const bye = () => { R.fatal = R.fatal || 'closing'; try { if (R.ws) R.ws.close(); } catch (e) { /* closing */ } setTimeout(() => process.exit(0), 100); };
process.stdin.on('end', bye);
process.on('SIGTERM', bye); process.on('SIGINT', bye);
process.on('uncaughtException', e => log('uncaught: ' + (e && e.stack || e)));

connect();
