'use strict';
/* The General's production (phase F2): with the economy on, nothing of the AI enters but by a Dispatch order the plan opens, the plan follows the
   posture and the enemy the side knows within its population budget, Dispatch goes by event (no clock), the safety floor, the commands pplan, disp
   and mis and the question plan; tickets as morale (D25 A). With the economy off the classic director and the old tickets are kept. About a minute */
const H = require('./harness'), ok = H.ok;
const solo = (C, era) => C.newState(era, C.$('ERAS')[era].sides[0].fighter, { cls: 'plane' });
const park = S => { const P = S.my; if (P) { P.inv = 9; P.dead = false; P.y = 3000; P.v.y = 0; P.hp = P.def.hp; } S.lives = 9; };
const res = (S, t, k, n) => { S.eco.d[t].res[k] = new Array(n).fill('hq'); };

console.log('-- the plan: posture, the enemy known, the budget --');
for (const [era, mapv] of [['ww2', 4], ['modern', 4]]) {
  const C = H.load({ seed: 12, eco: 1, mapv }), $ = C.$, S = solo(C, era), GP = $('GP');
  C.run(30, () => park(S));
  const d = S.eco.d[1], pp = d.pp, P = $('popOf')(1), ks = Object.keys(pp.f).sort().join(' ');
  ok(pp && pp.T > 0 && [0, 1, 2].includes(pp.st), era + ': side 1 has a production plan (posture ' + GP.st[pp.st] + '): ' + JSON.stringify(pp.f));
  ok(ks === (era === 'modern' ? 'aa art cas fighter heli lav lift squad tank truck' : 'aa art cas fighter squad tank truck'), era + ': the kinds of its era (' + ks + ')');
  const gv = GP.veh.filter(k => k in pp.f).reduce((a, k) => a + pp.f[k], 0), ga = GP.fly.filter(k => k in pp.f).reduce((a, k) => a + pp.f[k], 0);
  ok(gv <= Math.floor(P.veh * GP.gnd) && ga <= P.air, era + ': it fits the budget: ' + gv + ' ground vehicles of ' + P.veh + ', ' + ga + ' aircraft of ' + P.air);
  const Cm = S.cmd[1], f0 = Object.assign({}, $('gpPlan')(1).f);
  Cm.airT = S.t; Cm.known.push({ kind: 'tank', team: 0, dead: false, sx: 0, sz: 0, x: 0, z: 0, def: {} }, { kind: 'tank', team: 0, dead: false, sx: 0, sz: 0, x: 0, z: 0, def: {} });
  GP.pop.veh = 60; GP.pop.air = 20;   // room, to see the answer whole
  const f1 = $('gpPlan')(1).f, W = d.pp.why;
  GP.pop.veh = 24; GP.pop.air = 8;
  ok(f1.aa === f0.aa + GP.foe.aa && f1.fighter === f0.fighter + GP.foe.fighter && W.aa === GP.why.air, era + ': enemy aircraft lately: AA ' + f0.aa + ' → ' + f1.aa + ', fighters ' + f0.fighter + ' → ' + f1.fighter);
  ok(f1.tank === f0.tank + 1 && /blindados/.test(W.tank), era + ': two enemy tanks known: one tank more (' + f0.tank + ' → ' + f1.tank + ', ' + W.tank + ')');
  Cm.known.length = 0; Cm.airT = undefined; Cm.thr = 5;
  ok($('gpStance')(1) === 2 && $('gpPlan')(1).f.aa >= f0.aa, era + ': a strong enemy at a town: the defensive posture');
  Cm.thr = 0;
}

console.log('-- the population budget --');
{
  const C = H.load({ seed: 3, eco: 1, mapv: 4 }), $ = C.$, S = solo(C, 'ww2'), GP = $('GP');
  ok($('IAI').cap === GP.cap && $('sideMen')(0) === GP.pop.men, 'with an economy the soldiers\' cap holds two budgets (' + $('IAI').cap + '), ' + $('sideMen')(0) + ' a side');
  S.humans = [2, 0]; const P = $('popOf')(0);
  ok(P.men === 120 - 16 && P.veh === 24 - 4 && P.air === 8 - 2, 'two humans on side 0 take off theirs: ' + JSON.stringify(P));
  S.humans = [0, 0]; S.popK = .5; const Q = $('popOf')(1); S.popK = 1;
  ok(Q.men === 60 && Q.veh === 12 && Q.air === 4, 'the host over its budget halves it: ' + JSON.stringify(Q));
  const C2 = H.load({ seed: 3, mapv: 4 }); solo(C2, 'ww2');
  ok(C2.$('IAI').cap === GP.cap0 && !C2.$('gpOn')(), 'with no economy the cap is as before (' + C2.$('IAI').cap + ') and the classic director runs');
}

