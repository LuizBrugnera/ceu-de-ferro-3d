'use strict';
/* The AI's defences (AID): the sapper squad in the opening (in place of a road patrol) and its tasks (a minefield on the seat town's
   approach, clearing a suspect field and the enemy mines its side knows, the mines it finds near it), each with its mission; a raid's
   sapper against a parked vehicle; the danger the mines put on the roads; the posts a quiet squad builds and their garrisons; the dome
   where enemy rounds come down, and an enemy dome known; the rocket launcher a column brings, its whole salvo at a mass only, and its
   commander's missions; the economy's guard (the seat town's sites and the forward mine) and the quick reaction force. SECS: the
   AI × AI match at the end (default 240; 0 leaves it out) */
const H = require('./harness'), ok = H.ok, SECS = process.env.SECS === undefined ? 240 : +process.env.SECS;
const hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
/* an empty battlefield of map version 5 (the seat towns) with the commanders made */
const field = (C, era) => { const S = C.sandbox(era); for (const f of S.forts.slice()) C.fortDrop(f); S.forts = []; S.cmd = [C.$('cmdOf')(0), C.$('cmdOf')(1)]; return S; };
const squad = (C, t, job, O, kits) => { const q = C.dispatch(t, { why: 'teste' }, () => C.addSquad(t, O.x, O.z, O.ri, O.s, kits)); q.job = job; q.jk = 0; C.setOrd(q, O); return q; };
const until = (C, f, secs) => { let hit = false; C.run(secs, () => (hit = !!f()) ? false : undefined); return hit; };
const logs = (S, t, re) => (S.glog ? S.glog.l[t] : []).filter(e => re.test(e.s));

console.log('-- the opening: a sapper squad in place of a road patrol, the reserve in the seat town --');
for (const [era, mapv] of [['ww2', 1], ['modern', 5]]) {
  const C = H.load({ seed: 3, mapv, eco: true }), $ = C.$, S = C.watch(era, {}), AID = $('AID');
  for (const t of [0, 1]) {
    const sq = S.squads.filter(q => q.team === t), sp = sq.filter(q => q.job === 'sap'), q = sp[0], road = sq.filter(q => q.job === 'road').length, n = $('postN')('road', 2);
    ok(sp.length === AID.sap.n && q.men.filter(m => m.def.sap).length === 2 && q.men.length === $('SQUAD')[era].length && q.mis.kind === 'reserve' && q.mis.d > 0 && road === n - 1,
      era + ' map v' + mapv + ', side ' + t + ': a sapper squad (' + q.men.map(m => m.def.role).join(', ') + '), mission ' + q.mis.kind + ' by order ' + q.mis.d + '; ' + road + ' road patrol(s) of ' + n);
    const w = $('aidSeat')(t), b = sq.find(q => q.job === 'base');
    if (w) ok(b && hd(b.ord, w) < w.ru && b.mis.kind === 'defend', era + ', side ' + t + ': the reserve squad (the quick reaction force) holds in the seat town, ' + Math.round(hd(b.ord, w)) + ' m from its middle, mission ' + (b && b.mis.kind));
  }
}

