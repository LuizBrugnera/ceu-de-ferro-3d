'use strict';
/* a hand grenade's burst hurts whoever is in it, its thrower too. explode spares the shooter (safe: o === by), the rule for a round, a rocket or a
   bomb; a hand grenade (nadeStep) bursts with own, so its thrower is not spared, whatever friendly fire is set to; a friend near it follows
   friendly fire as before; other bursts still spare their shooter. Every wrapper of explode passes own on (the ones with named parameters dropped it).
   And it bursts once: a step slower than CLK.h runs stepShots twice, and a grenade gone in the first hop burst again in the second.
   node tests/granada-dano.js */
const fs = require('fs'), H = require('./harness.js'), { load, ok, done } = H;
const C = load({ seed: 9 }), $ = C.$, MAN = $('MAN'), INF = $('INF'), GRN = $('GRN'), FF = $('FF');
const S = C.sandbox('modern'); S.over = false; S.waveTimer = S.planT = 1e9;
let at = null;   // level open ground, 60 m of it toward +x
for (let x = 3000; x < 9000 && !at; x += 150) for (let z = -1500; z < 1500 && !at; z += 150) {
  let flat = true; for (let k = 0; k <= 60; k += 5) if (Math.abs(C.hgt(x + k, z) - C.hgt(x, z)) > 1.5 || C.hgt(x + k, z) <= S.T.WL + 1) flat = false;
  if (flat && !C.near(x + 30, z, 40).length) at = { x, z };
}
const man = (team, dx, dz) => { const m = C.addMan(INF.modern[team][0], team, at.x + dx, at.z + dz, 0); m.ai = null; m.x = at.x + dx; m.z = at.z + dz; m.y = C.hgt(m.x, m.z); m.v = { x: 0, y: 0, z: 0 }; return m; };
const clear = () => { for (const m of S.men) m.dead = true; S.men.length = 0; S.bombs.length = 0; };
/* a grenade of m lying at dx dz, its fuse burnt: the real path, nadeStep and every wrapper of explode */
const burst = (m, dx, dz) => { const x = at.x + dx, z = at.z + dz, b = C.lobbed(m, 'nade', MAN.nade, x, C.hgt(x, z) + GRN.r, z, 0, 0, 0); b.fz = S.t; C.run(2 / 60); return b; };
const P0 = man(0, 0, 0); P0.me = 1; S.my = P0; S.me = 0; S.input = {}; S.aim = { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } }; C.run(.5); clear();

/* the thrower at his own grenade: killed */
let T = man(0, 0, 0), E = man(1, 4, 0); burst(T, 1, 0);
ok(T.dead, 'a grenade bursting 1 m from its thrower kills him (hp ' + T.hp.toFixed(1) + ')');
ok(E.hp < MAN.hp, 'and the enemy 3 m from it is hurt (hp ' + E.hp.toFixed(1) + ' of ' + MAN.hp + ')');
clear();
/* farther off, hurt but alive, out of its radius untouched */
T = man(0, 0, 0); const T2 = man(0, 40, 0); burst(T, 8.5, 0); burst(T2, 40 + MAN.nade.r + 1, 0);
ok(!T.dead && T.hp < MAN.hp, 'at 8.5 m he is hurt, not killed (hp ' + T.hp.toFixed(1) + ')');
ok(T2.hp === MAN.hp, 'beyond its radius (' + MAN.nade.r + ' m) untouched');
clear();
/* a friend near it: friendly fire's rule, as before */
FF.on = 0; T = man(0, 0, 0); let F = man(0, 2, 0); burst(T, 20, 0); burst(T, 3, 0);
ok(F.hp === MAN.hp, 'friendly fire off: a friend 1 m from it is spared (hp ' + F.hp.toFixed(1) + ')');
clear(); FF.on = 1; T = man(0, 0, 0); F = man(0, 20, 0); burst(T, 21, 0);
ok(F.hp < MAN.hp, 'friendly fire on: he is hurt (hp ' + F.hp.toFixed(1) + ')');
FF.on = 0; clear();
/* the player's grenade held to the end of its fuse: it leaves the hand by itself with MAN.nade.safe s left and he is still in its burst */
const P = man(0, 0, 0); P.me = 1; P.nades = 9; S.my = P; S.cls = 'inf'; S.input = {}; S.aim = { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } };
const I = S.input; let far = 0; I.flare = true; C.run(GRN.fuse + .5, () => { for (const b of S.bombs) if (b.k === 'nade' && b.by === P) far = Math.hypot(b.x - P.x, b.y - P.y, b.z - P.z); }); I.flare = false; C.run(.2);
ok(far < MAN.nade.r && P.hp < MAN.hp, 'cooked to the end, it bursts ' + far.toFixed(1) + ' m from the player and hurts him (hp ' + P.hp.toFixed(1) + ')');
clear();
/* other bursts (a rocket, a shell, a bomb) still spare their shooter */
T = man(0, 0, 0); C.explode(at.x + 1, C.hgt(at.x, at.z) + .3, at.z, MAN.nade.r, MAN.nade.dmg, T, T.team, true, 1, 0);
ok(T.hp === MAN.hp, 'another burst by him at 1 m spares him, as before');
clear();
/* a slow step (1/30 s, two hops of stepShots, CLK.h): it bursts once, not once a hop */
T = man(0, 0, 0); E = man(1, 30, 0); let n = 0; C.__ex0 = C.$('explode'); C.$('explode = (f => (...a) => { globalThis.__nb = (globalThis.__nb || 0) + 1; return f(...a); })(explode)');
const x2 = at.x + 30.5, b2 = C.lobbed(T, 'nade', MAN.nade, x2, C.hgt(x2, at.z) + GRN.r, at.z, 0, 0, 0); b2.fz = S.t + .1; C.run(.5, null, 1 / 30); n = C.__nb || 0;
ok(n === 1, 'stepped at 1/30 s, it bursts ' + n + ' time(s)');
C.$('explode = globalThis.__ex0'); clear();
/* every wrapper of explode passes own on */
const html = fs.readFileSync(H.PAGE, 'utf8'), wr = html.match(/^explode = \([fg] => \([^)]*\)/gm) || [];
const lost = wr.filter(w => !/\.\.\.a\)$|, own\)$/.test(w));
ok(wr.length > 3 && !lost.length, wr.length + ' wrappers of explode, each passes own on' + (lost.length ? ': not ' + lost.join(' | ') : ''));
done();
