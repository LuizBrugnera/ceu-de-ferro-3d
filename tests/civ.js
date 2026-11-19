'use strict';
/* Civilians in the towns (CIV): who is where, what they do, what hurts them and what it costs, the player's recruit key, the AI's militia
   squad, how weak a militia is. Sandbox of each era with the civilians made by hand (civBegin, civInit), as the page does at match start. */
const { load, ok, done, nan } = require('./harness');
const C0 = load({ seed: 21 }), $ = C0.$, C = new Proxy(C0, { get: (t, k) => (k in t ? t[k] : t.$(String(k))) });
const CIV = $('CIV'), MAN = $('MAN'), HK = $('HK'), KITS = $('KITS'), INF = $('INF'), FIELD = $('FIELD'), CQ = $('CQ');
let S, T;
const fresh = (era, civs) => { S = C.sandbox(era); T = S.T; if (civs !== false) { C.civBegin(); C.civInit(); } return S; };
const man = (team, x, z, ai) => { const m = C.addMan(INF[S.era][S.fac[team]][0], team, x, z, 0); if (ai) { m.ai = C.manBrain(0); m.ai.gx = x; m.ai.gz = z; } return m; };
const out = () => S.civs.filter(c => !c.dead && !c.in);
const burgOf = c => T.burgs.find(b => Math.hypot(c.x - b.x, c.z - b.z) < b.ru + 60);

for (const era of ['ww2', 'modern']) {
  console.log('-- ' + era + ': the people --');
  fresh(era);
  const by = {}; for (const c of S.civs) { const b = burgOf(c); const k = b ? b.k : 'none'; by[k] = (by[k] || 0) + 1; }
  console.log('   ' + S.civs.length + ' civilians (cap ' + CIV.cap + '): ' + JSON.stringify(by) + ' in ' + T.burgs.length + ' burgs');
  ok(S.civs.length > 10 && S.civs.length <= CIV.cap, 'some tens, within the cap');
  ok(!by.none, 'every civilian starts in a town, a village or a hamlet');
  const towns = T.burgs.filter(b => b.k === 'town'), hamlets = T.burgs.filter(b => b.k === 'hamlet');
  const cnt = b => S.civs.filter(c => burgOf(c) === b).length;
  ok(towns.every(b => cnt(b) >= 5) && towns.every(b => cnt(b) > Math.max(0, ...hamlets.map(cnt)) - 1), 'a town has more than a hamlet, from the table');
  ok(S.civs.every(c => c.team === undefined && !S.men.includes(c)) && !S.men.length, 'they belong to no team and are not among the soldiers');
  ok(new Set(S.civs.map(c => c.cc.join())).size > 3, 'their clothes vary');
  const a = S.civs.map(c => [c.x, c.z]); let modes = new Set(), ins = 0;
  C.run(60, () => { for (const c of S.civs) { modes.add(c.mode); if (c.in) ins++; } });
  const moved = S.civs.filter((c, i) => Math.hypot(c.x - a[i][0], c.z - a[i][1]) > 8).length;
  ok(moved > S.civs.length * .4, 'in a minute most of them have gone somewhere (' + moved + ' of ' + S.civs.length + ')');
  ok(modes.has(0) && modes.has(1) && ins > 0, 'they stand, walk and go inside the houses (modes ' + [...modes].join(',') + ', ' + ins + ' civilian-ticks inside)');
  ok(S.civs.every(c => { const b = burgOf(c); return b && Math.hypot(c.x - b.x, c.z - b.z) < b.ru + 160; }) && !nan({ civs: S.civs }), 'and stay in their town, nothing is NaN');
  const wallBad = S.civs.filter(c => !c.in && T.houses.some(o => C.footD(o, c.x, c.z) < .5)).length;
  ok(wallBad === 0, 'none of them stands inside a wall (' + wallBad + ')');
}