console.log('-- a minefield on the seat town\'s approach --');
{
  const C = H.load({ seed: 11, mapv: 5 }), $ = C.$, S = field(C, 'modern'), AID = $('AID'), SAP = $('SAP');
  const C0 = S.cmd[0], A = $('aidOf')(C0), q = squad(C, 0, 'sap', $('aidSapPost')(0), $('aidSapKits')(0));
  until(C, () => q.at, 120);
  $('aidSap')(C0, A, [q]);
  const T = q.sapT, M = q.mis;
  ok(T && T.k === 'mfield' && /cidade-sede/.test(T.why) && M.kind === 'build' && M.why === T.why && hd(M.area, T) < 1 && q.ord.sap === T, 'the commander gives the sappers a field: "' + (T && T.why) + '", mission ' + M.kind + ' with its words and leash');
  const done = until(C, () => !q.sapT, 420), L = $('mines')().filter(o => o.team === 0 && !o.gone);
  ok(done && L.length === T.pts.length && L.filter(o => o.k === 0).length === 3 && L.every(o => hd(o, T) < 30), 'they lay it: ' + L.filter(o => o.k === 0).length + ' AT mines on the road and ' + L.filter(o => o.k === 1).length + ' AP beside it, in ' + Math.round(S.t) + ' s');
  ok(L.every(o => !(o.kn & 2)), 'the enemy knows none of them');
  ok(S.rep[0].some(r => r.k === 'done' && r.data.k === 'mfield' && r.data.n === L.length) && logs(S, 0, /Campo minado pronto/).length === 1, 'the squad reports it done and the journal says so: "' + (logs(S, 0, /Campo minado pronto/)[0] || {}).s + '"');
  ok(q.ord.k === 'hold' && hd(q.ord, $('aidSapPost')(0)) < 1 && q.mis.kind === 'reserve', 'and it goes back to its place, in reserve');
  $('aidSap')(C0, A, [q]);
  ok(!q.sapT || q.sapT.key !== T.key, 'a field done is not laid again (next: ' + (q.sapT ? q.sapT.why : 'nothing') + ')');
  const sm = q.men.filter(m => m.def.sap); sm.forEach(m => { m.mn = [0, 0]; m.chg = 0; }); q.sapT = null; C.setOrd(q, $('aidSapPost')(0)); q.at = true;
  $('aidSap')(C0, A, [q]);
  const R = q.sapT;
  ok(R && R.k === 'refill' && q.mis.kind === 'support', 'with empty pouches the squad goes to a depot: ' + (R && R.why));
  const back = until(C, () => !q.sapT, 600);
  ok(back && sm.every(m => m.mn.join() === SAP.mines.join() && m.chg === SAP.chg), 'and comes back with its mines and its ' + SAP.chg + ' charges');
}

console.log('-- clearing: a suspect field, the enemy mines it knows, a mine found near it --');
{
  const C = H.load({ seed: 12, mapv: 5 }), $ = C.$, S = field(C, 'modern'), SAP = $('SAP');
  const C0 = S.cmd[0], A = $('aidOf')(C0), P = $('aidSapPost')(0), q = squad(C, 0, 'sap', P, $('aidSapKits')(0)), r = S.T.routes[P.ri];
  until(C, () => q.at, 120);
  const p = $('routeAt')(r, P.s + (S.T.routes[P.ri].len > P.s + 400 ? 300 : -300)), seen = $('mineLay')(0, 1, p.x + 4, p.z), hid = $('mineLay')(1, 1, p.x - 15, p.z + 12);
  seen.kn |= 1; seen.armT = hid.armT = -1;
  $('sus')(0).push({ x: p.x, z: p.z, t: S.t });
  $('aidSap')(C0, A, [q]);
  const T = q.sapT;
  ok(T && T.k === 'clear' && q.mis.kind === 'support' && /limpar minas/.test(q.mis.why), 'a suspect field in its own ground first: "' + (T && T.why) + '", mission ' + q.mis.kind);
  const done = until(C, () => !q.sapT, 400);
  ok(done && seen.gone && hid.gone && q.men.every(m => !m.dead), 'the sappers lift the mine they knew and find and lift the hidden one, with no loss (' + Math.round(S.t) + ' s)');
  ok(S.rep[0].some(r => r.k === 'done' && r.data.k === 'clear' && r.data.n === 2) && logs(S, 0, /Passagem aberta/).length === 1, 'and report the way open: "' + (logs(S, 0, /Passagem aberta/)[0] || {}).s + '"');
  until(C, () => q.at, 300);
  const L = q.men.find(m => !m.dead), o = $('mineAdd')(900, 0, 1, L.x + 20, L.z + 6, 1, true);   // laid by hand: within 25 m of the squad the enemy could not lay it
  const lifted = until(C, () => o.gone, 60);
  ok(lifted && !q.sapT, 'idle at its post, a sapper lifts an enemy mine known 20 m away');
}

