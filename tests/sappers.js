'use strict';
/* Sappers: the kit in each era and side (charges, mines, its place in the AI rows), where a mine may lie, what sets an AT and an AP mine
   off and what each does, who knows a mine (its side, a sapper's detector, a burst), lifting one, the player's hands (N through the mines,
   the trigger, V), sabotage of a parked vehicle, a fixed AA and a set-down radio, and the pouch filled again at a depot */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 77 }), $ = C.$, SAP = $('SAP'), KITS = $('KITS'), INF = $('INF'), BLD = $('BLD'), FORT = $('FORT');
const hd = $('hdist');
let S, T;
const fresh = era => { S = C.sandbox(era || 'ww2'); T = S.T; for (const f of S.forts.slice()) C.fortDrop(f); S.forts = []; return S; };
/* level open ground, away from roads, houses and both bases */
function flat(n) {
  let k = 0;
  for (let z = -S.HW + 900; z < S.HW - 900; z += 173) for (let x = 2500; x < S.W - 2500; x += 211) {
    const h = C.hgt(x, z); let lv = h > T.WL + 6 && C.routeDist(T, x, z) > 150;
    for (const [a, b] of [[60, 0], [-60, 0], [0, 60], [0, -60]]) if (Math.abs(C.hgt(x + a, z + b) - h) > 2) lv = false;
    if (lv && !C.near(x, z, 90).length && k++ === (n || 0)) return { x, z };
  }
  throw new Error('no flat ground');
}
const man = (kit, team, x, z) => { const m = C.addMan(kit, team, x, z, 0); m.ai = null; return m; };
const tank = (id, team, x, z, h) => { const u = C.addUnit('tank', team, x, z, id, true); u.fixed = false; u.ai = null; u.x = x; u.z = z; u.y = C.hgt(x, z); u.h = h || 0; return u; };

console.log('-- the kit --');
for (const era of ['ww2', 'modern']) {
  fresh(era);
  const ids = [0, 1].map(s => INF[era][s].find(id => KITS[id].sap)), K = ids.map(id => KITS[id]), m = man(ids[0], 0, 3000, 0);
  const net = C.$('trnKits')(), at = ids.map(id => net.indexOf(id)), later = id => KITS[id].side === 2 || KITS[id].med;   // what came after the sappers: the Insurgents' kits (3 sides) and the medics
  console.log('   ' + era + ': ' + K.map(k => k.name + ' (' + k.arms[0].name + ')').join(' and ') + '; mines ' + [0, 1].map(s => SAP.names[era][s].join(' / ')).join(', '));
  ok(K.every((k, s) => k.side === s && k.role === 'Sapador' && k.chg === SAP.chg) && m.chg === SAP.chg && m.mn.join() === SAP.mines.join(), era + ': a sapper kit on each side, with ' + SAP.chg + ' charges and ' + SAP.mines.join(' + ') + ' mines');
  ok(at[1] === at[0] + 1 && net.slice(0, at[0]).every(id => !KITS[id].sap && !later(id)) && net.slice(at[1] + 1).every(later), era + ': in the AI rows the sapper kits come after every kit an older page knew, which keep their numbers, and only later kits come after them (' + at + ' of ' + net.length + ')');
}

