'use strict';
/* the relay server and the economy and the general: eco rows, ecs/gen/glog to one side only, the cue per side, who commands (gclaim, gctl), gcmd and gask to the host,
   gres back to the asker, keep (the host's sealed backup) handed to the next host, and an MCP bridge (join cls gen with the server's key) */
process.env.GENKEY = 'k';
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (cls, model) => { const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: model, cls, model }); c.w = await c.wait('welcome', 800); c.cap = await c.wait('fcap', 400); c.id = c.w && c.w.id; return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const seeAll = cs => cs.forEach(c => c.got.forEach(m => { m.seen = 1; }));
  const h = await join('tank', 'abrams'), a = await join('inf', 'blueRifle'), b = await join('inf', 'redAT'), a2 = await join('inf', 'blueSaw');
  const all = [h, a, b, a2];
  ok(h.w.eco === 1 && h.w.gen === 1 && h.w.gn.join() === '0,0' && h.w.gk.join() === '0,0' && a.w.eco === 1 && ['host', 'id', 'inf', 'obj', 'players', 'sup', 'swap', 't', 'cqn'].every(k => k in h.w), 'welcome says eco 1, gen 1 and who commands (nobody), with what it had');

  const ecs = { t: 'ecs', s: 0, T: 12.5, v: [1, 2, 3, 4, 5, 6, 7, 8], c: 0, q: [1, 2, 3, 40, 0], r: [1, 2], kp: [3, 4], ms: [], ls: [], sl: [1, 2, 3, 4], kn: [1, 2, 3, 4, 5, 0], gd: [1, 2, 3], sc: [], tg: 0 };
  const gen = { t: 'gen', s: 0, T: 12.5, v: { doc: 'x', post: { k: 'att', s: 'text' }, road: null, ops: [], fm: [], sc: [], hit: null, focus: null, thr: null, want: null, gate: '', atkT: 0, ev: [], evT: -1 }, q: [1, 2, 3, 4, 5, 6] };
  const glog = { t: 'glog', s: 0, T: 12.5, e: [[1, 'k', 'hello', null, 2, 3, null]] };
  seeAll(all); h.send(ecs); h.send(gen); h.send(glog);
  const e1 = await a.wait('ecs'), e2 = await a2.wait('ecs'), g1 = await a.wait('gen'), l1 = await a2.wait('glog');
  ok(e1 && e2 && e1.s === 0 && e1.v.join() === ecs.v.join() && e1.kn.join() === ecs.kn.join() && g1 && g1.v.post.k === 'att' && g1.q.length === 6 && l1 && l1.e[0][2] === 'hello', 'ecs, gen and glog of side 0 reach its players');
  ok(await none(b, 'ecs') && await none(b, 'gen') && await none(b, 'glog') && await none(h, 'ecs') && await none(h, 'gen') && await none(h, 'glog'), 'and not the other side, not the host itself');
  seeAll(all); a.send(ecs); a.send(gen); a.send(glog); a2.send(ecs);
  ok(await none(h, 'ecs') && await none(b, 'ecs') && await none(a2, 'ecs') && await none(a2, 'gen') && await none(a2, 'glog') && await none(h, 'gen') && await none(h, 'glog'), 'from a guest they are dropped');
  seeAll(all); h.send(Object.assign({}, glog, { to: a2.id, e: [[2, 'k', 'only', null, null, null, null]] }));
  const l2 = await a2.wait('glog'); ok(l2 && l2.e[0][2] === 'only' && await none(a, 'glog') && await none(b, 'glog'), 'glog with to reaches that player only');
  seeAll(all); h.send(Object.assign({}, glog, { full: 1 })); const l3 = await a.wait('glog'); ok(l3 && l3.full === 1, 'glog full is kept');
  const bad = [Object.assign({}, ecs, { s: 2 }), Object.assign({}, ecs, { v: [1] }), Object.assign({}, ecs, { c: 3 }), Object.assign({}, ecs, { q: [1, 2, 3] }), Object.assign({}, ecs, { sl: [1, 2, 3] }), Object.assign({}, ecs, { sc: [1, 2] }), Object.assign({}, ecs, { tg: 'x' }), Object.assign({}, ecs, { T: 'x' })];
  seeAll(all); for (const m of bad) h.send(m);
  ok(await none(a, 'ecs') && await none(b, 'ecs'), 'malformed ecs is dropped: a side, a short v, a control, a ragged list, a wrong scout, a text');
  seeAll(all); h.send(Object.assign({}, gen, { v: null })); h.send(Object.assign({}, gen, { q: [1, 2] })); h.send(Object.assign({}, glog, { e: [[1, 'K', 'x', null, null, null, null]] })); h.send(Object.assign({}, glog, { e: [[1, 'k', 'x']] }));
  ok(await none(a, 'gen') && await none(a, 'glog'), 'malformed gen and glog are dropped');

  const c0 = [1, 2], c1 = [3, 4]; seeAll(all); h.send({ t: 'cmd', c: [c0, c1] });
  const m1 = await a.wait('cmd'), m2 = await b.wait('cmd'), m3 = await a2.wait('cmd');
  ok(m1 && JSON.stringify(m1.c) === '[[1,2],[0]]' && m2 && JSON.stringify(m2.c) === '[[0],[3,4]]' && m3 && JSON.stringify(m3.c) === '[[1,2],[0]]' && await none(h, 'cmd'), 'cmd: each side gets its own commander only');

  const row = [7, 1, 2, 10.5, -20.5, 1.5, 50, 100, 1], row2 = [8, 0, 0, 0, 0, 0, 100, 10, 2, 255];
  seeAll(all); h.send({ t: 'eco', e: [row, row2] });
  const r1 = await a.wait('eco'), r2 = await b.wait('eco'), r3 = await a2.wait('eco');
  ok(r1 && r2 && r3 && r2.e[0].join() === row.join() && r2.e[1].join() === row2.join() && await none(h, 'eco'), 'eco rows reach everyone, not the host');
  seeAll(all); a.send({ t: 'eco', e: [row] }); ok(await none(b, 'eco') && await none(h, 'eco'), 'eco from a guest is dropped');
  seeAll(all); h.send({ t: 'eco', e: [row.slice(0, 8)] }); h.send({ t: 'eco', e: [[7, 1, 8, ...row.slice(3)]] }); h.send({ t: 'eco', e: [[...row.slice(0, 8), 3]] }); h.send({ t: 'eco', e: new Array(49).fill(row) });
  h.send({ t: 'eco', e: [[7, 2, ...row.slice(2)]] }); h.send({ t: 'eco', e: [[...row, 256]] }); h.send({ t: 'eco', e: 'x' });
  ok(await none(a, 'eco') && await none(b, 'eco'), 'malformed eco is dropped: a 9-wide row of kind 8 (short), a stage 3, 49 rows, a side 2, a flag 256, not a list');
  seeAll(all); h.send({ t: 'eco', e: [[7, 1, 8, 1, 2, 0, 50, 100, 1]] }); ok(await none(a, 'eco'), 'kind 8 is dropped');
  seeAll(all); h.send({ t: 'eco', e: new Array(48).fill(row) }); ok(await a.wait('eco'), 'and 48 rows pass');

  seeAll(all); a.send({ t: 'gcmd', d: 'eco', c: { c: 'make', k: 'tank', n: 1 }, n: 1 }); const x1 = await a.wait('gres');
  ok(x1 && x1.ok === false && x1.why === 'ctl' && x1.n === 1 && await none(h, 'gcmd'), 'gcmd before a claim: gres ctl from the server');
  seeAll(all); a.send({ t: 'gclaim', on: 1 });
  const gc = await Promise.all(all.map(c => c.wait('gctl')));
  ok(gc.every(m => m && m.g.join() === a.id + ',0' && m.k.join() === '1,0'), 'a claims: everyone gets gctl g [a, 0] k [1, 0]');
  seeAll(all); a2.send({ t: 'gclaim', on: 1 }); const gr = await a2.wait('gctl');
  ok(gr && gr.g.join() === a.id + ',0' && await none(a, 'gctl') && await none(h, 'gctl') && await none(b, 'gctl'), 'a2 claim is refused: it alone is told who holds it');
  await N.sleep(1050);
  seeAll(all); b.send({ t: 'gclaim', on: 0 }); ok(await none(a, 'gctl') && await none(b, 'gres'), 'a release by one who does not hold is not a release');

  seeAll(all); a.send({ t: 'gcmd', d: 'eco', c: { c: 'make', k: 'tank', n: 1, why: 'x\u0001y', key: 'z' }, n: 2 }); const x2 = await a.wait('gres');
  ok(x2 && x2.why === 'shape' && x2.n === 2 && await none(h, 'gcmd'), 'gcmd with an unknown key: gres shape');
  await N.sleep(300);
  seeAll(all); a.send({ t: 'gcmd', d: 'eco', c: { c: 'make', k: 'tank', n: 1, why: 'x\u0001y' }, n: 3 }); const gh = await h.wait('gcmd');
  ok(gh && gh.from === a.id && gh.s === 0 && gh.g === 0 && gh.d === 'eco' && gh.n === 3 && JSON.stringify(gh.c) === '{"c":"make","k":"tank","n":1,"why":"xy"}', 'gcmd reaches the host with the sender, the side the server knows, and the cleaned shape');
  a.send({ t: 'gcmd', d: 'eco', c: { c: 'make', k: 'tank', n: 1 }, n: 4 }); const x3 = await a.wait('gres');
  ok(x3 && x3.why === 'rate' && x3.n === 4, 'a second within 250 ms: gres rate');
  await N.sleep(300);
  seeAll(all); a.send({ t: 'gcmd', d: 'eco', c: { c: 'draw' }, n: 5 }); const x4 = await a.wait('gres'); ok(x4 && x4.why === 'shape' && await none(h, 'gcmd'), 'c draw: shape');
  await N.sleep(300);
  for (const [i, c] of [{ c: 'x' }, { c: 'make', n: 1.5 }, { c: 'make', x: 1e6 }, { c: 'make', k: 'A' }, { c: 'make', why: 'x'.repeat(121) }, { c: 'make', n: 'x' }, 'x', null].entries()) {
    seeAll(all); a.send({ t: 'gcmd', d: 'eco', c, n: 10 + i }); const r = await a.wait('gres'); if (!(r && r.why === 'shape')) ok(false, 'bad gcmd shape ' + JSON.stringify(c));
    await N.sleep(260);
  }
  ok(await none(h, 'gcmd'), 'malformed gcmd bodies never reach the host');
  seeAll(all); a.send({ t: 'gcmd', d: 'cmd', c: { c: 'ops', k: 'atk' }, n: 30 }); ok(await h.wait('gcmd'), 'd cmd passes the server');
  await N.sleep(260);
  seeAll(all); b.send({ t: 'gcmd', d: 'eco', c: { c: 'make' }, n: 31 }); const x5 = await b.wait('gres'); ok(x5 && x5.why === 'ctl' && await none(h, 'gcmd'), 'the other side cannot command either');

  seeAll(all); h.send({ t: 'gres', to: a.id, n: 3, ok: true, why: '', id: 3 }); const rs = await a.wait('gres');
  ok(rs && rs.n === 3 && rs.ok === true && rs.id === 3 && await none(b, 'gres') && await none(a2, 'gres') && await none(h, 'gres'), 'gres from the host reaches the asker alone');
  seeAll(all); a.send({ t: 'gres', to: a2.id, n: 3, ok: true, why: '', id: 3 }); ok(await none(a2, 'gres'), 'gres from a guest is dropped');
  seeAll(all); h.send({ t: 'gres', to: a.id, n: 4, ok: true, why: 'x'.repeat(13), id: 3 }); ok(await none(a, 'gres'), 'a refusal reason over 12 characters is dropped');
  seeAll(all); a2.send({ t: 'gask', q: { q: 'view' }, n: 8 }); const ga = await h.wait('gask');
  ok(ga && ga.from === a2.id && ga.s === 0 && ga.q.q === 'view' && ga.n === 8, 'gask view from a2 reaches the host with its side');
  seeAll(all); a2.send({ t: 'gask', q: { q: 'bogus' }, n: 9 }); await N.sleep(1050); a2.send({ t: 'gask', q: { q: 'bogus' }, n: 9 }); const xs = await a2.wait('gres'); ok(xs && xs.why === 'shape' && await none(h, 'gask'), 'gask with an unknown question: gres shape');

  seeAll(all); h.send(Object.assign({}, gen, { v: Object.assign({}, gen.v, { pad: 'x'.repeat(6000) }) })); ok(await a.wait('gen', 800), 'a 6 KB gen passes');
  seeAll(all); h.send(Object.assign({}, gen, { v: Object.assign({}, gen.v, { pad: 'x'.repeat(9000) }) })); ok(await none(a, 'gen'), 'a 9 KB gen is dropped');
  seeAll(all); h.send({ t: 'ai', pad: 'x'.repeat(5000) }); ok(true, 'ai stays under its own limit');

  seeAll(all); h.send({ t: 'keep', e: { n: 0, T: 1, d: [{}, {}] } }); ok(await none(a, 'keep') && await none(b, 'keep') && await none(a2, 'keep'), 'keep from the host reaches nobody');
  seeAll(all); a.send({ t: 'keep', e: { n: 9 } });

  /* the MCP bridge */
  const mc = async (side, key) => { const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: 'x', cls: 'gen', side, key }); return c; };
  const m0 = await mc(1, 'x'); const e0 = await m0.wait('error'); ok(e0 && e0.code === 'gen', 'MCP with a wrong key: error gen');
  seeAll(all); const mp = await mc(1, 'k'); mp.w = await mp.wait('welcome');
  ok(mp.w && mp.w.gen === 1 && mp.w.side === 1 && mp.w.id > 0 && !mp.w.players.some(p => p.id === mp.w.id) && await none(h, 'joined') && await none(b, 'joined'), 'MCP with the key and a side: welcome; nobody is told it joined');
  seeAll(all); h.send(Object.assign({}, ecs, { s: 1 })); const me = await mp.wait('ecs'), be = await b.wait('ecs'); ok(me && me.s === 1 && be && await none(a, 'ecs'), 'it gets its side\'s ecs, as the side does');
  seeAll(all); mp.send({ t: 'fort', i: 0, n: 1, e: [] }); mp.send({ t: 'eco', e: [row] }); ok(await none(h, 'fort') && await none(a, 'eco'), 'the bridge reaches only its own handlers');
  seeAll(all); mp.send({ t: 'gclaim', on: 1 }); const mg = await h.wait('gctl'); const mg2 = await mp.wait('gctl');
  ok(mg && mg.g[1] === mp.w.id && mg.k.join() === '1,2' && mg2 && mg2.k.join() === '1,2', 'its claim: gctl k [1, 2]');
  const m2n = await mc(1, 'k'); const et = await m2n.wait('error'); ok(et && et.code === 'taken', 'a second bridge for side 1: error taken');
  const m3n = await mc(3, 'k'); const es = await m3n.wait('error'); ok(es && es.code === 'taken', 'a side that is none: refused');
  const m2s = await mc(2, 'k'); const es2 = await m2s.wait('error'); ok(es2 && es2.code === 'sides', 'side 2 (the Insurgents) in a room of two sides: refused, sides (cf-3l-p5-servidor)');
  seeAll(all); mp.send({ t: 'gask', q: { q: 'view' }, n: 1 }); const mk = await h.wait('gask'); ok(mk && mk.s === 1 && mk.from === mp.w.id, 'its gask reaches the host as side 1');
  seeAll(all); mp.send({ t: 'gcmd', d: 'eco', c: { c: 'make', k: 'tank', n: 1 }, n: 2 }); const mc2 = await h.wait('gcmd'); ok(mc2 && mc2.g === 1 && mc2.s === 1, 'its gcmd reaches the host with g 1');
  seeAll(all); mp.close(); const fr = await Promise.all([h, a, b, a2].map(c => c.wait('gctl')));
  ok(fr.every(m => m && m.g.join() === a.id + ',0' && m.k.join() === '1,0') && await none(h, 'left'), 'the bridge leaves: gctl frees side 1, and no one is told it left');

  /* the host leaves: the backup first, then host */
  seeAll(all); h.send({ t: 'keep', e: { n: 0, T: 1, d: [{}, {}], log: [[], []] } }); await N.sleep(100);
  h.close(); const ak = await a.wait('host', 800), bh = await b.wait('host', 800);
  const ik = a.got.findIndex(m => m.t === 'keep'), ih = a.got.findIndex(m => m.t === 'host');
  ok(ak && ak.id === a.id && bh && ik >= 0 && ih > ik && a.got[ik].e.T === 1 && b.got.every(m => m.t !== 'keep') && a2.got.every(m => m.t !== 'keep'), 'the host leaves: the next host gets keep then host; the rest get only host');
  seeAll(all); a.close(); const fa = await Promise.all([b, a2].map(c => c.wait('gctl')));
  ok(fa.every(m => m && m.g.join() === '0,0' && m.k.join() === '0,0'), 'the general leaves: gctl frees side 0');
  for (const c of [b, a2, m0, m2n, m3n]) c.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
