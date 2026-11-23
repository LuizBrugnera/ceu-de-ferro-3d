'use strict';
/* Vehicle recovery and medical evacuation (W18, topic T9): the immobilized hulk (when, what it is, what it is not, written off, hit again),
   the recovery vehicle that tows it to a node where the full repair costs crates and the vehicle goes back to the reserve with its experience,
   the capture of an enemy hulk, the badly wounded stabilized by a mate, the ambulance and (today) the helicopter that bring them back to the
   reserve, the general's own orders (recv, medv, the question rec) and the AI general of Apoio doing it alone. With no economy, nothing of it */
const H = require('./harness'), ok = H.ok;
let C, $, S, REC, hd;
const load = o => { C = H.load(Object.assign({ seed: 31, eco: 1, lg: 1, rec: 1, mapv: 4 }, o)); $ = C.$; REC = $('REC'); hd = $('hdist'); return C; };
/* an AI × AI match with the economy, its generals quiet (no plan, no director, no logistics or recovery general) unless asked */
const watch = (era, keep) => {
  S = C.watch(era || 'ww2', { len: 0 });
  if (!keep) { C.plan = () => {}; C.director = () => {}; if (S.lg) S.lg.cmd = [1e9, 1e9]; if (S.rec) S.rec.cmd = [1e9, 1e9]; if (S.eco) S.eco.open = false; }
  S.units = S.units.filter(u => u.fixed); S.men = []; S.squads = []; S.planes = [];
  return S;
};
/* a place s along road ri, off m to its side */
const at = (ri, s, off) => { const p = $('routeAt')(S.T.routes[ri], s); return { x: p.x - p.dz * (off || 0), z: p.z + p.dx * (off || 0) }; };
/* an AI tank of side t standing off the road at s, its brain quiet */
const tank = (t, ri, s, off) => { const p = at(ri, s, off === undefined ? 40 : off), u = C.addUnit('tank', t, p.x, p.z, S.E.sides[S.fac[t]].tanks[0], true); Object.assign(u, { fixed: false, rail: false }); u.ai.think = 1e9; return u; };
const kill = (u, k) => { if (!k && !u.imm) u.hp = u.max * .4; C.damageUnit(u, u.hp * (k || 1) + .01, null); };   // a hit that just finishes it, not one of more than REC.over
const res = (t, k) => (S.eco.d[t].res[k] || []).length;
const logs = t => S.glog.l[t].map(e => e.s).join(' | ');
const recBusyOf = h => !!h.rcq && !h.rcq.dead;
const runUntil = (secs, f) => { let T = 0; C.run(secs, dt => { T += dt; return !f(); }, 1 / 30); return f(); };

console.log('-- where it exists --');
{
  load(); watch('ww2');
  ok(!!S.rec && res(0, 'arv') === 1 && res(1, 'amb') === 1 && S.eco.d[0].keep.arv === 1 && S.eco.d[1].keep.amb === 1 && !!$('ECO').unit.arv, 'with the economy: each reserve starts with a recovery vehicle and an ambulance and keeps one of each');
  ok(Object.keys($('TRNS')).filter(id => $('TRNS')[id].svc).every(id => $('TRNS')[id].svc !== 'arv') && $('TRNS').bergep && $('TRNS').m88a2.kind === 'car' && Object.keys($('TRNS')).includes('kfz31') && Object.keys($('TRNS')).includes('opelw'), 'the recovery vehicles are no player\'s pick (the AI fields them); the ambulances and repair trucks are');
  load({ eco: 0 }); watch('ww2'); ok(!S.rec && !$('ECO').unit.arv, 'with no economy: none of it, and no such kinds to produce');
  load(); REC.on = 0; watch('ww2'); ok(!S.rec, 'nor with REC.on 0');
}

