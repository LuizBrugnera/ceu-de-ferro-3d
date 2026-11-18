'use strict';
/* Part B, the soldier: stances, cover, each weapon against each kind of target, run-over. On the flat disc of base 0 unless said. */
const H = require('./harness'), C = H.load({ seed: 77 }), $ = C.$, ok = H.ok;
const MAN = $('MAN'), STANCE = $('STANCE'), COVER = $('COVER'), KITS = $('KITS'), HK = $('HK');
const pct = v => (100 * v).toFixed(0) + '%';
let S, B, g;
const fresh = era => { S = C.sandbox(era || 'ww2'); B = S.base[0]; g = C.hgt(B.x, B.z); return S; };
const aimAt = (m, t, up) => { const e = $('manEye')(m), d = $('vnorm')({ x: t.x - e.x, y: $('bodyY')(t) + (up || 0) - e.y, z: t.z - e.z }); m.ctl.aim = d; m.h = Math.atan2(-d.z, d.x); m.ap = Math.asin(d.y); };

console.log('-- stance: share of 600 rounds from 250 m, with the spread of an AI rifleman, that hit a soldier --');
const hitShare = (st, where) => {
  fresh(); let hits = 0;
  const w = where || { x: B.x + 150, z: B.z + 300 }, t = C.addMan('rifleman', 0, w.x, w.z, 0), m = C.addMan('schutze', 1, w.x - 250, w.z, 0);
  t.st = t.ctl.st = st; t.hp = 1e9; m.arms[0].mag = 1e9; m.arms[0].d = Object.assign({}, m.arms[0].d, { rate: .05, sp: .011 }); m.ctl.fire = true; m.ai = null;
  const D = C.damageMan; C.damageMan = (o, d, by, rx, h) => { if (o === t && d > 0) hits++; };
  C.run(30, () => { aimAt(m, t); m.held = false; return m.arms[0].t < 0 || S.bullets.length + hits < 1e9; }); C.damageMan = D;
  return hits / 600;
};
const hs = [0, 1, 2].map(st => hitShare(st));
console.log('   standing ' + pct(hs[0]) + ', crouched ' + pct(hs[1]) + ', prone ' + pct(hs[2]));
ok(hs[0] > hs[1] && hs[1] > hs[2] && hs[2] > 0, 'lower stances are harder to hit');

console.log('-- cover: woods, and crouching at a wall (what the wall itself stops is in world.js) --');
fresh(); const T = S.T, hd = $('hdist');
let wood = null; for (let i = 0; i < T.kind.length && !wood; i++) if (T.kind[i] === 1) { const x = T.x0 + (i % (T.N + 1)) * T.cx, z = T.z0 + Math.floor(i / (T.N + 1)) * T.cz; if (x > 500 && x < S.W - 500 && Math.abs(z) < S.HW - 500 && Math.abs(C.hgt(x - 250, z) - C.hgt(x, z)) < 8 && C.los({ x: x - 250, z }, C.hgt(x - 250, z) + 2, { x, z }, C.hgt(x, z) + 1)) wood = { x, z }; }
const hw = wood ? hitShare(0, wood) : NaN;
console.log('   in the open ' + pct(hs[0]) + ', in woods ' + pct(hw) + ' (table: protection ' + COVER.wood[1] + ')');
ok(wood && hw < hs[0] * .8, 'woods stop part of the rounds');
const house = T.houses.find(h => !h.tower), ux = house.c, uz = -house.s, near = C.addMan('rifleman', 0, house.x + ux * (house.hw + 1.5), house.z + uz * (house.hw + 1.5), 0), cv = C.cover(near);
ok(cv.p === COVER.wall[1] && cv.x * ux + cv.z * uz < 0, 'a soldier at a wall has its cover, toward the wall');
const hitFrom = sg => { let n = 0; for (let i = 0; i < 2000; i++) if (C.manHit(near, HK.bullet, 10, near.x, near.y + 1, near.z, sg * ux, sg * uz)) n++; return n / 2000; };
const up = hitFrom(1); near.st = 1; const far = hitFrom(1), open = hitFrom(-1); near.st = 0;   // sg = +1: the round travels away from the wall, so it comes past the wall's side
console.log('   at a wall: rounds along it from its side get through ' + pct(up) + ' standing, ' + pct(far) + ' crouched; from the open side ' + pct(open));
ok(up === 1 && far < .6 && open === 1, 'the wall edge protects a crouched soldier, from its own side only');
const vr = [0, 1, 2].map(st => { near.st = st; return C.$('visR')(near); }); near.st = 0; const om = C.addMan('rifleman', 0, B.x, B.z, 0), vo = $('visR')(om);
console.log('   seen from: open standing ' + vo.toFixed(0) + ' m; at the wall standing ' + vr[0].toFixed(0) + ', crouched ' + vr[1].toFixed(0) + ', prone ' + vr[2].toFixed(0) + ' m');
ok(vr[0] === vo && vr[1] < vo * STANCE[1].vis && vr[2] < vr[1], 'the wall conceals whoever is not standing, and stance shortens the distance a soldier is seen at');

