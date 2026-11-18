'use strict';
/* missiles: each family at a scripted target, TRIALS times per scenario, and the rates that come out (hit: any damage; decoy: it ended on a
   flare or chaff; lost: its track broke). The shooter and the target fly on rails, so the geometry is the scenario's and nothing else */
const H = require('./harness'), { ok, done } = H, C = H.load({ seed: 5 }), $ = C.$, MSL = $('MSL'), STORES = $('STORES'), TRIALS = +process.env.TRIALS || 30;
const pct = (n, d) => Math.round(100 * n / (d || TRIALS)) + '%', yawQ = $('yawQ'), axes = $('axes'), ASPD = $('ASPD');
let S;
/* a plane held on a straight line: heading h rad, airspeed V, throttle thr (above .9 a jet is in afterburner) */
function rail(id, team, x, y, z, h, V, thr) {
  const p = C.addPlane(id, team, x, y, z, h, false, 'fighter'); p.hp = p.def.hp; p.inv = 0;
  p.rl = { x, y, z, h, V, thr: thr === undefined ? .85 : thr, t0: S.t };
  return p;
}
function hold(p) {
  const r = p.rl, t = S.t - r.t0, c = Math.cos(r.h), s = -Math.sin(r.h);
  if (p.dead) return;
  p.x = r.x + c * r.V * ASPD * t; p.z = r.z + s * r.V * ASPD * t; p.y = r.agl ? C.hgt(p.x, p.z) + r.agl : r.y; p.v = { x: c * r.V, y: 0, z: s * r.V }; p.V = r.V; p.q = yawQ(r.h); p.w = { x: 0, y: 0, z: 0 }; axes(p);
  p.ctl.thr = r.thr; p.ctl.pitch = p.ctl.roll = p.ctl.yaw = 0; p.ab = !!p.def.Tab && r.thr > .9;
}
/* one air engagement. o: store; sh [x, y, z, heading, airspeed] the shooter; tg the same for the target, with its throttle; cm: flares and
   chaff from the moment the missile is within this many s; turn: the target breaks at this g (as a change of heading) inside 3 s */