console.log('-- the roads go round the mines --');
{
  const C = H.load({ seed: 13, mapv: 5 }), $ = C.$, S = field(C, 'modern'), C0 = S.cmd[0], E = S.T.net.e;
  $('cmdSense')(C0, []);
  const e = E.find(e => e.smp.length > 3), i = E.indexOf(e), was = C0.et[i];
  $('sus')(0).push({ x: e.smp[1].x, z: e.smp[1].z, t: S.t });
  $('cmdSense')(C0, []);
  ok(C0.et[i] - was >= $('AID').sus.k - 1e-6, 'a suspect field on a road makes it dearer to its side (danger ' + was.toFixed(2) + ' → ' + C0.et[i].toFixed(2) + '), so its trips and columns go round it');
}

console.log('-- a raid\'s sapper against a parked vehicle --');
{
  const C = H.load({ seed: 14, mapv: 5 }), $ = C.$, S = field(C, 'modern'), C0 = S.cmd[0], SAP = $('SAP');
  const r = S.T.routes[0], p = $('routeAt')(r, r.len / 2), u = C.addUnit('art', 1, p.x - p.dz * 40, p.z + p.dx * 40, S.E.sides[S.fac[1]].art, true); u.ai = null;
  const q = squad(C, 0, 'sap', { k: 'hold', ri: 0, s: r.len / 2, x: u.x + 12, z: u.z + 4, R: 3 }, $('aidSapKits')(0));
  until(C, () => q.at, 60);
  const op = { k: 'raid', man: 1, id: 99, st: 'hit', tg: u, ak: 'art', nm: 'a artilharia inimiga', sq: [q], n0: q.live, tx: u.x, tz: u.z, ri: 0, s: r.len / 2, hT: 0, hCap: S.t + 999, over: false, team: 0, drop: { x: u.x + 100, z: u.z } };
  q.op = op; C0.ops.push(op);
  let hit = false;
  for (let i = 0; i < 40 && !hit; i++) { $('OPS').raid(C0, op); C.run(.5); hit = (S.sab || []).some(c => c.g === u); }
  const hp = u.hp; C.run(6);
  ok(hit && u.hp < hp && logs(S, 0, /Carga de sabotagem/).length === 1, 'at the target a sapper plants a charge against it: ' + (u.dead ? 'destroyed' : Math.round(hp) + ' → ' + Math.round(u.hp) + ' hp') + ' ("' + (logs(S, 0, /Carga de sabotagem/)[0] || {}).s + '")');
}

console.log('-- posts: what a quiet squad builds, and the garrison --');
{
  const C = H.load({ seed: 15, mapv: 5 }), $ = C.$, S = field(C, 'modern'), C0 = S.cmd[0], A = $('aidOf')(C0), FORT = $('FORT');
  const r = S.T.routes[1], b = S.base[1], at = (s, off) => { const p = $('routeAt')(r, s), x = p.x - p.dz * off, z = p.z + p.dx * off, q = $('railOf')(x, z); return { k: 'hold', ri: q.ri, s: q.s, x, z }; };
  const one = (job, O, want) => {
    const q = squad(C, 0, job, O); until(C, () => q.at, 120); C.run(3);
    $('aidPosts')(C0, A, [q]);
    const f = q.aidP;
    ok(f && f.k === want && f.team === 0 && f.prog < 1, job + ' squad: starts a ' + (f ? f.F.name : 'nothing') + ' where it stands');
    const up = until(C, () => f.prog >= 1 && f.garr, 220), g = f.garr;
    ok(up && g && g.mis.kind === 'garrison' && /guarnição do posto/.test(g.mis.why) && g.men.every(m => m.mis === g.mis), '  its men build it (' + Math.round(S.t) + ' s) and its garrison comes, mission ' + (g && g.mis.kind) + ': ' + (g && g.mis.why));
    return q;
  };
  one('line', at(r.len * .45, 60), 4);
  C0.known.push(Object.assign(C.addUnit('tank', 1, b.x, b.z, S.E.sides[S.fac[1]].tanks[0], true), { sx: b.x, sz: b.z, seenT: S.t }));
  one('line', at(r.len * .55, 60), 3);
  one('wood', at(r.len * .65, 80), 5);
  const q = squad(C, 0, 'guard', at(r.len * .75, 60)); until(C, () => q.at, 120);
  for (const f of S.forts.slice()) if (f.k >= 3) { f.gone = true; }
  S.forts = S.forts.filter(f => !f.gone);
  const E = H.load({ seed: 15, mapv: 5, eco: true }), V = E.newState('modern', E.$('ERAS').modern.sides[0].fighter, { cls: 'plane' }), d = V.eco && V.eco.d[0], F = E.$('POSTS').atp;
  if (d) { d.en = F.cost[0] + E.$('ECO').ai.keep.en - 1; d.mt = 1000; const no = E.$('aidPay')(0, F.cost); d.en += 2; ok(!no && E.$('aidPay')(0, F.cost), 'with the economy on a post is paid for only with the economy\'s own reserve left over'); }
  else ok(false, 'the economy is on in this test');
}

