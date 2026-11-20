'use strict';
/* The infantry rides (EMB, cf-infantaria-veiculos; NÃO TESTADO: this probe was written and never run, by the captain's rule, see
   docs/nao-testado/cf-infantaria-veiculos.md). An AI × AI match without a screen, run twice on the same seed: A with EMB.ride 0 (the measure
   kept, the new rides left out: the game before this task) and B with EMB.ride 1. For each side it prints the long walks begun (an order
   EMB.far m or more from the squad), how many were made aboard (%), the squad-seconds halted waiting for a vehicle, the rides given up, and
   per vehicle model the share of its life in use, its rides and the men it carried (the Insurgents' technicals, ZIL and captured BTR in
   the three-sides match). The checks: B rides more of the long walks than A, no squad waits for a ride longer than EMB.wait plus the
   meeting, and nothing throws.
   ERA=modern|ww2|cold (modern), N=2|3 sides (3: USA × Russia × Insurgents), MIN=<minutes of play> (8), SEED (7), MAPV (9). PAGE=<page> */
const H = require('./harness'), { ok, done } = H;
const ERA = process.env.ERA || 'modern', N = +process.env.N || (ERA === 'modern' ? 3 : 2), MIN = +process.env.MIN || 8, SEED = +process.env.SEED || 7, MAPV = +process.env.MAPV || 9;

function match(ride) {
  const C = H.load({ seed: SEED, eco: 1, mapv: MAPV }), EMB = C.$('EMB'); EMB.ride = ride;
  const S = C.watch(ERA, { n: N, min: MIN + 2 }); let err = null, waitMax = 0;
  const halted = new Map();
  try {
    C.run(MIN * 60, () => {
      for (const q of S.squads) {
        if (q.rd && q.rd.st === 'call' && q.halt) { const w = (halted.get(q) || 0) + 1 / 20; halted.set(q, w); waitMax = Math.max(waitMax, w); }
        else halted.delete(q);
      }
    }, 1 / 20);
  } catch (e) { err = e; }
  const view = [...Array(N).keys()].map(t => C.$('embView')(t));
  return { err, view, waitMax };
}

const A = match(0), B = match(1);
for (const [nm, R] of [['A (EMB.ride 0, before)', A], ['B (EMB.ride 1, after)', B]]) {
  console.log('-- ' + nm + ': ' + ERA + ', ' + N + ' sides, ' + MIN + ' min, seed ' + SEED + ' --');
  ok(!R.err, 'the match runs' + (R.err ? ': ' + R.err.stack : ''));
  R.view.forEach((v, t) => {
    console.log('  side ' + t + ': ' + v.legs + ' long walks, ' + v.rode + ' aboard (' + v.pct + '%), ' + v.wait + ' squad-s waiting, ' + v.off + ' given up, ' + v.go + ' rides given, ' + v.esc + ' escorts, ' + v.rq + ' trucks asked for');
    for (const r of v.veh) console.log('     ' + r.nm + ': ' + r.pct + '% of ' + r.t + ' s in use, ' + r.rides + ' rides, ' + r.men + ' men');
  });
  console.log('  why no ride: ' + JSON.stringify(R.view[0].all.why));
}
const pct = R => { const l = R.view.reduce((a, v) => a + v.legs, 0), r = R.view.reduce((a, v) => a + v.rode, 0); return l ? 100 * r / l : 0; };
ok(pct(B) > pct(A), 'more of the long walks are made aboard: ' + pct(A).toFixed(0) + '% -> ' + pct(B).toFixed(0) + '%');
const EMB = H.load({ mapv: MAPV }).$('EMB');
ok(B.waitMax <= EMB.wait + 120, 'no squad halts for its ride more than ' + (EMB.wait + 120) + ' s (' + B.waitMax.toFixed(0) + ' s)');
if (N === 3) ok(B.view[2].veh.some(r => r.rides > 0), 'the Insurgents ride their own vehicles (' + B.view[2].veh.filter(r => r.rides).map(r => r.nm).join(', ') + ')');
done();