console.log('-- the immobilized hulk --');
{
  load(); watch('ww2'); REC.p = 1;
  const u = tank(0, 0, 4000), q0 = S.cq.lost[0][1]; kill(u);
  ok(!u.dead && u.imm && Math.abs(u.hp - u.max * REC.hp) < 1e-9 && u.mod.drive === 0 && u.ai.park && u.fld, 'a hit that would destroy it leaves it immobilized: its hull at ' + REC.hp * 100 + '%, the engine gone, parked');
  ok(S.cq.lost[0][1] === q0 + 1 && /Imobilizado/.test(logs(0)), 'its side counts it lost, and the general hears of it');
  const x = u.x, z = u.z; C.run(5); ok(hd(u, { x, z }) < .5 && !u.fix, 'it stays where it stands and its crew mends nothing');
  ok($('popUse')(0).veh === 0, 'it is out of the population');
  const e = tank(1, 0, 4000, 300); e.ai.think = 0; C.run(.1); ok($('pickGround')(e) !== u, 'an enemy tank does not pick it while it looks for a target');
  kill(u); ok(u.dead && S.cq.lost[0][1] === q0 + 1, 'hit again until its hull is gone: destroyed, not counted twice');
  const v = tank(0, 0, 4200); kill(v, 1.5); ok(v.dead && !v.imm, 'a hit of more than ' + REC.over * 100 + '% of its hull destroys it outright');
  const w = tank(0, 0, 4400); w.burn = 1; kill(w); ok(w.dead && !w.imm, 'so does one that burns');
  REC.p = 0; const y = tank(0, 0, 4600); kill(y); ok(y.dead, 'and, by chance, half of the others (REC.p ' + $('REC').p + ' here)');
  REC.p = 1; REC.life = 10; const h = tank(0, 0, 4800); kill(h); C.run(12); ok(h.dead && !S.units.includes(h) && S.wrecks.some(w => w.u === h) && /sucata/.test(logs(0)), 'nobody comes for it in ' + REC.life + ' s: written off as a wreck');
}

console.log('-- the recovery vehicle --');
{
  load(); watch('ww2'); REC.p = 1;
  const d = S.eco.d[0], t0 = res(0, 'tank'), h = tank(0, 1, $('endS')(0, 1, $('FIELD').main) - 2500); h.vx = 20; h.vl = 2; kill(h);
  ok(C.genCmd(0, { c: 'recv', id: 99 }, 'ai').why === 'id', 'recv for a number that is no hulk: id');
  const r = C.genCmd(0, { c: 'recv', id: h.imm.id }, 'ai'), a = S.units.find(u => u.rcv);
  ok(r.ok && a && a.def.id === 'bergep' && res(0, 'arv') === 0 && h.rcq === a, 'recv: the Bergepanther leaves the reserve for it');
  ok(C.genCmd(0, { c: 'recv', id: h.imm.id }, 'ai').why === 'tow', 'a second recv for it: tow, one is on its way');
  let hooked = 0, mt = d.mt, drop = 0;   // the metal income goes on: the repair is the one drop in a step
  const got = runUntil(600, () => { if (h.tow) hooked = hooked || S.t; drop = Math.max(drop, mt - d.mt); mt = d.mt; return h.gone; });
  ok(hooked && got && res(0, 'tank') === t0 + 1, 'it hitches the hulk (' + Math.round(hooked) + ' s), tows it home and the tank is back in the reserve (' + Math.round(S.t) + ' s)');
  ok(Math.abs(drop - Math.ceil(REC.fix.tank * $('LG').mt / $('LG').truck)) < 1, 'at the main base the repair costs the metal of ' + REC.fix.tank + ' crates (' + Math.round(drop) + ')');
  ok(runUntil(120, () => res(0, 'arv') === 1) && !S.units.includes(a), 'and the recovery vehicle is back in the reserve');
  const n = C.addUnit('tank', 0, 0, 0, S.E.sides[S.fac[0]].tanks[0], false, 1, 100, 0, 0); ok(n.vx === 20 && n.vl === 2, 'the next tank out of the reserve carries the hulk\'s experience');
  ok(/Recuperado e reparado/.test(logs(0)), 'and the general\'s diary says so');
}