console.log('-- the dome --');
{
  const C = H.load({ seed: 16, mapv: 5 }), $ = C.$, S = field(C, 'modern'), C0 = S.cmd[0], A = $('aidOf')(C0), POSTS = $('POSTS'), w = $('aidSeat')(0);
  const q = squad(C, 0, 'base', $('aidQrfPost')(0)); until(C, () => q.at, 120);
  $('aidDome')(C0, A, [q]);
  ok(!S.forts.some(f => f.k === 6), 'no enemy round has come down: no dome');
  for (let i = 0; i < 6; i++) A.rk.push({ x: w.x + 100 * i, z: w.z - 50, t: S.t });
  A.dT = 0; $('aidDome')(C0, A, [q]);
  const f = S.forts.find(f => f.k === 6 && f.team === 0);
  ok(f && q.dome === f && q.mis.kind === 'build' && /cúpula/.test(q.mis.why) && hd(f, w) < 600, 'six enemy rounds on the seat town: a dome is started ' + (f ? Math.round(hd(f, w)) + ' m from it' : '') + ', the reserve squad builds it (mission ' + q.mis.kind + ')');
  const up = until(C, () => f.prog >= 1, 400);
  $('aidDome')(C0, A, [q]);
  ok(up && !q.dome && q.ord.k === 'hold' && hd(q.ord, $('aidQrfPost')(0)) < 1 && logs(S, 0, /Cúpula antifoguete pronta/).length === 1, 'up in ' + Math.round(S.t) + ' s, its builders go back to their place');
  const m = C.addMan($('INF').modern[1][0], 1, f.x + 900, f.z, 0); m.ai = null; C.run(1);
  ok(f.kn & 2, 'an enemy soldier within ' + $('AID').dome.see + ' m: the enemy knows the dome');
  const g = H.load({ seed: 16, mapv: 5 }), Sg = field(g, 'ww2'), qg = squad(g, 0, 'base', g.$('aidQrfPost')(0)), Ag = g.$('aidOf')(Sg.cmd[0]);
  for (let i = 0; i < 9; i++) Ag.rk.push({ x: qg.ord.x, z: qg.ord.z, t: Sg.t });
  qg.at = true; g.$('aidDome')(Sg.cmd[0], Ag, [qg]);
  ok(!Sg.forts.some(f => f.k === 6), 'in 1944 there is no dome');
}

