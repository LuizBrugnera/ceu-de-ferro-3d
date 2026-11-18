'use strict';
/* Part A: can an AI shoot at what smoke hides? Every scenario runs on the flat disc of base 0 (o.patrol: where an attack plane with nothing
   to do patrols, S.W * .58, as an AI only goes for what its own eyes (VIEW) have made out), many seeded trials each.
   A target drives across; at T1 smoke hides it (a corridor of screens over its path, or one screen on the shooter itself).
   Rounds are binned by when they were fired: pre (before T1), mem (the memory window), late (hidden, after the memory), post (visible again).
   For each round: how near it came to the target itself (dTrue) and to where the target was last seen (dLast).
   Run against the page before the fix with PAGE=.work/phase8/base/page.html to get the "before" numbers (asserts only run on a page with SIGHT). */
const H = require('./harness'), N = +process.env.TRIALS || 12;
const C = H.load(), fixed = C.$('typeof SIGHT !== "undefined"'), DU = C.damageUnit, DP = C.damagePlane;
console.log('page: ' + H.PAGE + (fixed ? '' : '   (no SIGHT table: before the fix, numbers only)'));

function trial(seed, o) {
  const c = C; c.seed(seed); const S = c.sandbox(o.era), $ = c.$, hd = $('hdist'), B = o.patrol ? { x: S.W * .58, z: 0 } : S.base[0], g = c.hgt(B.x, B.z), SM = $('SMOKE'), mem = fixed ? $('SIGHT').mem : 4;
  const side = S.E.sides, R = { pre: 0, mem: 0, late: 0, post: 0, hitMem: 0, hitLate: 0, dTrue: [], dLast: [], dropped: null, launchHid: 0 };
  let tgt, sh, L = null, T1 = o.T1, vis = null;
  const hits = [], log = (o2, dmg) => { if (o2 === tgt && dmg > 0) hits.push(S.t); return o2 === tgt; };
  c.damageUnit = (a, b, d, e, f) => { if (!log(a, b)) DU(a, b, d, e, f); }; c.damagePlane = (a, b, d, e, f) => { if (!log(a, b)) DP(a, b, d, e, f); };
  const screen = (x, z) => S.smokes.push({ x, y: c.hgt(x, z), z, t0: S.t - SM.build });
  if (o.air) {   // the target is a drone on a circle around the shooter; the shooter sits in its own screen
    tgt = c.addPlane(side[0].fighter, 0, B.x + o.air[0], g + o.air[1], B.z, 0, false);
    sh = c.addUnit(o.kind, 1, B.x, B.z, o.id || null, true);
  } else {
    tgt = c.addVehicle(o.tk || 'truck', o.tk ? side[0][o.tk] : null, 0, B.x - (o.trig ? 400 : 11 * T1), B.z + (o.z || 0), 0);
    tgt.ctl.drive = o.still ? 0 : 1;
    if (o.plane) { sh = c.addPlane(o.plane, 1, B.x + 5200, g + 650, B.z + (o.z || 0), Math.PI, true, 'cas', $('typeof LO === "undefined" ? undefined : LO.base("' + o.plane + '")')); if (o.wi) sh.ord[0] = 0; }   // the plane's own load, whatever the AI would pick for this target: the scenarios count on its two slots
    else { sh = c.addUnit(o.kind, 1, B.x, B.z + o.d, o.id || (o.kind === 'tank' ? side[1].tanks[0] : side[1][o.kind]), true); sh.h = Math.PI / 2; }
    if (o.spotter) { const sp = c.addUnit('tank', 1, B.x, B.z + (o.z || 0) + 420, side[1].tanks[0], true); sp.arms.forEach(a => { a.ammo = 0; }); }
  }
  const eyeY = o.plane ? sh.y : sh.y + sh.def.mh, hidden = () => c.smoked(sh.x, sh.kind ? sh.y + sh.def.mh : sh.y, sh.z, tgt.x, tgt.y + (tgt.kind ? 2.5 : 0), tgt.z);
  const seen = new Set(), live = [];
  const bin = () => (S.t < T1 ? 'pre' : vis !== null && S.t >= vis ? 'post' : S.t - T1 <= mem + .3 ? 'mem' : 'late');
  c.run(o.T, () => {
    if (o.air) { const a = S.t * o.air[2] / o.air[0]; Object.assign(tgt, { x: B.x + Math.cos(a) * o.air[0], y: g + o.air[1], z: B.z + Math.sin(a) * o.air[0], hp: tgt.def.hp, dead: false }); tgt.v = { x: -Math.sin(a) * o.air[2], y: 0, z: Math.cos(a) * o.air[2] }; }
    if (o.still && !o.park && S.t >= T1) tgt.ctl.drive = 1;
    if (o.trig && L === null && hd(sh, tgt) < o.trig) T1 = S.t;
    if (L === null && S.t >= T1) {
      L = { x: tgt.x, z: tgt.z };
      if (o.air) screen(sh.x, sh.z); else for (let x = tgt.x; x <= tgt.x + (o.len || 500); x += 45) screen(x, tgt.z);
    }
    if (o.keep && S.t < o.keep && L && S.smokes.length && S.t - S.smokes[S.smokes.length - 1].t0 > 8) screen(tgt.x, tgt.z);
    if (L && vis === null && S.t > T1 + 1 && !hidden()) vis = S.t;
    if (L && R.dropped === null && S.t >= T1 + mem + .6) R.dropped = !(sh.ai ? sh.ai.tgt : sh.tgt);
    for (const k of ['bullets', 'bombs', 'missiles', 'shells']) for (const b of S[k]) {
      if (b.by !== sh || seen.has(b)) continue;
      seen.add(b); const w = bin(); R[w]++; if (k === 'missiles' && (w === 'mem' || w === 'late')) R.launchHid++;
      if (w === 'mem' || w === 'late') live.push({ b, w, dT: 1e9, dL: 1e9, fall: k === 'bombs' });
    }
    for (const q of live) { const b = q.b; if (q.done) continue; if (b.gone) q.done = true; if (q.fall && !b.gone) continue; q.dT = Math.min(q.dT, o.air ? Math.hypot(b.x - tgt.x, b.y - tgt.y, b.z - tgt.z) : hd(b, tgt)); q.dL = Math.min(q.dL, hd(b, L)); }
  });
  for (const q of live) if ((q.w === 'mem' || o.all) && q.dT < 1e9) { R.dTrue.push(q.dT); R.dLast.push(q.dL); }
  for (const t of hits) { if (t < T1 || (vis !== null && t >= vis)) continue; if (t - T1 <= mem + (o.fly || .3)) R.hitMem++; else R.hitLate++; }
  R.vis = vis === null ? null : vis - T1;
  return R;
}
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN), f1 = v => (Number.isFinite(v) ? v.toFixed(0) : '-');
function scenario(name, o, check) {
  const A = { pre: 0, mem: 0, late: 0, post: 0, hitMem: 0, hitLate: 0, launchHid: 0, dTrue: [], dLast: [], dropped: 0, vis: [] };
  for (let i = 1; i <= N; i++) { const r = trial(i * 7919 + name.length, o); for (const k of ['pre', 'mem', 'late', 'post', 'hitMem', 'hitLate', 'launchHid']) A[k] += r[k]; A.dTrue.push(...r.dTrue); A.dLast.push(...r.dLast); A.dropped += r.dropped ? 1 : 0; if (r.vis !== null) A.vis.push(r.vis); }
  A.mT = mean(A.dTrue); A.mL = mean(A.dLast);
  console.log(name.padEnd(34) + ' rounds pre ' + String(A.pre).padStart(4) + ' | mem ' + String(A.mem).padStart(4) + ' | late ' + String(A.late).padStart(4) + ' | post ' + String(A.post).padStart(4) +
    ' || hits hidden: mem ' + A.hitMem + ' late ' + A.hitLate + ' || mem rounds: mean miss of target ' + f1(A.mT) + ' m, of last seen ' + f1(A.mL) + ' m || dropped ' + A.dropped + '/' + N + ' || visible again after ' + f1(mean(A.vis)) + ' s');
  if (fixed && check) check(A);
  return A;
}
const gnd = A => { H.ok(A.late === 0, 'no round after the memory while hidden'); H.ok(A.hitLate === 0, 'no hit on the hidden target after the memory'); H.ok(A.dropped === N, 'target dropped after the memory'); H.ok(A.post > 0, 'fire resumes when it is visible again'); H.ok(A.pre > 0, 'it was engaged before the smoke'); H.ok(!(A.mem > 0) || A.mL < A.mT, 'memory fire goes at the last seen place, not at the target'); };
const air = A => { H.ok(A.late === 0, 'no round after the memory while hidden'); H.ok(A.launchHid === 0, 'no missile launched while hidden'); H.ok(A.post > 0, 'fire resumes when the screen fades'); H.ok(A.pre > 0, 'it was engaged before the smoke'); };
const never = A => { H.ok(A.mem + A.late === 0, 'nothing released at a target it never saw'); H.ok(A.hitMem + A.hitLate === 0, 'no hit while hidden'); H.ok(A.post > 0, 'attacks once the smoke is gone'); };
const blind = A => { H.ok(A.late === 0, 'nothing released after the memory'); H.ok(A.hitLate === 0, 'no hit after the memory'); };

