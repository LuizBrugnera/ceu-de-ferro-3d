'use strict';
/* bridges and pontoons online, headless, through the real relay server on its own port (map v5): every client has the same bridges, a
   guest sapper's charges bring one down on the host and everyone (obj), a guest's request starts a pontoon the room sees laid (fort, kind 7),
   it opens the river on every client, and whoever comes in later is given both */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 60;
async function client(name, cls, model) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + 5, mapv: 5 }), $ = c.$, Net = $('Net');
  c.name = name; c.$ = $; c.Net = Net; c.on = true;
  await new Promise((res, rej) => {
    Net.ui.welcome = () => { c.newState('modern', model, { net: true, cls, mouse: true, host: Net.host === Net.id }); res(); };
    Net.ui.refused = code => rej(new Error(name + ' refused: ' + code)); Net.connect('modern', name, cls, model);
  });
  Object.defineProperty(c, 'S', { get: () => $('S') }); c.id = Net.id; c.director = () => {}; c.plan = () => {}; all.push(c); return c;
}
async function run(secs, each) {
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) {
    for (const c of all) if (c.on) { c.step(dt); c.Net.tick(dt); }
    if (each && each() === false) return false;
    if (i % 2 === 0) await new Promise(r => setImmediate(r));
  }
  await N.sleep(40); return true;
}
const until = async (f, ms) => { for (let t = Date.now(); !f() && Date.now() - t < (ms || 4000);) { await run(.1); await N.sleep(25); } return f(); };
const put = (c, x, z) => { const P = c.S.my; P.x = x; P.z = z; P.y = c.hgt(x, z); P.inv = 1e9; P.v.x = P.v.z = 0; };
const tap = async (c, k) => { c.S.input[k] = true; await run(.06); c.S.input[k] = false; await run(.06); };

(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  const host = await client('Host', 'tank', 'abrams'), g1 = await client('Azul', 'inf', 'blueEng'), g2 = await client('Verm', 'inf', 'redRifle');
  await run(1);
  const L = c => c.$('brs()'), b = L(host).find(b => b.c === 2), id = b.id, e = b.ends.reduce((a, q) => (q.x < host.S.T.rx(q.z) ? q : a));
  ok(host.Net.br && g1.Net.br && g2.Net.br && host.S.T.mv === 5 && [g1, g2].every(c => L(c).length === 6 && L(c).every((q, i) => q.id === L(host)[i].id && Math.abs(q.x - L(host)[i].x) < .01)), 'the server says br: 1; every client has the same six bridges under the same ids');

  console.log('-- a guest sapper brings a bridge down --');
  put(g1, e.x + (e.x < b.x ? -3 : 3), e.z); put(g2, e.x - 400, e.z); await run(1);
  const c0 = g1.S.my.chg; await tap(g1, 'build'); await run(.5); await tap(g1, 'build');
  ok(c0 === 3 && g1.S.my.chg === 1 && g1.S.chg.filter(c => c.b.br).length === 2, 'N twice at a bank end of a track\'s bridge: two of the sapper\'s three charges set on it');
  await run(5.5); await until(() => host.S.os[id] === 2 && g1.S.os[id] === 2 && g2.S.os[id] === 2);
  ok(host.S.os[id] === 2 && g1.S.os[id] === 2 && g2.S.os[id] === 2, 'they go off on the guest, its hits reach the host (ohit), and the host\'s word that it is down reaches everyone (obj)');
  await run(.2);
  ok([host, g1, g2].every(c => c.S.brk === b.i + 'x' && c.hgt(b.x, b.z) <= c.S.T.WL + .3), 'on every client the river is open there and the edge cut (' + host.S.brk + ')');

  console.log('-- a pontoon --');
  put(g1, e.x, e.z); await run(.5);
  g1.Net.fbuild({ k: 7, x: e.x, z: e.z, a: 0 });
  await until(() => [host, g1, g2].every(c => c.S.forts.some(f => f.k === 7 && f.b === b.i)));
  const pf = c => c.S.forts.find(f => f.k === 7 && f.b === b.i);
  ok([host, g1, g2].every(c => pf(c) && pf(c).id === pf(host).id && Math.abs(pf(c).o.hw - b.len / 2) < 1), 'the guest\'s request: the host starts a pontoon at the bank end, and every client has it spanning the river under one id');
  const p0 = pf(host).prog, t0 = host.S.t; await run(6, () => { put(g1, e.x, e.z); });
  const rate = (pf(host).prog - p0) / (host.S.t - t0);
  ok(rate > 0 && Math.abs(1 / rate - host.$('FORT').pont.time) < 20, 'the guest\'s sapper standing at it lays it on the host at one builder\'s pace (' + Math.round(1 / rate) + ' s for the whole)');
  host.$('fortAt')(pf(host), .995); host.$('Net').fq = true;
  await until(() => [host, g1, g2].every(c => pf(c) && pf(c).prog >= 1), 8000, () => put(g1, e.x, e.z));
  await run(.3);
  ok([host, g1, g2].every(c => c.$('brOpen')(c.$('brs()')[b.i]) && c.S.brk === b.i + 'p' && c.hgt(b.x, b.z) > c.S.T.WL + 1), 'finished: on every client the crossing carries again (' + g2.S.brk + ')');

  console.log('-- whoever comes in later --');
  const g3 = await client('Tarde', 'inf', 'redEng'); await run(1); await until(() => g3.S.os[id] === 2 && pf(g3) && pf(g3).prog >= 1);
  ok(g3.S.os[id] === 2 && pf(g3) && pf(g3).prog >= 1 && g3.S.brk === b.i + 'p', 'a player who joins later is given the fallen bridge and the finished pontoon');
  for (const c of all) c.Net.ws && c.Net.ws.close();
  N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exitCode = 1; });
