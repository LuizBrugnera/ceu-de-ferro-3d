'use strict';
/* the relay and physical logistics (welcome lg: 1): the crates on the base rows and on cq (sk), lsp and lgx, the key nd of conv, alift and sprio
   and the question logi */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (cls, model) => { const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: cls, cls, model }); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const h = await join('tank', 'abrams'), a = await join('inf', 'blueRifle'), tr = await join('trn', 'hemtt'), hl = await join('heli', 'uh60');
  ok(h.w && h.w.lg === 1 && a.w.lg === 1, 'welcome says lg: 1');
  const brow = [30300, 0, 1, 2, 0, 100, 230, 0];
  h.send({ t: 'base', e: [brow.concat([87]), brow.slice()] }); const b1 = await a.wait('base');
  ok(b1 && b1.e.length === 2 && b1.e[0][8] === 87 && b1.e[1].length === 8, 'a base row with the crates as a ninth number passes, and one without them still does');
  for (const e of [brow.concat([-1]), brow.concat([1000]), brow.concat([1.5]), brow.concat([1, 2])]) h.send({ t: 'base', e: [e] });
  ok(await none(a, 'base'), 'crates out of 0-999, not whole, or a tenth number: dropped');
  const cq = o => Object.assign({ t: 'cq', n: 0, ph: 0, T: 2700, k: [600, 590], k0: 600, len: 1, p: [0, -100, 10, 0, -1, 0, 0, 0], l: [0, 0, 0, 0, 0, 0] }, o);
  h.send(cq({ sk: [30, -1] })); const c1 = await a.wait('cq'); ok(c1 && c1.sk && c1.sk.join() === '30,-1', 'cq carries sk, the crates of each point (-1 none)');
  h.send(cq({ sk: [30] })); const c2 = await a.wait('cq'); ok(c2 && c2.sk === undefined && c2.p.length === 8, 'an sk of the wrong length is left out, the rest of cq passes');
  h.send(cq({ sk: [30, 1000] })); const c3 = await a.wait('cq'); ok(c3 && c3.sk === undefined, 'and one out of range');
  a.send({ t: 'lsp', k: 1, id: 3, n: 2 }); const l1 = await h.wait('lsp'); ok(l1 && l1.from === a.id && l1.k === 1 && l1.id === 3 && l1.n === 2, 'lsp: a guest\'s entry at point 3 for 2 crates goes to the host with its sender');
  await N.sleep(320); for (const m of [{ k: 4, id: 3, n: 2 }, { k: 0, id: -1, n: 2 }, { k: 0, id: 3, n: 0 }, { k: 0, id: 3, n: 21 }]) { a.send(Object.assign({ t: 'lsp' }, m)); await N.sleep(320); }
  ok(await none(h, 'lsp'), 'an unknown kind, a bad id or crates out of 1-20: dropped');
  a.send({ t: 'lsp', k: 0, id: 3, n: 2 }); a.send({ t: 'lsp', k: 0, id: 3, n: 2 }); await h.wait('lsp'); ok(await none(h, 'lsp'), 'two within 300 ms: the second dropped');
  h.send({ t: 'lsp', k: 0, id: 3, n: 2 }); ok(await none(a, 'lsp') && await none(h, 'lsp'), 'from the host: dropped');
  tr.send({ t: 'lgx', k: 0 }); const x1 = await h.wait('lgx'); ok(x1 && x1.from === tr.id && x1.k === 0, 'lgx: a truck asks the host to load');
  await N.sleep(320); hl.send({ t: 'lgx', k: 1 }); const x2 = await h.wait('lgx'); ok(x2 && x2.from === hl.id && x2.k === 1, 'and a helicopter to unload');
  a.send({ t: 'lgx', k: 0 }); await N.sleep(320); tr.send({ t: 'lgx', k: 3 }); ok(await none(h, 'lgx'), 'from a soldier or of an unknown kind: dropped');
  h.send({ t: 'lgx', to: tr.id, k: 0, n: 40 }); const x3 = await tr.wait('lgx'); ok(x3 && x3.n === 40 && x3.k === 0 && await none(a, 'lgx'), 'the host\'s answer goes to that guest alone, with the crates aboard');
  h.send({ t: 'lgx', to: tr.id, k: 0, n: 1000 }); ok(await none(tr, 'lgx'), 'and not with a count out of range');
  a.send({ t: 'gclaim', on: 1 }); await a.wait('gctl');
  a.send({ t: 'gcmd', d: 'cmd', c: { c: 'conv', nd: 'p4', why: 'teste' }, n: 1 }); const g1 = await h.wait('gcmd');
  ok(g1 && g1.c.c === 'conv' && g1.c.nd === 'p4', 'gcmd conv with the node key nd reaches the host');
  await N.sleep(260); a.send({ t: 'gcmd', d: 'cmd', c: { c: 'sprio', nd: 'b30300', p: 3 }, n: 2 }); const g2 = await h.wait('gcmd'); ok(g2 && g2.c.nd === 'b30300' && g2.c.p === 3, 'and sprio with nd and p');
  await N.sleep(260); a.send({ t: 'gcmd', d: 'cmd', c: { c: 'conv', nd: 'P-4' }, n: 3 }); const g3 = await a.wait('gres'); ok(g3 && g3.why === 'shape' && await none(h, 'gcmd'), 'an nd that is not a short lowercase word: refused shape');
  a.send({ t: 'gask', q: { q: 'logi' }, n: 4 }); const q1 = await h.wait('gask'); ok(q1 && q1.q.q === 'logi', 'the question logi reaches the host');
  for (const c of [h, a, tr, hl]) c.close();
  N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exitCode = 1; });
