'use strict';
/* Physical logistics (phase F2b, D23 A, D24 A): crates in each forward node, what an entry costs there (the AI's columns and reinforcements,
   the player, a requisition, a rearm), convoys from the main base and the airlift, a convoy lost or taken, the dry node's morale, the
   logistics general, the commands conv, alift, sprio and the question logi, the player's own truck. With no economy, nothing of it. About two minutes */
const H = require('./harness'), ok = H.ok;
let C, $, S, LG, hd;
const load = (o, era) => { C = H.load(Object.assign({ seed: 21, eco: 1, lg: 1, mapv: 4 }, o)); $ = C.$; LG = $('LG'); hd = $('hdist'); return C; };
/* an AI × AI match with the economy, the generals left alone (no plan, no director, no logistics general) unless asked */
const watch = (era, keep) => { S = C.watch(era || 'ww2', { len: 0 }); if (!keep) { C.plan = () => {}; C.director = () => {}; if (S.lg) S.lg.cmd = [1e9, 1e9]; if (S.eco) S.eco.open = false; } return S; };   // the opening over: the reserve is drawn from
/* a finished supply base of side t beside road ri, `back` m behind its line */
const base = (t, ri, back) => {
  const r = S.T.routes[ri], ds = t ? 1 : -1, s0 = $('lineS')(t, ri) - ds * back;
  for (let k = 0; k < 300; k++) for (const off of [40, -40]) {
    const p = $('routeAt')(r, s0 - ds * k * 25), x = p.x - p.dz * off, z = p.z + p.dx * off;
    if (!C.siteWhy(t, x, z, 0)) { const b = C.startSite(t, x, z, 0); C.supAt(b, 1); return b; }
  }
  throw new Error('no place for a base');
};
const tk = t => S.cq.tk[t];

console.log('-- nodes: who has crates, from when --');
{
  load(); watch('ww2');
  const P = S.cq.p, held = P.filter(p => p.base < 0 && p.hold >= 0), free = P.filter(p => p.hold < 0);
  ok(!!S.lg && held.every(p => p.lc === LG.start.p) && free.every(p => p.lc === 0), 'with the economy: every point a side holds at the start has ' + LG.start.p + ' crates, a neutral one none (' + held.length + ' held, ' + free.length + ' neutral)');
  ok(P.filter(p => p.base >= 0).every(p => !$('lgNodes')(p.base).includes(p)), 'the main bases are no nodes: they always let in');
  const b = base(0, 0, 900); ok(b.lc === undefined && $('lgNodes')(0).includes(b) && b.lc === LG.start.b, 'a supply base finished: a node with what its builders brought (' + LG.start.b + ' crates)');
  const p = held.find(p => p.hold === 1); p.lc = 44; C.cqFlip(Object.assign(p, { hold: -1 }), 1);
  ok(p.lc === 0, 'a point that changes hands loses what was in it');
  load({ eco: 0 }); watch('ww2'); ok(!S.lg, 'with no economy there are no logistics');
  load(); LG.on = 0; watch('ww2'); ok(!S.lg, 'nor with LG.on 0');
}

