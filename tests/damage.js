'use strict';
/* the part model: where a hit lands on one plane, one helicopter, one tank and one wheeled vehicle, and each effect once.
   node tests/damage.js (PAGE=<page>; N=<strikes per armour row>, default 300) */
const { load, ok, done } = require('./harness.js');
const C = load({ seed: 7 }), $ = C.$, DMG = $('DMG'), HK = $('HK'), RES = $('RES'), N = +process.env.N || 300;
const pst = $('pst'), psig = $('psig'), LN = $('LN'), f2 = v => v.toFixed(2);
let S = C.sandbox('modern');
const B = () => ({ x: 4000, z: 300 }), ix = (o, id) => o.def.parts.ix[id], hp = (o, id) => o.parts[ix(o, id)].hp, st = (o, id) => pst(o, ix(o, id));
const kill = (o, id) => { o.parts[ix(o, id)].hp = 0; C.refit(o); }, hurtTo = (o, id, k) => { o.parts[ix(o, id)].hp = o.def.parts[ix(o, id)].max * k; C.refit(o); };
const veh = (kind, id, h) => { const u = C.addVehicle(kind, id, 1, 4000 + S.units.length * 40, 0, h || 0); u.inv = 0; u.ai = null; return u; };
const plane = id => { const p = C.addPlane(id, 1, 3000, 900, S.planes.length * 80, 0, false); p.inv = 0; return p; };
const heli = id => { const p = C.addHeli(id, 1, 3500, 400, S.planes.length * 80, 0, false); p.inv = 0; return p; };
const tick = (o, s) => { for (let t = 0; t < s && !o.dead; t += .1) { S.t += .1; if (o.burn) o.burn += .1; C.ail(o, .1); } };
/* a point of a part's box in the world: its centre, or for a pair the middle of one half */
const at = (o, d) => {
  const b = d.box, z = b[6] ? b[2] + (b[5] + b[6]) / 2 : b[2];
  if (o.kind) { const c = Math.cos(o.h), s = Math.sin(o.h), t = d.tur ? o.def.tx : 0, cy = Math.cos(o.ty), sy = Math.sin(o.ty), x = t + b[0] * cy + z * sy, zz = -b[0] * sy + z * cy; return [o.x + x * c + zz * s, o.y + 1.5 + b[1], o.z - x * s + zz * c]; }
  return [o.x + o.f.x * b[0] + o.u.x * b[1] + o.r.x * z, o.y + o.f.y * b[0] + o.u.y * b[1] + o.r.y * z, o.z + o.f.z * b[0] + o.u.z * b[1] + o.r.z * z];
};

console.log('-- the parts of each class --');
for (const [n, T] of [['plane', $('PLANES')], ['tank', $('TANKS')], ['aa', $('AAS')], ['art', $('ARTS')], ['trn', $('TRNS')], ['heli', $('HELIS')]]) {
  const l = Object.values(T).map(d => d.parts.length), bad = Object.keys(T).filter(id => T[id].parts.some(p => !p.lab || !(p.max > 0) || (p.box && p.box.some(v => !Number.isFinite(v)))));
  console.log('   ' + n + ': ' + Math.min(...l) + ' to ' + Math.max(...l) + ' parts');
  ok(!bad.length && Math.max(...l) <= 24, n + ': every part has a label, health and a finite volume, at most 24 a vehicle' + (bad.length ? ' (' + bad + ')' : ''));
}

console.log('-- where a hit lands --');
for (const [nm, o] of [['Ju 87', plane('stuka')], ['F-22', plane('f22')], ['AH-64', heli('ah64')], ['Tiger', veh('tank', 'tiger')], ['T-90M', veh('tank', 't90')], ['Tigr', veh('car', 'tigr')], ['LAV-25', veh('lav', 'lav25')]]) {
  const D = o.def.parts, miss = [];
  D.forEach((d, i) => {
    if (!i || !d.box) return;
    const [x, y, z] = at(o, d), got = C.hitPart(o, x, y, z), g = D[got];
    if (got !== i && !(got > i && C.boxDist(o, g, ...(() => { C.toBody(o, x - o.x, y - o.y - (o.kind ? 1.5 : 0), z - o.z, 0); const H = $('HB'); return [H[0], H[1], H[2]]; })()) === 0)) miss.push(d.id + '->' + g.id);
  });
  ok(!miss.length, nm + ': a hit in the middle of each of its ' + D.filter(d => d.box).length + ' volumes lands on it, or on a part set inside it' + (miss.length ? ' (' + miss + ')' : ''));
}
{
  const u = veh('tank', 'tiger'), d = u.def.parts[ix(u, 'breech')], [x, y, z] = at(u, d);
  const pt = C.hitPart(u, x, y, z - 6, 0, 0, 1, 3.7), via = LN.slice();
  ok(u.def.parts[pt].id === 'trav' && via.includes(ix(u, 'breech')), 'a shell through the side of the turret strikes the turret and goes on to ' + via.map(i => u.def.parts[i].id));
  const e = C.hitPart(u, u.x - 7, u.y + 1.5 + u.def.parts[ix(u, 'engine')].box[1], u.z, 1, 0, 0, 3.7);
  ok(['engine', 'cool', 'fuel', 'trans'].includes(u.def.parts[e].id), 'from behind, the first thing on the line is in the engine bay (' + u.def.parts[e].id + ')');
}

