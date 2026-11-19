'use strict';
/* the online spectator ("Assistir"), through the real relay server (PAGE=<page>, SERVER=<server>, PORT_T=<port>). Raw sockets: a spectator
   (join cls spec) is no one's roster entry and never the host, is sent what a player is sent plus both sides' gen, glog and ecs and the whole
   cue, and can send nothing that reaches anyone; SPEC=0 refuses it; a page of another map version is refused; when the host leaves it hears of
   the next, and when no one is left, of none. Pages: a spectator page (newState with spec: 1) runs beside a host and two guests, takes both
   sides' commander views, never touches S.my, sends nothing, survives a late join and the host leaving. About 60 s */
process.env.SPEC = '1';
const { spawn } = require('child_process');
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const dt = 1 / 60, all = [];
/* every page is loaded, and its battlefield built once offline, before any page connects (pre): a first newState blocks this process for seconds
   (tens on a loaded machine), and a page already in the room that cannot answer the relay's ping within 10 s is dropped by its heartbeat (1006):
   the room emptied before the test began. Built once, the newState in the welcome takes well under a second */
const load = name => H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + 5, eco: true }), pre = new Map();
const preload = (...names) => { for (const n of names) { const c = load(n); c.newState('modern', null, {}); pre.set(n, c); } };
async function client(name, cls, model, o) {
  const c = pre.get(name) || load(name), $ = c.$, Net = $('Net'); pre.delete(name);
  c.name = name; c.$ = $; c.Net = Net; c.on = true; c.sent = [];
  await new Promise((res, rej) => {
    Net.ui.welcome = () => {
      if (o.spec) { c.newState('modern', null, { net: true, watch: 1, spec: 1 }); const ws = Net.ws, f = ws.send.bind(ws); ws.send = d => { c.sent.push(JSON.parse(d).t); f(d); }; }
      else c.newState('modern', model, { net: true, cls, mouse: true, host: Net.host === Net.id });
      res();
    };
    Net.ui.refused = code => rej(new Error(name + ' refused: ' + code));
    Net.connect('modern', name, cls, model);
  });
  Object.defineProperty(c, 'S', { get: () => $('S') }); c.id = Net.id;
  if (!o.keep) { c.director = () => {}; c.plan = () => {}; }
  all.push(c); return c;
}
async function run(secs, each) {
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) {
    for (const c of all) if (c.on) { if (c.S.cd) c.S.cd = {}; c.step(dt); c.Net.tick(dt); }
    if (each && each() === false) return false;
    if (i % 2 === 0) await new Promise(r => setImmediate(r));
  }
  await N.sleep(40); return true;
}
const rawTests = async () => {
  const join = async (cls, model, extra) => { const c = await N.raw(); c.send(Object.assign({ t: 'join', room: 'modern', name: model || cls, cls, model: model || '' }, extra)); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const seeAll = cs => cs.forEach(c => c.got.forEach(m => { m.seen = 1; }));
  const s0 = await join('spec', '', { name: 'Olho' });
  ok(s0.w && s0.w.spec === 1 && s0.w.players.length === 0 && s0.w.host === 0 && s0.w.id > 0, 'a spectator joining an empty room gets welcome spec 1, no players, no host');
  s0.close();
  const h = await join('tank', 'abrams'), s = await join('spec', '', { name: 'Olho' });
  const sj = await h.wait('sjoin');
  ok(s.w && s.w.spec === 1 && s.w.host === h.id && s.w.players.length === 1 && s.w.players[0].id === h.id && s.w.eco === 1 && s.w.gen === 1 && s.w.cq === 1 && s.w.mv === 1 && 'gn' in s.w, 'with a host present: welcome spec 1, the host, the roster without itself, the server\'s flags');
  ok(sj && sj.id === s.id, 'the host is told sjoin with the spectator\'s id');
  ok(!!(await s.wait('fcap', 300)) && !!(await s.wait('dcap', 300)), 'the spectator is sent fcap and dcap as a player is');
  const j = await join('inf', 'blueRifle'), b = await join('inf', 'redAT');
  ok(!j.w.players.some(p => p.id === s.id) && !b.w.players.some(p => p.id === s.id), 'a later joiner\'s roster has no spectator');
  const jn = await s.wait('joined');
  ok(jn && jn.player.id === j.id && !h.has('joined').some(m => m.player.id === s.id) && !j.has('joined').some(m => m.player.id === s.id), 'the spectator hears of players joining, and no player hears of it joining');
  const row = [7, 1, 2, 10.5, -20.5, 1.5, 50, 100, 1];
  const ecs = s0n => ({ t: 'ecs', s: s0n, T: 12.5, v: [1, 2, 3, 4, 5, 6, 7, 8], c: 0, q: [1, 2, 3, 40, 0], r: [1, 2], kp: [3, 4], ms: [], ls: [], sl: [1, 2, 3, 4], kn: [1, 2, 3, 4, 5, 0], gd: [1, 2, 3], sc: [], tg: 0 });
  const gen = s0n => ({ t: 'gen', s: s0n, T: 12.5, v: { doc: 'x', post: { k: 'att', s: 'text' }, road: null, ops: [], fm: [], sc: [], hit: null, focus: null, thr: null, want: null, gate: '', atkT: 0, ev: [], evT: -1 }, q: [1, 2, 3, 4, 5, 6] });
  const glog = s0n => ({ t: 'glog', s: s0n, T: 12.5, e: [[1, 'k', 'side' + s0n, null, 2, 3, null]] });
  seeAll([h, j, b, s]);
  for (const k of [0, 1]) { h.send(ecs(k)); h.send(gen(k)); h.send(glog(k)); }
  await N.sleep(150);
  ok(s.has('ecs').map(m => m.s).sort().join() === '0,1' && s.has('gen').map(m => m.s).sort().join() === '0,1' && s.has('glog').map(m => m.e[0][2]).sort().join() === 'side0,side1', 'ecs, gen and glog of BOTH sides reach the spectator');
  ok(j.has('ecs').map(m => m.s).join() === '0' && b.has('gen').map(m => m.s).join() === '1', 'and a player still gets its own side\'s only');
  seeAll([h, j, b, s]); h.send({ t: 'cmd', c: [[1, 2], [3, 4]] });
  const cm = await s.wait('cmd'), cj = await j.wait('cmd');
  ok(cm && JSON.stringify(cm.c) === '[[1,2],[3,4]]' && cj && JSON.stringify(cj.c) === '[[1,2],[0]]', 'cmd: the spectator sees both commanders whole, a player its own');
  seeAll([h, j, b, s]);
  h.send({ t: 'ai', k: 0, e: [] }); h.send({ t: 'eco', e: [row] }); h.send({ t: 'cq', n: 1, ph: 0, T: 100, k: [10, 10], k0: 10, len: 1, p: [], l: [0, 0, 0, 0, 0, 0] });
  ok(!!(await s.wait('ai')) && !!(await s.wait('eco')) && !!(await s.wait('cq')), 'it is sent the host\'s ai, eco and cq');
  seeAll([h, j, b, s]);
  s.send({ t: 'gclaim', on: 1 }); s.send({ t: 'gcmd', d: 'eco', c: { c: 'make', k: 'tank', n: 1 }, n: 1 }); s.send({ t: 'gask', q: { q: 'view' }, n: 2 }); s.send({ t: 'chat', text: 'oi' });
  s.send({ t: 'shot', p: [0, 0, 0], v: [1, 0, 0] }); s.send({ t: 'ai', k: 0, e: [] }); s.send({ t: 'cq', n: 9, ph: 0, T: 1, k: [1, 1], k0: 1, len: 1, p: [], l: [0, 0, 0, 0, 0, 0] });
  s.send(ecs(0)); s.send(gen(0)); s.send(glog(0)); s.send({ t: 'eco', e: [row] }); s.send({ t: 'ff', v: 1 }); s.send({ t: 'cmd', c: [[1], [2]] }); s.send({ t: 'keep', e: { x: 1 } }); s.send({ t: 'join', room: 'modern', name: 'x', cls: 'tank', model: 'abrams' });
  await N.sleep(250);
  const heard = [h, j, b].flatMap(c => c.got.filter(m => !m.seen).map(m => m.t));
  ok(heard.length === 0 && s.has('gres').length === 0 && s.has('gctl').length === 0 && s.has('error').length === 0, 'its gclaim, gcmd, gask, chat, shot, ai, cq, ecs, gen, glog, eco, ff, cmd, keep and a second join reach nobody (' + (heard.join() || 'nothing') + ') and get no answer');
  seeAll([h, j, b, s]); j.send({ t: 'gclaim', on: 1 });
  const g1 = await s.wait('gctl'), g2 = await h.wait('gctl');
  ok(g1 && g2 && g1.g[0] === j.id && g1.k[0] === 1, 'gctl (who commands) goes to the spectator too, and a spectator never holds a seat');
  ok(!(await (async () => { h.send({ t: 'build', p: [0, 0], a: 0 }); return s.wait('build', 100); })()), 'player-to-host traffic does not reach it');
  /* a page of another map version is refused, as for a player */
  const m5 = await join('spec', '', { mv: 5 });
  ok(m5.has('error').some(e => e.code === 'map') || !!(await m5.wait('error', 300)), 'a spectator of another map version is refused (error map)');
  /* the host leaves: the next is named; the last leaves: no host */
  seeAll([h, j, b, s]); h.close();
  const hh = await s.wait('host', 800);
  ok(hh && hh.id === j.id, 'the host leaving: the spectator hears of the next host (' + (hh && hh.id) + ' for ' + j.id + ')');
  ok(!!(await s.wait('left', 300)), 'and of the player leaving');
  seeAll([j, b, s]); j.close(); b.close();
  let h0 = null; for (let i = 0; i < 40 && !h0; i++) { await N.sleep(30); h0 = s.has('host').find(m => m.id === 0 && !m.seen); }
  ok(!!h0, 'the last player leaving: host { id: 0 } to the spectator, never itself as host');
  s.close();
  /* SPEC=0: refused */
  const p2 = N.PORT + 1, child = spawn(process.execPath, [N.SERVER], { env: Object.assign({}, process.env, { PORT: String(p2), SPEC: '0' }), stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise(r => child.stdout.on('data', d => { if (String(d).includes('no ar')) r(); }));
  const ws = new N.WebSocket('ws://localhost:' + p2), got = [];
  await new Promise(r => { ws.on('open', r); ws.on('message', d => got.push(JSON.parse(d))); });
  ws.send(JSON.stringify({ t: 'join', room: 'modern', name: 'x', cls: 'spec', model: '' })); await N.sleep(250);
  ok(got.some(m => m.t === 'error' && m.code === 'spec') && !got.some(m => m.t === 'welcome'), 'SPEC=0: a spectator\'s join is refused (error spec)');
  ws.close(); child.kill();
};
(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  console.log('-- raw sockets --'); await rawTests();
  await N.sleep(300);
  console.log('-- pages: a spectator beside a host and two guests, 20 s --');
  preload('Host', 'Azul', 'Verm', 'Olho', 'Tarde');
  const host = await client('Host', 'tank', 'abrams', { keep: true }), g1 = await client('Azul', 'inf', 'blueRifle', { keep: true }), g2 = await client('Verm', 'inf', 'redRifle', {});
  const sp = await client('Olho', 'spec', '', { spec: true, keep: true });
  let err = null;
  try { await run(20); } catch (e) { err = e; }
  ok(!err, 'the spectator page ran 20 s beside them without an exception' + (err ? ': ' + (err.stack || err).toString().split('\n').slice(0, 3).join(' | ') : ''));
  if (err) { for (const c of all) c.Net.close(); N.stop(); return done(); }
  const S = sp.S;
  ok(S.spec === true && S.net && !S.host && S.watch && S.my === null, 'it is a guest in watch mode with spec set and no body (S.my null)');
  ok(sp.Net.isSpec === true && !host.Net.players.has(sp.id) && !g1.Net.players.has(sp.id) && [...sp.Net.players.keys()].sort().join() === [host.id, g1.id, g2.id].sort().join(), 'it is in no one\'s roster and sees the three players in its own');
  ok(sp.sent.length === 0, 'the page sent nothing after the welcome (' + (sp.sent.join() || 'nothing') + ')');
  const v0 = sp.genVM(0, true), v1 = sp.genVM(1, true);
  ok(v0.cmd === true && v1.cmd === true, 'genVM(0, true).cmd and genVM(1, true).cmd are both true: both commanders\' streams arrived');
  ok(v0.all === true && v1.all === true && v0.u.length > 0 && v1.u.length > 0, 'the view with "ver tudo" is not forced off online (units: ' + v0.u.length + ' and ' + v1.u.length + ')');
  ok(S.glog && S.glog.l[0].length > 0 && S.glog.l[1].length > 0, 'it has both sides\' logs (' + (S.glog ? S.glog.l[0].length + ' and ' + S.glog.l[1].length : 'none') + ')');
  ok(S.eco && S.eco.d[0].rT !== undefined && S.eco.d[1].rT !== undefined, 'and both sides\' economy rows (ecs)');
  ok(Array.isArray(S.cue) && S.cue.length === 2 && S.cue[0] && S.cue[1], 'and both sides\' cue');
  ok(g1.S.gcm && g1.S.gcm[0] && !g1.S.gcm[1], 'a player still has its own side\'s commander view only');
  /* a second spectator joins late and gets both sides within a few seconds */
  const late = await client('Tarde', 'spec', '', { spec: true, keep: true });
  await run(6);
  ok(late.genVM(0, true).cmd === true && late.genVM(1, true).cmd === true && late.S.glog && late.S.glog.l[0].length > 0 && late.S.glog.l[1].length > 0 && late.sent.length === 0, 'a late spectator gets both commanders and both full logs within 6 s');
  /* the host leaves: the next host carries on and both spectators keep getting the streams */
  host.on = false; host.Net.close(); await N.sleep(100);
  const t0 = [sp.S.gcm[0].rx, sp.S.gcm[1].rx];
  let err2 = null; try { await run(10); } catch (e) { err2 = e; }
  const g = sp.S.gcm;
  ok(!err2 && g1.S.host === true && sp.Net.host === g1.id, 'host migration: a guest adopted the room, the spectator follows it as host (no exception' + (err2 ? ': ' + (err2.stack || err2).toString().split('\n').slice(0, 2).join(' | ') : '') + ')');
  ok(g[0].rx > t0[0] && g[1].rx > t0[1] && sp.S.t - g[0].rx < 4 && sp.S.t - g[1].rx < 4 && late.S.t - late.S.gcm[0].rx < 4, 'and the new host\'s gen of both sides keeps reaching the spectators');
  ok(sp.genVM(0, true).cmd === true && sp.genVM(1, true).cmd === true && sp.S.my === null && sp.sent.length === 0, 'still no body and nothing sent after the migration');
  for (const c of all) c.Net.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
