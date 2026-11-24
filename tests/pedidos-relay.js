'use strict';
/* the relay server and the requests to the general from the map (welcome ped: 1, cf-pedidos-mapa): a guest's gped (1 s apart) to the host alone with
   its sender, the host's gpr to that guest alone, and what is malformed or from the wrong one dropped (SERVER, PORT_T) */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (cls, model) => { const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: cls, cls, model }); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const h = await join('tank', 'abrams'), a = await join('inf', 'blueRifle'), b = await join('inf', 'redAT');
  ok(h.w && h.w.ped === 1 && a.w.ped === 1, 'welcome says ped: 1');
  await N.sleep(60); for (const c of [h, a, b]) c.got.forEach(m => { m.seen = 1; });
  a.send({ t: 'gped', k: 2, p: [10, 20], q: [900, -40] }); const g1 = await h.wait('gped');
  ok(g1 && g1.from === a.id && g1.k === 2 && g1.q[0] === 900 && g1.q[1] === -40, 'gped from a guest goes to the host with its sender');
  ok(await none(b, 'gped') && await none(a, 'gped'), '  and to nobody else');
  a.send({ t: 'gped', k: 0, p: [10, 20], q: [30, 40] }); ok(await none(h, 'gped'), 'a second gped within 1 s is dropped');
  await N.sleep(1050);
  for (const m of [{ k: 10, p: [1, 2], q: [3, 4] }, { k: -1, p: [1, 2], q: [3, 4] }, { k: 0, p: [1], q: [3, 4] }, { k: 0, p: [1, 2] }, { k: 'x', p: [1, 2], q: [3, 4] }]) b.send(Object.assign({ t: 'gped' }, m));
  ok(await none(h, 'gped'), 'malformed gped is dropped: kind, p, q');
  h.send({ t: 'gped', k: 0, p: [1, 2], q: [3, 4] }); ok(await none(h, 'gped'), 'the host\'s own is not sent back to it');
  const ans = { t: 'gpr', to: a.id, k: 2, s: 0, why: 'um avião de ataque sai da base', eta: 35, q: [900, -40] };
  h.send(ans); const r1 = await a.wait('gpr');
  ok(r1 && r1.k === 2 && r1.s === 0 && r1.eta === 35 && r1.why === ans.why && r1.q[0] === 900, 'gpr from the host reaches the guest it names');
  ok(await none(b, 'gpr') && await none(h, 'gpr'), '  and nobody else');
  b.send(Object.assign({}, ans, { to: a.id })); ok(await none(a, 'gpr'), 'gpr from a guest is dropped');
  for (const e of [{ s: 4 }, { k: 10 }, { why: 'x'.repeat(161) }, { eta: -1 }, { eta: 4000 }, { q: [1] }, { to: 0 }, { why: 3 }]) h.send(Object.assign({}, ans, e));
  ok(await none(a, 'gpr'), 'malformed gpr is dropped: state, kind, a long line, eta, q, to, why');
  N.stop(); done();
})().catch(e => { console.error(e); process.exitCode = 1; N.stop(); });
