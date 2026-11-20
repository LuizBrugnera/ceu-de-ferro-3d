'use strict';
/* P2, the position service of the soldiers' brain (CEREBRO: posicao, TPS): the registry of cover points and what each protects from,
   the query and its profiles, the hold that keeps men apart, the budget a step, coverSpot as the 'abrigo' profile, and the place against
   armour (contra_blindado) with the way through a house. Short drills on a sandbox, no battle */
const H = require('./harness'), { ok, done } = H, { performance } = require('perf_hooks');
const C = H.load({ seed: 11, mapv: +process.env.MAPV || 10 }), $ = C.$; C.performance = performance;
console.log('page: ' + H.PAGE);
if (!$('typeof tps === "function"')) { console.log('no TPS: a page before P2'); process.exit(0); }
const S = C.sandbox('modern'), T = S.T, TPS = $('TPS');
const man = (team, x, z) => { const m = C.addMan($('INF')[S.era][team][0], team, x, z, 0); m.ai = $('manBrain')(0); m.ai.gx = x; m.ai.gz = z; m.y = $('manY')(x, z); return m; };
const far = (p, a, d) => ({ x: p.x + Math.cos(a) * d, z: p.z + Math.sin(a) * d, y: C.hgt(p.x + Math.cos(a) * d, p.z + Math.sin(a) * d) + 2.75 });
const house = T.houses.find(o => o.B && $('drBldOk')(o) && o.B.mat.pen >= TPS.heavy && $('tpsEnts')(o).length >= 2);
ok(!!house, 'a standing house of brick or stone with two ways in (' + (house ? house.B.mat.pen : '-') + ')');

console.log('-- the registry --');
{
  const st = $('tpsStat()'), pts = $('tpsPts')(house.x, house.z, house.r + 4), ks = [...new Set(pts.map(p => p.k))];
  ok(st.pts > 1000 && st.cells > 100, 'made at the load: ' + st.pts + ' points in ' + st.cells + ' cells');
  ok(ks.includes('muro') && ks.includes('janela') && ks.includes('canto'), 'a house gives walls, windows and corners (' + ks.join(', ') + ')');
  const w = pts.find(p => p.k === 'muro' && !p.in && p.l === 0), toB = Math.atan2(house.z - w.z, house.x - w.x);
  const beyond = $('tpsProt')(w, w.x + Math.cos(toB) * 200, w.z + Math.sin(toB) * 200, 1), behind = $('tpsProt')(w, w.x - Math.cos(toB) * 200, w.z - Math.sin(toB) * 200, 1);
  ok(beyond >= 2 && behind === 0, 'a wall covers a crouched man from beyond the house (' + beyond + ') and not from his back (' + behind + ')');
  const win = pts.find(p => p.k === 'janela' && p.set), out = win && Math.atan2(win.z - house.z, win.x - house.x);
  ok(!!win && Math.abs($('wrap')(win.set.a - out)) < Math.PI / 2 && $('tpsProt')(win, win.x + Math.cos(win.set.a) * 100, win.z + Math.sin(win.set.a) * 100, 1) >= 1, 'a window fires out over its arc, covered under the sill');
  const c = pts.find(p => p.k === 'canto'); ok(!!c && (c.incl === 'esq' || c.incl === 'dir'), 'a corner knows the side to lean out (' + (c && c.incl) + ')');
  ok($('tpsRooms')(house).length >= 2 && $('tpsEnts')(house).every(e => e.ix !== undefined), 'its rooms and its ways in');
  const n0 = pts.length, B = house.B; let e = 0; while (e < B.oR && (!B.kd[e] || S.cbs[B.off + e])) e++;
  $('bSet')(house, e, 3); const n1 = $('tpsPts')(house.x, house.z, house.r + 4).length;
  ok(n1 < n0, 'a wall knocked down: the cell is made again (' + n0 + ' -> ' + n1 + ' points)');
}

