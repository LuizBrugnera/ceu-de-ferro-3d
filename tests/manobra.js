'use strict';
/* the tempo of the AI general's assaults and where its idle squads go (cf-general-manobra, MNV): an assault into an empty point does not
   form up, it goes; a point being consolidated holds no assault slot; the side's first aim is kept MNV.aim s (no back and forth) and a point it
   just lost goes up the list; the holders of a rear point no enemy can take become assault squads, and with no strength to attack
   (gsPull) one of two holders of a point goes to the forming-up place. A real modern AI × AI match on map 11, 40 s in, then each piece driven by hand (~1 min) */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 3, mapv: 11 }), $ = C.$;
$('AIB').now = () => 0;
const S = C.watch('modern', { n: 2 });
if (!$("typeof MNV !== 'undefined'")) { ok(false, 'no MNV on this page'); H.done(); process.exit(); }
const MNV = $('MNV'), CQ = S.cq, P = CQ.p, t = 0, Cc = S.cmd[t];
C.run(40, null, 1 / 20);
const lead = q => q.men.find(m => !m.dead);
const free = () => S.squads.filter(q => q.team === t && !q.net && q.live >= 3 && !q.op && !q.state && !q.lift && q.ord && !q.ord.T && !q.ord.tw && !q.ord.b);
const later = s => { S.t += s; };
const hide = () => { for (const g of S.men.concat(S.units)) if (g.team !== t) g.seenT = -1e9; Cc.known.length = 0; };

/* 1. a walk into an empty point: out of 'form' on the op's first turn, at the objective's assault order by H-hour (INC.op.h[0] s) */
{
  hide();
  const aim = $('cqAim')(Cc), p = aim[0], sq = free().slice(0, 2);
  ok(p && sq.length === 2, 'side 0 has an aim (' + (p && $('gName')(p)) + ') and two free squads');
  const op = $('atkOpen')(Cc, $('cqObj')(p), $('dsOf')(t, p.ri), sq, true, 6, 3);
  ok(op && op.walk && op.st === 'form', 'a walk (an occupation) is opened on it');
  $('OPS').atk(Cc, op);
  ok(op.st === 'prep' || op.st === 'screen', 'the first turn: it does not wait to form up (' + op.st + ')');
  for (let i = 0; i < 4 && op.st !== 'go'; i++) { later(4); $('OPS').atk(Cc, op); }
  ok(op.st === 'go' && op.sq.every(q => q.op !== op || q.ord.k === 'assault'), 'H-hour within seconds: every squad goes for the point (' + op.st + ', ' + op.sq.map(q => q.ord.k).join(', ') + ')');
  $('OPS').atk(Cc, op);
  ok(op.sq.every(q => !q.ow), 'and without bounds: no squad halts to cover another');
  $('opEnd')(Cc, op);
}

/* 2. a point being consolidated holds no assault slot */
{
  hide(); later(200); Cc.atkT = 0;
  C.__cr = $('campRoom'); $('campRoom = () => 1');
  for (const o of Cc.ops.slice()) if (o.k === 'atk' && !o.over) $('opEnd')(Cc, o);   // the AI's own assaults out of the way
  Cc.ops = Cc.ops.filter(o => !o.over);
  const p = $('cqAim')(Cc)[0], fake = { k: 'atk', st: 'cons', ri: (p.ri + 1) % S.T.routes.length, O: { x: 0, z: 0 }, sq: [], over: false, T0: S.t, walk: false };
  Cc.ops.push(fake);
  $('cmdAttack')(Cc, S.squads.filter(q => q.team === t && q.live > 0));
  const g1 = Cc.gate;
  MNV.on = 0; Cc.atkT = 0; for (const o of Cc.ops.slice()) if (o !== fake && o.k === 'atk' && !o.over) $('opEnd')(Cc, o);
  Cc.ops = Cc.ops.filter(o => !o.over);
  $('cmdAttack')(Cc, S.squads.filter(q => q.team === t && q.live > 0));
  const g0 = Cc.gate; MNV.on = 1;
  ok(g1 !== 'max' && g0 === 'max', 'one slot and an assault consolidating its point: a new assault may open (gate "' + g1 + '"; without MNV "' + g0 + '")');
  Cc.ops = Cc.ops.filter(o => o !== fake); for (const o of Cc.ops.slice()) if (o.k === 'atk') $('opEnd')(Cc, o);
  $('campRoom = globalThis.__cr');
}

/* 3. the first aim is kept MNV.aim s; a point just lost goes up */
{
  Cc.aimK = null; const L = $('cqAim')(Cc);
  if (ok(L.length >= 2, 'two points or more to aim at (' + L.length + ')')) {
    const b = L[1]; Cc.aimK = b; Cc.aimT = S.t;
    ok($('cqAim')(Cc)[0] === b, 'the aim it had a moment ago stays first though another now scores better');
    later(MNV.aim + 1);
    ok($('cqAim')(Cc)[0] === L[0], 'after MNV.aim s the better one is the aim');
    const last = L[L.length - 1], i0 = L.indexOf(last); (last.lostT || (last.lostT = {}))[t] = S.t; Cc.aimT = -1e9;
    const i1 = $('cqAim')(Cc).indexOf(last);
    ok(i1 < i0 || i0 === 0, 'a point the side lost a moment ago goes up the list (' + i0 + ' → ' + i1 + ')');
    Cc.aimK = L[0]; Cc.aimT = S.t; (L[1].lostT || (L[1].lostT = {}))[t] = S.t;
    ok($('cqAim')(Cc)[0] === L[1], 'and the aim held a moment ago gives way at once to a point just lost');
    L[1].lostT[t] = -1e9; last.lostT[t] = -1e9; Cc.aimK = null;
  }
}

