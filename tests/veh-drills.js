'use strict';
/* The drills of the vehicles and the aircraft (DRILL.veh, DRILL.air): for each class, what sets a procedure off and what the unit then does
   (a tank under a guided missile smokes and backs off, a truck ambushed on its road drives through, a jet under a missile pops flares and breaks,
   a battery under counter-battery fire moves ...), each drill's trigger only from what the unit has perceived (nothing before its ladder has the
   contact, the drill once it has), and an AI battle per era in which every drill taken for a contact had that contact among its beliefs
   (SECS, default 120; SECS=0 leaves it out) */
const H = require('./harness'), ok = H.ok, SECS = process.env.SECS === undefined ? 120 : +process.env.SECS;
const C = H.load({ seed: 21 }), $ = C.$, DRILL = $('DRILL'), MSL = $('MSL'), STORES = $('STORES');
let S;
const box = era => { S = C.sandbox(era || 'ww2'); S.cmd = [$('cmdOf')(0), $('cmdOf')(1)]; return S; };
const R0 = () => S.T.routes[0], mid = () => R0().len / 2, at = s => $('routeAt')(R0(), s);
const unit = (kind, t, s, id, lane) => C.addUnit(kind, t, 0, 0, id === undefined ? (kind === 'truck' ? null : S.E.sides[S.fac[t]][kind === 'tank' ? 'tanks' : kind][0] || S.E.sides[S.fac[t]][kind]) : id, false, 0, s, lane || 0, 0);
const tankOf = t => S.E.sides[S.fac[t]].tanks[0];
/* what a unit has made out: its perception meter at that rung (1 detected, 2 class, 3 model), fresh now */
const know = (a, t, g) => { const e = $('meter')(a, t); Object.assign(e, { kn: true, t: S.t, kt: S.t - 5, rt: .3, v: 1.2, rc: g >= 2 ? 1 : 0, ic: g >= 3 ? 1 : 0, ex: 0, ez: 0, told: false }); return e; };
const pick = o => { const p = $('drPick')(o, $('belief')(o)); return p ? p.D.id : null; };
const took = (o, id) => (o.dr && o.dr.id === id) || (o.drH || []).some(h => h[0] === id);
const still = o => { o.inv = 1e9; o.ai = null; };   // a target that does nothing and takes nothing
const think = o => $('mindThink')(o);

console.log('-- tank: a guided missile coming in --');
{ box('modern'); const u = unit('tank', 0, mid() - 300, tankOf(0)), s0 = u.s, sm0 = u.smk;
  ok(pick(u) === null, 'nothing in the air yet: no drill');
  const a = C.addMan('redAT', 1, u.x + 900, u.z + 40, Math.PI), w = $('INF').modern; still(a);
  /* a launch spot with the seeker's line clear to the tank (seekLine): behind a rock or a wood the missile would not guide at all (missile-los.js) */
  let P = null; for (let i = 0; i < 400 && !P; i++) { const r = 600 + 400 * Math.random(), q = Math.random() * 2 * Math.PI, x = u.x + r * Math.cos(q), z = u.z + r * Math.sin(q), y = C.hgt(x, z) + 1.6;
    if ($('seekLine')({ x, y, z }, y, u, u.y + 2, true)) P = { x, z }; }
  const blue = C.addMan('blueAT', 1, P.x, P.z, Math.PI); still(blue);
  const e = $('manEye')(blue), m = $('MSHOT').atgm(blue, blue.arms[1].d, e, C.vnorm({ x: u.x - e.x, y: u.y - e.y, z: u.z - e.z }), u);
  let tk = -1; C.run(12, () => { if (tk < 0 && took(u, 'missil-at')) tk = S.t; });
  const back = (s0 - u.s) * u.ds;
  ok(tk > 0 && u.smk < sm0 && back > 20, 'a Javelin on it: the drill at ' + tk.toFixed(1) + ' s, smoke (' + sm0 + ' -> ' + u.smk + ' salvos) and ' + back.toFixed(0) + ' m back along its road'); }