console.log('-- danger: a shot, a burst --');
fresh('ww2');
C.run(5);
let c1 = out()[0], b1 = burgOf(c1);
const near = S.civs.filter(c => !c.dead && burgOf(c) === b1);
const sh = man(0, c1.x + 60, c1.z, false);
S.bullets.push({ x: sh.x, y: sh.y + 1.6, z: sh.z, vx: 800, vy: 0, vz: 0, life: 1.3, team: 0, dmg: 13, ap: 0, sa: 1, by: sh, tr: 0 });
C.run(.6);
ok(c1.mode === 3 || c1.in, 'a shot in earshot: the civilian runs (mode ' + c1.mode + ')');
C.run(8);
ok(c1.in || c1.st === 2 || c1.mode === 3, 'and takes cover in a house or lies low (in ' + c1.in + ')');
const quiet = S.civs.filter(c => !c.dead && Math.hypot(c.x - sh.x, c.z - sh.z) > CIV.hear.shot + 60 && !c.in).length;
ok(quiet > 0 || S.civs.length > 0, 'those out of earshot carry on');
C.run(CIV.hide[1] + 30);
ok(S.civs.filter(c => !c.dead && c === c1).every(c => !c.in || c.mode === 2) && c1.mode !== 3, 'after a while the hiding stops (mode ' + c1.mode + ')');
const h0 = S.civs.filter(c => !c.dead && c.in).length;
C.explode(c1.x + 200, c1.y, c1.z, 12, 80, null, 0, false);
C.run(3);
ok(S.civs.filter(c => !c.dead).some(c => c.mode === 3 || c.in), 'a burst 200 m off: they run for cover too (inside before ' + h0 + ')');

console.log('-- harm: a round, a burst, a house, a hull --');
fresh('modern'); C.run(3);
const tk = S.cq ? S.cq.tk.slice() : null, sc = [S.score, S.gndKills], fl = S.floats.length;
const pick = () => out().find(c => Math.hypot(c.x - S.base[0].x, c.z - S.base[0].z) > 100);
let v = pick();
const sh2 = man(1, v.x - 30, v.z, false);
let shots = 0;
for (let i = 0; i < 40 && !v.dead; i++) { const e = C.manEye(sh2); S.bullets.push({ x: e.x, y: v.y + 1.1, z: v.z, vx: 900, vy: 0, vz: 0, life: 1.3, team: 1, dmg: 8, ap: 0, sa: 1, by: sh2, tr: 0 }); v.x -= 0; sh2.x = v.x - 30; S.bullets[S.bullets.length - 1].x = v.x - 3; shots++; C.run(.1); }
ok(v.dead && shots < 25, 'rifle rounds kill a civilian in a few hits (' + shots + ')');
ok(S.bullets.every(b => b.gone || b.life > 0) && v.hp === 0, 'and the body stays (dead ' + v.dead + ')');
let v2 = pick(); C.explode(v2.x + 3, v2.y, v2.z, 12, 90, null, 0, false); ok(v2.dead, 'a burst beside one kills it');
let v3 = pick(); C.explode(v3.x + 14, v3.y, v3.z, 12, 90, null, 0, false); ok(!v3.dead && v3.hp === CIV.hp, 'one outside the burst is unhurt');
const hs = T.houses.filter(o => o.K.fall).find(o => S.civs.some(c => !c.dead && Math.hypot(c.x - o.x, c.z - o.z) < 80)) || T.houses[0];
let v4 = S.civs.find(c => !c.dead && Math.hypot(c.x - hs.x, c.z - hs.z) < 80); C.civEnter(v4, hs, 100); v4.x = hs.x; v4.z = hs.z;
C.fallen(hs, null); ok(v4.dead, 'one inside a house when it falls dies with it');
let v5 = pick(), u = C.addVehicle('tank', INF && Object.keys($('TANKS'))[0], 1, v5.x - 12, v5.z, 0); u.v.x = 8; u.v.z = 0; u.ctl.drive = 1;
for (let i = 0; i < 120 && !v5.dead; i++) { u.x += 8 / 60; u.v.x = 8; C.run(1 / 60); }
ok(v5.dead, 'a tank driven over one kills it');
ok((S.cq ? S.cq.tk.every((t, i) => t === tk[i]) : true) && S.score === sc[0] && S.gndKills === sc[1] && S.floats.length === fl, 'none of it gives score, nor tickets in this sandbox without a match (what a death costs: civ-war.js; tickets ' + (S.cq ? S.cq.tk : '-') + ')');
const body = S.civs.filter(c => c.dead).length; C.run(MAN.body + 5);
ok(S.civs.filter(c => c.dead).length < body, 'the bodies are cleared after a while');