console.log('-- armour: calibre, angle, plate --');
{
  const rate = (sh, tg, dmg, ang, tur, range) => {
    let pen = 0, n = 0;
    for (let i = 0; i < N; i++) {
      const u = veh('tank', tg, 0), by = { x: u.x + Math.cos(ang) * range, y: u.y, z: u.z - Math.sin(ang) * range }, d = u.def.parts[tur ? ix(u, 'trav') : 0], y = u.y + 1.5 + (tur ? d.box[1] : u.def.parts[0].box[1]);
      const h = C.strike(u, HK.shell, dmg, by, u.x + Math.cos(ang) * 6, y, u.z - Math.sin(ang) * 6, -Math.cos(ang), 0, Math.sin(ang));
      S.units.length = 0; if (!h) continue; n++; if (h.res === 0) pen++;
    }
    return n ? pen / n : -1;
  };
  const a = rate('pz4', 'sherman', 46, 0, false, 500), b = rate('pz4', 'sherman', 46, Math.PI / 2, false, 500), c = rate('t34', 'tiger', 50, 0, false, 500), d = rate('t34', 'tiger', 50, Math.PI / 2, false, 500), e = rate('t90', 'abrams', 62, 0, true, 800), f = rate('t90', 'abrams', 62, Math.PI, false, 800), g = rate('pz4', 'sherman', 46, 0, false, 2400);
  console.log('   goes in: 7,5 cm on Sherman front ' + f2(a) + ' (at 2400 m ' + f2(g) + '), side ' + f2(b) + '; 85 mm on Tiger front ' + f2(c) + ', side ' + f2(d) + '; 125 mm on Abrams turret front ' + f2(e) + ', hull rear ' + f2(f));
  ok(b === 1 && d === 1 && f === 1, 'sides and rear are always pierced');
  ok(a > .6 && a < 1 && c < .5 && e < .2 && g < a, 'the front holds by gun and range: often against a weaker gun, less so close up');
  const u = veh('tank', 'abrams'), h0 = u.hp; let no = null; for (let i = 0; i < 50 && !no; i++) { const h = C.strike(u, HK.shell, 62, null, u.x + 6, u.y + 1.5 + u.def.parts[ix(u, 'trav')].box[1], u.z, -1, 0, 0); if (h && h.res === 1) no = h; }
  ok(no && no.k === HK.blast && no.dmg < 62 * .9 * DMG.pen.no[HK.shell] + .01 && !no.via.length, 'a shell that does not go in bursts on the plate: ' + (no ? f2(no.dmg) + ' of 62, "' + $('FACE')[no.f] + (no.tur ? ' da torre: ' : ' do casco: ') + RES[no.res] + '"' : 'none'));
  const t = veh('tank', 't90'), era = t.def.parts[ix(t, 'eraL')], [x, y, z] = at(t, era), h = C.strike(t, HK.heat, 140, null, x, y, z - .5, 0, 0, 1);
  ok(h && h.res === 3 && h.k === HK.shell && h.w === 2 && h.pt === ix(t, 'eraL') && Math.abs(h.dmg / (140 * 1.15) - era.shield[HK.heat]) < .02, 'a shaped charge on a reactive plate: "' + RES[3] + '", ' + f2(h.dmg) + ' of 140 left');
  C.damageUnit(t, h.dmg, null, false, h); const h2 = C.strike(t, HK.heat, 140, null, x, y, z - .5, 0, 0, 1);
  ok(st(t, 'eraL') === 3 && h2.res === 0 && h2.dmg > 140, 'the plate is spent: the next one goes in');
  const car = veh('car', 'tigr'), hc = C.strike(car, HK.shell, 62, null, car.x, car.y + 2, car.z - 5, 0, 0, 1);
  ok(hc.res === 2 && Math.abs(hc.dmg - 62 * DMG.pen.thru) < .01, 'a tank shell goes right through a light vehicle: "' + RES[2] + '", ' + f2(hc.dmg) + ' of 62');
  ok(h0 === u.hp, 'strike itself changes nothing');
}
{
  const pen = $('SARMS').rpg.pen, rpg = (kind, id, ang, tur) => {   // the RPG-7's rocket square on the middle of a face, as the rocket's flight hands it to strike
    let p = 0, n = 0;
    for (let i = 0; i < N; i++) {
      const u = veh(kind, id, 0), d = u.def.parts[tur ? ix(u, 'trav') : 0], y = u.y + 1.5 + (tur ? d.box[1] : u.def.parts[0].box[1]), by = { x: u.x + Math.cos(ang) * 150, y: u.y, z: u.z - Math.sin(ang) * 150 };
      const h = C.strike(u, HK.heat, 140, by, u.x + Math.cos(ang) * 6, y, u.z - Math.sin(ang) * 6, -Math.cos(ang), 0, Math.sin(ang), pen);
      S.units.length = 0; if (!h || h.res === 3) continue; n++; if (h.res === 0 || h.res === undefined) p++;
    }
    return n ? p / n : -1;
  };
  const M = ['abrams', 'leo2', 't90', 't72'], fr = M.map(id => [rpg('tank', id, 0, false), rpg('tank', id, 0, true)]), rr = M.map(id => [rpg('tank', id, Math.PI, false), rpg('tank', id, Math.PI, true)]);
  const sd = M.map(id => rpg('tank', id, Math.PI / 2, false)).filter(v => v >= 0), lt = [rpg('lav', 'lav25', 0, false), rpg('car', 'tigr', 0, false)];
  console.log('   RPG-7 (pen ' + pen + ') goes in: hull and turret front ' + M.map((id, i) => id + ' ' + fr[i].map(f2).join('/')).join(', ') + '; rear ' + rr.map(r => r.map(f2).join('/')).join(', ') + '; hull side (no reactive plate) ' + sd.map(f2) + '; LAV-25 and Tigr from the front ' + lt.map(f2));
  ok(fr.every(r => r[0] === 0 && r[1] === 0), 'the RPG-7 does not go through the front of a modern tank, hull or turret');
  ok(rr.every(r => r[0] === 1 && r[1] === 1) && sd.length && sd.every(v => v === 1), 'it goes through the side and the rear');
  ok(lt.every(v => v === 1), 'and a light armoured vehicle anywhere');
}

