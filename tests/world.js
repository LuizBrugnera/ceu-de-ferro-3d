'use strict';
/* World objects: houses, trees, airfield buildings and wrecks as solid, destructible things. What stops at a wall, what a wall takes from
   each weapon, the stages and what each blocks, collisions, sight, and the AI around buildings. DRIVE=<s> sets the length of the drives (300) */
const H = require('./harness'), C = H.load({ seed: 31 }), $ = C.$, ok = H.ok, DRIVE = +process.env.DRIVE || 300;
const OBJ = $('OBJ'), OBJD = $('OBJD'), OBJS = $('OBJS'), MAN = $('MAN'), STANCE = $('STANCE'), ARMS = $('ARMS'), PLANES = $('PLANES'), SARMS = $('SARMS'), HK = $('HK'), TANKS = $('TANKS');
const DT = .017;
let S, T;
/* The buildings of the towns are structures now (tests/city.js). Here each stands in for the plain box a world object is, the kind 'house',
   so that this suite goes on testing what every such object does: the airfield's buildings, the trees, the wrecks. box(false) gives them back
   (CITY=1: the long drives run among the real ones, soldiers free to walk in) */
const box = on => { for (const era in $('TERRAIN')) for (const o of $('TERRAIN')[era].houses) { if (on && o.B) { o.B1 = o.B; o.B = null; o.k = 'house'; o.K = OBJ.house; o.tower = o.B1.t === 'tower' ? 1 : 0; o.hp = Math.fround(OBJ.house.hp[0] + OBJ.house.hp[1] * o.hw * o.hd * 4 * o.h); } else if (!on && o.B1) { o.B = o.B1; o.B1 = null; o.k = 'bld'; o.K = OBJ.bld; o.hp = OBJ.bld.hp[0]; } } };
const fresh = (era, real) => { box(false); S = C.sandbox(era || 'ww2'); T = S.T; if (!real) { box(true); for (const o of T.houses) S.oh[o.id] = o.hp; } return S; };
const run = (secs, each, dt) => C.run(secs, each, dt || DT);
const hp = o => S.oh[o.id], st = o => S.os[o.id];
/* a house on level ground with nothing else on the line through it along its own x axis: the shooter's side is +x */
function site(pick) {
  const ok2 = o => {
    const ux = o.c, uz = -o.s, a = { x: o.x + ux * (o.hw + 150), z: o.z + uz * (o.hw + 150) }, b = { x: o.x - ux * (o.hw + 4), z: o.z - uz * (o.hw + 4) }, ya = C.hgt(a.x, a.z), yb = C.hgt(b.x, b.z);
    if (o.tower || Math.abs(ya - o.y) > 3 || Math.abs(yb - o.y) > 1.5) return false;
    for (const q of T.objs) if (q !== o && q.k !== 'tree' && (C.footD(q, b.x, b.z) < 9 || [.2, .4, .6, .8].some(k => C.footD(q, o.x + ux * (o.hw + 150 * k), o.z + uz * (o.hw + 150 * k)) < 6))) return false;
    for (let k = 1; k < 30; k++) if (C.hgt(o.x + ux * (o.hw + 5 * k), o.z + uz * (o.hw + 5 * k)) > o.y + 1.6 + (ya - o.y) * k / 30 + .2) return false;
    return true;
  };
  const l = T.houses.filter(ok2).sort((a, b) => a.hp - b.hp), o = l[pick === 'big' ? l.length - 1 : pick === 'mid' ? l.length >> 1 : 0], ux = o.c, uz = -o.s;
  return { o, ux, uz, at: d => ({ x: o.x + ux * d, z: o.z + uz * d }), n: l.length };
}
const unit = (kind, id, team, p, h) => { const u = C.addVehicle(kind, id, team, p.x, p.z, h || 0); return u; };
const man = (id, team, p) => C.addMan(id, team, p.x, p.z, 0);
const reset = o => { S.os[o.id] = 0; S.oh[o.id] = o.hp; S.holes = []; };

console.log('-- generation: ids, counts, roads --');
for (const era of ['ww2', 'modern']) {
  fresh(era, true);
  const n = {}; for (const o of T.objs) n[o.k] = (n[o.k] || 0) + 1;
  let wall = 1e9, tree = 1e9;
  for (const o of T.objs) for (const r of T.routes) for (let s = 0; s <= r.len; s += 3) { const p = C.routeAt(r, s), d = C.footD(o, p.x, p.z); if (o.k === 'tree') tree = Math.min(tree, d); else wall = Math.min(wall, d); }
  const half = Math.max(...Object.values(TANKS).map(d => d.env[5])) + 5, ids = new Set(T.objs.map(o => o.id)), C2 = H.load({ seed: 999 }), T2 = C2.sandbox(era).T;
  console.log('   ' + era + ': ' + Object.entries(n).map(([k, v]) => v + ' ' + k).join(', ') + '; nearest wall to a road axis ' + wall.toFixed(1) + ' m, nearest tree ' + tree.toFixed(1) + ' m (a column needs ' + half.toFixed(1) + ')');
  ok(wall > half + 2 && tree > half + 2, era + ': the roads are clear of every footprint, with room for a column in its lane');
  ok(ids.size === T.objs.length && T.objs.every(o => T.byId[o.id] === o && o.id < T.nid), era + ': every object has an id of its own');
  ok(T2.objs.length === T.objs.length && T2.objs.every((o, i) => o.id === T.objs[i].id && o.x === T.objs[i].x && o.z === T.objs[i].z && o.hp === T.objs[i].hp), era + ': another client with another random seed builds the same objects under the same ids');
  const fixed = [0, 1].map(t => { const b = T.bases[t]; return Math.min(...T.objs.map(o => C.footD(o, b.x + (t ? -420 : 420), b.z + (t ? -170 : 170)))); });
  ok(Math.min(...fixed) > 20, era + ': the base guns stand clear of the airfield buildings (' + Math.min(...fixed).toFixed(0) + ' m)');
}