console.log('-- Dispatch by event, by an order with a mission --');
{
  const C = H.load({ seed: 5, eco: 1, mapv: 4 }), $ = C.$, S = solo(C, 'ww2'), GP = $('GP');
  C.run(5, () => park(S));
  ok($('gpOn')() && $('cqFree')(1, 'tank'), 'the general produces: CQ.ai\'s wait is not in it');
  S.cq.rd[1].tank = S.t + 999; ok($('cqFree')(1, 'tank'), 'even with a wait set as the classic director would');
  const d = S.eco.d[1]; d.ppo = { fighter: 4, cas: 0 }; $('gpPlan')(1);
  S.planes = S.planes.filter(p => !(p.team === 1 && p.role === 'fighter'));
  for (const k in d.res) d.res[k] = [];
  res(S, 1, 'fighter', 1); C.run(1, () => park(S));
  const f = S.planes.find(p => p.team === 1 && !p.dead && p.role === 'fighter');
  ok(f && f.mis && f.mis.d > 0 && /superioridade/.test(f.mis.why) && !(d.res.fighter || []).length, 'a fighter ready in the reserve is out within a second, not the director\'s ' + $('DIR').air + ' s: mission ' + (f && f.mis.kind) + ', "' + (f && f.mis.why) + '"');
  res(S, 1, 'fighter', 1); C.run(1, () => park(S)); const held = (d.res.fighter || []).length;
  C.run(GP.air, () => park(S));
  ok(held === 1 && (d.res.fighter || []).length === 0, 'the next one waits its ' + GP.air + ' s after it, then goes');
  // a column: tanks in the reserve, the plan short of them
  S.units = S.units.filter(u => !(u.team === 1 && u.kind === 'tank'));
  d.ppo = { tank: 2, aa: 0, art: 0, truck: 0, squad: 0 }; $('gpPlan')(1); S.dir[1].gpCol = 0; S.dir[1].gpF = 0;
  res(S, 1, 'tank', 1); const n0 = S.units.length;
  C.run(GP.form - 2, () => park(S));
  ok(!S.units.slice(n0).some(u => u.team === 1 && u.kind === 'tank'), 'one tank of the two wanted waits for the other while the column forms up (' + GP.form + ' s)');
  res(S, 1, 'tank', 2); C.run(1, () => park(S));
  const col = S.units.slice(n0).filter(u => u.team === 1 && u.kind === 'tank' && !u.dead);
  ok(col.length === 2 && col.every(u => u.mis.d > 0 && u.mis.d === col[0].mis.d && /coluna/.test(u.mis.why) && u.mis.kind === 'attack'), 'the second ready: both leave as one column, one order (' + (col[0] && col[0].mis.why) + ')');
  ok(S.dir[1].gpCol > S.t, 'and the side\'s next column waits ' + GP.gap + ' s for the road');
  // over the budget nothing goes
  S.units = S.units.filter(u => !col.includes(u));
  const keep = GP.pop.veh; GP.pop.veh = $('popUse')(1).veh; S.dir[1].gpCol = 0; res(S, 1, 'tank', 2); const n1 = S.units.length;
  C.run(GP.form + 2, () => park(S)); GP.pop.veh = keep;
  ok(!S.units.slice(n1).some(u => u.team === 1 && u.kind === 'tank') && d.res.tank.length === 2, 'with the vehicle budget full the tanks stay in the reserve');
}

