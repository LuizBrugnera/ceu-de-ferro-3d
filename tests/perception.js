'use strict';
/* perception: field of view, detection time, scanning, sharing and aim of the AI (VIEW, PERC, HEAR, SHARE, SCAN, AIM). Clocks are moved by hand (S.t) where only the
   meter is looked at, and the simulation is run where an AI has to turn or shoot. */
const H = require('./harness'), { ok, done } = H, C = H.load(), $ = C.$;
console.log('page: ' + H.PAGE);
if (!$('typeof VIEW !== "undefined"')) { console.log('no VIEW table: a page before perception'); process.exit(0); }
let S, B, side;
const fresh = era => { C.seed(7); S = C.sandbox(era || 'modern'); B = S.base[0]; side = S.E.sides; return S; };
const man = (team, x, z, h, st) => { const m = C.addMan(team ? 'redRifle' : 'blueRifle', team, B.x + x, B.z + z, h || 0); m.ai = $('manBrain')(0); m.ai.gx = m.x; m.ai.gz = m.z; if (st) { m.st = st; } return m; };
/* seconds until a knows t (the clock stepped by dt), or Infinity */
function tk(a, t, max, dt, each) { dt = dt || .25; const t0 = S.t; for (; S.t - t0 < (max || 30);) { S.t += dt; if (each) each(); if ($('notice')(a, t)) return S.t - t0; } return Infinity; }
const f1 = v => (Number.isFinite(v) ? v.toFixed(1) : 'never');
const rows = [];

