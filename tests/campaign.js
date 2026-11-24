'use strict';
/* Campaigns and the threat board (phase F4 of the General's design: D12 A, D14 A): up to N fronts by doctrine and by the free squads, a campaign's
   common H-hour (camp: open, attach with roles, the H-hour that waits for a front still forming, the end), the AI's own campaign of simultaneous
   assaults in an AI × AI match, the threat board (incidents at points, sites and in the air, triage with the low value ignored on purpose and
   the log saying why, responses with the quick reaction force first and one H-hour: one squad fixes, the others flank, fire and the air focus
   at H), two places defended at once, triage, dpol and qrf through the funnel, the incident that calms down, the view, the question threats and
   the guest's copy of the board. About three minutes */
const H = require('./harness'), ok = H.ok;
const at = (C, secs) => { const S = C.watch('ww2', { len: 0 }); C.run(secs, null, 1 / 30); return S; };
const ord = q => (q.cnP ? q.cnP.O : q.ord);   // the order a squad has, or the one the radio is bringing it (the command network)
const logs = (S, t, re) => (S.glog ? S.glog.l[t] : []).filter(e => re.test(e.s));

console.log('-- the fronts: up to N by doctrine, and for the AI by its free squads --');
{
  const C = H.load({ seed: 9, eco: 1, mapv: 4 }), $ = C.$, S = at(C, 120), Cm = S.cmd[1], CAMP = $('CAMP');
  const n = ['cautious', 'balanced', 'aggressive'].map(k => { Cm.dk = k; return $('campN')(Cm); }); Cm.dk = undefined;
  ok(n.join() === '3,4,5' && $('campN')(Cm) === 4, 'fronts by doctrine (D12 A): cautious 3, balanced 4, aggressive 5; 4 by default');
  ok(!('atk' in $('GENC')), 'the fixed limit of three assaults (GENC.atk) is gone');
  const sq = S.squads.filter(q => q.team === 1 && q.live > 0 && !q.state && !q.net), FREE = $('FREE');
  const free = sq.filter(q => !q.op && FREE[q.job] && q.live >= 3 && !q.lift && !q.ord.b && !q.ord.T && q.ord.k !== 'supply' && q.ord.k !== 'build').length, on = Cm.ops.filter(o => o.k === 'atk' && !o.over).length;
  ok($('campRoom')(Cm, sq) === Math.max(1, Math.min(4, on + Math.ceil(free / CAMP.sq))), 'the AI\'s room: ' + $('campRoom')(Cm, sq) + ' fronts (' + on + ' assaults on, ' + free + ' free squads)');
  ok($('campRoom')(Cm, []) === Math.max(1, Math.min(4, on)), 'with no free squad, no more fronts than it has');
  for (const op of Cm.ops.slice()) if (op.k === 'atk') $('opEnd')(Cm, op);
  Cm.ops = Cm.ops.filter(o => !o.over);
  const fake = [0, 1, 2, 3].map(i => ({ k: 'atk', over: false, ri: 90 + i, id: 900 + i, sq: [] }));
  const p = $('cqTargets')(1)[0], pi = S.cq.p.indexOf(p);
  Cm.ops.push(...fake);
  const A = $('gAtkPlan')(1, { pi });
  Cm.dk = 'aggressive'; const A2 = $('gAtkPlan')(1, { pi }); Cm.dk = undefined;
  Cm.ops = Cm.ops.filter(o => !fake.includes(o));
  ok(A.why === 'max' && A2.why !== 'max', 'a person\'s assault: refused max at the side\'s 4 fronts, allowed with the aggressive doctrine\'s 5 (' + (A2.why || 'accepted') + ')');
}

