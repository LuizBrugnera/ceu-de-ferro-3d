'use strict';
/* The laws of war (W14, issue #1): what a civilian killed costs the side whose fire it was (CIV.toll), a town that turns against a side (CIV.rage) and
   arms the other's militia, evacuation and the way home (CIV.evac), the AI's rules of engagement (CIV.roe: roeHeld in pickFire and cmdFire, and which
   civilians a side sees), the general's mil order, and the analytics (cv events, the snapshot's cv, the review's civ). Sandboxes with conquest tickets
   and civilians made by hand; then an AI × AI match of each era on the map with the seat towns (SECS s of it, default 240; SECS=0 skips it) */
const H = require('./harness'), { ok, done, nan } = H;
let C, $, S, T, CIV;
const load = o => { const c = H.load(o); $ = c.$; C = new Proxy(c, { get: (t, k) => (k in t ? t[k] : t.$(String(k))) }); CIV = $('CIV'); };
const fresh = era => { S = C.sandbox(era || 'modern'); T = S.T; C.cqInit(1); C.civBegin(); C.civInit(); return S; };
const man = (team, x, z, ai) => { const m = C.addMan($('INF')[S.era][S.fac[team]][0], team, x, z, 0); if (ai) { m.ai = C.manBrain(0); m.ai.gx = x; m.ai.gz = z; } return m; };
const out = () => S.civs.filter(c => !c.dead && !c.gone && !c.in);
const hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
/* the town with most people, its index and group */
function bigTown() {
  const n = new Map(); for (const c of S.civs) if (c.g && c.g.b) n.set(c.g, (n.get(c.g) || 0) + 1);
  const g = [...n.keys()].sort((a, b) => n.get(b) - n.get(a))[0];
  return { g, b: g.b, bi: T.burgs.indexOf(g.b), n: n.get(g) };
}
const ofTown = g => S.civs.filter(c => c.g === g && !c.dead && !c.gone);
/* kill civilian c with a small burst of by's */
const kill = (c, by) => { C.explode(c.x, c.y + .5, c.z, 2, 400, by, by ? by.team : 0, false); return c.dead; };

console.log('-- the toll: a civilian killed costs the side whose fire it was --');
load({ seed: 31 }); fresh('modern'); C.run(3);
{
  const tk0 = S.cq.tk.slice(), sc = [S.score, S.gndKills];
  const v = out().find(c => hd(c, S.base[0]) > 200), sh = man(1, v.x - 30, v.z, false);
  for (let i = 0; i < 40 && !v.dead; i++) { S.bullets.push({ x: v.x - 3, y: v.y + 1.1, z: v.z, vx: 900, vy: 0, vz: 0, life: 1.3, team: 1, dmg: 8, ap: 0, sa: 1, by: sh, tr: 0 }); C.run(.1); }
  ok(v.dead && S.cq.tk[1] === tk0[1] - CIV.toll && S.cq.tk[0] === tk0[0], 'a rifleman of side 1 kills a civilian: side 1 pays ' + CIV.toll + ' tickets, side 0 nothing (' + S.cq.tk + ')');
  const v2 = out().find(c => hd(c, v) > 40); C.explode(v2.x + 2, v2.y, v2.z, 12, 90, null, 0, false);
  ok(v2.dead && S.cq.tk[0] === tk0[0] && S.cq.tk[1] === tk0[1] - CIV.toll, 'a burst of nobody\'s fire kills one: nobody pays');
  const v3 = out().find(c => hd(c, v) > 60 && hd(c, v2) > 60), u = C.addVehicle('tank', S.E.sides[S.fac[0]].tanks[0], 0, v3.x - 300, v3.z, 0);
  C.civHurt(v3, 100, u);   // what a hull does, driving over one (ranOver) or bringing a house down on it
  ok(v3.dead && S.cq.tk[0] === tk0[0] - CIV.toll, 'a tank of side 0 kills one: side 0 pays');
  C.run(CIV.say + .5);
  const D = S.civD;
  ok(D.n[0] === 1 && D.n[1] === 1 && D.dead === 3 && D.tk[0] === CIV.toll && D.tk[1] === CIV.toll, 'the record: one by each side, three dead, the tickets each paid (' + JSON.stringify({ n: D.n, dead: D.dead, tk: D.tk }) + ')');
  ok(S.feed.some(f => f.team === 1 && /um civil morto/.test(f.text) && f.text.includes('−' + CIV.toll)), 'the feed tells it: ' + (S.feed.find(f => /civil/.test(f.text)) || {}).text);
  ok(S.glog.l[1].some(e => e.k === 'rep' && /por fogo nosso/.test(e.s)) && S.glog.l[0].some(e => /por fogo nosso/.test(e.s)), 'and each side\'s general reads it in its log');
  ok(S.score === sc[0] && S.gndKills === sc[1], 'it is never scored');
  S.cq.ph = 1; const tk1 = S.cq.tk.slice(), f0 = S.feed.length, l0 = S.glog.l[1].length; kill(out().find(c => hd(c, u) > 50), sh);
  ok(S.cq.tk.every((v, i) => v === tk1[i]), 'once the match is over nothing is charged');
  C.run(CIV.say + .5);
  const said = S.feed.slice(f0).find(f => f.team === 1 && /um civil morto/.test(f.text)), logged = S.glog.l[1].slice(l0).find(e => /por fogo nosso/.test(e.s));
  ok(said && !/tíquetes/.test(said.text) && logged && !/tíquetes/.test(logged.s), 'and the feed and the log tell the death with no tickets: ' + (said && said.text)); S.cq.ph = 0;
}

