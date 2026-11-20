'use strict';
/* The start of a match on the screen (cf-pol-hud): the economy's starting sites (the mine, the power plant, the factory, built from the
   first second) are no news, so they put no "… pronta" float over the player's base; a site that ends its work later still does. Before
   the fix every match of the host and of solo play opened with "Fábrica pronta" and "Usina pronta" piled on the target marks */
const H = require('./harness'), ok = H.ok;
for (const [era, id] of [['modern', 'f22'], ['ww2', 'stuka']]) {
  const C = H.load({ seed: 1, eco: true }), S = C.newState(era, id, { cls: 'plane' });
  ok(S.eco && S.eco.l.some(e => e.team === S.me && e.prog >= 1), era + ': the economy starts with sites of the player\'s side built (' + (S.eco ? S.eco.l.length : 0) + ' sites)');
  ok(!S.floats.some(f => / pronta$/.test(f.text)), era + ': no "pronta" float at the start' + (S.floats.length ? ' (' + S.floats.map(f => f.text).join(', ') + ')' : ''));
  const e = S.eco.l.find(e => e.team === S.me);
  C.ecoAt(e, .5); C.ecoAt(e, 1);
  ok(S.floats.some(f => f.text === e.name + ' pronta'), era + ': a site finished later still says so (' + e.name + ' pronta)');
}
H.done();