console.log('-- to a supply base, paid in crates; the tow lost on the way --');
{
  load(); watch('ww2'); REC.p = 1;
  const ri = 1, ds = -1, s0 = $('lineS')(0, ri) - ds * 600;
  let b = null; for (let k = 0; k < 200 && !b; k++) for (const off of [40, -40]) { const p = at(ri, s0 - ds * k * 25, off); if (!b && !C.siteWhy(0, p.x, p.z, 0)) { b = C.startSite(0, p.x, p.z, 0); C.supAt(b, 1); } }
  b.lc = 50; const h = tank(0, ri, b.s + ds * 800); kill(h);
  ok(C.genCmd(0, { c: 'recv', id: h.imm.id }, 'ai').ok, 'a hulk 800 m ahead of a supply base');
  ok(runUntil(600, () => h.gone) && b.lc === 50 - REC.fix.tank, 'is towed to the base, where the repair takes ' + REC.fix.tank + ' of its crates (' + b.lc + ' left)');
  const g = tank(0, ri, b.s + ds * 1200); kill(g); S.eco.d[0].res.arv.push('hq'); C.genCmd(0, { c: 'recv', id: g.imm.id }, 'ai');
  runUntil(600, () => !!g.tow); const a = g.tow, T0 = g.imm.T; ok(!!a, 'another one hitched');
  C.damageUnit(a, a.hp + 1, null); C.run(.5); ok(a.dead && g.imm && !g.tow && !g.dead && g.imm.T > T0 && /perdido/.test(logs(0)), 'its tow destroyed: the hulk waits again where it was left');
}

console.log('-- capture --');
{
  load(); watch('ww2'); REC.p = 1;
  const own = $('lineS')(0, 0), h = tank(1, 0, own + 500), t0 = res(0, 'tank'); kill(h);   // side 0's rear is the far end of the road
  const far = tank(1, 0, own - 2000); kill(far); h.seenT = far.seenT = S.t;   // side 0 saw both
  const blind = tank(1, 0, own + 700); kill(blind); blind.seenT = -1e9;
  ok(C.genCmd(0, { c: 'recv', id: blind.imm.id }, 'ai').why === 'id', 'one it never saw: id, as if there were none');
  ok(C.genCmd(0, { c: 'recv', id: far.imm.id }, 'ai').why === 'far', 'an enemy hulk 2 km past our line: far');
  ok(C.genCmd(0, { c: 'recv', id: h.imm.id }, 'ai').ok, 'one behind our line: a recovery vehicle goes for it');
  ok(runUntil(600, () => h.team === 0) && /Capturamos/.test(logs(0)) && /rebocou o nosso/.test(logs(1)), 'hitched, it is ours, and both generals hear of it');
  ok(runUntil(600, () => h.gone) && res(0, 'tank') === t0 + 1 && /Capturado e reparado/.test(logs(0)), 'brought in, it is a tank more in our reserve');
}

console.log('-- the badly wounded --');
{
  load(); watch('ww2');
  const ri = 0, s = $('lineS')(0, ri) + 200, p = at(ri, s, 60), q = C.fieldSquad(0, 'line', 0, { k: 'hold', ri, s }, p.x, p.z);
  C.run(2); const [m1, m2] = q.men;
  $('Math').random = () => 0;   // he goes down, as WND.p says
  ok(C.manDown(m1, REC.grave + 1, null) && m1.grave === 1, 'down from a hit of ' + (REC.grave + 1) + ': badly wounded');
  ok(C.manDown(m2, REC.grave - 1, null) && m2.grave === 0, 'from ' + (REC.grave - 1) + ': not');
  C.seed(5);
  ok(runUntil(120, () => m1.stab && !m2.down), 'first aid: the light one gets up, the bad one is only stabilized');
  ok(m1.down > S.t + REC.hold - 130 && !m1.dead && m1.hp <= 1, 'and lies there, out of the fight, until he is evacuated or ' + REC.hold / 60 + ' min pass');
  C.run(20); ok(!q.men.some(o => o.ai && o.ai.rsc === m1), 'nobody goes to treat him again');
}

