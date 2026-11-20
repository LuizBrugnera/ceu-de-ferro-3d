'use strict';
/* brain-honesty (P7 of the soldier's brain, the research's table 2.6): the AI's mind reads what it perceives, never the world's lists.
   1. the code: in every /* ---------- CEREBRO: section of the page, S.men, S.units, S.bombs and S.planes appear only inside the perception
      functions allowed (PERC_OK: the sound of a shot is the world's own); and the old readings of table 2.6 are behind HON.on.
   2. a drill: with a Proxy on S counting reads of those lists while the mind's honest functions run (honFd, honKz, honBel, honEar,
      honNade), two squads and their vehicles fight for a while: none of them reads a list (a positive control first: the Proxy sees one).
   3. each swap: a squad's and a vehicle's nearest enemy (q.fd, A.fd) is the one it believes; an ambush counts what it sees in its killing
      ground; a grenade is run from only when seen, heard landing or shouted; a shot heard is placed with an error that grows with the
      distance and among buildings; drInc takes the heard report, not the shooter. */
const fs = require('fs'), H = require('./harness'), { ok, done } = H;
console.log('page: ' + H.PAGE);
const html = fs.readFileSync(H.PAGE, 'utf8');
const LISTS = /\bS\.(men|units|bombs|planes)\b/g;
/* the functions of a CEREBRO section that may read the world's lists, each for what it is: perception (what reaches an eye or an ear is the
   world's own) or the world's own step (not a decision). A new one is added here by name, with its reason, in review */
const PERC_OK = new Map([
  ['listen', 'perception: the report of a shot reaches the ears within its range (P7)'],
  ['flOuvir', 'perception: a voice reaches the ears within its reach and the din (P5)'],
  ['flNade', 'perception: a grenade seen landing or at his feet (P5)'],
  ['tunPeek', 'perception: an enemy sees or hears men at a tunnel mouth (trincheiras-tuneis)'],
  ['tunSee', 'perception: an enemy near a mouth finds it (trincheiras-tuneis)'],
  ['tunStep', 'the world\'s step: how many dig at a mouth, a guarded mouth cannot be blown (trincheiras-tuneis)']]);

/* the CEREBRO sections that only measure: an observer, as the analytics is, reads the battle and changes nothing it reads (it decides nothing),
   so it is left out of the scan, each by its name with its reason, in review. tests/brain-drills.js checks that the battle is the same with it off */
