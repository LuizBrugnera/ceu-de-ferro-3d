'use strict';
/* Veterancy (W16): experience from kills, missions and staying alive in contact; the ranks (Recruta, Regular, Veterano, Elite) and what each changes (aim,
   reaction, making out, the breaking point, the pin); rank 0 exactly today's unit; named squads that keep name and experience through a ride; the AI
   general that keeps its veterans (out of assaults when worn, a hurt vehicle back for repair, a hurt aircraft home, their calls weighing more); the
   general's view and MCP state. Then AI battles in both eras (SECS, default 300): units promoted, no NaN */
const H = require('./harness'), ok = H.ok, SECS = +process.env.SECS || 300;
const box = (seed, era) => {
  const C = H.load({ seed: seed || 4 }), $ = C.$, S = C.sandbox(era || 'ww2'), r = S.T.routes[0], mid = r.len / 2;
  S.cmd = [$('cmdOf')(0), $('cmdOf')(1)];
  const at = s => $('routeAt')(r, s);
  const tank = (t, s, o) => C.dispatch(t, { why: 'teste' }, () => Object.assign(C.addUnit('tank', t, 0, 0, S.E.sides[S.fac[t]].tanks[0], false, 0, s, 0, 0), o || {}));
  const truck = (t, s) => C.dispatch(t, { why: 'teste' }, () => C.addUnit('truck', t, 0, 0, null, false, 0, s, 10, 0));
  const squad = (t, s, off) => { const p = at(s); return C.dispatch(t, { kind: 'defend', why: 'teste' }, () => C.addSquad(t, p.x - p.dz * (off || 0), p.z + p.dx * (off || 0), 0, s)); };
  return { C, $, S, r, mid, at, tank, truck, squad };
};
const diary = (S, t) => (S.glog ? S.glog.l[t] : []).map(e => e.s);
const near = (a, b, e) => Math.abs(a - b) < (e || 1e-9);

console.log('-- the ranks: experience, promotion, and rank 0 is today\'s unit --');
{
  const { C, $, S, mid, tank, squad } = box(4), V = $('VET');
  const u = tank(0, mid - 300), q = squad(0, mid, 10), m = q.men[1];
  ok($('vetLvl')(u) === 0 && $('vetK')(u, 'react') === 1 && $('vetK')(u, 'id') === 1 && $('vetK')(u, 'brk') === 1 && $('vetSk')(m) === 0, 'a unit is born a Recruta and nothing about it changes');
  $('vetGain')(u, V.lv[1] - .5);
  ok($('vetLvl')(u) === 0, 'under ' + V.lv[1] + ' points: still a Recruta (' + u.vx + ')');
  $('vetGain')(u, 1);
  ok($('vetLvl')(u) === 1 && !diary(S, 0).some(s => /promovid/.test(s)), 'at ' + V.lv[1] + ': Regular, quietly');
  $('vetGain')(u, V.lv[2] - V.lv[1]);
  ok($('vetLvl')(u) === 2 && diary(S, 0).some(s => /promovido a Veterano/.test(s)), 'at ' + V.lv[2] + ': Veterano, in the general\'s diary: ' + diary(S, 0).find(s => /promovid/.test(s)));
  $('vetGain')(q, V.lv[3]);
  ok($('vetLvl')(q) === 3 && $('vetLvl')(m) === 3 && diary(S, 0).some(s => /^Esquadra \S+ promovida a Elite/.test(s)), 'a squad\'s men have its rank (Elite: ' + diary(S, 0).filter(s => /Elite/.test(s))[0] + ')');
  ok(near($('vetSk')(m), 3 * V.sk) && near($('vetK')(m, 'react'), Math.pow(V.react, 3)) && near($('vetK')(m, 'id'), Math.pow(V.id, 3)) && near($('vetK')(m, 'brk'), Math.pow(V.brk, 3)),
    'an Elite: skill +' + (3 * V.sk).toFixed(2) + ', reaction x' + $('vetK')(m, 'react').toFixed(3) + ', making out x' + $('vetK')(m, 'id').toFixed(3) + ', breaking point x' + $('vetK')(m, 'brk').toFixed(3));
  const e = tank(1, mid + 300); e.ai = e.ai || {}; $('vetGain')(e, 99); e.net = true; const x0 = e.vx; $('vetGain')(e, 5);
  ok(e.vx === x0, 'a unit of another client (net) gains nothing here');
  S.net = true; S.host = false; const x1 = u.vx; $('vetGain')(u, 5); S.net = false;
  ok(u.vx === x1, 'a guest keeps no ranks: they live where the battle is simulated');
}

