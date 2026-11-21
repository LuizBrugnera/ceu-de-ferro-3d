'use strict';
/* The general's one-time studies of a terrain at the load, and the forward base's pick without the heights it does not need (cf-lag-2):
   the same studies and the same picks as before, sooner or cheaper. planWarm builds the cross-country cells (fpCells), the ambush sites
   of the main roads and of the network (cmdSites, blkSites) when a match is made, not inside its first plans; enpFobPick skips a cell's
   five heights when not even the best crest would beat the best cell. The reference pick is the old code, copied here */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 7, eco: 1, mapv: 11 }), $ = C.$;
const S = C.watch('modern', { n: 3 }), T = S.T;

console.log('-- the studies are made at the load, the same as made later in the battle --');
{
  ok(!!T.fpc && !!T.amb && !!T.nsite, 'right after the match is made: the foot paths\' cells (' + (T.fpc && T.fpc.nx) + ' x ' + (T.fpc && T.fpc.nz) + '), ' + (T.amb && T.amb.length) + ' ambush sites on the main roads, ' + (T.nsite && T.nsite.length) + ' on the network');
  const was = { fpc: T.fpc, amb: T.amb, nsite: T.nsite };
  C.run(4, null, 1 / 30);
  ok(T.fpc === was.fpc && T.amb === was.amb && T.nsite === was.nsite, 'the plans of the first seconds read them and build nothing again');
  delete T.fpc; delete T.amb; delete T.nsite;
  const f = $('fpCells')(T), a = $('cmdSites')(), b = $('blkSites')();
  const same = (u, v) => JSON.stringify(u, (k, x) => (ArrayBuffer.isView(x) ? Array.from(x) : x)) === JSON.stringify(v, (k, x) => (ArrayBuffer.isView(x) ? Array.from(x) : x));
  ok(same(f, was.fpc) && same(a, was.amb) && same(b, was.nsite), 'built again 4 s into the battle, as the first plans built them before: the same cells and the same sites');
  T.fpc = was.fpc; T.amb = was.amb; T.nsite = was.nsite;
  const G = { T: { mv: 11, net: {} }, net: true, host: false }; let built = 0;
  $('globalThis').__n = () => built++; $('fpCells = (g => function (t) { __n(); return g(t); })(fpCells)');
  $('planWarm')(G);
  ok(built === 0, 'a guest (who does not plan) builds none of them');
}