console.log('-- the safety floor --');
{
  const C = H.load({ seed: 8, eco: 1, mapv: 4 }), $ = C.$, S = solo(C, 'ww2'), GP = $('GP');
  C.run(3, () => park(S));
  const d = S.eco.d[1], gone = () => { for (const m of S.men) if (m.team === 1) { m.dead = true; m.gone = true; } for (const u of S.units) if (u.team === 1 && u.cargo) u.cargo = null; d.res.squad = []; d.q = []; d.en = d.mt = 0; };
  gone(); C.run(GP.floor.t - 5, () => { park(S); gone(); });
  const n0 = S.squads.length;
  C.run(8, () => { park(S); d.res.squad = []; d.q = []; d.en = d.mt = 0; });
  const q = S.squads.slice(n0).find(q => q.team === 1 && q.job === 'base');
  ok(q && q.mis && q.mis.kind === 'defend' && /piso/.test(q.mis.why) && S.glog.l[1].some(e => /quartel-general manda/.test(e.s)), 'after ' + GP.floor.t + ' s with no squad in reserve, nothing made and its soldiers gone, the HQ sends a squad to hold the base (' + (q && q.mis.why) + ')');
}

console.log('-- the commands pplan, disp, mis and the question plan --');
{
  const C = H.load({ seed: 9, eco: 1, mapv: 4 }), $ = C.$, S = solo(C, 'ww2'), cmd = (c, t) => C.genCmd(t === undefined ? 1 : t, c, 'ai');
  C.run(5, () => park(S));
  const d = S.eco.d[1];
  let r = cmd({ c: 'pplan', k: 'tank', n: 7 });
  ok(r.ok && d.pp.f.tank === 7 && d.pp.set.tank && d.pp.why.tank === $('GP').why.set, 'pplan: 7 tanks in the field, fixed by the general');
  ok(!cmd({ c: 'pplan', k: 'heli', n: 1 }).ok && cmd({ c: 'pplan', k: 'heli', n: 1 }).why === 'kind' && !cmd({ c: 'pplan', k: 'aa', n: 99 }).ok, 'refused: a kind not of the era, a count out of range');
  r = cmd({ c: 'pplan', k: 'tank', n: -1 }); ok(r.ok && !d.pp.set.tank && !d.ppo.tank, 'n -1: the plan\'s own count again (' + d.pp.f.tank + ')');
  cmd({ c: 'pplan', k: 'aa', n: 0 }); r = cmd({ c: 'pplan', k: 'auto' }); ok(r.ok && !Object.keys(d.ppo).length, 'auto: every kind back to the plan');
  const pts = $('gPts')(), P = pts.find(p => p.hold === 1 && p.base < 0) || pts[1];
  for (const k in d.res) d.res[k] = [];
  r = cmd({ c: 'disp', k: 'tank', n: 2, pi: P.i, mk: 'defend' }); ok(!r.ok && r.why === 'res', 'disp with nothing in the reserve: refused res');
  res(S, 1, 'tank', 2); const n0 = S.units.length;
  r = cmd({ c: 'disp', k: 'tank', n: 2, pi: P.i, mk: 'defend', lat: 0, roe: 'return', H: 60, why: 'segurar ' + P.name });
  const us = S.units.slice(n0).filter(u => u.team === 1 && u.kind === 'tank');
  ok(r.ok && r.id > 0 && us.length === 2 && us.every(u => u.mis.d === r.id && u.mis.kind === 'defend' && u.mis.lat === 0 && u.mis.roe === 'return' && Math.abs(u.mis.area.x - P.x) < 1 && u.mis.when.H > S.t + 50),
    'disp: 2 tanks out now as a column, order ' + r.id + ', mission defend at ' + P.name + ', latitude 0, return fire, H in 60 s');
  res(S, 1, 'fighter', 1); r = cmd({ c: 'disp', k: 'fighter', x: P.x, z: P.z, mk: 'cap' });
  const f = S.planes.find(p => p.team === 1 && !p.dead && p.mis && p.mis.d === r.id);
  ok(r.ok && f && f.mis.kind === 'cap' && f.role === 'fighter', 'disp: a fighter from the reserve with a CAP over the point');
  const keep = $('GP').pop.air; $('GP').pop.air = 0; res(S, 1, 'cas', 1); r = cmd({ c: 'disp', k: 'cas', pi: P.i }); $('GP').pop.air = keep;
  ok(!r.ok && r.why === 'pop' && d.res.cas.length === 1, 'disp over the budget: refused pop, nothing drawn');
  ok(cmd({ c: 'disp', k: 'tank', x: -50, z: 0 }).why === 'map' && cmd({ c: 'disp', k: 'boat', pi: P.i }).why === 'kind', 'disp refuses a place off the map and an unknown kind');
  const q = S.squads.find(q => q.team === 1 && q.live > 0 && q.id);
  r = cmd({ c: 'mis', ids: [q.id], mk: 'recon', x: P.x + 50, z: P.z, lat: 2, brk: .3 });
  if (q.cnP) {   // the order goes by radio (the command network): the squad keeps its mission until the order with the new one arrives
    ok(r.ok && q.mis.kind !== 'recon' && q.cnP.mis && q.cnP.mis.kind === 'recon', 'mis by radio: the new mission travels with the order (' + Math.round(q.cnP.at - S.t) + ' s)');
    C.run(70, () => { park(S); return q.cnP ? undefined : false; });
  }
  ok(r.ok && q.mis.kind === 'recon' && q.mis.lat === 2 && q.mis.brk === .3 && Math.abs(q.mis.area.x - P.x - 50) < 1 && q.ord && q.ord.k === 'observe' && q.men.every(m => m.dead || m.mis === q.mis), 'mis: a squad takes a recon mission, observing there, latitude 2, break-off .3 (op ' + r.id + ')');
  ok(cmd({ c: 'mis', ids: [q.id], mk: 'dance', x: P.x, z: P.z }).why === 'kind', 'mis refuses a mission kind it does not know');
  const A = $('genAnswer')(1, { q: 'plan' });
  ok(A.ok && A.r.kinds.length >= 7 && A.r.pop.men === 120 && A.r.kinds.every(o => typeof o.name === 'string' && o.field >= 0 && o.have >= 0) && typeof A.r.stance === 'string', 'the question plan: posture ' + A.r.stance + ', budget and ' + A.r.kinds.length + ' kinds with field, out, reserve, queue and why');
  const rows = C.genVM(1, false).eco.rows.map(o => o.label);
  ok(rows.includes('Plano de produção') && rows.includes('Teto de população'), 'the general\'s Logística panel shows the plan and the budget');
  const E = $('ecsOf')(1), I = $('ecoI')();
  ok(E.pp.length % 3 === 0 && E.pp.length >= 21 && E.pp.every(Number.isInteger) && E.po.length === 8 && E.po.every(Number.isInteger) && I[E.pp[0]], 'ecs carries the plan as the relay checks it: ' + E.pp.length / 3 + ' kinds, ' + JSON.stringify(E.po));
}

