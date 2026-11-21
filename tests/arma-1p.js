'use strict';
/* the weapon's shot in first person (cf-pol-armas): the muzzle flash is a textured star (it was a SpriteMaterial without a map: a pale
   square in front of the muzzle on every shot, seen in the browser), the spent cases (when each weapon ejects one, how one flies, how many,
   gone when the weapon is not drawn) and the kick (heavier rounds kick harder, each shot thrown a little aside). The block lives in the 3D
   part of the page: it runs here on its own over stubs of THREE and the canvas, with SARMS from the simulation */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf("/* ---------- the weapon's shot, seen (cf-pol-armas)"), b = html.indexOf('/* each frame, after the world (render3d): the weapon in hand, if any */');
console.log('page: ' + H.PAGE);
if (a < 0 || b < 0 || b < a) { console.log('no flash, brass and kick block: a page before it'); process.exit(0); }
const SARMS = H.load().$('SARMS');

function load() {
  const draw = [], st = { t: 10 };
  class Tex { constructor(c) { this.image = c; } }
  class SpriteMaterial { constructor(o) { Object.assign(this, o); } }
  class Vec { constructor(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; } }
  class Obj { constructor() { this.position = { fromArray(p) { this.x = p[0]; this.y = p[1]; this.z = p[2]; } }; this.rotation = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; this.scale = { set() {} }; this.visible = true; } }
  const g2d = { fillStyle: null, createRadialGradient() { const q = { stops: [], addColorStop(o, c) { this.stops.push([o, c]); } }; draw.push(['grad', q]); return q; }, fillRect(...r) { draw.push(['rect', this.fillStyle, r]); }, beginPath() { draw.push(['path']); }, lineTo(x, y) { draw.push(['to', x, y]); }, closePath() {}, fill() { draw.push(['fill', this.fillStyle]); } };
  const sc = { kids: [], add(m) { this.kids.push(m); } };
  const ctx = vm.createContext({
    console, Math, reduced: false,
    document: { createElement: () => ({ width: 0, height: 0, getContext: () => g2d }) },
    THREE: { CanvasTexture: Tex, SpriteMaterial, AdditiveBlending: 2, CylinderGeometry: class { constructor() { this.userData = {}; } }, Mesh: Obj, Vector3: Vec },
    VM: { sc }, mat: c => ({ c }), clamp: (v, lo, hi) => Math.min(hi, Math.max(lo, v)), rand: (lo, hi) => lo + Math.random() * (hi - lo),
    get S() { return st; }
  });
  vm.runInContext(html.slice(a, b) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'vm-shot.js' });
  return { $: ctx.$, ctx, draw, st, sc };
}