console.log('-- what a rank changes: reaction, making out, aim, the breaking point, the pin --');
{
  /* the same world twice, the same dice: the observer a Recruta in one, an Elite in the other */
  const twin = elite => {
    const { C, $, S, mid, tank } = box(11), a = tank(0, mid - 900), t = tank(1, mid + 300);
    if (elite) $('vetGain')(a, $('VET').lv[3]);
    let rt = null, idT = null, recT = null;
    C.run(30, () => { a.inv = t.inv = 9; a.hp = a.max; t.hp = t.max; a.ai.tgt = null; a.ctl.fire[0] = a.ctl.fire[1] = false; t.ctl.fire[0] = t.ctl.fire[1] = false; t.ctl.drive = 0;
      const e = $('meter')(a, t); if (e.kn && rt === null && e.rt) rt = e.rt; if (e.rc >= 1 && recT === null) recT = S.t; if (e.ic >= 1 && idT === null) idT = S.t; });
    return { rt, idT, recT, err: $('aimErr')(a, t, 1200) };
  };
  const r = twin(false), v = twin(true), V = { react: Math.pow(.9, 3) };
  ok(r.rt && v.rt && near(v.rt / r.rt, V.react, 1e-6), 'reaction: ' + (r.rt || 0).toFixed(3) + ' s for a Recruta, ' + (v.rt || 0).toFixed(3) + ' s for an Elite (x' + (v.rt / r.rt).toFixed(3) + ')');
  ok(v.idT !== null && (r.idT === null || v.idT < r.idT), 'making out the model: ' + (r.idT === null ? 'not in 30 s' : r.idT.toFixed(1) + ' s') + ' for a Recruta, ' + (v.idT === null ? 'never' : v.idT.toFixed(1) + ' s') + ' for an Elite');
  {
    const { $, mid, tank } = box(12), a = tank(0, mid - 900), t = tank(1, mid + 300); a.skill = .7;
    const e = $('meter')(a, t); Object.assign(e, { kn: true, t: 0, kt: -5, rt: .3, rc: 1, ic: 1 });
    const e0 = $('aimErr')(a, t, 1200); $('vetGain')(a, $('VET').lv[3]); const e3 = $('aimErr')(a, t, 1200);
    ok(e0 > 0 && near(e3 / e0, (1.5 - .7 - .15) / (1.5 - .7), 1e-9), 'aim: the spread of an Elite with skill .7 is that of skill .85 (' + e0.toFixed(4) + ' to ' + e3.toFixed(4) + ' rad)');
  }
  {
    const { $, S, mid, tank } = box(13), u = tank(0, mid - 300), w = tank(0, mid - 320), e1 = tank(1, mid + 300);
    for (const o of [u, w]) { Object.assign($('meter')(o, e1), { kn: true, t: S.t, kt: S.t - 5, rt: .3, v: 1.2, rc: 1, ic: 1 }); o.hp = o.max * .4; }
    $('vetGain')(w, $('VET').lv[3]); $('mindThink')(u); $('mindThink')(w);
    ok(u.mind.k === 'fall' && w.mind.k === 'duty', 'at 40% under fire a Recruta tank breaks off (' + u.mind.k + '), an Elite holds on (' + w.mind.k + '; its breaking point ' + (u.mis.brk * $('vetK')(w, 'brk')).toFixed(2) + ')');
  }
  {
    const { C, $, S, mid } = box(14, 'modern'), p = $('routeAt')(S.T.routes[0], mid);
    const mk = () => C.dispatch(0, { why: 't' }, () => C.addSquad(0, p.x, p.z, 0, mid)), a = mk(), b = mk(); $('vetGain')(b, $('VET').lv[3]);
    for (const q of [a, b]) { for (const m of q.men.slice(2)) C.killMan(m, null); $('squadThink')(q); }
    ok(a.n0 === 6 && a.state === 1 && b.state === 0, 'a squad of 6 down to 2: the Recruta squad routs (state ' + a.state + '), the Elite one does not (' + b.state + ')');
    const m = b.men[0], n = a.men[0]; m.sup = n.sup = S.t + 3.5; C.$('aiMan')(m, 1 / 60); C.$('aiMan')(n, 1 / 60);
    ok(near(n.sup - S.t, 3.5, 1e-6) && near(m.sup - S.t, 3.5 * Math.pow(.85, 3), 1e-6), 'fire pins an Elite soldier ' + (m.sup - S.t).toFixed(2) + ' s, a Recruta ' + (n.sup - S.t).toFixed(2) + ' s');
  }
}

