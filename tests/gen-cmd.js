'use strict';
/* The general's commands: with the mechanical AI as every controller the battle is the same as before the commands existed (same state, logs
   and random stream, in both eras), the commands resolved again from their JSON name the same objects (GEN.chk: S.gjx stays 0), the journal
   holds what the AI commanded, a person's orders (assault, move, free, fire, mark, assist) work and leave the AI alone where it must, the
   side's picture (genState) is plain JSON with its fog, and the section draws no random number.
   SECS: seconds of the identity runs (default 90). BEFORE: the page as it was before the commands (default .work/player/before.html; the
   comparison is skipped when the file is missing). ECO=1 runs the identity with the economy on, MAPV=3 with the road network (harness) */
const fs = require('fs'), path = require('path'), assert = require('assert');
const H = require('./harness'), ok = H.ok, SECS = +process.env.SECS || 90, ECO = process.env.ECO === '1';
const BEFORE = process.env.BEFORE ? path.resolve(process.env.BEFORE) : path.join(H.ROOT, '.work', 'player', 'before.html');
const print = (C, S) => {
  let sum = 0; for (const k of ['men', 'units', 'planes']) for (const o of S[k]) sum += o.x * 1.3 + o.z + (o.hp || 0);
  return [S.men.length, S.units.length, S.squads.length, sum.toFixed(6), S.cq ? S.cq.ps.map(v => v.toFixed(4)).join(',') : '-', C.$('Math').random().toFixed(12)].join(' ');
};
/* the commander's log, as text, and its operations: what a changed order or a reordered draw would show */
const trail = S => [0, 1].map(t => (S.glog ? S.glog.l[t] : []).map(e => e.k + '|' + e.t.toFixed(3) + '|' + e.s).join('\n')).join('\n##\n') + '\n' + [0, 1].map(t => (S.cmd ? S.cmd[t].ops.map(o => o.k + o.ri).join(',') : '')).join('/');
function battle(o) {
  const C = H.load({ seed: o.seed, page: o.page, eco: ECO });
  if (o.chk) C.$('GEN').chk = 1;
  const S = C.newState(o.era, C.$('ERAS')[o.era].sides[0].fighter, { cls: 'plane' });
  C.run(SECS);
  return { C, S, print: print(C, S), trail: trail(S) };
}

const RUNS = [['ww2', 41], ['modern', 7]], modern = {};
console.log('-- the battle is not changed (' + SECS + ' s' + (ECO ? ', economy on' : '') + ') --');
for (const [era, seed] of RUNS) {
  const A = battle({ era, seed, chk: true });
  console.log('   ' + era + ' ' + A.print);
  if (era === 'modern') modern.A = A;
  if (fs.existsSync(BEFORE)) { const B = battle({ era, seed, page: BEFORE }); ok(A.print === B.print, era + ': the battle is the same as before the commands'); ok(A.trail === B.trail, era + ': the commander\'s log and operations are the same'); }
  else console.log('  skip  no ' + BEFORE + ': the comparison with the page before the commands');
  ok(!A.S.gjx, era + ': every command resolved again from its JSON names what the AI applied (mismatches: ' + (A.S.gjx || 0) + (A.S.gjm ? ' ' + A.S.gjm.slice(0, 4) : '') + ')');
}

console.log('-- the journal --');
{
  const { C, S } = modern.A, GC = C.$('GC'), j = S.gj || [], kinds = {};
  for (const e of j) if (e.by === 'ai') kinds[e.c.c] = (kinds[e.c.c] || 0) + 1;
  console.log('   the last ' + j.length + ' of them: ' + JSON.stringify(kinds));
  ok(j.length > 0 && j.length <= C.$('GEN').jr, 'the journal holds ' + j.length + ' commands, at most GEN.jr');
  ok(j.every(e => typeof e.ok === 'boolean' && Object.hasOwn(GC, e.c.c) && (e.t === 0 || e.t === 1) && e.T >= 0), 'every entry has ok, a known name and a side');
  ok(Object.keys(kinds).length >= 2, 'the AI commanded at least two kinds (' + Object.keys(kinds).join(' ') + ')');
  ok(j.some(e => e.by === 'ai' && e.c.c === 'amb' && e.t === 0) || (S.glog && S.glog.l[0].some(e => e.k === 'amb')), 'side 0 armed an ambush through a command');
  ok(j.some(e => e.by === 'ai' && e.c.c === 'amb' && e.t === 1) || (S.glog && S.glog.l[1].some(e => e.k === 'amb')), 'side 1 armed an ambush through a command');
}

