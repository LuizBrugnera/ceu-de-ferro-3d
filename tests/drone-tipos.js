'use strict';
/* The drone kinds added after the first four (frag, mav, lnc, male) and the recon quad's mark: each against soldiers, a tank and a supply
   base (a building), the field resupply, and the counters that must still take them (rifles, an AA gun, a jammer). The operator is the
   player (S.my) on the flat disc of base 0, his hands the same S.input the keys give, as in tests/drone.js. */
const H = require('./harness'), C = H.load({ seed: 37 }), $ = C.$, ok = H.ok;
const DRONES = $('DRONES'), DQ = $('DQ'), DK = $('DK'), DMK = $('DMK');
let S, B, P;
const fresh = () => { S = C.sandbox('modern'); B = S.base[0]; S.over = false; S.demo = false; S.cls = 'inf'; S.model = 'blueDrone'; P = C.addMan('blueDrone', 0, B.x + 150, B.z + 300, 0); P.me = 1; S.my = P; S.me = 0; S.mouse = true; S.aim = { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } }; S.input = {}; S.waveTimer = S.planT = 1e9; S.base[0].hp = 1e9; return S; };
const tap = k => { S.input[k] = true; C.run(.05); S.input[k] = false; C.run(.05); };
const pick = k => { while (P.def.drone[P.dsel | 0] !== k) tap('glock'); };
const aimAt = (o, x, y, z) => { const dx = x - o.x, dy = y - o.y, dz = z - o.z; S.aim.h = Math.atan2(-dz, dx); S.aim.p = Math.asin(dy / Math.hypot(dx, dy, dz)); S.aim.d = { x: dx / Math.hypot(dx, dy, dz), y: dy / Math.hypot(dx, dy, dz), z: dz / Math.hypot(dx, dy, dz) }; };
const still = u => { u.ai = null; u.ctl.drive = 0; return u; };
const squad = (x, z, n) => Array.from({ length: n || 4 }, (_, i) => { const m = C.addMan('redRifle', 1, x + (i % 2) * 3, z + (i >> 1) * 3, Math.PI); m.ai = null; return m; });
const hurt = L => L.filter(m => m.dead || m.hp < m.max).length;
/* a quad sent straight at x y z at speed v, armed (well past its operator), its own hands off */
const shove = (o, x, y, z, v) => { o.t0 = S.t - 10; o.link = o.lq = 1; const step = () => { const dx = x - o.x, dy = y - o.y, dz = z - o.z, L = Math.hypot(dx, dy, dz) || 1; o.v = { x: dx / L * v, y: dy / L * v, z: dz / L * v }; }; return step; };

console.log('-- the kinds: eight, the four old ones first (their index goes online, the server takes 8) --');
ok(DK.length === 8 && DK.slice(0, 4).join() === 'fpv,bmb,rec,owa', 'DK ' + DK.join(' '));
fresh(); ok(P.def.drone.length === 8 && DK.every(k => $('dstock')(P)[k] === DRONES[k].n), 'the operator carries all eight: ' + DK.map(k => k + ' ' + DRONES[k].n).join(', '));
const tot = DK.reduce((a, k) => a + DRONES[k].n, 0); ok(tot >= 18, tot + ' drones a life (8 before)');

console.log('-- fragmentation FPV: airburst over soldiers, little to a tank, a building --');
fresh(); let men = squad(P.x + 200, P.z), o = C.addDrone('frag', 0, P.x + 160, C.hgt(P.x + 160, P.z) + 3, P.z, 0, P, null), go = shove(o, men[0].x + 20, C.hgt(men[0].x, men[0].z) + 3, men[0].z, 12);
C.run(8, () => { if (!o.gone) go(); return !o.gone; });
let dmin = Math.min(...men.map(m => Math.hypot(m.x - o.x, m.z - o.z)));
console.log('   went off ' + dmin.toFixed(1) + ' m from the nearest soldier (' + o.end + '); hurt ' + hurt(men) + ' of ' + men.length + ', dead ' + men.filter(m => m.dead).length);
ok(o.end === 'boom' && dmin <= DRONES.frag.wh.prox + 1 && hurt(men) >= 3, 'the proximity fuze bursts it over the squad, without touching anyone, and the splinters hurt most of them');
fresh(); let tk = still(C.addVehicle('tank', 't72', 1, P.x + 200, P.z, Math.PI)), hp0 = tk.hp; o = C.addDrone('frag', 0, P.x + 150, tk.y + 2, P.z, 0, P, null); go = shove(o, tk.x, tk.y + 2, tk.z, 12);
C.run(8, () => { if (!o.gone) go(); return !o.gone; });
console.log('   on a T-72: hp ' + hp0 + ' -> ' + tk.hp.toFixed(0) + ' (' + o.end + ')');
ok(o.end === 'boom' && !tk.dead && tk.hp > hp0 * .6, 'a tank only gets scratched');
fresh(); let b = C.addSup(S.T.nid + 40, 1, P.x + 200, P.z, 0, 1), bh = S.oh[b.id]; o = C.addDrone('frag', 0, b.x - 30, b.y + 3, b.z, 0, P, null); o.t0 = S.t - 10;
C.run(5, () => { o.v = { x: 10, y: -.3, z: 0 }; return !o.gone; });
console.log('   into a supply base: ' + o.end + ', base ' + bh + ' -> ' + S.oh[b.id].toFixed(0));
ok(o.end === 'boom' && S.oh[b.id] < bh, 'it goes off on the building and hurts it');

