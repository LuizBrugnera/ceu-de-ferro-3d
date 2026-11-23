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
done();