function air(o, name, sh, tg, opt) {
  opt = opt || {}; const R = { hit: 0, kill: 0, decoy: 0, lost: 0, none: 0 };
  for (let i = 0; i < TRIALS; i++) {
    C.seed(300 + i * 7919); for (let k = 0; k < 30; k++) Math.random.call ? C.$("Math.random()") : 0; S = C.sandbox('modern');
    const a = rail(opt.from || 'f22', 0, sh[0], sh[1], sh[2], sh[3], sh[4]), b = rail(opt.id || 'su57', 1, tg[0], tg[1], tg[2], tg[3], tg[4], tg[5]); if (opt.agl) b.rl.agl = opt.agl; hold(a); hold(b);
    b.flares = opt.cm ? 60 : 0;
    const m = MSL.arm({ x: a.x, y: a.y - 2, z: a.z, target: b, o, team: 0, by: a }, a.f, a); S.missiles.push(m);
    let dec = false, was = b.hp;
    C.run(opt.secs || 24, () => {
      hold(a); hold(b);
      const eta = C.$('dist')(m, b) / Math.max(m.v, 200);
      if (opt.turn && eta < 3) b.rl.h += opt.turn * 9.81 / b.rl.V / 60, b.rl.x = b.x, b.rl.z = b.z, b.rl.t0 = S.t;
      if (opt.cm && eta < opt.cm) C.dropFlare(b);
      if (m.target && m.target.flare) dec = true;
      return !m.gone && !b.dead;
    });
    if (b.dead) R.kill++;
    if (b.hp < was || b.dead) R.hit++; else if (dec) R.decoy++; else if (!m.tg0) R.lost++; else R.none++;
  }
  console.log('  ' + name + ': hit ' + pct(R.hit) + ' (down ' + pct(R.kill) + '), decoyed ' + pct(R.decoy) + ', track lost ' + pct(R.lost) + ', out of energy or missed ' + pct(R.none));
  return R;
}
const far = 12000, Y = 3000;
console.log('heat seekers, ' + TRIALS + ' each (shooter and target at ' + Y + ' m unless said)');
const s9 = STORES.aim9, s9x = STORES.aim9x, r73 = STORES.r73;
const tail = air(s9, 'AIM-9M, tail chase from 1.5 km, target at military power', [far, Y, 0, 0, 300], [far + 1500, Y, 0, 0, 300, .85], { from: 'a10' });
const head = air(s9, 'AIM-9M, head-on from 2.5 km', [far, Y, 0, 0, 300], [far + 2500, Y, 0, Math.PI, 300, .85]);
const beam = air(s9, 'AIM-9M, target crossing at 2 km', [far, Y, 0, 0, 300], [far + 2000, Y, 0, -Math.PI / 2, 300, .85]);
const run = air(s9, 'AIM-9M, tail chase from 3.5 km at 1200 m, target running in afterburner', [far, 1200, 0, 0, 300], [far + 3500, 1200, 0, 0, 370, 1]);
const brk = air(s9, 'AIM-9M, tail chase from 1.8 km, target breaks at 9 g in the last 3 s', [far, Y, 0, 0, 300], [far + 1800, Y, 0, 0, 330, .85], { turn: 9 });
const nofl = air(s9, 'AIM-9M, tail from 2 km, target turns at 6 g in the last 3 s, no flares', [far, Y, 0, 0, 300], [far + 2000, Y, 0, 0, 300, .85], { turn: 6 });
console.log('  the same shots with flares, the target turning at 6 g while it throws them:');
const fl = air(s9, 'AIM-9M, tail from 2 km, flares in its last 3 s, military power', [far, Y, 0, 0, 300], [far + 2000, Y, 0, 0, 300, .85], { cm: 3, turn: 6 });
const flab = air(s9, 'AIM-9M, the same with the afterburner left on', [far, Y, 0, 0, 300], [far + 2000, Y, 0, 0, 300, 1], { cm: 3, turn: 6 });
const flid = air(s9, 'AIM-9M, the same at idle', [far, Y, 0, 0, 300], [far + 2000, Y, 0, 0, 300, .1], { cm: 3, turn: 6 });
const fllate = air(s9, 'AIM-9M, the same at military power, flares only in the last 1 s', [far, Y, 0, 0, 300], [far + 2000, Y, 0, 0, 300, .85], { cm: 1, turn: 6 });
const flbeam = air(s9, 'AIM-9M, target crossing at 2 km, flares in the last 3 s', [far, Y, 0, 0, 300], [far + 2000, Y, 0, -Math.PI / 2, 300, .85], { cm: 3, turn: 6 });
const fl73 = air(r73, 'R-73, tail from 2 km, flares in the last 3 s', [far, Y, 0, 0, 300], [far + 2000, Y, 0, 0, 300, .85], { cm: 3, turn: 6, from: 'su57', id: 'f22' });
const fl9x = air(s9x, 'AIM-9X, tail from 2 km, flares in the last 3 s', [far, Y, 0, 0, 300], [far + 2000, Y, 0, 0, 300, .85], { cm: 3, turn: 6 });
ok(tail.hit > TRIALS * .8 && beam.hit > TRIALS * .6, 'a heat seeker with a clean shot hits');
ok(run.hit < TRIALS * .3, 'fired from too far behind a running target it runs out of energy');
ok(fl.hit < nofl.hit * .8 && flab.hit >= fl.hit && fl9x.hit > fl.hit, 'flares with a turn decoy it, less with the afterburner on and less a newer seeker');
ok(flid.hit <= fl.hit + 2 && fllate.hit >= fl.hit, 'cutting the throttle does not hurt the flares, and flares thrown too late do less');

