'use strict';
/* Drones: each flow once, scripted, on the flat disc of base 0. The operator is the player (S.my), the hands are the same S.input the keys give. */
const H = require('./harness'), C = H.load({ seed: 31 }), $ = C.$, ok = H.ok;
const DRONES = $('DRONES'), DQ = $('DQ'), DAI = $('DAI');
let S, B, P;
const fresh = () => { S = C.sandbox('modern'); B = S.base[0]; S.over = false; S.demo = false; S.cls = 'inf'; S.model = 'blueDrone'; P = C.addMan('blueDrone', 0, B.x + 150, B.z + 300, 0); P.me = 1; S.my = P; S.me = 0; S.mouse = true; S.aim = { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } }; S.input = {}; S.waveTimer = S.planT = 1e9; S.base[0].hp = 1e9; return S; };
const tap = k => { S.input[k] = true; C.run(.05); S.input[k] = false; C.run(.05); };
const look = t => { const o = S.dr || $('manEye')(P), dx = t.x - o.x, dy = (t.y1 === undefined ? $('bodyY')(t) : t.y1) - o.y, dz = t.z - o.z; S.aim.h = Math.atan2(-dz, dx); S.aim.p = Math.asin(dy / Math.hypot(dx, dy, dz)); };
const still = u => { u.ai = null; u.ctl.drive = 0; return u; };

console.log('-- FPV, assisted: launch, fly into a tank 400 m away --');
fresh();
let tk = still(C.addVehicle('tank', 't72', 1, P.x + 400, P.z, Math.PI)); const hp0 = tk.hp;
tap('mlock');
let o = S.dr;
ok(!!o && o.k === 'fpv' && P.dst.fpv === DRONES.fpv.n - 1, 'L launches the FPV and takes one from the stock');
S.input.up = true; let far = 0, armed = false, t0 = S.t;
C.run(40, () => { if (S.dr) { look({ x: tk.x, y1: tk.y + 2.2, z: tk.z }); far = Math.max(far, S.dr.V); armed = armed || S.dr.armed; } return !!S.dr || S.bombs.length > 0; });
S.input.up = false; C.run(.3);
console.log('   top speed ' + (far * 3.6).toFixed(0) + ' km/h, flight ' + (S.t - t0).toFixed(1) + ' s, tank hp ' + hp0 + ' -> ' + tk.hp.toFixed(0) + (tk.dead ? ' (destroyed)' : '') + ', message ' + (S.dmsg && S.dmsg.text));
ok(armed && !S.dr && !tk.dead && tk.hp < hp0 - 20 && tk.hp > hp0 * .5, 'it arms, detonates on the front plate and hurts the tank without going through');
fresh(); tk = still(C.addVehicle('tank', 't72', 1, P.x + 400, P.z, Math.PI)); tap('mlock'); o = S.dr; C.run(2);
o.x = tk.x - 3; o.z = tk.z; o.y = tk.y + 60; o.v = { x: 0, y: 0, z: 0 }; S.input.up = true;
C.run(20, () => { if (S.dr) look({ x: tk.x, y1: tk.y + 2.6, z: tk.z }); return !!S.dr || S.bombs.length > 0; }); S.input.up = false; C.run(.3);
console.log('   dive on the roof from 60 m: tank hp ' + hp0 + ' -> ' + Math.max(0, tk.hp).toFixed(0) + (tk.dead ? ' (destroyed)' : ''));
ok(!S.dr && tk.dead, 'the same warhead on the roof destroys it');
ok(P.ctl.mx === 0 && P.ctl.mz === 0 && !P.ctl.fire, 'the operator stood still meanwhile');