console.log('-- grenade-dropping Mavic: four small grenades from above, quiet --');
fresh(); pick('mav'); tap('mlock'); o = S.dr;
ok(o && o.k === 'mav' && o.pay === 4 && DRONES.mav.sig.snd < DRONES.bmb.sig.snd, 'Y picks it, L launches it with 4 grenades; it is heard closer than the bomber');
men = squad(P.x + 150, P.z + 10);
o.x = men[0].x + 1.5; o.z = men[0].z + 1.5; o.y = C.hgt(o.x, o.z) + 40; o.v = { x: 0, y: 0, z: 0 }; C.run(1);
for (let i = 0; i < 4; i++) { tap('fire'); C.run(.6); }
C.run(6);
console.log('   4 drops over a squad of four from 40 m: grenades left ' + o.pay + ', hurt ' + hurt(men) + ', dead ' + men.filter(m => m.dead).length);
ok(o.pay === 0 && hurt(men) >= 2, 'every grenade goes and they hurt the squad');
fresh(); tk = still(C.addVehicle('tank', 't72', 1, P.x + 150, P.z, Math.PI)); hp0 = tk.hp; pick('mav'); tap('mlock'); o = S.dr; o.x = tk.x; o.z = tk.z; o.y = tk.y + 30; o.v = { x: 0, y: 0, z: 0 }; C.run(.5);
for (let i = 0; i < 4; i++) { tap('fire'); C.run(.6); } C.run(5);
console.log('   on a T-72: hp ' + hp0 + ' -> ' + tk.hp.toFixed(0));
ok(!tk.dead, 'a tank survives grenades');
fresh(); b = C.addSup(S.T.nid + 40, 1, P.x + 150, P.z, 0, 1); bh = S.oh[b.id]; pick('mav'); tap('mlock'); o = S.dr; o.x = b.x; o.z = b.z; o.y = b.y + 30; o.v = { x: 0, y: 0, z: 0 }; C.run(.5);
for (let i = 0; i < 4; i++) { tap('fire'); C.run(.6); } C.run(5);
console.log('   on a supply base: ' + bh + ' -> ' + S.oh[b.id].toFixed(0));
ok(S.oh[b.id] <= bh, 'over a building it drops without breaking anything (' + (S.oh[b.id] < bh ? 'hurt' : 'whole') + ')');

console.log('-- recon: marks what is under its aim for its side --');
fresh(); pick('rec'); tap('mlock'); o = S.dr;
const gun = still(C.addVehicle('art', 'msta', 1, P.x + 3200, P.z + 100, 0));   // past what the operator himself can see
o.x = gun.x - 700; o.z = gun.z; o.y = C.hgt(o.x, o.z) + 120; o.v = { x: 0, y: 0, z: 0 }; C.run(.5); aimAt(o, gun.x, $('bodyY')(gun), gun.z); tap('fire');
ok(S.dmk && S.dmk.some(k => k.o === gun && k.team === 0) && $('dMarked')(gun, 0), 'fire marks the gun: ' + (S.dmsg && S.dmsg.text));
tap('mlock'); $('droneEnd')(o, 'lost'); C.run(2); gun.seenT = -99; C.run(3);
ok(S.t - gun.seenT < 1, 'with the drone gone the mark keeps it on the map, where it is');
S.t += DMK.t; C.run(1); gun.seenT = -99; C.run(2); ok(S.t - gun.seenT > 1, 'after ' + DMK.t + ' s the mark is over');