console.log('-- camp: one H-hour for every operation in it --');
{
  const C = H.load({ seed: 9, eco: 1, mapv: 4 }), $ = C.$, S = at(C, 120), t = 1, Cm = S.cmd[t], CAMP = $('CAMP'), cmd = (c, by, R) => $('genCmd')(t, c, by || 'ai', R);
  for (const op of Cm.ops.slice()) if (op.k === 'atk') $('opEnd')(Cm, op);
  Cm.ops = Cm.ops.filter(o => !o.over);
  const r = cmd({ c: 'camp', H: 120, why: 'teste' }), K = (Cm.camp || []).find(K => K.id === r.id);
  ok(r.ok && K && K.H === S.t + 120 && K.st === 'form' && logs(S, t, /Campanha aberta: hora H em 120 s \(teste\)/).length === 1, 'camp opens a campaign: its id, H-hour in 120 s, the log');
  ok(cmd({ c: 'camp', H: 120 }, 'me').why === 'ctl', 'a person without the chair: refused ctl');
  const P = $('cqTargets')(1).filter((p, i, l) => l.findIndex(o => o.ri === p.ri) === i), sq = S.squads.filter(q => q.team === t && q.live >= 3 && !q.state && !q.op);
  ok(P.length >= 2 && sq.length >= 4, 'two targets on two roads (' + P.length + ') and four squads (' + sq.length + ')');
  const open = (p, qs) => cmd({ c: 'atk', pi: S.cq.p.indexOf(p), sd: 1, ids: qs.map(q => q.id) }, 'ai', { P: $('cqObj')(p), sd: 1, pool: qs, walk: false, own: 20, foe: 10 });
  const a1 = open(P[0], sq.slice(0, 2)), a2 = open(P[1], sq.slice(2, 4)), o1 = Cm.ops.find(o => o.id === a1.id), o2 = Cm.ops.find(o => o.id === a2.id);
  const j1 = cmd({ c: 'camp', id: K.id, op: a1.id }), j2 = cmd({ c: 'camp', id: K.id, op: a2.id });
  ok(j1.ok && j2.ok && o1.cr === 'main' && o2.cr === 'sec' && o1.cp === K && o2.cp === K && o1.Hu === K.H && o2.Hu === K.H, 'two assaults attached: the first the main effort, the next a secondary front, both with the campaign\'s H-hour');
  ok(cmd({ c: 'camp', id: K.id, op: a2.id, role: 'main' }).why === 'busy' && cmd({ c: 'camp', id: K.id, op: a2.id, role: 'fnt' }).why === 'kind' && cmd({ c: 'camp', id: K.id, op: a2.id, role: 'zz' }).why === 'kind'
    && cmd({ c: 'camp', id: K.id, op: 99999 }).why === 'id' && cmd({ c: 'camp', id: 99999, op: a1.id }).why === 'id', 'refused: a second main effort (busy), a feint\'s role for an assault and an unknown role (kind), unknown ids (id)');
  const K2 = cmd({ c: 'camp' }), K3 = cmd({ c: 'camp' });
  ok(K2.ok && K3.why === 'max' && cmd({ c: 'camp', id: K2.id, op: a1.id }).why === 'busy', 'at most ' + CAMP.max + ' campaigns (max); an operation of one is not attached to another (busy)');
  cmd({ c: 'camp', id: K2.id, k: 'end' });
  const fnt = { k: 'fnt', man: 1, id: 98765, over: false, sq: [], veh: [], main: null };
  Cm.ops.push(fnt); const jf = cmd({ c: 'camp', id: K.id, op: fnt.id }); Cm.ops = Cm.ops.filter(o => o !== fnt);
  ok(jf.ok && fnt.cr === 'fnt' && fnt.main === o1, 'a feint attached: its fire is timed on the campaign\'s main assault');
  fnt.over = true; $('campTick')(Cm);
  o2.st = 'screen'; o2.H = S.t + 5; $('campSync')(K, o2);
  ok(o2.H === K.H, 'a front already waiting for its own H-hour takes the campaign\'s');
  o1.st = 'form'; K.H = K.H0 = S.t + 2; o2.H = K.H;
  for (let n = 0; n < 20 && (K.sl || 0) < CAMP.slip / CAMP.step; n++) { S.t = K.H - 2; $('campTick')(Cm); }   // the clock moved on by hand: nothing else runs here
  ok(K.st === 'form' && Math.abs(K.H - K.H0 - CAMP.slip) < 1e-6 && o2.H === K.H && o1.Hu === K.H && logs(S, t, /Hora H da campanha adiada/).length >= 1, 'a front still forming at H: the H-hour moves back ' + CAMP.step + ' s at a time, ' + Math.round(K.H - K.H0) + ' s in all (at most ' + CAMP.slip + '), every front with it');
  S.t = K.H; $('campTick')(Cm);
  ok(K.st === 'go' && logs(S, t, /HORA H DA CAMPANHA: 2 operações ao mesmo tempo/).length === 1, 'past the slip the campaign goes: HORA H DA CAMPANHA, two operations at once');
  /* a secondary front: half the preparation */
  Cm.known = []; Cm.fm = [];
  for (const o of [o1, o2]) { o.st = 'prep'; o.walk = false; o.n0 = 1; o.fntD = 1; $('OPS').atk(Cm, o); }   // fntD: a fix and flank's feint (M3) already fired, its rounds are no preparation
  const he = o => Cm.fm.filter(M => M.op === o && M.k === 'he').reduce((a, M) => a + M.n, 0), D = Cm.doc;
  ok(he(o1) === D.prep && he(o2) === Math.ceil(D.prep / 2), 'the preparation: ' + he(o1) + ' rounds on the main effort, ' + he(o2) + ' on the secondary front');
  const e = cmd({ c: 'camp', id: K.id, k: 'end' });
  ok(e.ok && K.over && !o1.cp && !o2.cp && !Cm.camp.length && logs(S, t, /Campanha encerrada/).length >= 1, 'camp end: the campaign is over, its operations go on alone');
}

