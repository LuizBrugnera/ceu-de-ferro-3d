'use strict';
/* the fires' look (cf-pol-graficos 3): a burning wreck, a vehicle on fire and a crater that burns on were round glowing blobs that lit nothing:
   at night a burning column was a few dots in the dark. Now the fire's sprites are flames (narrow at the top, hot at the foot), and the four
   lights the flares cast on the ground, the trees and the houses (sky3Ill) each have a colour (uIllC), and those no flare takes go, warm, to
   the fires nearest the eye (xFireLights). The block lives in the 3D part of the page, which the harness does not load: its pieces run here */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const a = html.indexOf('const XFL = {'), b = html.indexOf('skyScene = (g => () => { g(); try { xFireLights(); }', a);
if (a < 0 || b < 0) { console.log('no fire light: a page before it'); process.exit(0); }

console.log('-- the fires light the night: the flares\' free lights go to the nearest fires --');
{
  class V { constructor(x = 0, y = 0, z = 0, w = 0) { this.x = x; this.y = y; this.z = z; this.w = w; } set(x, y, z, w) { this.x = x; this.y = y; this.z = z; if (w !== undefined) this.w = w; return this; } }
  const mk = (o) => {
    const U = [0, 1, 2, 3].map(() => new V()), C = [0, 1, 2, 3].map(() => new V(1, 1, 1));
    o.flares.forEach((f, j) => U[j].set(f[0], f[1], f[2], f[3]));
    for (let j = o.flares.length; j < 4; j++) U[j].set(0, -1e5, 0, 0);
    const ctx = vm.createContext({ Math, SKY3: { u: { uIll: { value: U }, uIllC: { value: C }, uIllK: { value: o.K } } }, camera: { position: { x: 0, y: 20, z: 0 } },
      XFX: { E: o.E || [], wreck: 22, hurt: [.5, .25] }, S: { t: 3, wrecks: o.wrecks || [], units: o.units || [] } });
    vm.runInContext(html.slice(a, b) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'xfl.js' });
    return { n: ctx.$('xFireLights()'), U, C, XFL: ctx.$('XFL') };
  };
  const w = (x, life) => ({ u: { x, y: 0, z: 0 }, life }), car = (x, f, burn) => ({ x, y: 0, z: 0, hp: 100 * f, def: { hp: 100 }, burn });
  const r = mk({ K: 1.8, flares: [[50, 300, 0, 900]], wrecks: [w(400, 40), w(100, 30), w(200, 10), w(5000, 40)], units: [car(300, .1, 0), car(60, .9, 0), car(250, .9, .5)] });
  ok(r.n === 3, 'three free lights, three fires lit (' + r.n + ')');
  ok(r.U[0].w === 900 && r.C[0].x === 1 && r.C[0].z === 1, 'the flare keeps its light, white');
  const xs = r.U.slice(1).map(u => u.x);
  ok(JSON.stringify(xs) === JSON.stringify([100, 250, 300]), 'the nearest fires first: a burning wreck, a vehicle on fire, one under a quarter of its hull (' + xs + ')');
  ok(!xs.includes(200) && !xs.includes(60) && !xs.includes(5000), 'not a wreck that has stopped burning, a sound vehicle, nor one past XFL.far');
  ok(r.C.slice(1).every(c => c.x === r.XFL.col[0] && c.z < .5), 'each fire\'s light warm');
  ok(r.U.slice(1).every(u => u.w > 10 && u.w <= 42 && u.y > 0), 'over the fire, a few tens of metres round it');
  const day = mk({ K: 0, flares: [], wrecks: [w(100, 30)] });
  ok(day.n === 0 && day.U.every(u => u.w === 0), 'nothing by day');
  const crater = mk({ K: 1.8, flares: [], E: [{ on: true, x: 30, y: 0, z: 0, t: 1, L: 40 }] });
  ok(crater.n === 1 && crater.U[0].x === 30 && crater.U[0].w > 30, 'a heavy bomb\'s crater that burns on lights round it');
}

