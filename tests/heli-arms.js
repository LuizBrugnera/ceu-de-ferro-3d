'use strict';
/* helicopters, weapons and cargo: the turret off the nose, rockets, the guided missile and smoke, flares, door guns, a squad in and out */
const H = require('./harness'), { ok, done } = H, C = H.load({ seed: 23 }), $ = C.$;
const HELIS = $('HELIS'), HFM = $('HFM'), f1 = v => v.toFixed(1), deg = a => (a * 57.3).toFixed(0), TRIALS = +process.env.TRIALS || 30;
let S;
const hdg = p => Math.atan2(-p.f.z, p.f.x), wrap = a => a - 2 * Math.PI * Math.round(a / (2 * Math.PI)), agl = p => p.y - C.hgt(p.x, p.z) - p.def.gh;
/* the player in a helicopter over the friendly airfield's flat ground, h m up; nothing else on the map */
function player(id, h, mouse) {
  S = C.sandbox('modern'); S.cls = 'heli'; S.model = id; S.pref = mouse !== false; const p = C.spawnPlayer(); p.inv = 0;
  if (h) { p.y += h; p.land = false; p.ct = p.ctl.col = .6; }
  return p;
}
const ahead = (p, d, off, h) => { const a = hdg(p) + (off || 0), x = p.x + Math.cos(a) * d, z = p.z - Math.sin(a) * d; return { x, z, y: C.hgt(x, z) + (h || 0) }; };
const target = (kind, id, at) => { const u = C.addVehicle(kind, id, 1, at.x, at.z, 0); u.inv = 0; return u; };
/* the aim that puts the cross on t from where the view is */
function aimAt(p, t, up) {
  const A = S.aim, ty = t.kind ? t.y + 2 : t.y; let d = { x: t.x - p.x, y: ty - p.y, z: t.z - p.z };
  for (let i = 0; i < 4; i++) { const l = Math.hypot(d.x, d.y, d.z), a = { x: d.x / l, y: d.y / l, z: d.z / l }, e = $("heliEye")(p, a); d = { x: t.x - e.x, y: ty + (up || 0) - e.y, z: t.z - e.z }; }
  A.h = Math.atan2(-d.z, d.x); A.p = Math.asin(d.y / Math.hypot(d.x, d.y, d.z));
}
console.log('the chin gun on a truck the nose is not on');
{
  let p = player('ah64', 60), t = target('truck', null, ahead(p, 500, -1.3)), first = null, off0 = 0;
  const offNose = () => Math.abs(wrap(Math.atan2(-(t.z - p.z), t.x - p.x) - hdg(p)));
  C.run(8, () => { aimAt(p, t); S.input.fire = true; if (first === null && t.hp < t.max) { first = S.t; off0 = offNose(); } if (t.dead) return false; });
  console.log('  truck 500 m away, 74° to the right, the nose free to follow: first hit after ' + f1(first || 0) + ' s with the nose still ' + deg(off0) + '° off it; ' + (t.dead ? 'destroyed at ' + f1(S.t) + ' s' : 'structure ' + Math.round(t.hp)) + ', rounds ' + (p.def.gun.ammo - p.ammo));
  ok(first !== null && t.dead, 'the gun kills a truck off to the side');
  p = player('ah64', 60); t = target('truck', null, ahead(p, 500, -1)); S.input.brake = true; C.run(.1); S.input.brake = false; first = null;
  C.run(8, () => { aimAt(p, t); S.input.fire = true; if (first === null && t.hp < t.max) { first = S.t; off0 = offNose(); } if (t.dead) return false; });
  console.log('  hover hold on, truck 57° to the right: first hit after ' + f1(first || 0) + ' s, destroyed at ' + f1(S.t) + ' s with the nose ' + deg(offNose()) + '° off it and the turret at ' + deg(p.ty) + '°');
  ok(t.dead && offNose() > .9, 'in the hover hold the turret follows the aim and the nose stays');
  p = player('ah64', 160); t = target('truck', null, ahead(p, 300, 0)); S.input.brake = true; C.run(.1); S.input.brake = false; let lo = 0;
  C.run(8, () => { aimAt(p, t); S.input.fire = true; lo = Math.min(lo, Math.asin(p.f.y)); if (t.dead) return false; });
  console.log('  truck 28° under the nose, hover hold on: nose lowest ' + deg(lo) + '°, gun at ' + deg(p.tp) + '°: ' + (t.dead ? 'destroyed at ' + f1(S.t) + ' s' : 'alive'));
  ok(t.dead && lo > -.1, 'the gun depresses on its own while the nose holds the hover');
  p = player('ah64', 60, false); t = target('truck', null, ahead(p, 600, .5)); C.run(6, () => { S.input.fire = true; if (t.dead) return false; });
  console.log('  classic controls, truck 29° left of the nose at 600 m: ' + (t.dead ? 'destroyed at ' + f1(S.t) + ' s' : 'structure ' + Math.round(t.hp)) + ', the nose never turned (' + deg(Math.abs(wrap(Math.atan2(-(t.z - p.z), t.x - p.x) - hdg(p)))) + '° off)');
  ok(t.dead, 'without the mouse the turret takes the nearest target to the nose');
  S.input.fire = false;
}
console.log('rockets');
{
  const p = player('ah64', 50), at = ahead(p, 900, 0), ts = [0, 1, 2].map(i => target('truck', null, { x: at.x + i * 12 - 12, z: at.z + (i % 2) * 10 }));
  C.run(3, () => { aimAt(p, ts[1], 6); }); const n0 = p.ord[0];
  C.run(6, () => { aimAt(p, ts[1], 6); S.input.ordA = S.t % 1 < .5; }); S.input.ordA = false; C.run(4);
  console.log('  ' + (n0 - p.ord[0]) + ' rockets from 900 m at three trucks: ' + ts.filter(t => t.dead).length + ' destroyed, the others at ' + ts.filter(t => !t.dead).map(t => Math.round(t.hp)).join(', '));
  ok(n0 - p.ord[0] > 6 && ts.some(t => t.dead), 'a ripple of rockets destroys soft vehicles');
}
console.log('the guided missile, its lock and smoke');
{
  let p = player('ah64', 120), t = target('tank', 't90', ahead(p, 3000, .1)), lockT = 0;
  C.run(4, () => { aimAt(p, t); if (S.lockGnd === t && !lockT) lockT = S.t; });
  ok(S.lockGnd === t, 'the sight locks a tank 3 km away under the aim (after ' + f1(lockT) + ' s of turning onto it)');
  S.input.ordB = true; C.run(.1); S.input.ordB = false; const m = S.missiles[0]; ok(m && m.gnd && m.target === t, 'the missile leaves with that target');
  const t0 = S.t; C.run(25, () => { if (t.dead) return false; });
  console.log('  T-90 at 3000 m: ' + (t.dead ? 'destroyed ' + f1(S.t - t0) + ' s after launch' : 'alive, structure ' + Math.round(t.hp))); ok(t.dead, 'one missile kills the tank');
  p = player('ah64', 120); t = target('tank', 't90', ahead(p, 3000, .1)); C.run(4, () => { aimAt(p, t); });
  S.input.ordB = true; C.run(.1); S.input.ordB = false; C.run(3); t.smk = 3; C.popSmoke(t); C.run(1.5);
  const lost = !S.missiles[0] || S.missiles[0].target === null, noLock = S.lockGnd === null; C.run(20);
  console.log('  same shot, the tank fires its smoke 3 s after launch: missile ' + (lost ? 'lost its target' : 'still tracking') + ', sight ' + (noLock ? 'cannot lock' : 'still locked') + ', tank ' + (t.dead ? 'destroyed' : 'alive with ' + Math.round(t.hp)));
  ok(lost && noLock && !t.dead, 'smoke breaks the missile\'s lock and the sight\'s');
}
console.log('flares: ' + TRIALS + ' missiles each way, at a helicopter hovering 150 m up');
{
  const run = (kind, flares) => {
    let hits = 0;
    for (let i = 0; i < TRIALS; i++) {
      C.seed(100 + i); const p = player('ah64', 150); p.hp = 1e6; let m, was = p.hp;
      if (kind === 'sam') { const u = target('aa', 'pantsir', ahead(p, 2500, i * .2)); u.ai = null; u.ctl.lock = p; m = C.launchSam(u, u.arms[0].d, p); m.u = u; }
      else { const at = ahead(p, 900, i * .2), s = C.addMan('redAD', 1, at.x, at.z, 0), w = s.arms[1].d, e = $("manEye")(s); m = $('MSHOT').sam(s, w, e, C.vnorm({ x: p.x - e.x, y: p.y - e.y, z: p.z - e.z }), p); }
      C.run(14, () => { if (m.u) m.u.ctl.lock = p; S.input.flare = flares && !!S.threat && S.threat.eta < 3; if (m.gone) return false; });
      if (p.hp < was) hits++;
    }
    return hits;
  };
  for (const k of ['sam', 'igla']) { const a = run(k, false), b = run(k, true); console.log('  ' + (k === 'sam' ? 'Pantsir missile from 2.5 km' : 'Igla from 900 m') + ': hits ' + a + '/' + TRIALS + ' with no flares, ' + b + '/' + TRIALS + ' with flares thrown in its last 3 s'); ok(k === 'sam' ? a > TRIALS * .8 && b > a * .8 : a > TRIALS * .8 && b < a * .85, k === 'sam' ? 'the radar-commanded missile hits, and neither flares nor chaff save a helicopter that hovers' : 'flares decoy the heat seeker part of the time'); }
  S.input.flare = false;
}
console.log('door guns');
{
  let p = player('uh60', 30), at = ahead(p, 160, -1.57), sq = C.addSquad(1, at.x, at.z, 0, 0); sq.men.forEach(m => { m.ai = null; m.inv = 0; });
  C.run(12); const k1 = sq.men.filter(m => m.dead).length;
  console.log('  squad 160 m off the right door, nobody on the trigger: the gunner kills ' + k1 + ' of ' + sq.men.length + ' in 12 s (' + (p.def.gun.ammo - p.ammo) + ' rounds)'); ok(k1 >= 2, 'a door gunner engages by himself');
  p = player('uh60', 30); at = ahead(p, 160, 1.4); const t = target('truck', null, at); p.dg = null; p.dgT = 1e9;
  S.input.brake = true; C.run(.1); S.input.brake = false;
  C.run(8, () => { p.dgT = 1e9; p.dg = null; aimAt(p, t); S.input.fire = true; if (t.dead) return false; });
  console.log('  hover hold, the pilot firing on a truck 160 m off the left door: ' + (t.dead ? 'destroyed at ' + f1(S.t) + ' s' : t.hp < t.max ? 'hit, structure ' + Math.round(t.hp) + ' of ' + t.max : 'not hit') + ', door ' + (p.gs < 0 ? 'left' : 'right'));
  ok(t.hp < t.max && p.gs < 0, 'the pilot fires the door gun on the side of the aim');
  p = player('uh60', 30); p.dgT = 1e9; S.aim.h = hdg(p); S.aim.p = -.1; S.input.fire = true; const a0 = p.ammo; C.run(2); ok(p.ammo === a0, 'no door gun fires straight ahead'); S.input.fire = false;
}
console.log('a squad in and out of a transport');
for (const id of ['uh60', 'mi8']) {
  const team = HELIS[id].side; S = C.sandbox('modern'); S.fac = [team, 1 - team]; S.cls = 'heli'; S.model = id; S.pref = true; const p = C.spawnPlayer(); p.inv = 0; p.cargo = null;   // it takes off loaded from the reserve (cf-transporte-jogador): empty, to embark
  const at = ahead(p, 20, 1.57), sq = C.addSquad(0, at.x, at.z, 0, 0), n = sq.men.length, press = () => { S.input.smoke = true; C.run(.05); S.input.smoke = false; C.run(.05); };
  C.run(1); press();
  ok(p.cargo && p.cargo.length === n && S.men.length === 0 && S.squads.length === 0, id + ' landed beside a squad: G takes its ' + n + ' men aboard, and they are off the field');
  const y0 = p.y, m0 = p.def.m; S.input.thrUp = true; C.run(8); S.input.thrUp = false; press(); ok(p.cargo && p.cargo.length === n, 'in the air, too high for the fast-rope and too low to jump, G keeps them (' + S.liftMsg.why + ', ' + Math.round(p.y - C.hgt(p.x, p.z)) + ' m)');
  S.aim.p = -.25; C.run(12); S.aim.p = .2; C.run(5); S.aim.p = 0; S.input.brake = true; C.run(.1); S.input.brake = false; C.run(6);
  let tv = 0; C.run(40, () => { S.input.thrDown = true; if (p.land) return false; tv = -p.v.y; }); S.input.thrDown = false; C.run(2);
  const far = Math.hypot(p.x - at.x, p.z - at.z); press(); C.run(1);
  const q = S.squads[0];
  console.log('  ' + id + ': flown ' + Math.round(far) + ' m, touched down at ' + f1(tv) + ' m/s, structure ' + Math.round(p.hp / p.def.hp * 100) + '%: ' + S.men.length + ' men out, ' + (q ? 'order ' + q.ord.k + ' ' + Math.round(Math.hypot(q.ord.x - p.x, q.ord.z - p.z)) + ' m from the helicopter' : 'no squad'));
  ok(!p.cargo && S.men.length === n && q && q.ord.k === 'hold' && far > 150 && !p.dead, id + ' unloads the same ' + n + ' men where it lands, holding there');
  const kits = S.men.map(m => m.id).sort().join(), want = $('SQUAD').modern.map(k => $('INF').modern[team][k]).sort().join(); ok(kits === want, 'with the kits they had');
}
done();
