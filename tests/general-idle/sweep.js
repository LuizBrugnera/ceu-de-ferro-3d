'use strict';
// emulate the browser host: per on both sides, keep stepping after a thrown step, record unique errors and whether the general acts
const H = require('../harness.js');
const SECS = +process.env.SECS || 240, eras = (process.env.ERAS || 'ww2 modern').split(' '), pers = (process.env.PERS || 'ret blz gue art log').split(' ');
for (const era of eras) for (const p of pers) {
  const C = H.load({ seed: 7, eco: 1, ff: 1, ana: 1, lg: 1, rec: 1, mapv: 5 }), $ = C.$;
  const S = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane', len: 1, per: [p, p], dif: ['normal', 'normal'] });
  const park = () => { const P = S.my; if (P) { P.inv = 9; P.dead = false; P.y = 3000; P.v.y = 0; P.hp = P.def.hp; } S.lives = 9; };
  const errs = new Map(), ops = [new Set(), new Set()], mis = [new Set(), new Set()]; const t0 = Date.now();
  for (let n = SECS * 60; n-- > 0;) {
    try { C.step(1 / 60); } catch (e) { const k = (e.stack || String(e)).split('\n').slice(0, 3).join(' / '); if (!errs.has(k)) errs.set(k, Math.round(S.t)); else if (typeof errs.get(k) === 'number') errs.set(k, errs.get(k) + 'x'); }
    park();
    for (const t of [0, 1]) for (const o of S.cmd[t].ops) ops[t].add(o);
    if (n % 30 === 0) for (const l of [S.units, S.planes, S.squads]) for (const u of l) if (u.mis && u.mis.d) mis[u.team].add(u.mis.d);
  }
  console.log(JSON.stringify({ era, p, wall: Math.round((Date.now() - t0) / 1000), ops: [0, 1].map(t => ops[t].size), disp: [0, 1].map(t => mis[t].size), hold: S.cq.p.map(q => q.hold).join(''), errs: [...errs].map(([k, v]) => v + ' ' + k) }));
}
