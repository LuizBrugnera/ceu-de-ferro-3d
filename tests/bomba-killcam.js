'use strict';
/* cf-bomba-killcam: whoever sets off a bomb vest, a car bomb or a truck bomb dies in it (the player and the AI), and a player killed by one
   (the bomber too) gets the kill cam: S.kc on the blast, the respawn held past it */
const H = require('./harness'), { ok, done } = H, C = H.load({ seed: 9, mapv: 9 }), $ = C.$;
function bare(seed) {
  C.seed(seed); const S = C.watch('modern', { n: 3 }); S.demo = false; S.watch = false;
  for (const q of S.squads.slice()) for (const m of q.men) m.gone = true;
  S.squads.length = 0; S.men.length = 0; S.units.length = 0; S.planes.length = 0; if (S.civs) S.civs.length = 0;
  C.plan = () => {}; C.director = () => {};
  return S;
}
const KC = $('KC');
function me(S, kit, x, z, t = 2) { const m = C.addMan(kit, t, x, z, 0); m.ai = null; m.me = 1; S.my = m; S.me = t; S.aim = S.aim || { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } }; S.cls = 'inf'; S.model = kit; return m; }
console.log('-- the player as the bomber --');
for (const [id, k] of [['insBomber', 'man'], ['vbied', 'car'], ['vbiedPk', 'car'], ['svbied', 'truck']]) {
  const S = bare(3), x = S.W / 2, z = 0, m = me(S, 'insRifle', x, z);
  let o = m;
  if (id === 'insBomber') { m.def = $('KITS').insBomber; }
  else { o = C.addUnit($('TRNS')[id].kind, 2, x, z, id, false); o.ai = null; C.board(m, o, 0); }
  const drove = id === 'insBomber' || (S.my === o && m.in === o);
  o.bArm = S.t; $('bombGo')(o); C.run(.1);
  ok(drove && m.dead && o.dead && S.kc && S.kc.k === k && S.respawn >= KC.t, id + ': the bomber dies (' + (m.dead ? 'dead' : 'alive') + '), the kill cam on the ' + (S.kc && S.kc.k) + ' blast, respawn in ' + S.respawn.toFixed(1) + ' s');
  C.run(KC.t - .5); ok(S.my.dead && S.kc, '  still on the kill cam ' + KC.t.toFixed(1) + ' s on, not respawned');
  C.run(KC.after + 1.5); ok(!S.my.dead, '  then the player is back (' + (S.my.def && S.my.def.name) + ')');
}
console.log('-- the AI bomber in a car bomb --');
{ const S = bare(4), x = S.W / 2, m = C.addMan('insRifle', 2, x, 0, 0), v = C.addUnit('car', 2, x, 0, 'vbied', false); m.ai = null; v.ai = null; C.board(m, v, 0);
  v.bArm = S.t; $('bombGo')(v); C.run(.1); ok(m.dead && v.dead, 'the AI driver dies with the car (' + (m.dead ? 'dead' : 'alive') + ')'); }
console.log('-- the player as the victim --');
{ const S = bare(5), x = S.W / 2, v = C.addUnit('car', 2, x, 0, 'vbied', false); v.ai = null;
  const P = me(S, $('INF').modern[S.fac[0]][0], v.x + 8, v.z, 0); P.inv = 0; v.bArm = S.t; $('bombGo')(v); C.run(.1);
  ok(P.dead && S.kc && S.kc.k === 'car', 'a rifleman 8 m off the car bomb dies and sees the blast'); }
{ const S = bare(6), x = S.W / 2, P = me(S, $('INF').modern[S.fac[0]][0], x + 30, 0, 0);
  P.hp = 1; $('killMan')(P, null); ok(P.dead && !S.kc, 'a death with no bomb near: no kill cam'); }
