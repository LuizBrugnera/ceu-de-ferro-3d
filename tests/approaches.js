'use strict';
/* The approaches (M2 of the general's manoeuvre): the cheapest tactical way to each side of an objective on the side's tactical map (top 3, at least
   60 degrees apart), honest (only what the side knows), water and fallen bridges; the AI's assault freed from the axis (squads of any road within reach,
   quiet posts lending theirs and getting them back), its assemblies out of the enemy's sight, the ways in and the assault along each approach; the
   question gask ap; the search's cost; an AI × AI match with them. SECS (default 180): the length of that match (0 skips it). About three minutes */
const H = require('./harness'), ok = H.ok, { performance } = require('perf_hooks');
const SECS = process.env.SECS === undefined ? 180 : +process.env.SECS;
const nm = ($, p) => $('gName')(p), ord = q => (q.cnP ? q.cnP.O : q.ord);   // the order a squad has, or the one the radio is bringing it
/* the 1944 map, side 0 holding Travessia, both maps refreshed: what the side knows is the points the enemy holds */
function setup(o) {
  const C = H.load(Object.assign({ seed: 9, eco: 1, mapv: 6 }, o)), $ = C.$; C.$('globalThis').performance = performance;
  const S = C.watch('ww2', { len: 0 }), find = re => S.cq.p.find(p => re.test(nm($, p)));
  const tg = find(/Moinho/), st = find(/Travessia/); st.hold = 0;
  $('run')(1);
  const Cm = $('cmdOf')(0); $('cmdSense')(Cm, []); $('cmdSense')($('cmdOf')(1), []); $('tmNow')(0); $('tmNow')(1);
  return { C, $, S, tg, st, Cm, P: $('cqObj')(tg) };
}
const angOff = (a, b) => { let d = Math.abs(a - b); if (d > Math.PI) d = 2 * Math.PI - d; return d * 180 / Math.PI; };

console.log('-- the approaches to Vila do Moinho from Travessia (1944) --');
{
  const { $, S, Cm, P, st, tg } = setup(), AP = $('AP'), APB = $('APB');
  ok(AP.on === 1 && AP.n === 3 && AP.apart === 60 && AP.r.join() === '300,500' && AP.sec === 8 && AP.ttl === 20, 'the table: 3 approaches, 60° apart, a ring of 300 to 500 m in 8 sectors, kept 20 s');
  const pl = $('apNow')(Cm, P, -1), A = pl.A, ax = A.reduce((b, a) => (a.ang < b.ang ? a : b), A[0]);
  ok(pl && pl.st.nm === nm($, st) && A.length === 3, 'three approaches, from ' + pl.st.nm + ': ' + A.map(a => a.ang + '° ' + (a.len / 1000).toFixed(2) + ' km ' + a.min + ' min, ' + a.exp + '% in sight, ' + a.axis + '% on the axis road').join(' · '));
  ok(A.every((a, i) => A.every((b, j) => i === j || angOff(a.br, b.br) >= 60)), '  each at least 60° from the others around the objective');
  ok(A.every((a, i) => !i || a.cost >= A[i - 1].cost) && A.every(a => a.cells[0] === pl.root && a.cells.every((c, i) => !i || pl.via[c] === a.cells[i - 1])), '  cheapest first, each a way of the search\'s tree from the start');
  ok(ax.ang < 35 && ax.axis > 50, '  one is the axis (' + ax.ang + '°, ' + ax.axis + '% on its road)');
  const fl = A.filter(a => a.ang >= 60 && a.len <= AP.long * ax.len);
  ok(fl.length >= 1, '  and one a flank: ' + fl.map(a => a.ang + '° off the axis, ' + (a.len / ax.len).toFixed(2) + '× its length, ' + a.axis + '% on the axis road').join('; '));
  ok(A.every(a => a.asm.v < .2) && A.every(a => { const d = Math.hypot(a.asm.x - tg.x, a.asm.z - tg.z); return d >= 590 && d <= 1210; }), '  every assembly out of the enemy\'s sight (v ' + A.map(a => a.asm.v.toFixed(2)).join(', ') + '), 600 to 1200 m from the objective');
  const f0 = $('apObj')(P, -1).f, fv = Cm.tm.v[$('apCell')(pl.Z, f0.x, f0.z)];
  ok(A.every(a => a.asm.v <= fv), '  never more in sight than the axis\' forming-up place of before (v ' + fv.toFixed(2) + ')');
  ok(A.every(a => { const d = Math.hypot(a.pos.x - tg.x, a.pos.z - tg.z); return d >= 300 - 142 && d <= 500 + 142; }), '  each assault position on the ring (' + A.map(a => Math.round(Math.hypot(a.pos.x - tg.x, a.pos.z - tg.z))).join(', ') + ' m)');
  ok($('apGet')(Cm, P, -1) === pl && $('apNow')(Cm, P, -1) === pl, 'kept: asked again, the same plan');
  S.t += AP.ttl; ok(!$('apGet')(Cm, P, -1), '  and gone after AP.ttl s');
  console.log('  cost: a search ' + APB.stat().avg + ' ms (the worst piece ' + APB.stat().piece + ' ms)');
}

