'use strict';
/* the smoke's look (cf-pol-graficos 3): a missile's or a rocket's trail was PJ.n puffs taken every PJ.every s, 20 m and more apart for a missile,
   and a smoking or falling plane left a puff a sim step, so both read as beads on a string in the sky. pjRibbon now fills a trail between its
   samples and closes it up to the tail while the motor burns, and pjJoin joins a sim puff to the one before from the same source (puff's e,
   which nothing in the sim reads: the draws of rand must stay the same). The aircraft's shadow was a hard 14-sided disc right under each one:
   pshFrame casts a soft silhouette along the sun, turned to the heading, fading without sun. The smoke's shaders are lit by the sun (sunW,
   sunK), which the page must hand to both the sparks and the bursts (XFX). All of it lives in the 3D part of the page, which the harness does
   not load, so the pieces are run here in a vm of their own */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const fn = (head, end) => { const a = html.indexOf(head); if (a < 0) return null; const b = html.indexOf(end || '\n}\n', a); return html.slice(a, b + (end ? 0 : 3)); };
if (html.indexOf('function pjJoin(') < 0) { console.log('no joined trails: a page before them'); process.exit(0); }
const PJs = html.match(/const PJ = \{[^\n]*\};/)[0], clamp = (v, a, b) => Math.max(a, Math.min(b, v));

console.log('-- the sim: a puff remembers its source, and draws the same random numbers --');
{
  const src = fn('function puff(x, y, z, k, s, vx, vy, vz, e) {');
  ok(!!src, 'puff takes its source (e)');
  const run = (args) => {
    let n = 0; const S = { parts: [] }, ctx = vm.createContext({ S, rand: (a, b) => { n++; return (a + b) / 2; } });
    vm.runInContext(src + '\n;globalThis.$ = s => eval(s);', ctx); ctx.$('puff')(...args); return { n, q: S.parts[0] };
  };
  const E = { id: 7 }, a = run([1, 2, 3, 'smoke', 1.3]), b = run([1, 2, 3, 'smoke', 1.3, 0, 0, 0, E]);
  ok(a.n === b.n && a.n === 5, 'the same draws of rand with and without a source (' + a.n + ', ' + b.n + ')');
  ok(b.q.e === E && a.q.e === null, 'the puff keeps its source, null without one');
  ok(['vx', 'vy', 'vz', 'life', 'r'].every(k => a.q[k] === b.q[k]), 'and is otherwise the same puff');
  /* every trail that moves is tagged: the smoking and the falling plane, the helicopter, a burning or smoking vehicle, a missile, a rocket */
  const tags = (html.match(/puff\([^;]*'smoke'[^;]*, (p|o|m|b)\)/g) || []).length;
  ok(tags >= 8, tags + ' smoke puffs left by something on the move carry it (8 kinds of trail)');
}

console.log('-- a missile\'s trail: one band, not beads --');
{
  const src = fn('const pjRw = age =>', 'const pjSz = q =>');
  const ctx = vm.createContext({ Math }); vm.runInContext(PJs + src + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'pjRibbon.js' });
  const PJ = ctx.$('PJ'), pjRibbon = ctx.$('pjRibbon'), pjRw = ctx.$('pjRw');
  /* a missile at 300 m/s along x: 12 samples PJ.every s apart, the newest just taken */
  const t = { a: new Float32Array(PJ.n * 4), i: 0, n: PJ.n }, now = 10, V = 300;
  for (let j = 0; j < PJ.n; j++) { const age = (PJ.n - 1 - j) * PJ.every + .01; t.a.set([1000 - V * age, 50, 0, now - age], j * 4); }
  const tl = [1000, 50, 0];
  const pts = []; pjRibbon(t, tl, now, (x, y, z, age) => pts.push([x, age]), { x: 1000, y: 60, z: 150 }, 1 / 900);
  let worst = 0; for (let i = 1; i < pts.length; i++) worst = Math.max(worst, (pts[i][0] - pts[i - 1][0]) / pjRw(Math.min(pts[i][1], pts[i - 1][1])));
  const old = V * PJ.every / pjRw(0);
  ok(worst <= .5 && old > 10, 'seen from 150 m: puffs at most ' + worst.toFixed(2) + ' of their width apart (the samples alone were ' + old.toFixed(0) + ' widths apart)');
  ok(pts.length && pts[pts.length - 1][0] === 1000 && pts[pts.length - 1][1] === 0, 'while the motor burns the trail reaches the tail');
  ok(pts.every((p, i) => !i || p[0] >= pts[i - 1][0]) && pts.every(p => p[1] < PJ.life), 'oldest first, none older than its life');
  const p2 = []; pjRibbon(t, null, now, (x, y, z, age) => p2.push(x), { x: 1000, y: 60, z: 150 }, 1 / 900);
  ok(p2.length && p2[p2.length - 1] < 1000, 'with the motor out, no stretch to the round');
  /* far off the puffs between are no closer than PJ.px pixels: a trail 3 km away costs few */
  const far = []; pjRibbon(t, tl, now, (x, y, z, age) => far.push(x), { x: 1000, y: 60, z: 3000 }, 1 / 900);
  ok(far.length < pts.length / 3, 'from 3 km the trail takes ' + far.length + ' puffs against ' + pts.length + ' from 150 m');
  ok(pts.length <= PJ.n + (PJ.n) * PJ.sub, 'and never more than PJ.sub between two samples');
}

