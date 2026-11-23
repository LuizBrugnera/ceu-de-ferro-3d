'use strict';
/* a round against the soldiers (cf-lag-3): stepShots asked safe(m, b) (is this soldier spared by this round: friendly fire's rule) of every
   soldier on the map before it looked whether he was within 30 m of the round, ~450 soldiers for each round near the ground, ~45 000 calls a
   step in a fight and ~5% of the AI's time with dist() under it. The 30 m now comes first. That changes nothing only while safe() is a pure
   question: it writes nothing, draws no random number and gives the same answer whenever it is asked. This checks that, over every case of
   its rule (another side, the shooter himself, his vehicle and crew, a friend within and beyond FF.arm, a burst, friendly fire off, online),
   with every object it is handed watched for writes, and that the soldiers' loop keeps the cheap test first, as do the drones' (droneShots:
   a round 40 m off a drone; droneTouch: a vehicle or a soldier out of the drone's reach). No battle is run: a second */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const src = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const grab = re => { const m = re.exec(src); return m ? m[0] : null; };
const fSafe = (() => { const a = src.indexOf('\nfunction safe(o, b) {'); return a < 0 ? null : src.slice(a + 1, src.indexOf('\n}\n', a) + 2); })();
const fDist = grab(/\nconst dist = \(a, b\) => \{[^\n]*/), fOn = grab(/\nconst ffOn = [^\n]*/);
ok(fSafe && fDist && fOn, 'safe, dist and ffOn found');

console.log('-- safe() only reads --');
{
  const writes = [], seen = new WeakMap();   // one proxy an object, so that safe()'s o === w and o.in === w see the same thing
  const watch = (o, name) => seen.get(o) || (seen.set(o, new Proxy(o, {
    set(t, k) { writes.push(name + '.' + String(k)); return true; }, defineProperty(t, k) { writes.push(name + '.' + String(k)); return true; },
    deleteProperty(t, k) { writes.push('delete ' + name + '.' + String(k)); return true; },
    get(t, k) { const v = t[k]; return v && typeof v === 'object' && !Object.isFrozen(v) ? watch(v, name + '.' + String(k)) : v; }
  })), seen.get(o));
  let draws = 0; const M = Object.create(Math); M.random = () => { draws++; return Math.random(); };
  const FF0 = { on: 1, k: 1, bl: 1, arm: 8 }, Net0 = { ff: 0 }, S0 = { net: 0 };
  const ctx = vm.createContext({ Math: M, FF: watch(FF0, 'FF'), Net: watch(Net0, 'Net'), S: watch(S0, 'S') });
  vm.runInContext(fDist + '\n' + fOn + '\n' + fSafe + '\n;globalThis.safe = safe;', ctx, { filename: 'safe.js' });
  const man = (team, x, z, extra) => Object.assign({ team, x, y: 10, z, man: 1 }, extra || {});
  const shooter = man(0, 0, 0), veh = { team: 0, x: 0, y: 11, z: 0, kind: 'tank' }, crew = man(0, 0, 0, { in: veh }), gunner = man(0, 1, 0);
  const round = (by, team, burst) => Object.assign({ team: team === undefined ? by.team : team, by, x: 5, y: 10, z: 5 }, burst ? {} : { vx: 900, vy: 0, vz: 0 });
  const cases = [
    ['another side', man(1, 3, 3), round(shooter), false],
    ['the shooter himself', shooter, round(shooter), true],
    ['his vehicle', veh, round(crew), true],
    ['the crew of the shooting vehicle', crew, round(veh), true],
    ['a friend within FF.arm', gunner, round(shooter), true],
    ['a friend beyond FF.arm', man(0, 20, 0), round(shooter), false],
    ['a friend under a burst', man(0, 3, 0), round(shooter, 0, true), false],
    ['no shooter', man(0, 30, 0), { team: 0, x: 0, y: 0, z: 0, vx: 1 }, true]
  ];
  const ask = () => cases.map(([n, o, b]) => ctx.safe(watch(o, 'o'), watch(b, 'b')));
  const a1 = ask(), a2 = ask();
  cases.forEach(([n, , , want], i) => ok(a1[i] === want, n + ': ' + (want ? 'spared' : 'struck')));
  ok(a1.join() === a2.join(), 'the same answers asked again');
  FF0.on = 0; const off = ask(); FF0.on = 1;
  ok(off.every((v, i) => v === (cases[i][1].team === cases[i][2].team)), 'friendly fire off: every friend spared, every enemy struck');
  S0.net = 1; const net = ask(); Net0.ff = 1; const netFF = ask(); S0.net = 0; Net0.ff = 0;
  ok(net.every((v, i) => v === (cases[i][1].team === cases[i][2].team)) && netFF.join() === a1.join(), 'online: as the host says (Net.ff)');
  FF0.bl = 0; const bl = ask(); FF0.bl = 1;
  ok(bl[6] === true && bl[5] === false, 'FF.bl 0: a burst spares friends, a round does not');
  ok(!writes.length, 'nothing written by safe() or what it calls (' + (writes.slice(0, 4).join(', ') || 'none') + ')');
  ok(draws === 0, 'no random number drawn');
}

console.log('-- the soldiers\' loop: the distance first --');
{
  const a = src.indexOf('\nfunction stepShots(dt) {'), body = src.slice(a, src.indexOf('\n}\n', a));
  const line = (body.match(/[^\n]*rx \* rx \+ rz \* rz > 900[^\n]*/) || [''])[0];
  ok(/if \(m\.dead \|\| rx \* rx \+ rz \* rz > 900 \|\| safe\(m, b\)\) continue;/.test(line), 'a soldier beyond 30 m of the round is passed over before safe() is asked');
  ok((body.match(/safe\(m, b\)/g) || []).length >= 1 && !/safe\(m, b\) \|\| rx \* rx/.test(body), 'not the other way round any more');
}

console.log('-- the drones: the box first, safe() last --');
{
  const fn = n => { const a = src.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : src.slice(a, src.indexOf('\n}\n', a)); };
  const shots = fn('droneShots'), touch = fn('droneTouch');
  ok(/Math\.abs\(rx\) > 40 \|\| Math\.abs\(ry\) > 40 \|\| Math\.abs\(rz\) > 40 \|\| o\.dead \|\| o\.gone \|\| safe\(o, b\)\) continue;/.test(shots), 'droneShots: a round 40 m off a drone is passed over before safe() is asked');
  ok(/Math\.abs\(u\.z - o\.z\) > 9 \|\| o\.y > u\.y \+ u\.def\.env\[4\] \* 2 \+ 1\.2 \|\| safe\(u, db\)\) continue;/.test(touch), 'droneTouch: a vehicle out of reach before safe()');
  ok(/o\.y > m\.y - 1 && !safe\(m, db\)\) return m;/.test(touch), 'droneTouch: a soldier out of reach before safe()');
}
done();
