'use strict';
/* Abstract orders and routes (W21), through the one funnel genCmd, for the person at the chair, the AI general and the MCP model alike:
   ord (a verb and a target: the squads decide how; named squads, N the general picks, or N new units it creates), fort (trench, sandbag,
   bunker, anti-tank post, observation post, AA position, minefields, supply base: the general picks the builder), the support requests
   (req fire, recon, cas, lift: the general picks who answers) and rt, a route of waypoints on every order that sends squads to a place,
   walked in order and carried by the squad's mission (mis.route); the AI's flanks carry the composite route they walk. Refusals keep their
   reasons. With BEFORE=<commit|page>, the same seeded AI battle is compared with the page before W21 (SECS, default 90); without it that part is not run */
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const H = require('./harness'), ok = H.ok, SECS = +process.env.SECS || 90;
/* the radio's delay on the commander's orders (W15, tests/comms.js) is off here, so an order is in force as it is answered; one check below runs with it on */
const load = o => { const C = H.load(o); C.$('CN').on = 0; return C; };
const solo = (C, era) => C.newState(era, C.$('ERAS')[era].sides[0].fighter, { cls: 'plane' });
const park = S => { const P = S.my; if (P) { P.inv = 9; P.dead = false; P.y = 3000; P.v.y = 0; P.hp = P.def.hp; } S.lives = 9; };
const lead = q => q.men.find(m => !m.dead && !m.gone);
const near = (o, p) => Math.hypot(o.x - p.x, o.z - p.z);
/* the way passes within d m of p */
const via = (w, p, d) => { for (let i = 1; i < w.length; i++) { const a = w[i - 1], b = w[i], ex = b.x - a.x, ez = b.z - a.z, L = ex * ex + ez * ez || 1, t = Math.max(0, Math.min(1, ((p.x - a.x) * ex + (p.z - a.z) * ez) / L)); if (Math.hypot(p.x - a.x - ex * t, p.z - a.z - ez * t) < d) return true; } return false; };
const world = () => {
  const C = load({ seed: 7, mapv: 5 }), S = solo(C, 'modern');
  C.run(60, () => park(S));
  return { C, S, $: C.$, cmd: (c, by, t) => C.genCmd(t || 0, c, by || 'me') };
};
const free = (S, t) => S.squads.filter(q => q.team === (t || 0) && !q.net && q.live >= 2 && !q.state && !q.op && !q.lift && !q.rd && lead(q));
/* an empty battlefield with the points (map v5): nothing spawns, no manoeuvre or assault of the AI's; squads put down by hand; the planner each second */
const fresh = (era, eco) => {
  const C = load({ seed: 5, mapv: 5, eco }), $ = C.$; C.seed(7);
  const S = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' }); S.demo = false; S.over = true; S.units = []; S.planes = []; S.men = []; S.squads = []; for (const f of S.fld) f.next = 1e9;
  for (const t of [0, 1]) { const Cm = $('cmdOf')(t); Cm.mnT = 1e9; Cm.atkT = 1e9; }
  return { C, S, $ };
};
const sq = (C, t, x, z, job) => { const $ = C.$, p = $('railOf')(x, z), q = C.addSquad(t, x, z, p.ri, p.s); q.job = job || 'held'; q.jk = 0; q.col = false; $('setOrd')(q, { k: 'hold', ri: p.ri, s: p.s, x, z, R: 12 }); return q; };
const tick = (C, S, secs) => { for (let i = 0; i < secs; i++) { C.run(1, null, 1 / 20); for (const t of [0, 1]) C.$('plan')(t); } };
/* a dry, open place on side 0's half, 2 km from its base toward the middle */
const spot = (C, S) => { const b = S.base[0]; for (let d = 2000; d < 5000; d += 100) { const x = b.x + d, z = b.z * .5; if (C.$('gMapOk')(x, z) && C.$('gMapOk')(x + 600, z + 300) && C.$('gMapOk')(x - 300, z - 300)) return { x, z }; } return { x: b.x + 2000, z: b.z * .5 }; };

