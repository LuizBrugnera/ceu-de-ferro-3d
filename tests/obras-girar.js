'use strict';
/* Turning a work in the build mode (OBR, cf-pol2-obras: P15) and where the outline of a work across the river lies (P16): [ ] and the
   wheel add OBR.turn to the line of the aim for the base, a trench or a wall, the work starts so turned, the turn lasts from one work to the
   next and ends with the mode; obrSpan puts a pontoon's, a rebuild's and a new bridge's outline where fortAdd lays the work, not at the aim */
const H = require('./harness'), ok = H.ok;

console.log('-- turning the work in hand --');
{
  const C = H.load({ seed: 78 }), $ = C.$, S = C.newState('ww2', 'schutze', { cls: 'inf', mouse: true }), OBR = $('OBR'), FORT = $('FORT');
  C.plan = () => {}; S.waveTimer = 1e9; S.men = S.men.filter(m => m === S.my); S.squads = []; S.units = [];
  for (const f of S.forts.slice()) C.fortDrop(f); S.forts = [];
  const P = S.my, I = S.input, tap = k => { I[k] = true; C.run(.05); I[k] = false; C.run(.05); }, turn = $('obrTurn'), near = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < 1e-6;
  P.inv = 1e9; S.aim.h = .3; S.aim.p = -.25; C.run(.1);
  tap('build'); turn(1); turn(1); C.run(.05); const base = S.bm && S.bm.a;
  tap('build'); C.run(.05); const tr = S.fm && S.fm.a;
  ok(near(base, .3 + 2 * OBR.turn) && near(tr, .3 + 2 * OBR.turn), 'two steps of ' + Math.round(OBR.turn * 180 / Math.PI) + '°: the base\'s outline and, after N, the trench\'s are turned off the aim by ' + Math.round(2 * OBR.turn * 180 / Math.PI) + '°');
  let why = S.fm.why, n = 0; while (why && n++ < 40) { P.x += 7; C.run(.1); why = S.fm.why; }
  tap('fire'); const f = S.forts[S.forts.length - 1];
  ok(!!f && f.k === 1 && near(f.a, .3 + 2 * OBR.turn), 'the click starts the trench so turned (facing ' + (f ? f.a.toFixed(3) : '-') + ')');
  for (let i = 0; i < 30; i++) turn(1); const w = S.brot;
  ok(Math.abs(w) <= Math.PI + 1e-9 && near(w, 32 * OBR.turn), 'the turn stays within ±180° (' + Math.round(w * 180 / Math.PI) + '° after 32 steps)');
  I.ordA = true; C.run(.05); I.ordA = false; C.run(.05);
  ok(!S.fm && !S.bm && S.brot === 0, 'leaving the mode ends the turn: the next outline is on the aim again');
  tap('build'); ok(near(S.bm.a, .3), 'opened again, the base lies on the aim');
}

console.log('-- the outline of a work across the river --');
{
  const g = H.load({ mapv: 5, seed: 7 }), $ = g.$, S = g.sandbox('ww2'), span = $('obrSpan'), L = $('brs()'), FORT = $('FORT'), BR = $('BR');
  const b = L[1], e = b.ends[0], sb = span(7, e.x + 3, e.z);
  ok(!!sb && Math.hypot(sb.x - b.x, sb.z - b.z) < 1 && Math.abs(sb.L - b.len) < 1e-6,
    'by a bridge\'s bank end a pontoon\'s outline lies along that bridge (its middle, ' + Math.round(b.len) + ' m)');
  const dir = { x: Math.cos(sb.a), z: -Math.sin(sb.a) }, bl = Math.hypot(b.dx, b.dz) || 1;
  ok(Math.abs(Math.abs(dir.x * b.dx / bl + dir.z * b.dz / bl) - 1) < 1e-6, 'and its length runs the bridge\'s way');
  const s = $('brSites()').find(s => L.every(c => Math.abs(c.z - s.z) > 400)), se = s && s.ends[0];
  const sp = se && span(7, se.x + 2, se.z), sn = se && span(10, se.x + 2, se.z), far = se && span(7, se.x - 300, se.z + 300);
  let f = null;
  if (se) { const fs = $('fortStart'); f = fs(7, 0, se.x + 2, se.z, 0) || null; }
  ok(!!sp && Math.abs(sp.x - s.x) < 1e-6 && Math.abs(sp.z - s.z) < 1e-6 && Math.abs(sp.L - s.len) < 1e-6 && !!sn && sn.x === sp.x && far === null,
    'at the bank end of a narrow stretch a pontoon\'s and a new bridge\'s outline span the river there; away from the river, none');
  ok(!!f && f.o && Math.abs(f.o.x - sp.x) < .5 && Math.abs(f.o.z - sp.z) < .5, 'and that is where the pontoon started there lies (' + (f ? Math.round(f.o.x) + ', ' + Math.round(f.o.z) : 'not started: ' + (se && $('fortWhy')(7, 0, se.x + 2, se.z, 0))) + ')');
}
H.done();
