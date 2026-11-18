'use strict';
/* third part of loadout.js: cluster and guided bombs, the two kinds of missile, rockets, extra rounds, the AI's choice */
const { c, $, LO, RACKS, STORES, PLANES, fly, hold, tank, flat } = require('./loadout'), { ok, done } = require('./harness');
const S = () => $('S'), TRIALS = +process.env.TRIALS || 5, GR = 9.81, hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z), slotOf = (p, key) => p.def.ord.findIndex(o => o.key === key);
const one = (id, key) => RACKS[id].g.map(g => (g[1][key] ? [key, STORES[key].k === 'rocket' ? Math.min(g[1][key], 40) : g[1][key]] : 0)).map((c, i, l) => (c && l.findIndex(x => x) === i ? c : 0));
/* level run at agl over the point (x0 + 2600, 0), the store let go so that a free fall ends dx m short of it and dz m beside it */
function run(id, key, setup, o) {
  o = o || {};
  const agl = o.agl || 420, x0 = 3000, p = fly(id, one(id, key), x0, 0, agl, o.V || PLANES[id].vmax * .6), T = { x: x0 + 2600, z: 0 }; T.y = c.hgt(T.x, T.z);
  const st = setup(T, p), i = slotOf(p, key), bursts = []; let out = false; const blast = c.explode; p.y = T.y + agl;
  c.explode = function (x, y, z, r, dmg) { bursts.push({ x, y, z, r, dmg }); return blast.apply(this, arguments); };
  c.run(40, () => {
    if (o.each) o.each(st, p);
    c.steer(p, o.dive && !out ? c.vnorm({ x: T.x - p.x, y: T.y - p.y, z: T.z - p.z }) : out && o.level ? c.vnorm({ x: p.f.x, y: 0, z: p.f.z }) : c.toward(p, T.x, T.z + (o.dz || 0), T.y + agl), 1); p.ctl.thr = .8;   // level: it flies on straight after the release, the laser pod under it on the target
    const vh = Math.hypot(p.v.x, p.v.z), h = p.y - 1.5 - T.y, vy = p.v.y - 2, tf = (vy + Math.sqrt(vy * vy + 2 * GR * h)) / GR;
    if (!out && (o.at ? T.x - p.x < o.at : T.x - p.x - vh * tf < (o.dx || 0))) { out = c.release(p, i); if (o.n) for (let n = o.n; --n > 0;) { p.ocool[i] = 0; c.release(p, i); } }
    return !(out && !S().bombs.length && !S().missiles.length);
  });
  c.explode = blast;
  return { p, T, st, bursts, out };
}
const men = (T, n, R, team) => { const l = []; for (let i = 0; i < n; i++) { const a = i * 2.4, r = R * Math.sqrt((i + .5) / n), m = c.addMan('redRifle', team, T.x + Math.cos(a) * r, T.z + Math.sin(a) * r, 0); m.ai = null; l.push(m); } return l; };
const mob = (T, p, era, R) => { const foe = 1 - p.team, k = era === 'ww2' ? ['rifleman', 'sherman'] : ['redRifle', 't72']; const l = []; for (let i = 0; i < 24; i++) { const a = i * 2.4, r = R * Math.sqrt((i + .5) / 24), m = c.addMan(p.team ? (era === 'ww2' ? 'schutze' : 'blueRifle') : k[0], foe, T.x + Math.cos(a) * r, T.z + Math.sin(a) * r, 0); m.ai = null; l.push(m); }
  const trucks = [[-30, 0], [0, 28], [30, -10], [5, -35]].map(([dx, dz]) => { const u = c.addUnit('truck', foe, T.x + dx, T.z + dz, null, true); u.ai = null; u.rail = false; u.cargo = null; return u; });
  return { men: l, trucks, tank: tank(S(), 'tank', p.team ? (era === 'ww2' ? 'tiger' : 'abrams') : k[1], foe, T.x + 12, T.z + 6) }; };