console.log('-- the AI enters where the crates pay for it --');
{
  load(); watch('ww2');
  const ri = 1, b = base(0, ri, 700), main = $('endS')(0, ri, $('FIELD').main), cost = LG.cost;
  b.lc = 100; const n0 = S.units.length; C.spawnColumn(0, 2, 1, 1, ri, b.s, 0, 1);
  const col = S.units.slice(n0), want = 2 * cost.tank + cost.aa + cost.truck + cost.squad;
  ok(col.length === 4 && col.every(u => Math.abs(u.s - b.s) < 120) && b.lc === 100 - want, 'a column of 2 tanks, an AA and a truck with a squad enters at the base and takes ' + want + ' crates (' + b.lc + ' left)');
  const n1 = S.units.length; C.spawnColumn(0, 2, 0, 0, ri, b.s, 0, 0);
  const c2 = S.units.slice(n1), lg = S.glog.l[0].slice(-3).map(e => e.s).join(' | ');
  ok(c2.length === 2 && c2.every(u => Math.abs(u.s - main) < 120) && b.lc === 100 - want && /Linha fraca/.test(lg), 'two more tanks (40) with ' + b.lc + ' crates there: they enter at the main base and the general logs the weak line ("' + S.lg.wk[0] + '")');
  b.lc = LG.min - 1; ok(Math.abs($('entryS')(0, ri) - main) < 1, 'a base with less than ' + LG.min + ' crates is no entry for the AI'); b.lc = LG.min; ok(Math.abs($('entryS')(0, ri) - b.s) < 1, 'with ' + LG.min + ' it is');
  b.lc = 60; const r = C.dispatch(0, { why: 'teste' }, () => C.fieldSquad(0, 'line', 0, { k: 'hold', ri, s: b.s }, b.x + 10, b.z));
  ok(r && b.lc === 60 - cost.squad, 'a squad born at the base in a Dispatch order takes ' + cost.squad + ' crates');
  const far = C.dispatch(0, { why: 'teste' }, () => C.fieldSquad(0, 'line', 1, { k: 'hold', ri, s: b.s }, b.x + 600, b.z)); ok(far && b.lc === 60 - cost.squad, 'one born 600 m from it takes nothing');
}

console.log('-- the player enters at a node: its crates, or the main base --');
{
  load(); S = C.newState('ww2', 'schutze', { cls: 'inf', mouse: true }); C.plan = () => {}; C.director = () => {};
  const P0 = S.cq.p, p = P0.filter(p => p.hold === 0 && p.base < 0).sort((a, b) => hd(a, S.base[0]) - hd(b, S.base[0]))[0], again = () => { C.killMan(S.my, null); C.run(6); return S.my; };
  p.lc = 10; S.spawnAt = p.i + 1; let M = again();
  ok(hd(M, p) < 80 && p.lc === 10 - LG.cost.inf, 'a soldier entering at ' + p.L + ' takes ' + LG.cost.inf + ' of its crates (' + p.lc + ' left)');
  p.lc = 1; S.spawnAt = p.i + 1; M = again();
  ok(hd(M, S.base[0]) < 1600 && hd(M, p) > 300 && p.lc === 1 && S.spawnAt === 0, 'with 1 crate there the soldier enters at the main base instead');
  const w1 = [$('lgWhy')(p, 'inf', 'schutze'), $('lgWhy')(p, 'tank', 'tiger')]; p.lc = 25; const w2 = [$('lgWhy')(p, 'inf', 'schutze'), $('lgWhy')(p, 'tank', 'tiger')]; p.lc = 15; const w3 = $('lgWhy')(p, 'tank', 'tiger');
  ok(w1.join() === 'dry,dry' && w2.join() === ',' && w3 === 'dry', 'why not: with 1 crate dry for a soldier and a tank; with 25 both may; with 15 a soldier may and a tank (' + LG.cost.tank + ') may not');
  const P = S.cq.p, link = P.find(q => q.base === 0); const was = link.hold; link.hold = -1;
  ok($('lgWhy')(p, 'inf') === 'cut', 'a point cut off from the main base is no entry (cut)'); link.hold = was;
}

console.log('-- requisition and rearm in crates --');
{
  load(); S = C.newState('ww2', 'schutze', { cls: 'inf', mouse: true }); C.plan = () => {}; C.director = () => {}; S.men = S.men.filter(m => m === S.my); S.squads = [];
  const b = base(0, 1, 1500), P = S.my; P.x = b.x + 8; P.z = b.z; P.inv = 1e9; b.lc = 3; const k0 = tk(0);
  ok(C.rqWhy(P, 'trn', 'kubel', 0) === 'crates', 'a requisition at a base with 3 crates: refused for crates (a car takes ' + LG.cost.car + ')');
  b.lc = 50; const w = C.rqAsk('trn', 'kubel');
  ok(!w && S.my.kind && b.lc === 50 - LG.cost.car && tk(0) === k0, 'with 50: the car is drawn for ' + LG.cost.car + ' crates and no ticket (' + b.lc + ' left, tickets ' + Math.round(tk(0)) + ')');
  C.run(1); S.input.yawR = true; C.run(.1); S.input.yawR = false; C.run(.2);   // E: out of it, standing at the base
  const u = S.units.find(u => u.rqc !== undefined) || {}; ok(S.my.man && b.lc === 50 - LG.cost.car + Math.floor(LG.cost.car * $('RQ').refund), 'left whole at the base: half of it comes back (' + b.lc + ')');
  const M = S.my; M.arms[0].res = 0; M.hp = 5; b.lc = 10; C.run($('MAN').fill + .5);
  ok(M.arms[0].res === M.arms[0].d.mags && b.lc === 10 - LG.serve.man, 'a soldier refilled at the base takes ' + LG.serve.man + ' crate');
}