console.log('-- tank: enemy infantry close and none of its own --');
{ box('ww2'); const u = unit('tank', 0, mid(), tankOf(0)), p = at(mid() + 100 * u.ds), e = C.addMan($('INF').ww2[S.fac[1]][2], 1, p.x + 10, p.z, 0); still(e);
  ok(pick(u) === null, 'a bazooka man 100 m off that it has not made out: nothing');
  know(u, e, 2); ok(pick(u) === 'infantaria-v', 'made out: ' + pick(u));
  const s0 = u.s; think(u); const R = S.help && S.help.l.find(R => R.by === u);
  C.run(8, () => { know(u, e, 2); });
  ok(R && R.k === 'clear' && (s0 - u.s) * u.ds > 20, 'it backs off (' + ((s0 - u.s) * u.ds).toFixed(0) + ' m) and calls for a squad to clear them (' + (R && R.k) + ')');
  const q = C.addSquad(0, u.x + 20, u.z, 0, u.s); C.run(2, () => { know(u, e, 2); });
  ok(pick(u) !== 'infantaria-v', 'with a squad of its own beside it, not this drill'); }

console.log('-- tank: shoot and move --');
{ box('ww2'); const u = unit('tank', 0, mid(), tankOf(0)), p = at(mid() + 900 * u.ds), e = C.addVehicle('tank', tankOf(1), 1, p.x, p.z, 0); still(e);
  u.rail = false; u.ai.off = 20; u.ai.tgt = e; know(u, e, 2); think(u); const P0 = { x: u.x, z: u.z };
  u.arms[0].n += 3; u.ai.tgt = e; know(u, e, 2); think(u);
  const d = u.dr; let far = 0;
  C.run(15, () => { know(u, e, 2); far = Math.max(far, Math.hypot(u.x - P0.x, u.z - P0.z)); });
  ok(d && d.id === 'posicao' && far > 15, 'three rounds from one place: to another ' + far.toFixed(0) + ' m off' + (d && d.hd ? ', its hull hidden from the target' : '')); }

console.log('-- tank: a stronger tank head on --');
{ box('ww2'); const u = unit('tank', 1, mid(), 'sherman'), p = at(mid() + 800 * u.ds), e = C.addVehicle('tank', 'tiger', 0, p.x, p.z, 0); still(e);
  e.h = Math.atan2(-(u.z - e.z), u.x - e.x); e.ty = 0;
  know(u, e, 2); ok(pick(u) !== 'superior', 'a tank made out only as a tank: no duel to refuse yet');
  know(u, e, 3); const s0 = u.s; ok(pick(u) === 'superior', 'a Tiger made out, its gun this way: ' + pick(u));
  C.run(10, () => { know(u, e, 3); });
  ok((s0 - u.s) * u.ds > 60, 'a Sherman backs off ' + ((s0 - u.s) * u.ds).toFixed(0) + ' m rather than duel it'); }

console.log('-- tank: immobilized --');
{ box('ww2'); const u = unit('tank', 0, mid(), tankOf(0)), sm0 = u.smk; u.mod.drive = 0; u.hitT = S.t;
  think(u); const R = S.help && S.help.l.find(R => R.by === u);
  ok(u.dr && u.dr.id === 'imobilizado' && u.smk < sm0 && R && R.k === 'repair', 'its tracks gone under fire: smoke, and a call for repair (' + (R && R.k) + ')'); }

console.log('-- tank: a town ahead and no infantry --');
{ box('ww2'); const T = S.T.towns.map(w => Object.assign($('railOf')(w.x, w.z), w)).find(p => p.ri === 0 && Math.abs(p.off) < 120);
  if (!T) ok(false, 'no town on road 0');
  else {
    const ds = -1, s = T.s - ds * 330, u = C.addUnit('tank', 0, 0, 0, tankOf(0), false, 0, s, 0, 0);
    let tk = -1, halt = 0, n = 0; C.run(30, () => { if (tk < 0 && took(u, 'cidade')) tk = S.t; if (tk > 0 && S.t - tk > 3) { n++; if (Math.abs(u.sp) < .3) halt++; } });
    ok(tk > 0 && halt > n * .8, 'it halts at the edge of the town (' + (tk > 0 ? 'drill at ' + tk.toFixed(1) + ' s, ' : '') + (100 * halt / (n || 1)).toFixed(0) + '% of the time still)');
    const q = C.addSquad(0, u.x, u.z, 0, u.s + u.ds * 60); C.setOrd(q, { k: 'hold', ri: 0, s: u.s + u.ds * 80 }); q.s = u.s + u.ds * 60; q.ri = 0;
    C.run(3); ok(!(u.dr && u.dr.id === 'cidade'), 'a squad of its own ahead: it goes on'); } }