console.log('-- cluster bombs --');
for (const [id, key] of [['a10', 'cbu87'], ['su25', 'rbk500'], ['stuka', 'ab250']]) {
  const cl = STORES[key].cl, era = PLANES[id].era, rs = Array.from({ length: TRIALS }, () => run(id, key, (T, p) => mob(T, p, era, cl[3] * .8), {})), r = rs[0], avg = f => rs.reduce((a, r) => a + f(r), 0) / TRIALS;
  const dm = avg(r => r.st.men.filter(m => m.dead).length), dt = avg(r => r.st.trucks.filter(u => u.dead).length), hp = avg(r => Math.max(0, r.st.tank.hp)), sp = Math.max(...r.bursts.map(b => hd(b, r.T)));
  ok(r.out && r.bursts.length === cl[0], id + ' ' + STORES[key].name + ': opens ' + $('CLUSTER').h + ' m up into ' + r.bursts.length + ' bomblets (' + cl[1] + ' dmg, ' + cl[2] + ' m each) that fall within ' + sp.toFixed(0) + ' m');
  ok(dm >= 9 && dt >= 2 && rs.every(r => !r.st.tank.dead) && hp > r.st.tank.def.hp * .5, '  one bomb on a platoon in the open, mean of ' + TRIALS + ' drops: ' + dm.toFixed(1) + ' of 24 soldiers and ' + dt.toFixed(1) + ' of 4 trucks, and the ' + r.st.tank.def.name + ' in the middle keeps ' + Math.round(hp) + ' of ' + r.st.tank.def.hp + ' (never destroyed)');
  const u = run(id, id === 'stuka' ? 'sc250' : id === 'a10' ? 'mk82' : 'fab250', (T, p) => mob(T, p, era, cl[3] * .8), {});
  console.log('     the same run with one ' + u.p.def.ord[0].name + ': ' + u.st.men.filter(m => m.dead).length + ' soldiers, ' + u.st.trucks.filter(x => x.dead).length + ' trucks, tank ' + (u.st.tank.dead ? 'destroyed' : Math.round(u.st.tank.hp) + '/' + u.st.tank.def.hp));
}

console.log('-- guided bombs --');
for (const [id, key] of [['a10', 'gbu12'], ['f22', 'gbu32'], ['su25', 'kab500'], ['su57', 'kab500']]) {
  const foe = PLANES[id].side ? 'abrams' : 't72';
  const far = run(id, key, (T, p) => tank(S(), 'tank', foe, 1 - p.team, T.x, T.z + 220), { dx: 250, level: 1 });
  ok(far.out && far.bursts.length === 1 && hd(far.bursts[0], far.st) < 8 && far.st.dead && far.st.lastBy === far.p, id + ' ' + STORES[key].name + ': let go 250 m early and 220 m to the side of a locked tank, it lands ' + hd(far.bursts[0], far.st).toFixed(1) + ' m from it and destroys it');
  const dumb = run(id, id === 'a10' ? 'mk82' : id === 'f22' ? 'mk83' : id === 'su25' ? 'fab500' : 'fab250', (T, p) => tank(S(), 'tank', foe, 1 - p.team, T.x, T.z + 220), { dx: 250 });
  console.log('     a free-fall bomb from the same release lands ' + hd(dumb.bursts[0], dumb.st).toFixed(0) + ' m away');
}
{
  const mv = run('a10', 'gbu12', (T, p) => { const u = tank(S(), 'tank', 't72', 1, T.x, T.z); return u; }, { each: u => { if (!u.dead) { u.x += 9 / 60; u.z += 6 / 60; u.v = { x: 9, y: 0, z: 6 }; u.y = c.hgt(u.x, u.z); } }, level: 1 });
  ok(mv.st.dead, 'a tank driving off at 39 km/h is followed and hit (' + hd(mv.bursts[0], mv.st).toFixed(1) + ' m)');
  const pt = run('a10', 'gbu12', (T, p) => men(T, 12, 14, 1), { dive: 1, at: 800, agl: 1500 });
  ok(pt.bursts.length >= 1 && hd(pt.bursts[0], pt.T) < 25 && pt.st.filter(m => m.dead).length >= 8, 'with no vehicle to lock, it goes to the ground under the nose: let go 800 m out in a 30° dive at a squad, it lands ' + hd(pt.bursts[0], pt.T).toFixed(1) + ' m from it (' + pt.st.filter(m => m.dead).length + ' of 12 soldiers)');
  const p = fly('a10', one('a10', 'gbu12'), 3000, 0, 500, 120), u = tank(S(), 'tank', 't72', 1, 4800, 60); p.y = u.y + 500; c.run(.2, () => { c.steer(p, c.vnorm({ x: u.x - p.x, y: u.y - p.y, z: u.z - p.z }), 1); });
  ok(S().lockGnd === u && S().lockW.key === 'gbu12', 'the player\'s sight locks a vehicle for a guided bomb as it does for a missile (' + S().lockW.name + ')');
}