console.log('-- the ambulance --');
{
  load(); watch('ww2');
  const ri = 0, s = $('lineS')(0, ri) + 100, p = at(ri, s, 30), q = C.fieldSquad(0, 'line', 0, { k: 'hold', ri, s }, p.x, p.z), k = $('SQUAD').ww2.length;
  C.run(2); const hurt = q.men.slice(0, 3);
  for (const m of hurt) { $('Math').random = () => 0; C.manDown(m, REC.grave + 1, null); m.stab = S.t; m.down = S.t + REC.hold; }
  C.seed(7); S.rec.men[0] = k - 2; const sq0 = res(0, 'squad');
  ok(C.genCmd(0, { c: 'medv', x: p.x + 500, z: p.z + 500 }, 'ai').why === 'hurt', 'medv where nobody is hurt: hurt');
  ok(C.genCmd(0, { c: 'medv', x: p.x, z: p.z }, 'ai').ok && S.units.some(u => u.mev && u.def.id === 'kfz31') && res(0, 'amb') === 0, 'medv: the ambulance (Kfz. 31) leaves the reserve for them');
  ok(runUntil(600, () => hurt.every(m => m.evac)) && hurt.every(m => m.gone && !m.dead), 'it loads all three where they lie');
  ok(runUntil(600, () => S.rec.saved === 3) && res(0, 'squad') === sq0 + 1 && S.rec.men[0] === 1, 'brought in: with the ' + (k - 2) + ' before them, a squad is back in the reserve and 1 counts toward the next');
  ok(runUntil(300, () => res(0, 'amb') === 1), 'and the ambulance is back in the reserve');
}

