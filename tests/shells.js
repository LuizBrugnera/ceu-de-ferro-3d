'use strict';
/* the two shells of a tank's main gun: armour piercing (the gun's own numbers) and high explosive (SHL). Tables, the burst on men, the
   hit on a tank (frontal, and on a track), the switch with its reload and the counts, rearming, the AI's choice, the wire.
   node tests/shells.js (PAGE=<page>; BASE=<the page before the change>, to show the armour-piercing round is untouched) */
const fs = require('fs'), H = require('./harness.js'), { ok, done } = H;
const C = H.load({ seed: 21 }), $ = C.$, SHL = $('SHL'), TANKS = $('TANKS'), INF = $('INF'), f1 = v => v.toFixed(1), VLIFT = (() => { try { return $('VLIFT'); } catch (e) { return 1.5; } })();   // the vehicle frame over the ground (1.5 before cf-veiculos)
let S, X0, Z0; const NET = $('Net');
/* everything on the flat disc of base 0, so that no ridge is in the way */
const fresh = (era, c) => { S = (c || C).sandbox(era); X0 = S.base[0].x - 150; Z0 = S.base[0].z; return S; };
const tank = (id, team, x, z, h, c) => { const u = (c || C).addVehicle('tank', id, team, x, z, h || 0); u.inv = 0; u.ai = null; return u; };

console.log('-- the loads: tables --');
const AP = { tiger: [56, 760, 7], pz4: [46, 760, 7], sherman: [42, 760, 7], t34: [50, 760, 7], abrams: [62, 1550, 7], leo2: [64, 1550, 7], t90: [62, 1550, 7], t72: [62, 1550, 7] };
for (const id in TANKS) {
  const a = TANKS[id].arms[0], hv = a.hv, [dmg, spd, r] = AP[id];
  ok(a.dmg === dmg && a.spd === spd && a.r === r && !a.he, id + ': armour-piercing numbers as before (dmg ' + dmg + ', ' + spd + ' m/s, burst ' + r + ' m)');
  ok(hv && hv.he === 1 && hv.k === 'shell' && hv.spd < a.spd * .8 && hv.r > a.r * 1.8 && hv.hit < a.dmg && hv.rl === a.rl && hv.name === a.name, id + ': a high-explosive load, slower (' + hv.spd + ' m/s), a burst of ' + hv.r + ' m, the same reload');
  ok(hv.n > 0 && hv.n < a.ammo && a.ammo === 40, id + ': ' + (a.ammo - hv.n) + ' armour piercing + ' + hv.n + ' high explosive out of ' + a.ammo);
}

console.log('-- the burst: men in the open, WW2 75 mm and modern 120 mm --');
for (const [era, id] of [['ww2', 'sherman'], ['modern', 'abrams']]) {
  const kit = INF[era][1][0], T = TANKS[id].arms[0], w = T.hv;
  const trial = (W, f, st) => {
    let dead = 0, hp = 0; const N = 12;
    for (let i = 0; i < N; i++) {
      fresh(era); const t = tank(id, 0, X0, Z0), m = C.addMan(kit, 1, X0 + 400 + f * W.r, Z0, 0); m.inv = 0; m.ai = null; m.st = m.ctl.st = st || 0;
      C.shell(t, W, X0 + 400, C.hgt(X0 + 400, Z0) + 20, Z0, 0, -200, 0); C.run(.8); if (m.dead) dead++; hp += m.hp;
    }
    return { dead: dead / N, hp: hp / N };
  };
  const he = trial(w, .3), edge = trial(w, .95), ap = trial(T, .3 * w.r / T.r), prone = trial(w, .15, 2);
  console.log('   ' + id + ': HE at 0.3 r (' + f1(.3 * w.r) + ' m) dead ' + he.dead + ', at 0.95 r dead ' + edge.dead + ' (hp ' + f1(edge.hp) + '); AP at ' + f1(.3 * w.r) + ' m dead ' + ap.dead + '; prone at 0.15 r dead ' + prone.dead);
  ok(he.dead >= (era === 'ww2' ? 1 : .6), id + ': a high-explosive round kills men in the open within the burst (' + (100 * he.dead) + '%)');
  ok(edge.dead === 0 && edge.hp < MANHP() && edge.hp > MANHP() - 6, id + ': at the edge of the radius it only wounds');
  ok(ap.dead === 0, id + ': the armour-piercing round does not do that at the same distance');
  ok(prone.dead < he.dead || prone.dead === 0, id + ': men lying down are the better for it');
}
function MANHP() { return $('MAN').hp; }

