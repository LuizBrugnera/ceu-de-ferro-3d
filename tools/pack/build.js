'use strict';
/* the models pack: builds models/pack/<id>.glb from free low-poly sources (CC0 / CC-BY, see tools/pack/config.js and models/LICENSES.md).
     node tools/pack/build.js            builds every model whose source is already downloaded (PACK_SRC, default: the system's temp dir)
     node tools/pack/build.js --fetch    downloads the missing sources from poly.pizza first
     node tools/pack/build.js abrams swat  only those models
   Every model comes out the same way, so the page reads them with one small reader (packRead in the page):
   - static (vehicles, weapons, props): +x forward, +y up, the ground at y 0, centred on x and z, in the source's own size (asset.extras.dims
     [length, width, height]; the page fits each to its vehicle). One node per part (hull, turret, gun, trackL, trackR, wheels), its translation
     the part's pivot (the turret's ring, the gun's trunnion), the vertices relative to it. Each part's mesh has two primitives: material 0
     "paint" (grey shades, the page multiplies them by the side's colour) and material 1 "fixed" (the source's own colours: tracks, tyres,
     glass, metal). Vertex colours (COLOR_0, 8 bit), no normals (the page draws flat shaded), 16-bit indices where they fit.
   - rig (soldiers): the skeleton (joints renamed with _ for the dots, so three's PropertyBinding takes them), one skinned mesh in the bind pose
     (8-bit joints and weights), the kept animations renamed short (config anims), +x forward, feet at y 0.
   Textured sources are sampled once per triangle (their textures are flat colour atlases), with ffmpeg decoding the image */
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), https = require('https');
const { read, M, worlds, Writer } = require('./glb');
const CFG = require('./config');
const ROOT = path.join(__dirname, '..', '..'), OUT = path.join(ROOT, 'models', 'pack'), SRC = process.env.PACK_SRC || path.join(os.tmpdir(), 'ceu-pack-src');

const srgb = v => (v <= .0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - .055);
const lum = c => .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const san = s => String(s).replace(/[.\[\]:\/| ]/g, '_');

/* ---------- download ---------- */
function get(url, bin) {
  return new Promise((ok, no) => https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (pack builder)', Referer: 'https://poly.pizza/' } }, r => {
    if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return get(new URL(r.headers.location, url).href, bin).then(ok, no);
    if (r.statusCode !== 200) return no(new Error(url + ': HTTP ' + r.statusCode));
    const c = []; r.on('data', d => c.push(d)); r.on('end', () => ok(bin ? Buffer.concat(c) : Buffer.concat(c).toString('utf8')));
  }).on('error', no));
}
async function fetchSrc(s) {
  const f = path.join(SRC, s.pid + '.glb'); if (fs.existsSync(f)) return f;
  const html = await get('https://poly.pizza/m/' + s.pid), m = html.match(/"ResourceID":"([0-9a-f-]+)"/), lic = html.match(/"Licence":"([^"]+)"/);
  if (!m) throw new Error(s.pid + ': no ResourceID on its page');
  if (lic && lic[1] !== s.lic) throw new Error(s.pid + ': licence on the page is ' + lic[1] + ', config says ' + s.lic);
  fs.writeFileSync(f, await get('https://static.poly.pizza/' + m[1] + '.glb', true)); console.log('fetched ' + s.pid + ' (' + s.title + ')'); return f;
}

/* ---------- texture sampling (ffmpeg decodes to PPM) ---------- */
function decode(img) {
  const tmp = path.join(os.tmpdir(), 'pack-tex-' + process.pid + (img.mime === 'image/png' ? '.png' : '.jpg'));
  fs.writeFileSync(tmp, img.bytes);
  const out = cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-i', tmp, '-f', 'image2pipe', '-vcodec', 'ppm', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 });
  fs.unlinkSync(tmp);
  let i = 0, f = []; while (f.length < 4) { while (out[i] === 0x20 || out[i] === 0x0a) i++; let s = ''; while (out[i] !== 0x20 && out[i] !== 0x0a) s += String.fromCharCode(out[i++]); f.push(s); } i++;
  return { w: +f[1], h: +f[2], px: out.slice(i) };
}
function sample(t, u, v) {
  u = u - Math.floor(u); v = v - Math.floor(v);
  const x = clamp(Math.floor(u * t.w), 0, t.w - 1), y = clamp(Math.floor(v * t.h), 0, t.h - 1), k = (y * t.w + x) * 3;
  return [t.px[k] / 255, t.px[k + 1] / 255, t.px[k + 2] / 255];
}

