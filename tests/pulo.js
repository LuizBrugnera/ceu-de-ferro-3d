'use strict';
/* cf-movimento: the pace and the jump on foot. The run is MAN.run (9 m/s) and the walk MAN.walk (4) for the player and the AI alike; the
   jump (ctl.jump, Space in walk) lifts a standing soldier MAN.jump m and brings him back to the ground he left, takes no second jump in
   the air, none crouched or in a vehicle, and a remote player's comes from his mstate (f bit 2, p[1] his height): the ghost rises too.
   node tests/pulo.js */
const { load, ok, done } = require('./harness.js');
const C = load({ seed: 4 }), $ = C.$, MAN = $('MAN'), MOVE = $('MOVE'), INF = $('INF');
ok(MAN.walk === 4 && MAN.run === 9 && MAN.jump === 1.4, 'the pace: walk ' + MAN.walk + ', run ' + MAN.run + ' m/s; the jump ' + MAN.jump + ' m');
const S = C.sandbox('modern');
let at = null;   // level open ground
for (let x = 3000; x < 9000 && !at; x += 150) for (let z = -1500; z < 1500 && !at; z += 150) {
  let flat = true; for (let k = 0; k <= 160; k += 10) if (Math.abs(C.hgt(x + k, z) - C.hgt(x, z)) > 4 || C.hgt(x + k, z) <= S.T.WL + 1) flat = false;
  if (flat && !C.near(x + 80, z, 90).length && !$('bldAt')(x, z, 30)) at = { x, z };
}
const m = C.addMan(INF.modern[0][0], 0, at.x, at.z, 0); m.ai = null; m.inv = 1e9;
const still = () => { m.ctl.mx = m.ctl.mz = 0; m.ctl.run = false; m.ctl.aim = { x: 1, y: 0, z: 0 }; };
still(); C.run(1, still, 1 / 60);
const gy = m.y;
/* standing still: up and down */
m.ctl.jump = 1; let top = 0, air = 0, again = false;
for (let i = 0; i < 2 * 60; i++) {
  still(); if (i === 10) { m.ctl.jump = 1; again = true; }
  C.step(1 / 60); top = Math.max(top, m.y - gy); if (m.jh > 0) air++;
}
const tAir = air / 60, tWant = 2 * Math.sqrt(2 * MAN.jump / MOVE.g);
ok(Math.abs(top - MAN.jump) < .02, 'a standing jump rises ' + top.toFixed(2) + ' m (MAN.jump ' + MAN.jump + ')');
ok(again && Math.abs(tAir - tWant) < .05, 'one jump: a second Space in the air does nothing (' + tAir.toFixed(2) + ' s in the air, one jump is ' + tWant.toFixed(2) + ' s)');
ok(Math.abs(m.y - gy) < 1e-6 && !m.jh && !m.jA, 'back on the ground he left (' + (m.y - gy).toExponential(1) + ' m)');
/* running: the jump goes along, the run keeps its speed */
let x0 = m.x; m.ctl.jump = 1; let tp = 0;
for (let i = 0; i < 60; i++) { m.ctl.run = true; m.ctl.mx = 1; m.ctl.mz = 0; m.ctl.aim = { x: 1, y: 0, z: 0 }; C.step(1 / 60); tp = Math.max(tp, m.jh || 0); }
const v = m.x - x0;
ok(tp > MAN.jump * .9 && v > MAN.run * .9 && v < MAN.run * 1.05, 'a running jump: ' + tp.toFixed(2) + ' m up, ' + v.toFixed(2) + ' m in 1 s (MAN.run ' + MAN.run + ')');
still(); C.run(1, still, 1 / 60);
/* crouched: no jump */
m.ctl.st = 1; C.run(1, still, 1 / 60);
m.ctl.jump = 1; let cj = 0; for (let i = 0; i < 30; i++) { still(); C.step(1 / 60); cj = Math.max(cj, m.jh || 0); }
ok(m.st === 1 && cj === 0 && !m.ctl.jump, 'crouched he does not jump, and the press is not kept for later');
m.ctl.st = 0; C.run(1, still, 1 / 60);
/* an AI soldier never jumps */
const a = C.addMan(INF.modern[0][0], 0, at.x + 30, at.z + 20, 0); a.inv = 1e9;
let aj = 0; C.run(10, () => { aj = Math.max(aj, a.jh || 0); }, 1 / 20);
ok(aj === 0, 'an AI soldier never jumps (10 s)');
/* the ghost of a remote player: his mstate's flag and height lift it, the ground takes it back */
const Net = $('Net'), pid = 'pulo-test';
S.net = true; Net.players.set(pid, { id: pid, cls: 'inf', model: INF.modern[0][0], name: 'Remoto' });
const gx = at.x + 60, gz = at.z - 20, g0 = $('manY')(gx, gz), msg = (h, air) => ({ t: 'mstate', from: pid, p: [gx, g0 + h, gz], a: [0, 0], v: [0, 0], s: 0, hp: 22, f: air ? 2 : 0 });
Net.rx.mstate(msg(0, false)); const g = Net.ghosts.get(pid);
ok(!!g && g.net && g.man, 'the remote soldier has a ghost');
C.run(.5, null, 1 / 60);
Net.rx.mstate(msg(1.2, true)); C.run(.4, null, 1 / 60);
const up = g.y - $('manY')(g.x, g.z);
Net.rx.mstate(msg(0, false)); C.run(.6, null, 1 / 60);
const down = g.y - $('manY')(g.x, g.z);
ok(Math.abs(up - 1.2) < .1 && Math.abs(down) < .02, 'the ghost rises with his jump (' + up.toFixed(2) + ' m for 1.2) and comes down (' + down.toFixed(3) + ' m)');
Net.rx.mstate(msg(30, false)); C.run(.2, null, 1 / 60);
ok(!g.jh, 'a height without the jump flag (a fall, a tower) is not taken for a jump');
done();
