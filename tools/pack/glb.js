'use strict';
/* the little glTF toolkit of the models pack (tools/pack/build.js): read a GLB into plain arrays, 4x4 matrices (column-major, as glTF), and write a
   GLB back. No dependencies: the pack is built with node alone (and ffmpeg, only to read the colours of a textured source) */
const fs = require('fs');

const TYPES = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array, 5122: Int16Array, 5120: Int8Array };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const NORM = { 5121: 255, 5123: 65535, 5120: 127, 5122: 32767 };

function read(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32LE(0) !== 0x46546c67) throw new Error(file + ': not a GLB');
  const jl = b.readUInt32LE(12), J = JSON.parse(b.slice(20, 20 + jl).toString('utf8'));
  let bin = null, o = 20 + jl;
  if (o < b.length) { const bl = b.readUInt32LE(o); bin = b.slice(o + 8, o + 8 + bl); }
  const views = (J.bufferViews || []).map(v => bin.slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength));
  /* an accessor as a Float64Array of count * components (normalized integers scaled to 0..1) */
  const acc = i => {
    if (i === undefined || i === null) return null;
    const a = J.accessors[i], T = TYPES[a.componentType], n = NC[a.type], out = new Float64Array(a.count * n);
    if (a.bufferView === undefined) return out;
    const v = J.bufferViews[a.bufferView], view = views[a.bufferView], es = T.BYTES_PER_ELEMENT, stride = v.byteStride || n * es, base = a.byteOffset || 0;
    const dv = new DataView(view.buffer, view.byteOffset, view.byteLength), get = { 5126: 'getFloat32', 5125: 'getUint32', 5123: 'getUint16', 5121: 'getUint8', 5122: 'getInt16', 5120: 'getInt8' }[a.componentType];
    const k = a.normalized ? 1 / NORM[a.componentType] : 1;
    for (let e = 0; e < a.count; e++) for (let c = 0; c < n; c++) out[e * n + c] = dv[get](base + e * stride + c * es, true) * k;
    return out;
  };
  const image = i => { const im = J.images[i]; return { bytes: views[im.bufferView], mime: im.mimeType }; };
  return { J, acc, image };
}