console.log('-- where a mine may lie --');
fresh('ww2');
{
  const p = flat(), b = S.base[0], q = C.railOf(b.x, b.z), r = C.routeAt(T.routes[q.ri], q.s + 200 * (q.s < T.routes[q.ri].len / 2 ? 1 : -1));
  ok(C.mineWhy(0, 0, p.x, p.z) === '' && C.mineWhy(0, 0, r.x, r.z) === 'base' && C.mineWhy(0, 1, r.x, r.z) !== 'base', 'open ground takes a mine; the road by its own main base does not, though it takes the other side\'s');
  const o = C.mineLay(0, 0, p.x, p.z);
  ok(o && C.mineWhy(1, 0, p.x + 2, p.z) === 'near' && C.mineWhy(1, 0, p.x + SAP.apart + .5, p.z) === '', 'no mine within ' + SAP.apart + ' m of another');
  const e = man('rifleman', 1, p.x + 50, p.z);
  ok(C.mineWhy(0, 0, p.x + 50 - SAP.foe + 3, p.z) === 'foe', 'none with an enemy within ' + SAP.foe + ' m');
  e.dead = true;
  let n = 1; for (let i = 0; n < SAP.cap + 3; i++) if (C.mineLay(i & 1, 0, p.x + 10 + (i % 10) * 4, p.z + 6 + Math.floor(i / 10) * 4)) n++; else break;
  ok(n === SAP.cap && C.mineWhy(0, 0, p.x - 60, p.z) === 'cap' && C.mineWhy(0, 1, p.x - 60, p.z) === '', 'a side has at most ' + SAP.cap + ' mines down; the other side still lays its own');
}

console.log('-- what sets a mine off --');
for (const era of ['ww2', 'modern']) {
  fresh(era); const E = S.E.sides, p = flat(1);
  const at = C.mineLay(0, 0, p.x, p.z), u = tank(E[1].tanks[0], 1, p.x, p.z, Math.PI), hp0 = u.hp;
  C.run(SAP.arm - .5); const early = at.gone; C.run(1);
  ok(!early && at.gone, era + ': an AT mine laid under a tank waits ' + SAP.arm + ' s to arm, and then goes off under it');
  u.x = p.x + 150; u.z = p.z; u.hp = hp0; u.dead = false; for (const q of u.parts) q.hp = q.max === undefined ? q.hp : q.max;
  const D = u.def.parts, tr = () => ['trackL', 'trackR', 'wheelL', 'wheelR'].filter(id => D.ix[id] !== undefined && u.parts[D.ix[id]].hp <= 0);
  const fresh2 = tank(E[1].tanks[1], 1, p.x + 70, p.z, Math.PI), at2 = C.mineLay(0, 0, p.x + 40, p.z + 1); C.run(SAP.arm + .2); fresh2.ctl.drive = 1;
  let t = 0, broke = null; const hpT = fresh2.hp; C.run(20, dt => { t += dt; return !at2.gone; });
  broke = ['trackL', 'trackR', 'wheelL', 'wheelR'].filter(id => fresh2.def.parts.ix[id] !== undefined && fresh2.parts[fresh2.def.parts.ix[id]].hp <= 0);
  console.log('   ' + era + ': ' + fresh2.def.name + ' drives onto an AT mine after ' + t.toFixed(1) + ' s: hp ' + Math.round(hpT) + ' to ' + Math.round(fresh2.hp) + ', broken: ' + (broke.join(', ') || 'nothing'));
  ok(at2.gone && broke.length === 1 && fresh2.hp < hpT, era + ': a tank that drives onto an armed AT mine loses the track on that side and some of its hull');
  fresh2.dead = u.dead = true; fresh2.x = u.x = -9999;
  const own = tank(E[0].tanks[0], 0, p.x + 200, p.z, 0), at3 = C.mineLay(0, 0, p.x + 230, p.z); C.run(SAP.arm + .2); own.ctl.drive = 1; C.run(8);
  ok(!at3.gone && hd(own, at3) > 5, era + ': a tank of the mine\'s own side drives over it and nothing happens');
  const ap = C.mineLay(1, 0, p.x + 400, p.z), at4 = C.mineLay(0, 0, p.x + 420, p.z); C.run(SAP.arm + .2);
  const w = man(E[1] ? INF[era][1][0] : 'rifleman', 1, p.x + 420 + 3, p.z); w.ctl.mx = -1; w.ctl.mz = 0; w.ctl.aim = { x: -1, y: 0, z: 0 };
  C.run(4, () => !at4.gone);
  const passed = !at4.gone; w.x = p.x + 403; w.z = p.z; w.ctl.mx = -1; let hp1 = w.hp;
  C.run(5, () => !ap.gone);
  console.log('   ' + era + ': a soldier walks over an AT mine (' + (passed ? 'nothing' : 'it went off') + ') and onto an AP one: hp ' + hp1 + ' to ' + Math.max(0, Math.round(w.hp)) + (w.dead ? ', dead' : ''));
  ok(passed && ap.gone && (w.dead || w.hp < hp1 * .5), era + ': a soldier does not set off an AT mine, and an AP mine kills or cripples him');
  const sus = S.msus[1];
  ok(sus.length >= 3 && sus.every(s => s.t > 0) && S.mines.filter(o => !o.gone).length === 2, era + ': every burst leaves a suspect field on the map of the side that drove into it (' + sus.length + ')');
}

