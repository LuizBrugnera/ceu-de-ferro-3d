'use strict';
/* the general's manoeuvre in the analytics (M0: events mv, ap, ab, tr, the review's mano and tools/balance.js): the battle is the same with the
   collection on, one AI × AI match on the map of today leaves an event for every assault, manoeuvre, ambush and road block the general opened
   and every ambush that fired, the traffic every minute, and nothing else changes; the arrival bins, the road an edge is, an ambush's end, the
   review's numbers from known events, the side's view, and the tool's pooled numbers with a reference column.
   MIN: the clock of the AI × AI match in minutes (default 3; about three minutes in all) */
const H = require('./harness'), ok = H.ok, MIN = +process.env.MIN || 3;
const B = require('../tools/balance.js');
const print = (C, S) => {
  let sum = 0; for (const k of ['men', 'units', 'planes']) for (const o of S[k]) sum += o.x * 1.3 + o.z + (o.hp || 0);
  return [S.men.length, S.units.length, S.squads.length, sum.toFixed(6), S.cq.tk.map(v => v.toFixed(4)).join(','), C.$('Math').random().toFixed(12)].join(' ');
};
const MV = ['mv', 'ap', 'ab', 'tr'];

console.log('-- one AI × AI match of ' + MIN + ' min on map 6, with and without the analytics --');
/* the general's own calls, counted over the analytics' hooks (they wrap the wrapped functions, so they see every call the general makes);
   the frame meter reads the wall clock: off in both runs, so they are the same battle */
function playCounted() {
  const C = H.load({ seed: 5, mapv: 6, ana: true }), $ = C.$;
  $('AIB').now = () => 0;
  const ctr = $('globalThis.__ctr = { atk: 0, man: {}, amb: 0, spring: 0, ms: 0, n: 0 }');
  $('atkOpen = (g => function () { const op = g.apply(this, arguments); if (op) __ctr.atk++; return op; })(atkOpen)');
  $('manOpen = (g => function (C, k) { const op = g.apply(this, arguments); __ctr.man[k] = (__ctr.man[k] || 0) + 1; return op; })(manOpen)');
  $('ambOpen = (g => function () { const op = g.apply(this, arguments); __ctr.amb++; return op; })(ambOpen)');
  $('cmdSpring = (g => function () { __ctr.spring++; return g.apply(this, arguments); })(cmdSpring)');
  $('anaMvLook = (g => function () { const a = Date.now(); g(); __ctr.ms += Date.now() - a; __ctr.n++; })(anaMvLook)');
  const S = C.watch('ww2', { doc: ['aggressive', 'cautious'], min: MIN });
  C.run(S.cq.T0 + 120, () => !S.over);
  return { C, S, p: print(C, S), ctr };
}
const A = playCounted(), Z = (() => { const C = H.load({ seed: 5, mapv: 6, ana: false }); C.$('AIB').now = () => 0; const S = C.watch('ww2', { doc: ['aggressive', 'cautious'], min: MIN }); C.run(S.cq.T0 + 120, () => !S.over); return { C, S, p: print(C, S) }; })();
const ev = A.C.$('ANA').ev, kinds = {}; for (const e of ev) kinds[e.k] = (kinds[e.k] || 0) + 1;
console.log('   ' + JSON.stringify(kinds) + ' calls ' + JSON.stringify(A.ctr));
ok(A.S.over && Z.S.over && A.p === Z.p && !Z.C.$('ANA').ev.length, 'the match with the manoeuvre events and without the analytics ends the same, to the last digit and the random stream');
ok(MV.every(k => kinds[k] > 0), 'the match leaves mv, ap, ab and tr: ' + MV.map(k => k + ' ' + kinds[k]).join(', '));
const ap = ev.filter(e => e.k === 'ap'), mvO = ev.filter(e => e.k === 'mv' && !e.end && !e.no), mvE = ev.filter(e => e.k === 'mv' && e.end), ab = ev.filter(e => e.k === 'ab');
const manK = {}; for (const e of mvO) manK[e.m] = (manK[e.m] || 0) + 1;
ok(ap.length === A.ctr.atk && ap.every(e => typeof e.L === 'string' && (e.walk === 0 || e.walk === 1) && Array.isArray(e.a) && e.a.length === 6 && e.a.every(Number.isInteger) && Number.isInteger(e.off) && e.off <= e.a.reduce((x, y) => x + y, 0) && ['form', 'prep', 'screen', 'go', 'fight', 'cons'].includes(e.st)),
  'one ap for each assault or occupation the general opened (' + ap.length + '), with its arrival bins and how far it got');