console.log('-- refusals --');
{
  const { C, S, cmd } = world(), b = S.base[0];
  ok(cmd({ c: 'ord', k: 'atk', pi: 7 }).why === 'ctl', 'without the chair: ctl');
  C.genCtl(0, 'me', { eco: 1, atk: 0, def: 1, sup: 1 });
  const L = lead(free(S)[0]), x = L.x + 80, z = L.z;
  ok(cmd({ c: 'ord', k: 'zz', x, z }).why === 'kind' && cmd({ c: 'fort', k: 'castle', x, z }).why === 'kind', 'an unknown verb or work: kind');
  ok(cmd({ c: 'ord', k: 'def', x, z, rt: [1, 2, 3] }).why === 'rt' && cmd({ c: 'ord', k: 'def', x, z, rt: 'x' }).why === 'rt', 'a ragged or a non-list route: rt');
  ok(cmd({ c: 'ord', k: 'def', x, z, rt: new Array(18).fill(0).map((v, i) => (i % 2 ? z : x + i)) }).why === 'rt', 'a route of nine points: rt');
  let wet = null; for (let i = 0; i < 4000 && !wet; i++) { const px = (i % 80) * S.W / 80, pz = ((i / 80 | 0) - 25) * S.HW / 25; if (Math.abs(pz) < S.HW - 60 && px > 60 && px < S.W - 60 && C.hgt(px, pz) < S.T.WL - 1) wet = { x: px, z: pz }; }
  ok(!wet || cmd({ c: 'move', x, z, ids: [free(S)[0].id], rt: [wet.x, wet.z] }).why === 'rt', 'a route point in the water: rt' + (wet ? '' : ' (no water found: skipped)'));
  ok(cmd({ c: 'ord', k: 'atk', pi: 99 }).why === 'at' && cmd({ c: 'ord', k: 'def', x: -5000, z: 0 }).why === 'map', 'no such point: at; off the map: map');
  const mine = S.cq.p.find(p => p.hold === 0 && p.base < 0) || S.cq.p.find(p => p.hold === 0);
  ok(cmd({ c: 'ord', k: 'atk', pi: S.cq.p.indexOf(mine) }).why === 'own', 'an attack on a point of ours named by its index: own');
  ok(cmd({ c: 'ord', k: 'atk', x: mine.x + 150, z: mine.z, n: 1 }).why !== 'own', 'an attack on a place 150 m from a point of ours is not taken for that point (no own)');
  const e = S.base[1];
  ok(cmd({ c: 'ord', k: 'def', x: e.x - 300, z: e.z, n: 2 }).why === 'way' && cmd({ c: 'ord', k: 'def', x, z, ids: [9999] }).why === 'sq', 'too far on foot for all of them: way; no such squad: sq');
  ok(cmd({ c: 'ord', k: 'amb', x, z, rt: [x, z] }).why === 'rt' && cmd({ c: 'req', k: 'cas', x, z, rt: [x, z] }).why === 'rt' && cmd({ c: 'fort', k: 'sup', x, z, rt: [x, z] }).why === 'rt', 'a route where it has no meaning (ambush, air support, supply base): rt');
  ok(cmd({ c: 'req', k: 'smoke', x, z }).why !== '' && !cmd({ c: 'req', k: 'smoke', x, z }).ok, 'there is no smoke request (smoke is the fire mission\'s own)');
  ok(cmd({ c: 'ord', k: 'esc', x: 60, z: S.HW - 60 }).why === 'esc', 'an escort with no own vehicle near: esc');
  const C2 = load({ seed: 7, mapv: 3 }), S2 = solo(C2, 'modern'); C2.run(30); C2.genCtl(0, 'me', { eco: 1, atk: 0, def: 1, sup: 1 });
  const q2 = S2.squads.find(q => q.team === 0 && q.live > 0 && lead(q)), L2 = q2 && lead(q2);
  ok(!!L2 && C2.genCmd(0, { c: 'ord', k: 'def', x: L2.x + 50, z: L2.z }, 'me').why === 'mv' && C2.genCmd(0, { c: 'move', x: L2.x + 50, z: L2.z, ids: [q2.id], rt: [L2.x + 20, L2.z] }, 'me').why === 'mv', 'before the road network (map v3): mv');
  ok(!!L2 && C2.genCmd(0, { c: 'move', x: L2.x + 50, z: L2.z, ids: [q2.id] }, 'me').ok, 'and the orders without a route are as they were there');
}

console.log('-- attack: N squads the general picks, each on its own axis --');
{
  const { C, S, $, cmd } = world(), pts = S.cq.p;
  C.genCtl(0, 'me', { eco: 1, atk: 0, def: 1, sup: 1 });
  const pi = pts.findIndex(p => p.hold === 1), P = pts[pi], r = cmd({ c: 'ord', k: 'atk', pi, n: 3, why: 'tomar a vila' }), op = S.cmd[0].ops.find(o => o.id === r.id);
  ok(r.ok && !!op && op.k === 'usr' && op.v === 'atk' && op.sq.length === 3, 'ord atk on ' + P.name + ' with n 3: a manual operation of 3 squads (' + (r.why || r.id) + ')');
  const qs = op ? op.sq.slice() : [], s0 = qs.map(q => q.ts);
  ok(qs.every(q => q.ord.k === 'assault' && q.ord.wp && q.ord.ax === P.x && q.mis.kind === 'attack' && q.mis.why === 'tomar a vila' && near(q.ord.wp[q.ord.wp.length - 1], P) < 1), 'each assaults the point along a way of its own, its mission attack with the general\'s words');
  const ring = $('W21').ring, form = qs.map(q => q.ord.wp.find(p => Math.abs(near(p, P) - ring) < 1)), axes = new Set(form.map(f => f && Math.round(Math.atan2(f.z - P.z, f.x - P.x) * 10)));
  ok(form.every(Boolean) && axes.size === 3, 'they form up ' + ring + ' m out on three axes before the assault');
  ok(S.glog.l[0].some(e => /^Ataque a .*: 3 esquadras por 3 eixos/.test(e.s)), 'the log says the attack and its axes');
  C.run(120, () => park(S));
  const gone = qs.map((q, i) => (q.tp ? q.ts - s0[i] : q.ord.wp.len - s0[i]));
  ok(qs.every((q, i) => !q.live || q.rd || q.fd < 300 || gone[i] > 400), 'two minutes on each has gone a good way along its way at a run (or rides, or fights): ' + gone.map(Math.round).join(', ') + ' m');
  ok(qs.every(q => !q.live || q.op === op), 'and the AI left them in the general\'s operation');
  const f = cmd({ c: 'free', ids: qs.map(q => q.id) });
  ok(f.ok && qs.every(q => !q.live || !q.op), 'free hands them back to the AI');
}

