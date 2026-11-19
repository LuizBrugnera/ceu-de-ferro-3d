'use strict';
/* The unit's mind (phase F5): beliefs only from the perception ladder, utility over the controllers, the mission's rules of engagement and latitude, and the
   lateral calls for help (fire, clear, repair, ammo, aa, arty, lift): who answers by utility within reach, one open call a unit for 60 s, a refusal or
   nobody going up to the commander, its veto, the helper back to its mission with its report, the commander's diary, and a player's calls and answers.
   Then AI battles in both eras (SECS, default 150): calls asked and answered, every one ending, nothing believed that was not perceived */
const H = require('./harness'), ok = H.ok, SECS = +process.env.SECS || 150;
const box = (seed, era) => {
  const C = H.load({ seed: seed || 4 }), $ = C.$, S = C.sandbox(era || 'ww2'), r = S.T.routes[0], mid = r.len / 2;
  S.cmd = [$('cmdOf')(0), $('cmdOf')(1)];
  const at = s => $('routeAt')(r, s);
  const tank = (t, s, o) => C.dispatch(t, { why: 'teste' }, () => Object.assign(C.addUnit('tank', t, 0, 0, S.E.sides[S.fac[t]].tanks[0], false, 0, s, 0, 0), o || {}));
  const truck = (t, s) => C.dispatch(t, { why: 'teste' }, () => C.addUnit('truck', t, 0, 0, null, false, 0, s, 10, 0));
  const squad = (t, s, off) => { const p = at(s); return C.dispatch(t, { kind: 'defend', why: 'teste' }, () => C.addSquad(t, p.x - p.dz * (off || 0), p.z + p.dx * (off || 0), 0, s)); };
  /* what a unit has made out: its perception meter at that rung (1 detected, 2 class, 3 model), fresh now */
  const know = (a, t, g) => { const e = $('meter')(a, t); Object.assign(e, { kn: true, t: S.t, kt: S.t - 5, rt: .3, v: 1.2, rc: g >= 2 ? 1 : 0, ic: g >= 3 ? 1 : 0, ex: 40, ez: -30, told: false }); return e; };
  return { C, $, S, r, mid, at, tank, truck, squad, know, ds: t => (t ? 1 : -1) };
};
const diary = (S, t) => (S.glog ? S.glog.l[t] : []).filter(e => e.k === 'help').map(e => e.s);

console.log('-- beliefs: what the ladder has, nothing more --');
{
  const { C, $, S, mid, tank, squad, know } = box(4);
  const u = tank(0, mid - 300), e1 = tank(1, mid + 400), q = squad(1, mid + 700, 20);
  $('belief')(u);
  ok(u.bel.size === 0, 'a tank that has perceived nothing believes nothing (' + u.bel.size + ' contacts), whatever is on the map');
  know(u, e1, 1); $('belief')(u); const b1 = u.bel.get(e1);
  ok(b1 && b1.g === 1 && b1.c === '?' && Math.abs(b1.x - e1.x - 40) < 1e-6, 'only detected: "something there", no class, at the ladder\'s error off where it is');
  know(u, e1, 2); $('belief')(u); const b2 = u.bel.get(e1);
  ok(b2.g === 2 && b2.c === 'tank' && b2.x === e1.x && b2.thr > 1, 'recognized: its class (' + b2.c + '), where it is, a threat of ' + b2.thr.toFixed(2));
  const m = q.men[0]; know(q.men[1], u, 3); $('belief')(q);
  ok(q.bel.size === 1 && q.bel.get(u).g === 3 && !q.bel.has(m), 'a squad believes what its men have made out together (' + q.bel.size + ')');
  S.t += 40; $('belief')(u);
  ok(!u.bel.has(e1), 'a contact not made out again for ' + $('MIND').keep + ' s is forgotten');
}