console.log('-- the muzzle flash --');
{
  const { $, draw } = load(), m = $('vmFlashMat')(), m2 = $('vmFlashMat')();
  ok(m.map && m.map.image && m.map.image.width === 64, 'the flash\'s material has a map: a 64 px canvas (without one the sprite was a pale square)');
  ok(m.transparent && m.blending === 2 && m.depthWrite === false, '  added on top, see-through, writing no depth');
  ok(m2.map === m.map, '  the canvas drawn once, its texture shared by every weapon');
  const grads = draw.filter(d => d[0] === 'grad').map(d => d[1].stops), pts = draw.filter(d => d[0] === 'to').length;
  ok(grads.length >= 1 && grads.every(s => /,0\)$/.test(s[s.length - 1][1]) && /255,255,236,1/.test(s[0][1])), '  a white-hot core fading to nothing at the edge, so no corner of the square shows');
  ok(pts === 14, '  a star of seven spikes round it (' + pts + ' points)');
  const vb = html.slice(html.indexOf('function vmBuild(pk) {'), html.indexOf('/* the model of a weapon, or null while its pack file is not here'));
  ok(/new THREE\.Sprite\(vmFlashMat\(\)\)/.test(vb) && !/SpriteMaterial\(\{ color/.test(vb), 'vmBuild puts that material on the flash');
}

console.log('-- when a case comes out --');
{
  const { $ } = load(), E = $('vmEjectAt'), C = $('VMC');
  const cases = [['m4', 'rifle', 0], ['ak', 'rifle', 0], ['mg42', 'rifle', 0], ['m249', 'rifle', 0], ['garand', 'rifle', 0], ['k98', 'rifle', C.bolt], ['k98s', 'rifle', C.bolt], ['m1903', 'rifle', C.bolt], ['m82', 'rifle', 0],
    ['m1911', 'pistol', 0], ['p38', 'pistol', 0], ['rpg', 'tube', -1], ['javelin', 'tube', -1], ['stinger', 'tube', -1]];
  const bad = cases.filter(([id, cls, want]) => E(SARMS[id], cls) !== want);
  ok(!bad.length, cases.length + ' weapons: at the shot for the automatic and the semi-automatic, ' + C.bolt + ' s after it (the bolt worked) for the bolt rifles, never for a launcher' + (bad.length ? ': ' + bad.map(c => c[0] + ' ' + E(SARMS[c[0]], c[1])).join(', ') : ''));
  ok(E({ k: 'mort' }, 'mort') === -1, '  nor for the mortar');
}

console.log('-- the kick --');
{
  const { $ } = load(), K = $('vmKick'), C = $('VMC');
  ok(K(SARMS.k98, 'rifle') > K(SARMS.m4, 'rifle') * 1.6, 'a Kar 98k kicks harder than an M4 (' + K(SARMS.k98, 'rifle').toFixed(2) + ' against ' + K(SARMS.m4, 'rifle').toFixed(2) + ')');
  ok(K(SARMS.m82, 'rifle') === C.kick[1] && K({ dmg: 1 }, 'rifle') === C.kick[0], '  within ' + C.kick.join(' and '));
  ok(K(SARMS.m1911, 'pistol') === 1 && K(SARMS.rpg, 'tube') === 1, '  a pistol and a launcher kick as before');
  ok(/kick = ts < \.15 \? \(1 - ts \/ \.15\) \* \(p\.arms\[p\.w\]\.d\.k \? \.03 : \.007 \* vmKick\(/.test(html), '  and the view on foot kicks up by the same power');
}

console.log('-- a shot seen, and its case --');
{
  const { $, ctx, st, sc } = load(), shot = $('vmShot'), VM = ctx.VM, C = $('VMC'), cas = $('vmCas');
  const a = { t: -9 }, w = SARMS.m4;
  shot(a, w, 'rifle'); ok(!VM.ej && VM.kx === undefined, 'the first frame with a weapon in hand: no shot');
  a.t = 10; st.t = 10; shot(a, w, 'rifle'); ok(VM.ej === 10 && Math.abs(VM.kx) <= 1 && Math.abs(VM.kz) <= 1, 'an M4 fired: its case due at once, and the kick thrown aside by a new draw');
  const kx = VM.kx; a.t = 10.085; shot(a, w, 'rifle'); ok(VM.kx !== kx, '  the next shot: another throw');
  const b = { t: 12 }; shot(b, SARMS.k98, 'rifle'); VM.ej = 0; b.t = 13; shot(b, SARMS.k98, 'rifle'); ok(VM.ej === 13 + C.bolt, 'a weapon swapped in is no shot; a Kar 98k fired: its case when the bolt is worked, ' + C.bolt + ' s after');
  const port = { getWorldPosition: v => { v.x = .12; v.y = -.1; v.z = -.3; return v; } }, V = { ej: port, root: { updateMatrixWorld() {} }, pk: { cls: 'rifle' } };
  VM.ej = st.t = 20; cas(V, 1 / 60);
  ok(VM.cas.length === 1 && sc.kids.length === 1 && VM.cas[0].m.visible, 'its time come: a case out of the port');
  const c = VM.cas[0], y0 = c.p[1], x0 = c.p[0]; for (let i = 0; i < 9; i++) cas(V, 1 / 60); const yUp = c.p[1];
  for (let i = 0; i < 20; i++) cas(V, 1 / 60);
  ok(c.p[0] > x0 + .2 && yUp > y0 && c.p[1] < yUp, '  it flies out to the right, up, then down');
  for (let i = 0; i < 30; i++) cas(V, 1 / 60); ok(!c.m.visible, '  and is gone in ' + C.life + ' s');
  for (let i = 0; i < 10; i++) { VM.ej = st.t; cas(V, .02); } ok(VM.cas.length === C.n, 'ten shots fast: at most ' + C.n + ' cases in the air, the oldest reused');
  cas(null, 0, true); ok(VM.cas.every(q => !q.m.visible) && !VM.ej, 'the weapon not drawn (aboard, the scope, dead): every case gone');
}
{
  const { $, ctx } = load(); ctx.reduced = true; const VM = ctx.VM; VM.ej = 1; ctx.S.t = 5;
  $('vmCas')({ ej: { getWorldPosition: v => v }, root: { updateMatrixWorld() {} }, pk: { cls: 'rifle' } }, 1 / 60);
  ok(!(VM.cas || []).length, 'reduced motion: no cases');
}
done();
