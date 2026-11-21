'use strict';
/* the roads' look (cf-pol-graficos 2): since #100 each class's mesh drew only its first road (the others' rows were indexed from the first
   one's vertices); and the roads were flat MeshBasicMaterial ribbons, darkened by hand at night and never lit by the sun,
   the sky or a flare. Now envApply gives them a lit material and envRoadHook their surface (worn edges, ruts on dirt roads, a dashed
   centre line on a modern main road). The bridges found the road meshes by their old material (MeshBasicMaterial, polygon offset, double
   sided): with the new one a fallen bridge would leave its road hanging over the river. This checks that br3Init finds them by their mark,
   that the hook declares and is given every uniform and attribute it reads (a flare's light too), and, running the hook's GLSL lines in
   JS across each class of road, that the ruts lie in the deck where a vehicle's wheels go and the dashes only on a modern main road.
   The block lives in the 3D part of the page, which the harness does not load. A second */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const ha = html.indexOf('function envRoadHook(sh, u) {'), hb = html.indexOf('/* the sky: the horizon', ha);
const ba = html.indexOf('function br3Init() {'), bb = html.indexOf('\n}\n', ba) + 2;
const ia = html.indexOf('function sky3Ill(sh) {'), ib = html.indexOf('\n}\n', ia) + 2;
if (ha < 0 || ia < 0) { console.log('no lit roads: a page before them'); process.exit(0); }

console.log('-- buildWorld marks its roads and gives each vertex its place across and along --');
{
  const bw = html.slice(html.indexOf('function buildWorld() {'), html.indexOf('/* airfields, turned toward the middle of the map */'));
  ok(/rd\.push\(o, i \* st\)/.test(bw) && /setAttribute\('rd', new THREE\.BufferAttribute\(new Float32Array\(rd\), 2\)\)/.test(bw), 'the rd attribute: m across (o) and m along (i * st), two a vertex');
  ok(/me\.userData\.road = c/.test(bw), 'each road mesh marked with its class');
  const cs = html.slice(html.indexOf('function cityScene() {'), html.indexOf('cityFlush();', html.indexOf('function cityScene() {')));
  ok(/rd\.push\(w, s, -w, s\)/.test(cs) && /me\.userData\.road = -1; me\.userData\.hw = w;/.test(cs), 'a town\'s streets marked too (class -1, their half width), with their place across and along');
}

console.log('-- every road of a class is drawn, each over its own line --');
{
  /* buildWorld's road loop, over three straight roads (two of class 0, one of class 2): since #100 the rows' indices counted from each
     road's own start (i * NC), so every road of a class was drawn over the first one's vertices and the others never showed in 3D */
  const ra = html.indexOf('  /* roads follow the routes through the valleys'), rb = html.indexOf("  if (T.net) console.log('road meshes: '", ra);
  const line = (x0, z0, a, len) => ({ x0, z0, dx: Math.cos(a), dz: Math.sin(a), len });
  const es = [{ c: 0, p: line(0, 0, 0, 300) }, { c: 0, p: line(1000, 500, 1.2, 180) }, { c: 2, p: line(-400, 900, 2.5, 95) }];
  const meshes = [];
  class BA { constructor(a, n) { this.array = a; this.itemSize = n; this.count = a.length / n; } }
  const ctx = vm.createContext({ Math, Float32Array, console: { log() {} },
    THREE: { DoubleSide: 2, MeshBasicMaterial: class { constructor(o) { Object.assign(this, o); } }, BufferAttribute: BA,
      BufferGeometry: class { constructor() { this.attributes = {}; } setAttribute(k, a) { this.attributes[k] = a; } setIndex(i) { this.index = i; } },
      Mesh: class { constructor(g, m) { this.geometry = g; this.material = m; this.userData = {}; } } },
    RN: { w: [8, 6, 3.5, 3], pal: { ww2: [0, 1, 2, 3] }, off: [-2, -1.6, -1.2, -1] }, S: { era: 'ww2' }, P: { road: 9 }, T: { net: { e: es } }, ROADH: .35,
    roadsOf: T => T.net.e, hgt: () => 0, routeAt: (r, s) => ({ x: r.x0 + r.dx * s, z: r.z0 + r.dz * s, dx: r.dx, dz: r.dz }), scene: { add: m => meshes.push(m) } });
  vm.runInContext('(() => {\n' + html.slice(ra, rb) + '\n})()', ctx, { filename: 'roads.js' });
  ok(meshes.length === 2, 'one mesh per class there is (' + meshes.length + ')');
  for (const me of meshes) {
    const g = me.geometry, n = g.attributes.position.count, P = g.attributes.position.array, I = g.index, used = new Uint8Array(n);
    let mx = 0, off = 0; for (const k of I) { used[k] = 1; mx = Math.max(mx, k); }
    /* each triangle's corners on one road: the distance of each corner from that road's line, under the road's half width x 1.15 */
    const mine = es.filter(e => e.c === me.userData.road), hw = [8, 6, 3.5, 3][me.userData.road] * 1.15 + 1e-3;   // the positions are Float32
    const onRoad = (k, e) => { const x = P[k * 3] - e.p.x0, z = P[k * 3 + 2] - e.p.z0, a = x * e.p.dx + z * e.p.dz; return a > -1e-3 && a < e.p.len + 1e-3 && Math.abs(-x * e.p.dz + z * e.p.dx) <= hw; };
    for (let t = 0; t < I.length; t += 3) if (!mine.some(e => [I[t], I[t + 1], I[t + 2]].every(k => onRoad(k, e)))) off++;
    const roadsHit = mine.filter(e => { for (let k = 0; k < n; k++) if (used[k] && onRoad(k, e)) return true; return false; }).length;
    ok(mx === n - 1 && used.every(Boolean), 'class ' + me.userData.road + ': every vertex drawn (' + n + ', highest index ' + mx + ')');
    ok(!off && roadsHit === mine.length, 'class ' + me.userData.road + ': all ' + mine.length + ' roads drawn, no triangle across two of them (' + off + ' off)');
  }
}