console.log('-- the rocket launcher --');
{
  const C = H.load({ seed: 17, mapv: 5 }), $ = C.$, S = field(C, 'modern'), C0 = S.cmd[0], A = $('aidOf')(C0), side = S.E.sides[S.fac[0]], r = S.T.routes[0];
  C.dispatch(0, { by: $('MIS').col, why: 'coluna' }, () => C.spawnColumn(0, 0, 0, 0, 0, r.len - 3000, 2, 0));
  let art = S.units.filter(u => u.kind === 'art' && u.team === 0);
  ok(art.length === 2 && art.filter(u => u.id === side.mlrs).length === 1 && art.every(u => u.mis.kind === 'support' && u.mis.d > 0), 'a column\'s artillery: the side\'s launcher (' + side.mlrs + ') and a howitzer, both by its order, mission support');
  C.spawnColumn(0, 0, 0, 0, 0, r.len - 3400, 1, 0);
  art = S.units.filter(u => u.kind === 'art' && u.team === 0);
  ok(art.length === 3 && art.filter(u => u.id === side.mlrs).length === 1, 'while it has one, the next column brings a howitzer');
  const g = art.find(u => u.id === side.mlrs), w = g.arms[0].d, ax = g.x - 3500, az = g.z;
  const one = C.addMan($('INF').modern[1][0], 1, ax, az, 0); one.ai = null; one.seenT = S.t;
  ok(!$('pickFire')(g, w), 'one enemy soldier in sight 3.5 km off: no salvo for him');
  for (let i = 0; i < 5; i++) { const m = C.addMan($('INF').modern[1][0], 1, ax + 6 * i, az + 8, 0); m.ai = null; m.seenT = S.t; }
  for (const m of S.men) m.moveT = S.t - 30;   // dug in, still
  const t = $('pickFire')(g, w);
  ok(t && t.man, 'six of them together: the launcher takes them');
  g.ai.wait = 0; g.ai.fm = null; C.run(1, () => { for (const m of S.men) { m.seenT = S.t; m.moveT = S.t - 30; } });
  ok(g.ai.fm && g.ai.fm.n >= w.sal, 'and fires its whole salvo at them (' + (g.ai.fm && g.ai.fm.n) + ' rockets)');
  g.ai.fm = null; for (const m of S.men) m.dead = true;
  const dm = C.fortStart(6, 1, g.x - 4000, g.z + 200, 0); if (dm) C.fortAt(dm, 1);
  A.gT = 0; $('aidGrad')(C0, A);
  ok(dm && !C0.fm.length, 'an enemy dome it does not know: nothing');
  dm.kn = 1; $('aidGrad')(C0, A);
  const M = C0.fm[0];
  ok(M && M.by === g && M.n === w.sal && hd(M, dm) < 1 && logs(S, 0, /saturar a cúpula/).length === 1, 'one it knows: its commander gives the launcher a mission of ' + (M && M.n) + ' rockets on it, to saturate it');
  const D = H.load({ seed: 17, mapv: 5 }); D.$('Net').sap = false; const Sd = field(D, 'modern'); Sd.net = true; Sd.host = true;
  D.spawnColumn(0, 0, 0, 0, 0, r.len - 3000, 1, 0);
  ok(!Sd.units.some(u => u.id === side.mlrs), 'online with a server that does not know the launchers: a howitzer');
}

