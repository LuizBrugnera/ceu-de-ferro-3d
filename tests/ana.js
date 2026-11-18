'use strict';
/* analytics and the after-action review (ANA, anaReport) and tools/balance.js: the battle and the random stream are the same with the
   collection on, what one AI × AI match leaves (every kind of event, the losses and the end as the match counts them, a snapshot every
   ANA.snap s, the size), where the tickets went (the bleed as cqStep charges it, a point taken), the review a side may see while the match
   runs, the pieces the sink is handed, and the tool's numbers (the 60% alert, files of gzip members).
   MIN: the clock of the AI × AI match in minutes (default 2). About a minute and a half */
const fs = require('fs'), path = require('path'), zlib = require('zlib'), os = require('os');
const H = require('./harness'), ok = H.ok, MIN = +process.env.MIN || 2;
const B = require('../tools/balance.js');
const print = (C, S) => {
  let sum = 0; for (const k of ['men', 'units', 'planes']) for (const o of S[k]) sum += o.x * 1.3 + o.z + (o.hp || 0);
  return [S.men.length, S.units.length, S.squads.length, sum.toFixed(6), S.cq.tk.map(v => v.toFixed(4)).join(','), C.$('Math').random().toFixed(12)].join(' ');
};

console.log('-- the battle is not changed --');
for (const watch of [false, true]) {
  const go = ana => { const C = H.load({ seed: 41, ana }), S = watch ? C.watch('ww2', {}) : C.newState('ww2', C.$('ERAS').ww2.sides[0].fighter, { cls: 'plane' }); C.run(60); return { p: print(C, S), n: C.$('ANA').ev.length }; };
  const a = go(true), b = go(false);
  ok(a.p === b.p && a.n > 5 && b.n === 0, (watch ? 'AI × AI' : 'solo') + ': 60 s with and without the analytics end the same, to the last digit and the random stream (' + a.n + ' events)');
}

