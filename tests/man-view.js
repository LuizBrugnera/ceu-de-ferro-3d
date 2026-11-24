'use strict';
/* Roads plan, slice 3 (map version 4), steps 3.18 and 3.19: the manoeuvres in the general's view and the cue codes. One op of each kind is opened (the real door,
   genCmd 'sys', where the situation allows it, else through manOpen with the fields a real one carries; the output says which), then: genVM has an entry of each kind
   with a finite path of at most 24 points, V.fb / V.res / V.gue / V.kz / V.mev, calling genVM twice leaves the battle unchanged and draws no random number, the packed
   gen message survives the client's whitelist with every kind intact and is under the relay's limit, a gen from an older host (no new fields) or a bad one does not
   throw on the client, the drawing code runs on a recording canvas for the host's view, the client's and a bad one, the panel text, the cue codes 11-13, and the
   human general's stop cancels one. Env: PAGE (the page to test), ERA (one era only). */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const KINDS = ['flk', 'inf', 'raid', 'cut', 'blk', 'dep', 'fnt', 'mres', 'gue'], NEW = ['fb', 'res', 'mev', 'gue', 'kz'], LIMIT = 8192;   // LIMIT: server.js BIG.gen
const fresh = (C, era) => { C.seed(7); const S = C.newState(era, C.$('ERAS')[era].sides[0].fighter, { cls: 'plane' }); S.demo = false; S.over = true; S.units = []; S.planes = []; S.men = []; S.squads = []; S.fld.forEach(f => { f.next = 1e9; }); for (const t of [0, 1]) { const Cm = C.$('cmdOf')(t); Cm.mnT = 1e9; if (t) Cm.atkT = 1e9; } return S; };
const line = (a, b, n) => { const o = []; for (let i = 0; i <= n; i++) o.push({ x: a.x + (b.x - a.x) * i / n, z: a.z + (b.z - a.z) * i / n }); return o; };
/* a canvas that records nothing and throws on nothing: the drawing code runs on it */
const M2D = new Set('save restore beginPath closePath moveTo lineTo arc arcTo quadraticCurveTo bezierCurveTo rect fill stroke clip fillRect strokeRect clearRect fillText strokeText translate rotate scale setLineDash getLineDash createLinearGradient createRadialGradient drawImage setTransform measureText'.split(' '));
const fakeG = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k === 'measureText' ? () => ({ width: 10 }) : M2D.has(k) ? () => {} : undefined)), set: (t, k, v) => { t[k] = v; return true; } });   // only the methods a real canvas has: anything else is a TypeError, as in the browser
const proj = { k: 1, s: .05, X: x => x * .05 + 300, Y: z => z * .05 + 300 };
/* the drawing code is after the DOM-free section the harness loads: its text (gOps, the manoeuvres' drawing, gKz) is run in the match's context on stubs of the helpers it calls */
const HTML = fs.readFileSync(H.PAGE, 'utf8'), D0 = HTML.indexOf('function gOps(g, V, P, now) {'), D1 = HTML.indexOf('function gUnitsL(g, V, P, now) {');
const T0 = HTML.indexOf('function genManTxt(o) {'), T1 = HTML.indexOf('/* the legend of the manoeuvres, written once');
const STUBS = 'const FRIEND = "#6fc3b2", FOE = "#e2604f", gCol = (V, s) => (s === V.t ? FRIEND : FOE), gAcc = () => "#fff", gMono = k => k + "px x", gOn = () => false; function gTxt() {} function gLine() {} function gRing() {} function gHeadAt() {} function gArrow() { return []; } function gHatch() {} function gStar() {}';
const drawer = C => { vm.runInContext(STUBS + '\n' + HTML.slice(D0, D1) + '\n' + HTML.slice(T0, T1), C); return (V, g, t) => { C.__V = V; C.__g = g; C.__p = proj; C.__t = t; vm.runInContext('gOps(__g, __V, __p, __t); gKz(__g, __V, __p);', C); }; };