console.log('-- ammunition, crew, fire --');
{
  const R = Math.random; let u = veh('tank', 'tiger');
  $('Math').random = () => 0; C.damageUnit(u, 10, null, false, { k: HK.shell, pt: ix(u, 'trav'), via: [ix(u, 'rackT')] }); $('Math').random = R;
  ok(u.dead && u.end === 2, 'a shell that reaches the ready rack behind the turret wall can set it off');
  u = veh('tank', 'abrams'); $('Math').random = () => 0; C.damageUnit(u, 10, null, false, { k: HK.shell, pt: ix(u, 'trav'), via: [ix(u, 'rackT')] }); $('Math').random = R;
  ok(!u.dead && st(u, 'rackT') === 3 && u.burn > 0, 'with blow-out panels the rack burns out and the tank lives, on fire');
  const e0 = u.ext === undefined ? DMG.ext.tank : u.ext; tick(u, 4);
  ok(!u.burn && u.ext === e0 - 1, 'the extinguisher puts it out by itself: ' + u.ext + ' charges left');
  u = veh('tank', 'pz4'); u.ext = 0; u.burn = .01; const p0 = u.parts.map(p => p.hp).join(); tick(u, 12);
  ok(u.parts.map(p => p.hp).join() !== p0, 'with none left the fire spreads to the parts around the engine');
  tick(u, 400); ok(u.dead && u.end === 2, 'and in the end the ammunition cooks off');
  u = veh('tank', 'sherman'); C.gone(u, ix(u, 'driver')); C.refit(u);
  ok(u.mod.drive === 0 && !u.end, 'the driver lost: the tank stands'); tick(u, DMG.swap.t + .5);
  ok(u.mod.drive === 1 && hp(u, 'driver') === 1 && hp(u, 'loader') === 0 && u.mod.reload === .5, 'after ' + DMG.swap.t + ' s the loader is at the levers, and the gun loads slower');
  for (const id of ['gunner', 'cmdr', 'driver']) C.gone(u, ix(u, id)); ok(u.end === 1, 'the last of the crew lost: the tank is out');
  u = veh('tank', 'tiger'); let n = 0; for (let i = 0; i < 400; i++) { const v = veh('tank', 'tiger'); C.casualty(v, 'hull'); if (hp(v, 'driver') === 0) n++; S.units.pop(); }
  ok(n === 400, 'a casualty in the hull is the driver');
}

