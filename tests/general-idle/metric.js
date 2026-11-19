'use strict';
// usage: node metric.js <page> <era> <secs> <per0> <per1>
const H = require('../harness.js');
const [page, era, secs, p0, p1] = process.argv.slice(2);
const C = H.load({ page, seed: 7, eco: 1, ff: 1, ana: 1, lg: 1, rec: 1, mapv: 5 }), $ = C.$;
const pv = v => v === 'null' ? null : v;
const S = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane', len: 1, per: [pv(p0), pv(p1)], dif: ['normal', 'normal'] });
const park = () => { const P = S.my; if (P) { P.inv = 9; P.dead = false; P.y = 3000; P.v.y = 0; P.hp = P.def.hp; } S.lives = 9; };
const ops = [new Set(), new Set()], mis = [new Set(), new Set()], kinds = [{}, {}]; let caps = 0; let hold = S.cq.p.map(p => p.hold); let err = null;
const t0 = Date.now();
try {
  C.run(+secs, () => {
    park();
    for (const t of [0, 1]) for (const o of S.cmd[t].ops) if (!ops[t].has(o)) { ops[t].add(o); kinds[t][o.k] = (kinds[t][o.k] || 0) + 1; }
    for (const l of [S.units, S.planes, S.squads]) for (const u of l) if (u.mis && u.mis.d) mis[u.team].add(u.mis.d);
    S.cq.p.forEach((p, i) => { if (p.hold !== hold[i]) { caps++; hold[i] = p.hold; } });
  });
} catch (e) { err = e.stack.split('\n').slice(0, 4).join(' / '); }
const mv = [0, 1].map(t => { let n = 0, s = 0; for (const q of S.squads) if (q.team === t && !q.dead) { n++; } return n; });
console.log(JSON.stringify({ page: page.split('/').pop(), era, t: Math.round(S.t), wall: Math.round((Date.now() - t0) / 1000), err, per: S.per, ops: [0, 1].map(t => ops[t].size), kinds, disp: [0, 1].map(t => mis[t].size), caps, hold: S.cq.p.map(p => p.hold).join(''), tk: S.cq.tk.map(Math.round), popK: S.popK, sq: mv }));