console.log('-- acro: thrust along the body, rates on three axes, battery --');
fresh(); tap('mlock'); o = S.dr; tap('brake');
ok(o.mode === 2, 'X switches to acro');
S.input.thr = 1; S.input.ax = 0; S.input.ay = 0; C.run(1.5); const vy = o.v.y;
S.input.thr = .3; S.input.ax = 1; C.run(.3); const wx = o.w.x; S.input.ax = 0; S.input.ay = -1; C.run(.2); const wz = o.w.z; S.input.ay = 0; S.input.az = 1; C.run(.2); const wy = o.w.y;
console.log('   climb at full throttle ' + vy.toFixed(1) + ' m/s after 1.5 s; rates roll ' + wx.toFixed(1) + ', pitch ' + wz.toFixed(1) + ', yaw ' + wy.toFixed(1) + ' rad/s; battery ' + (o.bat / o.def.bat * 100).toFixed(0) + '%');
ok(vy > 8 && wx > 5 && wz < -5 && wy < -3 && o.bat < o.def.bat, 'full throttle climbs, the sticks command rates, the battery drains');
S.input = { thr: 0 }; C.run(8); S.input = {}; ok(!S.dr && S.dmsg, 'throttle shut in acro, it comes down: ' + (S.dmsg && S.dmsg.text));

console.log('-- link: distance, ground between, jammer; loss --');
fresh(); tap('mlock'); o = S.dr;
const L0 = $('droneLink')(o); o.x = P.x + o.def.link * .9; o.y = C.hgt(o.x, o.z) + 60; const L1 = $('droneLink')(o);
o.x = P.x + 300; o.y = C.hgt(o.x, o.z) + 30; const jm = still(C.addVehicle('trn', 'tigr', 1, o.x + 60, o.z, 0)); const L2 = $('droneLink')(o);
console.log('   link beside the operator ' + L0.toFixed(2) + ', at 90% of the range ' + L1.toFixed(2) + ', 60 m from a jammer ' + L2.toFixed(2));
ok(L0 > .95 && L1 < .5 && L1 > 0 && L2 < .05, 'the link falls with distance and inside a jammer');
C.run(DQ.lose + 1.2); const cut = o.cut; C.run(6); ok(cut && !S.dr && o.gone, 'no link for ' + DQ.lose + ' s: the motors stop and the FPV falls');

console.log('-- operator hit or killed --');
fresh(); tap('mlock'); o = S.dr; S.input.thrUp = true; C.run(2); S.input.thrUp = false;
C.damageMan(P, 3, null); C.run(.1); ok(!S.dr && o.cut, 'a hit takes the goggles off and the FPV falls');
fresh(); tap('glock'); tap('mlock'); o = S.dr; ok(o && o.k === 'bmb', 'Y picks the bomber');
S.input.thrUp = true; C.run(3); S.input.thrUp = false; C.killMan(P, null); C.run(DQ.lose + 1.5);
ok(o.auto === 'rth' || o.gone, 'operator dead: the bomber turns for home by itself');

console.log('-- bomber: drop on soldiers, come back, be taken back --');
fresh(); tap('glock'); tap('mlock'); o = S.dr;
const men = [0, 1, 2].map(i => { const m = C.addMan('redRifle', 1, P.x + 200 + i * 3, P.z + i * 2, 0); m.ai = null; return m; });
S.input.thrUp = true; C.run(4); S.input.thrUp = false; S.input.up = true;
C.run(40, () => { look({ x: men[1].x, y1: o.y, z: men[1].z }); return Math.hypot(o.x - men[1].x, o.z - men[1].z) > 3; });
S.input.up = false; C.run(1.5); tap('fire'); C.run(4);
console.log('   released from ' + (o.y - C.hgt(o.x, o.z)).toFixed(0) + ' m; soldiers left ' + men.filter(m => !m.dead).length + ' of 3, bombs left ' + o.pay);
ok(o.pay === 1 && men.some(m => m.dead || m.hp < m.max), 'the bomb falls and hurts them');
S.input.up = true; C.run(60, () => { look({ x: P.x, y1: P.y + 2.5, z: P.z }); return $('dist')(o, P) > 5; }); S.input.up = false; C.run(.5); tap('mlock');
ok(!S.dr && o.end === 'back' && P.dst.bmb === DRONES.bmb.n, 'landed by the operator it goes back into the stock');