console.log('-- the economy\'s guard and the quick reaction force --');
{
  const C = H.load({ seed: 18, mapv: 5, eco: true }), $ = C.$, S = C.newState('modern', $('ERAS').modern.sides[0].fighter, { cls: 'plane' });
  S.demo = false; S.over = true; S.units = []; S.planes = []; S.men = []; S.squads = []; S.cmd = [$('cmdOf')(0), $('cmdOf')(1)];
  const lot = S.T.lots.find(l => l.team === 0 && l.k === 'pow' && !S.eco.l.some(e => Math.hypot(e.x - l.x, e.z - l.z) < 10)), e = lot && C.addEco($('ecoSlot')(), 0, 'pow', lot.x, lot.z, lot.a, 1);
  let c = null;   // the economy's AI says two things a look: each is done, as its general's hand does it
  for (let i = 0; i < 6 && !c; i++) for (const o of $('ecoAI')(0, $('ecoView')(0))) { $('ecoCmd')(0, o, 'ai'); if (o.c !== 'def') continue; if (e && o.id === e.id) c = o; }
  ok(e && e.lot >= 0 && c && c.inf >= 1 && c.aa === 1 && /cidade-sede/.test(c.why), 'a site on a lot of the seat town: the economy asks it a guard, a squad and an AA ("' + (c && c.why) + '")');
  const C0 = S.cmd[0], A = $('aidOf')(C0), w = $('aidSeat')(0), q = squad(C, 0, 'base', $('aidQrfPost')(0)); q.mis.why = 'abertura'; until(C, () => q.at, 120);
  const foe = []; for (let i = 0; i < 3; i++) { const m = C.addMan($('INF').modern[1][0], 1, w.x + 250 + 5 * i, w.z + 40, 0); m.ai = null; m.sx = m.x; m.sz = m.z; m.seenT = S.t; foe.push(m); C0.known.push(m); }
  { const fl = squad(C, 0, 'base', $('aidQrfPost')(0)); fl.mis.why = 'piso de segurança: defender a base'; fl.at = true; $('aidQrf')(C0, A, [fl]);
    ok(!fl.qrf && fl.mis.why === 'piso de segurança: defender a base', 'a base squad the general sent on a task of its own (the safety floor) is not taken for the quick reaction force'); fl.live = 0; for (const m of fl.men) m.dead = true; }
  $('aidQrf')(C0, A, [q]);
  const R = q.qrf;
  ok(R && q.ord.k === 'assault' && q.mis.kind === 'defend' && /reação rápida/.test(q.mis.why) && hd(q.ord, foe[0]) < 30, 'three enemy soldiers known by the seat town: the reserve goes as the quick reaction force, mission ' + q.mis.kind + ' ("' + q.mis.why + '")');
  for (const m of foe) m.dead = true;
  S.t += $('AID').qrf.calm + 1; $('aidQrf')(C0, A, [q]); 
  ok(!q.qrf && q.ord.k === 'hold' && hd(q.ord, $('aidQrfPost')(0)) < 1 && q.mis.kind === 'defend' && q.mis.why === 'abertura' && S.rep[0].some(r => r.k === 'done' && r.data.k === 'qrf'), 'calm there for ' + $('AID').qrf.calm + ' s: back to the seat town, in reserve, and it says so');
  q.at = true; for (let i = 0; i < 20; i++) { const m = C.addMan($('INF').modern[1][0], 1, w.x + 200, w.z + 5 * i, 0); m.ai = null; m.sx = m.x; m.sz = m.z; m.seenT = S.t; C0.known.push(m); }
  $('aidQrf')(C0, A, [q]);
  ok(!q.qrf && logs(S, 0, /forte demais/).length === 1, 'a force it cannot stop is left alone, and the journal says why');
  { const on = $('aidQrfOn')(0);
    S.demo = true; S.watch = false; const dem = $('aidQrfOn')(0); S.demo = false;
    S.gctl = [{ seat: 'ai', def: 'human' }, { seat: 'ai', def: 'ai' }]; const hum = $('aidQrfOn')(0); S.gctl = null;
    ok(on && !dem && !hum, 'the reserve moves to the seat town only for an AI-led side outside the hangar demo (ai ' + on + ', demo ' + dem + ', human ' + hum + ')'); }
}

if (SECS) {
  console.log('-- AI × AI, ' + SECS + ' s --');
  for (const era of ['modern']) {
    const C = H.load({ seed: 3, mapv: 5, eco: true }), $ = C.$, S = C.watch(era, {}), mis = new Set();
    C.run(SECS, () => { for (const q of S.squads) if (q.sapT && q.mis) mis.add(q.mis.kind); });
    const L = $('mines')(), P = S.forts.filter(f => f.k >= 3 && f.k <= 5);
    ok([0, 1].every(t => L.some(o => o.team === t)) && mis.has('build'), era + ': both sides\' sappers laid mines (' + [0, 1].map(t => L.filter(o => o.team === t).length).join(' and ') + '), on missions ' + [...mis].join(', '));
    ok([0, 1].every(t => P.some(f => f.team === t && f.prog >= 1 && f.garr)), era + ': both sides built crewed posts: ' + P.filter(f => f.prog >= 1).map(f => f.team + ':' + f.F.name).join(', '));
    ok([0, 1].every(t => S.units.some(u => u.team === t && u.kind === 'art' && u.arms[0].d.sal)), era + ': both sides fielded a rocket launcher');
    ok(!H.nan(S), era + ': no NaN');
  }
}
H.done();