fresh(); console.log('-- a soldier: where it looks, and how far --');
{
  const T = (x, z, st, mv) => { fresh(); const a = man(1, 0, 0, 0), t = man(0, x, z, 0, st); t.ai = null; if (mv) t.v = { x: 0, y: 0, z: 5 }; return tk(a, t, 40); };
  const r100 = T(100, 0), r300 = T(300, 0), r550 = T(550, 0), side90 = T(0, -300), rear = T(-300, 0), prone = T(300, 0, 2), crouch = T(300, 0, 1), move = T(300, 0, 0, true);
  rows.push(['soldier front 100 m', r100], ['soldier front 300 m', r300], ['soldier front 550 m', r550], ['soldier side 300 m', side90], ['soldier behind 300 m', rear], ['soldier front 300 m prone', prone], ['soldier front 300 m crouched', crouch], ['soldier front 300 m moving', move]);
  ok(r100 < r300 && r300 < r550, 'closer is noticed sooner: ' + f1(r100) + ' < ' + f1(r300) + ' < ' + f1(r550) + ' s');
  ok(r300 > .8 && r300 < 12, 'at 300 m it takes seconds, not a frame: ' + f1(r300) + ' s');
  ok(side90 > r300 * 1.5, 'to the side it takes longer: ' + f1(side90) + ' s against ' + f1(r300));
  ok(rear === Infinity, 'a still one behind it in the open is not noticed in 40 s');
  ok(prone > r300 * 1.5 && crouch > r300, 'prone ' + f1(prone) + ' s, crouched ' + f1(crouch) + ', standing ' + f1(r300));
  ok(move < r300, 'moving it is noticed sooner: ' + f1(move) + ' s');
  fresh(); const a = man(1, 0, 0, 0), t = man(0, -300, 0, 0); t.ai = null; const f = tk(a, t, 20, .25, () => { t.shotT = S.t; });
  ok(f < 3, 'a shot from behind is heard and the shooter known in ' + f1(f) + ' s');
  fresh(); const a2 = man(1, 0, 0, 0), t2 = man(0, -10, 0, 0); t2.ai = null; t2.v = { x: 0, y: 0, z: 4 };
  ok(tk(a2, t2, 6) < 3, 'one running 10 m behind is heard');
}
console.log('-- smoke and walls --');
{
  fresh(); const a = man(1, 0, 0, 0), t = man(0, 120, 0, 0); t.ai = null;
  for (let x = 20; x <= 100; x += 20) S.smokes.push({ x: B.x + x, y: C.hgt(B.x + x, B.z), z: B.z, t0: S.t - 2 });
  ok(tk(a, t, 10) === Infinity, 'smoke between them: not made out');
}
console.log('-- vehicles --');
{
  const tt = (era, mk, ax, ay) => { fresh(era); const a = mk(); a.f = { x: Math.cos(ay), y: 0, z: -Math.sin(ay) }; const t = C.addVehicle('tank', side[0].tanks[0], 0, B.x + ax[0], B.z + ax[1], 0); return [a, t]; };
  const tank = () => C.addUnit('tank', 1, B.x, B.z, side[1].tanks[0], true);
  let [a, t] = tt('modern', tank, [900, 0], 0); const onAxis = tk(a, t, 30);
  [a, t] = tt('modern', tank, [900 * Math.cos(.8), 900 * -Math.sin(.8)], 0); const off = tk(a, t, 30);
  [a, t] = tt('modern', tank, [-700, 0], 0); const back = tk(a, t, 30);
  rows.push(['tank on its axis, 900 m', onAxis], ['tank 46 deg off its turret, 900 m', off], ['tank behind it, 700 m', back]);
  ok(onAxis < 8 && off > onAxis, 'the gunner sights on the axis (' + f1(onAxis) + ' s); off it only the commander does (' + f1(off) + ' s)');
  ok(back < Infinity && back > 1, 'the commander finds one behind, slowly: ' + f1(back) + ' s');
  fresh('modern'); const aa = C.addUnit('aa', 1, B.x, B.z, side[1].aa, true); aa.f = { x: 1, y: 0, z: 0 }; const pl = C.addPlane(side[0].fighter, 0, B.x - 5000, C.hgt(B.x, B.z) + 1500, B.z, 0, false); pl.v = { x: 200, y: 0, z: 0 };
  const rad = tk(aa, pl, 15);
  fresh('ww2'); const ag = C.addUnit('aa', 1, B.x, B.z, side[1].aa, true); ag.f = { x: 1, y: 0, z: 0 }; const pl2 = C.addPlane(side[0].fighter, 0, B.x - 3500, C.hgt(B.x, B.z) + 1200, B.z, 0, false); pl2.v = { x: 200, y: 0, z: 0 };
  const flakBack = tk(ag, pl2, 30); const pl3 = C.addPlane(side[0].fighter, 0, B.x + 3500, C.hgt(B.x, B.z) + 1200, B.z, 0, false); pl3.v = { x: 200, y: 0, z: 0 }; const flakFront = tk(ag, pl3, 30);
  rows.push(['SAM radar, plane behind at 5 km', rad], ['flak eyes, plane behind at 3.5 km', flakBack], ['flak eyes, plane ahead at 3.5 km', flakFront]);
  ok(rad < 4, 'a radar takes an aircraft all round, behind it too: ' + f1(rad) + ' s');
  ok(flakBack > flakFront * 1.3, 'flak eyes find one ahead (' + f1(flakFront) + ' s) before one behind (' + f1(flakBack) + ' s)');
  fresh('modern'); const p = C.addPlane(side[1].fighter, 1, B.x, C.hgt(B.x, B.z) + 1500, B.z, 0, true); const g = C.hgt(B.x, B.z);
  const tg = C.addVehicle('tank', side[0].tanks[0], 0, B.x + 1800, B.z, 0), tb = C.addVehicle('tank', side[0].tanks[0], 0, B.x - 1800, B.z, 0), tu = C.addVehicle('tank', side[0].tanks[0], 0, B.x + 150, B.z, 0);
  const pf = tk(p, tg, 30), pr = tk(p, tb, 30), pu = tk(p, tu, 30);
  rows.push(['pilot, tank ahead 1800 m', pf], ['pilot, tank behind 1800 m', pr], ['pilot, tank below', pu]);
  ok(pf < Infinity && pr > pf, 'a pilot sees ahead (' + f1(pf) + ' s) before behind (' + f1(pr) + ' s)');
}
console.log('-- scanning --');
{
  fresh(); const u = C.addUnit('tank', 1, B.x, B.z, side[1].tanks[0], true); u.h = 0; let lo = 9, hi = -9; const e = S.base[0];
  C.run(30, () => { const y = Math.atan2(-u.f.z, u.f.x), r = $('wrap')(y - Math.atan2(-(e.z - u.z), e.x - u.x)); lo = Math.min(lo, r); hi = Math.max(hi, r); });
  ok(hi - lo > 1.5 && Math.abs(lo + hi) < 1.2, 'a tank with nothing to shoot at sweeps its turret ' + lo.toFixed(2) + ' to ' + hi.toFixed(2) + ' rad around the enemy');
  fresh(); const m = man(1, 0, 0, 0); let a0 = 9, a1 = -9; C.run(30, () => { const y = Math.atan2(-m.f.z, m.f.x); a0 = Math.min(a0, y); a1 = Math.max(a1, y); });
  ok(a1 - a0 > 1.5, 'a soldier at rest turns to look round: ' + a0.toFixed(2) + ' to ' + a1.toFixed(2) + ' rad');
  fresh(); const u2 = C.addUnit('tank', 1, B.x, B.z, side[1].tanks[0], true); u2.ai.tgt = null; $("boom")(B.x + 300, B.z + 300, 0, 6); C.run(2.5);
  const y = Math.atan2(-u2.f.z, u2.f.x), want = Math.atan2(-300, 300);
  ok(Math.abs($('wrap')(y - want)) < .9, 'a burst heard 420 m off turns the turret toward it (' + y.toFixed(2) + ' rad, burst at ' + want.toFixed(2) + ')');
}
console.log('-- sharing --');
{
  fresh(); const q = C.addSquad(1, B.x, B.z, 0, 0, [0, 0, 0]); const [a, b] = q.men; const far = man(1, 0, 500, 0), q2 = C.addSquad(1, B.x, B.z + 560, 0, 0, [0]), c = q2.men[0];
  for (const m of [a, b, far, c]) { m.ai.tgt = null; m.ctl.mx = m.ctl.mz = 0; }
  a.x = B.x; a.z = B.z; a.f = { x: 1, y: 0, z: 0 }; b.x = B.x - 8; b.z = B.z; b.f = { x: -1, y: 0, z: 0 }; c.x = B.x; c.z = B.z + 400; c.f = { x: -1, y: 0, z: 0 };
  const t = man(0, 150, 0, 0); t.ai = null; t.v = { x: 0, y: 0, z: 3 };
  let ta = null, tb = null, tc = null; const n = $('notice');
  for (let i = 0; i < 160 && (ta === null || tb === null || tc === null); i++) { S.t += .1; if (n(a, t) && ta === null) ta = S.t; if (ta !== null && n(b, t) && tb === null) tb = S.t; if (ta !== null && n(c, t) && tc === null) tc = S.t; }
  ok(ta !== null && tb !== null && tb - ta < 1.2 && b.pm.get(t).told, 'the squad mate with its back turned is told ' + (tb - ta).toFixed(1) + ' s after (table sq ' + $('SHARE').sq + ')');
  ok(tc !== null && tc - ta >= $('SHARE').side - .2 && tc - ta < $('SHARE').side + 1, 'a soldier of another squad is told ' + (tc - ta).toFixed(1) + ' s after (table side ' + $('SHARE').side + ')');
}
console.log('-- the side\'s map --');
{
  fresh(); const a = man(1, 0, 0, 0), t = man(0, 100, 0, 0); t.ai = null; t.v = { x: 0, y: 0, z: 3 }; let kn = null, seen = null;
  C.run(20, () => { if (kn === null && a.pm && a.pm.get(t) && a.pm.get(t).kn) kn = S.t; if (seen === null && S.t - t.seenT < 1) seen = S.t; return seen === null; });
  ok(kn !== null && seen !== null && seen - kn >= $('SHARE').report - .1, 'the soldier knew it at ' + f1(kn) + ' s, the side\'s map had it at ' + f1(seen) + ' s (report ' + $('SHARE').report + ' s)');
  ok(Math.abs(t.sx - t.x) <= $('SHARE').err + 1 && Math.abs(t.sz - t.z) <= $('SHARE').err + 1, 'and to within ' + $('SHARE').err + ' m');
}
console.log('-- aim --');
{
  fresh(); const a = C.addUnit('tank', 1, B.x, B.z, side[1].tanks[0], true), t = C.addVehicle('tank', side[0].tanks[0], 0, B.x + 800, B.z, Math.PI); a.skill = .775; a.f = { x: 1, y: 0, z: 0 };
  const e = $('meter')(a, t); e.kn = true; e.kt = S.t; const eoff = (a.f = { x: 0, y: 0, z: 1 }, $('aimErr')(a, t, 800)); a.f = { x: 1, y: 0, z: 0 }; const e0 = $('aimErr')(a, t, 800); S.t += 1.2; const e1 = $('aimErr')(a, t, 800); S.t += 6; const e2 = $('aimErr')(a, t, 800);
  ok(eoff >= e0 && e0 > e1 && e1 > e2 && e2 === 0, 'a tank not yet on a target just made out is off by ' + eoff.toFixed(4) + ', on it ' + e0.toFixed(4) + ' rad, ' + e1.toFixed(4) + ' after 1.2 s, ' + e2.toFixed(4) + ' once settled and still');
  t.v = { x: 0, y: 0, z: 10 }; const ex = $('aimErr')(a, t, 800); ok(ex > 0, 'crossing at 10 m/s adds ' + ex.toFixed(4) + ' rad');
  a.v = { x: 6, y: 0, z: 0 }; ok($('aimErr')(a, t, 800) > ex, 'a moving shooter adds more');
  a.skill = .95; const hi = $('aimErr')(a, t, 800); a.skill = .6; ok($('aimErr')(a, t, 800) > hi, 'skill matters: .6 is worse than .95');
  fresh(); const m = man(1, 0, 0, 0), s = man(0, 40, 0, 0); s.ai = null; m.skill = .775; const em = $('meter')(m, s); em.kn = true; em.kt = S.t - 9; em.on = S.t - 9;
  ok($('aimErr')(m, s, 40) === 0, 'a soldier settled on a still target 40 m away adds nothing');
  const mm = man(1, 0, 20, 0), ts = man(0, 40, 20, 0); ts.ai = null; mm.skill = .775; const en = $('meter')(mm, ts); en.kn = true; en.kt = S.t; en.on = S.t; en.told = true; const et = $('aimErr')(mm, ts, 40); en.told = false; const eo = $('aimErr')(mm, ts, 40);
  ok(et > eo, 'one told of a target aims worse than one that saw it: ' + et.toFixed(4) + ' against ' + eo.toFixed(4));
  fresh(); const g = C.addUnit('tank', 1, B.x, B.z, side[1].tanks[0], true), gs = man(0, 0, -150, 0); gs.ai = null; g.skill = .775; g.f = { x: 1, y: 0, z: 0 };
  const eg = $('meter')(g, gs); eg.kn = true; eg.kt = S.t; const mg = $('vnorm')({ x: gs.x - g.x, y: gs.y - g.y, z: gs.z - g.z }), f0 = $('aimErr')(g, gs, 150, mg); S.t += 8; const f8 = $('aimErr')(g, gs, 150, mg), b8 = $('aimErr')(g, gs, 150);
  ok(f0 > 0 && f8 === 0 && b8 > 0, 'a free gun laid on its target settles by its own line, the turret turned away: ' + f0.toFixed(4) + ' rad, ' + f8.toFixed(4) + ' after 8 s (by the turret\'s line ' + b8.toFixed(4) + ')');
  fresh(); const u = C.addUnit('tank', 1, B.x, B.z, side[1].tanks[0], true), v = C.addVehicle('tank', side[0].tanks[0], 0, B.x + 700, B.z, Math.PI), w = man(0, 0, -150, 0);
  v.ai = null; v.inv = 1e9; w.ai = null; w.inv = 1e9; w.hp = 1e9; u.skill = .775;
  C.run(14);
  const xs = u.ctl.sp[1] - $('IAI').tank.sp;
  ok(u.ai.tgt && u.ai.inf && u.ctl.aim2 && u.f.x > .9 && xs < 1e-3, 'an AI tank\'s roof gun settles on a soldier to its side while the turret holds on a tank ahead: ' + xs.toFixed(4) + ' rad over its spread');
}
console.log('-- no table the player sees changed; a player or a drone is never held back --');
{
  fresh(); const P = man(0, 0, 0, 0); P.ai = null; const t = man(1, 5, 0, 0);
  ok($('notice')(P, t) === true && $('aware')(P, t, 3) === true, 'a soldier with no AI (the player) knows at once');
}
const ladder = [], duel = [];
if ($('typeof LADDER !== "undefined"')) {
  const g = $('grade');
  /* seconds from the start until a has t detected (grade 1), recognized (2) and identified (3), the clock stepped by dt; Infinity for a rung not reached */
  const rungs = (a, t, max, dt) => { dt = dt || .1; const t0 = S.t, r = [Infinity, Infinity, Infinity]; for (; S.t - t0 < max && r[2] === Infinity;) { S.t += dt; const k = g(a, t); for (let i = 0; i < k; i++) if (r[i] === Infinity) r[i] = S.t - t0; } return r; };
  console.log('-- the ladder: detected, recognized, identified --');
  {
    const R = (kit, x, st) => { fresh(); const a = C.addMan(kit, 1, B.x, B.z, 0); a.ai = $('manBrain')(0); a.ai.gx = a.x; a.ai.gz = a.z; const t = man(0, x, 0, 0, st); t.ai = null; return rungs(a, t, 60); };
    const r100 = R('redRifle', 100), r300 = R('redRifle', 300), r550 = R('redRifle', 550), s550 = R('redSniper', 550), p300 = R('redRifle', 300, 2);
    ladder.push(['rifleman, soldier 100 m', r100], ['rifleman, soldier 300 m', r300], ['rifleman, soldier 550 m', r550], ['sniper (scope), soldier 550 m', s550], ['rifleman, soldier prone 300 m', p300]);
    ok([r100, r300, r550, s550, p300].every(r => r[0] <= r[1] && r[1] <= r[2]), 'each rung comes after the one below it');
    ok(r100[2] - r100[0] < 1.5, 'at 100 m a soldier is made out, class and side, within ' + f1(r100[2] - r100[0]) + ' s of being noticed');
    ok(r550[1] - r550[0] > r100[1] - r100[0] && r550[2] - r550[1] > 4, 'at 550 m the class takes ' + f1(r550[1] - r550[0]) + ' s more and the side ' + f1(r550[2] - r550[1]) + ' s more than that');
    ok(s550[2] < r550[2] - 3, 'a scope makes the side out sooner: ' + f1(s550[2]) + ' s against ' + f1(r550[2]) + ' s by eye');
    ok(p300[1] > r300[1], 'a prone soldier is recognized later than a standing one: ' + f1(p300[1]) + ' s against ' + f1(r300[1]));
    const T = (ax, h) => { fresh('modern'); const a = C.addUnit('tank', 1, B.x, B.z, side[1].tanks[0], true); a.f = { x: Math.cos(h), y: 0, z: -Math.sin(h) }; const t = C.addVehicle('tank', side[0].tanks[0], 0, B.x + ax, B.z, 0); return rungs(a, t, 60); };
    const tOn = T(1500, 0), tOff = T(1500, .8);
    ladder.push(['tank gunner sight, tank 1500 m', tOn], ['tank commander only, tank 1500 m', tOff]);
    ok(tOn[2] < tOff[2], 'a tank\'s gunner sight identifies another at 1500 m in ' + f1(tOn[2]) + ' s; 46 deg off it, the commander in ' + f1(tOff[2]) + ' s');
  }
  console.log('-- reaction: nothing is acted on at once --');
  {
    const L = $('LADDER'); let worst = 9, best = 0;
    for (let i = 0; i < 12; i++) {
      fresh(); S.qsd = 7919 * (i + 1); const a = man(1, 0, 0, 0), t = man(0, 6, 0, 0); t.ai = null; let t1 = null, t2 = null; const t0 = S.t;
      for (; S.t - t0 < 3 && t2 === null;) { S.t += .05; const k = g(a, t); if (k >= 1 && t1 === null) t1 = S.t; if (k >= 2) t2 = S.t; }
      worst = Math.min(worst, t2 - t1); best = Math.max(best, t2 - t1);
    }
    ok(worst >= L.react[0] - .06 && best <= L.react[1] + .2, 'a soldier 6 m off is shot at only ' + worst.toFixed(2) + ' to ' + best.toFixed(2) + ' s after it is seen (react ' + L.react.join(' to ') + ' s)');
    fresh(); const a = man(1, 0, 0, 0), t = man(0, 6, 0, 0); t.ai = null; $('notice')(a, t);
    ok(!$('known')(a.ai, a, t), 'in that moment it is not a target (known is false)');
  }
  console.log('-- only what it made out is shot at --');
  {
    fresh(); const a = man(1, 0, 0, 0), t = man(0, 250, 0, 0); t.ai = null; const e = $('meter')(a, t);
    Object.assign(e, { v: 1.2, kn: true, kt: S.t - 5, t: S.t, rc: 0, ic: 0 }); a.ln = null; S.t += .2;
    $('manThink')(a);
    ok(g(a, t) === 1 && a.ai.tgt === null, 'one only detected (no class yet) is not picked');
    ok(!!a.ln && a.ln.of === t && Math.hypot(a.ln.x - t.x, a.ln.z - t.z) <= 250 * L_err() + 1, 'it looks that way instead, ' + (a.ln ? Math.hypot(a.ln.x - t.x, a.ln.z - t.z).toFixed(1) : '-') + ' m off where it is');
    e.rc = 1; S.t += .2; $('manThink')(a);
    ok(g(a, t) >= 2 && a.ai.tgt === t, 'once its class is made out it is the target');
    fresh('modern'); const at = C.addMan('blueAT', 0, B.x, B.z, 0); at.ai = $('manBrain')(0); at.ai.gx = at.x; at.ai.gz = at.z;
    const tk = C.addVehicle('tank', side[1].tanks[0], 1, B.x + 600, B.z, 0), ea = $('meter')(at, tk);
    const kit = at.arms[1].d.k;
    Object.assign(ea, { v: 1.2, kn: true, kt: S.t - 5, t: S.t, rc: 1, ic: 0 }); S.t += .2; $('manThink')(at);
    if (kit === 'atgm') {
      ok(g(at, tk) === 2 && !(at.ai.tgt === tk && at.ctl.w === 1), 'a guided missile is not laid on a tank only recognized');
      ea.ic = 1; S.t += .2; $('manThink')(at);
      ok(g(at, tk) === 3 && at.ai.tgt === tk && at.ctl.w === 1, 'identified, it is');
    } else ok(false, 'blueAT carries ' + kit + ', not a guided missile');
  }
  console.log('-- first shot and hits, by distance --');
  {
    /* an AI rifleman against one standing still in the open, facing it: when it first fires, and what share of 20 s of fire hits */
    let hits = 0; $('impact = (g => (...a) => { if (a[0] && a[0].__h) a[0].__h(); return g(...a); })(impact)');
    const D = x => { fresh(); const E = S.base[1], L = Math.hypot(E.x - B.x, E.z - B.z), ux = (E.x - B.x) / L, uz = (E.z - B.z) / L;   // on its side's axis, where it looks
      const a = C.addMan('blueRifle', 0, B.x + ux * 60, B.z + uz * 60, Math.atan2(-uz, ux)); a.ai = $('manBrain')(0); a.ai.gx = a.x; a.ai.gz = a.z; a.skill = .775;
      const t = C.addMan('redRifle', 1, a.x + ux * x, a.z + uz * x, 0); t.ai = null; t.__h = () => { if (t.hT !== S.t) hits++; t.hT = S.t; }; hits = 0;
      const t0 = S.t; let first = Infinity, n = 0, st = a.shotT; C.run(25, () => { if (a.shotT !== st) { st = a.shotT; n++; if (first === Infinity) first = S.t - t0; } t.hp = t.max; t.dead = false; return S.t - t0 < first + 20; });
      return [first, n ? hits / n : 0]; };
    for (const x of [100, 200, 330]) { const [f, h] = D(x); duel.push(['rifleman, standing soldier ' + x + ' m', f, h]); }
    ok(duel.every(r => r[1] >= .3), 'the first shot is never at once: the soonest at ' + Math.min(...duel.map(r => r[1])).toFixed(1) + ' s');
    ok(duel[0][1] < duel[1][1] && duel[1][1] < duel[2][1] && duel[2][1] < Infinity, 'it comes later the farther it is: ' + duel.map(r => f1(r[1])).join(', ') + ' s');
    ok(duel[0][2] > duel[2][2], 'and hits less: ' + duel.map(r => (100 * r[2]).toFixed(0) + '%').join(', '));
  }
  console.log('-- told: the class goes round, the side does not --');
  {
    fresh(); const q = C.addSquad(1, B.x, B.z, 0, 0, [0, 0]); const [a, b] = q.men; for (const m of [a, b]) { m.ai.tgt = null; m.ctl.mx = m.ctl.mz = 0; }
    a.x = B.x; a.z = B.z; a.f = { x: 1, y: 0, z: 0 }; b.x = B.x - 8; b.z = B.z; b.f = { x: -1, y: 0, z: 0 };
    const t = man(0, 150, 0, 0); t.ai = null; t.v = { x: 0, y: 0, z: 3 }; let ga = 0, gb = 0;
    for (let i = 0; i < 100 && !(ga >= 2 && gb >= 1); i++) { S.t += .1; ga = g(a, t); gb = g(b, t); }
    const eb = b.pm.get(t); S.t += 1; gb = g(b, t); ga = g(a, t);
    ok(ga >= 2 && eb && eb.told && gb === 2, 'the mate with its back turned has the class (' + gb + ') from the one who saw it (' + ga + '), not the side');
  }
  console.log('-- confusion: a friend only recognized, far off, may be taken for a foe --');
  {
    const L = $('LADDER'), FFo = $('FF'), foe = $('foe'), m0 = L.mis, f0 = FFo.on;
    const run = (dist, ff, face) => { fresh(); S.qsd = 12345; L.mis = 1; FFo.on = ff; const a = man(0, 0, 0, face), t = man(0, dist, 0, 0); t.ai = null; let seen = false, mistaken = false, id = false;
      for (let i = 0; i < 400; i++) { S.t += .1; const k = g(a, t); if (k === 2) { seen = true; if (foe(a, t)) mistaken = true; } if (k === 3) { id = true; if (foe(a, t)) mistaken = 'identified'; } }
      return { seen, mistaken, id }; };
    try {
      const far = run(300, 1, 0), off = run(300, 0, 0), near = run(60, 1, 0), blind = run(300, 1, Math.PI);
      ok(far.seen && far.mistaken === true, 'far off, friendly fire on, only recognized: a friend can be taken for a foe');
      ok(off.seen && !off.mistaken, 'never with friendly fire off');
      ok(near.id && !near.mistaken, 'never up close, where it is identified');
      ok(far.mistaken !== 'identified', 'never once identified');
      ok(!blind.seen && !blind.mistaken, 'never a friend it has not made out (back turned: grade never reached 2)');
      L.mis = 0; fresh(); FFo.on = 1; const a = man(0, 0, 0, 0), t = man(0, 300, 0, 0); t.ai = null; let any = false; for (let i = 0; i < 400; i++) { S.t += .1; g(a, t); if (foe(a, t)) any = true; }
      ok(!any, 'and with no confusion rolled, never');
    } finally { L.mis = m0; FFo.on = f0; }
  }
  console.log('-- honesty: a battle of AI against AI, every shot checked --');
  {
    const SECS = +process.env.SECS || 90, SPOT = $('SPOT'), spotted = $('spotted'), SIGHT = $('SIGHT'), tclass = $('tclass');
    for (const era of ['ww2', 'modern']) {
      C.seed(3); const S2 = C.newState(era); S = S2; $('DAI').every = 1e9;   // no drones: one striking a supply base crashes droneSweep (a bug of its own, outside perception)
      $('cmdArea = (g => (m, A, c) => { const r = g(m, A, c); if (r) A.areaT = S.t; return r; })(cmdArea)');
      const mem = (o, t) => [o.ai, o.ai && o.ai.lm, o.ai && o.ai.im].some(M => M && M.mem && M.mem.of === t && S.t - M.mem.t < SIGHT.mem + .1);
      let shots = 0, area = 0, indirect = 0, bad = [], gm = 0, gbad = []; const seen = new Set();
      C.run(SECS, () => {
        for (const l of [S.units, S.men, S.planes]) for (const o of l) {
          if (o.dead || !o.ai) continue;
          let f = o.shotT === S.t; if (o.arms) for (const a of o.arms) if (a.t === S.t) f = true;
          if (!f) continue;
          const A = o.ai, fm = A.fm && A.fm.t;
          if (fm) { indirect++; if (!(fm.cm || spotted(fm) || S.t - fm.seenT < SPOT.keep + 1)) bad.push('fire mission on an unspotted ' + (fm.kind || (fm.sup ? 'base' : '?'))); continue; }
          const ts = (o.man ? [A.tgt] : o.def && o.def.vmax ? [o.tgt, A.tgt] : [A.tgt, A.low, A.inf]).filter(Boolean);
          if (!ts.length && (A.areaT === S.t || (A.dx && A.dx.fire && S.t <= A.dx.T))) { area++; continue; }   // covering fire into an objective, or a drill's fire into a smoke screen it sees (DRILLS: fumaca)
          shots++;
          if (!ts.some(t => !tclass(t) || g(o, t) >= 2 || mem(o, t))) bad.push((o.man ? 'soldier' : o.kind || 'aircraft') + ' at ' + (ts.map(t => (t.man ? 'soldier' : t.kind || 'aircraft') + ' g' + g(o, t)).join(', ') || 'nothing') + ' t=' + S.t.toFixed(1));
        }
        for (const m of S.missiles) { if (seen.has(m)) continue; seen.add(m); const b = m.by, t = m.target; if (!b || !b.ai || !t || !tclass(t)) continue; gm++; if (g(b, t) < 3) gbad.push((b.man ? 'soldier' : b.kind || 'aircraft') + ' g' + g(b, t)); }
      });
      ok(shots > 50 && !bad.length, era + ', ' + SECS + ' s: ' + shots + ' aimed shots, ' + area + ' of covering fire into an objective or a smoke screen, ' + indirect + ' indirect on the side\'s map; at what it had not made out: ' + bad.length + (bad.length ? ' (' + bad.slice(0, 3).join('; ') + ')' : ''));
      ok((era === 'ww2' || gm > 0) && !gbad.length, era + ': ' + gm + ' guided missiles at a target, every one identified first' + (gbad.length ? '; not: ' + gbad.slice(0, 3).join(', ') : ''));
    }
  }
}
function L_err() { return $('LADDER').err; }
console.log('\n' + 'what                                     seconds to know'); for (const r of rows) console.log(r[0].padEnd(42) + f1(r[1]));
if (ladder.length) { console.log('\n' + 'what'.padEnd(42) + 'detected  recognized  identified (s)'); for (const r of ladder) console.log(r[0].padEnd(42) + r[1].map(v => f1(v).padEnd(10)).join('  ')); }
if (duel.length) { console.log('\n' + 'what'.padEnd(42) + 'first shot (s)  hits'); for (const r of duel) console.log(r[0].padEnd(42) + f1(r[1]).padEnd(16) + (100 * r[2]).toFixed(0) + '%'); }
done();