console.log('-- recon: what its camera sees is spotted --');
fresh(); tap('glock'); tap('glock'); tap('mlock'); o = S.dr; ok(o.k === 'rec', 'Y twice picks the recon quad');
const hidn = still(C.addVehicle('art', 'msta', 1, P.x + 900, P.z + 200, 0)); hidn.seenT = -99;
S.input.thrUp = true; C.run(14); S.input.thrUp = false; C.run(1);
console.log('   quad at ' + (o.y - C.hgt(o.x, o.z)).toFixed(0) + ' m, line of sight to the gun: ' + $('sees')(o, hidn));
ok(S.t - hidn.seenT < 1, 'an enemy gun 900 m away is on the map (seenT) while the quad is up');

console.log('-- long-range drone: map, launch from the rail, route, dive --');
fresh(); tap('glock'); tap('glock'); tap('glock'); tap('mlock');
ok(!!S.dm && !S.dr, 'with the delta picked L opens the map');
const base = C.addVehicle('art', 'msta', 1, B.x + 3500, B.z + 400, 0); still(base); base.moveT = -99; S.dm.x = base.x; S.dm.z = base.z; const bh = base.hp;
tap('fire'); o = S.drones.find(q => q.k === 'owa');
ok(!!o && !S.dm && o.nav.st === 'boost', 'fire on the map launches it from the rail');
let st = '', seen = [];
C.run(200, () => { if (o.nav.st !== st) { st = o.nav.st; seen.push(st + '@' + S.t.toFixed(0)); } if (st === 'loiter' && !S.dr) { S.input.mlock = true; } else S.input.mlock = false; if (S.dr === o && st === 'loiter') { look(base); S.input.fire = true; } return !o.gone; });
console.log('   ' + seen.join(' -> ') + '; target hp ' + bh + ' -> ' + base.hp.toFixed(0) + (base.dead ? ' (destroyed)' : '') + '; ended ' + o.end);
ok(o.end === 'boom' && (base.dead || base.hp < bh), 'it cruises, loiters, dives on the picked target and hits it');

console.log('-- counters: rifles, an AA gun, flak, a blast --');
fresh(); tap('mlock'); o = S.dr; o.def = Object.assign(Object.create(o.def), { bat: 1e9 }); o.bat = 1e9; P.inv = 1e9;
/* six riflemen holding their ground 260 m out, facing the operator (a squad with its own orders walks off, and its other men pick what they
   shoot at by things this test is not about). Only some soldiers shoot at a small drone (DSHOT.share): here all of them do (tests/drone-shot.js
   has the shares). The FPV climbs a little, flies at them and hovers about 25 m short and 12 m up, well inside the reach at which a rifleman
   facing it notices it; a hit is a matter of chance, so it hovers long enough that the dice do not save it (over 200 seeds it was down within 23 s of hovering, the median 5 s) */
