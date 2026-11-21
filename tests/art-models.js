'use strict';
/* the artillery's models (ARTB, cf-pol-modelos) against the artillery's numbers: every gun and rocket launcher has a model of its own, made of
   pieces filed under the damage parts damageLook darkens (hull, trackL, trackR, engine, gun, ammo), each side's wheels and tracks on its
   side, nothing under the ground or far outside the vehicle's length and width, and the mouth of the gun or of the tubes where the sim's
   muzzle is (d.bl along the turret, the turret at d.mh). The builders live in the 3D part of the page, which the harness does not load:
   they run here against a kit that records each piece's box instead of making meshes */
const H = require('./harness'), { ok, done } = H, { blocks, kit, node } = require('./vk-kit');
console.log('page: ' + H.PAGE);
const ARTB = blocks('ARTB');
if (!ARTB) { console.log('no artillery models (ARTB): a page before them'); process.exit(0); }
const sim = H.load(), ARTS = sim.$('ARTS'), GS = sim.$('GS');
const PARTS = ['hull', 'trackL', 'trackR', 'engine', 'gun', 'ammo'];

console.log('-- every gun and launcher --');
ok(Object.keys(ARTS).every(id => ARTB[id]), 'a model for each: ' + Object.keys(ARTS).join(' '));

for (const id of Object.keys(ARTS)) {
  const d = ARTS[id], [tl, tw, th, tx] = d.t, K = kit(), g = node('g'), tur = node('tur', tx, .5 + d.hh + th / 2), gun = node('gun', -tl / 2, 0);
  ARTB[id](K, g, tur, gun, { P: 1, P2: 2, dk: 3, glass: 4, rk: 5, wh: 6, tl, tw, th, g: d.g, hh: d.hh });
  const P = K.P, at = p => p.to === g ? [p.x, p.y, p.z] : p.to === tur ? [tur.position.x + p.x, tur.position.y + p.y, p.z] : [tur.position.x + gun.position.x + p.x, tur.position.y + gun.position.y + p.y, p.z];
  console.log(id + ' (' + d.name + '): ' + P.length + ' pieces');
  const miss = PARTS.filter(k => !P.some(p => p.pid === k));
  ok(!miss.length && P.every(p => PARTS.includes(p.pid)), 'every piece under a damage part, and all of them there' + (miss.length ? ' (none for ' + miss.join(', ') + ')' : ''));
  ok(P.filter(p => p.pid === 'trackL').every(p => p.z < 0) && P.filter(p => p.pid === 'trackR').every(p => p.z > 0), 'the left wheels and tracks on the left, the right ones on the right');
  ok(P.filter(p => p.to === g).every(p => p.y - p.hy > -.02), 'nothing of the hull under the ground');
  const out = P.filter(p => { const [x, , z] = at(p); return (p.to !== gun && Math.abs(x) + p.hx > d.l / 2 + .3) || (p.to === g && Math.abs(z) + p.hz > d.w / 2 + .3); });
  ok(!out.length, 'inside its length (' + d.l + ', the barrel may reach past it) and the hull inside its width (' + d.w + ')' + (out.length ? ': ' + out.map(p => p.pid + '@' + at(p).map(v => v.toFixed(2))).join(' ') : ''));
  const mouth = Math.max(...P.filter(p => p.to === gun).map(p => gun.position.x + p.x + p.hx)), want = d.bl / GS - tx;
  ok(Math.abs(mouth - want) < .35, 'the mouth ' + mouth.toFixed(2) + ' along the turret, the sim\'s muzzle ' + want.toFixed(2) + ' (d.bl)');
  ok(Math.abs(1.5 + GS * tur.position.y - d.mh) < .01, 'the turret at the sim\'s muzzle height (d.mh ' + d.mh.toFixed(2) + ')');
}
done();