console.log('-- who knows a mine --');
fresh('modern');
{
  const p = flat(2), o = C.mineLay(1, 0, p.x, p.z), kn = t => !!(o.kn & (1 << t));
  const s = man('redEng', 1, p.x + SAP.det + 8, p.z); C.run(1);
  const far = kn(1); s.x = p.x + SAP.det - 5; s.ctl.run = true; s.ctl.mx = 0; s.ctl.mz = 1; s.ctl.aim = { x: 0, y: 0, z: 1 }; s.stam = 1; C.run(1.2); const ran = kn(1), d1 = hd(s, o); s.ctl.run = false; s.ctl.mz = 0; C.run(1.2);
  const r = man('redRifle', 1, p.x + 6, p.z + 6); C.run(1);
  console.log('   its own side knows it at once; a sapper of the other side ' + SAP.det + ' m off: ' + (far ? 'knows' : 'does not') + '; running ' + Math.round(d1) + ' m off: ' + (ran ? 'knows' : 'does not') + '; walking: ' + (kn(1) ? 'knows' : 'does not'));
  ok(kn(0) && !far && !ran && kn(1), 'its side knows it; the other side only once a sapper of its, not running, comes within ' + SAP.det + ' m');
  const o2 = C.mineLay(0, 0, p.x + 200, p.z), r2 = man('redRifle', 1, p.x + 210, p.z); C.run(2);
  ok(!(o2.kn & 2), 'a soldier who is not a sapper finds nothing, even close');
  r.dead = r2.dead = true;
}

console.log('-- lifting --');
fresh('ww2');
{
  const p = flat(3), mine = C.mineLay(1, 0, p.x + 2, p.z), hidden = C.mineLay(0, 0, p.x + 330, p.z), s = man('pionier', 0, p.x, p.z), e = man('engineer', 1, p.x + 300, p.z);
  s.mn[1] = 2;
  ok(C.mineLift(mine, s) && s.mn[1] === 3 && mine.gone, 'a sapper lifts its own side\'s mine back into the pouch');
  ok(!C.mineLift(hidden, e) && !hidden.gone, 'not one its side does not know');
  hidden.kn |= 2; ok(C.mineLift(hidden, e) && hidden.gone && e.mn[0] === SAP.mines[0], 'one it knows it disarms, and keeps nothing of it');
  e.dead = true;
}

