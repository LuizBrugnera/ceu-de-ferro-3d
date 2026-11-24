'use strict';
/* the relay server and suspended matches: the host's last word of each kind is kept (merged where it sends only what changed), an empty
   room suspends the match, whoever joins in time is welcomed as a guest (host 0, sus 1), sent that word, then keep and host; "Nova partida"
   (fresh 1) and another map start again under a new number; GET /partidas; the copy goes after SUSPEND s (2 here) */
process.env.SUSPEND = '2';
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (cls, model, o) => { const c = await N.raw(); c.send(Object.assign({ t: 'join', room: 'modern', name: model, cls, model, mv: 1 }, o)); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; await N.sleep(80); return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const partidas = async () => (await fetch('http://localhost:' + N.PORT + '/partidas')).json();
  const of = (c, t) => c.got.filter(m => m.t === t);

  const h = await join('tank', 'abrams'), g = await join('inf', 'redAT');
  ok(h.w.rs === 1 && h.w.host === h.id && !h.w.sus, 'welcome says rs: 1 (this server suspends), and the first player is the host as before');
  ok((await partidas()).modern === null, 'GET /partidas: nothing suspended while the room has players');
  const veh = [-7, 'truck', 1, 25, 16, 1, 2, 3, 0, 0, 0, 0, 0, 0], pl = [-8, 'su25', 1, 100, 0, 1, 2, 3, 0, 0, 0, 1, 1, 0, 0, 0];
  const men = n => Array.from({ length: n }, (_, i) => [-100 - i, 2, i % 2, 22, 0, i, 2 * i, 1.5, 9]);
  const ecs = s => ({ t: 'ecs', s, T: 30, v: [s, 2, 3, 4, 5, 6, 7, 8], c: 0, q: [], r: [], kp: [], ms: [], ls: [], sl: [], kn: [], gd: [], sc: [], tg: 0 });
  const gen = s => ({ t: 'gen', s, T: 30, v: { doc: 'd' + s }, q: [] });
  const cq = (n, T) => ({ t: 'cq', n, ph: 0, T, ps: [400, 380], len: 1, p: [0, 100, 10, 0], l: [1, 2, 3, 4, 5, 6] });
  h.send({ t: 'ai', k: 1, e: [veh] }); h.send({ t: 'ai', k: 0, e: [pl] });
  h.send({ t: 'ai', k: 2, e: men(64) }); h.send({ t: 'ai', k: 2, e: men(70).slice(64) });   // soldiers come a part at a time
  h.send({ t: 'obj', e: [12, 1, 345, 2] }); h.send({ t: 'obj', e: [12, 2, 50, 1] });
  h.send({ t: 'bld', s: [3, 'AB', 4, 'C'], full: 1 }); h.send({ t: 'bld', e: [1000, 2, 1001, 1] }); h.send({ t: 'bld', e: [1000, 3], f: [9] }); h.send({ t: 'bld', m: [100, 12] });
  h.send({ t: 'base', e: [[40, 0, 1, 2, 0, 100, 500, 0]] });
  h.send({ t: 'fort', i: 0, n: 2, e: [[60, 1, 0, 1, 2, 0, 100, 50, 0]] }); h.send({ t: 'fort', i: 1, n: 2, e: [[61, 2, 1, 1, 2, 0, 40, 50, 0]] });
  h.send({ t: 'eco', e: [[7, 1, 2, 10.5, -20.5, 1.5, 50, 100, 1]] });
  for (const s of [0, 1]) { h.send(ecs(s)); h.send(gen(s)); h.send({ t: 'glog', s, T: 30, e: [[1, 'k', 'old' + s, null, null, null, null]], full: 1 }); h.send({ t: 'glog', s, T: 31, e: [[2, 'k', 'new' + s, null, null, null, null]] }); }
  h.send({ t: 'rad', e: [[1, 0, 0, 10, 20, 3, 0]] }); h.send(cq(0, 754)); h.send({ t: 'keep', e: { v: 1, n: 'econ' } });
  h.send({ t: 'mine', q: 3, i: 0, n: 1, e: [[5, 0, 1, 10, 20, 0], [6, 1, 0, 30, 40, 2]], s: 6 });   // one hidden mine of side 1
  g.send({ t: 'cq', n: 0, ph: 0, T: 1, ps: [1, 1], len: 1, p: [], l: [0, 0, 0, 0, 0, 0] }); g.send({ t: 'obj', e: [99, 2] });   // a guest's word is not the match's
  await N.sleep(150);

  console.log('-- the room empties: the match is suspended --');
  g.close(); await N.sleep(80); h.close(); await N.sleep(150);
  const p1 = await partidas();
  ok(p1.modern && p1.modern.s > 0 && p1.modern.s <= 2 && p1.modern.T === 754 && p1.modern.n === 0 && p1.ww2 === null, 'GET /partidas names the suspended match: ' + JSON.stringify(p1.modern) + ', and none in the other era');

  console.log('-- whoever comes back resumes it --');
  const r = await join('inf', 'blueRifle');
  ok(r.w && r.w.host === 0 && r.w.sus === 1 && r.w.rs === 1 && r.w.cqn === 0, 'the one who comes back is welcomed as a guest (host 0, sus 1), in the same match (cqn 0)');
  const ai = of(r, 'ai'), k2 = ai.filter(m => m.k === 2), rows = [].concat(...k2.map(m => m.e));
  ok(ai.some(m => m.k === 1 && m.e[0].join() === veh.join()) && ai.some(m => m.k === 0 && m.e[0][0] === -8), 'it is sent the host\'s last vehicle and aircraft rows');
  ok(rows.length === 70 && new Set(rows.map(e => e[0])).size === 70 && k2.every(m => m.e.length <= 64), 'and every soldier from the parts, ' + rows.length + ' rows in ' + k2.length + ' messages');
  const ob = of(r, 'obj'), ol = [].concat(...ob.map(m => m.e));
  ok(ob.every(m => m.full === 1) && ol.join() === '12,2,345,2,50,1', 'the objects\' stages merged, the highest of each, as full: ' + ol.join());
  const bl = of(r, 'bld'), be = [].concat(...bl.filter(m => m.e).map(m => m.e)), bs = bl.find(m => m.s), bf = bl.find(m => m.f), bm = bl.find(m => m.m);
  ok(be.join() === '1000,3,1001,1' && bs && bs.s.join() === '3,AB,4,C' && bf && bf.f.join() === '9' && bm && bm.m.join() === '100,12', 'the buildings: the latest state of each element, the whole-building states, those that came down, the soldiers upstairs');
  ok(bl.findIndex(m => m.s) < bl.findIndex(m => m.e), 'the whole-building states before the elements that changed since');
  const fo = of(r, 'fort');
  ok(fo.length === 2 && fo[0].i === 0 && fo[1].i === 1 && fo.every(m => m.n === 2) && (of(r, 'base')[0] || {}).e[0][0] === 40, 'the forts in their parts and the bases');
  const ec = of(r, 'ecs'), ge = of(r, 'gen'), gl = of(r, 'glog');
  ok(ec.length === 1 && ec[0].s === 0 && ge.length === 1 && ge[0].s === 0 && gl.length === 1 && gl[0].s === 0 && gl[0].full === 1 && gl[0].e.map(e => e[2]).join() === 'old0,new0', 'its own side\'s ecs, gen and the whole log (full), nothing of the other side');
  ok((of(r, 'eco')[0] || {}).e && (of(r, 'rad')[0] || {}).e && of(r, 'cq').length === 1 && of(r, 'cq')[0].T === 754 && of(r, 'cq')[0].ps.join() === '400,380', 'the economy\'s sites, the radios and the conquest with its clock where it stood (754 s)');
  const kp = r.got.findIndex(m => m.t === 'keep'), hs = r.got.findIndex(m => m.t === 'host'), last = Math.max(...['ai', 'obj', 'bld', 'cq', 'glog'].map(t => r.got.map(m => m.t).lastIndexOf(t)));
  ok(kp > last && hs > kp && r.got[kp].e.n === 'econ' && r.got[hs].id === r.id, 'then the sealed backup (keep), then host with its own id: the page adopts');
  const mn = r.got.findIndex(m => m.t === 'mine');
  ok(mn > kp && mn < hs && r.got[mn].e.length === 2 && r.got[mn].s === 6, 'and the whole mine list, the other side\'s hidden ones too, between keep and host, as a next host gets it');
  ok(!ol.includes(99) && of(r, 'cq').every(m => m.T !== 1), 'what a guest sent is not in it');
  ok((await partidas()).modern === null, 'the room has a player again: nothing suspended');
  r.got.forEach(m => { m.seen = 1; });
  const g2 = await join('inf', 'redAT'); r.send({ t: 'ai', k: 1, e: [veh] });
  ok(g2.w.host === r.id && !g2.w.sus && !!(await g2.wait('ai')), 'it is the host now: a new joiner is told so and gets its rows');
  g2.close(); await N.sleep(80);

  console.log('-- "Nova partida": the copy is dropped, and the match starts again under a new number --');
  r.send(cq(0, 600)); await N.sleep(80); r.close(); await N.sleep(150);
  ok((await partidas()).modern.T === 600, 'the resumed match is suspended in turn, at 600 s');
  const f = await join('inf', 'blueRifle', { fresh: 1 });
  ok(f.w.host === f.id && !f.w.sus && f.w.cqn === 1, 'fresh: 1 is welcomed as host of a new match (cqn 1)');
  ok(await none(f, 'ai') && await none(f, 'cq') && await none(f, 'keep') && await none(f, 'obj') && await none(f, 'mine'), 'and is sent nothing of the old one');
  f.send({ t: 'ai', k: 1, e: [veh] }); f.send(cq(1, 900)); await N.sleep(80); f.close(); await N.sleep(150);

  console.log('-- another map version starts again too --');
  const mv = await join('inf', 'blueRifle', { mv: 2 });
  ok(mv.w.host === mv.id && !mv.w.sus && mv.w.mv === 2 && mv.w.cqn === 2 && await none(mv, 'cq'), 'a page of another map is not given the match (cqn 2, mv 2)');
  mv.send(cq(2, 800)); await N.sleep(80);

  console.log('-- a new match number in play drops the copy --');
  mv.send({ t: 'obj', e: [5, 2] }); mv.send(cq(3, 900)); await N.sleep(60); mv.close(); await N.sleep(150);
  const nx = await join('inf', 'blueRifle', { mv: 2 });
  ok(nx.w.sus === 1 && nx.w.cqn === 3 && await none(nx, 'obj') && (await nx.wait('cq')).T === 900, 'the copy holds the new match only: its clock, no ruins of the one before');
  nx.close(); await N.sleep(150);

  console.log('-- SUSPEND s later the copy is gone --');
  ok(!!(await partidas()).modern, 'suspended right after the room empties');
  await N.sleep(2300);
  ok((await partidas()).modern === null, 'and nothing after 2 s');
  const late = await join('inf', 'blueRifle', { mv: 2 });
  ok(late.w.host === late.id && !late.w.sus && late.w.cqn === 4 && await none(late, 'cq') && await none(late, 'keep'), 'the next player starts a new match (cqn 4)');
  late.close(); await N.sleep(150);

  console.log('-- a slow host: its soldiers\' parts come round in 6 s, and all of them are kept --');
  const w = await join('tank', 'tiger', { room: 'ww2' }), part = (n, k) => Array.from({ length: n }, (_, i) => [-200 - k * 64 - i, 2, 0, 22, 0, i, i, 0, 9]);
  for (const k of [0, 1, 0, 1]) { w.send({ t: 'ai', k: 2, e: part(k ? 30 : 64, k) }); await N.sleep(3000); }
  w.close(); await N.sleep(150);
  const wr = await join('tank', 'tiger', { room: 'ww2' }), wl = [].concat(...of(wr, 'ai').filter(m => m.k === 2).map(m => m.e));
  ok(wr.w.sus === 1 && wl.length === 94, 'the one who comes back gets both parts, ' + wl.length + ' soldiers, the older 6 s old');
  wr.close(); await N.sleep(150);

  console.log('-- a match with very many destroyed building elements still resumes --');
  const bh = await join('tank', 'tiger', { room: 'ww2', fresh: 1 });
  for (let i = 0; i < 150000; i += 100) { bh.send({ t: 'bld', e: Array.from({ length: 200 }, (_, j) => j % 2 ? 1 : i + (j >> 1)) }); if (i % 5000 === 0) await N.sleep(5); }
  bh.send(cq(bh.w.cqn, 321)); await N.sleep(1500); bh.close(); await N.sleep(150);
  const bx = await join('tank', 'tiger', { room: 'ww2' }); await N.sleep(1500); const bn = [].concat(...of(bx, 'bld').filter(m => m.e).map(m => m.e.length));
  ok(bx.w.sus === 1 && bn.reduce((a, b) => a + b, 0) === 300000 && of(bx, 'host').length === 1 && (of(bx, 'cq')[0] || {}).T === 321, 'resume sends all ' + bn.reduce((a, b) => a + b, 0) / 2 + ' elements and then host');
  bx.close(); await N.sleep(150);

  console.log('-- a room that never played anything is not suspended --');
  const e1 = await join('inf', 'blueRifle'); e1.close(); await N.sleep(150);
  ok((await partidas()).modern === null, 'a player who joined and left without a match leaves nothing');
  const http = await fetch('http://localhost:' + N.PORT + '/partidas');
  ok(http.headers.get('access-control-allow-origin') === '*' && http.headers.get('cache-control') === 'no-store', 'GET /partidas is readable from a page opened from disk, never cached');
  N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