console.log('-- a town that turns against a side --');
load({ seed: 32 }); fresh('modern'); C.run(2);
{
  const { g, b, bi, n } = bigTown(), sh = man(1, b.x + b.ru + 300, b.z, false), tk1 = S.cq.tk[1];
  console.log('   ' + C.civName(b) + ' (' + b.k + '): ' + n + ' people');
  let k = 0;
  for (const c of ofTown(g).filter(c => !c.in)) { if (k >= CIV.rage.n - 1) break; if (kill(c, sh)) k++; }
  ok(k === CIV.rage.n - 1 && !C.civHates(bi, 1) && !S.men.some(m => m.mil), (CIV.rage.n - 1) + ' of its people killed by side 1: the town has not turned yet');
  for (const c of ofTown(g).filter(c => !c.in && !c.dead)) if (kill(c, sh)) break;
  const D = S.civD;
  ok(C.civHates(bi, 1) && !C.civHates(bi, 0) && D.hits[bi][1] >= CIV.rage.n, 'the ' + CIV.rage.n + 'th: it turns against side 1, not side 0');
  ok(S.cq.tk[1] <= tk1 - CIV.rage.n * CIV.toll, 'side 1 paid ' + (tk1 - S.cq.tk[1]) + ' tickets');
  const mil = S.men.filter(m => m.mil && !m.dead), q = mil[0] && mil[0].sq;
  ok(mil.length === CIV.mil.n && mil.every(m => m.team === 0 && m.sq === q), 'at once it arms a militia squad of ' + CIV.mil.n + ' for side 0 (' + mil.length + ')');
  ok(q && q.ord.k === 'hold' && q.mis && q.mis.kind === 'defend' && q.mis.d > 0 && /Revolta em/.test(q.mis.why) && mil.every(m => m.mis === q.mis), 'which holds the town, born of a Dispatch order with its mission: defend (' + (q && q.mis && q.mis.why) + ')');
  ok(S.dsp.log[0].some(o => /Revolta em/.test(o.why)), 'and the order is in side 0\'s Dispatch log');
  ok(S.glog.l[1].some(e => /se voltou contra nós/.test(e.s)) && S.glog.l[0].some(e => /se levantou contra o inimigo/.test(e.s)), 'both generals read it in their logs');
  ok(S.feed.some(f => /se voltou contra/.test(f.text)), 'the feed tells it: ' + (S.feed.find(f => /se voltou contra/.test(f.text)) || {}).text);
  const w = { x: b.x, z: b.z };
  ok(C.civTake(w, 1, 'ai') === null && C.genCmd(1, { c: 'mil', x: b.x, z: b.z }, 'ai').why === 'hate', 'side 1 arms nobody there any more (mil: ' + $('GEN').no.hate + ')');
  const P = man(1, 0, 0, false); P.me = 1; S.my = P; S.input = {}; S.aim = { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } };
  const r = ofTown(g).find(c => !c.in && c.mode < 4); r.think = 1e9; r.mode = 0; r.goal = null; r.wT = 1e9; P.x = r.x + 1.2; P.z = r.z; P.y = r.y;   // it stands where it is
  const nm = S.men.filter(m => m.mil).length;
  let told = true; S.input.recruit = true; C.run(CIV.hold + 1, () => { P.x = r.x + 1.2; P.z = r.z; if (S.civU !== r || !S.civO) told = false; }); S.input.recruit = false;
  ok(told && S.men.filter(m => m.mil).length === nm && !r.gone, 'a player of side 1 beside one of its people is told the town turned against his side, and recruits nobody');
  const m0 = S.men.filter(m => m.mil && m.team === 0).length;
  C.run(CIV.mil.every + 2 * CIV.plan);
  const m1 = S.men.filter(m => m.mil && m.team === 0 && !m.dead).length;
  ok(m1 > m0 && m1 <= CIV.mil.town, 'every ' + CIV.mil.every + ' s it arms another for side 0, within the town\'s ' + CIV.mil.town + ' (' + m0 + ' then ' + m1 + ')');
  ok(!nan(S), 'nothing is NaN');
}

