'use strict';
/* rain wets the ground (cf-pol-graficos 3): in the rain the ground and the roads stayed as dry as on a sunny day (only the water's surface
   took the rain). Now ENV.wet goes toward the rain's strength (envWet: quickly while it rains harder, slowly as it dries, by the battle's
   clock; a world that starts in the rain starts wet), and the ground's and the roads' shaders darken with it, glint, mirror the sky at a
   grazing look and hold puddles in the flat low spots. The block lives in the 3D part of the page, which the harness does not load */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const a = html.indexOf('const ENVW = {'), b = html.indexOf('/* the roads\' shader, on top of the Lambert one', a);
if (a < 0 || b < 0) { console.log('no wet ground: a page before it'); process.exit(0); }

console.log('-- how wet: toward the rain, fast to wet and slow to dry --');
{
  const S = { t: 0 }, ENV = {}, ctx = vm.createContext({ Math, S, ENV, clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)) });
  vm.runInContext(html.slice(a, b) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'wet.js' });
  const envWet = ctx.$('envWet'), ENVW = ctx.$('ENVW'), run = (r, s) => { let w; for (let i = 0; i < s * 10; i++) { S.t += .1; w = envWet(r); } return w; };
  ok(envWet(.85) === .85, 'a world that starts in the rain starts wet');
  ENV.wet = undefined; ENV.wt = undefined; S.t = 0; ok(envWet(0) === 0, 'and one that starts dry, dry');
  const w1 = run(.85, ENVW.up);
  ok(w1 > .5 && w1 < .85, 'rain on dry ground: ' + (w1 / .85 * 100).toFixed(0) + '% wet after ENVW.up s');
  const w2 = run(.85, 120);
  ok(Math.abs(w2 - .85) < .01, 'it soaks up to the rain\'s strength, no more');
  const w3 = run(0, ENVW.up);
  ok(w3 > .7, 'after the rain stops it dries slowly: ' + (w3 / .85 * 100).toFixed(0) + '% after the same ' + ENVW.up + ' s');
  const w4 = run(0, 1200);
  ok(w4 < .01, 'and dries out in time');
  const t0 = S.t, w5 = envWet(.85); S.t = t0; const w6 = envWet(.85);
  ok(w6 === w5, 'a paused battle (the clock still) does not change it');
}

console.log('-- the shaders read it, and are given it --');
{
  const th = html.slice(html.indexOf('function envTerrainHook(sh) {'), html.indexOf('/* rain wets the ground (cf-pol-graficos 3)'));
  ok(/uniform float uWet;/.test(th) && /uWet: \{ value: 0 \} \};/.test(html), 'the ground declares uWet, and ENV.tu (all its uniforms) has it');
  ok(/eB \*= \( 1\.0 - 0\.28 \* eWk \)/.test(th) && /float ePud = /.test(th), 'the ground darkens with it and holds puddles where it is flat');
  ok(/material\.specularShininess = mix\( material\.specularShininess, 48\.0, eWk \)/.test(th), 'and glints sharper');
  ok(/totalEmissiveRadiance \+= fogColor \* pow\( 1\.0 - clamp\( dot\( normalize\( cameraPosition - vEnvW \)/.test(th) && /#ifdef USE_FOG/.test(th), 'and mirrors the sky at a grazing look (a Phong material: cameraPosition is given)');
  ok(/#if ENV_Q == 0[\s\S]*\* \( 1\.0 - 0\.28 \* eWk \);\n#else/.test(th), 'on Baixa it darkens too');
  const rh = html.slice(html.indexOf('function envRoadHook(sh, u) {'), html.indexOf('/* the sky: the horizon'));
  ok(/uWet: ENV\.tu\.uWet \|\| \{ value: 0 \}/.test(rh) && /uniform float uWet;/.test(rh), 'the roads declare it and are given it');
  ok(/\* \( 1\.0 - 0\.32 \* uWet \* \( 1\.0 - 0\.3 \* rut \) \)/.test(rh) && /fogColor \* uWet \*/.test(rh) && !/cameraPosition/.test(rh.split('#include <emissivemap_fragment>')[1] || ''), 'and darken and sheen with it (by vRdD: a Lambert material has no cameraPosition)');
  ok(/if \(ENV\.tu && ENV\.tu\.uWet\) ENV\.tu\.uWet\.value = envWet\(clamp\(W\.r, 0, 1\)\);/.test(html), 'set each frame from the rain');
  ok(/ENV\.wet = ENV\.wt = undefined;/.test(html.slice(html.indexOf('function envApply() {'), html.indexOf('function envApply() {') + 600)), 'a new world starts over');
}
done();
