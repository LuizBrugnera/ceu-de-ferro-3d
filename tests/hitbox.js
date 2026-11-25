'use strict';
/* cf-hitbox: what a round strikes is what the scene draws. Real rounds (S.bullets, S.slugs, S.bombs through stepShots and stepSlugs) at
   points measured on the drawn figures (the pack's animated soldier posed by the page, in tools of the PR), and just beside them.
   Before: a soldier was one upright cylinder 1.4 m wide and as tall as the stance (prone it left out the head and the legs of a body 3.2 m
   long, crouched the head stood over it, the zone came from the height and prone from a die); a vehicle was struck by a gun's round in an
   upright box 11 m wide round it and by a shell or a rocket in one 10 m wide; an aircraft was a sphere max(6.5, len / 2) m round its
   middle where a round's step ended (6 m of air over a fighter struck it, a bomber's wingtips and tail did not), and a shell's 9 m; a
   soldier on a sniper tower was never looked for by a round at his height; a soldier aboard swallowed the rounds through his seat; and two
   soldiers on a round's line, the first of the list took it, not the nearer. On the flat disc of base 0 */
const fs = require('fs'), H = require('./harness'), C = H.load({ seed: 31 }), $ = C.$, ok = H.ok;
const MAN = $('MAN'), STANCE = $('STANCE'), HK = $('HK');
const MHIT = (() => { try { return $('MHIT'); } catch (e) { return null; } })();
let S, B, by;
const fresh = era => { S = C.sandbox(era || 'ww2'); B = S.base[0]; by = C.addMan(era === 'modern' ? 'blueRifle' : 'schutze', 1, B.x - 500, B.z - 500, 0); by.ai = null; return S; };
const ZN = ['torso', 'head', 'legs', 'arms'];

/* --- soldiers --- */
/* a soldier of side 0 at the base's middle, stance st, heading h */
const man = (st, h, o) => { const m = C.addMan('rifleman', 0, B.x + (o || 0), B.z, 0); m.ai = null; m.st = m.ctl.st = st; m.h = h; m.x = B.x + (o || 0); m.z = B.z; m.y = C.hgt(m.x, m.z); m.f = { x: Math.cos(h), y: 0, z: -Math.sin(h) }; m.inv = 0; return m; };
/* a point and a direction in m's own frame [forward, up, right], in metres, into the world */
const W = (m, p) => { const c = Math.cos(m.h), s = Math.sin(m.h); return [m.x + p[0] * c + p[2] * s, m.y + p[1], m.z - p[0] * s + p[2] * c]; };
const Wd = (m, d) => { const c = Math.cos(m.h), s = Math.sin(m.h), l = Math.hypot(...d); return [(d[0] * c + d[2] * s) / l, d[1] / l, (-d[0] * s + d[2] * c) / l]; };
/* one rifle round through point p of m's frame along d (his frame), from 25 m back: { hit, zone } */
function shoot(m, p, d, kind) {
  const P = W(m, p), D = Wd(m, d), o = P.map((v, i) => v - D[i] * 25); m.hp = m.max; m.hz = -1; m.dead = false; m.bl = 0; m.inv = 0;
  if (kind === 'slug') { (S.slugs || (S.slugs = [])).length = 0; S.slugs.push({ x: o[0], y: o[1], z: o[2], vx: D[0] * 850, vy: D[1] * 850, vz: D[2] * 850, life: 2, team: 1, o: { dmg: 1 }, by, t: 0 }); }
  else if (kind === 'shell') S.bombs = [{ k: 'shell', x: o[0], y: o[1], z: o[2], vx: D[0] * 1550, vy: D[1] * 1550, vz: D[2] * 1550, o: Object.assign({}, $('ARMS').ap, { dmg: 1, r: 0 }), team: 1, by, life: 8 }];   // r 0: no burst, the direct hit alone
  else S.bullets = [{ x: o[0], y: o[1], z: o[2], vx: D[0] * 850, vy: D[1] * 850, vz: D[2] * 850, life: 1.3, team: 1, dmg: 1, ap: 0, sa: 1, by, tr: 0, cal: 0 }];
  for (let i = 0; i < 6; i++) { if (kind === 'slug') $('stepSlugs')(1 / 60); else $('stepShots')(1 / 60); }
  S.floats.length = 0; S.bullets = []; S.bombs = [];
  return { hit: m.hp < m.max, zone: m.hp < m.max ? m.hz : -1 };
}
const FRONT = [-1, 0, 0], SIDE = [0, 0, -1], DOWN = [-1, -.6, 0], BACK = [1, 0, 0];
/* the drawn soldier's places, m in his frame, measured on the pack's model as the page poses it (and its far figure of boxes, within
   .2 m): [stance, name, point, direction, zones it may give (a torso hit takes an arm by MAN.armP), or null for air] */
