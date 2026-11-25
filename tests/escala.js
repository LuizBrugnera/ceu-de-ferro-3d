'use strict';
/* The general scales up with its resources (ESC, cf-general-escala): a squad's cost, the wealth level (escW) and what it moves where the AI leads
   the economy (the plan's mix, the unit orders, the fortification plan's tier, the works' budget), that it moves nothing for a person's economy,
   and that a person still buys a squad at its cost. No match is played: the state is set by hand. The long measure is tools/generais.js */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 7, eco: 1, mapv: 11 }), $ = C.$, ECO = $('ECO'), ESC = $('ESC'), J = JSON.stringify;
$('AIB').now = () => 0;
const S = C.watch('modern', { len: 0, n: 2, min: 20 }), d = S.eco.d[0], escW = $('escW'), gpPlan = $('gpPlan');

console.log('-- the squad\'s cost --');
ok(J(ECO.unit.squad) === J([50, 20, 25, 'inf']), 'a squad costs 50 energy and 20 metal, 25 s (' + J(ECO.unit.squad) + ')');
ok(J(C.ecoView(0).costs.squad) === J([50, 20, 25, 'inf']), 'the view shows that cost (the panel\'s button and the MCP read it)');

console.log('-- the wealth level --');
ok(escW(0) === 0, 'at the start: 0');
const rich = () => { d.inc = { en: 400, mt: 300 }; d.en = 900; d.mt = 900; };
rich(); S.t += 30; const w30 = escW(0); S.t += 600; const w = escW(0);
ok(w30 > .2 && w30 < .4, 'it follows the income over minutes, not at once (30 s: ' + w30.toFixed(2) + ')');
ok(w > .99, 'rich for 10 min: ~1 (' + w.toFixed(3) + ')');
ok((S.glog.l[0] || []).some(e => /^Escala do general: recursos muito altos/.test(e.s)), 'the general\'s log names the level');
d.inc = { en: 36, mt: 24 }; d.en = 50; d.mt = 50; S.t += 900; ok(escW(0) < .01, 'poor again for 15 min: back to ~0 (' + escW(0).toFixed(3) + ')');

console.log('-- the plan --');
ESC.on = 0; const P0 = gpPlan(0).f; ESC.on = 1; rich(); S.t += 900; escW(0); const P1 = gpPlan(0).f;
console.log('   poor ' + J(P0) + '\n   rich ' + J(P1));
ok(P1.squad < P0.squad && P1.squad >= ESC.sqMin, 'rich: fewer squads wanted (' + P0.squad + ' → ' + P1.squad + ')');
ok(['tank', 'lav', 'art', 'aa'].reduce((a, k) => a + (P1[k] || 0), 0) > ['tank', 'lav', 'art', 'aa'].reduce((a, k) => a + (P0[k] || 0), 0), 'rich: more combat vehicles wanted');
ok(['fighter', 'cas', 'heli'].every(k => (P1[k] || 0) >= (P0[k] || 0)), 'rich: no fewer aircraft');
const P = $('popOf')(0), veh = $('GP').veh.reduce((a, k) => a + (P1[k] || 0), 0);
ok(veh <= Math.floor(P.veh * $('GP').gnd), 'still within the vehicles\' budget (' + veh + ' of ' + Math.floor(P.veh * $('GP').gnd) + ')');
S.eco.ctl[0] = 'me'; const Pm = gpPlan(0).f; S.eco.ctl[0] = 'ai';
ok(Pm.squad === P0.squad && Pm.tank === P0.tank, 'a person\'s economy: the plan is not moved by the wealth');

console.log('-- the unit orders --');
const A = ECO.ai, w0 = A.w, d0 = A.def;
const view = () => { const V = JSON.parse(J(C.ecoView(0))); V.T = 900; V.stock = { en: 900, mt: 900 }; V.inc = { en: 400, mt: 300 }; V.q = []; V.res = {}; V.miss = { squad: 4 }; V.lost = {};
  V.sc = { x: 0, z: 0, left: 100 }; V.foe = []; V.dep = []; V.keep = {};
  V.pp = { st: 1, f: { squad: 4, tank: 10 }, h: { squad: 2, tank: 6 }, why: {} };   // the plan short of both: 2 squads and 4 tanks
  for (const s of V.sites) { s.gd = { inf: 1, aa: 1 }; s.thr = 0; s.prog = 1; } return V; };
const mk = out => (out.find(o => o.c === 'make' && o.key !== 'mkpara') || {}).k;   // the paratroopers' reserve orders its own squad (paraHold)
ESC.on = 0; const k0 = mk(C.ecoAI(0, view())); ESC.on = 1; const k1 = mk(C.ecoAI(0, view()));
ok(k0 === 'squad', 'poor (or ESC off), the plan short of squads and tanks and four squads missed: the squad goes first (' + k0 + ')');
ok(!!k1 && k1 !== 'squad', 'rich, the same misses: a heavier kind goes first (' + k1 + ')');
ok(A.w === w0 && A.def === d0, 'the tables are back as they were after the look');

console.log('-- the bases --');
const Cc = S.cmd[0], Af = $('afpOf')(Cc), want = $('afpWant');
ESC.on = 0; const t0 = want(Cc, Af).tier; ESC.on = 1; const t1 = want(Cc, Af).tier;
ok(t1 > t0 || t1 === 2, 'rich: the fortification plan one tier up or more (' + t0 + ' → ' + t1 + ')');
ok(Cc.stgAfp === undefined || Cc.stgAfp === 0 || Cc.stgAfp === 1, 'the strategy\'s own tier is left as it was (' + Cc.stgAfp + ')');
const B = $('BMR').bud, s0 = B.share; $('bmrPay')(0, [1, 1]); ok(B.share === s0, 'the works\' budget share is back after a payment');
d.wl = [[S.t, 0, 0, 'x']]; const c = [Math.round(B.share * d.inc.en) + 20, 10];
ESC.on = 0; const pay0 = $('bmrPay')(0, c); ESC.on = 1; const pay1 = $('bmrPay')(0, c);
ok(!pay0 && pay1, 'a work just over the minute\'s budget: refused poor, paid rich (' + c + ')');

console.log('-- a person buys a squad --');
S.eco.ctl[0] = 'me'; d.q = []; d.en = 500; d.mt = 500; d.inc = { en: 0, mt: 0 }; d.res.squad = [];
const r = C.ecoCmd(0, { c: 'make', k: 'squad', n: 1 }, 'me');
ok(r.ok, 'the make order goes (' + J(r) + ')');
const q = d.q[0]; for (let i = 0; i < 80 && d.q.includes(q); i++) $('ecoStep')(.5);
ok(!d.q.includes(q) && d.res.squad.length === 1, 'built: a squad in the reserve');
ok(Math.abs(q.paid.en - 50) < .01 && Math.abs(q.paid.mt - 20) < .01, 'paid 50 energy and 20 metal (' + q.paid.en.toFixed(1) + ', ' + q.paid.mt.toFixed(1) + ')');

console.log('-- three sides --');
{ const C3 = H.load({ seed: 7, eco: 1, mapv: 11 }); C3.$('AIB').now = () => 0; const S3 = C3.watch('modern', { len: 0, n: 3, min: 20 }), d2 = S3.eco.d[2];
  d2.inc = { en: 400, mt: 300 }; C3.$('escW')(0); C3.$('escW')(2); S3.t += 600; ok(C3.$('escW')(2) > .99 && C3.$('escW')(0) < .01, 'each side its own level (side 2 rich, side 0 at its opening stock not)'); }
H.done();
