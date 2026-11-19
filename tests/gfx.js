'use strict';
/* the graphics quality (GFX, GFXQ): the three levels, the choice kept between matches, the first pick by the video card, and the level that
   a change in the hangar asks for. The block lives in the 3D part of the page, which the harness does not load, so it runs here on its own
   with the few names it wraps stubbed */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('/* ---------- graphics quality'), b = html.indexOf('/* the HUD: the hour, the light and the weather');
console.log('page: ' + H.PAGE);
if (a < 0) { console.log('no graphics quality block: a page before it'); process.exit(0); }
const block = html.slice(a, b);

function load(saved, gpu) {
  const store = new Map(saved ? [['ceu-de-ferro-3d-graficos', saved]] : []), demos = [];
  const ctx = vm.createContext({
    console, localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) },
    document: { querySelectorAll: () => [] },
    renderer: gpu === undefined ? undefined : { getContext: () => ({ getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 1 }), getParameter: () => gpu, RENDERER: 2 }) },
    clamp: (v, lo, hi) => Math.min(hi, Math.max(lo, v)), rand: (lo, hi) => lo + Math.random() * (hi - lo),
    sky3Init() {}, buildWorld() {}, skyScene() {}, resize() {}, ready: true, playMode: 'demo', startDemo: () => demos.push(1)
  });
  vm.runInContext(block + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'gfx.js' });
  return { $: ctx.$, store, demos };
}

console.log('-- the levels --');
{
  const { $ } = load(), Q = $('GFXQ');
  ok(Q.length === 3 && Q.map(q => q.k).join() === 'baixa,media,alta', 'three levels: Baixa, Média, Alta');
  ok(Q[0].det < Q[1].det && Q[1].det < Q[2].det && Q[0].dpr <= Q[1].dpr && Q[1].dpr <= Q[2].dpr, 'each level draws the ground in more detail and at no fewer pixels than the one below');
  ok(!Q[0].shadow && !Q[1].shadow && Q[2].shadow > 0, 'only Alta has the sun cast shadows');
  ok($('gfxLevel()') === 1, 'with nothing picked and no video card seen yet, the level is Média');
}

console.log('-- kept between matches --');
{
  const { $, store, demos } = load();
  $('gfxSet')('alta');
  ok($('gfxLevel()') === 2 && store.get('ceu-de-ferro-3d-graficos') === 'alta', 'a pick in the hangar is the level and is saved');
  ok(demos.length === 1, 'and the world behind the hangar is built again with it');
  $('gfxSet')(0); ok($('gfxLevel()') === 0 && store.get('ceu-de-ferro-3d-graficos') === 'baixa', 'a level by its number is saved by its name');
  $('gfxSet')('ultra'); ok($('gfxLevel()') === 0, 'an unknown level changes nothing');
  ok(load('alta').$('gfxLevel()') === 2, 'the next visit starts on the saved level');
  ok(load('nada').$('gfxLevel()') === 1, 'an unknown saved value is ignored');
}

console.log('-- the first pick by the video card --');
{
  const pick = gpu => { const g = load(null, gpu); g.$('gfxAuto')(); return g.$('gfxLevel()'); };
  ok(pick('ANGLE (Intel, Mesa Intel(R) UHD Graphics (ADL-S GT0.5), OpenGL ES 3.2)') === 0, 'an Intel built into the processor starts on Baixa');
  ok(pick('ANGLE (NVIDIA Corporation, NVIDIA GeForce RTX 3050 6GB Laptop GPU/PCIe/SSE2, OpenGL ES 3.2)') === 1, 'an RTX starts on Média');
  ok(pick('ANGLE (AMD, AMD Radeon(TM) Graphics, OpenGL 4.6)') === 0 && pick('ANGLE (AMD, AMD Radeon RX 6600, OpenGL 4.6)') === 1, 'an AMD built into the processor starts on Baixa, a Radeon RX on Média');
  ok(pick('Google SwiftShader') === 0 && pick('llvmpipe (LLVM 17.0.6, 256 bits)') === 0, 'drawing in software starts on Baixa');
  const g = load('alta', 'ANGLE (Intel, Mesa Intel(R) UHD Graphics)'); g.$('gfxAuto')();
  ok(g.$('gfxLevel()') === 2, 'a saved pick wins over the video card');
}
done();