const PTS = [
  [0, 'standing: the head from the front', [-.05, 2.8, 0], FRONT, [1]], [0, 'standing: the top of the helmet (over the old cylinder)', [-.05, 3.06, 0], FRONT, [1]],
  [0, 'standing: the chest', [-.12, 1.9, 0], FRONT, [0, 3]], [0, 'standing: a thigh', [-.05, .9, .15], FRONT, [2]], [0, 'standing: the head from the side', [-.05, 2.8, 0], SIDE, [1]],
  [0, 'standing: the head from above (a sniper on a roof)', [-.05, 2.85, 0], DOWN, [1]], [0, 'standing: the head from behind', [-.05, 2.8, 0], BACK, [1]],
  [0, 'standing: .6 m beside the chest is air', [-.12, 1.9, .6], FRONT, null], [0, 'standing: .6 m beside the head is air', [-.05, 2.8, -.6], FRONT, null], [0, 'standing: .25 m over the helmet is air', [-.05, 3.38, 0], FRONT, null],
  [1, 'crouched: the head (it was the torso, by height)', [-.05, 1.78, 0], FRONT, [1]], [1, 'crouched: the top of the helmet (over the old cylinder)', [-.05, 2.02, 0], FRONT, [1]],
  [1, 'crouched: the chest', [-.12, 1.15, 0], FRONT, [0, 3]], [1, 'crouched: the knee up ahead', [.3, .75, .2], SIDE, [2]], [1, 'crouched: the foot behind, on the ground', [-.85, .15, -.2], SIDE, [2]],
  [1, 'crouched: .6 m beside the chest is air', [-.12, 1.15, -.65], FRONT, null], [1, 'crouched: .3 m over the helmet is air', [-.05, 2.4, 0], FRONT, null],
  [2, 'prone: the head, ahead of the old cylinder', [1.17, .37, 0], FRONT, [1]], [2, 'prone: the head from the side', [1.17, .37, 0], SIDE, [1]], [2, 'prone: the back', [.4, .45, 0], SIDE, [0, 3]],
  [2, 'prone: the feet, behind the old cylinder', [-1.5, .2, .15], SIDE, [2]], [2, 'prone: the feet from behind', [-1.5, .2, .15], BACK, [2]], [2, 'prone: the head from above', [1.17, .4, 0], DOWN, [1]],
  [2, 'prone: .6 m beside the back is air', [.2, .35, .65], FRONT, null], [2, 'prone: .45 m over the back is air', [.3, 1.15, 0], SIDE, null]
];
console.log('-- a soldier is struck where he is drawn, in every stance and turned his way, with the zone of the part struck --');
fresh();
for (const h of [0, .8, -2.3]) {
  let bad = [];
  for (const [st, nm, p, d, z] of PTS) {
    const m = man(st, h), r = shoot(m, p, d); S.men = [by];
    if (z ? !(r.hit && z.includes(r.zone)) : r.hit) bad.push(nm + ' (' + (r.hit ? ZN[r.zone] : 'miss') + ')');
  }
  ok(bad.length === 0, 'heading ' + h + ': ' + PTS.length + ' rounds at the drawn figure and beside it' + (bad.length ? ': WRONG ' + bad.join('; ') : ''));
}
{ fresh(); const m = man(2, .5), a = shoot(m, [1.17, .37, 0], SIDE, 'slug'), b = shoot(m, [-1.5, .2, .15], SIDE, 'slug'), c = shoot(m, [.2, .35, .65], FRONT, 'slug');
  ok(a.hit && a.zone === 1 && b.hit && b.zone === 2 && !c.hit, 'a sniper\'s round (stepSlugs) the same: prone head ' + (a.hit ? ZN[a.zone] : 'miss') + ', feet ' + (b.hit ? ZN[b.zone] : 'miss') + ', beside ' + (c.hit ? 'hit' : 'miss')); }
{ fresh(); const LOW = [-1, -.09, 0], m = man(2, -1), a = shoot(m, [-1.5, .2, .15], [0, -.09, -1], 'shell'), b = shoot(m, [1.17, .37, 0], LOW, 'shell'), c = shoot(m, [.2, .35, .7], LOW, 'shell');   // from a gun's height 25 m off (flat at .4 m a shell bursts on the ground at once, its own rule)
  ok(a.hit && b.hit && !c.hit, 'a shell (hopMan) the same: prone feet ' + (a.hit ? 'hit' : 'miss') + ', head ' + (b.hit ? 'hit' : 'miss') + ', beside ' + (c.hit ? 'hit' : 'miss')); }
{ fresh(); const m = man(0, 0); m.v = { x: 9, y: 0, z: 0 }; m.run = true; const a = shoot(m, [.7, .5, 0], SIDE), b = shoot(m, [-.75, .5, 0], SIDE);
  m.v = { x: 0, y: 0, z: 0 }; m.run = false; const c = shoot(m, [-.75, .5, 0], SIDE);
  ok(a.hit && b.hit && !c.hit, 'running, the legs\' swing is struck ahead and behind (' + a.hit + ', ' + b.hit + '); standing still it is air (' + c.hit + ')'); }

