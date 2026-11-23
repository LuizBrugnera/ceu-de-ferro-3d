'use strict';
/* cf-camera-3p: the third-person eye never goes into the world. The eye behind a soldier or a vehicle stopped only at the ground under
   itself and, on foot, at a wall a single ray met: so it stood in a room behind the wall (the ray went through the window), in the hill
   between it and the player, behind a building's roof over a tank; and in a wood the near plane went out to 21 m behind a vehicle, which
   wiped every tree round the eye off the screen. This runs the page's own camClip block (in the 3D part, which the harness does not load)
   on the match's ground and objects: the eye stops short of a building's outer box and of the ground on the way, steps off a trunk,
   eases back out once the way is clear, brings the near plane in where there is no room; and the wood's 21 m near plane is gone */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const a = html.indexOf('/* ---------- the third-person eye against the world (cf-camera-3p)'), b = html.indexOf('/* ---------- HUD (2D overlay)', a);
if (a < 0 || b < 0) { console.log('no camClip: a page before it'); process.exit(0); }
const C = H.load({ seed: 5, mapv: 9 }), $ = C.$, S = C.sandbox('modern');
/* the view's few names the block reads: the camera, its state, the drawn ground, the trees' dither uniform */
vm.runInContext(`var camSt = {}, VU = { uCut: { value: { w: 0, set(x, y, z, w) { this.p = [x, y, z]; this.w = w; } } } };
  var camera = { near: 2, position: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } } };
  var gndY = (x, z) => Math.max(S.T.WL, meshT(S.T, x, z));
  ${html.slice(a, b)}
  ;globalThis.CC = { camClip, camBox, camGnd, CAM, camera, camSt, VU };`, C, { filename: 'cam.js' });
const { camClip, camBox, camGnd, CAM, camera, camSt, VU } = C.CC, cp = camera.position, T = S.T;
const man = (x, z) => ({ man: true, x, y: C.hgt(x, z), z, st: 0, dg: 0, v: { x: 0, y: 0, z: 0 } });
const manEye = $('manEye'), topOf = $('topOf'), eyeOf = p => manEye(p);
const frame = (p, x, y, z, n = 1) => { for (let i = 0; i < n; i++) { cp.set(x, y, z); camera.near = 2; camClip(p, null, 1 / 30); } };
const boomClear = p => { const o = eyeOf(p); for (let i = 1; i <= 60; i++) { const s = i / 60, x = o.x + (cp.x - o.x) * s, z = o.z + (cp.z - o.z) * s; if (o.y + (cp.y - o.y) * s < camGnd(x, z) - .02) return false; } return true; };
const inBox = (q, x, y, z) => C.footD(q, x, z) === 0 && y > q.y - 1 && y < topOf(q);
const clear = (x, z, r) => !C.near(x, z, r + 2).some(o => S.os[o.id] < 2 && !o.K.veil && C.footD(o, x, z) < r);

console.log('-- a wall at the back, a window in it --');
const blds = T.objs.filter(o => o.B && S.os[o.id] < 2 && o.hw > 4 && o.hd > 4 && o.h > 5);
ok(blds.length > 10, 'the map has town buildings (' + blds.length + ')');
let n = 0, bad = 0, nearOk = 0;
for (const o of blds) {
  const ux = o.c, uz = -o.s, x = o.x + ux * (o.hw + 1), z = o.z + uz * (o.hw + 1);   // a metre out of the wall, facing away from it
  if (!clear(x, z, .6)) continue;
  const p = man(x, z), e = eyeOf(p);
  camSt.raw = null; frame(p, e.x - ux * 5.2, e.y + .9, e.z - uz * 5.2);
  n++; if (inBox(o, cp.x, cp.y, cp.z) || camBox(o, e.x, e.y, e.z, cp.x - e.x, cp.y - e.y, cp.z - e.z) < 1) bad++;
  if (camera.near <= .5) nearOk++;
  if (n >= 40) break;
}
ok(n >= 20 && !bad, 'the eye behind a soldier with his back to a wall stays out of the building, its box clear of the way: ' + (n - bad) + ' of ' + n);
ok(nearOk === n, '  and the near plane comes in there (≤ 0.5 m): ' + nearOk + ' of ' + n);