console.log('-- a tank in front of the muzzle --');
/* n rounds of weapon W from 150 m ahead of the target's nose, at the turret; the target's hp and parts after */
const volley = (c, era, id, tid, W, n, side) => {
  fresh(era, c); const sh = tank(id, 0, X0, Z0, 0, c), t = tank(tid, 1, X0 + 150, Z0 + (side ? side * 2 : 0), side ? Math.PI / 2 : Math.PI, c);   // head on: t faces -x, the shooter is ahead of it; side: its flank
  const y0 = c.hgt(X0, Z0) + 2.9, D = Math.hypot(150, side ? side * 2 : 0), T = D / W.spd, vy = (t.y + 2.2 - y0 + .5 * $('GR') * T * T) / T;   // the muzzle aimed at the turret, the drop allowed for
  for (let i = 0; i < n; i++) { c.shell(sh, W, X0, y0, Z0, W.spd * 150 / D, vy, W.spd * (side ? side * 2 : 0) / D); c.run(.5); }
  return { t, hp: t.hp, dead: t.dead };
};
{   // the same armour-piercing volleys, in the page before the change and in this one
  const BASE = process.env.BASE || require('path').join(H.ROOT, '.work/branch-shell/base/Céu de Ferro 3D.html');
  if (!fs.existsSync(BASE)) console.log('   (no BASE page: the armour-piercing round is only checked against the table)');
  else for (const [era, id, tid, side] of [['ww2', 'sherman', 'tiger', 0], ['ww2', 'tiger', 'sherman', 1], ['modern', 'abrams', 't90', 1], ['modern', 't90', 'abrams', 0]]) {
    const A = H.load({ seed: 9 }), B = H.load({ seed: 9, page: BASE }), r = c => { const x = volley(c, era, id, tid, c.$('TANKS')[id].arms[0], 4, side); return [x.hp, x.t.parts.map(p => p.hp).join()]; };
    const a = r(A), b = r(B); ok(a[0] === b[0] && a[1] === b[1], id + ' on ' + tid + (side ? ' (flank)' : ' (head on)') + ': four armour-piercing rounds leave it exactly as the old page does (hp ' + f1(a[0]) + ')');
  }
}

for (const [era, id, tid] of [['ww2', 'sherman', 'tiger'], ['modern', 'abrams', 't90']]) {
  const T = TANKS[id].arms[0], w = T.hv, N = 6;
  let heL = 0, apL = 0, k = 0; const R = 4;
  for (let i = 0; i < R; i++) { const a = volley(C, era, id, tid, w, N), b = volley(C, era, id, tid, T, N); heL += (TANKS[tid].hp - a.hp) / R; apL += (TANKS[tid].hp - b.hp) / R; k += +a.dead; }
  console.log('   ' + id + ' on ' + tid + ' head on, ' + N + ' rounds: HE takes ' + f1(heL) + ' of ' + TANKS[tid].hp + ' hp, AP ' + f1(apL));
  ok(k === 0 && heL < TANKS[tid].hp * .55, tid + ': ' + N + ' high-explosive rounds do not kill a tank head on (' + f1(heL) + ' of ' + TANKS[tid].hp + ' hp)');
  let hs = 0, as = 0; for (let i = 0; i < R; i++) { hs += (TANKS[tid].hp - volley(C, era, id, tid, w, N, 1).hp) / R; as += (TANKS[tid].hp - volley(C, era, id, tid, T, N, 1).hp) / R; }
  console.log('      on its flank: HE ' + f1(hs) + ', AP ' + f1(as));
  ok(as > hs * 1.8 && as > TANKS[tid].hp * .8, tid + ': the armour-piercing round does far more to its side (' + f1(as) + ' against ' + f1(hs) + ')');
}
{   // a track: the direct hit of an HE round is felt, a plain HE shell (artillery) at the same point is not
  fresh('modern'); const u = tank('t90', 1, X0 + 150, Z0, Math.PI), D = u.def.parts, i = D.ix.trackL, d = D[i], b = d.box;
  const c = Math.cos(u.h), s = Math.sin(u.h), p = [u.x + b[0] * c + b[2] * s, u.y + VLIFT + b[1], u.z - b[0] * s + b[2] * c];
  const dz = p[2] > u.z ? -1 : 1, shoot = (ap, n) => { const v = tank('t90', 1, X0 + 150, Z0, Math.PI); for (let j = 0; j < n; j++) { const h = C.strike(v, $('HK').shell, 40, null, p[0], p[1], p[2], 0, 0, dz, ap); if (h) $('hurt')(v)(v, h.dmg, null, false, h); } return v.parts[i].hp; };
  const hp0 = u.parts[i].hp, apTank = shoot(2, 1), apOld = shoot(true, 1);
  console.log('   track hp ' + f1(hp0) + ': after one HE direct hit ' + f1(apTank) + ', after one artillery HE shell ' + f1(apOld));
  ok(apTank < apOld, 'a tank\'s high-explosive round hurts the track more than the old rule does');
}