console.log('-- the body\'s parts agree with the sim\'s stances: the eye is in the head, the head the top of the body --');
if (MHIT) for (let st = 0; st < 3; st++) {
  const hd = MHIT.st[st].find(b => b[6] === 1), e = STANCE[st].eye, inY = e >= hd[1] - hd[4] && e <= hd[1] + hd[4];
  const top = Math.max(...MHIT.st[st].map(b => b[1] + b[4]));
  ok(inY && Math.abs(top - (hd[1] + hd[4])) < 1e-9, ['standing', 'crouched', 'prone'][st] + ': the eye (' + e + ') is within the head\'s box ' + (hd[1] - hd[4]).toFixed(2) + '..' + (hd[1] + hd[4]).toFixed(2) + ', which is the top');
}
else ok(false, 'MHIT: the soldier\'s body parts');
{ /* the drawn figures are posed for MHIT (PKN, MPOSE): the far figure of boxes kneels with its head in the crouched head's box. Read from the page's
     scene part, which the harness does not load: if this pose changes, the boxes of MHIT must be fitted again (the tools of cf-hitbox) */
  const page = fs.readFileSync(H.PAGE, 'utf8'), num = s => +s, mp = /const MPOSE = \{ hip: \[([^\]]+)\], leg: \[[^\]]+\], lean: \[([^\]]+)\]/.exec(page), hd = /head: box\(body, ([-\d.]+), ([-\d.]+), 0, ([-\d.]+), ([-\d.]+), ([-\d.]+)\), helm: box\(body, ([-\d.]+), ([-\d.]+), 0, ([-\d.]+), ([-\d.]+), ([-\d.]+)\)/.exec(page);
  const pk = /const PKN = \{ dy: ([-\d.]+)/.exec(page);
  if (mp && hd && MHIT) {
    const hip = mp[1].split(',').map(num)[1], lean = mp[2].split(',').map(num)[1], c = Math.cos(lean), s = Math.sin(lean), y = (x, yy) => hip + x * s + yy * c;
    const head = y(+hd[1], +hd[2]), top = Math.max(y(+hd[6] - hd[8] / 2, +hd[7] + hd[9] / 2), y(+hd[6] + hd[8] / 2, +hd[7] + hd[9] / 2)), b = MHIT.st[1].find(q => q[6] === 1);
    ok(head > b[1] - b[4] && head < b[1] + b[4] && Math.abs(top - (b[1] + b[4])) < .12, 'the far figure crouched: head at ' + head.toFixed(2) + ', helmet top at ' + top.toFixed(2) + ' (the crouched head\'s box ' + (b[1] - b[4]).toFixed(2) + '..' + (b[1] + b[4]).toFixed(2) + ', units of MAN.sc)');
  } else ok(false, 'the far figure\'s crouch (MPOSE, buildRig) read from the page');
  ok(!!pk && +pk[1] <= -.55 && +pk[1] >= -.65, 'the pack\'s soldier kneels lowered ' + (pk && pk[1]) + ' (the crouch MHIT was fitted to: its eye at the crouched eye; at -.42 the helmet stood .45 m over the body)');
}