const X = P.x + 260, rif = [0, 1, 2, 3, 4, 5].map(k => { const m = C.addMan('rifleman', 1, X + (k % 3) * 4, P.z + (k >> 1) * 4 - 4, Math.PI); m.ai = $('manBrain')(k); m.ai.gx = m.x; m.ai.gz = m.z; m.ai.dsh = 1; return m; });
S.input.thrUp = true; C.run(.7); S.input.thrUp = false; S.input.up = true; S.aim.p = 0; let held = 1e9;
C.run(40, () => { if (o.x > X - 50) S.input.up = false; if (!S.input.up) held = Math.min(held, ...rif.map(m => $('dist')(o, m))); return !o.dead && !o.gone; }); S.input.up = false;
console.log('   FPV hovering ' + held.toFixed(0) + ' m from six riflemen: ' + (o.end || 'alive') + ' after ' + S.t.toFixed(1) + ' s, hp ' + o.hp.toFixed(1) + ' of ' + o.def.hp);
ok(o.dead || o.end === 'shot' || o.hp < o.def.hp, 'the riflemen shoot at it');
fresh(); const aa = C.addUnit('aa', 1, P.x + 900, P.z, null, true); o = C.addDrone('owa', 0, P.x - 600, C.hgt(P.x, P.z) + 220, P.z, 0, null, { job: 'owa' }); o.nav = { st: 'cruise', x: P.x + 4000, z: P.z, tgt: null, pt: null, T: 0, look: 0 }; o.V = 46; o.armed = true;
let shots = 0, lt = -9; C.run(40, () => { const t = Math.max(aa.arms[0].t, aa.arms[1].t); if (t > lt) { lt = t; shots++; } return !o.dead && !o.gone; });
console.log('   delta past an AI ' + aa.def.name + ': ' + shots + ' rounds and missiles fired at it, ' + (o.end || 'alive') + ', hp ' + o.hp.toFixed(1) + ' of ' + o.def.hp);
ok(shots > 10 || o.end === 'shot', 'air defence takes the delta as its target and fires at it (the hit is a matter of chance)');
fresh(); o = C.addDrone('fpv', 1, P.x + 30, P.y + 20, P.z, 0, null, null); C.explode(o.x + 4, o.y, o.z, 15, 60, P, 0, true); ok(o.dead, 'a burst beside it brings a quad down');

console.log('-- a supply base: a drone that runs into it strikes the building (an AI loitering munition dives on one), it has no hull --');
for (const k of ['fpv', 'owa', 'rec']) {
  fresh(); const x = P.x + 200, z = P.z, b = C.addSup(S.T.nid + 40, 1, x, z, 0, 1), hp0 = S.oh[b.id];
  o = C.addDrone(k, 0, x - 30, b.y + 3, z, 0, P, null); o.t0 = S.t - 10; o.link = o.lq = 1;
  if (k === 'owa') { o.armed = true; o.nav = { st: 'dive', x, z, tgt: b, pt: { x, y: b.y + 1, z }, T: 0, look: 0 }; }
  let err = null; try { C.run(5, () => { if (k !== 'owa') o.v = { x: 10, y: -.3, z: 0 }; return !o.gone; }); } catch (e) { err = e; }
  console.log('   ' + k + ': ' + (err ? 'threw ' + err.message : (o.end || 'alive') + ', base ' + hp0 + ' -> ' + S.oh[b.id].toFixed(0) + (b.dead ? ' (destroyed)' : '')));
  ok(!err && o.gone && (k === 'rec' ? o.end === 'crash' && S.oh[b.id] === hp0 : o.end === 'boom' && S.oh[b.id] < hp0) && (k !== 'owa' || b.dead),
    k === 'fpv' ? 'an FPV goes off on it and hurts the building' : k === 'owa' ? 'a loitering munition diving on it destroys it' : 'a recon quad without a warhead is lost against it and leaves it whole');
}

console.log('-- AI: a battle with operators --');
const S2 = C.newState('modern', 'abrams', { cls: 'tank' }); S = S2; let launched = 0, kinds = {}, peak = 0;
const ops0 = S.men.filter(m => m.def.drone).length;
const SECS = +process.env.SECS || 240;
C.run(SECS, () => { const L = S.drones || []; for (const q of L) if (!q.cnt) { q.cnt = 1; launched++; kinds[q.k] = (kinds[q.k] || 0) + 1; } peak = Math.max(peak, L.length); if (S.my && S.my.dead) S.respawn = 1e9; return !S.over; });
console.log('   operators at the start ' + ops0 + ', now ' + S.men.filter(m => m.def.drone && !m.dead).length + '; drones launched in ' + SECS + ' s ' + launched + ' ' + JSON.stringify(kinds) + ', most in the air at once ' + peak + '; NaN: ' + H.nan(S));
ok(launched > 0 && peak <= 8 && !H.nan(S) && !(S.drones || []).some(q => !Number.isFinite(q.x + q.y + q.z)), 'the AI flies a few drones, never a swarm, and nothing goes NaN');
H.done();