console.log('-- routes: defend through waypoints, move and assault with a route --');
{
  const { C, S, cmd } = world();
  C.genCtl(0, 'me', { eco: 1, atk: 0, def: 1, sup: 1 });
  const q = free(S).find(q => q.live >= 3), L = lead(q), T = { x: L.x + 500, z: L.z + 120 }, w1 = { x: L.x + 150, z: L.z - 200 }, w2 = { x: L.x + 380, z: L.z - 230 };
  const r = cmd({ c: 'ord', k: 'def', x: T.x, z: T.z, ids: [q.id], rt: [w1.x, w1.z, w2.x, w2.z] }), op = S.cmd[0].ops.find(o => o.id === r.id);
  ok(r.ok && op && op.rt.length === 2 && q.op === op && q.ord.k === 'hold', 'ord def with a route of two points: accepted (' + (r.why || r.id) + ')');
  ok(q.mis.kind === 'defend' && q.mis.route && q.mis.route.length === 2 && q.mis.route[1].x === w2.x, 'the squad\'s mission is defend and carries the route');
  ok(via(q.ord.wp, w1, 1) && via(q.ord.wp, w2, 1) && near(q.ord.wp[q.ord.wp.length - 1], T) < 80, 'its way passes the two points in order to the place');
  ok(q.ord.wp.findIndex(p => near(p, w1) < 1) < q.ord.wp.findIndex(p => near(p, w2) < 1), 'first the first point, then the second');
  let hit = [false, false];
  C.run(240, () => { park(S); const l = lead(q); if (l) { if (near(l, w1) < 45) hit[0] = true; if (hit[0] && near(l, w2) < 45) hit[1] = true; } return !(hit[1] && q.at); });
  ok(hit[0] && hit[1], 'the squad\'s leader went by the first point and then the second');
  const C3 = world(); C3.C.genCtl(0, 'me', { eco: 1, atk: 0, def: 1, sup: 1 });
  const q3 = free(C3.S).find(q => q.live >= 2), L3 = lead(q3), a = { x: L3.x + 120, z: L3.z + 150 };
  const m = C3.cmd({ c: 'move', x: L3.x + 260, z: L3.z, ids: [q3.id], rt: [a.x, a.z] });
  ok(m.ok && q3.ord.k === 'hold' && via(q3.ord.wp, a, 1) && q3.mis.route.length === 1 && C3.S.cmd[0].ops.find(o => o.id === m.id).o === 'move', 'move with a route: the same manual order, its way through the point');
  const s0 = C3.cmd({ c: 'assault', x: L3.x + 260, z: L3.z, ids: [q3.id], rt: [a.x, a.z] });
  ok(s0.ok && q3.ord.k === 'assault' && via(q3.ord.wp, a, 1), 'assault with a route as well');
  const s1 = C3.cmd({ c: 'move', x: L3.x + 260, z: L3.z, ids: [q3.id] });
  ok(s1.ok && !q3.ord.rt && !q3.mis.route, 'an order without a route leaves none on the mission');
}

console.log('-- recon, fortify and the requests: the general picks who answers --');
{
  const { C, S, $, cmd } = world();
  C.genCtl(0, 'me', { eco: 1, atk: 0, def: 1, sup: 1 });
  const rq = free(S).find(q => q.job === 'rec' || q.job === 'lp'), RL = lead(rq), R0 = { x: RL.x + 300, z: RL.z + 100 };
  const r = cmd({ c: 'req', k: 'recon', x: R0.x, z: R0.z }), op = S.cmd[0].ops.find(o => o.id === r.id);
  ok(r.ok && op && op.sq.length === 1 && ['rec', 'lp'].includes(op.sq[0].job) && op.sq[0].ord.k === 'observe' && op.sq[0].mis.kind === 'recon', 'req recon: the general sends one reconnaissance squad to observe (' + (op ? op.sq[0].job : r.why) + ')');
  const can = q => $('W21').jobs[q.job] && q.ord.k !== 'build' && q.ord.k !== 'supply' && !q.ord.b && !q.ord.T && !q.ord.tw;   // not one guarding a supply base or building
  const eng = free(S).find(q => q.job === 'eng' && can(q)), B = eng || free(S).find(can), BL = B && lead(B), F = BL ? { x: BL.x + 90, z: BL.z + 60 } : null;
  if (F) {
    const f = cmd({ c: 'fort', k: 'trench', x: F.x, z: F.z }), fo = S.cmd[0].ops.find(o => o.id === f.id), w = fo && fo.sq[0];
    ok(f.ok && w && (!eng || w === eng) && w.ord.dig && w.ord.dig.k === 1 && w.mis.kind === 'build', 'fort trench: the general picks ' + (eng ? 'the engineers' : 'the nearest free squad (no engineer free: ' + B.job + ')') + ', who go to dig (' + (f.why || f.id) + ')');
    C.run(150, () => park(S));
    ok(S.forts.some(o => o.team === 0 && o.k === 1 && near(o, F) < 40), 'they reach the place and a trench is started there');
  } else ok(false, 'no squad free to fortify with');
  const src = C.genQuery(0, { q: 'fire', k: 'he', x: R0.x + 400, z: R0.z }), f1 = cmd({ c: 'req', k: 'fire', x: R0.x + 400, z: R0.z });
  ok(f1.ok === !!src.src && (f1.ok || f1.why === 'fire'), 'req fire: accepted exactly when a mortar or battery reaches (' + (f1.why || 'ok') + ')');
  const air = S.planes.some(p => p.team === 0 && !p.dead && p.ai && (p.role === 'cas' || (p.heli && !p.def.lift))), ca = cmd({ c: 'req', k: 'cas', x: R0.x, z: R0.z });
  ok(ca.ok === air && (ca.ok ? S.cmd[0].umark && S.cmd[0].umark.x === R0.x && S.cmd[0].ufoc : ca.why === 'air'), 'req cas: the pilots\' mark and the air focus when an attack aircraft is up, else air (' + (ca.why || 'ok') + ')');
  const lq = free(S).find(q => q.live >= 2), LL = lead(lq), l = cmd({ c: 'req', k: 'lift', x: LL.x + 2500, z: LL.z, ids: [lq.id] }), lo = S.cmd[0].ops.find(o => o.id === l.id);
  ok(l.ok && lo && lo.ride === 1 && lq.ord.fast === 1 && lq.mis.kind === 'lift', 'req lift: a move at a run, in an operation the rides serve (' + (l.why || l.id) + ')');
}