console.log('-- what runs out, shocks, overload --');
{
  let p = plane('stuka'); hurtTo(p, 'oil', .2); const T = p.def.parts[ix(p, 'oil')].drain.t[1]; tick(p, T - 2);
  ok(hp(p, 'eng') > 0 && p.parts[ix(p, 'oil')].t > .8 && p.mod.crip, 'oil hit: the engine runs on, counted down, and an AI would turn for home'); tick(p, 4);
  ok(hp(p, 'eng') === 0 && p.mod.thrust === 0 && !p.burn, 'after ' + T + ' s it seizes');
  p = plane('f22'); S.t += 1; C.damagePlane(p, p.def.parts[ix(p, 'jetL')].max * .4, null, false, { k: HK.bullet, pt: ix(p, 'jetL') });
  const t0 = p.mod.thrust; tick(p, 3); ok(t0 < .2 && t0 > .05 && p.mod.thrust > .8, 'a jet engine hit stalls the compressor: thrust ' + f2(t0) + ' for ' + p.def.parts[ix(p, 'jetL')].shock[2] + ' s, then ' + f2(p.mod.thrust));
  p = plane('stuka'); hurtTo(p, 'tipL', .2); p.g = p.def.gmax * .9; p.V = 80; tick(p, DMG.over.t + .3);
  ok(st(p, 'tipL') === 3 && !p.dead && p.mod.roll < .6 && p.mod.asym < 0, 'a weakened outer wing folds under g; the plane flies on, rolling');
  p = plane('stuka'); hurtTo(p, 'wingR', .2); p.g = p.def.gmax * .9; p.V = 80; tick(p, DMG.over.t + .3);
  ok(p.dead, 'the inner section folding is the end of it');
  p = plane('f22'); kill(p, 'radar'); ok(p.mod.lock === 0 && C.lockOn(p, [plane('su57')], 9000, 3) === null, 'no radar, no lock');
  p = plane('f22'); p.ord = [4, 2]; C.gone(p, ix(p, 'sto')); ok(p.ord[0] === 0 && p.ord[1] === 2, 'a hit on the pylons loses a store');
  let h = heli('ah64'); const pd = h.def.parts[ix(h, 'pilot')].max + 1; C.damagePlane(h, pd, null, false, { k: HK.bullet, pt: ix(h, 'pilot') });
  ok(!h.dead && h.mod.ctl === 0, 'helicopter pilot lost with a gunner aboard: nobody at the controls for a moment'); tick(h, DMG.swap.heli + .3);
  ok(!h.dead && h.mod.ctl > .5 && hp(h, 'gunner') === 0 && h.mod.slew === 0, 'then the gunner flies it home, and the gun is unmanned');
  C.damagePlane(h, pd, null, false, { k: HK.bullet, pt: ix(h, 'pilot') }); ok(h.dead, 'a second loss ends it');
  h = heli('uh60'); C.damagePlane(h, pd, null, false, { k: HK.bullet, pt: ix(h, 'pilot') }); ok(h.dead, 'with no gunner the pilot is the helicopter');
  h = heli('ah64'); hurtTo(h, 'tgb', .2); tick(h, h.def.parts[ix(h, 'tgb')].drain.t[1] + 1); ok(hp(h, 'tail') === 0 && h.mod.yaw < .1, 'tail gearbox dry: the tail rotor stops');
  h = heli('ah64'); C.damagePlane(h, 999, null, false, { k: HK.bullet, pt: ix(h, 'boom') }); ok(h.dead, 'the tail boom shot through ends it');
  const car = veh('car', 'tigr'), old = veh('car', 'kubel'); kill(car, 'wFL'); kill(old, 'wFL');
  ok(car.mod.turn < 1 && old.mod.turn < car.mod.turn, 'a front wheel shot out: steering ' + f2(old.mod.turn) + ', on run-flats ' + f2(car.mod.turn));
}

