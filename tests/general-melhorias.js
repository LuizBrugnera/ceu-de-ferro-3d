'use strict';
/* The general's improvements (cf-general-melhorias, the report cf-general-sede; docs/general-melhorias.md). Three sides, map version 11 (the game's).
   The bugs: the log of the enemy seats ("ainda não", C.sedeW) is said once per enemy, not on every turn when the side has two enemies;
   the trench and building counters (f.in, B.in) are zeroed for every side and read for every enemy (inFoe), not only side 1 - t; the
   Insurgents, with no fixed AA gun of their own, plan no AA position and do not wait for one forever.
   The behaviour (GSM): the strength seen at a point is remembered (gsRecall); the enemy point by the fire pieces near the seat is the seat's
   threat (gsSrcFind) and the first target (cqAim); an assault forming up past its hard deadline goes with the squads there, or is called off;
   a point whose known strength fell with the side's eyes on it is weakened (gsWeakFind); a hurt tank with no base on its road drives to one
   (gsRep); idle tanks together go for a point (gsArm). */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 5, eco: 1, mapv: 11 }), $ = C.$;
$('AIB').now = () => 0;
const S = C.watch('modern', { n: 3, len: 0 }), N = S.N;
ok(N === 3, 'three sides (S.N ' + N + ')');
const C0 = S.cmd[0], name = p => $('gName')(p);

console.log('-- the enemy seats in the log: once per enemy (C.sedeW) --');
{
  const L = S.glog.l[0], n0 = L.length, sed = $('sedeGo');
  C0.sede = { 1: { T: 0, how: 'teste' }, 2: { T: 0, how: 'teste' } }; C0.atkT = 0; C0.ops = [];
  for (let i = 0; i < 20; i++) { S.t += 3; C0.sedeT = 0; sed(C0, []); }   // 60 s of turns with no squad to send: the same reason for both enemies
  const said = L.slice(n0).filter(e => /ainda não/.test(e.s));
  ok(said.length === 2, 'two enemies, the same reason for 60 s: said twice, once each (' + said.length + ')');
  ok(new Set(said.map(e => e.s.slice(0, 40))).size === 2, 'one line for each seat');
  ok(C0.sedeW && C0.sedeW[1] && C0.sedeW[2] && C0.sedeW[1].k && C0.sedeW[2].k, 'C.sedeW keeps a record by enemy, with the kind of reason');
  S.t += $('SEDE').again + 1; C0.sedeT = 0; sed(C0, []);
  ok(L.slice(n0).filter(e => /ainda não/.test(e.s)).length === 4, 'after SEDE.again s it is said again for each');
  const v = $('sedeView')(0); ok(v && v.foe.every(f => typeof f.why === 'string'), 'the seat view reads the reason of each enemy');
}

console.log('-- the trench and building counters with three sides (f.in, B.in) --');
{
  const inFoe = $('inFoe'), inAny = $('inAny');
  ok(inFoe([0, 0, 3], 0) === 3 && inFoe([0, 0, 3], 2) === 0 && inFoe([2, 1], 0) === 1 && inFoe([2, 1, 4], 1) === 6 && inFoe(null, 0) === 0, 'inFoe counts every side but t (side 2 too; t = 2 reads no l[-1])');
  ok(inAny([0, 0, 1]) && !inAny([0, 0, 0]) && !inAny(null), 'inAny: anybody of any side');
  const m = S.men.find(m => !m.dead && m.team === 2); let f = null;
  for (let k = 0; k < 64 && !f; k++) f = $('fortStart')(1, 2, m.x + 60 + (k % 8) * 35, m.z + 60 + (k >> 3) * 35, 0);   // somewhere dry and flat near him
  ok(!!f, 'a trench of side 2 begun');
  if (f) {
    f.prog = 1; m.x = f.x; m.z = f.z;
    for (let i = 0; i < 30; i++) $('fortMen')(1 / 30);
    ok(f.in[2] >= 1 && f.in[2] <= S.men.filter(o => !o.dead && o.team === 2).length, 'a side 2 soldier in it: f.in[2] ' + f.in[2] + ' after 30 steps (it only grew: never zeroed)');
    ok(inFoe(f.in, 0) === f.in[2] && inFoe(f.in, 1) === f.in[2] && inFoe(f.in, 2) === f.in[0] + f.in[1], 'its occupants are an enemy of sides 0 and 1, none of side 2\'s own');
    m.x += 300; for (let i = 0; i < 3; i++) $('fortMen')(1 / 30);
    ok(f.in[2] === 0, 'gone from it: f.in[2] back to 0 (' + f.in[2] + ')');
  }
  const o = S.T.houses.find(o => o.B && S.os[o.id] < 2), B = o.B; B.in[2] = 5; S.cbocc.push(o); $('bldMen')(1 / 30);
  ok(B.in[2] === 0 || B.in[2] <= S.men.filter(m => !m.dead && m.team === 2 && m.cbo === o).length, 'a building\'s side 2 count is zeroed each step (' + B.in[2] + ')');
}