ok(JSON.stringify(manK) === JSON.stringify(Object.fromEntries(Object.keys(A.ctr.man).map(k => [k, A.ctr.man[k]]))) && mvE.length === mvO.length && mvE.every(e => mvO.some(o => o.s === e.s && o.id === e.id && o.m === e.m)),
  'one mv for each manoeuvre opened (' + JSON.stringify(manK) + ') and one for its end, the match end closing what was open');
const arm = ab.filter(e => e.e === 'arm'), fire = ab.filter(e => e.e === 'fire'), end = ab.filter(e => e.e === 'end');
ok(arm.length === A.ctr.amb + (A.ctr.man.blk || 0) && fire.length === A.ctr.spring && end.length === arm.length && fire.every(e => arm.some(a => a.s === e.s && a.id === e.id && a.f === e.f) && Number.isInteger(e.nv)),
  'ab: armed ' + arm.length + ' (ambushes ' + A.ctr.amb + ', road blocks ' + (A.ctr.man.blk || 0) + '), fired ' + fire.length + ' as cmdSpring was called, each ended once');
const tr = ev.filter(e => e.k === 'tr'), hdr = ev[0], E = A.S.T.net.e;
ok(Array.isArray(hdr.net) && hdr.net.length === E.length && hdr.net.every((n, i) => n[0] === E[i].c && n[1] === (E[i].ax || E[i].a2 ? 1 : 0)) && hdr.net.filter(n => n[1]).length >= 12,
  'the header lists the ' + hdr.net.length + ' edges of the road network, ' + hdr.net.filter(n => n[1]).length + ' of them on an axis');
ok(tr.length >= MIN && tr.slice(0, -1).every(e => e.d === 60) && tr.every(e => e.e.length === 2 && e.e.every(a => a.length === E.length) && e.v.every(v => v.length === 4)) && tr.reduce((a, e) => a + e.v[0][0] + e.v[1][0], 0) > 0,
  tr.length + ' tr, one a minute and the rest at the end: samples by edge, off the roads and of the vehicles');
const kb = require('zlib').gzipSync(ev.filter(e => MV.includes(e.k)).map(e => JSON.stringify(e)).join('\n')).length, end0 = ev.find(e => e.k === 'end');
ok(kb / (end0.t / 60) * 45 < 100 * 1024, 'size: ' + (kb / 1024).toFixed(1) + ' KB compressed for these events in ' + (end0.t / 60).toFixed(1) + ' min, under 100 KB for 45 min');
ok(A.ctr.n > 0 && A.ctr.ms / A.ctr.n < 5, 'a look every ' + A.C.$('MVA').dt + ' s costs ' + (A.ctr.ms / A.ctr.n).toFixed(2) + ' ms on this machine (' + A.ctr.n + ' looks)');
const R = A.C.anaReport(ev);
ok(Array.isArray(R.mano) && R.mano.every(m => m && m.atk + m.occ === ap.filter(e => e.s === R.mano.indexOf(m)).length && m.tr && m.veh.rail !== null), 'the review has the manoeuvre of both sides: ' + R.mano.map(m => m.atk + ' assaults, ' + m.occ + ' occupations, rail ' + m.veh.rail).join('; '));

