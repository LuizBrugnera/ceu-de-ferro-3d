'use strict';
/* the anti-aircraft vehicles' models (AAB, cf-pol-modelos) against their hit boxes (AAGEO): every AA vehicle has a model of its own, its
   pieces filed under the damage parts damageLook darkens (hull, wheels, engine, weapon, sensor, and the modern ones' apu), nothing of the
   hull under the ground or outside the vehicle's box (env), and the guns, the launchers and the radars where their hit boxes are (gunL,
   gunR, radarS, sightW), so a shot that hits the guns is seen hitting the guns. Run against a kit that records each piece (tests/vk-kit.js) */
const H = require('./harness'), { ok, done } = H, { blocks, kit, node, at } = require('./vk-kit');
console.log('page: ' + H.PAGE);
const AAB = blocks('AAB');
if (!AAB) { console.log('no anti-aircraft models (AAB): a page before them'); process.exit(0); }
const sim = H.load(), AAS = sim.$('AAS'), AAGEO = sim.$('AAGEO');
const near = (p, b, e) => Math.abs(p[0] - b[0]) <= b[3] + e && Math.abs(p[1] - b[1]) <= b[4] + e && Math.abs(p[2] - b[2]) <= b[5] + e;

console.log('-- every anti-aircraft vehicle --');
ok(Object.keys(AAS).every(id => AAB[id]), 'a model for each: ' + Object.keys(AAS).join(' '));
for (const id of Object.keys(AAS)) {
  const d = AAS[id], G = AAGEO[d.era], mod = d.era === 'modern', K = kit(), g = node('g'), tur = mod ? node('tur', -1.3, 1.6) : node('tur', 0, 2.3), gun = node('gun', 0, mod ? 1 : .6);
  AAB[id](K, g, tur, gun, { P: 1, P2: 2, dk: 3, glass: 4 });
  const P = K.P, W = p => at(p, g, tur, gun), want = ['hull', 'wheels', 'engine', 'weapon', 'sensor'].concat(mod ? ['apu'] : []);
  console.log(id + ' (' + d.name + '): ' + P.length + ' pieces');
  const miss = want.filter(k => !P.some(p => p.pid === k));
  ok(!miss.length && P.every(p => want.includes(p.pid)), 'every piece under a damage part, and all of them there' + (miss.length ? ' (none for ' + miss.join(', ') + ')' : ''));
  ok(P.filter(p => p.to === g).every(p => p.y - p.hy > -.02), 'nothing of the hull under the ground');
  const E = G.env, out = P.filter(p => { const [x, , z] = W(p); return (p.to !== gun && Math.abs(x) + p.hx > E[3] + .3) || (p.to === g && Math.abs(z) + p.hz > E[5] + .3); });
  ok(!out.length, 'inside the vehicle\'s box (env: ' + (E[3] * 2) + ' by ' + (E[5] * 2) + '), the barrels may reach past it' + (out.length ? ': ' + out.map(p => p.pid + '@' + W(p).map(v => v.toFixed(2))).join(' ') : ''));
  /* the hit boxes of the turret's parts are in the turret's frame, from its pivot (tx) */
  for (const [k, pid] of [['gunL', 'weapon'], ['gunR', 'weapon'], ['radarS', 'sensor'], ['sightW', 'sensor']]) {
    const b = G.box[k]; if (!b) continue;
    const B = [b[0] + G.tx, b[1], b[2], b[3], b[4], b[5]], hit = P.filter(p => p.pid === pid && p.to !== g && near(W(p), B, Math.max(p.hx, p.hy, p.hz) + .1));
    ok(hit.length > 0, 'the ' + pid + ' drawn where the hit box ' + k + ' is (' + B.slice(0, 3).join(', ') + ')');
  }
  ok(Math.max(...P.filter(p => p.pid === 'weapon').map(p => W(p)[0] + p.hx)) > tur.position.x + 1.5, 'the guns point ahead of the turret');
}
done();