console.log('-- missiles for aircraft --');
{
  const shot = (id, key, rng, off) => {
    const p = fly(id, one(id, key), 4000, 0, 2000, 250), q = c.addPlane(PLANES[id].side ? 'f22' : 'su57', 1 - p.team, 4000 + Math.cos(off) * rng, p.y, Math.sin(off) * rng, 0, true, 'fighter');
    q.flares = 0; q.think = 1e9; const i = slotOf(p, key); S().input = {}; c.run(.1, () => { q.think = 1e9; c.steer(p, flat, 1); c.steer(q, flat, 1); });
    const lock = S().lockAir === q, M = $('MSL'), z = M.dlz(M.def(p.def.ord[i]), p, q); c.release(p, i); const m = S().missiles[0], tg = !!m && m.target === q;
    q.ai = false;   // from the launch the test flies it level in afterburner: an AI pilot would put the missile on its beam (MSL.aiDef) whatever its think
    c.run(14, () => { q.think = 1e9; q.flares = 0; c.steer(q, flat, 1); c.steer(p, flat, 1); return S().missiles.length > 0 && !q.dead; });
    return { lock, tg, hit: q.dead || q.hp < q.def.hp, ne: z.R < z.rne };
  };
  const rows = [['f22', 'aim120'], ['f22', 'aim9x'], ['a10', 'aim9'], ['su57', 'r77'], ['su57', 'r73']].map(([id, key]) => {
    const s = STORES[key], a = shot(id, key, 3000, .3), far = shot(id, key, 6000, .3), wide = shot(id, key, 3000, .65);
    return { key, s, a, far, wide };
  });
  const med = rows.filter(r => !r.s.sk), ir = rows.filter(r => r.s.sk);
  for (const r of med) r.near = shot(r.key === 'r77' ? 'su57' : 'f22', r.key, 2000, .3);   // 3 km behind a fighter in afterburner is outside their no-escape range (MSL.dlz rne); 2 km is inside it
  for (const r of med) console.log('   ' + r.s.name.padEnd(8) + ' 2 km, 17° off, inside its no-escape range: ' + (r.near.ne ? 'yes' : 'no') + ', ' + (r.near.lock && r.near.hit ? 'locks and hits' : 'no'));
  for (const r of rows) console.log('   ' + r.s.name.padEnd(8) + ' 3 km, 17° off: ' + (r.a.lock && r.a.hit ? 'locks and hits' : 'no') + ' | 6 km: ' + (r.far.lock ? (r.far.hit ? 'locks and hits' : 'locks, misses') : 'no lock') + ' | 3 km, 37° off: ' + (r.wide.lock ? (r.wide.hit ? 'locks and hits' : 'locks, misses') : 'no lock'));
  
  ok(rows.every(r => r.a.lock && r.a.tg) && med.every(r => r.near.ne && r.near.lock && r.near.tg && r.near.hit), 'every missile locks on a plane 3 km ahead, and the radar ones catch it though it runs in afterburner from 2 km, inside their no-escape range');
  ok(med.every(r => r.far.lock && !r.wide.lock) && ir.every(r => !r.far.lock && r.wide.lock === ($('MSL').SK[$('MSL').def(r.s).sk].hob > .65)), 'the radar ones lock at 6 km but only near the nose; no heat seeker locks that far, and only those that look far off the nose (R-73, AIM-9X) take a target 37° off');
}

console.log('-- rockets and extra rounds --');
for (const [id, key] of [['a10', 'hydra'], ['su25', 's8'], ['p47', 'hvar'], ['bf109', 'wgr21']]) {
  const p = fly(id, one(id, key), 2400, 0, 500, PLANES[id].vmax * .6), u = c.addUnit('truck', 1 - p.team, 4300, 0, null, true); u.ai = null; u.rail = false; p.y = u.y + 420;
  const i = slotOf(p, key), n0 = p.ord[i]; let fired = 0;
  c.run(12, () => { const d = Math.hypot(u.x - p.x, u.y - p.y, u.z - p.z), tt = d / (p.V + 450); c.steer(p, c.vnorm({ x: u.x - p.x, y: u.y + 2 + .125 * GR * tt * tt - p.y, z: u.z - p.z }), 1); if (d < 900 && fired < n0 && c.release(p, i)) fired++; return !u.dead && d > 250; });
  ok(u.dead && fired >= 1, id + ' ' + STORES[key].name + ': a truck is destroyed with ' + fired + ' of ' + n0 + ' from a dive');
}
for (const id of ['bf109', 'spit', 'p47']) {
  const lo = RACKS[id].sets['Superioridade aérea'], p = fly(id, lo, 3000, 0, 800), B = PLANES[id];
  ok(p.ammo > B.gun.ammo && p.def.ord.length === 0 && p.def.m < B.m && B.gun.ammo === PLANES[id].gun.ammo, id + ' Superioridade aérea: no stores, ' + p.ammo + ' rounds instead of ' + B.gun.ammo + ', ' + Math.round(B.m - p.def.m) + ' kg lighter');
  S().input = { ordA: true, ordB: true, smoke: true, fire: true }; let err = null; try { c.run(1); } catch (e) { err = e; }
  ok(!err && p.ammo < p.def.gun.ammo, '  B, V and G with nothing hung do nothing, and the gun fires');
  const b = S().base[p.team]; p.x = b.x; p.z = b.z; p.y = c.hgt(b.x, b.z) + 300; p.ammo = 5; S().input = {}; hold(p, flat, 4);
  ok(p.ammo === p.def.gun.ammo, '  and a rearm fills it to the larger load');
}

