'use strict';
/* A match with three sides starts and runs (the hotfix of main after the 3-sides packages merged out of order).
   - The page's hangar demo (newState as startDemo calls it, N 3) spawned an attack helicopter, a fighter and a cas for the Insurgents, who have no
     aviation: addHeli/addPlane read the def of an undefined id and the demo threw before the hangar showed.
   - genVM (the general's view model, which the online host builds for every side each ENET.gen s inside step) kept a tally for two sides only:
     with three sides it threw every frame, the match clock stayed at 0 and the screen stayed black.
   A few seconds of each; SECS=<s> for longer runs */
const H = require('./harness'), { ok, done } = H, SECS = +process.env.SECS || 6;

console.log('-- the hangar demo with three sides --');
{
  const C = H.load({ seed: 5, mapv: 9 }); let err = null, S = null;
  try { S = C.newState('modern', null, { N: 3 }); C.run(SECS, null, 1 / 30); } catch (e) { err = e; }
  ok(!err && S && S.N === 3, 'the modern demo with three sides runs ' + SECS + ' s' + (err ? ': ' + err.message : ''));
  ok(S && !S.planes.some(p => p.team === 2), 'no aircraft for the Insurgents, who have no aviation');
}

console.log('-- the general view model of every side --');
for (const [era, N] of [['modern', 3], ['modern', 2], ['ww2', 2]]) {
  const C = H.load({ seed: 7, mapv: 9 }), S = C.watch(era, { n: N }); let err = null;
  try { C.run(SECS, null, 1 / 20); for (let t = 0; t < N; t++) { const V = C.genVM(t, false), A = C.genVM(t, true); if (V.f.length !== N || A.f.length !== N) throw new Error('side ' + t + ': ' + V.f.length + ' tallies'); } } catch (e) { err = e; }
  ok(!err, era + ' with ' + N + ' sides: genVM(t) for every side, a tally a side' + (err ? ': ' + err.message : ''));
}
done();