console.log('-- tickets are morale where the economy pays (D25 A) --');
{
  const C = H.load({ seed: 6, eco: 1, mapv: 4 }), $ = C.$, S = solo(C, 'ww2'), Q = S.cq;
  C.run(5, () => park(S));
  const u = S.units.find(u => u.team === 1 && !u.dead && u.kind === 'tank' || u.team === 1 && !u.dead && u.kind === 'truck'), tk = Q.tk[1], lost = Q.lost[1][1];
  C.killUnit(u); C.step(1 / 60);
  ok(Q.tk[1] === tk && Q.lost[1][1] === lost + 1, 'a ' + u.kind + ' lost: counted as a loss, no ticket (' + tk + ' → ' + Q.tk[1] + ')');
  const fab = S.eco.l.find(e => e.team === 1 && e.k === 'fab' && !e.dead), t0 = Q.tk[1];
  $('ecoDown')(fab, null, true);
  ok(Q.tk[1] === t0 - 15 && $('ECO').site.fab.tk === 15 && $('ECO').site.pow.tk === 8 && $('ECO').site.mine.tk === 8, 'a factory lost costs 15 (power plant and mine 8): ' + t0 + ' → ' + Q.tk[1]);
  const b = { team: 1, prog: 1, dead: false, x: 0, y: 0, z: 0, o: { id: -1 }, name: 'x' }, t1 = Q.tk[1];
  try { $('supDown')(b, null, true); } catch (e) {}
  ok(Q.tk[1] === t1 - $('CQ').sup, 'a finished supply base lost costs ' + $('CQ').sup);
  const C2 = H.load({ seed: 6, mapv: 4 }), S2 = solo(C2, 'ww2'); C2.run(5, () => park(S2));
  const v = S2.units.find(u => u.team === 1 && !u.dead && u.kind === 'tank'), k2 = S2.cq.tk[1]; C2.killUnit(v); C2.step(1 / 60);
  ok(S2.cq.tk[1] === k2 - C2.$('CQ').cost.tank, 'with no economy a loss costs its tickets as before (' + C2.$('CQ').cost.tank + ' for a tank)');
  const b2 = { team: 1, prog: 1, dead: false, x: 0, y: 0, z: 0, o: { id: -1 }, name: 'x' }, k3 = S2.cq.tk[1];
  try { C2.$('supDown')(b2, null, true); } catch (e) {}
  ok(S2.cq.tk[1] === k3, 'with no economy a finished supply base lost costs no tickets (' + k3 + ' → ' + S2.cq.tk[1] + ')');
}
{
  const dome = eco => {
    const C = H.load({ seed: 6, eco, mapv: 4 }), S = solo(C, 'modern'); C.run(2, () => park(S));
    if (S.eco) { S.eco.d[1].en = S.eco.d[1].mt = 5000; }   // the AI may have spent on posts already
    const p = (() => { for (let z = -S.HW + 900; z < S.HW - 900; z += 173) for (let x = 2500; x < S.W - 2500; x += 211) if (C.fortWhy(6, 1, x, z, 0) === '') return { x, z }; })();
    if (S.eco) { S.eco.d[1].en = S.eco.d[1].mt = 5000; }
    const f = C.fortStart(6, 1, p.x, p.z, 0); C.fortAt(f, 1); const t0 = S.cq.tk[1];
    S.os[f.id] = 2; C.$('fortStep')(0);
    return { f, d: t0 - S.cq.tk[1], dome: C.$('CQ').dome };
  };
  const a = dome(1), b = dome(0);
  ok(a.f.dead && a.d === a.dome, 'with the economy a dome lost costs ' + a.dome + ' tickets (' + a.d + ')');
  ok(b.f.dead && b.d === 0, 'with no economy a dome lost costs none (' + b.d + ')');
}