console.log('-- a fallen bridge still finds the roads it sinks --');
{
  const mesh = (o) => Object.assign({ isMesh: true, userData: {}, geometry: { attributes: { position: { count: o.n || 4 } }, index: [] } }, o);
  const ter = mesh({ n: 9, material: { vertexColors: true } }), road = mesh({ material: { isMeshLambertMaterial: true, polygonOffset: true, side: 2 }, userData: { road: 2 } });
  const flag = mesh({ material: { isMeshBasicMaterial: true, polygonOffset: true, side: 2 } });
  const added = [];
  const ctx = vm.createContext({ S: { T: { N: 2 } }, THREE: { BoxGeometry: class {}, Group: class {}, DoubleSide: 2 }, BR3: { roads: [], mats: {} },
    scene: { traverse: f => [ter, road, flag].forEach(f), add: g => added.push(g) } });
  vm.runInContext(html.slice(ba, bb) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'br3.js' });
  ctx.$('br3Init()');
  const K = ctx.BR3;
  ok(K.ter === ter, 'the ground found');
  ok(K.roads.length === 1 && K.roads[0] === road, 'the lit road found by its mark, and a double-sided offset mesh without the mark left alone (' + K.roads.length + ' found)');
}

console.log('-- the road shader: every uniform and attribute it reads is given --');
{
  const stub = () => ({ uniforms: {}, vertexShader: '#include <begin_vertex>\n#include <project_vertex>\n', fragmentShader: 'void main() {\n#include <color_fragment>\n#include <emissivemap_fragment>\n}' });
  const run = (sky) => {
    const ctx = vm.createContext({ ENV: { tu: { tEnv: { value: 'tex' }, uSoil: { value: 'soil' } } }, SKY3: { u: sky } });
    vm.runInContext(html.slice(ia, ib) + html.slice(ha, hb) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'road.js' });
    const sh = stub(); ctx.$('envRoadHook')(sh, { value: 'rd' }); return sh;
  };
  const sh = run({ uIll: { value: [] }, uIllK: { value: 0 } });
  const need = [...sh.fragmentShader.matchAll(/uniform \w+ (\w+)(?:\[\d+\])?;/g)].map(m => m[1]), miss = need.filter(n => !(n in sh.uniforms));
  ok(need.length >= 5 && !miss.length, need.length + ' uniforms read, all given' + (miss.length ? ' (missing ' + miss.join(', ') + ')' : ''));
  ok(/attribute vec2 rd;/.test(sh.vertexShader) && /vRd = rd;/.test(sh.vertexShader) && /varying vec2 vRd;/.test(sh.fragmentShader), 'the rd attribute passed to the fragment');
  ok(/uIll\[i\]/.test(sh.fragmentShader) && /vIllW = /.test(sh.vertexShader), 'a flare lights the road as it lights the ground');
  ok(/diffuseColor\.rgb = mix\( rc,/.test(sh.fragmentShader), 'the surface sets the diffuse colour, which the light then shades');
  const sh0 = run(null);
  ok(!/uIll/.test(sh0.fragmentShader), 'before the sky has its flares\' uniforms, the hook does not ask for them');
}

