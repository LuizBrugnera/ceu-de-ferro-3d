'use strict';
/* Supply bases: where one may stand, building, limits, what a finished one does, what destroys it, and what the AI does with them */
const H = require('./harness'), ok = H.ok;
let C = H.load({ seed: 77 }), $ = C.$, S, BLD = $('BLD'), hd = $('hdist');
const fresh = era => { S = C.sandbox(era || 'ww2'); S.over = false; S.demo = true; C.demoKeepAlive = () => {}; C.plan = () => {}; return S; };
/* a clear, flat place beside road ri, off m from it */
const spot = (ri, s, off) => { const r = S.T.routes[ri]; for (let k = 0; k < 400; k++) { const p = $('routeAt')(r, s + k * 25), x = p.x - p.dz * off, z = p.z + p.dx * off; if (!C.siteWhy(0, x, z, 0)) return { x, z }; } throw new Error('no clear place'); };
const man = (t, x, z, kit) => { const m = C.addMan(kit || (t ? 'rifleman' : 'schutze'), t, x, z, 0); return m; };
const site = (t, p, prog) => { const b = C.startSite(t, p.x, p.z, 0); if (prog) C.supAt(b, prog); return b; };
const mid = () => S.T.routes[0].len / 2;

console.log('-- where a base may stand --');
fresh(); {
  const T = S.T, r = T.routes[0], p = spot(0, mid() + 1500, 60), why = (x, z) => C.siteWhy(0, x, z, 0) || 'ok', road = $('routeAt')(r, mid() + 1500);
  let water = null, steep = null; for (let x = 200; x < S.W - 200 && !(water && steep); x += 37) for (let z = -S.HW + 200; z < S.HW - 200; z += 41) { const w = C.siteWhy(0, x, z, 0); if (w === 'water' && !water) water = { x, z }; if (w === 'steep' && !steep) steep = { x, z }; }
  const house = T.houses[3], tree = T.objs.find(o => o.k === 'tree');
  ok(why(p.x, p.z) === 'ok', 'a clear, flat place 60 m beside the road: allowed');
  ok(why(-50, 0) === 'map' && why(S.W / 2, S.HW - 10) === 'map', 'outside the map: refused (map)');
  ok(water && steep, 'in water: refused (water); on a slope steeper than ' + BLD.slope + ': refused (steep)');
  ok(why(road.x, road.z) === 'road' && why(road.x - road.dz * 20, road.z + road.dx * 20) === 'road', 'on the road and 20 m from its middle: refused (road, table ' + BLD.road + ' m from the walls)');
  ok(why(house.x + (house.hw + 5) * house.c, house.z - (house.hw + 5) * house.s) === 'obj' && why(house.x, house.z) === 'obj', 'inside a house and 5 m from its wall: refused (obj)');
  ok(why(tree.x + 4, tree.z) === 'obj', 'touching a tree: refused (obj)');
  const b = site(0, p); ok(b && C.siteWhy(0, p.x + 100, p.z, 0) === 'base' && C.siteWhy(1, p.x + 100, p.z, 0) === 'base' && why(S.base[0].x + 900, S.base[0].z + 600) === 'base', 'within ' + BLD.apart + ' m of another base of either side, or ' + BLD.main + ' m of an airfield: refused (base)');
  const q = spot(0, mid() + 2400, 60), e = man(1, q.x + BLD.foe - 20, q.z); ok(why(q.x, q.z) === 'foe', 'an enemy ' + (BLD.foe - 20) + ' m away: refused (foe, table ' + BLD.foe + ' m)'); e.dead = true;
  ok(why(q.x, q.z) === 'ok', 'the same place with the enemy gone: allowed');
  const x4 = spot(0, mid() + 4200, 60); site(0, q); site(0, spot(0, mid() + 3300, 60));
  ok(S.sup.filter(b => b.team === 0).length === BLD.cap && why(x4.x, x4.z) === 'cap' && !C.siteWhy(1, x4.x, x4.z, 0) && C.startSite(0, x4.x, x4.z, 0) === null, 'a side with ' + BLD.cap + ' bases and sites: refused (cap); the other side may still build there');
}

