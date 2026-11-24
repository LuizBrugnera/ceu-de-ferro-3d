'use strict';
/* the models the page carries (models/*.glb, embedded by gen-models.js) against the files and against the plane's own numbers (mdl): read
   with the page's readGlb, the same nodes the procedural model files under the damage parts, nose forward along +x, the nozzle marks where
   mdl.noz puts the hit boxes and the flames, one a nozzle (a jet with pods, mdl.eng, has neither: the pods hold the meshes), each part
   inside its boxes, the length the game reads, and a size kept small for the page. A flying wing (the B-2) files its drag rudders at the
   tips as the fins. A propeller plane (d.prop) has neither nozzles nor flames: its blades are nodes of their own, prop at mdl.prop,
   propL/propR at the pods, propLo/propRo out on the wing, each about its hub and square to x, so that it turns true */
const fs = require('fs'), path = require('path'), H = require('./harness'), { ok, done } = H;
const ctx = H.load(), $ = ctx.$, PLANES = $('PLANES'), readGlb = $('readGlb'), MS = $('MS');
const html = fs.readFileSync(H.PAGE, 'utf8'), DIR = path.join(H.ROOT, 'models');
const ab = b => b.buffer.slice(b.byteOffset, b.byteOffset + b.length);
const inBox = (b, x, y, z, e) => Math.abs(x - b[0]) <= b[3] + e && Math.abs(y - b[1]) <= b[4] + e &&
  (b.length === 7 && b[2] === 0 ? Math.abs(z) >= b[6] - e && Math.abs(z) <= b[5] + e : Math.abs(z - b[2]) <= b[5] + e);