for (const era of process.env.ERA ? [process.env.ERA] : ['ww2', 'modern']) {
  console.log(era);
  const C = H.load({ seed: 5, mapv: 4 }), $ = C.$, genCmd = $('genCmd'), S = fresh(C, era), Cm = $('cmdOf')(0), P = S.cq.p, R = S.T.routes, src = {};
  $('MAN').max = { cautious: 9, balanced: 9, aggressive: 9 };
  const base = S.base[0], R0 = R[0], mk = (job, s, ri) => { const p = $('routeAt')(R[ri || 0], s), q = C.addSquad(0, p.x, p.z, ri || 0, s); q.job = job; q.jk = 0; $('setOrd')(q, { k: 'hold', ri: ri || 0, s }); return q; };
  const res = C.addSquad(0, base.x, base.z, 0, R0.len - 100); res.job = 'base'; res.jk = 0; $('setOrd')(res, $('post')(0, 'base', 0));
  for (let i = 0; i < 12; i++) mk('held', R0.len - 400 - i * 30);
  $('cmdSense')(Cm, S.squads.filter(q => q.team === 0));
  const syn = (k, f) => { Cm.mcd = {}; const op = $('manOpen')(Cm, k, { why: 'teste' }, 'sys', f); src[k] = 'synthetic'; return op; };
  const real = (k, r) => { if (r && r.ok) { src[k] = 'real'; return true; } return false; };
  const foes = P.filter(p => p.hold === 1 && p.base < 0), own = P.filter(p => p.hold === 0 && p.base < 0);
  /* ---- the ops: the real door first ---- */
  for (const ri of [1, 0, 2]) { Cm.mcd = {}; if (real('dep', genCmd(0, { c: 'man', k: 'depth', ri }, 'sys'))) break; }
  for (const p of own) { Cm.mcd = {}; if (real('mres', genCmd(0, { c: 'man', k: 'reserve', pi: p.i }, 'sys'))) break; }
  Cm.mcd = {}; real('gue', genCmd(0, { c: 'man', k: 'harass', n: 1 }, 'sys'));
  { const G = foes.find(p => p.ri === 0 && p.tw) || foes[0], at = $('routeAt')(R[G.ri], G.s + 1500); for (let i = 0; i < 5; i++) { const q = C.addSquad(0, at.x - i * 60, at.z + 50, G.ri, G.s + 1500); q.job = 'held'; q.jk = 0; $('setOrd')(q, { k: 'hold', ri: G.ri, s: G.s + 1500 }); }
    Cm.fpT = -1; Cm.fpN = 0; Cm.mcd = {}; real('inf', genCmd(0, { c: 'man', k: 'infiltrate', pi: G.i, n: 1 }, 'sys')); }
  for (const q of foes) { Cm.mcd = {}; if (real('cut', genCmd(0, { c: 'man', k: 'encircle', pi: q.i }, 'sys'))) break; }
  /* what no scenario of this test makes by itself: the op with the fields of a real one (the paths are dense: they must be thinned) */
  const F = foes[0], A = own[0] || { x: base.x, z: base.z }, rf = $('railOf')(F.x, F.z), long = line({ x: A.x, z: A.z }, { x: F.x, z: F.z }, 90);
  if (!src.flk) syn('flk', { host: 0, P: F, nm: $('gName')(F), tx: F.x, tz: F.z, ri: rf.ri, s: rf.s, pos: { x: F.x - 200, z: F.z }, path: $('polyOf')(long), st: 'go', in: 0 });
  if (!src.raid) syn('raid', { tg: null, ak: 'art', nm: 'a artilharia inimiga', tx: F.x, tz: F.z + 300, ri: rf.ri, s: rf.s, drop: { x: F.x - 300, z: F.z }, path: $('polyOf')(line({ x: A.x, z: A.z }, { x: F.x, z: F.z + 300 }, 60)), st: 'go', val: 4, hT: 0, hCap: 0, oT: 0 });
  if (!src.blk) { const st = $('blkSites')()[0] || { x: F.x, z: F.z, dx: 1, dz: 0, ri: rf.ri, s: rf.s, pos: [{ x: F.x, z: F.z }] }; syn('blk', { site: st, kz: { x: st.x, z: st.z }, ri: st.ri, st: 'set', sprung: 0, arr: 0, tank: null, first: null, last: null, n0: 0, nv: 2 }); }
  if (!src.cut) syn('cut', { Q: F, ri: F.ri, lost: P.filter(p => p.hold === 1 && p.base < 0 && p !== F).slice(0, 3).map(p => p.i), kz: { x: F.x, z: F.z }, seen: 0 });
  if (!src.fnt) syn('fnt', { main: null, P1: F, P2: foes[1] || F, pos: { x: F.x - 400, z: F.z + 200 }, ri: rf.ri, kz: { x: F.x, z: F.z }, d0: 0, n0: 0, fired: 0 });
  if (!src.dep) { const ri = 1, f = { x: A.x, z: A.z + 100, s: 3000, nm: 'o entroncamento X', ri }; syn('dep', { ri, fb: f, dig: null, digT: 0, dug: 0, calm: 0 }); Cm.fb[ri] = f; }
  if (!src.mres) { const o = { k: 'hold', ri: 0, s: 3000, x: A.x, z: A.z }; syn('mres', { res, node: 0, resT: 0 }); Cm.resAt = { id: 'X', x: A.x, z: A.z, ri: 0, s: 3000, nm: 'o entroncamento Y', o }; }
  for (const k of KINDS) if (!src[k]) syn(k, {});   // not reached unless a kind above was missed
  console.log('  kinds: ' + KINDS.map(k => k + ' ' + src[k]).join(', '));
  const sx = $('Math'); for (const p of [own[0] || F, F, foes[1] || F]) for (let i = 0; i < 3; i++) $('cmdLoss')({ team: 0, x: p.x, z: p.z, man: 1 });
  Cm.mev = [{ k: 'flk', sc: 1.234, why: 'um motivo de teste bem comprido para o corte, passando de sessenta caracteres em tudo', ok: true }, { k: 'gue', sc: .55, why: 'outro', ok: false }];
  /* ---- the view model ---- */
  let V = null, err = null; try { V = $('genVM')(0, false); } catch (e) { err = e; }
  ok(!err && V, 'genVM(0) runs with the nine ops in force' + (err ? ' ' + err.stack : ''));
  if (!V) continue;
  const man = V.ops.filter(o => KINDS.includes(o.k));
  ok(KINDS.every(k => man.some(o => o.k === k)) && man.length >= 9, 'genVM has an entry of each of the nine kinds (' + man.map(o => o.k + ':' + o.st).join(' ') + ')');
  ok(man.every(o => Number.isInteger(o.id) && o.id > 0 && typeof o.st === 'string' && typeof o.nm === 'string' && typeof o.why === 'string' && Number.isInteger(o.n) && Array.isArray(o.path) && o.path.length % 2 === 0 && o.path.length <= 48 && o.path.every(Number.isInteger)), 'every entry has an id, a state, a name, a reason, a squad count and a flat path of whole metres, at most 24 points');
  ok(['flk', 'inf', 'raid'].every(k => man.find(o => o.k === k).path.length >= 4) && man.find(o => o.k === 'flk').path.length === (src.flk === 'synthetic' ? 48 : man.find(o => o.k === 'flk').path.length), 'flk, inf and raid carry a path (a dense one is thinned to 24 points)');
  ok(man.every(o => o.to === null || (Number.isInteger(o.to.x) && Number.isInteger(o.to.z))) && ['flk', 'inf', 'raid', 'blk', 'cut', 'dep', 'fnt', 'mres'].every(k => man.find(o => o.k === k).to), 'every kind that has a target has a finite one');
  ok(Array.isArray(V.fb) && V.fb.length === R.length && V.fb.some(f => f && Number.isFinite(f.x) && Number.isFinite(f.z) && Number.isFinite(f.a) && typeof f.nm === 'string'), 'V.fb has a row per axis, the fallback of the axis the dep op holds');
  ok(V.res && Number.isFinite(V.res.x) && Number.isFinite(V.res.z) && V.res.r >= 600 && typeof V.res.nm === 'string', 'V.res: the reserve\'s post and reach (' + (V.res && V.res.nm) + ', ' + (V.res && V.res.r) + ' m)');
  ok(V.gue && Number.isFinite(V.gue.r) && Array.isArray(V.gue.tm) && V.gue.tm.length >= 1 && V.gue.tm.every(T => Number.isFinite(T.x) && Number.isFinite(T.z)), 'V.gue: the ratio and the teams (' + (V.gue && V.gue.tm.length) + ')');
  ok(V.kz && V.kz.c > 0 && V.kz.a.length >= 3 && V.kz.a.length % 3 === 0 && V.kz.a.length <= 96 && V.kz.a.every(Number.isFinite), 'V.kz: the hottest cells of the kill zones, capped (' + (V.kz && V.kz.a.length / 3) + ' cells)');
  ok(V.mev.length === 2 && V.mev.every(m => typeof m.k === 'string' && Number.isFinite(m.sc) && m.why.length <= 60), 'V.mev: the rows the commander weighed, texts cut to 60 characters');
  ok(/Manobra: /.test(V.post.s) && V.post.s.length <= 240, 'the posture says a manoeuvre is in force, inside the 240 characters the relay allows: "' + V.post.s.slice(-70) + '"');
  { let e1 = null; try { $('genVM')(1, true); } catch (e) { e1 = e; } ok(!e1, 'the other side\'s view (no manoeuvres, both sides) runs' + (e1 ? e1.stack : '')); }
  /* ---- read only ---- */
  const fp = () => {
    let sum = 0; for (const k of ['men', 'units', 'planes']) for (const o of S[k]) sum += o.x * 1.3 + o.z + (o.hp || 0);
    return [S.men.length, S.units.length, S.squads.length, sum.toFixed(6), S.cq.ps.join(), JSON.stringify(Cm.ops.map(o => [o.k, o.id, o.st || '', o.sq.length, o.over ? 1 : 0, o.n0, o.T])), JSON.stringify(S.squads.map(q => [q.id, q.ord && q.ord.k, q.op && q.op.id, q.live, q.s])),
      Cm.kz ? Array.from(Cm.kz).reduce((a, b) => a + b, 0) : 0, JSON.stringify(Cm.fb), JSON.stringify(Cm.resAt && [Cm.resAt.x, Cm.resAt.z]), JSON.stringify(Cm.mev), Cm.fpN, S.glog ? S.glog.l[0].length : 0, JSON.stringify(Cm.gue && Cm.gue.op.teams.map(T => T.st)), Cm.man.length].join('|');
  };
  const f0 = fp(); let draws = 0; const r0 = sx.random; sx.random = () => { draws++; return r0(); };
  let e2 = null; try { $('genVM')(0, false); $('genVM')(0, true); $('genVM')(1, false); } catch (e) { e2 = e; } sx.random = r0;
  ok(!e2 && fp() === f0 && draws === 0, 'genVM called three more times leaves the battle as it was (state, ops, grids, log) and draws no random number (' + draws + ' draws)' + (e2 ? e2.stack : ''));
  /* ---- the wire ---- */
  V = $('genVM')(0, false);
  const msg = JSON.stringify({ t: 'gen', s: 0, T: S.t, v: $('genPick')(V), q: $('gsqOf')(0) }), W = JSON.parse(msg);
  console.log('  the gen message with ' + man.length + ' manoeuvres in force: ' + msg.length + ' B (relay limit ' + LIMIT + '); ops ' + JSON.stringify(W.v.ops).length + ' B, mev ' + JSON.stringify(W.v.mev).length + ', kz ' + JSON.stringify(W.v.kz).length + ', gue ' + JSON.stringify(W.v.gue).length + ', fb ' + JSON.stringify(W.v.fb).length + ', post ' + JSON.stringify(W.v.post).length);
  ok(msg.length < LIMIT, 'the largest gen (nine manoeuvres in force) is ' + msg.length + ' B, under the relay\'s ' + LIMIT);
  ok(NEW.every(k => k in W.v) && KINDS.every(k => W.v.ops.some(o => o.k === k)) && W.v.ops.length <= 16 && W.v.mev.length <= 5 && W.v.kz.a.length <= 48, 'the packed message carries the new keys and every kind (ops ' + W.v.ops.length + ' of the 16 the relay keeps)');
  ok(NEW.every(k => $('GENK').includes(k)), 'the client\'s whitelist (GENK) names the new keys');
  ok(D0 > 0 && D1 > D0 && T1 > T0 && T0 > 0, 'the drawing code is found in the page');
  const draw = drawer($ && C), Cc = H.load({ seed: 5, mapv: 4 }); Cc.newState(era, null, { net: true, watch: 1, spec: 1 }); Cc.$('Net').gen = true;
  const rxm = m => { Cc.$('Net').rx.gen(m); return Cc.genVM(0, false); };
  let Vc = null, e3 = null; try { Vc = rxm(JSON.parse(msg)); } catch (e) { e3 = e; }
  ok(!e3 && Vc && Vc.cmd === true, 'a client (spectator) takes the message and builds its view' + (e3 ? ' ' + e3.stack : ''));
  if (!Vc) continue;
  const same = k => JSON.stringify(Vc[k]) === JSON.stringify(W.v[k]);
  ok(Vc.ops.length === W.v.ops.length && KINDS.every(k => Vc.ops.some(o => o.k === k)) && same('ops') && NEW.every(same), 'the client sees every kind and the new fields as the host packed them');
  ok(Vc.post.s === W.v.post.s && /Manobra: /.test(Vc.post.s), 'and the posture sentence');
  { const old = JSON.parse(msg); for (const k of NEW) delete old.v[k]; old.v.ops = old.v.ops.filter(o => !KINDS.includes(o.k)); let e4 = null, Vo = null; try { Vo = rxm(old); } catch (e) { e4 = e; }
    ok(!e4 && Vo && Vo.fb === null && Vo.res === null && Vo.gue === null && Vo.kz === null && Array.isArray(Vo.mev) && Vo.mev.length === 0, 'a gen from an older host (no new keys): no throw, the fields stay empty' + (e4 ? ' ' + e4.stack : '')); }
  { const bad = JSON.parse(msg); Object.assign(bad.v, { fb: 'x', res: 5, gue: 3, kz: 'q', mev: 7 }); bad.v.ops = [{ k: 'flk', id: 1, path: 'zz', to: 5, st: 3, nm: 9, at: 'a' }, { k: 'cut', id: 2, pts: 'x', to: {} }, { k: 'blk', id: 3, a: 'q', to: null }, { k: 'raid', id: 4, path: [1], to: { x: 'a' } }, { k: 'fnt', id: 5, from: 1 }, { k: 'zzz', id: 6 }].concat(bad.v.ops.slice(0, 2));
    let e5 = null; try { draw(rxm(bad), fakeG(), 1234); } catch (e) { e5 = e; }
    ok(!e5, 'a gen with wrong types in the new fields and entries: the client neither throws nor fails to draw it' + (e5 ? ' ' + e5.stack : '')); Vc = rxm(JSON.parse(msg)); }
  /* ---- drawing, on a canvas that records nothing ---- */
  for (const [nm, v] of [['host', V], ['client', Vc]]) { let e6 = null; try { const g = fakeG(); for (let i = 0; i < 3; i++) draw(v, g, 1000 + i * 700); } catch (e) { e6 = e; } ok(!e6, 'gOps and gKz draw the ' + nm + '\'s view of all nine kinds (3 frames)' + (e6 ? ' ' + e6.stack : '')); }
  { const a = HTML.indexOf("{ id: 'inf', nm: 'Influência'"), b = HTML.indexOf("{ id: 'kz', nm: 'Zonas de morte', on: 0"); ok(a > 0 && b > a && HTML.indexOf("{ id: 'obj'") > b, 'the kill-zone layer exists, is off by default and sits after the influence'); }
  /* ---- the panels' text ---- */
  const tx = V.ops.filter(o => KINDS.includes(o.k)).map(o => $('genManTxt')(o));
  ok(tx.length >= 9 && tx.every(s => typeof s === 'string' && /\(\w+\) — /.test(s) && !/undefined|NaN/.test(s)), 'the operations list has a line per manoeuvre: name, target, tag, state, squads, reason (' + tx[0] + ')');
  ok(KINDS.every(k => $('GEN').man[k] && $('GEN').mtag[k] && $('GEN').mlg[k]) && Object.values($('GEN').mst).every(s => typeof s === 'string'), 'every kind has its name, tag and legend row');
  /* ---- the cue codes ---- */
  { const cue = $('CUE'); ok(cue[11] === 'COMANDO: incursão na retaguarda inimiga em curso' && cue[12] === 'COMANDO: fustigar e evitar combate decisivo' && cue[13] === 'COMANDO: defesa em profundidade, recuar para a linha de recuo' && cue[14] === 'COMANDO: o general marcou um objetivo' && cue[8] === 'COMANDO: CONTRA-ATAQUE da reserva' && cue[1] === 'COMANDO: reunir para o assalto', 'CUE 11-13 are the plan\'s texts, the older codes in their places');
    const code = () => { $('cmdFires')(Cm); return Cm.cue[0]; }, raidInf = Cm.ops.filter(o => o.man && (o.k === 'raid' || o.k === 'inf')), dep = Cm.ops.filter(o => o.man && o.k === 'dep');
    Cm.hit = null; Cm.thr = 0; Cm.umark = null; const c1 = code(); ok(c1 === 11, 'a raid or an infiltration in force: code 11 (' + c1 + ')');
    for (const o of raidInf) o.over = true; const c2 = code(); ok(c2 === 12, 'a harassment on: code 12 (' + c2 + ')');
    const g0 = Cm.gue; Cm.gue = null; const c3 = code(); ok(c3 === 13, 'a defence in depth: code 13 (' + c3 + ')');
    for (const o of dep) o.over = true; ok(code() === 0, 'none in force: no code');
    for (const o of dep) o.over = false; Cm.thr = 3; Cm.tx = base.x; Cm.tz = base.z; ok(code() === 7, 'a threat code wins over a manoeuvre\'s (' + Cm.cue[0] + ')'); Cm.thr = 0;
    Cm.hit = { x: base.x, z: base.z, T: S.t + 9 }; ok(code() === 9, 'so does a hit (' + Cm.cue[0] + ')'); Cm.hit = null; Cm.gue = g0; for (const o of raidInf) o.over = false; }
  /* ---- the human general's stop cancels one ---- */
  { const op = Cm.ops.find(o => o.man && o.k === 'dep' && !o.over), id = op.id, ri = op.ri; $('genCtl')(0, 'me');
    const r = genCmd(0, { c: 'stop', id }, 'me'); ok(r.ok && op.over && !Cm.fb[ri], 'stop (the command GOR\'s cancel button sends) ends a manoeuvre\'s op and clears what it set (' + (r.ok ? 'ok' : r.why) + ')');
    const V2 = $('genVM')(0, false); ok(!V2.ops.some(o => o.id === id) && !V2.fb.some(f => f), 'and the view no longer shows it'); $('genCtl')(0, 'ai'); }
  ok(!H.nan(S), 'no NaN in the battle');
}
done();
