'use strict';
/* the general's tools for everyone online (W13), headless, through the real relay server (PAGE=<page>, SERVER=<server>, PORT_T=<port>): a host
   (tank, side 0) and a guest of side 0 who takes the chair. The guest asks what the host knows (missions, the unit card of a squad by its id,
   the threat board, the mines, the lots) and the host answers through the relay; the guest's new commands (expand, clear, a campaign it opens
   and that waits for its operations) are the host's, refused with the same reasons as on the host. About 40 s */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 60;
async function client(name, cls, model, keep, era) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + 5, eco: true }), $ = c.$, Net = $('Net');
  c.name = name; c.$ = $; c.Net = Net; c.on = true;
  await new Promise((res, rej) => {
    Net.ui.welcome = () => { c.newState(era || 'modern', model, { net: true, cls, mouse: true, host: Net.host === Net.id }); res(); };
    Net.ui.refused = code => rej(new Error(name + ' refused: ' + code)); Net.connect(era || 'modern', name, cls, model);
  });
  Object.defineProperty(c, 'S', { get: () => $('S') }); c.id = Net.id; if (!keep) { c.director = () => {}; c.plan = () => {}; } all.push(c); return c;
}
async function run(secs, each) {
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) {
    for (const c of all) if (c.on) { if (c.S.cd) c.S.cd = {}; c.step(dt); c.Net.tick(dt); }
    if (each && each() === false) return false;
    if (i % 2 === 0) await new Promise(r => setImmediate(r));
  }
  await N.sleep(40); return true;
}
/* the relay measures the gap between two orders on the wall clock (250 ms) and the page's queue on the game clock (260 ms): these two agree only while the game runs at its own pace */
async function real(secs) { for (let i = 0, n = Math.round(secs / dt); i < n; i++) { for (const c of all) if (c.on) { if (c.S.cd) c.S.cd = {}; c.step(dt); c.Net.tick(dt); } await N.sleep(1000 * dt); } }
/* a command from a client, run until its answer comes (or wait s pass), then the relay's gap */
async function send(c, cmd, wait) {
  let r = null; c.genDo(cmd, x => { r = x; });
  for (let i = 0; i < (wait || 3) * 10 && !r; i++) await run(.1);
  await N.sleep(300);
  return r || { ok: false, why: 'none' };
}
async function ask(c, q, wait) {
  let r = null; c.genAsk(q, x => { r = x; });
  for (let i = 0; i < (wait || 3) * 10 && !r; i++) await run(.1);
  await N.sleep(1100);   // the relay takes one question a second
  return r || { ok: false, why: 'none' };
}
(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  const host = await client('Host', 'tank', 'abrams', true), g1 = await client('Azul', 'inf', 'blueRifle');
  ok(g1.Net.gtq && host.Net.gtq, 'the server passes the general\'s new questions (welcome gq: 1)');
  await run(5); g1.genClaim(1); await run(1.5);
  ok(host.S.gctl && host.S.gctl[0].seat === 'me' && g1.Net.gn[0] === g1.id, 'the guest holds side 0\'s chair');
  const S = host.S, q = S.squads.find(o => o.team === 0 && o.live > 0 && !o.net);
  let r = await ask(g1, { q: 'missions' });
  ok(r.ok && r.r && Array.isArray(r.r.sq) && r.r.sq.some(o => o.id === q.id), 'missions: the host\'s list of its side\'s missions reaches the guest');
  r = await ask(g1, { q: 'unit', id: q.id });
  ok(r.ok && r.r && r.r.id === q.id && Array.isArray(r.r.see) && Array.isArray(r.r.decide) && r.r.decide.length > 0, 'unit with an id: the squad\'s card reaches the guest (' + (r.r && r.r.decide && r.r.decide[0]) + ')');
  r = await ask(g1, { q: 'unit', id: 99999 }); ok(!r.ok && r.why === 'id', 'unit of no such squad: refused id, through the relay');
  r = await ask(g1, { q: 'threats' }); ok(r.ok && r.r && Array.isArray(r.r.l) && r.r.fronts > 0, 'threats: the guest gets the board (it was refused before W13)');
  r = await ask(g1, { q: 'mines' }); ok(r.ok && r.r && Array.isArray(r.r.own), 'mines: answered');
  r = await ask(g1, { q: 'lots' }); ok(r.ok && r.r && Array.isArray(r.r.lots), 'lots: answered');
  r = await send(g1, { c: 'expand', id: 999 }); ok(!r.ok && r.why === 'id', 'expand of no such deposit: the guest is told id, as the host would be');
  const own = host.ecoView(0).dep.find(d => d.own);
  if (own) { r = await send(g1, { c: 'expand', id: own.i }); ok(!r.ok && r.why === 'hasmine', 'expand of a deposit the side mines: hasmine'); }
  r = await send(g1, { c: 'clear', x: -5, z: 0 }); ok(!r.ok && r.why === 'map', 'clear off the map: map');
  r = await send(g1, { c: 'camp', H: 90, why: 'online' });
  ok(r.ok && (S.cmd[0].camp || []).some(k => k.id === r.id && k.by === 'me'), 'camp from the guest: the host opens the campaign, the person\'s');
  await run(6); ok((S.cmd[0].camp || []).some(k => k.id === r.id && !k.over), 'it waits for its operations (6 s on, still open)');
  for (const c of all) c.Net.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
