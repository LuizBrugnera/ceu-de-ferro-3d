'use strict';
/* the player's squad online (PSQ, cf-pol2 P10), headless, through the real relay server: a host and a guest, both on foot. Each comes in
   with three soldiers of his own, made and driven by the host; the guest is told which ghosts are his (psql) and sees them on his side;
   his orders (psq) go to the host, whose soldiers obey them */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 30;
async function client(name, model) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + name.charCodeAt(0) }), $ = c.$, Net = $('Net');
  c.name = name; c.$ = $; c.Net = Net; c.on = true;
  await new Promise((res, rej) => { Net.ui.welcome = () => { c.newState('modern', model, { net: true, cls: 'inf', mouse: true, host: Net.host === Net.id }); res(); }; Net.ui.refused = code => rej(new Error(name + ' refused: ' + code)); Net.connect('modern', name, 'inf', model); });
  Object.defineProperty(c, 'S', { get: () => $('S') }); c.id = Net.id; all.push(c); return c;
}
async function run(secs, each) {
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) {
    for (const c of all) if (c.on) { c.step(dt); c.Net.tick(dt); }
    if (each && each() === false) return false;
    if (i % 2 === 0) await new Promise(r => setImmediate(r));
    if (i % 10 === 0) await N.sleep(1);
  }
  await N.sleep(30); return true;
}
(async () => {
  { const C = H.load(); try { C.$('PSQ'); } catch (e) { console.log('no player squad (PSQ): a page before it'); process.exit(0); } }
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  const h = await client('Hugo', 'blueRifle'), g = await client('Gil', 'blueSaw');
  ok(h.S.host && !g.S.host && h.Net.psq && g.Net.psq, 'welcome says psq; Hugo hosts, Gil is a guest');
  h.S.my.inv = g.S.my.inv = 1e9;
  const hs = h.$('psqOf')(h.id);
  ok(hs.length === 3 && hs.every(m => m.own === h.id && m.aid), 'the host\'s squad: three soldiers, his, AI entities of the room');
  await run(6);
  const gs = h.$('psqOf')(g.id), gh = h.Net.ghosts.get(g.id);
  ok(gs.length === 3 && gh && gs.every(m => h.$('hdist')(m, gh) < 30), 'the guest\'s squad, made by the host beside his soldier (' + gs.length + ')');
  await run(4);
  const mine = g.$('psqOf')(g.id), P = g.S.my;
  ok(mine.length === 3 && mine.every(m => m.net && m.team === P.team), 'the guest is told they are his (psql): three ghosts of his side (' + mine.length + ')');
  ok(!g.$('psqOf')(h.id).length || g.$('psqOf')(h.id).every(m => m.own === h.id), '  and the host\'s are the host\'s');
  /* the guest orders his squad to hold 40 m ahead of him */
  const x = P.x + 40, z = P.z;
  g.$('psqOrder')(g.id, 'pos', x, z); g.Net.send('psq', { k: 2, p: [Math.round(x), Math.round(z)] });
  await run(1);
  const O = h.S.pso[g.id];
  ok(O && O.k === 'pos' && Math.abs(O.x - Math.round(x)) < 1, 'his order reaches the host (hold at ' + Math.round(x) + ', ' + Math.round(z) + ')');
  await run(30);
  const d = h.$('psqOf')(g.id).map(m => Math.round(h.$('hdist')(m, O)));
  ok(d.length === 3 && d.every(v => v < 10), 'the host\'s soldiers go and hold there (' + d.join(', ') + ' m from it)');
  for (const c of all) c.Net.ws && c.Net.ws.close();
  await N.stop(); done();
})().catch(e => { console.log('FAIL ' + e.stack); process.exitCode = 1; N.stop(); });