console.log('-- tank and truck: an aircraft overhead --');
{ box('ww2'); const u = unit('tank', 0, mid(), tankOf(0)), t = unit('truck', 0, mid() - 200 * -1, null, 10), pl = C.addPlane(S.E.sides[S.fac[1]].fighter, 1, u.x + 1500, C.hgt(u.x, u.z) + 600, u.z, 0, false); pl.inv = 1e9;
  ok(pick(u) === null && pick(t) === null, 'a plane they have not made out: nothing');
  know(u, pl, 2); know(t, pl, 2); ok(pick(u) === 'aereo-v' && pick(t) === 'aereo-c', 'made out: the tank ' + pick(u) + ', the truck ' + pick(t));
  think(u); think(t); const P = u.dr && u.dr.P, St = t.dr && t.dr.S;
  C.run(15, () => { know(u, pl, 2); know(t, pl, 2); pl.x = u.x + 1500; pl.y = C.hgt(u.x, u.z) + 600; pl.z = u.z; });
  const kind = P ? $('kindAt')(P.x, P.z) : -1;
  ok(P ? Math.hypot(u.x - P.x, u.z - P.z) < 12 : Math.abs(u.sp) < .3, 'the tank ' + (P ? 'under cover ' + Math.hypot(u.x - P.x, u.z - P.z).toFixed(0) + ' m from its place (' + (kind === 1 ? 'trees' : 'by a house') + ')' : 'still, nowhere to hide'));
  ok(St !== undefined && (St === null ? Math.abs(t.sp) < .3 : Math.abs(t.s - St) < 8 && Math.abs(t.sp) < .5), 'the truck ' + (St === null ? 'still' : 'on its road to a stretch under trees or by houses, and stopped there (' + Math.abs(t.s - St).toFixed(0) + ' m)')); }

console.log('-- a mine --');
for (const kind of ['tank', 'truck']) { box('ww2'); const u = unit(kind, 0, mid() + 900, kind === 'tank' ? tankOf(0) : null, 10), p = at(u.s + u.ds * 110);
  const o = $('mineAdd')(990, 0, 1, p.x - p.dz * 10, p.z + p.dx * 10, 1, true); o.kn = 0;   // on its lane, 110 m on, and nobody on its side knows of it
  C.run(2); const pre = took(u, 'mina-v'), sp = Math.abs(u.sp);
  o.kn = 1; let tk = -1, sAt = 0; C.run(16, () => { if (tk < 0 && took(u, 'mina-v')) { tk = S.t; sAt = u.s; } });
  const back = (sAt - u.s) * u.ds;
  if (!(sp > 3)) ok(false, 'the ' + kind + ' was not on the move (' + sp.toFixed(1) + ' m/s)');
  ok(!pre && tk > 0 && back > 20 && $('sus')(0).length > 0, 'a ' + kind + ': a mine it does not know of is nothing; one its side knows on its way: it stops, backs ' + back.toFixed(0) + ' m the way it came, and the place is marked for the sappers'); }

console.log('-- truck: ambushed on its road --');
{ const run = on => {
    box('ww2'); DRILL.on = on;
    const u = unit('truck', 0, mid() + 600, null, 10), s0 = u.s; u.inv = 1e9;   // a supply truck, empty, on its way
    const p = at(u.s + u.ds * 90), e = C.addMan($('INF').ww2[S.fac[1]][0], 1, p.x - p.dz * 60, p.z + p.dx * 60, 0); e.inv = 1e9;
    C.run(12); DRILL.on = 1; return { d: (u.s - s0) * u.ds, took: took(u, 'emboscada-v') };
  };
  const a = run(1), b = run(0);
  ok(a.took && a.d > b.d + 100, 'fired on from beside the road: on through the killing ground (' + a.d.toFixed(0) + ' m in 12 s) where without the drill it stopped in it (' + b.d.toFixed(0) + ' m)'); }