console.log('-- the pieces --');
{ const C = H.load({ seed: 1, mapv: 6, ana: true }), $ = C.$, S = C.watch('modern', {}), arc = $('anaArc');
  const at = d => { const r = d * Math.PI / 180; return arc(1, 0, Math.cos(r) * 500, Math.sin(r) * 500); };
  ok(at(0) === 0 && at(34) === 0 && at(-34) === 0 && at(50) === 1 && at(-50) === 2 && at(90) === 3 && at(-90) === 4 && at(119) === 3 && at(150) === 5 && at(180) === 5,
    'arrival bins by the angle to the axis: under 35° front, then oblique, flank (each side) and rear from 120°');
  const N = S.T.net, e = N.e[5], p = e.p[e.p.length >> 1], q = e.p[(e.p.length >> 1) + 1] || e.p[0], dx = q.x - p.x, dz = q.z - p.z, l = Math.hypot(dx, dz) || 1, ed = $('anaEdge');
  ok(ed(p.x, p.z) === e.i && ed(p.x - dz / l * 40, p.z + dx / l * 40) === e.i && ed(p.x - dz / l * 400, p.z + dx / l * 400) !== e.i, 'the edge under a point and 40 m beside it, not 400 m away');
  /* an ambush's end: the vehicles the enemy lost in its zone since it fired, the men its squads lost */
  C.run(2);
  const q1 = { live: 8 }, q2 = { live: 6 }, op = { k: 'amb', id: 77, team: 0, site: { x: 1000, z: 200, ri: 0 }, sq: [q1, q2] }, R = $('anaMvOpen')(S.cmd[0], op), ANA = $('ANA');
  R.fire = S.t; for (const q of op.sq) R.men.set(q, q.live);   // as the fire hook takes them
  ANA.ev.push({ k: 'ls', t: S.t, s: 1, u: 'tank', x: 1100, z: 250 }, { k: 'ls', t: S.t, s: 1, u: 'truck', x: 1600, z: 200 }, { k: 'ls', t: S.t, s: 1, u: 'inf', x: 1000, z: 210 }, { k: 'ls', t: S.t, s: 0, u: 'car', x: 1000, z: 200 });
  q1.live = 5; q2.live = 0; $('anaMvEnd')(R);
  const x = ANA.ev.filter(e => e.k === 'ab' && e.id === 77);
  ok(x.length === 2 && x[0].e === 'arm' && x[1].e === 'end' && x[1].kv === 1 && x[1].lm === 9 && x[1].sq === 8 && x[1].ok === 0, 'an ambush that took one enemy vehicle in its zone and lost 9 men of a squad of 8 is no good one: ' + JSON.stringify(x[1]));
  q1.live = 8; q2.live = 6; const R2 = $('anaMvOpen')(S.cmd[0], Object.assign({}, op, { id: 78 })); R2.fire = S.t; for (const q of op.sq) R2.men.set(q, q.live); q1.live = 6; $('anaMvEnd')(R2);
  ok(ANA.ev.filter(e => e.k === 'ab' && e.id === 78).pop().ok === 1, 'one that lost 2 men is'); }

