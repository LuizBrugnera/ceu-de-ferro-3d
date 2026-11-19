'use strict';
const H = require('../harness.js');
const era = process.argv[2] || 'ww2', mode = process.argv[3] || 'solo', SECS = +process.argv[4] || 300, seed = +process.argv[5] || 7;
const C = H.load({ seed, eco: 1, ff: 1, ana: 1, lg: 1, rec: 1, mapv: 5 }), $ = C.$;
let S;
const o = { cls: 'plane', len: 1, per: [null, 'sort'], dif: ['normal', 'normal'] };
if (mode === 'solo') S = C.newState(era, $('ERAS')[era].sides[0].fighter, o);
else S = C.newState(era, null, { watch: 1, len: 1, per: ['sort', 'sort'], dif: ['normal', 'normal'] });
console.log('per', JSON.stringify(S.per), 'dif', JSON.stringify(S.dif), 'mv', S.mv);
const park = () => { const P = S.my; if (P) { P.inv = 9; P.dead = false; P.y = 3000; P.v.y = 0; P.hp = P.def.hp; } S.lives = 9; };
const misIds = [new Set(), new Set()];
for (let k = 0; k < SECS / 30; k++) {
  try { C.run(30, () => { park(); for (const l of [S.units, S.planes, S.squads]) for (const u of l) if (u.mis && u.mis.d) misIds[u.team].add(u.mis.d); }); } catch (e) { console.log('THROW at', S.t, e.stack.split('\n').slice(0, 5).join('\n')); break; }
  const row = [0, 1].map(t => { const Cm = S.cmd[t]; return 't' + t + ' u' + S.units.filter(u => u.team === t && !u.dead).length + ' p' + S.planes.filter(u => u.team === t && !u.dead).length + ' sq' + S.squads.filter(u => u.team === t && !u.dead).length + ' disp' + misIds[t].size + ' ops[' + Cm.ops.filter(o => !o.over).map(o => o.k) + '] glog' + S.glog.l[t].length + ' q' + S.eco.d[t].q.length + ' en' + Math.round(S.eco.d[t].en || 0) + ' mt' + Math.round(S.eco.d[t].mt || 0); });
  console.log(Math.round(S.t), 'popK', S.popK, row.join(' | '));
}
for (const t of [0, 1]) for (const e of S.glog.l[t].slice(-5)) console.log('  ', t, Math.round(e.t), e.k, e.s);