console.log('-- the AI\'s campaign: two fronts with the force for it in one turn, one H-hour --');
{
  const C = H.load({ seed: 9, eco: 1, mapv: 4 }), $ = C.$, S = at(C, 120), t = 1, Cm = S.cmd[t], CAMP = $('CAMP'), R = S.T.routes;
  for (const op of Cm.ops.slice()) if (op.k === 'atk') $('opEnd')(Cm, op);
  Cm.ops = Cm.ops.filter(o => !o.over); Cm.camp = []; Cm.atkT = 0; Cm.pref = Cm.gue = null; Cm.known = [];   // what it knows of the enemy: only what is put below
  const P = $('cqTargets')(t).filter((p, i, l) => l.findIndex(o => o.ri === p.ri) === i).slice(0, 2), free = S.squads.filter(q => q.team === t && q.live >= 3 && !q.state && !q.op && !q.net && !q.lift).slice(0, 6);
  ok(P.length === 2 && free.length === 6, 'two enemy points on two roads and six squads to put in front of them');
  P.forEach((p, k) => {   // three squads 600 m short of each, on its road, and one enemy known there (an assault, not a walk into an empty point)
    const O = $('cqObj')(p), s = O.s >= 700 ? O.s - 600 : O.s + 600;
    const at = $('routeAt')(R[O.ri], s);   // the men there too: an assault takes squads within AP.pool m of an assembly (M2)
    for (const q of free.slice(k * 3, k * 3 + 3)) { q.job = 'held'; q.jk = 0; q.ri = O.ri; q.s = s; q.ord = { k: 'hold', ri: O.ri, s }; q.back = null; for (const m of q.men) { m.x = at.x + (m.x % 7); m.z = at.z + (m.z % 7); } }
    Cm.post[O.ri] = 'atk'; Cm.known.push({ man: 1, dead: false, sx: p.x, sz: p.z, x: p.x, z: p.z, moveT: -99 });
  });
  const sqs = () => S.squads.filter(q => q.team === t && q.live > 0 && !q.state && !q.net);
  $('cmdAttack')(Cm, sqs()); const nap = Cm.ev.filter(e => e.why === 'ap').length;
  ok(Cm.gate === 'ap' && !(Cm.camp || []).length && nap >= 2, 'first the approaches of its ' + nap + ' fronts are asked for (M2), nothing opened yet');
  for (let i = 0; i < 4 && Cm.gate === 'ap'; i++) { $('aiDrain')($('apWork')(Cm)); $('cmdAttack')(Cm, sqs()); }   // AP.per plans a plan of the commander
  const K = (Cm.camp || [])[0], A = K ? K.ops.filter(o => o.k === 'atk') : [], main = A.filter(o => o.cr === 'main');
  ok(K && K.by === 'ai' && A.length >= 2, 'then the AI opens a campaign of ' + A.length + ' assaults in one turn (' + Cm.ev.map(e => e.nm + ' ' + e.why).join(', ') + ')');
  if (K) {
    ok(main.length === 1 && A.every(o => o.cr === 'main' || o.cr === 'sec') && new Set(A.map(o => o.ri)).size === A.length && A.every(o => o.Hu === K.H) && K.H - S.t >= CAMP.H[0] && K.H - S.t <= CAMP.H[1],
      'on different roads, one main effort, the same H-hour (in ' + Math.round(K.H - S.t) + ' s)');
    ok(A.every(o => o === main[0] || o.sq.length <= CAMP.sec) && main[0].sq.length >= Math.max(...A.map(o => o.sq.length)), 'the main effort has the most squads (' + A.map(o => o.cr + ' ' + o.sq.length).join(', ') + ')');
    ok(logs(S, t, /^Campanha: \d frentes ao mesmo tempo, hora H em \d+ s — esforço principal em .+secundárias em /).length === 1, 'the log: the fronts, the H-hour, the main effort and the secondary ones');
    ok(S.gj ? S.gj.filter(j => j.c.c === 'camp' && j.by === 'ai' && j.ok).length === A.length + 1 : true, 'through the funnel: camp opened and each assault attached');
    let err = null; try { C.run(CAMP.H[1] + CAMP.slip + 30, () => (K.st === 'form' && !K.over ? undefined : false), 1 / 30); } catch (e) { err = e; }
    ok(!err && (K.st === 'go' || K.over), 'and it runs on to its H-hour (' + K.st + (K.over ? ', over' : '') + ')' + (err ? ' ' + err.stack : ''));
  }
}