console.log('-- a guest\'s ambulance, on the host --');
{
  /* cf-anfitriao-bug: a player's ambulance loads the wounded it stands by and hands them in at a node (svMine), but that ran for the host's
     own player only: a guest's ambulance treated and never evacuated anyone. The host now runs it for the guest's ghost and tells him (amb) */
  load(); watch('ww2');
  const ri = 0, s = $('lineS')(0, ri) + 100, p = at(ri, s, 30), q = C.fieldSquad(0, 'line', 0, { k: 'hold', ri, s }, p.x, p.z), Net = $('Net');
  C.run(2); const hurt = q.men.slice(0, 2);
  for (const m of hurt) { $('Math').random = () => 0; C.manDown(m, REC.grave + 1, null); m.stab = S.t; m.down = S.t + REC.hold; }
  C.seed(7); q.men.forEach(m => { if (!hurt.includes(m)) m.gone = true; }); S.men = S.men.filter(m => !m.gone);
  const L = hurt[0], g = $('addVehicle')('trn', 'kfz31', 0, L.x + 4, L.z, 0); const put = (x, z) => { g.x = x; g.z = z; g.snap = { x, y: g.y, z, h: 0, ty: 0, tp: 0, age: 0 }; }; Object.assign(g, { net: true, pid: 5, v: { x: 0, y: 0, z: 0 } }); put(g.x, g.z); Net.ghosts.set(5, g);
  const sent = [], send0 = Net.send; Net.send = (t, m) => { sent.push(Object.assign({ t }, m)); }; S.net = true; S.host = true;
  const saved0 = S.rec.saved || 0, amb = k => sent.filter(m => m.t === 'amb' && m.to === 5 && m.k === k);
  ok(runUntil(60, () => amb(0).length > 0) && hurt.every(m => m.evac && m.gone) && amb(0).reduce((n, m) => n + m.n, 0) === 2, 'the guest\'s ambulance, standing by two of its side\'s badly wounded, takes them aboard on the host, and the guest is told (amb k 0: ' + JSON.stringify(amb(0)) + ')');
  const b = S.base[0]; put(b.x + 20, b.z + 20);
  ok(runUntil(30, () => amb(1).length > 0) && amb(1)[0].n === 2 && S.rec.saved === saved0 + 2, 'driven to the main base, it hands them in (rec.saved +2) and the guest is told (amb k 1)');
  S.host = false; S.my = g; const f0 = S.floats.length;
  Net.rx.amb({ k: 0, n: 2, c: 2 }); ok(S.floats.length === f0 + 1 && /2 .*a bordo \(2\//.test(S.floats[f0].text), 'the guest at the wheel reads it over his ambulance (' + S.floats[f0].text + ')');
  Net.send = send0; S.net = false; S.host = false; S.my = null; Net.ghosts.clear();
}

console.log('-- today: the helicopter --');
{
  load(); watch('modern');
  const ri = 0, s = $('lineS')(0, ri) + 100, p = at(ri, s, 30), q = C.fieldSquad(0, 'line', 0, { k: 'hold', ri, s }, p.x, p.z);
  C.run(2); const hurt = q.men.slice(0, 2);
  for (const m of hurt) { $('Math').random = () => 0; C.manDown(m, REC.grave + 1, null); m.stab = S.t; m.down = S.t + REC.hold; }
  C.seed(9); S.eco.d[0].res.amb = []; S.eco.d[0].res.lift = ['hq']; const l0 = res(0, 'lift');
  ok(l0 > 0 && C.genCmd(0, { c: 'medv', x: p.x, z: p.z }, 'ai').ok && S.planes.some(h => h.mev) && res(0, 'lift') === l0 - 1, 'no ambulance in the reserve: the transport helicopter flies the evacuation');
  ok(runUntil(900, () => S.rec.saved === 2) && res(0, 'lift') === l0, 'it brings both home and is back in the reserve');
}

console.log('-- the general of Apoio, alone, and what it shows --');
{
  load(); watch('ww2'); REC.p = 1; S.rec.cmd = [0, 1e9];   // side 0's general alone
  const h = tank(0, 0, $('lineS')(0, 0) + 1000), e = tank(1, 0, $('lineS')(0, 0) + 1500); kill(h); kill(e); e.seenT = S.t;
  C.run(6, null, 1 / 30); const a = S.units.find(u => u.rcv && u.team === 0);
  ok(a && a.rcv.h === h, 'it sends its recovery vehicle to its own hulk first');
  S.eco.d[0].res.arv.push('hq');   // a second one in the reserve: the enemy's hulk would be written off waiting for the first
  const deep = tank(0, 0, $('lineS')(0, 0) - 1500); kill(deep); C.run(6, null, 1 / 30); ok(!recBusyOf(deep), 'none for its own hulk 1.5 km past its line');
  const V = C.genQuery(0, { q: 'rec' }); ok(V.on && V.hulks.length === 3 && V.hulks.find(o => o.id === h.imm.id).coming && V.out.length + V.reserve.arv === 2, 'the question rec: the three hulks (one with a vehicle coming), the vehicles out and the reserve, two in all');
  const row = C.ecoVM(0).rows.find(r => r.label === 'Recuperação'); ok(row && /imobilizado/.test(row.value) && /em missão/.test(row.value), 'the Logística panel has a Recuperação row: ' + (row && row.value));
  const t0 = res(0, 'tank'); ok(runUntil(900, () => h.gone && e.gone) && e.cap && res(0, 'tank') === t0 + 2, 'it brings in its own, then captures the enemy\'s');
}

console.log('-- an AI × AI match with all of it: no number goes wrong --');
{
  load({ seed: 5 }); S = C.watch('ww2', { len: 0 }); C.run(240, null, 1 / 30);
  ok(!H.nan(S), 'four minutes of battle, nothing not a number (' + S.units.filter(u => u.imm).length + ' hulks now, ' + (S.rec.got || 0) + ' recovered, ' + (S.stabs || 0) + ' stabilized, ' + (S.rec.saved || 0) + ' evacuated)');
}
H.done();
