'use strict';
/* the general's danger on the roads (cmdEdges, map version 4 on; cf-lag-3): for each edge of the network, whether one of the side's units
   is within 300 m of one of its samples (C.es, the last time one was; 300 s without one adds the fog of war to C.et). It asked it as
   mine.some(o => smp.some(p => ...)), a closure a unit an edge, the dearest piece of the general's plan (a third of its time in the #170
   scene). Now plain loops behind the edge's box (cmdEdgeSeen). The answers must be the very same: this runs the page's cmdEdges and the old
   one, written out below, over random networks and sides with units on the 300 m line, a hair inside and outside it, on the diagonal, far
   off, dead, of another side, fixed, online, and at NaN and Infinity, and compares C.et and C.es number for number. No battle: a second */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done, rng } = H;
const src = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const a = src.indexOf('\nfunction cmdEdges(C, sq) {'), b0 = src.indexOf('\nfunction cmdEdgeSeen(', a), b = b0 < 0 ? -1 : src.indexOf('\n}\n', b0) + 2;
ok(a > 0 && b > a, 'cmdEdges and cmdEdgeSeen found');
const OLD = `function cmdEdges(C, sq) {
  const E = S.T.net.e, K = MANT.thr, G = CMD.cell, nx = C.nx, nz = C.nz, I = C.inf, Z = C.kz && C.kz.length === nx * nz ? C.kz : null, mine = [];
  const et = C.et && C.et.length === E.length ? C.et : (C.et = new Float32Array(E.length)), es = C.es && C.es.length === E.length ? C.es : (C.es = new Float32Array(E.length).fill(-1e9));
  for (const u of S.units) if (!u.dead && u.team === C.t && !u.fixed && !u.net) mine.push(u);
  for (const q of sq) { const L = q.men.find(m => !m.dead); if (L) mine.push(L); }
  E.forEach((e, i) => {
    let a = 0; const smp = e.smp;
    for (const p of smp) { const k = clamp((p.z + S.HW) / G | 0, 0, nz - 1) * nx + clamp(p.x / G | 0, 0, nx - 1); a += Math.max(0, -I[k]) * K.k + (Z ? Z[k] * K.kz : 0); }
    if (es[i] < S.t && mine.some(o => smp.some(p => Math.abs(o.x - p.x) < 300 && Math.abs(o.z - p.z) < 300 && Math.hypot(o.x - p.x, o.z - p.z) < 300))) es[i] = S.t;
    et[i] = a / smp.length + (S.t - es[i] > 300 ? K.fog : 0);
  });
}`;
const mk = code => { const ctx = vm.createContext({ Math, MANT: { thr: { k: .8, kz: .35, fog: .25 } }, CMD: { cell: 500 }, clamp: (v, l, h) => (v < l ? l : v > h ? h : v), S: null }); vm.runInContext(code + '\n;globalThis.cmdEdges = cmdEdges;', ctx); return ctx; };
const NEW = mk(src.slice(a + 1, b)), REF = mk(OLD);
const same = (x, y) => x.length === y.length && x.every((v, i) => (Number.isNaN(v) ? Number.isNaN(y[i]) : Object.is(v, y[i])));

