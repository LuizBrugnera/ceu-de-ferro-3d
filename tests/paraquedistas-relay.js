'use strict';
/* the relay server and the paratroopers (welcome para: 1, cf-paraquedistas): the transports' AI rows, the drop and the jump among the map
   requests (gped k 8 and 9), the transport's id in a jump's answer (gpr v), the host's jumpers in the air (pdr) to the room, and what is
   malformed or from the wrong one dropped (SERVER, PORT_T) */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (room, cls, model) => { const c = await N.raw(); c.send({ t: 'join', room, name: cls, cls, model }); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const h = await join('modern', 'tank', 'abrams'), a = await join('modern', 'inf', 'blueRifle');
  ok(h.w && h.w.para === 1 && a.w.para === 1, 'welcome says para: 1');
  await N.sleep(60); for (const c of [h, a]) c.got.forEach(m => { m.seen = 1; });
  for (const id of ['c130', 'il76']) { h.send({ t: 'ai', k: 0, e: [[-7, id, 0, 400, 0, 1, 300, 3, 0, 0, 0, 1, 60, 0, 0, 0]] }); const m = await a.wait('ai'); ok(m && m.e[0][1] === id, 'an AI row of the ' + id + ' reaches the room'); }
  const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: 'x', cls: 'plane', model: 'c130' }); ok(!(await c.wait('welcome', 400)), 'nobody joins flying a transport');
  a.send({ t: 'gped', k: 9, p: [10, 20], q: [900, -40] }); const g = await h.wait('gped');
  ok(g && g.from === a.id && g.k === 9, 'a guest\'s jump (gped k 9) goes to the host');
  await N.sleep(1050); a.send({ t: 'gped', k: 8, p: [10, 20], q: [900, -40] }); ok(!!(await h.wait('gped')), '  and a drop (k 8)');
  const ans = { t: 'gpr', to: a.id, k: 9, s: 0, why: 'embarque no C-130J', eta: 60, q: [900, -40], v: -12 };
  h.send(ans); let r = await a.wait('gpr'); ok(r && r.k === 9 && r.v === -12, 'the answer names the transport (v ' + (r && r.v) + ')');
  h.send(Object.assign({}, ans, { v: 5 })); r = await a.wait('gpr'); ok(r && r.v === undefined, '  a v that is no AI id is left out');
  h.send({ t: 'pdr', e: [[-30, 250.5, 2, 1.2], [-31, 400, 1, -.5]] }); const p = await a.wait('pdr');
  ok(p && p.e.length === 2 && p.e[0][1] === 250.5 && p.e[1][2] === 1, 'pdr from the host reaches the room');
  a.send({ t: 'pdr', e: [[-30, 250, 2, 1]] }); ok(await none(h, 'pdr'), 'pdr from a guest is dropped');
  for (const e of [[[-30, 250, 3, 1]], [[30, 250, 2, 1]], [[-30, 250, 2]], Array(65).fill([-30, 250, 2, 1])]) h.send({ t: 'pdr', e });
  ok(await none(a, 'pdr'), 'malformed pdr is dropped: state, id, length, too many');
  N.stop(); done();
})().catch(e => { console.error(e); process.exitCode = 1; N.stop(); });