console.log('-- the same funnel for the AI general --');
{
  const { C, S, cmd } = world(), L = lead(free(S)[0]);
  const a = cmd({ c: 'ord', k: 'def', x: L.x + 100, z: L.z, n: 1 }, 'ai');
  ok(a.ok && S.gj.some(e => e.by === 'ai' && e.c.c === 'ord' && e.ok), 'the AI orders through genCmd as well, and the journal keeps it');
  C.genCtl(0, 'me', { eco: 1, atk: 0, def: 0, sup: 1 });
  ok(cmd({ c: 'ord', k: 'def', x: L.x + 100, z: L.z, n: 1 }, 'ai').why === 'ctl' && cmd({ c: 'fort', k: 'trench', x: L.x + 100, z: L.z }, 'ai').why === 'ctl', 'with attack and defence the person\'s, the AI is told ctl');
  ok(cmd({ c: 'req', k: 'cas', x: L.x + 100, z: L.z }, 'ai').why !== 'ctl', 'support it still keeps: its requests are not ctl');
  const b = C.$('S').sup.find(o => !o.dead) || { kind: 'sup', sup: 1, name: 'Base de suprimento' };
  ok(C.$('helpWho')(b) === 'Base de suprimento', 'a supply base that answers a call for help is named, not a crash (helpWho: kind sup, no def)');
}

console.log('-- escort: the squads keep around a vehicle of ours --');
{
  const { C, S, $ } = fresh('modern'), cmd = c => C.genCmd(0, c, 'me');
  C.genCtl(0, 'me', { eco: 1, atk: 0, def: 0, sup: 1 });
  const A = spot(C, S), q1 = sq(C, 0, A.x, A.z), q2 = sq(C, 0, A.x + 30, A.z + 20), u = C.addUnit('tank', 0, A.x + 120, A.z + 40, $('S').E.sides[$('S').fac[0]].tanks[0], false);
  u.ai = null; u.x = A.x + 120; u.z = A.z + 40; u.y = C.hgt(u.x, u.z);   // a tank of ours parked there (addUnit puts a mobile one on its road)
  const r = cmd({ c: 'ord', k: 'esc', x: u.x + 30, z: u.z, n: 2 }), op = S.cmd[0].ops.find(o => o.id === r.id);
  ok(r.ok && op && op.esc === u && op.sq.length === 2 && op.sq.every(q => q.ord.k === 'hold' && q.mis.kind === 'escort' && near(q.ord, u) < 40), 'ord esc: two squads take places beside the tank, their mission escort (' + (r.why || r.id) + ')');
  const to = { x: u.x + 250, z: u.z + 60 };
  for (let i = 0; i < 10; i++) { C.run(1, () => { u.x = to.x; u.z = to.z; }, 1 / 20); for (const t of [0, 1]) $('plan')(t); }   // it drives 250 m on (held there: no driver)
  ok(op.sq.every(q => near(q.ord, u) < 40), 'the tank moves 250 m: within a few seconds their places follow it');
  u.dead = true; tick(C, S, 4);
  ok(op.over && S.glog.l[0].some(e => /Escolta encerrada/.test(e.s)), 'the tank is lost: the escort ends and the log says so');
}