console.log('-- cf-killcam-zoom2: every way the player dies in a bomb gets the kill cam, on the right blast --');
const TR = $('TRNS'), BB = $('BOMB'), rnd = Math.random;
// (addUnit puts a vehicle on the road: it is moved where it is wanted)
const put = (o, x, z) => { o.x = x; o.z = z; if (!o.man) o.y = $('hgt')(x, z); o.ai = null; return o; };
const bomb = (id, team, x, z) => { const o = put(id === 'insBomber' ? C.addMan(id, team, x, z, 0) : C.addUnit(TR[id].kind, team, x, z, id, false), x, z); o.bArm = $('S').t; return o; };
const back = (S, n) => { C.run(KC.t + KC.after + 1.5); ok(!S.my.dead, '  ' + n + ': back after it (' + (S.my.def && S.my.def.name) + ')'); };
// the victim on foot and the victim riding a vehicle the blast kills, for the vest, the car bomb and the truck bomb (the hp of the man is 1:
// what is checked is the camera, not how far each bomb kills)
for (const [id, k, d] of [['insBomber', 'man', 3], ['vbied', 'car', 8], ['svbied', 'truck', 10]]) {
  { const S = bare(5), x = S.W / 2, P = me(S, $('INF').modern[S.fac[0]][0], x + d, 0, 0); P.inv = 0; P.hp = 1;
    $('bombGo')(bomb(id, 2, x, 0)); C.run(.1);
    ok(P.dead && S.kc && S.kc.k === k && S.kc.r === BB[k].r, k + ': a rifleman ' + d + ' m off dies and sees the ' + (S.kc && S.kc.k) + ' blast (r ' + (S.kc && S.kc.r) + ')'); back(S, k); }
  { const S = bare(6), x = S.W / 2, P = me(S, $('INF').modern[S.fac[0]][0], x + d, 0, 0), u = put(C.addUnit('car', 0, x + d, 0, undefined, false), x + d, 0); C.board(P, u, 0);
    const rode = S.my === u; P.hp = 1; $('bombGo')(bomb(id, 2, x, 0)); C.run(.1);
    ok(rode && P.dead && S.my === P && S.kc && S.kc.k === k, k + ': the player driving a car ' + d + ' m off, killed in his seat (' + (P.dead ? 'dead' : 'alive') + ', the car ' + (u.dead ? 'destroyed' : 'standing') + '), goes down with the kill cam (' + (S.kc ? S.kc.k : 'none') + ')'); back(S, k); }
}
{ const S = bare(7), x = S.W / 2, P = me(S, $('INF').modern[S.fac[0]][0], x + 10, 0, 0); P.inv = 0; P.hp = 1;
  const o = put(C.addUnit(TR.svbied.kind, 2, x, 0, 'svbied', false), x, 0); o.svb = { x, z: 0, s: -1, look: 0 }; $('stkSvbGo')(o); C.run(.1);
  ok(P.dead && S.kc && S.kc.k === 'truck' && S.kc.r === $('STK').K.svbied.r, 'the strategic truck bomb (the general\'s): a rifleman 10 m off sees the truck blast'); }
// the truck bomb's blast sets off a car bomb beside it: the camera frames the truck's blast, not the later and smaller car's
{ const S = bare(3), x = S.W / 2, m = me(S, 'insRifle', x, 0), o = put(C.addUnit(TR.svbied.kind, 2, x, 0, 'svbied', false), x, 0); C.board(m, o, 0);
  const c = bomb('vbied', 0, x + 15, 0); c.bArm = S.t - 1; c.hp = 1; Math.random = () => 0; o.bArm = S.t; $('bombGo')(o); Math.random = rnd; C.run(.1);
  ok(c.bGone && m.dead && S.kc && S.kc.k === 'truck' && S.kc.r === BB.truck.r, 'the truck bomber with an enemy car bomb set off by his blast (' + (c.bGone ? 'went off' : 'did not go off') + '): the kill cam frames the truck (' + (S.kc && S.kc.k) + ')'); }
// a guest's bomb goes off on the host: he notes it himself (kcSelf, from vbMe and vestGo) and his death in it gets the kill cam
for (const [id, k] of [['insBomber', 'man'], ['vbied', 'car'], ['svbied', 'truck']]) {
  const S = bare(8), x = S.W / 2, m = me(S, 'insRifle', x, 0); let o = m;
  if (id === 'insBomber') m.def = $('KITS').insBomber; else { o = C.addUnit(TR[id].kind, 2, x, 0, id, false); o.ai = null; C.board(m, o, 0); }
  $('kcSelf')(o); C.run(.3); m.hp = 1; if (o !== m) { o.hp = 1; $('ruin')(o, 1e4, null); } else $('killMan')(m, null); C.run(.1);
  ok(m.dead && S.kc && S.kc.k === k, k + ': a guest who set his bomb off gets the kill cam on it (' + (S.kc && S.kc.k) + ')');
}
console.log('-- the kill cam zooms out from the fireball to the whole blast radius --');
{ const Z = $('kcZoom'), B = $('BOMB');
  for (const k of ['man', 'car', 'truck']) {
    const r = B[k].r, d = [0, .5, 1, 2, KC.zt, KC.t].map(s => Z(r, s));
    ok(d.every((q, i) => !i || q.D >= d[i - 1].D && q.h >= d[i - 1].h) && d[0].D < r && d[4].D > 2 * r && d[5].D === d[4].D,
      k + ' (r ' + r + ' m): ' + d.map(q => q.D.toFixed(0)).join(' → ') + ' m out, ' + d.map(q => q.h.toFixed(0)).join(' → ') + ' m up, then held');
  }
  ok(Z(B.truck.r, KC.t).D > Z(B.car.r, KC.t).D && Z(B.car.r, KC.t).D > Z(B.man.r, KC.t).D, 'the truck bomb pulls back farthest, the vest least');
  ok(KC.zt < KC.t, 'the zoom ends (' + KC.zt + ' s) before the kill cam does (' + KC.t + ' s)'); }
done();