console.log('-- what else decides which soldier a round strikes --');
{ fresh(); const far = man(0, 0, 0), near = man(0, 0, 6); S.men = [by, far, near];   // the round comes from +x: the list has the far one first
  const D = Wd(far, FRONT), P = W(far, [-.1, 1.9, 0]); far.hp = near.hp = far.max;
  S.bullets = [{ x: P[0] - D[0] * 25, y: P[1], z: P[2] - D[2] * 25, vx: D[0] * 850, vy: 0, vz: D[2] * 850, life: 1.3, team: 1, dmg: 1, ap: 0, sa: 1, by, tr: 0, cal: 0 }];
  for (let i = 0; i < 6; i++) $('stepShots')(1 / 60);
  ok(near.hp < near.max && far.hp === far.max, 'two soldiers on the line: the nearer one takes it, whatever the list\'s order'); }
{ fresh(); const u = C.addVehicle('trn', 'jeep', 1, B.x + 60, B.z + 60, 0), m = man(0, 0), n = man(0, 0, -6); m.in = u; m.seat = 1; S.men = [by, m, n];   // aboard (his place left where he stands, out of the jeep's box), and a soldier on foot behind him on the round's line
  const D = Wd(m, FRONT), P = W(m, [-.1, 1.9, 0]); n.hp = n.max;
  S.bullets = [{ x: P[0] - D[0] * 25, y: P[1], z: P[2] - D[2] * 25, vx: D[0] * 850, vy: 0, vz: D[2] * 850, life: 1.3, team: 1, dmg: 1, ap: 0, sa: 1, by, tr: 0, cal: 0 }];
  for (let i = 0; i < 6; i++) $('stepShots')(1 / 60);
  m.in = null; S.bullets = [];
  ok(n.hp < n.max, 'a soldier aboard does not swallow a round at his place: the one on foot behind him takes it (the vehicle takes its own and passes it on, ENT.share)'); }
{ fresh(); const m = man(0, 0); m.y += 10.5; m.tw = { gone: false, prog: 1, F: { eye: 10.5 } }; $('bldMen')(1 / 60);
  const r = shoot(m, [-.1, 1.9, 0], FRONT);
  ok(r.hit && S.cbup > 0, 'a soldier on a sniper tower\'s platform, 10.5 m up, is struck at his height (' + (r.hit ? 'hit' : 'miss') + ', cbup ' + S.cbup + ')'); }
{ fresh(); const m = man(0, 0); m.dead = true; const n = man(0, 0, -8); S.men = [by, m, n]; const D = Wd(m, FRONT), P = W(m, [-.1, 1.9, 0]); n.hp = n.max;
  S.bullets = [{ x: P[0] - D[0] * 3, y: P[1], z: P[2] - D[2] * 3, vx: D[0] * 850, vy: 0, vz: D[2] * 850, life: 1.3, team: 1, dmg: 1, ap: 0, sa: 1, by, tr: 0, cal: 0 }];
  for (let i = 0; i < 6; i++) $('stepShots')(1 / 60);
  ok(n.hp < n.max, 'a body does not stop a round: the soldier behind it is struck'); }
{ fresh(); const P = man(0, 0, -20); P.me = true; const t = man(2, .4, 0), e = $('manEye')(P), cam = { x: e.x - 5.2, y: e.y + .9, z: e.z + 1.7 }, foot = W(t, [-1.5, .2, .15]);
  const d = $('vnorm')({ x: foot[0] - cam.x, y: foot[1] - cam.y, z: foot[2] - cam.z }), a = $('aimConv')(P, { d, o: cam });
  const ex = e.x, ey = e.y - .12, ez = e.z, k = (foot[0] - ex) / a.x, miss = Math.hypot(ex + a.x * k - foot[0], ey + a.y * k - foot[1], ez + a.z * k - foot[2]);
  ok(miss < .15, 'third person: the cross on a prone soldier\'s feet sends the round to his feet (' + miss.toFixed(2) + ' m off them; the cylinder had no feet there)'); }

