'use strict';
/* the water's shore (cf-pol-graficos 2): the water shader knows how deep it is over the ground (clearer and lighter in the shallows, foam
   along the bank) by reading the terrain mesh's heights (envBedTex) and laying the mesh's own two triangles a cell over them (envBed). If
   its ground is not the drawn ground, the foam floats off the bank or sinks under it. This runs the shader's own envH and envBed lines in
   JS, over a texture made by the page's envBedTex, against the triangles three.js r128's PlaneGeometry builds (the page pins r128), and
   checks that a bridge's fall (which sinks the mesh) reaches the texture (envBedSync), and that every uniform the shaders read is given.
   The block lives in the 3D part of the page, which the harness does not load. A second */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const wa = html.indexOf('const ENV_WATER_F = `'), wb = html.indexOf('`;', wa);
const ta = html.indexOf('function envBedTex() {'), tb = html.indexOf('/* a cloud\'s puff', ta);
if (wa < 0 || ta < 0) { console.log('no shore on the water: a page before it'); process.exit(0); }
const WF = html.slice(wa + 'const ENV_WATER_F = `'.length, wb);

console.log('-- the page draws with three.js r128, whose PlaneGeometry this checks against --');
ok(/three\.js\/r128\/three\.min\.js/.test(html), 'three.js r128 from the CDN');

/* the r128 PlaneGeometry's grid, turned flat as buildWorld turns it: vertex k = ix + (N + 1) iz at (x0 + ix cx, z0 + iz cz); per cell the
   faces (a, b, d) and (b, c, d), a = (ix, iz), b = (ix, iz + 1), c = (ix + 1, iz + 1), d = (ix + 1, iz) */
function grid(N, seed) {
  let s = seed; const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  const G = { N, x0: -1000, z0: -700, cx: 90, cz: 85, WL: 52, y: new Float32Array((N + 1) * (N + 1)) };
  for (let k = 0; k < G.y.length; k++) G.y[k] = G.WL + (rnd() - .55) * 14;
  G.tris = [];
  for (let iz = 0; iz < N; iz++) for (let ix = 0; ix < N; ix++) {
    const a = ix + (N + 1) * iz, b = ix + (N + 1) * (iz + 1), c = ix + 1 + (N + 1) * (iz + 1), d = ix + 1 + (N + 1) * iz;
    G.tris.push([a, b, d], [b, c, d]);
  }
  G.at = k => [G.x0 + (k % (N + 1)) * G.cx, G.z0 + Math.floor(k / (N + 1)) * G.cz];
  /* the drawn ground at (x, z): the face over it, by its barycentric weights */
  G.mesh = (x, z) => {
    const ix = Math.min(N - 1, Math.floor((x - G.x0) / G.cx)), iz = Math.min(N - 1, Math.floor((z - G.z0) / G.cz));
    for (const t of [G.tris[(iz * N + ix) * 2], G.tris[(iz * N + ix) * 2 + 1]]) {
      const [p, q, r] = t.map(G.at), det = (q[1] - r[1]) * (p[0] - r[0]) + (r[0] - q[0]) * (p[1] - r[1]);
      const l1 = ((q[1] - r[1]) * (x - r[0]) + (r[0] - q[0]) * (z - r[1])) / det, l2 = ((r[1] - p[1]) * (x - r[0]) + (p[0] - r[0]) * (z - r[1])) / det, l3 = 1 - l1 - l2;
      if (l1 >= -1e-9 && l2 >= -1e-9 && l3 >= -1e-9) return l1 * G.y[t[0]] + l2 * G.y[t[1]] + l3 * G.y[t[2]];
    }
    throw new Error('no face under ' + x + ', ' + z);
  };
  return G;
}

/* the page's envBedTex and envBedSync over a stub mesh, and the shader's envH and envBed in JS (float -> let; vec2, texture2D, clamp,
   floor and sqrt as GLSL has them, the texture read nearest as the GPU does; envSl, the slope envBed leaves, a global as in the shader) */
function page(G) {
  const pos = { count: G.y.length, version: 0, getY: k => G.y[k] };
  class DataTexture { constructor(d, w, h) { this.image = { data: d, width: w, height: h }; this.ups = 0; } set needsUpdate(v) { if (v) this.ups++; } dispose() {} }
  const ctx = vm.createContext({ Math, THREE: { DataTexture, RGBAFormat: 1023, FloatType: 1015, NearestFilter: 1003 },
    ENV: { terrain: { geometry: { attributes: { position: pos } } }, water: {}, wu: {} } });
  vm.runInContext(html.slice(ta, tb) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'envBed.js' });
  const tex = ctx.$('envBedTex()');
  const fn = name => { const m = WF.match(new RegExp('float ' + name + '\\(([^)]*)\\) \\{([\\s\\S]*?)\\n?\\}\\n')); return m && { args: m[1].replace(/\b(float|vec2)\b/g, '').trim(), body: m[2].replace(/\bfloat\b/g, 'let') }; };
  const h = fn('envH'), b = fn('envBed');
  if (!h || !b) return null;
  const U = { tH: tex, uHG: { x: G.x0, y: G.z0, z: 1 / G.cx, w: 1 / G.cz }, uHN: G.N };
  const tx = (t, uv) => { const w = t.image.width, i = Math.min(w - 1, Math.floor(uv.x * w)), j = Math.min(w - 1, Math.floor(uv.y * w)); return { r: t.image.data[(j * w + i) * 4] }; };
  const lib = { vec2: (x, y) => ({ x, y }), texture2D: tx, clamp: (v, a, c) => Math.min(c, Math.max(a, v)), floor: Math.floor, sqrt: Math.sqrt };
  const run = new Function(...Object.keys(lib), ...Object.keys(U), `let envSl = 0;\nfunction envH(${h.args}) {${h.body}}\nfunction envBed(${b.args}) {${b.body}}\nreturn { envBed, sl: () => envSl };`);
  const r = run(...Object.values(lib), ...Object.values(U));
  return { bed: r.envBed, sl: r.sl, tex, pos, ctx };
}

