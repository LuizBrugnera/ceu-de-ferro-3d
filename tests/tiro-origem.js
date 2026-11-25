'use strict';
/* cf-tiro-origem: a soldier's round leaves his weapon and strikes what is close. It started a metre along the aim, past a man touching
   him; a vehicle was tested only where each 13 m hop of the round ended, so a truck a few metres off was never hit; a round into the
   ground went on to the end of its hop (what stood behind the bank was struck, the dust rose metres on); in third person the round flew
   along the soldier's eye while the cross looked from 1.7 m aside, so whatever was close under the cross was missed; and a second
   segBox (the works', 2D) took the place of the 3D one, so every round of a vehicle's sweeping gun (and every sniper's) struck any
   vehicle within 30 m of it. On the flat disc of base 0 */
const fs = require('fs'), H = require('./harness'), C = H.load({ seed: 77 }), $ = C.$, ok = H.ok;
const manEye = $('manEye'), vnorm = $('vnorm'), bodyY = $('bodyY'), MAN = $('MAN');
const conv = (m, a) => (typeof C.aimConv === 'function' ? C.aimConv(m, a) : a.d);   // a page before it: the view's line
let S, B;
const fresh = era => { S = C.sandbox(era || 'ww2'); B = S.base[0]; return S; };
const aimAt = (m, t) => { const e = manEye(m), d = vnorm({ x: t.x - e.x, y: bodyY(t) - e.y, z: t.z - e.z }); m.ctl.aim = d; m.h = Math.atan2(-d.z, d.x); m.ap = Math.asin(d.y); };
const put = (u, x, z) => { u.x = x; u.z = z; u.y = C.hgt(x, z); u.ai = null; return u; };   // addUnit puts a road vehicle on the road
/* one round from m at t (aimed by aim, else at its body); what it did: t's hp lost, m's hp lost */
const shot = (m, t, aim) => {
  const hp = t.hp, mh = m.hp, A = () => { if (aim) aim(); else aimAt(m, t); }; m.ai = null; m.arms[0].mag = 1e9; m.ctl.fire = true; A(); $('manDir')(m);   // aimed before the first step: it fires in it
  C.run(.5, () => { A(); m.held = false; if (m.arms[0].t >= 0) m.ctl.fire = false; });
  return { hit: hp - t.hp, self: mh - m.hp, n: m.arms[0].t >= 0 };
};