console.log('radar missiles');
const a120 = STORES.aim120, r77 = STORES.r77;
const rh = air(a120, 'AIM-120, head-on from 6 km', [far, Y, 0, 0, 320], [far + 6000, Y, 0, Math.PI, 320, .85]);
const rt = air(a120, 'AIM-120, tail chase from 6 km, target running in afterburner', [far, Y, 0, 0, 320], [far + 6000, Y, 0, 0, 375, 1]);
const rb = air(r77, 'R-77M, target crossing at 5 km, both high', [far, Y, 0, 0, 320], [far + 5000, Y, 0, -Math.PI / 2, 320, .85], { from: 'su57', id: 'f22' });
const rn = air(a120, 'AIM-120 from above, target crossing at 5 km and 150 m over the ground', [far, Y, 0, 0, 320], [far + 5000, 0, 0, -Math.PI / 2, 320, .85], { agl: 150 });
const rnc = air(a120, 'AIM-120, the same with chaff in the last 4 s', [far, Y, 0, 0, 320], [far + 5000, 0, 0, -Math.PI / 2, 320, .85], { agl: 150, cm: 4 });
const rc = air(a120, 'AIM-120, target crossing at 5 km, high, chaff in the last 4 s', [far, Y, 0, 0, 320], [far + 5000, Y, 0, -Math.PI / 2, 320, .85], { cm: 4 });
const rhc = air(a120, 'AIM-120, head-on from 6 km, chaff in the last 4 s', [far, Y, 0, 0, 320], [far + 6000, Y, 0, Math.PI, 320, .85], { cm: 4 });
const rk = air(a120, 'AIM-120, tail chase from 3 km, target breaks at 9 g in the last 3 s', [far, Y, 0, 0, 320], [far + 3000, Y, 0, 0, 330, .85], { turn: 9 });
ok(rh.hit > TRIALS * .8, 'an active radar missile head-on hits');
ok(rt.hit < rh.hit, 'a long tail chase is worse');
ok(rhc.hit > TRIALS * .7 && rc.hit < rb.hit * .8, 'chaff does nothing head-on and decoys some on the beam');