console.log('-- building --');
const timeTo = (n, T) => { fresh(); const p = spot(0, mid() + 1500, 60), b = site(0, p); for (let i = 0; i < n; i++) man(0, p.x + (i % 2 ? 7.5 : -7.5), p.z + (i >> 1) * 2 - 3); let t = null; C.run(T || 100, () => { if (b.prog >= 1) t = S.t; return t === null; }); return { t, b, p }; };
{ const a = timeTo(1), c = timeTo(3), e = timeTo(8), f = n => BLD.time * .98 / (1 + BLD.help * (Math.min(n, BLD.max) - 1));
  ok(Math.abs(a.t - f(1)) < 1.5 && Math.abs(c.t - f(3)) < 1.5 && Math.abs(e.t - f(8)) < 1.5, 'one soldier ' + a.t.toFixed(0) + ' s, three ' + c.t.toFixed(0) + ' s, eight ' + e.t.toFixed(0) + ' s (table: ' + BLD.time + ' s, each helper +' + BLD.help + ', at most ' + BLD.max + ' builders)');
  ok(a.b.o.h === BLD.size[2] && S.os[e.b.id] === 0 && e.b.prog === 1, 'finished, it stands full height');
  fresh(); const p = spot(0, mid() + 1500, 60), b = site(0, p), m = man(0, p.x + 7.5, p.z); C.run(10); const p1 = b.prog;
  m.hitT = S.t; C.run(BLD.hurt - .5); const p2 = b.prog; C.run(3); const p3 = b.prog;
  ok(p1 > .1 && p2 === p1 && p3 > p2, 'a hit on the builder stops the work for ' + BLD.hurt + ' s (' + (p1 * 100).toFixed(0) + '% held, then on to ' + (p3 * 100).toFixed(0) + '%)');
  m.ctl.mx = 1; C.run(1.5); const p4 = b.prog; C.run(2); ok(b.prog === p4, 'walking away, nothing more is built'); m.ctl.mx = 0;
  const far = man(0, p.x + 40, p.z); C.run(5); ok(b.prog === p4, 'a soldier 40 m away does not build');
  far.x = p.x - 7.5; far.z = p.z; C.run(5); ok(b.prog > p4, 'another soldier of the side takes the site up again (' + (b.prog * 100).toFixed(0) + '%)');
  const foe = man(1, p.x, p.z + 6); far.dead = true; const p5 = b.prog; C.run(5); ok(b.prog === p5, 'an enemy soldier beside it builds nothing'); foe.dead = true;
  C.run(BLD.decay[0] - 5.5); const p6 = b.prog; C.run(20); const p7 = b.prog; let gone = null; C.run(200, () => { if (gone === null && !S.sup.length) gone = S.t; return gone === null; });
  ok(p6 === p5 && Math.abs((p6 - p7) - 19.5 * BLD.decay[1]) < .02 && gone !== null && !S.wob[b.id - S.T.nid], 'abandoned, it holds for ' + BLD.decay[0] + ' s, then loses ' + (BLD.decay[1] * 100).toFixed(1) + '% a second and is gone (' + (p5 * 100).toFixed(0) + '% lasted ' + (gone - 0).toFixed(0) + ' s in all)');
}

console.log('-- the player builds: the kit, the outline, the cap --');
{ C = H.load({ seed: 78 }); $ = C.$; S = C.newState('ww2', 'schutze', { cls: 'inf', mouse: true }); C.plan = () => {}; C.director = () => {}; S.men = S.men.filter(m => m === S.my); S.squads = []; S.sup = [];
  const P = S.my, I = S.input, p = spot(1, S.T.routes[1].len - 2600, 70), tap = k => { I[k] = true; C.run(.05); I[k] = false; C.run(.05); };
  P.x = p.x - 11; P.z = p.z; P.inv = 1e9; S.aim.h = 0; S.aim.p = -.25; C.run(.1);
  tap('build'); ok(S.bm && S.bm.why === '' && Math.abs(S.bm.x - p.x) < 4, 'N opens the outline ' + Math.round(hd(S.bm, P)) + ' m ahead, valid (green)');
  S.aim.h = Math.PI; C.run(.1); const rd = $('railOf')(P.x, P.z); S.aim.h = 0;
  tap('fire'); const b = S.sup[0]; ok(b && b.team === 0 && !S.bm && P.kit === 0 && P.arms[0].mag === P.arms[0].d.mag, 'the click starts the site, takes the kit (left ' + P.kit + ') and fires no round');
  C.run(BLD.time + 3); ok(b.prog >= 1, 'standing by it, the player finishes it alone in ' + BLD.time + ' s');
  tap('build'); ok(S.bm && S.bm.why !== '', 'a second one at once: refused (' + S.bm.why + ')'); tap('build'); ok(!S.bm, 'N again closes the outline');
  P.arms[0].res = 0; P.hp = 5; P.nades = 0; C.run($('MAN').fill + .5);
  ok(P.kit === BLD.kit && P.chg === BLD.charge.n && P.hp === P.max && P.arms[0].res === P.arms[0].d.mags && S.dep === 2, 'inside its ' + BLD.r + ' m the soldier gets the kit back, with health, magazines and grenades, in ' + $('MAN').fill + ' s');
  P.x = b.x + BLD.r + 15; P.arms[0].res = 0; P.kit = 0; C.run(5); ok(P.arms[0].res === 0 && P.kit === 0 && S.dep === 0, (BLD.r + 15) + ' m from it: nothing');
  P.x = S.base[0].x + 600; P.z = S.base[0].z + 600; C.run($('MAN').fill + .5); ok(P.kit === BLD.kit && S.dep === 1, 'at the main base the kit comes back too');
}