/* ---------- a source as world-space triangles: { p: 9 numbers, c: sRGB colour, m: material index, n: node name, (skinned) j, w per vertex } ---------- */
function triangles(G, keepSkin) {
  const { J, acc, image } = G, { W } = worlds(J), tris = [], texs = {};
  const tex = i => texs[i] || (texs[i] = decode(image(J.textures[i].source)));
  J.nodes.forEach((nd, ni) => {
    if (nd.mesh === undefined || !W[ni]) return;
    const sk = nd.skin !== undefined ? J.skins[nd.skin] : null, ibm = sk && acc(sk.inverseBindMatrices);
    const jm = sk && sk.joints.map((jn, k) => M.mul(W[jn], ibm ? Array.from(ibm.slice(k * 16, k * 16 + 16)) : M.id()));
    for (const p of J.meshes[nd.mesh].primitives) {
      if (p.mode !== undefined && p.mode !== 4) continue;
      const A = p.attributes, pos = acc(A.POSITION), uv = acc(A.TEXCOORD_0), vc = acc(A.COLOR_0), vcn = vc ? J.accessors[A.COLOR_0].type === 'VEC4' ? 4 : 3 : 0;
      const jo = sk && acc(A.JOINTS_0), we = sk && acc(A.WEIGHTS_0), n = pos.length / 3, idx = p.indices !== undefined ? acc(p.indices) : Float64Array.from({ length: n }, (_, i) => i);
      const mt = (J.materials || [])[p.material] || {}, pb = mt.pbrMetallicRoughness || {}, f = pb.baseColorFactor || [1, 1, 1, 1], bt = pb.baseColorTexture;
      const wp = new Float64Array(n * 3);
      for (let v = 0; v < n; v++) {
        let q;
        if (sk) { q = [0, 0, 0]; for (let k = 0; k < 4; k++) { const w = we[v * 4 + k]; if (!w) continue; const r = M.pt(jm[jo[v * 4 + k]], pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); q[0] += w * r[0]; q[1] += w * r[1]; q[2] += w * r[2]; } }
        else q = M.pt(W[ni], pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
        wp.set(q, v * 3);
      }
      for (let t = 0; t < idx.length; t += 3) {
        const a = idx[t], b = idx[t + 1], c = idx[t + 2];
        let col = [srgb(f[0]), srgb(f[1]), srgb(f[2])];
        if (bt && uv) { const s = sample(tex(bt.index), (uv[a * 2] + uv[b * 2] + uv[c * 2]) / 3, (uv[a * 2 + 1] + uv[b * 2 + 1] + uv[c * 2 + 1]) / 3); col = col.map((x, i) => x * s[i]); }
        if (vc) col = col.map((x, i) => x * srgb((vc[a * vcn + i] + vc[b * vcn + i] + vc[c * vcn + i]) / 3));
        const T = { p: [...wp.slice(a * 3, a * 3 + 3), ...wp.slice(b * 3, b * 3 + 3), ...wp.slice(c * 3, c * 3 + 3)], c: col, m: p.material, mn: mt.name || '', n: nd.name || '' };
        if (sk && keepSkin) { T.j = [a, b, c].map(v => [0, 1, 2, 3].map(k => sk.joints[jo[v * 4 + k]])); T.w = [a, b, c].map(v => [0, 1, 2, 3].map(k => we[v * 4 + k])); }
        tris.push(T);
      }
    }
  });
  return tris;
}

/* turn by yaw degrees about +y (so the source's front comes to +x), then centre on x and z and put the lowest point at y 0 */
function place(tris, o) {
  let a = (o.yaw || 0) * Math.PI / 180;
  if (o.pca) {   // a source turned at an odd angle: its long axis (in plan) first to x, then yaw
    let n = 0, mx = 0, mz = 0, sxx = 0, szz = 0, sxz = 0;
    for (const t of tris) for (let i = 0; i < 9; i += 3) { mx += t.p[i]; mz += t.p[i + 2]; n++; }
    mx /= n; mz /= n;
    for (const t of tris) for (let i = 0; i < 9; i += 3) { const x = t.p[i] - mx, z = t.p[i + 2] - mz; sxx += x * x; szz += z * z; sxz += x * z; }
    a += .5 * Math.atan2(2 * sxz, sxx - szz);
  }
  const c = Math.cos(a), s = Math.sin(a), k = o.scale || 1;
  for (const t of tris) for (let i = 0; i < 9; i += 3) { const x = t.p[i], z = t.p[i + 2]; t.p[i] = (x * c + z * s) * k; t.p[i + 1] *= k; t.p[i + 2] = (-x * s + z * c) * k; }
  if (o.len) { const b1 = box(tris), q = o.len / (b1[3] - b1[0]); for (const t of tris) for (let i = 0; i < 9; i++) t.p[i] *= q; o = Object.assign({}, o, { scale: k * q }); }
  const b = box(tris), dx = -(b[0] + b[3]) / 2, dy = -b[1], dz = -(b[2] + b[5]) / 2;
  for (const t of tris) for (let i = 0; i < 9; i += 3) { t.p[i] += dx; t.p[i + 1] += dy; t.p[i + 2] += dz; }
  const K = o.scale || 1, T = M.mul(M.trs([dx, dy, dz]), M.mul(M.trs(null, [0, Math.sin(a / 2), 0, Math.cos(a / 2)]), M.trs(null, null, [K, K, K])));
  return { T, dims: [b[3] - b[0], b[5] - b[2], b[4] - b[1]].map(v => v * 1) };
}
function box(tris) {
  const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (const t of tris) for (let i = 0; i < 9; i += 3) for (let d = 0; d < 3; d++) { b[d] = Math.min(b[d], t.p[i + d]); b[d + 3] = Math.max(b[d + 3], t.p[i + d]); }
  return b;
}

/* ---------- parts ---------- */
function components(tris) {
  const P = [], key = new Map(), find = i => (P[i] === i ? i : (P[i] = find(P[i])));
  const id = (x, y, z) => { const k = Math.round(x * 2e3) + ',' + Math.round(y * 2e3) + ',' + Math.round(z * 2e3); if (!key.has(k)) { key.set(k, P.length); P.push(P.length); } return key.get(k); };
  const tv = tris.map(t => [id(t.p[0], t.p[1], t.p[2]), id(t.p[3], t.p[4], t.p[5]), id(t.p[6], t.p[7], t.p[8])]);
  for (const [a, b, c] of tv) { P[find(b)] = find(a); P[find(c)] = find(a); }
  const groups = new Map(); tv.forEach((v, i) => { const r = find(v[0]); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(i); });
  return [...groups.values()];
}
function assign(tris, o, dims) {
  const b0 = box(tris), L = b0[3] - b0[0], H = b0[4] - b0[1], Wd = b0[5] - b0[2];
  const nrm = (x, y, z) => [(x - b0[0]) / L, (y - b0[1]) / H, (z - b0[2]) / Wd];
  for (const t of tris) {
    t.part = null;
    for (const [re, part] of o.nodes || []) if (new RegExp(re).test(t.n)) { t.part = part; break; }
  }
  if (o.split) {
    const free = tris.map((t, i) => i).filter(i => !tris[i].part), sub = free.map(i => tris[i]);
    for (const g of components(sub)) {
      const T = g.map(i => sub[i]), b = box(T), lo = nrm(b[0], b[1], b[2]), hi = nrm(b[3], b[4], b[5]), c = lo.map((v, i) => (v + hi[i]) / 2);
      const ex = [b[3] - b[0], b[4] - b[1], b[5] - b[2]];
      for (const r of o.split) {
        const inr = (k, v) => !r[k] || (v >= r[k][0] && v <= r[k][1]);
        if (!inr('cx', c[0]) || !inr('cy', c[1]) || !inr('cz', c[2]) || !inr('lo', lo[1]) || !inr('hi', hi[1]) || !inr('x0', lo[0]) || !inr('x1', hi[0])) continue;
        if (r.long && !(ex[0] > r.long * Math.max(ex[1], ex[2]))) continue;
        if (r.maxL && ex[0] / L > r.maxL) continue;
        for (const t of T) t.part = r.part;
        break;
      }
    }
  }
  for (const t of tris) {
    if (!t.part) t.part = o.def || 'hull';
    if (t.part === 'track' || t.part === 'wheel') { const cz = (t.p[2] + t.p[5] + t.p[8]) / 3; t.part = t.part === 'track' ? (cz < 0 ? 'trackL' : 'trackR') : 'wheels'; }
  }
}

/* paint: the materials named in o.paint (names or indices) become grey shades around the most used of them; the rest keep their colour */
function shade(tris, o) {
  const isP = t => (o.paint || []).some(p => (typeof p === 'number' ? t.m === p : new RegExp(p).test(t.mn))) || (!!o.paintLum && lum(t.c) >= o.paintLum[0] && lum(t.c) <= o.paintLum[1]);
  const use = new Map(); for (const t of tris) if (isP(t) && !o.paintLum) use.set(t.m, (use.get(t.m) || 0) + 1);
  const main = [...use.entries()].sort((a, b) => b[1] - a[1])[0], P = tris.filter(isP), ref = main ? lum(tris.find(t => t.m === main[0]).c) || .5 : P.length ? P.map(t => lum(t.c)).sort((a, b) => a - b)[P.length >> 1] || .5 : 1;
  for (const t of tris) t.paint = isP(t);
  for (const t of tris) { if (t.paint) { const s = clamp(.85 * lum(t.c) / ref, .4, 1); t.c = [s, s, s]; } }
}

/* ---------- writing ---------- */
function prim(w, tris, pivot, skin) {
  const map = new Map(), pos = [], col = [], jo = [], we = [], idx = [];
  for (const t of tris) for (let v = 0; v < 3; v++) {
    const x = t.p[v * 3] - pivot[0], y = t.p[v * 3 + 1] - pivot[1], z = t.p[v * 3 + 2] - pivot[2], c = t.c.map(q => Math.round(clamp(q, 0, 1) * 255));
    let k = Math.round(x * 1e4) + ',' + Math.round(y * 1e4) + ',' + Math.round(z * 1e4) + ',' + c;
    if (skin) k += ',' + t.j[v] + ',' + t.w[v].map(q => Math.round(q * 255));
    let i = map.get(k);
    if (i === undefined) {
      i = pos.length / 3; map.set(k, i); pos.push(x, y, z); col.push(...c);
      if (skin) { const ws = t.w[v], s = ws.reduce((a, b) => a + b, 0) || 1, q = ws.map(x => Math.round(x / s * 255)); q[q.indexOf(Math.max(...q))] += 255 - q.reduce((a, b) => a + b, 0); jo.push(...t.j[v].map(j => skin.get(j) || 0)); we.push(...q); }
    }
    idx.push(i);
  }
  const A = { POSITION: w.acc(new Float32Array(pos), 'VEC3', { minmax: 1, target: 34962 }), COLOR_0: w.acc(new Uint8Array(col), 'VEC3', { norm: 1, target: 34962 }) };
  if (skin) { A.JOINTS_0 = w.acc(new Uint8Array(jo), 'VEC4', { target: 34962 }); A.WEIGHTS_0 = w.acc(new Uint8Array(we), 'VEC4', { norm: 1, target: 34962 }); }
  return { attributes: A, indices: w.acc(pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), 'SCALAR', { target: 34963 }) };
}
const MATS = [{ name: 'paint', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 1 } }, { name: 'fixed', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 1 } }];