console.log('-- across each class of road: ruts where the wheels go, dashes on a modern main road only --');
{
  /* the hook's lines in JS: rut and dash, with the noise at its middle (0.5) and the n1.g term at its most */
  const src = html.slice(ha, hb), rl = src.match(/float rut = ([^;]*);/), dl = src.match(/float dash = ([^;]*);/);
  ok(!!rl && !!dl, 'the rut and dash lines found');
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const js = l => new Function('uRd', 'vRd', 'n1', 'n2', 'far', 'smoothstep', 'abs', 'step', 'fract', 'return ' + l.replace(/\b(\d+\.\d+)\b/g, '$1') + ';');
  const rut = js(rl[1]), dash = js(dl[1]), fract = x => x - Math.floor(x), step = (e, x) => (x >= e ? 1 : 0);
  /* uRd as envApply sets it: hw, dirt road (1 tracks and dirt roads; .5 a 1944 road; 0 a modern one), dashes (modern main road) */
  const ea = html.slice(html.indexOf('function envApply() {'), html.indexOf('/* the sky dome: the same mesh'));
  const um = ea.match(/new THREE\.Vector4\(([^,]+), ([^,]+), ([^,]+), ([^)]+)\)/), pv = ea.match(/paved = ([^;]+);/);
  ok(!!um && !!pv, 'envApply gives each class its uRd');
  const RN = { w: [8, 6, 3.5, 3] };
  for (const modern of [false, true]) for (let c = -1; c < 4; c++) {
    const S = { modern }, V = { c, S, st: c < 0, RN, o: { userData: { hw: 4.3 } } }; V.paved = vm.runInNewContext(pv[1], V);
    const w = vm.runInNewContext(um[4], V), x = vm.runInNewContext(um[1], V), y = vm.runInNewContext(um[2], V), z = vm.runInNewContext(um[3], V), U = { x, y, z };
    const n = { r: .5, g: 1, b: .5, a: .5 };
    let rutAt = [], dashAt = [];
    if (c < 0) ok(x === 4.3, (modern ? 'modern' : '1944') + ' town street: its own half width');
    ok(w === (c < 0 || (modern && c < 2) ? .2 : .55), (modern ? 'modern' : '1944') + (c < 0 ? ' town street' : ' class ' + c) + ': edges worn ' + w + (w < .5 ? ' (paved)' : ''));
    for (let o = -x; o <= x + 1e-9; o += .05) {
      if (rut(U, { x: o, y: 0 }, n, n, 0, sm, Math.abs, step, fract) > .5 * y) rutAt.push(o);   // a 1944 road's ruts at half strength
      if (dash(U, { x: o, y: 1 }, n, n, 0, sm, Math.abs, step, fract) > .5) dashAt.push(o);
    }
    const nm = (modern ? 'modern' : '1944') + (c < 0 ? ' town street' : ' class ' + c);
    if (y > 0) ok(rutAt.length && Math.min(...rutAt.map(Math.abs)) > .6 && Math.max(...rutAt.map(Math.abs)) < 1.3 && rutAt.some(o => o < 0) && rutAt.some(o => o > 0), nm + ': two ruts' + (y < 1 ? ' (faint)' : '') + ', 0.6 to 1.3 m each side of the middle');
    else ok(!rutAt.length, nm + ': no ruts');
    if (modern && c === 0) ok(dashAt.length && Math.max(...dashAt.map(Math.abs)) < .12, nm + ': a dash on the middle, a hand wide');
    else ok(!dashAt.length, nm + ': no dashes');
  }
}
done();