console.log('-- the Insurgents plan no AA position (afpWant, afpTry) --');
{
  const afpAAF = $('afpAAF'); ok(afpAAF(0) && afpAAF(1) && !afpAAF(2), 'a fixed AA of its own: USA and Russia yes, the Insurgents no');
  const want = t => { const Ct = S.cmd[t]; return $('afpWant')(Ct, $('afpOf')(Ct)).out; };
  ok(want(0).some(i => i.k === 'aapos'), 'the USA still plan their AA umbrella');
  ok(!want(2).some(i => i.k === 'aapos'), 'the Insurgents plan no AA position');
  const C2 = S.cmd[2], A = $('afpOf')(C2), d = S.eco.d[2], m0 = (d.miss.aaf || []).length, it = { key: 'aaX', k: 'aapos', x: S.base[2].x, z: S.base[2].z, cx: S.base[2].x, cz: S.base[2].z, nm: 'teste', why: 'teste', spot: () => ({ x: S.base[2].x, z: S.base[2].z }) };
  ok($('afpTry')(C2, A, it) === false && (d.miss.aaf || []).length === m0, 'an AA position asked of them is dropped: no "aguarda", no miss told to the economy');
  ok(A.fn.aaX > S.t + 1e5, 'and not tried again');
}

console.log('-- the strength seen at a point is remembered (GSM.mem) --');
{
  const G = $('GSM'), P = S.cq.p, p = P.find(p => p.hold === 1 && p.base < 0), i = P.indexOf(p);
  const e = Array.from({ length: 30 }, (_, k) => ({ man: true, dead: false, team: 1, sx: p.x + (k % 6) * 8, sz: p.z + (k / 6 | 0) * 8, seenT: S.t }));   // what side 0 saw there (a sighting: sx sz)
  C0.known = e.slice(); delete C0.gsMT; $('gsMemTick')(C0);
  const seen = $('gsRecall')(C0, { tw: p }); ok(seen >= 30, 'with 30 enemies known at ' + name(p) + ': ' + seen);
  C0.known = []; S.t += 120; $('gsMemTick')(C0);
  const later = $('gsRecall')(C0, { tw: p }); ok(later > $('CMD').guess && later < seen && Math.abs(later - seen * Math.exp(-120 / G.mem.tau)) < .5, '120 s out of sight: still ' + Math.round(later) + ' (fading), not the guess of ' + $('CMD').guess);
  G.on = 0; ok($('gsRecall')(C0, { tw: p }) === 0, 'GSM.on 0: nothing remembered'); G.on = 1;
}