console.log('-- utility: duty, falling back, the rules of engagement, the latitude --');
{
  const { C, $, S, mid, tank, know } = box(5);
  const u = tank(0, mid - 300), e1 = tank(1, mid + 300);
  know(u, e1, 2); $('mindThink')(u);
  ok(u.mind.k === 'duty' && u.mind.sc.duty > $('MIND').w.duty, 'whole and in contact: duty, worth more with the threat (' + u.mind.sc.duty.toFixed(2) + ')');
  u.hp = u.max * .3; know(u, e1, 2); const s0 = u.s; $('mindThink')(u);
  ok(u.mind.k === 'fall' && u.ai.reloc !== null && (u.ai.reloc - s0) * u.ds < 0, 'under its mission\'s break-off strength with a threat near: it falls back along its road (' + Math.round(Math.abs(u.ai.reloc - s0)) + ' m)');
  ok(u.hq && u.hq.k === 'repair', '  and calls for a repair');
  const shots = (o, secs) => { let n = 0; const a = o.arms[0]; const n0 = a.n; C.run(secs, () => { if (!o.dead) { o.hp = o.max; o.inv = 9; } }); return a.n - n0; };
  const v = tank(0, mid - 100), w = tank(1, mid + 100); v.mis.roe = 'hold'; w.mis.roe = 'hold'; v.hp = v.max; e1.dead = true; u.dead = true;
  const nh = shots(v, 12);
  ok(nh === 0 && w.arms[0].n === 0, 'roe hold: two tanks 200 m apart hold their fire (' + nh + ' rounds)');
  v.mis.roe = 'return'; w.mis.roe = 'free';
  const nr = shots(v, 20), hit = v.agg && v.agg.has(w);
  ok(hit && nr > 0 && w.arms[0].n > 0, 'roe return: it answers only once the other has hit it (hit: ' + hit + ', ' + nr + ' rounds back after ' + w.arms[0].n + ')');
  const x = tank(0, mid - 120), y = tank(1, mid + 500); x.mis.roe = 'return'; y.dead = false; w.dead = true; v.dead = true;
  know(x, y, 3); x.ai.tgt = y; const n0 = x.arms[0].n; C.run(6, () => { x.inv = 9; y.inv = 9; });
  ok(x.arms[0].n === n0, 'roe return: a target that has not hit it is left alone');
  const l0 = tank(0, mid - 600, {}); l0.mis.lat = 0; const e2 = tank(1, mid - 100);
  C.run(8, () => { l0.inv = e2.inv = 9; l0.hp = l0.max; e2.hp = e2.max; });
  ok(l0.rail, 'latitude 0: in contact it keeps to its road (rail ' + l0.rail + ')');
}

console.log('-- a call for fire: a pinned squad, the tank on its road answers --');
{
  const { C, $, S, mid, at, tank, squad, know } = box(6);
  const q = squad(0, mid, 15), far = tank(0, mid - 1500), t1 = tank(0, mid - 450), t2 = tank(0, mid - 250), mg = squad(1, mid + 450, -10);
  for (const m of q.men) { m.sup = S.t + 5; know(m, mg.men[1], 2); }
  $('mindThink')(q); const R = q.hq;
  ok(R && R.k === 'fire' && R.st === 'on', 'pinned by what it has made out: it calls for fire HE (' + (R && R.k) + ', ' + (R && R.st) + ')');
  ok(R.resp === t2, 'the nearest tank answers by utility (' + Math.round($('helpUtil')(R, t2) * 100) / 100 + ' against ' + Math.round($('helpUtil')(R, t1) * 100) / 100 + '); the one 1.5 km off cannot (' + $('helpUtil')(R, far).toFixed(2) + ')');
  ok(S.rep[0].some(x => x.k === 'need' && x.data.k === 'fire'), 'the call is reported up as a need');
  ok(diary(S, 0).some(s => /pede fogo HE/.test(s)) && diary(S, 0).some(s => /atende/.test(s)), 'the commander writes it in its diary: ' + diary(S, 0).slice(0, 2).join(' / '));
  ok($('helpAsk')(q, 'aa', at(mid), null) === null, 'one open call a unit: another is not made meanwhile');
  const s0 = t2.s; C.run(6, () => { for (const m of q.men) m.sup = S.t + 5; });
  ok((t2.s - s0) * Math.sign(mid - s0) > 10 && t2.ln, 'the tank drives toward the squad along its road (' + Math.round(t2.s - s0) + ' m) and looks where it was pointed');
  for (const m of mg.men) C.killMan(m, null);
  C.run(6);
  ok(R.st === 'done' && !t2.help && !t2.ai.hs, 'the machine gun is gone: the call is met (' + R.st + '), the tank is free for its mission again');
  ok(S.rep[0].some(x => x.k === 'done' && x.data && x.data.k === 'help' && x.data.need === 'fire' && x.data.ok === 1), '  and reports done');
  const R2 = $('helpAsk')(q, 'fire', at(mid), { x: 0, z: 0 });
  ok(R2 === null, 'the same need again only after ' + $('MIND').ask.again + ' s');
}