console.log('-- create N: the general dispatches new units and hands them the order --');
{
  const { C, S, $ } = fresh('modern', true), cmd = c => C.genCmd(0, c, 'me');
  C.genCtl(0, 'me', { eco: 1, atk: 0, def: 0, sup: 1 });
  const P = S.cq.p.find(p => p.hold === 0 && p.base < 0), pi = S.cq.p.indexOf(P);
  for (const k of ['squad', 'tank']) { const d = S.eco.d[0]; (d.res[k] || (d.res[k] = [])).push('hq', 'hq'); }
  const r = cmd({ c: 'ord', k: 'def', pi, k2: 'squad', n: 1, why: 'reforçar' }), op = S.cmd[0].ops.find(o => o.k === 'w21p' && o.d === r.id);
  ok(r.ok && op && S.dsp.log[0].some(o => o.id === r.id), 'ord def with k2 squad: the General\'s dispatch fields a new squad from the reserve (order ' + (r.why || r.id) + '), and a pending op waits for it');
  const A = spot(C, S), q = sq(C, 0, A.x, A.z); q.mis.d = r.id;   // the squad that dispatch brings, on foot
  $('OPS').w21p(S.cmd[0], op);
  ok(q.op && q.op.k === 'usr' && q.op.v === 'def' && q.mis.kind === 'defend' && q.ord.k === 'hold' && near(q.ord, P) < 120, 'once on foot it is handed the defence of the point');
  const r2 = cmd({ c: 'ord', k: 'atk', x: S.base[1].x - 400, z: S.base[1].z, k2: 'tank', n: 1 });
  ok(r2.ok && S.units.some(u => u.mis && u.mis.d === r2.id && u.mis.kind === 'attack'), 'k2 tank: a new tank comes with an attack mission there (' + (r2.why || r2.id) + ')');
  ok(cmd({ c: 'ord', k: 'def', pi, k2: 'castle', n: 1 }).why === 'kind' && cmd({ c: 'ord', k: 'def', pi, k2: 'squad', ids: [1] }).why === 'shape', 'an unknown kind: kind; named squads and create together: shape');
  ok(cmd({ c: 'ord', k: 'atk', x: S.base[1].x - 400, z: S.base[1].z, k2: 'tank', n: 5 }).why === 'mkn', 'more new units than the dispatch fields at once (4): refused mkn, not cut short in silence');
  const r3 = cmd({ c: 'ord', k: 'def', pi, k2: 'squad', n: 1 }), op3 = S.cmd[0].ops.find(o => o.k === 'w21p' && o.d === r3.id);
  C.genCtl(0, 'ai');
  const B3 = spot(C, S), q3 = sq(C, 0, B3.x + 40, B3.z + 40); q3.mis.d = r3.id;
  $('OPS').w21p(S.cmd[0], op3);
  ok(r3.ok && op3 && op3.over && !(q3.op && q3.op.k === 'usr'), 'the chair given back: the pending order ends and a new squad that arrives stays the AI\'s (' + (r3.why || r3.id) + ')');
  const C2 = fresh('modern').C; C2.genCtl(0, 'me');
  ok(C2.genCmd(0, { c: 'ord', k: 'def', x: 3000, z: 0, k2: 'squad', n: 1 }, 'me').why === 'off', 'with the economy off there is nothing to create: off');
}