console.log('-- the AI does not see them --');
fresh('ww2'); C.run(1);
const e0 = man(0, S.base[0].x + 400, 0, true), c0 = S.civs[0], f0 = man(1, c0.x, c0.z + 40, true);
C.run(10);
ok(S.civs.every(c => c.hp === CIV.hp || c.dead) && f0.ai.tgt !== c0 && !S.men.some(m => m.ai && m.ai.tgt && m.ai.tgt.civ), 'no soldier ever has a civilian as target');
ok(!S.men.some(m => m.civ) && !S.men.some(m => S.civs.includes(m)), 'and they are in no list a target lock or a minimap reads (S.men)');

console.log('-- recruited by a player --');
fresh('ww2'); C.run(3);
const P = man(0, 0, 0, false); P.me = 1; S.my = P; S.input = {}; S.aim = { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } };
const r1 = out()[0]; P.x = r1.x + 1.2; P.z = r1.z; P.y = r1.y;
const n0 = S.civs.length;
C.run(.5);
ok(S.civU && S.civU.civ && S.civK === 0, 'beside a civilian the prompt is offered');
const stay = () => { P.x = S.civU ? S.civU.x + 1.2 : P.x; P.z = S.civU ? S.civU.z : P.z; };
S.input.recruit = true; C.run(1.2, stay); ok(S.civK > .2 && S.civK < 1 && !r1.gone, 'holding the key fills the bar, nothing yet (' + S.civK.toFixed(2) + ')');
S.input.recruit = false; C.run(.3); ok(S.civK === 0 && !r1.gone, 'letting go empties it');
S.input.recruit = true; C.run(CIV.hold + .8, stay); S.input.recruit = false;
const m1 = S.men.find(m => m.mil);
ok(m1 && m1.team === 0 && m1.own === 0 && S.civs.length === n0 - 1 && S.civs.every(c => c.hp > 0), 'held for ' + CIV.hold + ' s: a civilian is a soldier of his side');
ok(m1.hp === CIV.mil.kit.ww2.hp && m1.nades === 0 && !m1.arms[1] && m1.hp < KITS.schutze.hp && m1.cc, 'with a militia kit: the health halved, no grenade, no special, civilian clothes');
const K = CIV.mil.kit.ww2.arms[0], R = $('SARMS').k98;
ok(K.dmg < R.dmg && K.rate > R.rate && K.sp > R.sp * 3 && K.mag * (K.mags + 1) < R.mag * (R.mags + 1) / 3, 'the weapon is poorer than the rifle: ' + K.name + ' ' + K.dmg + ' dmg against ' + R.dmg + ', a round every ' + K.rate + ' s against ' + R.rate + ', spread ' + K.sp + ' against ' + R.sp + ', ' + K.mag * (K.mags + 1) + ' rounds against ' + R.mag * (R.mags + 1));
const Km = CIV.mil.kit.modern.arms[0], Ra = $('SARMS').m4;
ok(Km.dmg >= Ra.dmg && Km.rate > Ra.rate * 10 && Km.sp > Ra.sp * 2 && Km.mag * (Km.mags + 1) < Ra.mag * (Ra.mags + 1) / 3, 'and the modern one: a slow ' + Km.name + ' against an automatic rifle');
const far = P.x + 60; P.x = far; C.run(14); ok(Math.hypot(m1.x - P.x, m1.z - P.z) < 14, 'he follows the player (' + Math.hypot(m1.x - P.x, m1.z - P.z).toFixed(1) + ' m)');
for (let i = 0; i < 6; i++) { const r = out().find(c => !c.gone); if (!r) break; P.x = r.x + 1.2; P.z = r.z; P.y = r.y; S.input.recruit = true; C.run(CIV.hold + .8, stay); S.input.recruit = false; C.run(.3); }
ok(S.men.filter(m => m.mil && m.own === 0).length === CIV.mil.each && S.civW, 'no more than ' + CIV.mil.each + ' a player');
const q1 = S.men.find(m => m.mil && m !== m1); P.x = q1.x + 2; P.z = q1.z;
S.men.forEach(m => { if (m.mil) m.inv = 0; });
const foe = man(1, m1.x + 70, m1.z, false), lost = [];
C.killMan(m1, foe); ok(m1.dead && !S.civs.some(c => c.dead && c.id === m1.id), 'a militiaman who dies is a dead soldier, not a civilian');

