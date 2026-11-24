'use strict';
/* Roads plan, item 4: how "irregular" a solo AI battle is. Every 2 s it samples where shooting happens (AI soldiers and vehicles with
   their trigger down) and counts: the share of those positions farther than OFF m from both old main axes (T.routes[0] and [1]), how
   many 1 km cells saw shooting, the commander's ops at once, point flips and the points each side holds at the end. Run old vs new with MAPV=1 / MAPV=2
   once the map version exists (MAPV is set only when the page knows it). Env: ERA (ww2), SECS (600), SEEDS (3), OFF (600), PAGE. */
const H = require('./harness');
const ERA = process.env.ERA || 'ww2', SECS = +process.env.SECS || 600, SEEDS = +process.env.SEEDS || 3, OFF = +process.env.OFF || 600;
const segD = (r, x, z) => { let b = 1e9; for (let i = 1; i < r.length; i++) { const a = r[i - 1], ex = r[i].x - a.x, ez = r[i].z - a.z, t = Math.max(0, Math.min(1, ((x - a.x) * ex + (z - a.z) * ez) / (ex * ex + ez * ez || 1))); b = Math.min(b, Math.hypot(x - a.x - ex * t, z - a.z - ez * t)); } return b; };
const tot = { n: 0, off: 0, cells: 0, ops: 0, opsN: 0, flips: 0, ms: 0 };
for (let sd = 1; sd <= SEEDS; sd++) {
  const C = H.load({ seed: 100 + sd }), $ = C.$;
  if (process.env.MAPV) try { $('MAPV = ' + (+process.env.MAPV)); } catch (e) { console.log('  (page has no MAPV)'); }
  const S = C.newState(ERA, $('ERAS')[ERA].sides[0].fighter, { cls: 'plane' }), R = S.T.routes.slice(0, 2), cells = new Set();
  let n = 0, off = 0, k = 0, flips = 0, ops = 0, opsN = 0; const hold0 = S.cq.p.map(p => p.hold), t0 = Date.now();
  C.run(SECS, () => {
    if (++k % 120) return;
    S.cq.p.forEach((p, i) => { if (p.hold !== hold0[i]) { flips++; hold0[i] = p.hold; } });
    if (S.cmd) { ops += S.cmd.reduce((a, c) => a + c.ops.filter(o => !o.over).length, 0); opsN++; }
    const put = (x, z) => { n++; if (Math.min(segD(R[0], x, z), segD(R[1], x, z)) > OFF) off++; cells.add((x / 1000 | 0) + ',' + (z / 1000 | 0)); };
    for (const m of S.men) if (!m.dead && m.ai && m.ctl && m.ctl.fire) put(m.x, m.z);
    for (const u of S.units) if (!u.dead && u.ai && u.ctl && u.ctl.fire && (u.ctl.fire[0] || u.ctl.fire[1])) put(u.x, u.z);
  }, 1 / 30);
  const ms = Date.now() - t0, held = [0, 1].map(t => S.cq.p.filter(p => p.hold === t).length).join(' × ');
  console.log(`  seed ${100 + sd}: shots ${n}, off-axis ${(100 * off / (n || 1)).toFixed(1)}%, cells ${cells.size}, ops ${(ops / (opsN || 1)).toFixed(2)}, flips ${flips}, points ${held}, ${ms} ms`);
  Object.assign(tot, { n: tot.n + n, off: tot.off + off, cells: tot.cells + cells.size, ops: tot.ops + ops, opsN: tot.opsN + opsN, flips: tot.flips + flips, ms: tot.ms + ms });
}
console.log(`${ERA} ${SECS}s x${SEEDS}: off-axis ${(100 * tot.off / (tot.n || 1)).toFixed(1)}% of ${tot.n}, cells ${(tot.cells / SEEDS).toFixed(1)}, ops ${(tot.ops / (tot.opsN || 1)).toFixed(2)}, flips ${(tot.flips / SEEDS).toFixed(1)}, ${Math.round(tot.ms / SEEDS)} ms/run`);