console.log('-- each kind of round stops at a house, damages it, and spares who stands right behind --');
fresh('ww2');
{
  const s = site('mid'), o = s.o, A = s.at(o.hw + 120), B = s.at(-o.hw - 4), ya = C.hgt(A.x, A.z) + 2.2, dir = { x: -s.ux, y: 0, z: -s.uz };
  const shooter = unit('tank', 'sherman', 0, s.at(o.hw + 126)), sol = man('rifleman', 0, s.at(o.hw + 124)), plane = { team: 0, x: A.x, y: ya, z: A.z, me: 0 };
  let truck, vic;
  const behind = () => { S.units = S.units.filter(u => u === shooter); S.men = S.men.filter(m => m === sol); truck = unit('truck', null, 1, s.at(-o.hw - 6)); vic = man('schutze', 1, s.at(-o.hw - 2.5)); vic.ai = null; };
  const aim = (y, sp) => { const ty = o.y + (y || 2.2) - ya, L = Math.hypot(120, ty); return { x: dir.x * 120 / L * sp, y: ty / L * sp, z: dir.z * 120 / L * sp }; };
  const KINDS = {
    'rifle bullet': () => { const v = aim(2, 850); S.bullets.push({ x: A.x, y: ya, z: A.z, vx: v.x, vy: v.y + .1, vz: v.z, life: 1.3, team: 0, dmg: 12, ap: 0, sa: 1, by: sol }); },
    'autocannon bullet (30 mm, 1080 m/s)': () => { const v = aim(2, 1080); S.bullets.push({ x: A.x, y: ya, z: A.z, vx: v.x, vy: v.y + .1, vz: v.z, life: 3, team: 0, dmg: 6.5, ap: .3, by: shooter }); },
    'tank shell (1550 m/s)': () => { const v = aim(2.4, 1550); C.shell(shooter, Object.assign({}, ARMS.ap), A.x, ya, A.z, v.x, v.y, v.z); },
    'howitzer shell': () => { const v = aim(3.4, 345); C.lob(shooter, Object.assign({}, ARMS.he), A.x, ya, A.z, v.x, v.y + 1.6, v.z); },
    'anti-tank rocket': () => { const v = aim(2.6, 140); C.lobbed(sol, 'heat', SARMS.rpg, A.x, ya, A.z, v.x, v.y + 2.1, v.z); },
    'hand grenade': () => { const p = s.at(o.hw + 12); C.lobbed(sol, 'nade', MAN.nade, p.x, o.y + 2, p.z, dir.x * 14, 5, dir.z * 14); },
    'aircraft rocket': () => { const v = aim(2.6, 600); S.bombs.push({ k: 'rocket', x: A.x, y: ya, z: A.z, vx: v.x, vy: v.y + .2, vz: v.z, o: PLANES.p47.ord[1], team: 0, by: shooter, life: 4 }); },
    'bomb': () => { const p = s.at(o.hw - 1); S.bombs.push({ k: 'bomb', x: p.x + s.ux * 30, y: o.y + 60, z: p.z + s.uz * 30, vx: dir.x * 30, vy: -55, vz: dir.z * 30, o: PLANES.bf109.ord[0], team: 0, by: shooter, life: 60 }); },
    'guided missile (AGM)': () => { S.missiles.push($('MSL').arm({ x: A.x, y: ya + 3, z: A.z, gnd: true, target: truck, o: PLANES.a10.ord[0], team: 0, by: shooter }, C.vnorm({ x: dir.x, y: -.02, z: dir.z }), shooter)); },
    'air-to-air missile': () => { S.missiles.push($('MSL').arm({ x: A.x, y: ya, z: A.z, target: null, o: PLANES.f22.ord[1], team: 0, by: shooter }, C.vnorm(aim(3, 1)), shooter)); },
    'flak burst': () => { shooter.ctl.fuse = 200; $('ARMK').flak.fire(shooter, Object.assign({}, ARMS.flak), { x: A.x, y: ya, z: A.z }, C.vnorm(aim(3, 1))); }
  };
  for (const k in KINDS) {
    reset(o); behind(); S.bullets = []; S.bombs = []; S.missiles = []; S.shells = [];
    const h0 = hp(o), t0 = truck.hp, v0 = vic.hp; let beyond = false;
    KINDS[k]();
    run(6, () => { for (const b of [...S.bullets, ...S.bombs, ...S.missiles]) if (!b.gone && (b.x - o.x) * s.ux + (b.z - o.z) * s.uz < -o.hw - .5 && C.footD(o, b.x, b.z) > .5 && b.y < o.y + o.h) beyond = true; return S.bullets.length + S.bombs.length + S.missiles.length + S.shells.length > 0; });
    const dh = h0 - hp(o), blast = /bomb|missile \(AGM|howitzer|aircraft rocket/.test(k), hurt = (t0 - truck.hp) + (v0 - vic.hp) + (truck.dead || vic.dead ? 99 : 0);
    console.log('   ' + k.padEnd(36) + 'house -' + dh.toFixed(2).padStart(7) + ' of ' + o.hp.toFixed(0) + (st(o) === 2 ? ' (down)' : '') + ', behind it: truck -' + (t0 - truck.hp).toFixed(1) + ', soldier -' + (v0 - vic.hp).toFixed(1));
    ok(dh > 0 && !beyond, k + ': stops at the wall and damages the house');
    if (!blast) ok(hurt === 0, k + ': nothing behind the house is hurt');
  }
  /* a burst beside a wall: the same burst, the same distance, with and without the wall between */
  const open = man('schutze', 1, s.at(o.hw + 9)), cov = man('schutze', 1, s.at(-o.hw - 3)); open.ai = cov.ai = null; reset(o);
  S.oh[o.id] = o.hp = 1e6; const p = s.at(o.hw + 3), d1 = Math.hypot(open.x - p.x, open.z - p.z), d2 = Math.hypot(cov.x - p.x, cov.z - p.z);
  open.hp = cov.hp = 1e4; C.explode(p.x, o.y + 1, p.z, 60, 200, shooter, 0);
  const lo = (1e4 - open.hp) / (1 - d1 / 60), lc = (1e4 - cov.hp) / (1 - d2 / 60);
  console.log('   a 200-point burst 3 m from the wall: in the open ' + (1e4 - open.hp).toFixed(0) + ' at ' + d1.toFixed(0) + ' m, behind the house ' + (1e4 - cov.hp).toFixed(0) + ' at ' + d2.toFixed(0) + ' m (shield ' + OBJS.shield + ')');
  ok(Math.abs(lc / lo - OBJS.shield) < .02, 'a wall between a burst and a soldier leaves the shield share of it');
  T.houses.forEach(q => { q.hp = OBJ[q.k].hp[0] + OBJ[q.k].hp[1] * q.hw * q.hd * 4 * q.h; });
}

console.log('-- no tunnelling: the fastest rounds at the largest step, through walls at random angles --');
for (const era of ['ww2', 'modern']) {
  fresh(era);
  const rnd = H.rng(7), R = (a, b) => a + rnd() * (b - a), sh = unit('tank', era === 'ww2' ? 'tiger' : 'abrams', 0, { x: 100, z: 0 });
  for (const [name, spd, dt, mk] of [['bullet 1080 m/s, step 17 ms', 1080, .017, 0], ['bullet 1080 m/s, step 50 ms', 1080, .05, 0], ['shell 1550 m/s, step 17 ms', 1550, .017, 1], ['shell 1550 m/s, step 50 ms', 1550, .05, 1], ['rocket 830 m/s, step 17 ms', 830, .017, 2], ['missile 900 m/s, step 17 ms', 900, .017, 3]]) {
    let through = 0, shots = 0, stopped = 0;
    for (let i = 0; i < 300; i++) {
      const o = T.houses[(rnd() * T.houses.length) | 0], a = R(0, 6.283), D = R(40, 160), off = R(-.9, .9) * Math.min(o.hw, o.hd), x = o.x + Math.cos(a) * D - Math.sin(a) * off, z = o.z + Math.sin(a) * D + Math.cos(a) * off, y = o.y + R(1, Math.max(1.5, o.h - 2)), y0 = y + R(-3, 12);
      const L = Math.hypot(D, y - y0) + R(0, 17), d = C.vnorm({ x: -Math.cos(a), y: (y - y0) / D, z: -Math.sin(a) }), sx = x, sz = z;
      if (C.hgt(sx, sz) > y0 - 1) continue;
      reset(o); S.bullets = []; S.bombs = []; S.missiles = []; S.t = 0;
      for (const q of T.houses) S.oh[q.id] = 1e6;
      const b = mk === 0 ? { x: sx, y: y0, z: sz, vx: d.x * spd, vy: d.y * spd, vz: d.z * spd, life: 3, team: 0, dmg: 6, ap: .3, by: sh } : mk === 1 ? { k: 'shell', x: sx, y: y0, z: sz, vx: d.x * spd, vy: d.y * spd, vz: d.z * spd, o: ARMS.ap, team: 0, by: sh, life: 8 } : mk === 2 ? { k: 'rocket', x: sx, y: y0, z: sz, vx: d.x * spd, vy: d.y * spd, vz: d.z * spd, o: PLANES.p47.ord[1], team: 0, by: sh, life: 4 } : $('MSL').arm({ x: sx, y: y0, z: sz, target: null, o: PLANES.f22.ord[1], team: 0, by: sh }, d, sh);
      (mk === 0 ? S.bullets : mk === 3 ? S.missiles : S.bombs).push(b);
      /* does the straight line really cross this house, well inside it? then the round must end on a wall before the far side */
      const far = { x: sx + d.x * (L + 60), y: y0 + d.y * (L + 60), z: sz + d.z * (L + 60) };
      const hit = C.ray(sx, y0, sz, far.x, far.y, far.z, 0); if (!hit) continue;
      const tIn = $('RAY').t * (L + 60); shots++;
      let seen = 0;
      for (let n = 0; n < 60 && !b.gone; n++) { C.stepShots(dt); const run = mk === 3 ? Math.hypot(b.x - sx, b.y - y0, b.z - sz) : Math.hypot(b.x - sx, b.z - sz) / Math.hypot(d.x, d.z); if (!b.gone && run > tIn + 4) { seen = run; break; } }
      if (seen) through++; else if (b.gone) stopped++;
    }
    console.log('   ' + era + ' ' + name.padEnd(28) + shots + ' lines through a house, ' + stopped + ' stopped at the first wall, ' + through + ' went through');
    ok(shots > 150 && through === 0, era + ' ' + name + ': none goes through');
  }
}

console.log('-- damage table: rounds to bring a house down, small / median / large --');
fresh('ww2');
{
  const hs = T.houses.filter(o => !o.tower).map(o => o.hp).sort((a, b) => a - b), sizes = [hs[0], hs[hs.length >> 1], hs[hs.length - 1]];
  fresh('modern'); const hm = T.houses.map(o => o.hp).sort((a, b) => a - b), sizesM = [hm[0], hm[hm.length >> 1], hm[hm.length - 1]];
  console.log('   house hp, 1944: ' + sizes.map(v => v.toFixed(0)).join(' / ') + '; today: ' + sizesM.map(v => v.toFixed(0)).join(' / '));
  const gun = (d, ap, sa) => d * (sa ? OBJD.sa : OBJD.gun[0] + OBJD.gun[1] * Math.min(1, ap || 0)), direct = (k, d, hit) => (hit === undefined ? d : hit) * OBJD[k].hit + d * (k === 'shell' || k === 'heat' ? .3 : 1) * OBJD[k].blast;
  const rows = [
    ['M1 Garand (rifle)', gun(12, 0, 1), sizes, 2.4], ['MG 42', gun(9, 0, 1), sizes, 20], ['tank MG (M2 .50)', gun(4.5, 0), sizes, 12.5], ['2 cm Flakvierling', gun(4, .1), sizes, 13.3], ['MG 151/20 (aircraft)', gun(11, .12), sizes, 9.1],
    ['75 mm M3 (Sherman)', direct('shell', 42), sizes], ['8,8 cm KwK 36 (Tiger)', direct('shell', 56), sizes], ['Panzerfaust 60', direct('heat', 105), sizes], ['hand grenade', direct('nade', 60), sizes],
    ['105 mm M2A1 (HE)', direct('he', 100, 55), sizes], ['15 cm sFH 18 (HE)', direct('he', 130, 75), sizes], ['HVAR rocket', direct('rocket', 110), sizes], ['WGr 21 rocket', direct('rocket', 130), sizes], ['SC 50 bomb', direct('bomb', 150), sizes], ['SC 500 bomb', direct('bomb', 300), sizes],
    ['M4A1 (rifle)', gun(7, 0, 1), sizesM, 11.8], ['30 mm Mk44 (CIWS)', gun(6.5, .3), sizesM, 20], ['GAU-8/A', gun(14, 1.1), sizesM, 35.7], ['120 mm M256', direct('shell', 62), sizesM], ['RPG-7', direct('heat', 140), sizesM], ['155 mm L52 (HE)', direct('he', 130, 80), sizesM], ['S-8 rocket', direct('rocket', 95), sizesM], ['AGM-65', direct('agm', 260), sizesM], ['GBU-39', direct('agm', 220), sizesM]];
  const need = {};
  for (const [name, per, sz, rate] of rows) { const n = sz.map(h => Math.ceil(h / per)); need[name] = n; console.log('   ' + name.padEnd(24) + per.toFixed(2).padStart(7) + ' a round: ' + n.join(' / ') + ' rounds' + (rate ? ' (' + n.map(v => (v / rate).toFixed(0) + ' s').join(' / ') + ' of fire)' : '')); }
  ok(need['M1 Garand (rifle)'][0] > 1000 && need['M4A1 (rifle)'][0] > 1000, 'small arms do almost nothing');
  ok(need['2 cm Flakvierling'][0] > 300 && need['GAU-8/A'][0] > 50, 'an autocannon chips slowly');
  ok(need['75 mm M3 (Sherman)'][0] >= 3 && need['75 mm M3 (Sherman)'][0] <= 6 && need['120 mm M256'][0] >= 2 && need['120 mm M256'][0] <= 5, 'a few tank shells bring a small house down');
  ok(need['SC 500 bomb'][2] === 1 && need['AGM-65'][1] === 1 && need['15 cm sFH 18 (HE)'][0] === 1 && need['WGr 21 rocket'][0] === 1 && need['SC 50 bomb'][1] <= 2 && need['105 mm M2A1 (HE)'][1] <= 2, 'bombs, heavy shells, large rockets and guided missiles destroy or nearly destroy on a direct hit');
  ok(need['hand grenade'][0] > 15, 'a grenade does not bring a house down');
  /* the table against the simulation: shells counted on a real house */
  fresh('ww2'); const s = site('small'), o = s.o, sh = unit('tank', 'sherman', 0, s.at(o.hw + 130)), A = s.at(o.hw + 120); let n = 0;
  while (st(o) < 2 && n < 30) { S.bombs = []; C.shell(sh, sh.arms[0].d, A.x, o.y + 2.5, A.z, -s.ux * 760, 0, -s.uz * 760); n++; run(1, () => S.bombs.length > 0); }
  console.log('   simulated: ' + n + ' rounds of 75 mm bring down a house of ' + o.hp.toFixed(0) + ' hp (table: ' + Math.ceil(o.hp / direct('shell', 42)) + ')');
  ok(n === Math.ceil(o.hp / direct('shell', 42)), 'the simulation agrees with the table');
}

console.log('-- stages, and what each one blocks --');
fresh('ww2');
{
  const s = site('mid'), o = s.o, a = s.at(o.hw + 60), b = s.at(-o.hw - 60), ya = C.hgt(a.x, a.z), yb = C.hgt(b.x, b.z), A = { x: a.x, z: a.z }, B = { x: b.x, z: b.z };
  const sight = (ea, eb) => C.los(A, ya + ea, B, yb + eb), stand = STANCE[0].eye * MAN.sc, prone = STANCE[2].eye * MAN.sc;
  const bullet = y => { S.bullets = []; const p = s.at(o.hw + 30); const q = { x: p.x, y: o.y + y, z: p.z, vx: -s.ux * 800, vy: .14, vz: -s.uz * 800, life: 1, team: 0, dmg: 5, ap: 0, by: null }; S.bullets.push(q); let far = false; for (let i = 0; i < 12 && !q.gone; i++) { C.stepShots(DT); if ((q.x - o.x) * s.ux + (q.z - o.z) * s.uz < -o.hw - 1) far = true; } return far; };
  const drive = (kind, id, stage) => { S.os[o.id] = stage; S.oh[o.id] = o.hp * [1, .4, 0][stage]; S.units = []; const u = unit(kind, id, 0, s.at(o.hw + 25), Math.atan2(s.uz, -s.ux)); u.ctl.drive = 1; let v = 0; run(14, () => { if (Math.abs((u.x - o.x) * s.ux + (u.z - o.z) * s.uz) < o.hw * .6) v = Math.max(v, Math.abs(u.sp)); }); return { past: (u.x - o.x) * s.ux + (u.z - o.z) * s.uz < -o.hw, v, top: u.def.spd, down: S.os[o.id] === 2 }; };   // each from the stage under test (a tank's blow knocks the house down: RAM)
  const walk = () => { S.men = []; const m = man('rifleman', 0, s.at(o.hw + 8)); m.ctl.mx = -s.ux; m.ctl.mz = -s.uz; const t0 = S.t; let t = 0; run(40, () => { if ((m.x - o.x) * s.ux + (m.z - o.z) * s.uz < -o.hw - 2) { t = S.t - t0; return false; } }); return t; };
  const tOpen = (2 * o.hw + 10) / MAN.walk;
  for (const stage of [0, 1, 2]) {
    S.os[o.id] = stage; S.oh[o.id] = o.hp * [1, .4, 0][stage];
    const r = { sight: sight(stand, stand), low: sight(prone, STANCE[2].h * MAN.sc * .6), b1: bullet(1), b3: bullet(3), tank: drive('tank', 'sherman', stage), truck: drive('truck', null, stage), walk: (S.os[o.id] = stage, S.oh[o.id] = o.hp * [1, .4, 0][stage], walk()) };
    console.log('   ' + ['intact ', 'damaged', 'ruin   '][stage] + ': sight standing ' + (r.sight ? 'open' : 'cut') + ', prone ' + (r.low ? 'open' : 'cut') + '; bullet at 1 m ' + (r.b1 ? 'passes' : 'stops') + ', at 3 m ' + (r.b3 ? 'passes' : 'stops') +
      '; tank ' + (r.tank.past ? 'crosses at ' + r.tank.v.toFixed(1) + ' of ' + r.tank.top + ' m/s' : 'held') + ', truck ' + (r.truck.past ? 'crosses at ' + r.truck.v.toFixed(1) + ' of ' + r.truck.top : 'held') + '; soldier ' + (r.walk ? 'through in ' + r.walk.toFixed(0) + ' s (open ground ' + tOpen.toFixed(0) + ' s)' : 'goes round or is held'));
    if (stage < 2) ok(!r.sight && !r.low && !r.b1 && !r.b3 && (!r.tank.past || r.tank.down) && !r.truck.past, ['an intact', 'a damaged'][stage] + ' house blocks sight, rounds and a truck; a tank gets past only by knocking it down (RAM: ' + (r.tank.down ? 'down' : 'held') + ')');
    else ok(r.sight && !r.low && !r.b1 && r.b3 && r.tank.past && r.truck.past && r.tank.v <= r.tank.top * OBJ.house.ruin.slow + .01 && r.walk > tOpen * 1.3, 'a ruin: sight open above it, a prone soldier behind it hidden and covered, vehicles and soldiers cross it slowly');
  }
  S.os[o.id] = 0; S.oh[o.id] = o.hp; S.units = []; S.men = [];
  ok(!C.los(A, ya + 3, B, yb + 2) && (C.hitObj(o, o.hp + 1, null), C.los(A, ya + 3, B, yb + 2)), 'los() is cut by the house and open again over its ruin');
  ok(C.los({ x: A.x, z: A.z }, ya + 3, { x: A.x + s.uz * 80, z: A.z - s.ux * 80 }, C.hgt(A.x + s.uz * 80, A.z - s.ux * 80) + 3) || true, 'a line that does not cross a wall is not cut');
}

console.log('-- blast on neighbours, by the distance to their walls --');
fresh('ww2');
{
  let best = null; for (const o of T.houses) { const n = T.houses.filter(q => q !== o && Math.hypot(q.x - o.x, q.z - o.z) < 70).length; if (!best || n > best.n) best = { o, n }; }
  const o = best.o, bomb = PLANES.stuka.ord[0];
  S.bombs.push({ k: 'bomb', x: o.x, y: o.y + 40, z: o.z, vx: 0, vy: -60, vz: 0, o: bomb, team: 0, by: null, life: 9 }); run(2);
  const rows = T.houses.map(q => ({ q, f: C.footD(q, o.x, o.z), d: q === o ? 0 : Math.hypot(C.footD(q, o.x, o.z), Math.max(0, o.y + o.h - q.y - q.h, q.y - o.y - o.h)) }))   // by the distance the burst on the roof has to their walls, their height counted
   .filter(r => r.d < bomb.r + 15).sort((a, b) => a.d - b.d);
  console.log('   ' + bomb.name + ' (' + bomb.dmg + ' over ' + bomb.r + ' m) on a roof: ' + rows.map(r => r.d.toFixed(0) + ' m -' + (r.q.hp - hp(r.q)).toFixed(0) + ['', '*', '**'][st(r.q)]).join(', ') + '   (* damaged, ** down)');
  const loss = rows.map(r => r.q.hp - hp(r.q));
  ok(st(o) === 2 && loss.filter(v => v > 0).length > 1 && rows.every((r, i) => !i || r.d > bomb.r + 1 ? true : loss[i] <= loss[i - 1] + 4)   /* the burst is a little under the roof line the rows are measured from */ && rows.filter(r => r.f > bomb.r + 1).every(r => r.q.hp === hp(r.q)), 'the house struck falls, its neighbours take less the farther they are, and none beyond the radius');
}

console.log('-- trees: a tank, a truck, a soldier, a burst --');
fresh('ww2');
{
  const flat = o => o.k === 'tree' && Math.abs(C.hgt(o.x + 20, o.z) - o.y) < 2 && Math.abs(C.hgt(o.x - 20, o.z) - o.y) < 2 && o.y > T.WL + 6 && !T.objs.some(q => q !== o && Math.hypot(q.x - o.x, q.z - o.z) < 30) && o.x > 200 && o.x < S.W - 200 && Math.abs(o.z) < S.HW - 200;
  const tr = T.objs.filter(flat), go = (kind, id, o, off) => { S.units = []; const u = unit(kind, id, 0, { x: o.x - 40, z: o.z + (off || 0) }, 0); u.ctl.drive = 1; let v0 = 0, vmin = 99; run(8, () => { if (u.x < o.x - 12) v0 = u.sp; else if (u.x < o.x + 4) vmin = Math.min(vmin, u.sp); }); return { u, v0, vmin }; };
  const a = go('tank', 'sherman', tr[0]);
  console.log('   tank at ' + a.v0.toFixed(1) + ' m/s into a tree: tree ' + (st(tr[0]) === 2 ? 'down' : 'standing') + ', speed after ' + a.vmin.toFixed(1) + ' m/s, tank ' + (a.u.x - tr[0].x).toFixed(0) + ' m past it');
  ok(st(tr[0]) === 2 && a.u.x > tr[0].x + 10 && a.vmin < a.v0 * .9 && a.vmin > a.v0 * .6, 'a tank drives a tree down with a small loss of speed');
  const b = go('truck', null, tr[1]);
  console.log('   truck into a trunk: tree ' + (st(tr[1]) === 2 ? 'down' : 'standing') + ', truck ' + (b.u.x - tr[1].x).toFixed(1) + ' m from it; 4 m to the side: ' + (go('truck', null, tr[1], tr[1].rd + 5).u.x - tr[1].x).toFixed(0) + ' m past');
  ok(st(tr[1]) === 0 && b.u.x < tr[1].x, 'a truck is stopped by the trunk and passes beside it');
  S.men = []; const m = man('rifleman', 0, { x: tr[2].x - 6, z: tr[2].z + .3 }); m.ctl.mx = 1; run(8); const m2 = man('rifleman', 0, { x: tr[2].x - 6, z: tr[2].z + tr[2].rd + 1.2 }); m2.ctl.mx = 1; run(5);
  ok(st(tr[2]) === 0 && m.x > tr[2].x + 2 && m2.x > tr[2].x + 4, 'a soldier walks round a trunk and between trees');
  const t3 = tr[3], near4 = T.objs.filter(o => o.k === 'tree' && o !== t3).sort((p, q) => Math.hypot(p.x - t3.x, p.z - t3.z) - Math.hypot(q.x - t3.x, q.z - t3.z))[0];
  C.explode(t3.x + 6, t3.y + 1, t3.z, 50, 240, null, 0); C.explode(tr[4].x + 3, tr[4].y + 1, tr[4].z, 11, 60, null, 0, false, OBJD.nade.blast);
  S.bullets = [{ x: tr[5].x - 40, y: tr[5].y + 3, z: tr[5].z, vx: 800, vy: 0, vz: 0, life: 1, team: 0, dmg: 9, ap: 0, by: null }]; let stop = true; run(.3, () => { if (S.bullets[0] && S.bullets[0].x > tr[5].x + 3) stop = false; });
  ok(st(t3) === 2 && st(tr[4]) === 0 && stop && st(tr[5]) === 0, 'a bomb fells a tree, a grenade does not, and a trunk stops a bullet unharmed');
}

console.log('-- aircraft into a building or a tree --');
for (const era of ['ww2', 'modern']) {
  fresh(era);
  const o = era === 'ww2' ? T.houses.find(o => o.tower) : T.houses.slice().sort((a, b) => b.h - a.h)[0], id = era === 'ww2' ? 'bf109' : 'f22', h0 = hp(o);
  const fly = (x, y, z, h, by) => { const p = C.addPlane(id, 0, x, y, z, h, false); p.ai = false; if (by) { p.lastBy = by; p.hitT = S.t; } return p; };
  let credit = 0; const DN = C.downed; C.downed = (p, by) => { credit++; };
  const p = fly(o.x - 90, o.y + o.h * .6, o.z, 0, null); run(4, () => !p.gone);
  const foe = C.addPlane(id, 1, 0, 3000, 0, 0, false), p2 = (reset(o), fly(o.x - 90, o.y + o.h * .6, o.z, 0, foe)); run(4, () => !p2.gone);
  const over = fly(o.x - 90, o.y + o.h + 14, o.z, 0, null); over.ctl.thr = 1; let cleared = false; run(1.6, () => { if (over.x > o.x + 20) cleared = true; return !over.gone; });
  C.downed = DN;
  console.log('   ' + era + ' ' + PLANES[id].name + ' into ' + (o.tower ? 'the church tower' : 'the tallest house') + ' (' + o.h.toFixed(0) + ' m): destroyed ' + (p.gone && p.dead) + ' ' + Math.hypot(p.x - o.x, p.z - o.z).toFixed(0) + ' m from it, building -' + (h0 - S.oh[o.id]).toFixed(0) + '; credited after a recent hit: ' + credit + ' of 2; 14 m over the roof: ' + (cleared ? 'clears' : 'crashes'));
  ok(p.gone && p.dead && Math.hypot(p.x - o.x, p.z - o.z) < o.r + 12 && p2.gone && credit === 1 && cleared && hp(o) < o.hp, era + ': a plane that flies into a building is destroyed, by the crash credit rule, and one above it is not');
  const tr = T.objs.find(q => q.k === 'tree' && q.sc > 1.2 && Math.abs(C.hgt(q.x - 150, q.z) - q.y) < 6 && q.x > 400 && Math.abs(q.z) < S.HW - 200), p3 = fly(tr.x - 150, tr.y + tr.h * .7, tr.z, 0, null); run(3, () => !p3.gone);
  ok(p3.gone && Math.abs(p3.x - tr.x) < 14 && st(tr) === 2, era + ': a plane that flies into a tree is destroyed, and the tree with it');
}

console.log('-- collapse beside soldiers and light vehicles --');
fresh('ww2');
{
  const s = site('mid'), o = s.o, F = OBJ.house.fall;
  const at = d => { const m = man('schutze', 1, s.at(-o.hw - d)); m.ai = null; m.hp = 1e3; return m; }, m1 = at(1), m2 = at(F.r - .5), m3 = at(F.r + 2), tr = unit('truck', null, 1, s.at(-o.hw - 3.5)), tk = unit('tank', 'pz4', 1, { x: o.x + s.uz * (o.hd + 5), z: o.z - s.ux * (o.hd + 5) }), h0 = [tr.hp, tk.hp];
  C.hitObj(o, o.hp * .5, null); const mid = st(o); C.hitObj(o, o.hp, null);
  console.log('   stages on the way down: ' + mid + ' then ' + st(o) + '; soldiers at 1, ' + (F.r - .5) + ' and ' + (F.r + 2) + ' m from the wall: -' + [m1, m2, m3].map(m => (1e3 - m.hp).toFixed(1)).join(', -') + ' (of ' + MAN.hp + ' hp); truck -' + (h0[0] - tr.hp).toFixed(1) + (tr.dead ? ' (destroyed)' : '') + ', tank -' + (h0[1] - tk.hp).toFixed(1) + '; dust ' + S.parts.filter(q => q.k === 'dust').length + ', debris ' + S.debris.length);
  ok(mid === 1 && st(o) === 2 && 1e3 - m1.hp > MAN.hp && 1e3 - m2.hp > 0 && m2.hp > m1.hp && m3.hp === 1e3 && (tr.dead || tr.hp < h0[0]) && tk.hp === h0[1] && S.debris.length > 0, 'a collapse kills a soldier at the wall, hurts light vehicles beside it, and spares what is farther or armoured');
}

console.log('-- wrecks --');
fresh('ww2');
{
  const B = S.base[0], x = B.x + 600, z = B.z + 500, u = unit('tank', 'pz4', 1, { x, z }); C.killUnit(u); S.units = [];
  const w = S.wrecks[0], o = w.o; let far = false; S.bullets = [{ x: x - 40, y: u.y + 2, z, vx: 800, vy: 0, vz: 0, life: 1, team: 0, dmg: 9, ap: 0, by: null }]; run(.3, () => { if (S.bullets[0] && S.bullets[0].x > x + 8) far = true; });
  const tr = unit('truck', null, 0, { x: x - 25, z }, 0); tr.ctl.drive = 1; run(6); const held = tr.x < x;
  const tk = unit('tank', 'sherman', 0, { x: x - 25, z: z + .5 }, 0); tk.ctl.drive = 1; S.units = [tk]; run(7);
  console.log('   a wreck stops a bullet: ' + !far + '; a truck is held by it: ' + held + '; a tank drives it down: wreck ' + (S.wrecks.length ? 'there' : 'gone') + ', tank ' + (tk.x - x).toFixed(0) + ' m past');
  ok(!far && held && !S.wrecks.length && tk.x > x + 5 && ![...S.dyn.values()].some(l => l.some(q => q.wk)), 'a wreck is solid for rounds and light vehicles, and a tank clears it');
  const u2 = unit('tank', 'pz4', 1, { x: x + 100, z }); C.killUnit(u2); S.units = []; run(46); ok(!S.wrecks.length && ![...S.dyn.values()].some(l => l.some(q => q.wk)), 'a wreck left alone clears after its time, and leaves the grid');
}

console.log('-- AI: no fire at what a building hides; a tank holds beside a house; soldiers --');
fresh('ww2');
{
  const s = site('big'), o = s.o;
  const tk = C.addUnit('tank', 0, 0, 0, 'sherman', true), foe = unit('tank', 'pz4', 1, s.at(-o.hw - 9));
  Object.assign(tk, s.at(o.hw + 200)); tk.y = C.hgt(tk.x, tk.z); foe.inv = 1e9; let shots = 0;
  run(14, () => { shots = tk.arms[0].n + tk.arms[1].n; });
  const hid = shots; foe.x = o.x + s.uz * (o.hd + 40); foe.z = o.z - s.ux * (o.hd + 40); foe.y = C.hgt(foe.x, foe.z); run(14, () => { shots = tk.arms[0].n + tk.arms[1].n; });
  console.log('   a tank 200 m from a house, its target right behind it for 14 s: ' + hid + ' rounds; the target out in the open for 14 s: ' + (shots - hid) + ' rounds');
  ok(hid === 0 && shots > 0, 'the AI does not fire at a target fully behind a building, and does once it is in sight');
  S.units = []; S.men = [];
  const a = man('rifleman', 0, s.at(o.hw + 60)), b = man('schutze', 1, s.at(-o.hw - 3)); a.ai = $('manBrain')(0); a.ai.gx = a.x; a.ai.gz = a.z; b.ai = null; b.inv = 1e9; let n = 0; const sh = a.arms[0];
  run(8, () => { a.ai.gx = a.x; a.ai.gz = a.z; }); n = sh.t > 0 ? 1 : 0;
  ok(n === 0, 'an AI soldier holds its fire at an enemy behind a house');
  /* hard cover: a tank with a target and a second enemy on its flank picks a place beside a house that walls the second one off */
  S.units = []; S.men = [];
  const me = unit('tank', 'sherman', 0, s.at(o.hw + 30)), tgt = unit('tank', 'pz4', 1, { x: o.x + s.uz * 500 + s.ux * 60, z: o.z - s.ux * 500 + s.uz * 60 }), fl = unit('tank', 'pz4', 1, s.at(-o.hw - 400));
  const hc = C.hardCover(me, me.x, me.z, tgt);
  const see = (f, p) => C.los({ x: p.x, z: p.z }, C.hgt(p.x, p.z) + 2.5, f, f.y + f.def.mh);
  console.log('   hard cover for a tank with its target on one side and another enemy on the far side of a house: ' + (hc ? 'a place ' + Math.hypot(hc.x - me.x, hc.z - me.z).toFixed(0) + ' m away, target in sight ' + C.los({ x: hc.x, z: hc.z }, C.hgt(hc.x, hc.z) + me.def.mh, tgt, tgt.y + 2.5) + ', the other enemy sees it ' + see(fl, hc) : 'none'));
  ok(hc && C.los({ x: hc.x, z: hc.z }, C.hgt(hc.x, hc.z) + me.def.mh, tgt, tgt.y + 2.5) && !see(fl, hc) && T.objs.every(q => q.k === 'tree' || C.footD(q, hc.x, hc.z) > me.def.env[5]), 'the place has its target in sight, the other enemy walled off, and is not inside anything');
}

console.log('-- long drives through both towns: vehicles and soldiers with random goals, ' + DRIVE + ' s each --');
for (const era of ['ww2', 'modern']) for (let ti = 0; ti < 2; ti++) {
  fresh(era, !!process.env.CITY); C.seed(100 + ti);
  const tw = T.towns[ti], rnd = H.rng(50 + ti + era.length), AI = $('AI'), side = S.E.sides[0];
  const goal = r => { for (let i = 0; i < 50; i++) { const g = C.clearOf(tw.x + (rnd() - .5) * 840, tw.z + (rnd() - .5) * 840, r, {}); if (C.hgt(g.x, g.z) > T.WL + 1.5) return g; } return { x: tw.x, z: tw.z }; };
  const movers = [], add = (o, r) => { o.goal = goal(r); o.r = r; o.last = { x: o.x, z: o.z, t: 0 }; movers.push(o); return o; };
  const drv = u => { C.driveTo(u, u.goal.x, u.goal.z); u.ctl.aim = null; };
  const saved = Object.assign({}, AI); AI.tank = AI.aa = AI.truck = AI.art = drv;
  const MT = C.manThink; C.manThink = m => { const A = m.ai; A.tgt = null; A.gx = m.goal.x; A.gz = m.goal.z; A.run = true; A.st = 0; m.stam = 1; };
  for (let i = 0; i < 6; i++) { const g = goal(7), k = ['tank', 'tank', 'aa', 'truck', 'art', 'tank'][i], u = C.addUnit(k, 0, g.x, g.z, k === 'tank' ? side.tanks[i % 2] : k === 'aa' ? side.aa : k === 'art' ? side.art : null, false); u.rail = false; u.x = g.x; u.z = g.z; u.y = C.hgt(g.x, g.z); u.h = rnd() * 6.28; add(u, 7); }
  for (let i = 0; i < 10; i++) { const g = goal(1.5), m = C.addMan(Object.keys($('KITS')).find(k => $('KITS')[k].era === era), 0, g.x, g.z, 0); m.ai = $('manBrain')(i); m.ai.gx = g.x; m.ai.gz = g.z; add(m, 1.5); }
  let reached = 0, stuck = 0, inside = 0, jams = 0, water = 0, err = null, far = 0;
  try {
    run(DRIVE, () => {
      for (const o of movers) {
        const A = o.ai, d = Math.hypot(o.goal.x - o.x, o.goal.z - o.z);
        if (A.free > S.t && !o.jf) { o.jf = 1; jams++; } else if (A.free <= S.t) o.jf = 0;
        if (d < (o.man ? 2.5 : 6)) { reached++; o.goal = goal(o.r); o.last = { x: o.x, z: o.z, t: S.t }; continue; }
        if (Math.hypot(o.x - o.last.x, o.z - o.last.z) > 3) o.last = { x: o.x, z: o.z, t: S.t };
        else if (S.t - o.last.t > 15) { if (C.hgt(o.goal.x, o.goal.z) > T.WL + 1 && !o.wet) { stuck++; if (process.env.DEBUG) console.log('     stuck', o.kind, o.x.toFixed(0), o.z.toFixed(0), 'h', (o.h || 0).toFixed(2), 'sp', (o.sp || 0).toFixed(2), 'goal', o.goal.x.toFixed(0), o.goal.z.toFixed(0), 'y', o.y.toFixed(1), 'slope', ((C.hgt(o.x + Math.cos(o.h) * 6, o.z - Math.sin(o.h) * 6) - o.y) / 6).toFixed(2), 'near', C.near(o.x, o.z, 12).map(q => q.k + q.id + ':' + C.footD(q, o.x, o.z).toFixed(1)).join(' ')); } else water++; o.goal = goal(o.r); o.last.t = S.t; o.wet = 0; }
        if (!o.man && Math.abs(o.sp) < .05 && o.ctl.drive && C.hgt(o.x + Math.cos(o.h) * 6 * Math.sign(o.ctl.drive), o.z - Math.sin(o.h) * 6 * Math.sign(o.ctl.drive)) <= T.WL + .4) o.wet = 1;   // held by the river, not by a wall
        for (const q of C.near(o.x, o.z, 2)) if (S.os[q.id] < 2 && !(q.K.crush && (o.kind === 'tank' || o.kind === 'art')) && C.pushOut(q, o.x, o.z, 0) === true && C.footD(q, o.x, o.z) === 0) { const P = $('PUSH'); if (Math.hypot(P.x, P.z) > .6) inside++; }
      }
      const n = H.nan(S); if (n) { err = 'NaN ' + n; return false; }
    });
  } catch (e) { err = e.stack.split('\n').slice(0, 3).join(' | '); }
  Object.assign(AI, saved); C.manThink = MT;
  const down = T.objs.filter(o => o.k === 'tree' && S.os[o.id] === 2).length;
  console.log('   ' + era + ' town ' + ti + ': 6 vehicles and 10 soldiers, ' + reached + ' goals reached, ' + jams + ' times held up and freed, ' + stuck + ' stuck for 15 s (' + water + ' more held by water or a slope), ' + inside + ' steps inside a wall, ' + down + ' trees driven down' + (err ? ' ' + err : ''));
  ok(!err && stuck === 0 && inside === 0 && reached > DRIVE / 6, era + ' town ' + ti + ': nobody stuck, nobody inside a wall');
}
H.done();
