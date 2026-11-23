'use strict';
/* cf-infantaria-alcance: the AI infantry opens fire from farther off. A soldier's eyes reach 900 m (VIEW.man, was 650), a rifle opens up
   inside 450 m and a machine gun inside 750 (IAI.fire, IAI.lmg: were 380 and 550), a sniper inside 1000 (SNIPE.ai.rng: was 550), and the
   aim scatters more with range (IAI.spR, SNIPE.ai.spR), so far fire pins more than it kills. The weapons' damage and the player's are not
   touched. node tests/infantaria-alcance.js */
const H = require('./harness'), { ok, done } = H, C = H.load({ seed: 21 }), $ = C.$;
const VIEW = $('VIEW'), IAI = $('IAI'), SNIPE = $('SNIPE'), SARMS = $('SARMS');
console.log('-- the tables --');
ok(VIEW.man[0][0] >= 900 && VIEW.snp[0][0] === VIEW.man[0][0] && VIEW.atg[0][0] === VIEW.man[0][0], 'a soldier\'s eyes reach ' + VIEW.man[0][0] + ' m on the ground (was 650)');
ok(IAI.fire >= 450 && IAI.lmg >= 750 && IAI.see >= IAI.lmg && SNIPE.ai.rng >= 1000, 'rifle ' + IAI.fire + ' m, machine gun ' + IAI.lmg + ' m, looked for within ' + IAI.see + ' m, sniper ' + SNIPE.ai.rng + ' m (were 380, 550, 650, 550)');
const dmg = { k98: 13, garand: 12, m4: 7, ak: 7.5, mg42: 9, bar: 11, m249: 7, pkp: 9.5, rpg: 140, bazooka: 88, pzf: 105, k98s: 26, m1903: 26, m82: 34, osv96: 34 };
ok(Object.keys(dmg).every(k => SARMS[k].dmg === dmg[k]) && SARMS.rpg.rng === 250 && SARMS.bazooka.rng === 120 && SARMS.pzf.rng === 70, 'damage and the rockets\' ranges (the player\'s sight reads them) as they were');

/* an open stretch of road: no woods nor building on the line, both ends in sight of each other */
function spot(S, D) {
  const kindAt = $('kindAt'), los = $('los'), near = $('near');
  for (const r of S.T.routes) for (let s = 300; s < r.len - 300; s += 40) {
    const p = $('routeAt')(r, s), x = p.x, z = p.z;
    if (x + D > S.W - 60) continue;
    let bad = 0;
    for (let f = 0; f <= 1; f += .1) { const qx = x + D * f; if (kindAt(qx, z) === 1 || near(qx, z, 40).some(o => o.B)) bad++; }
    if (bad) continue;
    if ([-20, 0, 20].every(dz => los({ x, z: z + dz }, C.hgt(x, z + dz) + 1.2, { x: x + D, z: z + dz }, C.hgt(x + D, z + dz) + 1.2))) return { x, z, ri: S.T.routes.indexOf(r), s };
  }
  return null;
}
console.log('-- seeing --');
{
  C.seed(7); const S = C.sandbox('modern'), B = S.base[0];
  const man = (team, x) => { const m = C.addMan(team ? 'redRifle' : 'blueRifle', team, B.x + x, B.z, 0); m.ai = $('manBrain')(0); m.ai.gx = m.x; m.ai.gz = m.z; return m; };
  const a = man(1, 0), t = man(0, 350); t.ai = null; t.st = 1; a.f = { x: 1, y: 0, z: 0 };
  let T = Infinity; const t0 = S.t;
  for (; S.t - t0 < 30;) { S.t += .25; if ($('grade')(a, t) >= 2) { T = S.t - t0; break; } }
  ok(T < 8, 'a still soldier crouched 350 m ahead in the open is made out in ' + (Number.isFinite(T) ? T.toFixed(1) + ' s' : 'never') + ' (11 s with eyes of 650 m)');
}
console.log('-- two squads holding 600 m apart in the open --');
{
  C.seed(621); const S = C.sandbox('modern'), D = 600, p = spot(S, D);
  if (ok(!!p, 'an open stretch of ' + D + ' m')) {
    const a = C.addSquad(0, p.x, p.z, p.ri, p.s), b = C.addSquad(1, p.x + D, p.z, p.ri, p.s);
    for (const [q, x] of [[a, p.x], [b, p.x + D]]) C.setOrd(q, { k: 'hold', ri: p.ri, s: p.s, x, z: p.z, R: 8 });
    const t0 = S.t, first = [null, null], last = new Map();
    C.run(40, () => {
      for (const m of a.men.concat(b.men)) if (!m.dead && m.shotT !== undefined && m.shotT !== last.get(m)) { last.set(m, m.shotT); if (m.shotT > t0 && first[m.team] === null) first[m.team] = S.t - t0; }
      return first[0] === null || first[1] === null;
    }, 1 / 30);
    ok(first[0] !== null && first[1] !== null && Math.max(first[0], first[1]) < 25, 'both open fire at ' + D + ' m: after ' + first.map(v => v === null ? 'never' : v.toFixed(1) + ' s').join(' and ') + ' (with the old reach neither did in 60 s)');
  }
}
console.log('-- far fire scatters --');
{
  const spread = r => {
    C.seed(5); const S = C.sandbox('modern'), B = S.base[0];
    const a = C.addMan('blueRifle', 0, B.x, B.z, 0), t = C.addMan('redRifle', 1, B.x + r, B.z, 0); a.ai = $('manBrain')(0); a.ai.gx = a.x; a.ai.gz = a.z; t.ai = null; t.inv = 1e9; a.f = { x: 1, y: 0, z: 0 };
    let sp = 0; C.run(12, () => { if (a.ai.tgt === t && a.ctl.aim) sp = a.ctl.sp; }, 1 / 30);
    return sp;
  };
  const n = spread(150), f = spread(450);
  ok(n > 0 && f - n > IAI.spR[1] * 2.5, 'the AI rifleman\'s aim error at 150 m ' + n.toFixed(4) + ' rad, at 450 m ' + f.toFixed(4) + ' rad');
}
console.log('-- the sniper --');
{
  C.seed(9); const S = C.sandbox('modern'), D = 850, p = spot(S, D);
  if (ok(!!p, 'an open stretch of ' + D + ' m')) {
    const s = C.addMan('blueSniper', 0, p.x, p.z, 0), t = C.addMan('redRifle', 1, p.x + D, p.z, 0);
    s.ai = $('manBrain')(0); s.ai.gx = s.x; s.ai.gz = s.z; s.f = { x: 1, y: 0, z: 0 }; t.ai = null; t.inv = 1e9; t.hp = t.max = 1e9;
    const t0 = S.t; let fired = null, sp = 0;
    C.run(60, () => { if (s.ai.tgt === t) sp = Math.max(sp, s.ctl.sp); if (s.arms[0].t > t0) { fired = S.t - t0; return false; } }, 1 / 30);
    ok(fired !== null, 'a sniper takes a rifleman standing ' + D + ' m off: first shot after ' + (fired === null ? 'never' : fired.toFixed(1) + ' s') + ' (his reach was 550 m)');
    ok(sp > SNIPE.ai.sp, 'and his aim scatters more out there: ' + sp.toFixed(4) + ' rad against ' + SNIPE.ai.sp + ' near');
  }
}
done();
