'use strict';
/* the sparks (the points syncScene draws: smoke puffs, flak, dust, fuel vapour, rocket ribbons, soldiers' specks, smoke screens, and the
   glowing ones: fire, flashes, tracer heads, motor flames) once took neither the light nor the haze: a smoke screen stood white at night
   and sharp in the fog. Now what does not glow (red under .98) takes the day's light (amb, as XFX's smoke) and the haze. This runs the
   page's skyScene wrapper that sets them with a stub scene, and the fragment shader's colour lines in JS. The block lives in the 3D part of
   the page, which the harness does not load. A second */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const a = html.indexOf("/* the sparks' smoke, dust and screens: the day's light"), b = html.indexOf('/* the renderer', a);
const fa = html.indexOf("fragmentShader: 'varying vec4 vc; varying float vd;"), fb = html.indexOf("' }));", fa);
if (a < 0 || fa < 0) { console.log('no light on the sparks: a page before it'); process.exit(0); }

console.log('-- skyScene sets the light and the haze each frame --');
{
  const col = { r: 0, g: 0, b: 0, copy(c) { Object.assign(this, { r: c.r, g: c.g, b: c.b }); return this; } };
  const u = { amb: { value: 1 }, fC: { value: col }, fN: { value: 1e9 }, fF: { value: 2e9 }, scale: { value: 500 } };
  const ctx = vm.createContext({ clamp: (v, lo, hi) => Math.min(hi, Math.max(lo, v)), sparks: { material: { uniforms: u } }, S: { sky: { L: 1 } },
    scene: { fog: { near: 120, far: 9000, color: { r: .5, g: .6, b: .7 } } }, skyScene() {} });
  vm.runInContext(html.slice(a, b) + '\n;globalThis.$ = s => eval(s);', ctx);
  const $ = ctx.$;
  $('skyScene()'); ok(u.amb.value === 1 && u.fN.value === 120 && u.fF.value === 9000 && col.b === .7, 'by day: full light, and the scene\'s haze copied');
  ctx.S.sky.L = 0; $('skyScene()'); ok(Math.abs(u.amb.value - .16) < 1e-9, 'at night: the light down to .16 (as the bursts\' smoke)');
  ctx.scene.fog = null; $('skyScene()'); ok(u.fN.value >= 1e9, 'no haze in the scene: none on the sparks');
}

console.log('-- the fragment shader: what glows stays, the rest is lit and hazed --');
{
  const fsrc = html.slice(fa, fb);
  const has = s => fsrc.includes(s);
  ok(has('float lit = step(vc.r, 0.98);') && has('vec3 c = mix(vc.rgb, vc.rgb * amb * sh, lit);') && has('c = mix(c, fC, smoothstep(fN, fF, vd) * lit);'), 'the colour: lit by amb (and the sun, sh) and hazed unless red is full');
  /* cf-pol-graficos 3: the lit ones are shaded as balls by the sun, sunK of it; with no sun (night, rain) sh is 1, the light as before */
  ok(/float sh = mix\(1\.0, [^;]*vSun[^;]*, sunK\);/.test(fsrc), 'the sun shades them as balls, none of it at sunK 0');
  /* the same lines in JS */
  const sstep = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const shade = (rgb, amb, d, fN, fF, fC) => { const lit = rgb[0] <= .98 ? 1 : 0, c = rgb.map(v => v + (v * amb - v) * lit), f = sstep(fN, fF, d) * lit; return c.map((v, i) => v + (fC[i] - v) * f); };
  const screen = shade([.79, .8, .78], .16, 100, 120, 9000, [0, 0, 0]), fire = shade([1, .6, .15], .16, 100, 120, 9000, [0, 0, 0]);
  ok(screen[0] < .14, 'a smoke screen at night is dark (' + screen[0].toFixed(3) + ')');
  ok(fire[0] === 1 && fire[1] === .6, 'a fire at night glows as before');
  const far = shade([.2, .2, .19], 1, 8900, 120, 9000, [.7, .75, .8]);
  ok(far[2] > .78, 'smoke at the haze\'s far end melts into it');
  /* every colour the page gives the sparks: the glowing kinds full red, the rest not */
  const s0 = html.indexOf('let k = 0; const pp = sparks.geometry'), s1 = html.indexOf('tracers.geometry.setDrawRange', s0), src = html.slice(s0, s1);
  const sets = [...src.matchAll(/pc\.set\((?:[^[]*\?\s*)?\[([^\]]*)\]/g)].map(m => +m[1].split(',')[0]);
  const glow = /'fire'\) \{ pc\.set\(\[1,|'flash'\) \{ pc\.set\(\[1,/.test(src) && /pc\.set\(\[1, \.55, \.18, \.8, 1, \.93, \.7, 1\]/.test(src), smoke = /'smoke'\) \{[^]*?pc\.set\(\[\.2, \.2, \.19,/.test(src);
  ok(sets.length > 8 && glow && smoke, 'fire, flash and flame full red, smoke grey (' + sets.length + ' colours read)');
}
done();