console.log('-- latitude, refusal, veto, nobody: up to the commander --');
{
  const { C, $, S, mid, at, tank, squad } = box(7);
  const q = squad(0, mid, 15), a = tank(0, mid - 200), b = tank(0, mid - 350);
  a.mis.lat = 0;
  const R = $('helpAsk')(q, 'fire', at(mid), { x: at(mid + 300).x, z: at(mid + 300).z });
  ok(R.resp === b, 'a tank with latitude 0 does not answer: the other one does');
  b.mind = null; b.ai.tgt = tank(1, mid - 50); b.ai.tgt.inv = 9;
  const e = $('meter')(b, b.ai.tgt); Object.assign(e, { kn: true, t: S.t, kt: S.t - 5, rt: .3, rc: 1, ic: 1 });
  for (const k of [1, 2]) { const o = tank(1, mid - 60 - k * 20); Object.assign($('meter')(b, o), { kn: true, t: S.t, kt: S.t - 5, rt: .3, rc: 1, ic: 1 }); }
  R.u = .2; $('mindThink')(b);
  ok(b.mind.k === 'duty' && R.resp !== b && R.tried.has(b), 'a fight of its own worth more than the call: it drops it (duty ' + b.mind.sc.duty.toFixed(2) + ')');
  ok(R.st === 'up' && S.rep[0].some(x => x.k === 'need' && x.data.up === 1), 'nobody else near: the call goes up to the commander');
  ok(diary(S, 0).some(s => /não pode mais/.test(s)) && diary(S, 0).some(s => /sobe ao comando/.test(s)), '  both in the diary');
  const c = tank(0, mid - 300); S.t += 6; $('helpTick')();
  ok(R.resp === c && R.st === 'on', 'still open: a tank that comes within reach later takes it');
  const q2 = squad(0, mid + 60, -15), g = squad(0, mid + 230, 25), o = tank(0, mid + 250);
  g.mis.kind = 'garrison';
  const R2 = $('helpAsk')(o, 'clear', o, null);
  ok(R2.resp === q2 && R2.tried.has(g) && diary(S, 0).some(s => /guarnição não deixa o posto/.test(s)), 'the commander vetoes the garrison (it does not leave its post); the other squad answers');
  ok(q2.ord.k === 'assault' && q2.mis.kind === 'attack', '  with an order of the moment (' + q2.ord.k + '), its mission following it');
  S.cmd[0].hveto = { aa: 1 };
  const t3 = tank(0, mid + 900), aa = C.dispatch(0, { why: 't' }, () => C.addUnit('aa', 0, 0, 0, S.E.sides[S.fac[0]].aa, false, 0, mid + 1100, 0, 0));
  const R3 = $('helpAsk')(t3, 'aa', t3, null);
  ok(R3.st === 'up' && !aa.help, 'the general\'s veto on calls for AA cover holds the AA vehicle back');
  S.t += 70; $('helpTick')();
  ok(R3.st === 'gone' && !t3.hq && diary(S, 0).some(s => /venceu/.test(s)), 'after ' + $('MIND').ask.life + ' s a call that nobody met lapses');
  R2.by.dead = true; $('helpTick')();
  ok(R2.st === 'gone' && q2.ord.k !== 'assault' && !q2.help, 'the asker lost: the call is over and the squad goes back to its own order (' + q2.ord.k + ')');
}

