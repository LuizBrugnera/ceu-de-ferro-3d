'use strict';
/* the relay server and the units' calls for help (welcome hlp: 1): hlp from the host to each side's players only, a guest's hask (1 s apart) and hacc to the
   host alone with its sender, and what is malformed or from the wrong one dropped (SERVER, PORT_T) */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (cls, model) => { const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: cls, cls, model }); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const h = await join('tank', 'abrams'), a = await join('inf', 'blueRifle'), b = await join('inf', 'redAT');
  ok(h.w && h.w.hlp === 1 && a.w.hlp === 1, 'welcome says hlp: 1');
  await N.sleep(60); for (const c of [h, a, b]) c.got.forEach(m => { m.seen = 1; });
  const row = [3, 0, 1200.5, -300, 1, 0];
  h.send({ t: 'hlp', s: 0, e: [row, [4, 6, 10, 20, 2, a.id]] }); const m0 = await a.wait('hlp');
  ok(m0 && m0.s === 0 && m0.e.length === 2 && m0.e[1][5] === a.id, 'the host\'s calls of side 0 reach a player of side 0');
  ok(await none(b, 'hlp'), '  and not one of side 1');
  h.send({ t: 'hlp', s: 1, e: [] }); ok(!!(await b.wait('hlp')) && await none(a, 'hlp'), 'side 1\'s (none open) reach side 1 only');
  a.send({ t: 'hlp', s: 0, e: [row] }); ok(await none(h, 'hlp') && await none(b, 'hlp'), 'hlp from a guest is dropped');
  for (const e of [[[0, 0, 1, 2, 0, 0]], [[3, 7, 1, 2, 0, 0]], [[3, 0, 1, 2, 3, 0]], [[3, 0, 'x', 2, 0, 0]], [[3, 0, 1, 2, 0]], new Array(25).fill(row)]) h.send({ t: 'hlp', s: 0, e });
  h.send({ t: 'hlp', s: 2, e: [row] });
  ok(await none(a, 'hlp'), 'malformed hlp is dropped: id, need, state, a field, a short row, too many rows, a side');
  a.send({ t: 'hask', k: 0, p: [10, 20], q: [30, 40] }); const k1 = await h.wait('hask');
  ok(k1 && k1.from === a.id && k1.k === 0 && k1.q[1] === 40, 'hask from a guest goes to the host with its sender');
  ok(await none(b, 'hask'), '  and to nobody else');
  a.send({ t: 'hask', k: 1, p: [10, 20], q: [30, 40] }); ok(await none(h, 'hask'), 'a second hask within 1 s is dropped');
  await N.sleep(1050);
  for (const m of [{ k: 7, p: [1, 2], q: [3, 4] }, { k: 0, p: [1], q: [3, 4] }, { k: 0, p: [1, 2] }]) b.send(Object.assign({ t: 'hask' }, m));
  ok(await none(h, 'hask'), 'malformed hask is dropped');
  h.send({ t: 'hask', k: 0, p: [1, 2], q: [3, 4] }); ok(await none(h, 'hask'), 'the host\'s own is not sent back to it');
  b.send({ t: 'hacc', id: 3 }); const c1 = await h.wait('hacc'); ok(c1 && c1.from === b.id && c1.id === 3, 'hacc from a guest goes to the host with its sender');
  b.send({ t: 'hacc', id: 0 }); b.send({ t: 'hacc', id: 'x' }); ok(await none(h, 'hacc'), 'malformed hacc is dropped');
  N.stop(); done();
})().catch(e => { console.error(e); process.exitCode = 1; N.stop(); });