for (const id in PLANES) {
  const d = PLANES[id], k = d.mdl.glb;
  if (!k) continue;
  console.log(id + ' (' + k + '.glb)');
  const file = fs.readFileSync(path.join(DIR, k + '.glb')), m = html.match(new RegExp('<script type="model/gltf-binary" id="glb-' + k + '">([^<]*)</script>'));
  ok(m && Buffer.from(m[1].replace(/\s+/g, ''), 'base64').equals(file), 'the page carries models/' + k + '.glb as it is (node tests/gen-models.js)');
  ok(file.length < 400e3, 'the file is small for the page: ' + (file.length / 1e3).toFixed(0) + ' kB');
  const G = readGlb(ab(file)), meshes = G.nodes.filter(n => n.pos), N = {};
  for (const n of meshes) N[n.name] = n;
  let tris = 0, bad = 0, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  const each = (n, f) => { for (let i = 0; i < n.pos.length; i += 3) f(n.pos[i] + n.t[0], n.pos[i + 1] + n.t[1], n.pos[i + 2] + n.t[2]); };
  for (const n of meshes) {
    tris += n.idx.length / 3;
    for (const v of n.idx) if (v >= n.pos.length / 3) bad++;
    for (const v of n.pos) if (!Number.isFinite(v)) bad++;
    if (!n.nor || n.nor.length !== n.pos.length || !n.uv || n.uv.length / 2 !== n.pos.length / 3) bad++;
    if (!/^prop/.test(n.name)) each(n, (x, y, z) => { const p = [x, y, z]; for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]); } });   // the blades reach past the fin as they turn
  }
  ok(!bad, 'every index inside its mesh, every number finite, a normal and a uv for each vertex');
  ok(tris < 5000, 'triangles: ' + tris);
  ok(G.map >= 0 && G.images[G.map] && /^image\/(jpeg|png)$/.test(G.images[G.map].mime), 'a base colour texture (' + (G.images[G.map] || {}).mime + ')');

  /* the meshes the damage look reaches: a part by its id or through vis, the two-mesh groups by index */
  const vis = new Set(d.parts.map(p => (p.vis ? p.vis[0] : p.id))), names = meshes.map(n => n.name.replace(/^(stab|fin)[LR]$/, '$1').replace(/^prop([LR]?)o?$/, 'eng$1'));
  const want = ['hull', 'pilot', 'wingL', 'wingR', 'stab', 'fin'].concat(d.mdl.prop ? ['eng'] : ['engL', 'engR']);   // gear: the Stuka's fixed legs, no part of their own
  ok(want.every(w => names.includes(w)) && names.every(w => vis.has(w) || w === 'stab' || w === 'fin' || w === 'gear'), 'nodes for every part the procedural model draws: ' + [...new Set(names)].join(' '));
  ok(G.nodes.findIndex(n => n.name === 'stabR') < G.nodes.findIndex(n => n.name === 'stabL'), 'the right tailplane first, as vis [stab, 0] reads it');
  ok(N.wingL.t[2] < 0 && N.wingR.t[2] > 0 && Math.abs(Math.abs(N.wingR.t[2]) - d.mdl.wings[0].z0) < .05, 'each wing turns about its root (mdl z0 ' + d.mdl.wings[0].z0 + '), so a lost tip shortens it from the end');

  /* frame: the nose ahead, the fin up, the right wing to +z */
  const ctr = n => { let s = [0, 0, 0], c = 0; each(n, (x, y, z) => { s[0] += x; s[1] += y; s[2] += z; c++; }); return s.map(v => v / c); };
  if (N.eng) ok(ctr(N.eng)[0] > ctr(N.pilot)[0] + 1.5 && ctr(N.pilot)[0] > Math.max(ctr(N.finL)[0], ctr(N.finR)[0]) + 2 && ctr(N.pilot)[1] > .5, 'the engine ahead of the canopy, the canopy ahead of the fin and above the middle: nose along +x');
  else ok(ctr(N.pilot)[0] > ctr(N.hull)[0] + 2 && ctr(N.pilot)[1] > .5, 'the canopy ahead of the fuselage\'s middle and above it: nose along +x');
  /* a flying wing (the B-2) has no fin: its yaw comes from the split drag rudders at the tips, filed as the fins (mdl.fin.z out past the wing's
     middle), which lie in the wing; its top is the hump of the cockpit, its bottom the belly of the thick centre body (mdl.fus, sy) */
  const w0 = d.mdl.wings[0], tips = Math.min(...d.mdl.fin.z.map(Math.abs)) > w0.z0 + w0.span / 2;
  ok(ctr(N.wingR)[2] > 2 && ctr(N.wingL)[2] < -2 && (tips ? ctr(N.finR)[2] > ctr(N.wingR)[2] && ctr(N.finL)[2] < ctr(N.wingL)[2]
    : Math.min(ctr(N.finL)[1], ctr(N.finR)[1]) > Math.max(ctr(N.stabL)[1], ctr(N.stabR)[1]) + .3), 'right wing at +z, ' + (tips ? 'the drag rudders out at the tips' : 'the fins above the tailplanes'));
  ok(Math.abs(hi[0] - lo[0] - d.len) / d.len < .02, 'length ' + (hi[0] - lo[0]).toFixed(2) + ' against the ' + d.len.toFixed(2) + ' of mdl.fus (the hit radius, the missile fuse and the shadow read it)');
  const top = tips ? Math.max(...d.mdl.fus.map(f => f[1])) * d.mdl.sy : +(Math.max(...d.mdl.fin.pts.map(p => p[1])) * Math.cos(d.mdl.fin.cant || 0)).toFixed(2);   // a canted fin stands lower
  ok(Math.abs(hi[2] + lo[2]) < .1 && Math.abs(hi[1] - top) < .3 && lo[1] > -Math.max(d.mdl.gear ? 3 : 2, Math.max(...d.mdl.fus.map(f => f[1])) * d.mdl.sy + .5), 'symmetric, upright: z ' + lo[2].toFixed(2) + '..' + hi[2].toFixed(2) + ', y ' + lo[1].toFixed(2) + '..' + hi[1].toFixed(2) + ' (nothing far below the hull box but a fixed gear, mdl.gear), the top at the ' + top + ' of ' + (tips ? 'mdl.fus' : 'mdl.fin'));

  /* the propellers: a node each about its hub, its blades square to x (they turn about x), where the procedural model puts its blades:
     the nose's at mdl.prop, the pods' at mdl.nac (a propeller only, by mdl.eng), the outer ones at mdl.nac too */
  if (d.prop) {
    const P = G.nodes.filter(n => /^prop/.test(n.name)), sq = n => { let lo = 1e9, hi = -1e9, r = 0; for (let i = 0; i < n.pos.length; i += 3) { lo = Math.min(lo, n.pos[i]); hi = Math.max(hi, n.pos[i]); r = Math.max(r, Math.hypot(n.pos[i + 1], n.pos[i + 2])); } return [hi - lo, r]; };
    const hubs = d.mdl.prop ? [['prop', d.mdl.prop[0], null, 0]] : (d.mdl.nac || []).filter(n => n[5]).map(n => [Math.abs(n[2] - d.mdl.eng[2]) < .3 ? 'propR' : 'propRo', null, n[1], n[2]]);
    ok(P.length === (d.mdl.prop ? 1 : 2 * hubs.length) && !G.nodes.some(n => /^noz/.test(n.name)) && !d.Tab, 'propellers, no nozzle marks and no afterburner: ' + P.map(n => n.name).join(' '));
    for (const [k, x, y, z] of hubs) {
      const n = N[k], [dx, r] = n ? sq(n) : [9, 0], m = n && N[k.replace('R', 'L')];
      ok(n && m && (y === null ? Math.abs(n.t[1]) < .7 : Math.abs(n.t[1] - y) < .35) && Math.abs(n.t[2] - z) < .35 && (x === null || Math.abs(n.t[0] - x) < .05) && Math.abs(n.t[2] + m.t[2]) < .1, k + ' at ' + (n && n.t.map(v => v.toFixed(2)).join(', ')) + ', the procedural blades at ' + [x === null ? '-' : x, y === null ? '(the nose)' : y, z].join(', '));
      ok(n && dx < r * .5 && r > .8, k + ': blades ' + r.toFixed(2) + ' long, ' + dx.toFixed(2) + ' deep along x');
    }
    if (d.mdl.prop) ok(Math.abs(sq(N.prop)[1] - d.mdl.prop[1]) < .1, 'the blades as long as mdl.prop: ' + d.mdl.prop[1]);
  }
  /* the exhaust: a mark per nozzle, where mdl.noz has it; pods (mdl.eng) carry no marks, and with no afterburner (Tab) no flames either */
  if (d.mdl.prop) ok(!d.mdl.noz && !d.mdl.eng, 'one engine in the nose: no pods, no nozzles');
  else if (d.mdl.eng) {
    ok(!d.mdl.noz && !d.Tab && !G.nodes.some(n => /^noz/.test(n.name)), 'pods, no nozzle marks and no afterburner: no flames');
    for (const s of ['L', 'R']) {
      const c = ctr(N['eng' + s]), e = d.mdl.eng, z = s === 'R' ? e[2] : -e[2];
      ok(Math.hypot(c[0] - e[0], c[1] - e[1], c[2] - z) < .3, 'pod ' + s + ' at ' + c.map(v => v.toFixed(2)).join(', ') + ', mdl.eng ' + [e[0], e[1], z].join(', '));
    }
  } else d.mdl.noz.forEach((nz, i) => {   // a mark per nozzle: nozR and nozL, and nozR2 and nozL2 for a second pair (the Tu-160's four)
    const s = nz[2] > 0 ? 'R' : 'L', nm = 'noz' + s + (i > 1 ? 2 : ''), mk = G.nodes.find(n => n.name === nm);
    ok(mk && Math.hypot(mk.t[0] - nz[0], mk.t[1] - nz[1], mk.t[2] - nz[2]) < .05, 'nozzle ' + nm + ' at ' + (mk && mk.t.map(v => v.toFixed(2)).join(', ')) + ', mdl.noz ' + nz.join(', '));
    if (!mk) return;
    /* the rim around it: the eng mesh's rearmost vertices nearest this mark (of the marks on its side) ring it */
    const side = G.nodes.filter(n => /^noz/.test(n.name) && n.name[3] === s), near = (y, z) => side.every(o => Math.hypot(y - mk.t[1], z - mk.t[2]) <= Math.hypot(y - o.t[1], z - o.t[2]));
    let r = 0, c = 0, xr = 1e9; each(N['eng' + s], (x, y, z) => { if (Math.abs(z) > .15) xr = Math.min(xr, x); });
    each(N['eng' + s], (x, y, z) => { if (x < xr + .3 && Math.abs(z) > .15 && near(y, z)) { r += Math.hypot(y - mk.t[1], z - mk.t[2]); c++; } });
    ok(c && Math.abs(mk.t[0] - xr) < .3 && r / c > .3 && r / c < .8, 'nozzle ' + nm + ': the exit ' + (mk.t[0] - xr).toFixed(2) + ' from the rearmost rim, rim ' + (r / c).toFixed(2) + ' round the mark');
  });

  /* hit boxes (metres, times MS) around the meshes they stand for */
  const P = {}; for (const p of d.parts) P[p.id] = p.box;
  const share = (n, boxes, e) => { let a = 0, c = 0; each(n, (x, y, z) => { c++; if (boxes.some(b => inBox(b, x * MS, y * MS, z * MS, e))) a++; }); return a / c; };
  const checks = [['hull', ['hull', 'radar', 'pilot', 'inst', 'gun', 'noz', 'jetL', 'jetR', 'eng', 'oil', 'cool']], ['pilot', ['pilot']], ['wingL', ['wingL', 'tipL']], ['wingR', ['wingR', 'tipR']],
    ['stabL', ['stabL']], ['stabR', ['stabR']], ['finL', ['fin']], ['finR', ['fin']], ['engL', ['jetL', 'noz']], ['engR', ['jetR', 'noz']], ['eng', ['eng', 'prop', 'oil', 'cool']]].filter(([n]) => N[n]);
  /* the fins lean out further than the fin box of planeBoxes reaches (fz + 1 across), on this model as on the procedural one */
  for (const [n, b] of checks) { const f = share(N[n], b.map(i => P[i]).filter(Boolean), .6), w = /^fin/.test(n) ? .7 : .85; ok(f > w, n + ': ' + (f * 100).toFixed(0) + '% of it inside ' + b.join('/')); }
  /* the cockpit eye (fpJet, from mdl.can) under the glass: straight up from it, the canopy's surface, not the fuselage's */
  const ex = d.mdl.can[0], ey = d.mdl.can[1] + d.mdl.can[3] * .12, up = (n, x, z) => {
    let best = 1e9;
    for (let i = 0; i < n.idx.length; i += 3) {
      const [a, b, c] = [0, 1, 2].map(j => [n.pos[n.idx[i + j] * 3] + n.t[0], n.pos[n.idx[i + j] * 3 + 1] + n.t[1], n.pos[n.idx[i + j] * 3 + 2] + n.t[2]]);
      const D = (b[0] - a[0]) * (c[2] - a[2]) - (c[0] - a[0]) * (b[2] - a[2]); if (Math.abs(D) < 1e-9) continue;
      const u = ((x - a[0]) * (c[2] - a[2]) - (c[0] - a[0]) * (z - a[2])) / D, v = ((b[0] - a[0]) * (z - a[2]) - (x - a[0]) * (b[2] - a[2])) / D;
      if (u >= 0 && v >= 0 && u + v <= 1) { const y = a[1] + u * (b[1] - a[1]) + v * (c[1] - a[1]); if (y > ey) best = Math.min(best, y); }
    }
    return best;
  };
  const glass = up(N.pilot, ex, 0), skin = up(N.hull, ex, 0);
  ok(glass - ey > .15 && glass - ey < .8 && glass < skin, 'the cockpit eye under the canopy glass: ' + (glass - ey).toFixed(2) + ' below it');
}
done();