console.log('-- the review from known events --');
{ const C = H.load({ ana: true }), net = [[0, 1, 1000, 'A', 'B'], [1, 0, 800, 'B', 'C'], [2, 0, 500, 'C', 'D']];
  const ev = [{ k: 'hdr', t: 0, tk: [100, 100], net },
    { k: 'ap', t: 100, s: 0, id: 1, L: 'E', nm: 'E', ri: 0, walk: 0, a2: 0, st: 'cons', bk: 0, ok: 1, a: [6, 0, 0, 3, 0, 1], off: 4, mv: ['flk'] },
    { k: 'ap', t: 300, s: 0, id: 2, L: 'E', nm: 'E', ri: 0, walk: 0, a2: 0, st: 'go', bk: 1, ok: 0, a: [5, 0, 0, 0, 0, 0], off: 0, mv: [] },
    { k: 'ap', t: 400, s: 0, id: 3, L: 'E', nm: 'E', ri: 0, walk: 1, a2: 0, st: 'form', bk: 0, ok: 1, a: [0, 0, 0, 4, 0, 0], off: 0, mv: [] },
    { k: 'ap', t: 120, s: 1, id: 1, L: 'G', nm: 'G', ri: 1, walk: 1, a2: 0, st: 'form', bk: 0, ok: 0, a: [0, 0, 0, 0, 0, 0], off: 0, mv: [] },
    { k: 'mv', t: 50, s: 0, id: 4, m: 'flk', by: 'ai', h: 1 }, { k: 'mv', t: 150, s: 0, id: 4, m: 'flk', end: 1, dur: 100, ok: 1 }, { k: 'mv', t: 60, s: 0, m: 'flk', no: 'node' }, { k: 'mv', t: 70, s: 0, m: 'flk', no: 'node' },
    { k: 'ab', t: 10, s: 0, id: 5, f: 'amb', e: 'arm' }, { k: 'ab', t: 20, s: 0, id: 5, f: 'amb', e: 'fire', nv: 2 }, { k: 'ab', t: 60, s: 0, id: 5, f: 'amb', e: 'end', kv: 1, lm: 2, sq: 8, ok: 1 },
    { k: 'ab', t: 30, s: 0, id: 6, f: 'blk', e: 'arm' }, { k: 'ab', t: 90, s: 0, id: 6, f: 'blk', e: 'end', kv: 0, lm: 0, sq: 8, ok: 0 },
    { k: 'tr', t: 60, d: 60, e: [[20, 5, 5], [30, 0, 0]], o: [10, 0], v: [[16, 2, 2, 5], [10, 0, 0, 0]] },
    { k: 'lg', t: 5, s: 0, c: 'rf', x: 'Sem força para atacar E · Travessia: pede 3 esquadras' }, { k: 'lg', t: 6, s: 0, c: 'rf', x: 'Reforço pedido' }];
  const M = C.anaReport(ev).mano, m = M[0];
  ok(m.atk === 2 && m.occ === 1 && m.go === 2 && m.took === 1 && m.back === 1 && m.occTook === 1 && m.smp === 19 && m.flank === .421 && m.flankAtk === .267 && m.off === .211 && m.arr.front === .579,
    'side 0: 2 assaults (1 took its point, 1 fell back) and 1 occupation; 8 of 19 arrival samples 70° or more off the axis, 4 of 15 in the assaults');
  ok(m.withMv === .5 && m.mv.flk === 1 && m.flkNo.node === 2 && m.amb.arm === 2 && m.amb.fire === 1 && m.amb.ok === 1 && m.amb.okShare === 1 && m.amb.byF.blk === 1, 'one assault of two with a flank; a flank opened, two refused (node); 2 ambushes armed, 1 fired and good');
  ok(m.tr.axis === .667 && m.tr.offAxis === .333 && m.tr.offRoad === .25 && m.tr.top[0].e === 'A–B' && m.veh.rail === .8 && m.veh.trip === .1 && m.veh.parked === .2 && m.want === 1,
    'traffic: a third off the axes, a quarter off the roads; vehicles moving 80% on the rail; one "sem força"');
  ok(m.ent === .918 && m.rep === 1 && m.again === 2 && m.repShare === .5, 'arrivals: E from the front twice and from the flank once, 0.918 bits; the second came the same way as the first');
  ok(M[1].atk === 0 && M[1].occ === 1 && M[1].smp === 0 && M[1].flank === null && M[1].tr.offAxis === 0 && M[1].veh.rail === 1, 'side 1: an occupation with no sample, and its traffic all on the axis');
  const mid = C.anaReport(ev, 0);
  ok(mid.mano[0] && mid.mano[1] === null && C.anaReport(ev.concat([{ k: 'end', t: 500, win: 0, why: 0, tk: [90, 80], lost: [[], []], T: 0 }]), 0).mano[1], 'mid-match a side sees its own manoeuvre only; both once it is over');
  ok(C.anaReport(ev.filter(e => !MV.includes(e.k))).mano === null, 'a match from before the manoeuvre events has none');

  console.log('-- tools/balance.js --');
  const rep = e => C.anaReport(e), X = B.mano([rep(ev), rep(ev)]), Y = B.mano([rep(ev.filter(e => e.k !== 'ap' || e.id !== 1))]);
  ok(X.n === 2 && X.atk === 2 && X.occ === 2 && Math.abs(X.flank - 8 / 19) < 1e-9 && Math.abs(X.withMv - .5) < 1e-9 && X.amb.arm === 2 && X.amb.ok === 1 && Math.abs(X.offAxis - 20 / 120) < 1e-9 && X.want === 1 && X.mv.flk === 2 && X.flkEval === 6,
    'two matches pooled: counts per match, shares from the raw counts of every side');
  const out = B.print(Object.assign(B.aggregate([Object.assign(rep(ev), { over: false, eff: [] })]), {}), 't', { mano: Y });
  ok(/## Manobra do general/.test(out) && /\| Taxa de flanco[^\n]*\| 42% \(27%\) \| ≥ 35% \| 44% \(0%\) \|/.test(out) && /Referência/.test(out), 'the printout has the manoeuvre section with the targets and the reference\'s column');
  ok(!/Manobra do general/.test(B.print(B.aggregate([Object.assign(rep(ev.filter(e => !MV.includes(e.k))), { over: false, eff: [] })]), 't')), 'and none without the events');
  const P = B.plan({ n: 2, eco: true, lg: true, rec: true, nobudget: true, mapv: 6 });
  ok(P.every(m => m.lg && m.rec && m.nobudget && m.mapv === 6), 'the tournament takes --lg, --rec and --nobudget to each match'); }
H.done();
