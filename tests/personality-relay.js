'use strict';
/* the relay server and the AI general's personality and difficulty (W17): the host's view of a side (gen) carries per, dif and hab (the enemy's
   habits that side knows) to that side's players only; malformed ones become null or empty; an older host without them still gets through (SERVER, PORT_T) */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (cls, model) => { const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: model, cls, model }); c.w = await c.wait('welcome', 800); return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const seeAll = cs => cs.forEach(c => c.got.forEach(m => { m.seen = 1; }));
  const h = await join('tank', 'abrams'), a = await join('inf', 'blueRifle'), b = await join('inf', 'redAT'), all = [h, a, b];
  await N.sleep(60);
  const per = { k: 'blz', nm: 'Blitz', s: 'ataca cedo' }, dif = { k: 'dificil', nm: 'Difícil', plan: 2 }, hab = [{ x: 5200, z: -800, nm: 'perto de B', n: 3, h: .7, per: 60, next: 40 }];
  const gen = v => ({ t: 'gen', s: 0, T: 30, v: Object.assign({ doc: 'x', post: { k: 'a', s: 'b' }, road: null, ops: [], fm: [], sc: [], gate: '', atkT: 0, ev: [], evT: -1, mev: [] }, v), q: [] });
  seeAll(all); h.send(gen({ per, dif, hab }));
  const g1 = await a.wait('gen');
  ok(g1 && g1.v.per && g1.v.per.nm === 'Blitz' && g1.v.dif.plan === 2 && g1.v.hab.length === 1 && g1.v.hab[0].n === 3, 'gen carries per, dif and hab to the side\'s player as the host sent them');
  ok(await none(b, 'gen'), '  and not to the other side');
  seeAll(all); h.send(gen({ per: 'blz', dif: [2], hab: [1, 2, 3, 4, 5] })); const g2 = await a.wait('gen');
  ok(g2 && g2.v.per === null && g2.v.dif === null && Array.isArray(g2.v.hab) && g2.v.hab.length === 0 && g2.v.post.k === 'a', 'per and dif that are not objects become null, too long a hab becomes empty, the rest still goes');
  seeAll(all); h.send(gen({})); const g3 = await a.wait('gen');
  ok(g3 && g3.v.per === null && g3.v.dif === null && g3.v.hab.length === 0 && g3.v.post.k === 'a', 'a host without them (an older page) still gets its view through');
  seeAll(all); a.send(gen({ per, dif, hab })); ok(await none(h, 'gen') && await none(b, 'gen'), 'gen from a guest is dropped, per and all');
  N.stop(); done();
})().catch(e => { console.error(e); process.exitCode = 1; N.stop(); });
