'use strict';
/* cf-path-fora-estrada: a trip need not keep to the roads (XC). On map 11 of both eras: over open ground the way on foot goes across country,
   shorter than the network's; water is crossed only where a bridge stands, and a bridge that falls is no longer a way; wheels never enter a
   cell of dense wood or too steep a slope, and keep to the roads more than feet do; tracks between them; XC.on 0 gives the network's way as
   before; the grid is built at the load. Env: PAGE. */
const H = require('./harness'), { ok, done } = H;
const hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
for (const era of ['ww2', 'modern']) {
  console.log(era);
  const C = H.load({ seed: 3, mapv: 11 }), $ = C.$, XC = $('XC');
  const S = C.watch(era, { len: 0 }), T = S.T;
  ok(!!T.xcg && T.xcg.pass, 'the grid is built at the load (' + T.xcg.nx + ' x ' + T.xcg.nz + ' cells of ' + XC.cell + ' m)');
  const P = S.cq.p, west = P.filter(p => p.x < T.rx(p.z) - 600), east = P.filter(p => p.x > T.rx(p.z) + 600);
  const trip = (a, b, mode, o) => { T.pc = new Map(); T.pt = null; T.xcg.pc.clear(); return $('tripOf')(a.x, a.z, b.x, b.z, Object.assign({ mode, team: 0 }, o)); };
  /* the shares over many pairs */
  const pairs = []; for (const a of P) for (const b of P) if (a !== b && hd(a, b) > 1500) pairs.push([a, b]);
  const st = {}; for (const m of ['foot', 'trk', 'veh']) { let xc = 0, L = 0, L0 = 0, off = 0; for (const [a, b] of pairs) { const p = trip(a, b, m); if (!p) continue; if (p.xc) xc++; L += p.len; off += $('xcOff')(p) * p.len; XC.on = 0; const q = trip(a, b, m); XC.on = 1; L0 += q ? q.len : p.len; } st[m] = { xc: xc / pairs.length, k: L / L0, off: off / L }; }
  ok(st.foot.xc > .5 && st.foot.k < .9 && st.foot.off > .4, 'on foot most ways go across country (' + Math.round(st.foot.xc * 100) + ' % of ' + pairs.length + ', ' + Math.round(st.foot.off * 100) + ' % of their length off the roads, ' + Math.round((1 - st.foot.k) * 100) + ' % shorter)');
  ok(st.veh.xc <= st.trk.xc && st.trk.xc < st.foot.xc && st.veh.xc > 0, 'wheels keep to the roads as much as tracks or more, tracks more than feet (across country: ' + ['veh', 'trk', 'foot'].map(m => m + ' ' + Math.round(st[m].xc * 100) + ' %').join(', ') + ')');
  ok(st.veh.k <= 1.001 && st.trk.k <= 1.001, 'no vehicle way is longer for it (wheels ' + st.veh.k.toFixed(3) + ', tracks ' + st.trk.k.toFixed(3) + ' of the network\'s length)');
  /* wheels: no dense wood, no steep slope, but at the ends */
  const G = T.xcg; let bad = 0, legs = 0;
  for (const [a, b] of pairs) { const p = trip(a, b, 'veh'); if (!p || !p.xc) continue; legs++; const qa = G.cell(a.x, a.z), qb = G.cell(b.x, b.z); for (let s = 0; s <= p.len; s += 20) { const o = $('routeAt')(p, s), q = G.cell(o.x, o.z); if (q !== qa && q !== qb && !G.rd[q] && (G.wood[q] > XC.wmax.veh || G.gr[q] > XC.gmax.veh)) { bad++; break; } } }
  ok(legs > 0 && bad === 0, 'no wheeled way across country runs through dense wood or up a slope too steep (' + legs + ' ways looked at)');
  /* water: only at a standing bridge */
  const brs = $('brs')(), wetAt = (p, ok2) => { for (let s = 0; s <= p.len; s += 10) { const o = $('routeAt')(p, s); if ($('hgt')(o.x, o.z) <= T.WL + .3 && !brs.some(b => ok2(b) && hd(b, o) < 250)) return o; } return null; };
  let cross = 0, wet = 0;
  for (const a of west) for (const b of east) for (const m of ['foot', 'veh']) { const p = trip(a, b, m); if (!p || !p.xc) continue; cross++; if (wetAt(p, () => true)) wet++; }
  ok(cross > 0 && wet === 0, 'a way across country crosses the river only at a bridge (' + cross + ' ways from bank to bank)');
  /* a bridge falls: the ways that took it go by another */
  const a = west[0], b = east[0], p0 = trip(a, b, 'foot'), used = brs.filter(r => { for (let s = 0; s <= p0.len; s += 20) if (hd($('routeAt')(p0, s), r) < 250) return true; return false; });
  ok(used.length > 0, 'the way on foot from ' + (a.nm || 'a west point') + ' to ' + (b.nm || 'an east point') + ' takes a bridge (' + used.map(r => r.id).join(', ') + ')');
  for (const r of used) S.os[r.id] = 2; $('brSync')();
  const p1 = trip(a, b, 'foot');
  ok(!p1 || !wetAt(p1, r => !used.includes(r)), 'with that bridge down, the way does not cross the river there (' + (p1 ? (p1.xc ? 'across country' : 'by the network') + ', ' + Math.round(p1.len) + ' m' : 'no way') + ')');
  /* off: as before */
  XC.on = 0; const pf = trip(west[0], P.find(p => p !== west[0] && hd(p, west[0]) > 2000) || west[1], 'foot'); XC.on = 1;
  ok(pf && !pf.xc && $('xcOff')(pf) < .1, 'XC.on 0: the network\'s way, as before');
  const t0 = process.hrtime.bigint(); for (const [a2, b2] of pairs.slice(0, 40)) trip(a2, b2, 'veh'); const ms = Number(process.hrtime.bigint() - t0) / 1e6 / 40;
  console.log('  info  ' + ms.toFixed(1) + ' ms a trip with its way across country weighed (wall clock)');
}
done();