/* --- vehicles --- */
console.log('-- a vehicle is struck by every round in its own box, swept over the hop --');
const veh = (kind, id, team) => { const u = C.addVehicle(kind, id, team === undefined ? 0 : team, B.x + 40, B.z, 0); u.x = B.x; u.z = B.z; u.y = C.hgt(B.x, B.z); u.h = .6; u.ty = 0; u.ai = null; u.sp = 0; return u; };
/* a round at point p of u's frame (forward, up, right; m, from its middle on the ground) along d: did u take a direct hit (impact, not a blast)?
   Taken, not applied: a vehicle destroyed would leave its wreck, a world object, in the next round's way */
function vshot(u, p, d, kind) {
  const P = W(u, p), D = Wd(u, d), o = P.map((v, i) => v - D[i] * 40); let got = false;
  const imp = $('impact'); $('impact = (f => function (o, k) { if (o === globalThis.__t) { if (k !== HK.blast) globalThis.__g = 1; return null; } return f.apply(this, arguments); })(impact)'); C.__t = u; C.__g = 0;
  u.hp = u.def.hp; u.dead = false; S.units = [u];
  if (kind === 'shell') S.bombs = [{ k: 'shell', x: o[0], y: o[1], z: o[2], vx: D[0] * 1550, vy: D[1] * 1550, vz: D[2] * 1550, o: $('ARMS').ap, team: 1, by, life: 8 }];
  else if (kind === 'rocket') S.bombs = [{ k: 'heat', x: o[0], y: o[1], z: o[2], vx: D[0] * 300, vy: D[1] * 300, vz: D[2] * 300, o: Object.assign({}, $('ARMS').ap, { pen: 300 }), team: 1, by, life: 4 }];
  else S.bullets = [{ x: o[0], y: o[1], z: o[2], vx: D[0] * 900, vy: D[1] * 900, vz: D[2] * 900, life: 1.5, team: 1, dmg: 3, ap: .1, by, tr: 1, cal: 12.7, sa: kind === 'sa' ? 1 : undefined }];
  for (let i = 0; i < 12; i++) $('stepShots')(1 / 60);
  got = !!C.__g; C.$('impact = ' + 'globalThis.__imp'); S.bullets = []; S.bombs = []; S.floats.length = 0;
  return got;
}
C.__imp = $('impact');
{ fresh('modern'); const u = veh('trn', 'hmmwv'), e = u.def.env;
  const rows = [['an aircraft\'s or a vehicle\'s gun round at it', 'gun', [0, 1.2, 0], [0, 0, -1], true], ['the same 3 m beside it', 'gun', [0, 1.2, e[5] + 3], [-1, 0, 0], false],
    ['the same into the dirt 4 m beside it (a strafing pass)', 'gun', [0, 0, e[5] + 4], [-1, -1.2, 0], false], ['the same 2 m over its roof', 'gun', [0, e[1] + e[4] + 2, 0], [0, 0, -1], false],
    ['a rifle round at it', 'sa', [0, 1.2, 0], [-1, 0, 0], true], ['a tank\'s shell at it', 'shell', [1, 1.2, 0], [0, 0, -1], true], ['the same 3 m beside it', 'shell', [0, 1.2, e[5] + 3], [-1, 0, 0], false],
    ['the same 1.5 m over its roof', 'shell', [0, e[1] + e[4] + 1.5, 0], [0, 0, -1], false], ['a rocket 3 m beside it', 'rocket', [0, 1.2, e[5] + 3], [-1, 0, 0], false], ['a rocket at it', 'rocket', [0, 1.2, 0], [0, 0, -1], true]];
  for (const [nm, k, p, d, want] of rows) { const r = vshot(u, p, d, k); ok(r === want, 'HMMWV: ' + nm + ': ' + (r ? 'hit' : 'miss')); } }
{ fresh('modern'); const u = veh('trn', 'hemtt'), e = u.def.env, r = vshot(u, [e[3] - .4, 1.5, 0], [0, 0, -1], 'shell');
  ok(r, 'HEMTT (8.4 m): a shell at its last metre is struck: ' + (r ? 'hit' : 'miss') + ' (the shell\'s box was 10 m across round the middle)');
  const q = vshot(u, [-2, 4.9, 0], [0, 0, -1], 'sa');
  ok(q, 'HEMTT: a rifle round at the top of the cargo\'s cover, 4.9 m up as drawn, is struck: ' + (q ? 'hit' : 'miss') + ' (its box stopped at 3.7 m)'); }