const OBSERVERS = new Map([['medicao', 'the measurement of the brain (P6): the meters, the cb events and the review read the battle as the analytics does']]);
console.log('-- 1. the code --');
{
  const heads = [], re = /\/\* ---------- CEREBRO: ([^\n]*)/g; let m;
  while ((m = re.exec(html))) heads.push({ at: m.index, name: m[1].replace(/-+\s*$/, '').replace(/\*\/.*$/, '').trim() });
  ok(heads.some(h => /^honestidade/.test(h.name)), 'the page has its CEREBRO sections (' + heads.length + ': ' + heads.map(h => h.name).join(', ') + ')');
  const bad = [];
  for (const h of heads) {
    if (OBSERVERS.has(h.name.split(/[\s,(]/)[0])) continue;
    const nx = html.indexOf('/* ---------- ', h.at + 10), end = nx < 0 ? html.length : nx, src = html.slice(h.at, end)
      .replace(/\/\*[\s\S]*?\*\//g, s => s.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"\\])\/\/[^\n]*/g, (s, a) => a + ' '.repeat(s.length - a.length));
    const lines = src.split('\n');
    for (let i = 0; i < lines.length; i++) {
      LISTS.lastIndex = 0; if (!LISTS.test(lines[i])) continue;
      let who = null;
      for (let j = i; j >= 0 && !who; j--) { const d = /^(?:async\s+)?(?:function\s*\*?\s*([\w$]+)|(?:const|let|var)\s+([\w$]+)|([\w$]+)\s*=[^=])/.exec(lines[j]); if (d) who = d[1] || d[2] || d[3]; }
      if (!PERC_OK.has(who)) bad.push(h.name + ': ' + (who || '?') + ': ' + lines[i].trim().slice(0, 100));
    }
  }
  ok(!bad.length, 'no S.men, S.units, S.bombs or S.planes in a CEREBRO section outside the perception functions and the world\'s steps (' + [...PERC_OK.keys()].join(', ') + ')' + (bad.length ? ':\n      ' + bad.join('\n      ') : ''));
  const body = (name, n) => { const a = html.indexOf('\nfunction ' + name + '('); return a < 0 ? '' : html.slice(a, a + (n || 3000)); };
  const guarded = (src, k) => src.split('\n').filter(l => new RegExp('\\b' + k + ' = Math.min').test(l) && /S\.(men|units)/.test(l)).every(l => /!HON\.on|else for/.test(l));
  const sq = body('squadThink', 1200), sc = body('scan', 1000), cs = body('cmdSquad', 2000), sm = body('sqMan', 2500), di = body('drInc', 1500);
  ok(/q\.fd = HON\.on \? honFd\(q, L\)/.test(sq) && guarded(sq, 'q.fd'), 'squadThink: q.fd is the nearest enemy believed (honFd), the true one only with HON.on 0');
  ok(/A\.fd = honFd\(u, u\)/.test(sc) && guarded(sc, 'A.fd'), 'scan: a vehicle\'s A.fd is the nearest enemy it believes, the true one only with HON.on 0');
  ok(/HON\.on \? honKz\(q, O\.kz, A\)/.test(cs) && (cs.match(/if \(!HON\.on\) for \(const o of S\.(units|men)\)/g) || []).length === 2, 'cmdSquad: an ambush counts what it sees in its killing ground (honKz)');
  ok(/b\.k === 'nade'[^\n]*honNade\(m, b\)/.test(sm), 'sqMan: a man runs from a grenade he knows of (honNade)');
  ok(/honSrc\(m, by\)/.test(di) && !/by\.x - m\.x/.test(di), 'drInc: the way the fire comes from is the heard report (honSrc), not the shooter');
  ok(/^listen = \(g => /m.test(html), 'listen is wrapped by the honesty section');
}

const C = H.load({ seed: 11 }), $ = C.$, HON = $('HON');
const at = (S, ri, f) => $('routeAt')(S.T.routes[ri], S.T.routes[ri].len * f);
const clear = q => { q.bel = new Map(); q.belS = undefined; };

console.log('-- 2. a drill with a Proxy on S --');
{
  const S = C.sandbox('modern'), r = S.T.routes[0], s0 = r.len * .45, a = at(S, 0, .45), b = $('routeAt')(r, s0 + 220), side = S.E.sides;
  const q0 = C.addSquad(0, a.x, a.z, 0, s0), q1 = C.addSquad(1, b.x, b.z, 0, s0 + 220);
  C.setOrd(q0, { k: 'hold', ri: 0, s: s0, x: a.x, z: a.z, R: 10 }); C.setOrd(q1, { k: 'hold', ri: 0, s: s0 + 220, x: b.x, z: b.z, R: 10 });
  C.addUnit('tank', 0, a.x - 40, a.z, side[0].tanks[0], false, 0, s0 - 40); C.addUnit('tank', 1, b.x + 40, b.z, side[1].tanks[0], false, 0, s0 + 260);
  const P = S.my; if (P) { P.inv = 1e9; P.y = 3000; }
  const G = $('globalThis'); G.__hon = { on: 0, n: {}, calls: {} };
  $('S = new Proxy(S, { get(o, k, r) { const h = globalThis.__hon; if (h.on && (k === "men" || k === "units" || k === "bombs" || k === "planes")) h.n[k] = (h.n[k] || 0) + 1; return Reflect.get(o, k, r); } })');
  for (const f of ['honFd', 'honKz', 'honBel', 'honEar', 'honNade']) $(f + ' = (g => function (...a) { const h = globalThis.__hon; h.on++; h.calls["' + f + '"] = (h.calls["' + f + '"] || 0) + 1; try { return g.apply(this, a); } finally { h.on--; } })(' + f + ')');
  G.__hon.on = 1; $('S.men.length + S.units.length'); G.__hon.on = 0;
  ok((G.__hon.n.men || 0) + (G.__hon.n.units || 0) === 2, 'positive control: the Proxy counts a read of S.men and S.units made inside a counted call');
  G.__hon.n = {};
  let err = null, k = 0; try { C.run(40, () => { if (++k % 300) return; for (const m of S.men) if (m.ai && !m.dead && m.nade > 0) { m.ctl.nade = 1; break; } }); } catch (e) { err = e; }
  const n = G.__hon.n, calls = G.__hon.calls, reads = Object.values(n).reduce((x, y) => x + y, 0);
  ok(!err, '40 s of two squads and two tanks in contact with the honesty on' + (err ? ': ' + err.stack.split('\n').slice(0, 3).join(' | ') : ''));
  ok(calls.honFd > 20 && calls.honBel > 20, 'the mind asked what it believes: ' + JSON.stringify(calls));
  ok(reads === 0, 'and read none of the world\'s lists doing it: ' + JSON.stringify(n));
}

console.log('-- 3. each swap --');
{ // the squad's q.fd
  HON.on = 1; const S = C.sandbox('modern'), r = S.T.routes[0], s0 = r.len * .5, a = at(S, 0, .5);
  const q = C.addSquad(0, a.x, a.z, 0, s0); C.setOrd(q, { k: 'hold', ri: 0, s: s0, x: a.x, z: a.z, R: 8 });
  const L = q.men[0], e = C.addMan($('INF').modern[S.fac[1]][0], 1, L.x + 140, L.z, Math.PI); e.ai = null; e.inv = 1e9;
  $('squadThink')(q);
  const f0 = q.fd; HON.on = 0; q.belS = undefined; $('squadThink')(q); const t0 = q.fd; HON.on = 1;
  ok(f0 === 1e9 && Math.abs(t0 - Math.hypot(e.x - q.men[0].x, e.z - q.men[0].z)) < 1, 'an enemy 140 m off that nobody has made out yet: q.fd ' + f0 + ' (the truth would have given ' + t0.toFixed(0) + ' m)');
  let seen = -1; const ts = S.t; C.run(15, () => { if (q.fd < 1e9) { seen = S.t - ts; return false; } });
  const Ld = q.men.find(m => !m.dead), d = Math.hypot(e.x - Ld.x, e.z - Ld.z);
  ok(seen > 0 && Math.abs(q.fd - d) < d * .35, 'once its men have him: q.fd ' + q.fd.toFixed(0) + ' m against the true ' + d.toFixed(0) + ' m, at ' + seen.toFixed(1) + ' s');
  e.x += 3000; C.run(HON.fresh + 2);
  ok(q.fd === 1e9 || q.fd > 2000 || q.men.some(m => !m.dead && m.pm && m.pm.get(e) && m.pm.get(e).kn), 'when he is gone from sight the contact ages out after HON.fresh s (q.fd ' + (q.fd === 1e9 ? 'none' : q.fd.toFixed(0)) + ')');
}
{ // the vehicle's A.fd
  HON.on = 1; const S = C.sandbox('modern'), a = at(S, 0, .5), side = S.E.sides;
  const u = C.addUnit('tank', 1, a.x, a.z, side[1].tanks[0], false, 0, S.T.routes[0].len * .5);
  const e = C.addMan($('INF').modern[S.fac[0]][0], 0, u.x - 150, u.z, 0); e.ai = null; e.st = 2;
  $('scan')(u); const f = u.ai.fd; HON.on = 0; $('scan')(u); const t = u.ai.fd; HON.on = 1;
  ok(f === 1e9 && Math.abs(t - 150) < 2, 'a tank with a man 150 m behind it it has not made out: A.fd ' + f + ' (the truth ' + t.toFixed(0) + ' m)');
  u.bel = new Map([[e, { t: S.t, g: 2, x: e.x + 10, z: e.z, c: 'man' }]]); u.belS = S.t; $('scan')(u);
  ok(Math.abs(u.ai.fd - 140) < 2, 'with him believed 10 m off where he is: A.fd ' + u.ai.fd.toFixed(0) + ' m, from the belief');
}
{ // the ambush's count
  HON.on = 1; const S = C.sandbox('modern'), a = at(S, 0, .5), side = S.E.sides, A = $('CMD').amb;
  const q = C.addSquad(0, a.x, a.z + 60, 0, S.T.routes[0].len * .5), kz = { x: a.x, z: a.z };
  const u = C.addUnit('tank', 1, a.x + 5, a.z, side[1].tanks[0], false, 0, S.T.routes[0].len * .5);
  clear(q); q.belS = S.t;
  ok($('honKz')(q, kz, A) === 0, 'a tank in the killing ground that the ambush has not seen counts 0');
  q.bel.set(u, { t: S.t, g: 2, x: u.x, z: u.z, c: 'tank' }); const n1 = $('honKz')(q, kz, A);
  q.bel.get(u).x = a.x + A.kz * .8; const n2 = $('honKz')(q, kz, A);
  ok(n1 === 9 && n2 === 2, 'seen: 9 in the middle of the killing ground, 2 at its edge (as cmdSquad counted the true ones): ' + n1 + ', ' + n2);
}
{ // the grenade
  HON.on = 1; const S = C.sandbox('modern'), a = at(S, 0, .5), K = $('INF').modern;
  const mk = (t, x, z, h) => { const m = C.addMan(K[S.fac[t]][0], t, x, z, h); m.ai = $('manBrain')(0); m.ai.gx = m.x; m.ai.gz = m.z; return m; };
  const m = mk(0, a.x, a.z, 0), th = mk(1, a.x + 200, a.z, Math.PI), y = h => C.hgt(a.x, a.z) + .1;
  const nade = (x, z) => ({ k: 'nade', x, y: C.hgt(x, z) + .1, z, vx: 0, vy: 0, vz: 0, team: 1, by: th, life: 8, fz: S.t + 3 });
  const front = nade(a.x + 6, a.z), back = nade(a.x - 6, a.z), close = nade(a.x - 4, a.z);
  ok($('honNade')(m, front) && !$('honNade')(m, back) && $('honNade')(m, close), 'one 6 m in front is seen, one 6 m behind is not, one 4 m behind is heard landing');
  const n = mk(0, a.x - 9, a.z, 0);   // a mate 3 m beyond it, facing it
  const BR = $('typeof BRAIN === "undefined" ? null : BRAIN'), b0 = BR && BR.on; if (BR) BR.on = 0;
  const g = $('honNade')(n, back), early = $('honNade')(m, back); S.t += HON.nade.react + .05; const late = $('honNade')(m, back); if (BR) BR.on = b0;
  ok(g && (n.sayK & 31) === $('SAYC').nade && !early && late, 'without the speech of P5: his mate behind sees it and shouts "Granada!": he knows of it ' + HON.nade.react + ' s later');
  if (BR && $('typeof flNade') === 'function') {
    const b2 = nade(a.x - 6, a.z + 1), m3 = mk(0, a.x, a.z + 1, 0); m3.rf = { k: 'granada', x: b2.x, z: b2.z, b: b2, t0: S.t + .3, ate: S.t + 3 };
    const e3 = $('honNade')(m3, b2); S.t += .35; const l3 = $('honNade')(m3, b2);
    ok(!e3 && l3, 'with it: the reflex P5 gave him (a call heard, m.rf) is how he knows of the one behind him, from its reaction time');
  }
  const run = (on, b) => { HON.on = on; const S2 = C.sandbox('modern'), m2 = mk(0, a.x, a.z, 0); S2.bombs.push(Object.assign({}, b, { by: mk(1, a.x + 200, a.z, Math.PI) })); $('sqMan')(m2, m2.ai, null, null); return m2.ai.brk > S2.t; };
  const rB = run(1, back), rF = run(1, front), rT = run(0, back); HON.on = 1;
  ok(!rB && rF && rT, 'sqMan: he runs from the one in front (' + rF + '), not from the one behind he knows nothing of (' + rB + '; with the truth he did: ' + rT + ')');
}
{ // the ear: listen and drInc
  HON.on = 1; const S = C.sandbox('modern'), a = at(S, 0, .5), K = $('INF').modern;
  const mk = (t, x, z, h) => { const m = C.addMan(K[S.fac[t]][0], t, x, z, h); m.ai = $('manBrain')(t); m.ai.gx = m.x; m.ai.gz = m.z; return m; };
  const err = (d, n) => { let e = 0, p = 0; for (let i = 0; i < n; i++) { const o = { x: 0, z: 0, ai: { seed: i * 7.31 } }, s = { x: d, z: 0, ai: { seed: 3.3 + i } }; const r = $('honEar')(o, s); e += Math.abs(r.ea); p += Math.hypot(r.x - d, r.z); } return { a: e / n, p: p / n }; };
  $('globalThis').__tw = $('honTown'); $('honTown = () => 0'); const e1 = err(100, 40), e2 = err(1200, 40); $('honTown = () => 1'); const e3 = err(1200, 40); $('honTown = globalThis.__tw');
  ok(e2.a > e1.a * 1.5 && e2.p > 100 && e1.p > 3, 'a shot heard is placed off: bearing ' + (e1.a * 57.3).toFixed(1) + '° and ' + e1.p.toFixed(0) + ' m out at 100 m, ' + (e2.a * 57.3).toFixed(1) + '° and ' + e2.p.toFixed(0) + ' m out at 1.2 km');
  ok(e3.a > e2.a * 1.5, 'among buildings the echo makes it worse: ' + (e3.a * 57.3).toFixed(1) + '° at 1.2 km');
  const o = mk(1, a.x, a.z, Math.PI), s = mk(0, a.x - 400, a.z + 30, 0); s.shotT = S.t; $('listen')();
  const off = o.ln ? Math.hypot(o.ln.x - s.x, o.ln.z - s.z) : -1;
  ok(o.ln && o.ln.of === s && off > 1, 'listen: a shot 400 m off turns him toward a place ' + off.toFixed(0) + ' m from the shooter, not onto him');
  HON.on = 0; s.shotT = S.t; $('listen')(); const off0 = Math.hypot(o.ln.x - s.x, o.ln.z - s.z); HON.on = 1;
  ok(off0 < .01, '  (with the honesty off, exactly onto him, as before)');
  const q = C.addSquad(1, a.x + 20, a.z, 0, S.T.routes[0].len * .5), v = q.men[0], qsd = S.qsd; v.ln = null;
  $('drInc')(v, s, 0, 0, 1);
  const w = q.drW[q.drW.length - 1], p = $('honEar')(v, s), pl = Math.hypot(p.x - v.x, p.z - v.z); S.qsd = qsd; const jx = $('qr')(-.25, .25), jz = $('qr')(-.25, .25);
  const tru = Math.atan2(s.z - v.z, s.x - v.x), heard = Math.atan2(p.z - v.z, p.x - v.x);
  ok(Math.abs(w.ux - ((p.x - v.x) / pl + jx)) < 1e-6 && Math.abs(w.uz - ((p.z - v.z) / pl + jz)) < 1e-6 && Math.abs(heard - tru) > 1e-3, 'drInc: the way the fire came is the heard report (its own jitter on top as before), the report ' + ((heard - tru) * 57.3).toFixed(1) + '° off the true way');
}
done();
