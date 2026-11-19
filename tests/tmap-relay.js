'use strict';
/* the relay and the tactical map (M1): gask tmap with its layer k reaches the host from the asker's side, a k the relay does not take is dropped
   (the host answers its default), and the host's gres with the layer comes back to the asker alone */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (cls, model) => { const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: model, cls, model }); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; return c; };
  const seeAll = cs => cs.forEach(c => c.got.forEach(m => { m.seen = 1; }));
  const h = await join('tank', 'abrams'), a = await join('inf', 'blueRifle'), b = await join('tank', 't90'), all = [h, a, b];
  seeAll(all); a.send({ t: 'gask', q: { q: 'tmap', k: 'v' }, n: 11 }); const q = await h.wait('gask');
  ok(q && q.q.q === 'tmap' && q.q.k === 'v' && q.s === 0 && q.n === 11, 'gask tmap k v reaches the host, from side 0');
  await N.sleep(1050);
  seeAll(all); b.send({ t: 'gask', q: { q: 'tmap', k: 'K!', x: 1 }, n: 12 }); const q2 = await h.wait('gask');
  ok(q2 && q2.q.q === 'tmap' && !('k' in q2.q) && q2.q.x === 1 && q2.s === 1, 'a k the relay does not take is dropped (side 1 asks; the host answers its default layer)');
  const r = { k: 'v', nm: 'Vigilância inimiga', c: 1000, nx: 2, nz: 2, x0: 0, z0: -9000, age: 1.5, a: [0, 40, 99, 0] };
  seeAll(all); h.send({ t: 'gres', to: a.id, n: 11, ok: true, why: '', id: 0, r }); const g = await a.wait('gres');
  ok(g && g.n === 11 && JSON.stringify(g.r) === JSON.stringify(r), 'the host\'s answer comes back to the asker with the layer');
  ok(!(await b.wait('gres', 200)), '  and to nobody else');
  for (const c of all) c.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
