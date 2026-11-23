'use strict';
/* cf-gbu-lock: a guided bomb's lock (GBU-12 on an A-10). LO.lockBomb takes the nearest target in the cone and in LO.reach; a target only beyond the reach gives LOCK.far (FORA DE
   ALCANCE) and no lock; lower/slower changes the reach; a hill on the line gives LOCK.blk; the player's LO.seek and the AI's LO.aim agree.
   node tests/gbu-lock.js */
const { load, ok, done } = require('./harness.js');
const C = load({ seed: 11 }), $ = C.$, LO = $('LO'), LOCK = $('LOCK');
const S = C.sandbox('modern');
/* an open stretch: find a strip of 9 km along +x with flat-ish ground */
let X0 = null, Z0 = 0;
for (let z = -2000; z <= 2000 && X0 === null; z += 250) for (let x = 1500; x < S.W - 9000 && X0 === null; x += 500) {
  let h = C.hgt(x, z), good = true; for (let k = 0; k <= 9000; k += 250) { const g = C.hgt(x + k, z); if (Math.abs(g - h) > 80 || g < S.T.WL + 2) { good = false; break; } }
  if (good) { X0 = x; Z0 = z; }
}
console.log('strip at', X0, Z0);
const mk = (alt, spd) => {
  const p = C.addPlane('a10', 0, X0, C.hgt(X0, Z0) + alt, Z0, 0, false, 'cas', $('RACKS').a10.sets['Ataque ao solo']);
  const L = Math.hypot(1, .35); p.f = { x: 1 / L, y: -.35 / L, z: 0 }; p.v = { x: spd, y: 0, z: 0 }; p.inv = 1; return p;
};
const p = mk(300, 110), o = p.def.ord.find(o => o && o.gd);
ok(!!(o && o.gd) && /GBU/.test(o.name || ''), 'A-10 Ataque ao solo carries ' + (o && o.name) + ', a guided bomb (GUIDE.rng ' + $('GUIDE').rng + ' m seeker)');
const R = LO.reach(p, o);
console.log('reach at 300 m, 110 m/s:', R.toFixed(0), 'm');
const put = d => { const u = C.addUnit('truck', 1, X0 + d, Z0 + (d % 7) * 10, null, true); u.inv = 1; return u; };
/* three targets in the cone: two inside the reach, one beyond */
const dIn1 = Math.round(R * .4), dIn2 = Math.round(R * .8), dOut = Math.round(Math.min(R * 1.6, 5500));
const a = put(dIn2), b = put(dOut), c = put(dIn1);
const offs = [a, b, c].map(u => Math.acos((((u.x - p.x) * p.f.x + (u.y - p.y) * p.f.y) / Math.hypot(u.x - p.x, u.y - p.y, u.z - p.z))).toFixed(2));
console.log('targets at', dIn1, dIn2, dOut, 'm; off-axis rad', offs.join(' '));
let t = LO.lockBomb(p, o);
ok(t === c && !LOCK.far, 'three targets (' + dIn1 + ', ' + dIn2 + ', ' + dOut + ' m): the lock is the nearest in reach (' + (t ? Math.round(t.x - X0) : 'none') + ' m)');
const seekP = () => { const P0 = S.my; S.my = p; const r = LO.seek(p, 'agm'); S.my = P0; return r; };
ok(seekP() === c, 'the player\'s LO.seek gives the same lock');
c.dead = true; t = LO.lockBomb(p, o);
ok(t === a, 'the nearest gone: the next nearest in reach (' + (t ? Math.round(t.x - X0) : 'none') + ' m)');
a.dead = true; t = LO.lockBomb(p, o);
ok(t === null && LOCK.far === b, 'only one beyond the reach: no lock, LOCK.far set (FORA DE ALCANCE)');
/* the AI: its own target beyond the reach is not kept; with nothing in reach, the point under the nose */
p.ai = true; p.tgt = b;
const g = LO.aim(p);
ok(g !== b && g && g.kind === 'pt', 'AI with its target beyond the reach: drops to the ground point under the nose (' + (g && (g.kind || 'unit')) + ')');
a.dead = false; const g2 = LO.aim(p);
ok(g2 === a, 'AI with its target beyond the reach and another in it: takes the one in reach');
p.tgt = a; ok(LO.aim(p) === a, 'AI with its target in reach: keeps it');
p.ai = false; p.tgt = null; a.dead = true;
/* higher and faster: the reach grows past the far one */
const p2 = mk(1500, 160), R2 = LO.reach(p2, o);
console.log('reach at 1500 m, 160 m/s:', R2.toFixed(0), 'm; at 300 m, 110 m/s:', LO.reach(mk(300, 110), o).toFixed(0), 'm');
const L2 = Math.hypot(b.x - p2.x, b.y - p2.y, b.z - p2.z); p2.f = { x: (b.x - p2.x) / L2, y: (b.y - p2.y) / L2, z: (b.z - p2.z) / L2 };
t = LO.lockBomb(p2, o);
ok(R2 > dOut ? t === b : t === null, 'higher and faster (reach ' + R2.toFixed(0) + ' m): the far one ' + (R2 > dOut ? 'is locked' : 'stays out'));
/* a hill on the line: LOCK.blk, no lock */
for (const q of S.planes) q.dead = true;
const p3 = mk(300, 110); b.dead = true; a.dead = false;
const L3 = Math.hypot(a.x - p3.x, a.y - p3.y, a.z - p3.z); p3.f = { x: (a.x - p3.x) / L3, y: (a.y - p3.y) / L3, z: (a.z - p3.z) / L3 };
ok(LO.lockBomb(p3, o) === a, 'a clear line: locked');
C.H0 = $('hgt'); C.HX = a.x - 60; C.HZ = a.z; $('hgt = (x, z) => H0(x, z) + 60 * Math.exp(-((x - HX) * (x - HX) + (z - HZ) * (z - HZ)) / 800)');
a.y = C.H0(a.x, a.z) + 1;
t = LO.lockBomb(p3, o);
ok(t === null && LOCK.blk === a && !LOCK.far, 'a hill in front of it: no lock, LOCK.blk (SEM LINHA DE VISADA)');
done();