console.log('-- truck: a column keeps its spacing --');
{ box('ww2'); const a = unit('truck', 0, mid() + 900, null, 10), b = unit('truck', 0, mid() + 900 - 18, null, 10);
  ok(Math.abs(a.s - b.s) < 25, 'two trucks 18 m apart on one road');
  let minGap = 1e9; C.run(25, () => { if (S.t > 6) minGap = Math.min(minGap, Math.abs(a.s - b.s)); });
  ok(took(a, 'comboio') || took(b, 'comboio'), 'the one behind waits (comboio)'); ok(minGap > 35, 'the gap opens and stays open: at least ' + minGap.toFixed(0) + ' m after 6 s'); }

console.log('-- truck: shells falling on its way --');
{ box('ww2'); const u = unit('truck', 0, mid() + 400, null, 10), s0 = u.s, p = at(u.s + u.ds * 300), H0 = DRILL.veh.shell.hold;
  C.run(1); let maxA = -1e9;
  C.run(14, () => { if (Math.abs(S.t % 3 - 1) < .01) $('shelled')(p.x, p.z, 1); maxA = Math.max(maxA, (u.s - s0) * u.ds); });
  ok(took(u, 'area-batida') && maxA < 300 - H0 + 40, 'bursts 300 m ahead on its road: it waits short of them (no nearer than ' + (300 - maxA).toFixed(0) + ' m)'); }

console.log('-- truck: the squad gets out on the side away from the enemy --');
{ box('ww2'); const u = unit('truck', 0, mid(), null, 10); u.cargo = $('SQUAD').ww2.slice(0, 5); const p = at(u.s + u.ds * 40), e = C.addMan($('INF').ww2[S.fac[1]][0], 1, p.x - p.dz * 250, p.z + p.dx * 250, 0); still(e);
  know(u, e, 2); $('belief')(u); $('unload')(u); const q = u.sq, ex = e.x - u.x, ez = e.z - u.z;
  const far = q ? q.men.filter(m => (m.x - u.x) * ex + (m.z - u.z) * ez < 0).length : 0;
  ok(q && far === q.men.length && took(u, 'desembarque'), 'all ' + far + ' out on the far side of the truck from where it believes the enemy'); }

console.log('-- truck: empty and still near the enemy --');
{ box('ww2'); const u = unit('truck', 0, mid(), null, 10), p = at(u.s + u.ds * 700), e = C.addMan($('INF').ww2[S.fac[1]][0], 1, p.x, p.z, 0); still(e);
  u.ai.reloc = u.s; C.run(10, () => { u.ai.reloc = u.s; }); know(u, e, 2); const s0 = u.s; u.moveT = S.t - 20; think(u);
  C.run(25); ok(took(u, 'saida') && (s0 - u.s) * u.ds > 150, 'its load delivered, it does not sit there: ' + ((s0 - u.s) * u.ds).toFixed(0) + ' m back'); }

console.log('-- artillery: counter-battery fire --');
{ box('ww2'); const u = unit('art', 0, mid() - 1500 * -1, S.E.sides[S.fac[0]].art), s0 = u.s;
  u.ai.fm = { t: { x: 0, z: 0, sx: 0, sz: 0, v: { x: 0, z: 0 }, moveT: 0, seenT: S.t, dead: false }, n: 4, ex: 0, ez: 0, tof: 0, shots: 0 };
  $('shelled')(u.x + 120, u.z + 60, 1); think(u);
  ok(u.dr && u.dr.id === 'contrabateria' && !u.ai.fm && u.ai.reloc !== null, 'a burst 130 m off: its fire mission dropped, it moves');
  C.run(30); ok(Math.abs(u.s - s0) > 150, 'and is ' + Math.abs(u.s - s0).toFixed(0) + ' m from where it fired');
  box('ww2'); const v = unit('art', 0, mid() + 1500, S.E.sides[S.fac[0]].art); $('shelled')(v.x + 120, v.z + 60, 0); think(v);
  ok(!took(v, 'contrabateria'), 'its own side\'s burst is no counter-battery'); }

