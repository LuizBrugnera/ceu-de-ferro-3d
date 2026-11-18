'use strict';
/* Part B, squads: trucks, dismounting, behaviour under fire, the rocket soldier's stalk, withdrawal, and how the other AI reacts to infantry */
const H = require('./harness'), C = H.load({ seed: 911 }), $ = C.$, ok = H.ok;
const IAI = $('IAI'), SQUAD = $('SQUAD'), MAN = $('MAN');
let S, B, g, r;
const fresh = era => { S = C.sandbox(era || 'ww2'); B = S.base[0]; g = C.hgt(B.x, B.z); r = S.T.routes[0]; return S; };
const at = s => $('routeAt')(r, s);
/* a straight piece of road 0 to fight on: the middle, where both sides meet */
const mid = () => r.len / 2;

console.log('-- a truck carries a squad and lets it off on contact --');
fresh(); {
  C.spawnColumn(1, 0, 0, 1, 0, mid() - 1500, 0, 1);
  const tr = S.units[0]; ok(tr.kind === 'truck' && tr.cargo && tr.cargo.length === SQUAD.ww2.length && S.men.length === 0, 'the squad rides as cargo (' + tr.cargo.length + ' soldiers), nobody on foot yet');
  const p = at(mid() - 1500 + 60 + IAI.dismount + 500), foe = C.addVehicle('truck', null, 0, p.x, p.z, 0);
  let tOff = null; C.run(120, () => { if (tOff === null && S.men.length) tOff = S.t; return tOff === null; });
  const d = $('hdist')(tr, foe);
  ok(tOff !== null && !tr.cargo && S.men.length === SQUAD.ww2.length && S.squads.length === 1, 'dismounted at t=' + (tOff || 0).toFixed(0) + ' s, ' + d.toFixed(0) + ' m from the enemy (table: ' + IAI.dismount + ' m)');
  ok(!!S.men[0] && S.men[0].sq === S.squads[0] && S.men.every(m => m.ai && m.team === 1), 'the squad is its men, with the leader first');
  const kits = S.men.map(m => m.def.role).join(', '); console.log('   ' + kits);
}
console.log('-- a truck halts at the hold point and dismounts there with no enemy near --');
fresh(); { C.spawnColumn(0, 0, 0, 1, 0, r.len - 4200, 0, 1); let t = null; C.run(200, () => { if (t === null && S.men.length) t = S.t; return t === null; }); ok(t !== null, 'dismounted at the hold line after ' + (t || 0).toFixed(0) + ' s'); }
console.log('-- a loaded truck destroyed spills the men who get out --');
{ let out = 0, hurt = 0, n = 200;
  for (let i = 0; i < n; i++) { fresh(); C.spawnColumn(1, 0, 0, 1, 0, mid(), 0, 1); const tr = S.units[0]; C.damageUnit(tr, 999, null); out += S.men.length; hurt += S.men.filter(m => m.hp < m.max && m.sup > S.t).length; }
  const share = out / (n * SQUAD.ww2.length);
  ok(Math.abs(share - IAI.spill) < .06 && hurt === out, (100 * share).toFixed(0) + '% of the men aboard get out (table: ' + IAI.spill + '), all of them hurt and pinned'); }

console.log('-- under fire: prone, and shooting worse --');
fresh(); {
  const p = at(mid()), q = C.addSquad(1, p.x, p.z, 0, mid()); C.run(3);
  const st0 = q.men.map(m => m.st).join('');
  for (const m of q.men) S.bullets.push({ x: m.x - 40, y: m.y + 1.2, z: m.z + 1.5, vx: 800, vy: 0, vz: 0, life: 1, team: 0, dmg: 0, ap: 0, by: null });
  C.run(1.2);
  const pinned = q.men.filter(m => m.sup > S.t).length, prone = q.men.filter(m => m.st === 2).length;
  ok(pinned >= 2 && prone >= 2, 'stances before ' + st0 + ', after near misses ' + q.men.map(m => m.st).join('') + ' (' + pinned + ' pinned, ' + prone + ' prone)');
  const m = q.men.find(x => x.sup > S.t), a = m.arms[0]; a.mag = 1; C.manFire(m, a);
  const b = S.bullets[S.bullets.length - 1]; m.sup = -9; a.mag = 1;
  console.log('   spread while pinned is ' + $('SUP').sp + ' times the normal one, for ' + $('SUP').t + ' s');
  C.run(6); ok(q.men.every(x => x.st !== 2 || x.def.arms[0].lmg), 'they get up again when it stops (' + q.men.map(x => x.st).join('') + ')');
}
console.log('-- rocket soldier against a tank that faces it: stalks to the flank, then fires --');
for (const [era, tank] of [['ww2', 'sherman'], ['modern', 'abrams']]) {
  let kills = 0, flank = 0, shots = 0, n = 10, tt = 0;
  for (let i = 0; i < n; i++) {
    fresh(era); const p = at(mid()), q = C.addSquad(1, p.x, p.z, 0, mid(), [2]), m = q.men[0], w = m.arms[1].d;
    const t = C.addVehicle('tank', tank, 0, p.x - p.dx * 160 * q.ds * -1, p.z - p.dz * 160 * q.ds * -1, 0); t.h = Math.atan2(-(m.z - t.z), m.x - t.x);
    let first = null;
    C.run(90, () => { if (first === null && m.arms[1].t > 0) { first = S.t; const hx = Math.cos(t.h), hz = -Math.sin(t.h), rx = m.x - t.x, rz = m.z - t.z, d = Math.hypot(rx, rz); if ((rx * hx + rz * hz) / d < IAI.at.side) flank++; shots++; } return !t.dead && !m.dead; });
    if (t.dead) { kills++; tt += S.t; }
  }
  ok(shots >= n * .8 && flank >= shots * .8 && kills >= n * .5, era + ': ' + shots + '/' + n + ' fired, ' + flank + ' of those from off the frontal arc, ' + kills + ' tanks destroyed (mean ' + (tt / (kills || 1)).toFixed(0) + ' s)');
}
console.log('-- a squad that has lost most of its men falls back --');
fresh(); {
  const p = at(mid()), q = C.addSquad(1, p.x, p.z, 0, mid()); C.run(2);
  const s0 = q.s, n = q.men.length; q.men.slice(1, n - 1).forEach(m => C.killMan(m, null)); q.men[0].hp = 1; C.killMan(q.men[0], null);
  C.run(1); const st = q.state, smokes = S.smokes.length + S.bombs.filter(b => b.k === 'smk').length; C.run(90);
  const L = q.men.find(m => !m.dead), back = (s0 - q.s) * q.ds;
  ok(st === 1 && back > IAI.back - 5, 'state broken with ' + q.live + ' of ' + n + ' left (table: ' + IAI.rout + '), anchor ' + back.toFixed(0) + ' m back');
  ok(L && $('hdist')(L, $('slot')(q, L.ai.i)) < 20, 'the survivor is there');
  console.log('   smoke thrown by the new leader: ' + (smokes ? 'yes' : 'no'));
}
console.log('-- the other AI reacts --');
/* 300 m past the middle, away from the town whose houses reach the road at the middle; the tank of side 1 drives up the road (ds 1) with the soldiers ahead
   of it, since an AI has to notice them first (perception) and one driving away does not look behind */