console.log('-- one AI × AI match of ' + MIN + ' min --');
const C = H.load({ seed: 7, ana: true }), $ = C.$, S = C.watch('ww2', { doc: ['aggressive', 'cautious'], min: MIN }), A = $('ANA'), sunk = [];
A.sink = (e, last) => sunk.push({ e, last, b: JSON.stringify(e).length });
C.run(MIN * 60 + 30, () => !S.over);
const ev = A.ev, kinds = {}; for (const e of ev) kinds[e.k] = (kinds[e.k] || 0) + 1;
const R = S.anaRep, Q = S.cq, ls = ev.filter(e => e.k === 'ls'), end = ev.find(e => e.k === 'end');
console.log('   ' + JSON.stringify(kinds));
ok(S.over && !!end && R && R.over && R.win === Q.res[0] && R.why === Q.res[1] && R.whyTxt === $('CQ').why[Q.res[1]], 'the match ended (' + R.whyTxt + ') and the review says who won and why as the match does');
ok(['hdr', 'sn', 'sp', 'ls', 'lg', 'end'].every(k => kinds[k] > 0) && kinds.hdr === 1 && kinds.end === 1, 'a header, snapshots, vehicles in, losses, the general\'s log and the end');
const H0 = ev[0]; ok(H0.k === 'hdr' && H0.doc[0] === 'aggressive' && H0.doc[1] === 'cautious' && H0.watch === 1 && H0.era === 'ww2' && H0.pts.length === Q.p.length && H0.tk0 === Q.tk0, 'the header: era, doctrines, a watch match, the points, the tickets');
ok(R.lostN[0] === Q.lost[0].reduce((a, b) => a + b, 0) && R.lostN[1] === Q.lost[1].reduce((a, b) => a + b, 0) && ls.length === R.lostN[0] + R.lostN[1], 'one loss event a loss the match counts: ' + R.lostN.join(' and '));
const cost = $('CQ').cost, bad = ls.filter(e => e.u !== 'mil' && Math.abs(e.c - (cost[e.u === 'fighter' || e.u === 'cas' ? 'plane' : e.u] || 0)) > .01);
ok(!bad.length, 'each loss carries the tickets it cost (CQ.cost of its kind)' + (bad.length ? ': ' + JSON.stringify(bad[0]) : ''));
const by = ls.filter(e => e.by), sn = ev.filter(e => e.k === 'sn');
ok(by.length >= ls.length / 2 && by.every(e => (e.by[0] === 0 || e.by[0] === 1) && typeof e.by[1] === 'string'), by.length + ' of ' + ls.length + ' losses know the side and kind that did them');
ok(Math.abs(sn.length - (end.t - H0.t) / A.snap) <= 2 && sn.every((e, i) => !i || e.t - sn[i - 1].t <= A.snap + .25), sn.length + ' snapshots, one every ' + A.snap + ' s');
const T = R.tickets.map((x, s) => x.start - x.end - (x.loss + x.bleed + x.ptLost - x.ptTook + x.other));
ok(T.every(v => Math.abs(v) < .2) && R.tickets.every(x => x.end === Math.round(x.end * 10) / 10), 'the tickets add up: start − end = losses + bleed + points + the rest, a side');
ok(R.dec.length > 0 && R.dec.length <= A.top && R.dec.every(d => typeof d.x === 'string' && d.x && Number.isFinite(d.swing)), 'the decisions that weighed most: ' + R.dec.length + ', the first "' + R.dec[0].x.slice(0, 60) + '" ' + R.dec[0].swing);
ok(R.eff.length > 0 && R.eff.every(e => e.made >= 0 && e.lost >= 0 && (e.ratio === null || Number.isFinite(e.ratio))), 'cost-effectiveness for ' + R.eff.length + ' kinds of the two sides');
const bytes = zlib.gzipSync(ev.map(e => JSON.stringify(e)).join('\n')).length, per45 = bytes / (end.t / 60) * 45;
ok(per45 < 2e6, 'size: ' + (bytes / 1024).toFixed(1) + ' KB compressed for ' + (end.t / 60).toFixed(1) + ' min, some ' + (per45 / 1024).toFixed(0) + ' KB for 45 min (under 2 MB)');
const parts = sunk.flatMap(s => s.e);
ok(sunk.length > 1 && sunk[sunk.length - 1].last && sunk.slice(0, -1).every(s => !s.last) && sunk.every(s => s.b <= A.chunk || s.e.length === 1), 'the sink was handed ' + sunk.length + ' pieces of at most ' + A.chunk + ' characters, the last one marked');
ok(parts.length === ev.length + 1 && parts.every((e, i) => i === parts.length - 1 ? e.k === 'rep' : e === ev[i]) && JSON.stringify(parts[parts.length - 1]).length < 15000, 'every event went out once, in order, and the review last (rep, without its curve, under the relay\'s 16 KB)');

console.log('-- the bleed and a point --');
{ const C = H.load({ seed: 10, ana: true }), $ = C.$, S = C.watch('ww2', {}), K = $('CQ');
  C.step(1 / 60); S.units = []; S.men = []; S.squads = []; S.planes = []; C.director = () => {}; C.plan = () => {}; C.planSup = () => {}; $('ECO').on = 0;
  const P = S.cq.p, n = P.find(p => p.hold < 0), mine = P.filter(p => p.hold === 1 && p.base < 0 && p.links.some(i => P[i].hold === 0));
  for (const p of mine.slice(0, 1)) { p.hold = 0; p.c = -1; }   // side 0 two points ahead
  C.addMan($('INF').ww2[S.fac[0]][0], 0, n.x + 5, n.z, 0);
  const held = $('cqHeld'), hist = []; let want = 0;   // the bleed of the side behind, integrated here frame by frame
  C.run(K.t + 5, dt => { const m = held(0) - held(1); if (m > 0) want += K.bleed[Math.min(m, K.bleed.length - 1)] / 60 * dt; hist.push([S.t, want]); });
  const bleedTo = t => { let v = 0; for (const [a, w] of hist) if (a <= t + 1e-6) v = w; return v; };
  const ev = $('ANA').ev, last = ev.filter(e => e.k === 'sn').pop(), R = C.anaReport(ev), pt = ev.filter(e => e.k === 'pt');
  ok(pt.some(e => e.L === n.L && e.from < 0 && e.to === 0 && e.d[0] >= 0), 'a point taken is an event: ' + n.L + ' from neutral to side 0 at ' + (pt[0] ? pt[0].t : '?') + ' s, with the tickets it gave');
  ok(R.tickets[0].bleed === 0 && Math.abs(R.tickets[1].bleed - last.bl[1]) < .01 && Math.abs(last.bl[1] - bleedTo(last.t)) < .15, 'the side behind bled ' + R.tickets[1].bleed + ' tickets by the last snapshot, as integrated here from the points held (' + bleedTo(last.t).toFixed(2) + ')');
}

