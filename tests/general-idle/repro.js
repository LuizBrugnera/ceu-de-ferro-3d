'use strict';
const H = require('../harness.js');
const era = process.argv[2] || 'ww2', mode = process.argv[3] || 'solo', SECS = +process.argv[4] || 90;
const C = H.load({ seed: 7, eco: 1, ff: 1, ana: 1, lg: 1, rec: 1, mapv: 5 }), $ = C.$;
const orig = console.error;
let S;
if (mode === 'solo') S = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane', len: 0 });
else S = C.newState(era, null, { watch: 1, len: 0 });
const park = () => { const P = S.my; if (P) { P.inv = 9; P.dead = false; P.y = 3000; P.v.y = 0; P.hp = P.def.hp; } S.lives = 9; };
let err = null;
try { C.run(SECS, () => { park(); }); } catch (e) { err = e; }
console.log('err', err && err.stack);
for (const t of [0, 1]) {
  const d = S.eco && S.eco.d[t], Cm = S.cmd && S.cmd[t];
  const units = S.units.filter(u => u.team === t && !u.dead && u.ai), planes = S.planes.filter(p => p.team === t && !p.dead && p.ai), sq = S.squads.filter(q => q.team === t && !q.dead);
  console.log('side', t, 'units', units.length, 'withMis', units.filter(u => u.mis).length, 'planes', planes.length, 'squads', sq.length, 'men', S.men.filter(m => m.team === t && !m.dead).length);
  console.log('  pp', d && d.pp && JSON.stringify(d.pp.f), 'res', d && JSON.stringify(Object.fromEntries(Object.entries(d.res).map(([k, v]) => [k, v.length]))), 'q', d && d.q.length);
  console.log('  ops', Cm && Cm.ops.length, Cm && JSON.stringify(Cm.ops.map(o => o.k)), 'camp', Cm && JSON.stringify(Cm.camp && Object.keys(Cm.camp)), 'glog', S.glog && S.glog.l[t].length);
  if (S.glog) for (const e of S.glog.l[t].slice(-6)) console.log('   ', Math.round(e.t), e.k, e.s);
}
console.log('gpOn', $('gpOn')(), 'popK', S.popK, 't', S.t.toFixed(1));