console.log('-- convoys: from the main base, delivered, lost, taken --');
{
  load(); watch('ww2');
  const d = S.eco.d[0], p = S.cq.p.filter(p => p.hold === 0 && p.base < 0).sort((a, b) => hd(b, S.base[0]) - hd(a, S.base[0]))[0];
  p.lc = 5; d.mt = 100; const L = S.lg;
  ok(C.lgConvoy(0, p, 'teste') === '' && L.cv.length === 1 && d.mt === 100 - LG.mt, 'a convoy to ' + p.L + ': a truck with ' + LG.truck + ' crates leaves the main base for ' + LG.mt + ' metal');
  const c = L.cv[0], u = c.u; ok(u.kind === 'truck' && u.lgc === LG.truck && u.mis && /comboio/.test(u.mis.why) && hd(u, S.base[0]) < 2500, 'by a Dispatch order with its mission ("' + u.mis.why + '")');
  let at = null; C.run(400, () => { if (at === null && p.lc > 5) at = S.t; return u.lgc > 0 && !u.dead; });
  ok(at !== null && p.lc === Math.min(LG.cap.p, 5 + LG.truck) && u.lgc === 0, 'it reached ' + p.L + ' after ' + Math.round(at || 0) + ' s and unloaded: ' + p.lc + ' crates');
  C.run(600, () => !u.gone); ok(u.gone && !L.cv.length, 'and went home and off the map');
  d.mt = 10; ok(C.lgConvoy(0, p, '') === 'mt', 'with 10 metal: no convoy (mt)');
  d.mt = 300; p.lc = LG.cap.p; ok(C.lgConvoy(0, p, '') === 'full', 'to a full node: no convoy (full)');
  p.lc = 0; C.lgConvoy(0, p, ''); const v = L.cv[0].u, k0 = tk(0); C.run(2); C.killUnit(v); C.run(1);
  ok(!L.cv.length && Math.round(k0 - tk(0)) === LG.lost && p.lc === 0 && S.glog.l[0].some(e => /Comboio perdido/.test(e.s)) && S.glog.l[1].some(e => /Comboio inimigo destruído/.test(e.s)), 'destroyed on the way: the load is lost, the side loses ' + LG.lost + ' tickets and both logs say so');
  // taken: a loaded truck standing still, alone, with an enemy soldier at it
  const q = S.cq.p.filter(p => p.hold === 1 && p.base < 0)[0]; q.lc = 0;
  C.lgConvoy(0, p, ''); const w = L.cv[0].u; C.run(1); w.run = null; w.ai.park = 1; w.s = w.home - 2000; C.place(w);   // abandoned on the road, 2 km out (side 0 goes toward s 0)
  S.men.filter(m => m.team === 0 && hd(m, w) < 60).forEach(m => { m.dead = true; }); S.units.filter(o => o !== w && o.team === 0 && hd(o, w) < 60).forEach(o => { o.dead = true; });
  C.run(2); const foe = C.addMan('rifleman', 1, w.x + 6, w.z, 0); foe.ai = null;
  C.run(LG.grab.t + 1, () => { foe.x = w.x + 6; foe.z = w.z; });
  ok(w.lgc === 0 && !L.cv.some(c => c.c > 0) && S.glog.l[0].some(e => /tomada pelo inimigo/.test(e.s)) && S.glog.l[1].some(e => /Tomamos/.test(e.s)), 'a loaded truck standing alone with an enemy soldier at it for ' + LG.grab.t + ' s: its crates are taken (' + (S.glog.l[1].slice(-1)[0] || {}).s + ')');
}

