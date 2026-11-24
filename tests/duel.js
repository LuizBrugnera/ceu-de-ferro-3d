'use strict';
/* time-to-kill sanity, the same script for any page: hits to kill by weapon and aspect, and a few AI duels.
   PAGE=<page> node tests/duel.js (TRIALS=8) */
const { load } = require('./harness.js');
const C = load({ seed: +process.env.SEED || 5 }), $ = C.$, HK = $('HK'), TR = +process.env.TRIALS || 8, f1 = v => v.toFixed(1), VLIFT = (() => { try { return $('VLIFT'); } catch (e) { return 1.5; } })();   // the vehicle frame over the ground (1.5 before cf-veiculos)
const TANKS = $('TANKS'), PLANES = $('PLANES'), ARMS = $('ARMS');
let S;
const mean = l => l.reduce((a, b) => a + b, 0) / l.length, rnd = (a, b) => a + Math.random() * (b - a);
const dmgOf = id => { const a = TANKS[id].arm[0]; return Object.assign({}, ARMS[a[0]], a[1]).dmg; };
function shells(sh, tg, ang) {
  const n = [];
  for (let t = 0; t < TR * 5; t++) {
    S = C.sandbox(TANKS[tg].era || (['abrams', 'leo2', 't90', 't72'].includes(tg) ? 'modern' : 'ww2')); const u = C.addVehicle('tank', tg, 1, 4000, 0, 0); u.inv = 0; u.ai = null;
    const by = { x: u.x + Math.cos(ang) * 700, y: u.y, z: u.z - Math.sin(ang) * 700, team: 0 }; let k = 0;
    while (!u.dead && k < 40) { k++; S.t += 5; const a = ang + rnd(-.25, .25), y = u.y + VLIFT + rnd(.6, 2.6); C.impact(u, HK.shell, dmgOf(sh), by, u.x + Math.cos(a) * 9, y, u.z - Math.sin(a) * 9 + rnd(-1, 1), -Math.cos(a), 0, Math.sin(a)); }
    n.push(k);
  }
  return f1(mean(n));
}
function bullets(gun, tg, era) {
  const n = [];
  for (let t = 0; t < TR * 3; t++) {
    S = C.sandbox(era); const p = C.addPlane(tg, 1, 3000, 900, 0, 0, false); p.inv = 0; let k = 0;
    while (!p.dead && k < 400) { k++; S.t += .1; C.impact(p, HK.bullet, gun.dmg, { x: p.x - 300, y: p.y, z: p.z, team: 0 }, p.x - p.f.x * 9 + rnd(-.5, .5), p.y + rnd(-1.2, 1.2), p.z + rnd(-5, 5), 1, rnd(-.05, .05), rnd(-.1, .1)); if (p.burn) C.burn(p, .1); if (C.ail && !p.dead) C.ail(p, .1); }
    n.push(k);
  }
  return f1(mean(n));
}
function duel(era, a, b, d) {
  const t = [], w = [0, 0, 0];
  for (let i = 0; i < TR; i++) {
    S = C.sandbox(era); const u = C.addUnit('tank', 0, 5000, 0, a, true), v = C.addUnit('tank', 1, 5000 + d, 0, b, true); u.inv = v.inv = 0; u.h = 0; v.h = Math.PI; let s = 0;
    C.run(240, dt => { s += dt; return !(u.dead || v.dead); });
    t.push(s); w[u.dead && v.dead ? 2 : u.dead ? 1 : v.dead ? 0 : 2]++;
  }
  return f1(mean(t)) + ' s (' + a + ' ' + w[0] + ', ' + b + ' ' + w[1] + ', none ' + w[2] + ')';
}
function air(era, a, b) {
  const t = []; let none = 0;
  for (let i = 0; i < TR; i++) {
    S = C.sandbox(era); const p = C.addPlane(a, 0, 3000, 1500, 0, 0, true, 'fighter'), q = C.addPlane(b, 1, 6000, 1500, 0, Math.PI, true, 'fighter'); p.inv = q.inv = 0; let s = 0;
    C.run(300, dt => { s += dt; return !(p.dead || q.dead); }); if (!p.dead && !q.dead) none++; t.push(s);
  }
  return f1(mean(t)) + ' s (' + none + ' of ' + TR + ' undecided at 300 s)';
}
console.log('shells to kill, 700 m, aimed at the middle with scatter (front / side / rear)');
for (const [a, b] of [['pz4', 'sherman'], ['sherman', 'tiger'], ['tiger', 't34'], ['t90', 'abrams'], ['abrams', 't72']]) console.log('   ' + a + ' on ' + b + ': ' + shells(a, b, 0) + ' / ' + shells(a, b, Math.PI / 2) + ' / ' + shells(a, b, Math.PI));
console.log('cannon rounds from behind to bring a plane down');
for (const [g, t, era] of [['spit', 'bf109', 'ww2'], ['bf109', 'p51', 'ww2'], ['f22', 'su57', 'modern']]) { if (!PLANES[g] || !PLANES[t]) continue; console.log('   ' + PLANES[g].gun.name + ' on ' + PLANES[t].name + ': ' + bullets(PLANES[g].gun, t, era)); }
if (!process.env.NOAI) {
  console.log('AI tank duels, head on');
  for (const [era, a, b, d] of [['ww2', 'sherman', 'pz4', 600], ['ww2', 't34', 'tiger', 500], ['modern', 'abrams', 't90', 600], ['modern', 'leo2', 't72', 300]]) console.log('   ' + era + ' at ' + d + ' m: ' + duel(era, a, b, d));
  if (process.env.NOAIR) process.exit(0);
  console.log('AI fighter duels, from 3 km head on');
  const ids = Object.keys(PLANES), w = ids.filter(i => PLANES[i].prop), j = ids.filter(i => !PLANES[i].prop);
  console.log('   ' + w[1] + ' v ' + w[2] + ': ' + air('ww2', w[1], w[2])); console.log('   ' + j[0] + ' v ' + j[j.length - 1] + ': ' + air('modern', j[0], j[j.length - 1]));
}