/* 4. the holder of a rear point (all its links the side's, tied to its base, no enemy near) joins the assault squads */
{
  hide();
  const own = P.filter(p => p.hold === t && p.base < 0), p = own.find(p => p.links.every(i => P[i].hold === t)) || own[0];
  if (ok(!!p, 'side 0 holds a point other than its base')) {
    const saved = p.links.map(i => P[i].hold); for (const i of p.links) P[i].hold = t;   // its links are the side's
    const q = free()[0]; q.job = 'held'; q.jk = 0; $('setOrd')(q, { k: 'hold', ri: p.ri, s: p.s, x: p.x, z: p.z, tw: p, R: 0 });
    q.mnvQ = undefined;
    const sq = () => S.squads.filter(o => o.team === t && o.live > 0 && !o.net);
    $('mnvRear')(Cc, sq());
    ok(q.job === 'held', 'not at once: it must be quiet MNV.rear.calm s');
    later(MNV.rear.calm + 1); $('mnvRear')(Cc, sq());
    const tied = $('cqTied')(t).has(p.i);
    ok(!tied || (q.job === 'push' && !q.ord.tw), 'quiet ' + MNV.rear.calm + ' s at a rear point' + (tied ? '' : ' (not tied: stays)') + ': it is an assault squad now (' + q.job + ', ' + q.ord.k + ')');
    p.links.forEach((i, k) => { P[i].hold = saved[k]; });
    const q2 = free()[0]; q2.job = 'held'; $('setOrd')(q2, { k: 'hold', ri: p.ri, s: p.s, x: p.x, z: p.z, tw: p, R: 0 }); q2.mnvQ = undefined;
    for (const i of p.links) P[i].hold = 1 - t;   // the enemy at its door: a point it may take
    later(MNV.rear.calm + 1); $('mnvRear')(Cc, sq()); later(MNV.rear.calm + 1); $('mnvRear')(Cc, sq());
    ok(q2.job === 'held' && q2.ord.tw === p, 'a point linked to an enemy one keeps its holder');
    p.links.forEach((i, k) => { P[i].hold = saved[k]; });
  }
}

/* 5. no strength to attack (gsPull): a squad holding a point another squad holds with it may go to the forming-up place; a point's only holder stays */
{
  hide();
  const G = $('GSM').pull, j0 = G.jobs, m0 = G.max, r0 = G.r, all = S.squads.filter(o => o.team === t && o.live > 0 && !o.net), sq = () => all.filter(o => o.live > 0);
  const own = P.filter(p => p.hold === t && p.base < 0), p = own[0], c = free().slice(0, 2);
  if (ok(!!p && c.length === 2, 'a point of side 0 and two free squads to hold it')) {
    const keep = new Map(all.map(o => [o, o.job]));
    for (const o of all) if (o.job === 'held') o.job = 'heldx';   // only the two of this case may be taken
    G.jobs = ['held']; G.max = 99; G.r = 1e5;
    const hold = q => { q.job = 'held'; q.jk = 0; $('setOrd')(q, { k: 'hold', ri: p.ri, s: p.s, x: p.x, z: p.z, tw: p, R: 0 }); };
    hold(c[0]); c[1].job = 'heldx';
    Cc.gsPT = 0; $('gsPull')(Cc, sq());
    ok(c[0].job === 'held' && c[0].ord.tw === p, 'the only holder of ' + $('gName')(p) + ' is not taken');
    hold(c[1]); Cc.gsPT = 0; $('gsPull')(Cc, sq());
    const n = c.filter(q => q.job === 'push').length;
    ok(n === 1 && c.some(q => q.job === 'held' && q.ord.tw === p), 'with two holders one goes to the forming-up place and one stays (' + c.map(q => q.job).join(', ') + ')');
    MNV.on = 0; for (const q of c) hold(q); Cc.gsPT = 0; $('gsPull')(Cc, sq()); MNV.on = 1;
    ok(c.every(q => q.job === 'held'), 'without MNV a point\'s holders are never taken (as before)');
    G.jobs = j0; G.max = m0; G.r = r0; for (const [o, j] of keep) if (!c.includes(o)) o.job = j;
  }
}

/* 6. the match goes on with all of it: no NaN, no crash */
let err = null; try { C.run(60, null, 1 / 20); } catch (e) { err = e; }
ok(!err && !H.nan(S), 'a minute more of the match: no error, no NaN' + (err ? ' (' + String(err).slice(0, 120) + ')' : ''));
H.done();