console.log('-- the forward base: the same pick as the old code, with fewer heights read --');
{
  $('globalThis.oldFobPick = ' + "function oldFobPick(t, C, A) {\n  const M = C.tm, F = ENP.fob; if (!M || !M.k || !M.l) return null;\n  const mine = S.sup.filter(b => b.team === t && !b.dead).map(b => ({ x: b.x, z: b.z, r: F.apart })).concat(S.cq ? S.cq.p.filter(p => p.hold === t).map(p => ({ x: p.x, z: p.z, r: F.pt })) : [],\n    A.fobs.map(f => ({ x: f.x, z: f.z, r: F.apart })), S.base[t] ? [{ x: S.base[t].x, z: S.base[t].z, r: F.apart }] : [],\n    (A.fobNo || []).filter(f => S.t - f.T < ENP.redo).map(f => ({ x: f.x, z: f.z, r: F.bad })));   // held points only pt m (the point is the place to firm up), a site given up a while\n\n  let best = null, bs = 0;\n  for (let q = 0; q < M.k.length; q++) {\n    const x = (q % M.nx + .5) * M.c, z = -S.HW + (((q / M.nx) | 0) + .5) * M.c;\n    if (!gMapOk(x, z) || M.l[q] < -.25 || (M.f && M.f[q] > 3)) continue;\n    const h = hgt(x, z), crest = h - (hgt(x + 150, z) + hgt(x - 150, z) + hgt(x, z + 150) + hgt(x, z - 150)) / 4;\n    const sc = (M.k[q] >= F.choke ? 1 + M.k[q] : 0) + (crest > F.crest ? .8 + Math.min(1, crest / 30) : 0); if (sc <= 0) continue;\n    const v0 = sc - F.v * (M.v ? M.v[q] : 0) - .3 * Math.max(0, M.l[q] - .5); if (v0 <= bs) continue;   // the known enemy only takes from it: it cannot beat the best, so the dear tests below are not made (cf-lag: 2-4 s a call before)\n    const dep = ecoDepth(t, x, z); if (dep < F.dep[0] || dep > F.dep[1]) continue;\n    const r = railOf(x, z); if (r.d > F.road) continue;\n    if (mine.some(o => Math.hypot(o.x - x, o.z - z) < o.r)) continue;\n    const v = v0 - Math.min(2, cmdKnown(C, x, z, 600) / 3);\n    if (v > bs) { bs = v; best = { x, z, why: (M.k[q] >= F.choke ? 'gargalo' : 'crista') + (crest > F.crest && M.k[q] >= F.choke ? ' numa crista' : ''), sc: v }; }\n  }\n  if (!best) return null;\n  const r = railOf(best.x, best.z), rr = S.T.routes[r.ri], o = routeAt(rr, r.s), dx = best.x - o.x, dz = best.z - o.z, d = Math.hypot(dx, dz);   // by the road: within 60 m of it, toward where it was\n  if (d > 60) { best.x = o.x + dx / d * 60; best.z = o.z + dz / d * 60; }\n  const c = clearOf(best.x, best.z, 3, {}); best.x = Math.round(c.x); best.z = Math.round(c.z);\n  return best;\n}".replace(/^function oldFobPick/, 'function'));
  C.run(6, null, 1 / 30);
  let n = 0, bad = null, cells = 0;
  const rnd = H.rng(5), pick = $('enpFobPick'), old = $('oldFobPick'), hgt = $('hgt');
  let reads = 0; $('globalThis').__h = () => reads++;
  const count = f => { reads = 0; $('hgt = (g => function (x, z) { __h(); return g(x, z); })(hgt)'); const r = f(); $('hgt = globalThis.__hg'); return [r, reads]; };
  $('globalThis').__hg = hgt;
  let rOld = 0, rNew = 0;
  for (let t = 0; t < 3; t++) {
    const Cm = $('cmdOf')(t), A = $('enpOf')(Cm), M = Cm.tm; if (!M || !M.k) continue;
    const keep = { k: M.k.slice(), l: M.l.slice(), v: M.v && M.v.slice(), fobs: A.fobs.slice() };
    for (let trial = 0; trial < 12 && !bad; trial++) {
      if (trial) {   // another map of the front: choke points, the line and the enemy's view moved about, forward bases elsewhere
        for (let q = 0; q < M.k.length; q++) { if (rnd() < .03) M.k[q] = rnd(); M.l[q] = Math.max(-1, Math.min(1, keep.l[q] + (rnd() - .5) * trial / 6)); if (M.v) M.v[q] = rnd() < .5 ? keep.v[q] : rnd(); }
        A.fobs = trial % 3 ? [] : [{ x: S.W * rnd(), z: S.HW * (2 * rnd() - 1), T: 0 }];
      }
      const [a, ra] = count(() => old(t, Cm, A)), [b, rb] = count(() => pick(t, Cm, A)); n++; rOld += ra; rNew += rb; cells += M.k.length;
      if (JSON.stringify(a) !== JSON.stringify(b)) bad = [t, trial, JSON.stringify(a), JSON.stringify(b)];
    }
    for (let q = 0; q < M.k.length; q++) { M.k[q] = keep.k[q]; M.l[q] = keep.l[q]; if (M.v) M.v[q] = keep.v[q]; } A.fobs = keep.fobs;
  }
  ok(n >= 24 && !bad, 'the same pick (place, reason, score) in ' + n + ' maps of the front of the three sides' + (bad ? ': ' + bad.join(' | ') : ''));
  ok(rNew < rOld, 'reading ' + rNew + ' heights instead of ' + rOld + ' (' + cells + ' cells)');
}
H.done();