const away = () => mid() + 300;
fresh(); {
  const p = at(away()), q = C.addSquad(0, p.x, p.z, 0, away(), [0, 0, 0]); q.men.forEach(m => { m.ai = null; });
  const t = C.addUnit('tank', 1, 0, 0, 'tiger', false, 0, away() - 350, 5, 0); let mg = 0, shell = 0;
  C.run(25, () => { mg = t.arms[1].n; shell = t.arms[0].n; });
  ok(mg > 20 && q.men.some(m => m.dead || m.hp < m.max), 'a tank opens on soldiers in the open with its machine gun (' + mg + ' rounds; ' + shell + ' high explosive shells from the gun), ' + q.men.filter(m => m.dead).length + ' killed');
}
fresh(); {
  const q = C.addSquad(0, at(away()).x, at(away()).z, 0, away(), [2]), m = q.men[0]; m.ai = null; m.inv = 1e9; m.st = m.ctl.st = 0;
  const t = C.addUnit('tank', 1, 0, 0, 'tiger', false, 0, away() - 200, 5, 0); C.run(1); const d0 = $('hdist')(t, m); C.run(IAI.tank.shy - 1); const d1 = $('hdist')(t, m); C.run(30); const d2 = $('hdist')(t, m);
  ok(d1 > d0 + 30 && d2 < d1 - 30, 'a tank backs away from a rocket soldier it has seen, for ' + IAI.tank.shy + ' s, and then comes on: ' + d0.toFixed(0) + ' m to ' + d1.toFixed(0) + ' m to ' + d2.toFixed(0) + ' m (table: keep ' + IAI.tank.keep + ')');
}
fresh(); {
  const q = C.addSquad(0, B.x, B.z, 0, 0), bias = $('PAI').cas.bias;
  const see = $('typeof notice === "function" ? notice : () => true'), look = (os, s) => { for (const t0 = S.t; S.t - t0 < s;) { S.t += .25; for (const o of os) see(p, o); } };   // the pilot takes them in (perception), the clock moved by hand
  const p = C.addPlane('p47', 1, B.x + 2000, g + 600, B.z, Math.PI, true, 'cas'); look(q.men, 8); C.aiPick(p);
  const lone = p.tgt && p.tgt.man; const tr = C.addVehicle('truck', null, 0, B.x + 100, B.z, 0); look([tr], 4); C.aiPick(p);
  ok(lone && p.tgt === tr, 'an attack plane takes a squad when nothing else is there, and a truck beside it first (soldier costs ' + IAI.cas + ' m, truck ' + bias.truck + ')');
}
fresh(); {
  const q = C.addSquad(0, B.x, B.z - 500, 0, 0); q.men.forEach(m => { m.ai = null; m.moveT = -99; });
  const sp = C.addUnit('tank', 1, B.x + 300, B.z - 500, 'tiger', true); sp.arms.forEach(a => { a.ammo = 0; });
  const art = C.addUnit('art', 1, B.x, B.z + 700, 'hummel', true); art.h = Math.PI / 2; let n = 0;
  C.run(60, () => { n = art.arms[0].n; });
  ok(n > 0, 'a battery shells a spotted squad that stands still (' + n + ' rounds, ' + q.men.filter(m => m.dead).length + ' of ' + q.n0 + ' killed); one soldier is worth ' + IAI.art + ', the still bonus ' + $('GAI').art.val.still);
}
console.log('-- counts --');
{ const D = $('DIR'); console.log('   the director keeps ' + D.squad[0] + ' column squads a side in ' + D.truck[0] + ' trucks; soldiers per squad ' + SQUAD.ww2.length + ' (1944) / ' + SQUAD.modern.length + ' (today), cap ' + IAI.cap); }
console.log('   online director: squads per side by humans on it ' + JSON.stringify($('DIR').squad));
H.done();