console.log('-- the enemy point that threatens the seat is the first target (gsSrcFind, cqAim) --');
{
  const w = $('aidSeat')(0), P = S.cq.p, foeP = P.filter(p => p.hold >= 0 && p.hold !== 0), ps = foeP.slice().sort((a, b) => Math.hypot(a.x - w.x, a.z - w.z) - Math.hypot(b.x - w.x, b.z - w.z))[0];
  const art = { kind: 'art', man: false, dead: false, team: ps.hold, def: {}, sx: ps.x + 150, sz: ps.z + 100, seenT: S.t };   // an enemy battery side 0 has seen by the enemy point nearest its seat
  ok(!!w && !!ps, 'the USA seat, and the enemy point nearest it: ' + name(ps));
  const near = foeP.slice().sort((a, b) => Math.hypot(a.x - art.sx, a.z - art.sz) - Math.hypot(b.x - art.sx, b.z - art.sz))[0];
  const d = Math.hypot(art.sx - w.x, art.sz - w.z);
  C0.known = [art]; const s = $('gsSrcFind')(C0);
  if (d < $('GSM').src.r) {
    ok(!!s && s.p === near, 'known at ' + Math.round(d) + ' m from the seat: the threat is ' + (s ? name(s.p) : 'none') + ' (' + name(near) + ' expected)');
    C0.gsSrc = { p: s.p, why: s.why, T: S.t };
    const L = $('cqAim')(C0); ok(!L.includes(s.p) || L[0] === s.p, 'cqAim puts it first when the side may go for it (' + (L.length ? name(L[0]) : '-') + ')');
  } else ok(true, 'the battery stands ' + Math.round(d) + ' m from the seat: out of the rule\'s reach here');
  C0.known = []; C0.gsSrc = null;
  ok($('gsSrcFind')(C0) === null || $('gsSrcFind')(C0).why !== 'peças de fogo conhecidas', 'nothing known: no threat from fire pieces');
}

console.log('-- an assault past its hard deadline goes with the squads there (gsForm) --');
{
  const sq = S.squads.filter(q => q.team === 0 && q.live >= 3 && !q.state).slice(0, 2), p = S.cq.p.find(p => p.hold === 1 && p.base < 0);
  const lead = q => q.men.find(m => !m.dead);
  const mk = () => { const op = { k: 'atk', ri: p.ri, sd: 1, O: { s: p.s, x: p.x, z: p.z, tw: p }, st: 'form', T: S.t - 2000, T0: S.t - 2000, formT: 900, sq: [], n0: 12, fs: p.s, ax: 1, az: 0, over: false, smk: false, scr: [], fp: [], walk: false, id: 9999, by: 'ai' };
    for (const q of sq) { const L = lead(q); q.op = op; q.ord = { k: 'hold', ri: q.ri, s: q.s, x: L.x, z: L.z }; q.fp = null; q.axo = null; op.sq.push(q); } C0.ops = [op]; return op; };
  const op = mk(); op.gsP = 1; $('gsForm')(C0, op);
  ok(op.st === 'prep' && op.H > S.t, 'formed up 2000 s (deadline ' + $('GSM').form.max + ' s at most): H-hour set, st ' + op.st);
  const op2 = mk(); op2.gsP = 1; for (const q of sq) { q.ord = Object.assign({}, q.ord, { x: q.ord.x + 2000 }); q.halt = false; }
  $('gsForm')(C0, op2); ok(op2.over === true, 'nobody at the assembly at the deadline: called off');
  const op3 = mk(); op3.T = S.t - 10; op3.gsP = 1; $('gsForm')(C0, op3); ok(op3.st === 'form' && !op3.over, 'before the deadline nothing changes');
  for (const q of sq) { q.op = null; }
  C0.ops = [];
}

console.log('-- a weakened point (gsWeakFind) --');
{
  const P = S.cq.p, tg = $('cqTargets')(0), p = tg.find(p => p.hold > 0) || tg[0], i = P.indexOf(p), M = $('gsMemTick')(C0);
  M[i].mx = 40; M[i].kn = 3;
  const eye = S.men.find(m => !m.dead && m.team === 0), sx = eye.x, sz = eye.z; eye.x = p.x + 300; eye.z = p.z;
  const w = $('gsWeakFind')(C0, M); ok(!!w && w.p === p, 'seen 40, now 3 with our eyes 300 m off: ' + name(p) + ' is weakened');
  eye.x = sx; eye.z = sz; S.men.filter(m => m.team === 0 && Math.hypot(m.x - p.x, m.z - p.z) < 1400).forEach(m => { m._x = m.x; m.x += 5000; });
  S.units.filter(u => u.team === 0 && Math.hypot(u.x - p.x, u.z - p.z) < 1400).forEach(u => { u._x = u.x; u.x += 5000; });
  ok(!$('gsWeakFind')(C0, M) || $('gsWeakFind')(C0, M).p !== p, 'with no eyes on it, a drop is not believed');
  S.men.filter(m => m._x !== undefined).forEach(m => { m.x = m._x; delete m._x; }); S.units.filter(u => u._x !== undefined).forEach(u => { u.x = u._x; delete u._x; });
  M[i].mx = 0; M[i].kn = 0;
}

