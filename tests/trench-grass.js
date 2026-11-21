'use strict';
/* no grass in a trench (cf-trincheiras-tuneis; cf-pol-testes-b): the clumps stood up from a dug trench's floor. vegChunk leaves out the clumps
   inside a trench drawn as a hole (FHOLE: .25 m deep or more), and when a trench is dug deeper, appears or goes, holeGrass makes the grass
   chunks it touches again, in place and in the same frame. The functions live in the view part of the page (after the 3D scene marker), so
   they are cut out of the page and run with stubs: no DOM, no three.js */
const fs = require('fs'), vm = require('vm'), { PAGE, ok, done } = require('./harness');
const html = fs.readFileSync(PAGE, 'utf8');
const cut = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
const src = cut('vegTrenches') + cut('vegInTrench') + cut('holeGrass');
ok(src.length > 0 && /function vegTrenches/.test(src) && /function vegInTrench/.test(src) && /function holeGrass/.test(src), 'the page has vegTrenches, vegInTrench and holeGrass');
if (/function vegInTrench/.test(src)) {
  const tr = (id, x, z, a, prog) => ({ id, k: 1, x, z, a, prog, o: { hw: 7, hd: 1.3 } });
  const S = { forts: [tr(1, 100, 100, 0, 1), tr(2, 300, 100, Math.PI / 2, 1), tr(3, 500, 100, 0, .1), Object.assign(tr(4, 700, 100, 0, 1), { gone: true }), { id: 5, k: 2, x: 100, z: 120, prog: 1 }] };
  const made = [], chunks = new Map();
  const mk = (i, j) => ({ x: i * 40 + 20, z: j * 40 + 20, m: 50, me: { visible: true }, geo: { instanceCount: 30 } });
  for (const [i, j] of [[2, 2], [7, 2], [12, 2], [20, 20]]) chunks.set(i * 65536 + j, mk(i, j));
  const G = { chunks, free: [] }, gHole = {};
  const ctx = vm.createContext({ S, FORT: { trench: { depth: 1.6 } }, VEG: { trench: .35, chunk: 40 }, VS: { built: { g: G } }, gHole,
    vegChunk: (V, i, j) => { made.push([i, j]); const c = G.free.pop() || {}; Object.assign(c, mk(i, j), { me: { visible: false }, m: 40 }); return c; } });
  vm.runInContext(src, ctx);
  const { vegTrenches, vegInTrench, holeGrass } = ctx;
  /* in the cut or not: a trench along z (a 0: along -z), 7 m half length, 1.3 m half width, .35 m more */
  const f1 = S.forts[0];
  ok(vegInTrench(f1, 100, 100) && vegInTrench(f1, 100, 106.9) && vegInTrench(f1, 101.5, 100), 'a point on its floor is in it (middle, near an end, near a side)');
  ok(!vegInTrench(f1, 100, 108) && !vegInTrench(f1, 102, 100), 'a point past its end or its side (over .35 m) is not');
  ok(vegInTrench(S.forts[1], 306, 100) && !vegInTrench(S.forts[1], 300, 106), 'turned a quarter: along x then');
  /* which are drawn: dug enough, not gone, trenches only */
  const L = vegTrenches(300, 100, 400).map(f => f.id);
  ok(L.join(',') === '1,2', 'vegTrenches: the dug ones near the place (' + L.join(',') + '), not the shallow one (3: .16 m), the gone one (4) or a sandbag (5)');
  ok(vegTrenches(100, 600, 30).length === 0, 'none far away');
  /* holeGrass: the first call after a world is built only notes the trenches */
  holeGrass();
  ok(made.length === 0 && gHole.gr && gHole.gr.size === 2, 'the first call notes the 2 drawn trenches and makes nothing again');
  holeGrass();
  ok(made.length === 0, 'nothing changed: nothing made again');
  S.forts[2].prog = 1;   // trench 3 at x 500 dug deep: the chunk (12, 2) round x 500 is made again, in place
  holeGrass();
  ok(made.length === 1 && made[0][0] === 12 && made[0][1] === 2, 'trench 3 dug: only the chunk it touches is made again (' + made.map(m => m.join(' ')).join('; ') + ')');
  const c = chunks.get(12 * 65536 + 2);
  ok(c && c.me.visible === true && c.geo.instanceCount === 30, 'in place: the chunk is there in the same call, visible as before, its clumps drawn as before');
  S.forts[0].gone = true; made.length = 0;   // trench 1 filled in: its chunk is made again (the grass grows back)
  holeGrass();
  ok(made.length === 1 && made[0][0] === 2 && made[0][1] === 2, 'trench 1 gone: its chunk is made again, so the grass grows back');
}
/* the page wires them in */
const vc = cut('vegChunk'), hs = cut('holeScene');
ok(/const tr = vegTrenches\(mx, mz, CS \* \.75\);/.test(vc) && /if \(tr\.length && tr\.some\(f => vegInTrench\(f, x, z\)\)\) continue;/.test(vc), 'vegChunk leaves out the clumps in a trench');
ok(/holeBuild\(\); holeGrass\(\);/.test(hs), 'holeScene calls holeGrass when the trenches change');
done();