console.log('-- the same C.et and C.es as the old closures, over random networks --');
{
  const R = rng(20261121), W = 20000, HW = 8000;
  let runs = 0, diff = 0, seen = 0, unseen = 0, edgesN = 0;
  for (let run = 0; run < 60; run++) {
    const nx = 40, nz = 32, E = [];
    for (let i = 0; i < 40 + (R() * 160 | 0); i++) {
      const n = R() < .05 ? 0 : 1 + (R() * 9 | 0), x = R() * W, z = (R() * 2 - 1) * HW, h = R() * 6.28, smp = [];
      for (let k = 0; k < n; k++) smp.push({ x: x + Math.cos(h) * 200 * k, z: z + Math.sin(h) * 200 * k });
      E.push({ smp });
    }
    const units = [], men = [], sq = [], pick = () => { const e = E[R() * E.length | 0]; return e.smp.length ? e.smp[R() * e.smp.length | 0] : { x: R() * W, z: 0 }; };
    const place = () => {   // on the 300 m line, a hair inside or out, the diagonal, near, far, or not a number at all
      const p = pick(), r = R(), d = [300, 299.99999999999994, 300.00000000000006, 299, 301][R() * 5 | 0], q = 300 / Math.SQRT2;
      if (r < .2) return { x: p.x + (R() < .5 ? d : -d), z: p.z };
      if (r < .35) return { x: p.x, z: p.z + (R() < .5 ? d : -d) };
      if (r < .5) return { x: p.x + q * (R() < .5 ? 1 : -1), z: p.z + q * (R() < .5 ? 1 : -1) };
      if (r < .7) return { x: p.x + (R() - .5) * 900, z: p.z + (R() - .5) * 900 };
      if (r < .95) return { x: R() * W, z: (R() * 2 - 1) * HW };
      return [{ x: NaN, z: p.z }, { x: p.x, z: NaN }, { x: Infinity, z: p.z }, { x: -Infinity, z: -Infinity }][R() * 4 | 0];
    };
    for (let i = 0; i < 70; i++) units.push(Object.assign(place(), { team: R() * 3 | 0, dead: R() < .1, fixed: R() < .05, net: R() < .03 }));
    for (let i = 0; i < 30; i++) { const q = { men: [] }; for (let k = 0; k < 1 + (R() * 4 | 0); k++) { const m = Object.assign(place(), { dead: R() < .3 }); q.men.push(m); men.push(m); } sq.push(q); }
    const inf = new Float32Array(nx * nz).map(() => (R() - .5) * 4), kz = R() < .5 ? new Float32Array(nx * nz).map(() => R()) : null;
    const t = 100 + R() * 900, es0 = new Float32Array(E.length).map(() => (R() < .3 ? -1e9 : R() < .5 ? t + 5 : t - R() * 600));
    const C = () => ({ t: R.state ? 0 : 0, nx, nz, inf, kz, et: R() < .1 ? null : new Float32Array(E.length), es: es0.slice() });
    for (const side of [0, 1, 2]) {
      const S = { T: { net: { e: E } }, units, HW, t }, c1 = Object.assign(C(), { t: side }), c2 = Object.assign({}, c1, { et: c1.et && c1.et.slice(), es: c1.es.slice() });
      NEW.S = S; REF.S = S; NEW.cmdEdges(c1, sq); REF.cmdEdges(c2, sq); runs++; edgesN += E.length;
      if (!same(c1.et, c2.et) || !same(c1.es, c2.es)) diff++;
      for (let i = 0; i < E.length; i++) if (c2.es[i] === Math.fround(t)) seen++; else unseen++;
    }
  }
  ok(!diff, runs + ' sides over ' + edgesN + ' edges: C.et and C.es number for number the same (' + diff + ' differ)');
  ok(seen > 200 && unseen > 200, 'both answers well represented: ' + seen + ' edges seen now, ' + unseen + ' not');
}

console.log('-- the 300 m line itself --');
{
  const E = [{ smp: [{ x: 1000, z: 0 }, { x: 1200, z: 0 }] }], C = d => ({ t: 0, nx: 4, nz: 4, inf: new Float32Array(16), kz: null, et: null, es: null });
  const at = (x, z) => { const S = { T: { net: { e: E } }, units: [{ x, z, team: 0 }], HW: 1000, t: 50 }; NEW.S = S; const c = C(); NEW.cmdEdges(c, []); return c.es[0] === 50; };
  ok(at(1499, 0) && !at(1500, 0) && at(700.0000001, 0) && !at(700, 0), 'along x: 299 m in, 300 m out, on both sides of the edge');
  ok(at(1000, 299.9) && !at(1000, 300) && !at(1000, -300), 'across: 300 m out');
  ok(!at(1000 - 300 / Math.SQRT2 - 1e-9, 300 / Math.SQRT2 + 1e-9) && at(1000 - 212, 212), 'the diagonal: by the true distance, not the box');
}

console.log('-- no closure a unit any more --');
{
  const body = src.slice(a, b);
  ok(!/mine\.some\(o => smp\.some\(p => Math/.test(body), 'cmdEdges no longer asks mine.some(o => smp.some(...))');
}
done();