console.log('-- what else it hits --');
{
  const w = TANKS.abrams.arms[0].hv, T = TANKS.abrams.arms[0];
  const blast = (W, mk) => { fresh('modern'); const sh = tank('abrams', 0, X0, Z0), v = mk(); C.shell(sh, W, v.x - 60, C.hgt(v.x, v.z) + 1.8, v.z, W.spd, 0, 0); C.run(1.5); return v; };
  const truck = blast(w, () => { const v = C.addVehicle('truck', null, 1, X0 + 500, Z0, 0); v.inv = 0; v.ai = null; return v; }), truckAP = blast(T, () => { const v = C.addVehicle('truck', null, 1, X0 + 500, Z0, 0); v.inv = 0; v.ai = null; return v; });
  console.log('   truck: HE hp ' + f1(truck.hp) + ' dead ' + truck.dead + '; AP hp ' + f1(truckAP.hp) + ' dead ' + truckAP.dead);
  ok(truck.dead || truck.hp < truck.max * .3, 'a truck is hurt by a high-explosive round');
  const o = $('OBJD'); ok(o.he.blast === 1, 'the burst takes its whole share of a house or a field work (OBJD.he blast ' + o.he.blast + ')');
}

console.log('-- switching: a reload, the counts, rearming --');
{
  fresh('modern'); const u = tank('abrams', 0, X0, Z0), a = u.arms[0]; u.ai = null; a.ammo = a.d.ammo; C.arms(u, .016);
  ok(a.he === a.d.hv.n && a.ammo - a.he === a.d.ammo - a.d.hv.n && !a.ld, 'a full tank starts with ' + (a.ammo - a.he) + ' AP and ' + a.he + ' HE, armour piercing in the breech');
  u.ctl.fire[0] = true; C.run(.1); const sp = S.bombs.length; ok(sp === 1 && S.bombs[0].o === a.d && !S.bombs[0].o.he, 'it fires the armour-piercing round');
  ok(a.ammo === 39 && a.he === a.d.hv.n, 'the shot comes out of the armour-piercing count');
  S.bombs.length = 0; u.ctl.fire[0] = false; C.run(a.d.rl + .5);
  ok(C.swapShell(u) && a.ld === 1 && a.cool >= a.d.rl - .01, 'V changes the load and costs a full reload (' + f1(a.cool) + ' s)');
  u.ctl.fire[0] = true; C.run(a.d.rl * .5); ok(S.bombs.length === 0, 'it cannot fire before that reload is out');
  C.run(a.d.rl * .6); const b = S.bombs[0]; ok(b && b.o.he === 1 && b.o === a.d.hv, 'then the round is high explosive');
  ok(a.ammo === 38 && a.he === a.d.hv.n - 1, 'and it comes out of the HE count (AP ' + (a.ammo - a.he) + ', HE ' + a.he + ')');
  ok(Math.hypot(b.vx, b.vy, b.vz) < a.d.spd * .75, 'it leaves slower than the armour-piercing round (' + f1(Math.hypot(b.vx, b.vy, b.vz)) + ' m/s)');
  S.bombs.length = 0; u.ctl.fire[0] = false; a.he = 0; ok(C.swapShell(u) && a.ld === 0, 'with the HE out the AP is what is left, and it changes back for a reload');
  ok(!C.swapShell(u) && a.ld === 0, 'with no high explosive left, it will not change');
  a.ld = 1; u.ctl.fire[0] = true; a.cool = 0; C.run(.1); ok(S.bombs.length === 0, 'an empty load does not fire');
  u.ctl.fire[0] = false; a.ammo = a.d.ammo; C.run(.1); ok(a.he === a.d.hv.n, 'rearmed (the whole magazine back): the split is full again, ' + (a.ammo - a.he) + ' AP and ' + a.he + ' HE');
}
console.log('-- the AI: the load by the target --');
{
  const pick = (era, id, mk) => {
    fresh(era); const u = C.addUnit('tank', 0, X0, Z0, id, true); u.inv = 0; const a = u.arms[0], t = mk();
    C.aiShell(u, t); return a.ld | 0;
  };
  const tid = 'abrams';
  const kinds = { tank: 0, aa: 0, art: 0, lav: 0, truck: 1, car: 1, trench: 1, undefined: 1 };
  for (const k in kinds) ok(pick('modern', tid, () => ({ kind: k === 'undefined' ? undefined : k })) === kinds[k], 'target ' + k + ': ' + (kinds[k] ? 'high explosive' : 'armour piercing'));
  ok(pick('modern', tid, () => ({ man: 1 })) === 1, 'a soldier: high explosive');
  fresh('modern'); const u = C.addUnit('tank', 0, X0, Z0, 'abrams', true), a = u.arms[0];
  C.aiShell(u, { kind: 'truck' }); const first = a.ld; C.aiShell(u, { kind: 'tank' }); const held = a.ld; S.t += SHL.hold + 1; C.aiShell(u, { kind: 'tank' });
  ok(first === 1 && held === 1 && a.ld === 0, 'it keeps a load for ' + SHL.hold + ' s instead of changing at every target (' + first + ', ' + held + ', ' + a.ld + ')');
  ok(a.cool >= a.d.rl - .01, 'and it pays the reload');
  fresh('modern'); const v = C.addUnit('tank', 0, X0, Z0, 'abrams', true), b = v.arms[0]; b.ld = 1; b.ammo = 30; b.he = 0; C.aiShell(v, { kind: 'truck' }); ok(b.ld === 0, 'out of high explosive, it goes back to armour piercing');
}
{   // played out: a tank at a squad, and a tank at a tank, 700 m apart on open ground
  const run = (era, foe) => {
    fresh(era); const sd = S.E.sides, id = sd[0].tanks[0], u = C.addUnit('tank', 0, X0, Z0, id, true); u.inv = 0; u.h = 0; const a = u.arms[0];
    const tgt = [];
    if (foe === 'squad') for (let i = 0; i < 4; i++) { const m = C.addMan(INF[era][1][0], 1, X0 + 550 + (i % 2) * 6, Z0 + (i >> 1) * 6, 0); m.inv = 0; m.ai = null; m.st = m.ctl.st = 0; tgt.push(m); }
    else { const v = C.addUnit('tank', 1, X0 + 550, Z0, sd[1].tanks[0], true); v.inv = 1e9; v.h = Math.PI; tgt.push(v); }
    let he = 0, ap = 0; const seen = new Set();
    C.run(40, () => { for (const b of S.bombs) if (b.k === 'shell' && b.by === u && !seen.has(b)) { seen.add(b); if (b.o.he) he++; else ap++; } return true; });
    return { he, ap, ld: a.ld | 0 };
  };
  for (const era of ['ww2', 'modern']) {
    const sq = run(era, 'squad'), tk = run(era, 'tank');
    console.log('   ' + era + ': at a squad ' + sq.he + ' HE, ' + sq.ap + ' AP; at a tank ' + tk.he + ' HE, ' + tk.ap + ' AP');
    ok(sq.he > 0 && sq.he >= sq.ap, era + ': it loads and fires high explosive at a squad in the open');
    ok(tk.ap > 0 && tk.he === 0, era + ': it fires armour piercing at a tank');
  }
}