console.log('-- fortify: every kind, the general picks the builder --');
{
  const { C, S, $ } = fresh('modern'), cmd = c => C.genCmd(0, c, 'me');
  C.genCtl(0, 'me', { eco: 1, atk: 0, def: 0, sup: 1 });
  const K = { bunker: 4, atpost: 3, post: 5 }, A = spot(C, S), done = {};
  let i = 0;
  for (const k of Object.keys(K)) { const B = { x: A.x + 200 * i, z: A.z + 120 }, q = sq(C, 0, B.x - 60, B.z - 40, i ? 'held' : 'eng'); const r = cmd({ c: 'fort', k, x: B.x, z: B.z }); done[k] = { r, B, q }; i++; }
  ok(Object.values(done).every(d => d.r.ok && d.q.ord.dig && d.q.mis.kind === 'build'), 'bunker, anti-tank post, observation post: each builder walks out to dig (' + Object.values(done).map(d => d.r.why || 'ok') + ')');
  const AA = { x: A.x - 200, z: A.z + 300 }, qa = sq(C, 0, AA.x - 50, AA.z, 'held'), ra = cmd({ c: 'fort', k: 'aapos', x: AA.x, z: AA.z });
  const M = { x: A.x + 100, z: A.z - 300 }, qm = sq(C, 0, M.x - 50, M.z, 'eng'), rm = cmd({ c: 'fort', k: 'mineat', x: M.x, z: M.z, ids: [qm.id] });
  ok(ra.ok && rm.ok, 'an AA position and an anti-tank minefield are accepted (' + (ra.why || 'ok') + ', ' + (rm.why || 'ok') + ')');
  tick(C, S, 150);
  for (const k of Object.keys(K)) ok(S.forts.some(f => f.team === 0 && f.k === K[k] && near(f, done[k].B) < 40), k + ': the work (FORT kind ' + K[k] + ') is started at the place');
  ok(S.units.some(u => u.w21 && u.fixed && u.kind === 'aa' && u.team === 0 && near(u, AA) < 25), 'aapos: a fixed AA gun stands at the place');
  const ms = (S.mines || []).filter(o => o.team === 0 && !o.gone && near(o, M) < 30);
  ok(ms.length === $('W21').mf && ms.every(o => o.k === 0), 'mineat: a field of ' + $('W21').mf + ' anti-tank mines across the way (' + ms.length + ')');
  sq(C, 0, AA.x + 250, AA.z, 'held'); sq(C, 0, AA.x + 550, AA.z, 'held');
  ok(cmd({ c: 'fort', k: 'aapos', x: AA.x + 300, z: AA.z }).ok && cmd({ c: 'fort', k: 'aapos', x: AA.x + 600, z: AA.z }).why === 'max', 'with the economy off, at most ' + $('W21').aaCap + ' AA positions a side by order, those on their way counted: max');
  const C2 = fresh('modern', true), S2 = C2.S; C2.C.genCtl(0, 'me'); const d = S2.eco.d[0]; d.res.aaf = [];
  ok(C2.C.genCmd(0, { c: 'fort', k: 'aapos', x: AA.x, z: AA.z }, 'me').why === 'res', 'with the economy on and no fixed AA in the reserve: res');
}
{
  const { C, S } = fresh('modern'), A = spot(C, S);
  C.genCtl(0, 'me', { eco: 1, atk: 0, def: 0, sup: 1 });
  sq(C, 0, A.x - 60, A.z - 40, 'eng'); const r = C.genCmd(0, { c: 'fort', k: 'bunker', x: A.x, z: A.z }, 'me');
  tick(C, S, 150);
  const ls = S.glog.l[0].map(e => e.s).filter(s => s.startsWith('Obra de campanha iniciada'));
  ok(r.ok && S.forts.some(f => f.team === 0 && f.k === 4) && ls.length && ls.every(s => s === 'Obra de campanha iniciada: ninho de metralhadora'), 'a bunker by order: the log names the machine-gun nest it started, not a trench (' + ls + ')');
}
{
  const { C, S, $ } = fresh('modern'), cmd = c => C.genCmd(0, c, 'me'), cap = $('FORT').ai.cap;
  C.genCtl(0, 'me', { eco: 1, atk: 0, def: 0, sup: 1 });
  const A = spot(C, S), rs = [];
  for (let i = 0; i <= cap; i++) { const B = { x: A.x + 90 * i, z: A.z + 200 }; sq(C, 0, B.x, B.z - 120, 'eng'); rs.push(cmd({ c: 'fort', k: 'trench', x: B.x, z: B.z })); }
  ok(rs.slice(0, cap).every(r => r.ok) && rs[cap].why === 'fcap', cap + ' trenches ordered while their builders still walk are accepted; one more is refused fcap (' + rs.map(r => r.why || 'ok') + ')');
}