console.log('-- evacuation: combat near a town empties it, calm brings its people home --');
load({ seed: 33 }); fresh('modern'); C.run(2);
{
  const { g, b } = bigTown(), L = ofTown(g), sh = man(1, b.x + 60, b.z, false);
  console.log('   ' + C.civName(b) + ': ' + L.length + ' people, ' + b.ru + ' m across');
  const fire = () => { S.bullets.push({ x: sh.x, y: sh.y + 1.6, z: sh.z, vx: 0, vy: 300, vz: 0, life: .5, team: 1, dmg: 1, ap: 0, sa: 1, by: sh, tr: 0 }); };
  let f = 0; C.run(CIV.evac.after - 8, () => { if ((f = (f + 1) % 20) === 0) fire(); });
  ok(!g.ev, 'a short burst of firing: they hide, the town stays (' + (g.hot | 0) + ' s of combat)');
  C.run(16, () => { if ((f = (f + 1) % 20) === 0) fire(); });
  ok(g.ev && g.ref, 'firing kept up for ' + CIV.evac.after + ' s: the town evacuates (' + (g.hot | 0) + ' s of combat)');
  const away = g.ref ? hd(g.ref, b) : 0;
  ok(Math.abs(away - (b.ru + CIV.evac.d)) < 1 && g.ref.x < b.x, 'to a refuge ' + Math.round(away) + ' m from its middle, away from the shooting (west of the town, the shots in its east)');
  const leaving = ofTown(g).filter(c => c.mode === 4 || c.mode === 5).length;
  ok(leaving >= ofTown(g).length - 1, 'its people are on their way (' + leaving + ' of ' + ofTown(g).length + ')');
  ok(C.civTake({ x: b.x, z: b.z }, 0, 'ai') === null, 'and nobody of them is armed as militia on the way');
  const t0 = S.t; C.run(CIV.evac.back - 30);
  const at = ofTown(g).filter(c => c.mode === 5 && hd(c, g.ref) < CIV.evac.j * 2 + 40).length, alive = ofTown(g).length;
  ok(at >= alive * .7 && ofTown(g).every(c => !c.in), Math.round(S.t - t0) + ' s on most wait at the refuge (' + at + ' of ' + alive + '), none indoors in the town');
  ok(g.ev && !S.civD.back, 'the town stays empty while it is not calm for ' + CIV.evac.back + ' s');
  C.run(30 + 2 * CIV.plan + 1);
  ok(!g.ev && S.civD.back === 1 && ofTown(g).every(c => c.mode < 4), 'with no fight there for ' + CIV.evac.back + ' s they head home');
  C.run(300);
  const home = ofTown(g).filter(c => hd(c, b) < b.ru + 40).length;
  ok(home >= alive * .8, 'and five minutes later most are back in town (' + home + ' of ' + alive + ')');
  ok(!nan(S) && ofTown(g).every(c => Number.isFinite(c.x) && Number.isFinite(c.z)), 'nothing is NaN');
  fresh('modern'); C.run(2);
  const t2 = bigTown(), s0 = man(0, t2.b.x - t2.b.ru - 100, t2.b.z, true), s1 = man(1, t2.b.x + t2.b.ru + 100, t2.b.z, true);
  ok(C.civFight(t2.b), 'soldiers of both sides by a town are a fight there (civFight)');
  s1.x = t2.b.x + t2.b.ru + CIV.evac.r + 100; ok(!C.civFight(t2.b), 'one side alone is not');
  void s0;
}

