'use strict';
/* Map version 8: the dev tool that bakes the bends of the dirt roads (RN.d8.way), as tests/roads-gen.js baked RN.way. It is not part of the
   page and no test. It loads the page, takes the map of version 7 (its network, towns and villages) and the free nodes of RN.d8, builds the
   same kind of cost grid (slope, mountain, a seeded noise, water) and routes every edge of RN.d8.edges[era] with an A* over it, in order,
   with penalties for running beside any road already there (the older network and the dirt roads routed before it), the towns and the
   airfields. It prints the RN.d8.way tables to paste into the page, a check of the free nodes, and draws .work/roads8/map-<era>.svg.
   Env: PAGE (another copy of the page), ERA (one era), OUT (folder of the svg files, default .work/roads8). No random number is used. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const H = require('./harness');
const OUT = process.env.OUT || path.join(H.ROOT, '.work', 'roads8');
const CELL = 100, MARGIN = 300, NEAR = +process.env.NEAR || 550, PAR = +process.env.PAR || 4, TOWN = 4;
/* the sim section in a fresh context; a name of the 3D part that it wraps gets an empty stand-in (the page defines it later) */
function loadSim() {
  const src = H.source(), stubs = [];
  for (let k = 0; k < 30; k++) {
    const ctx = vm.createContext({ console, setTimeout, clearTimeout, location: { protocol: 'http:', host: 'localhost:0' } });
    try { vm.runInContext(stubs.join('') + src + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'sim.js' }); return ctx; }
    catch (e) { const m = /^(\w+) is not defined/.exec(e && e.message); if (!m) throw e; stubs.push('function ' + m[1] + '(){}\n'); }
  }
  throw new Error('the sim section did not load');
}
const C = loadSim(), $ = C.$;
const RN = $('RN'), ERAS = $('ERAS'), fbm = $('fbm'), sstep = $('sstep');
let flagged = 0;

class Heap {
  constructor() { this.k = []; this.v = []; }
  less(a, b) { return this.k[a] < this.k[b] || (this.k[a] === this.k[b] && this.v[a] < this.v[b]); }
  swap(a, b) { [this.k[a], this.k[b]] = [this.k[b], this.k[a]]; [this.v[a], this.v[b]] = [this.v[b], this.v[a]]; }
  push(k, v) { this.k.push(k); this.v.push(v); let i = this.k.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (!this.less(i, p)) break; this.swap(i, p); i = p; } }
  pop() {
    const v = this.v[0], n = this.k.length - 1; this.swap(0, n); this.k.pop(); this.v.pop();
    let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < n && this.less(l, m)) m = l; if (r < n && this.less(r, m)) m = r; if (m === i) break; this.swap(i, m); i = m; }
    return v;
  }
  get size() { return this.k.length; }
}
const segD = (ax, az, bx, bz, x, z) => { const ex = bx - ax, ez = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez || 1))); return Math.hypot(x - ax - ex * t, z - az - ez * t); };
const polyD = (r, x, z) => { let b = 1e9; for (let i = 1; i < r.length; i++) b = Math.min(b, segD(r[i - 1].x, r[i - 1].z, r[i].x, r[i].z, x, z)); return b; };
function simplify(p, tol, maxGap) {
  const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1;
  const rec = (a, b) => {
    if (b <= a + 1) return;
    let m = -1, md = -1;
    for (let i = a + 1; i < b; i++) { const d = segD(p[a].x, p[a].z, p[b].x, p[b].z, p[i].x, p[i].z); if (d > md) { md = d; m = i; } }
    if (md > tol) { keep[m] = 1; rec(a, m); rec(m, b); }
    else if (Math.hypot(p[b].x - p[a].x, p[b].z - p[a].z) > maxGap) { m = (a + b) >> 1; keep[m] = 1; rec(a, m); rec(m, b); }
  };
  rec(0, p.length - 1);
  return p.filter((q, i) => keep[i]);
}

