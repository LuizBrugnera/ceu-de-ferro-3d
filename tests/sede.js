'use strict';
/* The seat (cf-sede-ataque-defesa), the captain's bug "não estão atacando a sede dos outros e nem defendendo as suas", one focused check in an
   AI × AI match of 1944 (economy on, the map of today): side 0 knows where side 1's seat town is from the map (marked "Sede", as a person sees
   it) and identifies its factory with its own eyes (a tank in sight of it); with a point of its own within reach of it and free squads there it opens an assault on the seat (an atk
   operation, op.sede), and the diary says why. Side 1's own seat, with enemy squads put in it: the seat is an incident of the threat board,
   and the quick reaction force answers it. About a minute and a half. PAGE=<page> */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 5, eco: 1, mapv: 11 }), $ = C.$, S = C.watch('ww2', { len: 2, n: 2 });
const logs = (t, re) => (S.glog ? S.glog.l[t] : []).filter(e => re.test(e.s));
const put = (q, x, z) => { for (const m of q.men) { m.x = x + (m.x % 9); m.z = z + (m.z % 9); m.y = $('hgt')(m.x, m.z); } const p = $('railOf')(x, z); q.ri = p.ri; q.s = p.s; };
C.run(20, null, 1 / 30);
const w1 = $('aidSeat')(1), w0 = $('aidSeat')(0), C0 = S.cmd[0], C1 = S.cmd[1];
ok(!!w0 && !!w1, 'each side has its seat town');
ok(S.squads.some(q => q.team === 1 && q.job === 'sgar' && q.live > 0), 'side 1 holds its seat with a garrison (post sgar)');

console.log('-- the attack: the seat known from the map, its sites only by what side 0 saw --');
{
  const K0 = $('sedeKn')(C0, 1);
  ok(!!K0 && /mapa/.test(K0.how) && $('sedeFoeSites')(0, 1).length === 0, 'side 0 knows where side 1\'s seat is as a person does, from the map (' + (K0 && K0.how) + '), and none of its sites');
  const fab = S.eco.l.find(e => e.team === 1 && e.k === 'fab' && hdist(e, w1) < w1.ru + 60);
  let eye = null;
  for (let r = 250; r <= 350 && !eye; r += 50) for (let a = 0; a < 6.3 && !eye; a += .4) { const u = C.addVehicle('tank', 'pz4', 0, fab.x + Math.cos(a) * r, fab.z + Math.sin(a) * r, 0); u.inv = 1e9; if ($('sees')(u, fab)) eye = u; else u.dead = true; }
  C.run(4, null, 1 / 30);
  const K = $('sedeKn')(C0, 1), n = $('sedeFoeSites')(0, 1).length;
  ok(!!eye && n >= 1 && logs(0, /^Sede inimiga localizada: a cidade-sede inimiga/).length === 1, 'a tank sees its factory: ' + n + ' site(s) of the seat identified; the diary said where the seat is once');
  if (eye) eye.dead = true;
  /* side 0 up to it: the points within reach of the seat are its, and three free squads stand 2 km short of it */
  for (const p of S.cq.p) if (p.base < 0 && hdist(p, w1) < $('SEDE').reach) { p.hold = 0; p.c = 1; }
  const back = S.base[0], d = hdist(back, w1), ux = (back.x - w1.x) / d, uz = (back.z - w1.z) / d;
  const free = S.squads.filter(q => q.team === 0 && !q.net && q.live >= 3 && !q.state && !q.op && !q.lift && ['held', 'road', 'line'].includes(q.job)).slice(0, 4);
  free.forEach((q, i) => { put(q, w1.x + ux * 2000 - uz * (i - 1.5) * 60, w1.z + uz * 2000 + ux * (i - 1.5) * 60); q.job = 'held'; q.jk = 0; $('setOrd')(q, { k: 'hold', ri: q.ri, s: q.s }); });
  C0.dk = 'aggressive'; C0.atkT = 0; C0.sedeT = 0;
  for (const op of C0.ops) if (op.k === 'atk') $('opEnd')(C0, op);
  const mine = S.cq.p.filter(p => p.hold === 0 && p.base < 0 && hdist(p, w1) < $('SEDE').reach), keep = () => { for (const p of mine) { p.hold = 0; p.c = 1; } };   // side 1's men in them would take them back within the minute
  let op = null; C.run(60, () => { keep(); op = C0.ops.find(o => o.k === 'atk' && !o.over && o.sede === 1); return op ? false : undefined; }, 1 / 30);
  const L = logs(0, /^Assalto à cidade-sede inimiga .+ planejado: /), A = logs(0, /^Assalto à cidade-sede inimiga .+ ainda não: /);
  ok(!!op && L.length >= 1, 'side 0 opens an assault on the seat (' + (op ? op.st + ', ' + op.sq.length + ' squads' : 'none; ' + (A.length ? A[A.length - 1].s : C0.gate)) + ')');
  if (L.length) console.log('    ' + L[0].s);
  ok(!!C.genVM(0, false).sede.foe.find(s => s.t === 1 && s.how === K.how), 'the general\'s view shows the enemy seat it knows and how');
}

console.log('-- the defence: enemy squads in side 1\'s seat --');
{
  const d = hdist(S.base[0], w1), ux = (S.base[0].x - w1.x) / d, uz = (S.base[0].z - w1.z) / d;
  for (const op of C0.ops) if (op.k === 'atk') $('opEnd')(C0, op);
  const foe = S.squads.filter(q => q.team === 0 && !q.net && q.live >= 3 && !q.state).slice(0, 3);
  foe.forEach((q, i) => { put(q, w1.x + ux * 200 + i * 30, w1.z + uz * 200); q.job = 'held'; $('setOrd')(q, { k: 'hold', ri: q.ri, s: q.s }); q.op = null; });
  for (const op of C1.ops) if (op.k === 'qrf') $('opEnd')(C1, op);
  let I = null; C.run(45, () => { I = (C1.thb || []).find(I => !I.over && I.k === 'seat'); return I && I.op && !I.op.over ? false : undefined; }, 1 / 30);
  ok(!!I && I.val === $('THB').val.seat, 'side 1\'s board: the seat is an incident worth ' + (I && I.val) + ' (known enemy ' + (I && I.foe) + ', own ' + (I && I.own) + ', ' + (I && I.st) + (I && I.why ? ': ' + I.why : '') + ')');
  ok(!!I && !!I.op && I.op.k === 'qrf' && logs(1, /^Força de reação para a cidade-sede/).length >= 1, 'the quick reaction force answers it (' + (I && I.op ? I.op.sq.map(q => q.job).join(', ') : 'none') + ')');
  ok(!(C1.thb || []).some(J => !J.over && J.k === 'site' && hdist(J, w1) < w1.ru + 60), 'the sites in the seat are part of its incident, not incidents of their own');
}
ok(H.nan(S) === null, 'no NaN');
function hdist(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }
H.done();