console.log('-- blast: a grenade 5 m away --');
const blast = (st, where) => { const m = where || C.addMan('rifleman', 0, B.x + 300 + st * 40, B.z + 300, 0); m.st = st; const h = C.manHit(m, HK.blast, MAN.nade.dmg * (1 - 5 / MAN.nade.r), m.x - 5, m.y, m.z); return h.dmg; };
const bl = [0, 1, 2].map(st => blast(st)); near.st = 1; const bc = C.manHit(near, HK.blast, MAN.nade.dmg * (1 - 5 / MAN.nade.r), near.x - 5 * ux, near.y, near.z - 5 * uz).dmg, bo = C.manHit(near, HK.blast, MAN.nade.dmg * (1 - 5 / MAN.nade.r), near.x + 5 * ux, near.y, near.z + 5 * uz).dmg; near.st = 0;
console.log('   standing ' + bl[0].toFixed(1) + ', crouched ' + bl[1].toFixed(1) + ', prone ' + bl[2].toFixed(1) + ' of ' + MAN.hp + ' hp; crouched at a wall, burst on its side ' + bc.toFixed(1) + ', on the open side ' + bo.toFixed(1));
ok(bl[0] >= MAN.hp && bl[2] < MAN.hp * .5 && bl[2] < bl[1] && bc < bo, 'prone and cover cut a burst');

console.log('-- rifle against each kind of target (60 rounds at 120 m, damage taken) --');
const rifleOn = (kind, id) => {
  fresh(); const m = C.addMan('rifleman', 1, B.x, B.z, 0), t = kind === 'inf' ? C.addMan('schutze', 0, B.x + 120, B.z, 0) : C.addVehicle(kind, id, 0, B.x + 120, B.z, kind === 'art' ? 0 : Math.PI);
  const hp0 = t.hp, c0 = t.parts ? t.parts.map(p => p.hp).join() : ''; t.hp = t.max = 1e6; m.arms[0].mag = 1e9; m.arms[0].d = Object.assign({}, m.arms[0].d, { rate: .1 });
  m.ctl.fire = true; C.run(kind === 'art' ? 40 : 7, () => { aimAt(m, t, kind === 'art' ? 1.5 : 0); m.held = false; });
  return { dmg: 1e6 - t.hp, parts: t.parts ? t.parts.map(p => p.hp).join() !== c0 : false, crew: t.def.parts && t.def.parts.pos && t.def.parts.pos.length ? t.def.parts.pos.filter(i => t.parts[i].hp > 0).length : null };
};
const rI = rifleOn('inf'), rT = rifleOn('truck'), rA = rifleOn('aa', 'wirbel'), rK = rifleOn('tank', 'tiger'), rH = rifleOn('art', 'hummel');
fresh('modern'); const rP = rifleOn('art', 'pzh');
console.log('   soldier ' + rI.dmg.toFixed(0) + ', truck ' + rT.dmg.toFixed(0) + ', AA ' + rA.dmg.toFixed(0) + ', tank ' + rK.dmg.toFixed(2) + ', open-topped gun ' + rH.dmg.toFixed(2) + ' (crew left ' + rH.crew + ' of 3), closed gun ' + rP.dmg.toFixed(2) + ' (crew ' + rP.crew + ')');
ok(rI.dmg > 50 && rT.dmg > 50 && rA.dmg > 50, 'small arms hurt soldiers, trucks and AA');
ok(rK.dmg === 0 && !rK.parts, 'small arms do nothing to a tank');
ok(rH.dmg < 3 && rH.crew < 3 && rP.crew === 3 && rP.dmg < 3, 'on artillery they only reach the crew of an open-topped gun');

console.log('-- anti-tank rocket against a tank, by the face struck (20 rockets each, from 40 m) --');
const rocketOn = (era, kit, tank, ang, dist0) => {
  let dmg = 0, kills = 0, n = 0, plate = 0, bare = 0;
  for (let i = 0; i < 20; i++) {
    fresh(era); const t = C.addVehicle('tank', tank, 0, B.x + dist0, B.z, ang), m = C.addMan(kit, 1, B.x, B.z, 0), hp = t.hp;
    m.ctl.w = m.w = 1; m.ctl.fire = true; const w = m.arms[1].d, tt = dist0 / w.spd;
    C.run(4, () => { aimAt(m, t, .125 * 9.81 * tt * tt); m.ctl.fire = S.t > .3; return !t.dead && (m.arms[1].t < 0 || S.bombs.length > 0); });
    const d = t.dead ? hp : hp - t.hp; n++; dmg += d; if (t.dead) kills++;
    if (t.def.parts.some((p, j) => p.shield && t.parts[j].hp <= 0)) plate++; else bare += d;   // the rocket set off a reactive plate, or did not
  }
  return { dmg: dmg / n, kills, plate, bare: n > plate ? bare / (n - plate) : 0 };
};
for (const [era, kit, tank, d0] of [['ww2', 'pzjager', 'sherman', 40], ['ww2', 'bazookaman', 'pz4', 40], ['modern', 'redAT', 'abrams', 80]]) {
  const f = rocketOn(era, kit, tank, Math.PI, d0), s = rocketOn(era, kit, tank, Math.PI / 2, d0), r = rocketOn(era, kit, tank, 0, d0);
  console.log('   ' + KITS[kit].arms[1].name + ' on ' + tank + ' (' + $('TANKS')[tank].hp + ' hp): front ' + f.dmg.toFixed(0) + ' (' + f.kills + '/20 kills), side ' + s.dmg.toFixed(0) + ' (' + s.kills + (s.plate ? '; ' + s.plate + ' on its reactive plates, the others ' + s.bare.toFixed(0) : '') + '), rear ' + r.dmg.toFixed(0) + ' (' + r.kills + ')');
  ok(r.dmg > f.dmg && s.bare > f.dmg && r.kills >= f.kills && r.kills > 0, '  flank and rear shots do more than frontal ones' + (s.plate ? ' (on the flank, off its reactive plates: DMG.era)' : ''));
  if ($('DMG').era[tank]) ok(s.plate > 0 && s.dmg < s.bare, '  reactive plates on the flank take part of the rockets');
}

