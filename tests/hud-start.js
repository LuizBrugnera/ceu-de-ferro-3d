'use strict';
/* The start of a match on the screen (cf-pol-hud): the economy's starting sites (the mine, the power plant, the factory, built from the
   first second) are no news, so they put no "… pronta" float over the player's base; a site that ends its work later still does. Before
   the fix every match of the host and of solo play opened with "Fábrica pronta" and "Usina pronta" piled on the target marks.
   The General's view with three sides: the points held of every side (genVM's held), not only of the first two.
   The side's name in a sentence: "pelos EUA", "dos EUA" (the briefings and the picker said "pela EUA", "outro da EUA") */
const H = require('./harness'), ok = H.ok;
for (const [era, id] of [['modern', 'f22'], ['ww2', 'stuka']]) {
  const C = H.load({ seed: 1, eco: true }), S = C.newState(era, id, { cls: 'plane' });
  ok(S.eco && S.eco.l.some(e => e.team === S.me && e.prog >= 1), era + ': the economy starts with sites of the player\'s side built (' + (S.eco ? S.eco.l.length : 0) + ' sites)');
  ok(!S.floats.some(f => / pronta$/.test(f.text)), era + ': no "pronta" float at the start' + (S.floats.length ? ' (' + S.floats.map(f => f.text).join(', ') + ')' : ''));
  const e = S.eco.l.find(e => e.team === S.me);
  C.ecoAt(e, .5); C.ecoAt(e, 1);
  ok(S.floats.some(f => f.text === e.name + ' pronta'), era + ': a site finished later still says so (' + e.name + ' pronta)');
}
{
  const C = H.load({ seed: 2, mapv: 9 }), S = C.newState('modern', 'f22', { cls: 'plane', N: 3 }), V = C.genVM(0);
  ok(S.cq.ps.length === 3 && V.held && V.held.length === 3 && V.tk === undefined, 'three sides: the view has the points of the three (' + JSON.stringify({ held: V.held }) + ')');
}
{
  const C = H.load({}), da = C.$('daDe'), pela = C.$('pelaDe'), got = [da('EUA'), da('Rússia'), da('Insurgentes'), pela('EUA'), pela('Aliados'), pela('Luftwaffe'), pela('Rússia')];
  ok(got.join('|') === 'dos EUA|da Rússia|dos Insurgentes|pelos EUA|pelos Aliados|pela Luftwaffe|pela Rússia', 'the side\'s name with its article: ' + got.join(', '));
  for (const [era, sides] of Object.entries(C.$('ERAS'))) for (const sd of sides.sides) ok(/^(da|dos) /.test(da(sd.name)) && /^(pela|pelos) /.test(pela(sd.name)), era + ': ' + da(sd.name) + ', ' + pela(sd.name));
}
H.done();
