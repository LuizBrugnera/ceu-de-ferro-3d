'use strict';
/* The general's view: the commander's log and view model do not change the battle (same state and same random stream with and without
   them, and as before the feature), what the log holds, the view model's shape and its fog, a watch match (no player), and that the
   section draws no random numbers. SECS: how long the solo battle runs (default 60). BEFORE: the page as it was before the view
   (default .work/general/before.html; the comparison is skipped when the file is missing) */
const fs = require('fs'), path = require('path');
const H = require('./harness'), ok = H.ok, SECS = +process.env.SECS || 60;
const BEFORE = process.env.BEFORE ? path.resolve(process.env.BEFORE) : path.join(H.ROOT, '.work', 'general', 'before.html');
const GLYPH = ['inf', 'mort', 'rec', 'eng', 'arm', 'mech', 'aa', 'art', 'trk', 'car', 'rad', 'jet', 'cas', 'heli'], KINDS = ['atk', 'def', 'amb', 'fire', 'rq', 'rf', 'eng', 'rep'];
/* what the match came to, to the last digit, and where the random stream stands */
const print = (C, S) => {
  let sum = 0; for (const k of ['men', 'units', 'planes']) for (const o of S[k]) sum += o.x * 1.3 + o.z + (o.hp || 0);
  return [S.men.length, S.units.length, S.squads.length, sum.toFixed(6), S.cq.ps.map(v => v.toFixed(4)).join(','), C.$('Math').random().toFixed(12)].join(' ');
};
/* view: ask the view model for both sides and sample the points each simulated second, as the page does */
function battle(o) {
  const C = H.load({ seed: 41, page: o.page });
  if (o.noLog) C.$('GEN').log = 0;
  const S = C.newState('ww2', C.$('ERAS').ww2.sides[0].fighter, { cls: 'plane' });
  let V0 = null, V1 = null, n = 0;
  C.run(SECS, () => { if (o.view && ++n % 60 === 0) { V0 = C.genVM(0, false); V1 = C.genVM(1, true); C.genSample(); } });
  return { C, S, V0, V1, print: print(C, S) };
}

console.log('-- the battle is not changed (seed 41, ' + SECS + ' s) --');
const A = battle({ view: true }), B = battle({ noLog: true });
console.log('   ' + A.print);
ok(A.print === B.print, 'the log and the view model do not change the battle or the random stream');
if (fs.existsSync(BEFORE)) { const Cb = battle({ page: BEFORE, noLog: false }); ok(B.print === Cb.print, 'the battle is the same as before the general\'s view'); }
else console.log('  skip  no ' + BEFORE + ': the comparison with the page before the view');

const { C, S, V0, V1 } = A, $ = C.$, CMD = $('CMD');
console.log('-- the commander\'s log --');
for (const t of [0, 1]) {
  const L = S.glog ? S.glog.l[t] : [];
  ok(L.length >= 2, 'side ' + t + ' wrote ' + L.length + ' entries');
  ok(L.every(e => Number.isFinite(e.t) && e.side === t && KINDS.includes(e.k) && typeof e.s === 'string' && e.s && (e.x === undefined || (Number.isFinite(e.x) && Number.isFinite(e.z)))), 'side ' + t + ': every entry has a time, its side, a known kind, a text and a finite place when it has one');
  ok(L.some(e => e.k === 'amb'), 'side ' + t + ' armed an ambush at the start');
}
if (S.glog) { console.log('   the last of side 0:'); for (const e of S.glog.l[0].slice(-5)) console.log('   ' + Math.round(e.t) + ' s [' + e.k + '] ' + e.s); }

console.log('-- the view model --');
ok(V0.pts.length === S.cq.p.length, 'one point of the view for each point of the match (' + V0.pts.length + ')');
ok(V0.u.length > 0 && V1.u.length >= V0.u.length, 'units shown: ' + V0.u.length + ' as side 0 knows them, ' + V1.u.length + ' of everything');
ok(V1.u.every(o => Number.isFinite(o.x) && Number.isFinite(o.z) && GLYPH.includes(o.g)), 'every unit has a place and a glyph of the set');
const V0b = C.genVM(0, false);
ok(V0b.u.filter(o => o.t === 1 && o.g !== 'jet' && o.g !== 'cas' && o.g !== 'heli').every(o => o.age >= 0 && o.age < CMD.mem), 'fog: the enemy on the ground is shown only as reported, no older than ' + CMD.mem + ' s');
ok(V0b.u.filter(o => o.t === 0).length >= V1.u.filter(o => o.t === 0).length - 1, 'side 0 sees all of its own');
ok(V0.road && V0.road.length === S.T.routes.length, 'a line for each road (' + (V0.road ? V0.road.length : 0) + ')');
ok(typeof V0.post.k === 'string' && V0.post.k && typeof V0.post.s === 'string', 'posture: ' + V0.post.k + ' - ' + V0.post.s);
ok(JSON.stringify(V0.eco) === '{"sites":[],"rows":[]}', 'the economy\'s slot is there and empty');
ok(Array.isArray(V0.ev) && Array.isArray(V0.ops) && Array.isArray(V0.log), 'the evaluation, the operations and the log are lists');
ok(V0.held && V0.held.length === 2 && V0.tk === undefined && V0.trend.length > 0, 'points held ' + (V0.held || []) + ', sampled ' + V0.trend.length + ' times');

console.log('-- no random numbers in the view --');
{ const src = H.source(), a = src.indexOf('/* ---------- the general\'s view (GEN)'), b = src.length;   // the harness cuts the source at the 3D scene's marker
  ok(a >= 0, 'the section is in the simulation part of the page');
  ok(a >= 0 && !/Math\.random|\brand\(|\bpick\(|\bqr\(/.test(src.slice(a, b)), 'it never asks for a random number'); }

console.log('-- a watch match --');
{ const Cw = H.load({ seed: 9 }), Sw = Cw.newState('ww2', null, { watch: 1, len: 0 });
  ok(Sw.demo && Sw.watch && !!Sw.cq && !Sw.my, 'no player, a demo with the points of a conquest');
  Cw.run(20);
  ok(Sw.planes.length > 0 && !H.nan(Sw), 'twenty seconds on: ' + Sw.planes.length + ' aircraft, ' + Sw.units.length + ' vehicles, no bad numbers');
  const V = Sw.cq ? Cw.genVM(0, false) : null; ok(!!V && V.pts.length === Sw.cq.p.length, 'the view of a watch match has its points' + (V ? ' (' + V.pts.length + ')' : ''));
  const Cd = H.load({ seed: 9 }), Sd = Cd.newState('ww2', null);
  ok(!Sd.cq && !Sd.watch, 'the demo behind the hangar is as it was: no points, not a watch match'); }
H.done();
