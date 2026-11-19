'use strict';
/* the relay and vehicle recovery / medical evacuation (welcome rec: 1): the recovery vehicles and ambulances ride the AI's ground rows (their models
   are the server's, in each era, never a player's), recv and medv reach the host with their keys, and the question rec */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (room, cls, model) => { const c = await N.raw(); c.send({ t: 'join', room, name: cls, cls, model }); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const h = await join('modern', 'tank', 'abrams'), a = await join('modern', 'inf', 'blueRifle');
  ok(h.w && h.w.rec === 1 && a.w.rec === 1, 'welcome says rec: 1');
  const row = (id, model) => [-id, model, 0, 1, 1, 4000, 20, -300, 0, 0, 0, 80, 0, 0];
  h.send({ t: 'ai', k: 1, e: ['m88a2', 'brem1', 'm997', 'uaz452'].map((m, i) => row(9001 + i, m)) }); const r1 = await a.wait('ai');
  ok(r1 && r1.e.length === 4 && r1.e.map(e => e[1]).join() === 'm88a2,brem1,m997,uaz452', 'an AI row of each modern recovery vehicle and ambulance passes');
  h.send({ t: 'ai', k: 1, e: [row(9010, 'bergep')] }); ok(await none(a, 'ai'), 'a 1944 model in the modern room: the batch is dropped');
  const x = await join('modern', 'trn', 'm88a2'); ok(!x.w, 'nobody joins as a recovery vehicle: not a player\'s model');
  a.send({ t: 'gclaim', on: 1 }); await a.wait('gctl');
  a.send({ t: 'gcmd', d: 'cmd', c: { c: 'recv', id: 3, why: 'teste' }, n: 1 }); const g1 = await h.wait('gcmd'); ok(g1 && g1.c.c === 'recv' && g1.c.id === 3, 'gcmd recv with id reaches the host');
  await N.sleep(260); a.send({ t: 'gcmd', d: 'cmd', c: { c: 'medv', x: 4100, z: -250 }, n: 2 }); const g2 = await h.wait('gcmd'); ok(g2 && g2.c.c === 'medv' && g2.c.x === 4100 && g2.c.z === -250, 'and medv with x and z');
  a.send({ t: 'gask', q: { q: 'rec' }, n: 3 }); const q1 = await h.wait('gask'); ok(q1 && q1.q.q === 'rec', 'the question rec reaches the host');
  const w = await join('ww2', 'tank', 'tiger'), b = await join('ww2', 'inf', 'rifleman');
  w.send({ t: 'ai', k: 1, e: ['bergep', 'm32', 'kfz31', 'wc54'].map((m, i) => row(9101 + i, m)) }); const r2 = await b.wait('ai');
  ok(r2 && r2.e.length === 4, 'and in 1944, each of its four');
  for (const c of [h, a, x, w, b]) c.close();
  N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exitCode = 1; });
