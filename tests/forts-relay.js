'use strict';
/* the relay server and the messages of trenches and sandbags: fcap after welcome, fort from the host to the room, fbuild from a soldier to the host */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (cls, model) => { const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: cls, cls, model }); c.w = await c.wait('welcome', 800); c.cap = await c.wait('fcap', 400); c.id = c.w && c.w.id; return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const h = await join('tank', 'abrams'), a = await join('inf', 'blueRifle'), b = await join('inf', 'redAT');
  ok(h.cap && h.cap.v === 1 && a.cap && a.cap.v === 1 && h.w.sup === 1 && h.w.obj === 1 && ['host', 'id', 'inf', 'obj', 'players', 'sup', 'swap', 't'].every(k => k in h.w), 'everyone is told fcap v: 1 right after a welcome that still has what it had');
  const row = [55100, 1, 0, 1234.5, -678.9, 1.57, 42, 150, 0], row2 = [55101, 2, 1, 5, 6, 0, 100, 12, 2];
  h.send({ t: 'fort', i: 0, n: 1, e: [row, row2] }); const f1 = await a.wait('fort'), f2 = await b.wait('fort');
  ok(f1 && f2 && f1.i === 0 && f1.n === 1 && f1.e.length === 2 && f1.e[0].join() === row.join() && f2.e[1].join() === row2.join() && await none(h, 'fort'), 'fort from the host reaches the room as it was sent, and not the host');
  h.send({ t: 'fort', i: 1, n: 3, e: [] }); const f3 = await a.wait('fort'); ok(f3 && f3.i === 1 && f3.n === 3 && f3.e.length === 0, 'a part of several, and an empty one, pass');
  await N.sleep(60); for (const c of [a, b, h]) c.got.forEach(m => { m.seen = 1; });
  a.send({ t: 'fort', i: 0, n: 1, e: [row] }); ok(await none(b, 'fort') && await none(h, 'fort'), 'fort from a guest is dropped');
  const big = new Array(41).fill(row);
  for (const m of [{ i: 0, n: 1, e: [row.slice(0, 8)] }, { i: 0, n: 1, e: [[row[0], 0, ...row.slice(2)]] }, { i: 0, n: 1, e: [[row[0], 9, ...row.slice(2)]] }, { i: 0, n: 1, e: [[row[0], 1, 2, ...row.slice(3)]] }, { i: 0, n: 1, e: [[...row.slice(0, 6), 101, 150, 0]] }, { i: 0, n: 1, e: [[...row.slice(0, 8), 3]] },
    { i: 0, n: 1, e: [[70000, ...row.slice(1)]] }, { i: 0, n: 1, e: [[1.5, ...row.slice(1)]] }, { i: 0, n: 1, e: [['x', ...row.slice(1)]] }, { i: 0, n: 1, e: [row, 5] }, { i: 0, n: 1, e: big }, { i: 1, n: 1, e: [row] }, { i: 0, n: 9, e: [row] }, { i: -1, n: 1, e: [row] }, { n: 1, e: [row] }, { i: 0, n: 1, e: 'x' }]) h.send(Object.assign({ t: 'fort' }, m));
  ok(await none(a, 'fort'), 'malformed fort is dropped: a short row, a kind, a side or a stage that is none, more than 100%, an id out of range, more than 40 rows, a part outside its count, more than 8 parts, not a list');
  a.send({ t: 'fbuild', k: 1, p: [100.5, -20.5], a: 1.57 }); const bd = await h.wait('fbuild');
  ok(bd && bd.from === a.id && bd.k === 1 && bd.p.join() === '100.5,-20.5' && bd.a === 1.57 && await none(b, 'fbuild'), 'fbuild from a soldier goes to the host alone, with its sender and its kind');
  a.send({ t: 'fbuild', k: 2, p: [100.5, -20.5], a: 1.57 }); ok(await none(h, 'fbuild'), 'a second one within 700 ms is dropped');
  await N.sleep(720); a.send({ t: 'fbuild', k: 2, p: [1, 2], a: 0 }); const bd2 = await h.wait('fbuild'); ok(bd2 && bd2.k === 2, 'and after that the next passes');
  await N.sleep(720);
  for (const m of [{ k: 0, p: [1, 2], a: 0 }, { k: 9, p: [1, 2], a: 0 }, { p: [1, 2], a: 0 }, { k: 1, p: [1], a: 0 }, { k: 1, p: [1, 'x'], a: 0 }, { k: 1, p: [1, 2] }, { k: 1, p: [1, 2], a: 1 / 0 }]) a.send(Object.assign({ t: 'fbuild' }, m));
  ok(await none(h, 'fbuild'), 'malformed fbuild is dropped: a kind that is none, no place, no facing');
  h.send({ t: 'fbuild', k: 1, p: [1, 2], a: 0 }); ok(await none(a, 'fbuild') && await none(h, 'fbuild'), 'fbuild from the host itself goes nowhere: it starts its own');
  const tk = await join('tank', 'leo2'); tk.send({ t: 'fbuild', k: 1, p: [1, 2], a: 0 }); ok(await none(h, 'fbuild'), 'fbuild from a tank is dropped: only soldiers build');
  a.send({ t: 'build', p: [9, 9], a: 0 }); const ob = await h.wait('build'); h.send({ t: 'obj', e: [56000, 2] }); const oo = await a.wait('obj');
  ok(ob && ob.from === a.id && oo && oo.e.join() === '56000,2', 'build and obj still pass as before');
  for (const c of [h, a, b, tk]) c.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