console.log('-- the threat board: incidents, triage, the response --');
{
  const C = H.load({ seed: 9, eco: 1, mapv: 4 }), $ = C.$, S = at(C, 120), t = 1, Cm = S.cmd[t], THB = $('THB'), cmd = (c, by) => $('genCmd')(t, c, by || 'ai');
  const P = S.cq.p, foeAt = (x, z, n) => { for (let i = 0; i < n; i++) Cm.known.push({ man: 1, dead: false, sx: x + i, sz: z, x: x + i, z, moveT: -99 }); };
  const tick = () => $('thbTick')(Cm), keep = [];   // the known enemy is put back before every look: the plan is not run here
  const look = () => { Cm.known = keep.slice(); tick(); };
  for (const op of Cm.ops.slice()) if (op.k === 'qrf' || op.k === 'atk' || op.k === 'usr') $('opEnd')(Cm, op);   // its own assaults and unit orders too: by 120 s the base's reserve may be out on one (cf-manobra-fix)
  Cm.ops = Cm.ops.filter(o => !o.over); Cm.atkT = 1e9; Cm.thb = []; S.gj = [];
  const pi = P.findIndex(p => p.hold === t && p.base < 0 && !p.tw), p = P[pi], dx = S.base[0].x < p.x ? -1 : 1;
  for (const q of S.squads.filter(q => q.team === t && q.live >= 3 && !q.state && !q.op && !q.net && !q.lift && q.job !== 'base').slice(0, 1)) {   // a free squad 900 m behind it, as below: where the side's squads stand at 120 s is the match's
    q.job = 'road'; q.ord = { k: 'hold', ri: q.ri, s: q.s }; for (const m of q.men) { m.x = p.x - dx * 900 + (m.x % 7); m.z = p.z + (m.z % 7); }
  }
  const nf = Math.max(20, Math.ceil($('thbOwn')(t, p.x, p.z, THB.r) * 1.6));   // worth an answer whatever the match put there before (the urgency is foe over own)
  foeAt(p.x + dx * 150, p.z, nf); keep.push(...Cm.known.slice(-nf)); look();
  const I = Cm.thb.find(I => I.key === 'p' + pi);
  ok(I && I.k === 'pt' && I.foe === nf && I.val === THB.val.pt && Math.abs(I.kx - (p.x + dx * 150 + (nf - 1) / 2)) < 1, nf + ' known enemies by ' + p.L + ': an incident at a point, value ' + (I && I.val) + ', known strength ' + (I && I.foe) + ', urgency ' + (I && I.urg.toFixed(2)));
  const op = I && I.op;
  ok(I && I.st === 'resp' && op && op.k === 'qrf' && !op.over, 'triage answers it: a response operation (qrf)');
  if (op) {
    ok(op.sq.length >= 2 && op.sq.length <= THB.n[1] && op.sq.some(q => q.job === 'base') && op.sq[0].qr === 'fix' && op.sq.slice(1).every(q => q.qr === 'flk'), op.sq.length + ' squads, the base\'s reserve (the QRF) among them: ' + op.sq.map(q => q.job + ' ' + q.qr).join(', '));
    ok(ord(op.sq[0]).k === 'overwatch' && op.sq.slice(1).every(q => ord(q).k === 'hold') && op.H >= S.t + THB.H[0] && op.H <= S.t + THB.H[1], 'one fixes from the place, the others wait on a flank; H-hour in ' + Math.round(op.H - S.t) + ' s');
    ok(S.gj.some(j => j.c.c === 'qrf' && j.by === 'ai' && j.ok), 'the AI answered through the funnel (genCmd qrf in the journal)');
    ok(logs(S, t, /^Força de reação para .+: \d+ esquadras?.*hora H em \d+ s/).length >= 1, 'the log says who goes and when');
    const src = $('gFireSrc')(t, 'he', op.kx, op.kz); op.H = S.t; Cm.known = keep.slice();
    { const N = S.cn, was = N ? N.ctx : 0; if (N) N.ctx = t; try { $('OPS').qrf(Cm, op); } finally { if (N) N.ctx = was; } }   // as the plan runs it: in the side's command context (the radio)
    ok(op.st === 'hit' && op.sq.filter(q => q.qr === 'flk').every(q => ord(q).k === 'assault' && ord(q).rush) && Cm.thbF && Math.abs(Cm.thbF.x - op.kx) < 1, 'at H the flanks assault and the air focus goes on the enemy');
    ok(Cm.fm.some(M => M.op === op && !M.dead) === !!src, 'and the guns fire on it when one reaches it (' + (src ? 'fire mission' : 'no mortar or battery in range') + ')');
    const busy = Cm.ops.some(o => o.k === 'atk' && !o.over && ['go', 'fight', 'screen', 'prep'].includes(o.st)); $('cmdFires')(Cm);
    ok(busy || (Cm.focus && Math.abs(Cm.focus.x - op.kx) < 1), busy ? 'an assault of the side is under way: its air focus stays the assault\'s' : 'cmdFires takes the response as the air focus');
  }
  /* two places defended at once */
  const own = i => $('thbOwn')(t, P[i].x, P[i].z, THB.r), pj = P.map((q, i) => i).filter(i => i !== pi && P[i].hold === t && P[i].base < 0).sort((a, b) => own(a) - own(b))[0], p2 = P[pj], dy = S.base[0].x < p2.x ? -1 : 1;   // the least held
  for (const q of S.squads.filter(q => q.team === t && q.live >= 3 && !q.state && !q.op && !q.net && !q.lift && q.job !== 'base').slice(0, 2)) {   // two free squads 900 m behind it
    q.job = 'road'; q.ord = { k: 'hold', ri: q.ri, s: q.s }; for (const m of q.men) { m.x = p2.x - dy * 900 + (m.x % 7); m.z = p2.z + (m.z % 7); }
  }
  foeAt(p2.x + dy * 150, p2.z, 20); keep.push(...Cm.known.slice(-20)); look();
  const I2 = Cm.thb.find(I => I.key === 'p' + pj), qrf = Cm.ops.filter(o => o.k === 'qrf' && !o.over), sqs = qrf.flatMap(o => o.sq);
  ok(I2 && I2.op && qrf.length === 2 && new Set(sqs).size === sqs.length, 'a second point (' + p2.L + ') attacked at the same time: answered too, by other squads (' + qrf.map(o => o.sq.length).join(' + ') + ')' + (I2 && !I2.op ? ' — ' + I2.st + ': ' + I2.why : ''));
  /* a threat of little value is ignored on purpose */
  const pk = P.findIndex((q, i) => i !== pi && i !== pj && q.hold === t && q.base < 0);
  if (pk >= 0) {
    foeAt(P[pk].x, P[pk].z + 60, 3); keep.push(...Cm.known.slice(-3)); look();
    const I3 = Cm.thb.find(I => I.key === 'p' + pk);
    ok(I3 && I3.st === 'ign' && I3.sc < THB.ign && /guarda local basta|valor baixo/.test(I3.why) && logs(S, t, new RegExp('Ameaça ignorada de propósito: ' + P[pk].L)).length === 1,
      'three enemies by ' + P[pk].L + ' (score ' + (I3 && I3.sc.toFixed(1)) + '): ignored on purpose, and the log says why: ' + (I3 && I3.why));
    const tr = cmd({ c: 'triage', id: I3.id, p: 2 }); look();
    ok(tr.ok && I3.p === 2 && I3.st !== 'ign', 'triage p 2: it is no longer ignored (' + I3.st + (I3.why ? ': ' + I3.why : '') + ')');
    cmd({ c: 'triage', id: I3.id, p: 0 });
  }
  ok(cmd({ c: 'triage', id: 99999, p: 1 }).why === 'id' && cmd({ c: 'triage', id: I.id, p: 7 }).why === 'shape', 'triage refuses an unknown incident (id) and a priority outside -1..3 (shape)');
  /* the general's word: ignore, a policy */
  const was = op ? op.sq.slice() : [];
  cmd({ c: 'triage', id: I.id, p: -1 }); look();
  ok(I.st === 'ign' && I.why === 'ordem do general' && op.over && was.every(q => q.op !== op), 'triage p -1: the response ends, its squads go back, the incident stays ignored');
  ok(cmd({ c: 'dpol', pi: pj, qrf: 0 }).ok, 'dpol qrf 0 on the second point'); look();
  ok(I2.st === 'ign' && /política/.test(I2.why) && I2.op === null, 'so it is never answered: ' + I2.why);
  cmd({ c: 'triage', id: I.id, p: 0 }); cmd({ c: 'dpol', pi, inf: 1, qrf: 2 }); I.nT = 0; look();
  ok(I.op && !I.op.over && I.op.sq.length === 1, 'dpol inf 1, qrf 2: answered again, by one squad at most');
  ok(cmd({ c: 'dpol', pi: 999 }).why === 'at' && cmd({ c: 'dpol', pi, qrf: 3 }).why === 'shape' && cmd({ c: 'dpol', id: 1 }).why === 'id', 'dpol refuses an unknown point (at), a qrf outside 0..2 (shape), an unknown site (id)');
  const named = S.squads.find(q => q.team === t && q.live >= 3 && !q.op && !q.state && q.job === 'road'), I2b = I2;
  cmd({ c: 'dpol', pi: pj, qrf: 1 });
  const qn = named ? cmd({ c: 'qrf', id: I2b.id, ids: [named.id] }) : { ok: false };
  ok(!named || (qn.ok && I2b.op && I2b.op.sq.length === 1 && I2b.op.sq[0] === named), 'qrf with named squads: those answer (' + (named ? 'squad ' + named.id : 'none free') + ')');
  ok(cmd({ c: 'qrf', id: I.id }).why === 'busy' && cmd({ c: 'qrf', id: 99999 }).why === 'id', 'qrf refuses an incident already answered (busy) and an unknown one (id)');
  /* an economy site under fire, enemy aircraft over another */
  const e = S.eco.l.find(e => e.team === t && !e.dead && e.k === 'fab') || S.eco.l.find(e => e.team === t && !e.dead);
  S.ot[e.id] = S.t; look();
  const Is = Cm.thb.find(I => I.key === 's' + e.id);
  ok(Is && Is.k === 'site' && Is.val === $('ECO').site[e.k].val && Is.ex && Is.urg >= 1, 'a ' + e.name + ' hit: an incident of value ' + (Is && Is.val) + ' (ECO.site[k].val), ' + (Is && Is.st) + (Is && Is.why ? ': ' + Is.why : ''));
  const e2 = S.eco.l.find(o => o.team === t && !o.dead && o !== e) || e, pl = S.planes.find(o => o.team !== t && !o.dead);
  if (pl) {
    e2.gd.aa = 0; pl.x = e2.x + 100; pl.z = e2.z; pl.y = $('hgt')(pl.x, pl.z) + 300;
    const eyes = [...S.units, ...S.men].filter(o => !o.dead && o.team === t && $('dist')(o, pl) < $('SPOT').air);
    eyes.forEach(o => { o.dead = true; }); look(); eyes.forEach(o => { o.dead = false; });
    ok(!Cm.thb.some(I => I.key === 'a' + e2.id), 'an enemy aircraft over the site that none of the side\'s own units sees: no air incident (the fog)');
    const seer = S.men.find(o => !o.dead && !o.in && o.team === t) || S.units.find(o => !o.dead && o.team === t);
    seer.x = e2.x; seer.z = e2.z + 40; seer.y = $('hgt')(seer.x, seer.z); look();
    const Ia = Cm.thb.find(I => I.key === 'a' + e2.id);
    ok(Ia && Ia.k === 'air' && (Ia.st === 'ign' || e2.gd.aa === 1), 'an enemy aircraft over the ' + e2.name.toLowerCase() + ': an air incident; ' + (Ia ? Ia.st === 'ign' ? 'ignored: ' + Ia.why : 'the site asks for its fixed AA (' + Ia.why + ')' : ''));
    if (Ia && Ia.st === 'ign') { cmd({ c: 'triage', id: Ia.id, p: 3 }); look(); ok(e2.gd.aa === 1, 'with priority 3: the site asks for its fixed AA'); }
  }
  /* the view, the question */
  const V = $('genVM')(t, false), q = $('genQuery')(t, { q: 'threats' }), w = $('genPick')(V);
  ok(V.thb.length > 0 && V.thb.every((r, i) => !i || r.sc <= V.thb[i - 1].sc) && V.ops.some(o => o.k === 'qrf' && o.to), 'the view: the incidents by score, the responses among the operations');
  ok(q.ok && q.fronts === 4 && q.l.length === V.thb.length && Array.isArray(q.camp) && q.pol['p' + pi].inf === 1, 'the question threats: the board, the campaigns, the fronts and the policies');
  ok(w.thb.length <= 6 && JSON.stringify(w).length < 8192, 'the gen message carries its first ' + w.thb.length + ' rows (' + JSON.stringify(w).length + ' B)');
  const Cc = H.load({ seed: 5, mapv: 4 }); Cc.newState('ww2', null, { net: true, watch: 1, spec: 1 }); Cc.$('Net').gen = true;
  Cc.$('Net').rx.gen(JSON.parse(JSON.stringify({ t: 'gen', s: t, T: S.t, v: w, q: $('gsqOf')(t) })));
  const Vc = Cc.genVM(t, false);
  ok(Vc.thb.length === w.thb.length && Vc.thb[0].nm === w.thb[0].nm && Array.isArray(Vc.camp), 'a guest builds the same board from the message');
  /* calm */
  keep.length = 0; Cm.known = []; S.ot[e.id] = -99; for (const o of S.planes) if (o.team !== t) o.x = o.z = -1e5; for (const J of Cm.thb) J.quiet = S.t - THB.calm - 1;
  const answering = Cm.ops.filter(o => o.k === 'qrf' && !o.over), sq0 = answering.flatMap(o => o.sq), mine = ['p' + pi, 'p' + pj, 'p' + pk, 's' + e.id, 'a' + e2.id]; tick();
  ok(!Cm.thb.some(J => mine.includes(J.key)) && !Cm.ops.some(o => o.k === 'qrf' && !o.over) && answering.every(o => o.over) && sq0.every(q => !q.op || q.op.k !== 'qrf'), 'no enemy known for ' + THB.calm + ' s: every incident is over and the responders go back to their posts');
}

