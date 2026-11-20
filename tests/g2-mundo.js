'use strict';
/* g2-mundo: the world model of the General 2 (G1 of the report cf-ia-opensource, task cf-g2-g1-mundo), measured.
   1. the code: the section GENERAL 2: mundo reads none of S.men, S.units, S.bombs and S.planes.
   2. the ground, on the maps MAPS in both eras: every capture point and base a region of its own, the seat towns marked, every passable cell
      in a region, the regions all reach each other, every edge with its times (on a road, wheels before feet).
   3. the routes, G1's criterion: for each ordered pair of points, two routes or more with overlap 40 % or less and arrivals 45° or more
      apart, in 70 % of the pairs or more, and for each point; no route over water, none longer than G2W.rt.long times the quickest. The table.
   4. a bridge falls: the ground is built again a piece a frame while the old one serves; the bridge's cell is no way any more.
   5. honesty: a Proxy on S counts reads of the four lists while the model runs (its look, its guesses, its routes, its answer, its build):
      none (a positive control first); an enemy the side does not know of changes nothing, a reported one counts where it was reported, not
      where it is; an enemy site is worth taking once identified, not before; the guesses draw no Math.random.
   6. the switch: the same match with G2W.on 1 and 0 after SECS s (units, men, tickets, operations; the frame meter's clock fixed, as
      balance.js --nobudget), the belief of each side refreshed on its turn, and how much of the enemy it has placed.
   7. gask mundo: the regions, the edges and the belief; with x z, the routes; the same answer to the player and to the model.
   8. the cost: the ground at the load, the routes of a pair, a look (printed; measured beside the tournament, docs/nao-testado/cf-g2-g1-mundo.md).
   MAPS (default "6,11"), SECS (default 60; 0 skips the matches) */
const fs = require('fs'), H = require('./harness'), { ok, done } = H, { performance } = require('perf_hooks');
const MAPS = (process.env.MAPS || '6,11').split(',').map(Number).filter(Boolean), SECS = process.env.SECS === undefined ? 60 : +process.env.SECS;
console.log('page: ' + H.PAGE);
const html = fs.readFileSync(H.PAGE, 'utf8');
const watch = (era, mapv, o) => { const C = H.load(Object.assign({ seed: 7, eco: 1, mapv }, o)); C.$('globalThis').performance = performance; const S = C.watch(era, { len: 0, doc: ['balanced', 'balanced'] }); return { C, S, $: C.$ }; };
const med = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };
const pc = v => Math.round(v * 100) + '%';

