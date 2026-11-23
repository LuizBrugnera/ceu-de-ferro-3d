'use strict';
/* tougher bridges (the captain: "deixe as pontes mais resistentes"): three times the hp they had (600/450/300 by road class, the new permanent
   bridge 1500), so a single bomb or a few shells no longer drop one, while a concentrated attack still does; a weapon's damage to anything else
   is as before (OBJD untouched), and a demolition takes the same charges it did */
const H = require('./harness'), { ok, done } = H;
const g = H.load({ mapv: 5, seed: 7 }), $ = g.$;
const BR = $('BR'), OB = $('OBJD'), OBJ = $('OBJ');
ok(BR.hp.join() === '1800,1350,900,750' && OBJ.nbridge.hp[0] === 4500, 'bridges: ' + BR.hp.join('/') + ' hp by road class (were 600/450/300/250), a new bridge ' + OBJ.nbridge.hp[0] + ' (was 1500)');
ok(OB.he.blast === 1 && OB.bomb.blast === 1 && OB.rocket.blast === 1 && OB.agm.blast === 1 && OB.shell.blast === .3 && OB.sa === .004, 'the weapons\' share against objects is unchanged');
ok(BR.hp.map(h => Math.ceil(h / BR.dmg)).join() === '4,3,2,2', 'a demolition still takes 4/3/2/2 charges (' + BR.dmg + ' each on a bridge)');
/* impacts on the deck's middle until it falls */
const hits = (c, dmg, r, ob) => { const S = g.sandbox('ww2'), b = $('brs()').find(q => q.c === c); let n = 0; while (S.os[b.id] < 2 && n < 200) { $('explode')(b.x, b.y + .5, b.z, r, dmg, null, 1, 1, ob); n++; } return n; };
const how = hits(0, 130, 36, OB.he.blast), how2 = hits(2, 130, 36, OB.he.blast), sc500 = hits(0, 300, 70, OB.bomb.blast), mk84 = hits(0, 460, 85, OB.bomb.blast), hyd = hits(0, 95, 20, OB.rocket.blast), mega = hits(0, 1150, 135, OB.bomb.blast);
ok(how >= 12 && how <= 16 && how2 >= 6, 'a 15 cm howitzer takes ' + how + ' rounds on a main-road bridge (was 5), ' + how2 + ' on a track\'s');
ok(sc500 >= 5 && sc500 <= 7 && mk84 >= 3 && mk84 <= 5, 'a 500 kg bomb: ' + sc500 + ' on a main-road bridge (was 2); a Mk 84: ' + mk84 + ' (was 2)');
ok(hyd >= 15 && hyd <= 25, 'Hydra/S-8 rockets: ' + hyd + ' on a main-road bridge (was 7), a helicopter\'s pod still brings it down');
ok(mega === 2, 'a strategic bomber\'s 2000 lb bomb: ' + mega + ' of its stick of 8 (was 1)');
{ const S = g.sandbox('ww2'), b = $('brs()').find(q => q.c === 0); $('explode')(b.x, b.y + .5, b.z, 70, 300, null, 1, 1, OB.bomb.blast); $('explode')(b.x + 6, b.y + .5, b.z, 70, 300, null, 1, 1, OB.bomb.blast);
  ok(S.os[b.id] < 2 && S.oh[b.id] > 0, 'two 500 kg bombs that used to drop a main-road bridge now leave it standing (' + Math.round(S.oh[b.id]) + ' hp left)'); }
{ const S = g.sandbox('ww2'), b = $('brs()').find(q => q.c === 0), e = b.ends[0], m = $('addMan')('schutze', 0, e.x + 3, e.z); m.chg = 9;
  for (let k = 0; k < 3; k++) $('brPlant')(m, b); g.run($('BLD').charge.fuse + .2); const st3 = S.os[b.id];
  $('brPlant')(m, b); g.run($('BLD').charge.fuse + .2);
  ok(st3 < 2 && S.os[b.id] === 2, 'demolition charges: three leave a main-road bridge standing, the fourth brings it down, as before'); }
ok($('BLD').charge.dmg === 150, 'a charge against a base or a house is as before (' + $('BLD').charge.dmg + ')');
done();
