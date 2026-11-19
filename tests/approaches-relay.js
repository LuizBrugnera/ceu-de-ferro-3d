'use strict';
/* the relay and the approaches (M2): gask ap with x, z and a reaches the host from the asker's side, and the host's gres with the three approaches
   comes back to the asker alone */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (cls, model) => { const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: model, cls, model }); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; return c; };
  const seeAll = cs => cs.forEach(c => c.got.forEach(m => { m.seen = 1; }));
  const h = await join('tank', 'abrams'), a = await join('inf', 'blueRifle'), b = await join('tank', 't90'), all = [h, a, b];
  seeAll(all); a.send({ t: 'gask', q: { q: 'ap', x: 8120, z: -1800, a: -1 }, n: 21 }); const q = await h.wait('gask');
  ok(q && q.q.q === 'ap' && q.q.x === 8120 && q.q.z === -1800 && q.q.a === -1 && q.s === 0 && q.n === 21, 'gask ap with x, z and a reaches the host, from side 0');
  await N.sleep(1050);
  seeAll(all); b.send({ t: 'gask', q: { q: 'ap', x: 'far', z: 5 }, n: 22 }); const q2 = await h.wait('gask');
  ok(q2 && q2.q.q === 'ap' && !('x' in q2.q) && q2.q.z === 5 && q2.s === 1, 'a value the relay does not take is dropped (side 1 asks; the host refuses it: map)');
  const r = { nm: 'G · Vila do Moinho', x: 8120, z: -1800, sd: -1, st: { x: 6569, z: -1597, nm: 'E · Travessia' }, age: 0,
    a: [{ ang: 16, len: 1283, min: 6.1, exp: 47, wood: 0, axis: 84, cost: 2391, pos: [7700, -1700], pv: 87, asm: [7100, -1700], av: 7, pts: [[6500, -1500], [7700, -1700]] }] };
  seeAll(all); h.send({ t: 'gres', to: a.id, n: 21, ok: true, why: '', id: 0, r }); const g = await a.wait('gres');
  ok(g && g.n === 21 && JSON.stringify(g.r) === JSON.stringify(r), 'the host\'s answer comes back to the asker with the approaches');
  ok(!(await b.wait('gres', 200)), '  and to nobody else');
  for (const c of all) c.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