console.log('-- the airlift (today only) --');
{
  load(); watch('modern');
  const d = S.eco.d[0], p = S.cq.p.filter(p => p.hold === 0 && p.base < 0).sort((a, b) => hd(b, S.base[0]) - hd(a, S.base[0]))[0];
  p.lc = 0; d.mt = 200; d.res.lift = [];
  ok(C.lgAirlift(0, p, '') === 'lift', 'no transport helicopter in the reserve: no airlift (lift)');
  d.res.lift = ['hq']; ok(C.lgAirlift(0, p, '') === '' && !d.res.lift.length && d.mt === 200 - LG.mtL, 'with one: it takes off with ' + LG.lift + ' crates for ' + LG.mtL + ' metal');
  const h = S.lg.cv[0].u; let at = null;
  C.run(400, () => { if (at === null && p.lc > 0) at = S.t; return !h.gone && !h.dead; });
  ok(at !== null && p.lc === LG.lift, 'it landed by ' + p.L + ' after ' + Math.round(at || 0) + ' s and unloaded ' + p.lc + ' crates');
  ok(h.gone && !h.dead && (d.res.lift || []).length === 1, 'and came back to the reserve');
  load(); watch('ww2'); ok(C.lgAirlift(0, S.cq.p.find(p => p.hold === 0 && p.base < 0), '') === 'era', 'in 1944 there is none (era)');
}

console.log('-- the dry node, the logistics general --');
{
  load(); watch('ww2');
  const p = S.cq.p.find(p => p.hold === 1 && p.base < 0); for (const o of $('lgNodes')(1)) o.lc = 50; p.lc = 0; S.lg.cmd = [1e9, 1e9]; S.cq.tk = [500, 500];
  C.run(LG.dry.t - 2); const k1 = tk(1); C.run(64); const k2 = tk(1);
  ok(Math.abs(k1 - 500) < .05 && Math.abs(k1 - k2 - 64 / 60 * LG.dry.tk) < .1, 'a node dry for ' + LG.dry.t + ' s costs its side ' + LG.dry.tk + ' ticket a minute (' + (k1 - k2).toFixed(2) + ' in 64 s)');
  load(); watch('ww2');
  for (const o of $('lgNodes')(1)) o.lc = $('lgCap')(o);
  const q = S.cq.p.find(p => p.hold === 1 && p.base < 0 && $('lgTied')(1, p)); q.lc = 0; S.eco.d[1].mt = 300; S.lg.cmd = [1e9, 0];
  C.run(1); ok(S.lg.cv.length === 1 && S.lg.cv[0].n === 'p' + q.i, 'the logistics general sends a convoy to the node that needs it (' + q.L + ')');
  S.lg.cv.length = 0; q.lc = 0; S.gctl = [{ seat: 'ai', eco: 'ai', atk: 'ai', def: 'ai', sup: 'ai' }, { seat: 'me', eco: 'ai', atk: 'ai', def: 'ai', sup: 'me' }]; S.lg.cmd = [1e9, 0]; C.run(6);
  ok(!S.lg.cv.length, 'with the Apoio domain taken by a person, it sends none by itself');
}