console.log('-- a finished base serves each ground class, inside its radius only --');
for (const era of ['ww2', 'modern']) for (const [cls, model] of [['tank', 0], ['aa', 0], ['art', 0]]) {
  C = H.load({ seed: 79 }); $ = C.$; const sd = $('ERAS')[era].sides[0], id = cls === 'tank' ? sd.tanks[0] : sd[cls];
  S = C.newState(era, id, { cls, mouse: true }); C.plan = () => {}; C.director = () => {}; S.men = []; S.squads = []; S.units = S.units.filter(u => u === S.my);
  const P = S.my, p = spot(1, S.T.routes[1].len - 3000, 70), b = site(0, p, 1), hurtIt = () => { P.hp = P.max * .4; P.parts[1].hp = 0; C.refit(P); P.arms[0].ammo = 1; P.smk = 0; };
  P.inv = 0; P.x = p.x + BLD.r + 20; P.z = p.z; hurtIt(); C.run(4); const out = P.hp < P.max * .5 && P.arms[0].ammo === 1 && S.dep === 0;
  P.x = p.x + BLD.r - 15; C.run(.5); const mark = S.rearm > 0 && S.dep === 2; C.run(8);
  ok(out && mark && P.hp === P.max && !P.mod.hurt && P.arms[0].ammo === P.arms[0].d.ammo && P.smk === ($('SMOKE').n[cls] || 0), era + ' ' + cls + ' ' + id + ': nothing ' + (BLD.r + 20) + ' m out; ' + (BLD.r - 15) + ' m from it, hull, parts, ammunition and smoke are whole again');
}
{ fresh(); const p = spot(0, mid() + 1500, 60), b = site(0, p, 1), rp = $('railOf')(p.x, p.z), u = C.addUnit('tank', 0, 0, 0, 'tiger', false, 0, rp.s + 700, 5, 0), far = C.addUnit('tank', 0, 0, 0, 'tiger', false, 0, rp.s + BLD.ai.fall + 600, -5, 1);
  u.hp = far.hp = 40; const s0 = u.s; let tIn = null; C.run(200, () => { if (tIn === null && hd(u, b) < BLD.r) tIn = S.t; return u.hp < u.max; });
  ok(tIn !== null && u.hp === u.max && far.hp === 40, 'an AI tank at 40 of ' + u.max + ' hp, 700 m up the road with nothing to fight, drove back into the radius in ' + (tIn || 0).toFixed(0) + ' s and was whole at ' + S.t.toFixed(0) + ' s; one ' + (BLD.ai.fall + 600) + ' m away stayed (table: ' + BLD.ai.fall + ' m)'); }

