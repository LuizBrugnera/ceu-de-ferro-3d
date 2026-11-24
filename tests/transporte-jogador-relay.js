'use strict';
/* the relay server and the player's transport (welcome ptr: 1, cf-transporte-jogador): a player joins in a paratroopers' plane or the
   Insurgents' captured Mi-8T; pdl from a guest flying one goes to the host (k 0 load me, w 1 to 4; k 1 a stick, n its kits, r 0 or 1),
   400 ms apart at least, and not from a soldier; the host's answer (k 0, n [[kits]]) goes to that guest alone; malformed ones are dropped;
   pdr carries state 3, a man on the fast-rope (SERVER, PORT_T) */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (room, cls, model, ns) => { const c = await N.raw(); c.send(Object.assign({ t: 'join', room, name: cls, cls, model }, ns && { ns })); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const h = await join('ww2', 'tank', 'tiger'), a = await join('ww2', 'plane', 'c47'), s = await join('ww2', 'inf', 'rifleman');
  ok(h.w && h.w.ptr === 1 && a.w && a.w.ptr === 1, 'welcome says ptr: 1, and a player joins in the C-47');
  await N.sleep(60); for (const c of [h, a, s]) c.got.forEach(m => { m.seen = 1; });
  a.send({ t: 'pdl', k: 0, w: 2 }); let m = await h.wait('pdl');
  ok(m && m.from === a.id && m.k === 0 && m.w === 2, 'a guest\'s request to load (pdl k 0) goes to the host');
  a.send({ t: 'pdl', k: 1, n: [0, 0, 1], r: 0 }); ok(await none(h, 'pdl'), '  not twice inside 400 ms');
  await N.sleep(420); a.send({ t: 'pdl', k: 1, n: [0, 0, 1], r: 0 }); m = await h.wait('pdl');
  ok(m && m.k === 1 && m.n.length === 3 && m.r === 0, 'a stick (pdl k 1) goes to the host');
  for (const bad of [{ k: 0, w: 5 }, { k: 1, n: [], r: 0 }, { k: 1, n: [0], r: 2 }, { k: 1, n: Array(9).fill(0), r: 1 }, { k: 2 }]) { await N.sleep(420); a.send(Object.assign({ t: 'pdl' }, bad)); }
  ok(await none(h, 'pdl'), 'malformed ones are dropped: w, no kits, r, too many, k');
  await N.sleep(420); s.send({ t: 'pdl', k: 0, w: 1 }); ok(await none(h, 'pdl'), 'nor from a soldier on foot');
  h.send({ t: 'pdl', to: a.id, k: 0, n: [[0, 0, 0, 1, 2], [0, 1]] }); m = await a.wait('pdl');
  ok(m && m.k === 0 && m.n.length === 2 && !m.to, 'the host\'s answer goes to that guest');
  ok(await none(s, 'pdl'), '  alone');
  h.send({ t: 'pdl', to: a.id, k: 0, n: [] }); m = await a.wait('pdl'); ok(m && m.n.length === 0, '  none granted is an answer too');
  h.send({ t: 'pdl', to: a.id, k: 0, n: [[0], [0], [0], [0], [0]] }); ok(await none(a, 'pdl'), '  more than 4 squads: dropped');
  h.send({ t: 'pdr', e: [[-30, 20.5, 3, 1.2]] }); const p = await a.wait('pdr'); ok(p && p.e[0][2] === 3, 'pdr carries a man on the fast-rope (3)');
  const i = await join('modern', 'tank', 'abrams', 3), j = await join('modern', 'heli', 'mi8i', 3);
  ok(i.w && j.w && j.w.ptr === 1, 'an Insurgent joins in the captured Mi-8T in a room of 3 sides');
  const k = await N.raw(); k.send({ t: 'join', room: 'ww2', name: 'x', cls: 'heli', model: 'mi8i' }); ok(!(await k.wait('welcome', 400)), '  not in 1944');
  N.stop(); done();
})().catch(e => { console.error(e); process.exitCode = 1; N.stop(); });
