'use strict';
/* the relay server and the command network: the host's view of a side (gen) carries cn (the net as that side's general sees it) to that side's
   players only; a cn that is not an object becomes null; an older host without it still gets through (SERVER, PORT_T) */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (cls, model) => { const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: model, cls, model }); c.w = await c.wait('welcome', 800); return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const seeAll = cs => cs.forEach(c => c.got.forEach(m => { m.seen = 1; }));
  const h = await join('tank', 'abrams'), a = await join('inf', 'blueRifle'), b = await join('inf', 'redAT'), all = [h, a, b];
  await N.sleep(60);
  const cn = { hq: 'down', left: 84, every: 9, nodes: [[2640, -4050, 7700, 3], [8000, -1800, 2750, 2]], jam: [[9000, -1000, 650, 0]], sq: [[3, 1, 22, 9100, -1500], [5, 0, -1, 0, 0]], n: [10, 7, 1], sent: 12, lost: 1, df: 2 };
  const gen = v => ({ t: 'gen', s: 0, T: 30, v: Object.assign({ doc: 'x', post: { k: 'a', s: 'b' }, road: null, ops: [], fm: [], sc: [], gate: '', atkT: 0, ev: [], evT: -1, mev: [] }, v), q: [] });
  seeAll(all); h.send(gen({ cn }));
  const g1 = await a.wait('gen');
  ok(g1 && g1.v.cn && g1.v.cn.hq === 'down' && g1.v.cn.sq[0][2] === 22 && g1.v.cn.nodes.length === 2 && g1.v.cn.n.join() === '10,7,1', 'gen carries cn to the side\'s player as the host sent it');
  ok(await none(b, 'gen'), '  and not to the other side');
  seeAll(all); h.send(gen({ cn: [1, 2] })); const g2 = await a.wait('gen');
  ok(g2 && g2.v.cn === null, 'a cn that is not an object becomes null, the rest still goes');
  seeAll(all); h.send(gen({})); const g3 = await a.wait('gen');
  ok(g3 && g3.v.cn === null && g3.v.post.k === 'a', 'a host without the net (an older page) still gets its view through');
  seeAll(all); a.send(gen({ cn })); ok(await none(h, 'gen') && await none(b, 'gen'), 'gen from a guest is dropped, cn and all');
  N.stop(); done();
})().catch(e => { console.error(e); process.exitCode = 1; N.stop(); });
