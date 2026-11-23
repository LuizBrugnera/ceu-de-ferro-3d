'use strict';
/* CEREBRO: defesa (DFP, cf-defesa-posicoes): the defence of a point by its terrain and its threat, a short headless exercise on the sandbox.
   Written untested with cf-defesa-posicoes; first run in cf-pol-testes-a (the tanks were added with no model id, now the side's first tank),
   passes with MAPV 4, 10 and 11. What it measures, the brief's "medição curta": a point held by 2 squads and 2 tanks, with the enemy
   known on one side:
   - no two men's places within 3 m of each other;
   - the two squads on different posts (not stacked), their sectors crossing on a road in;
   - the tanks' places 30 m apart or more, the turret seeing the kill zone of the main approach, off the middle of the point;
   - every place but the watch inside the point's circle (the capture counts who is inside). */
const H = require('./harness'), { ok, done } = H;
const C = H.load({ seed: +process.env.SEED || 5, mapv: +process.env.MAPV || 10 }), $ = C.$;
console.log('page: ' + H.PAGE);
if (!$('typeof dfpPts === "function"')) { console.log('no DFP: a page before cf-defesa-posicoes'); process.exit(0); }
const S = C.sandbox('modern'), T = S.T, r = T.routes[0];
/* a point on the main road a third of the way along it, held by side 0; the enemy's base on the far side */
const at = $('routeAt')(r, r.len * .35), P = { x: at.x, z: at.z, r: 170, tw: 1, hold: 0, L: 'X', name: 'Ponto de teste', links: [] };
const sq = [0, 1].map(k => { const q = $('addSquad')(0, P.x + 20 * k, P.z + 10, 0, r.len * .35); $('setOrd')(q, { k: 'hold', ri: 0, s: r.len * .35, x: P.x, z: P.z, tw: P, R: 0 }); q.at = true; return q; });
const pts = sq.map(q => { q.pts = null; return [...Array(q.n0).keys()].map(i => $('slot')(q, i)); });
const all = pts.flat();
let dmin = 1e9; for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) dmin = Math.min(dmin, Math.hypot(all[i].x - all[j].x, all[i].z - all[j].z));
ok(all.length >= 8 && dmin >= 3, all.length + ' places, the nearest two ' + dmin.toFixed(1) + ' m apart (3 m or more)');
ok(sq.every(q => q.pts && q.pts.dfp), 'both squads took places of the plan (' + sq.map(q => q.dfpR).join(' / ') + ')');
const pl = [...$('S.dfp').values()][0];
ok(!!pl && pl.posts.length >= 2 && pl.ap.length >= 1, 'a plan: ' + (pl ? pl.ap.length + ' approaches, ' + pl.posts.length + ' posts' : 'none'));
if (pl) {
  const [a, b] = sq.map(q => q.dfpP && q.dfpP[0]);
  ok(!!a && !!b && a !== b && Math.hypot(a.x - b.x, a.z - b.z) > 40, 'the two squads on two different posts ' + (a && b ? Math.round(Math.hypot(a.x - b.x, a.z - b.z)) + ' m apart' : ''));
  if (a && b) { const d = Math.hypot(a.kx - b.kx, a.kz - b.kz), cr = Math.abs($('wrap')(a.a - b.a)); ok(d < 1 && cr > .3, 'their sectors cross on the same kill zone (' + Math.round(cr * 180 / Math.PI) + '° between them)'); }
  const out = all.filter(p => Math.hypot(p.x - P.x, p.z - P.z) > P.r && p.dk !== 'vigia').length;
  ok(out === 0, 'everybody but the watch inside the point (' + out + ' outside)');
  /* two tanks */
  const tk = [0, 1].map(k => { const p = $('routeAt')(r, r.len * .35 - 300 - 40 * k), u = C.addUnit('tank', 0, p.x, p.z, S.E.sides[S.fac[0]].tanks[0], false, 0, r.len * .35 - 300 - 40 * k, 1, k); return u; });
  const n = $('dfpTkGo')(0, pl, 2, 'me');
  ok(n === 2, n + ' tanks sent to the point\'s places');
  const sp = tk.map(u => u.ai && u.ai.dfp).filter(Boolean);
  if (sp.length === 2) {
    const d = Math.hypot(sp[0].x - sp[1].x, sp[0].z - sp[1].z), mid = Math.min(...sp.map(s => Math.hypot(s.x - P.x, s.z - P.z)));
    ok(d >= 30, 'the tanks ' + Math.round(d) + ' m apart (30 m or more)');
    ok(mid >= $('DFP').tk.mid, 'none in the middle of the point (nearest ' + Math.round(mid) + ' m)');
    const K = pl.ap[0], ky = C.hgt(K.kx, K.kz) + 1.2;
    ok(sp.every(s => $('los')({ x: s.x, z: s.z }, C.hgt(s.x, s.z) + $('DFP').tk.tur, { x: K.kx, z: K.kz }, ky)), 'both turrets see the main approach\'s kill zone');
    console.log('   hull down: ' + pl.tk.map(s => (s.hd ? 'sim' : 'não') + (s.alt ? ' (alternativa a ' + Math.round(Math.hypot(s.alt.x - s.x, s.alt.z - s.z)) + ' m)' : '')).join(', '));
  }
}
console.log('   view: ' + JSON.stringify($('dfpView')(0)).slice(0, 300));
done();
