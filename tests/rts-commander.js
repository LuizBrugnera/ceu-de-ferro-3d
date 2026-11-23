'use strict';
/* the commander's camera (RTS, cf-rts-fix), the bugs a real-input test of the mode found (cf-rts-teste), each run here on stubs with the page's
   own code (the view part, after the 3D scene marker, which the harness does not load):
   1 the hangar's RTS or General button left the mouse locked to the soldier: launch() asked for the lock, genOpen let go of nothing because the
     lock had not landed yet, and it landed with the view open (clicks fired the soldier's weapon). lockPtr now refuses while the view or an
     entry into it is on, and a lock that lands under the view is let go;
   2 the commander's own death opened the "Próximo veículo" picker, which closed the view for good;
   3 the fog hid the enemy's units but drew its supply bases, sites and works;
   6 a click on a squad's marker could select the neighbouring squad (any man within 16 px beat the marker, tested where it is not drawn);
   7 a double click selected squads under the panels;
   8 the key hint ran off the bar at 1280 px */
const fs = require('fs'), vm = require('vm'), { PAGE, ok, done } = require('./harness');
const html = fs.readFileSync(PAGE, 'utf8');
const body = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
const stmt = (head, end) => { const i = html.indexOf(head); return i < 0 ? '' : html.slice(i, html.indexOf(end || '\n', i) + (end || '\n').length); };