function buildStatic(id, o, G) {
  const tris = triangles(G);
  const { dims } = place(tris, o);
  assign(tris, o, dims); shade(tris, o);
  const w = new Writer(), J = w.J, parts = {};
  for (const t of tris) (parts[t.part] || (parts[t.part] = [])).push(t);
  J.materials = MATS; J.nodes = []; J.meshes = [];
  for (const part of Object.keys(parts)) {
    const T = parts[part], b = box(T);
    const pv = part === 'turret' ? [(b[0] + b[3]) / 2, b[1], (b[2] + b[5]) / 2] : part === 'gun' ? [b[0], (b[1] + b[4]) / 2, (b[2] + b[5]) / 2] : o.grip && part === (o.def || 'hull') ? o.grip.map((g, i) => [b[0], b[1], b[2]][i] + g * [b[3] - b[0], b[4] - b[1], b[5] - b[2]][i]) : [0, 0, 0];
    const ps = [];
    for (const m of [0, 1]) { const S = T.filter(t => (m === 0) === t.paint); if (S.length) ps.push(Object.assign(prim(w, S, pv), { material: m })); }
    J.meshes.push({ name: part, primitives: ps }); J.nodes.push({ name: part, translation: pv.map(v => +v.toFixed(5)), mesh: J.meshes.length - 1 });
  }
  J.scenes = [{ nodes: J.nodes.map((n, i) => i) }]; J.scene = 0;
  J.asset.extras = { id, dims: dims.map(v => +v.toFixed(4)), tris: tris.length, src: o.src };
  return { w, tris: tris.length, parts: Object.keys(parts).map(p => p + ':' + parts[p].length).join(' ') };
}