console.log('-- a battle with the board and the campaigns: no error, nothing not finite --');
for (const era of ['ww2', 'modern']) {
  const C = H.load({ seed: 3, eco: 1, mapv: 4 }), $ = C.$, S = C.watch(era, { len: 0 });
  const seen = { camp: 0, qrf: 0, inc: 0, ign: 0 }, ids = new Set();
  let err = null;
  try { C.run(+process.env.SECS || 300, () => { for (const Cm of S.cmd || []) { for (const K of Cm.camp || []) if (!ids.has('c' + K.id + Cm.t)) { ids.add('c' + K.id + Cm.t); seen.camp++; } for (const o of Cm.ops) if (o.k === 'qrf' && !ids.has('q' + o.id + Cm.t)) { ids.add('q' + o.id + Cm.t); seen.qrf++; } for (const I of Cm.thb || []) { if (!ids.has('i' + I.id + Cm.t)) { ids.add('i' + I.id + Cm.t); seen.inc++; } if (I.st === 'ign' && !ids.has('g' + I.id + Cm.t)) { ids.add('g' + I.id + Cm.t); seen.ign++; } } } }, 1 / 30); } catch (e) { err = e; }
  ok(!err && !H.nan(S), era + ': ' + Math.round(S.t) + ' s of an AI × AI match: ' + seen.inc + ' incidents (' + seen.ign + ' ignored on purpose), ' + seen.qrf + ' responses, ' + seen.camp + ' campaigns' + (err ? ' ' + err.stack : ''));
  ok(seen.inc > 0, era + ': the board saw the enemy at its places');
}
H.done();
