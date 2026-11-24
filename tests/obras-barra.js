'use strict';
/* The build bar (OBR, cf-pol2-obras: P13 of the polish board, D2 = A): every work the soldier may build in one list, in N's order; the
   keys of the bar pick from it, the last key goes to the next page of a long list, Shift+N goes back; each work N goes through is marked
   on the bar (HESCO and the walls were never marked); the costs, the caps and the help come from the same list */
const H = require('./harness'), ok = H.ok;

function soldier(era, kit, eco) {
  const C = H.load({ seed: 78, eco }), S = C.newState(era, kit, { cls: 'inf', mouse: true });
  C.plan = () => {}; S.waveTimer = 1e9; S.men = S.men.filter(m => m === S.my); S.squads = []; S.units = [];
  const P = S.my, I = S.input, tap = k => { I[k] = true; C.run(.05); I[k] = false; C.run(.05); }, key = q => { P.bq = q; C.run(.05); };
  const at = () => (S.mm && !S.mm.sl ? 'm' + S.mm.k : S.fm ? 'k' + S.fm.k : S.bm ? 'base' : 'closed');
  P.inv = 1e9; S.aim.h = 0; S.aim.p = -.25; C.run(.1);
  return { C, S, P, tap, key, at, $: C.$ };
}
const tag = it => (it.b ? 'base' : it.m !== undefined ? 'm' + it.m : 'k' + it.k);

console.log('-- every work N goes through is on the bar, and marked --');
for (const [era, kit] of [['ww2', 'schutze'], ['modern', 'blueRifle'], ['ww2', 'pionier'], ['modern', 'blueEng']]) {
  let W; try { W = soldier(era, kit); } catch (e) { ok(false, era + ' ' + kit + ': ' + e.message); continue; }
  const { $, P, tap, at } = W, l = $('obrList')(P), cyc = [], marks = [];
  for (let i = 0; i < 30; i++) { tap('build'); const s = at(); if (s === 'closed') break; cyc.push(s); marks.push($('obrCur')(l)); }
  const fk = l.filter(it => it.k).map(it => it.k), sap = !!P.def.sap;
  ok(cyc.join() === l.map(tag).join() && marks.every((m, i) => m === i),
    era + ' ' + kit + ': N goes through the ' + l.length + ' items of the bar in its order, and the one in hand is marked each time (' + cyc.join(' ') + ')');
  ok(fk.includes(11) && fk.includes(12) && fk.includes(13) && fk.includes(8) && fk.includes(6) === (era === 'modern') && fk.includes(7) === sap && fk.includes(10) === sap && l.some(it => it.m === 1) === sap,
    era + ' ' + kit + ': HESCO and the walls, the radio relay, the dome only in its era, the bridges and the mines only for a sapper');
}

console.log('-- the keys of the bar --');
{
  const { $, S, P, tap, key, at } = soldier('ww2', 'schutze'), OBR = $('OBR'), l = $('obrList')(P);
  key({ n: 2 }); const closed = at();
  tap('build'); key({ n: 2 }); const k1 = at(); key({ n: 3 }); const k2 = at(); key({ n: 1 }); const b = at();
  ok(closed === 'closed' && k1 === 'k1' && k2 === 'k2' && b === 'base', 'with the mode closed a key does nothing; open, 2 the trench, 3 the sandbags, 1 the base');
  key({ n: OBR.keys }); const p2 = at(), first2 = tag(l[OBR.page]); key({ n: 2 }); const p2b = at(); key({ n: OBR.keys }); const back1 = at();
  ok(l.length > OBR.keys && p2 === first2 && p2b === tag(l[OBR.page + 1]) && back1 === 'base',
    'a list of ' + l.length + ': ' + OBR.keys + ' goes to the next page (' + p2 + '), its 2 picks its second (' + p2b + '), and ' + OBR.keys + ' on the last page goes back to the first');
  key({ n: 2 }); key({ d: -1 }); const sb = at(); key({ d: -1 }); const out = at();
  ok(sb === 'base' && out === 'closed' && !S.fm && !S.bm, 'Shift+N goes back a work, and from the first it closes the mode');
}
{ // a list whose last page is short (with the camouflage nets a 1944 rifleman's 12 fill two pages; today's 13 leave one on the third)
  const { $, P, tap, key, at } = soldier('modern', 'blueRifle'), OBR = $('OBR'), l = $('obrList')(P);
  tap('build'); for (let p = 0; p < Math.ceil(l.length / OBR.page) - 1; p++) key({ n: OBR.keys });
  const was = at(), pg = $('obrPage')(l, $('obrCur')(l)); key({ n: pg[1] - pg[0] + 1 }); const still = at();
  ok(pg[1] - pg[0] < OBR.page && pg[1] === l.length && still === was, 'on the last page (' + (pg[1] - pg[0]) + ' works) a key past them does nothing (' + still + ')');
}
{
  const { $, P, tap, key, at } = soldier('modern', 'blueEng'), l = $('obrList')(P);
  tap('build'); key({ d: -1 }); key({ d: -1 }); const o = at();
  tap('build'); for (let i = 0; i < l.length - 2; i++) tap('build'); const m0 = at(); key({ d: -1 }); const lastK = at();
  ok(o === 'closed' && m0 === 'm0' && lastK === tag(l[l.length - 3]), 'a sapper: N up to the AT mine, Shift+N back to the last work before the mines (' + lastK + ')');
}

console.log('-- cost, cap and help from the same list --');
{
  const { $, S, P } = soldier('ww2', 'schutze', 1), info = $('obrInfo'), FORT = $('FORT'), BLD = $('BLD'), d = S.eco && S.eco.d[P.team];
  if (!d) ok(false, 'the economy is on in this match');
  else {
    d.en = 1000; d.mt = 1000; const t = info(P, { k: 1 }), b = info(P, { b: 1 });
    d.en = 3; d.mt = 1000; const t2 = info(P, { k: 1 });
    ok(t.c === FORT.trench.cost.join('/') + ' · ' + FORT.trench.time + ' s' && !t.bad && b.c === BLD.cost.join('/') + ' + kit' && t2.bad, 'the trench: ' + t.c + ', red when the side is short (' + t2.c + '); the base: ' + b.c);
    d.en = d.mt = 1000; const n = $('fortCap')(P.team, 2); for (let i = 0; i < n; i++) S.forts.push({ team: P.team, k: 2, pre: false });
    const c = info(P, { k: 2 }); S.forts.length = 0;
    ok(c.c === 'máx.' && c.bad, 'at its cap the sandbags say ' + c.c);
  }
  const hl = $('obrHelp')(P.def);
  ok(/HESCO|Muro de sacos/.test(hl) && /Antena/.test(hl) && /Shift\+N/.test(hl), 'the help names the works of the list: ' + hl.slice(0, 160) + '…');
}
H.done();
