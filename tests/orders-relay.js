'use strict';
/* the relay and the abstract orders and routes (W21): welcome says rte 1; a gcmd may carry rt, a route of 1 to 8 x z pairs (flat numbers), passed to the
   host as sent; a ragged, a long, a non-numeric or a nested route is shape and never reaches the host. The MCP bridge's own check mirrors the relay's */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (cls, model) => { const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: model, cls, model }); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const h = await join('tank', 'abrams'), a = await join('inf', 'blueRifle'), b = await join('inf', 'redAT');
  ok(h.w.rte === 1 && a.w.rte === 1 && b.w.rte === 1 && h.w.gc === 2, 'welcome says rte 1 (and still gc 2)');
  a.send({ t: 'gclaim', on: 1 }); await a.wait('gctl'); await N.sleep(300);
  const seen = () => [h, a, b].forEach(c => c.got.forEach(m => { m.seen = 1; }));
  const good = [
    { c: 'ord', k: 'atk', pi: 7, n: 3, rt: [1200.5, -300, 1800, -250.25] },
    { c: 'move', x: 1500, z: 20, ids: [3, 4], rt: [1300, 10] },
    { c: 'fort', k: 'trench', x: 1500, z: 20, a: 1.5, rt: new Array(16).fill(0).map((v, i) => 100 * i) },
    { c: 'req', k: 'lift', x: 4000, z: 0, n: 2, rt: [3000, 0] }];
  for (const [i, c] of good.entries()) {
    seen(); a.send({ t: 'gcmd', d: 'cmd', c, n: 100 + i }); const g = await h.wait('gcmd');
    ok(g && g.n === 100 + i && JSON.stringify(g.c) === JSON.stringify(c), c.c + ' with a route of ' + c.rt.length / 2 + ' point(s) reaches the host as sent');
    await N.sleep(270);
  }
  const bad = [[1, 2, 3], [], new Array(18).fill(1), [1, 'x'], [[1, 2]], [1, 2e5], 'x', { x: 1 }, [1, null], [1, Infinity]];
  let shape = 0;
  for (const [i, rt] of bad.entries()) {
    seen(); a.send({ t: 'gcmd', d: 'cmd', c: { c: 'move', x: 1, z: 1, rt }, n: 200 + i }); const r = await a.wait('gres');
    if (r && r.why === 'shape' && r.n === 200 + i) shape++; else ok(false, 'a bad route passed: ' + JSON.stringify(rt));
    await N.sleep(270);
  }
  ok(shape === bad.length && await none(h, 'gcmd'), 'every bad route is shape and never reaches the host: ragged, empty, nine points, text, nested, too far, not a list, null, infinite (' + shape + '/' + bad.length + ')');
  seen(); b.send({ t: 'gcmd', d: 'cmd', c: { c: 'ord', k: 'def', x: 1, z: 1, rt: [1, 2] }, n: 300 }); const x = await b.wait('gres');
  ok(x && x.why === 'ctl' && await none(h, 'gcmd'), 'the other side cannot send one either: ctl');
  /* the MCP bridge mirrors the check before it sends */
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'mcp-general.js'), 'utf8'), vm = require('vm');
  const ctx = vm.createContext({}); vm.runInContext(src.slice(src.indexOf('const GK = {'), src.indexOf('function rawAsk')) + ';globalThis.rawCmd = rawCmd;', ctx);
  ok(good.every(c => ctx.rawCmd(c) === null) && bad.every(rt => ctx.rawCmd({ c: 'move', rt }) !== null), 'mcp-general.js accepts the same routes and refuses the same bad ones');
  for (const c of [h, a, b]) c.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