console.log('-- experience: kills, missions, calls met, staying alive in contact, an assault that takes its point --');
{
  const { C, $, S, mid, at, tank, truck, squad } = box(5), X = $('VET').xp;
  const u = tank(0, mid - 300), q = squad(0, mid - 100, 10), e = squad(1, mid + 200, 0), et = tank(1, mid + 500);
  C.killMan(e.men[0], u);
  ok(u.vx === X.man, 'a tank that kills a soldier: ' + u.vx + ' point');
  C.killMan(e.men[1], q.men[2]);
  ok(q.vx === X.man && !q.men[2].vx, 'a soldier\'s kill is his squad\'s (' + q.vx + ')');
  et.hp = 1; C.ruin(et, 50, q.men[1]);
  ok(et.dead && q.vx === X.man + X.tank, 'a tank killed by the squad\'s anti-tank man: ' + X.tank + ' more (' + q.vx + ')');
  const f = squad(0, mid - 50, -10); C.killMan(f.men[0], u);
  ok(u.vx === X.man, 'a friend killed earns nothing (' + u.vx + ')');
  const p = squad(1, mid + 250, 8); C.killMan(p.men[0], null);
  ok(!S.units.concat(S.squads).some(o => o.team === 0 && o.vx > 0 && o !== u && o !== q), 'nor does a death by nobody');
  C.setOrd(q, { k: 'move', ri: 0, s: q.s, x: q.men[0].x, z: q.men[0].z }); const x0 = q.vx || 0; $('rep')(q, 'done', { k: 'move' });
  ok(q.vx - x0 === X.done, 'a mission done (a move reached): ' + X.done + ' points');
  const tr = truck(0, mid - 800), v = tank(0, mid - 600); v.hp = v.max * .3; v.hitT = -99;
  const R = $('helpAsk')(v, 'repair', v, null);
  C.run(40, () => { v.hitT = -99; v.ai.tgt = null; });
  ok(R.st === 'done' && tr.vx >= X.help && tr.vx < X.help + 1, 'a truck that answered a call and met it: ' + tr.vx + ' points');
  const w = tank(0, mid - 1200); w.mind = { k: 'duty', thr: 2, T: S.t }; const w0 = w.vx || 0;
  for (let i = 0; i < 30; i++) { w.mind.T = S.t; $('vetStep')(); }
  ok(near((w.vx || 0) - w0, X.live, 1e-6), 'a minute alive in contact (its mind\'s threat ' + w.mind.thr + '): ' + X.live + ' point');
  const z = tank(0, mid - 1300); z.mind = { k: 'duty', thr: .2, T: S.t }; for (let i = 0; i < 30; i++) { z.mind.T = S.t; $('vetStep')(); }
  ok(!z.vx, '  out of contact: nothing');
  const op = { k: 'atk', st: 'cons', sq: [q, f], over: false, O: { x: 0, z: 0 } }; S.cmd[0].ops.push(op); const q0 = q.vx || 0, f0 = f.vx || 0;
  q.mind = f.mind = null; $('vetStep')(); $('vetStep')();
  ok((q.vx || 0) - q0 === X.take && (f.vx || 0) - f0 === X.take, 'an assault that took its point: ' + X.take + ' to each of its squads, once');
}

console.log('-- named squads: by side and number, through a ride --');
{
  const { C, $, S, mid, at, truck, squad } = box(6);
  const a = squad(0, mid - 200, 0), b = squad(0, mid - 220, 15), c = squad(1, mid + 200, 0);
  const nm = q => $('sqName')(q);
  ok(nm(a) !== nm(b) && /^Esquadra \S/.test(nm(a)) && nm(a) !== nm(c), 'each squad has a name, different on each side: ' + [nm(a), nm(b), nm(c)].join(', '));
  ok(nm(a) === $('sqName')({ team: 0, id: a.id }), 'from its side and number alone: a guest names it the same from its soldiers\' rows');
  ok($('vetName')(0, 17) === $('vetName')(0, 1) + ' II', 'past the list: ' + $('vetName')(0, 17));
  ok($('helpWho')(a).startsWith(nm(a)), 'the calls for help name it: ' + $('helpWho')(a));
  $('vetGain')(b, $('VET').lv[2] + 1); const nb = nm(b), xb = b.vx, idb = b.id;
  const u = truck(0, mid - 230); u.cargo = null;
  for (const m of b.men.slice()) $('boxMan')(u, m);
  C.step(1 / 60);
  ok(u.cargo.length === 5 && !S.squads.includes(b), 'it boards a truck (' + u.cargo.length + ' aboard)');
  const d = squad(0, mid - 400, 0);   // a squad formed meanwhile
  ok(d.id !== idb, '  meanwhile its number is nobody else\'s (a new squad is ' + nm(d) + ')');
  const q = $('dismount')(u);
  ok(nm(q) === nb && q.vx === xb && $('vetLvl')(q) === 2 && q.id === idb, 'and gets out as itself: ' + nm(q) + ', ' + $('VET').rank[$('vetLvl')(q)] + ', ' + q.vx + ' points, number ' + q.id);
  const u2 = truck(0, mid - 230); u2.cargo = null; for (const m of q.men.slice(0, 3)) $('boxMan')(u2, m);
  const q2 = $('dismount')(u2);
  ok(q.live === 2 && q2.id !== q.id && q2.vx === q.vx && new Set(S.squads.filter(o => o.live > 0 && o.team === 0).map(nm)).size === S.squads.filter(o => o.live > 0 && o.team === 0).length,
    'part of it rode, part stayed: the riders get out with its experience under a number and name of their own (' + nm(q2) + '); no two squads share a name');
}