console.log('-- entering at a base --');
{ C = H.load({ seed: 80 }); $ = C.$; S = C.newState('ww2', 'tiger', { cls: 'tank', mouse: true }); C.plan = () => {}; C.director = () => {}; S.men = []; S.squads = []; S.units = S.units.filter(u => u === S.my || u.fixed);
  const r1 = S.T.routes[1], rf = S.T.routes[$('frontR')()], main = $('routeAt')(rf, rf.len - $('SPAWN').tank), p = spot(1, r1.len - 3600, 70), b = site(0, p, 1), again = () => { C.killUnit(S.my); S.my.gone = true; C.playerDown(null); S.cd = {}; C.run(4.5); return S.my; };
  ok(hd(S.my, main) < 60 && S.my.inv > 0, 'the default is the main base: ' + Math.round(hd(S.my, S.base[0])) + ' m from the airfield, ' + Math.round(hd(S.my, main)) + ' m beside the road out, protected for ' + Math.ceil(S.my.inv) + ' s');
  S.spawnAt = b.id; let P = again(); ok(hd(P, b) < BLD.spawn + 8 && P.inv > 0 && !C.pushOut(b.o, P.x, P.z, 3), 'with the base chosen, the next tank enters ' + Math.round(hd(P, b)) + ' m from it, clear of its walls');
  const e = man(1, b.x + BLD.safe - 30, b.z); ok($('spawnWhy')(b, 0) === 'unsafe', 'an enemy ' + (BLD.safe - 30) + ' m from it: not offered (unsafe)'); P = again(); ok(hd(P, main) < 60 && S.spawnAt === 0, 'and the player enters at the main base instead');
  e.dead = true; S.spawnAt = b.id; C.killUnit(S.my); S.my.gone = true; C.playerDown(null); S.cd = {}; C.run(1); C.hitObj(b.o, 999, null); C.run(4); ok(b.dead && hd(S.my, main) < 60, 'the chosen base destroyed during the wait: the main base');
  const s2 = site(0, spot(1, r1.len - 4400, 70), .5); ok($('spawnWhy')(s2, 0) === 'site' && $('spawnWhy')(s2, 1) === 'foe', 'an unfinished site, or the other side\'s base, is no entry');
  S.cls = 'plane'; S.model = 'bf109'; S.spawnAt = s2.id; C.supAt(s2, 1); P = again(); ok(!P.kind && hd(P, S.base[0]) < 1500, 'a plane takes off by its airfield whatever is chosen'); }