console.log('air defence');
function sam(name, kind, tgt, opt) {
  opt = opt || {}; const R = { hit: 0, kill: 0, decoy: 0, n: 0 };
  for (let i = 0; R.n < TRIALS && i < TRIALS * 4; i++) {
    C.seed(500 + i * 7919); for (let k = 0; k < 30; k++) Math.random.call ? C.$("Math.random()") : 0; S = C.sandbox('modern');
    const bx = S.base[0].x + 600, bz = S.base[0].z, g = C.hgt(bx, bz);
    let b, m;
    if (tgt === 'heli') { b = C.addHeli('mi28', 1, bx + (opt.hd || 2500), g + 150, bz + i * 20, Math.PI, false); b.land = false; b.inv = 0; b.rl = null; }
    else { b = rail('su57', 1, bx + opt.d, g + (opt.h || 1500), bz, opt.cross ? -Math.PI / 2 : Math.PI, opt.V || 320, opt.thr || .85); if (opt.agl) b.rl.agl = opt.agl; hold(b); }
    b.flares = opt.cm ? 60 : 0;
    if (kind === 'stinger' || kind === 'igla') { const s = C.addMan(kind === 'igla' ? 'redAD' : 'blueAD', 0, bx, bz, 0), w = s.arms[1].d, e = $('manEye')(s); m = $('MSHOT').sam(s, w, e, C.vnorm({ x: b.x - e.x, y: b.y - e.y, z: b.z - e.z }), b); }
    else { const u = C.addVehicle('aa', kind, 0, bx, bz, 0); u.inv = 0; u.ai = null; u.ctl.lock = b; m = C.launchSam(u, u.arms[0].d, b); m.u = u; }
    if (!C.$('los')(m.by, m.by.y + 3, b, b.y)) continue;   // a hill between them on this map
    R.n++;
    let dec = false, was = b.hp, y0 = b.y, x0 = b.x, z0 = b.z;
    C.run(16, () => {
      if (b.rl) hold(b); else { b.x = x0; b.y = y0; b.z = z0; b.v = { x: 0, y: 0, z: 0 }; }
      if (m.u) m.u.ctl.lock = b;
      if (opt.cm && C.$('dist')(m, b) / Math.max(m.v, 200) < opt.cm) C.dropFlare(b);
      if (m.target && m.target.flare) dec = true;
      return !m.gone && !b.dead;
    });
    if (b.dead) R.kill++;
    if (b.hp < was || b.dead) R.hit++; else if (dec) R.decoy++;
  }
  console.log('  ' + name + ': hit ' + pct(R.hit, R.n) + ' (down ' + pct(R.kill, R.n) + '), decoyed ' + pct(R.decoy, R.n) + (R.n < TRIALS ? ' of ' + R.n : ''));
  for (const k of ['hit', 'kill', 'decoy']) R[k] *= TRIALS / (R.n || 1);
  return R;
}
const p1 = sam('Pantsir 57E6 at a jet coming in from 5 km, 1500 m up', 'pantsir', 'jet', { d: 5000 });
const p2 = sam('Pantsir 57E6 at a jet crossing at 4 km, 150 m over the ground', 'pantsir', 'jet', { d: 4000, cross: 1, agl: 150 });
const p2c = sam('Pantsir 57E6, the same jet with chaff in the last 4 s', 'pantsir', 'jet', { d: 4000, cross: 1, agl: 150, cm: 4 });
const p2h = sam('Pantsir 57E6 at a jet crossing at 4 km, 1500 m up', 'pantsir', 'jet', { d: 4000, cross: 1 });
const p3 = sam('Pantsir 57E6 at a hovering helicopter 2.5 km away', 'pantsir', 'heli');
const p3c = sam('Pantsir 57E6 at the same helicopter, chaff in the last 3 s', 'pantsir', 'heli', { cm: 3, turn: 6 });
const n1 = sam('NASAMS AIM-120 at a jet coming in from 5 km', 'nasams', 'jet', { d: 5000 });
const n3 = sam('NASAMS AIM-120 at a hovering helicopter 2.5 km away', 'nasams', 'heli');
const i1 = sam('Igla at a jet crossing 1.5 km away, 500 m up', 'igla', 'jet', { d: 1500, cross: 1, h: 500, V: 250 });
const i2 = sam('Igla, the same with flares in the last 3 s', 'igla', 'jet', { d: 1500, cross: 1, h: 500, cm: 3, V: 250 });
const st2 = sam('Stinger, the same with flares in the last 3 s', 'stinger', 'jet', { d: 1500, cross: 1, h: 500, cm: 3, V: 250 });
const i3 = sam('Igla at a hovering helicopter 1.5 km away, nose-on', 'igla', 'heli', { hd: 1500 });
ok(p1.hit > TRIALS * .7 && n1.hit > TRIALS * .7 && p3.hit > TRIALS * .7 && n3.hit > TRIALS * .7, 'the launchers hit a plane coming in and a helicopter in the open');
ok(i1.hit > TRIALS * .7 && i3.hit > TRIALS * .7 && i2.hit < i1.hit && st2.hit >= i2.hit, 'flares decoy the shoulder-fired ones, the two-colour seeker less');