function buildRig(id, o, G) {
  const { J: S } = G, tris = triangles(G, true), sk = S.skins[0];
  const { T, dims } = place(tris, o), { W } = worlds(S);
  shade(tris, o);
  /* the nodes kept: every node of the scene that holds no mesh, under a new root carrying the placement */
  const keep = S.nodes.map((n, i) => i).filter(i => S.nodes[i].mesh === undefined && W[i]), nid = new Map(keep.map((n, k) => [n, k + 1]));
  const w = new Writer(), J = w.J;
  const tq = M.dec(T);
  J.nodes = [{ name: 'rig', translation: tq.t, rotation: tq.q, scale: tq.s, children: [] }];
  for (const i of keep) {
    const n = S.nodes[i], o2 = { name: san(n.name || 'n' + i) };
    if (n.matrix) { const d = M.dec(n.matrix); Object.assign(o2, { translation: d.t, rotation: d.q, scale: d.s }); }
    else { if (n.translation) o2.translation = n.translation; if (n.rotation) o2.rotation = n.rotation; if (n.scale) o2.scale = n.scale; }
    const ch = (n.children || []).filter(c => nid.has(c)).map(c => nid.get(c)); if (ch.length) o2.children = ch;
    J.nodes.push(o2);
  }
  const par = new Set(); keep.forEach(i => (S.nodes[i].children || []).forEach(c => par.add(c)));
  J.nodes[0].children = keep.filter(i => !par.has(i)).map(i => nid.get(i));
  const joints = sk.joints, jmap = new Map(joints.map((jn, k) => [jn, k]));
  for (const t of tris) for (const j of t.j) for (let k = 0; k < 4; k++) if (!jmap.has(j[k])) { jmap.set(j[k], joints.length); joints.push(j[k]); }
  const ibm = new Float32Array(joints.length * 16); joints.forEach((jn, k) => ibm.set(M.inv(M.mul(T, W[jn])), k * 16));
  J.materials = MATS; J.meshes = [{ name: 'body', primitives: [] }];
  for (const m of [0, 1]) { const ST = tris.filter(t => (m === 0) === t.paint); if (ST.length) J.meshes[0].primitives.push(Object.assign(prim(w, ST, [0, 0, 0], jmap), { material: m })); }
  J.skins = [{ joints: joints.map(j => nid.get(j)), inverseBindMatrices: w.acc(ibm, 'MAT4') }];
  J.nodes.push({ name: 'body', mesh: 0, skin: 0 });
  J.scenes = [{ nodes: [0, J.nodes.length - 1] }]; J.scene = 0;
  J.animations = [];
  for (const an of S.animations || []) {
    const short = an.name.replace(/^.*\|/, ''), nm = o.anims[short]; if (!nm) continue;
    const A = { name: nm, channels: [], samplers: [] };
    for (const ch of an.channels) {
      if (!nid.has(ch.target.node)) continue;
      const sm = an.samplers[ch.sampler], inp = G.acc(sm.input), out = G.acc(sm.output);
      if (ch.target.path === 'scale' && out.every(v => Math.abs(v - 1) < 1e-3)) continue;
      if (ch.target.path === 'weights') continue;
      A.samplers.push({ input: w.acc(new Float32Array(inp), 'SCALAR', { minmax: 1 }), output: w.acc(new Float32Array(out), ch.target.path === 'rotation' ? 'VEC4' : 'VEC3'), interpolation: sm.interpolation || 'LINEAR' });
      A.channels.push({ sampler: A.samplers.length - 1, target: { node: nid.get(ch.target.node), path: ch.target.path } });
    }
    J.animations.push(A);
  }
  J.asset.extras = { id, dims: dims.map(v => +v.toFixed(4)), tris: tris.length, src: o.src, anims: J.animations.map(a => a.name) };
  return { w, tris: tris.length, parts: 'anims ' + J.animations.map(a => a.name).join(',') };
}