console.log('-- drag --');
{
  const cd = (id, lo, empty) => { const p = fly(id, lo, 3000, 0, 300); if (empty) p.ord = p.ord.map(() => 0); return p.def.cd0 / PLANES[id].cd0; };
  const a = cd('a10', LO.base('a10')), b = cd('a10', RACKS.a10.sets.Bombardeio), e = cd('a10', RACKS.a10.sets.Bombardeio, 1), f = cd('f22', RACKS.f22.sets.Bombardeio), g = cd('f22', RACKS.f22.sets.Bombardeio, 1);
  ok(Math.abs(a - 1) < 1e-9 && b > 1.01 && e < 1 && f === 1 && g === 1, 'zero-lift drag against the listed one: A-10 ×' + a.toFixed(3) + ' with the default load, ×' + b.toFixed(3) + ' with twelve bombs, ×' + e.toFixed(3) + ' clean; the F-22 carries inside: ×' + f.toFixed(3) + ' loaded and empty');
}

console.log('-- the AI\'s loadout --');
{
  const rows = [];
  for (const id in RACKS) {
    const R = RACKS[id], S0 = c.sandbox(PLANES[id].era), t = PLANES[id].side, name = lo => Object.keys(R.sets).find(k => LO.key(R.sets[k]) === LO.key(lo));
    const f = c.addPlane(id, t, 3000, 900, 0, 0, true, 'fighter'), tk = LO.ai(id, 'cas', t, 'tank'), so = LO.ai(id, 'cas', t, 'truck');
    for (let i = 0; i < 3; i++) tank(S0, 'tank', PLANES[id].era === 'ww2' ? (t ? 'tiger' : 'sherman') : (t ? 'abrams' : 't72'), 1 - t, 6000 + i * 30, 0);
    const a = c.addPlane(id, t, 3000, 900, 200, 0, true, 'cas'); S0.units = [];
    for (let i = 0; i < 4; i++) { const u = c.addUnit('truck', 1 - t, 6000 + i * 30, 0, null, true); u.ai = null; }
    const b = c.addPlane(id, t, 3000, 900, 400, 0, true, 'cas');
    rows.push({ id, f: name(f.def.lo), tk: name(tk), so: name(so), a: name(a.def.lo), b: name(b.def.lo), fa: f.def.ord[1] ? f.def.ord[1].k : f.def.ord.length ? f.def.ord[0].k : 'gun', okf: name(f.def.lo) === R.ai.fighter, oka: name(a.def.lo) === R.ai.tank && name(b.def.lo) === R.ai.soft && name(tk) === R.ai.tank && name(so) === R.ai.soft, wi: a.def.ord.some(o => o.k !== 'aam') && b.def.ord.some(o => o.k !== 'aam') });
  }
  for (const r of rows) console.log('   ' + r.id.padEnd(6) + ' caça: ' + r.f + ' | ataque contra tanques: ' + r.a + ' | contra o resto: ' + r.b);
  ok(rows.every(r => r.okf && r.oka && r.wi), 'each AI plane takes its table\'s set for its role, and an attack plane the one for what the enemy has most of on the ground, or for the kind named');
  const S0 = c.sandbox('modern'), Net = $('Net'); S0.net = true; Net.lo = false;
  const q = c.addPlane('a10', 0, 3000, 900, 0, 0, true, 'cas'); Net.lo = true; S0.net = false;
  ok(LO.key(q.def.lo) === LO.key(LO.base('a10')), 'online with a server that knows no loadouts the AI flies the default load too');
}
done();
