'use strict';
// node trace.js <page> <era> <secs> : op state transitions + atk/camp logs
const H = require('../harness.js');
const [page, era, secs] = process.argv.slice(2);
const C = H.load({ page, seed: 7, eco: 1, ff: 1, ana: 1, lg: 1, rec: 1, mapv: 5 }), $ = C.$;
const S = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane', len: 1, per: [null, 'sort'], dif: ['normal', 'normal'] });
const park = () => { const P = S.my; if (P) { P.inv = 9; P.dead = false; P.y = 3000; P.v.y = 0; P.hp = P.def.hp; } S.lives = 9; };
const seen = new Map(); const gl = [0, 0];
C.run(+secs, () => {
  park();
  for (const t of [0, 1]) {
    for (const o of S.cmd[t].ops) { const k = o.st + (o.over ? '!' : ''); if (seen.get(o) !== k) { seen.set(o, k); console.log(Math.round(S.t), 'side', t, 'op', o.k, o.id || '', '->', k); } }
    const L = S.glog.l[t]; const last = L[L.length - 1]; if (last && last !== gl[t]) { gl[t] = last; if (/atk|camp|fire/.test(last.k)) console.log(Math.round(S.t), 'side', t, 'LOG', last.k, last.s); }
  }
});
console.log('end', Math.round(S.t), 'hold', S.cq.p.map(p => p.hold).join(''), 'tk', S.cq.tk.map(Math.round));
