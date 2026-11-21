'use strict';
/* the trees' bands (VEG): a tree goes from the near mesh to the mid mesh, and from the mid mesh to its impostor, over fade m by a dither, and
   at every distance the two bands that meet must cover the whole tree between them. The fade-in half once kept the wrong side of the
   dither: at the far end of each fade both bands kept almost nothing, so a ring of trees round the eye (about 195 to 200 m and 725 to 730 m
   on Média) stood as a few dots and popped back further out. This runs the page's own shader lines (VFADE, the impostor's) and vegBands
   for every level, in JS, over the distances. The block lives in the 3D part of the page, which the harness does not load. A second */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const a = html.indexOf('const VEG = {'), b = html.indexOf('const VS = {', a);
const v = html.indexOf('const VAK = '), w = html.indexOf('const VWIND = ', v);
const fa = html.indexOf('function vegBands('), fb = html.indexOf('function vegDrop(', fa);
if (a < 0 || v < 0 || fa < 0) { console.log('no tree bands: a page before them'); process.exit(0); }
const ctx = vm.createContext({});
vm.runInContext(html.slice(a, b) + html.slice(v, w) + html.slice(fa, fb) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'veg.js' });
const $ = ctx.$, VEG = $('VEG'), VFADE = $('VFADE');
/* the impostor's lines: the string of vegImpMat's vertex code that sets vFade */
const im = html.match(/' float vegD = dE; vFade = [^\n]*?\\n'/);
ok(!!im, 'the impostor sets its fade from the distance (vegImpMat)');
const IMP = im ? vm.runInNewContext(im[0]) : '';

/* GLSL to JS: the statements that set vFade (from 'vFade =' on), uBand a vec4, clamp the GLSL one */
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
function fadeFn(glsl) {
  const body = glsl.split('\n').map(l => l.replace(/^\s*float vegD = [^;]*;\s*/, '')).filter(l => /vFade/.test(l)).join('\n').replace(/\bVAK\b.*$/s, '');
  return new Function('vegD', 'uBand', 'clamp', 'let vFade = 0;\n' + body + '\nreturn vFade;');
}
const fNear = fadeFn(VFADE), fImp = fadeFn(IMP);
/* the dither keeps a fragment of noise value g (0 to 1) when g <= vFade (vFade >= 0) or g >= -vFade (vFade < 0); -0 counts as >= 0 */
const keeps = (f, g) => (f >= 0 ? !(g > f) : !(g < -f));
const G = Array.from({ length: 1000 }, (_, i) => (i + .5) / 1000);
for (const lv of Object.keys(VEG.Q)) {
  const Q = VEG.Q[lv], f = Q.fade / 2;
  /* vegBands on stub meshes */
  const band = () => ({ material: { userData: { band: { value: { set(x, y, z, w) { Object.assign(this, { x, y, z, w }); } } } } }, visible: true });
  const V = { Q, near: [band(), band()], mid: [band(), band()], imp: band() };
  $('vegBands')(V);
  const B = { near: V.near[0].material.userData.band.value, mid: V.mid[0].material.userData.band.value, imp: V.imp.material.userData.band.value };
  let worst = 1, at = 0, holes = 0;
  for (let d = 1; d < Q.mid + f + 80; d += .5) {
    /* what vegPick puts a tree at d into: the near mesh inside near + f, the mid mesh from near - f out to mid + f; every tree has an impostor */
    const inNear = Q.near > 0 && d < Q.near + f, inMid = (!Q.near || d > Q.near - f) && d < Q.mid + f;
    const fn = inNear ? fNear(d, B.near, clamp) : null, fm = inMid ? fNear(d, B.mid, clamp) : null, fi = fImp(d, B.imp, clamp);
    const cov = G.filter(g => (fn !== null && keeps(fn, g)) || (fm !== null && keeps(fm, g)) || keeps(fi, g)).length / G.length;
    if (cov < worst) { worst = cov; at = d; }
    if (cov < .99) holes++;
  }
  ok(worst >= .99, lv + ': a tree is whole at every distance (near ' + Q.near + ' m, mid ' + Q.mid + ' m, fade ' + Q.fade + ' m): least ' + (worst * 100).toFixed(1) + '% of it, at ' + at + ' m' + (holes ? ', ' + holes / 2 + ' m of distances under 99%' : ''));
}
done();
