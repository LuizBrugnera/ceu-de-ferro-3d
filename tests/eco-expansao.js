'use strict';
/* The expansion (cf-economia-expansao): every conquest point but the bases has a deposit of its own (ECO.pt), open to a mine only while its
   side holds the point and beyond the cap of mines; it yields only while the point is held and passes to whoever takes the point (one still
   being built is lost). Each point held adds to the income, more for each other point held. The AI general builds on the open deposits, and
   the general's view and map tell an open deposit from a closed one. Map version 6, both eras. */
const H = require('./harness'), ok = H.ok;

for (const era of ['modern', 'ww2']) {
  console.log('-- ' + era + ' --');
  const C = H.load({ seed: 41, eco: true, mapv: 6 }), $ = C.$, ECO = $('ECO'), S = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' }), E = S.eco;
  S.units = []; S.men = []; S.squads = [];   // nobody near the deposits: no 'foe' in the way
  const pts = S.cq.p.filter(p => p.base < 0), pd = E.dep.filter(q => q.pt >= 0);
  ok(pd.length === pts.length && pts.every(p => pd.filter(q => q.pt === p.i).length === 1), 'one deposit a point but the bases (' + pd.length + ' of ' + pts.length + ')');
  ok(pd.every(q => { const p = S.cq.p[q.pt], d = Math.hypot(q.x - p.x, q.z - p.z); return d >= ECO.pt.r - 1 && d <= ECO.pt.r + ECO.pt.nudge[1] + 1; }), 'each within ' + ECO.pt.r + '..' + (ECO.pt.r + ECO.pt.nudge[1]) + ' m of its point');
  ok(pd.every(q => q.rich === (S.cq.p[q.pt].tw ? 1 : 0)) && E.dep.every((q, i) => q.i === i), 'rich in a town; the index is the place in the list');
  /* open only to the side holding the point */
  const mine = pd.find(q => S.cq.p[q.pt].hold === 0), foe = pd.find(q => S.cq.p[q.pt].hold === 1), a = q => C.ecoFace(q.x, q.z);
  ok(!!mine && !!foe, 'side 0 holds a point with a deposit, side 1 another');
  ok(C.ecoWhy(1, 'mine', mine.x, mine.z, a(mine)) === 'pt' && C.ecoWhy(0, 'mine', foe.x, foe.z, a(foe)) === 'pt', 'a mine on the deposit of a point the side does not hold: pt');
  const w0 = C.ecoWhy(0, 'mine', mine.x, mine.z, a(mine)); ok(w0 === '', 'on its own point\'s deposit: no reason against (' + (w0 || 'ok') + ')');
  const v0 = C.ecoView(0); ok(v0.dep.filter(q => q.pt >= 0 && q.open).length === pts.filter(p => p.hold === 0).length && v0.dep.find(q => q.i === foe.i).open === false, 'the view: open where side 0 holds the point, closed elsewhere');
  const vm = C.ecoVM(0); ok(vm.dep.length === E.dep.length && vm.dep.some(d => d.pt >= 0 && d.open) && vm.dep.some(d => d.pt >= 0 && !d.open) && vm.dep.filter(d => d.pt < 0).every(d => d.open), 'the map\'s model carries pt and open');
  /* beyond the cap, and no front rule */
  ECO.site.mine.max = E.l.filter(e => e.team === 0 && e.k === 'mine' && !e.dead).length;
  ok(C.ecoWhy(0, 'mine', mine.x, mine.z, a(mine)) === '', 'the cap of mines full: the point\'s deposit is still open');
  ECO.site.mine.max = 4;
  /* build it, the AI's way, and it yields while held */
  const d0 = E.d[0]; d0.en = d0.mt = 1000; E.ctl[0] = 'me'; E.ctl[1] = 'me';
  const r = C.ecoCmd(0, { c: 'build', k: 'mine', x: mine.x, z: mine.z, a: a(mine) }, 'me'); ok(r.ok, 'ecoCmd builds a mine on it (' + JSON.stringify(r).slice(0, 80) + ')');
  const pm = E.l.find(e => e.team === 0 && e.k === 'mine' && !e.dead && e.dep === mine.i); ok(!!pm && C.$('ecoPt')(pm) === S.cq.p[mine.pt], 'the new mine stands on the point\'s deposit');
  C.run(90);
  ok(pm.prog === 1 && Math.abs(C.ecoOut(pm).mt - ECO.pt.out.mt * (mine.rich ? ECO.rich : 1)) < 1e-9 && C.ecoOut(pm).en > 0, 'built, it yields ' + Math.round(C.ecoOut(pm).en * 60) + ' energy and ' + Math.round(C.ecoOut(pm).mt * 60) + ' metal a minute');
  /* the income of the points */
  const n0 = pts.filter(p => p.hold === 0).length, pi = C.ecoPtInc(0), k = m => m * (1 + ECO.pt.g * Math.max(0, m - 1));
  ok(pi.n === n0 && Math.abs(pi.en - ECO.pt.en * k(n0)) < 1e-9 && Math.abs(pi.mt - ECO.pt.mt * k(n0)) < 1e-9, n0 + ' points held: +' + Math.round(pi.en * 60) + ' E +' + Math.round(pi.mt * 60) + ' M a minute');
  ok(k(n0 + 1) / (n0 + 1) > k(n0) / n0, 'each point is worth more the more points are held');
  const sites = E.l.filter(e => e.team === 0 && !e.dead && e.prog >= 1).reduce((s, e) => s + C.ecoOut(e).en * 60, 0);
  ok(Math.abs(d0.inc.en - (ECO.hq.en * 60 + pi.en * 60 + sites)) < 1e-6, 'the income adds them to the HQ and the sites (' + Math.round(d0.inc.en) + ' E a minute)');
  /* the point goes neutral: the mine stays and yields nothing; taken by side 1: the mine is side 1's */
  const p = S.cq.p[mine.pt];
  p.hold = -1; p.cap = -1; p.c = 0; C.cqFlip(p, 0);
  ok(pm.team === 0 && !pm.dead && C.ecoOut(pm).mt === 0, 'the point neutral: the mine stays side 0\'s and yields nothing');
  p.hold = 1; p.c = 1; C.cqFlip(p, -1);
  ok(pm.team === 1 && !pm.dead && C.ecoOut(pm).mt > 0 && C.$('ecoLive')(1, 'mine').includes(pm), 'the point taken by side 1: the mine is side 1\'s and yields for it');
  ok(!!E.d[0].kn[pm.id] && !E.d[1].kn[pm.id], 'side 0 knows where its lost mine is; side 1 holds no stale sighting of its own mine');
  /* one still being built is lost */
  const other = pd.find(q => q !== mine && S.cq.p[q.pt].hold === 0); d0.en = d0.mt = 1000;
  if (other) {
    C.ecoCmd(0, { c: 'build', k: 'mine', x: other.x, z: other.z, a: a(other) }, 'me'); C.run(2);
    const half = E.l.find(e => e.team === 0 && e.k === 'mine' && !e.dead && e.dep === other.i), q = S.cq.p[other.pt];
    ok(!!half && half.prog < 1, 'a second mine under way on another point (' + (half ? Math.round(half.prog * 100) : -1) + '%)');
    q.hold = 1; q.c = 1; C.cqFlip(q, 0);
    ok(half && half.dead && !E.d[0].q.some(o => o.site === half.id), 'its point taken before it was done: the mine is lost, and its order with it');
  }
  /* the AI general claims an open deposit */
  E.ctl[0] = 'ai'; d0.en = d0.mt = 1000;
  const open = C.ecoView(0).dep.filter(q => q.pt >= 0 && q.open && !q.own && !q.foe);
  const cmds = C.ecoAI(0, C.ecoView(0)), b = cmds.find(c => c.c === 'build' && c.k === 'mine' && open.some(q => Math.hypot(q.x - c.x, q.z - c.z) < 1));
  ok(open.length > 0 && !!b, 'the AI orders a mine on the deposit of a point it holds: "' + (b && b.why) + '"');
}
H.done();