console.log('-- AA: a ground enemy close --');
{ box('modern'); const u = unit('aa', 0, mid(), 'pantsir'), p = at(mid() + 600 * u.ds), e = C.addVehicle('tank', tankOf(1), 1, p.x, p.z, 0); still(e);
  ok(pick(u) === null, 'a tank it has not made out: nothing');
  know(u, e, 2); const s0 = u.s; ok(pick(u) === 'aa-recuo', 'made out within 900 m: ' + pick(u));
  C.run(20, () => { know(u, e, 2); }); ok((s0 - u.s) * u.ds > 100, 'it falls back ' + ((s0 - u.s) * u.ds).toFixed(0) + ' m: no front-line weapon'); }

console.log('-- AA: its radar silent until it has the shot --');
{ const run = on => {
    box('modern'); DRILL.on = on; const u = unit('aa', 0, mid() - 2000 * -1, 'pantsir'), pl = C.addPlane('su57', 1, u.x - 8300, C.hgt(u.x, u.z) + 1500, u.z, Math.PI, false); pl.inv = 0; const t0 = S.t + 1.5;
    /* counted from 1.5 s on: the drill wants the target its controller took, and the mind (every MIND.every s, at a slot staggered by mission) has had its turn by then */
    let lock = 0, n = 0; C.run(6, () => { pl.x = u.x - 8300; pl.v = { x: -200, y: 0, z: 0 }; pl.hp = pl.def.hp; know(u, pl, 3); if (S.t < t0) return; n++; if (u.ctl.lock === pl) lock++; });
    DRILL.on = 1; return lock / (n || 1);
  };
  const a = run(1), b = run(0);
  ok(b > .5 && a < .05, 'a plane going away 8.3 km off: locked ' + (100 * b).toFixed(0) + '% of the time before, ' + (100 * a).toFixed(0) + '% with the drill'); }

console.log('-- jet: a missile on it --');
{ box('modern'); const p = C.addPlane('f22', 0, S.W * .4, 2500, 0, 0, true, 'fighter'), sh = C.addPlane('su57', 1, p.x + 5000, 2500, p.z, Math.PI, false); sh.inv = 1e9; p.inv = 0;
  ok(pick(p) === null, 'nothing fired: no drill');
  const f0 = p.flares, h0 = Math.atan2(-p.f.z, p.f.x), y0 = p.y, m = MSL.arm({ x: sh.x - 20, y: sh.y - 2, z: sh.z, target: p, o: STORES.r77, team: 1, by: sh }, sh.f, sh); S.missiles.push(m);
  let tk = -1, f1 = -1, beam = 0, n = 0; C.run(6, () => { sh.x = p.x + 5000; if (tk < 0 && took(p, 'missil')) { tk = S.t; } if (tk > 0 && f1 < 0 && S.t - tk > .2) f1 = p.flares; if (!m.gone) { const mx = m.x - p.x, mz = m.z - p.z, ml = Math.hypot(mx, mz) || 1, hf = Math.hypot(p.f.x, p.f.z) || 1; n++; if (Math.abs((mx * p.f.x + mz * p.f.z) / (ml * hf)) < .5) beam++; } });
  ok(tk > 0 && f1 >= 0 && f1 < f0, 'a radar missile from 5 km: the drill at ' + tk.toFixed(1) + ' s and flares and chaff at once (' + f0 + ' -> ' + f1 + '), not in its last seconds');
  ok(beam > 0 && p.y < y0 - 50, 'it puts the missile on the beam (' + (100 * beam / (n || 1)).toFixed(0) + '% of the flight) and dives (' + (y0 - p.y).toFixed(0) + ' m down)'); }