console.log('-- honest: only what the side knows --');
{
  const { $, S, Cm, P } = setup(), sense = () => { $('cmdSense')(Cm, []); $('tmNow')(0); Cm.apc = null; return $('apNow')(Cm, P, -1); };
  const sig = pl => pl.A.map(a => a.cells.join('.') + ':' + a.cost.toFixed(3)).join('|');
  const a = sense(), ax = a.A.reduce((b, x) => (x.ang < b.ang ? x : b), a.A[0]), mid = ax.cells[Math.floor(ax.cells.length * .6)], p = $('apXZ')(a.Z, mid);
  const u = $('addMan')('rifleman', 1, p.x, p.z), b = sense();
  ok(!Cm.known.includes(u) && sig(a) === sig(b), 'an enemy soldier on the axis approach nobody has seen changes nothing');
  u.seenT = S.t; u.sx = p.x; u.sz = p.z; const c = sense(), cx = c.A.find(x => x.cells.includes(mid));
  ok(Cm.known.includes(u) && sig(c) !== sig(a) && (!cx || cx.cost > ax.cost), 'seen there, the way past him costs more or goes elsewhere (' + (cx ? Math.round(ax.cost) + ' → ' + Math.round(cx.cost) : 'no approach through his cell now') + ')');
  const D = $('cmdOf')(1); D.known = [u]; $('tmNow')(1); ok(sig(sense()) === sig(c), 'what the other side knows never reaches this side\'s plan');
}

console.log('-- water and bridges --');
{
  const { $, S, Cm, P, st } = setup(), Z = S.T.tms, pass = $('apPass')(Z), wet = Z.water.reduce((n, w, q) => n + (w > $('AP').wet && !pass[q] ? 1 : 0), 0);
  ok(wet > 0 && Z.water.every((w, q) => pass[q] || w > $('AP').wet || Math.abs(S.T.rx($('apXZ')(Z, q).z) - $('apXZ')(Z, q).x) < 150), 'water is no way (' + wet + ' cells, and the river\'s course), dry ground always is');
  const brs = $('brs()'), b = brs.reduce((x, y) => (Math.hypot(y.x - st.x, y.z - st.z) < Math.hypot(x.x - st.x, x.z - st.z) ? y : x)), qb = $('apCell')(Z, b.x, b.z);
  ok(pass[qb] === 1, 'a standing bridge crosses it (Travessia\'s)');
  const pl = $('apNow')(Cm, P, -1); $('hitObj')(b.o, 1e5, null); $('step')(1 / 60);
  const Z2 = $('tmStatic')(S.T), p2 = $('apPass')(Z2);
  ok(Z2 !== Z && p2[qb] === 0, 'the bridge falls: its cells are water again');
  ok(!$('apGet')(Cm, P, -1) && pl.Z === Z, '  and the plan made on the old ground is no longer used');
}