console.log('-- the eye eases back out once the way is clear --');
{
  const o = blds[0], ux = o.c, uz = -o.s; let x = o.x + ux * (o.hw + 1), z = o.z + uz * (o.hw + 1);
  for (let k = 0; k < 40 && !clear(x, z, .6); k++) { x += ux; z += uz; }
  const p = man(x, z), e = eyeOf(p); camSt.raw = null; frame(p, e.x - ux * 5.2, e.y + .9, e.z - uz * 5.2);
  const k0 = camSt.raw.k;
  let fx = x, fz = z; for (let k = 0; k < 400 && !(clear(fx, fz, 10) && C.near(fx, fz, 12).every(q => !q.B)); k++) { fx += 37; fz += 11; }
  p.x = fx; p.z = fz; p.y = C.hgt(fx, fz); const f = eyeOf(p), want = [f.x - ux * 5.2, Math.max(f.y + .9, camGnd(f.x - ux * 5.2, f.z - uz * 5.2) + 1), f.z - uz * 5.2];
  frame(p, ...want); const k1 = camSt.raw.k; frame(p, ...want, 90); const k2 = camSt.raw.k;
  ok(k0 < .5 && k1 > k0 && k1 < .5 && k2 > .99, 'pulled in to ' + k0.toFixed(2) + ' of the boom at the wall; one frame after the way clears ' + k1.toFixed(2) + ' (not a jump), 3 s later ' + k2.toFixed(2));
}

console.log('-- the ground between the eye and the soldier --');
const G = camGnd, slope = (x, z) => Math.hypot(G(x + 3, z) - G(x - 3, z), G(x, z + 3) - G(x, z - 3)) / 6;
let gs = 0, gbad = 0;
for (let x = 500; x < S.W - 500 && gs < 30; x += 97) for (let z = -S.HW + 500; z < S.HW - 500 && gs < 30; z += 89) {
  const s = slope(x, z); if (s < .45 || G(x, z) < T.WL + 3 || !clear(x, z, 1)) continue;
  const gx = (G(x + 3, z) - G(x - 3, z)) / 6, gz = (G(x, z + 3) - G(x, z - 3)) / 6, n2 = Math.hypot(gx, gz), p = man(x, z), e = eyeOf(p);
  const cx = e.x + gx / n2 * 6, cz = e.z + gz / n2 * 6;   // uphill behind him, at the ground's height there: the hill is on the way
  camSt.raw = null; frame(p, cx, G(cx, cz) + .4, cz);
  gs++; if (!boomClear(p) || cp.y < G(cp.x, cp.z) + .2) gbad++;
}
ok(gs >= 10 && !gbad, 'on a steep slope the hill never lies between the eye and the soldier: ' + (gs - gbad) + ' of ' + gs);

console.log('-- a trunk at the eye --');
const trees = T.objs.filter(o => o.k === 'tree' && S.os[o.id] < 2);
let ts = 0, tbad = 0;
for (const q of trees) {
  if (ts >= 30) break;
  const a2 = q.id * .7, x = q.x + Math.cos(a2) * 4, z = q.z + Math.sin(a2) * 4; if (!clear(x, z, 1)) continue;
  const p = man(x, z); camSt.raw = null; frame(p, q.x + .1, q.y + 2.5, q.z);   // the eye asked for inside the trunk
  ts++; if (C.footD(q, cp.x, cp.z) < CAM.pad * .9) tbad++;
}
ok(ts >= 20 && !tbad, 'an eye asked for inside a trunk is put beside it (≥ ' + (CAM.pad * .9).toFixed(2) + ' m off): ' + (ts - tbad) + ' of ' + ts);
ok(VU.uCut.value.w > 0 && VU.uCut.value.p && Math.abs(VU.uCut.value.p[1] - eyeOf(man(cp.x, cp.z)).y) < 50, 'the trees are told the line to keep clear (uCut: the pivot and a radius of ' + VU.uCut.value.w + ' m)');

console.log('-- the woods and the near plane --');
const fc = html.slice(html.indexOf('function fortCam('), html.indexOf('\n}', html.indexOf('function fortCam(')));
ok(fc.length > 20 && !/wood/.test(fc), 'no near plane pushed out behind a vehicle in a wood (fortCam: ' + (fc.match(/camera\.near = [^;]*/) || ['?'])[0] + ')');
const vm2 = html.slice(html.indexOf('function vegMat('), html.indexOf('const VAK = '));
ok(/VCUT/.test(vm2) && /o\.kind === 'near' \|\| o\.kind === 'mid'/.test(vm2), 'the trees near the eye dither on the line to the player (VCUT in vegMat, near and mid meshes)');
{
  let x = 2000, z = 0; for (let k = 0; k < 400 && !(clear(x, z, 30) && slope(x, z) < .1 && G(x, z) > T.WL + 3); k++) { x += 53; z += 31; }
  const p = man(x, z), e = eyeOf(p); camSt.raw = null; frame(p, e.x - 5.2, e.y + 2, e.z);
  ok(camera.near === 2, 'in the open the near plane stays at 2 m (' + camera.near + ')');
}
done();