console.log('-- the general keeps its veterans --');
{
  const { C, $, S, mid } = box(7), P = $('cmdObj')(S.cmd[0]), r = S.T.routes[P.ri], sd = -1;
  const sqAt = (i) => { const s = P.s - sd * (400 + i * 60), p = $('routeAt')(r, s); const q = C.dispatch(0, { why: 't' }, () => C.addSquad(0, p.x + i * 8, p.z, P.ri, s)); q.job = 'push'; q.ord = { k: 'hold', ri: P.ri, s }; return q; };
  const qs = [0, 1, 2, 3].map(sqAt);
  $('genCmd = (t, c, by, R) => { globalThis.cap = c; return true; }');
  const atk = () => { $('globalThis.cap = null'); S.cmd[0].atkT = 0; $('cmdAttack')(S.cmd[0], S.squads.filter(q => q.team === 0)); return $('globalThis.cap'); };
  let c = atk();
  ok(c && c.ids.length === 4, 'four fresh squads: all four go into the assault (' + (c && c.ids) + ')');
  $('vetGain')(qs[0], $('VET').lv[2]); C.killMan(qs[0].men[4], null); C.killMan(qs[0].men[3], null); qs[0].live = 3;
  $('vetGain')(qs[1], $('VET').lv[2]); qs[1].live = 5;
  c = atk();
  ok(c && c.ids.length === 3 && !c.ids.includes(qs[0].id) && c.ids.includes(qs[1].id), 'a Veterano squad down to 3 of 5 is kept out; a whole one goes (' + (c && c.ids) + ')');
  ok(diary(S, 0).some(s => /^Preservar Esquadra \S+ \(Veterano\), 3 de 5 homens: fica fora dos assaltos/.test(s)), '  the general says so: ' + diary(S, 0).find(s => /Preservar/.test(s)));
  qs[2].live = 5; const op = { k: 'atk', st: 'go', sq: [qs[1], qs[2]], over: false, O: { x: 0, z: 0, tw: null }, ri: P.ri, fs: P.s }; S.cmd[0].ops.push(op); qs[1].op = qs[2].op = op;
  $('vetStep')();
  ok(op.sq.length === 2, 'under way, whole: it stays in the assault');
  C.killMan(qs[1].men[4], null); C.killMan(qs[1].men[3], null); qs[1].live = 3; $('vetStep')();
  ok(op.sq.length === 1 && !qs[1].op && qs[2].op === op, 'worn in the assault: it is taken out, the other goes on (' + qs[1].ord.k + ')');
  S.gctl = [{ seat: 'p', atk: 'p', def: 'ai', eco: 'ai', sup: 'ai' }, { seat: 'ai', atk: 'ai', def: 'ai', eco: 'ai', sup: 'ai' }];
  const op2 = { k: 'atk', st: 'go', sq: [qs[0]], over: false, O: { x: 0, z: 0 }, ri: P.ri, fs: P.s }; S.cmd[0].ops.push(op2); qs[0].op = op2; $('vetStep')();
  ok(qs[0].op === op2, 'a player who commands the assaults decides for himself: nothing taken out');
}
{
  const { C, $, S, mid, tank, truck } = box(8);
  const v = tank(0, mid), w = tank(0, mid - 40), e1 = tank(1, mid + 500), tr = truck(0, mid - 700);
  for (const o of [v, w]) { Object.assign($('meter')(o, e1), { kn: true, t: S.t, kt: S.t - 5, rt: .3, v: 1.2, rc: 1, ic: 1 }); o.hp = o.max * .62; }
  $('vetGain')(v, $('VET').lv[2]); $('mindThink')(v); $('mindThink')(w);
  ok(v.hq && v.hq.k === 'repair' && v.ai.reloc !== null && !w.hq, 'a Veterano tank at 62% under fire falls back and calls for a repair; a Recruta at 62% fights on');
  ok(diary(S, 0).some(s => /^Preservar .+\(Veterano\): avariado \(62%\), recua para reparo/.test(s)), '  the general says so: ' + diary(S, 0).find(s => /recua para reparo/.test(s)));
  const a = tank(0, mid - 900), b = tank(0, mid - 950); for (const o of [a, b]) { o.hp = o.max * .3; o.hitT = -99; }
  $('vetGain')(b, $('VET').lv[3]);
  const Ra = $('helpAsk')(a, 'repair', a, null), Rb = $('helpAsk')(b, 'repair', b, null);
  ok(Rb.pri > Ra.pri && near(b.mis.pri, a.mis.pri), 'an Elite\'s call weighs more (' + Ra.pri + ' against ' + Rb.pri + '), its mission\'s priority untouched');
  const p = C.dispatch(0, { why: 't' }, () => C.addPlane(S.E.sides[S.fac[0]].fighter, 0, 1000, 800, 0, 0, true, 'fighter')), e2 = C.dispatch(1, { why: 't' }, () => C.addPlane(S.E.sides[S.fac[1]].fighter, 1, 3000, 800, 0, 0, true, 'fighter'));
  Object.assign($('meter')(p, e2), { kn: true, t: S.t, kt: S.t - 5, rt: .3, v: 1.2, rc: 1, ic: 1 }); p.hp = p.def.hp * .55; $('vetGain')(p, $('VET').lv[2]); $('mindThink')(p);
  ok(p.egress > 0 && diary(S, 0).some(s => /volta à base/.test(s)), 'a Veterano fighter at 55% breaks off for home (' + diary(S, 0).find(s => /volta à base/.test(s)) + ')');
}