console.log('-- guided anti-tank missile: tank at 600 m, clear and behind smoke --');
const jav = smoke => {
  fresh('modern'); const t = C.addVehicle('tank', 't72', 1, B.x + 600, B.z, 0), m = C.addMan('blueAT', 0, B.x, B.z, 0), hp = t.hp; let launched = 0, lost = false;
  m.ctl.w = m.w = 1; m.ctl.fire = true;
  if (smoke === 1) C.addSmoke(t.x - 20, t.y, t.z); S.smokes.forEach(s => { s.t0 -= 2; });
  C.run(14, () => { aimAt(m, t); if (S.missiles.length && !launched) { launched = S.t; if (smoke === 2) { C.addSmoke(t.x - 20, t.y, t.z); S.smokes.forEach(s => { s.t0 -= 2; }); } } if (launched && S.missiles[0] && !S.missiles[0].target) lost = true; });
  return { launched, dead: t.dead, dmg: hp - Math.max(0, t.hp), lost };
};
const j0 = jav(0), j1 = jav(1), j2 = jav(2);
console.log('   clear: launched at ' + j0.launched.toFixed(1) + ' s, damage ' + j0.dmg.toFixed(0) + (j0.dead ? ' (destroyed)' : '') + '; smoke before launch: launched ' + !!j1.launched + '; smoke after launch: lock lost ' + j2.lost + ', damage ' + j2.dmg.toFixed(0));
ok(j0.launched > 1.4 && j0.dmg > 80, 'it locks, flies and hits');
ok(!j1.launched, 'no lock and no launch through smoke');
ok(j2.launched && j2.lost && j2.dmg < j0.dmg, 'smoke after the launch breaks the lock');

console.log('-- shoulder SAM: a plane crossing at 1500 m, without and with flares (60 each) --');
const sam = flares => {
  let kills = 0, hits = 0, n = 0;
  for (let i = 0; i < 60; i++) {
    fresh('modern'); const p = C.addPlane('su25', 1, B.x + 1500, g + 500, B.z - 1500, -Math.PI / 2, false), m = C.addMan('blueAD', 0, B.x, B.z, 0), hp = p.hp; let fired = false;
    p.flares = flares ? 40 : 0; m.ctl.w = m.w = 1; m.ctl.fire = true; p.ctl.thr = .8;
    C.run(7, () => { aimAt(m, p); p.y = g + 500; p.v.y = 0; if (S.missiles.length) fired = true; if (flares && fired && S.missiles.length) C.dropFlare(p); return !p.dead; });
    if (fired) n++; if (p.dead) kills++; if (p.hp < hp) hits++;
  }
  return { kills, hits, n };
};
C.seed(100); // flare trials get their own dice so earlier sections cannot shift them
const s0 = sam(false), s1 = sam(true);
console.log('   no flares: ' + s0.n + ' launched, ' + s0.hits + ' hit, ' + s0.kills + ' shot down; with flares: ' + s1.n + ' launched, ' + s1.hits + ' hit');
ok(s0.n >= 54 && s0.hits >= 42, 'it locks and hits a plane');
ok(s1.hits < s0.hits * .85, 'flares decoy it part of the time (target out of afterburner)');

console.log('-- run over --');
fresh(); { const m = C.addMan('rifleman', 0, B.x + 60, B.z, 0), f = C.addMan('schutze', 1, B.x + 30, B.z + 1, 0), t = C.addVehicle('tank', 'tiger', 1, B.x, B.z, 0); t.ctl.drive = 1;
  C.run(12); ok(m.dead && m.lastBy !== undefined, 'an enemy tank driving over a soldier kills it'); ok(!f.dead, 'and drives through its own without harm'); }
if (require.main === module) H.done();
module.exports = { C, fresh, aimAt };