console.log('-- a smoking plane\'s puffs: joined to the one before from the same source --');
{
  const src = fn('const pjSz = q =>', 'function pjTrail(');
  const ctx = vm.createContext({ Math, clamp }); vm.runInContext(PJs + src + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'pjJoin.js' });
  const pjJoin = ctx.$('pjJoin'), pjSz = ctx.$('pjSz'), PJ = ctx.$('PJ');
  const P = (x, age, r) => ({ x, y: 300, z: 0, r: r || 3.4, max: 2, life: 2 - age });
  /* a plane at 250 m/s, a puff every .08 s (a hurt one): 20 m apart, each 7.5 m wide at birth */
  const o = P(0, .2), q = P(20, .12), got = [];
  const kk = pjJoin(o, q, (x, y, z, al, s) => got.push([x, al, s]));
  let worst = 0; const xs = [0, ...got.map(g => g[0]), 20]; for (let i = 1; i < xs.length; i++) worst = Math.max(worst, (xs[i] - xs[i - 1]) / pjSz(q));
  ok(got.length >= 3 && worst < .5, got.length + ' puffs between two 20 m apart, at most ' + worst.toFixed(2) + ' of a width apart (each was ' + (20 / pjSz(q)).toFixed(1) + ' widths apart)');
  ok(kk < 1 && kk >= .3 && got.every(g => g[1] < .5 * q.life / q.max), 'the band is fainter puff by puff, so that it is not darker than the beads were (q at ' + kk.toFixed(2) + ' of its opacity)');
  const near = []; ok(pjJoin(P(0, .2), P(1.2, .12), (...a) => near.push(a)) === 1 && !near.length, 'a smoking vehicle that hardly moves: nothing between, its puffs as they were');
  const late = []; ok(pjJoin(P(0, 1.2), P(20, .1), (...a) => late.push(a)) === 1 && !late.length, 'puffs born ' + 1.1 + ' s apart are not joined (a gap in the trail stays one)');
  const jump = []; ok(pjJoin(P(0, .2), P(400, .12), (...a) => jump.push(a)) === 1 && !jump.length, 'nor two 400 m apart');
  /* the frame's loop: one map from the source to its last puff, cleared each frame, and a puff without a source never joined */
  const sync = fn('function syncScene(dt) {');
  ok(/PJ\.pt\.clear\(\)/.test(sync) && /const o = q\.e && PJ\.pt\.get\(q\.e\); if \(q\.e\) PJ\.pt\.set\(q\.e, q\);/.test(sync), 'syncScene joins each puff to the last one of its own source, the map cleared each frame');
  ok(/MAXPR/.test(sync) && /if \(k >= TB\) return;/.test(sync), 'the trails leave MAXPR sparks for the soldiers and the smoke screens');
}