console.log('-- the rules of engagement: no burst where civilians are in sight, unless the target is identified --');
load({ seed: 34 }); fresh('modern'); C.run(2);
{
  const { g, b } = bigTown(), c = ofTown(g).find(c => !c.in), D = () => C.civD();
  const e = C.addVehicle('aa', S.E.sides[S.fac[1]].aa, 1, c.x + 8, c.z, 0), sx = b.x > S.W / 2 ? b.x - 3000 : b.x + 3000, art = C.addVehicle('art', S.E.sides[S.fac[0]].art, 0, sx, b.z, 0), w = art.arms[0].d;
  const freeze = () => { for (const o of S.civs) { o.mode = 2; o.goal = null; o.v = { x: 0, y: 0, z: 0 }; } c.in = null; c.x = e.x - 8; c.z = e.z; };
  freeze(); C.run(.05, freeze); e.x = c.x + 8; e.z = c.z; e.seenT = S.t; e.moveT = -99;
  ok(C.pickFire(art, w) === e, 'a battery of side 0 shells an enemy AA vehicle standing in ' + C.civName(b) + ' while it has seen no civilian there');
  c.sn = [S.t, -1e9]; e.seenT = S.t;
  ok(C.pickFire(art, w) !== e && D().roe[0] === 1, 'with a civilian side 0 saw beside him it holds (roe ' + D().roe[0] + ')');
  ok(S.glog.l[0].some(l => l.k === 'fire' && /Fogo suspenso em .*civis à vista e alvo não identificado/.test(l.s)), 'and its general writes down why: ' + (S.glog.l[0].find(l => /Fogo suspenso/.test(l.s)) || {}).s);
  c.sn = [-1e9, S.t];
  ok(C.pickFire(art, w) === e, 'a civilian only the enemy saw does not hold it');
  c.sn = [S.t - CIV.roe.mem - 1, -1e9];
  ok(C.pickFire(art, w) === e, 'nor one side 0 saw more than ' + CIV.roe.mem + ' s ago');
  c.sn = [S.t, -1e9]; c.in = S.T.houses[0].id;
  ok(C.pickFire(art, w) === e, 'nor one indoors');
  c.in = null;
  const o = man(0, e.x - 300, e.z, false); o.pm = new Map([[e, { kn: true, ic: 1, rc: 1 }]]); e.kn = [{ t0: S.t, last: S.t, by: o }, null];
  ok(C.roeIdf(0, e) && C.pickFire(art, w) === e, 'once an AI of side 0 has identified it (the ladder\'s model and side), the battery fires');
  o.pm.get(e).ic = .6; ok(!C.roeIdf(0, e) && C.pickFire(art, w) !== e, 'recognized only (the class, not the model): it holds');
  e.kn = null; o.pm = null;
  CIV.roe.on = 0; ok(C.pickFire(art, w) === e, 'with CIV.roe.on 0 the rules are off'); CIV.roe.on = 1;
  const r0 = D().roe[0]; C.pickFire(art, w); C.pickFire(art, w);
  ok(D().roe[0] === r0, 'a hold at the same place is written down once every ' + CIV.roe.note + ' s');
  const Cm = S.cmd[0], M = C.cmdMission(Cm, 'he', c.x + 5, c.z, 3, 90);
  ok(!M.tg && C.cmdFire(art, 250, w.range, false) === null, 'a fire mission on a bare point among civilians in sight waits');
  M.usr = 1; ok(C.cmdFire(art, 250, w.range, false) === M, 'unless a person ordered it (M.usr)');
  M.dead = true;
  const sm = C.cmdMission(Cm, 'smk', c.x + 5, c.z, 1, 90); ok(C.cmdFire(art, 250, w.range, true) === sm, 'smoke is never held'); sm.dead = true;
  e.sx = e.x; e.sz = e.z; Cm.known = [e];
  const Mk = C.cmdMission(Cm, 'he', e.sx, e.sz, 3, 90); ok(Mk.tg === e, 'a mission on something the side knows carries it as its target (M.tg)');
  ok(C.cmdFire(art, 250, w.range, false) === null, 'and waits while it is not identified');
  o.pm = new Map([[e, { kn: true, ic: 1, rc: 1 }]]); e.kn = [{ t0: S.t, last: S.t, by: o }, null];
  ok(C.cmdFire(art, 250, w.range, false) === Mk, 'and goes once it is');
  const tr = { kind: 'trench', team: 1 }, hs = { kind: 'bld', team: 1 }, eco = { lot: 2, idf: false, team: 1 }, eco2 = { lot: 2, idf: true, team: 1 }, sup = { sup: 1, team: 1 };
  ok(C.roeIdf(0, tr) && C.roeIdf(0, sup) && !C.roeIdf(0, hs) && !C.roeIdf(0, eco) && C.roeIdf(0, eco2) && C.roeIdf(0, { lot: -1, idf: false, team: 1 }) && !C.roeIdf(0, null),
    'identified: a trench, a supply base, an economy site found out or never disguised; not: a house held by soldiers, a site still disguised on a lot, a bare point');
  /* which civilians a side sees */
  fresh('modern'); C.run(2);
  const c2 = out().find(x => x.mode === 0 && T.houses.every(h => C.footD(h, x.x, x.z) > 6)) || out()[0];
  const ob = man(0, c2.x + 4, c2.z, false);
  C.run(CIV.roe.every * 1.5, () => { ob.x = c2.x + 4; ob.z = c2.z; });
  ok(c2.in || (c2.sn && S.t - c2.sn[0] < CIV.roe.every * 2 && !(S.t - c2.sn[1] < 1e8)), 'a soldier of side 0 beside a civilian: side 0 sees it, side 1 does not');
  ok(S.civs.filter(x => x.sn && S.t - x.sn[1] < 5).length === 0, 'and side 1, with nobody on the map, sees none');
}