console.log('-- the shader\'s ground under the water is the drawn ground --');
for (const [N, seed] of [[8, 7], [24, 99], [200, 5]]) {
  const G = grid(N, seed), P = page(G);
  if (!ok(!!P, 'N ' + N + ': envH and envBed found in the water shader')) continue;
  let worst = 0, flips = 0, other = 0, slw = 0; let s = seed * 31;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let n = 0; n < 20000; n++) {   // inside the last thousandth of a cell, which the shader clamps as hgtT does
    const x = G.x0 + rnd() * (N - .002) * G.cx, z = G.z0 + rnd() * (N - .002) * G.cz, m = G.mesh(x, z), w = P.bed({ x, y: z });
    worst = Math.max(worst, Math.abs(w - m)); if ((m < G.WL) !== (w < G.WL)) flips++;
    /* the slope it leaves (the foam's width on the bank): the face's own, by a small step each way inside the face */
    const sl = P.sl(), e = .01, gx2 = (G.mesh(x + e, z) - G.mesh(x - e, z)) / (2 * e), gz2 = (G.mesh(x, z + e) - G.mesh(x, z - e)) / (2 * e), fx = ((x - G.x0) / G.cx) % 1, fzz = ((z - G.z0) / G.cz) % 1;
    if (fx > .01 && fx < .99 && fzz > .01 && fzz < .99 && Math.abs(fx + fzz - 1) > .01) slw = Math.max(slw, Math.abs(sl - Math.hypot(gx2, gz2)));
    /* the cell's other diagonal, which a different mesh would have: it must be told apart */
    const gx = (x - G.x0) / G.cx, gz = (z - G.z0) / G.cz, i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, k = j * (N + 1) + i, y = G.y;
    const alt = u >= v ? y[k] + (y[k + 1] - y[k]) * u + (y[k + N + 2] - y[k + 1]) * v : y[k] + (y[k + N + 1] - y[k]) * v + (y[k + N + 2] - y[k + N + 1]) * u;
    other = Math.max(other, Math.abs(alt - m));
  }
  ok(worst < 1e-3, 'N ' + N + ': the shader\'s ground matches the mesh within ' + worst.toExponential(1) + ' m over 20000 points');
  ok(flips === 0, 'N ' + N + ': wet and dry agree with the mesh at every point (' + flips + ' disagree)');
  ok(slw < 1e-4, 'N ' + N + ': the slope it leaves is the drawn face\'s (off by ' + slw.toExponential(1) + ')');
  ok(other > .5, 'N ' + N + ': (the test tells the other diagonal apart: ' + other.toFixed(2) + ' m off)');
}

console.log('-- a bridge\'s fall sinks the mesh: the texture follows --');
{
  const G = grid(10, 3), P = page(G), k = 5 * 11 + 4, before = P.tex.image.data[k * 4], ups = P.tex.ups;
  P.ctx.$('envBedSync()'); ok(P.tex.ups === ups, 'nothing changed: the texture is not sent again');
  G.y[k] = G.WL - 3; P.pos.version++;
  P.ctx.$('envBedSync()');
  ok(P.tex.image.data[k * 4] === G.WL - 3 && before !== G.WL - 3 && P.tex.ups === ups + 1, 'the sunk point is in the texture, sent once');
  ok(Math.abs(P.bed({ x: G.at(k)[0], y: G.at(k)[1] }) - (G.WL - 3)) < 1e-4, 'and the shader reads it there');
}

console.log('-- every uniform the shaders read is given --');
{
  const ea = html.indexOf('function envApply() {'), eb = html.indexOf('\n}\n', ea), apply = html.slice(ea, eb);
  const wm = apply.match(/if \(ENV\.water && Q\.water[\s\S]*?ENV\.wu = u;/), wsrc = wm ? wm[0] : '';
  const need = [...WF.matchAll(/uniform \w+ (\w+);/g)].map(m => m[1]);
  const miss = need.filter(n => !new RegExp('\\b' + n + ':').test(wsrc));
  ok(need.length >= 12 && !miss.length, 'the water: ' + need.length + ' uniforms, all given' + (miss.length ? ' (missing ' + miss.join(', ') + ')' : ''));
  ok(/extensions: \{ derivatives: true \}/.test(wsrc), 'the water asks for derivatives (fwidth, on WebGL 1)');
  const hs = html.indexOf('function envTerrainHook(sh) {'), hk = html.slice(hs, html.indexOf('\n}\n', hs));
  const tu = (apply.match(/ENV\.tu = \{[^\n]*\};/) || [''])[0];
  const tneed = [...hk.matchAll(/uniform \w+ (\w+);/g)].map(m => m[1]);
  const tmiss = tneed.filter(n => !new RegExp('\\b' + n + ':').test(tu));
  ok(tneed.includes('uWL') && !tmiss.length, 'the ground: ' + tneed.length + ' uniforms, all given, the water\'s height among them' + (tmiss.length ? ' (missing ' + tmiss.join(', ') + ')' : ''));
}
done();