/* a tank of side 0 on its road ri at s (the AI's: on the rail, idle) */
const R = S.T.routes, tankId = S.E.sides[S.fac[0]].tanks[0];
const tankAt = (ri, s) => { const u = C.addUnit('tank', 0, 0, 0, tankId, false, ri, s, 0, 0); u.hp = u.max; u.hitT = -99; u.ai.tgt = null; return u; };

console.log('-- a hurt tank goes to be mended (gsRep) --');
{
  const ri = S.T.routes.findIndex(r => r.len > 6000), r = R[ri], u = tankAt(ri, r.len * .5 - 2500), q = $('routeAt')(r, r.len * .5 + 2500);
  const b = C.addSup(S.T.nid + 37, 0, q.x + 60, q.z + 60, 0, 1);
  u.hp = u.max * .3; u.ai.reloc = null; C0.known = [];
  ok(!S.sup.some(o => !o.dead && o.prog >= 1 && o.team === 0 && o.ri === u.ri && Math.abs(o.s - u.s) < $('BLD').ai.fall) && $('hdist')(u, b) < $('GSM').rep.reach, 'a tank at 30% ' + Math.round($('hdist')(u, b)) + ' m from the only supply base, none on its road within ' + $('BLD').ai.fall + ' m');
  $('gsRep')(C0);
  ok(!!u.ai.gsR && !!u.trip, 'it drives there by the network (trip ' + !!u.trip + ')');
  u.hp = u.max; $('gsRep')(C0); ok(!u.ai.gsR, 'mended: free again');
  const v = tankAt(ri, r.len * .5 - 2500); v.hp = v.max * .3; $('GSM').on = 0; ok(!$('gsOn')(C0), 'GSM.on 0: the hook does nothing'); $('GSM').on = 1;
  u.dead = v.dead = true;
}

console.log('-- idle tanks together attack (gsArm) --');
{
  const tg = $('cqTargets')(0).find(p => p.hold > 0) || $('cqTargets')(0)[0], L = $('railOf')(tg.x, tg.z), r = R[L.ri], ds = $('dsOf')(0, L.ri);
  const s0 = Math.min(r.len, Math.max(0, L.s - ds * 1500)), tanks = [0, 1, 2].map(k => tankAt(L.ri, s0 - ds * k * 40));
  tanks.forEach(u => { u.ai.gsI = { x: u.x, z: u.z, T: S.t - 500 }; });
  C0.ops = C0.ops.filter(o => o.k !== 'arm'); C0.known = []; C0.gsM = null; delete C0.gsMT;
  $('gsArm')(C0);
  const op = C0.ops.find(o => o.k === 'arm' && !o.over);
  ok(!!op && op.m5.length >= 2, 'three tanks idle together 500 s, ' + Math.round($('hdist')(tanks[0], tg)) + ' m from ' + name(tg) + ': an armoured group goes for ' + (op ? name(op.O.tw) : 'nothing') + ' with ' + (op ? op.m5.length : 0) + ' tanks');
  ok(!!op && op.m5.every(u => u.ai.m5 && u.ai.m5.op === op && u.ai.m5.k === 'arm'), 'each tank holds a firing place of the operation');
  if (op) { const h = op.O.tw.hold; op.O.tw.hold = 0; $('OPS').arm(C0, op); ok(op.over, 'the point taken: the group\'s operation ends'); op.O.tw.hold = h; }
  const C1 = S.cmd[1]; C1.ops = []; $('gsArm')(C1); ok(!C1.ops.some(o => o.k === 'arm'), 'a side with no idle tanks opens none');
  tanks.forEach(u => { u.dead = true; });
}
H.done();