console.log('-- 1. the code --');
{
  const a = html.indexOf('/* ---------- GENERAL 2: mundo'), b = html.indexOf('/* ---------- ', a + 10);
  const src = html.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, s => s.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"\\])\/\/[^\n]*/g, (s, p) => p + ' '.repeat(s.length - p.length));
  const bad = src.split('\n').map((l, i) => [i, l]).filter(([, l]) => /\bS\.(men|units|bombs|planes)\b/.test(l));
  ok(a > 0 && b > a && /function g2Sense\(/.test(src) && /function\* g2Job\(/.test(src), 'the page has its section GENERAL 2: mundo (' + src.split('\n').length + ' lines)');
  ok(!bad.length, 'and no S.men, S.units, S.bombs or S.planes in it' + (bad.length ? ':\n      ' + bad.map(([i, l]) => i + ': ' + l.trim().slice(0, 100)).join('\n      ') : ''));
}

console.log('-- 2 and 3. the ground and the routes (the criterion of G1) --');
const rows = [];
for (const mapv of MAPS) for (const era of ['ww2', 'modern']) {
  const { S, $ } = watch(era, mapv), W = S.T.g2w, G2W = $('G2W'), tag = era + ' map ' + mapv;
  if (!ok(W && W.N > 0, tag + ': the ground was built at the load (' + (W ? W.N + ' regions, ' + W.e.length + ' edges, ' + W.ms.toFixed(0) + ' ms' : 'none') + ')')) continue;
  const pts = S.cq.p, P = W.n.filter(o => o.p >= 0), kinds = {};
  for (const o of W.n) kinds[o.k] = (kinds[o.k] || 0) + 1;
  ok(P.length === pts.length && P.every(o => Math.hypot(o.x - pts[o.p].x, o.z - pts[o.p].z) < 1 && W.lab[o.q] === o.i), '  every point and base is a region of its own (' + P.length + '), the rest: ' + JSON.stringify(kinds));
  const seats = S.T.burgs ? S.T.burgs.filter(b => b.seat >= 0) : [];
  ok(seats.every(w => W.n.some(o => o.seat === w.seat && Math.hypot(o.x - w.x, o.z - w.z) < G2W.seed.near + 1)), '  each seat town is marked on its region (' + seats.length + ')');
  let unl = 0, wet = 0; for (let q = 0; q < W.lab.length; q++) { if (W.pass[q] && W.lab[q] < 0) unl++; if (!W.pass[q] && W.lab[q] >= 0) wet++; }
  ok(!unl && !wet, '  every passable cell is in a region, no water cell is (' + unl + ', ' + wet + ')');
  const N = W.N, far = W.n.filter(o => o.p >= 0).every(o => P.every(p => W.tt[o.i * N + p.i] < Infinity));
  ok(far && W.n.every(o => o.e.length > 0), '  every point reaches every other over the edges, no region is cut off');
  const roadE = W.e.filter(e => e.road > .8 && e.len > 500);
  ok(W.e.every(e => e.len > 0 && e.tf > 0 && e.tw > 0 && e.tk > 0) && roadE.length > 0 && roadE.every(e => e.tw < e.tf), '  every edge has its length and times; along a road wheels are quicker than feet (' + roadE.length + ' edges by road)');
  const t0 = performance.now(), R = $('g2Pairs')(W), ms = (performance.now() - t0) / Math.max(1, R.pairs);
  const lens = [], wetR = []; let long = 0;
  for (const pa of P) for (const pb of P) { if (pa === pb) continue; const rt = $('g2Now')(W, pa.i, pb.i); for (const r of rt) { if ([...r.cells].some(q => !W.pass[q])) wetR.push(pa.nm + '→' + pb.nm); if (r.len > G2W.rt.long * rt[0].len + 1) long++; } lens.push(rt.length); }
  ok(!wetR.length && !long, '  no route over water, none longer than ' + G2W.rt.long + ' times the quickest (' + wetR.length + ', ' + long + ')');
  const minPt = R.byPt.reduce((m, b) => Math.min(m, b.ok / b.n), 1), weak = R.byPt.filter(b => b.ok / b.n < .7).map(b => b.nm + ' ' + b.ok + '/' + b.n);
  ok(R.share >= .7, '  CRITERION: ' + R.ok + ' of ' + R.pairs + ' ordered pairs of points (' + pc(R.share) + ') have 2 routes or more with overlap ≤ 40 % and arrivals ≥ 45° apart (≥ 70 %)');
  ok(minPt >= .7, '  CRITERION: and each point, as an objective, in ' + pc(minPt) + ' of its pairs or more (≥ 70 %)' + (weak.length ? ': ' + weak.join(', ') : ''));
  rows.push([tag, W.N, W.e.length, R.pairs, R.ok, pc(R.share), pc(minPt), (med(lens) || 0), pc(med(R.laps)), Math.round(med(R.angs)) + '°', med(R.ratio).toFixed(2), W.ms.toFixed(0), ms.toFixed(1)]);
}
console.log('\n  | Mapa | Regiões | Arestas | Pares | Com 2 rotas diferentes | % | Pior ponto | Rotas por par (mediana) | Sobreposição (mediana) | Ângulo de chegada (mediana) | Mais longa / mais rápida | Terreno (ms) | Rotas por par (ms) |');
console.log('  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const r of rows) console.log('  | ' + r.join(' | ') + ' |');
console.log('');

console.log('-- 4. a bridge falls --');
{
  const { S, $ } = watch('modern', 6), W0 = S.T.g2w, br = $('brs()')[0]; $('cmdOf')(0);
  const q = W0.Z ? $('apCell')(W0.Z, br.x, br.z) : -1, was = W0.pass[q];
  $('hitObj')(br.o, 1e5, null); $('step')(1 / 60);
  const Z1 = $('tmStatic')(S.T); let k = 0, mid = null;
  while (S.T.g2w === W0 && k < 600) { $('g2Step')(1 / 60); k++; if (S.g2J && !mid) mid = S.T.g2w; }
  const W1 = S.T.g2w;
  ok(was === 1 && mid === W0 && W1 !== W0 && W1.Z === Z1 && k > 1, 'the ground is built again in ' + k + ' frames, the old one serving meanwhile');
  ok(W1.pass[q] === 0 && W1.lab[q] < 0, 'and the fallen bridge\'s cell is no way any more (' + was + ' → ' + W1.pass[q] + ')');
}

console.log('-- 5. honesty --');
{
  const { C, S, $ } = watch('modern', 6);
  const G = $('globalThis'); G.__hon = { on: 0, n: {}, calls: {} };
  $('S = new Proxy(S, { get(o, k, r) { const h = globalThis.__hon; if (h.on && (k === "men" || k === "units" || k === "bombs" || k === "planes")) h.n[k] = (h.n[k] || 0) + 1; return Reflect.get(o, k, r); } })');
  for (const f of ['g2Sense', 'g2Hyp', 'g2Answer', 'g2Now', 'g2Pairs', 'g2Job', 'g2Step'])
    $(f + ' = (g => function (...a) { const h = globalThis.__hon; h.on++; h.calls["' + f + '"] = (h.calls["' + f + '"] || 0) + 1; try { const r = g.apply(this, a); if (r && typeof r.next === "function") { const J = r; return { next(v) { h.on++; try { return J.next(v); } finally { h.on--; } }, [Symbol.iterator]() { return this; } }; } return r; } finally { h.on--; } })(' + f + ')');
  G.__hon.on = 1; $('S.men.length + S.units.length'); G.__hon.on = 0;
  ok((G.__hon.n.men || 0) + (G.__hon.n.units || 0) === 2, 'positive control: the Proxy counts a read of S.men and S.units made inside a counted call');
  G.__hon.n = {};
  let err = null; try {
    C.run(30);
    $('S.T.g2w = null'); $('g2Ground')($('S.T'), true);
    const c0 = $('cmdOf')(0), P = $('S.T.g2w').n.filter(o => o.p >= 0);
    $('g2Hyp')(c0, 4, 1); $('g2Answer')(0, { q: 'mundo', x: P[5].x, z: P[5].z }); $('g2Now')($('S.T.g2w'), P[1].i, P[8].i); $('g2Sense')($('cmdOf')(1));
  } catch (e) { err = e; }
  const n = G.__hon.n, calls = G.__hon.calls, reads = Object.values(n).reduce((x, y) => x + y, 0);
  ok(!err, '30 s of a match and a build, a look, guesses, routes and an answer' + (err ? ': ' + err.stack.split('\n').slice(0, 3).join(' | ') : ''));
  ok(calls.g2Step > 100 && calls.g2Sense >= 8 && calls.g2Job >= 1, 'the model ran: ' + JSON.stringify(calls));
  ok(reads === 0, 'and read none of the world\'s lists doing it: ' + JSON.stringify(n));
}
{
  const { C, S, $ } = watch('modern', 6), W = S.T.g2w, c0 = $('cmdOf')(0), sq = () => S.squads.filter(q => q.team === 0 && !q.net && q.live > 0 && !q.state);
  const P = W.n.filter(o => o.p >= 0), X = P.find(o => S.cq.p[o.p].base === 1), Y = W.n.filter(o => o.p < 0 && Math.hypot(o.x - X.x, o.z - X.z) > 3000).sort((a, b) => Math.hypot(a.x - X.x, a.z - X.z) - Math.hypot(b.x - X.x, b.z - X.z))[0];
  const side = S.E.sides[S.fac[1]], u = C.addUnit('tank', 1, X.x + 60, X.z + 60, side.tanks[0], false, 0, 0);
  u.seenT = -1e9; $('cmdSense')(c0, sq()); let B = $('g2Sense')(c0); const x0 = B.now[$('g2At')(W, u.x, u.z)], y0 = B.now[Y.i];
  ok(!c0.known.includes(u) && B.now[Y.i] === 0, 'an enemy tank the side has not seen: not known, nothing believed where it is (' + x0 + ') nor anywhere it is not');
  u.seenT = S.t; u.sx = Y.x; u.sz = Y.z; $('cmdSense')(c0, sq()); B = $('g2Sense')(c0);
  const x1 = B.now[$('g2At')(W, u.x, u.z)];
  ok(c0.known.includes(u) && B.now[Y.i] - y0 >= $('CMD').val.tank && x1 === x0, 'reported 3 km and more off where it is: it counts in the region of the report (' + y0 + ' → ' + B.now[Y.i] + '), not where it is (' + x0 + ' → ' + x1 + ')');
  u.seenT = -1e9; $('cmdSense')(c0, sq()); S.t += 30; B = $('g2Sense')(c0); const yA = B.f[Y.i];
  S.t += 400; B = $('g2Sense')(c0); const yB = B.f[Y.i];
  ok(yA > 0 && yB < yA * .3 && B.ft[Y.i] >= 0, 'gone from sight, the side remembers it there, fading with its age (' + yA.toFixed(1) + ' after 30 s, ' + yB.toFixed(2) + ' after 430 s)');
  const e = S.eco && S.eco.l.find(o => o.team === 1 && !o.dead);
  if (e) {
    const r = $('g2At')(W, e.x, e.z), kn = S.eco.d && S.eco.d[0] ? S.eco.d[0].kn : null;
    if (ok(!!kn, 'side 0 keeps a memory of the enemy sites it identified (ECO kn)')) {
      delete kn[e.id]; B = $('g2Sense')(c0); const v0 = B.ve[r];
      kn[e.id] = { k: e.k, x: e.x, z: e.z, T: S.t, dead: false, t: e.team }; B = $('g2Sense')(c0); const v1 = B.ve[r];
      ok(v1 > v0, 'an enemy ' + e.k + ' is worth taking once identified (' + v0.toFixed(1) + ' → ' + v1.toFixed(1) + '), not before');
      delete kn[e.id];
    }
  }
  const own = P.filter(o => S.cq.p[o.p].hold === 0 || S.cq.p[o.p].base === 0), foe = P.filter(o => S.cq.p[o.p].base === 1);
  ok(own.every(o => B.vo[o.i] > 0) && foe.every(o => B.ve[o.i] >= $('G2W').val.base * .8), 'its own points are worth keeping, the enemy base worth taking (' + own.length + ' points, base ' + foe.map(o => B.ve[o.i].toFixed(1)).join() + ')');
  const M = $('Math'), r0 = M.random; let draws = 0; M.random = () => { draws++; return r0(); };
  const h1 = $('g2Hyp')(c0, 3, 1), h2 = $('g2Hyp')(c0, 3, 1); M.random = r0;
  const sum = a => a.reduce((s, v) => s + v, 0);
  ok(draws === 0 && h1.length === 3 && h1.every((h, i) => h.every((v, j) => v === h2[i][j])) && h1.every(h => sum(h) >= B.tot) && h1.some((h, i) => i && h.some((v, j) => v !== h1[0][j])), 'three guesses of what it does not see: each holds what it knows and more, they differ, the same again when asked again, no Math.random (' + draws + ')');
  const watched = [...B.watch.keys()].filter(r => B.watch[r]);
  ok(watched.length > 0 && h1.every(h => watched.every(r => Math.abs(h[r] - B.f[r]) < 1e-6)), '  and none puts an unseen enemy where its own forces are (' + watched.length + ' regions watched)');
}

if (SECS > 0) {
  console.log('-- 6. the switch: the same match with the model on and off --');
  const run = (on, era) => {
    const C = H.load({ seed: 21, eco: 1, lg: 1, rec: 1, mapv: 6, ana: true }); C.$('G2W').on = on; C.$('AIB').now = () => 0;
    const S = C.watch(era, { len: 0, doc: ['balanced', 'aggressive'] }); let acc = null;
    C.run(SECS, () => {
      if (on && S.t > SECS - .02 && !acc) {   // how much of the enemy each side has placed, the truth read here by the test
        acc = S.cmd.map(c => { const B = c.g2, W = S.T.g2w; if (!B) return null; let tot = 0, put = 0; const V = C.$('CMD').val, tk = C.$('tk');
          for (const u of S.units) if (!u.dead && u.team !== c.t && !u.fixed && V[tk(u)]) { tot += V[tk(u)]; const r = C.$('g2At')(W, u.x, u.z); if (r >= 0 && B.f[r] > 0) put += V[tk(u)]; }
          for (const m of S.men) if (!m.dead && m.team !== c.t && !m.in) { tot += V.inf; const r = C.$('g2At')(W, m.x, m.z); if (r >= 0 && B.f[r] > 0) put += V.inf; }
          return { tot, put, bel: B.tot, n: B.n }; });
      }
    });
    const st = S.units.filter(u => !u.dead).map(u => [u.kind, Math.round(u.x), Math.round(u.z)].join()).sort().join(';') + '|' + S.men.filter(m => !m.dead).length + '|' + S.cq.tk.join() + '|' + S.cmd.map(c => c.ops.map(o => o.k).join()).join('/') + '|' + C.$('ANA').ev.length;
    return { S, st, acc, C };
  };
  for (const era of ['ww2', 'modern']) {
    const a = run(1, era), b = run(0, era);
    ok(a.st === b.st, era + ': the same match with the model on and off after ' + SECS + ' s (units, men, tickets, operations, events): nothing reads it yet');
    ok(a.S.cmd.every(c => c.g2 && c.g2.n >= Math.floor(SECS / 4) - 1) && b.S.cmd.every(c => !c.g2) && !b.S.T.g2w, '  each side looked every 4 s (' + a.S.cmd.map(c => c.g2 && c.g2.n).join(', ') + ' looks); off, none and no ground');
    if (a.acc) console.log('  ' + era + ': of the enemy on the field (CMD.val), each side had placed in its belief ' + a.acc.map(o => o ? pc(o.tot ? o.put / o.tot : 0) + ' (' + o.put + ' of ' + o.tot + '; believed ' + o.bel.toFixed(0) + ')' : '—').join(', ') + ' after ' + SECS + ' s');
  }
}

console.log('-- 7. gask mundo --');
{
  const { S, $ } = watch('ww2', 6), W = S.T.g2w, P = W.n.filter(o => o.p >= 0), tgt = P.find(o => S.cq.p[o.p].base === 1);
  const r0 = $('genQuery')(0, { q: 'mundo' });
  ok(r0 && r0.n.length === W.N && r0.e.length === W.e.length && r0.nm.length === W.N && r0.n.every(o => o.length === 9) && !r0.r, 'the regions (x, z, kind, own, enemy believed, age, keep, take, held by), their names and the edges, and no routes without x z');
  const r1 = $('genQuery')(0, { q: 'mundo', x: tgt.x + 100, z: tgt.z });
  ok(r1.r && r1.r.b === tgt.i && r1.r.w.length >= 2 && r1.r.w.every(w => w.pts.length >= 2 && w.len > 0 && w.min > 0) && r1.r.w.filter(w => w.div).length >= 2, 'with x z: the routes from its base to the enemy base nearest (' + r1.r.w.map(w => (w.len / 1000).toFixed(1) + ' km ' + w.min + ' min, ' + w.arr + '°' + (w.div ? '' : ' (not different)')).join('; ') + ')');
  const a1 = $('genAnswer')(0, { q: 'mundo', x: tgt.x, z: tgt.z, id: P[1].i }), a2 = $('genAnswer')(0, { q: 'mundo', x: -50, z: 0 });
  ok(a1.ok && a1.r.r.a === P[1].i && !a2.ok && a2.why === 'map', 'genAnswer: the same for the player and the model, from region id; off the map refused (' + a2.why + ')');
  $('G2W').on = 0; const a3 = $('genAnswer')(0, { q: 'mundo' }); $('G2W').on = 1;
  ok(!a3.ok && a3.why === 'off', 'G2W.on 0: refused (off)');
  const srv = fs.readFileSync(require('path').join(H.ROOT, 'server.js'), 'utf8'), mcp = fs.readFileSync(require('path').join(H.ROOT, 'mcp-general.js'), 'utf8');
  ok(/const GASK = \[[^\]]*'mundo'/.test(srv) && /const ASKS = \[[^\]]*'mundo'/.test(mcp), 'the server relays it and the MCP asks it (GASK, ASKS)');
}

console.log('-- 8. the cost --');
{
  const { S, $ } = watch('modern', 6), W = S.T.g2w, B = $('G2WB'), c0 = $('cmdOf')(0);
  for (let i = 0; i < 20; i++) $('g2Sense')(c0);
  const P = W.n.filter(o => o.p >= 0); for (let i = 1; i < P.length; i++) $('g2Now')(W, P[0].i, P[i].i);
  const s = B.stat();
  console.log('  the ground at the load ' + W.ms.toFixed(1) + ' ms (' + W.N + ' regions); the routes of a pair ' + s.route + ' ms (worst ' + s.routeWorst + '), a piece of ' + $('G2W').rt.pops + ' cells a frame; a look ' + s.sense + ' ms (worst ' + s.senseWorst + '), every ' + $('G2W').bel.every + ' s a side');
  ok(s.sense < 2 && s.route < 60, 'a look under 2 ms and a pair\'s routes under 60 ms on this machine (' + s.sense + ', ' + s.route + ')');
}
done();