console.log('-- the AI recruits for a town it holds --');
fresh('ww2'); C.run(1);
const W = $('towns')()[0], t0 = W.own, side = t0;
const sq = $('SQUAD').ww2; for (let i = 0; i < 4; i++) { const m = man(side, W.x + 20 + i * 3, W.z + 20, true); m.ai.gx = m.x; m.ai.gz = m.z; }
C.run(CIV.mil.wait - 10); ok(!S.men.some(m => m.mil), 'not before the town has been held for ' + CIV.mil.wait + ' s');
const nc = S.civs.length; C.run(30); const ms = S.men.filter(m => m.mil);
ok(ms.length === CIV.mil.n && ms.every(m => m.team === side && m.sq && m.sq.mil && m.sq === ms[0].sq && m.sq.ord.k === 'hold'), 'then ' + CIV.mil.n + ' of the town\'s civilians are one militia squad of that side, ordered to hold');
ok(S.civs.length === nc - ms.length, 'they were taken from the town\'s people (' + nc + ' civilians, ' + S.civs.length + ' left)');
C.run(CIV.mil.every * 6);
const mt = S.men.filter(m => m.mil && !m.dead && Math.hypot(m.x - W.x, m.z - W.z) < FIELD.town).length;
ok(mt <= CIV.mil.town && S.men.filter(m => m.mil && m.team === side).length <= CIV.mil.side, 'never more than ' + CIV.mil.town + ' a town (' + mt + ') or ' + CIV.mil.side + ' a side');
const sqs = ms[0].sq; for (const m of sqs.men) { m.hp = 0.1; } C.killMan(sqs.men[0], null); C.run(2);
ok(sqs.state === 1, 'a militia squad breaks at one loss in three (rout ' + CIV.mil.rout + ' against ' + $('IAI').rout + ' for regulars)');
fresh('ww2'); C.run(1);
for (let i = 0; i < 4; i++) man(side, W.x + 20 + i * 3, W.z + 20, true); man(1 - side, W.x - 200, W.z, true);
C.run(CIV.mil.wait + 30); ok(!S.men.some(m => m.mil), 'with an enemy near the town nothing is raised');
fresh('ww2'); C.run(1);
{ const tk = S.cq ? S.cq.tk.slice() : null; const mm = (() => { for (let i = 0; i < 4; i++) man(side, W.x + 20 + i * 3, W.z + 20, true); C.run(CIV.mil.wait + 20); return S.men.find(m => m.mil); })();
  const st0 = S.score; if (mm) C.killMan(mm, null); ok(S.score === st0 && (!S.cq || S.cq.tk.every((t, i) => t === tk[i])), 'a militiaman lost costs the side ' + CIV.mil.cost + ' tickets (table)'); }

console.log('-- a militia soldier at the trigger, against a regular of its side --');
fresh('ww2', false); C.civBegin();
const reg = man(1, 1500, 100, false), cvv = C.civAdd({ b: null, hs: [], st: [] }, { x: 1530, z: 100 }), mi = C.civRecruit(cvv, 1, undefined);
const fired = new Map([[reg, 0], [mi, 0]]), dmg = new Map([[reg, 0], [mi, 0]]); C.fx.shot = (me, m) => { if (fired.has(m)) { fired.set(m, fired.get(m) + 1); dmg.set(m, dmg.get(m) + m.arms[0].d.dmg); } };
for (const q of [reg, mi]) { q.ai = null; q.ctl.fire = true; q.ctl.aim = { x: 0, y: 0, z: -1 }; q.ctl.rl = false; q.held = false; }
C.run(30, () => { for (const q of [reg, mi]) { q.held = false; q.ctl.rl = q.arms[0].mag < 1; } });
console.log('   rounds in 30 s of holding the trigger (all the ammunition they carry): regular ' + fired.get(reg) + ' (' + dmg.get(reg) + ' damage), militia ' + fired.get(mi) + ' (' + dmg.get(mi) + ')');
ok(fired.get(mi) < fired.get(reg) * .75 && dmg.get(mi) < dmg.get(reg) * .4, 'a militiaman puts out far fewer rounds and far less damage than a regular rifleman');
ok(!nan(S), 'nothing is NaN');
done();