/* 1: lockPtr asks for the lock only with no view, no battle map and no entry into the view on its way */
{
  const src = body('lockPtr'); ok(!!src, 'lockPtr is in the page');
  const run = (o) => {
    let n = 0; const ctx = vm.createContext(Object.assign({ S: { aim: {} }, document: { pointerLockElement: null }, cv: { requestPointerLock() { n++; } }, GV: { on: false }, BM: { on: false }, GOR: { want: '' }, RTS: { want: 0 } }, o));
    vm.runInContext(src, ctx); ctx.lockPtr(); return n;
  };
  ok(run({}) === 1, 'a soldier in play gets the lock');
  ok(run({ GV: { on: true } }) === 0, 'not under the general\'s view');
  ok(run({ BM: { on: true } }) === 0, 'not under the battle map');
  ok(run({ GOR: { want: 'inf' } }) === 0, 'not while the hangar\'s General is joining (launch runs inside the welcome)');
  ok(run({ RTS: { want: 1 } }) === 0, 'not while the hangar\'s RTS is joining');
  const w = stmt('Net.ui.welcome = (f => () => {\n  const kit = GOR.want;', '})(Net.ui.welcome);');
  ok(/try \{ f\(\); \} finally \{[^}]*GOR\.want = '';/.test(w) && !/if \(!kit\) return f\(\);\n  GOR\.want = '';/.test(w), 'the welcome clears GOR.want only after launch has run');
  /* the pointerlockchange guard: a lock that lands under the view goes back */
  const pl = stmt("document.addEventListener('pointerlockchange', () => {\n", '\n});\n');
  ok(!!pl, 'the pointerlockchange handler is in the page');
  if (pl) {
  let h = null, out = 0, paused = 0; const cv = {}, D = { pointerLockElement: cv, addEventListener: (k, f) => { if (k === 'pointerlockchange') h = f; }, exitPointerLock() { out++; } };
  const ctx = vm.createContext({ document: D, cv, GV: { on: true }, BM: { on: false }, S: { aim: {}, input: { fire: true } }, sw: { on: false }, playMode: 'play', setPause() { paused++; } });
  vm.runInContext(pl, ctx); h();
  ok(out === 1 && !ctx.S.input.fire && !paused, 'a lock that lands with the view open is let go, the trigger cleared, the game not paused');
  ctx.GV.on = false; out = 0; h();
  ok(out === 0, 'with the view closed the soldier keeps his lock');
  }
  ok(/cv\.addEventListener\('mousedown', e => \{\n  if \([^\n]*GV\.on\) return;/.test(html), 'the canvas\' mousedown is not the trigger under the view');
}

/* 2: a death under the view does not open the picker (nor close the view); with the view closed it does */
{
  const src = body('tickSwap'); ok(!!src, 'tickSwap is in the page');
  const run = gv => {
    let n = 0; const P = { dead: true };
    const ctx = vm.createContext({ S: { my: P, over: false, respawn: 3, net: null }, sw: { on: false, of: null }, playMode: 'play', GV: { on: gv }, Net: { can: true }, openSwap() { n++; } });
    vm.runInContext(src, ctx); ctx.tickSwap(); return n;
  };
  ok(run(true) === 0, 'dead under the general\'s view: no picker, the view stays');
  ok(run(false) === 1, 'dead in the 3D view: the picker opens as before');
}

/* 3: the works under the fog */
{
  const hb = stmt('const rtsHidB = '), rf = stmt('const rtsForts = ', '\n};\n');
  ok(!!hb && !!rf, 'rtsHidB and rtsForts are in the page');
  if (hb && rf) {
  const S = { forts: [{ team: 0 }, { team: 1, pre: true }, { team: 1 }, { team: 2 }], N: 3 };
  const ctx = vm.createContext({ S, RTS: { side: 0 }, isSide: t => Number.isInteger(t) && t >= 0 && t < 3, spotted: b => !!b.seen });
  vm.runInContext(hb + rf + 'globalThis.hidB = rtsHidB; globalThis.F = rtsForts;', ctx);
  let saw = null; const f = ctx.F(() => { saw = S.forts.slice(); return 7; });
  ok(f() === 7 && saw.length === 2 && saw.includes(S.forts[0]) && saw.includes(S.forts[1]), 'under the fog: the own works and what was dug before the match');
  ok(S.forts.length === 4, 'S.forts is given back');
  ctx.RTS.side = -1; f(); ok(saw.length === 4, 'no fog (Ver tudo, the map table): every work');
  ctx.RTS.side = 0;
  ok(ctx.hidB({ team: 1 }) && !ctx.hidB({ team: 1, seen: 1 }) && !ctx.hidB({ team: 0 }), 'an enemy supply base or site: only while spotted');
  }
  ok(/syncScene = \(g => dt => \{ g\(dt\); rtsFogB\(S\.sup\); if \(S\.eco\) rtsFogB\(S\.eco\.l\); \}\)\(syncScene\);/.test(html), 'the scene runs the supply bases and the sites through it');
  ok(/fortBoxes = rtsForts\(fortBoxes\); holeScene = rtsForts\(holeScene\);/.test(html), 'the works\' boxes and the trenches\' holes go through it');
}

/* 6: a click on a squad's glyph is that squad, even with another squad's men round it */
{
  const src = body('rtsMark') + body('rtsPick'); ok(src.length > 200, 'rtsMark and rtsPick are in the page');
  /* a flat projection: x 10 px a metre, z 10 px a metre down the screen, a metre up 4 px up; the camera 500 m off (k = 1.04) */
  const xy = (x, y, z) => ({ x: x * 10, y: z * 10 - y * 4, front: true });
  const men = (x, z, n) => Array.from({ length: n }, (_, i) => ({ x: x + i * .5, y: 0, z, dead: false, in: false }));
  const A = { id: 1, men: men(50, 50, 6) }, B = { id: 2, men: men(80, 40, 6) };
  B.men.forEach(m => { m.x = 50 + (m.x - 80) * .2; m.z = 50 - 6.3; });   // B's men stand right under A's glyph, its leader with them
  B.men[0].x = 80; B.men[0].z = 40;   // B's leader (its marker) out on its own
  const ctx = vm.createContext({ GV: { V: { t: 0 } }, GOR: { sel: new Set() }, rtsXY: xy, rtsGY: () => 0, rtsK: () => 1.04, rtsCd: () => 500, rtsSqs: () => new Map([[1, A], [2, B]]), rtsLid: q => q.men[0], gorSq: () => [{ id: 1, x: 50, z: 50 }, { id: 2, x: 80, z: 40 }], Math });
  vm.runInContext(src, ctx);
  if (ctx.rtsMark) {
  const gA = ctx.rtsMark({ id: 1, x: 50, z: 50 }, A), gB = ctx.rtsMark({ id: 2, x: 80, z: 40 }, B);
  ok(Math.abs(gA.gy - (500 - 24 - 10.4)) < 1e-6, 'the glyph sits where rtsDraw draws it (6 m over the leader, 10 px × scale higher)');
  const pA = ctx.rtsPick(gA.s.x, gA.gy), pB = ctx.rtsPick(gB.s.x, gB.gy);
  ok(pA && pA.id === 1, 'a click on A\'s glyph is A, with B\'s men round it (it was B)');
  ok(pB && pB.id === 2, 'a click on B\'s glyph is B');
  }
  ok(/const q = Q\.get\(e\.id\), M = rtsMark\(e, q\)/.test(body('rtsDraw')), 'rtsDraw places the marker through rtsMark too');
}

/* 7 and 8 */
ok(/GOR\.sel\.add\(o\.id\)/.test(stmt('gorDbl = (g => e => {\n  if (!rtsOn()) return g(e);', '})(gorDbl);')) && /rtsFree\(q\.x, q\.y\)/.test(stmt('gorDbl = (g => e => {\n  if (!rtsOn()) return g(e);', '})(gorDbl);')), 'the double click takes only squads in the open (rtsFree)');
{
  const w = stmt('gorBar = (g => () => {\n  g();\n  if (!rtsOn()) return;', '})(gorBar);'), m = w.match(/kt = seat \? '((?:[^'\\]|\\.)*)'\n\s*: '((?:[^'\\]|\\.)*)'/);
  ok(!!m, 'the hint\'s two lines are in gorBar');
  /* 11.5 px of the data font, 6.3 px a character (measured: 255 characters were 1604 px), 20 px of padding; the bar is 1280 - 32 px */
  if (m) for (const t of [m[1], m[2]]) ok(t.length * 6.3 + 20 <= 1248, 'the hint fits one line at 1280 px (' + t.length + ' characters)');
}
done();