console.log('-- portable loitering munition: from a tube beside the operator, dives on the roof --');
fresh(); tk = still(C.addVehicle('tank', 't72', 1, P.x + 1400, P.z + 200, Math.PI)); tk.moveT = -99; hp0 = tk.hp; pick('lnc'); tap('mlock');
ok(!!S.dm, 'with it picked L opens the map');
S.dm.x = tk.x; S.dm.z = tk.z; tap('fire'); o = S.drones.find(q => q.k === 'lnc');
ok(o && $('dist')(o, P) < 6 && !S.dowT, 'Espaço launches it from beside the operator (' + (o ? $('dist')(o, P).toFixed(1) : '-') + ' m), not from the rail, and leaves the rail free');
let st = '', seen = []; C.run(200, () => { if (o.nav.st !== st) { st = o.nav.st; seen.push(st + '@' + S.t.toFixed(0)); } S.input.mlock = st === 'loiter' && !S.dr; if (S.dr === o && st === 'loiter') { aimAt(o, tk.x, $('bodyY')(tk), tk.z); S.input.fire = true; } return !o.gone; }); S.input = {};
console.log('   ' + seen.join(' -> ') + '; T-72 hp ' + hp0 + ' -> ' + Math.max(0, tk.hp).toFixed(0) + (tk.dead ? ' (destroyed)' : '') + '; ' + o.end);
ok(o.end === 'boom' && tk.dead, 'it cruises, loiters, dives on the tank from above and destroys it');
fresh(); men = squad(P.x + 900, P.z); pick('lnc'); tap('mlock'); S.dm.x = men[0].x; S.dm.z = men[0].z; tap('fire'); o = S.drones.find(q => q.k === 'lnc'); st = '';
C.run(200, () => { st = o.nav.st; S.input.mlock = st === 'loiter' && !S.dr; if (S.dr === o && st === 'loiter') { aimAt(o, men[1].x, men[1].y + .5, men[1].z); S.input.fire = true; } return !o.gone; }); S.input = {};
console.log('   on a squad: ' + o.end + ', hurt ' + hurt(men) + ' of ' + men.length);
ok(o.end === 'boom' && hurt(men) >= 2, 'dived on the ground among soldiers it hurts them');
fresh(); b = C.addSup(S.T.nid + 40, 1, P.x + 900, P.z, 0, 1); bh = S.oh[b.id]; pick('lnc'); tap('mlock'); S.dm.x = b.x; S.dm.z = b.z; tap('fire'); o = S.drones.find(q => q.k === 'lnc');
C.run(200, () => { st = o.nav.st; S.input.mlock = st === 'loiter' && !S.dr; if (S.dr === o && st === 'loiter') { aimAt(o, b.x, b.y + 1.5, b.z); S.input.fire = true; } return !o.gone; }); S.input = {};
console.log('   on a supply base: ' + o.end + ', base ' + bh + ' -> ' + S.oh[b.id].toFixed(0));
ok(o.end === 'boom' && S.oh[b.id] < bh, 'it hurts the building');