console.log('-- the assault freed from the axis, its assembly out of sight --');
/* side 0's own squads replaced by three free ones on another road 1.5 to 4.2 km from Vila do Moinho; no squad on the objective's road */
function field(o) {
  const E = setup(o), { $, S, Cm, tg } = E, R = S.T.routes;
  for (const q of S.squads.filter(q => q.team === 0)) for (const m of q.men) m.dead = true;
  S.squads = S.squads.filter(q => q.team !== 0); S.men = S.men.filter(m => !m.dead);
  let at = null;
  for (let ri = 0; ri < R.length && !at; ri++) if (ri !== tg.ri) for (let s = 0; s <= R[ri].len; s += 50) { const p = $('routeAt')(R[ri], s), d = Math.hypot(p.x - tg.x, p.z - tg.z); if (d > 1500 && d < 4200 && p.x < tg.x && $('hgt')(p.x, p.z) > S.T.WL + 2) { at = { ri, s, x: p.x, z: p.z }; break; } }
  const mk = (job, k, dx) => { const q = $('addSquad')(0, at.x + dx, at.z, at.ri, at.s); q.job = job; q.jk = k; $('setOrd')(q, { k: 'hold', ri: at.ri, s: at.s, x: at.x + dx, z: at.z, R: 9 }); q.live = q.men.length; return q; };
  Cm.atkT = 0; Cm.ops = Cm.ops.filter(op => op.k !== 'atk'); Cm.apc = null; Cm.apQ = [];
  return Object.assign(E, { at, mk, sq: () => S.squads.filter(q => q.team === 0 && q.live > 0 && !q.state) });
}
{
  const E = field(), { $, S, Cm, tg, at, mk, sq } = E;
  $('PR').on = 0;   // M2's own assault: with M3's procedures a strong point draws p12, whose recon walks to the assault positions (tests/procedures.js)
  const a = mk('road', 0, 0), b = mk('road', 1, 40), c3 = mk('road', 2, 80), ri0 = [a.ri, b.ri, c3.ri];
  $('cmdSense')(Cm, sq()); $('tmNow')(0);
  $('cmdAttack')(Cm, sq());
  const e = (Cm.ev || []).find(x => x.why === 'ap');
  ok(Cm.gate === 'ap' && e && Cm.apQ.length === 1 && !Cm.ops.some(op => op.k === 'atk'), 'cmdAttack finds ' + (e ? e.nm : '-') + ' within reach of three squads of road ' + (at.ri + 1) + ' (' + Math.round(Math.hypot(at.x - tg.x, at.z - tg.z)) + ' m) and asks for its approaches first');
  $('aiDrain')($('apWork')(Cm));
  ok(Cm.apQ.length === 0 && Cm.apc && Cm.apc.size === 1, '  the plan\'s next pieces make them (apWork)');
  $('cmdAttack')(Cm, sq());
  const op = Cm.ops.find(o => o.k === 'atk' && !o.over);
  ok(op && op.sq.includes(a) && op.sq.includes(b) && op.sq.includes(c3) && ri0.every(r => r !== op.ri), 'the next turn the assault goes, with the squads of road ' + (at.ri + 1) + ' against an objective of road ' + (op ? op.ri + 1 : '-'));
  if (op) {
    const pl = op.pl, v = c => Cm.tm.v[$('apCell')(pl.Z, c.x, c.z)], f = $('apObj')({ ri: op.ri, s: op.O.s, x: op.O.x, z: op.O.z }, op.sd).f;
    ok(op.sq.every(q => q.ord.k === 'hold' && q.ord.wp && q.ord.fast && q.ord.quiet && q.tp === q.ord.wp), '  each walks its own way in (quiet, at a run), not along the axis');
    ok(op.sq.every(q => v(q.fp) < .2 && v(q.fp) <= v(f)), '  to an assembly out of sight (v ' + op.sq.map(q => v(q.fp).toFixed(2)).join(', ') + '; the axis\' forming-up place ' + v(f).toFixed(2) + ')');
    const L = a.men.find(m => !m.dead), w = a.ord.wp;
    ok(Math.hypot(w[0].x - L.x, w[0].z - L.z) < 1 && Math.hypot(w[w.length - 1].x - a.fp.x, w[w.length - 1].z - a.fp.z) < 1, '  from where the squad stands to its place in the assembly (' + (w.len / 1000).toFixed(2) + ' km)');
    const far = Math.max(...op.sq.map(q => q.ord.wp.len)), CMD = $('CMD'), CQ = $('CQ');
    ok(op.formT === Math.min(CMD.formMax, Math.max(CQ.form, far / $('AP').pace + $('AP').slack)) && op.formT > CQ.form, '  the forming up waits for the farthest walk (' + (far / 1000).toFixed(2) + ' km): ' + Math.round(op.formT) + ' s, not ' + CQ.form);
    ok((op.ap.length === 2) === (a.ape !== b.ape), '  ' + (op.ap.length === 2 ? 'two elements, two approaches (' + op.ap.map(x => x.ang + '°').join(' and ') + ')' : 'one element, one approach (' + op.ap[0].ang + '°)'));
    /* H-hour: along the approach, through the assault position, into the objective */
    op.st = 'screen'; op.H = S.t; op.smk = false; $('OPS').atk(Cm, op);
    const O = op.O;
    const as = op.sq.filter(q => q.ord.k === 'assault'), ow = op.sq.filter(q => q.ord.k === 'overwatch');
    const cut = (() => { try { return $('ORG').on ? $('ORG').poly.cut : 1; } catch (e) { return 1; } })();
    const segNear = (p, c) => { let b = 1e9; for (let i = 1; i < p.length; i++) { const A = p[i - 1], B = p[i], dx = B.x - A.x, dz = B.z - A.z, L = dx * dx + dz * dz || 1, u = Math.max(0, Math.min(1, ((c.x - A.x) * dx + (c.z - A.z) * dz) / L)); b = Math.min(b, Math.hypot(A.x + u * dx - c.x, A.z + u * dz - c.z)); } return b; };
    ok(op.st === 'go' && as.length >= 2 && as.every(q => q.ord.wp && q.ord.wp === q.apw), 'H-hour: ' + as.length + ' squads assault, each along its approach' + (ow.length ? ', ' + ow.length + ' covers them' : ''));
    ok(as.every(q => { const p = q.ord.wp, e2 = p[p.length - 1], ap = op.ap[q.ape]; return Math.hypot(e2.x - O.x, e2.z - O.z) < 1 && segNear(p, ap.pos) <= cut; }), '  through its assault position (within ' + cut + ' m: the organic movement rounds the corners), into the objective');
    ok(ow.every(q => q.ord.wp === q.apv && Math.hypot(q.ord.x - op.ap[q.ape].pos.x, q.ord.z - op.ap[q.ape].pos.z) < 1), '  the cover fires from its element\'s assault position, gone there along the approach');
    console.log('    orders: ' + op.sq.map(q => q.ord.k + (q.ord.wp ? ' (way ' + (q.ord.wp.len / 1000).toFixed(2) + ' km)' : '')).join(', '));
    $('opEnd')(Cm, op);
  }
  /* with the approaches off: the same field, no assault (none of its road) */
  const F = field(), { $: $2, Cm: C2, mk: mk2, sq: sq2 } = F; $2('AP').on = 0; mk2('road', 0, 0); mk2('road', 1, 40); mk2('road', 2, 80);
  $2('cmdSense')(C2, sq2()); $2('cmdAttack')(C2, sq2());
  ok(!C2.ops.some(o => o.k === 'atk' && !o.over) && (C2.ev || []).some(x => x.why === 'pool'), 'AP.on 0, the same field: no assault (no squad of the objective\'s road: pool), as before');
}