console.log('-- the page declares no function twice (the later one silently takes the place of the earlier) --');
const page = fs.readFileSync(H.PAGE, 'utf8'), seen = new Map(), twice = [];
for (const m of page.matchAll(/^(?:async )?function ([A-Za-z0-9_$]+)\(/gm)) { if (seen.has(m[1])) twice.push(m[1]); seen.set(m[1], 1); }
ok(twice.length === 0, 'no top-level function declared twice' + (twice.length ? ': ' + twice.join(', ') : ''));

console.log('-- a rifle at a soldier and at a truck, from touching to 10 m --');
for (const era of ['ww2', 'modern']) {
  const kit = era === 'ww2' ? 'schutze' : Object.keys($('KITS')).find(k => $('KITS')[k].era === 'modern' && $('KITS')[k].side === 1 && $('KITS')[k].arms[0] && !$('KITS')[k].arms[0].k && !$('KITS')[k].arms[0].snp) || 'schutze';
  const row = [];
  for (const D of [.75, 1, 2, 3, 5, 10]) {
    fresh(era); const m = C.addMan(kit, 1, B.x, B.z, 0), t = C.addMan('rifleman', 0, B.x + D, B.z, 0); t.ai = null;
    const r = shot(m, t);
    fresh(era); const m2 = C.addMan(kit, 1, B.x, B.z, 0), v = put(C.addVehicle('truck', null, 0, B.x + 30, B.z, 0), B.x + D + 3.3, B.z);   // the truck's near side D m off
    const q = shot(m2, v);
    row.push({ D, man: r.hit > 0, truck: q.hit > 0, self: r.self + q.self, n: r.n && q.n });
  }
  console.log('   ' + era + ' ' + kit + ': ' + row.map(r => r.D + ' m ' + (r.man ? 'man' : '-') + '/' + (r.truck ? 'truck' : '-')).join(', '));
  ok(row.every(r => r.n), '  ' + era + ': every round was fired');
  ok(row.every(r => r.man), '  ' + era + ': a soldier is hit from touching out to 10 m');
  ok(row.every(r => r.truck), '  ' + era + ': a truck is hit from touching out to 10 m');
  ok(row.every(r => r.self === 0), '  ' + era + ': the shooter is never struck by his own round');
}

console.log('-- the round starts at the eye, not a metre along the aim --');
fresh(); { const m = C.addMan('schutze', 1, B.x, B.z, 0); m.ai = null; m.arms[0].mag = 9; m.h = 0; m.ap = 0; $('manDir')(m); $('manFire')(m, m.arms[0]);
  const b = S.bullets[S.bullets.length - 1], e = manEye(m);
  ok(b && Math.hypot(b.x - e.x, b.z - e.z) < .05, 'the round leaves from over the soldier (' + (b ? Math.hypot(b.x - e.x, b.z - e.z).toFixed(2) : '?') + ' m along the aim)'); }

console.log('-- an AI soldier at an enemy 2 m away --');
{ let kills = 0; const N = 4;
  for (let i = 0; i < N; i++) { fresh(); const m = C.addMan('schutze', 1, B.x, B.z, 0), t = C.addMan('rifleman', 0, B.x + 2, B.z + (i - 1.5) * .6, 0); t.ai = null; m.arms[0].mag = 1e9; const hp = t.hp;
    m.ai = $('manBrain')(0); m.ai.gx = m.x; m.ai.gz = m.z; m.f = { x: 1, y: 0, z: 0 };   // a brain that holds where it stands (tests/infantaria-alcance.js)
    C.run(8, () => !(t.dead || t.hp < hp), 1 / 30); if (t.dead || t.hp < hp) kills++; }
  ok(kills === N, 'the AI hits an enemy 2 m away (' + kills + '/' + N + ')'); }

console.log('-- third person: the cross is 1.7 m right of and .9 m over the eye; the round goes to what is under it --');
for (const D of [2, 4, 8]) {
  fresh(); const m = C.addMan('schutze', 1, B.x, B.z, 0), e = manEye(m);
  const o = { x: e.x - 5.2, y: e.y + .9, z: e.z + 1.7 };   // the view's camera: B m back, R m to the right (+z for a soldier facing +x), .9 m up
  const t = C.addMan('rifleman', 0, o.x + 5.2 + D, o.z, 0); t.ai = null; t.st = t.ctl.st = 0;   // a soldier D m ahead of the eye, under the cross
  const d = vnorm({ x: t.x - o.x, y: bodyY(t) - o.y, z: 0 });   // the cross on his body
  S.aim = { h: 0, p: Math.asin(d.y), d, o };
  const r = shot(m, t, () => { m.ctl.aim = conv(m, S.aim); m.h = Math.atan2(-m.ctl.aim.z, m.ctl.aim.x); m.ap = Math.asin(m.ctl.aim.y); });
  fresh(); const m2 = C.addMan('schutze', 1, B.x, B.z, 0), t2 = C.addMan('rifleman', 0, B.x + D, B.z + 1.7, 0); t2.ai = null;
  const r0 = shot(m2, t2, () => { m2.ctl.aim = d; m2.h = 0; m2.ap = Math.asin(d.y); });   // along the camera's own line: what the round did before
  ok(r.hit > 0 && r0.hit === 0, '  a soldier ' + D + ' m off under the cross is hit (and was missed along the eye\'s line) [' + r.hit.toFixed(1) + ', ' + r0.hit.toFixed(1) + ']');
}
fresh(); { const m = C.addMan('schutze', 1, B.x, B.z, 0), e = manEye(m), a = { d: { x: 1, y: 0, z: 0 }, o: { x: e.x - 5.2, y: e.y + .9, z: e.z + 1.7 } }, v = conv(m, a);
  ok(Math.abs(v.x - 1) < 1e-4 && Math.abs(Math.atan2(v.z, v.x)) < .004 && Math.abs(v.y) < .003, 'nothing under the cross: the round goes almost along the view (converging ' + (typeof C.AIMC === 'object' ? C.AIMC.far : '?') + ' m out)');
  const w = conv(m, { d: a.d, o: { x: e.x, y: e.y - .12, z: e.z } }), x = conv(m, { d: a.d });
  ok(typeof C.aimConv === 'function' && w === a.d && x === a.d, 'from the eye (first person, the sights) or without the view the aim is the view\'s'); }

console.log('-- a round into the ground stops where it meets it --');
fresh(); { const m = C.addMan('schutze', 1, B.x, B.z, 0), e = manEye(m), gx = B.x + 3, d = vnorm({ x: 3, y: C.hgt(gx, B.z) - (e.y - .12), z: 0 });
  const t = C.addMan('rifleman', 0, B.x + 8, B.z, 0); t.ai = null; t.st = t.ctl.st = 2; const hp = t.hp;   // prone 8 m off, past where the round meets the ground
  let end = null; const push = S.bullets.push; S.bullets.push = function (b) { end = b; return push.call(this, b); };
  m.ai = null; m.arms[0].mag = 9; m.ctl.aim = null; m.h = 0; m.ap = Math.asin(d.y); $('manDir')(m); $('manFire')(m, m.arms[0]); S.bullets.push = push;
  for (let i = 0; i < 5 && !end.gone; i++) C.$('stepShots')(1 / 60);
  ok(end.gone && Math.abs(end.x - gx) < .6, 'it stops 3 m out, where it met the ground (' + (end.x - B.x).toFixed(1) + ' m)');
  ok(t.hp === hp, 'a soldier lying past that point is not struck'); }

console.log('-- a vehicle\'s sweeping gun: a round 10 m beside an enemy truck leaves it alone (the works\' segBox took the 3D one\'s place) --');
fresh(); { const v = put(C.addVehicle('truck', null, 0, B.x + 30, B.z, 0), B.x + 20, B.z), hp = v.hp, by = C.addMan('schutze', 1, B.x, B.z + 10, 0);
  S.bullets.push({ x: B.x, y: v.y + 2, z: B.z + 10, vx: 890, vy: 0, vz: 0, life: 2, team: 1, dmg: 6, ap: .08, by, tr: 2, sw: 1 });
  C.run(.2, () => true);
  ok(v.hp === hp, 'the truck is untouched (' + (hp - v.hp).toFixed(1) + ' hp lost)'); }
fresh(); { const v = put(C.addVehicle('truck', null, 0, B.x + 30, B.z, 0), B.x + 20, B.z), hp = v.hp, by = C.addMan('schutze', 1, B.x, B.z, 0);
  S.bullets.push({ x: B.x, y: v.y + 2, z: B.z, vx: 890, vy: 0, vz: 0, life: 2, team: 1, dmg: 6, ap: .08, by, tr: 2, sw: 1 });
  C.run(.2, () => true);
  ok(v.hp < hp, 'one straight at it strikes it'); }

H.done();