console.log('-- armed drone: from the rail, orbits high, guided missiles; home when the fuel is out --');
fresh(); tk = still(C.addVehicle('tank', 't72', 1, B.x + 2500, B.z + 300, Math.PI)); hp0 = tk.hp; men = squad(tk.x - 150, tk.z + 120); b = C.addSup(S.T.nid + 40, 1, tk.x + 200, tk.z - 150, 0, 1); bh = S.oh[b.id];
pick('male'); tap('mlock'); ok(!!S.dm, 'L opens the map'); S.dm.x = tk.x; S.dm.z = tk.z; tap('fire'); o = S.drones.find(q => q.k === 'male');
ok(o && S.dowT > S.t && o.pay === 4, 'Espaço launches it from the rail with 4 missiles, and the rail waits');
C.run(300, () => o.nav.st !== 'loiter' && !o.gone); tap('mlock'); ok(S.dr === o, 'loitering, L puts the goggles on it (' + (o.y - C.hgt(o.x, o.z)).toFixed(0) + ' m over the ground)');
/* as a player: aim, wait until the sight shows a lock, fire, keep the aim on it until the missile is gone */
const shoot = (t, y) => { C.run(3); C.run(30, () => { aimAt(o, t.x, y, t.z); return !$('dmLock')(o, S.aim.d); }); tap('fire'); const M = S.missiles.find(m => m.dr === o && !m.gone); C.run(40, () => { if (S.dr === o) aimAt(o, t.x, y, t.z); return !!M && !M.gone; }); C.run(.5); return M; };
let M = shoot(tk, $('bodyY')(tk));
console.log('   missile at the T-72 (' + (M && M.o.name) + ', locked ' + !!(M && M.tg0 === tk) + '): hp ' + hp0 + ' -> ' + Math.max(0, tk.hp).toFixed(0) + (tk.dead ? ' (destroyed)' : ''));
ok(M && M.tg0 === tk && (tk.dead || tk.hp < hp0 * .5), 'a missile locks the tank and kills or cripples it');
M = shoot(men[0], men[0].y + 1); console.log('   missile at the squad (locked ' + (M && M.tg0 ? M.tg0.name : 'nothing') + ', burst ' + (M ? Math.hypot(M.x - men[0].x, M.z - men[0].z).toFixed(0) : '-') + ' m from it): hurt ' + hurt(men) + ' of ' + men.length);
ok(hurt(men) >= 2, 'a missile at a soldier hurts the squad');
M = shoot(b, b.y + 1.6); console.log('   missile at the supply base: ' + bh + ' -> ' + S.oh[b.id].toFixed(0));
ok(S.oh[b.id] < bh, 'a missile at the building hurts it');
ok(o.pay === 1, 'missiles left ' + o.pay);
const ox = o.nav.x; tap('brake'); ok(o.nav.x !== ox && (o.nav.st === 'cruise' || o.nav.st === 'loiter'), 'X: a new orbit where the aim meets the ground: ' + (S.dmsg && S.dmsg.text));
o.bat = 1; let back = 0; C.run(400, () => { back = Math.hypot(o.x - $('droneRail')(0).x, o.z - $('droneRail')(0).z); return !o.gone; });
console.log('   fuel out: ' + o.nav.st + ', ended ' + o.end + ' ' + back.toFixed(0) + ' m from the rail; stock ' + P.dst.male);
ok(o.end === 'back' && P.dst.male === 1, 'it flies back to the rail and is taken back into the stock');

console.log('-- field resupply --');
fresh(); P.x += 2500; P.y = C.hgt(P.x, P.z); $('dstock')(P); P.dst.fpv = 0;   // in the field, away from the base's depot P.dst.frag = 1; C.run(DQ.regen + 1); ok(P.dst.fpv === 1 && P.dst.frag === 1, 'after ' + DQ.regen + ' s one of the kind most short comes back: ' + (S.dmsg && S.dmsg.text));
P.dst.owa = 0; for (const k of DK) if (k !== 'owa') P.dst[k] = DRONES[k].n; C.run(DQ.regen * 2); ok(P.dst.owa === 0, 'the rail\'s are not resupplied in the field');

console.log('-- counters still work --');
fresh(); o = C.addDrone('male', 1, P.x + 400, C.hgt(P.x, P.z) + 400, P.z, Math.PI, null, null); o.nav = { st: 'loiter', x: P.x + 400, z: P.z, tgt: null, pt: null, T: 0, look: 0 }; o.V = 45;
const aa = C.addUnit('aa', 0, P.x + 600, P.z, null, true); let shots = 0, lt = -9;
C.run(40, () => { const t = Math.max(aa.arms[0].t, aa.arms[1].t); if (t > lt) { lt = t; shots++; } return !o.dead && !o.gone; });
console.log('   armed drone over an AI ' + aa.def.name + ': ' + shots + ' rounds and missiles, ' + (o.end || 'alive') + ', hp ' + o.hp.toFixed(1) + ' of ' + o.def.hp);
ok(shots > 10 || o.end === 'shot', 'air defence fires at the armed drone');
fresh(); o = C.addDrone('lnc', 0, P.x + 300, C.hgt(P.x, P.z) + 60, P.z, 0, P, null); o.nav = { st: 'loiter', x: P.x + 300, z: P.z, tgt: null, pt: null, T: 0, look: 0 };
const L0 = $('droneLink')(o); still(C.addVehicle('trn', 'tigr', 1, o.x + 50, o.z, 0)); const L1 = $('droneLink')(o);
ok(L0 > .9 && L1 < .1, 'a jammer takes the portable munition\'s link (' + L0.toFixed(2) + ' -> ' + L1.toFixed(2) + ')');
fresh(); o = C.addDrone('frag', 1, P.x + 30, P.y + 20, P.z, 0, null, null); C.explode(o.x + 4, o.y, o.z, 15, 60, P, 0, true); ok(o.dead, 'a burst beside it brings the fragmentation FPV down');
fresh(); o = C.addDrone('mav', 1, P.x + 30, P.y + 20, P.z, 0, null, null); C.explode(o.x + 4, o.y, o.z, 15, 60, P, 0, true); ok(o.dead, 'and the Mavic');
H.done();
