'use strict';
/* A side at its population budget still mans its assault post (issue #35). With the budget cut (S.popK) below what the side already has out,
   no new squad may enter, so before pushFrom the assault post stayed empty for good: the commander asked for squads it could never field
   ("Acumulando forças"), attacked nothing, lost nothing and stayed over its budget the whole match. Now a squad of a post it may spare
   (FIELD.spare) near it takes the assault post, and no new squad enters; with none near, a new squad still comes for it while the commander asks
   for force, never over the cap (IAI.cap). With room in the budget a missing post is still filled by a new squad */
const H = require('./harness'), ok = H.ok;

/* a 1944 watch match on today's map with the economy, past the opening deployment; the budget meter held still */
function match(seed) {
  const C = H.load({ seed, eco: true, mapv: 8 }), S = C.watch('ww2', {});
  C.run(20, null, .1);
  S.popT = 1e9;
  return { C, S, $: C.$ };
}
/* side t's live squads of a job, as the planner sees them */
const spareOf = $ => $('FIELD').spare || ['held', 'road', 'wood'];   // the page before pushFrom has no FIELD.spare
const of = (S, t, job) => S.squads.filter(q => q.team === t && q.live > 0 && !q.state && q.job === job);
/* the assault post emptied: its squads lost */
function emptyPush(S, t) { for (const q of of(S, t, 'push')) { for (const m of q.men) m.dead = true; q.live = 0; } }

console.log('-- at the budget: a spared post takes the assault post --');
{
  const { C, S, $ } = match(7), t = 1, FIELD = { spare: spareOf($) };
  emptyPush(S, t);
  S.popK = .3;   // the budget far under what is out
  $('CN').on = 0;   // orders at once, not by radio: the order the squad ends up with is the one setOrd gives it
  ok($('popUse')(t).men > $('popOf')(t).men, 'side ' + t + ' is over its budget: ' + $('popUse')(t).men + ' out of ' + $('popOf')(t).men);
  const spare = FIELD.spare.reduce((a, j) => a + of(S, t, j).length, 0), n0 = S.squads.length, tr0 = S.units.filter(u => u.team === t && u.cargo).length;
  ok(spare > 0, 'it has squads on posts it may spare: ' + spare);
  ok(of(S, t, 'push').length === 0, 'its assault post is empty');
  S.fld[t].next = 0; C.plan(t);
  const P = of(S, t, 'push');
  ok(P.length === 1, 'one squad took the assault post (' + P.length + ')');
  ok(S.squads.length === n0 && S.units.filter(u => u.team === t && u.cargo).length === tr0, 'no new squad entered, on foot or by truck');
  const O = P[0] && $('post')(t, 'push', P[0].jk);
  const Q = P[0] && P[0].ord;
  ok(Q && O && Q.ri === O.ri && Math.abs(Q.s - O.s) < 1, 'it is ordered to the assault post, not held where it stands (a squad that can get there)');
  ok(FIELD.spare.reduce((a, j) => a + of(S, t, j).length, 0) === spare - 1, 'it came off a spared post');
  ok(S.glog.l[t].some(e => /Sem população para reforçar/.test(e.s)), 'the general\'s log says why');
  S.fld[t].next = 0; C.plan(t);
  ok(of(S, t, 'push').length >= 1 && S.squads.length === n0, 'the next turn still no new squad enters');
}

console.log('-- at the budget with no spared squad near: a new one still comes for the assault, never over the cap --');
for (const capped of [false, true]) {
  const { C, S, $ } = match(7), t = 1;
  emptyPush(S, t);
  S.popK = .3; $('FIELD').spareR = 0;   // over the budget, and no spared squad near enough to walk to the assault post
  C.$('cmdAttack = C => { C.want = { ri: 0, n: 3 }; C.gate = ""; }');   // the commander asks for force, as a side short of it does
  if (capped) $('IAI').cap = S.men.length;   // the cap is reached: nothing more may enter at all
  const n0 = S.squads.length, tr0 = S.units.filter(u => u.team === t && u.cargo).length;
  S.fld[t].next = 0; C.plan(t);
  const came = S.squads.length - n0 + S.units.filter(u => u.team === t && u.cargo).length - tr0;
  if (!capped) {
    ok(came === 1, 'one new squad comes for the assault post, on foot or by truck (' + came + ')');
    ok(S.glog.l[t].some(e => /sem esquadra livre por perto/.test(e.s)), 'the general\'s log says why');
  } else ok(came === 0, 'at the cap (IAI.cap) none comes (' + came + ')');
}

console.log('-- with room: a new squad, as before --');
{
  const { C, S, $ } = match(7), t = 1;
  emptyPush(S, t);
  S.popK = 1; $('GP').pop.men = 1000; $('IAI').cap = 2000;   // room for more
  const sp = spareOf($).reduce((a, j) => a + of(S, t, j).length, 0), n0 = S.squads.length, tr0 = S.units.filter(u => u.team === t && u.cargo).length;
  S.fld[t].next = 0; C.plan(t);
  const grew = S.squads.length > n0 || S.units.filter(u => u.team === t && u.cargo).length > tr0;
  ok(grew, 'a post is filled by a new squad');
  ok(spareOf($).reduce((a, j) => a + of(S, t, j).length, 0) === sp, 'no spared post gave its squad');
}
H.done();