console.log('-- a fire mission ordered among civilians in sight: a model is refused (roe), a person is warned and pays --');
load({ seed: 37 }); fresh('modern'); C.run(2);
{
  const GEN = $('GEN'), { g, b } = bigTown(), L = ofTown(g).filter(c => !c.in).slice(0, 6), p = { x: L[0].x, z: L[0].z }, Cm = C.cmdOf(0);
  const art = C.addUnit('art', 0, b.x > S.W / 2 ? b.x - 3000 : b.x + 3000, b.z, S.E.sides[S.fac[0]].art, true);
  let seen = -1e9;
  const pin = () => L.forEach((o, i) => { if (o.dead) return; o.mode = 2; o.goal = null; o.v = { x: 0, y: 0, z: 0 }; o.in = null; o.x = p.x + (i % 3) * 3; o.z = p.z + Math.floor(i / 3) * 3; o.sn = [seen, -1e9]; });
  const live = () => Cm.fm.filter(M => !M.dead && S.t < M.T && M.k === 'he');
  pin(); C.run(.05, pin);
  C.genCtl(0, 'mcp', { eco: 0, atk: 0, def: 0, sup: 0 });
  let r = C.genCmd(0, { c: 'fire', k: 'he', x: p.x, z: p.z, n: 3 }, 'mcp');
  ok(r.ok && live().length === 1 && !live()[0].usr, 'a model\'s fire mission where its side has seen no civilian lately: accepted, and the rules of engagement still weigh it (no M.usr)');
  for (const M of live()) M.dead = true;
  seen = S.t; pin();
  r = C.genCmd(0, { c: 'fire', k: 'he', x: p.x, z: p.z, n: 3 }, 'mcp');
  ok(!r.ok && r.why === 'roe' && GEN.no.roe === 'Civis à vista e alvo não identificado: fogo negado pelas regras de engajamento', 'with civilians its side saw there a moment ago and a bare point for a target: refused, ' + GEN.no.roe);
  ok(live().length === 0 && S.gj.some(j => j.by === 'mcp' && j.c.c === 'fire' && !j.ok && j.why === 'roe'), 'no fire mission is queued, and the journal has the refusal');
  r = C.genCmd(0, { c: 'fire', k: 'smk', x: p.x, z: p.z, n: 1 }, 'mcp');
  ok(r.ok, 'smoke there is not barred by the rules (' + (r.ok ? 'accepted' : r.why) + ')');
  for (const M of Cm.fm) M.dead = true;
  C.genCtl(0, 'me', { eco: 0, atk: 0, def: 0, sup: 0 });
  const n0 = S.glog.l[0].length;
  r = C.genCmd(0, { c: 'fire', k: 'he', x: p.x, z: p.z, n: 8 }, 'me');
  const M = live()[0], warn = S.glog.l[0].slice(n0).find(e => e.k === 'fire' && /civis à vista e alvo não identificado/.test(e.s));
  ok(r.ok && M && M.usr, 'a person\'s order at the same spot: accepted, the mission theirs to answer for (M.usr)');
  ok(warn && warn.s.includes(CIV.toll + ' tíquetes'), 'with a warning in the log: ' + (warn && warn.s));
  const D = C.civD(), d0 = D.n[0], t0 = D.tk[0];
  C.run(90, () => { seen = S.t; pin(); });
  ok(D.n[0] > d0 && D.tk[0] - t0 === (D.n[0] - d0) * CIV.toll, 'the battery fires it among them, and side 0 pays ' + CIV.toll + ' tickets a civilian killed (' + (D.n[0] - d0) + ' killed, ' + (D.tk[0] - t0) + ' paid)');
}