console.log('-- what destroys it: rounds for a finished base (' + $('OBJ').supply.hp[0] + ' hp) --');
{ C = H.load({ seed: 81 }); $ = C.$; const HP = $('OBJ').supply.hp[0], TK = $('TANKS'), AR = $('ARTS'), PL = $('PLANES'), SA = $('SARMS'), MAN = $('MAN'), out = [];
  const tryW = (name, fire, max, era) => { S = C.sandbox(era || 'ww2'); S.over = false; S.demo = true; C.demoKeepAlive = () => {}; C.plan = () => {}; const p = spot(0, mid() + 1500, 80), b = site(0, p, 1); let n = 0;
    while (!b.dead && n < max) { fire(b, n++); C.run(name === 'AGM-65' ? 3 : .9); } C.run(3); out.push(name + ' ' + (b.dead ? n : 'more than ' + max + ' (' + Math.round(HP - S.oh[b.id]) + ' hp done)')); return b.dead ? n : Infinity; };
  const flat = (k, o, spd) => b => { const D = k === 'shell' ? 150 : 40, l = Math.hypot(D, D * .2); S.bombs.push({ k, x: b.x - D, y: b.y + 1.5 + D * .2, z: b.z, vx: spd * D / l, vy: -spd * D * .2 / l, vz: 0, o, team: 1, by: null, life: 8 }); };
  const drop = (k, o, off) => b => S.bombs.push({ k, x: b.x + off, y: b.y + 30, z: b.z, vx: 0, vy: -40, vz: 0, o, team: 1, by: null, life: 9, t: 0, T: 9, px: b.x, py: b.y, pz: b.z });
  const gun = (dmg, ap, sa) => b => S.bullets.push({ x: b.x - 60, y: b.y + 13.5, z: b.z, vx: 784, vy: -157, vz: 0, life: 1, team: 1, dmg, ap, sa, by: null });
  const n = {
    rifle: tryW('rifle', gun(SA.k98.dmg, 0, 1), 400), mg: tryW('tank machine gun', gun(4.5, 0), 400), gau: tryW('30 mm GAU-8', gun(PL.a10.gun.dmg, PL.a10.gun.ap), 600, 'modern'),
    nade: tryW('hand grenade', drop('nade', MAN.nade, 6), 30), heat: tryW('Panzerfaust', flat('heat', SA.pzf, 60), 30), rpg: tryW('RPG-7', flat('heat', SA.rpg, 140), 30, 'modern'),
    ap44: tryW('75 mm AP (Sherman)', flat('shell', TK.sherman.arms[0], 600), 40), ap: tryW('120 mm (Abrams)', flat('shell', TK.abrams.arms[0], 1500), 40, 'modern'),
    he44: tryW('howitzer', drop('he', AR.priest.arms[0], 0), 20), he: tryW('155 mm howitzer', drop('he', AR.pzh.arms[0], 0), 20, 'modern'), near: tryW('155 mm, 20 m off', drop('he', AR.pzh.arms[0], 20), 20, 'modern'),
    rkt: tryW('HVAR rocket', drop('rocket', PL.p47.ord[1], 4), 20), bomb: tryW('SC 250 bomb, 15 m off', drop('bomb', PL.bf109.ord[0], 15), 10), big: tryW('500 lb bomb', drop('bomb', PL.p47.ord[0], 0), 10),
    agm: tryW('AGM-65', b => { const a = C.addPlane('a10', 1, b.x - 700, b.y + 200, b.z, 0, false); S.missiles.push($('MSL').arm({ x: a.x, y: a.y - 2, z: a.z, gnd: true, target: b, o: PL.a10.ord[0], team: 1, by: a }, C.vnorm({ x: 700, y: -200, z: 0 }), a)); a.gone = true; S.planes = S.planes.filter(p => p !== a); }, 6, 'modern'),
    chg: tryW('demolition charge', b => { const m = man(1, b.x + 7, b.z); m.chg = 1; C.plant(m, b); C.run(BLD.charge.fuse); m.dead = true; }, 6) };
  console.log('   ' + out.join('; '));
  ok(n.rifle === Infinity && n.mg === Infinity && n.nade > 20, 'small arms and hand grenades barely matter');
  ok(n.ap44 >= 4 && n.ap44 <= 12 && n.ap >= 3 && n.ap <= 9 && n.he44 <= 3 && n.he <= 2 && n.big === 1 && n.bomb <= 2 && n.agm <= 2 && n.rkt <= 6 && n.heat >= 4 && n.gau < 400, 'shells, bombs, artillery, rockets and missiles do');
  ok(n.chg === 2, 'two demolition charges (' + BLD.charge.dmg + ' each)');
  S = C.sandbox('ww2'); S.over = false; const p = spot(0, mid() + 1500, 80), b = site(0, p, 1), near = man(0, b.x + 9, b.z), far = man(0, b.x + 40, b.z), foe = man(1, b.x - 9, b.z), tk = C.addVehicle('truck', null, 0, b.x, b.z + 12, 0);
  C.hitObj(b.o, 130, null); const st1 = S.os[b.id]; C.hitObj(b.o, 200, null); C.run(.2);
  ok(st1 === 1 && b.dead && !S.wob[b.id - S.T.nid] && near.hp < near.max && foe.hp < foe.max && far.hp === far.max && tk.hp < tk.max, 'damaged under ' + Math.round(100 * $('OBJS').hurt) + '% of its hp; destroyed, its ammunition hurts whoever stands within ' + BLD.boom[0] + ' m, of either side (soldier ' + near.hp.toFixed(0) + ' of ' + near.max + ', truck ' + tk.hp.toFixed(0) + ' of ' + tk.max + ')');
  C.run(1); ok(!C.siteWhy(0, p.x, p.z + 40, 0) || C.siteWhy(0, p.x, p.z + 40, 0) !== 'cap', 'and the place in the cap is free again');
  const s2 = site(0, spot(0, mid() + 2500, 80), .3); C.hitObj(s2.o, HP / BLD.soft + 1, null); ok(s2.dead, 'an unfinished site takes ' + BLD.soft + ' times the damage'); }