function era(id) {
  const E = ERAS[id], W = E.W, HW = E.HW, sd = id === 'ww2' ? 11 : 29, WL = 52, M = 3200;
  const T7 = $('genTerrain')(id, 7), R = T7.routes.slice(0, 2), riverX = z => .5 * W + .07 * W * Math.sin(z / (HW * .33) + 1);
  /* the nodes: the version 7 network's, and the free points of RN.d8 (as roadNet places an 'f' node) */
  const nodes = {};
  for (const q of T7.net.n) nodes[q.id] = { id: q.id, x: q.x, z: q.z, free: false };
  const d8 = RN.d8.nodes[id];
  for (const k in d8) nodes[k] = { id: k, x: d8[k][1] * W, z: d8[k][2] * HW, free: true };
  const rawH = (x, z) => {
    const o = { x, z }, n1 = fbm(x / 6000, z / 6000, sd), n2 = fbm(x / 1900 + 7, z / 1900 + 3, sd), n3 = fbm(x / 420, z / 420, sd + 5);
    const bd = Math.min(Math.hypot(x - T7.bases[0].x, z - T7.bases[0].z), Math.hypot(x - T7.bases[1].x, z - T7.bases[1].z)), rd = Math.min(polyD(R[0], x, z), polyD(R[1], x, z));
    const mount = sstep(.47, .74, n1) * sstep(350, 1900, rd) * sstep(1500, 3200, bd), smooth = 26 + 85 * n2;
    let h = smooth + 26 * n3 + mount * (200 + 560 * n2 + 130 * n3);
    const out = Math.max(0, -x, x - W, Math.abs(z) - HW) / M; h += out * out * 420;
    const rv = Math.abs(x - riverX(z)); if (rv < 280) h = WL - 10 + (h - (WL - 10)) * sstep(80, 280, rv);
    h = 72 + (h - 72) * sstep(800, 1700, bd);
    return { h, mount, bd, o };
  };
  const nx = Math.floor((W - 2 * MARGIN) / CELL) + 1, nz = Math.floor((2 * HW - 2 * MARGIN) / CELL) + 1, n = nx * nz;
  const X = i => MARGIN + i * CELL, Z = j => -HW + MARGIN + j * CELL;
  const hh = new Float32Array(n), mt = new Float32Array(n), air = new Float32Array(n), noise = new Float32Array(n), wat = new Uint8Array(n);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i, x = X(i), z = Z(j), r = rawH(x, z);
    hh[k] = r.h; mt[k] = r.mount; air[k] = r.bd; noise[k] = 1 + .35 * (fbm(x / 700, z / 700, sd + 17) - .5); wat[k] = r.h < WL + 2 ? 1 : 0;
  }
  const cellOf = (x, z) => Math.min(nz - 1, Math.max(0, Math.round((z - Z(0)) / CELL))) * nx + Math.min(nx - 1, Math.max(0, Math.round((x - X(0)) / CELL)));
  const towns = T7.burgs.map(b => ({ x: b.x, z: b.z, r: b.ru + 60 }));
  const markOf = pts => { const m = new Uint8Array(n); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (polyD(pts, X(i), Z(j)) < NEAR) m[j * nx + i] = 1; return m; };
  /* every road there is, for the penalty of running beside one: the version 7 network's edges, then each dirt road as it is routed */
  const roads = T7.net.e.map(e => ({ ends: [nodes[T7.net.n[e.a].id], nodes[T7.net.n[e.b].id]], pts: e.p, mark: markOf(e.p) }));
  const edges = RN.d8.edges[id], way = [], paths = [];
  edges.forEach(([cls, A, B], ei) => {
    const a = nodes[A], b = nodes[B]; if (!a || !b) throw new Error('unknown node in edge ' + ei + ' ' + A + '-' + B);
    const mul = new Float32Array(n).fill(1);
    for (let k = 0; k < n; k++) {
      const x = X(k % nx), z = Z((k / nx) | 0);
      if (Math.hypot(x - a.x, z - a.z) < 450 || Math.hypot(x - b.x, z - b.z) < 450) continue;   // a road leaves and joins others at its ends
      for (const rd of roads) if (rd.mark[k]) mul[k] *= PAR;
    }
    for (const t of towns) {
      if (Math.hypot(t.x - a.x, t.z - a.z) < t.r + 100 || Math.hypot(t.x - b.x, t.z - b.z) < t.r + 100) continue;
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (Math.hypot(X(i) - t.x, Z(j) - t.z) < t.r) mul[j * nx + i] *= TOWN;
    }
    const forb = k => air[k] < 1300 && Math.hypot(X(k % nx) - a.x, Z((k / nx) | 0) - a.z) > 200 && Math.hypot(X(k % nx) - b.x, Z((k / nx) | 0) - b.z) > 200;
    const s0 = cellOf(a.x, a.z), g0 = cellOf(b.x, b.z), gx = g0 % nx, gz = (g0 / nx) | 0;
    const g = new Float64Array(n).fill(Infinity), from = new Int32Array(n).fill(-1), done = new Uint8Array(n), heap = new Heap();
    const hf = k => { const dx = Math.abs(k % nx - gx), dz = Math.abs(((k / nx) | 0) - gz); return .8 * CELL * (Math.max(dx, dz) + .4142 * Math.min(dx, dz)); };
    g[s0] = 0; heap.push(hf(s0), s0);
    while (heap.size) {
      const k = heap.pop(); if (done[k]) continue; done[k] = 1; if (k === g0) break;
      const ki = k % nx, kj = (k / nx) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const i = ki + di, j = kj + dj; if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
        const q = j * nx + i; if (done[q] || (forb(q) && q !== g0)) continue;
        const d = CELL * (di && dj ? Math.SQRT2 : 1), sl = Math.abs(hh[q] - hh[k]) / d;
        const c = Math.round(d * (1 + 6 * sl * sl + 3 * mt[q]) * noise[q] * mul[q]) + (wat[q] ? 60 : 0);
        if (g[k] + c < g[q]) { g[q] = g[k] + c; from[q] = k; heap.push(g[q] + hf(q), q); }
      }
    }
    if (!done[g0]) throw new Error('no path for dirt road ' + ei + ' ' + A + '-' + B);
    const pts = []; for (let k = g0; k >= 0; k = from[k]) pts.push({ x: X(k % nx), z: Z((k / nx) | 0) }); pts.reverse();
    pts[0] = { x: a.x, z: a.z }; pts[pts.length - 1] = { x: b.x, z: b.z };
    const mid = simplify(pts, 25, 450).slice(1, -1).map(p => ({ x: Math.round(p.x), z: Math.round(p.z) }));
    way.push([ei].concat(...mid.map(p => [p.x, p.z])));
    const full = [a, ...mid, b];
    let len = 0; for (let i = 1; i < full.length; i++) len += Math.hypot(full[i].x - full[i - 1].x, full[i].z - full[i - 1].z);
    paths.push({ ei, A, B, pts: full, len });
    roads.push({ ends: [a, b], pts: full, mark: markOf(full) });
  });
  console.log('\n' + id + ': ' + Object.keys(d8).length + ' new nodes, ' + edges.length + ' dirt roads');
  const ground = (x, z) => rawH(x, z).h;
  for (const k in d8) {
    const q = nodes[k], h = ground(q.x, q.z), sl = Math.hypot(ground(q.x + 50, q.z) - ground(q.x - 50, q.z), ground(q.x, q.z + 50) - ground(q.x, q.z - 50)) / 100;
    let near = 1e9, nn = ''; for (const o in nodes) if (o !== k) { const d = Math.hypot(q.x - nodes[o].x, q.z - nodes[o].z); if (d < near) { near = d; nn = o; } }
    const rd = Math.min(...roads.slice(0, T7.net.e.length).map(r => polyD(r.pts, q.x, q.z)));
    const bad = [h < WL + 2 ? 'in water' : '', near < 900 ? 'near ' + nn : '', sl > .25 ? 'steep' : '', rd < 500 ? 'road ' + Math.round(rd) + ' m' : '', h > WL + 220 ? 'high' : ''].filter(Boolean).join(', ');
    console.log('  node ' + k.padEnd(3) + ' (' + Math.round(q.x) + ', ' + Math.round(q.z) + ') h-WL ' + (h - WL).toFixed(0) + ', slope ' + sl.toFixed(3) + ', nearest node ' + nn + ' ' + Math.round(near) + ' m, nearest older road ' + Math.round(rd) + ' m' + (bad ? '   FLAG: ' + bad : ''));
    if (bad) flagged++;
  }
  for (const p of paths) {
    const chord = Math.hypot(nodes[p.B].x - nodes[p.A].x, nodes[p.B].z - nodes[p.A].z);
    console.log('  road ' + String(p.ei).padStart(2) + ' ' + (p.A + '-' + p.B).padEnd(8) + ' ' + (p.len / 1000).toFixed(2) + ' km (' + (p.len / chord).toFixed(2) + ' of the chord)');
  }
  console.log('  total ' + (paths.reduce((a, p) => a + p.len, 0) / 1000).toFixed(1) + ' km');
  console.log('RN.d8.way.' + id + ' = ' + JSON.stringify(way) + ';');
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'way-' + id + '.json'), JSON.stringify(way));
  const sc = .1, vw = Math.round(W * sc), vh = Math.round(2 * HW * sc), sx = x => (x * sc).toFixed(1), sz = z => ((z + HW) * sc).toFixed(1);
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + vw + ' ' + vh + '" width="' + vw + '" height="' + vh + '"><rect width="100%" height="100%" fill="#c9d4a4"/>';
  const poly = (pts, stroke, w, dash) => '<polyline fill="none" stroke="' + stroke + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' points="' + pts.map(p => sx(p.x) + ',' + sz(p.z)).join(' ') + '"/>';
  let rv = ''; for (let z = -HW; z <= HW; z += 100) rv += (rv ? 'L' : 'M') + sx(riverX(z)) + ',' + sz(z); svg += '<path d="' + rv + '" fill="none" stroke="#3b6fa0" stroke-width="3"/>';
  for (const t of towns) svg += '<circle cx="' + sx(t.x) + '" cy="' + sz(t.z) + '" r="' + (t.r * sc).toFixed(1) + '" fill="#c06a50" opacity=".6"/>';
  for (const e of T7.net.e) svg += poly(e.p, ['#3a2a1a', '#7a3b1a', '#b0651e'][e.c], [3.2, 2.2, 1.4][e.c]);
  for (const p of paths) svg += poly(p.pts, '#c020b0', 1.6, '5 3');
  for (const k in nodes) { const q = nodes[k]; svg += '<circle cx="' + sx(q.x) + '" cy="' + sz(q.z) + '" r="4" fill="' + (q.free ? '#fff' : '#222') + '" stroke="#000"/><text x="' + (+sx(q.x) + 6) + '" y="' + (+sz(q.z) - 5) + '" font-size="12" font-family="sans-serif">' + k + '</text>'; }
  fs.writeFileSync(path.join(OUT, 'map-' + id + '.svg'), svg + '</svg>');
}
const t0 = Date.now();
for (const id of process.env.ERA ? [process.env.ERA] : ['ww2', 'modern']) era(id);
console.log('\n' + (flagged ? flagged + ' node(s) flagged' : 'no flagged node') + ', ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
