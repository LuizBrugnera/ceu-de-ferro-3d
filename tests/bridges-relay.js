'use strict';
/* the relay and the bridges (welcome br: 1, brb: 1): a bridge's stage in obj like any object's (back to 0 when it is built again), the pontoon as
   the work of kind 7 and the rebuild as kind 9 in fort and fbuild, and the question brg */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (cls, model) => { const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: cls, cls, model }); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const h = await join('tank', 'abrams'), a = await join('inf', 'blueEng'), b = await join('inf', 'redRifle');
  ok(h.w && h.w.br === 1 && a.w.br === 1 && h.w.brb === 1 && a.w.brb === 1 && h.w.lg === 1 && h.w.sap === 1, 'welcome says br: 1 and brb: 1, and still what it said before');
  h.send({ t: 'obj', e: [100, 1, 103, 2] }); const o1 = await a.wait('obj'), o2 = await b.wait('obj');
  ok(o1 && o2 && o1.e.join() === '100,1,103,2', 'the host\'s word on the bridges (ids 100 on) reaches the room in obj');
  h.send({ t: 'obj', e: [103, 0] }); const o3 = await a.wait('obj'); ok(o3 && o3.e.join() === '103,0', 'a bridge built again: its stage back to 0 reaches the room in obj');
  a.send({ t: 'ohit', h: [100, 150] }); const oh = await h.wait('ohit'); ok(oh && oh.h.join() === '100,150', 'a guest\'s charge on a bridge (ohit) reaches the host');
  const row = [30520, 7, 0, 12000.5, -2600.2, 1.2, 35, 280, 0];
  h.send({ t: 'fort', i: 0, n: 1, e: [row] }); const f1 = await a.wait('fort'), f2 = await b.wait('fort');
  ok(f1 && f2 && f1.e[0].join() === row.join() && f2.e[0][1] === 7, 'a pontoon (kind 7) in the host\'s fort lines reaches the room');
  h.send({ t: 'fort', i: 0, n: 1, e: [[30521, 9, ...row.slice(2)]] }); const f3 = await a.wait('fort'); ok(f3 && f3.e[0][1] === 9, 'a rebuild (kind 9) in the host\'s fort lines reaches the room');
  h.send({ t: 'fort', i: 0, n: 1, e: [[30520, 10, ...row.slice(2)]] }); ok(await none(a, 'fort'), 'a kind after the rebuild is still none');
  a.send({ t: 'fbuild', k: 7, p: [12000.5, -2600.2], a: 0 }); const fb = await h.wait('fbuild');
  ok(fb && fb.k === 7 && fb.from === a.id && await none(b, 'fbuild'), 'a soldier\'s request for a pontoon (fbuild k 7) goes to the host alone');
  await N.sleep(720); a.send({ t: 'fbuild', k: 9, p: [12000.5, -2600.2], a: 0 }); const fb8 = await h.wait('fbuild'); ok(fb8 && fb8.k === 9 && await none(b, 'fbuild'), 'and for a rebuild (fbuild k 9)');
  a.send({ t: 'gclaim', on: 1 }); await a.wait('gctl');
  a.send({ t: 'gask', q: { q: 'brg' }, n: 1 }); const q1 = await h.wait('gask'); ok(q1 && q1.q.q === 'brg', 'the question brg reaches the host');
  await N.sleep(1020); a.send({ t: 'gcmd', d: 'cmd', c: { c: 'man', k: 'demolish', x: 12000, z: -2600, why: 'recuo' }, n: 2 }); const g1 = await h.wait('gcmd');
  ok(g1 && g1.c.c === 'man' && g1.c.k === 'demolish' && g1.c.x === 12000, 'gcmd man demolish (and cross) with the bridge\'s place reaches the host');
  await N.sleep(1020); a.send({ t: 'gcmd', d: 'cmd', c: { c: 'man', k: 'rebuild', x: 12000, z: -2600 }, n: 3 }); const g2 = await h.wait('gcmd');
  ok(g2 && g2.c.k === 'rebuild', 'gcmd man rebuild reaches the host');
  for (const c of [h, a, b]) c.close();
  N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exitCode = 1; });