console.log('-- jet: a radar locks it --');
{ box('modern'); const p = C.addPlane('f22', 0, S.W * .4, C.hgt(S.W * .4, 0) + 1500, 0, 0, true, 'fighter'), a = C.addVehicle('aa', 'pantsir', 1, p.x + 5000, 300, 0); a.inv = 1e9; p.inv = 1e9; a.ai = null;
  ok(pick(p) === null, 'no lock, nothing made out: nothing');
  a.ctl.lock = p; const agl0 = p.y - C.hgt(p.x, p.z), d0 = Math.hypot(a.x - p.x, a.z - p.z);
  ok(pick(p) === 'radar-aa', 'its warner hears the lock: ' + pick(p));
  C.run(15, () => { a.ctl.lock = p; }); const agl = p.y - C.hgt(p.x, p.z), d1 = Math.hypot(a.x - p.x, a.z - p.z);
  ok(agl < agl0 - 300 && d1 > d0, 'down from ' + agl0.toFixed(0) + ' to ' + agl.toFixed(0) + ' m over the ground and away (' + d0.toFixed(0) + ' -> ' + d1.toFixed(0) + ' m)'); }

console.log('-- plane: AA guns --');
{ box('ww2'); const p = C.addPlane(S.E.sides[S.fac[0]].fighter, 0, S.W * .45, 0, 0, 0, true, 'fighter'); p.y = C.hgt(p.x, p.z) + 700; p.inv = 1e9;
  const a = C.addVehicle('aa', S.E.sides[S.fac[1]].aa, 1, p.x + 1200, 0, 0); a.ai = null; a.inv = 1e9;
  ok(pick(p) === null, 'a flak vehicle it has not seen: nothing');
  know(p, a, 2); ok(pick(p) === 'flak', 'made out: ' + pick(p)); const y0 = p.y;
  let over = 0; C.run(25, () => { know(p, a, 2); if (Math.hypot(a.x - p.x, a.z - p.z) < 300 && p.y - a.y < DRILL.air.flak.top) over++; });
  ok(p.y > y0 + 400 && !over, 'up ' + (p.y - y0).toFixed(0) + ' m in 25 s, and never low over it'); }

console.log('-- fighter: a foe on its tail, and its wingman --');
{ box('modern'); const p = C.addPlane('f22', 0, S.W * .4, 3000, 0, 0, true, 'fighter'), w = C.addPlane('f22', 0, S.W * .4 - 2500, 3000, 800, 0, true, 'fighter'), e = C.addPlane('su57', 1, p.x - 600, 3000, 0, 0, false); e.inv = p.inv = w.inv = 1e9;
  ok(pick(p) === null, 'a foe it has not made out: no drill');
  know(p, e, 2); ok(pick(p) === 'cauda', 'made out behind it: ' + pick(p)); think(p);
  ok(p.brk > S.t && w.drW && w.drW.by === p, 'it breaks, and calls its wingman');
  C.run(2, () => { e.x = p.x - p.f.x * 600; e.z = p.z - p.f.z * 600; e.y = p.y; know(p, e, 2); });
  ok(took(w, 'ala'), 'the wingman comes to cover its tail (ala)'); }

console.log('-- attack plane: never twice down the same path --');
for (const on of [1, 0]) { box('ww2'); DRILL.on = on; const id = S.E.sides[S.fac[0]].attack || S.E.sides[S.fac[0]].fighter, p = C.addPlane(id, 0, S.W * .45, 0, 0, 0, true, 'cas'); p.y = C.hgt(p.x, p.z) + 650; p.inv = 1e9;
  const g = at(mid()), t = C.addVehicle('truck', null, 1, p.x + 1500, 0, 0); still(t); p.egress = 9; p.tgt = t;
  const hf = Math.hypot(p.f.x, p.f.z), h0 = { x: p.f.x / hf, z: p.f.z / hf };
  C.run(8, () => { if (p.egress <= 0) p.egress = .1; });
  const h1 = { x: p.f.x / Math.hypot(p.f.x, p.f.z), z: p.f.z / Math.hypot(p.f.x, p.f.z) }, c = h0.x * h1.x + h0.z * h1.z;
  if (on) ok(took(p, 'passe') && Math.abs(c) < .6, 'after its pass it leaves across the run\'s axis (' + (Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI).toFixed(0) + ' degrees off it), not back down it');
  else ok(c < -.3, 'without the drill it went back the way it came (' + (Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI).toFixed(0) + ' degrees)');
  DRILL.on = 1; }