console.log('-- online --');
{
  const src = fs.readFileSync(process.env.SERVER || require('path').join(require('path').dirname(H.PAGE), 'server.js'), 'utf8');
  ok(/she: 1/.test(src) && /m\.h === 1 && \{ h: 1 \}/.test(src), 'the server says she: 1 and keeps h on a shot and on an aishot (an older one drops it)');
  const sent = [];
  fresh('modern'); const u = tank('abrams', 0, X0, Z0), a = u.arms[0]; S.net = true; S.my = u; u.ai = null;
  NET.send = (t, m) => sent.push([t, m]); NET.she = false;
  ok(!C.swapShell(u) && !(a.ld | 0), 'with a server that does not know the load, the player cannot change it');
  NET.she = true; ok(C.swapShell(u) && a.ld === 1, 'with the new one, it can');
  a.cool = 0; u.ctl.fire[0] = true; a.ammo = 40; a.he = 18; C.arms(u, .016);
  const m = sent.find(x => x[0] === 'shot'); ok(m && m[1].h === 1 && m[1].v.length === 3, 'a high-explosive shot goes out marked h: 1, with its own velocity (' + (m ? f1(Math.hypot(...m[1].v)) : '-') + ' m/s)');
  a.ld = 0; a.cool = 0; sent.length = 0; C.arms(u, .016); const m2 = sent.find(x => x[0] === 'shot'); ok(m2 && m2[1].h === undefined, 'an armour-piercing one goes out as it always did');
  // the other client: a ghost fires what it is told
  fresh('modern'); S.net = true; const gh = tank('abrams', 1, X0 + 500, Z0), me = tank('t90', 0, X0, Z0); gh.net = true; gh.aid = 0; const mk = o => { const q = { from: 77, p: [X0 + 500, C.hgt(X0 + 500, Z0) + 3, Z0], v: [-1050, 0, 0] }; return Object.assign(q, o); };
  NET.rx.shot(mk({ h: 1 }), gh); const b1 = S.bombs[S.bombs.length - 1]; NET.rx.shot(mk({}), gh); const b2 = S.bombs[S.bombs.length - 1];
  ok(b1 && b1.o.he === 1 && b2 && !b2.o.he, 'on the other client, h: 1 makes a high-explosive shell and without it an armour-piercing one');
  S.net = false;
}
(async () => {   // and through the server: welcome she, and h kept on a shot and an aishot
  const N = require('./net');
  try {
    await N.start();
    const join = async (model) => { const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: model, cls: 'tank', model }); c.w = await c.wait('welcome', 800); return c; };
    const h = await join('abrams'), g = await join('t90');
    ok(h.w && h.w.she === 1, 'welcome says she: 1');
    h.send({ t: 'shot', p: [1, 2, 3], v: [4, 5, 6], h: 1 }); const a = await g.wait('shot'); ok(a && a.from === h.w.id && a.h === 1, 'a shot marked h: 1 reaches the other player marked');
    h.send({ t: 'shot', p: [1, 2, 3], v: [4, 5, 6] }); const b = await g.wait('shot'); ok(b && b.h === undefined, 'one without it arrives without it');
    h.send({ t: 'shot', p: [1, 2, 3], v: [4, 5, 6], h: 7 }); const c = await g.wait('shot'); ok(c && c.h === undefined, 'anything else than 1 is dropped');
    h.send({ t: 'aishot', id: -2, p: [1, 2, 3], v: [4, 5, 6], h: 1 }); const d = await g.wait('aishot'); ok(d && d.id === -2 && d.h === 1, 'the host\'s AI tank shot carries it too');
  } catch (e) { ok(false, 'server: ' + e.message); }
  N.stop(); done();
})();