console.log('\n-- ground guns on a ground target crossing at 450 m; hidden at T1 = 9 s --');
for (const era of ['ww2', 'modern']) {
  scenario(era + ' tank, screen fades', { era, kind: 'tank', d: 450, T1: 9, T: 34, tk: 'aa' }, gnd);
  scenario(era + ' tank, target leaves screen', { era, kind: 'tank', d: 450, T1: 9, T: 30, len: era === 'modern' ? 135 : 90, tk: 'aa' }, gnd);   // the faster modern target needs the longer screen to stay hidden past the memory
}
console.log('\n-- shooter inside its own screen, drone circling (radius m, height m, speed m/s) --');
scenario('ww2 tank roof MG, low plane', { era: 'ww2', kind: 'tank', id: 'sherman', air: [500, 200, 90], T1: 8, T: 34 }, air);
scenario('ww2 AA (fixed), autocannon', { era: 'ww2', kind: 'aa', air: [900, 350, 110], T1: 8, T: 34 }, air);
scenario('ww2 AA (fixed), flak', { era: 'ww2', kind: 'aa', air: [2200, 900, 120], T1: 8, T: 34 }, air);
scenario('modern AA (fixed), SAM + 30 mm', { era: 'modern', kind: 'aa', air: [2500, 900, 200], T1: 12, T: 44 }, air);
console.log('\n-- artillery: target stands 14 s in sight of a spotter, then drives off under smoke --');
for (const era of ['ww2', 'modern']) scenario(era + ' battery at 1200 m', { era, kind: 'art', d: 600, z: -600, T1: 14, T: 44, tk: 'aa', still: 1, spotter: 1, all: 1, fly: 30 },
  A => { H.ok(A.pre > 0, 'the mission began on the spotted target'); H.ok(!(A.mem + A.late > 0) || A.mL < 80, 'rounds after the smoke fall on the last spotted place (mean ' + f1(A.mL) + ' m)'); H.ok(!(A.mem + A.late > 0) || A.mL < A.mT, 'and not on the target'); });