console.log('-- a vehicle drawn by the pack: the boxes of the model drawn (VHIT), the turret and the barrel turned as drawn --');
{ fresh('ww2'); const u = veh('tank', 'sherman');
  const rows = [['a round at the hull\'s side', [0, 1, 0], [0, 0, -1], true], ['the same at the turret', [-1, 2.3, 0], [0, 0, -1], true],
    ['the same .6 m over the turret drawn (2.8 m up; the old box went to 5.3 m)', [-1, 3.45, 0], [0, 0, -1], false], ['the same 1 m beside the hull', [0, 1, 3.2], [-1, 0, 0], false]];
  for (const [nm, p, d, want] of rows) { const r = vshot(u, p, d, 'gun'); ok(r === want, 'Sherman: ' + nm + ': ' + (r ? 'hit' : 'miss')); } }
const VHIT = (() => { try { return $('VHIT'); } catch (e) { return null; } })();
if (!VHIT) ok(false, 'VHIT: the boxes of the vehicles\' pack models');
else { fresh('modern'); const u = veh('tank', 't72'), V = VHIT.t72, tip = V[3][0] + V[4][0] + V[2][0] + V[2][3] * .8, y = V[3][1] + V[4][1];   // near the muzzle, in the turret's frame
  u.ty = 0; const a = vshot(u, [-.4, y, tip], [-1, 0, 0], 'gun');   // where the barrel lies once the turret is turned a quarter right
  u.ty = -Math.PI / 2; const b = vshot(u, [-.4, y, tip], [-1, 0, 0], 'gun');
  u.ty = 0; u.tp = .25; const c = vshot(u, [tip, y, 0], [0, 0, -1], 'gun'), d = vshot(u, [tip, y + tip * .25, 0], [0, 0, -1], 'gun');
  ok(!a && b, 'T-72: the barrel is struck where the turret has turned it (ahead: ' + (a ? 'hit' : 'miss') + '; turned a quarter: ' + (b ? 'hit' : 'miss') + ')');
  ok(!c && d, 'T-72: and where the gun has raised it (level: ' + (c ? 'hit' : 'miss') + '; raised .25 rad: ' + (d ? 'hit' : 'miss') + ')'); }

