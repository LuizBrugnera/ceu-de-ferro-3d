'use strict';
/* No tickets (cf-sem-tickets): the match is won on points. When the clock runs out the side holding the most points wins; tied on points, the
   one with more point-time (Q.ps: the points it held times the seconds it held them); tied on both, a draw. Losses only count (Q.lost), they
   never end a match; a main base taken still puts its side out. Each point held but the bases raises its side's income (ECO.pt). The cq
   message carries ps, not tickets; the AI's leader is the enemy ahead on points. Two and three sides, headless, a few seconds */
const H = require('./harness'), ok = H.ok;
const two = () => { const C = H.load({ seed: 4, eco: 1 }), S = C.newState('ww2', C.$('ERAS').ww2.sides[0].fighter, { cls: 'plane' }); C.step(1 / 60); return { C, S, $: C.$ }; };
const end = (C, Q) => { Q.T = 0; Q.acc = 0; C.$('cqStep')(.3); };   // the clock runs out at the next quarter second (cqStep counts acc itself)
const give = (Q, t, n) => { for (const p of Q.p.filter(p => p.base < 0 && p.hold < 0).slice(0, n)) { p.hold = t; p.cap = -1; p.c = 1; } };

console.log('-- two sides: the most points when the clock runs out --');
{
  const { C, S, $ } = two(), Q = S.cq;
  ok(Q.tk === undefined && Q.tk0 === undefined && Array.isArray(Q.ps) && Q.ps.length === 2, 'the match keeps no tickets: point-time a side (' + Q.ps + ')');
  for (const p of Q.p) if (p.base < 0) { p.hold = -1; p.c = 0; }
  give(Q, 1, 3); give(Q, 0, 1);
  const lost = Q.lost[1].slice();
  for (const u of S.units.filter(u => u.team === 1 && !u.dead).slice(0, 6)) C.killUnit(u);
  C.step(1 / 60);
  ok(!Q.ph && Q.lost[1][1] > lost[1], 'side 1 loses vehicles: counted (' + Q.lost[1] + '), and the match goes on');
  end(C, Q);
  ok(Q.ph === 1 && Q.res[0] === 1 && Q.res[1] === 2 && $('cqHeld')(1) === 4 && $('cqHeld')(0) === 2, 'the clock ran out with 4 points to 2 (bases count): side 1 wins, why 2 (' + $('CQ').why[Q.res[1]] + ')');
  ok(Q.place.join() === '1,0', 'the placing: 1, 0');
}
console.log('-- the tie-break: point-time, then a draw --');
{
  const { C, S, $ } = two(), Q = S.cq;
  for (const p of Q.p) if (p.base < 0) { p.hold = -1; p.c = 0; }
  give(Q, 0, 2); give(Q, 1, 2); Q.ps = [1200, 1500];
  end(C, Q);
  ok(Q.ph === 1 && $('cqHeld')(0) === $('cqHeld')(1) && Q.res[0] === 1, 'tied on points (' + $('cqHeld')(0) + ' each): side 1, with more point-time (' + Q.ps.map(Math.round) + '), wins');
  const b = two(), R = b.S.cq;
  for (const p of R.p) if (p.base < 0) { p.hold = -1; p.c = 0; }
  give(R, 0, 1); give(R, 1, 1); R.ps = [900, 900];
  end(b.C, R);
  ok(R.ph === 1 && R.res[0] === -1, 'tied on points and on point-time: a draw (win ' + R.res[0] + ')');
}
console.log('-- point-time is the points held times the time --');
{
  const { C, S, $ } = two(), Q = S.cq;
  S.units = []; S.men = []; S.squads = []; S.planes = S.planes.filter(p => p === S.my); C.director = () => {}; C.plan = () => {};
  for (const p of Q.p) if (p.base < 0) { p.hold = -1; p.c = 0; }
  give(Q, 0, 2); const ps0 = Q.ps.slice(), h = [0, 1].map($('cqHeld'));
  for (let i = 0; i < 40; i++) { Q.acc = 0; $('cqStep')(.25); }
  const d = Q.ps.map((v, s) => v - ps0[s]);
  ok(Math.abs(d[0] - h[0] * 10) < .01 && Math.abs(d[1] - h[1] * 10) < .01, '10 s with ' + h.join(' and ') + ' points: ' + d.map(v => v.toFixed(1)).join(' and ') + ' point-seconds');
}
console.log('-- a point pays: income, and its deposit opens to its holder --');
{
  const { $, S } = two(), Q = S.cq, inc = $('ecoPtInc');
  for (const p of Q.p) if (p.base < 0) { p.hold = -1; p.c = 0; }
  const a = inc(0); give(Q, 0, 2); const b = inc(0);
  ok(a.n === 0 && a.en === 0 && b.n === 2 && b.en > 0 && b.mt > 0, 'two points held: ' + b.en.toFixed(2) + ' energy and ' + b.mt.toFixed(2) + ' metal a second more (none with none)');
  const P = S.eco.dep.filter(d => d.pt >= 0), open = P.filter(d => Q.p[d.pt].hold === 0);
  ok(P.length > 0 && open.length > 0 && $('ecoView')(0).dep.filter(d => d.pt >= 0 && d.open).length === open.length, 'each point\'s deposit is open to its holder alone (' + open.length + ' of ' + P.length + ')');
}
console.log('-- online: cq carries the point-time, not tickets --');
{
  const { C, S, $ } = two(), Net = $('Net'), sent = [];
  Net.send = (t, m) => sent.push(Object.assign({ t }, m)); S.net = true; S.host = true;
  S.cq.ps = [61.4, 30.6]; Net.cqSend();
  const m = sent.find(m => m.t === 'cq');
  ok(m && m.ps.join() === '61,31' && m.k === undefined && m.k0 === undefined, 'cq: ps ' + (m && m.ps) + ', no k nor k0');
  S.host = false; Net.cq = true; Net.cqn = m.n; S.cq.ps = [0, 0];
  Net.rx.cq(Object.assign({}, m, { ps: [70, 40], T: 500 }));
  ok(S.cq.ps.join() === '70,40' && S.cq.T === 500, 'a guest takes the host\'s point-time from it');
}
console.log('-- three sides: the most points, the leader the AI watches --');
{
  const C = H.load({ seed: 3, mapv: 9, eco: 1 }), S = C.watch('modern', { n: 3 }), $ = C.$, Q = S.cq; C.run(1, null, 1 / 20);
  for (const p of Q.p) if (p.base < 0) { p.hold = -1; p.c = 0; }
  give(Q, 2, 3); give(Q, 0, 2); give(Q, 1, 1);
  ok($('ptLeader')(0) === 2 && $('ptLeader')(1) === 2 && $('ptLeader')(2) === -1, 'the enemy ahead on points: side 2 for both others, none for side 2 itself');
  ok($('mnLead')(0).e === 2 && $('gueLow')(Object.assign({}, S.cmd[1], { own: [9, 9, 9], enemy: [0, 0, 0] })) === 'pts', 'mnLead says it too, and side 1, ' + $('GUEX').pts + ' points behind, may harass');
  end(C, Q);
  ok(Q.ph === 1 && Q.res[0] === 2 && Q.place.join() === '2,0,1', 'the clock ran out: side 2 wins on points, then 0, then 1 (' + Q.place + ')');
}
H.done();