console.log('-- repair and ammo, indirect fire, a lift --');
{
  const { C, $, S, mid, at, tank, truck, squad } = box(8);
  const u = tank(0, mid), tr = truck(0, mid - 400); u.hp = u.max * .3; u.hitT = -99;
  const R = $('helpAsk')(u, 'repair', u, null);
  ok(R.resp === tr, 'a hurt tank calls for a repair: the empty truck on its road answers');
  C.run(40, () => { u.hitT = -99; u.ai.tgt = null; });
  ok(R.st === 'done' && u.hp >= u.max * .9 && !tr.help, 'the truck comes and mends it as a supply base does (hp ' + Math.round(u.hp / u.max * 100) + '%), then is free');
  const a = u.arms[0]; a.ammo = 1; const R2 = $('helpAsk')(u, 'ammo', u, null);
  C.run(15, () => { u.ai.tgt = null; });
  ok(R2 && R2.resp === tr && (R2.st === 'done' || a.ammo > 1), 'out of rounds: the truck rearms it (' + a.ammo + ' of ' + a.d.ammo + ')');
  const art = C.dispatch(0, { why: 't' }, () => C.addUnit('art', 0, 0, 0, S.E.sides[S.fac[0]].art, false, 0, mid - 1800, 0, 0)), ob = squad(0, mid + 200, 20), tgt = at(mid + 1100);
  const R3 = $('helpAsk')(ob, 'arty', at(mid + 200), { x: tgt.x, z: tgt.z });
  ok(R3.resp === art && R3.fm && R3.fm.by === art && S.cmd[0].fm.includes(R3.fm), 'an observer calls for indirect fire: the battery takes a fire mission on the point (' + (R3.fm ? Math.round(R3.fm.x) + ', ' + Math.round(R3.fm.z) : R3.st) + ')');
  const n0 = art.arms[0].n; C.run(40);
  ok(art.arms[0].n > n0, '  and fires it (' + (art.arms[0].n - n0) + ' rounds)');
  const tr2 = truck(0, mid - 1000), sq = squad(0, mid - 900, 12);
  C.setOrd(sq, { k: 'hold', ri: 0, s: mid + 1400, x: at(mid + 1400).x, z: at(mid + 1400).z });
  sq.fd = 1e9; $('mindThink')(sq); const R4 = sq.hq;
  ok(R4 && R4.k === 'lift' && R4.resp === tr2, 'a squad on foot whose post lies ' + Math.round(sq.ord.s - sq.s) + ' m along its road calls for a lift: the empty truck answers');
  let rode = false; C.run(150, () => { if (tr2.cargo && tr2.cargo.length) rode = true; return R4.st !== 'done'; });
  const there = S.squads.find(q => q.live > 0 && Math.abs(q.s - (mid + 1400)) < 400 && q !== sq);
  ok(rode && R4.st === 'done' && !tr2.run && !tr2.dead, 'it takes it aboard and lets it off near its post (rode ' + rode + ', ' + R4.st + '); the truck stays in the battle');
  ok(!!there && there.ord && there.ord.k === 'hold', '  the squad, off, keeps its order (' + (there && there.ord.k) + ' at ' + (there && Math.round(there.s - mid)) + ')');
}

console.log('-- a player: his calls and his answers --');
{
  const C = H.load({ seed: 9 }), $ = C.$, S = C.newState('ww2', 'pz4', { cls: 'tank' }), P = S.my;
  S.over = true; S.units = S.units.filter(u => u === P); S.squads = []; S.men = []; S.planes = []; S.cmd = [$('cmdOf')(0), $('cmdOf')(1)];
  const rp = $('railOf')(P.x, P.z), r = S.T.routes[rp.ri], ds = P.team ? 1 : -1, q = C.dispatch(P.team, { why: 't' }, () => { const p = $('routeAt')(r, rp.s + 150 * ds); return C.addSquad(P.team, p.x, p.z, rp.ri, rp.s + 150 * ds); });
  const m = $('helpMine')(P, P.x, P.z);
  ok(m.k === 'clear', 'a player in a whole tank calls for infantry round it (' + m.k + ')');
  const R = $('helpCall')(P, m.k, P.x, P.z);
  ok(R && R.resp === q && q.ord.k === 'assault', 'the squad near answers, by the same way as for the AI');
  ok($('helpRows')(P.team, P).some(x => x[0] === R.id && x[5] === 1 && x[4] === 1), 'it is on his radio as his own, answered by the AI');
  const u2 = C.dispatch(P.team, { why: 't' }, () => C.addUnit('tank', P.team, 0, 0, S.E.sides[S.fac[P.team]].tanks[0], false, rp.ri, rp.s + 400 * ds, 0, 0));
  u2.hp = u2.max * .3; const R2 = $('helpAsk')(u2, 'repair', u2, null);
  ok(R2 && R2.st === 'up' && $('helpRows')(P.team, P).some(x => x[0] === R2.id && !x[5]), 'an AI tank\'s call that nobody of the AI can answer is on the player\'s radio');
  ok($('helpTake')(R2, P) && R2.pl === P, 'he answers it (8)');
  P.x = u2.x + 20; P.z = u2.z; $('helpTick')();
  ok(R2.st === 'done' && diary(S, P.team).some(s => /atende pelo rádio/.test(s)), 'and when he is there the call is met; the diary has it');
}

