'use strict';
/* Abstract orders and routes (W21), through the one funnel genCmd, for the person at the chair, the AI general and the MCP model alike:
   ord (a verb and a target: the squads decide how; named squads or N the general picks), fort (the general picks the builder), the support
   requests (req fire, smoke, recon, cas, lift: the general picks who answers) and rt, a route of waypoints on every order that sends squads
   to a place, walked in order and carried by the squad's mission (mis.route). Refusals keep their reasons, and nothing here draws from the
   sim's random stream or changes a battle no one commands. BEFORE=<an older page>: the same seeded AI battle there and here (SECS, default 90) */
const fs = require('fs'), path = require('path');
const H = require('./harness'), ok = H.ok, SECS = +process.env.SECS || 90;
const solo = (C, era) => C.newState(era, C.$('ERAS')[era].sides[0].fighter, { cls: 'plane' });
const park = S => { const P = S.my; if (P) { P.inv = 9; P.dead = false; P.y = 3000; P.v.y = 0; P.hp = P.def.hp; } S.lives = 9; };
const lead = q => q.men.find(m => !m.dead && !m.gone);
const near = (o, p) => Math.hypot(o.x - p.x, o.z - p.z);
/* the way passes within d m of p */
const via = (w, p, d) => { for (let i = 1; i < w.length; i++) { const a = w[i - 1], b = w[i], ex = b.x - a.x, ez = b.z - a.z, L = ex * ex + ez * ez || 1, t = Math.max(0, Math.min(1, ((p.x - a.x) * ex + (p.z - a.z) * ez) / L)); if (Math.hypot(p.x - a.x - ex * t, p.z - a.z - ez * t) < d) return true; } return false; };
const world = () => {
  const C = H.load({ seed: 7, mapv: 5 }), S = solo(C, 'modern');
  C.run(60, () => park(S));
  return { C, S, $: C.$, cmd: (c, by, t) => C.genCmd(t || 0, c, by || 'me') };
};
const free = (S, t) => S.squads.filter(q => q.team === (t || 0) && !q.net && q.live >= 2 && !q.state && !q.op && !q.lift && !q.rd && lead(q));

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
  ok(cmd({ c: 'ord', k: 'atk', pi: S.cq.p.findIndex(p => p.hold === 0) }).why === 'own', 'an attack on a point of ours: own');
  const e = S.base[1];
  ok(cmd({ c: 'ord', k: 'def', x: e.x - 300, z: e.z, n: 2 }).why === 'way' && cmd({ c: 'ord', k: 'def', x, z, ids: [9999] }).why === 'sq', 'too far on foot for all of them: way; no such squad: sq');
  ok(cmd({ c: 'ord', k: 'amb', x, z, rt: [x, z] }).why === 'rt' && cmd({ c: 'req', k: 'cas', x, z, rt: [x, z] }).why === 'rt' && cmd({ c: 'fort', k: 'sup', x, z, rt: [x, z] }).why === 'rt', 'a route where it has no meaning (ambush, air support, supply base): rt');
  const C2 = H.load({ seed: 7, mapv: 3 }), S2 = solo(C2, 'modern'); C2.run(30); C2.genCtl(0, 'me', { eco: 1, atk: 0, def: 1, sup: 1 });
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
}

console.log('-- nothing changes a battle no one commands --');
{
  const print = (C, S) => { let s = 0; for (const k of ['men', 'units', 'planes']) for (const o of S[k]) s += o.x * 1.3 + o.z + (o.hp || 0); return [S.men.length, S.units.length, S.squads.length, s.toFixed(6), C.$('Math').random().toFixed(12)].join(' '); };
  const run = page => { const C = H.load({ seed: 23, mapv: 5, page }), S = solo(C, 'modern'); C.run(SECS, () => park(S)); return print(C, S); };
  const A = run(), B = run();
  ok(A === B, 'the same seeded battle twice, ' + SECS + ' s: ' + A);
  const BEFORE = process.env.BEFORE ? path.resolve(process.env.BEFORE) : '';
  if (BEFORE && fs.existsSync(BEFORE)) ok(run(BEFORE) === A, 'and the same as on ' + path.basename(BEFORE));
  else console.log('  skip  BEFORE=<an older page>: the comparison with the page before the abstract orders');
}
H.done();