console.log('-- the aircraft\'s shadow: along the sun, turned, soft, faint without sun --');
{
  const src = fn('const PSH = {', 'function pshFrame() {') + fn('function pshFrame() {').replace(/\n\}\n$/, '');
  ok(!!src && /PlaneGeometry\(1, 1\); sg2\.rotateX/.test(html) && /map: pshTex\(0\)/.test(html), 'the shadow is a textured quad (it was a 14-sided disc)');
  class V3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } length() { return Math.hypot(this.x, this.y, this.z); } normalize() { const l = this.length() || 1; this.x /= l; this.y /= l; this.z /= l; return this; } setScalar(s) { this.x = this.y = this.z = s; return this; } }
  class Q { setFromUnitVectors() { return this; } setFromAxisAngle(a, ang) { this.ang = ang; return this; } multiply(q) { this.ang = q.ang; return this; } }
  const mesh = () => ({ visible: false, position: new V3(), scale: new V3(), quaternion: new Q(), material: { opacity: 0, map: null } });
  const run = (o) => {
    const shadows = [mesh()], sun = { intensity: o.si, position: new V3(...o.sun) };
    const ctx = vm.createContext({ Math, clamp, THREE: { Quaternion: Q, Vector3: V3, CanvasTexture: class {} }, TAU: Math.PI * 2, MS: 1, hgt: () => 0, shadows, camera: { position: o.cam || { x: 5000, y: 50, z: 5000 } },
      GFXQ: [{ shadow: 0 }, { shadow: 0 }, { shadow: 320 }], gfxLevel: () => o.lv || 1, SKY3: { sun, base: { sun: .85 } }, S: { planes: [o.p] },
      document: { createElement: () => ({ getContext: () => new Proxy({}, { get: () => () => {}, set: () => true }) }) } });
    vm.runInContext(src + '\n}\n;globalThis.$ = s => eval(s);', ctx, { filename: 'psh.js' }); ctx.$('pshFrame()'); return shadows[0];
  };
  const p = { x: 0, y: 400, z: 0, q: { x: 0, y: Math.sin(.4), z: 0, w: Math.cos(.4) }, def: { len: 12 } };
  const s = run({ p, sun: [-.8, 1, .35], si: .85 });
  const d = Math.hypot(s.position.x, s.position.z), dir = Math.atan2(s.position.z, s.position.x), want = Math.atan2(-.35, .8);
  ok(s.visible && d > 200 && Math.abs(dir - want) < .02, 'cast away from the sun: ' + d.toFixed(0) + ' m off, toward ' + (dir * 180 / Math.PI).toFixed(0) + '° (the sun\'s far side ' + (want * 180 / Math.PI).toFixed(0) + '°)');
  ok(Math.abs(s.quaternion.ang - .8) < 1e-6, 'turned to the plane\'s heading');
  const s2 = run({ p, sun: [-.8, 1, .35], si: 0 });
  ok(s2.material.opacity < s.material.opacity * .25, 'without sun (night, rain) it is faint: ' + s2.material.opacity.toFixed(3) + ' against ' + s.material.opacity.toFixed(3));
  const s3 = run({ p, sun: [-.8, .02, .35], si: .85 });
  ok(Math.hypot(s3.position.x, s3.position.z) < 400 / .35 * 1.01, 'a low sun does not throw it past the sun floor (' + Math.hypot(s3.position.x, s3.position.z).toFixed(0) + ' m)');
  const s4 = run({ p, sun: [-.8, 1, .35], si: .85, lv: 2, cam: { x: s.position.x, y: 50, z: s.position.z } });
  ok(!s4.visible, 'none where the Alta quality\'s real shadows are drawn (the plane casts its own)');
  const hi = run({ p: Object.assign({}, p, { y: 5000 }), sun: [0, 1, 0], si: .85 });
  ok(!hi.visible, 'none for a plane high up');
}

console.log('-- the smoke takes the sun: both shaders are given what they read --');
{
  const bw = fn('function buildWorld() {');
  ok(/sunW: \{ value: new THREE\.Vector3\(0, 1, 0\) \}, sunK: \{ value: 0 \}/.test(bw) && /uniform vec3 sunW;/.test(bw) && /uniform float amb, fN, fF, sunK;/.test(bw), 'the sparks declare and are given sunW and sunK');
  const xv = html.match(/const XV = [^\n]*\n[^\n]*/)[0], xp = fn('function xPts(');
  ok(/uniform vec3 sunW;/.test(xv) && /sunW: sparks\.material\.uniforms\.sunW/.test(xp) && /sunK: sparks\.material\.uniforms\.sunK/.test(xp) && /uniform float sunK;/.test(html.slice(html.indexOf('const XF = add =>'), html.indexOf('const XF = add =>') + 400)), 'the bursts share them');
  ok(/u\.sunW\.value\.copy\(s\.position\)\.normalize\(\); u\.sunK\.value = /.test(html), 'set each frame from the sun of the sky');
  ok(/else if \(k === 8\)/.test(fn('function xFrame() {')) && /xp\(gnd && !wet && i % 3 \? 8 : 3,/.test(fn('function xBlast(')), 'a burst on the ground raises earth-brown smoke (kind 8) with the black');
}
done();