console.log('-- a person at the chair (solo, ww2, seed 41) --');
{
  const C = H.load({ seed: 41 }), $ = C.$, S = C.newState('ww2', $('ERAS').ww2.sides[0].fighter, { cls: 'plane' }), GC = $('GC'), cmd = C.genCmd, ctl = C.genCtl;
  C.run(60);
  const seen = [new Set(), new Set()], note = () => { for (const t of [0, 1]) for (const o of S.cmd[t].ops) seen[t].add(o); };
  ok(cmd(0, { c: 'move', x: 1000, z: 0, ids: [1] }, 'me').why === 'ctl', 'a person without the chair is told ctl');
  ok(cmd(0, { c: 'zz' }, 'ai').why === 'kind' && cmd(0, 5, 'me').why === 'shape', 'an unknown name is kind, a bare number shape');
  ctl(0, 'me', { eco: 1, atk: 0, def: 1, sup: 1 });
  ok(S.gctl && S.gctl[0].seat === 'me' && S.gctl[0].atk === 'me' && S.gctl[0].def === 'ai', 'the chair taken: seat me, attack mine, defence still the AI');
  ok(cmd(1, { c: 'move', x: 1000, z: 0, ids: [1] }, 'me').why === 'ctl', 'the other side is not his: ctl');
  ok(cmd(0, { c: 'atk', pi: 99 }, 'me').why === 'at', 'an assault on no point: at');
  const own = S.squads.filter(q => q.team === 0 && q.live >= 3 && !q.net && !q.state);
  for (const op of S.cmd[0].ops) if (op.k === 'atk') C.opEnd(S.cmd[0], op);
  let made = null, why = [];
  for (const p of C.cqTargets(0)) {
    const pi = S.cq.p.indexOf(p), ids = own.filter(q => q.ri === p.ri).slice(0, 3).map(q => q.id);
    const r = cmd(0, { c: 'atk', pi, H: 90, smk: 0, ids }, 'me'); why.push(r.why);
    if (r.ok) { made = S.cmd[0].ops.find(o => o.id === r.id); break; }
  }
  ok(!!made && made.by === 'me' && made.k === 'atk' && made.Hu > 0 && made.nosm === 1, 'an assault ordered by hand: a live atk op by me with H-hour and no smoke' + (made ? '' : ' (refused: ' + why + ')'));
  const t0 = S.t; note();
  C.run(30, () => { note(); });
  ok(![...seen[0]].some(o => o.by === 'ai' && o.k === 'atk' && o.T0 >= t0), 'side 0: no assault of the AI after the claim (attack is his)');
  const SQ = S.squads.filter(q => q.team === 0 && q.live >= 3 && !q.net && !q.state && !q.op && q.ri === (own[0] || { ri: 0 }).ri);
  const two = SQ.slice(0, 2), before = two.map(q => q.ord);
  const L = two[0] && two[0].men.find(m => !m.dead);
  if (L) {
    const x = L.x + 60, z = L.z + 20, r = cmd(0, { c: 'move', x, z, ids: two.map(q => q.id) }, 'me'), op = S.cmd[0].ops.find(o => o.id === r.id);
    ok(r.ok && !!op && op.k === 'usr' && two.every(q => q.op === op), 'move: two squads in a manual operation');
    ok(S.glog.l[0].some(e => e.k === 'ord' && e.s.includes('mover')), 'and the log says who ordered it');
    const f = cmd(0, { c: 'free', ids: two.map(q => q.id) }, 'me');
    ok(f.ok && two.every((q, i) => !q.op && (q.ord === before[i] || q.ord.k === before[i].k)), 'free: they are the AI\'s again, on the order they had');
  } else ok(false, 'no squad to move');
  let fx = null; for (const x of [150, S.W - 150, S.W / 2]) for (const z of [S.HW - 150, -(S.HW - 150), 0]) if (!fx && $('gMapOk')(x, z) && !$('gFireSrc')(0, 'he', x, z)) fx = { x, z };
  ok(!fx || cmd(0, { c: 'fire', k: 'he', x: fx.x, z: fx.z }, 'me').why === 'fire', 'fire with no mortar in range: fire');
  const mk = cmd(0, { c: 'mark', x: 4000, z: 0 }, 'me');
  ok(mk.ok && cmd(0, { c: 'doc', k: 'aggressive' }, 'me').ok && S.cmd[0].dk === 'aggressive', 'a mark and a doctrine are taken');
  C.run(4);
  const cue = S.cmd[0].cue || []; let six = false; for (let i = 1; i + 2 < cue.length; i += 3) if (cue[i + 2] === 6) six = true;
  ok(cue[0] === 14 || six, 'the mark reaches the pilots\' cue (code ' + cue[0] + ')');
  ok(!cmd(0, { c: 'atk', pi: 0, H: 90 }, 'ai').ok, 'the AI\'s own command is refused (ctl) while the attack is his');
  const held = L ? S.cmd[0].ops.find(o => o.id === cmd(0, { c: 'move', x: L.x + 40, z: L.z, ids: two.map(q => q.id) }, 'me').id) : null;
  ctl(0, 'ai'); ok(S.gctl[0].atk === 'ai' && S.gctl[0].seat === 'ai', 'the chair given back: the AI everywhere');
  ok((!held || (held.over && two.every(q => q.op !== held))) && !S.cmd[0].dk && !S.cmd[0].umark && !S.cmd[0].rally, 'and the person\'s manual operation, doctrine and mark with it');
  const t1 = S.t; seen[1].clear(); note(); C.run(120, () => { note(); });
  ok(S.gj.some(e => e.by === 'ai' && e.t === 1 && e.T >= t1) || [...seen[1]].some(o => o.by === 'ai' && o.T0 >= t0), 'side 1 went on commanding by itself (assault ops seen: ' + [...seen[1]].filter(o => o.k === 'atk').length + ', ' + S.gj.filter(e => e.by === 'ai' && e.t === 1 && e.T >= t1).length + ' commands in the journal)');
  ok(H.nan(S) === null, 'no bad numbers');
  /* the side's picture */
  ctl(0, 'me', { eco: 1, atk: 0, def: 1, sup: 1 });
  const s = C.genState(0);
  ok(JSON.stringify(JSON.parse(JSON.stringify(s))) === JSON.stringify(s), 'genState is plain JSON');
  ok(s.sq.length > 0 && s.sq.every(o => o.id > 0), 'its squads have numbers (' + s.sq.length + ')');
  const eco = s.eco; s.eco = null;
  ok(!/"stock"/.test(JSON.stringify(s)), 'no stock outside the economy\'s slot');
  ok(s.foe.every(e => ['jet', 'cas', 'heli'].includes(e.g) || (e.age >= 0 && e.age < $('CMD').mem)), 'fog: the enemy on the ground no older than CMD.mem');
  ok(s.ctl.seat === 'me' && s.pts.length === S.cq.p.length && s.log.length <= 20, 'the seat, ' + s.pts.length + ' points, a short log');
  const q = C.genQuery(0, { q: 'pool', x: S.cq.p[4].x, z: S.cq.p[4].z });
  ok(typeof q.ok === 'boolean' && (q.ok ? Array.isArray(q.ids) : typeof q.why === 'string'), 'the pool question answers (' + (q.ok ? q.ids.length + ' squads' : q.why) + ')');
  const am = C.genQuery(0, { q: 'amb', x: S.cq.p[4].x, z: S.cq.p[4].z });
  ok(typeof am.ok === 'boolean', 'the ambush question answers (' + (am.ok ? 'site on road ' + am.ri : am.why) + ')');
  ok(C.genCmd(0, { c: 'man', k: 'x' }, 'me').why === 'off' || typeof $('opNew') === 'function', 'a manoeuvre is refused cleanly until the roads\' operations exist');
}

console.log('-- no random numbers in the commands --');
{ const src = H.source(), a = src.indexOf('/* ---------- the general\'s commands (GCMD)'), b = a < 0 ? src.length : src.indexOf('\n/* ---------- ', a + 1) >>> 0;   // the GCMD section only: the blocks appended after it (logistics, bridges, M5...) are not commands and draw as they please
  ok(a >= 0, 'the section is in the simulation part of the page');
  const t = src.slice(a, b);
  ok(a >= 0 && !/Math\.random|\brand\(|\bqr\(/.test(t) && (t.match(/\bpick\(/g) || []).length <= 1, 'it draws only the human tank model (the section, ' + (b - a) + ' chars)'); }
H.done();