console.log('-- the player\'s hands --');
for (const era of ['ww2', 'modern']) {
  fresh(era); const p = flat(4), kit = INF[era][0].find(id => KITS[id].sap), P = man(kit, 0, p.x, p.z);
  S.my = P; P.me = true; S.aim = { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } }; S.input = {}; P.kd = {};
  const press = (k, trig) => { const I = Object.assign({}, S.input, k === 'V' ? { ordB: true } : {}); C.build(P, I, k === 'N', !!trig); C.build(P, Object.assign({}, S.input), false, false); };
  S.fm = { k: FORT.K.length - 1, P }; press('N');
  const atMode = S.mm && S.mm.k === 0; press('N'); const apMode = S.mm && S.mm.k === 1; press('N'); const out = !S.mm && !S.fm;
  ok(atMode && apMode && out, era + ': N goes on from the last work to the AT mine, the AP mine and out of the build mode');
  S.fm = { k: FORT.K.length - 1, P }; press('N'); C.run(.1); press(null, true);
  const laid = S.mines.filter(o => !o.gone && o.team === 0);
  ok(laid.length === 1 && laid[0].k === 0 && P.mn[0] === SAP.mines[0] - 1 && Math.abs(hd(laid[0], P) - SAP.put) < .3, era + ': the trigger lays an AT mine ' + SAP.put + ' m ahead and takes it from the pouch');
  press(null, true); ok(S.mines.filter(o => !o.gone).length === 1, era + ': a second click at once lays nothing (' + SAP.cool + ' s apart, and too near)');
  S.mm = null;
  P.x = laid[0].x - 1.5; P.z = laid[0].z; press('V');
  const lifting = !!S.ml; C.run(SAP.clear - .5); C.build(P, {}, false, false); const still = !laid[0].gone;
  C.run(.7); C.build(P, {}, false, false);
  ok(lifting && still && laid[0].gone && P.mn[0] === SAP.mines[0], era + ': V by a mine its side knows lifts it after ' + SAP.clear + ' s standing still, and it goes back into the pouch');
  const m2 = C.mineLay(1, 0, P.x + 2, P.z); press('V'); P.x += 1; C.build(P, {}, false, false);
  ok(!S.ml && !m2.gone, era + ': stepping away breaks the lift off');
}

console.log('-- sabotage --');
for (const era of ['ww2', 'modern']) {
  fresh(era); const p = flat(5), E = S.E.sides, s = man(INF[era][0].find(id => KITS[id].sap), 0, p.x, p.z);
  const u = tank(E[1].tanks[1], 1, p.x + 5, p.z, 0), hp0 = u.hp;
  const t1 = C.sabTarget(s); ok(t1 === u && C.sabPlant(s, u) && s.chg === SAP.chg - 1, era + ': a sapper by a parked enemy tank arms a charge on it');
  C.run(BLD.charge.fuse + .3);
  console.log('   ' + era + ': ' + u.def.name + ' after one charge: hp ' + Math.round(hp0) + ' to ' + Math.max(0, Math.round(u.hp)) + (u.dead ? ', destroyed' : '') + '; ' + s.chg + ' charges left');
  ok(u.hp < hp0 * .6 || u.dead, era + ': one charge on a parked tank takes most of its hull or destroys it');
  u.x += 400; const aa = C.addUnit('aa', 1, p.x + 3, p.z + 4, null, true), aa0 = aa.hp;
  ok(C.sabTarget(s) === aa && C.sabPlant(s, aa), era + ': and on a fixed AA');
  C.run(BLD.charge.fuse + .3); ok(aa.dead || aa.hp < aa0 * .3, era + ': which it destroys (' + Math.round(aa0) + ' to ' + Math.max(0, Math.round(aa.hp)) + ')');
  const rm = man(INF[era][1].find(id => KITS[id].rad), 1, p.x - 4, p.z); C.radPut(rm); const rb = rm.rb;
  ok(C.sabTarget(s) === rb && C.sabPlant(s, rb), era + ': and on a set-down radio');
  C.run(BLD.charge.fuse + .3); ok(rb.dead && s.chg === 0, era + ': which goes; the sapper has used all ' + SAP.chg + ' charges');
  const mv = tank(E[1].tanks[0], 1, p.x + 6, p.z + 2, 0); mv.v = { x: 5, y: 0, z: 0 }; aa.dead = true;
  ok(C.sabTarget(s) !== mv, era + ': a vehicle on the move is no target for a charge');
}

console.log('-- the pouch at a depot, and an older server --');
fresh('ww2');
{
  const b = S.base[0], P = man('pionier', 0, b.x + 200, b.z); P.chg = 0; P.mn = [0, 1]; S.my = P; S.aim = { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } }; S.input = {};
  C.run(4);
  ok(P.chg === SAP.chg && P.mn.join() === SAP.mines.join(), 'at its main base the sapper gets its ' + SAP.chg + ' charges and its mines back');
  S.net = true; S.host = true; $('Net').sap = false;
  ok(!C.mineLay(0, 0, b.x + 1500, b.z + 300), 'online with a server that does not know the sappers nobody lays a mine');
  S.net = false;
}
H.done();