function licences() {
  const used = new Set(Object.values(CFG.models).map(m => m.src)), L = ['# Licenças dos modelos', '',
    'Os modelos de `models/pack/` (o pack de modelos, carregado pela página em `/models/pack/`) saem de fontes livres pelo `tools/pack/build.js`, que os converte, corta em partes e recolore. Só fontes que permitem redistribuir: CC0 (domínio público) e CC-BY (com crédito, abaixo). O `f22.glb` é do Hernani (modelo próprio do projeto).', '',
    '| Arquivo(s) | Fonte | Autor | Licença |', '| --- | --- | --- | --- |'];
  for (const s of CFG.sources) {
    if (!used.has(s.pid)) continue;
    const files = Object.keys(CFG.models).filter(k => CFG.models[k].src === s.pid).map(k => '`' + k + '.glb`').join(', ');
    L.push('| ' + files + ' | [' + s.title + '](https://poly.pizza/m/' + s.pid + ') | ' + s.author + (s.also ? ' (' + s.also + ')' : '') + ' | ' + s.lic + ' |');
  }
  L.push('', 'CC-BY 3.0: https://creativecommons.org/licenses/by/3.0/ . CC0 1.0: https://creativecommons.org/publicdomain/zero/1.0/ .', '',
    'Mudanças feitas em todos: convertidos para GLB compacto, girados para +x, cores dos materiais passadas para as cores dos vértices (a pintura vira tons de cinza que a página tinge com a cor do lado), separados em partes (casco, torre, canhão, lagartas, rodas) e, no soldado, só as animações usadas.', '');
  fs.writeFileSync(path.join(ROOT, 'models', 'LICENSES.md'), L.join('\n'));
}

async function main() {
  const args = process.argv.slice(2), fetch = args.includes('--fetch'), only = args.filter(a => !a.startsWith('--'));
  fs.mkdirSync(SRC, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
  const srcs = new Map(CFG.sources.map(s => [s.pid, s]));
  for (const id of Object.keys(CFG.models)) {
    if (only.length && !only.includes(id)) continue;
    const o = CFG.models[id], s = srcs.get(o.src); if (!s) throw new Error(id + ': unknown source ' + o.src);
    let f = path.join(SRC, s.pid + '.glb');
    if (!fs.existsSync(f)) { if (!fetch) { console.log('skip ' + id + ': ' + s.pid + ' not downloaded (--fetch)'); continue; } f = await fetchSrc(s); }
    const G = read(f), r = o.rig ? buildRig(id, o, G) : buildStatic(id, o, G), n = r.w.write(path.join(OUT, id + '.glb'));
    const cap = o.budget || (o.rig ? 12000 : 8000);
    console.log((r.tris > cap ? 'OVER ' : '') + id + ': ' + r.tris + ' tris, ' + (n / 1024).toFixed(0) + ' KB, ' + r.parts);
  }
  licences();
}
main().catch(e => { console.error(e.stack || e); process.exit(1); });