console.log('-- field repair --');
{
  const u = veh('tank', 'tiger'); for (const id of ['trackL', 'gun', 'sightG', 'engine']) kill(u, id);
  u.ctl.fix = true; S.my = u; S.fixPri = 0; const seq = []; let t = 0;
  for (; t < 120 && u.mod.fixable; t += .1) { S.t += .1; C.fieldFix(u, .1); if (u.fix && seq[seq.length - 1] !== u.def.parts[u.fix.pt].id) seq.push(u.def.parts[u.fix.pt].id); }
  console.log('   mobility first: ' + seq.join(', ') + ' in ' + t.toFixed(0) + ' s; left: ' + u.def.parts.filter((d, i) => pst(u, i) === 3).map(d => d.id));
  ok(seq.join() === 'trackL,engine,sightG' && st(u, 'gun') === 3 && !u.mod.fixable, 'tracks and engine, then the sight; a destroyed barrel is not for the field');
  ok(t > 8 * 2 + 8 * 3 + 7 && t < 8 * 2 + 8 * 3 + 9.5, 'a track takes twice and an engine three times as long as the rest');
  kill(u, 'trackL'); kill(u, 'sightG'); S.fixPri = 1; C.fieldFix(u, .1); ok(u.def.parts[u.fix.pt].id === 'sightG' && u.fix.n === 1, 'guns first (O): the sight, with one more waiting'); S.my = null;
}

console.log('-- part states for the room --');
{
  const u = veh('tank', 'abrams'), g = veh('tank', 'abrams'), Net = $('Net'), dbits = $('dbits'); S.net = true; Net.dm = true;
  const whole = dbits(u); hurtTo(u, 'trackL', 0); hurtTo(u, 'engine', .5); const light = dbits(u);
  for (const [id, k] of [['trackR', 0], ['engine', .2], ['sightC', .5], ['loader', 0]]) hurtTo(u, id, k); u.burn = 1; C.refit(u);
  const d = dbits(u); C.setBits(g, d);
  ok(Number.isSafeInteger(d) && u.def.parts.every((q, i) => !i || pst(u, i) === pst(g, i)) && g.burn > 0, 'a ghost takes every part state and the fire from ' + d);
  for (const q of u.parts) q.hp = 0; u.hp = 0; C.refit(u); const worst = dbits(u), g3 = veh('tank', 'abrams'); C.setBits(g3, worst);
  ok(Number.isSafeInteger(worst) && worst < 2 ** 49 && g3.parts.every((q, i) => !i || q.hp === 0) && g3.burn > 0, 'all ' + u.parts.length + ' parts destroyed and burning is still an exact number');
  Net.dm = false; const old = dbits(u), g2 = veh('tank', 'abrams'); C.setBits(g2, old);
  ok(old < 1 << 21 && pst(g2, 9) === 3 && pst(g2, 10) === 0 && g2.burn > 0, 'for an older server it is the old number, the first ten parts');
  console.log('   bytes of d in a state row, before -> now: whole 1 -> ' + String(whole).length + '; a track off and the engine hurt 2 -> ' + String(light).length + '; hurt across the list and burning 7 -> ' + String(d).length + '; everything destroyed and burning 7 -> ' + String(worst).length);
  ok(whole === 0 && String(worst).length <= 15, 'whole is still 0, and the worst case is ' + String(worst).length + ' bytes');
  S.net = false;
}

console.log('-- soldiers --');
{
  const m = C.addMan('rifleman', 1, B().x + 200, B().z + 200, 0); m.inv = 0; const h0 = m.hp;
  C.damageMan(m, 8, null, false, { k: HK.bullet, pt: 0 }); const bl = m.bl, h1 = m.hp; m.v.x = 3; for (let i = 0; i < 100; i++) C.bleed(m, .1);
  ok(bl > 0 && m.hp < h1 - bl * 9 && m.bl > 0, 'a wounded soldier on the move bleeds: ' + f2(bl) + ' hp/s'); m.v.x = 0; for (let i = 0; i < DMG.man.band * 10 + 2; i++) C.bleed(m, .1);
  ok(m.bl === 0, 'still for ' + DMG.man.band + ' s, it is bandaged');
  let stop = 0; S.era = 'modern'; for (let i = 0; i < 2000; i++) { const h = C.manHit(m, HK.bullet, 4.5, m.x, m.y + 1.6 * $('MAN').sc, m.z, 1, 0); if (h && h.pt === 1 && h.dmg < 4.5 * 3 * .5) stop++; }
  let rifle = 0; for (let i = 0; i < 500; i++) { const h = C.manHit(m, HK.bullet, 9, m.x, m.y + 1.6 * $('MAN').sc, m.z, 1, 0); if (h && h.dmg < 9 * 3 * .5 && h.pt === 1) rifle++; }
  ok(stop > 600 && stop < 1200 && rifle === 0, 'a helmet stops a light round ' + Math.round(stop / 20) + '% of the time, a rifle round never');
}
done();