console.log('-- the AI general\'s flank walks a composite route; a person\'s flank walks his own --');
{
  const C = load({ seed: 5, mapv: 4 }), $ = C.$, S = (() => { C.seed(7); const S = C.newState('ww2', $('ERAS').ww2.sides[0].fighter, { cls: 'plane' }); S.demo = false; S.over = true; S.units = []; S.planes = []; S.men = []; S.squads = []; for (const f of S.fld) f.next = 1e9; return S; })();
  const P = S.cq.p, F = P.find(p => p.k === 'x'), W = S.T.net.n.find(n => n.id === 'W'), Cm = $('cmdOf')(0);
  const pool = [sq(C, 0, W.x - 40, W.z + 60, 'push'), sq(C, 0, W.x + 20, W.z + 90, 'push')], fr = [sq(C, 0, W.x - 80, W.z - 40), sq(C, 0, W.x - 60, W.z + 20), sq(C, 0, W.x - 30, W.z - 30), sq(C, 0, W.x + 30, W.z - 60)];
  const ax = $('routeAt')(S.T.routes[0], 6253), foe = [0, 1, 2].map(i => sq(C, 1, ax.x + i * 40, ax.z));
  for (const q of foe) for (const m of q.men) { m.seenT = S.t; m.sx = m.x; m.sz = m.z; }
  $('cmdSense')(Cm, S.squads.filter(q => q.team === 0));
  const host = $('atkOpen')(Cm, { ri: F.ri, s: F.s, x: F.x, z: F.z, tw: F }, -1, pool, false, 16, 10); host.ri = 0;
  const X = { t: 0, C: Cm, sq: fr, free: fr, room: fr.length - $('MAN').keep, doc: 'balanced', ds: -1, live: Cm.man }, g = $('MANG').flk(Cm, X)[0];
  ok(!!g && Array.isArray(g.spec.rt) && g.spec.rt.length >= 1, 'the AI\'s flank plan names its route: ' + (g && g.spec.rt ? g.spec.rt.length + ' turning point(s)' : 'none'));
  const r = C.genCmd(0, { c: 'man', k: 'flank', pi: F.i, n: g.spec.n, rt: $('gRtFlat')(g.spec.rt) }, 'ai', { spec: g.spec, res: g.res }), op = Cm.ops.find(o => o.id === r.id);
  ok(r.ok && op && op.sq.every(q => q.ord.k === 'flank' && Array.isArray(q.ord.rt) && q.ord.rt.length >= 1 && q.mis.route && q.mis.route.length === q.ord.rt.length && q.ord.rt.every(p => via(q.ord.wp, p, 1))), 'its squads walk that composite way, and their orders and missions carry its turning points as the route');
  ok(S.gj.some(e => e.by === 'ai' && e.c.c === 'man' && Array.isArray(e.c.rt) && e.c.rt.length >= 2), 'the AI\'s command in the journal carries the route (rt)');
  $('opEnd')(Cm, op); Cm.mcd = {};
  const edge = { x: 20, z: 0 };   // 20 m from the map's edge: no route point (gMapOk keeps 50 m)
  ok(!$('gMapOk')(edge.x, edge.z) && $('gRtOf')([{ x: 420, z: -300 }, edge, { x: 420, z: 300 }]) === undefined, 'a turning point off the map is not named as a route point');
  const sp = Object.assign({}, g.spec, { rt: g.spec.rt.concat([edge]) }), r3 = C.genCmd(0, { c: 'man', k: 'flank', pi: F.i, n: sp.n, rt: $('gRtFlat')(sp.rt) }, 'ai', { spec: sp, res: g.res });
  ok(r3.ok, 'the AI\'s own flank is not refused by its descriptive route (' + (r3.why || r3.id) + ')');
  const op3 = Cm.ops.find(o => o.id === r3.id); if (op3) $('opEnd')(Cm, op3); Cm.mcd = {};
  C.genCtl(0, 'me');
  const w = { x: W.x + 300, z: W.z - 400 }, r2 = C.genCmd(0, { c: 'man', k: 'flank', pi: F.i, n: 1, rt: [w.x, w.z] }, 'me'), op2 = Cm.ops.find(o => o.id === r2.id);
  ok(r2.ok && op2 && op2.sq.length === 1 && via(op2.sq[0].ord.wp, w, 1) && op2.sq[0].mis.route[0].x === w.x, 'a person\'s flank with a route: the squad walks through his point (' + (r2.why || r2.id) + ')');
  if (op2) $('opEnd')(Cm, op2); Cm.mcd = {};
  ok(C.genCmd(0, { c: 'man', k: 'flank', pi: F.i, n: 1, rt: [1, 2, 3] }, 'me').why === 'rt', 'and a malformed route there: rt');
  let far = null; for (const x of [200, S.W / 2, S.W - 200]) for (const z of [-S.HW + 200, 0, S.HW - 200]) if ($('gMapOk')(x, z) && (!far || near(W, { x, z }) > near(W, far))) far = { x, z };
  if (far && near(W, far) + near(far, F) > $('W21').max) ok(C.genCmd(0, { c: 'man', k: 'flank', pi: F.i, n: 1, rt: [far.x, far.z] }, 'me').why === 'way', 'a route with no way on foot (longer than ' + $('W21').max / 1000 + ' km): way, not the AI\'s way in silence');
  else console.log('  skip  no point far enough for the way check');
}

console.log('-- a fire request among civilians in sight: the rules of engagement of whoever asked (as the fire mission T) --');
{
  /* the oracle is the fire mission's own contract (tests/civ-war.js): a model's strike there is refused roe, a person's is accepted as theirs
     (M.usr) with a warning, the AI's own is not weighed by roeHeld at the order */
  const C = load({ seed: 37 }), $ = C.$, S = $('sandbox')('modern'); $('cqInit')(1); $('civBegin')(); $('civInit')(); C.run(2);
  const n = new Map(); for (const c of S.civs) if (c.g && c.g.b) n.set(c.g, (n.get(c.g) || 0) + 1);
  const g = [...n.keys()].sort((a, b) => n.get(b) - n.get(a))[0], b = g.b, Cm = $('cmdOf')(0);
  const L = S.civs.filter(c => c.g === g && !c.dead && !c.gone && !c.in).slice(0, 6), p = { x: L[0].x, z: L[0].z };
  const art = C.addUnit('art', 0, b.x > S.W / 2 ? b.x - 3000 : b.x + 3000, b.z, S.E.sides[S.fac[0]].art, true);
  const pin = () => L.forEach((o, i) => { if (o.dead) return; o.mode = 2; o.goal = null; o.v = { x: 0, y: 0, z: 0 }; o.in = null; o.x = p.x + (i % 3) * 3; o.z = p.z + Math.floor(i / 3) * 3; o.sn = [S.t, -1e9]; });
  const live = () => Cm.fm.filter(M => !M.dead && S.t < M.T && M.k === 'he'), clear = () => { for (const M of Cm.fm) M.dead = true; };
  pin(); C.run(.05, pin); pin();
  C.genCtl(0, 'mcp', { eco: 0, atk: 0, def: 0, sup: 0 });
  let r = C.genCmd(0, { c: 'req', k: 'fire', x: p.x, z: p.z, n: 3 }, 'mcp');
  ok(!r.ok && r.why === 'roe' && live().length === 0, 'a model\'s fire request there: refused roe, as its fire mission is (' + (r.why || 'accepted') + ')');
  clear(); C.genCtl(0, 'me', { eco: 0, atk: 0, def: 0, sup: 0 }); pin();
  const n0 = S.glog.l[0].length;
  r = C.genCmd(0, { c: 'req', k: 'fire', x: p.x, z: p.z, n: 3 }, 'me');
  const warn = S.glog.l[0].slice(n0).some(e => e.k === 'fire' && /civis à vista e alvo não identificado/.test(e.s));
  ok(r.ok && live().length === 1 && live()[0].usr && warn, 'a person\'s fire request there: accepted as theirs (M.usr), with the warning (' + (r.why || 'accepted') + ')');
  clear(); pin();
  r = C.genCmd(0, { c: 'ord', k: 'fire', x: p.x, z: p.z, n: 3 }, 'me');
  ok(r.ok && live().length === 1 && live()[0].usr, 'and the verb fire of an order of theirs, the same (' + (r.why || 'accepted') + ')');
  clear(); pin();
  /* a 'create N' fire order: once a new battery is in range its strike goes through the same rules, by whoever ordered it */
  art.mis = Object.assign(art.mis || {}, { d: 'w21t' });
  const made = by => { const o = { k: 'w21p', id: 'w21t' + by, d: 'w21t', v: 'fire', by, team: 0, T0: S.t, sq: [], veh: [], over: false, kz: p, done: new Set(), c: { c: 'ord', k: 'fire', x: p.x, z: p.z } }; Cm.ops.push(o); $('OPS').w21p(Cm, o); return o; };
  const n1 = S.glog.l[0].length, o1 = made('me');
  ok(o1.over && live().length === 1 && live()[0].usr && S.glog.l[0].slice(n1).some(e => /civis à vista e alvo não identificado/.test(e.s)), 'a person\'s create-N fire there: the new battery\'s strike is theirs (M.usr), with the warning');
  clear(); C.genCtl(0, 'mcp', { eco: 0, atk: 0, def: 0, sup: 0 }); pin();
  const n2 = S.glog.l[0].length, o2 = made('mcp');
  ok(o2.over && live().length === 0 && S.glog.l[0].slice(n2).some(e => e.s.includes($('GEN').no.roe)), 'a model\'s create-N fire there: no strike, and the log says why (roe)');
  clear(); C.genCtl(0, 'me'); pin();
  r = C.genCmd(0, { c: 'req', k: 'fire', x: p.x, z: p.z, n: 3 }, 'ai');
  ok(r.ok && live().length === 1 && !live()[0].usr, 'the AI\'s own fire request: queued, its battery\'s rules weigh it when it fires (' + (r.why || 'accepted') + ')');
}

