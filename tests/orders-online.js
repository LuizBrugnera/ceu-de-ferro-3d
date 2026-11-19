'use strict';
/* abstract orders and routes online, headless, through the real relay server (PAGE=<page>, SERVER=<server>, PORT_T=<port>), on the road-network map:
   the host (tank, side 0) and a guest of side 0 who takes the chair. The guest's page knows the relay passes routes (welcome rte: 1); its abstract
   order with a route crosses the relay, the host's squads take it (their way through the points, the route on their mission), the answer comes back,
   and the guest's own view of the operations shows the verb and the route. About 30 s */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 60;
async function client(name, cls, model, keep) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + 5, mapv: 5 }), $ = c.$, Net = $('Net');
  c.$ = $; c.Net = Net; c.on = true;
  await new Promise((res, rej) => {
    Net.ui.welcome = () => { c.newState('modern', model, { net: true, cls, mouse: true, host: Net.host === Net.id }); res(); };
    Net.ui.refused = code => rej(new Error(name + ' refused: ' + code)); Net.connect('modern', name, cls, model);
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
async function send(c, cmd, wait) {
  let r = null; c.genDo(cmd, x => { r = x; });
  for (let i = 0; i < (wait || 3) * 10 && !r; i++) await run(.1);
  await N.sleep(300);
  return r || { ok: false, why: 'none' };
}
(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  const host = await client('Host', 'tank', 'abrams', true), g1 = await client('Azul', 'inf', 'blueRifle');
  ok(g1.Net.rte === true && host.Net.rte === true && g1.Net.gc2, 'the pages know the relay passes routes (welcome rte: 1)');
  ok(typeof g1.Net.ord === 'function', 'and the missile message sender Net.ord is still a function');
  await run(20);
  g1.genClaim(1); await run(1.5);
  ok(host.S.gctl && host.S.gctl[0].seat === 'me', 'the guest holds side 0\'s chair on the host');
  const S = host.S, lead = q => q.men.find(m => !m.dead && !m.gone);
  const q = S.squads.find(q => q.team === 0 && !q.net && q.live >= 2 && !q.state && !q.op && lead(q) && ['push', 'held', 'road', 'line', 'wood'].includes(q.job)), L = q && lead(q);
  if (!q) { ok(false, 'no free squad of the host'); } else {
    const T = { x: Math.round(L.x + 300), z: Math.round(L.z + 80) }, w = { x: Math.round(L.x + 120), z: Math.round(L.z - 150) };
    const r = await send(g1, { c: 'ord', k: 'def', x: T.x, z: T.z, ids: [q.id], rt: [w.x, w.z], why: 'segurar a ponte' });
    await run(6, () => (q.op && !q.cnP && q.ord.k === 'hold' ? false : undefined));   // the host's radio (W15) brings the order in 2 to 5 s
    ok(r.ok && q.op && q.op.v === 'def' && q.ord.k === 'hold', 'the guest\'s ord def with a route: answered ok, the host\'s squad holds in an abstract operation (' + (r.why || r.id) + ')');
    ok(q.mis && q.mis.route && q.mis.route.length === 1 && q.mis.route[0].x === w.x && q.mis.why === 'segurar a ponte', 'the squad\'s mission carries the route and the general\'s words');
    let seen = null; await run(4, () => { const o = g1.genVM(0, false).ops.find(o => o.k === 'usr' && o.id === r.id); if (o) { seen = o; return false; } });
    ok(!!seen && seen.v === 'def' && Array.isArray(seen.rt) && seen.rt.length === 1 && seen.rt[0][0] === w.x, 'the guest\'s view lists the operation with its verb and route');
    const bad = await send(g1, { c: 'ord', k: 'def', x: T.x, z: T.z, ids: [q.id], rt: [w.x, w.z, 5] });
    ok(!bad.ok && bad.why === 'shape', 'a ragged route is refused by the relay: shape (' + bad.why + ')');
    const rq = await send(g1, { c: 'req', k: 'fire', x: T.x + 600, z: T.z });
    ok(rq.ok || rq.why === 'fire', 'a request for fire is answered by the host (' + (rq.why || 'ok') + ')');
  }
  for (const c of all) c.Net.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