console.log('-- a fire mission at an identified enemy among civilians, from the coordinates get_state gives (tenths of a metre) --');
load({ seed: 38 }); fresh('modern'); C.run(2);
{
  const { g, b } = bigTown(), c = ofTown(g).find(c => !c.in), Cm = C.cmdOf(0);
  C.addUnit('art', 0, b.x > S.W / 2 ? b.x - 3000 : b.x + 3000, b.z, S.E.sides[S.fac[0]].art, true);
  const pin = () => { for (const o of S.civs) { o.mode = 2; o.goal = null; o.v = { x: 0, y: 0, z: 0 }; } c.in = null; c.sn = [S.t, -1e9]; };
  pin(); C.run(.05, pin);
  const e = C.addVehicle('aa', S.E.sides[S.fac[1]].aa, 1, c.x + 8.0437, c.z + 3.0371, 0); e.seenT = S.t; e.moveT = -99; e.sx = e.x; e.sz = e.z; Cm.known = [e];
  const o = man(0, e.x - 300, e.z, false), x = Math.round(e.sx * 10) / 10, z = Math.round(e.sz * 10) / 10, live = () => Cm.fm.filter(M => !M.dead && S.t < M.T && M.k === 'he');
  C.genCtl(0, 'mcp', { eco: 0, atk: 0, def: 0, sup: 0 });
  let r = C.genCmd(0, { c: 'fire', k: 'he', x, z, n: 3 }, 'mcp');
  ok(!r.ok && r.why === 'roe', 'a model\'s burst at it while it is only detected, civilians in sight: refused (' + r.why + ')');
  o.pm = new Map([[e, { kn: true, ic: 1, rc: 1 }]]); e.kn = [{ t0: S.t, last: S.t, by: o }, null];
  r = C.genCmd(0, { c: 'fire', k: 'he', x, z, n: 3 }, 'mcp');
  ok(r.ok && live().length === 1 && live()[0].tg === e, 'once identified, an order at its place rounded to tenths (' + x + ', ' + z + ') is accepted, the mission aimed at it');
  for (const M of live()) M.dead = true;
  C.genCtl(0, 'me', { eco: 0, atk: 0, def: 0, sup: 0 });
  const n0 = S.glog.l[0].length;
  r = C.genCmd(0, { c: 'fire', k: 'he', x: e.sx + 4, z: e.sz - 3, n: 3 }, 'me');
  ok(r.ok && live()[0].tg === e && !S.glog.l[0].slice(n0).some(l => /alvo não identificado/.test(l.s)), 'a person\'s click 5 m off it: accepted with no "alvo não identificado" warning');
}