console.log('-- economy of force: a quiet post lends its squad and gets it back --');
{
  const E = field(), { $, S, Cm, mk, sq } = E, AP = $('AP');
  const a = mk('road', 0, 0), l1 = mk('line', 0, 60), l2 = mk('line', 1, 120), l3 = mk('wood', 0, 160);
  $('cmdSense')(Cm, sq()); $('tmNow')(0); const kn = Cm.known.filter(o => Math.hypot(o.sx - l1.men[0].x, o.sz - l1.men[0].z) < AP.lend.r).length; Cm.known = [];   // nobody known near the posts
  if (kn) console.log('    (' + kn + ' enemies known near the posts left out)');
  ok(!$('apLend')(Cm, sq(), l1), 'a line post seen for the first time is not quiet yet');
  $('apQuiet')(Cm, sq()); l1.apK = l2.apK = l3.apK = S.t - AP.lend.calm - 1;
  ok($('apLend')(Cm, sq(), l1) && $('apLend')(Cm, sq(), l2), 'quiet for ' + AP.lend.calm + ' s with no enemy known within ' + AP.lend.r + ' m: either may lend');
  l2.op = l3.op = {}; ok(!$('apLend')(Cm, sq(), l1), '  but not the last post left on its road'); l2.op = l3.op = null;
  const pt = S.cq.p[1]; l1.ord.tw = pt; ok(!$('apLend')(Cm, sq(), l1), '  nor one holding a point nobody else holds (' + nm($, pt) + ')');
  l2.ord.tw = pt; ok($('apLend')(Cm, sq(), l1), '  with another squad in that point, it may'); delete l1.ord.tw; delete l2.ord.tw;
  const pool = $('apPool')(Cm, sq(), E.P, -1, E.P, 4);
  ok(pool[0] === a && pool.length === 1 + AP.lend.n && [l1, l2, l3].filter(q => !pool.includes(q)).length === 1, 'the pool: the free squad first, then the quiet posts, at most ' + AP.lend.n + ' (' + pool.map(q => q.job).join(', ') + ')');
  l3.op = {}; const p2 = $('apPool')(Cm, sq(), E.P, -1, E.P, 4); l3.op = null;
  ok(p2.length === 2 && p2[0] === a, '  one post on the road is kept: with the third busy, only one of the two lends (' + p2.map(q => q.job).join(', ') + ')');
  $('cmdAttack')(Cm, sq()); $('aiDrain')($('apWork')(Cm)); $('cmdAttack')(Cm, sq());
  const op = Cm.ops.find(o => o.k === 'atk' && !o.over), lent = op ? op.sq.filter(q => q.job === 'line' || q.job === 'wood') : [];
  ok(op && lent.length >= 1 && lent.length <= AP.lend.n, 'the assault takes ' + lent.length + ' squads lent by the quiet posts');
  ok(!!(S.glog && S.glog.l[0].some(e => /emprestada|emprestadas/.test(e.s))), '  and the log says so');
  if (op) {
    const q = lent[0], back = q.back; $('opEnd')(Cm, op);
    ok(back && back.k === 'hold' && !q.op && q.ord.k === 'hold' && q.ord.x === back.x && q.ord.z === back.z && (q.job === 'line' || q.job === 'wood'), 'the assault over, opFree sends it back to its ' + q.job + ' post (the order it had)');
  }
}