console.log('-- online: the host takes a guest\'s call and answer; a guest reads its side\'s calls --');
{
  const { C, $, S, mid, at, tank, squad } = box(10);
  const N = $('Net'), q = squad(0, mid, 10), g = q.men[0], sent = [];
  S.net = true; S.host = true; N.hlp = true; N.ghosts.set(7, g); g.pid = 7; N.send = (t, m) => sent.push(Object.assign({ t }, m));
  const t1 = tank(0, mid - 250), p = at(mid + 300);
  N.rx.hask({ from: 7, k: 0, p: [g.x, g.z], q: [p.x, p.z] });
  const R = S.help && S.help.l[0];
  ok(R && R.k === 'fire' && R.pid === 7 && R.resp === t1, 'a guest\'s call (hask) is made on the host for him, and the AI answers it');
  N.helps(); const m0 = sent.find(m => m.t === 'hlp' && m.s === 0);
  ok(m0 && m0.e.some(r => r[0] === R.id && r[1] === 0 && r[4] === 1 && r[5] === 7) && sent.some(m => m.t === 'hlp' && m.s === 1 && !m.e.length), 'the host sends each side its open calls (hlp), the asker\'s player id with his');
  const u2 = tank(0, mid + 600); u2.hp = u2.max * .3; const R2 = $('helpAsk')(u2, 'repair', u2, null), h = squad(0, mid + 650, 12).men[0];
  N.ghosts.set(8, h); h.pid = 8; N.rx.hacc({ from: 8, id: R2.id });
  ok(R2.pl === h && R2.pid === 8, 'a guest answers a call (hacc): the host marks him as its helper');
  S.host = false; N.id = 7; N.rx.hlp({ s: 0, e: [[R.id, 0, 1, 2, 1, 7], [R2.id, 2, 3, 4, 2, 8]] });
  const rows = $('helpRows')(0, g);
  ok(rows.length === 2 && rows[0][5] === 1 && rows[1][5] === 0, 'a guest reads its side\'s calls from the host, his own marked');
  S.net = false;
}

console.log('-- AI battles: the calls in play --');
for (const [era, mapv, eco] of [['ww2', 1, 0], ['modern', 4, 1]]) {
  const C = H.load({ seed: 21, mapv, eco }), $ = C.$, S = C.newState(era, C.$('ERAS')[era].sides[0].fighter, { cls: 'plane' });
  let lie = 0, n = 0;
  C.run(SECS, () => {
    const P = S.my; if (P) { P.inv = 9; P.dead = false; P.y = 3000; P.v.y = 0; P.hp = P.def.hp; } S.lives = 9;
    if (++n % 120) return;
    for (const l of [S.units, S.squads, S.planes]) for (const o of l) if (o.bel) for (const [t, b] of o.bel) {   // every fresh belief has an eye behind it that knows
      if (S.t - b.t > .01) continue;
      const eyes = o.men ? o.men : [o]; if (!eyes.some(m => m.pm && m.pm.get(t) && m.pm.get(t).kn)) lie++;
    }
  });
  const HL = $('helps')(), L = HL.l, k = {}, st = {};
  for (const R of L) { k[R.k] = (k[R.k] || 0) + 1; st[R.st] = (st[R.st] || 0) + 1; }
  const minds = { duty: 0, fall: 0, help: 0 }; for (const l of [S.units, S.squads, S.planes]) for (const o of l) if (o.mind) minds[o.mind.k]++;
  ok(HL.n >= 3 && L.some(R => R.resp || R.pl), era + ': the units call for help and others answer (' + HL.n + ' calls: ' + JSON.stringify(k) + ', ' + JSON.stringify(st) + ')');
  ok(L.every(R => R.st === 'done' || R.st === 'gone' || S.t - R.T0 <= $('MIND').ask.life + 1), era + ': no call outlives its ' + $('MIND').ask.life + ' s');
  ok(!lie, era + ': nothing believed that its eyes did not perceive (' + lie + ')');
  ok(Object.values(minds).reduce((a, b) => a + b) > 20, era + ': the minds at work now: ' + JSON.stringify(minds));
  ok(!H.nan(S), era + ': no NaN');
}
H.done();