/* --- aircraft --- */
console.log('-- an aircraft is struck on its skin (its parts\' boxes), along the round\'s path against it --');
const air = (id, heli, v) => { const y = C.hgt(B.x, B.z) + 300, p = heli ? $('addHeli')(id, 0, B.x, y, B.z, 0, null) : C.addPlane(id, 0, B.x, y, B.z, 0, null); p.ai = null; p.v = v || { x: 0, y: 0, z: 0 }; S.planes = [p]; return p; };
function ashot(p, at, d, kind, spd) {
  const D = (() => { const l = Math.hypot(...d); return d.map(v => v / l); })(), o = [p.x + at[0] - D[0] * 60, p.y + at[1] - D[1] * 60, p.z + at[2] - D[2] * 60];
  $('impact = (f => function (o, k) { if (o === globalThis.__t) { if (k !== HK.blast) globalThis.__g = 1; return null; } return f.apply(this, arguments); })(impact)'); C.__t = p; C.__g = 0;
  p.hp = p.def.hp; p.dead = false; for (const q of p.parts) q.hp = q.max;
  const v = spd || 900;
  if (kind === 'shell') S.bombs = [{ k: 'shell', x: o[0], y: o[1], z: o[2], vx: D[0] * 1550, vy: D[1] * 1550, vz: D[2] * 1550, o: $('ARMS').ap, team: 1, by, life: 8 }];
  else if (kind === 'slug') { S.slugs = [{ x: o[0], y: o[1], z: o[2], vx: D[0] * v, vy: D[1] * v, vz: D[2] * v, life: 2, team: 1, o: { dmg: 4 }, by, t: 0 }]; }
  else S.bullets = [{ x: o[0], y: o[1], z: o[2], vx: D[0] * v, vy: D[1] * v, vz: D[2] * v, life: 1.5, team: 1, dmg: 3, ap: .1, by, tr: 1, cal: 12.7 }];
  for (let i = 0; i < 12; i++) { if (kind === 'slug') $('stepSlugs')(1 / 60); else $('stepShots')(1 / 60); }
  const g = !!C.__g; C.$('impact = ' + 'globalThis.__imp'); S.bullets = []; S.bombs = []; if (S.slugs) S.slugs.length = 0; S.floats.length = 0;
  return g;
}
{ fresh('ww2'); const p = air('bf109');
  const rows = [['a gun round through the fuselage from the side', [0, .3, 0], [0, 0, -1], true], ['the same 4 m over the fuselage', [0, 4.5, 0], [0, 0, -1], false],
    ['the same 3 m under it', [0, -3.5, 0], [0, 0, -1], false], ['the same 4 m ahead of the nose', [11, .3, 0], [0, 0, -1], false], ['the same at a wingtip from above', [1.8, 0, 6.6], [0, -1, 0], true]];
  for (const [nm, at, d, want] of rows) { const r = ashot(p, at, d); ok(r === want, 'Bf 109: ' + nm + ': ' + (r ? 'hit' : 'miss')); } }
{ fresh('ww2'); const p = air('b17');
  const rows = [['a gun round at a wingtip (16 m out)', [-.8, .5, 16], [0, -1, 0], true], ['the same at the tail (11 m back)', [-11, 1.5, 0], [0, 0, -1], true],
    ['the same at the nose', [10.5, .5, 0], [0, 0, -1], true], ['the same 4 m over the fuselage', [0, 5.5, 0], [0, 0, -1], false]];
  for (const [nm, at, d, want] of rows) { const r = ashot(p, at, d); ok(r === want, 'B-17: ' + nm + ': ' + (r ? 'hit' : 'miss')); } }
{ fresh('ww2'); const p = air('bf109', false, { x: 200, y: 0, z: 0 });   // crossing at 200 m/s: a round whose steps' ends both fall outside it
  const r = ashot(p, [3.4, .3, 0], [0, 0, -1], 'gun', 950), q = ashot(p, [3.4, 6, 0], [0, 0, -1], 'gun', 950);
  ok(r && !q, 'a fighter crossing at 200 m/s is struck by a round across its path (' + (r ? 'hit' : 'miss') + '), not by one 6 m over it (' + (q ? 'hit' : 'miss') + ')'); }
{ fresh('modern'); const p = air('ah64', true);
  const rows = [['a gun round through the cabin', 'gun', [0, .2, 0], [0, 0, -1], true], ['the same 4 m beside it', 'gun', [0, .2, 4.5], [-1, 0, 0], false],
    ['a tank\'s shell through it (one landed or low)', 'shell', [0, .2, 0], [0, 0, -1], true], ['the same 6 m beside it', 'shell', [0, .2, 6], [-1, 0, 0], false],
    ['a sniper\'s round through it', 'slug', [0, .2, 0], [0, 0, -1], true], ['the same 4 m beside it', 'slug', [0, .2, 4], [-1, 0, 0], false]];
  for (const [nm, k, at, d, want] of rows) { const r = ashot(p, at, d, k); ok(r === want, 'AH-64 hovering: ' + nm + ': ' + (r ? 'hit' : 'miss')); } }
{ fresh('ww2'); const p = air('bf109'), i = p.def.parts.findIndex(q => q.cut && q.box && q.box[2] > 3);
  const at = [p.def.parts[i].box[0], p.def.parts[i].box[1], p.def.parts[i].box[2]], a = ashot(p, at, [0, -1, 0]);
  p.parts[i].hp = 0; const hp = () => { for (const q of p.parts) if (q !== p.parts[i]) q.hp = q.max; };
  $('impact = (f => function (o, k) { if (o === globalThis.__t) { if (k !== HK.blast) globalThis.__g = 1; return null; } return f.apply(this, arguments); })(impact)'); C.__t = p; C.__g = 0; hp();
  S.bullets = [{ x: p.x + at[0], y: p.y + 60, z: p.z + at[2], vx: 0, vy: -900, vz: 0, life: 1.5, team: 1, dmg: 3, ap: .1, by, tr: 1, cal: 12.7 }];
  for (let k = 0; k < 12; k++) $('stepShots')(1 / 60);
  const b = !!C.__g; C.$('impact = ' + 'globalThis.__imp');
  ok(a && !b, 'a wing (' + p.def.parts[i].id + '): struck while it is there (' + a + '), not once it is shot off (' + b + ')'); }

H.done();