/* 4x4 column-major matrices */
const M = {
  id: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  mul(a, b) { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; },
  trs(t, q, s) {
    t = t || [0, 0, 0]; q = q || [0, 0, 0, 1]; s = s || [1, 1, 1];
    const [x, y, z, w] = q, x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
    return [(1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0, (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0, (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0, t[0], t[1], t[2], 1];
  },
  node: n => (n.matrix ? n.matrix.slice() : M.trs(n.translation, n.rotation, n.scale)),
  pt: (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]],
  inv(m) {
    const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m;
    const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    const d = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
    return [(a11 * b11 - a12 * b10 + a13 * b09) * d, (a02 * b10 - a01 * b11 - a03 * b09) * d, (a31 * b05 - a32 * b04 + a33 * b03) * d, (a22 * b04 - a21 * b05 - a23 * b03) * d,
      (a12 * b08 - a10 * b11 - a13 * b07) * d, (a00 * b11 - a02 * b08 + a03 * b07) * d, (a32 * b02 - a30 * b05 - a33 * b01) * d, (a20 * b05 - a22 * b02 + a23 * b01) * d,
      (a10 * b10 - a11 * b08 + a13 * b06) * d, (a01 * b08 - a00 * b10 - a03 * b06) * d, (a30 * b04 - a31 * b02 + a33 * b00) * d, (a21 * b02 - a20 * b04 - a23 * b00) * d,
      (a11 * b07 - a10 * b09 - a12 * b06) * d, (a00 * b09 - a01 * b07 + a02 * b06) * d, (a31 * b01 - a30 * b03 - a32 * b00) * d, (a20 * b03 - a21 * b01 + a22 * b00) * d];
  },
  /* a rotation and translation (no shear) back to t, q, s */
  dec(m) {
    const sx = Math.hypot(m[0], m[1], m[2]), sy = Math.hypot(m[4], m[5], m[6]), sz = Math.hypot(m[8], m[9], m[10]);
    const r = [m[0] / sx, m[1] / sx, m[2] / sx, m[4] / sy, m[5] / sy, m[6] / sy, m[8] / sz, m[9] / sz, m[10] / sz], tr = r[0] + r[4] + r[8];
    let q;
    if (tr > 0) { const s = .5 / Math.sqrt(tr + 1); q = [(r[5] - r[7]) * s, (r[6] - r[2]) * s, (r[1] - r[3]) * s, .25 / s]; }
    else if (r[0] > r[4] && r[0] > r[8]) { const s = 2 * Math.sqrt(1 + r[0] - r[4] - r[8]); q = [.25 * s, (r[3] + r[1]) / s, (r[6] + r[2]) / s, (r[5] - r[7]) / s]; }
    else if (r[4] > r[8]) { const s = 2 * Math.sqrt(1 + r[4] - r[0] - r[8]); q = [(r[3] + r[1]) / s, .25 * s, (r[7] + r[5]) / s, (r[6] - r[2]) / s]; }
    else { const s = 2 * Math.sqrt(1 + r[8] - r[0] - r[4]); q = [(r[6] + r[2]) / s, (r[7] + r[5]) / s, .25 * s, (r[1] - r[3]) / s]; }
    return { t: [m[12], m[13], m[14]], q, s: [sx, sy, sz] };
  }
};

/* world matrices of every node, from the scene's roots */
function worlds(J) {
  const W = new Array(J.nodes.length), par = new Array(J.nodes.length).fill(-1);
  J.nodes.forEach((n, i) => (n.children || []).forEach(c => (par[c] = i)));
  const go = (i, P) => { W[i] = M.mul(P, M.node(J.nodes[i])); for (const c of J.nodes[i].children || []) go(c, W[i]); };
  const roots = J.scenes ? J.scenes[J.scene || 0].nodes : J.nodes.map((n, i) => i).filter(i => par[i] < 0);
  for (const r of roots) go(r, M.id());
  return { W, par };
}

/* a GLB from a glTF JSON (without buffers) and a list of typed arrays, each becoming a bufferView; acc(J) adds the accessors */
class Writer {
  constructor() { this.chunks = []; this.len = 0; this.J = { asset: { version: '2.0', generator: 'ceu-de-ferro tools/pack' }, buffers: [], bufferViews: [], accessors: [] }; }
  view(arr, target) {
    const pad = (4 - (this.len % 4)) % 4; if (pad) { this.chunks.push(Buffer.alloc(pad)); this.len += pad; }
    const b = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); this.chunks.push(b);
    this.J.bufferViews.push(Object.assign({ buffer: 0, byteOffset: this.len, byteLength: b.length }, target ? { target } : {})); this.len += b.length;
    return this.J.bufferViews.length - 1;
  }
  acc(arr, type, o) {
    const ct = arr instanceof Float32Array ? 5126 : arr instanceof Uint32Array ? 5125 : arr instanceof Uint16Array ? 5123 : 5121, n = NC[type];
    const a = Object.assign({ bufferView: this.view(arr, o && o.target), componentType: ct, count: arr.length / n, type }, o && o.norm ? { normalized: true } : {});
    if (o && o.minmax) { const mn = new Array(n).fill(Infinity), mx = new Array(n).fill(-Infinity); for (let i = 0; i < arr.length; i++) { const c = i % n; if (arr[i] < mn[c]) mn[c] = arr[i]; if (arr[i] > mx[c]) mx[c] = arr[i]; } a.min = mn; a.max = mx; }
    this.J.accessors.push(a); return this.J.accessors.length - 1;
  }
  write(file) {
    const pad = (4 - (this.len % 4)) % 4; if (pad) { this.chunks.push(Buffer.alloc(pad)); this.len += pad; }
    this.J.buffers = [{ byteLength: this.len }];
    let js = Buffer.from(JSON.stringify(this.J), 'utf8'); const jp = (4 - (js.length % 4)) % 4; js = Buffer.concat([js, Buffer.alloc(jp, 0x20)]);
    const h = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
    h.writeUInt32LE(0x46546c67, 0); h.writeUInt32LE(2, 4); h.writeUInt32LE(12 + 8 + js.length + 8 + this.len, 8);
    jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4e4f534a, 4); bh.writeUInt32LE(this.len, 0); bh.writeUInt32LE(0x004e4942, 4);
    const out = Buffer.concat([h, jh, js, bh, ...this.chunks]); fs.writeFileSync(file, out); return out.length;
  }
}

module.exports = { read, M, worlds, Writer };