console.log('-- the general\'s order: mil --');
load({ seed: 35 }); fresh('modern'); C.run(2);
{
  const W = $('towns')(), w = W.find(p => T.burgs.some(b => hd(b, p) < 150 && S.civs.some(c => c.g && c.g.b === b))) || W[0], t = 0, GEN = $('GEN');
  C.genCtl(t, 'me', { eco: 0, atk: 0, def: 0, sup: 0 });
  let r = C.genCmd(t, { c: 'mil', x: w.x, z: w.z }, 'me');
  ok(!r.ok && r.why === 'mil0', 'a person\'s general with no troops in the town: refused, ' + GEN.no.mil0);
  for (let i = 0; i < 3; i++) man(t, w.x + 20 + i * 3, w.z + 20, true);
  r = C.genCmd(t, { c: 'mil', x: w.x, z: w.z }, 'me');
  const q = S.squads.find(q => q.mil && q.team === t);
  ok(r.ok && q && q.men.length === CIV.mil.n && q.mis.kind === 'defend' && q.mis.d > 0, 'with three soldiers there: a militia squad of ' + (q ? q.men.length : 0) + ', its mission defend, by a Dispatch order');
  ok(S.glog.l[t].some(e => e.k === 'ord' && /General: milícia/.test(e.s)) && S.glog.l[t].some(e => /Milícia de \d formada em/.test(e.s)), 'in the log: the order and the squad');
  r = C.genCmd(t, { c: 'mil', x: w.x, z: w.z }, 'me'); ok(!r.ok && r.why === 'cool', 'again at once: ' + GEN.no.cool);
  const far = [[.5, .9], [.5, -.9], [.15, .8], [.85, -.8]].map(([a, b]) => ({ x: a * S.W, z: b * S.HW })).find(p => T.burgs.every(o => hd(o, p) > o.ru + 150));
  r = C.genCmd(t, { c: 'mil', x: far.x, z: far.z }, 'me'); ok(!r.ok && r.why === 'at', 'far from any town: ' + GEN.no.at);
  r = C.genCmd(1, { c: 'mil', x: w.x, z: w.z }, 'me'); ok(!r.ok && r.why === 'ctl', 'the other side\'s chair is not this person\'s');
  /* the AI's own: a town held long enough, as before; with a person in the defence the town arms itself for the side */
  fresh('modern'); C.run(1);
  C.genCtl(0, 'me', { eco: 0, atk: 0, def: 0, sup: 0 });
  for (let i = 0; i < 4; i++) man(0, w.x + 20 + i * 3, w.z + 20, true);
  C.run(CIV.mil.wait + 30);
  ok(S.men.some(m => m.mil && m.team === 0) && S.glog.l[0].some(e => /a vila se armou/.test(e.s)), 'a person in the defence: the town held arms itself for the side, as it did before (' + ((S.glog.l[0].find(e => /Milícia/.test(e.s)) || {}).s) + ')');
  fresh('modern'); C.run(1);
  for (let i = 0; i < 4; i++) man(1, w.x + 20 + i * 3, w.z + 20, true);
  C.run(CIV.mil.wait + 30);
  ok(S.men.some(m => m.mil && m.team === 1) && S.glog.l[1].some(e => /^Milícia de \d formada em [^(]*$/.test(e.s)) && (!S.gj || S.gj.some(j => j.c.c === 'mil' && j.by === 'ai' && j.ok)), 'the AI general raises it itself (' + ((S.glog.l[1].find(e => /Milícia/.test(e.s)) || {}).s) + ')');
  const st = C.genState(1);
  ok(st.civ && st.civ.toll === CIV.toll && st.civ.towns.length > 0 && st.civ.towns.every(o => o.name && o.home + o.away >= 0 && o.hate === ''), 'genState carries the civilians as the side sees them (' + st.civ.towns.length + ' towns with people)');
  ok(JSON.stringify(JSON.parse(JSON.stringify(st))) === JSON.stringify(st), 'and stays plain JSON');
}

console.log('-- analytics: cv events, the snapshot and the review --');
load({ seed: 36, ana: true }); fresh('modern'); C.run(12);
{
  const ANA = $('ANA'), { g, b, bi } = bigTown(), sh = man(1, b.x + b.ru + 300, b.z, false), sh0 = man(0, b.x - b.ru - 300, b.z, false);
  ok(ANA.S === S && ANA.ev.some(e => e.k === 'hdr'), 'the analytics run in the sandbox');
  kill(ofTown(g).find(c => !c.in), sh); kill(ofTown(g).find(c => !c.in && !c.dead), sh0);
  C.civTurn(bi, 1);
  const c = ofTown(g).find(c => !c.in && !c.dead); c.sn = [S.t, -1e9]; C.roeHeld(0, c.x, c.z, 10, null);
  C.civEvac(g); C.civHome(g); C.run(11);
  const cv = ANA.ev.filter(e => e.k === 'cv'), has = (k, s) => cv.some(e => e.c === k && (s === undefined || e.s === s));
  ok(has('kill', 1) && has('kill', 0) && has('turn', 1) && has('mil', 0) && has('roe', 0) && has('evac', -1) && has('back', -1), 'cv events: kill, turn, mil, roe, evac, back (' + cv.map(e => e.c).join(' ') + ')');
  ok(cv.find(e => e.c === 'kill').tk === CIV.toll && cv.find(e => e.c === 'turn').nm === C.civName(b) && cv.find(e => e.c === 'mil').why === 'turn', 'with the tickets, the town\'s name, why the militia rose');
  const sn = ANA.ev.filter(e => e.k === 'sn').pop();
  ok(sn && Array.isArray(sn.cv) && sn.cv.length === 3 && sn.cv[0] === S.civs.filter(c => !c.dead && !c.gone).length, 'the snapshot counts the civilians alive, away and indoors (' + (sn && sn.cv) + ')');
  const R = C.anaReport(ANA.ev);
  ok(R.civ && R.civ.side[1].killed === 1 && R.civ.side[0].killed === 1 && R.civ.side[1].tk === CIV.toll && R.civ.side[0].mil === 1 && R.civ.side[0].roe === 1, 'the review: by side killed, tickets, militia, holds (' + JSON.stringify(R.civ.side) + ')');
  ok(R.civ.turned.length === 1 && R.civ.turned[0].s === 1 && R.civ.evac === 1 && R.civ.back === 1 && R.civ.dead === 2, 'the towns that turned, evacuated and came home');
  ok(R.tickets[1].civ === CIV.toll && R.tickets[0].civ === CIV.toll, 'each side\'s tickets show what its civilians cost (civ, out of other)');
  const R0 = C.anaReport(ANA.ev, 0);
  ok(R0.civ.side[0] && R0.civ.side[1] === null, 'a side\'s view of a match on keeps the enemy\'s out');
  const B = C.anaBrief(R); ok(B.civ && JSON.stringify(B).length < 20000, 'the brief (the server\'s summary, the MCP\'s report) carries it');
}

const SECS = process.env.SECS === undefined ? 240 : +process.env.SECS;
if (SECS > 0) for (const era of ['modern', 'ww2']) {
  console.log('-- an AI × AI match on the map with the seat towns, ' + era + ', ' + SECS + ' s --');
  load({ seed: 41, mapv: 5, eco: true, ana: true });
  S = C.watch(era, { len: 0 }); T = S.T;
  let err = null, tkc = null;
  try { C.run(SECS, () => { if (S.civD && !S.cq.ph) { const D = S.civD; if (tkc === null && (D.tk[0] !== D.n[0] * CIV.toll || D.tk[1] !== D.n[1] * CIV.toll)) tkc = JSON.stringify(D); } }); } catch (e) { err = e; }
  ok(!err, 'it runs' + (err ? ': ' + err.stack : ''));
  const D = S.civD || { n: [0, 0], tk: [0, 0], dead: 0, roe: [0, 0], mil: [0, 0], evac: 0, back: 0, foe: {} }, cv = $('ANA').ev.filter(e => e.k === 'cv');
  console.log('   ' + S.civs.length + ' civilians, ' + D.dead + ' killed (side 0: ' + D.n[0] + ', side 1: ' + D.n[1] + '), tickets paid ' + D.tk + ', holds ' + D.roe + ', militia ' + D.mil + ', evacuations ' + D.evac + ' (home ' + D.back + '), towns turned ' + JSON.stringify(D.foe) + ', cv events ' + cv.length + ', seat towns ' + T.burgs.filter(b => b.seat !== undefined).length);
  ok(T.burgs.some(b => b.seat !== undefined) && S.civs.length > 10, 'the seat towns are there, with people');
  ok(tkc === null, 'every side\'s tickets for civilians are its deaths times ' + CIV.toll + (tkc ? ': ' + tkc : ''));
  ok(Object.keys(D.foe).every(bi => [0, 1].every(t => !(D.foe[bi] & (1 << t)) || D.hits[bi][t] >= CIV.rage.n)), 'a town turned only against a side that killed ' + CIV.rage.n + ' of its people');
  ok(cv.filter(e => e.c === 'kill').length === D.dead && cv.filter(e => e.c === 'roe').length === D.roe[0] + D.roe[1], 'the analytics have every death and every hold');
  ok(S.civs.every(c => [0, 1, 2, 3, 4, 5].includes(c.mode)) && !nan(S) && S.civs.every(c => Number.isFinite(c.x) && Number.isFinite(c.z)), 'every civilian in a known mode, nothing is NaN');
}
done();