console.log('-- a solo game is its own host: the frame meter calibrates the budget offline (D6) --');
{
  const C = H.load({ seed: 4, eco: 1, mapv: 4 }), $ = C.$, S = solo(C, 'ww2'), GP = $('GP'), AIB = $('AIB');
  C.run(2, () => park(S));
  const stat = AIB.stat; AIB.stat = () => ({ n: 300, ok: false, avg: AIB.avg * 2, worst: AIB.worst * 2 });
  S.popT = 0; $('gpMeter')(); AIB.stat = stat;
  const P = $('popOf')(1);
  ok(!S.net && S.popK === 1 - GP.meter.dn && P.men < GP.pop.men, 'offline, frames over the AI budget: the budget shrinks to ' + Math.round(S.popK * 100) + '% (' + P.men + ' soldiers of ' + GP.pop.men + ')');
}

console.log('-- an AI × AI match with the economy: everything by order, nothing dead --');
{
  const C = H.load({ seed: 21, eco: 1, mapv: 4 }), $ = C.$, S = C.watch('modern', { min: 30 }), seen = new Set(), free = [], AIB = $('AIB');
  AIB.stat = () => ({ n: 300, ok: true, avg: AIB.avg, worst: AIB.worst });   // the frame meter on a steady reading: the budget whole, whatever this machine's speed
  C.run(150, () => { for (const l of [S.units, S.planes, S.squads]) for (const o of l) if (!seen.has(o)) { seen.add(o); if ((o.ai || o.men) && o.mis && !o.mis.d) free.push(o.kind || o.role || o.job); } });
  const P = [0, 1].map(t => $('popOf')(t)), U = [0, 1].map(t => $('popUse')(t));
  ok(!free.length && !H.nan(S), 'modern, 150 s: ' + seen.size + ' units and squads, every AI one by a Dispatch order' + (free.length ? ' (not: ' + free.slice(0, 6).join(', ') + ')' : ''));
  ok(U.every((u, t) => u.veh <= P[t].veh && u.air <= P[t].air && u.men <= P[t].men + 12), 'each side within its budget: ' + U.map((u, t) => u.men + '/' + P[t].men + ' men, ' + u.veh + '/' + P[t].veh + ' vehicles, ' + u.air + '/' + P[t].air + ' aircraft').join('; '));
  ok(S.planes.some(p => p.heli && !p.dead && p.mis && p.mis.d), 'helicopters came by the plan, not HDIR\'s clock');
  ok(S.glog.l[0].concat(S.glog.l[1]).some(e => /plano de produção/.test(e.s)), 'the economy\'s log gives the plan as the reason of what it makes');
}
H.done();