console.log('-- the general\'s view and its MCP state --');
{
  const { C, $, S, mid, tank, squad } = box(9);
  const q = squad(0, mid - 200, 0), u = tank(0, mid - 500), e = squad(1, mid + 300, 0);
  $('vetGain')(q, $('VET').lv[3]); $('vetGain')(u, $('VET').lv[2]); $('vetGain')(e, $('VET').lv[3]);
  const V = $('genVM')(0, false), eq = V.u.find(x => x.sqd && x.id === q.id && x.t === 0), eu = V.u.find(x => x.t === 0 && x.g === 'arm');
  ok(eq && eq.vl === 3 && eq.nm === $('sqName')(q) && eu && eu.vl === 2 && V.f[0].vet === 2, 'on the general\'s map: the squad Elite (' + (eq && eq.nm) + '), the tank Veterano, 2 veterans in Forças');
  ok(!V.u.some(x => x.t === 1 && x.vl) && V.f[1].vet === undefined, 'the enemy\'s ranks are not shown: nobody told the general');
  const G = $('genState')(0), r = G.sq.find(x => x.id === q.id);
  ok(r && r.nm === $('sqName')(q) && r.rank === 3 && r.xp === $('VET').lv[3] && G.vet.length === 1 && G.vet[0].rank === 2, 'MCP state: squads with name, rank and experience; the veteran vehicles and aircraft (' + JSON.stringify(G.vet[0]) + ')');
}

console.log('-- AI battles: ranks in play --');
for (const [era, mapv, eco] of [['ww2', 1, 0], ['modern', 4, 1]]) {
  const C = H.load({ seed: 21, mapv, eco }), $ = C.$, S = C.watch(era, {});
  let bad = 0;
  C.run(SECS, () => { if (S.t % 10 < 1 / 60) for (const o of [...S.units, ...S.planes, ...S.squads]) { const l = $('vetLvl')(o); if (l && !(o.vx >= $('VET').lv[l])) bad++; } });
  const all = [...S.units, ...S.planes, ...S.squads], n = [0, 0, 0, 0]; for (const o of all) n[$('vetLvl')(o)]++;
  const pro = diary(S, 0).concat(diary(S, 1)).filter(s => /promovid/.test(s));
  ok(n[1] + n[2] + n[3] > 0, era + ': units rise in rank (now ' + n.join(' / ') + ' Recruta / Regular / Veterano / Elite; ' + pro.length + ' promotions to Veterano or Elite in the diaries)');
  ok(!bad, era + ': no rank above its experience');
  ok(!H.nan(S), era + ': no NaN');
}
H.done();