console.log('-- gask ap --');
{
  const { $, S, tg, st } = setup(), A = $('genAnswer'), Q = $('genQuery');
  const r = A(0, { q: 'ap', x: tg.x + 100, z: tg.z - 50 }), R = r.r;
  ok(r.ok && R.nm === nm($, tg) && R.x === Math.round(tg.x) && R.sd === -1 && R.st.nm === nm($, st) && R.a.length === 3, 'the point nearest x z (' + R.nm + '), from its own side, three approaches from ' + R.st.nm);
  ok(R.a.every(a => ['ang', 'len', 'min', 'exp', 'wood', 'axis', 'cost', 'pv', 'av'].every(k => Number.isFinite(a[k])) && a.pos.length === 2 && a.asm.length === 2 && a.pts.length >= 2 && a.pts.every(p => p.length === 2 && p.every(Number.isInteger))), '  each with its angle, length, minutes, exposure, wood, axis share, cost, assault position, assembly and way');
  ok(JSON.stringify(r).length < 15000, '  fits a gres (' + JSON.stringify(r).length + ' bytes)');
  ok(JSON.stringify(Q(0, { q: 'ap', x: tg.x, z: tg.z }).a) === JSON.stringify(R.a), 'the MCP\'s local question (genQuery) answers the same');
  const r1 = A(1, { q: 'ap', x: st.x, z: st.z });
  ok(r1.ok && r1.r.sd === 1 && r1.r.nm === nm($, st), 'side 1 asks about Travessia: its own plan, from its side');
  ok(!A(0, { q: 'ap', x: -500, z: 0 }).ok && A(0, { q: 'ap', x: -500, z: 0 }).why === 'map' && A(0, { q: 'ap' }).why === 'map', 'off the map or no place: refused (map)');
  const { C: C2 } = { C: H.load({ seed: 9, eco: 1, mapv: 6 }) }, S2 = C2.watch('ww2', { len: 0 }), p2 = S2.cq.p[6], r2 = C2.$('genAnswer')(0, { q: 'ap', x: p2.x, z: p2.z });
  ok(r2.ok && r2.r.none === 1, 'before the side\'s first map: answered, none 1');
}

console.log('-- an AI × AI match with the approaches --');
if (SECS > 0) {
  const C = H.load({ seed: 3, eco: 1, mapv: 6 }); C.$('globalThis').performance = performance;
  const S = C.watch('ww2', { len: 0 }), $ = C.$, seen = new Set(), APB = $('APB'), AIB = $('AIB'); let ap = 0, wp = 0, err = null, gen = 0, n = 0;
  try {
    C.run(SECS, () => {
      gen += AIB.gn[(AIB.i + AIB.win - 1) % AIB.win]; n++;
      for (const Cm of S.cmd) for (const op of Cm.ops) if (op.k === 'atk' && !seen.has(op)) { seen.add(op); if (op.pl) { ap++; if (op.sq.every(q => ord(q).wp || q.apw === null)) wp++; } }
    }, 1 / 30);
  } catch (e) { err = e; }
  ok(!err && !H.nan(S), 'the match runs ' + SECS + ' s with no error' + (err ? ': ' + err.message : ''));
  ok(ap >= 1 && wp === ap, 'the AI opens its assaults by the approaches (' + ap + ' of ' + seen.size + '), every squad with its way in (or waiting where it is, nearer than its assembly)');
  const st = APB.stat(); console.log('  cost: ' + st.searches + ' searches, ' + st.avg + ' ms each, the worst piece ' + st.piece + ' ms; the commanders ' + (gen / n).toFixed(3) + ' ms a frame (this machine)');
  ok(st.searches >= 1 && st.piece < 20, '  a search a piece at a time (the worst piece ' + st.piece + ' ms)');
}
H.done();