console.log('-- with the radio on (W15): the order is on its way, then in force with its route and words --');
{
  /* oracle: CN.in, the published radio delay inside the HQ's reach (2 to 5 s); before it the squad keeps its old order, after it the attack */
  const C = H.load({ seed: 7, mapv: 5 }), S = solo(C, 'modern'), $ = C.$; C.run(60, () => park(S)); C.genCtl(0, 'me', { eco: 1, atk: 0, def: 1, sup: 1 });
  const pi = S.cq.p.findIndex(p => p.hold === 1), P = S.cq.p[pi], r = C.genCmd(0, { c: 'ord', k: 'atk', pi, n: 2, why: 'tomar a vila' }, 'me'), op = S.cmd[0].ops.find(o => o.id === r.id), qs = op ? op.sq.slice() : [];
  ok(r.ok && qs.length === 2 && qs.every(q => q.cnP && q.cnP.O.k === 'assault' && q.ord.k !== 'assault'), 'answered ok at once, the attack on its way by radio (' + (r.why || r.id) + ')');
  C.run($('CN').in[1] + 1, () => park(S));
  ok(qs.every(q => !q.cnP && q.ord.k === 'assault' && q.ord.wp && near(q.ord.wp[q.ord.wp.length - 1], P) < 1 && q.mis.kind === 'attack' && q.mis.why === 'tomar a vila'), 'within ' + ($('CN').in[1] + 1) + ' s each squad assaults along its own way, its mission attack with the general\'s words');
}

console.log('-- nothing changes a battle no one commands --');
{
  const print = (C, S) => { let s = 0; for (const k of ['men', 'units', 'planes']) for (const o of S[k]) s += o.x * 1.3 + o.z + (o.hp || 0); return [S.men.length, S.units.length, S.squads.length, s.toFixed(6), C.$('Math').random().toFixed(12)].join(' '); };
  const run = page => { const C = H.load({ seed: 23, mapv: 5, page }), S = solo(C, 'modern'); C.run(SECS, () => park(S)); return print(C, S); };
  /* opt-in: BEFORE=<commit> (its page, by git show) or BEFORE=<page>, the page before W21 */
  const B0 = process.env.BEFORE || '';
  let BEFORE = '';
  if (B0 && fs.existsSync(B0)) BEFORE = path.resolve(B0);
  else if (B0) { BEFORE = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'w21-')), 'before.html'); fs.writeFileSync(BEFORE, execFileSync('git', ['show', B0 + ':Céu de Ferro 3D.html'], { cwd: H.ROOT, maxBuffer: 64 << 20 })); }
  if (BEFORE) { const A = run(), B = run(BEFORE); ok(A === B, 'the same seeded AI battle, ' + SECS + ' s, as on the page before the abstract orders (' + B0 + '): ' + A); }
  else console.log('  not run: the comparison with the page before the abstract orders (set BEFORE=<commit|page>)');
}
H.done();