console.log('-- the AI builds, guards, rebuilds and falls back --');
for (const era of ['ww2', 'modern']) for (const mode of ['solo', 'online']) {
  C = H.load({ seed: 82 }); $ = C.$; const E = $('ERAS')[era];
  $('FREE').road = 0; $('CMD').doc.balanced.bait = 0;   // the commander leaves the patrols to their beat: one of them is followed below
  if (mode === 'solo') S = C.newState(era, E.sides[0].fighter, { cls: 'plane' }); else { S = C.newState(era, E.sides[0].fighter, { net: true, host: true }); const N = $('Net'); N.inf = N.wo = N.sb = true; N.id = 1; S.humans = [1, 1]; }
  const first = [null, null], park = () => { const P = S.my; P.inv = 9; P.dead = false; P.y = 3000; P.v.y = 0; S.lives = 9; S.base[0].hp = 300; };
  C.run(150, () => { park(); for (const b of S.sup) if (b.prog >= 1 && first[b.team] === null) first[b.team] = S.t; });
  const L = S.T.routes.map(r => r.len), desc = b => 'side ' + b.team + ' road ' + b.ri + ' ' + Math.round(b.team ? b.s : L[b.ri] - b.s) + ' m from its main base, ' + Math.round(Math.abs(b.s - $('lineS')(b.team, b.ri))) + ' m behind its line, ' + Math.round($('routeDist')(S.T, b.x, b.z)) + ' m off the road' + (b.prog < 1 ? ' (' + Math.round(b.prog * 100) + '%)' : '');
  ok(first[0] !== null && first[0] < 90 && first[1] !== null && first[1] < 90 && S.sup.every(b => ((b.s - $('lineS')(b.team, b.ri)) * (b.team ? 1 : -1)) < 0), era + ' ' + mode + ': each side has its first base at ' + first.map(t => t === null ? 'never' : t.toFixed(0) + ' s').join(' and ') + ', behind its own line');
  for (const b of S.sup) console.log('   ' + desc(b));
  const g = S.squads.filter(q => q.ord && q.ord.b && q.ord.b.prog >= 1 && q.ord.k === 'hold'), fin = S.sup.filter(b => b.prog >= 1); ok([0, 1].every(t => g.some(q => q.team === t && q.men.some(m => !m.dead && hd(m, q.ord.b) < 40))), 'each side has a squad on guard at a base of its (' + fin.filter(b => !g.some(q => q.ord.b === b)).length + ' of ' + fin.length + ' bases have no squad free for it yet): ' + g.map(q => q.job + ' of side ' + q.team + ' ' + Math.round(hd(q.men.find(m => !m.dead) || q.ord.b, q.ord.b)) + ' m from it').join(', '));
  if (mode === 'solo' && era === 'ww2') {
    const b = S.sup.find(b => b.team === 0 && b.prog >= 1), n0 = S.sup.filter(x => x.team === 0 && !x.dead).length; C.hitObj(b.o, 999, null); let tN = null, nb = null;
    const calm = () => { S.waveTimer = 99; for (const p of S.planes) if (p.team === 1) p.gone = true; for (const u of S.units) if (u.team === 1 && !u.fixed) { u.cargo = null; u.dead = u.gone = true; } for (const m of S.men) if (m.team === 1 && !m.dead && hd(m, b) < 1500) { m.dead = true; m.deadT = S.t; } };
    C.run(700, () => { park(); calm(); nb = S.sup.find(x => x.team === 0 && !x.dead && x !== b && x.ri === b.ri); if (nb && tN === null) tN = S.t - b.deadT; return !(nb && nb.prog >= 1); });
    ok(nb && nb.prog >= 1 && tN >= BLD.ai.again - 5, 'a base lost: a new site ' + (tN || 0).toFixed(0) + ' s later (table: ' + BLD.ai.again + ' s), finished ' + (S.t - b.deadT).toFixed(0) + ' s after the loss, ' + (nb ? Math.round(hd(nb, b)) : '?') + ' m from the old one');
    const q = S.squads.filter(q => q.team === 0 && q.ri === nb.ri && !q.state && !q.op && !q.ord.b && q.ord.k !== 'build' && q.job !== 'rec' && q.job !== 'lp' && Math.abs(q.s - nb.s) < BLD.ai.fall - 300).sort((x, y) => (x.job === 'road' ? 0 : 1) - (y.job === 'road' ? 0 : 1))[0]; for (const m of q.men) { m.arms[0].res = 0; m.arms[0].mag = 1; }
    const O = q.ord; let went = false, back = false; C.run(400, () => { park(); calm(); if (q.ord.k === 'supply') went = true; else if (went) back = true; return !back; });
    ok(went && back && q.ord === O && q.men.every(m => m.dead || m.arms[0].res >= m.arms[0].d.mags - 1), 'a ' + q.job + ' squad out of magazines fell back to the base and went back to its order resupplied (' + S.t.toFixed(0) + ' s)'); }
}

