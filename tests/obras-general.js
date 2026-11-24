'use strict';
/* The general's Fortificar with an outline (OBR, cf-pol2-obras: P18): obrGenFort says where the work ordered at a point will lie (OBR.dig m
   ahead, facing the enemy's base or the turn [ ] gave it) and why not there, with the rules of the works (fortWhy) and of a supply base
   (siteWhy); what has no footprint has none; and the squad that answers the order digs it where the outline was, turned as it was */
const H = require('./harness'), ok = H.ok;
const load = o => { const C = H.load(o); C.$('CN').on = 0; return C; };
const sq = (C, t, x, z, job) => { const $ = C.$, p = $('railOf')(x, z), q = C.addSquad(t, x, z, p.ri, p.s); q.job = job || 'held'; q.jk = 0; q.col = false; $('setOrd')(q, { k: 'hold', ri: p.ri, s: p.s, x, z, R: 12 }); return q; };
const tick = (C, secs) => { for (let i = 0; i < secs; i++) { C.run(1, null, 1 / 20); for (const t of [0, 1]) C.$('plan')(t); } };
const fresh = era => {
  const C = load({ seed: 5, mapv: 5 }), $ = C.$; C.seed(7);
  const S = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' }); S.demo = false; S.over = true; S.units = []; S.planes = []; S.men = []; S.squads = []; for (const f of S.fld) f.next = 1e9;
  for (const t of [0, 1]) { const Cm = $('cmdOf')(t); Cm.mnT = 1e9; Cm.atkT = 1e9; }
  return { C, S, $ };
};
/* level open ground on side 0's half where a trench may lie OBR.dig m ahead of the click, whichever way it faces */
function place(C, S) {
  const b = S.base[0], $ = C.$;
  for (let d = 2000; d < 6000; d += 37) for (const zz of [.5, .3, .7]) {
    const x = b.x + d, z = b.z * zz; if (!$('gMapOk')(x, z)) continue;
    if ([0, 1, 2, 3, 4, 5].every(i => { const a = i * Math.PI / 3; return !C.fortWhy(1, 0, x + Math.cos(a) * 5, z - Math.sin(a) * 5, a); })) return { x, z };
  }
  return null;
}

console.log('-- the outline under the cursor --');
{
  const { C, S, $ } = fresh('ww2'), G = $('obrGenFort'), OBR = $('OBR'), FORT = $('FORT'), BLD = $('BLD'), p = place(C, S);
  const e = $('lsFoeBase')(0, p.x, p.z), a0 = $('headTo')(p.x, p.z, e.x, e.z), t = G(0, 'trench', p.x, p.z, NaN);
  ok(!!t && Math.abs(t.a - a0) < 1e-9 && Math.abs(t.x - (p.x + Math.cos(a0) * OBR.dig)) < 1e-6 && Math.abs(t.z - (p.z - Math.sin(a0) * OBR.dig)) < 1e-6 && t.L === FORT.trench.size[0] && t.why === '',
    'a trench: ' + OBR.dig + ' m ahead of the click, facing the enemy\'s base, ' + t.L + ' m long, allowed');
  const r = G(0, 'trench', p.x, p.z, a0 + Math.PI / 2);
  ok(Math.abs(r.a - a0 - Math.PI / 2) < 1e-9 && Math.abs(r.rot - r.a - Math.PI / 2) < 1e-9, 'turned by [ ]: the facing given, the length across it');
  const w = G(0, 'sandbag', S.base[0].x, S.base[0].z, NaN), s = G(0, 'sup', p.x, p.z, NaN);
  ok(w.why !== '' && w.why === C.fortWhy(2, 0, w.x, w.z, w.a) && s && s.L === BLD.size[0] && s.why === C.siteWhy(0, s.x, s.z, s.a), 'on the main base sandbags are refused with fortWhy\'s reason (' + w.why + '); a supply base is judged by siteWhy (' + (s.why || 'allowed') + ')');
  ok(G(0, 'mineat', p.x, p.z, NaN) === null && G(0, 'aapos', p.x, p.z, NaN) === null, 'a minefield and an AA position have no outline of their own');
  ok(G(0, 'dome', p.x, p.z, NaN).why === 'era', 'the anti-rocket dome in 1944: era');
}

console.log('-- the squad digs it where the outline was --');
{
  const { C, S, $ } = fresh('ww2'), G = $('obrGenFort'), p = place(C, S);
  C.genCtl(0, 'me', { eco: 1, atk: 0, def: 0, sup: 1 });
  const e = $('lsFoeBase')(0, p.x, p.z), a = $('headTo')(p.x, p.z, e.x, e.z) + Math.PI / 4, o = G(0, 'trench', p.x, p.z, a);
  sq(C, 0, p.x - 60, p.z - 40, 'eng');
  const r = C.genCmd(0, { c: 'fort', k: 'trench', x: p.x, z: p.z, a }, 'me');
  tick(C, 150);
  const f = S.forts.find(f => f.team === 0 && f.k === 1 && !f.pre && Math.hypot(f.x - p.x, f.z - p.z) < 40);
  ok(r.ok && !!f && Math.hypot(f.x - o.x, f.z - o.z) < 1 && Math.abs(Math.atan2(Math.sin(f.a - a), Math.cos(f.a - a))) < 1e-6,
    'a trench ordered turned 45° off the enemy: started ' + (f ? Math.hypot(f.x - o.x, f.z - o.z).toFixed(2) + ' m from the outline, facing as it did' : 'nowhere (' + (r.why || r.id) + ')'));
}
H.done();