console.log('-- the commands conv, alift, sprio and the question logi --');
{
  load(); watch('modern');
  const t = 1, p = S.cq.p.find(p => p.hold === t && p.base < 0), key = 'p' + p.i, cmd = c => C.genCmd(t, c, 'ai'); p.lc = 0; S.eco.d[t].mt = 300; S.lg.cmd = [1e9, 1e9];
  ok(cmd({ c: 'conv', nd: key, why: 'teste' }).ok && S.lg.cv.length === 1, 'conv {nd: ' + key + '}: a convoy goes');
  ok(cmd({ c: 'conv', nd: 'p' + S.cq.p.find(o => o.hold === 0 && o.base < 0).i }).why === 'node' && cmd({ c: 'conv', nd: 'zz' }).why === 'node', 'to a node of the other side or none: node');
  S.eco.d[t].res.lift = ['hq']; ok(cmd({ c: 'alift', nd: key }).ok && S.lg.cv.length === 2 && S.lg.cv[1].air, 'alift: the airlift goes');
  ok(cmd({ c: 'sprio', nd: key, p: 3 }).ok && S.lg.pri[t][key] === 3 && cmd({ c: 'sprio', nd: key, p: 7 }).why === 'shape' && cmd({ c: 'sprio', nd: key, p: -1 }).ok && S.lg.pri[t][key] === undefined, 'sprio sets a node\'s priority 0-3 and -1 gives it back');
  const v = C.genQuery(t, { q: 'logi' }), a = C.genAnswer(t, { q: 'logi' });
  ok(v.on && v.nodes.some(o => o.key === key && o.cap === LG.cap.p && o.inbound === LG.truck + LG.lift) && v.convoys.length === 2 && v.cost.tank === LG.cost.tank && a.ok && a.r.nodes.length === v.nodes.length, 'logi: every node with its crates, cap and what is on its way; the convoys; the costs (to a guest or the MCP too)');
  const rows = C.ecoVM(t, false).rows.map(r => r.label); ok(rows.includes('Suprimento') && rows.includes('Comboios'), 'the Logística panel shows the nodes and the convoys');
  load({ eco: 0 }); watch('ww2'); ok(C.genQuery(0, { q: 'logi' }).off === 1, 'with no economy logi says off');
}

console.log('-- the player\'s own truck --');
{
  load(); S = C.newState('ww2', 'opel', { cls: 'trn', mouse: true }); C.plan = () => {}; C.director = () => {};
  const P = S.my, d = S.eco.d[0], p = S.cq.p.filter(p => p.hold === 0 && p.base < 0).sort((a, b) => hd(a, S.base[0]) - hd(b, S.base[0]))[0];
  const B = S.base[0]; S.eco.ctl[0] = 'me'; d.mt = 100; P.inv = 1e9;   // the side's AI economy spends no metal meanwhile
  P.x = B.x + 400; P.z = B.z + 300; P.v = { x: 0, y: 0, z: 0 }; P.lgT = 0;
  let m0 = d.mt, drop = 0; for (let i = 0; i < (LG.load + 1) * 60; i++) { C.step(1 / 60); drop = Math.max(drop, m0 - d.mt); m0 = d.mt; }   // the income goes on: the load is the one drop in a step
  ok(P.lgc === LG.truck && Math.abs(drop - LG.mt) < 1, 'a truck standing ' + LG.load + ' s by the main base loads ' + LG.truck + ' crates for ' + LG.mt + ' metal');
  p.lc = 10; P.x = p.x + 5; P.z = p.z + 5; P.v = { x: 0, y: 0, z: 0 }; P.lgT = 0; C.run(LG.load + 1);
  ok(P.lgc === 0 && p.lc === 10 + LG.truck, 'driven to ' + p.L + ' and standing there: it unloads into it (' + p.lc + ')');
  P.lgc = 30; const k0 = tk(0); C.killUnit(P); C.run(1); ok(Math.round(k0 - tk(0)) === LG.lost, 'lost with crates aboard: ' + LG.lost + ' tickets');
}

console.log('-- a whole match: the battle goes on, nothing breaks --');
{
  load({ seed: 33 }); watch('modern', true); const cvs = new Set();   // every convoy seen on its way (the general's log keeps only its last entries)
  for (let i = 0; i < 240; i++) { C.run(1); for (const c of S.lg.cv) cvs.add(c); }
  const v = [0, 1].map(t => C.lgView(t)), sent = [0, 1].map(t => [...cvs].filter(c => c.t === t).length), got = [0, 1].map(t => S.glog.l[t].filter(e => /entregou/.test(e.s)).length);
  ok(!H.nan(S) && S.units.length && sent[0] && sent[1] && got[0] + got[1] > 0, 'four minutes of AI against AI: convoys sent ' + sent.join('/') + ', delivered ' + got.join('/') + ', nodes ' + v.map(o => o.nodes.map(n => n.crates).join(',')).join(' | '));
}
H.done();