console.log('-- the enemy AI and a base it has spotted --');
{ fresh(); const HP0 = $('OBJ').supply.hp[0], p = spot(0, mid() + 1500, 80), b = site(0, p, 1), rp = $('railOf')(p.x, p.z);
  const tk = C.addUnit('tank', 1, 0, 0, 'sherman', false, 0, rp.s - 700, 5, 0); let seen = null; C.run(150, () => { if (seen === null && $('spotted')(b)) seen = S.t; return !b.dead; });
  ok(seen !== null && b.dead, 'a tank with no vehicle to fight spots the base (' + (seen || 0).toFixed(1) + ' s) and shells it: destroyed at ' + S.t.toFixed(0) + ' s with ' + tk.arms[0].n + ' rounds');
  fresh(); const b2 = site(0, spot(0, mid() + 1500, 80), 1), t2 = C.addUnit('tank', 1, 0, 0, 'sherman', false, 0, $('railOf')(b2.x, b2.z).s - 700, 5, 0), foe = C.addVehicle('tank', 'pz4', 0, b2.x + 60, b2.z + 60, 0); foe.inv = 1e9; C.run(8);
  ok(t2.ai.tgt === foe, 'with an enemy tank beside the base, the tank is its target, not the base');
  fresh(); const b3 = site(0, spot(0, mid() + 1500, 80), 1), art = C.addUnit('art', 1, 0, 0, 'priest', false, 0, $('railOf')(b3.x, b3.z).s - 4200, 5, 0); C.run(30); const n0 = art.arms[0].n; b3.seenT = S.t; let hp = HP0, onIt = false; C.run(240, () => { b3.seenT = S.t; hp = S.oh[b3.id]; if (art.ai.fm && art.ai.fm.t === b3) onIt = true; return !b3.dead; });
  ok(n0 === 0 && art.arms[0].n > 0 && onIt, 'a battery leaves an unseen base alone and takes a spotted one for its fire missions, from ' + Math.round(hd(art, b3)) + ' m: ' + art.arms[0].n + ' rounds, ' + (b3.dead ? 'destroyed at ' + S.t.toFixed(0) + ' s' : Math.round(HP0 - hp) + ' hp done'));
  for (const [era, id] of [['ww2', 'p47'], ['modern', 'su25'], ['modern', 'a10']]) { fresh(era); const t = $('PLANES')[id].side, bb = site(1 - t, spot(0, mid() + (t ? 1500 : -1500), 80), 1), pl = C.addPlane(id, t, bb.x + (t ? -5000 : 5000), bb.y + 700, bb.z, t ? 0 : Math.PI, true, 'cas'); pl.inv = 1e9;
    C.aiPick(pl); const blind = pl.tgt; let hp = HP0; C.run(400, () => { bb.seenT = S.t; hp = S.oh[bb.id]; return !bb.dead; });
    ok(!blind && (bb.dead || hp < HP0), era + ' ' + id + ': an attack plane ignores a base nobody has seen, and attacks a spotted one: ' + (bb.dead ? 'destroyed at ' + S.t.toFixed(0) + ' s' : Math.round(HP0 - hp) + ' hp done in 400 s')); }
  fresh(); const b5 = site(0, spot(0, mid() + 1500, 80), 1), r5 = $('railOf')(b5.x, b5.z), pp = $('routeAt')(S.T.routes[0], r5.s - 400), q = C.addSquad(1, pp.x, pp.z, 0, r5.s - 400); q.job = 'push'; C.setOrd(q, { k: 'assault', ri: 0, s: r5.s - 300 }); b5.seenT = 1e9;
  const PS = $('planSup'); let raid = false; C.run(300, () => { if ((S.t * 60 | 0) % 60 === 0) PS(1, [q], S.fld[1]); if (q.ord.raid) raid = true; return !b5.dead; });
  ok(raid && b5.dead, 'an assault squad 400 m from a spotted base went for it and blew it up with its charges at ' + S.t.toFixed(0) + ' s (' + q.live + ' of ' + q.n0 + ' men left)'); }
H.done();
