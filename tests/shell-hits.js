'use strict';
/* a tank's main gun against everything on the ground (the bug "os tiros do canhão do tanque atravessam a infantaria e alguns veículos"):
   armour-piercing and high-explosive rounds aimed at the middle of a soldier (standing, crouching, prone), a car, a truck, wheeled armour,
   an anti-aircraft vehicle, a self-propelled gun, another tank and a helicopter on the ground, at 150, 600 and 1500 m, in both eras, at 60
   and at 20 frames a second. Every one must be struck. The ground is made flat and the world's objects are taken away, so that only the
   hit test is measured: a round that reaches its target must hit it.
   node tests/shell-hits.js (PAGE=<page>) */
const H = require('./harness.js'), { ok, done } = H;
const C = H.load({ seed: 5 }), $ = C.$, TANKS = $('TANKS'), INF = $('INF'), GR = $('GR'), HELIS = $('HELIS'), ARTS = $('ARTS');
const GUN = { ww2: 'sherman', modern: 'abrams' }, FOE = { ww2: 'tiger', modern: 't90' };
let Y = 0;
const flat = era => {
  const S = C.sandbox(era); Y = C.hgt(S.base[0].x, S.base[0].z);
  $('hgt = (x, z) => ' + Y); S.T.grid.f.fill(0);   // a flat, empty field
  return S;
};
const targets = era => {
  const S = $('S'), sd = S.E.sides[S.fac[1]];
  return [['man', 0], ['man', 1], ['man', 2], ['car'], ['truck'], ...(era === 'modern' ? [['lav']] : []), ['aa', sd.aa], ['art', Object.keys(ARTS).find(k => ARTS[k].arms.length)], ['tank', FOE[era]],
    ['heli', Object.keys(HELIS).find(k => HELIS[k].era === era) || Object.keys(HELIS)[0]]];
};
const NAME = ['soldier standing', 'soldier crouching', 'soldier prone'];
for (const era of ['ww2', 'modern']) for (const fps of [60, 20]) for (const load of ['AP', 'HE']) for (const R of [150, 600, 1500]) {
  const miss = [];
  flat(era);
  for (const [kind, id] of targets(era)) {
    const N = 4; let hits = 0;
    for (let i = 0; i < N; i++) {
      const S = flat(era), X0 = S.base[0].x - 200 - R, Z0 = S.base[0].z, tx = X0 + R, tz = Z0 + (i - 1.5) * (kind === 'man' ? .1 : .2);   // a soldier within .15 m of his middle: his body is as wide as drawn (cf-hitbox, MHIT), no longer a cylinder 1.4 m across
      const sh = C.addVehicle('tank', GUN[era], 0, X0, Z0, 0); sh.inv = 0; sh.ai = null;
      let t, ty;
      if (kind === 'man') { t = C.addMan(INF[era][1][0], 1, tx, tz, Math.PI); t.ai = null; t.st = t.ctl.st = id; ty = t.y + [1.1, .8, .62][id]; }   // prone: just over the half metre where a round counts as in the ground
      else if (kind === 'heli') { t = C.addHeli(id, 1, tx, Y, tz, Math.PI / 2, null); t.land = true; ty = t.y + 1.5; }
      else { t = C.addVehicle(kind, id, 1, tx, tz, i % 2 ? Math.PI / 2 : Math.PI); t.ai = null; ty = t.y + 1.2; }   // broadside and head on
      t.inv = 0; const hp0 = t.hp;
      const A = TANKS[GUN[era]].arms[0], W = load === 'HE' ? A.hv : A, y0 = Y + 2.9, T = R / W.spd, vy = (ty - y0 + .5 * GR * T * T) / T;
      C.shell(sh, W, X0, y0, Z0, W.spd, vy, 0); C.run(T + .5, null, 1 / fps);
      if (t.dead || t.hp < hp0) hits++;
    }
    if (hits < N) miss.push((kind === 'man' ? NAME[id] : kind) + ' ' + hits + '/' + N);
  }
  ok(!miss.length, era + ', ' + load + ' at ' + R + ' m, ' + fps + ' fps: every target struck' + (miss.length ? ' (missed: ' + miss.join(', ') + ')' : ''));
}

console.log('-- a soldier in the way of a round aimed at a truck behind him --');
for (const era of ['ww2', 'modern']) {
  const S = flat(era), X0 = S.base[0].x - 800, Z0 = S.base[0].z;
  const sh = C.addVehicle('tank', GUN[era], 0, X0, Z0, 0); sh.inv = 0; sh.ai = null;
  const m = C.addMan(INF[era][1][0], 1, X0 + 300, Z0, Math.PI); m.ai = null; m.inv = 0;
  const tr = C.addVehicle('truck', null, 1, X0 + 400, Z0, Math.PI / 2); tr.ai = null; tr.inv = 0;
  const W = TANKS[GUN[era]].arms[0], y0 = Y + 2.9, T = 400 / W.spd, vy = (Y + 1.2 - y0 + .5 * GR * T * T) / T;
  C.shell(sh, W, X0, y0, Z0, W.spd, vy, 0); C.run(T + .5);
  ok(m.dead && tr.hp === tr.max, era + ': the soldier takes the round, the truck behind him does not');
}
done();
