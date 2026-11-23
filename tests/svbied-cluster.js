'use strict';
/* The truck bomb's heavier burst and its cluster (cf-svbied-buff): the charge is 2350 over 155 m for the player's truck (BOMB.truck) and the
   strategic one (STK.K.svbied) alike; a rifleman 140 m off (outside the old 120 m) is hurt by the main burst; after it, SVB.c.n submunitions
   fly to a ring of 0.55 to 1.7 times the radius and go off small there within SVB.c.T s, by the truck and its side; riflemen standing where
   they land are hit. The strategic truck (stkSvbGo) throws the same cluster; a guest (online, not the host) throws none. A few seconds */
const H = require('./harness'), { ok, done } = H, C = H.load({ seed: 11, mapv: 9 }), $ = C.$;
function bare(seed) {
  C.seed(seed); const S = C.watch('modern', { n: 3 }); S.demo = false;
  for (const q of S.squads.slice()) for (const m of q.men) m.gone = true;
  S.squads.length = 0; S.men.length = 0; S.units.length = 0; S.planes.length = 0; if (S.civs) S.civs.length = 0;
  C.plan = () => {}; C.director = () => {};
  return S;
}
const K = $('STK').K.svbied, B = $('BOMB').truck, SV = $('SVB').c;
console.log('-- the numbers --');
ok(K.dmg === 2350 && K.r === 155 && B.dmg === K.dmg && B.r === K.r, 'the truck bomb: ' + K.dmg + ' over ' + K.r + ' m, the player\'s (BOMB.truck) the same: ' + B.dmg + ' over ' + B.r + ' m (was 1800 over 120)');
ok($('BOMB').car.dmg === 1400 && $('BOMB').car.r === 70, 'the car and pickup bomb untouched: ' + $('BOMB').car.dmg + ' over ' + $('BOMB').car.r + ' m');

console.log('-- the player\'s truck: the burst and the cluster --');
{ const S = bare(5), x = S.W / 2, z = 0, inf = $('INF').modern[S.fac[0]][0];
  const v = C.addUnit('truck', 2, x, z, 'svbied', false, 0, 0); v.rail = false; v.x = x; v.z = z; v.y = $('hgt')(x, z);
  const far = C.addMan(inf, 0, x + 140, z, 0); far.ai = null;
  const L = [], ex = [];
  C.$('explode = (g => (...a) => { globalThis.__ex && globalThis.__ex.push(a); return g(...a); })(explode)'); C.__ex = ex;
  $('bombGo')(v);
  ok(v.dead && (far.dead || far.hp < far.max), 'the rifleman 140 m off is hit by the main burst (' + (far.dead ? 'dead' : Math.round(far.hp) + '/' + far.max) + ')');
  const Q = (S.svbC || []).slice();
  const ds = Q.map(o => Math.hypot(o.tx - x, o.tz - z)), Ts = Q.map(o => o.T);
  ok(Q.length === SV.n, SV.n + ' submunitions out (' + Q.length + ')');
  ok(ds.every(d => d >= K.r * SV.d[0] - 1 && d <= K.r * SV.d[1] + 1), 'they land on the ring ' + Math.round(Math.min(...ds)) + '–' + Math.round(Math.max(...ds)) + ' m off (' + Math.round(K.r * SV.d[0]) + '–' + Math.round(K.r * SV.d[1]) + ')');
  ok(Ts.every(t => t >= SV.T[0] * .85 - .01 && t <= SV.T[1] + .01) && Math.max(...Ts) - Math.min(...Ts) > .8, 'staggered: they go off from ' + Math.min(...Ts).toFixed(2) + ' to ' + Math.max(...Ts).toFixed(2) + ' s');
  const men = Q.slice(0, 4).map(o => { const m = C.addMan(inf, 0, o.tx + 2, o.tz, 0); m.ai = null; return m; }); L.push(...men);
  ex.length = 0;
  let apex = 0; C.run(SV.T[1] + .3, () => { for (const o of S.svbC || []) apex = Math.max(apex, o.y - o.ty); });
  const sub = ex.filter(a => a[3] === SV.r);
  ok(!(S.svbC || []).length && sub.length === SV.n, 'all ' + sub.length + ' small bursts went off (r ' + SV.r + ' m, dmg ' + SV.dmg + '), the arcs up to ' + Math.round(apex) + ' m over the ground');
  ok(sub.every(a => a[5] === v && a[6] === 2), 'each by the truck and its side (score and log)');
  ok(men.every(m => m.dead || m.hp < m.max), 'the riflemen 2 m from where 4 of them landed are hit: ' + men.map(m => (m.dead ? 'dead' : Math.round(m.hp))).join(', '));
  C.__ex = null; }

console.log('-- the strategic truck --');
{ const S = bare(6), x = S.W / 2, z = 0;
  const u = C.addUnit('truck', 2, x, z, 'svbied', false, 0, 0); u.rail = false; u.x = x; u.z = z; u.y = $('hgt')(x, z); u.svb = { s: 0, x, z, ff: false, T: S.t, trip: 0, go: 0, look: 0 };
  $('stkSvbGo')(u);
  ok(u.dead && (S.svbC || []).length === SV.n, 'stkSvbGo: the truck is spent and ' + (S.svbC || []).length + ' submunitions fly'); }

console.log('-- a guest --');
{ const S = bare(7); S.net = true; S.host = false;
  $('svbBurst')(S.W / 2, 5, 0, K.r, null, 2);
  ok(!(S.svbC || []).length, 'a guest throws no cluster (the host does)'); S.net = false; }
done();