console.log('air to ground and anti-tank (with smoke, the tank then moves off at 7 m/s)');
function gnd(name, o, from, d, opt) {
  opt = opt || {}; const R = { hit: 0, kill: 0, lost: 0 };
  for (let i = 0; i < TRIALS; i++) {
    C.seed(700 + i * 7919); for (let k = 0; k < 30; k++) Math.random.call ? C.$("Math.random()") : 0; S = C.sandbox('modern');
    const bx = S.base[0].x + 800, bz = S.base[0].z + i * 15, t = C.addVehicle('tank', 't90', 1, bx + d, bz, 0); t.inv = 0; t.ai = null; t.smk = 3;
    let m, a;
    if (from === 'man') { const s = C.addMan('blueAT', 0, bx, bz, 0), w = s.arms[1].d, e = $('manEye')(s); s.f = C.vnorm({ x: t.x - e.x, y: t.y - e.y, z: t.z - e.z }); m = $('MSHOT').atgm(s, w, e, s.f, t); a = s; }
    else {
      const h = from === 'heli' ? 120 : 1200, g = C.hgt(bx, bz);
      a = from === 'heli' ? C.addHeli(o.name.indexOf('Ataka') >= 0 ? 'mi28' : 'ah64', 0, bx, g + h, bz, 0, false) : rail(opt.id || 'a10', 0, bx, g + h, bz, 0, 170);
      a.inv = 0; a.land = false; if (a.rl) hold(a);
      const dir = C.vnorm({ x: t.x - a.x, y: t.y - a.y, z: t.z - a.z });
      m = MSL.arm({ x: a.x, y: a.y - 2, z: a.z, gnd: true, target: t, o, team: 0, by: a }, from === 'heli' ? dir : a.f, a); S.missiles.push(m);
    }
    const was = t.hp, ax = a.x, ay = a.y, az = a.z, tz = t.z; let smoked = false, lost = false, mv = 0;
    C.run(40, () => {
      if (a.rl) hold(a); else if (from === 'heli') { a.x = ax; a.y = ay; a.z = az; a.v = { x: 0, y: 0, z: 0 }; a.f = C.vnorm({ x: t.x - a.x, y: 0, z: t.z - a.z }); }
      if (opt.smoke && !smoked && C.$('dist')(m, t) / Math.max(m.v, 100) < opt.smoke) { smoked = true; C.popSmoke(t); S.smokes.forEach(s => { s.t0 -= 1; }); }
      if (smoked && opt.move) { mv += opt.move / 60; t.z = tz + mv; t.y = C.hgt(t.x, t.z); }
      if (!m.target && !m.gone) lost = true;
      return !m.gone && !t.dead;
    });
    C.run(.2);
    if (t.dead) R.kill++;
    if (t.hp < was || t.dead) R.hit++; if (lost) R.lost++;
  }
  console.log('  ' + name + ': hit ' + pct(R.hit) + ' (destroyed ' + pct(R.kill) + '), lost its track at some point ' + pct(R.lost));
  return R;
}
const HEL = $('HELIS'), SARMS = $('SARMS');
const g1 = gnd('AGM-65 from 4 km at a T-90', STORES.agm65, 'plane', 4000), g1s = gnd('AGM-65, the tank fires smoke 4 s before impact', STORES.agm65, 'plane', 4000, { move: 7, smoke: 4 });
const g2 = gnd('Kh-38M from 4 km', STORES.kh38, 'plane', 4000, { id: 'su57' }), g2s = gnd('Kh-38M, smoke 4 s before impact', STORES.kh38, 'plane', 4000, { move: 7, smoke: 4, id: 'su57' });
const g3 = gnd('Kh-25ML (laser) from 4 km', STORES.kh25, 'plane', 4000, { id: 'su25' }), g3s = gnd('Kh-25ML, smoke 4 s before impact', STORES.kh25, 'plane', 4000, { move: 7, smoke: 4, id: 'su25' });
const g4 = gnd('GBU-39 from 4 km', STORES.gbu39, 'plane', 4000, { id: 'f22' }), g4s = gnd('GBU-39, smoke 4 s before impact, the tank staying where it is', STORES.gbu39, 'plane', 4000, { smoke: 4, id: 'f22' });
const g5 = gnd('Hellfire (laser) from a hover at 3 km', HEL.ah64.ord[1], 'heli', 3000), g5s = gnd('Hellfire, smoke 4 s before impact', HEL.ah64.ord[1], 'heli', 3000, { move: 7, smoke: 4 });
const g6 = gnd('Ataka (command) from a hover at 3 km', HEL.mi28.ord[1], 'heli', 3000), g6s = gnd('Ataka, smoke 4 s before impact', HEL.mi28.ord[1], 'heli', 3000, { move: 7, smoke: 4 });
const g7 = gnd('Javelin from 1 km', SARMS.javelin, 'man', 1000), g7s = gnd('Javelin, smoke 3 s before impact', SARMS.javelin, 'man', 1000, { move: 7, smoke: 3 });
ok([g1, g2, g3, g4, g5, g6, g7].every(r => r.hit > TRIALS * .8), 'every ground-attack missile hits a tank standing in the open');
ok(g7.kill > TRIALS * .8, 'a Javelin that hits destroys a T-90 (hp 150) with one missile');
ok(g1s.kill < g1.kill * .5 && g6s.kill < g6.kill * .5 && g5s.kill < g5.kill * .5 && g7s.kill < g7.kill * .5, 'smoke defeats the imaging, command and laser ones when the tank then moves off at 7 m/s');
ok(g4s.hit >= g4.hit - 2, 'and does nothing to the one that flies to a place');