console.log('-- the flares\' shader: a colour per light, given wherever it is read --');
{
  const ia = html.indexOf('function sky3Ill(sh) {'), ib = html.indexOf('\n}\n', ia) + 2;
  const run = (u) => { const ctx = vm.createContext({ SKY3: { u } }); vm.runInContext(html.slice(ia, ib) + '\n;globalThis.$ = s => eval(s);', ctx); const sh = { uniforms: {}, vertexShader: '#include <project_vertex>', fragmentShader: '#include <emissivemap_fragment>' }; ctx.$('sky3Ill')(sh); return sh; };
  const sh = run({ uIll: { value: [] }, uIllC: { value: [] }, uIllK: { value: 0 } });
  ok(/uniform vec3 uIllC\[4\];/.test(sh.fragmentShader) && /ILLC\(i\) \* k \* k \* uIllK/.test(sh.fragmentShader) && 'uIllC' in sh.uniforms, 'each light tinted by its colour, the uniform given');
  const old = run({ uIll: { value: [] }, uIllK: { value: 0 } });
  ok(!/uniform vec3 uIllC/.test(old.fragmentShader) && /#define ILLC\(i\) vec3\(1\.0\)/.test(old.fragmentShader), 'without the colours (a sky made before them) the lights are white and nothing unread is asked for');
  ok(/uIllC: \{ value: \[0, 1, 2, 3\]\.map\(\(\) => new THREE\.Vector3\(1, 1, 1\)\) \}/.test(html), 'the sky makes the colours, white');
}

console.log('-- the light reaches what is drawn: the programs are kept by keys that say they have it --');
{
  /* three.js keeps a program by its material's customProgramCacheKey: the ground's (env-terrain-<level>), the roads' (env-road) and the
     vegetation's (veg-<kind>) did not change when the flares' light was hooked in, so the programs compiled without it were kept, and at
     Média and Alta no flare lit the ground, the trees or the grass (seen in the compiled shaders, cf-pol-graficos 3) */
  ok(/m\.onBeforeCompile = sh => \{ sky3Ill\(sh\); envTerrainHook\(sh\); \}; m\.customProgramCacheKey = \(\) => 'env-terrain-' \+ GFX\.lv \+ \(m\.onBeforeCompile !== envTerrainHook \? '-ill' : ''\)/.test(html), 'the ground compiled with the light from the start, under a key that says so');
  ok(/m\.customProgramCacheKey = \(\) => 'env-road' \+ \(SKY3\.u \? '-ill' : ''\)/.test(html), 'the roads\' key says whether they have it');
  const vm0 = html.slice(html.indexOf('function vegMat(o) {'), html.indexOf('\n}\n', html.indexOf('function vegMat(o) {')));
  ok(/customProgramCacheKey = \(\) => key \+ \(typeof SKY3 === 'object' && SKY3\.u \? '-ill' : ''\)/.test(vm0) && /if \(typeof SKY3 === 'object' && SKY3\.u\) sky3Ill\(sh\);/.test(vm0), 'the trees and the grass take it, under keys that say so');
  const ea = html.slice(html.indexOf('function envApply() {'), html.indexOf('function envApply() {') + 200);
  ok(/sky3U\(\)/.test(ea), 'the world makes the lights\' uniforms before anything is compiled (vegWarm compiles before the sky\'s first frame), so nothing is compiled twice');
  ok(/'trees', 'houses', 'roofs', 'rocks', 'bushes'/.test(html) && /wo\.ug\.mat/.test(html), 'the rocks, the bushes and the undergrowth take it too (they stood black on the lit ground)');
  const ia = html.indexOf('function sky3Ill(sh) {'), ib = html.indexOf('\n}\n', ia);
  ok(/if \(uIllK > 0\.0\) for \(int i = 0; i < 4; i\+\+\) \{ if \(uIll\[i\]\.w <= 0\.0\) continue;/.test(html.slice(ia, ib)), 'by day, or with no light on, the loop is skipped');
}

console.log('-- the fire\'s sprites are flames --');
{
  const xf = html.slice(html.indexOf('const XF = add =>'), html.indexOf('/* the scorch:'));
  ok(/float fl = step\(1\.5, vs\);/.test(xf) && /clamp\(0\.25 - p\.y \* 2\.0/.test(xf), 'a sprite with its seed past 1.5 is drawn narrow at the top');
  const fr = html.slice(html.indexOf('function xFrame() {'), html.indexOf('\n}\n', html.indexOf('function xFrame() {')));
  ok(/else if \(k === 1\) \{[^\n]*, sd \+ 2\); \}/.test(fr), 'the fire\'s particles (kind 1) are given it; the flash and the embers stay round');
}
done();
