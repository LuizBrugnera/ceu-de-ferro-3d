'use strict';
/* the reserve for the drops (cf-general-reservas): an AI general with a paratroopers' transport keeps squads of its reserve that no other
   dispatcher may draw (PARA.res.keep[0], [1] while it is losing men or points), the factory's reserve target goes up by as many, only the
   drop draws them, and a losing side drops on a contested point it can take (linked to one it holds). The Insurgents (no transport) keep none.
   A real modern AI × AI conquest battle on map 11, two sides, then three */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 5, eco: 1, lg: 1, rec: 1, mapv: 11 }), $ = C.$;
C.$('AIB').now = () => 0;
const S = C.watch('modern', { len: 0, n: 2 }), PARA = $('PARA'), ECO = $('ECO'), K = PARA.res;
C.run(60, null, 1 / 10);
const t = 0, d = S.eco.d[t], use = k => $('ecoUse')(t, k), hold = () => $('paraHold')(t);
ok(!S.eco.open, 'the opening is over: draws come from the reserve');

/* not losing: one squad held */
S.cq.lost[t][0] = 0; S.prs = {};
ok(hold() === K.keep[0] && !S.prs[t].lose, 'a side not losing holds ' + K.keep[0] + ' squad(s) for the drops: ' + hold());
ok(d.keep.squad === ECO.ai.res.squad + K.keep[0], '  and its factory keeps that many more in reserve: ' + d.keep.squad);
d.res.squad = ['hq'];
ok(!use('squad') && d.res.squad.length === 1, 'a column, post or ride may not draw the held squad');
ok(!$('ecoUse')(t, 'lift', 'squad') && d.res.squad.length === 1, '  nor a transport helicopter\'s run (lift + squad)');
d.res.squad = ['hq', 'hq'];
ok(use('squad') && d.res.squad.length === 1, 'one over the hold goes to the front');

/* losing men: two held */
S.prs = {}; hold(); S.cq.lost[t][0] += K.lost; S.t += 3;
ok(hold() === K.keep[1] && S.prs[t].lose === 1, 'having lost ' + K.lost + ' men within ' + K.win + ' s it holds ' + K.keep[1] + ': ' + hold());
d.res.squad = ['hq', 'hq'];
ok(!use('squad') && d.res.squad.length === 2, '  so two in reserve stay there');
S.t += K.win + 2 * K.every; for (let i = 0; i < 6; i++) { S.t += K.every; hold(); }
ok(hold() === K.keep[0] || S.prs[t].lose === 1, 'past the window it goes back to ' + K.keep[0] + ' (unless behind on points)');

/* the drop draws the held squad */
const lt = S.pdrT || (S.pdrT = {}); lt[t] = 0; for (const D of S.pdr || []) D.end = D.end || S.t;
S.popK = 4; d.res.squad = ['hq'];
for (const g of S.men.concat(S.units)) if (g.team !== t) g.seenT = -1e9;   // no anti-aircraft known
const Ps = $('gPts')(), tg = Ps.find(p => p.hold !== t && S.base.every(b => Math.hypot(b.x - p.x, b.z - p.z) > PARA.ai.base));
const r = C.genCmd(t, { c: 'para', x: tg.x, z: tg.z, why: 'teste' }, 'ai');
ok(r.ok && d.res.squad.length === 0, 'the drop takes the squad held for it: ' + JSON.stringify(r));

/* losing, the AI drops on a contested point it can take, even with its own fighting there */
lt[t] = 0; for (const D of S.pdr) D.end = D.end || S.t;
S.prs[t].lose = 1; S.prs[t].T = S.t; S.prs[t].n = K.keep[1]; d.res.squad = ['hq', 'hq'];
const link = p => p.links.some(i => Ps[i].hold === t), cand = Ps.filter(p => p.hold !== t && link(p) && S.base.every(b => Math.hypot(b.x - p.x, b.z - p.z) > PARA.ai.base));
const P0 = cand[0]; ok(!!P0, 'a point linked to one it holds: ' + (P0 && $('gName')(P0)));
for (const p of Ps) if (p !== P0 && p.hold !== t) p.hold = t;   // the only one left
const foes = S.men.filter(m => m.team !== t && !m.dead).slice(0, 4);
for (const [i, m] of foes.entries()) { m.x = P0.x + 60 * i; m.z = P0.z + 40; m.seenT = S.t; m.sx = m.x; m.sz = m.z; }
const n0 = S.pdr.length, Cm = S.cmd[t]; Cm.paraT = 0; $('paraAI')(Cm);
const D = S.pdr.length > n0 ? S.pdr[S.pdr.length - 1] : null;
ok(D && Math.hypot(D.x - P0.x, D.z - P0.z) < 2, 'losing, the AI drops on the contested point (' + $('pedFoes')(t, P0.x, P0.z, PARA.ai.near) + ' foes known there): ' + (D ? $('gName')(P0) : 'none'));
const L = S.glog && (S.glog.l[t] || []).filter(e => e && /perdendo tropas/.test(e.s));
ok(L && L.length > 0, '  and says why in the general\'s log');

/* three sides: the Insurgents have no transport and keep nothing back */
const M = H.load({ seed: 3, eco: 1, mapv: 11 }); M.$('AIB').now = () => 0;
const S3 = M.watch('modern', { len: 0, n: 3 }); M.run(40, null, 1 / 10);
ok(M.$('paraHold')(2) === 0 && M.$('paraHold')(0) > 0, 'three sides: the Insurgents hold none, the USA ' + M.$('paraHold')(0));
ok(!H.nan(S) && !H.nan(S3), 'no NaN');
H.done();