console.log('-- plane: badly hurt, and burning --');
{ box('ww2'); const p = C.addPlane(S.E.sides[S.fac[0]].fighter, 0, S.W * .55, 0, 0, Math.PI, true, 'fighter'); p.y = C.hgt(p.x, p.z) + 900; p.inv = 1e9; p.hp = p.def.hp * .4;
  ok(pick(p) === 'avaria', 'under half its hp: ' + pick(p)); const b = S.base[0], d0 = Math.hypot(b.x - p.x, b.z - p.z);
  C.run(12); ok(Math.hypot(b.x - p.x, b.z - p.z) < d0 - 400, 'home: ' + d0.toFixed(0) + ' -> ' + Math.hypot(b.x - p.x, b.z - p.z).toFixed(0) + ' m from its base');
  p.burn = .5; p.hp = p.def.hp * .15; think(p); C.run(.5);
  ok(p.dead && p.end === 3, 'burning under a fifth of its hp: the pilot ejects'); }

console.log('-- plane: the night --');
{ box('ww2'); const p = C.addPlane(S.E.sides[S.fac[0]].fighter, 0, S.W * .4, 0, 0, 0, true, 'fighter'); p.inv = 1e9; p.y = C.hgt(p.x, p.z) + 250;
  ok(pick(p) === null, 'by day, low: nothing'); S.sky.L = 0; ok(pick(p) === 'noite', 'at night, under ' + DRILL.air.night.agl + ' m: ' + pick(p));
  let lo = 1e9; C.run(12, () => { S.sky.L = 0; if (S.t > 8) lo = Math.min(lo, p.y - C.hgt(p.x, p.z)); }); ok(lo > DRILL.air.night.agl - 60, 'it climbs to its safe height (at least ' + lo.toFixed(0) + ' m over the ground after 8 s)'); }

console.log('-- helicopter: a hot landing zone --');
{ box('modern'); const p = C.addHeli(S.E.sides[S.fac[0]].lift || 'uh60', 0, S.W * .3, 0, 0, 0, true); p.inv = 1e9;
  if (!p.def.lift) ok(false, 'no transport helicopter in this era');
  else {
    p.cargo = $('SQUAD').modern.slice(0, 4); C.run(1); const A = p.ha || (p.ha = $('heliBrain')());
    const Z = { x: p.x + 1500, z: p.z, ri: 0, s: 0 }; A.lz = Z; A.st = 'go'; A.T = S.t + 60;
    const e = C.addMan('redRifle', 1, Z.x + 80, Z.z, 0); still(e);
    ok(pick(p) === null, 'an enemy at its landing zone that it has not seen: nothing');
    know(p, e, 2); ok(pick(p) === 'lz-quente', 'seen there: ' + pick(p)); think(p);
    ok(A.lz !== Z && (!A.lz || Math.hypot(A.lz.x - e.x, A.lz.z - e.z) > DRILL.air.lz.r), 'it does not land there: ' + (A.lz ? 'another zone ' + Math.hypot(A.lz.x - e.x, A.lz.z - e.z).toFixed(0) + ' m from the enemy' : 'none, it waits back with the squad')); } }

if (SECS > 0) {
  console.log('-- AI battles: every drill taken for a contact had it among its beliefs --');
  for (const era of ['ww2', 'modern']) {
    const B = H.load({ seed: 9 }), $b = B.$; B.watch(era, {}); const Sb = $b('S');
    let n = 0, bad = 0, veh = 0; const ids = new Set();
    $b('drRun = (g => (o, p) => { const f = p.f && typeof p.f === "object" ? p.f : null; if (!o.men && !(o.dr && o.dr.id === p.D.id)) { globalThis.__n = (globalThis.__n || 0) + 1; globalThis.__ids = globalThis.__ids || new Set(); globalThis.__ids.add(p.D.id); if (f && f.of) { const b = o.bel && o.bel.get(f.of); if (!b || S.t - b.t > 10) globalThis.__bad = (globalThis.__bad || 0) + 1; } } g(o, p); })(drRun)');
    B.run(SECS); n = B.__n || 0; bad = B.__bad || 0;
    ok(n > 10 && bad === 0 && !H.nan(Sb), era + ': ' + n + ' drills taken by vehicles and aircraft (' + [...(B.__ids || [])].sort().join(', ') + '), ' + bad + ' for a contact it did not believe in, no NaN');
  }
}
H.done();