console.log('-- the review a side may see while the match runs --');
{ const C = H.load({ seed: 3, ana: true }), S = C.watch('ww2', {}); C.run(90);
  const a = C.genAnswer(0, { q: 'report' }), r = a.r;
  ok(a.ok && r.side === 0 && !r.over && r.tickets[0] && r.tickets[1] === null && r.lost[1] === null && r.eff.every(e => e.s === 0) && r.dec.every(d => d.s === 0), 'mid-match, side 0 sees its own breakdown and not the enemy\'s');
  ok(r.curve.length <= 41 && JSON.stringify(a).length < 15000 && Array.isArray(r.tk) && r.tk.length === 2, 'a curve of at most 40 points, ' + JSON.stringify(a).length + ' characters (the relay\'s gres takes 16 KB)');
  ok(C.genAnswer(1, { q: 'state' }).ok, 'the other questions are as before');
  const D = H.load({ seed: 3 }); D.watch('ww2', {}); D.run(5); ok(!D.genAnswer(0, { q: 'report' }).ok && D.$('ANA').ev.length === 0, 'with the analytics off there is no report and nothing is kept'); }

console.log('-- tools/balance.js --');
{ const rep = (win, s0) => ({ over: true, win, why: 2, whyTxt: 'o tempo acabou', dur: 600, doc: [s0 || 'balanced', 'balanced'], tickets: [{ loss: 10, bleed: 5, ptLost: 10, ptTook: 4, other: 1 }, { loss: 20, bleed: 0, ptLost: 0, ptTook: 0, other: 0 }], eff: [{ u: 'tank', made: 2, lost: 1, kills: 2, paid: 6, value: 12, life: 100 }] });
  const many = (a, b, d) => [...Array(a).fill(0).map(() => rep(0)), ...Array(b).fill(0).map(() => rep(1)), ...Array(d || 0).fill(0).map(() => rep(-1))];
  const X = B.aggregate(many(26, 14)), Y = B.aggregate(many(23, 17, 3)), Z = B.aggregate(many(15, 5));
  ok(X.alert && !Y.alert && !Z.alert && Z.few, 'alert: 26 to 14 is ' + Math.round(X.side0 * 100) + '% (alert), 23 to 17 is not, 15 to 5 is too few to tell');
  ok(Y.draws === 3 && Y.dur.mean === 10 && Math.abs(X.tickets.loss - 30 / 42) < 1e-9 && X.kinds.tank.value === 480, 'draws, duration, the share of tickets lost to losses, the sums by kind');
  ok(/Lado 0: 26 \(65% das decididas\)/.test(B.print(X, 't')) && /ALERTA/.test(B.print(X, 't')), 'the printout says it');
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-ana-')), f = B.save(d, 'ww2', ev.slice(0, 5), 'tourney');
  fs.appendFileSync(f, zlib.gzipSync(ev.slice(5).map(e => JSON.stringify(e)).join('\n') + '\n'));   // a second gzip member, as the server appends
  const back = B.readMatch(f), rr = C.anaReport(back);
  ok(back.length === ev.length && rr.win === R.win && JSON.stringify(rr.tickets) === JSON.stringify(R.tickets) && B.files([d]).length === 1, 'a match saved in two gzip members reads back whole and gives the same review');
  const P = B.plan({ n: 7, docs: ['cautious', 'aggressive', 'balanced'], era: 'all', seed: 5 });
  ok(P.length === 7 && P[0].doc.join() === 'cautious,aggressive' && P[1].doc.join() === 'cautious,balanced' && P[6].era === 'modern' && P[6].seed === 11 && B.plan({ n: 2, docs: ['balanced'] }).every(m => m.doc[0] === m.doc[1]), 'the tournament plays each pairing on both sides, then the next era; one doctrine is a mirror');
  fs.rmSync(d, { recursive: true, force: true }); }
H.done();
