'use strict';
/* the scene's road ribbons (roadRibbon, one mesh a class in buildWorld): every edge of the network draws its own ribbon. Each vertex of
   the mesh belongs to some triangle, no triangle reaches past the mesh or spans more than a ribbon's cell (~12 m along, the width across),
   and the deck lies ROADH above the ground with the shoulders sunk into it. cf-estradas-flutuando (#100) had counted the indices from 0
   on every edge, so only the first road of each class was drawn. node tests/road-mesh.js */
const { load, ok, done } = require('./harness.js');
for (const era of ['ww2', 'modern']) {
  const C = load({ seed: 2, mapv: 11 }), $ = C.$, RN = $('RN'), ROADH = $('ROADH');
  const S = C.sandbox(era), T = S.T, roads = $('roadsOf')(T);
  for (let c = 0; c < RN.w.length; c++) {
    const es = roads.filter(e => e.c === c); if (!es.length) continue;
    const pos = [], idx = [], hw = RN.w[c];
    for (const E of es) C.roadRibbon(E, hw, pos, idx);
    const nv = pos.length / 3, used = new Uint8Array(nv), V = i => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
    let out = 0, long = 0, maxS = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const tri = [idx[t], idx[t + 1], idx[t + 2]];
      if (tri.some(i => !(i >= 0 && i < nv))) { out++; continue; }
      for (const i of tri) used[i] = 1;
      for (let a = 0; a < 3; a++) { const p = V(tri[a]), q = V(tri[(a + 1) % 3]), d = Math.hypot(p[0] - q[0], p[2] - q[2]); maxS = Math.max(maxS, d); if (d > 2 * hw * 1.15 + 16) long++; }
    }
    const unused = nv - used.reduce((a, v) => a + v, 0);
    ok(out === 0 && long === 0 && unused === 0, era + ' class ' + c + ': ' + es.length + ' roads, ' + nv + ' vertices, ' + idx.length / 3 + ' triangles: ' +
      unused + ' vertices in no triangle, ' + out + ' triangles past the mesh, ' + long + ' sides longer than a cell (longest ' + maxS.toFixed(1) + ' m)');
    let deck = 0, sunk = 0;   // the middle vertex of each row on the deck, the outer ones under the ground
    for (let i = 0; i < nv; i++) { const [x, y, z] = V(i), g = C.hgt(x, z), j = i % 5; if (j === 2 && Math.abs(y - g - ROADH) > 1e-6) deck++; if ((j === 0 || j === 4) && !(y < g)) sunk++; }
    ok(!deck && !sunk, era + ' class ' + c + ': the deck ' + ROADH + ' m above the ground (' + deck + ' off), the shoulders sunk (' + sunk + ' not)');
  }
}
done();
