'use strict';
/* A new state lets the last one go (cf-pol-fluxos). In the browser every join and every leave left the whole battle before it alive, about 85 MB
   each, until the tab ran out of memory: honTown's cache of 50 m cells (HONU) kept the state of each cell, the analytics kept its last match's
   (ANA.S, and the soldiers of its live manoeuvres, MVA.live), and every entity looked at under the trees kept its state as canopy's key
   (o.cnS), so one entity kept after its match (the bomb the weapon camera followed, the vehicle left in the picker) kept all of it. Here: a
   battle runs, one of its soldiers is kept, another battle starts, and after a collection the first state is gone. About 30 s */
require('v8').setFlagsFromString('--expose-gc');
const gc = require('vm').runInNewContext('gc');
const H = require('./harness'), { ok, done } = H;

(async () => {
  const c = H.load({ seed: 9, ana: true, mapv: 11 }), $ = c.$;   // the page's map (trees, towns): canopy and honTown at work
  c.watch('modern', { len: 0 }); c.run(+(process.env.SECS || 20));
  let A = $('S');
  const ref = new WeakRef(A), kept = A.men.find(m => m.cnS !== undefined) || A.men[0], HONU = $('HONU');
  ok(HONU.size > 0 && kept && kept.cnS !== undefined, 'the first battle filled the caches: ' + HONU.size + ' cells in HONU, a soldier looked at under the trees');
  ok(typeof kept.cnS === 'number', 'canopy keeps the state\'s number on the entity, not the state (' + typeof kept.cnS + ')');
  A = null;
  c.watch('modern', { len: 0 }); c.run(2);
  ok(![...HONU.values()].some(v => v.S === ref.deref()) && ($('ANA').S === $('S') || $('ANA').S === null), 'the new state: HONU holds only the new battle\'s cells, ANA.S is the new one or none');
  await new Promise(r => setTimeout(r, 0)); gc(); await new Promise(r => setTimeout(r, 0)); gc();
  ok(ref.deref() === undefined, 'after a collection the first battle is gone, though one of its soldiers is still held');
  ok(kept.x !== undefined, '(the soldier itself is still there)');
  done();
})();