console.log('-- the query: six men under fire, apart --');
{
  const P = $('tpsPts')(house.x, house.z, house.r + 8).find(p => !p.in && p.k === 'muro'), a = Math.atan2(P.z - house.z, P.x - house.x), e = far(P, a + Math.PI, 160);
  const men = []; for (let i = 0; i < 6; i++) men.push(man(0, P.x + Math.cos(a) * 6 + (i - 2.5) * 1.5, P.z + Math.sin(a) * 6));
  const got = men.map(m => { const r = C.tps(m, 'abrigo', { th: [e], r: 26 }); if (r) $('tpsHold')(m, r); return r; });
  let dmin = 1e9; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if (got[i] && got[j]) dmin = Math.min(dmin, Math.hypot(got[i].x - got[j].x, got[i].z - got[j].z));
  ok(got.every(Boolean) && dmin >= 3, 'six places, none within 3 m of another (nearest ' + dmin.toFixed(1) + ' m: ' + got.map(r => r && r.k).join(', ') + ')');
  const cov = got.filter(r => (r.pt && $('tpsProt')(r.pt, e.x, e.z, 1) >= 2) || !$('los')(e, e.y, r, C.hgt(r.x, r.z) + 1.2)).length;
  ok(cov >= 4, cov + ' of 6 behind something that covers them from the enemy (a wall, or the line from him cut)');
  for (const m of men) $('tpsFree')(m);
  /* the cost */
  let t = performance.now(), n = 0; for (let i = 0; i < 150; i++) { const m = men[i % 6]; C.tps(m, i % 3 ? 'abrigo' : 'base_de_fogo', { th: [e], alvo: e, r: 26 + (i % 5) }); n++; }
  const avg = (performance.now() - t) / n;
  ok(avg <= .15, 'a query costs ' + avg.toFixed(3) + ' ms on average (target 0.15 ms; the vm of the harness makes every global lookup slow, a browser less)');
  for (let i = 0; i < 30; i++) $('tpsAsk')(men[i % 6], 'abrigo' + (i < 6 ? '' : ''), { th: [e] });
  const q0 = S.cp.q.length; C.step(1 / 60); const answered = q0 - S.cp.q.length;
  ok(answered <= TPS.q, 'the queue answers ' + answered + ' a step, ' + TPS.q + ' at most');
  ok(!!$('tpsRes')(men[0], 'abrigo'), 'and the answer waits for its man');
  for (const k of ['vigia', 'socorro', 'assalto', 'cavar']) { const r = C.tps(men[0], k, { th: [e], alvo: k === 'socorro' ? men[3] : k === 'vigia' ? e : k === 'assalto' ? { x: e.x, z: e.z } : undefined }); ok(r === null || Number.isFinite(r.x), 'profile ' + k + ': ' + (r ? r.k + ' ' + r.sc : 'nothing')); }
}

console.log('-- coverSpot is the abrigo profile --');
{
  const m = man(0, house.x + house.r + 15, house.z), e = man(1, house.x + house.r + 180, house.z); m.ai.tgt = e;
  const sl = { x: m.x, z: m.z };
  const a = C.coverSpot(m, sl, e); ok(a === sl || !a.tp, 'the first time he asks, and keeps his place meanwhile');
  C.step(1 / 60); const b = C.coverSpot(m, sl, e);
  ok(!!b.tp && Number.isFinite(b.x), 'at his next thought he has the answer (' + b.k + ', ' + Math.hypot(b.x - m.x, b.z - m.z).toFixed(1) + ' m away)');
  TPS.on = 0; m.ai.cs = null; const c = C.coverSpot(m, sl, e); TPS.on = 1; ok(!c.tp, 'with TPS.on 0, coverSpot as it was');
}

console.log('-- against armour: a wall that stops the gun, through the house --');
{
  const B = house, a = 0, side = { x: B.x + Math.cos(a) * (B.r + 8), z: B.z + Math.sin(a) * (B.r + 8) }, tank = far(B, a, B.r + 160);
  const m = man(0, side.x, side.z), r = C.tps(m, 'contra_blindado', { th: [tank] });
  ok(!!r && r.k !== 'mata' && r.k !== 'veiculo', 'a place that stops a gun (' + (r && r.k) + ', ' + (r && r.pt ? 'pw ' + r.pt.pw : 'the ground\'s fold') + ')');
  const far2 = { x: B.x - Math.cos(a) * (B.r + 3), z: B.z - Math.sin(a) * (B.r + 3), pt: null }, W = $('tpsBldPass')(m, far2);
  ok(!!W && W.length >= 4 && W.some(p => p.b === B), 'to the far side, the way runs through the house (' + (W ? W.length : 0) + ' waypoints)');
  const D = $('DRILLS').find(d => d.id === 'tanque'); ok(!!D && /contra_blindado/.test(D.act.toString()), 'the tank drill asks for it');
}
ok(!H.nan(S), 'nothing turned to NaN');
done();