console.log('the ground behind a low helicopter (MSL.evade, the track break and wander, by who fired)');
{
  S = C.sandbox('modern');
  const hx = far, hz = 0, h = C.addHeli('mi28', 1, hx, C.hgt(hx, hz) + 80, hz, 0, false); h.inv = 0; h.q = h.q || yawQ(0);
  const K = { k: 'ir', dt: .1 }, ev = (dx, y, sam) => { const m = { x: hx - dx, y, z: hz, tg0: h, sam, age: 0, cl: 0 }; MSL.evade(m, K); return m.ew; };
  const g = C.hgt(hx, hz), jet = ev(6000, g + 900, false), sam6 = ev(6000, g + 900, true), samUp = ev(2500, g + 5, true), samDown = ev(1000, g + 900, true);
  console.log('  from 6 km and 900 m up: air-launched ' + jet.toFixed(1) + ' m, ground-launched ' + sam6.toFixed(1) + ' m; a SAM from the ground at 2.5 km ' + samUp.toFixed(1) + ' m, one diving on it from 1 km ' + samDown.toFixed(1) + ' m');
  ok(jet > 0 && jet === ev(6000, g + 900, undefined), 'a missile from the air sees the helicopter against the ground at a long, shallow look down');
  ok(sam6 === 0 && samUp === 0 && samDown > 0, 'one from the ground only as its seeker looks steeply down on it');
}

console.log('launch zones (m): rmin / no escape / rmax');
{
  S = C.sandbox('modern');
  const z = (o, a, b) => { const r = MSL.dlz(MSL.def(o), a, b); return Math.round(r.rmin) + ' / ' + Math.round(r.rne) + ' / ' + Math.round(r.rmax); };
  const a = rail('f22', 0, far, Y, 0, 0, 320), hd = rail('su57', 1, far + 5000, Y, 0, Math.PI, 320), tl = rail('su57', 1, far + 5000, Y, 0, 0, 320), lo = rail('f22', 0, far, 300, 0, 0, 320), lt = rail('su57', 1, far + 5000, 300, 0, 0, 320);
  [a, hd, tl, lo, lt].forEach(hold);
  for (const [n, o] of [['AIM-9M', s9], ['AIM-120', a120]]) console.log('  ' + n + ': head-on at 3 km up ' + z(o, a, hd) + ', tail at 3 km up ' + z(o, a, tl) + ', tail at 300 m ' + z(o, lo, lt));
  const r1 = MSL.dlz(MSL.def(a120), a, hd), r2 = MSL.dlz(MSL.def(a120), a, tl), r3 = MSL.dlz(MSL.def(a120), lo, lt);
  ok(r1.rmax > r2.rmax && r2.rmax > r3.rmax && r1.rne <= r1.rmax, 'head-on reaches farther than tail-on, and high farther than low');
}
done();