console.log('\n-- attack planes: target hidden from the start for 70 s, then the smoke is left to fade; where the plane patrols --');
scenario('ww2 Stuka, bombs', { era: 'ww2', plane: 'stuka', patrol: 1, T1: 0, T: 200, keep: 70, len: 1, still: 1, park: 1 }, never);
scenario('ww2 P-47, rockets and guns', { era: 'ww2', plane: 'p47', wi: 1, patrol: 1, T1: 0, T: 200, keep: 70, len: 1, still: 1, park: 1 }, never);
scenario('modern A-10, AGM-65', { era: 'modern', plane: 'a10', patrol: 1, T1: 0, T: 200, keep: 70, len: 1, still: 1, park: 1 }, never);
scenario('modern Su-25, rockets and guns', { era: 'modern', plane: 'su25', wi: 1, patrol: 1, T1: 0, T: 200, keep: 70, len: 1, still: 1, park: 1 }, never);
console.log('\n-- attack planes: target goes under smoke when the plane is close (m) --');
scenario('ww2 Stuka, bombs, at 1100 m', { era: 'ww2', plane: 'stuka', trig: 1100, T1: 1e9, T: 90, all: 1, fly: 12 }, blind);
scenario('ww2 P-47, rockets, at 2100 m', { era: 'ww2', plane: 'p47', wi: 1, trig: 2100, T1: 1e9, T: 90, all: 1, fly: 6 }, blind);
scenario('modern A-10, AGM-65, at 4000 m', { era: 'modern', plane: 'a10', trig: 4000, T1: 1e9, T: 90, all: 1, fly: 20 }, A => { blind(A); H.ok(A.launchHid === 0, 'no missile launched while hidden'); });
H.done();
